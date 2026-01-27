#!/usr/bin/env node
/**
 * Python Help Utils Module for PythonCommandRunner
 *
 * Helper methods: printHelp
 */

const { LoggingUtils } = require('../../lib');

class PythonHelpUtils {
  constructor() {
    this.helps = {
      test: `
/python-test - Run Python tests

Usage:
  /python-test [options]

Options:
  --file <path>    Run tests in specific file
  --test <name>    Run specific test by name pattern
  --coverage       Generate coverage report
  --verbose        Verbose output
  --help           Show this help

Examples:
  /python-test
  /python-test --file tests/test_auth.py
  /python-test --coverage --verbose
      `,

      lint: `
/python-lint - Run Python linter

Usage:
  /python-lint [options]

Options:
  --fix            Automatically fix linting issues
  --file <path>    Check specific file
  --check          Check without fixing (default)
  --help           Show this help

Examples:
  /python-lint
  /python-lint --fix
  /python-lint --file app/main.py
      `,

      typecheck: `
/python-typecheck - Run Python type checker

Usage:
  /python-typecheck [options]

Options:
  --strict         Enable strict type checking
  --file <path>    Check specific file
  --help           Show this help

Examples:
  /python-typecheck
  /python-typecheck --strict
  /python-typecheck --file app/main.py
      `,

      deps: `
/python-deps - Manage Python dependencies

Usage:
  /python-deps <command> [packages...] [options]

Commands:
  install          Install dependencies
  add <package>    Add new dependency
  remove <package> Remove dependency
  update           Update dependencies
  list             List dependencies

Options:
  --dev            Development dependency
  --help           Show this help

Examples:
  /python-deps install
  /python-deps add fastapi
  /python-deps add pytest --dev
  /python-deps list
      `,

      setup: `
/python-setup - Configure Python project

Usage:
  /python-setup [options]

Options:
  --quick          Quick setup with automatic detection
  --reconfigure    Force reconfiguration
  --help           Show this help

Examples:
  /python-setup
  /python-setup --quick
  /python-setup --reconfigure
      `,
    };
  }

  /**
   * Print command help
   */
  printHelp(command) {
    if (command && this.helps[command]) {
      console.log(this.helps[command]);
    } else {
      this.printGeneralHelp();
    }
  }

  /**
   * Print general help
   */
  printGeneralHelp() {
    console.log(`
Python Command Runner - Available Commands:

  /python-test      - Run Python tests
  /python-lint      - Run Python linter
  /python-format    - Format Python code
  /python-typecheck - Run Python type checker
  /python-deps      - Manage Python dependencies
  /python-setup     - Configure Python project

Usage:
  /python-<command> [options]

For detailed help on a specific command:
  /python-<command> --help
    `);
  }

  /**
   * Get help text for command
   */
  getHelp(command) {
    return this.helps[command] || this.getGeneralHelp();
  }

  /**
   * Get general help text
   */
  getGeneralHelp() {
    return `
Python Command Runner - Available Commands:

  /python-test      - Run Python tests
  /python-lint      - Run Python linter
  /python-format    - Format Python code
  /python-typecheck - Run Python type checker
  /python-deps      - Manage Python dependencies
  /python-setup     - Configure Python project

Usage:
  /python-<command> [options]

For detailed help on a specific command:
  /python-<command> --help
    `;
  }

  /**
   * Print command usage examples
   */
  printExamples(command) {
    const examples = {
      test: `
Examples:
  /python-test
  /python-test --file tests/test_auth.py
  /python-test --coverage --verbose
      `,

      lint: `
Examples:
  /python-lint
  /python-lint --fix
  /python-lint --file app/main.py
      `,

      typecheck: `
Examples:
  /python-typecheck
  /python-typecheck --strict
  /python-typecheck --file app/main.py
      `,

      deps: `
Examples:
  /python-deps install
  /python-deps add fastapi
  /python-deps add pytest --dev
  /python-deps list
      `,

      setup: `
Examples:
  /python-setup
  /python-setup --quick
  /python-setup --reconfigure
      `,
    };

    if (command && examples[command]) {
      console.log(examples[command]);
    } else {
      console.log('Use /python-<command> --help for examples');
    }
  }

  /**
   * Print command options
   */
  printOptions(command) {
    const options = {
      test: `
Options:
  --file <path>    Run tests in specific file
  --test <name>    Run specific test by name pattern
  --coverage       Generate coverage report
  --verbose        Verbose output
      `,

      lint: `
Options:
  --fix            Automatically fix linting issues
  --file <path>    Check specific file
  --check          Check without fixing (default)
      `,

      typecheck: `
Options:
  --strict         Enable strict type checking
  --file <path>    Check specific file
      `,

      deps: `
Options:
  --dev            Development dependency
      `,

      setup: `
Options:
  --quick          Quick setup with automatic detection
  --reconfigure    Force reconfiguration
      `,
    };

    if (command && options[command]) {
      console.log(options[command]);
    }
  }
}

module.exports = PythonHelpUtils;
