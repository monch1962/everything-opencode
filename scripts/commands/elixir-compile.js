#!/usr/bin/env node
/**
 * Elixir Compile Command
 *
 * Compile Elixir projects with project-specific improvements
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--force' || arg === '-f') {
        options.force = true;
      } else if (arg === '--warnings-as-errors') {
        options.warningsAsErrors = true;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--long-compilation') {
        options.longCompilation = true;
      } else if (arg === '--profile') {
        options.profile = true;
      } else if (arg === '--env') {
        options.env = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        process.exit(0);
      } else if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
      }
    }

    const runner = new ElixirCommandRunner(process.cwd());

    console.log('🔨 Compiling Elixir project...\n');

    const result = await runner.compile(options);

    if (result.success) {
      console.log('\n✅ Compilation successful!');
    } else {
      console.log('\n❌ Compilation failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Compilation failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔨 Elixir Compile Command

Usage: /elixir-compile [options]

Compile Elixir project with project-specific improvements.

Options:
  --force, -f               Force recompilation
  --warnings-as-errors      Treat warnings as errors
  --verbose, -v             Verbose output
  --long-compilation        Enable long compilation mode
  --profile                 Profile compilation
  --env ENVIRONMENT         Set Mix environment (dev, test, prod)
  --help, -h                Show this help message

Features:
  • Project-aware compilation
  • Intelligent dependency tracking
  • Parallel compilation when available
  • Warning management
  • Environment-specific compilation
  • Profile-guided optimization hints

Examples:
  /elixir-compile                    # Standard compilation
  /elixir-compile --force            # Force recompilation
  /elixir-compile --warnings-as-errors  # Treat warnings as errors
  /elixir-compile --env test         # Compile for test environment
  /elixir-compile --verbose          # Verbose compilation output

Notes:
  • Compilation uses Mix's built-in compilation system
  • Dependencies are automatically fetched if missing
  • Compilation artifacts are cached for faster builds
  • Environment-specific configurations are applied
  • Phoenix projects have additional compilation steps
`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
