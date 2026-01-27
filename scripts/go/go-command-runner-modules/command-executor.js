#!/usr/bin/env node
/**
 * Go Command Executor Module
 *
 * Handles core Go command execution with comprehensive error handling
 */

const { exec } = require('child_process');
const os = require('os');
const { defaultErrorHandler } = require('../../lib/error-handler');
const { LoggingUtils } = require('../../lib');

class GoCommandExecutor {
  constructor(projectPath, platformDetector) {
    this.projectPath = projectPath;
    this.platformDetector = platformDetector;
  }

  /**
   * Execute Go command with Go-specific improvements
   */
  async executeGoCommand(command, args = [], options = {}) {
    return this._executeGoCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with comprehensive error handling
   */
  async _executeGoCommandWithErrorHandling(command, args = [], options = {}) {
    const context = {
      tool: 'go',
      command: `go ${command} ${args.join(' ')}`.trim(),
      platform: this.platformDetector.getPlatformName(),
      cwd: this.projectPath,
    };

    try {
      // Ensure critical Go environment variables are set
      const goEnv = {
        ...process.env,
        GO111MODULE: 'on',
      };

      // Set HOME if not set (required for GOCACHE)
      if (!goEnv.HOME) {
        goEnv.HOME = os.homedir();
      }

      // Set GOCACHE if not set
      if (!goEnv.GOCACHE) {
        goEnv.GOCACHE = `${goEnv.HOME}/.cache/go-build`;
      }

      const defaultOptions = {
        cwd: this.projectPath,
        stdio: 'inherit',
        env: goEnv,
        timeout: 300000, // 5 minutes for Go commands
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        // Merge environment objects instead of overwriting
        env: options.env ? { ...defaultOptions.env, ...options.env } : defaultOptions.env,
      };

      LoggingUtils.info(`🚀 Executing: go ${command} ${args.join(' ')}`);

      // Debug: Check if go is in PATH
      if (finalOptions.verbose) {
        LoggingUtils.debug(`🔍 PATH: ${process.env.PATH}`);
        LoggingUtils.debug(
          `🔍 Go executable check: ${exec('which go || echo "go not found"').toString()}`
        );
      }

      return await new Promise((resolve, reject) => {
        // Build the command string with dynamic path to go
        const goPath = this.platformDetector.getToolPath('go', {
          required: true,
          customLocations: [
            // Additional Go installation locations
            '/usr/local/go/bin/go',
            '/usr/lib/go/bin/go',
            'C:\\Go\\bin\\go.exe',
          ],
        });

        const cmd = `${goPath} ${command} ${args.join(' ')}`;
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        exec(cmd, finalOptions, (error, stdout, stderr) => {
          if (error) {
            // Enhance error with additional context
            error.context = context;
            error.command = cmd;
            error.goPath = goPath;
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
   * Check if a Go tool is available
   */
  async checkGoTool(toolName) {
    try {
      const goPath = this.platformDetector.getToolPath(toolName, {
        required: false,
        customLocations: [
          `/usr/local/go/bin/${toolName}`,
          `/usr/lib/go/bin/${toolName}`,
          `C:\\Go\\bin\\${toolName}.exe`,
        ],
      });

      const result = await new Promise((resolve) => {
        exec(`${goPath} version`, (error) => {
          resolve(!error);
        });
      });

      if (!result) {
        LoggingUtils.warn(`⚠️ Go tool '${toolName}' not found or not working`);
        LoggingUtils.info(`Run /go-setup to install '${toolName}'`);
      }

      return result;
    } catch (error) {
      LoggingUtils.error(`Go tool '${toolName}' check failed:`, error.message);
      LoggingUtils.info(`Run /go-setup to install '${toolName}'`);
      throw error;
    }
  }
}

module.exports = GoCommandExecutor;
