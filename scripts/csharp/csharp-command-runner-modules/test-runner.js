const path = require('path');

class TestRunner {
  constructor(runner, loggingUtils, platformDetector) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
    this.platformDetector = platformDetector;
  }

  async runTests(args = [], options = {}) {
    await this.runner.initialize();

    // Check for test framework
    const detectedTools = this.runner.detectedTools;
    let testCommand = 'test';
    let testArgs = args;

    // Detect test framework
    if (detectedTools?.xunit?.installed) {
      testCommand = 'xunit';
    } else if (detectedTools?.nunit?.installed) {
      testCommand = 'nunit';
    } else if (detectedTools?.mstest?.installed) {
      testCommand = 'mstest';
    }

    // Add coverage if requested
    if (options.coverage) {
      testArgs = ['--collect:"XPlat Code Coverage"', ...testArgs];
    }

    // Add logger if not specified
    if (!args.some((arg) => arg.includes('--logger'))) {
      testArgs = ['--logger', 'trx', ...testArgs];
    }

    this.loggingUtils.info(`🧪 Running tests with ${testCommand}...`);

    try {
      const result = await this.runner.executeDotnetCommand(testCommand, testArgs, options);

      // Show test summary if available
      this._showTestSummary();

      return result;
    } catch (error) {
      this._suggestTestFix(error.message);
      throw error;
    }
  }

  _showTestSummary() {
    try {
      // Try to read test results if available
      const fs = require('fs');
      const testResultsDir = path.join(this.runner.projectPath, 'TestResults');

      if (fs.existsSync(testResultsDir)) {
        const files = fs.readdirSync(testResultsDir);
        const trxFiles = files.filter((f) => f.endsWith('.trx'));

        if (trxFiles.length > 0) {
          this.loggingUtils.info('\n📊 Test Results Available:');
          this.loggingUtils.info('='.repeat(40));
          trxFiles.forEach((file) => {
            this.loggingUtils.info(`   • ${file}`);
          });
          this.loggingUtils.info('='.repeat(40));
        }
      }

      // Check for coverage
      const coveragePath = path.join(this.runner.projectPath, 'coverage.cobertura.xml');
      if (fs.existsSync(coveragePath)) {
        this.loggingUtils.info('\n📊 Test Coverage Available:');
        this.loggingUtils.info('='.repeat(40));
        this.loggingUtils.info(
          'Run: dotnet reportgenerator -reports:coverage.cobertura.xml -targetdir:coverage'
        );
        this.loggingUtils.info('='.repeat(40));
      }
    } catch (error) {
      // Silently fail - test results are optional
    }
  }

  _suggestTestFix(errorMessage) {
    this.loggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('command')) {
      this.loggingUtils.info('   • Install test framework: dotnet add package xunit');
      this.loggingUtils.info('   • Add test project to solution');
      this.loggingUtils.info('   • Create test files in Tests directory');
    }

    if (errorMessage.includes('assembly') || errorMessage.includes('reference')) {
      this.loggingUtils.info(
        '   • Add project reference: dotnet add reference ../src/Project.csproj'
      );
      this.loggingUtils.info('   • Check .csproj file for missing references');
      this.loggingUtils.info('   • Restore packages: dotnet restore');
    }

    if (errorMessage.includes('test') || errorMessage.includes('Test')) {
      this.loggingUtils.info('   • Ensure test methods are public');
      this.loggingUtils.info('   • Add [Fact] attribute (xUnit) or [Test] attribute (NUnit)');
      this.loggingUtils.info('   • Check test class inheritance');
    }

    if (errorMessage.includes('coverage') || errorMessage.includes('coverlet')) {
      this.loggingUtils.info(
        '   • Install coverlet.collector: dotnet add package coverlet.collector'
      );
      this.loggingUtils.info('   • Use --collect:"XPlat Code Coverage" flag');
      this.loggingUtils.info('   • Install reportgenerator for HTML reports');
    }
  }

  async runSpecificTest(testName, args = [], options = {}) {
    const testArgs = ['--filter', `FullyQualifiedName~${testName}`, ...args];
    return this.runTests(testArgs, options);
  }

  async runTestsWithCoverage(args = [], options = {}) {
    const coverageArgs = ['--collect:"XPlat Code Coverage"', ...args];
    return this.runTests(coverageArgs, options);
  }

  async listTests(args = [], options = {}) {
    const listArgs = ['--list-tests', ...args];

    try {
      const result = await this.runner.executeDotnetCommand('test', listArgs, {
        ...options,
        stdio: 'pipe',
      });

      if (result.stdout) {
        this.loggingUtils.info('\n📋 Available Tests:');
        this.loggingUtils.info('='.repeat(40));
        const lines = result.stdout.split('\n').filter((line) => line.trim());
        lines.forEach((line) => {
          if (line.includes('Test Name:')) {
            this.loggingUtils.info(`   • ${line.replace('Test Name:', '').trim()}`);
          }
        });
        this.loggingUtils.info('='.repeat(40));
      }

      return result;
    } catch (error) {
      this.loggingUtils.error('Failed to list tests:', error.message);
      throw error;
    }
  }
}

module.exports = TestRunner;
