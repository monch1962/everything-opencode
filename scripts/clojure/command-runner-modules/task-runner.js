#!/usr/bin/env node
/**
 * Task Runner for Clojure Command Runner
 *
 * Implements specific Clojure tasks (test, build, repl, etc.)
 */

const path = require('path');
const { LoggingUtils } = require('../../lib');

class TaskRunner {
  constructor(projectPath = process.cwd(), buildTool = null, projectInfo = null) {
    this.projectPath = projectPath;
    this.buildTool = buildTool;
    this.projectInfo = projectInfo;
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    let testArgs = args;

    // Add test framework specific args
    if (this.projectInfo?.testFrameworks?.includes('kaocha')) {
      testArgs = ['-M:test', ...testArgs];
    } else if (this.projectInfo?.testFrameworks?.includes('clojure.test')) {
      testArgs = ['-M:test', ...testArgs];
    }

    LoggingUtils.info('🧪 Running Clojure tests...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli':
          result = await this.executeClojureCliCommand(['-M:test', ...testArgs], options);
          break;
        case 'leiningen':
          result = await this.executeLeiningenCommand('test', testArgs, options);
          break;
        case 'boot':
          result = await this.executeBootCommand(['test', ...testArgs], options);
          break;
      }

      // Show test summary if available
      this.showTestSummary();

      return result;
    } catch (error) {
      this.suggestTestFix(error.message);
      throw error;
    }
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    const buildArgs = args;

    LoggingUtils.info('🔨 Building Clojure project...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli':
          // For CLI, building typically means creating uberjar
          if (options.uberjar) {
            result = await this.executeClojureCliCommand(['-M:uberjar', ...buildArgs], options);
          } else {
            result = await this.executeClojureCliCommand(['-M:compile', ...buildArgs], options);
          }
          break;
        case 'leiningen':
          if (options.uberjar) {
            result = await this.executeLeiningenCommand('uberjar', buildArgs, options);
          } else {
            result = await this.executeLeiningenCommand('compile', buildArgs, options);
          }
          break;
        case 'boot':
          if (options.uberjar) {
            result = await this.executeBootCommand(['uberjar', ...buildArgs], options);
          } else {
            result = await this.executeBootCommand(['build', ...buildArgs], options);
          }
          break;
      }

      // Show build information
      this.showBuildInfo(options.uberjar);

