#!/usr/bin/env node
/**
 * Python Command Runner
 *
 * Execute Python commands with Python-specific improvements and error handling
 * Following JavaScript/TypeScript pattern exactly
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const PythonToolDetector = require('../../languages/python/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ProjectUtils, LoggingUtils } = require('../lib');

class PythonCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new PythonToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.pythonConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with Python-specific setup
   */
  async initialize() {
    // First, validate that we're in a Python project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'python' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn(
          'This may not be a Python project. Some features may not work correctly.'
        );
      } else if (projectInfo.type === 'python') {
        LoggingUtils.debug(
          `Detected Python project: ${projectInfo.framework || 'standard Python'}`
        );
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }
    } catch (error) {
      LoggingUtils.debug('Project detection failed:', error.message);
    }

    // Load configuration
    try {
      this.config = await this.configManager.loadConfig();
      this.pythonConfig = this.config?.python || {};
    } catch (error) {
      LoggingUtils.debug('Configuration load failed:', error.message);
      this.config = {};
      this.pythonConfig = {};
    }

    // Detect Python tools
    try {
      this.detectedTools = await this.toolDetector.detectTools();
      LoggingUtils.debug('Python tools detected successfully');
    } catch (error) {
      LoggingUtils.warn('Python tool detection failed:', error.message);
      this.detectedTools = {};
    }

    return {
      config: this.config,
      pythonConfig: this.pythonConfig,
      detectedTools: this.detectedTools,
    };
  }

  /**
   * Run Python tests
   */
  async runTests(options = {}) {
    await this.initialize();

    const testRunner = this.pythonConfig.testRunner || 'pytest';
    const testCommand = this.buildTestCommand(testRunner, options);

    LoggingUtils.info(`Running Python tests with ${testRunner}...`);

    try {
      await this.executeCommand(testCommand, {
        cwd: this.projectPath,
        stdio: 'inherit',
      });
      return true;
    } catch (error) {
      LoggingUtils.error(`Test execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build test command based on runner and options
   */
  buildTestCommand(runner, options) {
    const args = [];

    switch (runner) {
      case 'pytest':
        args.push('pytest');
        if (options.file) args.push(options.file);
        if (options.test) args.push('-k', options.test);
        if (options.coverage) args.push('--cov');
        if (options.verbose) args.push('-v');
        if (options.quiet) args.push('-q');
        if (options.failedFirst) args.push('--failed-first');
        if (options.lastFailed) args.push('--last-failed');
        if (options.noCapture) args.push('-s');
        if (options.parallel) args.push('-n', 'auto');
        if (options.html) args.push('--cov-report', 'html');
        if (options.xml) args.push('--junitxml', 'test-results.xml');
        break;

      case 'unittest':
        args.push('python', '-m', 'unittest');
        if (options.file) args.push(options.file);
        if (options.test) args.push('-k', options.test);
        if (options.verbose) args.push('-v');
        if (options.quiet) args.push('-q');
        break;

      case 'nose':
        args.push('nosetests');
        if (options.file) args.push(options.file);
        if (options.test) args.push('--test', options.test);
        if (options.coverage) args.push('--with-coverage');
        if (options.verbose) args.push('-v');
        break;

      default:
        args.push('python', '-m', 'pytest');
    }

    return args;
  }

  /**
   * Run Python linter
   */
  async runLint(options = {}) {
    await this.initialize();

    const linter = this.pythonConfig.linter || 'ruff';
    const lintCommand = this.buildLintCommand(linter, options);

    LoggingUtils.info(`Running Python linter (${linter})...`);

    try {
      await this.executeCommand(lintCommand, {
        cwd: this.projectPath,
        stdio: 'inherit',
      });
      return true;
    } catch (error) {
      LoggingUtils.error(`Lint execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build lint command based on linter and options
   */
  buildLintCommand(linter, options) {
    const args = [];

    switch (linter) {
      case 'ruff':
        args.push('ruff', 'check');
        if (options.fix) args.push('--fix');
        if (options.select) args.push('--select', options.select);
        if (options.ignore) args.push('--ignore', options.ignore);
        if (options.config) args.push('--config', options.config);
        args.push('.');
        break;

      case 'flake8':
        args.push('flake8');
        if (options.config) args.push('--config', options.config);
        args.push('.');
        break;

      case 'pylint':
        args.push('pylint');
        if (options.rcfile) args.push('--rcfile', options.rcfile);
        args.push('.');
        break;

      default:
        args.push('ruff', 'check', '.');
    }

    return args;
  }

  /**
   * Run Python formatter
   */
  async runFormat(options = {}) {
    await this.initialize();

    const formatter = this.pythonConfig.formatter || 'ruff';
    const formatCommand = this.buildFormatCommand(formatter, options);

    LoggingUtils.info(`Running Python formatter (${formatter})...`);

    try {
      await this.executeCommand(formatCommand, {
        cwd: this.projectPath,
        stdio: 'inherit',
      });
      return true;
    } catch (error) {
      LoggingUtils.error(`Format execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build format command based on formatter and options
   */
  buildFormatCommand(formatter, options) {
    const args = [];

    switch (formatter) {
      case 'ruff':
        args.push('ruff', 'format');
        if (options.check) args.push('--check');
        if (options.diff) args.push('--diff');
        if (options.config) args.push('--config', options.config);
        args.push('.');
        break;

      case 'black':
        args.push('black');
        if (options.check) args.push('--check');
        if (options.diff) args.push('--diff');
        if (options.config) args.push('--config', options.config);
        args.push('.');
        break;

      case 'autopep8':
        args.push('autopep8', '--in-place', '--recursive');
        if (options.aggressive) args.push('--aggressive');
        args.push('.');
        break;

      default:
        args.push('ruff', 'format', '.');
    }

    return args;
  }

  /**
   * Run Python type checker
   */
  async runTypeCheck(options = {}) {
    await this.initialize();

    const typeChecker = this.pythonConfig.typeChecker || 'pyright';
    const typeCheckCommand = this.buildTypeCheckCommand(typeChecker, options);

    LoggingUtils.info(`Running Python type checker (${typeChecker})...`);

    try {
      await this.executeCommand(typeCheckCommand, {
        cwd: this.projectPath,
        stdio: 'inherit',
      });
      return true;
    } catch (error) {
      LoggingUtils.error(`Type check execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build type check command based on checker and options
   */
  buildTypeCheckCommand(checker, options) {
    const args = [];

    switch (checker) {
      case 'pyright':
        args.push('pyright');
        if (options.project) args.push('--project', options.project);
        if (options.watch) args.push('--watch');
        if (options.outputjson) args.push('--outputjson');
        break;

      case 'mypy':
        args.push('mypy');
        if (options.config) args.push('--config-file', options.config);
        if (options.package) args.push('--package', options.package);
        if (options.module) args.push('--module', options.module);
        args.push('.');
        break;

      default:
        args.push('pyright');
    }

    return args;
  }

  /**
   * Install Python dependencies
   */
  async installDeps(options = {}) {
    await this.initialize();

    const packageManager = this.pythonConfig.packageManager || 'pip';
    const depsCommand = this.buildDepsCommand(packageManager, options);

    LoggingUtils.info(`Installing Python dependencies with ${packageManager}...`);

    try {
      await this.executeCommand(depsCommand, {
        cwd: this.projectPath,
        stdio: 'inherit',
      });
      return true;
    } catch (error) {
      LoggingUtils.error(`Dependency installation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build dependency installation command
   */
  buildDepsCommand(packageManager, options) {
    const args = [];

    switch (packageManager) {
      case 'pip':
        args.push('pip', 'install');
        if (options.requirements) args.push('-r', options.requirements);
        if (options.upgrade) args.push('--upgrade');
        if (options.dev) args.push('--dev');
        args.push('.');
        break;

      case 'poetry':
        args.push('poetry', 'install');
        if (options.dev) args.push('--dev');
        if (options.noDev) args.push('--no-dev');
        if (options.sync) args.push('--sync');
        break;

      case 'uv':
        args.push('uv', 'pip', 'install');
        if (options.requirements) args.push('-r', options.requirements);
        if (options.upgrade) args.push('--upgrade');
        args.push('.');
        break;

      default:
        args.push('pip', 'install', '.');
    }

    return args;
  }

  /**
   * Run Python security scanning
   */
  async runSecurityScan(options = {}) {
    await this.initialize();

    const securityTools = this.pythonConfig.securityTools || ['bandit', 'safety'];
    const results = [];

    LoggingUtils.info('Running Python security scanning...');

    for (const tool of securityTools) {
      try {
        LoggingUtils.info(`Running ${tool}...`);
        const command = this.buildSecurityCommand(tool, options);
        await this.executeCommand(command, {
          cwd: this.projectPath,
          stdio: 'inherit',
        });
        results.push({ tool, success: true });
      } catch (error) {
        LoggingUtils.warn(`${tool} failed: ${error.message}`);
        results.push({ tool, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Build security scanning command
   */
  buildSecurityCommand(tool, options) {
    const args = [];

    switch (tool) {
      case 'bandit':
        args.push('bandit', '-r', '.');
        if (options.config) args.push('-c', options.config);
        if (options.format) args.push('-f', options.format);
        if (options.output) args.push('-o', options.output);
        break;

      case 'safety':
        args.push('safety', 'check');
        if (options.file) args.push('-r', options.file);
        if (options.fullReport) args.push('--full-report');
        if (options.json) args.push('--json');
        break;

      case 'pip-audit':
        args.push('pip-audit');
        if (options.requirements) args.push('-r', options.requirements);
        if (options.format) args.push('-f', options.format);
        if (options.output) args.push('-o', options.output);
        break;

      default:
        args.push('bandit', '-r', '.');
    }

    return args;
  }

  /**
   * Run Python script or application
   */
  async runScript(options = {}) {
    await this.initialize();

    const script = options.script || 'main.py';
    const runCommand = this.buildRunCommand(script, options);

    LoggingUtils.info(`Running Python script: ${script}`);

    try {
      await this.executeCommand(runCommand, {
        cwd: this.projectPath,
        stdio: 'inherit',
      });
      return true;
    } catch (error) {
      LoggingUtils.error(`Script execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build run command
   */
  buildRunCommand(script, options) {
    const args = ['python', script];

    if (options.args) {
      args.push(...options.args.split(' '));
    }

    return args;
  }

  /**
   * Clean Python build artifacts
   */
  async cleanBuild(options = {}) {
    await this.initialize();

    const cleanCommand = this.buildCleanCommand(options);

    LoggingUtils.info('Cleaning Python build artifacts...');

    try {
      await this.executeCommand(cleanCommand, {
        cwd: this.projectPath,
        stdio: 'inherit',
      });
      return true;
    } catch (error) {
      LoggingUtils.error(`Clean failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build clean command
   */
  buildCleanCommand(options) {
    const args = [];

    // Clean Python cache files
    args.push('find', '.', '-type', 'd', '-name', '__pycache__', '-exec', 'rm', '-rf', '{}', '+');

    // Clean .pyc files
    args.push('&&', 'find', '.', '-type', 'f', '-name', '*.pyc', '-delete');

    // Clean .pyo files
    args.push('&&', 'find', '.', '-type', 'f', '-name', '*.pyo', '-delete');

    // Clean .pyd files
    args.push('&&', 'find', '.', '-type', 'f', '-name', '*.pyd', '-delete');

    // Clean build directories
    args.push('&&', 'find', '.', '-type', 'd', '-name', 'build', '-exec', 'rm', '-rf', '{}', '+');

    // Clean dist directories
    args.push('&&', 'find', '.', '-type', 'd', '-name', 'dist', '-exec', 'rm', '-rf', '{}', '+');

    // Clean egg-info directories
    args.push(
      '&&',
      'find',
      '.',
      '-type',
      'd',
      '-name',
      '*.egg-info',
      '-exec',
      'rm',
      '-rf',
      '{}',
      '+'
    );

    // Clean coverage files
    args.push('&&', 'find', '.', '-type', 'f', '-name', '.coverage', '-delete');
    args.push('&&', 'find', '.', '-type', 'd', '-name', 'htmlcov', '-exec', 'rm', '-rf', '{}', '+');

    return ['sh', '-c', args.join(' ')];
  }

  /**
   * Execute a command with proper error handling
   */
  async executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = Array.isArray(command) ? command : command.split(' ');

      const child = spawn(cmd, args, {
        cwd: options.cwd || this.projectPath,
        stdio: options.stdio || 'pipe',
        shell: options.shell || false,
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
          if (options.stdio !== 'inherit') {
            process.stdout.write(data);
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
          if (options.stdio !== 'inherit') {
            process.stderr.write(data);
          }
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ code, stdout, stderr });
        } else {
          const error = new Error(
            `Command failed with exit code ${code}: ${cmd} ${args.join(' ')}`
          );
          error.code = code;
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get help for Python commands
   */
  getHelp() {
    return `
🐍 Python Commands Help

Available commands via PythonCommandRunner:

1. runTests(options) - Run Python tests
   • testRunner: pytest, unittest, nose
   • Options: file, test, coverage, verbose, quiet, etc.

2. runLint(options) - Run Python linter
   • linter: ruff, flake8, pylint
   • Options: fix, select, ignore, config

3. runFormat(options) - Run Python formatter
   • formatter: ruff, black, autopep8
   • Options: check, diff, config

4. runTypeCheck(options) - Run Python type checker
   • typeChecker: pyright, mypy
   • Options: project, watch, outputjson, config

5. installDeps(options) - Install Python dependencies
   • packageManager: pip, poetry, uv
   • Options: requirements, upgrade, dev, sync

6. runSecurityScan(options) - Run Python security scanning
   • securityTools: bandit, safety, pip-audit
   • Options: config, format, output, file

7. runScript(options) - Run Python script/application
   • script: Python file to run (default: main.py)
   • Options: args

8. cleanBuild(options) - Clean Python build artifacts
   • Removes: __pycache__, *.pyc, build/, dist/, etc.

Configuration:
  • Loads from .opencode/project-config.json
  • Uses pythonConfig section for Python-specific settings
  • Auto-detects tools and project type

Example usage:
  const runner = new PythonCommandRunner();
  await runner.initialize();
  await runner.runTests({ coverage: true, verbose: true });
    `;
  }
}

// Export for use in command files
module.exports = PythonCommandRunner;

// If run directly, show help
if (require.main === module) {
  const runner = new PythonCommandRunner();
  console.log(runner.getHelp());
}
