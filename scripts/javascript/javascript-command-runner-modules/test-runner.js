const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async test(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getJSProjectInfo();
    let testCommand = 'test';
    let testArgs = args;

    if (projectInfo.hasJestConfig) {
      testCommand = 'jest';
    } else if (this.commandExecutor.runner.detectedTools?.vitest?.installed) {
      testCommand = 'vitest';
    } else if (this.commandExecutor.runner.detectedTools?.mocha?.installed) {
      testCommand = 'mocha';
    }

    if (projectInfo.hasTsConfig && testCommand === 'jest') {
      testArgs = ['--preset', 'ts-jest', ...testArgs];
    }

    this.loggingUtils.info(`🧪 Running tests with ${testCommand}...`);

    try {
      const result = await this.commandExecutor.executeNpmCommand(
        'run',
        [testCommand, ...testArgs],
        options
      );

      this._showTestSummary(projectInfo);

      return result;
    } catch (error) {
      this._suggestTestFix(error.message);
      throw error;
    }
  }

  _showTestSummary(projectInfo) {
    try {
      const coveragePath = path.join(
        this.commandExecutor.runner.projectPath,
        'coverage',
        'coverage-summary.json'
      );

      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const total = coverage.total;

        this.loggingUtils.info('\n📊 Test Coverage Summary:');
        this.loggingUtils.info('='.repeat(40));
        this.loggingUtils.info(`Lines: ${total.lines.pct}%`);
        this.loggingUtils.info(`Statements: ${total.statements.pct}%`);
        this.loggingUtils.info(`Functions: ${total.functions.pct}%`);
        this.loggingUtils.info(`Branches: ${total.branches.pct}%`);
        this.loggingUtils.info('='.repeat(40));
      }
    } catch (error) {}
  }

  _suggestTestFix(errorMessage) {
    this.loggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('command')) {
      this.loggingUtils.info('   • Install test framework: npm install --save-dev jest');
      this.loggingUtils.info('   • Add test script to package.json');
      this.loggingUtils.info('   • Create test files in __tests__ or test directory');
    }

    if (errorMessage.includes('import') || errorMessage.includes('module')) {
      this.loggingUtils.info('   • Check import statements in test files');
      this.loggingUtils.info('   • Configure module resolution in jest.config.js');
      this.loggingUtils.info('   • Use babel-jest for ES6+ syntax');
    }

    if (errorMessage.includes('timeout')) {
      this.loggingUtils.info('   • Increase test timeout in jest.config.js');
      this.loggingUtils.info('   • Use --testTimeout flag for Jest');
      this.loggingUtils.info('   • Check for infinite loops in tests');
    }

    if (errorMessage.includes('snapshot')) {
      this.loggingUtils.info('   • Update snapshots: npm test -- -u');
      this.loggingUtils.info('   • Review snapshot changes before committing');
      this.loggingUtils.info('   • Consider using inline snapshots for smaller tests');
    }

    if (errorMessage.includes('TypeError') || errorMessage.includes('undefined')) {
      this.loggingUtils.info('   • Check test setup and teardown');
      this.loggingUtils.info('   • Mock external dependencies properly');
      this.loggingUtils.info('   • Use beforeEach/afterEach for test isolation');
    }
  }
}

module.exports = TestRunner;
