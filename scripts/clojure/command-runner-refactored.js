#!/usr/bin/env node
/**
 * Clojure Command Runner (Refactored)
 *
 * Execute Clojure commands with Clojure-specific improvements and error handling
 * Modular version of the original command-runner.js
 */

const BuildToolDetector = require('./command-runner-modules/build-tool-detector');
const CommandExecutor = require('./command-runner-modules/command-executor');
const ProjectManager = require('./command-runner-modules/project-manager');
const ClojureErrorHandler = require('./command-runner-modules/error-handler');
const TaskRunner = require('./command-runner-modules/task-runner');
const { LoggingUtils } = require('../lib');

class ClojureCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.buildToolDetector = new BuildToolDetector(projectPath);
    this.commandExecutor = new CommandExecutor(projectPath);
    this.projectManager = new ProjectManager(projectPath);
    this.errorHandler = null;
    this.taskRunner = null;
    this.detectedTools = null;
    this.buildTool = null;
    this.projectInfo = null;
    this.initialized = false;
  }

  /**
   * Initialize command runner with Clojure-specific setup
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize project manager
      await this.projectManager.initialize();

      // Detect build tools
      this.detectedTools = await this.buildToolDetector.detectTools();
      this.buildTool = this.buildToolDetector.buildTool;

      // Validate essential tools
      const validation = await this.buildToolDetector.validateEssentialTools();
      if (!validation.valid) {
        throw new Error(`Tool validation failed: ${validation.errors.join(', ')}`);
      }

      // Get project information
      this.projectInfo = this.projectManager.getClojureProjectInfo(
        this.detectedTools,
        this.buildTool,
      );

      // Initialize error handler with build tool
      this.errorHandler = new ClojureErrorHandler(this.buildTool);

      // Initialize task runner
      this.taskRunner = new TaskRunner(this.projectPath, this.buildTool, this.projectInfo);

      // Override task runner execution methods to use command executor
      this._setupTaskRunner();

      this.initialized = true;
      LoggingUtils.debug('Clojure command runner initialized successfully');
    } catch (error) {
      LoggingUtils.error(`Failed to initialize Clojure command runner: ${error.message},`);
      throw error;
    }
  }

  /**
   * Setup task runner with command executor methods
   */
  _setupTaskRunner() {
    // Bind command executor methods to task runner
    this.taskRunner.executeClojureCliCommand = this.commandExecutor.executeClojureCliCommand.bind(
      this.commandExecutor,
    );
    this.taskRunner.executeLeiningenCommand = this.commandExecutor.executeLeiningenCommand.bind(
      this.commandExecutor,
    );
    this.taskRunner.executeBootCommand = this.commandExecutor.executeBootCommand.bind(
      this.commandExecutor,
    );
  }

  /**
   * Get Clojure project information
   */
  getClojureProjectInfo() {
    if (!this.initialized) {
      throw new Error('Command runner not initialized. Call initialize() first.');
    }

    return this.projectInfo;
  }

  /**
   * Execute Clojure CLI command
   */
  async executeClojureCliCommand(args = [], options = {}) {
    await this.initialize();
    return await this.commandExecutor.executeClojureCliCommand(args, options);
  }

  /**
   * Execute Leiningen command
   */
  async executeLeiningenCommand(command, args = [], options = {}) {
    await this.initialize();
    return await this.commandExecutor.executeLeiningenCommand(command, args, options);
  }

  /**
   * Execute Boot command
   */
  async executeBootCommand(args = [], options = {}) {
    await this.initialize();
    return await this.commandExecutor.executeBootCommand(args, options);
  }

  /**
   * Execute build tool command based on detected tool
   */
  async executeBuildToolCommand(command, args = [], options = {}) {
    await this.initialize();
    return await this.commandExecutor.executeBuildToolCommand(
      this.buildTool,
      command,
      args,
      options,
    );
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.test(args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'test', args });
    }
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.build(args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'build', args });
    }
  }

  /**
   * Start REPL
   */
  async repl(args = [], options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.repl(args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'repl', args });
    }
  }

  /**
   * Run linter
   */
  async lint(args = [], options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.lint(args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'lint', args });
    }
  }

  /**
   * Format code
   */
  async format(args = [], options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.format(args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'format', args });
    }
  }

  /**
   * Run project
   */
  async run(args = [], options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.run(args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'run', args });
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.clean(options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'clean' });
    }
  }

  /**
   * Update dependencies
   */
  async deps(args = [], options = {}) {
    await this.initialize();
    try {
      return await this.taskRunner.deps(args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command: 'deps', args });
    }
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    await this.initialize();

    try {
      const javaVersion = await this.commandExecutor.executeCommand('java', ['-version'], {
        stdio: 'pipe',
      });
      const clojureVersion = await this.commandExecutor.executeCommand('clojure', ['--version'], {
        stdio: 'pipe',
      });

      return {
        javaVersion: javaVersion.stdout?.trim() || 'unknown',
        clojureVersion: clojureVersion.stdout?.trim() || 'unknown',
        projectInfo: this.projectInfo,
        environment: this.buildToolDetector.generateEnvironmentReport(),
        projectReport: this.projectManager.generateProjectReport(
          this.detectedTools,
          this.buildTool,
        ),
      };
    } catch (error) {
      return {
        error: error.message,
        projectInfo: this.projectInfo,
      };
    }
  }

  /**
   * Generate comprehensive project report
   */
  async generateProjectReport() {
    await this.initialize();

    const lines = [];
    lines.push('Clojure Command Runner - Project Report');
    lines.push('========================================');
    lines.push('');

    // Environment report
    lines.push(this.buildToolDetector.generateEnvironmentReport());
    lines.push('');

    // Project report
    lines.push(this.projectManager.generateProjectReport(this.detectedTools, this.buildTool));
    lines.push('');

    // Validation report
    const validation = this.projectManager.validateProjectStructure();
    lines.push('Project Validation:');
    lines.push('-------------------');
    lines.push(`Valid: ${validation.valid ? '✓ Yes' : '✗ No'}`);
    if (validation.issues.length > 0) {
      lines.push('Issues:');
      validation.issues.forEach((issue) => {
        lines.push(`  • ${issue}`);
      });
    }
    if (validation.warnings.length > 0) {
      lines.push('Warnings:');
      validation.warnings.forEach((warning) => {
        lines.push(`  • ${warning}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Get installation instructions for missing tools
   */
  getInstallationInstructions() {
    return this.buildToolDetector.getInstallationInstructions();
  }

  /**
   * Get recommended build tool
   */
  getRecommendedBuildTool() {
    return this.buildToolDetector.getRecommendedBuildTool();
  }

  /**
   * Validate project and tools
   */
  async validate() {
    await this.initialize();

    const toolValidation = await this.buildToolDetector.validateEssentialTools();
    const projectValidation = this.projectManager.validateProjectStructure();

    return {
      tools: toolValidation,
      project: projectValidation,
      overall: toolValidation.valid && projectValidation.valid,
      recommendations: this._generateRecommendations(toolValidation, projectValidation),
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  _generateRecommendations(toolValidation, projectValidation) {
    const recommendations = [];

    // Tool recommendations
    if (!toolValidation.valid) {
      toolValidation.errors.forEach((error) => {
        recommendations.push({ type: 'error', message: error, priority: 'high' });
      });
      toolValidation.warnings.forEach((warning) => {
        recommendations.push({ type: 'warning', message: warning, priority: 'medium' });
      });
    }

    // Project recommendations
    if (!projectValidation.valid) {
      projectValidation.issues.forEach((issue) => {
        recommendations.push({ type: 'error', message: issue, priority: 'high' });
      });
      projectValidation.warnings.forEach((warning) => {
        recommendations.push({ type: 'warning', message: warning, priority: 'medium' });
      });
    }

    // Build tool recommendation
    const recommendedTool = this.getRecommendedBuildTool();
    if (recommendedTool && recommendedTool !== this.buildTool) {
      recommendations.push({
        type: 'suggestion',
        message: `Consider using ${recommendedTool} instead of ${this.buildTool}`,
        priority: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Execute custom command with error handling
   */
  async executeCommand(command, args = [], options = {}) {
    await this.initialize();

    try {
      return await this.commandExecutor.executeCommand(command, args, options);
    } catch (error) {
      return this.errorHandler.handleClojureError(error, { command, args });
    }
  }

  /**
   * Check if command exists
   */
  async commandExists(command) {
    return await this.commandExecutor.commandExists(command);
  }

  /**
   * Get command version
   */
  async getCommandVersion(command, versionFlag = '--version') {
    return await this.commandExecutor.getCommandVersion(command, versionFlag);
  }
}

module.exports = ClojureCommandRunner;
