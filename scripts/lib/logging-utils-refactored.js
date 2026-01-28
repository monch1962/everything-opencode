#!/usr/bin/env node
/**
 * Logging and Output Formatting Utilities - Refactored Version
 *
 * Consistent logging, output formatting, and user feedback for language tools
 *
 * This is a refactored version that delegates to modular components while
 * maintaining 100% backward compatibility with the original API.
 */

const dependencyLoader = require('./logging-utils-modules/dependency-loader');
const configManager = require('./logging-utils-modules/config-manager');
const basicLogger = require('./logging-utils-modules/basic-logger');
const uiComponents = require('./logging-utils-modules/ui-components');
const formatterUtils = require('./logging-utils-modules/formatter-utils');

// Initialize dependencies
const { chalk, boxen, ora, Table, ProgressBar } = dependencyLoader.loadDependencies();

// Initialize configuration
configManager.initialize(chalk);

class LoggingUtils {
  /**
   * Initialize logging utilities with optional configuration
   * @param {Object} config - Configuration options
   */
  static initialize(config = {}) {
    configManager.initialize(chalk, config);
  }

  /**
   * Set the current log level
   * @param {string} level - Log level (error, warn, info, debug)
   */
  static setLevel(level) {
    configManager.setLevel(level);
  }

  /**
   * Get the current log level
   * @returns {string} Current log level
   */
  static getLevel() {
    return configManager.getLevel();
  }

  /**
   * Check if a level should be logged
   * @param {string} level - Level to check
   * @returns {boolean} Whether the level should be logged
   */
  static shouldLog(level) {
    return configManager.shouldLog(level);
  }

  // Basic logging methods
  static error(message, ...args) {
    return basicLogger.error(chalk, message, ...args);
  }

  static warn(message, ...args) {
    return basicLogger.warn(chalk, message, ...args);
  }

  static info(message, ...args) {
    return basicLogger.info(chalk, message, ...args);
  }

  static debug(message, ...args) {
    return basicLogger.debug(chalk, message, ...args);
  }

  static success(message, ...args) {
    return basicLogger.success(chalk, message, ...args);
  }

  // UI Components
  static spinner(text) {
    return uiComponents.spinner(ora, text);
  }

  static progressBar(total, options = {}) {
    return uiComponents.progressBar(ProgressBar, total, options);
  }

  static table(options = {}) {
    return uiComponents.table(Table, options);
  }

  static box(text, options = {}) {
    return uiComponents.box(boxen, text, options);
  }

  static section(title, options = {}) {
    return uiComponents.section(chalk, title, options);
  }

  static keyValue(key, value, options = {}) {
    return uiComponents.keyValue(chalk, key, value, options);
  }

  // Formatter Utilities
  static formatCode(code, language = 'javascript') {
    return formatterUtils.formatCode(chalk, code, language);
  }

  static formatCommand(command) {
    return formatterUtils.formatCommand(chalk, command);
  }

  static formatFilePath(filePath) {
    return formatterUtils.formatFilePath(chalk, filePath);
  }

  static formatJson(data, options = {}) {
    return formatterUtils.formatJson(chalk, data, options);
  }

  static formatError(error, options = {}) {
    return formatterUtils.formatError(chalk, error, options);
  }

  static formatSuccessSummary(results, options = {}) {
    return formatterUtils.formatSuccessSummary(chalk, results, options);
  }

  static formatSecurityResults(results, options = {}) {
    return formatterUtils.formatSecurityResults(chalk, results, options);
  }

  // Static properties for backward compatibility
  static get chalk() {
    return chalk;
  }

  static get boxen() {
    return boxen;
  }

  static get ora() {
    return ora;
  }

  static get Table() {
    return Table;
  }

  static get ProgressBar() {
    return ProgressBar;
  }
}

// Export the class
module.exports = LoggingUtils;
