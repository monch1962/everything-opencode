#!/usr/bin/env node
/**
 * Python Initializer Module for PythonCommandRunner
 *
 * Initialization methods: constructor, initialize, checkTool
 */

const path = require('path');
const fs = require('fs');
const ConfigManager = require('../../interactive/config-manager');
const PythonToolDetector = require('../../../languages/python/tool-detector');
const { ConfigUtils, ProjectUtils, LoggingUtils } = require('../../lib');

class PythonInitializer {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new PythonToolDetector();
    this.config = null;
    this.pythonConfig = null;
  }

  /**
   * Initialize command runner
   */
  async initialize() {
    // First, validate that we're in a Python project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'python' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn(
          'This may not be a Python project. Some features may not work correctly.'
        );
      } else if (projectInfo.type === 'python') {
        LoggingUtils.debug(
          `Detected Python project: ${projectInfo.framework || 'standard Python'}`
        );
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }
    } catch (error) {
      LoggingUtils.debug('Project detection failed:', error.message);
    }

    // Load configuration using ConfigUtils
    try {
      this.config = ConfigUtils.loadConfig(this.projectPath);
      if (!this.config) {
        throw new Error('Project not configured. Run /python-setup first.');
      }

      // Get Python configuration
      this.pythonConfig = this.config.python;
      if (!this.pythonConfig) {
        throw new Error('Python configuration not found. Run /python-setup first.');
      }

      // Validate Python configuration schema
      ConfigUtils.validateConfig(this.pythonConfig, 'python');

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error('Failed to initialize Python command runner:', error.message);
      LoggingUtils.info('Run /python-setup to configure your Python project');
      throw error;
    }
  }

  /**
   * Check if required tool is installed
   */
  async checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = await ConfigUtils.checkToolInstalled(toolName, {
        config: this.pythonConfig,
        language: 'python',
        required,
      });

      if (!isInstalled && required) {
        throw new Error(`${toolName} is not installed. Install it or run /python-setup.`);
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(`Tool check failed: ${error.message}`);
        throw error;
      } else {
        LoggingUtils.debug(`Tool ${toolName} not installed (optional): ${error.message}`);
        return false;
      }
    }
  }

  /**
   * Get configuration
   */
  getConfig() {
    return {
      projectPath: this.projectPath,
      config: this.config,
      pythonConfig: this.pythonConfig,
      configManager: this.configManager,
      toolDetector: this.toolDetector,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = newConfig.config || this.config;
    this.pythonConfig = newConfig.pythonConfig || this.pythonConfig;
  }
}

module.exports = PythonInitializer;
