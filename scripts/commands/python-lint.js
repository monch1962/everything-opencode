#!/usr/bin/env node
/**
 * /python-lint command wrapper
 * 
 * Run Python linter and formatter based on project configuration
 */

const PythonCommandRunner = require('./python-command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--fix' || arg === '-f') {
      options.fix = true;
    } else if (arg === '--strict' || arg === '-s') {
      options.strict = true;
    } else if (arg === '--ignore') {
      options.ignore = args[++i];
    } else if (arg === '--select') {
      options.select = args[++i];
    } else if (arg === '--format') {
      options.format = true;
    } else if (arg === '--check-format') {
      options.checkFormat = true;
    } else if (arg === '--line-length' || arg === '-l') {
      options.lineLength = parseInt(args[++i], 10);
    } else if (arg === '--target-version') {
      options.targetVersion = args[++i];
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--diff' || arg === '-d') {
      options.diff = true;
    } else if (arg === '--staged') {
      options.staged = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--statistics') {
      options.statistics = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--html') {
      options.html = true;
    } else if (arg === '--tool') {
      options.tool = args[++i];
    } else if (arg === '--no-lint') {
      options.noLint = true;
    } else if (arg === '--no-format') {
      options.noFormat = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else if (!options.file) {
      // Treat as file path if no file option yet
      options.file = arg;
    }
  }
  
  try {
    const runner = new PythonCommandRunner();
    
    // Determine what to run
    if (options.format || options.checkFormat) {
      // Run formatter
      options.check = options.checkFormat;
      await runner.runFormatter(options);
      console.log('\n✅ Formatting completed');
    } else if (!options.noLint) {
      // Run linter (default)
      await runner.runLinter(options);
      console.log('\n✅ Linting completed');
    } else {
      console.log('Nothing to do (--no-lint specified without --format)');
    }
  } catch (error) {
    console.error(`\n❌ Linting/formatting failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/python-lint - Run Python linter and formatter

Usage:
  /python-lint [options]

Options:
  --check              Check code without making changes (default)
  --fix, -f            Automatically fix linting issues
  --strict, -s         Enable stricter linting rules
  --ignore <codes>     Ignore specific error codes
  --select <codes>     Only check specific error codes
  --format             Format code (if formatter configured)
  --check-format       Check formatting without changes
  --line-length, -l <n> Set maximum line length
  --target-version <v> Target Python version (py311, py312, etc.)
  --all, -a            Check all files (default)
  --file, -f <path>    Check specific file
  --diff, -d           Only check changed files (git diff)
  --staged             Only check staged files (git diff --cached)
  --verbose, -v        Verbose output
  --quiet, -q          Minimal output
  --statistics         Show statistics
  --json               Output JSON format
  --html               Generate HTML report
  --tool <name>        Use specific tool (overrides config)
  --no-lint            Skip linting
  --no-format          Skip formatting
  --help, -h           Show this help

Examples:
  /python-lint                    # Check code (no changes)
  /python-lint --fix              # Fix linting issues
  /python-lint --format           # Format code
  /python-lint --fix --format     # Fix and format
  /python-lint --file app/main.py # Check specific file
  /python-lint --diff             # Only check changed files
  /python-lint --tool ruff        # Use specific tool
  /python-lint --strict           # Strict checking

Configuration:
  Reads from .opencode/project-config.json
  Uses linter: ruff, flake8, or pylint
  Uses formatter: ruff, black, or autopep8
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