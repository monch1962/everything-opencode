#!/usr/bin/env node
/**
 * /elixir-format command wrapper
 *
 * Format Elixir code with built-in formatter and Elixir-specific improvements
 */

const ElixirCommandRunner = require('../elixir/elixir-command-runner-refactored');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--check' || arg === '-c') {
      options.check = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--files') {
      options.files = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a file or directory
      if (!options.files) {
        options.files = arg;
      } else {
        options.files += `,${arg}`;
      }
    }
  }

  try {
    const runner = new ElixirCommandRunner(process.cwd());
    await runner.initialize();

    // Format code
    console.log('🎨 Formatting Elixir code...');
    const result = await runner.format(options);

    if (result.success) {
      if (options.check) {
        console.log('\n✅ Code is properly formatted!');
      } else if (options.dryRun) {
        console.log('\n📋 Formatting preview completed.');
        if (result.stdout) {
          console.log(result.stdout);
        }
      } else {
        console.log('\n✅ Code formatting completed!');
      }
    } else {
      if (options.check) {
        console.log('\n⚠️  Code formatting issues found:');
        if (result.stdout) {
          console.log(result.stdout);
        }
      } else {
        console.log(`\n❌ Formatting failed with code ${result.code}`);
        if (result.stderr) {
          console.log(result.stderr);
        }
      }
      process.exit(result.code || 1);
    }
  } catch (error) {
    console.error(`\n❌ Formatting failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🎨 Elixir Format

Usage: /elixir-format [options] [files...]

Format Elixir code with built-in formatter and Elixir-specific improvements.

Options:
  --check, -c            Check if code is formatted (no changes)
  --dry-run              Show what would be formatted (no changes)
  --files FILES          Comma-separated list of files to format
  --verbose, -v          Verbose output
  --help, -h             Show this help message

Examples:
  /elixir-format                    # Format all files
  /elixir-format --check            # Check formatting without changes
  /elixir-format lib/my_module.ex   # Format specific file
  /elixir-format --dry-run          # Show formatting changes
  /elixir-format --files "lib/*.ex,test/*.exs" # Format specific files

Elixir-specific features:
  • Built-in formatter with zero dependencies
  • Configurable via .formatter.exs
  • Consistent code style across projects
  • Automatic import sorting
  • Line length configuration (default: 98)
  • File and directory patterns

Formatter configuration (.formatter.exs):
  • inputs: Files and directories to format
  • line_length: Maximum line length
  • plugins: Additional formatter plugins
  • import_deps: Dependencies to import from
  • export: Configuration to export
  • locals_without_parens: Functions without parentheses

Common patterns:
  • Format on save in editors
  • Pre-commit hooks for formatting
  • CI/CD formatting checks
  • Team-wide formatting consistency

Input patterns:
  • *.ex - Regular Elixir files
  • *.exs - Script files
  • mix.exs - Project configuration
  • config/*.exs - Configuration files
  • test/**/*.exs - Test files
  • lib/**/*.ex - Library files

Integration:
  • Editor integration via LSP
  • Git hooks for pre-commit formatting
  • CI/CD pipelines with formatting checks
  • Team style guides

Tips:
  • Use --check in CI to ensure formatting
  • Configure line_length based on team preference
  • Use .formatter.exs for project-specific settings
  • Format frequently to avoid large diffs

Configuration example (.formatter.exs):
  [
    import_deps: [:ecto, :phoenix],
    inputs: ["*.{ex,exs}", "{config,lib,test}/**/*.{ex,exs}"],
    line_length: 98,
    locals_without_parens: [
      # Ecto queries
      from: 2,
      join: 5,
      # Phoenix routes
      get: 3,
      post: 3,
      # Common patterns
      defmodule: 2,
      defprotocol: 2
    ]
  ]
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
