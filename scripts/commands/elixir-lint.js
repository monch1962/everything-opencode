#!/usr/bin/env node
/**
 * /elixir-lint command wrapper
 *
 * Lint Elixir code with Credo and Elixir-specific improvements
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--strict' || arg === '-s') {
      options.strict = true;
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--all-priorities') {
      options.allPriorities = true;
    } else if (arg === '--format') {
      options.format = args[++i];
    } else if (arg === '--config') {
      options.config = args[++i];
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

    // Lint code
    console.log('🔍 Linting Elixir code...');
    const result = await runner.lint(options);

    if (result.success) {
      console.log('\n✅ Code linting passed!');
    } else {
      console.log(`\n⚠️  Linting issues found (code: ${result.code})`);
      if (result.stdout) {
        console.log(result.stdout);
      }
      if (result.stderr) {
        console.log(result.stderr);
      }
      process.exit(result.code || 1);
    }
  } catch (error) {
    console.error(`\n❌ Linting failed: ${error.message}`);

    // Check if Credo is not installed
    if (error.message.includes('Credo')) {
      console.log('\n💡 Credo is not installed. Install it with:');
      console.log('   mix archive.install hex credo --force');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔍 Elixir Lint

Usage: /elixir-lint [options] [files...]

Lint Elixir code with Credo and Elixir-specific improvements.

Options:
  --strict, -s           Enable strict mode (all checks)
  --all, -a              Show all issues (including low priority)
  --all-priorities       Show issues of all priorities
  --format FORMAT        Output format: oneline, flycheck, json, etc.
  --config FILE          Use custom Credo config file
  --files FILES          Comma-separated list of files to check
  --verbose, -v          Verbose output
  --help, -h             Show this help message

Examples:
  /elixir-lint                          # Lint all files
  /elixir-lint --strict                 # Strict linting
  /elixir-lint lib/my_module.ex         # Lint specific file
  /elixir-lint --format json            # JSON output format
  /elixir-lint --config .credo.exs      # Custom config

Elixir-specific features:
  • Credo integration with 60+ checks
  • Custom configuration via .credo.exs
  • Priority-based issue filtering
  • Multiple output formats
  • Automatic config detection
  • File and directory filtering

Credo check categories:
  • Consistency: Code style consistency
  • Readability: Code readability issues
  • Refactoring: Code refactoring opportunities
  • Design: Software design issues
  • Warning: Potential problems
  • Convention: Coding conventions

Common issues addressed:
  • Function length and complexity
  • Naming conventions
  • Code duplication
  • Unused variables and functions
  • Complex conditionals
  • Missing documentation
  • Inconsistent formatting

Configuration:
  • .credo.exs in project root
  • Profile-based configuration
  • Check-specific configuration
  • File and directory exclusions
  • Custom checks and plugins

Integration:
  • Editor integration via flycheck format
  • CI/CD integration with exit codes
  • Custom check development
  • Team-wide consistency

Tips:
  • Start with --strict to see all issues
  • Use .credo.exs to customize checks
  • Fix high priority issues first
  • Use --format json for machine-readable output
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
