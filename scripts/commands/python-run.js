#!/usr/bin/env node
/**
 * /python-run command wrapper
 *
 * Run Python scripts and applications
 */

const PythonCommandRunner = require('../python/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const extraArgs = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--script' || arg === '-s') {
      options.script = args[++i];
    } else if (arg === '--args' || arg === '-a') {
      options.args = args[++i];
    } else if (arg === '--module' || arg === '-m') {
      options.module = args[++i];
    } else if (arg === '--watch' || arg === '-w') {
      options.watch = true;
    } else if (arg === '--reload') {
      options.reload = true;
    } else if (arg === '--port' || arg === '-p') {
      options.port = args[++i];
    } else if (arg === '--host' || arg === '-h') {
      options.host = args[++i];
    } else if (arg === '--debug') {
      options.debug = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--env' || arg === '-e') {
      options.env = args[++i];
    } else if (arg === '--setup') {
      options.setup = true;
    } else if (arg === '--help') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // First non-option argument is treated as script
      if (!options.script && !options.module) {
        options.script = arg;
      } else {
        // Additional arguments are passed to the script
        if (!options.args) {
          options.args = arg;
        } else {
          options.args += ' ' + arg;
        }
      }
    }
  }

  try {
    const runner = new PythonCommandRunner();

    if (options.setup) {
      console.log('🔧 Setting up Python run configuration...');
      console.log('Run /python-setup to configure your Python project.');
      process.exit(0);
    }

    // Determine what to run
    if (options.module) {
      console.log(`🚀 Running Python module: ${options.module}`);
      await runner.executeCommand(
        ['python', '-m', options.module, ...(options.args ? options.args.split(' ') : [])],
        {
          stdio: 'inherit',
        }
      );
    } else {
      const script = options.script || 'main.py';
      console.log(`🚀 Running Python script: ${script}`);

      await runner.runScript(options);
    }

    console.log('\n✅ Script execution completed');
  } catch (error) {
    console.error(`\n❌ Script execution failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/python-run - Run Python scripts and applications

Usage:
  /python-run [options] [script] [args...]

Options:
  --script, -s <path>     Python script to run (default: main.py)
  --args, -a <args>       Arguments to pass to the script
  --module, -m <module>   Run Python module with -m flag
  --watch, -w             Watch for file changes and restart
  --reload                Enable auto-reload (for web frameworks)
  --port, -p <port>       Port to run on (for web servers)
  --host, -h <host>       Host to bind to (for web servers)
  --debug                 Enable debug mode
  --verbose, -v           Verbose output
  --quiet, -q             Minimal output
  --env, -e <env>         Environment variables (KEY=VALUE,KEY2=VALUE2)
  --setup                 Show setup instructions
  --help                  Show this help

Examples:
  /python-run
  /python-run app.py
  /python-run --script app.py --args "--port 8080 --debug"
  /python-run --module http.server --args "8080"
  /python-run --module uvicorn main:app --reload --port 8000
  /python-run --watch app.py
  /python-run app.py arg1 arg2 arg3

Framework-specific examples:
  Django:
    /python-run --script manage.py runserver
    /python-run --script manage.py runserver --port 8000
    /python-run --script manage.py migrate

  Flask:
    /python-run --script app.py
    /python-run --env FLASK_APP=app.py FLASK_ENV=development

  FastAPI:
    /python-run --module uvicorn main:app --reload --port 8000

  Standard Python:
    /python-run script.py
    /python-run --module mypackage.cli --args "command --option value"

Configuration:
  Reads from .opencode/project-config.json
  Uses pythonConfig.framework for framework-specific defaults

Environment Variables:
  Can be set with --env flag: --env KEY=VALUE,KEY2=VALUE2
  Or in .env file in project root

Note:
  For web frameworks, consider using framework-specific commands
  (e.g., django-admin, flask, uvicorn) for better integration
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
