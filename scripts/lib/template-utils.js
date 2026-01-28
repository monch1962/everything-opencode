#!/usr/bin/env node
/**
 * Template Generation Utilities - Refactored Version
 *
 * Generate files and code from templates for language tools
 * This is a refactored version that delegates to modular components while
 * maintaining 100% backward compatibility with the original API.
 */

const path = require('path');
const fs = require('fs');
const { ensureDir, writeFile } = require('./utils');
const FileUtils = require('./file-utils');

// Import modules
const TemplateCore = require('./template-modules/template-core');
const DirectoryProcessor = require('./template-modules/directory-processor');
const LanguageTemplates = require('./template-modules/language-templates');
const ProjectGenerator = require('./template-modules/project-generator');
const TemplateValidator = require('./template-modules/template-validator');

/**
 * Template Generation Utilities - Main class for template-based file generation
 *
 * This class provides static methods for rendering templates, generating files,
 * and creating language-specific projects. It delegates to modular components
 * while maintaining 100% backward compatibility with the original API.
 *
 * @class TemplateUtils
 */
class TemplateUtils {
  /**
   * Renders template string with variables using {{variable}} syntax
   *
   * @param {string} template - Template string
   * @param {Object} [variables={}] - Variables to inject into template
   * @returns {string} Rendered template
   * @example
   * const result = TemplateUtils.renderTemplate('Hello {{name}}!', { name: 'World' });
   * // Returns: 'Hello World!'
   */
  static renderTemplate(template, variables = {}) {
    return TemplateCore.renderTemplate(template, variables);
  }

  /**
   * Render template file
   */
  static renderTemplateFile(templatePath, variables = {}) {
    return TemplateCore.renderTemplateFile(templatePath, variables);
  }

  /**
   * Generate file from template
   */
  static generateFile(templatePath, outputPath, variables = {}, options = {}) {
    return TemplateCore.generateFile(templatePath, outputPath, variables, options);
  }

  /**
   * Generate files from template directory
   */
  static generateFromTemplateDir(templateDir, outputDir, variables = {}, options = {}) {
    return DirectoryProcessor.generateFromTemplateDir(templateDir, outputDir, variables, options);
  }

  /**
   * Process template directory recursively
   */
  static _processTemplateDir(templateDir, outputDir, variables, options, results, relativePath) {
    return DirectoryProcessor._processTemplateDir(
      templateDir,
      outputDir,
      variables,
      options,
      results,
      relativePath
    );
  }

  /**
   * Get language-specific templates
   */
  static getLanguageTemplates(language) {
    return LanguageTemplates.getLanguageTemplates(language);
  }

  /**
   * Generate language project
   */
  static generateLanguageProject(language, projectPath, variables = {}, options = {}) {
    return LanguageTemplates.generateLanguageProject(language, projectPath, variables, options);
  }

  /**
   * Generate language configuration
   */
  static generateLanguageConfig(language, configPath, variables = {}, options = {}) {
    return LanguageTemplates.generateLanguageConfig(language, configPath, variables, options);
  }

  /**
   * Generate README file
   */
  static generateReadme(projectPath, variables = {}, options = {}) {
    return ProjectGenerator.generateReadme(projectPath, variables, options);
  }

  /**
   * Generate .gitignore file
   */
  static generateGitignore(projectPath, language, _options = {}) {
    return ProjectGenerator.generateGitignore(projectPath, language, _options);
  }

  /**
   * Validate template variables
   */
  static validateVariables(variables, required = []) {
    return TemplateValidator.validateVariables(variables, required);
  }

  // Additional utility methods for module access (for testing/debugging)
  static getTemplateCore() {
    return TemplateCore;
  }

  static getDirectoryProcessor() {
    return DirectoryProcessor;
  }

  static getLanguageTemplatesModule() {
    return LanguageTemplates;
  }

  static getProjectGenerator() {
    return ProjectGenerator;
  }

  static getTemplateValidator() {
    return TemplateValidator;
  }
}

// Export the class
module.exports = TemplateUtils;

