const path = require('path');
const fs = require('fs');

class UtilityRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async doc(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    this.loggingUtils.info('📚 Generating Rust documentation...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('doc', args, options);

      const docPath = path.join(this.commandExecutor.runner.projectPath, 'target', 'doc');
      if (fs.existsSync(docPath)) {
        this.loggingUtils.info(`📖 Documentation generated at: ${docPath}`);
        this.loggingUtils.info(`   Open: file://${docPath}/index.html`);
      }

      return result;
    } catch (error) {
      this._suggestDocFix(error.message);
      throw error;
    }
  }

  async clean(options = {}) {
    const args = [];

    if (options.all) {
      args.push('--all');
    }

    if (options.release) {
      args.push('--release');
    }

    this.loggingUtils.info('🧹 Cleaning Rust build artifacts...');

    return await this.commandExecutor.executeCargoCommand('clean', args, options);
  }

  async getProjectInfo() {
    try {
      const rustcVersion = await this.commandExecutor.executeCargoCommand('--version', [], {
        stdio: 'pipe',
      });
      const cargoVersion = await this.commandExecutor.executeCargoCommand('--version', [], {
        stdio: 'pipe',
      });

      return {
        rustcVersion: rustcVersion.stdout?.trim() || 'unknown',
        cargoVersion: cargoVersion.stdout?.trim() || 'unknown',
        projectInfo: this.commandExecutor.runner.getRustProjectInfo(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  _suggestDocFix(errorMessage) {
    this.loggingUtils.info('\n💡 Documentation Error Suggestions:');

    if (errorMessage.includes('rustdoc')) {
      this.loggingUtils.info('   • Install rustdoc: rustup component add rust-docs');
      this.loggingUtils.info('   • Check Rust documentation toolchain');
      this.loggingUtils.info('   • Run cargo doc --open to view documentation');
    }

    if (errorMessage.includes('private')) {
      this.loggingUtils.info('   • Use --document-private-items flag');
      this.loggingUtils.info('   • Check visibility modifiers (pub vs private)');
      this.loggingUtils.info('   • Use pub(crate) for internal visibility');
    }

    if (errorMessage.includes('link')) {
      this.loggingUtils.info('   • Check documentation links');
      this.loggingUtils.info('   • Use /// for doc comments');
      this.loggingUtils.info('   • Check markdown syntax in doc comments');
    }

    if (errorMessage.includes('theme')) {
      this.loggingUtils.info('   • Check documentation theme configuration');
      this.loggingUtils.info('   • Use --theme to specify custom theme');
      this.loggingUtils.info('   • Check .rustdoc.toml configuration');
    }
  }
}

module.exports = UtilityRunner;
