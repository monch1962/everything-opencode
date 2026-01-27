/**
 * JavaScript/TypeScript Command Runner (Refactored)
 *
 * Execute JavaScript/TypeScript commands with project-specific improvements
 * Modular architecture for better maintainability
 */

const path = require('path');
const ConfigManager = require('../interactive/config-manager');
const JSToolDetector = require('../../languages/javascript/tool-detector');
const PlatformDetector = require('../lib/platform-detector');

// Import shared utilities
const { ConfigUtils, FileUtils, ProjectUtils, LoggingUtils } = require('../lib');

// Import modular components
const CommandExecutor = require('./javascript-command-runner-modules/command-executor');
const TestRunner = require('./javascript-command-runner-modules/test-runner');
const BuildRunner = require('./javascript-command-runner-modules/build-runner');
const CodeQuality = require('./javascript-command-runner-modules/code-quality');
const DependencyManager = require('./javascript-command-runner-modules/dependency-manager');
const UtilityRunner = require('./javascript-command-runner-modules/utility-runner');

class JSCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new JSToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.jsConfig = null;
    this.detectedTools = null;

    // Initialize modular components
    this.commandExecutor = new CommandExecutor(this, LoggingUtils, this.platformDetector);
    this.testRunner = new TestRunner(this.commandExecutor, LoggingUtils);
    this.buildRunner = new BuildRunner(this.commandExecutor, LoggingUtils);
    this.codeQuality = new CodeQuality(this.commandExecutor, LoggingUtils);
    this.dependencyManager = new DependencyManager(this.commandExecutor, LoggingUtils);
    this.utilityRunner = new UtilityRunner(this.commandExecutor, LoggingUtils);
  }

  /**
   * Initialize command runner with JavaScript/TypeScript setup
   */
  async initialize() {
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'javascript' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn(
          'This may not be a JavaScript project. Some features may not work correctly.'
        );
      } else if (projectInfo.type === 'javascript') {
        LoggingUtils.debug(
          `Detected JavaScript project: ${projectInfo.framework || 'standard JavaScript'}`
        );
      }

      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }

      this.config = await this.configManager.loadConfig();
      this.jsConfig = this.config.javascript || {};

      this.detectedTools = await this.toolDetector.detectTools(this.projectPath);

      if (this.detectedTools.npm) {
        LoggingUtils.debug(`npm version: ${this.detectedTools.npm.version}`);
      }

      if (this.detectedTools.node) {
        LoggingUtils.debug(`Node.js version: ${this.detectedTools.node.version}`);
      }

      if (this.detectedTools.typescript) {
        LoggingUtils.debug(`TypeScript available: ${this.detectedTools.typescript.version}`);
      }

      if (this.detectedTools.eslint) {
        LoggingUtils.debug(`ESLint available: ${this.detectedTools.eslint.version}`);
      }

      if (this.detectedTools.prettier) {
        LoggingUtils.debug(`Prettier available: ${this.detectedTools.prettier.version}`);
      }

      return this.detectedTools;
    } catch (error) {
      LoggingUtils.error(`Failed to initialize JavaScript command runner: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a tool is available
   */
  checkTool(toolName, required = true) {
    if (!this.detectedTools) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }

    const isInstalled = ConfigUtils.checkToolInstalled(this.jsConfig, toolName, required);

    if (required && !isInstalled) {
      throw new Error(`Required tool '${toolName}' not found. Please install it.`);
    }

    return isInstalled;
  }

  /**
   * Get JavaScript project information
   */
  getJSProjectInfo() {
    try {
      const fs = require('fs');
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      const tsConfigPath = path.join(this.projectPath, 'tsconfig.json');
      const eslintConfigPath = path.join(this.projectPath, '.eslintrc.js');
      const prettierConfigPath = path.join(this.projectPath, '.prettierrc');

      let packageJson = {};
      if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      }

      const jsFiles = FileUtils.findFiles(this.projectPath, '*.js').length;
      const tsFiles = FileUtils.findFiles(this.projectPath, '*.ts').length;

      return {
        hasPackageJson: fs.existsSync(packageJsonPath),
        hasTsConfig: fs.existsSync(tsConfigPath),
        hasEslintConfig: fs.existsSync(eslintConfigPath),
        hasPrettierConfig: fs.existsSync(prettierConfigPath),
        hasJestConfig:
          !!packageJson.jest || fs.existsSync(path.join(this.projectPath, 'jest.config.js')),
        jsFiles,
        tsFiles,
        packageJson,
      };
    } catch (error) {
      LoggingUtils.debug('Failed to get JavaScript project info:', error.message);
      return null;
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();
    return await this.testRunner.test(args, options);
  }

  /**
   * Run linter
   */
  async lint(args = [], options = {}) {
    await this.initialize();
    return await this.codeQuality.lint(args, options);
  }

  /**
   * Format code
   */
  async format(args = [], options = {}) {
    await this.initialize();
    return await this.codeQuality.format(args, options);
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();
    return await this.buildRunner.build(args, options);
  }

  /**
   * Start development server
   */
  async dev(args = [], options = {}) {
    await this.initialize();
    return await this.buildRunner.dev(args, options);
  }

  /**
   * TypeScript type checking
   */
  async typecheck(args = [], options = {}) {
    await this.initialize();
    return await this.codeQuality.typecheck(args, options);
  }

  /**
   * Install dependencies
   */
  async install(args = [], options = {}) {
    await this.initialize();
    return await this.dependencyManager.install(args, options);
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();
    return await this.utilityRunner.clean(options);
  }

  /**
   * Run custom npm script
   */
  async run(script, args = [], options = {}) {
    await this.initialize();
    return await this.utilityRunner.run(script, args, options);
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    await this.initialize();
    return await this.utilityRunner.getProjectInfo();
  }

  /**
   * Show build information
   */
  _showBuildInfo(projectInfo) {
    return this.utilityRunner._showBuildInfo(projectInfo);
  }

  /**
   * Execute npm command (public method for backward compatibility)
   */
  async executeNpmCommand(command, args = [], options = {}) {
    return await this.commandExecutor.executeNpmCommand(command, args, options);
  }

  /**
   * Suggest test fixes (public method for backward compatibility)
   */
  _suggestTestFix(errorMessage) {
    return this.testRunner._suggestTestFix(errorMessage);
  }

  /**
   * Suggest lint fixes (public method for backward compatibility)
   */
  _suggestLintFix(errorMessage) {
    return this.codeQuality._suggestLintFix(errorMessage);
  }

  /**
   * Suggest format fixes (public method for backward compatibility)
   */
  _suggestFormatFix(errorMessage) {
    return this.codeQuality._suggestFormatFix(errorMessage);
  }

  /**
   * Suggest build fixes (public method for backward compatibility)
   */
  _suggestBuildFix(errorMessage) {
    return this.buildRunner._suggestBuildFix(errorMessage);
  }

  /**
   * Suggest dev server fixes (public method for backward compatibility)
   */
  _suggestDevFix(errorMessage) {
    return this.buildRunner._suggestDevFix(errorMessage);
  }

  /**
   * Suggest type check fixes (public method for backward compatibility)
   */
  _suggestTypeCheckFix(errorMessage) {
    return this.codeQuality._suggestTypeCheckFix(errorMessage);
  }

  /**
   * Suggest installation fixes (public method for backward compatibility)
   */
  _suggestInstallFix(errorMessage) {
    return this.dependencyManager._suggestInstallFix(errorMessage);
  }
}

module.exports = JSCommandRunner;
