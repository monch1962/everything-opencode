#!/usr/bin/env node
/**
 * /go-run command wrapper
 *
 * Run Go program with Go-specific improvements
 */

const GoCommandRunner = require('../golang/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const runArgs = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--watch' || arg === '-w') {
      options.watch = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--race') {
      options.race = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // All other arguments are passed to go run
      runArgs.push(arg);
    }
  }

  try {
    const runner = new GoCommandRunner();

    if (options.watch) {
      console.log('👀 Watch mode not yet implemented for Go');
      console.log('   Consider using air: go install github.com/cosmtrek/air@latest');
      console.log('   Or nodemon: npm install -g nodemon');
      process.exit(1);
    }

    // Add race detector if requested
    if (options.race) {
      runArgs.unshift('-race');
    }

    console.log('▶️  Running Go program...');
    await runner.run(runArgs, options);
    console.log('\n✅ Program execution completed');
  } catch (error) {
    console.error(`\n❌ Run failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/go-run - Run Go program with Go-specific improvements

Usage:
  /go-run [options] [package] [arguments...]

Options:
  --watch, -w        Watch for changes and restart (not yet implemented)
  --verbose, -v      Verbose output
  --race             Enable race detector
  --help, -h         Show this help

Examples:
  /go-run main.go                    # Run main.go
  /go-run ./cmd/server               # Run package in cmd/server
  /go-run --race main.go             # Run with race detector
  /go-run main.go arg1 arg2          # Run with arguments

Go-specific features:
  • Automatic dependency resolution
  • Race detector integration
  • Build caching
  • Module-aware execution
  `);
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;
