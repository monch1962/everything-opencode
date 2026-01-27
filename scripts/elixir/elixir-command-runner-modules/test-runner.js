class TestRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async test(options = {}) {
    const args = [];

    if (options.file) {
      args.push(options.file);
    } else if (options.directory) {
      args.push(options.directory);
    }

    if (options.only) {
      args.push('--only', options.only);
    }

    if (options.exclude) {
      args.push('--exclude', options.exclude);
    }

    if (options.seed) {
      args.push('--seed', options.seed);
    }

    if (options.coverage) {
      args.push('--cover');
    }

    if (options.trace) {
      args.push('--trace');
    }

    if (options.maxFailures) {
      args.push('--max-failures', options.maxFailures);
    }

    if (options.timeout) {
      args.push('--timeout', options.timeout);
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    if (options.slowest) {
      args.push('--slowest', options.slowest);
    }

    try {
      const result = await this.commandExecutor.executeMixCommand('test', args, options);

      if (result.success) {
        await this.showTestSummary(options);
      }

      return result;
    } catch (error) {
      this.suggestTestFix(error.message);
      throw error;
    }
  }

  async showTestSummary(options) {
    console.log('\n✅ Tests completed successfully!');

    if (options.coverage) {
      console.log('📊 Coverage report generated in cover/ directory');
    }
  }

  suggestTestFix(errorMessage) {
    this.loggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('assert')) {
      this.loggingUtils.info('   • Check assertion values match expected');
      this.loggingUtils.info('   • Use assert_in_delta for floating point comparisons');
      this.loggingUtils.info('   • Check test setup and teardown');
    }

    if (errorMessage.includes('timeout')) {
      this.loggingUtils.info('   • Increase timeout with --timeout option');
      this.loggingUtils.info('   • Check for infinite loops or long-running operations');
      this.loggingUtils.info('   • Consider using async: false for integration tests');
    }

    if (errorMessage.includes('module not found')) {
      this.loggingUtils.info('   • Ensure test files are in test/ directory');
      this.loggingUtils.info('   • Check test_helper.exs exists and is loaded');
      this.loggingUtils.info('   • Run mix test --no-start to skip application start');
    }

    if (errorMessage.includes('Compilation error')) {
      this.loggingUtils.info('   • Run mix compile first');
      this.loggingUtils.info('   • Check for syntax errors in test files');
      this.loggingUtils.info('   • Ensure all dependencies are available');
    }
  }
}

module.exports = TestRunner;
