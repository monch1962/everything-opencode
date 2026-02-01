#!/usr/bin/env node
/**
 * /go-clean command wrapper
 *
 * Clean Go build artifacts and cache
 */

const GoCommandRunner = require('../golang/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--cache') {
      options.cache = true;
    } else if (arg === '--testcache') {
      options.testcache = true;
    } else if (arg === '--modcache') {
      options.modcache = true;
    } else if (arg === '--all') {
      options.cache = true;
      options.testcache = true;
      options.modcache = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    const runner = new GoCommandRunner(process.cwd());
    await runner.initialize();

    console.log('🧹 Cleaning Go artifacts...');
    const result = await runner.clean(options);

    if (result.success) {
      console.log('\n✅ Clean completed successfully!');

      // Show summary
      if (options.cache) {
        console.log('   • Build cache cleared');
      }
      if (options.testcache) {
        console.log('   • Test cache cleared');
      }
      if (options.modcache) {
        console.log('   • Module cache cleared');
      }
      console.log('   • Build artifacts removed');
    } else {
      console.error('\n❌ Clean failed');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Clean failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧹 Go Clean Command

Usage: /go-clean [options]

Clean Go build artifacts, cache, and temporary files.

Options:
  --cache               Clean build cache
  --testcache           Clean test cache
  --modcache            Clean module cache
  --all                 Clean all caches and artifacts
  --verbose, -v         Verbose output
  --dry-run             Show what would be cleaned without actually cleaning
  --help, -h            Show this help message

Go-specific features:
  • Comprehensive artifact cleanup
  • Cache management
  • Module cache cleaning
  • Test cache cleaning
  • Build artifact removal
  • Safe cleanup with dry-run mode

Examples:
  /go-clean                     # Clean build artifacts
  /go-clean --cache            # Clean build cache
  /go-clean --testcache        # Clean test cache
  /go-clean --modcache         # Clean module cache
  /go-clean --all              # Clean all caches and artifacts
  /go-clean --verbose          # Verbose cleanup output
  /go-clean --dry-run          # Show what would be cleaned

What gets cleaned:
  • bin/ directory
  • dist/ directory
  • coverage.out files
  • *.test binaries
  • *.exe binaries (Windows)
  • vendor/ directory (optional)
  • Build cache (go build cache)
  • Test cache (go test cache)
  • Module cache (go mod cache)

Cache locations:
  • Build cache: $GOCACHE (default: ~/.cache/go-build)
  • Test cache: $GOTESTCACHE (default: ~/.cache/go-test)
  • Module cache: $GOMODCACHE (default: ~/go/pkg/mod)

Common use cases:
  • Free up disk space
  • Fix build issues
  • Reset test state
  • Clear module cache for fresh downloads
  • Remove old build artifacts
  • Prepare for clean builds

Exit codes:
  0 - Success
  1 - Clean failed
  2 - Permission issues

Environment variables:
  GOCACHE              - Go build cache directory
  GOTESTCACHE          - Go test cache directory
  GOMODCACHE           - Go module cache directory
  GO111MODULE          - Go modules mode

Tips:
  • Use --dry-run first to see what will be cleaned
  • Use --all before major releases for clean builds
  • Clean module cache if you suspect corrupted downloads
  • Clean test cache if tests are behaving unexpectedly
  • Regular cleanup helps maintain disk space
  • Consider automating cleanup in CI/CD pipelines

Safety features:
  • Never deletes source code
  • Confirms before deleting large caches
  • Shows summary of what was cleaned
  • Supports dry-run mode for safety
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
