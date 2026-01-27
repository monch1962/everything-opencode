const path = require('path');
const fs = require('fs');

class BuildRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async build(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getRustProjectInfo();
    let buildArgs = args;

    if (options.release) {
      buildArgs = ['--release', ...buildArgs];
    }

    this.loggingUtils.info('🔨 Building Rust project...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('build', buildArgs, options);

      this._showBuildInfo(projectInfo, options.release);

      return result;
    } catch (error) {
      this._suggestBuildFix(error.message);
      throw error;
    }
  }

  async check(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    this.loggingUtils.info('🔍 Checking Rust code...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('check', args, options);

      this.loggingUtils.info('✅ Code check completed successfully');

      return result;
    } catch (error) {
      this._suggestCheckFix(error.message);
      throw error;
    }
  }

  async run(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    let runArgs = args;

    if (options.release) {
      runArgs = ['--release', ...runArgs];
    }

    this.loggingUtils.info('🚀 Running Rust project...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('run', runArgs, options);

      this.loggingUtils.info('✅ Project execution completed');

      return result;
    } catch (error) {
      this._suggestRunFix(error.message);
      throw error;
    }
  }

  _showBuildInfo(projectInfo, isRelease) {
    this.loggingUtils.info('\n📊 Build Information:');
    this.loggingUtils.info('='.repeat(40));
    this.loggingUtils.info(`Build type: ${isRelease ? 'Release' : 'Debug'}`);
    this.loggingUtils.info(`Project type: ${this._getProjectTypeDescription(projectInfo)}`);
    this.loggingUtils.info(`Rust edition: ${projectInfo.edition || '2018'}`);
    this.loggingUtils.info(`Dependencies: ${projectInfo.dependencies}`);
    this.loggingUtils.info(`Dev dependencies: ${projectInfo.devDependencies}`);
    this.loggingUtils.info(`Build dependencies: ${projectInfo.buildDependencies}`);

    if (projectInfo.frameworks.length > 0) {
      this.loggingUtils.info(`Frameworks: ${projectInfo.frameworks.join(', ')}`);
    }

    this.loggingUtils.info('='.repeat(40));
  }

  _getProjectTypeDescription(projectInfo) {
    const types = [];
    if (projectInfo.isBinary) types.push('Binary');
    if (projectInfo.isLibrary) types.push('Library');
    if (projectInfo.isWorkspace) types.push('Workspace');
    return types.length > 0 ? types.join(' + ') : 'Unknown';
  }

  _suggestBuildFix(errorMessage) {
    this.loggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('could not compile')) {
      this.loggingUtils.info('   • Check compiler error messages');
      this.loggingUtils.info('   • Run cargo check for detailed errors');
      this.loggingUtils.info('   • Check Cargo.toml syntax');
    }

    if (errorMessage.includes('linker')) {
      this.loggingUtils.info('   • Check linker configuration');
      this.loggingUtils.info('   • Install required system libraries');
      this.loggingUtils.info('   • Check target triple configuration');
    }

    if (errorMessage.includes('feature')) {
      this.loggingUtils.info('   • Check feature flags in Cargo.toml');
      this.loggingUtils.info('   • Enable required features');
      this.loggingUtils.info('   • Check dependency feature requirements');
    }

    if (errorMessage.includes('target')) {
      this.loggingUtils.info('   • Check target configuration');
      this.loggingUtils.info('   • Install target: rustup target add <target>');
      this.loggingUtils.info('   • Set target in .cargo/config.toml');
    }
  }

  _suggestCheckFix(errorMessage) {
    this.loggingUtils.info('\n💡 Check Error Suggestions:');

    if (errorMessage.includes('type mismatch')) {
      this.loggingUtils.info('   • Check function signatures');
      this.loggingUtils.info('   • Verify type annotations');
      this.loggingUtils.info('   • Use type inference where possible');
    }

    if (errorMessage.includes('unused')) {
      this.loggingUtils.info('   • Remove unused imports/variables');
      this.loggingUtils.info('   • Add #[allow(unused)] attribute if needed');
      this.loggingUtils.info('   • Check for dead code');
    }

    if (errorMessage.includes('cannot move')) {
      this.loggingUtils.info('   • Check ownership and borrowing');
      this.loggingUtils.info('   • Use references (&) instead of moving');
      this.loggingUtils.info('   • Consider using Clone or Copy traits');
    }

    if (errorMessage.includes('trait bound')) {
      this.loggingUtils.info('   • Check trait implementations');
      this.loggingUtils.info('   • Add required trait bounds');
      this.loggingUtils.info('   • Use where clauses for complex bounds');
    }
  }

  _suggestRunFix(errorMessage) {
    this.loggingUtils.info('\n💡 Run Error Suggestions:');

    if (errorMessage.includes('not found')) {
      this.loggingUtils.info('   • Build project first: cargo build');
      this.loggingUtils.info('   • Check binary name in Cargo.toml');
      this.loggingUtils.info('   • Run with --bin flag for workspace projects');
    }

    if (errorMessage.includes('permission')) {
      this.loggingUtils.info('   • Check executable permissions');
      this.loggingUtils.info('   • Run chmod +x on binary');
      this.loggingUtils.info('   • Check antivirus/firewall settings');
    }

    if (errorMessage.includes('argument')) {
      this.loggingUtils.info('   • Check command line arguments');
      this.loggingUtils.info('   • Use -- to separate cargo args from program args');
      this.loggingUtils.info('   • Check argument parsing in main function');
    }
  }
}

module.exports = BuildRunner;
