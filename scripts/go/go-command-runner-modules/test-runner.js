#!/usr/bin/env node
/**
 * Go Test Runner Module
 *
 * Handles Go testing operations including coverage and advanced test runners
 */

const { spawn } = require('child_process');
const path = require('path');
const { LoggingUtils } = require('../../lib');

class GoTestRunner {
  constructor(projectPath, commandExecutor, goConfig, detectedTools) {
    this.projectPath = projectPath;
    this.commandExecutor = commandExecutor;
    this.goConfig = goConfig;
    this.detectedTools = detectedTools;
  }

  /**
   * Run Go tests
   */
  async test(options = {}) {
    const args = [];

    // Add test flags from config
    if (this.goConfig.testing?.flags) {
      args.push(...this.goConfig.testing.flags);
    }

    // Add coverage
    if (options.coverage || this.goConfig.testing?.coverage?.enabled) {
      args.push('-cover');

      if (options.coverageProfile) {
        args.push('-coverprofile', options.coverageProfile);
      } else {
        args.push('-coverprofile', 'coverage.out');
      }

      if (options.coverageMode) {
        args.push('-covermode', options.coverageMode);
      }
    }

    // Add race detector
    if (options.race) {
      args.push('-race');
    }

    // Add timeout
    if (options.timeout) {
      args.push('-timeout', options.timeout);
    }

    // Add count for repeated tests
    if (options.count) {
      args.push('-count', options.count);
    }

    // Add parallel execution
    if (options.parallel) {
      args.push('-parallel', options.parallel);
    }

    // Add test pattern
    if (options.pattern) {
      args.push(options.pattern);
    } else {
      args.push('./...');
    }

    // Use gotestsum if available
    if (this.detectedTools.gotestsum?.installed && !options.forceGoTest) {
      return this.runTestsWithGotestsum(args, options);
    }

    // Use standard go test
    return this.commandExecutor.executeGoCommand('test', args, options);
  }

  /**
   * Run tests with gotestsum for better output
   */
  async runTestsWithGotestsum(args, options) {
    LoggingUtils.info('📊 Running tests with gotestsum...');

    const gotestsumArgs = ['--'];

    // Remove ./... from args for gotestsum
    const testArgs = args.filter((arg) => arg !== './...');
    gotestsumArgs.push(...testArgs);

    // Add test pattern if specified
    if (options.pattern) {
      gotestsumArgs.push(options.pattern);
    } else {
      gotestsumArgs.push('./...');
    }

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: 'inherit',
      env: { ...process.env, GO111MODULE: 'on' },
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const process = spawn('gotestsum', gotestsumArgs, finalOptions);

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute gotestsum: ${error.message}`));
      });
    });
  }

  /**
   * Generate test coverage report
   */
  async coverage(options = {}) {
    const profileFile = options.profile || 'coverage.out';
    const outputFormat = options.format || 'html';
    const outputFile = options.output || `coverage.${outputFormat}`;

    // Run tests with coverage
    await this.test({
      ...options,
      coverage: true,
      coverageProfile: profileFile,
      forceGoTest: true, // Use go test for coverage
    });

    // Generate coverage report
    const args = [outputFormat];

    if (profileFile) {
      args.push('-o', outputFile);
      args.push(profileFile);
    }

    LoggingUtils.info(`📈 Generating ${outputFormat} coverage report...`);

    try {
      const result = await this.commandExecutor.executeGoCommand('tool', ['cover', ...args]);

      if (result.success && outputFormat === 'html') {
        LoggingUtils.success(`Coverage report generated: ${outputFile}`);
        LoggingUtils.info(
          `   Open in browser: file://${path.resolve(this.projectPath, outputFile)}`
        );
      }

      return result;
    } catch (error) {
      LoggingUtils.error(`Failed to generate coverage report:`, error.message);
      throw error;
    }
  }

  /**
   * Suggest fixes for common test errors
   */
  suggestTestFix(errorMessage) {
    const suggestions = [];

    if (errorMessage.includes('no test files')) {
      suggestions.push('Create test files with _test.go suffix');
      suggestions.push('Check if test files are in the correct directory');
      suggestions.push('Run /go-test with specific test pattern');
    }

    if (errorMessage.includes('undefined')) {
      suggestions.push('Check test function signatures (TestXxx(t *testing.T))');
      suggestions.push('Verify imports in test files');
      suggestions.push('Run /go-build to check for compilation errors first');
    }

    if (errorMessage.includes('timeout')) {
      suggestions.push('Increase test timeout with -timeout flag');
      suggestions.push('Check for infinite loops in tests');
      suggestions.push('Run tests individually to identify slow tests');
    }

    if (errorMessage.includes('race')) {
      suggestions.push('Fix data race conditions');
      suggestions.push('Use proper synchronization (mutex, channels)');
      suggestions.push('Run race detector with -race flag');
    }

    if (suggestions.length > 0) {
      LoggingUtils.info('💡 Test error suggestions:');
      suggestions.forEach((suggestion, i) => {
        LoggingUtils.info(`  ${i + 1}. ${suggestion}`);
      });
    }
  }
}

module.exports = GoTestRunner;
