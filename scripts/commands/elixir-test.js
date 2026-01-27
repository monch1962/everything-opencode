#!/usr/bin/env node
/**
 * /elixir-test command wrapper
 *
 * Run Elixir tests with ExUnit and Elixir-specific improvements
 */

const ElixirCommandRunner = require('../elixir/elixir-command-runner-refactored');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--directory' || arg === '-d') {
      options.directory = args[++i];
    } else if (arg === '--only') {
      options.only = args[++i];
    } else if (arg === '--exclude') {
      options.exclude = args[++i];
    } else if (arg === '--seed') {
      options.seed = args[++i];
    } else if (arg === '--coverage' || arg === '-c') {
      options.coverage = true;
    } else if (arg === '--trace' || arg === '-t') {
      options.trace = true;
    } else if (arg === '--max-failures') {
      options.maxFailures = args[++i];
    } else if (arg === '--timeout') {
      options.timeout = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--slowest') {
      options.slowest = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a test file or pattern
      options.file = arg;
    }
  }

  try {
    const runner = new ElixirCommandRunner(process.cwd());
    await runner.initialize();

    // Run tests
    console.log('🧪 Running Elixir tests...');
    const result = await runner.test(options);

    if (result.success) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ Tests failed with code ${result.code}`);
      if (result.stderr) {
        console.log(result.stderr);
      }
      process.exit(result.code || 1);
    }
  } catch (error) {
    console.error(`\n❌ Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧪 Elixir Test

Usage: /elixir-test [options] [test-file]

Run Elixir tests with ExUnit and Elixir-specific improvements.

Options:
  --file, -f FILE        Run specific test file
  --directory, -d DIR    Run tests in specific directory
  --only PATTERN         Run only tests matching pattern
  --exclude PATTERN      Exclude tests matching pattern
  --seed SEED            Set random seed for reproducible tests
  --coverage, -c         Generate test coverage report
  --trace, -t            Trace test execution
  --max-failures N       Stop after N failures
  --timeout MS           Set test timeout in milliseconds
  --verbose, -v          Verbose output
  --slowest N            Show N slowest tests
  --help, -h             Show this help message

Examples:
  /elixir-test                          # Run all tests
  /elixir-test --coverage               # Run tests with coverage
  /elixir-test test/my_test.exs         # Run specific test file
  /elixir-test --only "integration"     # Run only integration tests
  /elixir-test --max-failures 3         # Stop after 3 failures
  /elixir-test --slowest 10             # Show 10 slowest tests

Elixir-specific features:
  • ExUnit integration with all features
  • Test coverage with detailed reports
  • Parallel test execution
  • Test filtering and tagging
  • Random seed for reproducible tests
  • Slow test detection
  • Failure limiting

Test organization:
  • Unit tests in test/ directory
  • Integration tests with async: false
  • Property-based testing with StreamData
  • Test fixtures and setup/teardown
  • Custom assertions and helpers

Coverage reports:
  • HTML coverage report in cover/ directory
  • Line coverage percentage
  • Missing coverage highlighting
  • Coverage summary in console

Common patterns:
  • describe blocks for test organization
  • setup and setup_all callbacks
  • Custom tags for test categorization
  • Shared examples with ExUnit.CaseTemplate
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
