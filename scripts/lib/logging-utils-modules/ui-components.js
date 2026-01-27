#!/usr/bin/env node
/**
 * UI Components Module for LoggingUtils
 *
 * UI components: spinner, progressBar, table, box
 */

class UIComponents {
  constructor(dependencies, configManager) {
    this.dependencies = dependencies;
    this.configManager = configManager;
  }

  /**
   * Create a spinner
   */
  spinner(text, options = {}) {
    const spinnerOptions = {
      text: text || 'Loading...',
      color: options.color || 'cyan',
      spinner: options.spinner || 'dots',
    };

    const spinner = this.dependencies.ora(spinnerOptions);

    // Add custom methods
    const enhancedSpinner = {
      ...spinner,

      // Override start to use our config
      start: (text) => {
        if (text) {
          spinnerOptions.text = text;
        }
        return spinner.start ? spinner.start(spinnerOptions.text) : spinner;
      },

      // Add custom success with color
      succeed: (msg) => {
        if (spinner.succeed) {
          return spinner.succeed(msg);
        }
        console.log(`✓ ${msg || spinnerOptions.text}`);
        return enhancedSpinner;
      },

      // Add custom fail with color
      fail: (msg) => {
        if (spinner.fail) {
          return spinner.fail(msg);
        }
        console.log(`✗ ${msg || spinnerOptions.text}`);
        return enhancedSpinner;
      },

      // Add custom warn with color
      warn: (msg) => {
        if (spinner.warn) {
          return spinner.warn(msg);
        }
        console.log(`⚠ ${msg || spinnerOptions.text}`);
        return enhancedSpinner;
      },

      // Add custom info with color
      info: (msg) => {
        if (spinner.info) {
          return spinner.info(msg);
        }
        console.log(`ℹ ${msg || spinnerOptions.text}`);
        return enhancedSpinner;
      },
    };

    return enhancedSpinner;
  }

  /**
   * Create a progress bar
   */
  progressBar(total, options = {}) {
    const barOptions = {
      total: total || 100,
      width: options.width || 40,
      complete: options.complete || '=',
      incomplete: options.incomplete || '-',
      clear: options.clear !== false,
      callback: options.callback,
    };

    const format = options.format || '[:bar] :percent :current/:total :etas';

    const bar = new this.dependencies.ProgressBar(format, barOptions);

    // Add custom methods
    const enhancedBar = {
      ...bar,

      // Add tick with optional callback
      tick: (amount = 1, tokens) => {
        bar.tick(amount, tokens);

        if (barOptions.callback && bar.curr >= barOptions.total) {
          barOptions.callback();
        }

        return enhancedBar;
      },

      // Add update with ratio
      update: (ratio) => {
        bar.update(ratio);

        if (barOptions.callback && ratio >= 1) {
          barOptions.callback();
        }

        return enhancedBar;
      },

      // Add complete method
      complete: () => {
        if (bar.curr < barOptions.total) {
          bar.tick(barOptions.total - bar.curr);
        }
        return enhancedBar;
      },

      // Add interrupt method
      interrupt: (message) => {
        console.log(`\n${message}`);
        return enhancedBar;
      },
    };

    return enhancedBar;
  }

  /**
   * Create a table
   */
  table(options = {}) {
    const headers = options.head || [];
    const rows = options.rows || [];

    const tableOptions = {
      head: headers,
      style: {
        head: options.style?.head || [],
        border: options.style?.border || [],
      },
      colWidths: options.colWidths || [],
      colAligns: options.colAligns || headers.map(() => 'left'),
    };

    const table = new this.dependencies.Table(tableOptions);

    // Add rows
    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        table.push(row);
      }
    }

    // Add custom methods
    const enhancedTable = {
      ...table,

      // Add row method
      addRow: (row) => {
        table.push(row);
        return enhancedTable;
      },

      // Add multiple rows
      addRows: (newRows) => {
        if (Array.isArray(newRows)) {
          for (const row of newRows) {
            table.push(row);
          }
        }
        return enhancedTable;
      },

      // Add clear method
      clear: () => {
        table.length = 0;
        return enhancedTable;
      },

      // Add toString with formatting
      toString: () => {
        return table.toString();
      },

      // Add print method
      print: () => {
        console.log(table.toString());
        return enhancedTable;
      },
    };

    return enhancedTable;
  }

  /**
   * Create a boxed message
   */
  box(message, options = {}) {
    const boxOptions = {
      padding: options.padding || 1,
      margin: options.margin || 1,
      borderStyle: options.borderStyle || 'round',
      borderColor: options.borderColor || 'cyan',
      backgroundColor: options.backgroundColor || 'black',
      align: options.align || 'center',
      title: options.title,
      titleAlignment: options.titleAlignment || 'center',
    };

    // Apply colors if enabled
    let formattedMessage = message;
    if (this.configManager.getConfig().colors && boxOptions.borderColor) {
      const colorFn = this.dependencies.chalk[boxOptions.borderColor];
      if (colorFn) {
        // Note: boxen handles colors internally, so we pass the color name
        boxOptions.borderColor = boxOptions.borderColor;
      }
    }

    // Add title if provided
    if (boxOptions.title) {
      formattedMessage = `${boxOptions.title}\n\n${message}`;
    }

    const boxed = this.dependencies.boxen(formattedMessage, boxOptions);

    // Add custom methods
    const enhancedBox = {
      toString: () => boxed,
      print: () => {
        console.log(boxed);
        return enhancedBox;
      },
      withTitle: (title) => {
        boxOptions.title = title;
        const newBoxed = this.dependencies.boxen(`${title}\n\n${message}`, boxOptions);
        return {
          ...enhancedBox,
          toString: () => newBoxed,
          print: () => {
            console.log(newBoxed);
            return enhancedBox;
          },
        };
      },
    };

    return enhancedBox;
  }

  /**
   * Create a horizontal rule
   */
  hr(length = 40, char = '─') {
    const line = char.repeat(length);
    console.log(line);
    return {
      toString: () => line,
      print: () => {
        console.log(line);
        return this;
      },
    };
  }

  /**
   * Create a section header
   */
  section(title, level = 1) {
    const symbols = ['#', '=', '-', '~'];
    const symbol = symbols[Math.min(level - 1, symbols.length - 1)] || '=';
    const line = symbol.repeat(title.length + 4);

    if (!this.configManager.getConfig().colors) {
      const output = `\n${line}\n${title}\n${line}\n`;
      console.log(output);
      return output;
    }

    const color =
      level === 1
        ? this.dependencies.colors.title
        : level === 2
          ? this.dependencies.colors.subtitle
          : this.dependencies.colors.highlight;

    const output = `\n${color(line)}\n${color(title)}\n${color(line)}\n`;
    console.log(output);
    return output;
  }

  /**
   * Create a key-value display
   */
  keyValue(key, value, options = {}) {
    const { indent = 2, keyWidth = 20 } = options;

    const spaces = ' '.repeat(indent);
    const paddedKey = key.padEnd(keyWidth);

    if (!this.configManager.getConfig().colors) {
      const output = `${spaces}${paddedKey}: ${value}`;
      console.log(output);
      return output;
    }

    const output = `${spaces}${this.dependencies.chalk.cyan(paddedKey)}: ${this.dependencies.chalk.white(value)}`;
    console.log(output);
    return output;
  }
}

module.exports = UIComponents;
