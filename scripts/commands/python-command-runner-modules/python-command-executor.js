#!/usr/bin/env node
/**
 * Python Command Executor Module for PythonCommandRunner
 *
 * Command execution methods: runTests, runLinter, runFormatter, runTypeChecker, manageDependencies, runSetup
 */

const path = require('path');
const fs = require('fs');
const { LoggingUtils } = require('../../lib');

class PythonCommandExecutor {
  constructor(projectPath, pythonConfig, initializer, projectAnalyzer, coreExecutor) {
    this.projectPath = projectPath;
    this.pythonConfig = pythonConfig;
    this.initializer = initializer;
    this.projectAnalyzer = projectAnalyzer;
    this.coreExecutor = coreExecutor;
  }

  /**
   * Run tests with configured test runner
   */
  async runTests(options = {}) {
    await this.initializer.initialize();

    const testRunner = this.pythonConfig.testRunner || 'pytest';
    await this.initializer.checkTool(testRunner);

    // Log test information
    const projectInfo = this.projectAnalyzer.getPythonProjectInfo();
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
      return this.coreExecutor.executeCommand('pytest', args);
    } else if (testRunner === 'unittest') {
      return this.coreExecutor.executePythonModule('unittest', args);
    } else {
      throw new Error(`Unsupported test runner: ${testRunner}`);
    }
  }

  /**
   * Run linter with configured tool
   */
  async runLinter(options = {}) {
    await this.initializer.initialize();

    const linter = this.pythonConfig.linter || 'ruff';
    await this.initializer.checkTool(linter);

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
      args.push(options.file);
      LoggingUtils.debug(`Linting specific file: ${options.file}`);
    }

    // Add exclude patterns
    if (options.exclude) {
      if (linter === 'ruff') {
        args.push('--exclude', options.exclude);
      } else if (linter === 'flake8') {
        args.push('--exclude', options.exclude);
      }
    }

    // Execute linter
    return this.coreExecutor.executeCommand(linter, args);
  }

  /**
   * Run formatter with configured tool
   */
  async runFormatter(options = {}) {
    await this.initializer.initialize();

    const formatter = this.pythonConfig.formatter || 'black';
    await this.initializer.checkTool(formatter);

    // Log formatter information
    LoggingUtils.info(`Running ${formatter}...`);
    if (options.check) {
      LoggingUtils.debug('Check mode (no changes)');
    }

    const args = [];

    // Check or format mode
    if (options.check) {
      if (formatter === 'black') {
        args.push('--check');
      } else if (formatter === 'isort') {
        args.push('--check-only');
      } else if (formatter === 'yapf') {
        args.push('--diff');
      }
    }

    // Add specific file or directory
    if (options.file) {
      args.push(options.file);
      LoggingUtils.debug(`Formatting specific file: ${options.file}`);
    } else {
      args.push('.');
    }

    // Add line length if specified
    if (options.lineLength) {
      if (formatter === 'black') {
        args.push('--line-length', options.lineLength.toString());
      } else if (formatter === 'yapf') {
        args.push('--style', `{based_on_style: pep8, column_limit: ${options.lineLength}}`);
      }
    }

    // Execute formatter
    return this.coreExecutor.executeCommand(formatter, args);
  }

  /**
   * Run type checker with configured tool
   */
  async runTypeChecker(options = {}) {
    await this.initializer.initialize();

    const typeChecker = this.pythonConfig.typeChecker || 'mypy';
    await this.initializer.checkTool(typeChecker);

    // Log type checker information
    LoggingUtils.info(`Running ${typeChecker}...`);

    const args = [];

    // Add specific file or directory
    if (options.file) {
      args.push(options.file);
      LoggingUtils.debug(`Type checking specific file: ${options.file}`);
    } else {
      args.push('.');
    }

    // Add strict mode
    if (options.strict) {
      if (typeChecker === 'mypy') {
        args.push('--strict');
      } else if (typeChecker === 'pyright') {
        args.push('--lib');
      }
    }

    // Add config file if specified
    if (options.config) {
      if (typeChecker === 'mypy') {
        args.push('--config-file', options.config);
      } else if (typeChecker === 'pyright') {
        args.push('--config', options.config);
      }
    }

    // Execute type checker
    return this.coreExecutor.executeCommand(typeChecker, args);
  }

  /**
   * Manage Python dependencies
   */
  async manageDependencies(action, packages = [], options = {}) {
    await this.initializer.initialize();

    const packageManager = this.pythonConfig.packageManager || 'pip';
    await this.initializer.checkTool(packageManager);

    // Log dependency management information
    LoggingUtils.info(`Managing dependencies with ${packageManager}...`);

    const args = [];

    // Handle different actions
    switch (action) {
      case 'install':
        args.push('install');
        if (packages.length === 0) {
          // Install from requirements file
          if (this.projectAnalyzer.hasFile('requirements.txt')) {
            args.push('-r', 'requirements.txt');
            LoggingUtils.debug('Installing from requirements.txt');
          } else if (this.projectAnalyzer.hasFile('pyproject.toml')) {
            if (packageManager === 'poetry') {
              args.push('--no-root');
            } else if (packageManager === 'pip') {
              args.push('.');
            }
          }
        } else {
          // Install specific packages
          args.push(...packages);
          LoggingUtils.debug(`Installing packages: ${packages.join(', ')}`);
        }
        break;

      case 'uninstall':
        args.push('uninstall', ...packages);
        LoggingUtils.debug(`Uninstalling packages: ${packages.join(', ')}`);
        break;

      case 'update':
        args.push('update');
        if (packages.length > 0) {
          args.push(...packages);
          LoggingUtils.debug(`Updating packages: ${packages.join(', ')}`);
        } else {
          LoggingUtils.debug('Updating all packages');
        }
        break;

      case 'list':
        args.push('list');
        break;

      case 'show':
        if (packages.length > 0) {
          args.push('show', ...packages);
          LoggingUtils.debug(`Showing info for: ${packages.join(', ')}`);
        } else {
          throw new Error('Package name required for show action');
        }
        break;

      default:
        throw new Error(`Unknown dependency action: ${action}`);
    }

    // Add additional options
    if (options.dev && packageManager === 'poetry') {
      args.push('--dev');
    }

    if (options.noCache && packageManager === 'pip') {
      args.push('--no-cache-dir');
    }

    // Execute package manager
    if (packageManager === 'pip') {
      return this.coreExecutor.executePythonModule('pip', args);
    } else {
      return this.coreExecutor.executeCommand(packageManager, args);
    }
  }

  /**
   * Run project setup
   */
  async runSetup(options = {}) {
    await this.initializer.initialize();

    LoggingUtils.info('Setting up Python project...');

    const setupTasks = [];

    // Check Python installation
    try {
      const python = this.projectAnalyzer.getPythonExecutable();
      setupTasks.push(`✓ Python executable: ${python}`);
    } catch (error) {
      setupTasks.push(`✗ Python not found: ${error.message}`);
      throw error;
    }

    // Check virtual environment
    const venvPath = path.join(this.projectPath, 'venv');
    if (!fs.existsSync(venvPath) && options.createVenv) {
      setupTasks.push('Creating virtual environment...');
      await this.coreExecutor.executePythonModule('venv', ['venv']);
      setupTasks.push('✓ Virtual environment created');
    } else if (fs.existsSync(venvPath)) {
      setupTasks.push('✓ Virtual environment found');
    }

    // Install dependencies
    if (options.installDeps) {
      setupTasks.push('Installing dependencies...');
      await this.manageDependencies('install', [], {});
      setupTasks.push('✓ Dependencies installed');
    }

    // Run initial tests
    if (options.runTests) {
      setupTasks.push('Running initial tests...');
      try {
        await this.runTests({ verbose: false });
        setupTasks.push('✓ Tests passed');
      } catch (error) {
        setupTasks.push(`⚠ Tests failed: ${error.message}`);
        if (!options.force) {
          throw error;
        }
      }
    }

    // Log setup summary
    LoggingUtils.info('Setup completed:');
    setupTasks.forEach((task) => {
      if (task.startsWith('✓')) {
        LoggingUtils.success(task);
      } else if (task.startsWith('✗')) {
        LoggingUtils.error(task);
      } else if (task.startsWith('⚠')) {
        LoggingUtils.warn(task);
      } else {
        LoggingUtils.info(task);
      }
    });

    return { success: true, tasks: setupTasks };
  }
}

module.exports = PythonCommandExecutor;
