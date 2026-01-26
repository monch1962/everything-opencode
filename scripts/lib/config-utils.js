#!/usr/bin/env node
/**
 * Shared Configuration Utilities
 *
 * Common configuration patterns for language tools
 */

const path = require('path');
const fs = require('fs');
const { ensureDir, readFile, writeFile } = require('./utils');

class ConfigUtils {
  /**
   * Get configuration for a specific language
   */
  static getLanguageConfig(projectPath, language) {
    const configManager = require('../interactive/config-manager');
    const manager = new configManager(projectPath);
    const config = manager.loadConfig();

    if (!config) {
      throw new Error(`Project not configured. Run /${language}-setup first.`);
    }

    const languageConfig = config[language];
    if (!languageConfig) {
      throw new Error(
        `${language} configuration not found. Run /${language}-setup first.`,
      );
    }

    return {
      config,
      languageConfig,
      manager,
    };
  }

  /**
   * Check if a tool is installed in language configuration
   */
  static checkToolInstalled(languageConfig, toolName, required = true) {
    const toolInfo = languageConfig.tools?.[toolName];

    if (!toolInfo || !toolInfo.installed) {
      if (required) {
        throw new Error(
          `Required ${languageConfig.name || 'language'} tool '${toolName}' is not installed. ` +
            `Run /${languageConfig.name || 'language'}-setup to install it.`,
        );
      }
      return false;
    }

    return true;
  }

  /**
   * Get tool path from configuration or system
   */
  static getToolPath(
    toolName,
    languageConfig,
    platformDetector,
    customLocations = [],
  ) {
    // Check if tool has custom path in config
    const toolInfo = languageConfig.tools?.[toolName];
    if (toolInfo?.path && fs.existsSync(toolInfo.path)) {
      return toolInfo.path;
    }

    // Use platform detector to find tool
    if (
      platformDetector &&
      typeof platformDetector.getToolPath === 'function'
    ) {
      return platformDetector.getToolPath(toolName, {
        required: true,
        customLocations,
      });
    }

    // Fallback to checking PATH
    const { commandExists } = require('./utils');
    if (commandExists(toolName)) {
      return toolName;
    }

    throw new Error(
      `Tool '${toolName}' not found. Install it or check your PATH.`,
    );
  }

  /**
   * Create default language configuration
   */
  static createDefaultLanguageConfig(language, options = {}) {
    const defaults = {
      name: language,
      version: '1.0.0',
      tools: {},
      configuredAt: new Date().toISOString(),
      ...options,
    };

    return defaults;
  }

  /**
   * Merge configurations with proper deep merging
   */
  static mergeConfigs(baseConfig, newConfig) {
    const result = { ...baseConfig };

    for (const key in newConfig) {
      if (newConfig.hasOwnProperty(key)) {
        if (
          typeof newConfig[key] === 'object' &&
          newConfig[key] !== null &&
          typeof result[key] === 'object' &&
          result[key] !== null &&
          !Array.isArray(newConfig[key]) &&
          !Array.isArray(result[key])
        ) {
          // Recursively merge objects
          result[key] = this.mergeConfigs(result[key], newConfig[key]);
        } else {
          // Replace primitives or arrays
          result[key] = newConfig[key];
        }
      }
    }

    return result;
  }

  /**
   * Validate configuration against schema
   */
  static validateConfig(config, schema = {}) {
    const errors = [];

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (config[field] === undefined) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check field types
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (config[field] !== undefined) {
          const value = config[field];
          const expectedType = fieldSchema.type;

          if (expectedType === 'string' && typeof value !== 'string') {
            errors.push(
              `Field '${field}' should be string, got ${typeof value}`,
            );
          } else if (expectedType === 'number' && typeof value !== 'number') {
            errors.push(
              `Field '${field}' should be number, got ${typeof value}`,
            );
          } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
            errors.push(
              `Field '${field}' should be boolean, got ${typeof value}`,
            );
          } else if (expectedType === 'array' && !Array.isArray(value)) {
            errors.push(
              `Field '${field}' should be array, got ${typeof value}`,
            );
          } else if (
            expectedType === 'object' &&
            (typeof value !== 'object' ||
              value === null ||
              Array.isArray(value))
          ) {
            errors.push(
              `Field '${field}' should be object, got ${typeof value}`,
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Save configuration with backup
   */
  static saveConfigWithBackup(configPath, config) {
    const dir = path.dirname(configPath);
    ensureDir(dir);

    // Create backup if config exists
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
    }

    // Save new config
    writeFile(configPath, JSON.stringify(config, null, 2));

    return true;
  }

  /**
   * Load configuration with defaults
   */
  static loadConfigWithDefaults(configPath, defaults = {}) {
    try {
      if (fs.existsSync(configPath)) {
        const content = readFile(configPath);
        const config = JSON.parse(content);
        return this.mergeConfigs(defaults, config);
      }
    } catch (error) {
      console.error(`Error loading config from ${configPath}:`, error.message);
    }

    return defaults;
  }

  /**
   * Get environment-specific configuration
   */
  static getEnvironmentConfig(
    config,
    environment = process.env.NODE_ENV || 'development',
  ) {
    const envConfig = config.environments?.[environment] || {};
    return this.mergeConfigs(config, envConfig);
  }

  /**
   * Create configuration schema for a language
   */
  static createLanguageSchema(language, toolDefinitions = []) {
    const schema = {
      type: 'object',
      required: ['name', 'tools'],
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        tools: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              installed: { type: 'boolean' },
              version: { type: 'string' },
              path: { type: 'string' },
              options: { type: 'object' },
            },
          },
        },
        environments: {
          type: 'object',
          additionalProperties: { type: 'object' },
        },
      },
    };

    // Add tool-specific properties
    for (const tool of toolDefinitions) {
      if (schema.properties.tools.properties[tool.name]) {
        schema.properties.tools.properties[tool.name] = {
          type: 'object',
          properties: {
            installed: { type: 'boolean' },
            version: { type: 'string' },
            path: { type: 'string' },
            ...tool.schema,
          },
        };
      }
    }

    return schema;
  }
}

module.exports = ConfigUtils;
