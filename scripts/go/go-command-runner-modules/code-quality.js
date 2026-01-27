#!/usr/bin/env node
/**
 * Go Code Quality Module
 *
 * Handles linting, formatting, and code quality checks
 */

const { spawn } = require('child_process');
const { LoggingUtils } = require('../../lib');

class GoCodeQuality {
  constructor(projectPath, commandExecutor, goConfig, detectedTools) {
    this.projectPath = projectPath;
    this.commandExecutor = commandExecutor;
    this.goConfig = goConfig;
    this.detectedTools = detectedTools;
  }

  /**
   * Run Go linters
   */
  async lint(options = {}) {
    // Use golangci-lint if available
    if (this.detectedTools.golangciLint?.installed && !options.forceStaticcheck) {
      return this.lintWithGolangCILint(options);
    }

    // Use staticcheck if available
    if (this.detectedTools.staticcheck?.installed) {
      return this.lintWithStaticcheck(options);
    }

    // Fallback to go vet
    LoggingUtils.info('Using go vet (install golangci-lint for more comprehensive checks)');
    return this.commandExecutor.executeGoCommand('vet', ['./...'], options);
  }

  /**
   * Run golangci-lint
   */
  async lintWithGolangCILint(options = {}) {
    LoggingUtils.info('🔍 Running golangci-lint...');

    const args = ['run'];

    // Add config file if specified
    if (options.config) {
      args.push('-c', options.config);
    }

    // Add timeout
    if (options.timeout) {
      args.push('--timeout', options.timeout);
    }

    // Add output format
    if (options.format) {
      args.push('--out-format', options.format);
    }

    // Add path
    args.push('./...');

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: 'inherit',
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const process = spawn('golangci-lint', args, finalOptions);

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject(new Error(`golangci-lint failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute golangci-lint: ${error.message}`));
      });
    });
  }

  /**
   * Run staticcheck
   */
  async lintWithStaticcheck(options = {}) {
    LoggingUtils.info('🔍 Running staticcheck...');

    const args = ['./...'];

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: 'inherit',
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const process = spawn('staticcheck', args, finalOptions);

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject(new Error(`staticcheck failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute staticcheck: ${error.message}`));
      });
    });
  }

  /**
   * Format Go code
   */
  async format(options = {}) {
    const args = [];

    // Add write flag to actually modify files
    if (options.write !== false) {
      args.push('-w');
    }

    // Add specific files or directories
    if (options.files && options.files.length > 0) {
      args.push(...options.files);
    } else {
      args.push('./...');
    }

    LoggingUtils.info('🎨 Formatting Go code...');

    try {
      const result = await this.commandExecutor.executeGoCommand('fmt', args, options);

      if (result.success) {
        LoggingUtils.success('Code formatted successfully');

        // Check if any files were modified
        if (options.write !== false) {
          LoggingUtils.info('Run /go-lint to check for any remaining issues');
        }
      }

      return result;
    } catch (error) {
      LoggingUtils.error('Formatting failed:', error.message);

      // Provide helpful suggestions
      if (error.message.includes('syntax error')) {
        LoggingUtils.info('💡 Fix syntax errors before formatting:');
        LoggingUtils.info('  1. Check for missing parentheses, braces, or semicolons');
        LoggingUtils.info('  2. Verify import statements are correct');
        LoggingUtils.info('  3. Run /go-build to check for compilation errors');
      }

      throw error;
    }
  }

  /**
   * Suggest fixes for common linting errors
   */
  suggestLintFix(errorMessage) {
    const suggestions = [];

    if (errorMessage.includes('unused')) {
      suggestions.push('Remove unused variables, functions, or imports');
      suggestions.push('Check if code is actually used');
      suggestions.push('Run /go-fmt to clean up code');
    }

    if (errorMessage.includes('ineffective')) {
      suggestions.push('Remove ineffective assignments');
      suggestions.push('Check variable usage');
      suggestions.push('Simplify code logic');
    }

    if (errorMessage.includes('shadow')) {
      suggestions.push('Rename shadowed variables');
      suggestions.push('Use different variable names in nested scopes');
      suggestions.push('Check variable declarations');
    }

    if (errorMessage.includes('format')) {
      suggestions.push('Run /go-fmt to format code');
      suggestions.push('Check indentation and spacing');
      suggestions.push('Verify Go style guidelines');
    }

    if (suggestions.length > 0) {
      LoggingUtils.info('💡 Linting error suggestions:');
      suggestions.forEach((suggestion, i) => {
        LoggingUtils.info(`  ${i + 1}. ${suggestion}`);
      });
    }
  }
}

module.exports = GoCodeQuality;
