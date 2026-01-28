#!/usr/bin/env node
/**
 * Formatter Utilities Module for LoggingUtils
 *
 * Formatting utilities: code, command, filePath, json, formatError, etc.
 */

class FormatterUtils {
  constructor(dependencies, configManager) {
    this.dependencies = dependencies;
    this.configManager = configManager;
  }

  /**
   * Format code block
   */
  code(code, language = '') {
    const lines = code.split('\n');
    const maxLength = Math.max(...lines.map((line) => line.length));
    const border = '─'.repeat(maxLength + 4);

    let output = `\n┌${border}┐\n`;

    if (language) {
      output += `│ ${this.dependencies.chalk.gray(`// ${language}`.padEnd(maxLength + 2))} │\n`;
      output += `├${border}┤\n`;
    }

    for (const line of lines) {
      const paddedLine = line.padEnd(maxLength);
      if (this.configManager.getConfig().colors) {
        output += `│ ${this.dependencies.colors.code(paddedLine)} │\n`;
      } else {
        output += `│ ${paddedLine} │\n`;
      }
    }

    output += `└${border}┘\n`;

    return output;
  }

  /**
   * Format command for display
   */
  command(cmd, description = '') {
    let output = '';

    if (description) {
      output += `${description}\n`;
    }

    if (this.configManager.getConfig().colors) {
      output += `  ${this.dependencies.colors.command('$')} ${this.dependencies.colors.command(cmd)}`;
    } else {
      output += `  $ ${cmd}`;
    }

    return output;
  }

  /**
   * Format file path
   */
  filePath(path, options = {}) {
    const { relative = false, base = process.cwd(), showIcon = true } = options;

    let formattedPath = path;

    if (relative && base) {
      try {
        const relativePath = require('path').relative(base, path);
        if (!relativePath.startsWith('..')) {
          formattedPath = `./${relativePath}`;
        }
      } catch (e) {
        // Keep original path if relative fails
      }
    }

    let output = '';

    if (showIcon) {
      output += '📁 ';
    }

    if (this.configManager.getConfig().colors) {
      output += this.dependencies.colors.path(formattedPath);
    } else {
      output += formattedPath;
    }

    return output;
  }

