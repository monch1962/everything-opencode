class DependencyManager {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async deps(command, options = {}) {
    const args = [];

    let mixCommand = 'deps';

    const subcommandsWithDot = ['get', 'update', 'clean', 'compile', 'unlock', 'tree'];
    if (subcommandsWithDot.includes(command)) {
      mixCommand = `deps.${command}`;
    } else {
      args.push(command);
    }

    if (options.package) {
      args.push(options.package);
    }

    if (options.only) {
      args.push('--only', options.only);
    }

    if (options.lock) {
      args.push('--lock');
    }

    if (options.unlock) {
      args.push('--unlock');
    }

    if (options.checkUnlock) {
      args.push('--check-unlock');
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    try {
      return await this.commandExecutor.executeMixCommand(mixCommand, args, options);
    } catch (error) {
      this.suggestDepsFix(error.message);
      throw error;
    }
  }

  suggestDepsFix(errorMessage) {
    this.loggingUtils.info('\n💡 Dependency Error Suggestions:');

    if (errorMessage.includes('mix.exs')) {
      this.loggingUtils.info('   • Check mix.exs file syntax');
      this.loggingUtils.info('   • Verify dependency names and versions');
      this.loggingUtils.info('   • Ensure hex package registry is accessible');
    }

    if (errorMessage.includes('not found')) {
      this.loggingUtils.info('   • Package may not exist on hex.pm');
      this.loggingUtils.info('   • Check package name spelling');
      this.loggingUtils.info('   • Try mix hex.search <package> to find correct name');
    }

    if (errorMessage.includes('version conflict')) {
      this.loggingUtils.info('   • Check mix.lock for version conflicts');
      this.loggingUtils.info('   • Run mix deps.update --all to update all dependencies');
      this.loggingUtils.info('   • Use mix deps.unlock to remove lock constraints');
    }

    if (errorMessage.includes('git')) {
      this.loggingUtils.info('   • Git dependencies need proper git setup');
      this.loggingUtils.info('   • Check git repository URLs');
      this.loggingUtils.info('   • Ensure git is installed and accessible');
    }

    if (errorMessage.includes('hex')) {
      this.loggingUtils.info('   • Hex package manager may need setup');
      this.loggingUtils.info('   • Run mix local.hex to install hex');
      this.loggingUtils.info('   • Check hex.pm connectivity');
    }
  }
}

module.exports = DependencyManager;
