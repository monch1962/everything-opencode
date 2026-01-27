#!/usr/bin/env node
/**
 * Logging and Output Formatting Utilities
 *
 * Consistent logging, output formatting, and user feedback for language tools
 */

// Try to load optional dependencies with graceful fallbacks
let chalk, boxen, ora, Table, ProgressBar;

try {
  chalk = require('chalk');
} catch (e) {
  // Fallback to plain text
  chalk = {
    red: (s) => s,
    yellow: (s) => s,
    blue: (s) => s,
    green: (s) => s,
    gray: (s) => s,
    dim: (s) => s,
    bold: {
      cyan: (s) => s,
      magenta: (s) => s,
      yellow: (s) => s,
    },
    cyan: (s) => s,
    magenta: (s) => s,
    white: (s) => s,
    bgBlack: {
      white: (s) => s,
    },
  };
}

try {
  boxen = require('boxen');
} catch (e) {
  boxen = (text, options = {}) => {
    const padding = options.padding || 1;
    const margin = options.margin || 1;
    const horizontal = '─'.repeat(text.length + padding * 2);
    const vertical = '│';

    let result = '\n'.repeat(margin);
    result += `┌${horizontal}┐\n`;
    result += `${vertical}${' '.repeat(padding)}${text}${' '.repeat(padding)}${vertical}\n`;
    result += `└${horizontal}┘\n`;
    result += '\n'.repeat(margin);

    return result;
  };
}

try {
  ora = require('ora');
} catch (e) {
  ora = (text) => {
    const spinnerText = text;
    return {
      start: () => {
        console.log(`${spinnerText}...`);
        return this;
      },
      stop: () => {
        return this;
      },
      succeed: (msg) => {
        console.log(`✓ ${msg || spinnerText}`);
        return this;
      },
      fail: (msg) => {
        console.log(`✗ ${msg || spinnerText}`);
        return this;
      },
      warn: (msg) => {
        console.log(`⚠ ${msg || spinnerText}`);
        return this;
      },
      info: (msg) => {
        console.log(`ℹ ${msg || spinnerText}`);
        return this;
      },
    };
  };
}

try {
  Table = require('cli-table3');
} catch (e) {
  Table = class {
    constructor(options = {}) {
      this.options = options;
      this.rows = [];
      this.head = options.head || [];
    }

    push(row) {
      this.rows.push(row);
    }

    toString() {
      if (this.rows.length === 0) return '';

      // Simple table formatting
      const colWidths = [];

      // Calculate column widths
      for (let i = 0; i < this.head.length; i++) {
        let maxWidth = String(this.head[i] || '').length;
        for (const row of this.rows) {
          if (row[i] !== undefined) {
            maxWidth = Math.max(maxWidth, String(row[i]).length);
          }
        }
        colWidths.push(maxWidth + 2);
      }

      // Build table
      let result = '';

      // Header
      if (this.head.length > 0) {
        result += '┌';
        for (let i = 0; i < colWidths.length; i++) {
          result += '─'.repeat(colWidths[i]);
          if (i < colWidths.length - 1) result += '┬';
        }
        result += '┐\n';

        result += '│';
        for (let i = 0; i < this.head.length; i++) {
          const cell = String(this.head[i] || '');
          result += ` ${cell.padEnd(colWidths[i] - 2)} │`;
        }
        result += '\n';

        result += '├';
        for (let i = 0; i < colWidths.length; i++) {
          result += '─'.repeat(colWidths[i]);
          if (i < colWidths.length - 1) result += '┼';
        }
        result += '┤\n';
      }

      // Rows
      for (const row of this.rows) {
        result += '│';
        for (let i = 0; i < colWidths.length; i++) {
          const cell = row[i] !== undefined ? String(row[i]) : '';
          result += ` ${cell.padEnd(colWidths[i] - 2)} │`;
        }
        result += '\n';
      }

      // Footer
      if (this.rows.length > 0) {
        result += '└';
        for (let i = 0; i < colWidths.length; i++) {
          result += '─'.repeat(colWidths[i]);
          if (i < colWidths.length - 1) result += '┴';
        }
        result += '┘\n';
      }

      return result;
    }
  };
}

