#!/usr/bin/env node
/**
 * Go Utility Runner Module
 *
 * Handles utility operations: benchmarking, documentation, and cleanup
 */

const { spawn } = require('child_process');
const { LoggingUtils } = require('../../lib');

class GoUtilityRunner {
  constructor(projectPath, commandExecutor, detectedTools) {
    this.projectPath = projectPath;
    this.commandExecutor = commandExecutor;
    this.detectedTools = detectedTools;
  }

  /**
   * Run Go benchmarks
   */
  async benchmark(options = {}) {
    const args = ['-bench', '.'];

    // Add benchmark time
    if (options.time) {
      args.push('-benchtime', options.time);
    }

    // Add count for repeated benchmarks
    if (options.count) {
      args.push('-count', options.count);
    }

    // Add CPU profile
    if (options.cpuprofile) {
      args.push('-cpuprofile', options.cpuprofile);
    }

    // Add memory profile
    if (options.memprofile) {
      args.push('-memprofile', options.memprofile);
    }

    // Add block profile
    if (options.blockprofile) {
      args.push('-blockprofile', options.blockprofile);
    }

    // Add mutex profile
    if (options.mutexprofile) {
      args.push('-mutexprofile', options.mutexprofile);
    }

    // Add trace
    if (options.trace) {
      args.push('-trace', options.trace);
    }

    // Add pattern
    if (options.pattern) {
      args.push(options.pattern);
    } else {
      args.push('./...');
    }

    LoggingUtils.info('⚡ Running benchmarks...');

    try {
      const result = await this.commandExecutor.executeGoCommand('test', args, options);

      if (result.success) {
        LoggingUtils.success('Benchmarks completed');

        // Show profile information if generated
        if (
          options.cpuprofile ||
          options.memprofile ||
          options.blockprofile ||
          options.mutexprofile ||
          options.trace
        ) {
          LoggingUtils.info('📊 Profiles generated:');
          if (options.cpuprofile) LoggingUtils.info(`  • CPU: ${options.cpuprofile}`);
          if (options.memprofile) LoggingUtils.info(`  • Memory: ${options.memprofile}`);
          if (options.blockprofile) LoggingUtils.info(`  • Block: ${options.blockprofile}`);
          if (options.mutexprofile) LoggingUtils.info(`  • Mutex: ${options.mutexprofile}`);
          if (options.trace) LoggingUtils.info(`  • Trace: ${options.trace}`);

          LoggingUtils.info('   Use go tool pprof to analyze profiles');
        }
      }

      return result;
    } catch (error) {
      LoggingUtils.error('Benchmark failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate Go documentation
   */
  async generateDocs(options = {}) {
    // Use godoc if available
    if (this.detectedTools.godoc?.installed) {
      return this._generateDocsWithGodoc(options);
    }

    // Fallback to go doc
    LoggingUtils.info('Using go doc (install godoc for better documentation)');
    return this.commandExecutor.executeGoCommand(
      'doc',
      options.package ? [options.package] : ['./...'],
      options
    );
  }

  /**
   * Generate documentation with godoc
   */
  async _generateDocsWithGodoc(options = {}) {
    LoggingUtils.info('📚 Generating documentation with godoc...');

    const args = [];

    // Add package
    if (options.package) {
      args.push(options.package);
    } else {
      args.push('./...');
    }

    // Add HTML output
    if (options.html) {
      args.push('-html');
    }

    // Add source code
    if (options.src) {
      args.push('-src');
    }

    // Add short format
    if (options.short) {
      args.push('-short');
    }

    // Add syntax highlighting
    if (options.synopsis) {
      args.push('-synopsis');
    }

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: 'inherit',
      env: { ...process.env, GO111MODULE: 'on' },
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Debug: Check environment variables
    if (finalOptions.verbose) {
      LoggingUtils.debug(`🔍 finalOptions.cwd: ${finalOptions.cwd}`);
      LoggingUtils.debug(`🔍 finalOptions.env.GO111MODULE: ${finalOptions.env?.GO111MODULE}`);
      LoggingUtils.debug(`🔍 finalOptions.env.GOCACHE: ${finalOptions.env?.GOCACHE}`);
    }

    return new Promise((resolve, reject) => {
      const process = spawn('godoc', args, finalOptions);

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject(new Error(`godoc failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute godoc: ${error.message}`));
      });
    });
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    const args = [];

    if (options.cache) {
      args.push('-cache');
    }

    if (options.testcache) {
      args.push('-testcache');
    }

    if (options.modcache) {
      args.push('-modcache');
    }

    LoggingUtils.info('🧹 Cleaning build artifacts...');

    return this.commandExecutor.executeGoCommand('clean', args, options);
  }

  /**
   * Suggest fixes for common utility errors
   */
  suggestUtilityFix(errorMessage) {
    const suggestions = [];

    if (errorMessage.includes('benchmark')) {
      suggestions.push('Check benchmark function signatures (BenchmarkXxx(b *testing.B))');
      suggestions.push('Ensure benchmark functions are in _test.go files');
      suggestions.push('Run with -benchtime flag to control duration');
    }

    if (errorMessage.includes('documentation')) {
      suggestions.push('Add GoDoc comments to exported functions and types');
      suggestions.push('Use proper GoDoc format: // FunctionName does something');
      suggestions.push('Run /go-doc to preview documentation');
    }

    if (errorMessage.includes('clean')) {
      suggestions.push('Check file permissions');
      suggestions.push('Verify no processes are using the files');
      suggestions.push('Try cleaning specific cache types separately');
    }

    if (suggestions.length > 0) {
      LoggingUtils.info('💡 Utility error suggestions:');
      suggestions.forEach((suggestion, i) => {
        LoggingUtils.info(`  ${i + 1}. ${suggestion}`);
      });
    }
  }
}

module.exports = GoUtilityRunner;
