#!/usr/bin/env node
/**
 * Python Core Executor Module for PythonCommandRunner
 *
 * Core Python execution methods: executeCommand, _executeCommandWithErrorHandling, executePythonModule
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { defaultErrorHandler } = require('../../lib/error-handler');
const { LoggingUtils } = require('../../lib');

class PythonCoreExecutor {
  constructor(projectPath, pythonConfig, projectAnalyzer) {
    this.projectPath = projectPath;
    this.pythonConfig = pythonConfig;
    this.projectAnalyzer = projectAnalyzer;
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
    const python = this.projectAnalyzer.getPythonExecutable();
    return this.executeCommand(python, ['-m', module, ...args], options);
  }

  /**
   * Execute Python script
   */
  async executePythonScript(scriptPath, args = [], options = {}) {
    const python = this.projectAnalyzer.getPythonExecutable();
    return this.executeCommand(python, [scriptPath, ...args], options);
  }

  /**
   * Execute pip command
   */
  async executePipCommand(args = [], options = {}) {
    const python = this.projectAnalyzer.getPythonExecutable();
    return this.executePythonModule('pip', args, options);
  }

  /**
   * Execute with virtual environment if available
   */
  async executeWithVenv(command, args = [], options = {}) {
    // Check for virtual environment
    const venvPath = path.join(this.projectPath, 'venv');
    const poetryEnv = this.pythonConfig.tools?.poetry?.installed;
    const pipenvEnv = this.pythonConfig.tools?.pipenv?.installed;

    let envCommand = command;
    let envArgs = args;

    if (fs.existsSync(venvPath)) {
      // Use virtual environment
      const venvBin = path.join(venvPath, process.platform === 'win32' ? 'Scripts' : 'bin');
      envCommand = path.join(venvBin, command);
    } else if (poetryEnv) {
      // Use poetry run
      envArgs = ['run', command, ...args];
      envCommand = 'poetry';
    } else if (pipenvEnv) {
      // Use pipenv run
      envArgs = ['run', command, ...args];
      envCommand = 'pipenv';
    }

    return this.executeCommand(envCommand, envArgs, options);
  }

  /**
   * Get execution environment info
   */
  getExecutionEnvironment() {
    const python = this.projectAnalyzer.getPythonExecutable();
    const venvExists = fs.existsSync(path.join(this.projectPath, 'venv'));
    const poetryInstalled = this.pythonConfig.tools?.poetry?.installed;
    const pipenvInstalled = this.pythonConfig.tools?.pipenv?.installed;

    return {
      python,
      venvExists,
      poetryInstalled,
      pipenvInstalled,
      projectPath: this.projectPath,
      pythonVersion: this.projectAnalyzer.getPythonVersion(),
    };
  }
}

module.exports = PythonCoreExecutor;
