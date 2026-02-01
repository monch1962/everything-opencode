#!/usr/bin/env node
/**
 * Elixir Run Command
 *
 * Run Elixir applications with project-specific improvements
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};
    const appArgs = [];

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--no-compile') {
        options.compile = false;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--env') {
        options.env = args[++i];
      } else if (arg === '--detached' || arg === '-d') {
        options.detached = true;
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        process.exit(0);
      } else if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
      } else {
        // Application arguments (after -- if present, or all remaining)
        appArgs.push(arg);
      }
    }

    const runner = new ElixirCommandRunner(process.cwd());

    console.log('🚀 Running Elixir application...\n');

    const result = await runner.run(appArgs, options);

    if (result.success) {
      console.log('\n✅ Application completed successfully!');
    } else {
      console.log('\n❌ Application failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Application failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 Elixir Run Command

Usage: /elixir-run [options] [--] [application-arguments]

Run Elixir applications with project-specific improvements.

Options:
  --no-compile              Skip compilation before running
  --verbose, -v             Verbose output
  --env ENVIRONMENT         Set Mix environment (dev, test, prod)
  --detached, -d            Run in detached mode (for servers)
  --help, -h                Show this help message

Application Arguments:
  Arguments passed after -- are forwarded to the Elixir application.
  If no -- is present, all arguments are forwarded.

Features:
  • Automatic compilation before running
  • Environment-aware execution
  • Application argument forwarding
  • Detached mode for servers
  • Resource cleanup on exit
  • Signal handling
  • Logging configuration
  • Phoenix server support

Examples:
  /elixir-run                          # Run default application
  /elixir-run --verbose                # Run with verbose output
  /elixir-run --env prod               # Run in production environment
  /elixir-run --no-compile             # Run without recompiling
  /elixir-run -- --port 4000           # Run with application arguments
  /elixir-run --detached               # Run server in detached mode
  /elixir-run -- --migrate             # Run with migration argument

Common Use Cases:
  1. Running Phoenix servers:
     /elixir-run --env prod -- --port 4000

  2. Running one-off tasks:
     /elixir-run -- --migrate
     /elixir-run -- --seed

  3. Running in development:
     /elixir-run --verbose

  4. Running tests with custom arguments:
     /elixir-run --env test -- --seed 12345

  5. Running background workers:
     /elixir-run --env prod --detached

Application Types:
  • Standard Elixir applications
  • Phoenix web servers
  • Command-line tools
  • Background workers
  • One-off scripts
  • Mix tasks
  • Ecto migrations

Notes:
  • Applications are compiled before running (unless --no-compile)
  • Mix environment determines configuration loading
  • Detached mode is useful for long-running servers
  • Application arguments are passed after --
  • Exit codes are preserved from the application
  • Signal handling allows graceful shutdown
  • Resource cleanup happens on application exit

Configuration:
  Run behavior can be configured via /elixir-setup:
    • Default environment
    • Compilation settings
    • Logging configuration
    • Resource limits
    • Signal handling
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