try {
  ProgressBar = require('progress');
} catch (e) {
  ProgressBar = class {
    constructor(format, options = {}) {
      this.format = format;
      this.options = options;
      this.total = options.total || 100;
      this.current = 0;
      this.startTime = Date.now();
    }

    tick(delta = 1, tokens = {}) {
      this.current += delta;
      const percent = Math.min(100, Math.floor((this.current / this.total) * 100));
      const elapsed = Date.now() - this.startTime;
      const rate = this.current / (elapsed / 1000);
      const estimated = rate > 0 ? (this.total - this.current) / rate : 0;

      const barLength = 30;
      const filled = Math.floor((percent / 100) * barLength);
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

      let formatted = this.format
        .replace(':bar', bar)
        .replace(':percent', `${percent}%`)
        .replace(':current', this.current)
        .replace(':total', this.total)
        .replace(':elapsed', Math.floor(elapsed / 1000))
        .replace(':eta', Math.floor(estimated));

      for (const [key, value] of Object.entries(tokens)) {
        formatted = formatted.replace(`:${key}`, value);
      }

      process.stdout.write(`\r${formatted}`);
    }

    update(ratio, tokens = {}) {
      this.current = Math.floor(ratio * this.total);
      this.tick(0, tokens);
    }

    stop() {
      process.stdout.write('\n');
    }
  };
}

class LoggingUtils {
  /**
   * Initialize logging with options
   */
  static init(options = {}) {
    const {
      level = 'info',
      colors = true,
      timestamps = false,
      verbose = false,
      quiet = false,
    } = options;

    this.config = {
      level: this.normalizeLevel(level),
      colors,
      timestamps,
      verbose,
      quiet,
    };

    // Define log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };

    // Color mappings
    this.colors = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.blue,
      success: chalk.green,
      debug: chalk.gray,
      trace: chalk.dim,
      title: chalk.bold.cyan,
      subtitle: chalk.bold.magenta,
      highlight: chalk.bold.yellow,
      code: chalk.bgBlack.white,
    };

