#!/usr/bin/env node
/**
 * /python-test command wrapper
 * 
 * Run Python tests with configured test runner
 */

const PythonCommandRunner = require('./python-command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const extraArgs = [];
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--test' || arg === '-t') {
      options.test = args[++i];
    } else if (arg === '--coverage' || arg === '-c') {
      options.coverage = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--failed-first') {
      options.failedFirst = true;
    } else if (arg === '--last-failed') {
      options.lastFailed = true;
    } else if (arg === '--no-capture') {
      options.noCapture = true;
    } else if (arg === '--parallel') {
      options.parallel = true;
    } else if (arg === '--html') {
      options.html = true;
    } else if (arg === '--xml') {
      options.xml = true;
    } else if (arg === '--config') {
      options.config = args[++i];
    } else if (arg === '--setup') {
      options.setup = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      extraArgs.push(arg);
    }
  }
  
  // If extra args, treat as test pattern
  if (extraArgs.length > 0 && !options.test) {
    options.test = extraArgs.join(' ');
  }
  
  try {
    const runner = new PythonCommandRunner();
    await runner.runTests(options);
    console.log('\n✅ Tests completed successfully');
  } catch (error) {
    console.error(`\n❌ Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/python-test - Run Python tests with configured test runner

Usage:
  /python-test [options]

Options:
  --file, -f <path>      Run tests in specific file
  --test, -t <name>      Run specific test by name pattern
  --coverage, -c         Generate coverage report
  --verbose, -v          Verbose output
  --quiet, -q            Minimal output
  --all, -a              Run all tests (default)
  --failed-first         Run failed tests first
  --last-failed          Only run previously failed tests
  --no-capture           Don't capture output
  --parallel             Run tests in parallel
  --html                 Generate HTML coverage report
  --xml                  Generate XML test report
  --config <path>        Use alternative configuration
  --setup                Run test setup wizard
  --help, -h             Show this help

Examples:
  /python-test
  /python-test --file tests/test_auth.py
  /python-test --test "test_login*"
  /python-test --coverage --verbose
  /python-test --failed-first
  /python-test --parallel

Configuration:
  Reads from .opencode/project-config.json
  Uses testRunner: pytest or unittest
  `);
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;