#!/usr/bin/env node
/**
 * /python-typecheck command wrapper
 * 
 * Run Python type checker based on project configuration
 */

const PythonCommandRunner = require('./python-command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--strict' || arg === '-s') {
      options.strict = true;
    } else if (arg === '--warn-unused') {
      options.warnUnused = true;
    } else if (arg === '--warn-return') {
      options.warnReturn = true;
    } else if (arg === '--warn-untyped') {
      options.warnUntyped = true;
    } else if (arg === '--ignore-missing') {
      options.ignoreMissing = true;
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--module') {
      options.module = args[++i];
    } else if (arg === '--package') {
      options.package = args[++i];
    } else if (arg === '--diff' || arg === '-d') {
      options.diff = true;
    } else if (arg === '--staged') {
      options.staged = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--html') {
      options.html = true;
    } else if (arg === '--statistics') {
      options.statistics = true;
    } else if (arg === '--config') {
      options.config = args[++i];
    } else if (arg === '--python-version') {
      options.pythonVersion = args[++i];
    } else if (arg === '--platform') {
      options.platform = args[++i];
    } else if (arg === '--tool') {
      options.tool = args[++i];
    } else if (arg === '--pyright') {
      options.tool = 'pyright';
    } else if (arg === '--mypy') {
      options.tool = 'mypy';
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else if (!options.file && !options.module && !options.package) {
      // Treat as file path if no file/module/package option yet
      options.file = arg;
    }
  }
  
  try {
    const runner = new PythonCommandRunner();
    await runner.runTypeChecker(options);
    console.log('\n✅ Type checking completed');
  } catch (error) {
    console.error(`\n❌ Type checking failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/python-typecheck - Run Python type checker

Usage:
  /python-typecheck [options]

Options:
  --strict, -s         Enable strict type checking
  --warn-unused        Warn about unused imports/ignores
  --warn-return        Warn about missing return types
  --warn-untyped       Warn about untyped function definitions
  --ignore-missing     Ignore missing imports
  --all, -a            Check all files (default)
  --file, -f <path>    Check specific file
  --module <name>      Check specific module
  --package <name>     Check specific package
  --diff, -d           Only check changed files (git diff)
  --staged             Only check staged files (git diff --cached)
  --verbose, -v        Verbose output
  --quiet, -q          Minimal output
  --json               Output JSON format
  --html               Generate HTML report
  --statistics         Show type checking statistics
  --config <path>      Use alternative configuration file
  --python-version <v> Target Python version (3.8, 3.9, etc.)
  --platform <p>       Target platform (linux, win32, darwin)
  --tool <name>        Use specific tool (overrides config)
  --pyright            Use pyright (Microsoft)
  --mypy               Use mypy
  --help, -h           Show this help

Examples:
  /python-typecheck                    # Check all files
  /python-typecheck --strict           # Strict type checking
  /python-typecheck --file app/main.py # Check specific file
  /python-typecheck --pyright          # Use pyright specifically
  /python-typecheck --mypy --strict    # Use mypy with strict mode
  /python-typecheck --diff             # Only check changed files
  /python-typecheck --json             # Generate JSON report

Configuration:
  Reads from .opencode/project-config.json
  Uses typeChecker: pyright or mypy
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