// CLI execution (main function)
if (require.main === module) {
  const runCLI = async () => {
    try {
      const args = process.argv.slice(2);

      if (args.includes('--help') || args.length === 0) {
        console.log(`
Template Generation Utilities

Usage:
  node template-utils.js [command] [options]

Commands:
  render <template> <variables>      Render template with variables
  generate <template> <output>       Generate file from template
  project <language> <path>          Generate language project
  config <language> <path>           Generate language configuration
  readme <path>                      Generate README file
  gitignore <language> <path>        Generate .gitignore file
  validate <variables>               Validate template variables

Options:
  --variables <json>                 Variables as JSON string
  --var-file <file>                  Variables from JSON file
  --overwrite                        Overwrite existing files
  --backup                           Backup existing files
  --skip-existing                    Skip existing files
  --create-dir                       Create output directory
  --required <list>                  Required variables (comma-separated)
  --help                             Show this help

Examples:
  node template-utils.js render "Hello {{name}}!" '{"name":"World"}'
  node template-utils.js generate template.txt output.txt --variables '{"name":"Test"}'
  node template-utils.js project node ./my-project --variables '{"name":"my-app"}'
  node template-utils.js config go ./my-go-project
  node template-utils.js readme ./my-project
  node template-utils.js gitignore node ./my-project
  node template-utils.js validate '{"name":"test","version":"1.0.0"}'
        `);
        process.exit(0);
      }

      const command = args[0];
      const templateUtils = new TemplateUtils();

      switch (command) {
        case 'render': {
          const template = args[1];
          const variablesStr = args[2] || '{}';
          const variables = JSON.parse(variablesStr);
          const result = TemplateUtils.renderTemplate(template, variables);
          console.log(result);
          break;
        }

        case 'generate': {
          const templatePath = args[1];
          const outputPath = args[2];
          const variables = {};

          // Parse options
          const options = {};
          for (let i = 3; i < args.length; i++) {
            if (args[i] === '--variables' && args[i + 1]) {
              Object.assign(variables, JSON.parse(args[++i]));
            } else if (args[i] === '--var-file' && args[i + 1]) {
              const varFile = args[++i];
              const varContent = fs.readFileSync(varFile, 'utf8');
              Object.assign(variables, JSON.parse(varContent));
            } else if (args[i] === '--overwrite') {
              options.overwrite = true;
            } else if (args[i] === '--backup') {
              options.backup = true;
            } else if (args[i] === '--create-dir') {
              options.createDir = true;
            }
          }

          const result = TemplateUtils.generateFile(templatePath, outputPath, variables, options);
          console.log(JSON.stringify(result, null, 2));
          break;
        }

        case 'project': {
          const language = args[1];
          const projectPath = args[2];
          const variables = {};
          const options = {};

          for (let i = 3; i < args.length; i++) {
            if (args[i] === '--variables' && args[i + 1]) {
              Object.assign(variables, JSON.parse(args[++i]));
            } else if (args[i] === '--overwrite') {
              options.overwrite = true;
            } else if (args[i] === '--backup') {
              options.backup = true;
            } else if (args[i] === '--create-dir') {
              options.createDir = true;
            }
          }

          const result = TemplateUtils.generateLanguageProject(
            language,
            projectPath,
            variables,
            options
          );
          console.log(JSON.stringify(result, null, 2));
          break;
        }

        case 'config': {
          const language = args[1];
          const configPath = args[2];
          const variables = {};
          const options = {};

          for (let i = 3; i < args.length; i++) {
            if (args[i] === '--variables' && args[i + 1]) {
              Object.assign(variables, JSON.parse(args[++i]));
            } else if (args[i] === '--overwrite') {
              options.overwrite = true;
            } else if (args[i] === '--backup') {
              options.backup = true;
            }
          }

          const result = TemplateUtils.generateLanguageConfig(
            language,
            configPath,
            variables,
            options
          );
          console.log(JSON.stringify(result, null, 2));
          break;
        }

        case 'readme': {
          const projectPath = args[1];
          const variables = {};
          const options = {};

          for (let i = 2; i < args.length; i++) {
            if (args[i] === '--variables' && args[i + 1]) {
              Object.assign(variables, JSON.parse(args[++i]));
            } else if (args[i] === '--overwrite') {
              options.overwrite = true;
            } else if (args[i] === '--backup') {
              options.backup = true;
            }
          }

          const result = TemplateUtils.generateReadme(projectPath, variables, options);
          console.log(JSON.stringify(result, null, 2));
          break;
        }

        case 'gitignore': {
          const language = args[1];
          const projectPath = args[2];

          const result = TemplateUtils.generateGitignore(projectPath, language);
          console.log(JSON.stringify(result, null, 2));
          break;
        }

        case 'validate': {
          const variablesStr = args[1] || '{}';
          const variables = JSON.parse(variablesStr);
          const required = args.includes('--required')
            ? args[args.indexOf('--required') + 1].split(',')
            : [];

          const result = TemplateUtils.validateVariables(variables, required);
          console.log(JSON.stringify(result, null, 2));
          break;
        }

        default:
          console.log(`Unknown command: ${command}`);
          console.log('Use --help for usage information.');
          process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };

  runCLI();
}
