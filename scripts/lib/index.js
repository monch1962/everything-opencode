#!/usr/bin/env node
/**
 * Shared Utilities Index
 *
 * Main entry point for all shared utilities
 */

// Core utilities
const utils = require('./utils');
const errorHandler = require('./error-handler');

// New shared utilities
const ConfigUtils = require('./config-utils');
const FileUtils = require('./file-utils');
const ProjectUtils = require('./project-utils');
const TemplateUtils = require('./template-utils');
const LoggingUtils = require('./logging-utils');

// Re-export everything
module.exports = {
  // Core utilities
  ...utils,
  errorHandler,

  // New shared utilities
  ConfigUtils,
  FileUtils,
  ProjectUtils,
  TemplateUtils,
  LoggingUtils,

  // Convenience exports
  config: ConfigUtils,
  file: FileUtils,
  project: ProjectUtils,
  template: TemplateUtils,
  log: LoggingUtils,
};
