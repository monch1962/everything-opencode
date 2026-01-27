#!/usr/bin/env node
/**
 * Argument Parser for PineScript Debugger
 *
 * Parses command line arguments with schema validation and help generation
 */

class ArgumentParser {
  /**
   * Parse command line arguments according to schema
   */
  parseArgs(args, schema) {
    const options = {};
    const positional = [];

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      // Handle flags
      if (arg.startsWith('--')) {
        const flagName = arg.slice(2);
        const schemaEntry = schema[flagName];

        if (!schemaEntry) {
          throw new Error(`Unknown option: --${flagName}`);
        }

        if (schemaEntry.type === 'boolean') {
          options[flagName] = true;
          i++;
        } else {
          if (i + 1 >= args.length) {
            throw new Error(`Missing value for option: --${flagName}`);
          }
          options[flagName] = this.parseValue(args[i + 1], schemaEntry.type);
          i += 2;
        }
      } else if (arg.startsWith('-') && arg.length === 2) {
        // Handle short flags
        const flagChar = arg[1];
        const schemaEntry = Object.values(schema).find((entry) => entry.alias === flagChar);

        if (!schemaEntry) {
          throw new Error(`Unknown option: -${flagChar}`);
        }

        const flagName = Object.keys(schema).find((key) => schema[key].alias === flagChar);

        if (schemaEntry.type === 'boolean') {
          options[flagName] = true;
          i++;
        } else {
          if (i + 1 >= args.length) {
            throw new Error(`Missing value for option: -${flagChar}`);
          }
          options[flagName] = this.parseValue(args[i + 1], schemaEntry.type);
          i += 2;
        }
      } else {
        // Handle positional arguments
        positional.push(arg);
        i++;
      }
    }

    // Apply defaults
    for (const [name, entry] of Object.entries(schema)) {
      if (options[name] === undefined && entry.default !== undefined) {
        options[name] = entry.default;
      }
    }

    // Validate required fields
    for (const [name, entry] of Object.entries(schema)) {
      if (entry.required && options[name] === undefined) {
        throw new Error(`Missing required option: --${name}`);
      }
    }

