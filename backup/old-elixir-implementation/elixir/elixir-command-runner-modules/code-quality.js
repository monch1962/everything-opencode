class CodeQuality {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async format(options = {}) {
    const args = [];

    if (options.check) {
      args.push('--check-formatted');
    }

    if (options.dryRun) {
      args.push('--dry-run');
    }

    if (options.files) {
      args.push(...options.files.split(','));
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    try {
      return await this.commandExecutor.executeMixCommand('format', args, options);
    } catch (error) {
      this.suggestFormatFix(error.message);
      throw error;
    }
  }

  async lint(options = {}) {
    const args = [];

    if (options.strict) {
      args.push('--strict');
    }

    if (options.all) {
      args.push('--all');
    }

    if (options.allPriorities) {
      args.push('--all-priorities');
    }

    if (options.format) {
      args.push('--format', options.format);
    }

    if (options.config) {
      args.push('--config', options.config);
    }

    if (options.files) {
      args.push(...options.files.split(','));
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    try {
      return await this.commandExecutor.executeMixCommand('credo', args, options);
    } catch (error) {
      this.suggestLintFix(error.message);
      throw error;
    }
  }

  async typecheck(options = {}) {
    const args = [];

    if (options.noCheck) {
      args.push('--no-check');
    }

    if (options.warnings) {
      args.push('--warnings', options.warnings);
    }

    if (options.format) {
      args.push('--format', options.format);
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    try {
      return await this.commandExecutor.executeMixCommand('dialyzer', args, options);
    } catch (error) {
      this.suggestTypecheckFix(error.message);
      throw error;
    }
  }

  suggestFormatFix(errorMessage) {
    this.loggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('check-formatted')) {
      this.loggingUtils.info('   • Files are not properly formatted');
      this.loggingUtils.info('   • Run mix format without --check-formatted to fix');
      this.loggingUtils.info('   • Check .formatter.exs configuration');
    }

    if (errorMessage.includes('syntax error')) {
      this.loggingUtils.info('   • Fix syntax errors before formatting');
      this.loggingUtils.info('   • Check for missing commas, parentheses, or do/end blocks');
      this.loggingUtils.info('   • Verify Elixir version compatibility');
    }

    if (errorMessage.includes('file not found')) {
      this.loggingUtils.info('   • Check file paths are correct');
      this.loggingUtils.info('   • Ensure files exist in project directory');
      this.loggingUtils.info('   • Use relative paths from project root');
    }
  }

  suggestLintFix(errorMessage) {
    this.loggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('Credo')) {
      this.loggingUtils.info('   • Install Credo: mix archive.install hex credo');
      this.loggingUtils.info('   • Check .credo.exs configuration file');
      this.loggingUtils.info('   • Run mix credo --help for available options');
    }

    if (errorMessage.includes('warning')) {
      this.loggingUtils.info('   • Review warnings in context');
      this.loggingUtils.info('   • Use --strict for stricter checks');
      this.loggingUtils.info('   • Consider fixing high-priority issues first');
    }

    if (errorMessage.includes('configuration')) {
      this.loggingUtils.info('   • Check .credo.exs syntax');
      this.loggingUtils.info('   • Verify check configurations');
      this.loggingUtils.info('   • Ensure consistent code style rules');
    }
  }

  suggestTypecheckFix(errorMessage) {
    this.loggingUtils.info('\n💡 Type Checking Error Suggestions:');

    if (errorMessage.includes('Dialyzer')) {
      this.loggingUtils.info('   • Install Dialyzer: mix archive.install hex dialyxir');
      this.loggingUtils.info('   • Build PLT first: mix dialyzer --plt');
      this.loggingUtils.info('   • Check dialyzer.ignore-warnings file');
    }

    if (errorMessage.includes('type mismatch')) {
      this.loggingUtils.info('   • Check function signatures match specifications');
      this.loggingUtils.info('   • Review @spec annotations');
      this.loggingUtils.info('   • Use dialyzer.ignore-warnings for false positives');
    }

    if (errorMessage.includes('undefined function')) {
      this.loggingUtils.info('   • Ensure all functions are defined or imported');
      this.loggingUtils.info('   • Check module dependencies');
      this.loggingUtils.info('   • Verify function arity matches');
    }
  }
}

module.exports = CodeQuality;
