#!/usr/bin/env node
/**
 * Go Command Runner (Refactored)
 *
 * Execute Go commands with Go-specific improvements and error handling
 * Modular version of the original command-runner.js
 */

const path = require('path');
const GoToolDetector = require('../../languages/go/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import modular components
const GoCommandExecutor = require('./go-command-runner-modules/command-executor');
const GoBuildManager = require('./go-command-runner-modules/build-manager');
const GoTestRunner = require('./go-command-runner-modules/test-runner');
const GoCodeQuality = require('./go-command-runner-modules/code-quality');
const GoDependencyManager = require('./go-command-runner-modules/dependency-manager');
const GoUtilityRunner = require('./go-command-runner-modules/utility-runner');
const { ConfigUtils, ProjectUtils, LoggingUtils } = require('../lib');

class GoCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new GoToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.goConfig = null;
    this.detectedTools = null;

    // Initialize modules (will be created after initialize() is called)
    this.commandExecutor = null;
    this.buildManager = null;
    this.testRunner = null;
    this.codeQuality = null;
    this.dependencyManager = null;
    this.utilityRunner = null;
  }

  /**
   * Initialize command runner with Go-specific setup
   */
  async initialize() {
    if (this.detectedTools) {
      return; // Already initialized
    }

    try {
      // First, validate that we're in a Go project using ProjectUtils
      try {
        const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

        if (projectInfo.type !== 'go' && projectInfo.confidence < 0.7) {
          LoggingUtils.warn(
            `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
          );
          LoggingUtils.warn('This may not be a Go project. Some features may not work correctly.');
        } else if (projectInfo.type === 'go') {
          LoggingUtils.debug(`Detected Go project: ${projectInfo.module || 'unknown module'}`);
        }

        // Log detected languages if available
        if (projectInfo.languages && projectInfo.languages.length > 0) {
          LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
        }
      } catch (error) {
        LoggingUtils.debug('Project detection failed:', error.message);
      }

      // Load configuration using ConfigUtils
      this.config = ConfigUtils.loadConfig(this.projectPath);
      if (!this.config) {
        throw new Error('Project not configured. Run /go-setup first.');
      }

      // Get Go configuration
      this.goConfig = this.config.go || {};

      // Detect Go tools
      this.detectedTools = await this.toolDetector.detectTools(this.projectPath);

      // Initialize modules
      this.commandExecutor = new GoCommandExecutor(this.projectPath, this.platformDetector);
      this.buildManager = new GoBuildManager(
        this.projectPath,
        this.commandExecutor,
        this.goConfig,
        this.detectedTools
      );
      this.testRunner = new GoTestRunner(
        this.projectPath,
        this.commandExecutor,
        this.goConfig,
        this.detectedTools
      );
      this.codeQuality = new GoCodeQuality(
        this.projectPath,
        this.commandExecutor,
        this.goConfig,
        this.detectedTools
      );
      this.dependencyManager = new GoDependencyManager(
        this.projectPath,
        this.commandExecutor,
        this.goConfig
      );
      this.utilityRunner = new GoUtilityRunner(
        this.projectPath,
        this.commandExecutor,
        this.detectedTools
      );

      LoggingUtils.success('✅ Go command runner initialized');
      return this.detectedTools;
    } catch (error) {
      const errorInfo = defaultErrorHandler.handleError(error, {
        tool: 'go',
        operation: 'initialization',
        cwd: this.projectPath,
      });

      LoggingUtils.error(errorInfo.userMessage);

      if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
        LoggingUtils.info('💡 Recovery steps:');
        errorInfo.recoverySteps.forEach((step, i) => {
          LoggingUtils.info(`  ${i + 1}. ${step}`);
        });
      }

      const enhancedError = new Error(errorInfo.userMessage);
      enhancedError.originalError = error;
      enhancedError.errorInfo = errorInfo;
      throw enhancedError;
    }
  }

  /**
   * Check if a Go tool is available
   */
  async checkGoTool(toolName) {
    await this.initialize();
    return this.commandExecutor.checkGoTool(toolName);
  }

  /**
   * Execute Go command with Go-specific improvements
   */
  async executeGoCommand(command, args = [], options = {}) {
    await this.initialize();
    return this.commandExecutor.executeGoCommand(command, args, options);
  }

  /**
   * Build Go project with Go-specific improvements
   */
  async build(options = {}) {
    await this.initialize();
    return this.buildManager.build(options);
  }

  /**
   * Run Go tests
   */
  async test(options = {}) {
    await this.initialize();
    return this.testRunner.test(options);
  }

  /**
   * Generate test coverage report
   */
  async coverage(options = {}) {
    await this.initialize();
    return this.testRunner.coverage(options);
  }

  /**
   * Run Go linters
   */
  async lint(options = {}) {
    await this.initialize();
    return this.codeQuality.lint(options);
  }

  /**
   * Format Go code
   */
  async format(options = {}) {
    await this.initialize();
    return this.codeQuality.format(options);
  }

  /**
   * Manage Go dependencies
   */
  async manageDependencies(options = {}) {
    await this.initialize();
    return this.dependencyManager.manageDependencies(options);
  }

  /**
   * Run Go benchmarks
   */
  async benchmark(options = {}) {
    await this.initialize();
    return this.utilityRunner.benchmark(options);
  }

  /**
   * Generate Go documentation
   */
  async generateDocs(options = {}) {
    await this.initialize();
    return this.utilityRunner.generateDocs(options);
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();
    return this.utilityRunner.clean(options);
  }

  /**
   * Get output name based on project type
   */
  getOutputName() {
    return this.buildManager.getOutputName();
  }

  /**
   * Find Go files in the project
   */
  findGoFiles(pattern = '**/*.go', excludePatterns = []) {
    return this.buildManager.findGoFiles(pattern, excludePatterns);
  }

  /**
   * Get Go module information
   */
  getGoModuleInfo() {
    return this.buildManager.getGoModuleInfo();
  }

  /**
   * Detect build target based on environment
   */
  detectBuildTarget() {
    return this.buildManager.detectBuildTarget();
  }

  /**
   * Show build information
   */
  async showBuildInfo(options) {
    return this.buildManager.showBuildInfo(options);
  }

  /**
   * Suggest fixes for common build errors
   */
  suggestBuildFix(errorMessage) {
    return this.buildManager.suggestBuildFix(errorMessage);
  }

  /**
   * Suggest fixes for common test errors
   */
  suggestTestFix(errorMessage) {
    return this.testRunner.suggestTestFix(errorMessage);
  }

  /**
   * Suggest fixes for common linting errors
   */
  suggestLintFix(errorMessage) {
    return this.codeQuality.suggestLintFix(errorMessage);
  }

  /**
   * Suggest fixes for common dependency errors
   */
  suggestDependencyFix(errorMessage) {
    return this.dependencyManager.suggestDependencyFix(errorMessage);
  }

  /**
   * Suggest fixes for common utility errors
   */
  suggestUtilityFix(errorMessage) {
    return this.utilityRunner.suggestUtilityFix(errorMessage);
  }
}

module.exports = GoCommandRunner;
