#!/usr/bin/env node
/**
 * /python-setup command wrapper
 *
 * Configure Python project for opencode integration
 */

const PythonCommandRunner = require('./python-command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--quick' || arg === '-q') {
      options.quick = true;
    } else if (arg === '--reconfigure' || arg === '-r') {
      options.reconfigure = true;
    } else if (arg === '--project-type') {
      options.projectType = args[++i];
    } else if (arg === '--manager') {
      options.manager = args[++i];
    } else if (arg === '--test-runner') {
      options.testRunner = args[++i];
    } else if (arg === '--linter') {
      options.linter = args[++i];
    } else if (arg === '--formatter') {
      options.formatter = args[++i];
    } else if (arg === '--type-checker') {
      options.typeChecker = args[++i];
    } else if (arg === '--no-prompt' || arg === '-y') {
      options.noPrompt = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--config') {
      options.config = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    const runner = new PythonCommandRunner();
    const success = await runner.runSetup(options);

    if (success) {
      console.log('\n✅ Python project setup completed successfully!');
      console.log('\n🎯 Next steps:');
      console.log('  • Run tests: /python-test');
      console.log('  • Lint code: /python-lint');
      console.log('  • Type check: /python-typecheck');
      console.log('  • Manage dependencies: /python-deps');
      console.log('  • Reconfigure: /python-setup');
    } else {
      console.log('\n⚠️  Setup completed with warnings or was cancelled');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/python-setup - Configure Python project for opencode

Usage:
  /python-setup [options]

Options:
  --quick, -q            Quick setup with automatic detection
  --reconfigure, -r      Force reconfiguration even if already configured
  --project-type <type>  Specify project type (overrides detection)
  --manager <name>       Specify dependency manager
  --test-runner <name>   Specify test runner
  --linter <name>        Specify linter
  --formatter <name>     Specify formatter
  --type-checker <name>  Specify type checker
  --no-prompt, -y        Use defaults without prompting
  --verbose, -v          Verbose output
  --config <path>        Save configuration to specific path
  --help, -h             Show this help

Project Types:
  fastapi          FastAPI web application
  django           Django web framework
  flask            Flask microframework
  data-science     Data science/analysis project
  machine-learning Machine learning project
  cli              Command-line interface tool
  library          Python library/package

Examples:
  /python-setup                    # Interactive setup wizard
  /python-setup --quick            # Quick automatic setup
  /python-setup --reconfigure      # Force reconfiguration
  /python-setup --project-type fastapi
  /python-setup --manager uv --test-runner pytest --linter ruff
  /python-setup --no-prompt        # Non-interactive with defaults

Setup Process:
  1. Project detection (language, type, confidence)
  2. Tool detection (Python, dependency managers, testing, linting)
  3. Interactive configuration (project type, tools, options)
  4. Configuration saving (.opencode/project-config.json)
  5. Next steps and recommendations

Configuration File:
  Saved to .opencode/project-config.json
  Includes project type, tool configuration, detected tools
  Used by other Python commands (/python-test, /python-lint, etc.)
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
