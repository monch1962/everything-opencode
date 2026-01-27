#!/usr/bin/env node
/**
 * Project Structure Detection Utilities - Refactored Version
 *
 * Detect project structure, frameworks, and language-specific patterns
 * Refactored into modular architecture for better maintainability
 */

const path = require('path');
const fs = require('fs');
const { readFile } = require('./utils');
const FileUtils = require('./file-utils');

// Import modules (will be created)
const ProjectTypeDetector = require('./project-utils-modules/project-type-detector');
const ProjectStructureAnalyzer = require('./project-utils-modules/project-structure-analyzer');

class ProjectUtils {
  /**
   * Detect project type based on files in directory
   */
  static detectProjectType(projectPath) {
    return ProjectTypeDetector.detectProjectType(projectPath);
  }

  /**
   * Detect Node.js project
   */
  static detectNodeProject(projectPath) {
    return ProjectTypeDetector.detectNodeProject(projectPath);
  }

  /**
   * Detect Python project
   */
  static detectPythonProject(projectPath) {
    return ProjectTypeDetector.detectPythonProject(projectPath);
  }

  /**
   * Detect Go project
   */
  static detectGoProject(projectPath) {
    return ProjectTypeDetector.detectGoProject(projectPath);
  }

  /**
   * Detect Elixir project
   */
  static detectElixirProject(projectPath) {
    return ProjectTypeDetector.detectElixirProject(projectPath);
  }

  /**
   * Detect Ruby project
   */
  static detectRubyProject(projectPath) {
    return ProjectTypeDetector.detectRubyProject(projectPath);
  }

  /**
   * Detect Java project
   */
  static detectJavaProject(projectPath) {
    return ProjectTypeDetector.detectJavaProject(projectPath);
  }

  /**
   * Detect Rust project
   */
  static detectRustProject(projectPath) {
    return ProjectTypeDetector.detectRustProject(projectPath);
  }

  /**
   * Detect PHP project
   */
  static detectPhpProject(projectPath) {
    return ProjectTypeDetector.detectPhpProject(projectPath);
  }

  /**
   * Detect .NET project
   */
  static detectDotNetProject(projectPath) {
    return ProjectTypeDetector.detectDotNetProject(projectPath);
  }

  /**
   * Get project structure analysis
   */
  static getProjectStructure(projectPath, options = {}) {
    return ProjectStructureAnalyzer.getProjectStructure(projectPath, options);
  }

  /**
   * Get project metadata
   */
  static getProjectMetadata(projectPath) {
    return ProjectStructureAnalyzer.getProjectMetadata(projectPath);
  }
}

module.exports = ProjectUtils;
