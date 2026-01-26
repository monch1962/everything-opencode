#!/usr/bin/env node
/**
 * Python Command Runner
 *
 * Base class for executing Python commands based on project configuration
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { runCommand, commandExists } = require('../lib/utils');
const ConfigManager = require('../interactive/config-manager');
const PythonToolDetector = require('../../languages/python/tool-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const {
  ConfigUtils,
  FileUtils,
  ProjectUtils,
  LoggingUtils,
  ensureDir,
} = require('../lib');

class PythonCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new PythonToolDetector();
    this.config = null;
    this.pythonConfig = null;
  }

  /**
   * Initialize command runner
   */
  async initialize() {
    // First, validate that we're in a Python project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'python' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn(
          'This may not be a Python project. Some features may not work correctly.',
        );
      } else if (projectInfo.type === 'python') {
        LoggingUtils.debug(
          `Detected Python project: ${projectInfo.framework || 'standard Python'}`,
        );
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(
          `Detected languages: ${projectInfo.languages.join(', ')}`,
        );
      }
    } catch (error) {
      LoggingUtils.debug('Project detection failed:', error.message);
    }

    // Load configuration using ConfigUtils
    try {
      this.config = ConfigUtils.loadConfig(this.projectPath);
      if (!this.config) {
        throw new Error('Project not configured. Run /python-setup first.');
      }

      // Get Python configuration
      this.pythonConfig = this.config.python;
      if (!this.pythonConfig) {
        throw new Error(
          'Python configuration not found. Run /python-setup first.',
        );
      }

      // Validate Python configuration schema
      ConfigUtils.validateConfig(this.pythonConfig, 'python');

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error(
        'Failed to initialize Python command runner:',
        error.message,
      );
      LoggingUtils.info('Run /python-setup to configure your Python project');
      throw error;
    }
  }

  /**
   * Check if required tool is installed
   */
  async checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = await ConfigUtils.checkToolInstalled(toolName, {
        config: this.pythonConfig,
        language: 'python',
        required,
      });

      if (!isInstalled && required) {
        throw new Error(
          `${toolName} is not installed. Install it or run /python-setup.`,
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(
          `Python tool '${toolName}' check failed:`,
          error.message,
        );
        LoggingUtils.info(`Run /python-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Get Python executable path
   */
  getPythonExecutable() {
    // Check for python3 first, then python
    if (this.pythonConfig.tools?.python3?.installed) {
      return 'python3';
    } else if (this.pythonConfig.tools?.python?.installed) {
      return 'python';
    } else if (commandExists('python3')) {
      return 'python3';
    } else if (commandExists('python')) {
      return 'python';
    }

    throw new Error(
      'Python not found. Install Python 3.8+ and run /python-setup.',
    );
  }

  /**
   * Find Python files in the project
   */
  findPythonFiles(pattern = '**/*.py', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: 'python',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find Python files:', error.message);
      return [];
    }
  }

  /**
   * Get Python project metadata
   */
  getPythonProjectInfo() {
    try {
      const info = {
        hasRequirements: fs.existsSync(
          path.join(this.projectPath, 'requirements.txt'),
        ),
        hasPipfile: fs.existsSync(path.join(this.projectPath, 'Pipfile')),
        hasPyproject: fs.existsSync(
          path.join(this.projectPath, 'pyproject.toml'),
        ),
        hasSetupPy: fs.existsSync(path.join(this.projectPath, 'setup.py')),
        pythonFiles: this.findPythonFiles().length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug('Failed to get Python project info:', error.message);
      return null;
    }
  }

  /**
   * Execute command with proper environment
   */
  async executeCommand(command, args = [], options = {}) {
    return this._executeCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with comprehensive error handling
   */
  async _executeCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      const fullCommand = [command, ...args].join(' ');
      LoggingUtils.info(`🚀 Executing: ${fullCommand}`);

      return await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          cwd: this.projectPath,
          stdio: 'inherit',
          shell: true,
          env: {
            ...process.env,
            PYTHONPATH: `${this.projectPath}:${process.env.PYTHONPATH || ''}`,
            ...options.env,
          },
          ...options,
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`Command failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      // Enhance error with context
      const context = {
        tool: 'python',
        command: `${command} ${args.join(' ')}`,
        platform: process.platform,
        cwd: this.projectPath,
        options: options,
      };

      const errorInfo = defaultErrorHandler.handleError(error, context);

      // Log user-friendly error message using LoggingUtils
      LoggingUtils.error(errorInfo.userMessage);

      // Log recovery steps using LoggingUtils
      if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
        LoggingUtils.info('💡 Recovery steps:');
        errorInfo.recoverySteps.forEach((step, i) => {
          LoggingUtils.info(`  ${i + 1}. ${step}`);
        });
      }

      // Re-throw enhanced error
      const enhancedError = new Error(errorInfo.userMessage);
      enhancedError.originalError = error;
      enhancedError.context = context;
      enhancedError.errorInfo = errorInfo;
      throw enhancedError;
    }
  }

  /**
   * Execute Python module
   */
  async executePythonModule(module, args = [], options = {}) {
    const python = this.getPythonExecutable();
    return this.executeCommand(python, ['-m', module, ...args], options);
  }

  /**
   * Run tests with configured test runner
   */
  async runTests(options = {}) {
    await this.initialize();

    const testRunner = this.pythonConfig.testRunner || 'pytest';
    await this.checkTool(testRunner);

    // Log test information
    const projectInfo = this.getPythonProjectInfo();
    if (projectInfo) {
      LoggingUtils.debug(`Python files: ${projectInfo.pythonFiles}`);
    }

    const args = [];

    // Add coverage if requested
    if (options.coverage) {
      if (testRunner === 'pytest') {
        args.push('--cov=.', '--cov-report=term', '--cov-report=html');
        LoggingUtils.info('📊 Coverage reporting enabled');
      }
    }

    // Add verbose flag
    if (options.verbose) {
      args.push('-v');
      LoggingUtils.debug('Verbose mode enabled');
    }

    // Add specific test file
    if (options.file) {
      args.push(options.file);
      LoggingUtils.debug(`Testing specific file: ${options.file}`);
    }

    // Add test name pattern
    if (options.test) {
      if (testRunner === 'pytest') {
        args.push('-k', options.test);
        LoggingUtils.debug(`Test pattern: ${options.test}`);
      } else if (testRunner === 'unittest') {
        args.push(options.test);
        LoggingUtils.debug(`Test pattern: ${options.test}`);
      }
    }

    // Log test configuration
    LoggingUtils.info(`Running tests with ${testRunner}...`);

    // Execute test runner
    if (testRunner === 'pytest') {
      return this.executeCommand('pytest', args);
    } else if (testRunner === 'unittest') {
      return this.executePythonModule('unittest', args);
    } else {
      throw new Error(`Unsupported test runner: ${testRunner}`);
    }
  }

  /**
   * Run linter with configured tool
   */
  async runLinter(options = {}) {
    await this.initialize();

    const linter = this.pythonConfig.linter || 'ruff';
    await this.checkTool(linter);

    // Log linter information
    LoggingUtils.info(`Running ${linter}...`);
    if (options.fix) {
      LoggingUtils.debug('Fix mode enabled');
    }

    const args = [];

    // Check or fix mode
    if (options.fix) {
      if (linter === 'ruff') {
        args.push('check', '--fix');
      } else if (linter === 'flake8') {
        // flake8 doesn't have fix mode
        args.push('.');
        LoggingUtils.warn("flake8 doesn't support auto-fix mode");
      } else if (linter === 'pylint') {
        args.push('.');
        LoggingUtils.warn("pylint doesn't support auto-fix mode");
      }
    } else {
      if (linter === 'ruff') {
        args.push('check');
      } else {
        args.push('.');
      }
    }

    // Add specific file
    if (options.file) {
      args.length = 0; // Clear previous args
      if (linter === 'ruff' && options.fix) {
        args.push('check', '--fix', options.file);
      } else if (linter === 'ruff') {
        args.push('check', options.file);
      } else {
        args.push(options.file);
      }
      LoggingUtils.debug(`Linting specific file: ${options.file}`);
    }

    // Execute linter
    return this.executeCommand(linter, args);
  }

  /**
   * Run formatter with configured tool
   */
  async runFormatter(options = {}) {
    await this.initialize();

    const formatter = this.pythonConfig.formatter || 'ruff';
    await this.checkTool(formatter);

    // Log formatter information
    LoggingUtils.info(`Running ${formatter}...`);
    if (options.check) {
      LoggingUtils.debug('Check mode (no changes will be made)');
    }

    const args = [];

    // Check or format mode
    if (options.check) {
      if (formatter === 'ruff') {
        args.push('format', '--check');
      } else if (formatter === 'black') {
        args.push('--check', '.');
      } else if (formatter === 'autopep8') {
        args.push('--diff', '.');
        LoggingUtils.debug('autopep8 showing diff only');
      }
    } else {
      if (formatter === 'ruff') {
        args.push('format');
      } else {
        args.push('.');
      }
    }

    // Add specific file
    if (options.file) {
      args.length = 0; // Clear previous args
      if (formatter === 'ruff' && options.check) {
        args.push('format', '--check', options.file);
      } else if (formatter === 'ruff') {
        args.push('format', options.file);
      } else if (formatter === 'black' && options.check) {
        args.push('--check', options.file);
      } else if (formatter === 'black') {
        args.push(options.file);
      } else {
        args.push(options.file);
      }
      LoggingUtils.debug(`Formatting specific file: ${options.file}`);
    }

    // Execute formatter
    return this.executeCommand(formatter, args);
  }

  /**
   * Run type checker with configured tool
   */
  async runTypeChecker(options = {}) {
    await this.initialize();

    const typeChecker = this.pythonConfig.typeChecker || 'pyright';
    await this.checkTool(typeChecker);

    // Log type checker information
    LoggingUtils.info(`Running ${typeChecker}...`);
    if (options.strict) {
      LoggingUtils.debug('Strict mode enabled');
    }

    const args = [];

    // Add strict mode
    if (options.strict) {
      if (typeChecker === 'pyright') {
        args.push('--strict');
      } else if (typeChecker === 'mypy') {
        args.push('--strict');
      }
    }

    // Add specific file
    if (options.file) {
      args.push(options.file);
      LoggingUtils.debug(`Type checking specific file: ${options.file}`);
    } else {
      args.push('.');
    }

    // Execute type checker
    return this.executeCommand(typeChecker, args);
  }

  /**
   * Manage dependencies with configured manager
   */
  async manageDependencies(action, packages = [], options = {}) {
    await this.initialize();

    const manager = this.pythonConfig.dependencyManager || 'uv';
    await this.checkTool(manager);

    // Log dependency manager information
    LoggingUtils.info(`Managing dependencies with ${manager}...`);
    LoggingUtils.debug(
      `Action: ${action}, Packages: ${packages.join(', ') || 'none'}`,
    );

    const args = [];

    // Handle different actions
    switch (action) {
      case 'install':
        if (packages.length > 0) {
          if (manager === 'uv') {
            args.push('add', ...packages);
          } else if (manager === 'poetry') {
            args.push('add', ...packages);
          } else if (manager === 'pip') {
            args.push('install', ...packages);
          }
          LoggingUtils.debug(`Installing packages: ${packages.join(', ')}`);
        } else {
          if (manager === 'uv') {
            args.push('sync');
            LoggingUtils.debug('Syncing all dependencies');
          } else if (manager === 'poetry') {
            args.push('install');
            LoggingUtils.debug('Installing all dependencies');
          } else if (manager === 'pip') {
            // pip needs requirements.txt
            const requirementsPath = path.join(
              this.projectPath,
              'requirements.txt',
            );
            if (fs.existsSync(requirementsPath)) {
              args.push('install', '-r', 'requirements.txt');
              LoggingUtils.debug('Installing from requirements.txt');
            } else {
              throw new Error('requirements.txt not found');
            }
          }
        }
        break;

      case 'add':
        if (packages.length === 0) {
          throw new Error('No package specified');
        }
        if (manager === 'uv') {
          args.push('add', ...packages);
          if (options.dev) args.push('--dev');
        } else if (manager === 'poetry') {
          args.push('add', ...packages);
          if (options.dev) args.push('--dev');
        } else if (manager === 'pip') {
          args.push('install', ...packages);
        }
        if (options.dev) {
          LoggingUtils.debug(
            `Adding development packages: ${packages.join(', ')}`,
          );
        } else {
          LoggingUtils.debug(`Adding packages: ${packages.join(', ')}`);
        }
        break;

      case 'remove':
        if (packages.length === 0) {
          throw new Error('No package specified');
        }
        if (manager === 'uv') {
          args.push('remove', ...packages);
        } else if (manager === 'poetry') {
          args.push('remove', ...packages);
        } else if (manager === 'pip') {
          args.push('uninstall', ...packages);
        }
        LoggingUtils.debug(`Removing packages: ${packages.join(', ')}`);
        break;

      case 'update':
        if (packages.length > 0) {
          if (manager === 'uv') {
            args.push('update', ...packages);
          } else if (manager === 'poetry') {
            args.push('update', ...packages);
          } else if (manager === 'pip') {
            args.push('install', '--upgrade', ...packages);
          }
          LoggingUtils.debug(`Updating packages: ${packages.join(', ')}`);
        } else {
          if (manager === 'uv') {
            args.push('update');
            LoggingUtils.debug('Updating all dependencies');
          } else if (manager === 'poetry') {
            args.push('update');
            LoggingUtils.debug('Updating all dependencies');
          } else if (manager === 'pip') {
            // Update all packages (basic approach)
            args.push('install', '--upgrade');
            LoggingUtils.debug('Upgrading all packages');
          }
        }
        break;

      case 'list':
        if (manager === 'uv') {
          args.push('tree');
        } else if (manager === 'poetry') {
          args.push('show', '--tree');
        } else if (manager === 'pip') {
          args.push('list');
        }
        LoggingUtils.debug('Listing dependencies');
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Execute dependency manager
    return this.executeCommand(manager, args);
  }

  /**
   * Run setup wizard
   */
  async runSetup(options = {}) {
    const PythonConfigWizard = require('../../languages/python/config-wizard');
    const wizard = new PythonConfigWizard(this.projectPath);

    if (options.quick) {
      return wizard.quickSetup();
    } else {
      return wizard.run();
    }
  }

  /**
   * Print command help
   */
  printHelp(command) {
    const helps = {
      test: `
/python-test - Run Python tests

Usage:
  /python-test [options]

Options:
  --file <path>    Run tests in specific file
  --test <name>    Run specific test by name pattern
  --coverage       Generate coverage report
  --verbose        Verbose output
  --help           Show this help

Examples:
  /python-test
  /python-test --file tests/test_auth.py
  /python-test --coverage --verbose
      `,

      lint: `
/python-lint - Run Python linter

Usage:
  /python-lint [options]

Options:
  --fix            Automatically fix linting issues
  --file <path>    Check specific file
  --check          Check without fixing (default)
  --help           Show this help

Examples:
  /python-lint
  /python-lint --fix
  /python-lint --file app/main.py
      `,

      typecheck: `
/python-typecheck - Run Python type checker

Usage:
  /python-typecheck [options]

Options:
  --strict         Enable strict type checking
  --file <path>    Check specific file
  --help           Show this help

Examples:
  /python-typecheck
  /python-typecheck --strict
  /python-typecheck --file app/main.py
      `,

      deps: `
/python-deps - Manage Python dependencies

Usage:
  /python-deps <command> [packages...] [options]

Commands:
  install          Install dependencies
  add <package>    Add new dependency
  remove <package> Remove dependency
  update           Update dependencies
  list             List dependencies

Options:
  --dev            Development dependency
  --help           Show this help

Examples:
  /python-deps install
  /python-deps add fastapi
  /python-deps add pytest --dev
  /python-deps list
      `,

      setup: `
/python-setup - Configure Python project

Usage:
  /python-setup [options]

Options:
  --quick          Quick setup with automatic detection
  --reconfigure    Force reconfiguration
  --help           Show this help

Examples:
  /python-setup
  /python-setup --quick
  /python-setup --reconfigure
      `,
    };

    if (helps[command]) {
      LoggingUtils.info(helps[command]);
    } else {
      LoggingUtils.info(`
 Python Commands for opencode

 Available commands:
   /python-test      - Run tests
   /python-lint      - Run linter
   /python-typecheck - Run type checker
   /python-deps      - Manage dependencies
   /python-setup     - Configure project

 Use /python-<command> --help for command-specific help.
       `);
    }
  }
}

// Export for use in other scripts
module.exports = PythonCommandRunner;

// CLI entry point for testing
if (require.main === module) {
  const runner = new PythonCommandRunner();
  const args = process.argv.slice(2);

  const command = args[0];
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--file') {
      options.file = args[++i];
    } else if (args[i] === '--test') {
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
    } else if (args[i] === '--help' || args[i] === '-h') {
      runner.printHelp(command);
      process.exit(0);
    }
  }

  async function runCommand() {
    try {
      switch (command) {
        case 'test':
          await runner.runTests(options);
          break;
        case 'lint':
          await runner.runLinter(options);
          break;
        case 'typecheck':
          await runner.runTypeChecker(options);
          break;
        case 'deps':
          const action = args[1];
          const packages = args.slice(2).filter((arg) => !arg.startsWith('--'));
          await runner.manageDependencies(action, packages, options);
          break;
        case 'setup':
          await runner.runSetup(options);
          break;
        default:
          runner.printHelp();
          process.exit(1);
      }
      LoggingUtils.success('Command completed successfully');
    } catch (error) {
      LoggingUtils.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  runCommand();
}
