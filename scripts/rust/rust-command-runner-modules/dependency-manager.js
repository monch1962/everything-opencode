class DependencyManager {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async update(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    this.loggingUtils.info('📦 Updating Rust dependencies...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('update', args, options);

      this.loggingUtils.info('✅ Dependencies updated successfully');

      return result;
    } catch (error) {
      this._suggestUpdateFix(error.message);
      throw error;
    }
  }

  _suggestUpdateFix(errorMessage) {
    this.loggingUtils.info('\n💡 Update Error Suggestions:');

    if (errorMessage.includes('network')) {
      this.loggingUtils.info('   • Check internet connection');
      this.loggingUtils.info('   • Check crates.io accessibility');
      this.loggingUtils.info('   • Use cargo update --offline if available');
    }

    if (errorMessage.includes('version conflict')) {
      this.loggingUtils.info('   • Check Cargo.lock for conflicts');
      this.loggingUtils.info('   • Use cargo tree to see dependency graph');
      this.loggingUtils.info('   • Consider using cargo update --precise');
    }

    if (errorMessage.includes('git')) {
      this.loggingUtils.info('   • Check git repository URLs');
      this.loggingUtils.info('   • Ensure git is installed and accessible');
      this.loggingUtils.info('   • Use SSH keys for private repositories');
    }

    if (errorMessage.includes('checksum')) {
      this.loggingUtils.info('   • Clear cargo cache: cargo cache --autoclean');
      this.loggingUtils.info('   • Delete Cargo.lock and target directory');
      this.loggingUtils.info('   • Reinstall: rm -rf Cargo.lock target && cargo update');
    }

    if (errorMessage.includes('feature')) {
      this.loggingUtils.info('   • Check feature flags in dependencies');
      this.loggingUtils.info('   • Update feature specifications in Cargo.toml');
      this.loggingUtils.info('   • Use cargo update --package <name> --precise <version>');
    }

    if (errorMessage.includes('registry')) {
      this.loggingUtils.info('   • Check cargo registry configuration');
      this.loggingUtils.info('   • Use alternative registry if needed');
      this.loggingUtils.info('   • Configure registry in .cargo/config.toml');
    }
  }
}

module.exports = DependencyManager;
