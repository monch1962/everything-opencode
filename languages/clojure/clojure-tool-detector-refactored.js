#!/usr/bin/env node
/**
 * Clojure Tool Detector - Refactored Version
 *
 * Detect Clojure tools, versions, and project configuration
 * Supports Clojure CLI (deps.edn), Leiningen (project.clj), and Boot (build.boot)
 *
 * Refactored into modular architecture for better maintainability
 */

// Import all modules
const CoreDetector = require('./tool-detector-modules/core-detector');
const BuildSystemDetector = require('./tool-detector-modules/build-system-detector');
const ToolingDetector = require('./tool-detector-modules/tooling-detector');
const FrameworkDetector = require('./tool-detector-modules/framework-detector');
const ProjectParser = require('./tool-detector-modules/project-parser');
const ReportGenerator = require('./tool-detector-modules/report-generator');
const UtilityHelper = require('./tool-detector-modules/utility-helper');

class ClojureToolDetectorRefactored {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;

    // Initialize all modules
    this.coreDetector = new CoreDetector(projectPath);
    this.buildSystemDetector = new BuildSystemDetector(projectPath);
    this.toolingDetector = new ToolingDetector(projectPath);
    this.frameworkDetector = new FrameworkDetector(projectPath);
    this.projectParser = new ProjectParser(projectPath);
    this.reportGenerator = new ReportGenerator();
    this.utilityHelper = new UtilityHelper(projectPath);

    // Cache for detected tools
    this.detectedTools = null;
  }

  /**
   * Detect all Clojure tools and versions
   */
  async detectTools() {
    if (this.detectedTools) {
      return this.detectedTools;
    }

    // Detect core runtime components
    const java = await this.coreDetector.detectJava();
    const clojure = await this.coreDetector.detectClojure();
    const leiningen = await this.coreDetector.detectLeiningen();
    const boot = await this.coreDetector.detectBoot();

    // Detect build system and project
    const buildSystem = await this.buildSystemDetector.detectBuildSystem();
    let project = await this.buildSystemDetector.detectProject();

    // Parse project files if they exist
    const depsEdnPath = require('path').join(this.projectPath, 'deps.edn');
    const projectCljPath = require('path').join(this.projectPath, 'project.clj');

    if (require('fs').existsSync(depsEdnPath)) {
      project = await this.projectParser.parseDepsEdn(depsEdnPath, project);
    }

    if (require('fs').existsSync(projectCljPath)) {
      project = await this.projectParser.parseProjectClj(projectCljPath, project);
    }

    // Detect tooling
    const linters = await this.toolingDetector.detectLinters();
    const formatters = await this.toolingDetector.detectFormatters();
    const testFrameworks = await this.toolingDetector.detectTestFrameworks();

    // Detect frameworks and REPL
    const frameworks = await this.frameworkDetector.detectFrameworks();
    const repl = await this.frameworkDetector.detectRepl();
    const clojurescript = await this.frameworkDetector.detectClojureScript();

    // Combine all tools
    const tools = {
      java,
      clojure,
      leiningen,
      boot,
      buildSystem,
      project,
      linters,
      formatters,
      testFrameworks,
      frameworks,
      repl,
      clojurescript,
    };

    this.detectedTools = tools;
    return tools;
  }

  /**
   * Detect Java runtime
   */
  async detectJava() {
    return this.coreDetector.detectJava();
  }

  /**
   * Detect Clojure CLI tools
   */
  async detectClojure() {
    return this.coreDetector.detectClojure();
  }

  /**
   * Detect Leiningen build tool
   */
  async detectLeiningen() {
    return this.coreDetector.detectLeiningen();
  }

  /**
   * Detect Boot build tool
   */
  async detectBoot() {
    return this.coreDetector.detectBoot();
  }

  /**
   * Detect build system from project files
   */
  async detectBuildSystem() {
    return this.buildSystemDetector.detectBuildSystem();
  }

  /**
   * Detect project type and configuration
   */
  async detectProject() {
    let project = await this.buildSystemDetector.detectProject();

    // Parse project files if they exist
    const depsEdnPath = require('path').join(this.projectPath, 'deps.edn');
    const projectCljPath = require('path').join(this.projectPath, 'project.clj');

    if (require('fs').existsSync(depsEdnPath)) {
      project = await this.projectParser.parseDepsEdn(depsEdnPath, project);
    }

    if (require('fs').existsSync(projectCljPath)) {
      project = await this.projectParser.parseProjectClj(projectCljPath, project);
    }

    return project;
  }

  /**
   * Parse deps.edn file
   */
  async parseDepsEdn(depsEdnPath, projectInfo) {
    return this.projectParser.parseDepsEdn(depsEdnPath, projectInfo);
  }

  /**
   * Parse project.clj file
   */
  async parseProjectClj(projectCljPath, projectInfo) {
    return this.projectParser.parseProjectClj(projectCljPath, projectInfo);
  }

  /**
   * Count list items in lines starting from index
   */
  countListItems(lines, startIndex) {
    return this.utilityHelper.countListItems(lines, startIndex);
  }

  /**
   * Extract list values from lines
   */
  extractListValues(lines, startIndex) {
    return this.utilityHelper.extractListValues(lines, startIndex);
  }

  /**
   * Check if project is a library
   */
  isLibraryProject(projectInfo) {
    return this.utilityHelper.isLibraryProject(projectInfo);
  }

  /**
   * Check if project is an application
   */
  isApplicationProject(projectInfo) {
    return this.utilityHelper.isApplicationProject(projectInfo);
  }

  /**
   * Detect linters
   */
  async detectLinters() {
    return this.toolingDetector.detectLinters();
  }

  /**
   * Detect formatters
   */
  async detectFormatters() {
    return this.toolingDetector.detectFormatters();
  }

  /**
   * Detect test frameworks
   */
  async detectTestFrameworks() {
    return this.toolingDetector.detectTestFrameworks();
  }

  /**
   * Detect frameworks
   */
  async detectFrameworks() {
    return this.frameworkDetector.detectFrameworks();
  }

  /**
   * Detect REPL configuration
   */
  async detectRepl() {
    return this.frameworkDetector.detectRepl();
  }

  /**
   * Detect ClojureScript configuration
   */
  async detectClojureScript() {
    return this.frameworkDetector.detectClojureScript();
  }

  /**
   * Get command path using which/where
   */
  async getCommandPath(command) {
    return this.utilityHelper.getCommandPath(command);
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(tools) {
    return this.reportGenerator.generateEnvironmentReport(tools);
  }

  /**
   * Get project type description
   */
  getProjectTypeDescription(project) {
    return this.reportGenerator.getProjectTypeDescription(project);
  }

  /**
   * Get installation commands for missing tools
   */
  getInstallationCommands(tools) {
    return this.reportGenerator.getInstallationCommands(tools);
  }
}

module.exports = ClojureToolDetectorRefactored;
