#!/usr/bin/env node
/**
 * Template Validator Module for TemplateUtils
 *
 * Validation methods: validateVariables
 */

class TemplateValidator {
  /**
   * Validate template variables
   */
  static validateVariables(variables, required = []) {
    const errors = [];
    const warnings = [];
    const validated = { ...variables };

    // Check required variables
    for (const requiredVar of required) {
      if (variables[requiredVar] === undefined || variables[requiredVar] === '') {
        errors.push(`Missing required variable: ${requiredVar}`);
      }
    }

    // Validate variable types and formats
    for (const [key, value] of Object.entries(variables)) {
      // Skip undefined/null values
      if (value === undefined || value === null) {
        warnings.push(`Variable ${key} is undefined or null`);
        continue;
      }

      // Type-specific validation
      switch (key.toLowerCase()) {
        case 'name':
        case 'projectname':
        case 'appname':
          if (typeof value !== 'string') {
            errors.push(`Variable ${key} must be a string`);
          } else if (value.trim().length === 0) {
            errors.push(`Variable ${key} cannot be empty`);
          } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            warnings.push(`Variable ${key} contains special characters: ${value}`);
          }
          break;

        case 'version':
          if (typeof value !== 'string') {
            errors.push(`Variable ${key} must be a string`);
          } else if (!/^\d+\.\d+\.\d+$/.test(value)) {
            warnings.push(`Variable ${key} may not be a valid semantic version: ${value}`);
          }
          break;

        case 'email':
        case 'authoremail':
          if (typeof value !== 'string') {
            errors.push(`Variable ${key} must be a string`);
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            warnings.push(`Variable ${key} may not be a valid email: ${value}`);
          }
          break;

        case 'url':
        case 'website':
        case 'repository':
          if (typeof value !== 'string') {
            errors.push(`Variable ${key} must be a string`);
          } else if (!/^https?:\/\/.+/.test(value)) {
            warnings.push(`Variable ${key} may not be a valid URL: ${value}`);
          }
          break;

        case 'license':
          const validLicenses = [
            'MIT',
            'Apache-2.0',
            'GPL-3.0',
            'BSD-2-Clause',
            'BSD-3-Clause',
            'MPL-2.0',
            'EPL-2.0',
            'AGPL-3.0',
            'LGPL-3.0',
            'Unlicense',
            'ISC',
            'Artistic-2.0',
            'Proprietary',
          ];
          if (typeof value !== 'string') {
            errors.push(`Variable ${key} must be a string`);
          } else if (!validLicenses.includes(value)) {
            warnings.push(`Variable ${key} is not a standard license: ${value}`);
          }
          break;

        case 'description':
          if (typeof value !== 'string') {
            errors.push(`Variable ${key} must be a string`);
          } else if (value.length > 1000) {
            warnings.push(`Variable ${key} is very long (${value.length} characters)`);
          }
          break;

        case 'keywords':
          if (!Array.isArray(value)) {
            errors.push(`Variable ${key} must be an array`);
          } else if (value.length > 20) {
            warnings.push(`Variable ${key} has many keywords (${value.length})`);
          }
          break;

        case 'dependencies':
        case 'devdependencies':
          if (!Array.isArray(value)) {
            errors.push(`Variable ${key} must be an array`);
          }
          break;

        default:
          // Generic validation for other variables
          if (typeof value === 'string' && value.includes('{{')) {
            warnings.push(`Variable ${key} contains template syntax: ${value}`);
          }
          break;
      }
    }

    // Check for unused template variables
    const templateVariables = this._extractTemplateVariables(variables);
    const providedVariables = Object.keys(variables);
    const unusedVariables = templateVariables.filter((v) => !providedVariables.includes(v));

    if (unusedVariables.length > 0) {
      warnings.push(`Potential unused template variables: ${unusedVariables.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validated,
      summary: {
        totalVariables: Object.keys(variables).length,
        requiredVariables: required.length,
        missingRequired: errors.filter((e) => e.includes('Missing required variable')).length,
        validationErrors: errors.length,
        validationWarnings: warnings.length,
      },
    };
  }

  /**
   * Extract template variables from object values
   */
  static _extractTemplateVariables(variables) {
    const templateVars = new Set();

    for (const value of Object.values(variables)) {
      if (typeof value === 'string') {
        const matches = value.match(/\{\{(\w+)\}\}/g);
        if (matches) {
          matches.forEach((match) => {
            const varName = match.slice(2, -2); // Remove {{ and }}
            templateVars.add(varName);
          });
        }
      }
    }

    return Array.from(templateVars);
  }

  /**
   * Sanitize variable values
   */
  static sanitizeVariables(variables) {
    const sanitized = {};

    for (const [key, value] of Object.entries(variables)) {
      if (value === undefined || value === null) {
        sanitized[key] = '';
      } else if (typeof value === 'string') {
        // Basic sanitization
        sanitized[key] = value
          .replace(/[<>]/g, '') // Remove angle brackets
          .trim();
      } else if (Array.isArray(value)) {
        // Sanitize array elements
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? item.replace(/[<>]/g, '').trim() : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate variable documentation
   */
  static generateVariableDocs(variables, templateContent = '') {
    const docs = {
      required: [],
      optional: [],
      examples: {},
    };

    // Extract variables from template content
    const templateVars = new Set();
    if (templateContent) {
      const matches = templateContent.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        matches.forEach((match) => {
          const varName = match.slice(2, -2);
          templateVars.add(varName);
        });
      }
    }

    // Categorize variables
    for (const [key, value] of Object.entries(variables)) {
      const varInfo = {
        name: key,
        type: typeof value,
        defaultValue: value,
        description: this._getVariableDescription(key),
      };

      if (templateVars.has(key)) {
        docs.required.push(varInfo);
      } else {
        docs.optional.push(varInfo);
      }

      // Add example
      docs.examples[key] = this._getVariableExample(key, value);
    }

    return docs;
  }

  /**
   * Get variable description
   */
  static _getVariableDescription(key) {
    const descriptions = {
      name: 'Project name',
      version: 'Project version (semantic versioning)',
      description: 'Project description',
      author: 'Author name',
      email: 'Author email',
      license: 'Software license',
      repository: 'Git repository URL',
      keywords: 'Project keywords for discovery',
      dependencies: 'Runtime dependencies',
      devDependencies: 'Development dependencies',
      scripts: 'NPM scripts or equivalent',
      main: 'Main entry point file',
      module: 'Module name (for Go/Elixir)',
      app: 'Application name (for Elixir)',
      goVersion: 'Go version requirement',
      elixirVersion: 'Elixir version requirement',
    };

    return descriptions[key] || `Variable: ${key}`;
  }

  /**
   * Get variable example
   */
  static _getVariableExample(key, value) {
    const examples = {
      name: 'my-awesome-project',
      version: '1.0.0',
      description: 'A brief description of the project',
      author: 'John Doe',
      email: 'john@example.com',
      license: 'MIT',
      repository: 'https://github.com/username/repo',
      keywords: ['javascript', 'node', 'web'],
      dependencies: ['express', 'react', 'lodash'],
      devDependencies: ['jest', 'eslint', 'prettier'],
      scripts: {
        start: 'node index.js',
        test: 'jest',
        build: 'webpack',
      },
      main: 'index.js',
      module: 'github.com/username/repo',
      app: 'my_app',
      goVersion: '1.19',
      elixirVersion: '1.14',
    };

    return examples[key] || value;
  }
}

module.exports = TemplateValidator;
