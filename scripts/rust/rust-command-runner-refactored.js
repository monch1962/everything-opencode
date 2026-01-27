#!/usr/bin/env node
/**
 * Rust Command Runner (Refactored)
 *
 * Execute Rust commands with Rust-specific improvements and error handling
 * Modular architecture for better maintainability
 */

const fs = require('fs');
const path = require('path');
const ConfigManager = require('../interactive/config-manager');
const RustToolDetector = require('../../languages/rust/tool-detector');
const PlatformDetector = require('../lib/platform-detector');

// Import shared utilities
const { ProjectUtils, LoggingUtils } = require('../lib');

// Import modular components
const CommandExecutor = require('./rust-command-runner-modules/command-executor');
const TestRunner = require('./rust-command-runner-modules/test-runner');
const BuildRunner = require('./rust-command-runner-modules/build-runner');
const CodeQuality = require('./rust-command-runner-modules/code-quality');
const DependencyManager = require('./rust-command-runner-modules/dependency-manager');
const UtilityRunner = require('./rust-command-runner-modules/utility-runner');

class RustCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new RustToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.rustConfig = null;
    this.detectedTools = null;

    // Initialize modular components
    this.commandExecutor = new CommandExecutor(this, LoggingUtils);
    this.testRunner = new TestRunner(this.commandExecutor, LoggingUtils);
    this.buildRunner = new BuildRunner(this.commandExecutor, LoggingUtils);
    this.codeQuality = new CodeQuality(this.commandExecutor, LoggingUtils);
    this.dependencyManager = new DependencyManager(this.commandExecutor, LoggingUtils);
    this.utilityRunner = new UtilityRunner(this.commandExecutor, LoggingUtils);
  }

  /**
   * Initialize command runner with Rust-specific setup
   */
  async initialize() {
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'rust' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn('This may not be a Rust project. Some features may not work correctly.');
      } else if (projectInfo.type === 'rust') {
        LoggingUtils.debug(`Detected Rust project: ${projectInfo.framework || 'standard Rust'}`);
      }

      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }

      this.config = await this.configManager.loadConfig();
      this.rustConfig = (this.config && this.config.rust) || {};

      this.detectedTools = await this.toolDetector.detectTools(this.projectPath);

      if (this.detectedTools.rustc) {
        LoggingUtils.debug(`rustc version: ${this.detectedTools.rustc.version}`);
      }

      if (this.detectedTools.cargo) {
        LoggingUtils.debug(`cargo version: ${this.detectedTools.cargo.version}`);
      }

      if (this.detectedTools.clippy) {
        LoggingUtils.debug(`clippy available: ${this.detectedTools.clippy.version}`);
      }

      if (this.detectedTools.rustfmt) {
        LoggingUtils.debug(`rustfmt available: ${this.detectedTools.rustfmt.version}`);
      }

      await this.validateEssentialTools();

      return this.detectedTools;
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

    for (const tool of requiredTools) {
      if (!this.detectedTools[tool]) {
        throw new Error(`Required Rust tool '${tool}' not found. Please install Rust.`);
      }
    }

    LoggingUtils.debug('✅ All essential Rust tools are available');
  }

  /**
   * Get Rust project information
   */
  getRustProjectInfo() {
    try {
      const cargoTomlPath = path.join(this.projectPath, 'Cargo.toml');
      const cargoLockPath = path.join(this.projectPath, 'Cargo.lock');

      let cargoToml = {};
      if (fs.existsSync(cargoTomlPath)) {
        const tomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
        cargoToml = this._parseCargoToml(tomlContent);
      }

      const srcFiles = this._findRustFiles(this.projectPath);

      return {
        hasCargoToml: fs.existsSync(cargoTomlPath),
        hasCargoLock: fs.existsSync(cargoLockPath),
        isBinary: cargoToml.bin && cargoToml.bin.length > 0,
        isLibrary: !!cargoToml.lib,
        isWorkspace: !!cargoToml.workspace,
        edition: cargoToml.package?.edition || '2018',
        dependencies: Object.keys(cargoToml.dependencies || {}).length,
        devDependencies: Object.keys(cargoToml['dev-dependencies'] || {}).length,
        buildDependencies: Object.keys(cargoToml['build-dependencies'] || {}).length,
        frameworks: this._detectFrameworks(cargoToml),
        linters: this._detectLinters(),
        formatters: this._detectFormatters(),
        srcFiles: srcFiles.length,
      };
    } catch (error) {
      LoggingUtils.debug('Failed to get Rust project info:', error.message);
      return {
        hasCargoToml: false,
        hasCargoLock: false,
        isBinary: false,
        isLibrary: false,
        isWorkspace: false,
        edition: '2018',
        dependencies: 0,
        devDependencies: 0,
        buildDependencies: 0,
        frameworks: [],
        linters: [],
        formatters: [],
        srcFiles: 0,
      };
    }
  }

  /**
   * Parse Cargo.toml content
   */
  _parseCargoToml(content) {
    const result = {};
    let currentSection = null;

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        result[currentSection] = {};
      } else if (currentSection && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();

        if (value.startsWith('{') && value.endsWith('}')) {
          try {
            result[currentSection][key.trim()] = JSON.parse(value);
          } catch {
            result[currentSection][key.trim()] = value;
          }
        } else {
          result[currentSection][key.trim()] = value.replace(/^"|"$/g, '');
        }
      }
    }

    return result;
  }

  /**
   * Find Rust source files
   */
  _findRustFiles(dir) {
    const rustFiles = [];

    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory() && item !== 'target' && item !== '.git') {
          rustFiles.push(...this._findRustFiles(itemPath));
        } else if (item.endsWith('.rs')) {
          rustFiles.push(itemPath);
        }
      }
    } catch (error) {}

    return rustFiles;
  }

  /**
   * Detect Rust frameworks
   */
  _detectFrameworks(cargoToml) {
    const frameworks = [];
    const dependencies = {
      ...cargoToml.dependencies,
      ...cargoToml['dev-dependencies'],
      ...cargoToml['build-dependencies'],
    };

    const frameworkPatterns = {
      actix: ['actix-web', 'actix-rt'],
      rocket: ['rocket'],
      warp: ['warp'],
      tokio: ['tokio'],
      async_std: ['async-std'],
      serde: ['serde'],
      diesel: ['diesel'],
      sqlx: ['sqlx'],
    };

    for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
      for (const pattern of patterns) {
        if (dependencies[pattern]) {
          frameworks.push(framework);
          break;
        }
      }
    }

    return [...new Set(frameworks)];
  }

  /**
   * Detect linters
   */
  _detectLinters() {
    const linters = [];

    if (this.detectedTools?.clippy?.installed) {
      linters.push('clippy');
    }

    return linters;
  }

  /**
   * Detect formatters
   */
  _detectFormatters() {
    const formatters = [];

    if (this.detectedTools?.rustfmt?.installed) {
      formatters.push('rustfmt');
    }

    return formatters;
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();
    return await this.testRunner.test(args, options);
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();
    return await this.buildRunner.build(args, options);
  }

  /**
   * Check code without building
   */
  async check(args = [], options = {}) {
    await this.initialize();
    return await this.buildRunner.check(args, options);
  }

  /**
   * Run clippy linter
   */
  async clippy(args = [], options = {}) {
    await this.initialize();
    return await this.codeQuality.clippy(args, options);
  }

  /**
   * Format code with rustfmt
   */
  async fmt(args = [], options = {}) {
    await this.initialize();
    return await this.codeQuality.fmt(args, options);
  }

  /**
   * Run project
   */
  async run(args = [], options = {}) {
    await this.initialize();
    return await this.buildRunner.run(args, options);
  }

  /**
   * Generate documentation
   */
  async doc(args = [], options = {}) {
    await this.initialize();
    return await this.utilityRunner.doc(args, options);
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();
    return await this.utilityRunner.clean(options);
  }

  /**
   * Update dependencies
   */
  async update(args = [], options = {}) {
    await this.initialize();
    return await this.dependencyManager.update(args, options);
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    await this.initialize();
    return await this.utilityRunner.getProjectInfo();
  }

  /**
   * Execute cargo command (public method for backward compatibility)
   */
  async executeCargoCommand(command, args = [], options = {}) {
    return await this.commandExecutor.executeCargoCommand(command, args, options);
  }

  /**
   * Handle cargo error (public method for backward compatibility)
   */
  _handleCargoError(error, context = {}) {
    return this.commandExecutor._handleCargoError(error, context);
  }

  /**
   * Suggest cargo fixes (public method for backward compatibility)
   */
  _suggestCargoFix(errorMessage, command) {
    return this.commandExecutor._suggestCargoFix(errorMessage, command);
  }

  /**
   * Suggest test fixes (public method for backward compatibility)
   */
  _suggestTestFix(errorMessage) {
    return this.testRunner._suggestTestFix(errorMessage);
  }

  /**
   * Suggest build fixes (public method for backward compatibility)
   */
  _suggestBuildFix(errorMessage) {
    return this.buildRunner._suggestBuildFix(errorMessage);
  }

  /**
   * Suggest check fixes (public method for backward compatibility)
   */
  _suggestCheckFix(errorMessage) {
    return this.buildRunner._suggestCheckFix(errorMessage);
  }

  /**
   * Suggest clippy fixes (public method for backward compatibility)
   */
  _suggestClippyFix(errorMessage) {
    return this.codeQuality._suggestClippyFix(errorMessage);
  }

  /**
   * Suggest fmt fixes (public method for backward compatibility)
   */
  _suggestFmtFix(errorMessage) {
    return this.codeQuality._suggestFmtFix(errorMessage);
  }

  /**
   * Suggest run fixes (public method for backward compatibility)
   */
  _suggestRunFix(errorMessage) {
    return this.buildRunner._suggestRunFix(errorMessage);
  }

  /**
   * Suggest doc fixes (public method for backward compatibility)
   */
  _suggestDocFix(errorMessage) {
    return this.utilityRunner._suggestDocFix(errorMessage);
  }

  /**
   * Suggest update fixes (public method for backward compatibility)
   */
  _suggestUpdateFix(errorMessage) {
    return this.dependencyManager._suggestUpdateFix(errorMessage);
  }

  /**
   * Show build information (public method for backward compatibility)
   */
  _showBuildInfo(projectInfo, isRelease) {
    return this.buildRunner._showBuildInfo(projectInfo, isRelease);
  }

  /**
   * Show test summary (public method for backward compatibility)
   */
  _showTestSummary() {
    return this.testRunner._showTestSummary();
  }
}

module.exports = RustCommandRunner;
