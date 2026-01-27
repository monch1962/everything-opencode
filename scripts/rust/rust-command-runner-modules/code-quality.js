class CodeQuality {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async clippy(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getRustProjectInfo();
    if (!projectInfo.linters.includes('clippy')) {
      this.loggingUtils.warn('Clippy not installed. Installing...');
      try {
        await this.commandExecutor.executeCargoCommand(['clippy', '--version']);
      } catch (error) {
        this.loggingUtils.error('Failed to install clippy. Run: rustup component add clippy');
        throw error;
      }
    }

    this.loggingUtils.info('🔍 Running clippy linter...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('clippy', args, options);

      this.loggingUtils.info('✅ Clippy linting completed');

      return result;
    } catch (error) {
      this._suggestClippyFix(error.message);
      throw error;
    }
  }

  async fmt(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getRustProjectInfo();
    if (!projectInfo.formatters.includes('rustfmt')) {
      this.loggingUtils.warn('rustfmt not installed. Installing...');
      try {
        await this.commandExecutor.executeCargoCommand(['fmt', '--version']);
      } catch (error) {
        this.loggingUtils.error('Failed to install rustfmt. Run: rustup component add rustfmt');
        throw error;
      }
    }

    this.loggingUtils.info('🎨 Formatting Rust code...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('fmt', args, options);

      this.loggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this._suggestFmtFix(error.message);
      throw error;
    }
  }

  _suggestClippyFix(errorMessage) {
    this.loggingUtils.info('\n💡 Clippy Error Suggestions:');

    if (errorMessage.includes('clippy::')) {
      this.loggingUtils.info('   • Read clippy warning messages');
      this.loggingUtils.info('   • Apply suggested fixes');
      this.loggingUtils.info('   • Use #[allow(clippy::lint_name)] to suppress');
    }

    if (errorMessage.includes('complexity')) {
      this.loggingUtils.info('   • Simplify complex functions');
      this.loggingUtils.info('   • Break large functions into smaller ones');
      this.loggingUtils.info('   • Use helper functions for complex logic');
    }

    if (errorMessage.includes('style')) {
      this.loggingUtils.info('   • Follow Rust naming conventions');
      this.loggingUtils.info('   • Use consistent formatting');
      this.loggingUtils.info('   • Run cargo fmt to fix formatting issues');
    }

    if (errorMessage.includes('performance')) {
      this.loggingUtils.info('   • Avoid unnecessary allocations');
      this.loggingUtils.info('   • Use iterators instead of loops where possible');
      this.loggingUtils.info('   • Consider using references instead of clones');
    }

    if (errorMessage.includes('pedantic')) {
      this.loggingUtils.info('   • Clippy pedantic checks are very strict');
      this.loggingUtils.info('   • Use #[allow(clippy::pedantic)] for specific cases');
      this.loggingUtils.info('   • Consider disabling pedantic checks in CI');
    }
  }

  _suggestFmtFix(errorMessage) {
    this.loggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('rustfmt')) {
      this.loggingUtils.info('   • Install rustfmt: rustup component add rustfmt');
      this.loggingUtils.info('   • Check .rustfmt.toml configuration');
      this.loggingUtils.info('   • Run cargo fmt --check to see issues');
    }

    if (errorMessage.includes('syntax')) {
      this.loggingUtils.info('   • Fix syntax errors before formatting');
      this.loggingUtils.info('   • Check for missing semicolons or braces');
      this.loggingUtils.info('   • Run cargo check to find syntax errors');
    }

    if (errorMessage.includes('diff')) {
      this.loggingUtils.info('   • Formatting changes detected');
      this.loggingUtils.info('   • Run cargo fmt to apply formatting');
      this.loggingUtils.info('   • Review formatting changes before committing');
    }

    if (errorMessage.includes('configuration')) {
      this.loggingUtils.info('   • Check .rustfmt.toml syntax');
      this.loggingUtils.info('   • Reset to defaults: rm .rustfmt.toml');
      this.loggingUtils.info('   • Use rustfmt --config-help to see options');
    }

    if (errorMessage.includes('edition')) {
      this.loggingUtils.info('   • Check Rust edition in Cargo.toml');
      this.loggingUtils.info('   • Update edition: edition = "2021"');
      this.loggingUtils.info('   • Some formatting rules differ by edition');
    }
  }
}

module.exports = CodeQuality;