  /**
   * Format JSON data
   */
  json(data, options = {}) {
    const { indent = 2, compact = false, highlight = true } = options;

    let jsonString;

    try {
      if (compact) {
        jsonString = JSON.stringify(data);
      } else {
        jsonString = JSON.stringify(data, null, indent);
      }
    } catch (e) {
      return `[Invalid JSON: ${e.message}]`;
    }

    if (!highlight || !this.configManager.getConfig().colors) {
      return jsonString;
    }

    // Simple JSON highlighting
    const highlighted = jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
        if (match.endsWith(':')) {
          // Key
          return this.dependencies.chalk.green(match);
        }
        // String value
        return this.dependencies.chalk.yellow(match);
      })
      .replace(/\b(true|false|null)\b/g, (match) => {
        // Boolean/null
        return this.dependencies.chalk.magenta(match);
      })
      .replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, (match) => {
        // Number
        return this.dependencies.chalk.cyan(match);
      });

    return highlighted;
  }

  /**
   * Format error for display
   */
  formatError(error, context = {}) {
    const {
      showStack = this.configManager.getConfig().debug,
      showCode = true,
      showRecovery = true,
    } = context;

    let output = '';

    // Error message
    const errorMessage = error.message || String(error);
    output += `${this.dependencies.colors.error('✗ Error:')} ${errorMessage}\n`;

    // Error code if available
    if (error.code && showCode) {
      output += `  ${this.dependencies.chalk.gray(`Code: ${error.code}`)}\n`;
    }

    // Stack trace if debug mode
    if (showStack && error.stack) {
      const stackLines = error.stack.split('\n');
      // Skip the first line (error message)
      for (let i = 1; i < stackLines.length && i < 5; i++) {
        output += `  ${this.dependencies.chalk.gray(stackLines[i])}\n`;
      }
      if (stackLines.length > 5) {
        output += `  ${this.dependencies.chalk.gray('...')}\n`;
      }
    }

    // Recovery steps if available
    if (showRecovery && error.recoverySteps && Array.isArray(error.recoverySteps)) {
      output += `\n${this.dependencies.colors.info('💡 Recovery steps:')}\n`;
      error.recoverySteps.forEach((step, i) => {
        output += `  ${i + 1}. ${step}\n`;
      });
    }

    return output;
  }

  /**
   * Format success summary
   */
  formatSuccessSummary(summary, options = {}) {
    const {
      title = 'Success Summary',
      showDuration = true,
      showStats = true,
      showRecommendations = true,
    } = options;

    let output = '';

    // Title
    output += `\n${this.dependencies.colors.success('✓ ' + title)}\n`;
    output += `${'─'.repeat(title.length + 2)}\n\n`;

    // Duration
    if (showDuration && summary.duration) {
      output += `  ${this.dependencies.chalk.cyan('Duration:')} ${summary.duration}\n`;
    }

    // Stats
    if (showStats && summary.stats) {
      for (const [key, value] of Object.entries(summary.stats)) {
        output += `  ${this.dependencies.chalk.cyan(key + ':')} ${value}\n`;
      }
    }

    // Results
    if (summary.results && Array.isArray(summary.results)) {
      output += `\n  ${this.dependencies.chalk.cyan('Results:')}\n`;
      summary.results.forEach((result, i) => {
        const status = result.success ? '✓' : '✗';
        const color = result.success
          ? this.dependencies.colors.success
          : this.dependencies.colors.error;
        output += `    ${color(status)} ${result.description || `Result ${i + 1}`}\n`;
      });
    }

    // Recommendations
    if (showRecommendations && summary.recommendations && summary.recommendations.length > 0) {
      output += `\n  ${this.dependencies.colors.success('Recommendations:')}\n`;
      summary.recommendations.forEach((rec) => {
        output += `    • ${rec}\n`;
      });
    }

    return output;
  }

  /**
   * Format security results
   */
  formatSecurityResults(results, options = {}) {
    const { showAll = false, maxIssues = 10 } = options;

    let output = '';

    if (!results || !Array.isArray(results.issues)) {
      return output;
    }

    // Title
    output += `\n${this.dependencies.colors.title('Security Scan Results')}\n`;
    output += `${'═'.repeat(25)}\n\n`;

    // Summary
    const total = results.issues.length;
    const critical = results.issues.filter((i) => i.severity === 'critical').length;
    const high = results.issues.filter((i) => i.severity === 'high').length;
    const medium = results.issues.filter((i) => i.severity === 'medium').length;
    const low = results.issues.filter((i) => i.severity === 'low').length;

    output += `  ${this.dependencies.chalk.cyan('Total Issues:')} ${total}\n`;
    if (critical > 0) {
      output += `  ${this.dependencies.colors.error('Critical:')} ${critical}\n`;
    }
    if (high > 0) {
      output += `  ${this.dependencies.colors.warn('High:')} ${high}\n`;
    }
    if (medium > 0) {
      output += `  ${this.dependencies.chalk.yellow('Medium:')} ${medium}\n`;
    }
    if (low > 0) {
      output += `  ${this.dependencies.chalk.green('Low:')} ${low}\n`;
    }

    // Issues
    if (total > 0) {
      output += `\n  ${this.dependencies.chalk.cyan('Issues:')}\n`;

      const issuesToShow = showAll ? results.issues : results.issues.slice(0, maxIssues);

      issuesToShow.forEach((issue, i) => {
        let severityColor;
        switch (issue.severity) {
          case 'critical':
            severityColor = this.dependencies.colors.error;
            break;
          case 'high':
            severityColor = this.dependencies.colors.warn;
            break;
          case 'medium':
            severityColor = this.dependencies.chalk.yellow;
            break;
          case 'low':
            severityColor = this.dependencies.chalk.green;
            break;
          default:
            severityColor = this.dependencies.chalk.gray;
        }

        output += `\n    ${severityColor(`[${issue.severity.toUpperCase()}]`)} ${issue.title}\n`;
        output += `      ${this.dependencies.chalk.gray('Location:')} ${issue.location}\n`;
        if (issue.description) {
          output += `      ${this.dependencies.chalk.gray('Description:')} ${issue.description}\n`;
        }
        if (issue.remediation) {
          output += `      ${this.dependencies.colors.success('Fix:')} ${issue.remediation}\n`;
        }
      });

      if (!showAll && total > maxIssues) {
        output += `\n    ${this.dependencies.chalk.gray(`... and ${total - maxIssues} more issues`)}\n`;
      }
    }

    // Recommendations
    if (results.recommendations && results.recommendations.length > 0) {
      output += `\n  ${this.dependencies.colors.success('Recommendations:')}\n`;
      for (const rec of results.recommendations) {
        output += `    • ${rec}\n`;
      }
    }

    return output;
  }

  /**
   * Format list
   */
  list(items, options = {}) {
    const { bullet = '•', indent = 2, numbered = false } = options;

    let output = '';
    const spaces = ' '.repeat(indent);

    items.forEach((item, i) => {
      const prefix = numbered ? `${i + 1}.` : bullet;
      output += `${spaces}${prefix} ${item}\n`;
    });

    return output;
  }

  /**
   * Format key-value pairs
   */
  keyValuePairs(pairs, options = {}) {
    const { indent = 2, keyWidth = 20, separator = ': ' } = options;

    let output = '';
    const spaces = ' '.repeat(indent);

    // Calculate max key width
    let maxKeyWidth = keyWidth;
    if (keyWidth === 'auto') {
      maxKeyWidth = Math.max(...Object.keys(pairs).map((key) => key.length));
    }

    for (const [key, value] of Object.entries(pairs)) {
      const paddedKey = key.padEnd(maxKeyWidth);

      if (this.configManager.getConfig().colors) {
        output += `${spaces}${this.dependencies.chalk.cyan(paddedKey)}${separator}${this.dependencies.chalk.white(value)}\n`;
      } else {
        output += `${spaces}${paddedKey}${separator}${value}\n`;
      }
    }

    return output;
  }

  // Alias methods with format prefix for backward compatibility
  formatCode(code, language = 'javascript') {
    return this.code(code, language);
  }

  formatCommand(command) {
    return this.command(command);
  }

  formatFilePath(filePath, options = {}) {
    return this.filePath(filePath, options);
  }

  formatJson(data, options = {}) {
    return this.json(data, options);
  }

  formatSuccessSummary(results, options = {}) {
    return this.successSummary(results, options);
  }

  formatSecurityResults(results, options = {}) {
    return this.securityResults(results, options);
  }
}

module.exports = FormatterUtils;
