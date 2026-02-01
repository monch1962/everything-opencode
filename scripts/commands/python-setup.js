#!/usr/bin/env node
/**
 * /python-setup command wrapper
 *
 * Configure Python project for opencode integration
 */

const PythonConfigWizard = require('../../languages/python/config-wizard');

async function main() {
  try {
    const projectPath = process.cwd();
    const wizard = new PythonConfigWizard(projectPath);

    console.log('🐍 Python Project Setup\n');

    // Check for command line arguments
    const args = process.argv.slice(2);

    let success = false;

    if (args.includes('--quick') || args.includes('-q')) {
      console.log('⚡ Running quick setup...\n');
      success = await wizard.quickSetup();
    } else {
      // Run the configuration wizard
      success = await wizard.run();
    }

    if (success) {
      console.log('\n✅ Python setup completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('  1. Run /python-test to test your project');
      console.log('  2. Run /python-lint to check code quality');
      console.log('  3. Run /python-format to format your code');
      console.log('  4. Run /python-typecheck for type checking (if configured)');
      console.log('  5. Run /python-dev to start development server (for web projects)');
      console.log('  6. Run /python-install to install dependencies');

      console.log('\n📚 Available Python commands:');
      console.log('  • /python-setup    - Configure Python project (run this again)');
      console.log('  • /python-test     - Run tests with configured test runner');
      console.log('  • /python-lint     - Run linter (ruff/flake8/pylint)');
      console.log('  • /python-format   - Format code (ruff/black/autopep8)');
      console.log('  • /python-typecheck - Type checking (pyright/mypy)');
      console.log('  • /python-dev      - Start development server');
      console.log('  • /python-install  - Install dependencies');
      console.log('  • /python-clean    - Clean build artifacts');
      console.log('  • /python-run      - Run Python script');
    } else {
      console.log('\n❌ Setup failed. Please check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🐍 Python Project Setup

Usage:
  node scripts/commands/python-setup.js [options]

Options:
  --quick, -q    Quick setup with automatic detection
  --help, -h     Show this help message

Examples:
  node scripts/commands/python-setup.js          # Run interactive wizard
  node scripts/commands/python-setup.js --quick  # Quick automatic setup

Setup Process:
  1. Python project detection and validation
  2. Project type detection (Django, Flask, FastAPI, etc.)
  3. Tool detection (Python, pip, poetry, uv, pytest, etc.)
  4. Interactive configuration (dependency manager, test runner, linter, formatter, type checker)
  5. Configuration saving (.opencode/project-config.json)
  6. Next steps and recommendations

Configuration File:
  Saved to .opencode/project-config.json
  Includes project type, tool configuration, detected tools
  Used by other Python commands (/python-test, /python-lint, etc.)
  `);
}

// Check for help flag
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;
