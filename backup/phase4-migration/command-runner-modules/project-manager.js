#!/usr/bin/env node
/**
 * Project Manager for Clojure Command Runner
 *
 * Manages Clojure project information and configuration
 */

const path = require('path');
const fs = require('fs');
const ConfigManager = require('../../interactive/config-manager');
const { ProjectUtils, LoggingUtils } = require('../../lib');

class ProjectManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.config = null;
    this.clojureConfig = null;
    this.projectInfo = null;
  }

  /**
   * Initialize project manager
   */
  async initialize() {
    try {
      // Validate that we're in a Clojure project using ProjectUtils
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'clojure' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence}),`,
        );
        LoggingUtils.warn(
          'This may not be a Clojure project. Some features may not work correctly.,',
        );
      } else if (projectInfo.type === 'clojure') {
        LoggingUtils.debug(
          `Detected Clojure project: ${projectInfo.framework || 'standard Clojure'},`,
        );
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }

      // Load configuration
      this.config = this.configManager.loadConfig();
      this.clojureConfig = this.config?.clojure || {};

      // Store project info
      this.projectInfo = projectInfo;

      LoggingUtils.debug('Project manager initialized successfully');
    } catch (error) {
      LoggingUtils.error(`Failed to initialize project manager: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Clojure project information
   */
  getClojureProjectInfo(detectedTools, buildTool) {
    if (!detectedTools) {
      throw new Error('Tools not detected. Call initialize() first.');
    }

    return {
      ...detectedTools.project,
      tools: {
        java: detectedTools.java,
        clojureCli: detectedTools.clojureCli,
        leiningen: detectedTools.leiningen,
        boot: detectedTools.boot,
      },
      buildTool: buildTool,
      frameworks: detectedTools.frameworks,
      linters: detectedTools.linters,
      formatters: detectedTools.formatters,
      testFrameworks: detectedTools.testFrameworks,
      replTypes: detectedTools.replTypes,
      clojurescript: detectedTools.clojurescript,
      projectType: this.projectInfo?.type || 'unknown',
      confidence: this.projectInfo?.confidence || 0,
      framework: this.projectInfo?.framework || null,
      languages: this.projectInfo?.languages || [],
    };
  }

  /**
   * Get project configuration
   */
  getConfig() {
    return {
      config: this.config,
      clojureConfig: this.clojureConfig,
    };
  }

  /**
   * Update project configuration
   */
  updateConfig(updates) {
    if (!this.config) {
      this.config = {};
    }

    if (!this.config.clojure) {
      this.config.clojure = {};
    }

    // Merge updates
    this.config.clojure = { ...this.config.clojure, ...updates };

    // Save configuration
    this.configManager.saveConfig(this.config);
    this.clojureConfig = this.config.clojure;

    LoggingUtils.debug('Project configuration updated');
  }

  /**
   * Get project metadata
   */
  getProjectMetadata() {
    const metadata = {
      path: this.projectPath,
      name: path.basename(this.projectPath),
      type: this.projectInfo?.type || 'unknown',
      framework: this.projectInfo?.framework || null,
      languages: this.projectInfo?.languages || [],
      config: this.clojureConfig,
    };

    // Try to read project file for more metadata
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');
    const buildBootPath = path.join(this.projectPath, 'build.boot');

    if (fs.existsSync(depsEdnPath)) {
      metadata.projectFile = 'deps.edn';
      metadata.projectFilePath = depsEdnPath;
    } else if (fs.existsSync(projectCljPath)) {
      metadata.projectFile = 'project.clj';
      metadata.projectFilePath = projectCljPath;
    } else if (fs.existsSync(buildBootPath)) {
      metadata.projectFile = 'build.boot';
      metadata.projectFilePath = buildBootPath;
    }

    return metadata;
  }

  /**
   * Validate project structure
   */
  validateProjectStructure() {
    const issues = [];
    const warnings = [];

    // Check for source directories
    const srcDirs = ['src', 'test'];
    srcDirs.forEach((dir) => {
      const dirPath = path.join(this.projectPath, dir);
      if (!fs.existsSync(dirPath)) {
        warnings.push(`Source directory '${dir}' not found`);
      }
    });

    // Check for Clojure source files
    const cljFiles = this.findClojureFiles(this.projectPath);
    if (cljFiles.length === 0) {
      issues.push('No Clojure source files found');
    }

    // Check for project file
    const projectFiles = ['deps.edn', 'project.clj', 'build.boot'];
    const hasProjectFile = projectFiles.some((file) =>
      fs.existsSync(path.join(this.projectPath, file)),
    );

    if (!hasProjectFile) {
      warnings.push('No Clojure project file found (deps.edn, project.clj, or build.boot)');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      cljFileCount: cljFiles.length,
      hasProjectFile,
    };
  }

  /**
   * Find Clojure files in directory
   */
  findClojureFiles(dirPath) {
    const clojureFiles = [];

    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          // Skip hidden directories and common non-source directories
          if (!file.name.startsWith('.') && file.name !== 'target' && file.name !== '.cpcache') {
            clojureFiles.push(...this.findClojureFiles(fullPath));
          }
        } else if (file.isFile()) {
          // Check for Clojure file extensions
          if (
            file.name.endsWith('.clj') ||
            file.name.endsWith('.cljs') ||
            file.name.endsWith('.cljc')
          ) {
            clojureFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      LoggingUtils.debug(`Error reading directory ${dirPath}: ${error.message}`);
    }

    return clojureFiles;
  }

  /**
   * Get project statistics
   */
  getProjectStatistics() {
    const cljFiles = this.findClojureFiles(this.projectPath);
    const srcFiles = cljFiles.filter((file) => file.includes('/src/'));
    const testFiles = cljFiles.filter((file) => file.includes('/test/'));

    // Count lines of code (approximate)
    let totalLines = 0;
    let srcLines = 0;
    let testLines = 0;

    cljFiles.forEach((file) => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;

        totalLines += lines;

        if (file.includes('/src/')) {
          srcLines += lines;
        } else if (file.includes('/test/')) {
          testLines += lines;
        }
      } catch (error) {
        LoggingUtils.debug(`Error reading file ${file}: ${error.message}`);
      }
    });

    return {
      totalFiles: cljFiles.length,
      srcFiles: srcFiles.length,
      testFiles: testFiles.length,
      totalLines,
      srcLines,
      testLines,
      testCoverage: srcFiles.length > 0 ? (testFiles.length / srcFiles.length) * 100 : 0,
    };
  }

  /**
   * Generate project report
   */
  generateProjectReport(detectedTools, buildTool) {
    const projectInfo = this.getClojureProjectInfo(detectedTools, buildTool);
    const metadata = this.getProjectMetadata();
    const stats = this.getProjectStatistics();
    const validation = this.validateProjectStructure();

    const lines = [];
    lines.push('Clojure Project Report');
    lines.push('======================');
    lines.push('');

    // Basic information
    lines.push('Basic Information:');
    lines.push(`  Project: ${metadata.name}`);
    lines.push(`  Path: ${metadata.path}`);
    lines.push(`  Type: ${metadata.type} (confidence: ${metadata.confidence})`);
    lines.push(`  Framework: ${metadata.framework || 'None'}`);
    lines.push(`  Languages: ${metadata.languages.join(', ') || 'None'}`);
    lines.push('');

    // Build tool information
    lines.push('Build Tool:');
    lines.push(`  Selected: ${buildTool || 'None'}`);
    if (buildTool) {
      const toolInfo = projectInfo.tools[buildTool === 'clojure-cli' ? 'clojureCli' : buildTool];
      if (toolInfo) {
        lines.push(`  Version: ${toolInfo.version || 'unknown'}`);
        lines.push(`  Installed: ${toolInfo.installed ? 'Yes' : 'No'}`);
      }
    }
    lines.push('');

    // Project files
    lines.push('Project Files:');
    lines.push(`  deps.edn: ${projectInfo.hasDepsEdn ? '✓ Found' : '✗ Not found'}`);
    lines.push(`  project.clj: ${projectInfo.hasProjectClj ? '✓ Found' : '✗ Not found'}`);
    lines.push(`  build.boot: ${projectInfo.hasBuildBoot ? '✓ Found' : '✗ Not found'}`);
    lines.push('');

    // Statistics
    lines.push('Statistics:');
    lines.push(`  Total Clojure files: ${stats.totalFiles}`);
    lines.push(`  Source files: ${stats.srcFiles}`);
    lines.push(`  Test files: ${stats.testFiles}`);
    lines.push(`  Total lines: ${stats.totalLines}`);
    lines.push(`  Source lines: ${stats.srcLines}`);
    lines.push(`  Test lines: ${stats.testLines}`);
    lines.push(`  Test coverage: ${stats.testCoverage.toFixed(1)}%`);
    lines.push('');

    // Validation
    lines.push('Validation:');
    lines.push(`  Valid: ${validation.valid ? '✓ Yes' : '✗ No'}`);
    if (validation.issues.length > 0) {
      lines.push('  Issues:');
      validation.issues.forEach((issue) => {
        lines.push(`    • ${issue}`);
      });
    }
    if (validation.warnings.length > 0) {
      lines.push('  Warnings:');
      validation.warnings.forEach((warning) => {
        lines.push(`    • ${warning}`);
      });
    }

    return lines.join('\n');
  }
}

module.exports = ProjectManager;
