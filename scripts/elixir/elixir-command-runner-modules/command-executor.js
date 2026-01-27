#!/usr/bin/env node
/**
 * Elixir Command Executor Module
 *
 * Handles core Mix command execution with comprehensive error handling
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const { defaultErrorHandler } = require('../../lib/error-handler');
const { FileUtils, LoggingUtils } = require('../../lib');

class ElixirCommandExecutor {
  constructor(projectPath, platformDetector) {
    this.projectPath = projectPath;
    this.platformDetector = platformDetector;
  }

  /**
   * Find Elixir files in the project
   */
  findElixirFiles(pattern = '**/*.{ex,exs}', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: 'elixir',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find Elixir files:', error.message);
      return [];
    }
  }

  /**
   * Get Elixir project metadata
   */
  getElixirProjectInfo() {
    try {
      const info = {
        hasMixExs: fs.existsSync(path.join(this.projectPath, 'mix.exs')),
        hasMixLock: fs.existsSync(path.join(this.projectPath, 'mix.lock')),
        hasConfig: fs.existsSync(path.join(this.projectPath, 'config')),
        hasLib: fs.existsSync(path.join(this.projectPath, 'lib')),
        hasTest: fs.existsSync(path.join(this.projectPath, 'test')),
        elixirFiles: this.findElixirFiles().length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug('Failed to get Elixir project info:', error.message);
      return null;
    }
  }

  /**
   * Execute Mix command with Elixir-specific improvements
   */
  async executeMixCommand(command, args = [], options = {}) {
    return this._executeMixCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with comprehensive error handling
   */
  async _executeMixCommandWithErrorHandling(command, args = [], options = {}) {
    const context = {
      tool: 'elixir',
      command: `mix ${command} ${args.join(' ')}`.trim(),
      platform: this.platformDetector.getPlatformName(),
      cwd: this.projectPath,
    };

    try {
      // Ensure critical Elixir environment variables are set
      const elixirEnv = {
        ...process.env,
        MIX_ENV: options.env || process.env.MIX_ENV || 'dev',
        MIX_QUIET: '1',
      };

      // Set HOME if not set
      if (!elixirEnv.HOME) {
        elixirEnv.HOME = os.homedir();
      }

      const defaultOptions = {
        cwd: this.projectPath,
        stdio: 'inherit',
        env: elixirEnv,
        timeout: 300000, // 5 minutes for Elixir commands
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        // Merge environment objects instead of overwriting
        env: options.env ? { ...defaultOptions.env, ...options.env } : defaultOptions.env,
      };

      LoggingUtils.info(`🚀 Executing: mix ${command} ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        // Build the command string with dynamic path to mix
        const mixPath = this.platformDetector.getToolPath('mix', {
          required: true,
          customLocations: [
            // Additional Elixir installation locations
            '/usr/local/bin/mix',
            '/usr/bin/mix',
            'C:\\Program Files\\Elixir\\bin\\mix.bat',
          ],
        });

        const cmd = `${mixPath} ${command} ${args.join(' ')}`;
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(`🔍 MIX_ENV: ${finalOptions.env?.MIX_ENV}`);
        LoggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        exec(cmd, finalOptions, (error, stdout, stderr) => {
          if (error) {
            // Enhance error with additional context
            error.context = context;
            error.command = cmd;
            error.mixPath = mixPath;
            reject(error);
          } else {
            resolve({
              success: error ? false : true,
              code: error ? error.code : 0,
              stdout,
              stderr,
            });
          }
        });
      });
    } catch (error) {
      // Handle error with comprehensive error handler
      const errorInfo = defaultErrorHandler.handleError(error, context);

      // Log user-friendly message using LoggingUtils
      LoggingUtils.error(errorInfo.userMessage);

      // Log recovery steps using LoggingUtils
      if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
        LoggingUtils.info('💡 Recovery steps:');
        errorInfo.recoverySteps.forEach((step, i) => {
          LoggingUtils.info(`  ${i + 1}. ${step}`);
        });
      }

      // Re-throw with enhanced error information
      const enhancedError = new Error(errorInfo.userMessage);
      enhancedError.originalError = error;
      enhancedError.errorInfo = errorInfo;
      throw enhancedError;
    }
  }

  /**
   * Check if an Elixir tool is available
   */
  async checkElixirTool(toolName) {
    try {
      const toolPath = this.platformDetector.getToolPath(toolName, {
        required: false,
        customLocations: [
          `/usr/local/bin/${toolName}`,
          `/usr/bin/${toolName}`,
          `C:\\Program Files\\Elixir\\bin\\${toolName}.bat`,
        ],
      });

      const result = await new Promise((resolve) => {
        exec(`${toolPath} --version`, (error) => {
          resolve(!error);
        });
      });

      if (!result) {
        LoggingUtils.warn(`⚠️ Elixir tool '${toolName}' not found or not working`);
        LoggingUtils.info(`Run /elixir-setup to install '${toolName}'`);
      }

      return result;
    } catch (error) {
      LoggingUtils.error(`Elixir tool '${toolName}' check failed:`, error.message);
      LoggingUtils.info(`Run /elixir-setup to install '${toolName}'`);
      throw error;
    }
  }
}

module.exports = ElixirCommandExecutor;
