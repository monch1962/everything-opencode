#!/usr/bin/env node
/**
 * Elixir Clean Command
 *
 * Clean Elixir build artifacts and cache
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--deps' || arg === '-d') {
        options.deps = true;
      } else if (arg === '--build' || arg === '-b') {
        options.build = true;
      } else if (arg === '--all' || arg === '-a') {
        options.all = true;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--dry-run' || arg === '-n') {
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

    const runner = new ElixirCommandRunner(process.cwd());

    console.log('🧹 Cleaning Elixir project...\n');

    const result = await runner.clean(options);

    if (result.success) {
      console.log('\n✅ Clean completed successfully!');

      // Show what was cleaned
      if (options.verbose) {
        console.log('\n📋 Clean Summary:');
        if (options.deps || options.all) {
          console.log('  • Dependencies cache cleaned');
        }
        if (options.build || options.all) {
          console.log('  • Build artifacts cleaned');
          console.log('  • Compiled BEAM files removed');
          console.log('  • Mix compile cache cleared');
        }
        if (!options.deps && !options.build && !options.all) {
          console.log('  • Standard clean performed');
          console.log('  • _build directory cleaned');
          console.log('  • Mix artifacts removed');
        }
      }
    } else {
      console.log('\n❌ Clean failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Clean failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧹 Elixir Clean Command

Usage: /elixir-clean [options]

Clean Elixir build artifacts and cache with project-specific improvements.

Options:
  --deps, -d               Clean dependencies cache
  --build, -b              Clean build artifacts
  --all, -a                Clean everything (dependencies + build)
  --verbose, -v            Verbose output
  --dry-run, -n            Show what would be cleaned without actually cleaning
  --help, -h               Show this help message

Cleaning Targets:
  1. Build Artifacts (--build):
     • _build/ directory
     • Compiled BEAM files (*.beam)
     • Mix compile cache
     • Dialyzer PLT files
     • Coverage reports
     • Documentation files

  2. Dependencies Cache (--deps):
     • deps/ directory
     • Hex package cache
     • Rebar3 build cache
     • Mix lock file artifacts
     • Dependency build artifacts

  3. Everything (--all):
     • All of the above
     • Additional temporary files
     • Log files
     • Test artifacts

Features:
  • Project-aware cleaning
  • Selective cleaning options
  • Dry-run mode
  • Verbose output
  • Safe cleaning (preserves source code)
  • Cache management
  • Disk space recovery
  • Build consistency

Examples:
  /elixir-clean                    # Standard clean (build artifacts)
  /elixir-clean --build            # Clean build artifacts
  /elixir-clean --deps             # Clean dependencies cache
  /elixir-clean --all              # Clean everything
  /elixir-clean --verbose          # Verbose cleaning output
  /elixir-clean --dry-run          # Show what would be cleaned
  /elixir-clean --build --verbose  # Clean build artifacts with verbose output

When to Clean:
  • After changing Elixir/Erlang versions
  • When experiencing strange compilation errors
  • Before sharing project with others
  • When disk space is low
  • After major dependency updates
  • Before creating a release
  • When switching between environments

Notes:
  • Source code is never deleted
  • Configuration files are preserved
  • Git files are never touched
  • Cleaning is reversible (except for some cache files)
  • Large projects may take time to clean
  • Dependencies will be re-fetched if cleaned
  • Build will be slower after cleaning dependencies

Safety Features:
  • Confirmation for destructive operations
  • Backup of important files
  • Validation of cleaning targets
  • Progress indicators
  • Error recovery
  • Logging of cleaned files

Configuration:
  Cleaning behavior can be configured via /elixir-setup:
    • Default cleaning options
    • Files to preserve
    • Cache locations
    • Clean frequency
    • Backup settings
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
