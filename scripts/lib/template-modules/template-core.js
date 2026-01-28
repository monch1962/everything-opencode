#!/usr/bin/env node
/**
 * Template Core Module for TemplateUtils
 *
 * Core template rendering methods: renderTemplate, renderTemplateFile, generateFile
 */

const fs = require('fs');
const path = require('path');
const { ensureDir } = require('../utils');

class TemplateCore {
  /**
   * Render template with variables
   */
  static renderTemplate(template, variables = {}) {
    if (typeof template !== 'string') {
      return template;
    }

    // Simple template rendering with {{variable}} syntax
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] !== undefined ? String(variables[variable]) : match;
    });
  }

  /**
   * Render template file
   */
  static renderTemplateFile(templatePath, variables = {}) {
    try {
      const template = fs.readFileSync(templatePath, 'utf8');
      return this.renderTemplate(template, variables);
    } catch (error) {
      throw new Error(`Failed to read template file ${templatePath}: ${error.message}`);
    }
  }

  /**
   * Generate file from template
   */
  static generateFile(templatePath, outputPath, variables = {}, options = {}) {
    const { overwrite = false, backup = true, createDir = true } = options;

    // Check if output file exists
    if (fs.existsSync(outputPath) && !overwrite) {
      throw new Error(`File already exists: ${outputPath}. Use overwrite option to replace.`);
    }

    // Create directory if needed
    if (createDir) {
      const outputDir = path.dirname(outputPath);
      ensureDir(outputDir);
    }

    // Backup existing file
    if (fs.existsSync(outputPath) && backup) {
      const backupPath = `${outputPath}.backup-${Date.now()}`;
      fs.copyFileSync(outputPath, backupPath);
    }

    try {
      // Render template
      const content = this.renderTemplateFile(templatePath, variables);

      // Write file
      fs.writeFileSync(outputPath, content, 'utf8');

      return {
        success: true,
        path: outputPath,
        size: content.length,
        variables: Object.keys(variables),
      };
    } catch (error) {
      throw new Error(`Failed to generate file ${outputPath}: ${error.message}`);
    }
  }
}

module.exports = TemplateCore;
