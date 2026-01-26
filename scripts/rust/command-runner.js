#!/usr/bin/env node
/**
 * Rust Command Runner
 *
 * Execute Rust commands with Rust-specific improvements and error handling
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const RustToolDetector = require('../../languages/rust/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ProjectUtils, LoggingUtils } = require('../lib');

class RustCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new RustToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.rustConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with Rust-specific setup
   */
  async initialize() {
    // First, validate that we're in a Rust project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'rust' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn('This may not be a Rust project. Some features may not work correctly.');
      } else if (projectInfo.type === 'rust') {
        LoggingUtils.debug(`Detected Rust project: ${projectInfo.framework || 'standard Rust'}`);
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }

      // Load configuration
      this.config = this.configManager.loadConfig();
      this.rustConfig = this.config?.rust || {};

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      // Validate essential tools
      await this.validateEssentialTools();

      LoggingUtils.debug('Rust command runner initialized successfully');
    } catch (error) {
      LoggingUtils.error(`Failed to initialize Rust command runner: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate essential Rust tools
   */
  async validateEssentialTools() {
    const requiredTools = ['rustc', 'cargo'];

    for (const toolName of requiredTools) {
      const tool = this.detectedTools[toolName];
      if (!tool?.installed) {
        throw new Error(`Required Rust tool '${toolName}' is not installed. Install Rust first.`);
      }
    }
  }

  /**
   * Get Rust project information
   */
  getRustProjectInfo() {
    if (!this.detectedTools) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }

    return {
      ...this.detectedTools.project,
      tools: {
        rustc: this.detectedTools.rustc,
        cargo: this.detectedTools.cargo,
        rustup: this.detectedTools.rustup,
      },
      frameworks: this.detectedTools.frameworks,
      linters: this.detectedTools.linters,
      formatters: this.detectedTools.formatters,
      testFrameworks: this.detectedTools.testFrameworks,
    };
  }

  /**
   * Execute cargo command
   */
  async executeCargoCommand(command, args = [], options = {}) {
    await this.initialize();

    const allArgs = [command, ...args];
    LoggingUtils.debug(`Executing: cargo ${allArgs.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('cargo', allArgs, {
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
          reject(new Error(`cargo ${command} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute cargo ${command}: ${error.message}`));
      });
    });
  }

  /**
   * Handle cargo errors with Rust-specific suggestions
   */
  _handleCargoError(error, context = {}) {
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

    // Rust-specific error suggestions
    this._suggestCargoFix(error.message, context.command);

    // Re-throw enhanced error
    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest cargo fixes based on error message
   */
  _suggestCargoFix(errorMessage, _command) {
    LoggingUtils.info('\n💡 Rust Error Suggestions:');

    if (errorMessage.includes('could not find') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Run: cargo build');
      LoggingUtils.info('   • Check Cargo.toml for correct dependencies');
      LoggingUtils.info('   • Run: cargo update');
    }

    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      LoggingUtils.info('   • Fix permissions on target directory');
      LoggingUtils.info('   • Use cargo clean to clear build artifacts');
      LoggingUtils.info('   • Check filesystem permissions');
    }

    if (errorMessage.includes('version') || errorMessage.includes('incompatible')) {
      LoggingUtils.info('   • Update dependencies: cargo update');
      LoggingUtils.info('   • Check Cargo.toml version constraints');
      LoggingUtils.info('   • Use cargo tree to see dependency graph');
    }

    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      LoggingUtils.info('   • Increase memory for Rust compiler');
      LoggingUtils.info('   • Use cargo build --release for optimized builds');
      LoggingUtils.info('   • Consider splitting large crates');
    }

    if (errorMessage.includes('borrow') || errorMessage.includes('lifetime')) {
      LoggingUtils.info('   • Check borrow checker errors');
      LoggingUtils.info('   • Use Rc or Arc for shared ownership');
      LoggingUtils.info('   • Consider using references instead of owned values');
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.info('🧪 Running Rust tests...');

    try {
      const result = await this.executeCargoCommand('test', args, options);

      // Show test summary if available
      this._showTestSummary();

      return result;
    } catch (error) {
      this._suggestTestFix(error.message);
      throw error;
    }
  }

  /**
   * Show test summary
   */
  _showTestSummary() {
    try {
      // Try to read test results if available
      const testOutputPath = path.join(this.projectPath, 'target', 'debug', 'deps');
      if (fs.existsSync(testOutputPath)) {
        LoggingUtils.info('\n📊 Tests completed successfully');
      }
    } catch (error) {
      // Silently fail - test summary is optional
    }
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getRustProjectInfo();
    let buildArgs = args;

    // Add release flag if requested
    if (options.release) {
      buildArgs = ['--release', ...buildArgs];
    }

    LoggingUtils.info('🔨 Building Rust project...');

    try {
      const result = await this.executeCargoCommand('build', buildArgs, options);

      // Show build information
      this._showBuildInfo(projectInfo, options.release);

      return result;
    } catch (error) {
      this._suggestBuildFix(error.message);
      throw error;
    }
  }

  /**
   * Check code without building
   */
  async check(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.info('🔍 Checking Rust code...');

    try {
      const result = await this.executeCargoCommand('check', args, options);

      LoggingUtils.info('✅ Code check completed successfully');

      return result;
    } catch (error) {
      this._suggestCheckFix(error.message);
      throw error;
    }
  }

  /**
   * Run clippy linter
   */
  async clippy(args = [], options = {}) {
    await this.initialize();

    // Check if clippy is available
    const projectInfo = this.getRustProjectInfo();
    if (!projectInfo.linters.includes('clippy')) {
      LoggingUtils.warn('Clippy not installed. Installing...');
      try {
        await this.executeCargoCommand(['clippy', '--version']);
      } catch (error) {
        LoggingUtils.error('Failed to install clippy. Run: rustup component add clippy');
        throw error;
      }
    }

    LoggingUtils.info('🔍 Running clippy linter...');

    try {
      const result = await this.executeCargoCommand('clippy', args, options);

      LoggingUtils.info('✅ Clippy linting completed');

      return result;
    } catch (error) {
      this._suggestClippyFix(error.message);
      throw error;
    }
  }

  /**
   * Format code with rustfmt
   */
  async fmt(args = [], options = {}) {
    await this.initialize();

    // Check if rustfmt is available
    const projectInfo = this.getRustProjectInfo();
    if (!projectInfo.formatters.includes('rustfmt')) {
      LoggingUtils.warn('rustfmt not installed. Installing...');
      try {
        await this.executeCargoCommand(['fmt', '--version']);
      } catch (error) {
        LoggingUtils.error('Failed to install rustfmt. Run: rustup component add rustfmt');
        throw error;
      }
    }

    LoggingUtils.info('🎨 Formatting Rust code...');

    try {
      const result = await this.executeCargoCommand('fmt', args, options);

      LoggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this._suggestFmtFix(error.message);
      throw error;
    }
  }

  /**
   * Run project
   */
  async run(args = [], options = {}) {
    await this.initialize();

    // const projectInfo = this.getRustProjectInfo();
    let runArgs = args;

    // Add release flag if requested
    if (options.release) {
      runArgs = ['--release', ...runArgs];
    }

    LoggingUtils.info('🚀 Running Rust project...');

    try {
      const result = await this.executeCargoCommand('run', runArgs, options);

      LoggingUtils.info('✅ Project execution completed');

      return result;
    } catch (error) {
      this._suggestRunFix(error.message);
      throw error;
    }
  }

  /**
   * Generate documentation
   */
  async doc(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.info('📚 Generating Rust documentation...');

    try {
      const result = await this.executeCargoCommand('doc', args, options);

      // Show documentation location
      const docPath = path.join(this.projectPath, 'target', 'doc');
      if (fs.existsSync(docPath)) {
        LoggingUtils.info(`📖 Documentation generated at: ${docPath}`);
        LoggingUtils.info(`   Open: file://${docPath}/index.html`);
      }

      return result;
    } catch (error) {
      this._suggestDocFix(error.message);
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

    if (options.release) {
      args.push('--release');
    }

    LoggingUtils.info('🧹 Cleaning Rust build artifacts...');

    return await this.executeCargoCommand('clean', args, options);
  }

  /**
   * Update dependencies
   */
  async update(args = [], options = {}) {
    LoggingUtils.info('📦 Updating Rust dependencies...');

    try {
      const result = await this.executeCargoCommand('update', args, options);

      LoggingUtils.info('✅ Dependencies updated successfully');

      return result;
    } catch (error) {
      this._suggestUpdateFix(error.message);
      throw error;
    }
  }

  /**
   * Show build information
   */
  _showBuildInfo(projectInfo, isRelease) {
    LoggingUtils.info('\n📊 Build Information:');
    LoggingUtils.info('='.repeat(40));
    LoggingUtils.info(`Build type: ${isRelease ? 'Release' : 'Debug'}`);
    LoggingUtils.info(`Project type: ${this._getProjectTypeDescription(projectInfo)}`);
    LoggingUtils.info(`Rust edition: ${projectInfo.edition || '2018'}`);
    LoggingUtils.info(`Dependencies: ${projectInfo.dependencies}`);
    LoggingUtils.info(`Dev dependencies: ${projectInfo.devDependencies}`);
    LoggingUtils.info(`Build dependencies: ${projectInfo.buildDependencies}`);

    if (projectInfo.frameworks.length > 0) {
      LoggingUtils.info(`Frameworks: ${projectInfo.frameworks.join(', ')}`);
    }

    LoggingUtils.info('='.repeat(40));
  }

  /**
   * Get project type description
   */
  _getProjectTypeDescription(projectInfo) {
    const types = [];
    if (projectInfo.isBinary) types.push('Binary');
    if (projectInfo.isLibrary) types.push('Library');
    if (projectInfo.isWorkspace) types.push('Workspace');
    return types.length > 0 ? types.join(' + ') : 'Unknown';
  }

  /**
   * Suggest test fixes
   */
  _suggestTestFix(errorMessage) {
    LoggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('could not compile')) {
      LoggingUtils.info('   • Fix compilation errors first');
      LoggingUtils.info('   • Run cargo check to see errors');
      LoggingUtils.info('   • Check test module declarations');
    }

    if (errorMessage.includes('panicked')) {
      LoggingUtils.info('   • Check test assertions');
      LoggingUtils.info('   • Use should_panic for expected panics');
      LoggingUtils.info('   • Add debug prints to test code');
    }
  }

  /**
   * Suggest build fixes
   */
  _suggestBuildFix(errorMessage) {
    LoggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('could not compile')) {
      LoggingUtils.info('   • Check compiler error messages');
      LoggingUtils.info('   • Run cargo check for detailed errors');
      LoggingUtils.info('   • Check Cargo.toml syntax');
    }

    if (errorMessage.includes('linker')) {
      LoggingUtils.info('   • Check linker configuration');
      LoggingUtils.info('   • Install required system libraries');
      LoggingUtils.info('   • Check target triple configuration');
    }
  }

  /**
   * Suggest check fixes
   */
  _suggestCheckFix(errorMessage) {
    LoggingUtils.info('\n💡 Check Error Suggestions:');

    if (errorMessage.includes('type mismatch')) {
      LoggingUtils.info('   • Check function signatures');
      LoggingUtils.info('   • Verify type annotations');
      LoggingUtils.info('   • Use type inference where possible');
    }

    if (errorMessage.includes('unused')) {
      LoggingUtils.info('   • Remove unused imports/variables');
      LoggingUtils.info('   • Add #[allow(unused)] attribute if needed');
      LoggingUtils.info('   • Check for dead code');
    }
  }

  /**
   * Suggest clippy fixes
   */
  _suggestClippyFix(errorMessage) {
    LoggingUtils.info('\n💡 Clippy Error Suggestions:');

    if (errorMessage.includes('clippy::')) {
      LoggingUtils.info('   • Read clippy warning messages');
      LoggingUtils.info('   • Apply suggested fixes');
      LoggingUtils.info('   • Use #[allow(clippy::lint_name)] to suppress');
    }
  }

  /**
   * Suggest fmt fixes
   */
  _suggestFmtFix(errorMessage) {
    LoggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('rustfmt')) {
      LoggingUtils.info('   • Install rustfmt: rustup component add rustfmt');
      LoggingUtils.info('   • Check .rustfmt.toml configuration');
      LoggingUtils.info('   • Run cargo fmt --check to see issues');
    }
  }

  /**
   * Suggest run fixes
   */
  _suggestRunFix(errorMessage) {
    LoggingUtils.info('\n💡 Run Error Suggestions:');

    if (errorMessage.includes('could not find')) {
      LoggingUtils.info('   • Build project first: cargo build');
      LoggingUtils.info('   • Check binary name in Cargo.toml');
      LoggingUtils.info('   • Verify [[bin]] section exists');
    }

    if (errorMessage.includes('exit code')) {
      LoggingUtils.info('   • Check program logic for panics');
      LoggingUtils.info('   • Add error handling');
      LoggingUtils.info('   • Use Result types for recoverable errors');
    }
  }

  /**
   * Suggest doc fixes
   */
  _suggestDocFix(errorMessage) {
    LoggingUtils.info('\n💡 Documentation Error Suggestions:');

    if (errorMessage.includes('could not compile')) {
      LoggingUtils.info('   • Fix compilation errors first');
      LoggingUtils.info('   • Check doc comments syntax');
      LoggingUtils.info('   • Run cargo check to see errors');
    }
  }

  /**
   * Suggest update fixes
   */
  _suggestUpdateFix(errorMessage) {
    LoggingUtils.info('\n💡 Update Error Suggestions:');

    if (errorMessage.includes('network')) {
      LoggingUtils.info('   • Check internet connection');
      LoggingUtils.info('   • Check crates.io accessibility');
      LoggingUtils.info('   • Use cargo update --offline if available');
    }

    if (errorMessage.includes('version conflict')) {
      LoggingUtils.info('   • Check Cargo.lock for conflicts');
      LoggingUtils.info('   • Use cargo tree to see dependency graph');
      LoggingUtils.info('   • Consider using cargo update --precise');
    }
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    try {
      const rustcVersion = await this.executeCargoCommand('--version', [], {
        stdio: 'pipe',
      });
      const cargoVersion = await this.executeCargoCommand('--version', [], {
        stdio: 'pipe',
      });

      return {
        rustcVersion: rustcVersion.stdout?.trim() || 'unknown',
        cargoVersion: cargoVersion.stdout?.trim() || 'unknown',
        projectInfo: this.getRustProjectInfo(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = RustCommandRunner;
