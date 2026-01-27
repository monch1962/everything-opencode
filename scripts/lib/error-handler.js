#!/usr/bin/env node
/**
 * Error Handling Utilities
 *
 * Comprehensive error handling for language tools and commands
 * Provides consistent error reporting, recovery suggestions, and logging
 */

const fs = require('fs');
const path = require('path');

class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      logToFile: false,
      logFile: path.join(process.cwd(), '.opencode', 'error-log.json'),
      maxErrorHistory: 100,
      ...options,
    };

    this.errorHistory = [];
    this.errorCategories = {
      // Tool-related errors
      TOOL_NOT_FOUND: 'Tool not found or not in PATH',
      TOOL_VERSION: 'Incompatible tool version',
      TOOL_PERMISSION: 'Tool permission error',

      // Configuration errors
      CONFIG_MISSING: 'Configuration missing or invalid',
      CONFIG_PARSE: 'Configuration parse error',

      // Execution errors
      EXECUTION_FAILED: 'Command execution failed',
      TIMEOUT: 'Command timeout',
      PERMISSION_DENIED: 'Permission denied',

      // Dependency errors
      DEPENDENCY_MISSING: 'Required dependency missing',
      DEPENDENCY_VERSION: 'Dependency version conflict',

      // Network errors
      NETWORK_ERROR: 'Network connectivity issue',
      DOWNLOAD_FAILED: 'Download failed',

      // Platform errors
      PLATFORM_UNSUPPORTED: 'Unsupported platform',
      PLATFORM_SPECIFIC: 'Platform-specific issue',

      // User errors
      USER_INPUT: 'Invalid user input',
      USER_PERMISSION: 'Insufficient user permissions',

      // System errors
      MEMORY: 'Insufficient memory',
      DISK_SPACE: 'Insufficient disk space',
      FILE_SYSTEM: 'File system error',
    };
  }

  /**
   * Handle an error with comprehensive reporting
   */
  handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error, context);

    // Add to history
    this.errorHistory.push({
      timestamp: new Date().toISOString(),
      ...errorInfo,
    });

    // Keep history size limited
    if (this.errorHistory.length > this.options.maxErrorHistory) {
      this.errorHistory.shift();
    }

    // Log to file if enabled
    if (this.options.logToFile) {
      this.logErrorToFile(errorInfo);
    }

    // Generate user-friendly message
    const userMessage = this.generateUserMessage(errorInfo);

    // Return structured error information
    return {
      ...errorInfo,
      userMessage,
      recoverySteps: this.getRecoverySteps(errorInfo.category),
      shouldRetry: this.shouldRetry(errorInfo.category),
    };
  }

  /**
   * Analyze error to extract useful information
   */
  analyzeError(error, context) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Extract error properties
    const stack = errorObj.stack || '';
    const message = errorObj.message || String(error);
    const code = errorObj.code || '';
    const syscall = errorObj.syscall || '';

    // Determine error category
    const category = this.categorizeError(errorObj, context);

    // Extract context information
    const {
      command = '',
      tool = '',
      platform = process.platform,
      cwd = process.cwd(),
      args = [],
      env = {},
      ...otherContext
    } = context;

    return {
      timestamp: new Date().toISOString(),
      message,
      category,
      code,
      syscall,
      stack: this.options.verbose ? stack : this.extractRelevantStack(stack),
      command,
      tool,
      platform,
      cwd,
      args: args.slice(0, 10), // Limit args length
      envKeys: Object.keys(env).slice(0, 10), // Limit env keys
      context: otherContext,
      originalError: this.options.verbose ? errorObj : undefined,
    };
  }

  /**
   * Categorize error based on message and context
   */
  categorizeError(error, _context) {
    const message = error.message.toLowerCase();
    const code = error.code || '';

    // Check for tool-related errors
    if (
      message.includes('not found') ||
      message.includes('not installed') ||
      message.includes('command not found') ||
      code === 'ENOENT'
    ) {
      return 'TOOL_NOT_FOUND';
    }

    if (
      message.includes('permission denied') ||
      message.includes('eacces') ||
      code === 'EACCES' ||
      code === 'EPERM'
    ) {
      return 'TOOL_PERMISSION';
    }

    if (
      message.includes('version') &&
      (message.includes('required') ||
        message.includes('incompatible') ||
        message.includes('minimum'))
    ) {
      return 'TOOL_VERSION';
    }

    // Check for configuration errors
    if (
      message.includes('configuration') ||
      message.includes('config') ||
      message.includes('setup') ||
      message.includes('not configured')
    ) {
      return 'CONFIG_MISSING';
    }

    // Check for execution errors
    if (message.includes('timeout') || message.includes('timed out') || code === 'ETIMEDOUT') {
      return 'TIMEOUT';
    }

    if (
      message.includes('execution failed') ||
      message.includes('failed to execute') ||
      message.includes('exit code') ||
      message.includes('non-zero exit')
    ) {
      return 'EXECUTION_FAILED';
    }

    // Check for dependency errors
    if (
      message.includes('dependency') ||
      message.includes('module') ||
      message.includes('package') ||
      message.includes('import')
    ) {
      if (message.includes('version') || message.includes('conflict')) {
        return 'DEPENDENCY_VERSION';
      }
      return 'DEPENDENCY_MISSING';
    }

    // Check for network errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('download') ||
      message.includes('fetch') ||
      code === 'ENOTFOUND' ||
      code === 'ECONNREFUSED'
    ) {
      return 'NETWORK_ERROR';
    }

    // Check for platform errors
    if (
      message.includes('platform') ||
      message.includes('operating system') ||
      message.includes('windows') ||
      message.includes('macos') ||
      message.includes('linux')
    ) {
      return 'PLATFORM_UNSUPPORTED';
    }

    // Check for system errors
    if (message.includes('memory') || message.includes('out of memory')) {
      return 'MEMORY';
    }

    if (
      message.includes('disk') ||
      message.includes('space') ||
      message.includes('enoent') ||
      code === 'ENOSPC'
    ) {
      return 'DISK_SPACE';
    }

    // Default category
    return 'EXECUTION_FAILED';
  }

  /**
   * Extract relevant part of stack trace
   */
  extractRelevantStack(stack) {
    if (!stack) return '';

    const lines = stack.split('\n');
    // Keep first 5 lines (error + 4 stack frames)
    return lines.slice(0, 5).join('\n');
  }

  /**
   * Generate user-friendly error message
   */
  generateUserMessage(errorInfo) {
    const { category, message, tool, command } = errorInfo;

    switch (category) {
      case 'TOOL_NOT_FOUND':
        return tool
          ? `❌ ${tool} is not installed or not in your PATH.`
          : `❌ Required tool not found: ${message}`;

      case 'TOOL_PERMISSION':
        return `🔒 Permission denied. Check file permissions for ${tool || 'the tool'}.`;

      case 'TOOL_VERSION':
        return `📦 Incompatible version. ${message}`;

      case 'CONFIG_MISSING':
        return `⚙️ Configuration required. Run setup command first.`;

      case 'TIMEOUT':
        return `⏰ Command timed out. Try increasing timeout or checking system resources.`;

      case 'EXECUTION_FAILED':
        return command ? `🚫 Failed to execute: ${command}` : `🚫 Execution failed: ${message}`;

      case 'DEPENDENCY_MISSING':
        return `📦 Missing dependency. ${message}`;

      case 'DEPENDENCY_VERSION':
        return `📦 Version conflict. ${message}`;

      case 'NETWORK_ERROR':
        return `🌐 Network issue. Check your internet connection.`;

      case 'PLATFORM_UNSUPPORTED':
        return `💻 Platform issue. ${message}`;

      case 'MEMORY':
        return `💾 Insufficient memory. Close other applications and try again.`;

      case 'DISK_SPACE':
        return `💿 Low disk space. Free up space and try again.`;

      default:
        return `❌ Error: ${message}`;
    }
  }

  /**
   * Get recovery steps for error category
   */
  getRecoverySteps(category) {
    const steps = {
      TOOL_NOT_FOUND: [
        'Check if the tool is installed',
        'Verify the tool is in your PATH',
        'Run the setup command for your language',
        'Install the tool using your package manager',
      ],

      TOOL_PERMISSION: [
        'Check file permissions',
        'Run with appropriate privileges',
        'Verify installation directory permissions',
      ],

      TOOL_VERSION: [
        'Update the tool to required version',
        'Check version compatibility',
        'Use version manager if available',
      ],

      CONFIG_MISSING: [
        'Run the setup command for your project',
        'Check configuration file exists',
        'Verify configuration format',
      ],

      TIMEOUT: [
        'Increase timeout value',
        'Check system resource usage',
        'Simplify the command or operation',
      ],

      EXECUTION_FAILED: [
        'Check command syntax',
        'Verify input parameters',
        'Look for more detailed error output',
      ],

      DEPENDENCY_MISSING: [
        'Install missing dependencies',
        'Check dependency configuration',
        'Run dependency installation command',
      ],

      DEPENDENCY_VERSION: [
        'Update dependency versions',
        'Check version constraints',
        'Resolve version conflicts',
      ],

      NETWORK_ERROR: ['Check internet connection', 'Verify network settings', 'Try again later'],

      PLATFORM_UNSUPPORTED: [
        'Check platform requirements',
        'Use platform-specific alternatives',
        'Consult documentation for platform support',
      ],

      MEMORY: [
        'Close unnecessary applications',
        'Increase available memory',
        'Simplify the operation',
      ],

      DISK_SPACE: ['Free up disk space', 'Clean temporary files', 'Use different storage location'],
    };

    return steps[category] || ['Check error details', 'Consult documentation', 'Try again'];
  }

  /**
   * Determine if operation should be retried
   */
  shouldRetry(category) {
    const retryableCategories = ['NETWORK_ERROR', 'TIMEOUT', 'EXECUTION_FAILED'];

    return retryableCategories.includes(category);
  }

  /**
   * Log error to file
   */
  logErrorToFile(errorInfo) {
    try {
      // Ensure directory exists
      const logDir = path.dirname(this.options.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Read existing log
      let log = [];
      if (fs.existsSync(this.options.logFile)) {
        try {
          const content = fs.readFileSync(this.options.logFile, 'utf8');
          log = JSON.parse(content);
        } catch (e) {
          // If log file is corrupted, start fresh
          log = [];
        }
      }

      // Add new error
      log.push(errorInfo);

      // Keep log size limited
      if (log.length > this.options.maxErrorHistory * 2) {
        log = log.slice(-this.options.maxErrorHistory);
      }

      // Write back to file
      fs.writeFileSync(this.options.logFile, JSON.stringify(log, null, 2), 'utf8');
    } catch (e) {
      // Don't fail if logging fails
      console.error('Failed to log error:', e.message);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      byCategory: {},
      byTool: {},
      recent: this.errorHistory.slice(-10),
    };

    // Count by category
    this.errorHistory.forEach((error) => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      if (error.tool) {
        stats.byTool[error.tool] = (stats.byTool[error.tool] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
    return true;
  }

  /**
   * Create a wrapped function with error handling
   */
  wrapFunction(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorInfo = this.handleError(error, context);

        // Log to console
        console.error(`\n${errorInfo.userMessage}`);
        console.error('\n💡 Recovery steps:');
        errorInfo.recoverySteps.forEach((step, i) => {
          console.error(`  ${i + 1}. ${step}`);
        });

        if (this.options.verbose && errorInfo.stack) {
          console.error('\n🔍 Stack trace:');
          console.error(errorInfo.stack);
        }

        // Re-throw with additional context
        const enhancedError = new Error(errorInfo.userMessage);
        enhancedError.originalError = error;
        enhancedError.errorInfo = errorInfo;
        throw enhancedError;
      }
    };
  }

  /**
   * Create a command runner with error handling
   */
  createCommandRunner(commandFn, defaultContext = {}) {
    return async (command, args = [], options = {}) => {
      const context = {
        ...defaultContext,
        command: `${command} ${args.join(' ')}`.trim(),
        args,
        cwd: options.cwd || process.cwd(),
        env: options.env ? Object.keys(options.env).slice(0, 5) : [],
      };

      const wrappedFn = this.wrapFunction(commandFn, context);
      return wrappedFn(command, args, options);
    };
  }
}

// Export singleton instance
const defaultErrorHandler = new ErrorHandler({
  verbose: process.env.OPENCODE_VERBOSE_ERRORS === 'true',
  logToFile: process.env.OPENCODE_LOG_ERRORS === 'true',
});

module.exports = {
  ErrorHandler,
  defaultErrorHandler,

  // Convenience functions
  handleError: (error, context) => defaultErrorHandler.handleError(error, context),
  wrapFunction: (fn, context) => defaultErrorHandler.wrapFunction(fn, context),
  createCommandRunner: (commandFn, context) =>
    defaultErrorHandler.createCommandRunner(commandFn, context),

  // Error categories for reference
  ERROR_CATEGORIES: defaultErrorHandler.errorCategories,
};

// CLI interface for testing
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--stats') || args.includes('-s')) {
    const stats = defaultErrorHandler.getErrorStats();
    console.log(JSON.stringify(stats, null, 2));
  } else if (args.includes('--clear') || args.includes('-c')) {
    defaultErrorHandler.clearHistory();
    console.log('Error history cleared');
  } else if (args.includes('--test') || args.includes('-t')) {
    // Test error handling
    const testError = new Error('Test error: Tool not found');
    testError.code = 'ENOENT';
    const result = defaultErrorHandler.handleError(testError, {
      tool: 'go',
      command: 'go build',
    });
    console.log('Test error handling result:');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`
Error Handler CLI

Usage:
  node scripts/lib/error-handler.js [options]

Options:
  --stats, -s     Show error statistics
  --clear, -c     Clear error history
  --test, -t      Test error handling
  --help, -h      Show this help

Environment variables:
  OPENCODE_VERBOSE_ERRORS=true  Enable verbose error output
  OPENCODE_LOG_ERRORS=true      Log errors to file
    `);
  }
}