    return { options, positional };
  }

  /**
   * Parse value according to type
   */
  parseValue(value, type) {
    switch (type) {
      case 'number': {
        const num = parseFloat(value);
        if (isNaN(num)) {
          throw new Error(`Invalid number: ${value}`);
        }
        return num;
      }
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      case 'string':
        return value;
      case 'array':
        return value.split(',').map((item) => item.trim());
      default:
        return value;
    }
  }

  /**
   * Generate help text from schema
   */
  generateHelp(schema, commandName) {
    const lines = [];
    lines.push(`Usage: ${commandName} [options]`);
    lines.push('');
    lines.push('Options:');

    const entries = Object.entries(schema);

    // Calculate column widths
    let maxNameLength = 0;
    let maxAliasLength = 0;

    for (const [name, entry] of entries) {
      maxNameLength = Math.max(maxNameLength, name.length);
      if (entry.alias) {
        maxAliasLength = Math.max(maxAliasLength, 1);
      }
    }

    // Generate option lines
    for (const [name, entry] of entries) {
      const aliasStr = entry.alias ? `-${entry.alias}, ` : '    ';
      const nameStr = `--${name}`.padEnd(maxNameLength + 3);
      const typeStr = entry.type ? ` <${entry.type}>` : '';
      const defaultStr = entry.default !== undefined ? ` (default: ${entry.default})` : '';
      const requiredStr = entry.required ? ' [required]' : '';

      lines.push(`  ${aliasStr}${nameStr}${typeStr}${defaultStr}${requiredStr}`);
      if (entry.description) {
        lines.push(`      ${entry.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Validate options against schema
   */
  validateOptions(options, schema) {
    const errors = [];

    for (const [name, value] of Object.entries(options)) {
      const entry = schema[name];

      if (!entry) {
        errors.push(`Unknown option: ${name}`);
        continue;
      }

      // Type validation
      if (entry.type === 'number' && typeof value !== 'number') {
        errors.push(`Option ${name} must be a number`);
      } else if (entry.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Option ${name} must be a boolean`);
      } else if (entry.type === 'string' && typeof value !== 'string') {
        errors.push(`Option ${name} must be a string`);
      } else if (entry.type === 'array' && !Array.isArray(value)) {
        errors.push(`Option ${name} must be an array`);
      }

      // Range validation for numbers
      if (entry.type === 'number') {
        if (entry.min !== undefined && value < entry.min) {
          errors.push(`Option ${name} must be >= ${entry.min}`);
        }
        if (entry.max !== undefined && value > entry.max) {
          errors.push(`Option ${name} must be <= ${entry.max}`);
        }
      }

      // Enum validation
      if (entry.enum && !entry.enum.includes(value)) {
        errors.push(`Option ${name} must be one of: ${entry.enum.join(', ')}`);
      }

      // Pattern validation for strings
      if (entry.pattern && typeof value === 'string') {
        const regex = new RegExp(entry.pattern);
        if (!regex.test(value)) {
          errors.push(`Option ${name} must match pattern: ${entry.pattern}`);
        }
      }
    }

    // Check required options
    for (const [name, entry] of Object.entries(schema)) {
      if (entry.required && options[name] === undefined) {
        errors.push(`Missing required option: ${name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge multiple option sets
   */
  mergeOptions(...optionSets) {
    const result = {};

    for (const options of optionSets) {
      for (const [key, value] of Object.entries(options)) {
        // For arrays, concatenate
        if (Array.isArray(value) && Array.isArray(result[key])) {
          result[key] = [...result[key], ...value];
        } else if (
          // For objects, merge
          typeof value === 'object' &&
          value !== null &&
          typeof result[key] === 'object' &&
          result[key] !== null
        ) {
          result[key] = { ...result[key], ...value };
        } else {
          // Otherwise, overwrite
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Extract common debugging options schema
   */
  getCommonDebugSchema() {
    return {
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to debug',
        required: true,
      },
      var: {
        type: 'string',
        alias: 'v',
        description: 'Variable name to inspect (supports wildcards)',
      },
      bars: {
        type: 'number',
        alias: 'b',
        description: 'Number of historical bars to inspect',
        default: 10,
        min: 1,
        max: 1000,
      },
      format: {
        type: 'string',
        description: 'Output format (text, json, csv)',
        default: 'text',
        enum: ['text', 'json', 'csv'],
      },
      output: {
        type: 'string',
        alias: 'o',
        description: 'Output file path',
      },
      verbose: {
        type: 'boolean',
        description: 'Verbose output',
        default: false,
      },
      project: {
        type: 'string',
        alias: 'p',
        description: 'Project directory path',
      },
    };
  }

  /**
   * Extract server options schema
   */
  getServerSchema() {
    return {
      port: {
        type: 'number',
        alias: 'p',
        description: 'Port to listen on',
        default: 3000,
        min: 1024,
        max: 65535,
      },
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to debug',
      },
      project: {
        type: 'string',
        alias: 'd',
        description: 'Project directory path',
      },
      security: {
        type: 'boolean',
        description: 'Enable/disable security',
        default: true,
      },
      auth: {
        type: 'boolean',
        description: 'Require authentication',
        default: false,
      },
    };
  }

  /**
   * Extract AI analysis options schema
   */
  getAIAnalysisSchema() {
    return {
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to analyze',
        required: true,
      },
      patterns: {
        type: 'string',
        description: 'Pattern types to include (all, performance, safety, readability)',
        default: 'all',
        enum: ['all', 'performance', 'safety', 'readability'],
      },
      threshold: {
        type: 'number',
        description: 'Confidence threshold for suggestions (0.0-1.0)',
        default: 0.7,
        min: 0.0,
        max: 1.0,
      },
      output: {
        type: 'string',
        alias: 'o',
        description: 'Output file for suggestions',
      },
      format: {
        type: 'string',
        description: 'Output format (text, json, markdown)',
        default: 'text',
        enum: ['text', 'json', 'markdown'],
      },
    };
  }
}

module.exports = ArgumentParser;
