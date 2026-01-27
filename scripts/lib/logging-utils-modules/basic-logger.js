#!/usr/bin/env node
/**
 * Basic Logger Module for LoggingUtils
 *
 * Core logging methods: error, warn, info, debug, success
 */

class BasicLogger {
  constructor(dependencies, configManager) {
    this.dependencies = dependencies;
    this.configManager = configManager;
  }

  /**
   * Generic log method
   */
  log(level, message, ...args) {
    if (!this.configManager.shouldLog(level)) {
      return;
    }

    const timestamp = this.configManager.formatTimestamp();
    const color = this.dependencies.colors[level] || ((s) => s);
    const prefix = this.getLevelPrefix(level);

    // Format message with args
    let formattedMessage = message;
    if (args.length > 0) {
      try {
        formattedMessage = this.formatMessage(message, args);
      } catch (e) {
        // If formatting fails, just concatenate
        formattedMessage = `${message} ${args.join(' ')}`;
      }
    }

    const output = `${timestamp}${prefix} ${color(formattedMessage)}`;

    // Use appropriate console method
    if (level === 'error') {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Get prefix for log level
   */
  getLevelPrefix(level) {
    const prefixes = {
      error: '✗',
      warn: '⚠',
      info: 'ℹ',
      debug: '🔍',
      success: '✓',
    };

    return prefixes[level] || '•';
  }

  /**
   * Format message with arguments
   */
  formatMessage(message, args) {
    // Handle string substitution like console.log
    if (typeof message === 'string' && message.includes('%')) {
      return this.formatString(message, args);
    }

    // Handle multiple arguments
    if (args.length === 0) {
      return message;
    }

    // If message is not a string, convert everything to string
    const allArgs = [message, ...args];
    return allArgs
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  /**
   * Format string with % substitutions
   */
  formatString(format, args) {
    let i = 0;
    return format.replace(/%[sdifoO]/g, (match) => {
      if (i >= args.length) {
        return match;
      }

      const arg = args[i++];
      switch (match) {
        case '%s':
          return String(arg);
        case '%d':
        case '%i':
          return Number(arg);
        case '%f':
          return parseFloat(arg);
        case '%o':
        case '%O':
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        default:
          return match;
      }
    });
  }

  /**
   * Log error message
   */
  error(message, ...args) {
    this.log('error', message, ...args);
  }

  /**
   * Log warning message
   */
  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  /**
   * Log info message
   */
  info(message, ...args) {
    this.log('info', message, ...args);
  }

  /**
   * Log debug message
   */
  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  /**
   * Log success message
   */
  success(message, ...args) {
    this.log('success', message, ...args);
  }

  /**
   * Log with custom level
   */
  custom(level, message, ...args) {
    this.log(level, message, ...args);
  }

  /**
   * Log raw message without formatting
   */
  raw(message) {
    console.log(message);
  }

  /**
   * Log blank line
   */
  blank() {
    console.log();
  }

  /**
   * Log separator line
   */
  separator(length = 40) {
    const line = '─'.repeat(length);
    console.log(line);
  }

  /**
   * Log with indentation
   */
  indent(message, level = 1, ...args) {
    const spaces = '  '.repeat(level);
    const formattedMessage = this.formatMessage(message, args);
    console.log(`${spaces}${formattedMessage}`);
  }
}

module.exports = BasicLogger;
