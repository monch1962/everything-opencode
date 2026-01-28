#!/usr/bin/env node
/**
 * Directory Processor Module for TemplateUtils
 *
 * Directory template processing methods: generateFromTemplateDir, _processTemplateDir
 */

const fs = require('fs');
const path = require('path');
const TemplateCore = require('./template-core');

class DirectoryProcessor {
  /**
   * Generate files from template directory
   */
  static generateFromTemplateDir(templateDir, outputDir, variables = {}, options = {}) {
    const { overwrite = false, backup = true, createDir = true, skipExisting = false } = options;

    // Validate template directory
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    // Create output directory
    if (createDir && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = {
      generated: [],
      skipped: [],
      errors: [],
      total: 0,
    };

    // Process template directory
    this._processTemplateDir(templateDir, outputDir, variables, options, results, '');

    return results;
  }

  /**
   * Process template directory recursively
   */
  static _processTemplateDir(templateDir, outputDir, variables, options, results, relativePath) {
    const { overwrite = false, backup = true, skipExisting = false } = options;

    const currentTemplateDir = path.join(templateDir, relativePath);
    const currentOutputDir = path.join(outputDir, relativePath);

    // Ensure output directory exists
    if (!fs.existsSync(currentOutputDir)) {
      fs.mkdirSync(currentOutputDir, { recursive: true });
    }

    // Read directory contents
    const items = fs.readdirSync(currentTemplateDir);

    for (const item of items) {
      const templatePath = path.join(currentTemplateDir, item);
      const outputPath = path.join(currentOutputDir, item);
      const itemRelativePath = path.join(relativePath, item);

      const stat = fs.statSync(templatePath);

      if (stat.isDirectory()) {
        // Recursively process subdirectory
        this._processTemplateDir(
          templateDir,
          outputDir,
          variables,
          options,
          results,
          itemRelativePath
        );
      } else if (stat.isFile()) {
        // Process template file
        results.total++;

        // Skip non-template files (based on extension)
        const ext = path.extname(item);
        const isTemplateFile =
          ['.template', '.tmpl', '.tpl'].includes(ext) || item.includes('.template.');

        if (!isTemplateFile) {
          results.skipped.push({
            path: itemRelativePath,
            reason: 'Not a template file',
          });
          continue;
        }

        // Determine output filename (remove template extension)
        let outputFilename = item;
        if (ext === '.template' || ext === '.tmpl' || ext === '.tpl') {
          outputFilename = item.slice(0, -ext.length);
        } else if (item.includes('.template.')) {
          outputFilename = item.replace('.template.', '.');
        }

        const finalOutputPath = path.join(currentOutputDir, outputFilename);
        const finalRelativePath = path.join(relativePath, outputFilename);

        // Check if file already exists
        if (fs.existsSync(finalOutputPath)) {
          if (skipExisting) {
            results.skipped.push({
              path: finalRelativePath,
              reason: 'File already exists',
            });
            continue;
          }

          if (!overwrite) {
            results.errors.push({
              path: finalRelativePath,
              error: 'File already exists and overwrite is false',
            });
            continue;
          }

          // Backup existing file
          if (backup) {
            const backupPath = `${finalOutputPath}.backup-${Date.now()}`;
            fs.copyFileSync(finalOutputPath, backupPath);
          }
        }

        try {
          // Generate file from template
          const result = TemplateCore.generateFile(templatePath, finalOutputPath, variables, {
            overwrite: true,
            backup: false,
            createDir: false,
          });

          results.generated.push({
            path: finalRelativePath,
            size: result.size,
            variables: result.variables,
          });
        } catch (error) {
          results.errors.push({
            path: finalRelativePath,
            error: error.message,
          });
        }
      }
    }
  }
}

module.exports = DirectoryProcessor;
