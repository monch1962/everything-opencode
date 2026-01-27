class CodeQuality {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async lint(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getJSProjectInfo();
    let lintCommand = 'lint';
    let lintArgs = args;

    if (
      projectInfo.hasEslintConfig ||
      this.commandExecutor.runner.detectedTools?.eslint?.installed
    ) {
      lintCommand = 'eslint';
      lintArgs = ['.', '--ext', '.js,.jsx,.ts,.tsx', ...lintArgs];
    }

    this.loggingUtils.info(`🔍 Running linter with ${lintCommand}...`);

    try {
      const result = await this.commandExecutor.executeNpmCommand(
        'run',
        [lintCommand, ...lintArgs],
        options
      );

      this.loggingUtils.info('✅ Linting completed successfully');

      return result;
    } catch (error) {
      this._suggestLintFix(error.message);
      throw error;
    }
  }

  async format(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getJSProjectInfo();
    let formatCommand = 'format';
    let formatArgs = args;

    if (
      projectInfo.hasPrettierConfig ||
      this.commandExecutor.runner.detectedTools?.prettier?.installed
    ) {
      formatCommand = 'prettier';
      formatArgs = ['--write', '.', ...formatArgs];
    }

    this.loggingUtils.info(`🎨 Formatting code with ${formatCommand}...`);

    try {
      const result = await this.commandExecutor.executeNpmCommand(
        'run',
        [formatCommand, ...formatArgs],
        options
      );

      this.loggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this._suggestFormatFix(error.message);
      throw error;
    }
  }

  async typecheck(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getJSProjectInfo();
    if (!projectInfo.hasTsConfig) {
      throw new Error('TypeScript configuration (tsconfig.json) not found.');
    }

    this.loggingUtils.info(`🔍 Running TypeScript type checking...`);

    try {
      const result = await this.commandExecutor.executeNpmCommand(
        'run',
        ['typecheck', ...args],
        options
      );

      this.loggingUtils.info('✅ Type checking completed successfully');

      return result;
    } catch (error) {
      this._suggestTypeCheckFix(error.message);
      throw error;
    }
  }

  _suggestLintFix(errorMessage) {
    this.loggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('ESLint') || errorMessage.includes('parser')) {
      this.loggingUtils.info('   • Install ESLint: npm install --save-dev eslint');
      this.loggingUtils.info('   • Create .eslintrc.js configuration');
      this.loggingUtils.info('   • Install TypeScript ESLint if using TypeScript');
    }

    if (errorMessage.includes('rule') || errorMessage.includes('configuration')) {
      this.loggingUtils.info('   • Check ESLint rule configuration');
      this.loggingUtils.info('   • Disable problematic rules with // eslint-disable-next-line');
      this.loggingUtils.info('   • Update ESLint to latest version');
    }

    if (errorMessage.includes('import') || errorMessage.includes('module')) {
      this.loggingUtils.info('   • Configure module resolution in ESLint');
      this.loggingUtils.info('   • Install eslint-plugin-import');
      this.loggingUtils.info('   • Check import/export statements');
    }

    if (errorMessage.includes('TypeError') || errorMessage.includes('undefined')) {
      this.loggingUtils.info('   • Check for undefined variables');
      this.loggingUtils.info('   • Add proper TypeScript types');
      this.loggingUtils.info('   • Use optional chaining (?.) for nested properties');
    }
  }

  _suggestFormatFix(errorMessage) {
    this.loggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('Prettier') || errorMessage.includes('parser')) {
      this.loggingUtils.info('   • Install Prettier: npm install --save-dev prettier');
      this.loggingUtils.info('   • Create .prettierrc configuration');
      this.loggingUtils.info('   • Add prettier script to package.json');
    }

    if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {
      this.loggingUtils.info('   • Fix syntax errors before formatting');
      this.loggingUtils.info('   • Check for missing brackets or parentheses');
      this.loggingUtils.info('   • Verify file encoding (UTF-8 recommended)');
    }

    if (errorMessage.includes('ignore') || errorMessage.includes('exclude')) {
      this.loggingUtils.info('   • Create .prettierignore file');
      this.loggingUtils.info('   • Add node_modules, build, dist to ignore list');
      this.loggingUtils.info('   • Use --ignore-path option');
    }

    if (errorMessage.includes('line length') || errorMessage.includes('printWidth')) {
      this.loggingUtils.info('   • Adjust printWidth in .prettierrc');
      this.loggingUtils.info('   • Consider breaking long lines');
      this.loggingUtils.info('   • Use Prettier ignore comments for specific cases');
    }
  }

  _suggestTypeCheckFix(errorMessage) {
    this.loggingUtils.info('\n💡 Type Checking Error Suggestions:');

    if (errorMessage.includes('tsconfig') || errorMessage.includes('configuration')) {
      this.loggingUtils.info('   • Check tsconfig.json syntax and structure');
      this.loggingUtils.info('   • Verify compiler options are valid');
      this.loggingUtils.info('   • Run tsc --init to create new config');
    }

    if (errorMessage.includes('type') || errorMessage.includes('interface')) {
      this.loggingUtils.info('   • Add proper TypeScript type annotations');
      this.loggingUtils.info('   • Check interface definitions');
      this.loggingUtils.info('   • Use type guards for complex types');
    }

    if (errorMessage.includes('module') || errorMessage.includes('import')) {
      this.loggingUtils.info('   • Install missing type definitions: @types/package-name');
      this.loggingUtils.info('   • Configure module resolution in tsconfig.json');
      this.loggingUtils.info('   • Check import statements for correct paths');
    }

    if (errorMessage.includes('strict') || errorMessage.includes('null')) {
      this.loggingUtils.info('   • Use strict null checks: const value = maybeValue!');
      this.loggingUtils.info('   • Add optional chaining: obj?.prop?.nested');
      this.loggingUtils.info('   • Use type assertions when certain: value as Type');
    }
  }
}

module.exports = CodeQuality;
