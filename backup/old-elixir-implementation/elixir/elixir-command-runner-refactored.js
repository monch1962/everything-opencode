#!/usr/bin/env node
/**
 * Elixir Command Runner (Refactored)
 *
 * Execute Elixir commands with Elixir-specific improvements and error handling
 * Modular architecture for better maintainability
 */

const fs = require('fs');
const path = require('path');
const ConfigManager = require('../interactive/config-manager');
const ElixirToolDetector = require('../../languages/elixir/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ConfigUtils, FileUtils, ProjectUtils, LoggingUtils } = require('../lib');

// Import modular components
const CommandExecutor = require('./elixir-command-runner-modules/command-executor');
const CompilationManager = require('./elixir-command-runner-modules/compilation-manager');
const TestRunner = require('./elixir-command-runner-modules/test-runner');
const CodeQuality = require('./elixir-command-runner-modules/code-quality');
const DependencyManager = require('./elixir-command-runner-modules/dependency-manager');
const UtilityRunner = require('./elixir-command-runner-modules/utility-runner');

class ElixirCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new ElixirToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.elixirConfig = null;
    this.detectedTools = null;

    // Initialize modular components
    this.commandExecutor = new CommandExecutor(this, LoggingUtils);
    this.compilationManager = new CompilationManager(this.commandExecutor, LoggingUtils);
    this.testRunner = new TestRunner(this.commandExecutor, LoggingUtils);
    this.codeQuality = new CodeQuality(this.commandExecutor, LoggingUtils);
    this.dependencyManager = new DependencyManager(this.commandExecutor, LoggingUtils);
    this.utilityRunner = new UtilityRunner(this.commandExecutor, LoggingUtils);
  }

  /**
   * Initialize command runner with Elixir-specific setup
   */
  async initialize() {
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'elixir' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn(
          'This may not be an Elixir project. Some features may not work correctly.'
        );
      } else if (projectInfo.type === 'elixir') {
        LoggingUtils.debug(
          `Detected Elixir project: ${projectInfo.framework || 'standard Elixir'}`
        );
      }

      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }

      this.config = await this.configManager.loadConfig();
      this.elixirConfig = this.config.elixir || {};

      this.detectedTools = await this.toolDetector.detectTools(this.projectPath);

      if (this.detectedTools.elixir) {
        LoggingUtils.debug(`Elixir version: ${this.detectedTools.elixir.version}`);
      }

      if (this.detectedTools.mix) {
        LoggingUtils.debug(`Mix version: ${this.detectedTools.mix.version}`);
      }

      if (this.detectedTools.erlang) {
        LoggingUtils.debug(`Erlang/OTP version: ${this.detectedTools.erlang.version}`);
      }

      if (this.detectedTools.credo) {
        LoggingUtils.debug(`Credo available: ${this.detectedTools.credo.version}`);
      }

      if (this.detectedTools.dialyxir) {
        LoggingUtils.debug(`Dialyxir available: ${this.detectedTools.dialyxir.version}`);
      }

      return this.detectedTools;
    } catch (error) {
      LoggingUtils.error(`Failed to initialize Elixir command runner: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a tool is available
   */
  hasTool(toolName, required = false) {
    if (!this.detectedTools) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }

    const hasTool = !!this.detectedTools[toolName];

    if (required && !hasTool) {
      throw new Error(`Required tool '${toolName}' not found. Please install it.`);
    }

    return hasTool;
  }

  /**
   * Compile Elixir code
   */
  async compile(options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.compilationManager.compile(options);
  }

  /**
   * Run tests with ExUnit and Elixir-specific improvements
   */
  async test(options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.testRunner.test(options);
  }

  /**
   * Format code with Elixir formatter
   */
  async format(options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.codeQuality.format(options);
  }

  /**
   * Lint code with Credo
   */
  async lint(options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    this.hasTool('credo', true);

    return await this.codeQuality.lint(options);
  }

  /**
   * Type check with Dialyzer
   */
  async typecheck(options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    this.hasTool('dialyxir', true);

    return await this.codeQuality.typecheck(options);
  }

  /**
   * Manage dependencies
   */
  async deps(command, options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.dependencyManager.deps(command, options);
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.utilityRunner.clean(options);
  }

  /**
   * Run custom Mix task
   */
  async run(task, args = [], options = {}) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.utilityRunner.run(task, args, options);
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.utilityRunner.getProjectInfo();
  }

  /**
   * Show compilation information
   */
  async showCompilationInfo(options) {
    if (!this.detectedTools) {
      await this.initialize();
    }

    return await this.utilityRunner.showCompilationInfo(options);
  }

  /**
   * Show test summary
   */
  async showTestSummary(options) {
    return await this.testRunner.showTestSummary(options);
  }

  /**
   * Suggest compilation fixes
   */
  suggestCompilationFix(errorMessage) {
    return this.compilationManager.suggestCompilationFix(errorMessage);
  }

  /**
   * Suggest test fixes
   */
  suggestTestFix(errorMessage) {
    return this.testRunner.suggestTestFix(errorMessage);
  }

  /**
   * Suggest formatting fixes
   */
  suggestFormatFix(errorMessage) {
    return this.codeQuality.suggestFormatFix(errorMessage);
  }

  /**
   * Suggest linting fixes
   */
  suggestLintFix(errorMessage) {
    return this.codeQuality.suggestLintFix(errorMessage);
  }

  /**
   * Suggest type checking fixes
   */
  suggestTypecheckFix(errorMessage) {
    return this.codeQuality.suggestTypecheckFix(errorMessage);
  }

  /**
   * Suggest dependency fixes
   */
  suggestDepsFix(errorMessage) {
    return this.dependencyManager.suggestDepsFix(errorMessage);
  }

  /**
   * Execute Mix command (public method for backward compatibility)
   */
  async executeMixCommand(command, args = [], options = {}) {
    return await this.commandExecutor.executeMixCommand(command, args, options);
  }

  /**
   * Execute Elixir command (public method for backward compatibility)
   */
  async executeElixirCommand(args = [], options = {}) {
    return await this.commandExecutor.executeElixirCommand(args, options);
  }
}

module.exports = ElixirCommandRunner;
