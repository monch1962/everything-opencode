const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async test(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    this.loggingUtils.info('🧪 Running Rust tests...');

    try {
      const result = await this.commandExecutor.executeCargoCommand('test', args, options);

      this._showTestSummary();

      return result;
    } catch (error) {
      this._suggestTestFix(error.message);
      throw error;
    }
  }

  _showTestSummary() {
    try {
      const testOutputPath = path.join(
        this.commandExecutor.runner.projectPath,
        'target',
        'debug',
        'deps'
      );
      if (fs.existsSync(testOutputPath)) {
        this.loggingUtils.info('\n📊 Tests completed successfully');

        try {
          const coveragePath = path.join(
            this.commandExecutor.runner.projectPath,
            'target',
            'coverage'
          );
          if (fs.existsSync(coveragePath)) {
            const coverageFiles = fs.readdirSync(coveragePath);
            if (coverageFiles.length > 0) {
              this.loggingUtils.info('📈 Coverage reports available in target/coverage/');
            }
          }
        } catch (error) {}
      }
    } catch (error) {}
  }

  _suggestTestFix(errorMessage) {
    this.loggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('could not compile')) {
      this.loggingUtils.info('   • Fix compilation errors first');
      this.loggingUtils.info('   • Run cargo check to see errors');
      this.loggingUtils.info('   • Check test module declarations');
    }

    if (errorMessage.includes('panicked')) {
      this.loggingUtils.info('   • Check test assertions');
      this.loggingUtils.info('   • Use should_panic for expected panics');
      this.loggingUtils.info('   • Add debug prints to test code');
    }

    if (errorMessage.includes('timeout')) {
      this.loggingUtils.info('   • Increase test timeout');
      this.loggingUtils.info('   • Check for infinite loops in tests');
      this.loggingUtils.info('   • Use --test-threads to control parallelism');
    }

    if (errorMessage.includes('deadlock') || errorMessage.includes('race')) {
      this.loggingUtils.info('   • Check for concurrency issues');
      this.loggingUtils.info('   • Use Mutex or RwLock for shared data');
      this.loggingUtils.info('   • Consider using Arc for thread-safe sharing');
    }

    if (errorMessage.includes('integration')) {
      this.loggingUtils.info('   • Check integration test setup');
      this.loggingUtils.info('   • Ensure tests/integration directory exists');
      this.loggingUtils.info('   • Use #[cfg(test)] for unit tests');
    }

    if (errorMessage.includes('benchmark')) {
      this.loggingUtils.info('   • Install criterion: cargo install cargo-criterion');
      this.loggingUtils.info('   • Use #[bench] attribute for benchmarks');
      this.loggingUtils.info('   • Run with --bench flag');
    }
  }
}

module.exports = TestRunner;
