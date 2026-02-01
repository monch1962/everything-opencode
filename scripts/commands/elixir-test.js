#!/usr/bin/env node
/**
 * Elixir Test Command
 *
 * Run Elixir tests with project-specific improvements
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};
    let testPattern = null;

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--cover') {
        options.cover = true;
      } else if (arg === '--trace') {
        options.trace = true;
      } else if (arg === '--max-failures') {
        options.maxFailures = parseInt(args[++i], 10);
      } else if (arg === '--seed') {
        options.seed = parseInt(args[++i], 10);
      } else if (arg === '--timeout') {
        options.timeout = parseInt(args[++i], 10);
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--env') {
        options.env = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        process.exit(0);
      } else if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
      } else {
        // Assume it's a test pattern
        testPattern = arg;
      }
    }

    const runner = new ElixirCommandRunner(process.cwd());

    console.log('🧪 Running Elixir tests...\n');

    const result = await runner.test(testPattern, options);

    if (result.success) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Tests failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧪 Elixir Test Command

Usage: /elixir-test [options] [test-pattern]

Run Elixir tests with project-specific improvements.

Options:
  --cover                    Generate test coverage report
  --trace                    Trace test execution
  --max-failures N           Stop after N failures
  --seed SEED                Random seed for test order
  --timeout TIMEOUT          Test timeout in milliseconds
  --verbose, -v              Verbose output
  --env ENVIRONMENT          Set Mix environment (dev, test, prod)
  --help, -h                 Show this help message

Test Patterns:
  • file_test.exs            # Run tests in specific file
  • MyModuleTest             # Run tests for specific module
  • test_my_function         # Run specific test function
  • path/to/tests/           # Run tests in directory

Features:
  • Project-aware test execution
  • Intelligent test filtering
  • Coverage reporting with excoveralls
  • Parallel test execution
  • Test isolation
  • Failure reporting with context
  • Seed management for reproducible tests
  • Timeout handling

Examples:
  /elixir-test                          # Run all tests
  /elixir-test --cover                  # Run tests with coverage
  /elixir-test --trace                  # Trace test execution
  /elixir-test MyModuleTest             # Run tests for specific module
  /elixir-test test/my_module_test.exs  # Run tests in specific file
  /elixir-test --max-failures 3         # Stop after 3 failures
  /elixir-test --seed 12345             # Use specific random seed
  /elixir-test --timeout 5000           # Set 5-second timeout per test

Notes:
  • Tests run in the test environment by default
  • Coverage reports are generated in cover/ directory
  • Test results are cached for faster subsequent runs
  • Phoenix projects include additional test helpers
  • Property-based testing with StreamData is supported
  • Browser testing with Wallaby/Hound is available for Phoenix
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
