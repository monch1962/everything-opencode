#!/usr/bin/env node
/**
 * Python Configuration Wizard
 *
 * Interactive wizard for configuring Python projects in opencode
 * Now uses refactored version that follows JavaScript pattern exactly
 */

const PythonConfigWizardRefactored = require('./config-wizard-refactored');

class PythonConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.wizard = new PythonConfigWizardRefactored(projectPath);
  }

  /**
   * Run the complete Python configuration wizard
   */
  async run() {
    return this.wizard.runWizard();
  }

  /**
   * Quick setup with automatic detection
   */
  async quickSetup() {
    return this.wizard.quickSetup();
  }
}

// Export for use in other scripts
module.exports = PythonConfigWizard;

// CLI entry point
if (require.main === module) {
  const wizard = new PythonConfigWizard();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🐍 Python Configuration Wizard

Usage:
  node languages/python/config-wizard.js [options]

Options:
  --quick, -q    Quick setup with automatic detection
  --help, -h     Show this help message

Examples:
  node languages/python/config-wizard.js          # Run interactive wizard
  node languages/python/config-wizard.js --quick  # Quick automatic setup
    `);
    process.exit(0);
  } else if (args.includes('--quick') || args.includes('-q')) {
    wizard.quickSetup().then((success) => {
      process.exit(success ? 0 : 1);
    });
  } else {
    wizard.run().then((success) => {
      process.exit(success ? 0 : 1);
    });
  }
}