      return result;
    } catch (error) {
      this.suggestBuildFix(error.message);
      throw error;
    }
  }

  /**
   * Start REPL
   */
  async repl(args = [], options = {}) {
    let replArgs = args;

    // Add REPL type specific args
    if (this.projectInfo?.replTypes?.includes('nrepl')) {
      replArgs = ['-M:nrepl', ...replArgs];
    } else if (this.projectInfo?.replTypes?.includes('socket')) {
      replArgs = ['-M:socket', ...replArgs];
    }

    LoggingUtils.info('💬 Starting Clojure REPL...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli':
          result = await this.executeClojureCliCommand(['-M:repl', ...replArgs], options);
          break;
        case 'leiningen':
          result = await this.executeLeiningenCommand('repl', replArgs, options);
          break;
        case 'boot':
          result = await this.executeBootCommand(['repl', ...replArgs], options);
          break;
      }

      LoggingUtils.info('✅ REPL started successfully');
      LoggingUtils.info('   Connect with your preferred editor or use Ctrl+D to exit');

      return result;
    } catch (error) {
      this.suggestReplFix(error.message);
      throw error;
    }
  }

  /**
   * Run linter
   */
  async lint(args = [], options = {}) {
    // Check if clj-kondo is available
    if (!this.projectInfo?.linters?.includes('clj-kondo')) {
      LoggingUtils.warn('clj-kondo not installed. Installing...');
      try {
        // Try to install clj-kondo
        await this.executeClojureCliCommand(['-M:clj-kondo/install'], options);
      } catch (error) {
        LoggingUtils.error(
          'Failed to install clj-kondo. Install manually: https://github.com/clj-kondo/clj-kondo,',
        );
        throw error;
      }
    }

    LoggingUtils.info('🔍 Running clj-kondo linter...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli':
          result = await this.executeClojureCliCommand(
            ['-M:clj-kondo', '--lint', '.', ...args],
            options,
          );
          break;
        case 'leiningen':
          result = await this.executeLeiningenCommand(
            'clj-kondo',
            ['--lint', '.', ...args],
            options,
          );
          break;
        case 'boot':
          result = await this.executeBootCommand(['clj-kondo', '--lint', '.', ...args], options);
          break;
        default: {
          // Fallback to direct clj-kondo if available
          const { spawn } = require('child_process');
          const child = spawn('clj-kondo', ['--lint', '.', ...args], {
            cwd: this.projectPath,
            stdio: options.stdio || 'inherit',
          });

          return new Promise((resolve, reject) => {
            child.on('close', (code) => {
              if (code === 0) {
                resolve({ success: true, code: 0 });
              } else {
                reject(new Error(`clj-kondo failed with exit code ${code}`));
              }
            });
          });
        }
      }

      LoggingUtils.info('✅ Linting completed successfully');

      return result;
    } catch (error) {
      this.suggestLintFix(error.message);
      throw error;
    }
  }

  /**
   * Format code
   */
  async format(args = [], options = {}) {
    // Check if zprint is available
    if (!this.projectInfo?.formatters?.includes('zprint')) {
      LoggingUtils.warn('zprint not installed. Installing...');
      try {
        // Try to install zprint
        await this.executeClojureCliCommand(['-M:zprint/install'], options);
      } catch (error) {
        LoggingUtils.error(
          'Failed to install zprint. Install manually: https://github.com/kkinnear/zprint,',
        );
        throw error;
      }
    }

    LoggingUtils.info('🎨 Formatting Clojure code with zprint...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli':
          result = await this.executeClojureCliCommand(
            ['-M:zprint', '--format', '.', ...args],
            options,
          );
          break;
        case 'leiningen':
          result = await this.executeLeiningenCommand(
            'zprint',
            ['--format', '.', ...args],
            options,
          );
          break;
        case 'boot':
          result = await this.executeBootCommand(['zprint', '--format', '.', ...args], options);
          break;
        default: {
          // Fallback to direct zprint if available
          const { spawn } = require('child_process');
          const child = spawn('zprint', ['--format', '.', ...args], {
            cwd: this.projectPath,
            stdio: options.stdio || 'inherit',
          });

          return new Promise((resolve, reject) => {
            child.on('close', (code) => {
              if (code === 0) {
                resolve({ success: true, code: 0 });
              } else {
                reject(new Error(`zprint failed with exit code ${code}`));
              }
            });
          });
        }
      }

      LoggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this.suggestFormatFix(error.message);
      throw error;
    }
  }

  /**
   * Run project
   */
  async run(args = [], options = {}) {
    let runArgs = args;

    // Determine main namespace
    if (!runArgs.length && this.projectInfo?.mainNamespace) {
      runArgs = ['-m', this.projectInfo.mainNamespace, ...runArgs];
    }

    LoggingUtils.info('🚀 Running Clojure project...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli':
          result = await this.executeClojureCliCommand(['-M', ...runArgs], options);
          break;
        case 'leiningen':
          result = await this.executeLeiningenCommand('run', runArgs, options);
          break;
        case 'boot':
          result = await this.executeBootCommand(['run', ...runArgs], options);
          break;
      }

      LoggingUtils.info('✅ Project execution completed');

      return result;
    } catch (error) {
      this.suggestRunFix(error.message);
      throw error;
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    const args = [];

    if (options.all) {
      args.push('--all');
    }

    LoggingUtils.info('🧹 Cleaning Clojure build artifacts...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli': {
          // CLI doesn't have a clean command, but we can clean target directories
          const fs = require('fs');
          const targetDirs = ['target', '.cpcache', '.cljs_rhino_repl'];
          targetDirs.forEach((dir) => {
            const dirPath = path.join(this.projectPath, dir);
            if (fs.existsSync(dirPath)) {
              fs.rmSync(dirPath, { recursive: true, force: true });
              LoggingUtils.info(`Removed: ${dir}`);
            }
          });
          result = { success: true, code: 0 };
          break;
        }
        case 'leiningen':
          result = await this.executeLeiningenCommand('clean', args, options);
          break;
        case 'boot':
          result = await this.executeBootCommand(['clean', ...args], options);
          break;
      }

      LoggingUtils.info('✅ Build artifacts cleaned');

      return result;
    } catch (error) {
      this.suggestCleanFix(error.message);
      throw error;
    }
  }

  /**
   * Update dependencies
   */
  async deps(args = [], options = {}) {
    LoggingUtils.info('📦 Updating Clojure dependencies...');

    try {
      let result;
      switch (this.buildTool) {
        case 'clojure-cli':
          result = await this.executeClojureCliCommand(['-Sforce', ...args], options);
          break;
        case 'leiningen':
          result = await this.executeLeiningenCommand('deps', args, options);
          break;
        case 'boot':
          result = await this.executeBootCommand(['deps', ...args], options);
          break;
      }

      LoggingUtils.info('✅ Dependencies updated successfully');

      return result;
    } catch (error) {
      this.suggestDepsFix(error.message);
      throw error;
    }
  }

  /**
   * Show test summary
   */
  showTestSummary() {
    try {
      LoggingUtils.info('\n📊 Test Information:');
      LoggingUtils.info('='.repeat(40));
      LoggingUtils.info(`Build tool: ${this.buildTool}`);
      LoggingUtils.info(
        `Test framework: ${this.projectInfo?.testFrameworks?.join(', ') || 'clojure.test'},`,
      );
      LoggingUtils.info(`Project type: ${this.projectInfo?.projectType || 'Library'}`);

      if (this.projectInfo?.frameworks?.length > 0) {
        LoggingUtils.info(`Frameworks: ${this.projectInfo.frameworks.join(', ')}`);
      }

      LoggingUtils.info('='.repeat(40));
    } catch (error) {
      // Silently fail - test summary is optional
    }
  }

  /**
   * Show build information
   */
  showBuildInfo(isUberjar) {
    LoggingUtils.info('\n📊 Build Information:');
    LoggingUtils.info('='.repeat(40));
    LoggingUtils.info(`Build tool: ${this.buildTool}`);
    LoggingUtils.info(`Build type: ${isUberjar ? 'Uberjar' : 'Standard'}`);
    LoggingUtils.info(`Project type: ${this.projectInfo?.projectType || 'Library'}`);
    LoggingUtils.info(`Java version: ${this.projectInfo?.tools?.java?.version || 'Unknown'}`);

    if (this.projectInfo?.dependencies) {
      LoggingUtils.info(`Dependencies: ${this.projectInfo.dependencies}`);
    }

    if (this.projectInfo?.frameworks?.length > 0) {
      LoggingUtils.info(`Frameworks: ${this.projectInfo.frameworks.join(', ')}`);
    }

    if (this.projectInfo?.clojurescript) {
      LoggingUtils.info(`ClojureScript: ${this.projectInfo.clojurescript.tool || 'Not detected'}`);
    }

    LoggingUtils.info('='.repeat(40));
  }

  /**
   * Suggest test fixes
   */
  suggestTestFix(errorMessage) {
    LoggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('namespace') || errorMessage.includes('require')) {
      LoggingUtils.info('   • Check test namespace declarations');
      LoggingUtils.info('   • Verify :require statements in test files');
      LoggingUtils.info('   • Run tests in specific namespace: clojure -M:test -n my.namespace');
    }

    if (errorMessage.includes('assert') || errorMessage.includes('is')) {
      LoggingUtils.info('   • Check test assertions with is or are');
      LoggingUtils.info('   • Use testing macro to group related tests');
      LoggingUtils.info('   • Add descriptive messages to assertions');
    }
  }

  /**
   * Suggest build fixes
   */
  suggestBuildFix(errorMessage) {
    LoggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('compile') || errorMessage.includes('AOT')) {
      LoggingUtils.info('   • Check :aot compilation settings');
      LoggingUtils.info('   • Verify main namespace declaration');
      LoggingUtils.info('   • Clear compilation cache and rebuild');
    }

    if (errorMessage.includes('uberjar') || errorMessage.includes('jar')) {
      LoggingUtils.info('   • Check :main class configuration');
      LoggingUtils.info('   • Ensure all dependencies are included');
      LoggingUtils.info('   • Use :uberjar-exclusions for unwanted files');
    }
  }

  /**
   * Suggest REPL fixes
   */
  suggestReplFix(errorMessage) {
    LoggingUtils.info('\n💡 REPL Error Suggestions:');

    if (errorMessage.includes('nREPL') || errorMessage.includes('port')) {
      LoggingUtils.info('   • Check nREPL port configuration');
      LoggingUtils.info('   • Kill existing nREPL process on same port');
      LoggingUtils.info('   • Use different port: lein repl :port 7888');
    }

    if (errorMessage.includes('classpath') || errorMessage.includes('dependencies')) {
      LoggingUtils.info('   • Run lein deps or clojure -Sdeps first');
      LoggingUtils.info('   • Check dependency conflicts');
      LoggingUtils.info('   • Clear local Maven repository cache');
    }
  }

  /**
   * Suggest lint fixes
   */
  suggestLintFix(errorMessage) {
    LoggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('clj-kondo') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Install clj-kondo: https://github.com/clj-kondo/clj-kondo');
      LoggingUtils.info('   • Use clojure -M:clj-kondo/install for CLI');
      LoggingUtils.info('   • Add clj-kondo to project dependencies');
    }

    if (errorMessage.includes('unused') || errorMessage.includes('warning')) {
      LoggingUtils.info('   • Remove unused vars or add ^:private metadata');
      LoggingUtils.info('   • Use #_:clj-kondo/ignore to suppress warnings');
      LoggingUtils.info('   • Create .clj-kondo/config.edn for project rules');
    }
  }

  /**
   * Suggest format fixes
   */
  suggestFormatFix(errorMessage) {
    LoggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('zprint') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Install zprint: https://github.com/kkinnear/zprint');
      LoggingUtils.info('   • Use clojure -M:zprint/install for CLI');
      LoggingUtils.info('   • Add zprint to project dependencies');
    }

    if (errorMessage.includes('parse') || errorMessage.includes('syntax')) {
      LoggingUtils.info('   • Check Clojure syntax in problematic files');
      LoggingUtils.info('   • Fix unbalanced parentheses or brackets');
      LoggingUtils.info('   • Use paredit mode in your editor');
    }
  }

  /**
   * Suggest run fixes
   */
  suggestRunFix(errorMessage) {
    LoggingUtils.info('\n💡 Run Error Suggestions:');

    if (errorMessage.includes('main') || errorMessage.includes('-main')) {
      LoggingUtils.info('   • Check -main function signature and arity');
      LoggingUtils.info('   • Verify :main namespace in project config');
      LoggingUtils.info('   • Build project first: lein uberjar or clojure -M:uberjar');
    }

    if (errorMessage.includes('class') || errorMessage.includes('method')) {
      LoggingUtils.info('   • Check Java interop calls');
      LoggingUtils.info('   • Verify imported Java classes');
      LoggingUtils.info('   • Use type hints for performance');
    }
  }

  /**
   * Suggest clean fixes
   */
  suggestCleanFix(errorMessage) {
    LoggingUtils.info('\n💡 Clean Error Suggestions:');

    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      LoggingUtils.info('   • Check file permissions on target directories');
      LoggingUtils.info('   • Run with appropriate user permissions');
      LoggingUtils.info('   • Manually remove locked files');
    }
  }

  /**
   * Suggest deps fixes
   */
  suggestDepsFix(errorMessage) {
    LoggingUtils.info('\n💡 Dependency Error Suggestions:');

    if (errorMessage.includes('network') || errorMessage.includes('download')) {
      LoggingUtils.info('   • Check internet connection');
      LoggingUtils.info('   • Configure Maven repository mirrors');
      LoggingUtils.info('   • Clear local cache and retry');
    }

    if (errorMessage.includes('version') || errorMessage.includes('conflict')) {
      LoggingUtils.info('   • Check dependency version conflicts');
      LoggingUtils.info('   • Use :exclusions in project config');
      LoggingUtils.info('   • Run dependency tree: lein deps :tree');
    }
  }

  /**
   * Execute Clojure CLI command (delegated to CommandExecutor)
   */
  async executeClojureCliCommand(_args = [], _options = {}) {
    throw new Error('Method not implemented. Use CommandExecutor instead.');
  }

  /**
   * Execute Leiningen command (delegated to CommandExecutor)
   */
  async executeLeiningenCommand(_command, _args = [], _options = {}) {
    throw new Error('Method not implemented. Use CommandExecutor instead.');
  }

  /**
   * Execute Boot command (delegated to CommandExecutor)
   */
  async executeBootCommand(_args = [], _options = {}) {
    throw new Error('Method not implemented. Use CommandExecutor instead.');
  }
}

module.exports = TaskRunner;
