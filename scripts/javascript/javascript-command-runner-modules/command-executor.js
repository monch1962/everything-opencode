const { spawn } = require('child_process');
const { defaultErrorHandler } = require('../../lib/error-handler');

class CommandExecutor {
  constructor(runner, loggingUtils, platformDetector) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
    this.platformDetector = platformDetector;
  }

  async executeNpmCommand(command, args = [], options = {}) {
    return this._executeNpmCommandWithErrorHandling(command, args, options);
  }

  async _executeNpmCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      await this.runner.initialize();

      this.runner.checkTool('npm', true);

      const defaultOptions = {
        cwd: this.runner.projectPath,
        stdio: 'inherit',
        shell: true,
        env: process.env,
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        env: options.env ? { ...defaultOptions.env, ...options.env } : defaultOptions.env,
      };

      this.loggingUtils.info(`🚀 Executing: npm ${command} ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        const npmPath = this.platformDetector.getToolPath('npm', {
          required: true,
        });

        const cmd = `${npmPath} ${command} ${args.join(' ')}`;
        this.loggingUtils.debug(`🔍 Executing: ${cmd}`);
        this.loggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        this.loggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        const child = spawn(npmPath, [command, ...args], finalOptions);

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`npm ${command} failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          this.loggingUtils.debug(`🔍 Exec error: ${error.message}`);
          reject(new Error(`Failed to execute npm ${command}: ${error.message}`));
        });
      });
    } catch (error) {
      return this._handleNpmError(error, { command, args, options });
    }
  }

  _handleNpmError(error, context = {}) {
    const errorInfo = defaultErrorHandler.handleError(error, context);

    this.loggingUtils.error(errorInfo.userMessage);

    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      this.loggingUtils.info('💡 Recovery steps:');
      errorInfo.recoverySteps.forEach((step, i) => {
        this.loggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    this._suggestNpmFix(error.message, context.command);

    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  _suggestNpmFix(errorMessage, _command) {
    this.loggingUtils.info('\n💡 JavaScript/TypeScript Error Suggestions:');

    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      this.loggingUtils.info('   • Run: npm install');
      this.loggingUtils.info('   • Check package.json for correct dependencies');
      this.loggingUtils.info('   • Verify node_modules directory exists');
    }

    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      this.loggingUtils.info('   • Fix permissions: sudo chown -R $USER node_modules');
      this.loggingUtils.info('   • Or use: npm install --unsafe-perm');
      this.loggingUtils.info('   • Consider using nvm for better permission management');
    }

    if (errorMessage.includes('version') || errorMessage.includes('incompatible')) {
      this.loggingUtils.info('   • Update packages: npm update');
      this.loggingUtils.info('   • Check package.json version constraints');
      this.loggingUtils.info('   • Clear cache: npm cache clean --force');
    }

    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      this.loggingUtils.info('   • Increase memory: export NODE_OPTIONS=--max-old-space-size=4096');
      this.loggingUtils.info('   • Close other applications using memory');
      this.loggingUtils.info('   • Consider using --no-optional flag');
    }

    if (errorMessage.includes('script') || errorMessage.includes('missing')) {
      this.loggingUtils.info('   • Check package.json scripts section');
      this.loggingUtils.info('   • Verify script name is correct');
      this.loggingUtils.info('   • Run npm run to see available scripts');
    }

    if (errorMessage.includes('typescript') || errorMessage.includes('tsc')) {
      this.loggingUtils.info('   • Install TypeScript: npm install -D typescript');
      this.loggingUtils.info('   • Check tsconfig.json configuration');
      this.loggingUtils.info('   • Run tsc --init to create config if missing');
    }
  }
}

module.exports = CommandExecutor;