    return this;
  }

  /**
   * Normalize log level string
   */
  static normalizeLevel(level) {
    const levels = ['error', 'warn', 'info', 'debug', 'trace'];
    const normalized = level.toLowerCase();
    return levels.includes(normalized) ? normalized : 'info';
  }

  /**
   * Check if level should be logged
   */
  static shouldLog(level) {
    if (this.config.quiet && level !== 'error') {
      return false;
    }

    const currentLevel = this.levels[this.config.level] || 2;
    const messageLevel = this.levels[level] || 2;

    return messageLevel <= currentLevel;
  }

  /**
   * Format timestamp
   */
  static formatTimestamp() {
    if (!this.config.timestamps) {
      return '';
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return chalk.dim(`[${hours}:${minutes}:${seconds}] `);
  }

  /**
   * Log message with level
   */
  static log(level, message, ...args) {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = this.formatTimestamp();
    const color = this.colors[level] || chalk.white;
    const prefix = level.toUpperCase().padEnd(5);

    if (this.config.colors) {
      console.log(`${timestamp}${color(prefix)} ${message}`, ...args);
    } else {
      console.log(`${timestamp}${prefix} ${message}`, ...args);
    }
  }

  /**
   * Error log
   */
  static error(message, ...args) {
    this.log('error', message, ...args);
  }

  /**
   * Warning log
   */
  static warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  /**
   * Info log
   */
  static info(message, ...args) {
    this.log('info', message, ...args);
  }

  /**
   * Debug log
   */
  static debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  /**
   * Success message
   */
  static success(message, ...args) {
    if (this.config.quiet) return;

    const timestamp = this.formatTimestamp();
    const color = this.colors.success;

    if (this.config.colors) {
      console.log(`${timestamp}${color('✓')} ${message}`, ...args);
    } else {
      console.log(`${timestamp}✓ ${message}`, ...args);
    }
  }

  /**
   * Create a spinner
   */
  static spinner(text, options = {}) {
    if (this.config.quiet) {
      return {
        start: () => this,
        stop: () => this,
        succeed: () => this,
        fail: () => this,
        warn: () => this,
        info: () => this,
      };
    }

    const spinnerOptions = {
      text: this.config.colors ? this.colors.info(text) : text,
      color: 'blue',
      spinner: 'dots',
      ...options,
    };

    return ora(spinnerOptions);
  }

  /**
   * Create a progress bar
   */
  static progressBar(total, options = {}) {
    if (this.config.quiet) {
      return {
        tick: () => {},
        update: () => {},
        stop: () => {},
      };
    }

    const barOptions = {
      total,
      width: 30,
      complete: '=',
      incomplete: ' ',
      clear: true,
      ...options,
    };

    if (this.config.colors) {
      barOptions.render = (throttle, tokens) => {
        const progress = Math.floor(tokens.percent * 100);
        const bar = '='.repeat(Math.floor(tokens.ratio * barOptions.width));
        const empty = ' '.repeat(barOptions.width - bar.length);

        let color;
        if (progress < 30) color = chalk.red;
        else if (progress < 70) color = chalk.yellow;
        else color = chalk.green;

        return color(`  ${tokens.msg || 'Processing'} [${bar}${empty}] ${progress}%`);
      };
    }

    return new ProgressBar('  :msg [:bar] :percent', barOptions);
  }

  /**
   * Create a table
   */
  static table(headers, rows, options = {}) {
    const tableOptions = {
      head: headers,
      style: {
        head: this.config.colors ? ['cyan'] : [],
        border: this.config.colors ? ['gray'] : [],
      },
      ...options,
    };

    const table = new Table(tableOptions);

    for (const row of rows) {
      table.push(row);
    }

    return table.toString();
  }

  /**
   * Create a boxed message
   */
  static box(message, options = {}) {
    const boxOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: this.config.colors ? 'cyan' : 'white',
      backgroundColor: 'black',
      ...options,
    };

    if (this.config.colors && this.colors.title) {
      message = this.colors.title(message);
    }

    return boxen(message, boxOptions);
  }

  /**
   * Format code block
   */
  static code(code, language = '') {
    if (!this.config.colors) {
      return `\`\`\`${language}\n${code}\n\`\`\``;
    }

    const lines = code.split('\n');
    const formattedLines = lines.map((line) => this.colors.code(`  ${line}`));

    const header = language ? this.colors.subtitle(`📝 ${language.toUpperCase()}`) : '';

    return `${header}\n${formattedLines.join('\n')}`;
  }

  /**
   * Format command for display
   */
  static command(cmd, description = '') {
    if (!this.config.colors) {
      return `$ ${cmd}${description ? ` # ${description}` : ''}`;
    }

    const formattedCmd = this.colors.highlight(`$ ${cmd}`);
    const formattedDesc = description ? chalk.dim(` # ${description}`) : '';

    return `${formattedCmd}${formattedDesc}`;
  }

  /**
   * Format file path
   */
  static filePath(path, options = {}) {
    const { relative = true, highlight = false } = options;

    let displayPath = path;

    if (relative && process.cwd()) {
      try {
        displayPath = require('path').relative(process.cwd(), path);
      } catch (e) {
        // Keep absolute path if relative fails
      }
    }

    if (!this.config.colors) {
      return displayPath;
    }

    const color = highlight ? this.colors.highlight : chalk.cyan;
    return color(displayPath);
  }

  /**
   * Format JSON for display
   */
  static json(data, options = {}) {
    const { indent = 2, colors = true } = options;

    const jsonStr = JSON.stringify(data, null, indent);

    if (!this.config.colors || !colors) {
      return jsonStr;
    }

    // Simple JSON syntax highlighting
    return jsonStr
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
        if (/:$/.test(match)) {
          // Key
          return chalk.green(match);
        } else {
          // String value
          return chalk.yellow(match);
        }
      })
      .replace(/\b(true|false|null)\b/g, chalk.magenta('$1'))
      .replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, chalk.cyan('$&'));
  }

  /**
   * Format error with recovery steps
   */
  static formatError(error, _context = {}) {
    if (error.errorInfo) {
      // Already formatted by error handler
      const errorInfo = error.errorInfo;

      let output = '';

      // Error message
      output += this.colors.error(`\n❌ ${errorInfo.userMessage}\n`);

      // Recovery steps
      if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
        output += this.colors.info('\n💡 Recovery steps:\n');
        errorInfo.recoverySteps.forEach((step, i) => {
          output += `  ${i + 1}. ${step}\n`;
        });
      }

      // Debug info (verbose mode only)
      if (this.config.verbose) {
        output += this.colors.debug('\n🔍 Debug information:\n');
        output += this.colors.debug(`  Category: ${errorInfo.category}\n`);
        output += this.colors.debug(`  Tool: ${errorInfo.tool || 'unknown'}\n`);
        output += this.colors.debug(`  Command: ${errorInfo.command || 'unknown'}\n`);

        if (errorInfo.stack) {
          output += this.colors.debug('\n  Stack trace:\n');
          const stackLines = errorInfo.stack.split('\n').slice(0, 5);
          stackLines.forEach((line) => {
            output += this.colors.debug(`    ${line}\n`);
          });
        }
      }

      return output;
    } else {
      // Regular error
      return this.colors.error(`\n❌ ${error.message}\n`);
    }
  }

  /**
   * Format success summary
   */
  static formatSuccessSummary(summary, options = {}) {
    const { title = '✅ Success Summary', showDuration = true } = options;

    let output = '';

    // Title
    output += this.colors.success(`\n${title}\n`);
    output += this.colors.success(`${'='.repeat(title.length)}\n`);

    // Duration if available
    if (showDuration && summary.duration) {
      output += this.colors.info(`  Duration: ${summary.duration}ms\n`);
    }

    // Items
    if (summary.items && Array.isArray(summary.items)) {
      for (const item of summary.items) {
        const icon = item.success ? '✓' : '✗';
        const color = item.success ? this.colors.success : this.colors.error;
        output += color(`  ${icon} ${item.description}\n`);

        if (item.details) {
          output += this.colors.dim(`    ${item.details}\n`);
        }
      }
    }

    // Stats
    if (summary.stats) {
      output += this.colors.info('\n  Statistics:\n');
      for (const [key, value] of Object.entries(summary.stats)) {
        output += this.colors.info(`    ${key}: ${value}\n`);
      }
    }

    return output;
  }

  /**
   * Format security scan results
   */
  static formatSecurityResults(results, options = {}) {
    const { title = '🔒 Security Scan Results', showAll = false } = options;

    let output = '';

    // Title
    output += this.colors.title(`\n${title}\n`);
    output += this.colors.title(`${'='.repeat(title.length)}\n`);

    // Summary
    if (results.summary) {
      const { vulnerabilities, warnings, advisories } = results.summary;

      if (vulnerabilities > 0) {
        output += this.colors.error(`  ❌ Vulnerabilities: ${vulnerabilities}\n`);
      } else {
        output += this.colors.success(`  ✅ Vulnerabilities: ${vulnerabilities}\n`);
      }

      if (warnings > 0) {
        output += this.colors.warn(`  ⚠️  Warnings: ${warnings}\n`);
      } else {
        output += this.colors.success(`  ✅ Warnings: ${warnings}\n`);
      }

      if (advisories > 0) {
        output += this.colors.info(`  📋 Advisories: ${advisories}\n`);
      }
    }

    // Tools
    if (results.tools && Object.keys(results.tools).length > 0) {
      output += this.colors.info('\n  Tools used:\n');

      const tableData = [];
      for (const [tool, data] of Object.entries(results.tools)) {
        const issues = data.issues || data.vulnerabilities || 0;
        const status = issues > 0 ? this.colors.error('✗') : this.colors.success('✓');

        tableData.push([status, tool, issues, data.scanned || data.dependencies || 'N/A']);
      }

      const table = this.table(['', 'Tool', 'Issues', 'Scanned'], tableData, {
        style: { border: [] },
      });

      output += `${table
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')}\n`;
    }

    // Details (if requested and available)
    if (showAll && results.details) {
      output += this.colors.info('\n  Details:\n');

      for (const [category, items] of Object.entries(results.details)) {
        if (items && items.length > 0) {
          output += this.colors.subtitle(`    ${category}:\n`);

          for (const item of items.slice(0, 5)) {
            // Show first 5 items
            const severity = item.severity || 'medium';
            let severityColor;

            switch (severity.toLowerCase()) {
              case 'critical':
                severityColor = this.colors.error;
                break;
              case 'high':
                severityColor = this.colors.error;
                break;
              case 'medium':
                severityColor = this.colors.warn;
                break;
              case 'low':
                severityColor = this.colors.info;
                break;
              default:
                severityColor = this.colors.info;
            }

            output += severityColor(`      • ${item.title || item.id}\n`);

            if (item.description) {
              output += this.colors.dim(`        ${item.description.substring(0, 100)}...\n`);
            }
          }

          if (items.length > 5) {
            output += this.colors.dim(`      ... and ${items.length - 5} more\n`);
          }
        }
      }
    }

    // Recommendations
    if (results.recommendations && results.recommendations.length > 0) {
      output += this.colors.success('\n  Recommendations:\n');

      for (const rec of results.recommendations) {
        output += this.colors.success(`    • ${rec}\n`);
      }
    }

    return output;
  }

  /**
   * Create a section header
   */
  static section(title, level = 1) {
    const symbols = ['#', '=', '-', '~'];
    const symbol = symbols[Math.min(level - 1, symbols.length - 1)] || '=';
    const line = symbol.repeat(title.length + 4);

    if (!this.config.colors) {
      return `\n${line}\n${title}\n${line}\n`;
    }

    const color =
      level === 1 ? this.colors.title : level === 2 ? this.colors.subtitle : this.colors.highlight;

    return `\n${color(line)}\n${color(title)}\n${color(line)}\n`;
  }

  /**
   * Create a key-value display
   */
  static keyValue(key, value, options = {}) {
    const { indent = 2, keyWidth = 20 } = options;

    const spaces = ' '.repeat(indent);
    const paddedKey = key.padEnd(keyWidth);

    if (!this.config.colors) {
      return `${spaces}${paddedKey}: ${value}`;
    }

    return `${spaces}${chalk.cyan(paddedKey)}: ${chalk.white(value)}`;
  }
}

// Initialize with default config
LoggingUtils.init();

module.exports = LoggingUtils;
