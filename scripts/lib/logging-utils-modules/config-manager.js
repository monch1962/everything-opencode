#!/usr/bin/env node
/**
 * Config Manager Module for LoggingUtils
 *
 * Configuration, level management, and initialization
 */

class ConfigManager {
  constructor(dependencies) {
    this.dependencies = dependencies;
    this.config = {
      level: 'info',
      colors: true,
      timestamps: false,
      debug: false,
    };
  }

  /**
   * Initialize logging configuration
   */
  init(options = {}) {
    // Merge with default config
    this.config = {
      ...this.config,
      ...options,
    };

    // Set environment-based defaults
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
      this.config.level = 'warn';
      this.config.colors = false;
    }

    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      this.config.debug = true;
      if (this.config.level === 'info') {
        this.config.level = 'debug';
      }
    }

    // Apply color disabling if requested
    if (!this.config.colors) {
      this.disableColors();
    }

    return this.config;
  }

  /**
   * Disable colors in dependencies
   */
  disableColors() {
    // Make all chalk methods return plain text
    const noop = (s) => s;
    this.dependencies.chalk = {
      red: noop,
      yellow: noop,
      blue: noop,
      green: noop,
      gray: noop,
      dim: noop,
      bold: {
        cyan: noop,
        magenta: noop,
        yellow: noop,
      },
      cyan: noop,
      magenta: noop,
      white: noop,
      bgBlack: {
        white: noop,
      },
    };

    // Update colors mapping
    this.dependencies.colors = {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      success: noop,
      title: noop,
      subtitle: noop,
      highlight: noop,
      code: noop,
      path: noop,
      command: noop,
      json: noop,
    };
  }

  /**
   * Normalize log level string
   */
  normalizeLevel(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      success: 2, // Same as info
    };

    const normalized = (level || '').toLowerCase();
    return levels.hasOwnProperty(normalized) ? normalized : 'info';
  }

  /**
   * Check if a message at given level should be logged
   */
  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      success: 2,
    };

    const currentLevel = this.normalizeLevel(this.config.level);
    const messageLevel = this.normalizeLevel(level);

    return levels[messageLevel] <= levels[currentLevel];
  }

  /**
   * Format timestamp for log messages
   */
  formatTimestamp() {
    if (!this.config.timestamps) {
      return '';
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `[${hours}:${minutes}:${seconds}] `;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get current log level
   */
  getLevel() {
    return this.config.level;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    // Re-apply color settings if changed
    if (newConfig.colors !== undefined) {
      if (!newConfig.colors) {
        this.disableColors();
      }
    }

    return this.config;
  }

  /**
   * Set log level
   */
  setLevel(level) {
    return this.updateConfig({ level });
  }

  /**
   * Enable/disable colors
   */
  setColors(enabled) {
    return this.updateConfig({ colors: enabled });
  }

  /**
   * Enable/disable timestamps
   */
  setTimestamps(enabled) {
    return this.updateConfig({ timestamps: enabled });
  }

  /**
   * Enable/disable debug mode
   */
  setDebug(enabled) {
    return this.updateConfig({ debug: enabled });
  }
}

module.exports = ConfigManager;
