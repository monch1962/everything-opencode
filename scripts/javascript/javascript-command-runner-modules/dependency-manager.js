class DependencyManager {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async install(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    this.loggingUtils.info(`📦 Installing dependencies...`);

    try {
      const result = await this.commandExecutor.executeNpmCommand('install', args, options);

      this.loggingUtils.info('✅ Dependencies installed successfully');

      return result;
    } catch (error) {
      this._suggestInstallFix(error.message);
      throw error;
    }
  }

  _suggestInstallFix(errorMessage) {
    this.loggingUtils.info('\n💡 Installation Error Suggestions:');

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      this.loggingUtils.info('   • Check internet connection');
      this.loggingUtils.info(
        '   • Use different registry: npm config set registry https://registry.npmjs.org/'
      );
      this.loggingUtils.info('   • Clear npm cache: npm cache clean --force');
    }

    if (errorMessage.includes('peer') || errorMessage.includes('dependency')) {
      this.loggingUtils.info('   • Install peer dependencies manually');
      this.loggingUtils.info('   • Use --legacy-peer-deps flag for npm 7+');
      this.loggingUtils.info('   • Check package.json for version conflicts');
    }

    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      this.loggingUtils.info('   • Fix permissions: sudo chown -R $USER node_modules');
      this.loggingUtils.info('   • Use npm install --unsafe-perm');
      this.loggingUtils.info('   • Install packages globally with sudo or use nvm');
    }

    if (errorMessage.includes('version') || errorMessage.includes('incompatible')) {
      this.loggingUtils.info('   • Update Node.js to compatible version');
      this.loggingUtils.info('   • Check package.json engines field');
      this.loggingUtils.info('   • Use nvm to switch Node.js versions');
    }

    if (errorMessage.includes('git') || errorMessage.includes('repository')) {
      this.loggingUtils.info('   • Check git repository URLs in package.json');
      this.loggingUtils.info('   • Ensure git is installed and accessible');
      this.loggingUtils.info('   • Use SSH keys for private repositories');
    }

    if (errorMessage.includes('checksum') || errorMessage.includes('integrity')) {
      this.loggingUtils.info('   • Clear npm cache: npm cache clean --force');
      this.loggingUtils.info('   • Delete package-lock.json and node_modules');
      this.loggingUtils.info(
        '   • Reinstall: rm -rf node_modules package-lock.json && npm install'
      );
    }
  }
}

module.exports = DependencyManager;
