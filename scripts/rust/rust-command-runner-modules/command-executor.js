const { spawn } = require('child_process');
const { defaultErrorHandler } = require('../../lib/error-handler');

class CommandExecutor {
  constructor(runner, loggingUtils) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
  }

  async executeCargoCommand(command, args = [], options = {}) {
    await this.runner.initialize();

    const allArgs = [command, ...args];
    this.loggingUtils.debug(`Executing: cargo ${allArgs.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('cargo', allArgs, {
        cwd: this.runner.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`cargo ${command} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        this.loggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute cargo ${command}: ${error.message}`));
      });
    });
  }

  _handleCargoError(error, context = {}) {
    const errorInfo = defaultErrorHandler.handleError(error, context);

    this.loggingUtils.error(errorInfo.userMessage);

    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      this.loggingUtils.info('💡 Recovery steps:');
      errorInfo.recoverySteps.forEach((step, i) => {
        this.loggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    this._suggestCargoFix(error.message, context.command);

    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  _suggestCargoFix(errorMessage, _command) {
    this.loggingUtils.info('\n💡 Rust Error Suggestions:');

    if (errorMessage.includes('could not find') || errorMessage.includes('not found')) {
      this.loggingUtils.info('   • Run: cargo build');
      this.loggingUtils.info('   • Check Cargo.toml for correct dependencies');
      this.loggingUtils.info('   • Run: cargo update');
    }

    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      this.loggingUtils.info('   • Fix permissions on target directory');
      this.loggingUtils.info('   • Use cargo clean to clear build artifacts');
      this.loggingUtils.info('   • Check filesystem permissions');
    }

    if (errorMessage.includes('version') || errorMessage.includes('incompatible')) {
      this.loggingUtils.info('   • Update dependencies: cargo update');
      this.loggingUtils.info('   • Check Cargo.toml version constraints');
      this.loggingUtils.info('   • Use cargo tree to see dependency graph');
    }

    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      this.loggingUtils.info('   • Increase memory for Rust compiler');
      this.loggingUtils.info('   • Use cargo build --release for optimized builds');
      this.loggingUtils.info('   • Consider splitting large crates');
    }

    if (errorMessage.includes('borrow') || errorMessage.includes('lifetime')) {
      this.loggingUtils.info('   • Check borrow checker errors');
      this.loggingUtils.info('   • Use Rc or Arc for shared ownership');
      this.loggingUtils.info('   • Consider using references instead of owned values');
    }

    if (errorMessage.includes('linker')) {
      this.loggingUtils.info('   • Check linker configuration');
      this.loggingUtils.info('   • Install required system libraries');
      this.loggingUtils.info('   • Check target triple configuration');
    }

    if (errorMessage.includes('toolchain')) {
      this.loggingUtils.info('   • Install Rust toolchain: rustup install stable');
      this.loggingUtils.info('   • Set default toolchain: rustup default stable');
      this.loggingUtils.info('   • Update Rust: rustup update');
    }
  }
}

module.exports = CommandExecutor;
