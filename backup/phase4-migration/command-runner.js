#!/usr/bin/env node
/**
 * Clojure Command Runner
 *
 * Execute Clojure commands with Clojure-specific improvements and error handling
 */

const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const ClojureToolDetector = require('../../languages/clojure/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ProjectUtils, LoggingUtils } = require('../lib');

class ClojureCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new ClojureToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.clojureConfig = null;
    this.detectedTools = null;
    this.buildTool = null;
  }

  /**
   * Initialize command runner with Clojure-specific setup
   */
  async initialize() {
    // First, validate that we're in a Clojure project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'clojure' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn(
          'This may not be a Clojure project. Some features may not work correctly.',
        );
      } else if (projectInfo.type === 'clojure') {
        LoggingUtils.debug(
          `Detected Clojure project: ${projectInfo.framework || 'standard Clojure'}`,
        );
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }

      // Load configuration
      this.config = this.configManager.loadConfig();
      this.clojureConfig = this.config?.clojure || {};

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      // Determine build tool
      this.buildTool = this._determineBuildTool();

      // Validate essential tools
      await this.validateEssentialTools();

      LoggingUtils.debug('Clojure command runner initialized successfully');
    } catch (error) {
      LoggingUtils.error(`Failed to initialize Clojure command runner: ${error.message}`);
      throw error;
    }
  }

  /**
   * Determine which build tool to use
   */
  _determineBuildTool() {
    if (!this.detectedTools) {
      throw new Error('Tools not detected. Call initialize() first.');
    }

    // Check for Clojure CLI (deps.edn)
    if (this.detectedTools.clojureCli?.installed && this.detectedTools.project?.hasDepsEdn) {
      return 'clojure-cli';
    }

    // Check for Leiningen (project.clj)
    if (this.detectedTools.leiningen?.installed && this.detectedTools.project?.hasProjectClj) {
      return 'leiningen';
    }

    // Check for Boot (build.boot)
    if (this.detectedTools.boot?.installed && this.detectedTools.project?.hasBuildBoot) {
      return 'boot';
    }

    // Default to Clojure CLI if available
    if (this.detectedTools.clojureCli?.installed) {
      return 'clojure-cli';
    }

    throw new Error('No Clojure build tool detected. Install Clojure CLI, Leiningen, or Boot.');
  }

  /**
   * Validate essential Clojure tools
   */
  async validateEssentialTools() {
    // Java is required for all Clojure tools
    if (!this.detectedTools.java?.installed) {
      throw new Error('Java is not installed. Install Java (JDK 8+) to run Clojure.');
    }

    // Check Java version
    if (this.detectedTools.java?.version) {
      const javaVersion = this.detectedTools.java.version;
      const majorVersion = parseInt(javaVersion.split('.')[0]);
      if (majorVersion < 8) {
        LoggingUtils.warn(`Java version ${javaVersion} may be too old. Clojure requires Java 8+.`);
      }
    }

    // Validate build tool
    switch (this.buildTool) {
      case 'clojure-cli':
        if (!this.detectedTools.clojureCli?.installed) {
          throw new Error(
            'Clojure CLI is not installed. Install with: https://clojure.org/guides/getting_started',
          );
        }
        break;
      case 'leiningen':
        if (!this.detectedTools.leiningen?.installed) {
          throw new Error(
            'Leiningen is not installed. Install with: https://leiningen.org/#install',
          );
        }
        break;
      case 'boot':
        if (!this.detectedTools.boot?.installed) {
          throw new Error('Boot is not installed. Install with: https://boot-clj.com/#install');
        }
        break;
    }
  }

  /**
   * Get Clojure project information
   */
  getClojureProjectInfo() {
    if (!this.detectedTools) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }

    return {
      ...this.detectedTools.project,
      tools: {
        java: this.detectedTools.java,
        clojureCli: this.detectedTools.clojureCli,
        leiningen: this.detectedTools.leiningen,
        boot: this.detectedTools.boot,
      },
      buildTool: this.buildTool,
      frameworks: this.detectedTools.frameworks,
      linters: this.detectedTools.linters,
      formatters: this.detectedTools.formatters,
      testFrameworks: this.detectedTools.testFrameworks,
      replTypes: this.detectedTools.replTypes,
      clojurescript: this.detectedTools.clojurescript,
    };
  }

  /**
   * Execute Clojure CLI command
   */
  async executeClojureCliCommand(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.debug(`Executing: clojure ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('clojure', args, {
        cwd: this.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`clojure command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute clojure command: ${error.message}`));
      });
    });
  }

  /**
   * Execute Leiningen command
   */
  async executeLeiningenCommand(command, args = [], options = {}) {
    await this.initialize();

    const allArgs = [command, ...args];
    LoggingUtils.debug(`Executing: lein ${allArgs.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('lein', allArgs, {
        cwd: this.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`lein ${command} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute lein ${command}: ${error.message}`));
      });
    });
  }

  /**
   * Execute Boot command
   */
  async executeBootCommand(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.debug(`Executing: boot ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('boot', args, {
        cwd: this.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`boot command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute boot command: ${error.message}`));
      });
    });
  }

  /**
   * Execute build tool command based on detected tool
   */
  async executeBuildToolCommand(command, args = [], options = {}) {
    await this.initialize();

    switch (this.buildTool) {
      case 'clojure-cli':
        return await this.executeClojureCliCommand([command, ...args], options);
      case 'leiningen':
        return await this.executeLeiningenCommand(command, args, options);
      case 'boot':
        return await this.executeBootCommand([command, ...args], options);
      default:
        throw new Error(`Unsupported build tool: ${this.buildTool}`);
    }
  }

  /**
   * Handle Clojure errors with Clojure-specific suggestions
   */
  _handleClojureError(error, context = {}) {
    const errorInfo = defaultErrorHandler.handleError(error, context);

    // Log user-friendly error message using LoggingUtils
    LoggingUtils.error(errorInfo.userMessage);

    // Log recovery steps using LoggingUtils
    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      LoggingUtils.info('💡 Recovery steps:');
      errorInfo.recoverySteps.forEach((step, i) => {
        LoggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    // Clojure-specific error suggestions
    this._suggestClojureFix(error.message, context.command);

    // Re-throw enhanced error
    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest Clojure fixes based on error message
   */
  _suggestClojureFix(errorMessage, command) {
    LoggingUtils.info('\n💡 Clojure Error Suggestions:');

    if (errorMessage.includes('could not find') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Check namespace declarations');
      LoggingUtils.info('   • Verify file paths and require statements');
      LoggingUtils.info('   • Run: clojure -M:test or lein test');
    }

    if (errorMessage.includes('java.lang.ClassNotFoundException')) {
      LoggingUtils.info('   • Check classpath configuration');
      LoggingUtils.info('   • Add missing dependencies to deps.edn or project.clj');
      LoggingUtils.info('   • Run: clojure -Spath or lein deps');
    }

    if (
      errorMessage.includes('IllegalArgumentException') ||
      errorMessage.includes('AssertionError')
    ) {
      LoggingUtils.info('   • Check function arguments and types');
      LoggingUtils.info('   • Use clojure.spec for validation');
      LoggingUtils.info('   • Add debug prints with println or tap>');
    }

    if (errorMessage.includes('NullPointerException')) {
      LoggingUtils.info('   • Check for nil values in function calls');
      LoggingUtils.info('   • Use some-> or some->> for safe navigation');
      LoggingUtils.info('   • Add nil checks with when-let or if-let');
    }

    if (errorMessage.includes('OutOfMemoryError') || errorMessage.includes('GC overhead')) {
      LoggingUtils.info('   • Increase JVM heap size: -Xmx2g');
      LoggingUtils.info('   • Use lazy sequences for large data');
      LoggingUtils.info('   • Consider using transducers or reducers');
    }

    // Build tool specific suggestions
    if (command) {
      this._suggestBuildToolFix(errorMessage, command);
    }
  }

  /**
   * Suggest build tool specific fixes
   */
  _suggestBuildToolFix(errorMessage, _command) {
    if (this.buildTool === 'clojure-cli') {
      if (errorMessage.includes('deps.edn')) {
        LoggingUtils.info('   • Check deps.edn syntax and structure');
        LoggingUtils.info('   • Run: clojure -M:test:runner/refresh');
        LoggingUtils.info('   • Use clj-kondo to lint deps.edn');
      }
    } else if (this.buildTool === 'leiningen') {
      if (errorMessage.includes('project.clj')) {
        LoggingUtils.info('   • Check project.clj syntax and dependencies');
        LoggingUtils.info('   • Run: lein deps :tree');
        LoggingUtils.info('   • Clear cache: rm -rf ~/.m2/repository');
      }
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getClojureProjectInfo();
    let testArgs = args;

    // Add test framework specific args
    if (projectInfo.testFrameworks.includes('kaocha')) {
      testArgs = ['-M:test', ...testArgs];
    } else if (projectInfo.testFrameworks.includes('clojure.test')) {
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
      this._showTestSummary(projectInfo);

      return result;
    } catch (error) {
      this._suggestTestFix(error.message);
      throw error;
    }
  }

  /**
   * Show test summary
   */
  _showTestSummary(projectInfo) {
    try {
      LoggingUtils.info('\n📊 Test Information:');
      LoggingUtils.info('='.repeat(40));
      LoggingUtils.info(`Build tool: ${this.buildTool}`);
      LoggingUtils.info(
        `Test framework: ${projectInfo.testFrameworks.join(', ') || 'clojure.test'}`,
      );
      LoggingUtils.info(`Project type: ${projectInfo.projectType || 'Library'}`);

      if (projectInfo.frameworks.length > 0) {
        LoggingUtils.info(`Frameworks: ${projectInfo.frameworks.join(', ')}`);
      }

      LoggingUtils.info('='.repeat(40));
    } catch (error) {
      // Silently fail - test summary is optional
    }
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getClojureProjectInfo();
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
      this._showBuildInfo(projectInfo, options.uberjar);

      return result;
    } catch (error) {
      this._suggestBuildFix(error.message);
      throw error;
    }
  }

  /**
   * Start REPL
   */
  async repl(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getClojureProjectInfo();
    let replArgs = args;

    // Add REPL type specific args
    if (projectInfo.replTypes.includes('nrepl')) {
      replArgs = ['-M:nrepl', ...replArgs];
    } else if (projectInfo.replTypes.includes('socket')) {
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
      this._suggestReplFix(error.message);
      throw error;
    }
  }

  /**
   * Run linter
   */
  async lint(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getClojureProjectInfo();

    // Check if clj-kondo is available
    if (!projectInfo.linters.includes('clj-kondo')) {
      LoggingUtils.warn('clj-kondo not installed. Installing...');
      try {
        // Try to install clj-kondo
        await this.executeClojureCliCommand(['-M:clj-kondo/install'], options);
      } catch (error) {
        LoggingUtils.error(
          'Failed to install clj-kondo. Install manually: https://github.com/clj-kondo/clj-kondo',
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
      this._suggestLintFix(error.message);
      throw error;
    }
  }

  /**
   * Format code
   */
  async format(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getClojureProjectInfo();

    // Check if zprint is available
    if (!projectInfo.formatters.includes('zprint')) {
      LoggingUtils.warn('zprint not installed. Installing...');
      try {
        // Try to install zprint
        await this.executeClojureCliCommand(['-M:zprint/install'], options);
      } catch (error) {
        LoggingUtils.error(
          'Failed to install zprint. Install manually: https://github.com/kkinnear/zprint',
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
      this._suggestFormatFix(error.message);
      throw error;
    }
  }

  /**
   * Run project
   */
  async run(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getClojureProjectInfo();
    let runArgs = args;

    // Determine main namespace
    if (!runArgs.length && projectInfo.mainNamespace) {
      runArgs = ['-m', projectInfo.mainNamespace, ...runArgs];
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
      this._suggestRunFix(error.message);
      throw error;
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();

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
      this._suggestCleanFix(error.message);
      throw error;
    }
  }

  /**
   * Update dependencies
   */
  async deps(args = [], options = {}) {
    await this.initialize();

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
      this._suggestDepsFix(error.message);
      throw error;
    }
  }

  /**
   * Show build information
   */
  _showBuildInfo(projectInfo, isUberjar) {
    LoggingUtils.info('\n📊 Build Information:');
    LoggingUtils.info('='.repeat(40));
    LoggingUtils.info(`Build tool: ${this.buildTool}`);
    LoggingUtils.info(`Build type: ${isUberjar ? 'Uberjar' : 'Standard'}`);
    LoggingUtils.info(`Project type: ${projectInfo.projectType || 'Library'}`);
    LoggingUtils.info(`Java version: ${projectInfo.tools.java?.version || 'Unknown'}`);

    if (projectInfo.dependencies) {
      LoggingUtils.info(`Dependencies: ${projectInfo.dependencies}`);
    }

    if (projectInfo.frameworks.length > 0) {
      LoggingUtils.info(`Frameworks: ${projectInfo.frameworks.join(', ')}`);
    }

    if (projectInfo.clojurescript) {
      LoggingUtils.info(`ClojureScript: ${projectInfo.clojurescript.tool || 'Not detected'}`);
    }

    LoggingUtils.info('='.repeat(40));
  }

  /**
   * Suggest test fixes
   */
  _suggestTestFix(errorMessage) {
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
  _suggestBuildFix(errorMessage) {
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
  _suggestReplFix(errorMessage) {
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
  _suggestLintFix(errorMessage) {
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
  _suggestFormatFix(errorMessage) {
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
  _suggestRunFix(errorMessage) {
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
  _suggestCleanFix(errorMessage) {
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
  _suggestDepsFix(errorMessage) {
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
   * Get project information
   */
  async getProjectInfo() {
    try {
      const javaVersion = await this.executeClojureCliCommand(['--version'], {
        stdio: 'pipe',
      });
      const clojureVersion = await this.executeClojureCliCommand(['--version'], {
        stdio: 'pipe',
      });

      return {
        javaVersion: javaVersion.stdout?.trim() || 'unknown',
        clojureVersion: clojureVersion.stdout?.trim() || 'unknown',
        projectInfo: this.getClojureProjectInfo(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = ClojureCommandRunner;
