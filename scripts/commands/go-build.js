#!/usr/bin/env node
/**
 * /go-build command wrapper
 *
 * Build Go projects with Go-specific improvements
 */

const GoCommandRunner = require("../go/go-command-runner-refactored");

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--target') {
      options.target = args[++i];
    } else if (arg === '--race') {
      options.race = true;
    } else if (arg === '--tags') {
      options.tags = args[++i];
    } else if (arg === '--build-mode') {
      options.buildMode = args[++i];
    } else if (arg === '--ldflags') {
      options.ldflags = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--clean') {
      options.clean = true;
    } else if (arg === '--cross-compile') {
      options.crossCompile = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a package path
      options.package = arg;
    }
  }

  try {
    const runner = new GoCommandRunner(process.cwd());
    await runner.initialize();

    // Clean build artifacts if requested
    if (options.clean) {
      console.log('🧹 Cleaning build artifacts...');
      await runner.clean({ cache: true, testcache: true });
    }

    // Handle cross-compilation
    if (options.crossCompile) {
      await handleCrossCompilation(runner, options);
      return;
    }

    // Build the project
    console.log('🔨 Building Go project...');
    const result = await runner.build(options);

    if (result.success) {
      console.log('\n✅ Build successful!');

      // Show build summary
      if (options.output) {
        console.log(`   Output: ${options.output}`);
      }

      if (options.target) {
        console.log(`   Target: ${options.target}`);
      }

      if (options.race) {
        console.log('   Race detector: enabled');
      }
    } else {
      console.error('\n❌ Build failed');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Build failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle cross-compilation for multiple platforms
 */
async function handleCrossCompilation(runner, options) {
  console.log('🌍 Cross-compiling for multiple platforms...');

  const platforms = [
    { os: 'linux', arch: 'amd64' },
    { os: 'linux', arch: 'arm64' },
    { os: 'darwin', arch: 'amd64' },
    { os: 'darwin', arch: 'arm64' },
    { os: 'windows', arch: 'amd64' },
  ];

  const builds = [];

  for (const platform of platforms) {
    const target = `${platform.os}/${platform.arch}`;
    const output = options.output
      ? `${options.output}-${platform.os}-${platform.arch}${platform.os === 'windows' ? '.exe' : ''}`
      : undefined;

    console.log(`\n🔨 Building for ${target}...`);

    try {
      const result = await runner.build({
        ...options,
        target,
        output,
        env: {
          ...process.env,
          GOOS: platform.os,
          GOARCH: platform.arch,
          CGO_ENABLED: '0',
        },
      });

      if (result.success) {
        builds.push({ platform: target, success: true, output });
        console.log(`   ✅ Success`);
      } else {
        builds.push({
          platform: target,
          success: false,
          error: 'Build failed',
        });
        console.log(`   ❌ Failed`);
      }
    } catch (error) {
      builds.push({ platform: target, success: false, error: error.message });
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Show cross-compilation summary
  console.log('\n📊 Cross-compilation summary:');
  console.log('='.repeat(50));

  const successful = builds.filter((b) => b.success).length;
  const failed = builds.filter((b) => !b.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (successful > 0) {
    console.log('\n📁 Built binaries:');
    builds
      .filter((b) => b.success)
      .forEach((build) => {
        console.log(
          `   • ${build.platform}: ${build.output || 'default location'}`,
        );
      });
  }

  if (failed > 0) {
    console.log('\n⚠️ Failed builds:');
    builds
      .filter((b) => !b.success)
      .forEach((build) => {
        console.log(`   • ${build.platform}: ${build.error}`);
      });
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔨 Go Build Command

Usage: /go-build [options] [package]

Build Go projects with Go-specific improvements.

Options:
  --output, -o FILE      Output binary file name
  --target OS/ARCH       Build target (e.g., linux/amd64, darwin/arm64)
  --race                 Enable race detector
  --tags TAGS           Build tags (comma-separated)
  --build-mode MODE     Build mode (ex, pie, shared, etc.)
  --ldflags FLAGS       Linker flags
  --verbose, -v         Verbose output
  --clean               Clean build artifacts before building
  --cross-compile       Cross-compile for multiple platforms
  --help, -h            Show this help message

Go-specific features:
  • Smart output directory management (./bin/)
  • Automatic target detection based on environment
  • Race detector integration
  • Build information display
  • Cross-compilation support for multiple platforms
  • Build error suggestions and fixes
  • LDFLAGS support for version embedding

Examples:
  /go-build                     # Build current project
  /go-build --output myapp     # Build with specific output name
  /go-build --race             # Build with race detector
  /go-build --target linux/amd64 # Cross-compile for Linux
  /go-build --cross-compile    # Cross-compile for all platforms
  /go-build --clean            # Clean and build
  /go-build ./cmd/myapp        # Build specific package

Build information:
  • Shows Go version and module info
  • Displays build constraints and flags
  • Provides output path information
  • Suggests fixes for common build errors

Cross-compilation:
  Builds for: linux/amd64, linux/arm64, darwin/amd64, darwin/arm64, windows/amd64
  Sets CGO_ENABLED=0 for static binaries
  Creates platform-specific output files

Environment variables:
  GOOS, GOARCH     - Target operating system and architecture
  CGO_ENABLED      - CGO enable/disable (0 for static binaries)
  GO111MODULE      - Go modules mode (auto, on, off)
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
