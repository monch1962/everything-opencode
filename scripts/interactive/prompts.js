#!/usr/bin/env node
/**
 * Interactive Prompt System for opencode
 *
 * Provides rich, interactive prompts for project configuration
 */

const readline = require('readline');

// ANSI color codes for better UX
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

class InteractivePrompts {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Display a styled header
   */
  header(title) {
    console.log(`\n${colors.cyan}${colors.bold}${title}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(title.length)}${colors.reset}\n`);
  }

  /**
   * Display a styled section
   */
  section(title) {
    console.log(`${colors.blue}${title}${colors.reset}`);
  }

  /**
   * Display success message
   */
  success(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  }

  /**
   * Display warning message
   */
  warning(message) {
    console.log(`${colors.yellow}!${colors.reset} ${message}`);
  }

  /**
   * Display error message
   */
  error(message) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
  }

  /**
   * Display info message
   */
  info(message) {
    console.log(`${colors.cyan}i${colors.reset} ${message}`);
  }

  /**
   * Simple yes/no question
   */
  async confirm(question, defaultValue = true) {
    const suffix = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.question(`${question} [${suffix}] `);

    if (answer.trim() === '') {
      return defaultValue;
    }

    return /^y(es)?$/i.test(answer.trim());
  }

  /**
   * Multiple choice selection
   */
  async select(question, options, defaultValue = 0) {
    console.log(`\n${colors.bold}${question}${colors.reset}`);

    options.forEach((option, index) => {
      const prefix = index === defaultValue ? `${colors.green}▶${colors.reset}` : ' ';
      console.log(`  ${prefix} ${index + 1}. ${option}`);
    });

    const answer = await this.question(`\nSelect [1-${options.length}] (${defaultValue + 1}): `);

    if (answer.trim() === '') {
      return defaultValue;
    }

    const selected = parseInt(answer.trim(), 10) - 1;
    if (isNaN(selected) || selected < 0 || selected >= options.length) {
      this.warning(`Invalid selection. Using default: ${options[defaultValue]}`);
      return defaultValue;
    }

    return selected;
  }

  /**
   * Multiple choice with descriptions
   */
  async selectWithDescriptions(question, choices) {
    console.log(`\n${colors.bold}${question}${colors.reset}`);

    choices.forEach((choice, index) => {
      const { title, description, recommended = false } = choice;
      const rec = recommended ? ` ${colors.green}(recommended)${colors.reset}` : '';
      console.log(`  ${index + 1}. ${title}${rec}`);
      if (description) {
        console.log(`     ${colors.dim}${description}${colors.reset}`);
      }
    });

    const answer = await this.question(`\nSelect [1-${choices.length}]: `);
    const selected = parseInt(answer.trim(), 10) - 1;

    if (isNaN(selected) || selected < 0 || selected >= choices.length) {
      throw new Error('Invalid selection');
    }

    return choices[selected].value || choices[selected].title;
  }

  /**
   * Text input with validation
   */
  async input(question, defaultValue = '', validator = null) {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    let answer = await this.question(prompt);

    if (answer.trim() === '' && defaultValue) {
      answer = defaultValue;
    }

    if (validator) {
      const validation = validator(answer);
      if (validation !== true) {
        this.error(validation);
        return await this.input(question, defaultValue, validator);
      }
    }

    return answer.trim();
  }

  /**
   * Multi-select (checkbox style)
   */
  async multiSelect(question, options, defaults = []) {
    console.log(`\n${colors.bold}${question}${colors.reset}`);
    console.log(`${colors.dim}(Space to toggle, Enter to confirm)${colors.reset}\n`);

    const selected = new Set(defaults);

    // Display options with checkboxes
    const displayOptions = () => {
      options.forEach((option, index) => {
        const isSelected = selected.has(index);
        const checkbox = isSelected ? `${colors.green}[✓]${colors.reset}` : '[ ]';
        console.log(`  ${checkbox} ${index + 1}. ${option}`);
      });
    };

    displayOptions();

    // Simple implementation - in real use, would need more complex input handling
    const answer = await this.question('\nEnter numbers separated by commas (e.g., 1,3,4): ');

    if (answer.trim()) {
      const indices = answer
        .split(',')
        .map((num) => parseInt(num.trim(), 10) - 1)
        .filter((index) => !isNaN(index) && index >= 0 && index < options.length);

      return indices;
    }

    return Array.from(selected);
  }

  /**
   * Basic question prompt
   */
  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Close the readline interface
   */
  close() {
    this.rl.close();
  }

  /**
   * Display a progress indicator
   */
  async withProgress(message, task) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;

    const interval = setInterval(() => {
      process.stdout.write(`\r${frames[i]} ${message}`);
      i = (i + 1) % frames.length;
    }, 80);

    try {
      const result = await task();
      clearInterval(interval);
      process.stdout.write(`\r${colors.green}✓${colors.reset} ${message} - Done!\n`);
      return result;
    } catch (error) {
      clearInterval(interval);
      process.stdout.write(`\r${colors.red}✗${colors.reset} ${message} - Failed!\n`);
      throw error;
    }
  }

  /**
   * Display a table of options
   */
  table(headers, rows) {
    // Simple table display
    console.log(`\n${colors.bold}${headers.join(' | ')}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(headers.join(' | ').length)}${colors.reset}`);

    rows.forEach((row) => {
      console.log(row.join(' | '));
    });
    console.log('');
  }
}

module.exports = InteractivePrompts;
