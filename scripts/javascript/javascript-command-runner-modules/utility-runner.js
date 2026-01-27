class UtilityRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async clean(options = {}) {
    const args = [];

    if (options.all) {
      args.push('--all');
    }

    if (options.deps) {
      args.push('--deps');
    }

    if (options.build) {
      args.push('--build');
    }

    return await this.commandExecutor.executeNpmCommand('run', ['clean', ...args], options);
  }

  async run(script, args = [], options = {}) {
    const allArgs = [script, ...args];
    return await this.commandExecutor.executeNpmCommand('run', allArgs, options);
  }

  async getProjectInfo() {
    try {
      const version = await this.commandExecutor.executeNpmCommand('--version', [], {
        stdio: 'pipe',
      });
      const deps = await this.commandExecutor.executeNpmCommand('list', [], { stdio: 'pipe' });

      return {
        npmVersion: version.stdout?.trim() || 'unknown',
        dependencies: deps.stdout || 'No dependencies listed',
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  _showBuildInfo(projectInfo) {
    this.loggingUtils.info('\n📊 Build Information:');
    this.loggingUtils.info('='.repeat(40));
    this.loggingUtils.info(`JavaScript files: ${projectInfo.jsFiles}`);
    this.loggingUtils.info(`TypeScript files: ${projectInfo.tsFiles}`);
    this.loggingUtils.info(`Has TypeScript: ${projectInfo.hasTsConfig ? 'Yes' : 'No'}`);
    this.loggingUtils.info(`Has ESLint: ${projectInfo.hasEslintConfig ? 'Yes' : 'No'}`);
    this.loggingUtils.info(`Has Prettier: ${projectInfo.hasPrettierConfig ? 'Yes' : 'No'}`);
    this.loggingUtils.info('='.repeat(40));
  }
}

module.exports = UtilityRunner;
