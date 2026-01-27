#!/usr/bin/env node
/**
 * JavaScript/TypeScript Test Command
 *
 * Run tests for JavaScript/TypeScript projects
 */

const JSCommandRunner = require('../javascript/javascript-command-runner-refactored');

async function main() {
  try {
    const projectPath = process.cwd();
    const runner = new JSCommandRunner(projectPath);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};

    // Parse options
    const parsedArgs = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--watch' || arg === '-w') {
        options.watch = true;
      } else if (arg === '--coverage' || arg === '-c') {
        options.coverage = true;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run tests
    await runner.initialize();
    await runner.test(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /js-setup first to configure your project.');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 JavaScript/TypeScript Test Command

Usage: /js-test [options] [test-pattern]

Options:
  --watch, -w     Run tests in watch mode
  --coverage, -c  Generate test coverage report
  --verbose, -v   Show verbose test output
  --help, -h      Show this help message

Examples:
  /js-test                    # Run all tests
  /js-test --watch           # Run tests in watch mode
  /js-test --coverage        # Run tests with coverage
  /js-test Component.test.js # Run specific test file
  /js-test -w -v            # Watch mode with verbose output

Supported Test Frameworks:
  • Jest (default)
  • Mocha
  • Vitest
  • Other frameworks via npm scripts

Configuration:
  Run /js-setup first to configure your project.
  Add test scripts to package.json for custom configuration.
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
