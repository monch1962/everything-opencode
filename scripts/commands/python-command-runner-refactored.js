#!/usr/bin/env node
/**
 * Python Command Runner - Refactored Version
 *
 * Base class for executing Python commands based on project configuration
 * This is a refactored version that delegates to modular components while
 * maintaining 100% backward compatibility with the original API.
 */

const PythonInitializer = require('./python-command-runner-modules/python-initializer');
const PythonProjectAnalyzer = require('./python-command-runner-modules/python-project-analyzer');
const PythonCoreExecutor = require('./python-command-runner-modules/python-core-executor');
const PythonCommandExecutor = require('./python-command-runner-modules/python-command-executor');
const PythonHelpUtils = require('./python-command-runner-modules/python-help-utils');

class PythonCommandRunner {
  constructor(projectPath = process.cwd()) {
    // Initialize modules
    this.initializer = new PythonInitializer(projectPath);
    this.projectAnalyzer = null;
    this.coreExecutor = null;
    this.commandExecutor = null;
    this.helpUtils = new PythonHelpUtils();
  }

  /**
   * Initialize command runner
   */
  async initialize() {
    await this.initializer.initialize();

    // Get configuration from initializer
    const config = this.initializer.getConfig();

    // Initialize other modules with configuration
    this.projectAnalyzer = new PythonProjectAnalyzer(config.projectPath, config.pythonConfig);

    this.coreExecutor = new PythonCoreExecutor(
      config.projectPath,
      config.pythonConfig,
      this.projectAnalyzer
    );

    this.commandExecutor = new PythonCommandExecutor(
      config.projectPath,
      config.pythonConfig,
      this.initializer,
      this.projectAnalyzer,
      this.coreExecutor
    );

    return true;
  }

  /**
   * Check if required tool is installed
   */
  async checkTool(toolName, required = true) {
    return this.initializer.checkTool(toolName, required);
  }

  /**
   * Get Python executable name
   */
  getPythonExecutable() {
    if (!this.projectAnalyzer) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }
    return this.projectAnalyzer.getPythonExecutable();
  }

  /**
   * Find Python files in the project
   */
  findPythonFiles(pattern = '**/*.py', excludePatterns = []) {
    if (!this.projectAnalyzer) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }
    return this.projectAnalyzer.findPythonFiles(pattern, excludePatterns);
  }

  /**
   * Get Python project metadata
   */
  getPythonProjectInfo() {
    if (!this.projectAnalyzer) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }
    return this.projectAnalyzer.getPythonProjectInfo();
  }

  /**
   * Execute command with proper environment
   */
  async executeCommand(command, args = [], options = {}) {
    if (!this.coreExecutor) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }
    return this.coreExecutor.executeCommand(command, args, options);
  }

  /**
   * Internal method with comprehensive error handling
   */
  async _executeCommandWithErrorHandling(command, args = [], options = {}) {
    if (!this.coreExecutor) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }
    return this.coreExecutor._executeCommandWithErrorHandling(command, args, options);
  }

  /**
   * Execute Python module
   */
  async executePythonModule(module, args = [], options = {}) {
    if (!this.coreExecutor) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }
    return this.coreExecutor.executePythonModule(module, args, options);
  }

  /**
   * Run tests with configured test runner
   */
  async runTests(options = {}) {
    if (!this.commandExecutor) {
      await this.initialize();
    }
    return this.commandExecutor.runTests(options);
  }

  /**
   * Run linter with configured tool
   */
  async runLinter(options = {}) {
    if (!this.commandExecutor) {
      await this.initialize();
    }
    return this.commandExecutor.runLinter(options);
  }

  /**
   * Run formatter with configured tool
   */
  async runFormatter(options = {}) {
    if (!this.commandExecutor) {
      await this.initialize();
    }
    return this.commandExecutor.runFormatter(options);
  }

  /**
   * Run type checker with configured tool
   */
  async runTypeChecker(options = {}) {
    if (!this.commandExecutor) {
      await this.initialize();
    }
    return this.commandExecutor.runTypeChecker(options);
  }

  /**
   * Manage Python dependencies
   */
  async manageDependencies(action, packages = [], options = {}) {
    if (!this.commandExecutor) {
      await this.initialize();
    }
    return this.commandExecutor.manageDependencies(action, packages, options);
  }

  /**
   * Run project setup
   */
  async runSetup(options = {}) {
    if (!this.commandExecutor) {
      await this.initialize();
    }
    return this.commandExecutor.runSetup(options);
  }

  /**
   * Print command help
   */
  printHelp(command) {
    return this.helpUtils.printHelp(command);
  }

  // Getter methods for internal modules (for testing/debugging)
  getInitializer() {
    return this.initializer;
  }

  getProjectAnalyzer() {
    return this.projectAnalyzer;
  }

  getCoreExecutor() {
    return this.coreExecutor;
  }

  getCommandExecutor() {
    return this.commandExecutor;
  }

  getHelpUtils() {
    return this.helpUtils;
  }
}

// Export the class
module.exports = PythonCommandRunner;

// CLI execution (main function)
if (require.main === module) {
  const runner = new PythonCommandRunner();

  const runCommand = async () => {
    try {
      const args = process.argv.slice(2);
      const command = args[0];
      const options = {};

      // Parse options
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--help') {
          runner.printHelp(command);
          process.exit(0);
        } else if (args[i] === '--file' && args[i + 1]) {
          options.file = args[++i];
        } else if (args[i] === '--test' && args[i + 1]) {
          options.test = args[++i];
        } else if (args[i] === '--coverage') {
          options.coverage = true;
        } else if (args[i] === '--verbose') {
          options.verbose = true;
        } else if (args[i] === '--fix') {
          options.fix = true;
        } else if (args[i] === '--check') {
          options.check = true;
        } else if (args[i] === '--strict') {
          options.strict = true;
        } else if (args[i] === '--dev') {
          options.dev = true;
        } else if (args[i] === '--quick') {
          options.quick = true;
        } else if (args[i] === '--reconfigure') {
          options.reconfigure = true;
        } else if (args[i] === '--create-venv') {
          options.createVenv = true;
        } else if (args[i] === '--install-deps') {
          options.installDeps = true;
        } else if (args[i] === '--run-tests') {
          options.runTests = true;
        } else if (args[i] === '--force') {
          options.force = true;
        } else if (args[i] === '--exclude' && args[i + 1]) {
          options.exclude = args[++i];
        } else if (args[i] === '--line-length' && args[i + 1]) {
          options.lineLength = parseInt(args[++i], 10);
        } else if (args[i] === '--config' && args[i + 1]) {
          options.config = args[++i];
        } else if (args[i] === '--no-cache') {
          options.noCache = true;
        }
      }

      await runner.initialize();

      switch (command) {
        case 'test':
          await runner.runTests(options);
          break;
        case 'lint':
          await runner.runLinter(options);
          break;
        case 'format':
          await runner.runFormatter(options);
          break;
        case 'typecheck':
          await runner.runTypeChecker(options);
          break;
        case 'deps': {
          const action = args[1];
          const packages = args.slice(2).filter((arg) => !arg.startsWith('--'));
          await runner.manageDependencies(action, packages, options);
          break;
        }
        case 'setup':
          await runner.runSetup(options);
          break;
        default:
          runner.printHelp();
          process.exit(1);
      }

      const { LoggingUtils } = require('../lib');
      LoggingUtils.success('Command completed successfully');
    } catch (error) {
      const { LoggingUtils } = require('../lib');
      LoggingUtils.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };

  runCommand();
}
