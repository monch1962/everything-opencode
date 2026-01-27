#!/usr/bin/env node
/**
 * Dependency Loader Module for LoggingUtils
 *
 * Load optional dependencies with graceful fallbacks
 */

class DependencyLoader {
  constructor() {
    this.chalk = null;
    this.boxen = null;
    this.ora = null;
    this.Table = null;
    this.ProgressBar = null;
    this.colors = null;

    this.loadDependencies();
    this.setupColors();
  }

  /**
   * Load all optional dependencies with fallbacks
   */
  loadDependencies() {
    this.loadChalk();
    this.loadBoxen();
    this.loadOra();
    this.loadTable();
    this.loadProgressBar();
  }

  /**
   * Load chalk with fallback
   */
  loadChalk() {
    try {
      this.chalk = require('chalk');
    } catch (e) {
      // Fallback to plain text
      this.chalk = {
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
  }

  /**
   * Load boxen with fallback
   */
  loadBoxen() {
    try {
      this.boxen = require('boxen');
    } catch (e) {
      this.boxen = (text, options = {}) => {
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
  }

  /**
   * Load ora with fallback
   */
  loadOra() {
    try {
      this.ora = require('ora');
    } catch (e) {
      this.ora = (text) => {
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
  }

  /**
   * Load cli-table3 with fallback
   */
  loadTable() {
    try {
      this.Table = require('cli-table3');
    } catch (e) {
      this.Table = class {
        constructor(options = {}) {
          this.options = options;
          this.rows = [];
          this.head = options.head || [];
        }

        push(row) {
          this.rows.push(row);
        }

        toString() {
          if (this.rows.length === 0) {
            return '';
          }

          // Simple table rendering
          const colWidths = [];
          const allRows = [this.head, ...this.rows];

          // Calculate column widths
          for (let i = 0; i < this.head.length; i++) {
            let maxWidth = this.head[i] ? this.head[i].length : 0;
            for (const row of this.rows) {
              if (row[i] && row[i].toString().length > maxWidth) {
                maxWidth = row[i].toString().length;
              }
            }
            colWidths.push(maxWidth + 2);
          }

          // Build table
          let output = '';

          // Header
          if (this.head.length > 0) {
            output += '┌';
            for (let i = 0; i < colWidths.length; i++) {
              output += '─'.repeat(colWidths[i]);
              if (i < colWidths.length - 1) {
                output += '┬';
              }
            }
            output += '┐\n';

            output += '│';
            for (let i = 0; i < this.head.length; i++) {
              const cell = this.head[i] || '';
              output += ` ${cell.padEnd(colWidths[i] - 2)} │`;
            }
            output += '\n';

            output += '├';
            for (let i = 0; i < colWidths.length; i++) {
              output += '─'.repeat(colWidths[i]);
              if (i < colWidths.length - 1) {
                output += '┼';
              }
            }
            output += '┤\n';
          }

          // Rows
          for (const row of this.rows) {
            output += '│';
            for (let i = 0; i < row.length; i++) {
              const cell = row[i] ? row[i].toString() : '';
              output += ` ${cell.padEnd(colWidths[i] - 2)} │`;
            }
            output += '\n';
          }

          // Footer
          output += '└';
          for (let i = 0; i < colWidths.length; i++) {
            output += '─'.repeat(colWidths[i]);
            if (i < colWidths.length - 1) {
              output += '┴';
            }
          }
          output += '┘\n';

          return output;
        }
      };
    }
  }

  /**
   * Load progress with fallback
   */
  loadProgressBar() {
    try {
      this.ProgressBar = require('progress');
    } catch (e) {
      this.ProgressBar = class {
        constructor(format, options = {}) {
          this.format = format;
          this.total = options.total || 100;
          this.current = 0;
          this.width = options.width || 40;
          this.complete = options.complete || '=';
          this.incomplete = options.incomplete || '-';
        }

        tick(amount = 1) {
          this.current += amount;
          this.render();
        }

        update(ratio) {
          this.current = Math.floor(ratio * this.total);
          this.render();
        }

        render() {
          const percent = Math.min(100, Math.floor((this.current / this.total) * 100));
          const filled = Math.floor((percent / 100) * this.width);
          const empty = this.width - filled;

          const bar = this.complete.repeat(filled) + this.incomplete.repeat(empty);
          const formatted = this.format
            .replace(':bar', bar)
            .replace(':percent', `${percent}%`)
            .replace(':current', this.current)
            .replace(':total', this.total)
            .replace(':elapsed', '0s')
            .replace(':eta', '0s');

          process.stdout.write(`\r${formatted}`);
        }

        terminate() {
          process.stdout.write('\n');
        }
      };
    }
  }

  /**
   * Setup color mappings
   */
  setupColors() {
    this.colors = {
      error: this.chalk.red,
      warn: this.chalk.yellow,
      info: this.chalk.blue,
      debug: this.chalk.gray,
      success: this.chalk.green,
      title: this.chalk.bold.cyan,
      subtitle: this.chalk.bold.magenta,
      highlight: this.chalk.bold.yellow,
      code: this.chalk.bgBlack.white,
      path: this.chalk.cyan,
      command: this.chalk.magenta,
      json: this.chalk.white,
    };
  }

  /**
   * Get all loaded dependencies
   */
  getDependencies() {
    return {
      chalk: this.chalk,
      boxen: this.boxen,
      ora: this.ora,
      Table: this.Table,
      ProgressBar: this.ProgressBar,
      colors: this.colors,
    };
  }
}

module.exports = DependencyLoader;
