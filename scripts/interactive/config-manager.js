#!/usr/bin/env node
/**
 * Project Configuration Manager
 *
 * Manages project-specific configurations for opencode
 */

const fs = require("fs");
const path = require("path");
const {
  getOpencodeDir,
  ensureDir,
  readFile,
  writeFile,
} = require("../lib/utils");

class ConfigManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configDir = path.join(projectPath, ".opencode");
    this.configPath = path.join(this.configDir, "project-config.json");
    this.globalConfigPath = path.join(getOpencodeDir(), "language-config.json");
  }

  /**
   * Load project configuration
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = readFile(this.configPath);
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("Error loading config:", error.message);
    }
    return null;
  }

  /**
   * Save project configuration
   */
  saveConfig(config) {
    try {
      ensureDir(this.configDir);

      // Add metadata
      const fullConfig = {
        $schema: "https://json.schemastore.org/opencode-project-config.json",
        project: this.projectPath,
        configuredAt: new Date().toISOString(),
        ...config,
      };

      writeFile(this.configPath, JSON.stringify(fullConfig, null, 2));
      return true;
    } catch (error) {
      console.error("Error saving config:", error.message);
      return false;
    }
  }

  /**
   * Check if project is configured
   */
  isConfigured() {
    const config = this.loadConfig();
    return config !== null && config.configuredAt;
  }

  /**
   * Get configuration for specific language
   */
  getLanguageConfig(language) {
    const config = this.loadConfig();
    if (!config) return null;

    return config[language] || null;
  }

  /**
   * Update language configuration
   */
  updateLanguageConfig(language, languageConfig) {
    const config = this.loadConfig() || {};

    config[language] = {
      ...(config[language] || {}),
      ...languageConfig,
      updatedAt: new Date().toISOString(),
    };

    return this.saveConfig(config);
  }

  /**
   * Set primary language for project
   */
  setPrimaryLanguage(language) {
    const config = this.loadConfig() || {};
    config.primaryLanguage = language;
    return this.saveConfig(config);
  }

  /**
   * Get primary language
   */
  getPrimaryLanguage() {
    const config = this.loadConfig();
    return config?.primaryLanguage || null;
  }

  /**
   * Add secondary language
   */
  addSecondaryLanguage(language) {
    const config = this.loadConfig() || {};

    if (!config.secondaryLanguages) {
      config.secondaryLanguages = [];
    }

    if (!config.secondaryLanguages.includes(language)) {
      config.secondaryLanguages.push(language);
    }

    return this.saveConfig(config);
  }

  /**
   * Remove configuration
   */
  removeConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
        return true;
      }
    } catch (error) {
      console.error("Error removing config:", error.message);
    }
    return false;
  }

  /**
   * Load global configuration
   */
  loadGlobalConfig() {
    try {
      if (fs.existsSync(this.globalConfigPath)) {
        const content = readFile(this.globalConfigPath);
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("Error loading global config:", error.message);
    }

    // Return default global config
    return {
      preferredLanguage: "auto",
      detectionPriority: ["python", "typescript", "go", "rust", "pinescript"],
      autoConfigure: true,
      promptLevel: "moderate",
    };
  }

  /**
   * Save global configuration
   */
  saveGlobalConfig(config) {
    try {
      ensureDir(path.dirname(this.globalConfigPath));

      const fullConfig = {
        $schema: "https://json.schemastore.org/opencode-language-config.json",
        updatedAt: new Date().toISOString(),
        ...config,
      };

      writeFile(this.globalConfigPath, JSON.stringify(fullConfig, null, 2));
      return true;
    } catch (error) {
      console.error("Error saving global config:", error.message);
      return false;
    }
  }

  /**
   * Get configuration schema for validation
   */
  getSchema() {
    return {
      type: "object",
      properties: {
        project: { type: "string" },
        configuredAt: { type: "string", format: "date-time" },
        primaryLanguage: {
          type: "string",
          enum: ["python", "typescript", "go", "rust", "pinescript", "auto"],
        },
        secondaryLanguages: {
          type: "array",
          items: {
            type: "string",
            enum: ["python", "typescript", "go", "rust", "pinescript"],
          },
        },
        python: {
          type: "object",
          properties: {
            projectType: {
              type: "string",
              enum: [
                "fastapi",
                "django",
                "flask",
                "data-science",
                "machine-learning",
                "cli",
                "library",
                "unknown",
              ],
            },
            dependencyManager: {
              type: "string",
              enum: ["uv", "poetry", "pip", "conda", "unknown"],
            },
            testRunner: {
              type: "string",
              enum: ["pytest", "unittest", "none"],
            },
            linter: {
              type: "string",
              enum: ["ruff", "flake8", "pylint", "none"],
            },
            formatter: {
              type: "string",
              enum: ["ruff", "black", "autopep8", "none"],
            },
            typeChecker: {
              type: "string",
              enum: ["pyright", "mypy", "none"],
            },
            tools: {
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  installed: { type: "boolean" },
                  version: { type: "string" },
                },
              },
            },
            userApproved: { type: "boolean" },
          },
        },
        pinescript: {
          type: "object",
          properties: {
            version: {
              type: "string",
              enum: ["4", "5", "6", "auto"],
            },
            projectType: {
              type: "string",
              enum: ["indicator", "strategy", "library", "unknown"],
            },
            backtesting: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                dataSource: {
                  type: "string",
                  enum: ["tradingview", "csv", "api", "database"],
                },
                optimization: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean" },
                    method: {
                      type: "string",
                      enum: ["grid", "random", "bayesian", "genetic"],
                    },
                    maxIterations: { type: "number", minimum: 1 },
                    walkForward: { type: "boolean" },
                  },
                },
                metrics: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "netProfit",
                      "winRate",
                      "profitFactor",
                      "maxDrawdown",
                      "sharpeRatio",
                      "sortinoRatio",
                      "calmarRatio",
                    ],
                  },
                },
              },
            },
            alerts: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                webhooks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      method: { type: "string", enum: ["POST", "GET"] },
                      template: { type: "string" },
                      events: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
                email: { type: "boolean" },
                discord: { type: "boolean" },
                telegram: { type: "boolean" },
              },
            },
            tradingview: {
              type: "object",
              properties: {
                publish: { type: "boolean" },
                apiKey: { type: "string" },
                workspace: { type: "string" },
              },
            },
            tools: {
              type: "object",
              properties: {
                parser: { type: "string" },
                backtester: { type: "string" },
                optimizer: { type: "string" },
                validator: { type: "string" },
              },
            },
            userApproved: { type: "boolean" },
          },
        },
      },
      required: ["project", "configuredAt", "primaryLanguage"],
    };
  }

  /**
   * Validate configuration against schema
   */
  validateConfig(config) {
    // Simple validation for now
    const errors = [];

    if (!config.project) {
      errors.push("Missing project path");
    }

    if (!config.configuredAt) {
      errors.push("Missing configuration timestamp");
    }

    if (!config.primaryLanguage) {
      errors.push("Missing primary language");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export configuration for sharing
   */
  exportConfig(format = "json") {
    const config = this.loadConfig();
    if (!config) return null;

    // Remove sensitive/absolute paths
    const exportConfig = { ...config };
    delete exportConfig.project;

    if (format === "json") {
      return JSON.stringify(exportConfig, null, 2);
    } else if (format === "yaml") {
      // Simple YAML conversion
      return Object.entries(exportConfig)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join("\n");
    }

    return null;
  }

  /**
   * Import configuration
   */
  importConfig(configData, format = "json") {
    let config;

    try {
      if (format === "json") {
        config = JSON.parse(configData);
      } else if (format === "yaml") {
        // Simple YAML parsing
        config = {};
        configData.split("\n").forEach((line) => {
          const [key, ...valueParts] = line.split(":");
          if (key && valueParts.length > 0) {
            config[key.trim()] = JSON.parse(valueParts.join(":").trim());
          }
        });
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      // Add project path and timestamp
      config.project = this.projectPath;
      config.configuredAt = new Date().toISOString();

      return this.saveConfig(config);
    } catch (error) {
      console.error("Error importing config:", error.message);
      return false;
    }
  }
}

module.exports = ConfigManager;
