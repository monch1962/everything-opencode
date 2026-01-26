#!/usr/bin/env node
/**
 * Python Command Runner
 *
 * Base class for executing Python commands based on project configuration
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { runCommand, commandExists } = require("../lib/utils");
const ConfigManager = require("../interactive/config-manager");
const PythonToolDetector = require("../python/tool-detector");
const { defaultErrorHandler } = require("../lib/error-handler");

class PythonCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new PythonToolDetector();
    this.config = null;
    this.pythonConfig = null;
  }

  /**
   * Initialize command runner
   */
  async initialize() {
    // Load configuration
    this.config = this.configManager.loadConfig();
    if (!this.config) {
      throw new Error("Project not configured. Run /python-setup first.");
    }

    // Get Python configuration
    this.pythonConfig = this.config.python;
    if (!this.pythonConfig) {
      throw new Error(
        "Python configuration not found. Run /python-setup first.",
      );
    }

    return true;
  }

  /**
   * Check if required tool is installed
   */
  async checkTool(toolName, required = true) {
    const toolInfo = this.pythonConfig.tools?.[toolName];

    if (!toolInfo || !toolInfo.installed) {
      if (required) {
        throw new Error(
          `${toolName} is not installed. Install it or run /python-setup.`,
        );
      }
      return false;
    }

    return true;
  }

  /**
   * Get Python executable path
   */
  getPythonExecutable() {
    // Check for python3 first, then python
    if (this.pythonConfig.tools?.python3?.installed) {
      return "python3";
    } else if (this.pythonConfig.tools?.python?.installed) {
      return "python";
    } else if (commandExists("python3")) {
      return "python3";
    } else if (commandExists("python")) {
      return "python";
    }

    throw new Error(
      "Python not found. Install Python 3.8+ and run /python-setup.",
    );
  }

  /**
   * Execute command with proper environment
   */
  async executeCommand(command, args = [], options = {}) {
    return this._executeCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with comprehensive error handling
   */
  async _executeCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      const fullCommand = [command, ...args].join(" ");
      console.log(`\n🚀 Executing: ${fullCommand}\n`);

      return await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          cwd: this.projectPath,
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            PYTHONPATH: `${this.projectPath}:${process.env.PYTHONPATH || ""}`,
            ...options.env,
          },
          ...options,
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`Command failed with exit code ${code}`));
          }
        });

        child.on("error", (error) => {
          reject(error);
        });
      });
    } catch (error) {
      // Enhance error with context
      const context = {
        tool: "python",
        command: `${command} ${args.join(" ")}`,
        platform: process.platform,
        cwd: this.projectPath,
        options: options,
      };

      const errorInfo = defaultErrorHandler.handleError(error, context);

      // Log user-friendly error message
      console.error("\n" + errorInfo.userMessage);
      console.error("\n💡 Recovery steps:");
      errorInfo.recoverySteps.forEach((step, i) => {
        console.error(`  ${i + 1}. ${step}`);
      });

      // Re-throw enhanced error
      const enhancedError = new Error(errorInfo.userMessage);
      enhancedError.originalError = error;
      enhancedError.context = context;
      enhancedError.errorInfo = errorInfo;
      throw enhancedError;
    }
  }

  /**
   * Execute Python module
   */
  async executePythonModule(module, args = [], options = {}) {
    const python = this.getPythonExecutable();
    return this.executeCommand(python, ["-m", module, ...args], options);
  }

  /**
   * Run tests with configured test runner
   */
  async runTests(options = {}) {
    await this.initialize();

    const testRunner = this.pythonConfig.testRunner || "pytest";
    await this.checkTool(testRunner);

    const args = [];

    // Add coverage if requested
    if (options.coverage) {
      if (testRunner === "pytest") {
        args.push("--cov=.", "--cov-report=term", "--cov-report=html");
      }
    }

    // Add verbose flag
    if (options.verbose) {
      args.push("-v");
    }

    // Add specific test file
    if (options.file) {
      args.push(options.file);
    }

    // Add test name pattern
    if (options.test) {
      if (testRunner === "pytest") {
        args.push("-k", options.test);
      } else if (testRunner === "unittest") {
        args.push(options.test);
      }
    }

    // Execute test runner
    if (testRunner === "pytest") {
      return this.executeCommand("pytest", args);
    } else if (testRunner === "unittest") {
      return this.executePythonModule("unittest", args);
    } else {
      throw new Error(`Unsupported test runner: ${testRunner}`);
    }
  }

  /**
   * Run linter with configured tool
   */
  async runLinter(options = {}) {
    await this.initialize();

    const linter = this.pythonConfig.linter || "ruff";
    await this.checkTool(linter);

    const args = [];

    // Check or fix mode
    if (options.fix) {
      if (linter === "ruff") {
        args.push("check", "--fix");
      } else if (linter === "flake8") {
        // flake8 doesn't have fix mode
        args.push(".");
      } else if (linter === "pylint") {
        args.push(".");
      }
    } else {
      if (linter === "ruff") {
        args.push("check");
      } else {
        args.push(".");
      }
    }

    // Add specific file
    if (options.file) {
      args.length = 0; // Clear previous args
      if (linter === "ruff" && options.fix) {
        args.push("check", "--fix", options.file);
      } else if (linter === "ruff") {
        args.push("check", options.file);
      } else {
        args.push(options.file);
      }
    }

    // Execute linter
    return this.executeCommand(linter, args);
  }

  /**
   * Run formatter with configured tool
   */
  async runFormatter(options = {}) {
    await this.initialize();

    const formatter = this.pythonConfig.formatter || "ruff";
    await this.checkTool(formatter);

    const args = [];

    // Check or format mode
    if (options.check) {
      if (formatter === "ruff") {
        args.push("format", "--check");
      } else if (formatter === "black") {
        args.push("--check", ".");
      } else if (formatter === "autopep8") {
        args.push("--diff", ".");
      }
    } else {
      if (formatter === "ruff") {
        args.push("format");
      } else {
        args.push(".");
      }
    }

    // Add specific file
    if (options.file) {
      args.length = 0; // Clear previous args
      if (formatter === "ruff" && options.check) {
        args.push("format", "--check", options.file);
      } else if (formatter === "ruff") {
        args.push("format", options.file);
      } else if (formatter === "black" && options.check) {
        args.push("--check", options.file);
      } else if (formatter === "black") {
        args.push(options.file);
      } else {
        args.push(options.file);
      }
    }

    // Execute formatter
    return this.executeCommand(formatter, args);
  }

  /**
   * Run type checker with configured tool
   */
  async runTypeChecker(options = {}) {
    await this.initialize();

    const typeChecker = this.pythonConfig.typeChecker || "pyright";
    await this.checkTool(typeChecker);

    const args = [];

    // Add strict mode
    if (options.strict) {
      if (typeChecker === "pyright") {
        args.push("--strict");
      } else if (typeChecker === "mypy") {
        args.push("--strict");
      }
    }

    // Add specific file
    if (options.file) {
      args.push(options.file);
    } else {
      args.push(".");
    }

    // Execute type checker
    return this.executeCommand(typeChecker, args);
  }

  /**
   * Manage dependencies with configured manager
   */
  async manageDependencies(action, packages = [], options = {}) {
    await this.initialize();

    const manager = this.pythonConfig.dependencyManager || "uv";
    await this.checkTool(manager);

    const args = [];

    // Handle different actions
    switch (action) {
      case "install":
        if (packages.length > 0) {
          if (manager === "uv") {
            args.push("add", ...packages);
          } else if (manager === "poetry") {
            args.push("add", ...packages);
          } else if (manager === "pip") {
            args.push("install", ...packages);
          }
        } else {
          if (manager === "uv") {
            args.push("sync");
          } else if (manager === "poetry") {
            args.push("install");
          } else if (manager === "pip") {
            // pip needs requirements.txt
            if (
              fs.existsSync(path.join(this.projectPath, "requirements.txt"))
            ) {
              args.push("install", "-r", "requirements.txt");
            } else {
              throw new Error("requirements.txt not found");
            }
          }
        }
        break;

      case "add":
        if (packages.length === 0) {
          throw new Error("No package specified");
        }
        if (manager === "uv") {
          args.push("add", ...packages);
          if (options.dev) args.push("--dev");
        } else if (manager === "poetry") {
          args.push("add", ...packages);
          if (options.dev) args.push("--dev");
        } else if (manager === "pip") {
          args.push("install", ...packages);
        }
        break;

      case "remove":
        if (packages.length === 0) {
          throw new Error("No package specified");
        }
        if (manager === "uv") {
          args.push("remove", ...packages);
        } else if (manager === "poetry") {
          args.push("remove", ...packages);
        } else if (manager === "pip") {
          args.push("uninstall", ...packages);
        }
        break;

      case "update":
        if (packages.length > 0) {
          if (manager === "uv") {
            args.push("update", ...packages);
          } else if (manager === "poetry") {
            args.push("update", ...packages);
          } else if (manager === "pip") {
            args.push("install", "--upgrade", ...packages);
          }
        } else {
          if (manager === "uv") {
            args.push("update");
          } else if (manager === "poetry") {
            args.push("update");
          } else if (manager === "pip") {
            // Update all packages (basic approach)
            args.push("install", "--upgrade");
          }
        }
        break;

      case "list":
        if (manager === "uv") {
          args.push("tree");
        } else if (manager === "poetry") {
          args.push("show", "--tree");
        } else if (manager === "pip") {
          args.push("list");
        }
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Execute dependency manager
    return this.executeCommand(manager, args);
  }

  /**
   * Run setup wizard
   */
  async runSetup(options = {}) {
    const PythonConfigWizard = require("../../languages/python/config-wizard");
    const wizard = new PythonConfigWizard(this.projectPath);

    if (options.quick) {
      return wizard.quickSetup();
    } else {
      return wizard.run();
    }
  }

  /**
   * Print command help
   */
  printHelp(command) {
    const helps = {
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

    if (helps[command]) {
      console.log(helps[command]);
    } else {
      console.log(`
Python Commands for opencode

Available commands:
  /python-test      - Run tests
  /python-lint      - Run linter
  /python-typecheck - Run type checker
  /python-deps      - Manage dependencies
  /python-setup     - Configure project

Use /python-<command> --help for command-specific help.
      `);
    }
  }
}

// Export for use in other scripts
module.exports = PythonCommandRunner;

// CLI entry point for testing
if (require.main === module) {
  const runner = new PythonCommandRunner();
  const args = process.argv.slice(2);

  const command = args[0];
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--file") {
      options.file = args[++i];
    } else if (args[i] === "--test") {
      options.test = args[++i];
    } else if (args[i] === "--coverage") {
      options.coverage = true;
    } else if (args[i] === "--verbose") {
      options.verbose = true;
    } else if (args[i] === "--fix") {
      options.fix = true;
    } else if (args[i] === "--check") {
      options.check = true;
    } else if (args[i] === "--strict") {
      options.strict = true;
    } else if (args[i] === "--dev") {
      options.dev = true;
    } else if (args[i] === "--quick") {
      options.quick = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      runner.printHelp(command);
      process.exit(0);
    }
  }

  async function runCommand() {
    try {
      switch (command) {
        case "test":
          await runner.runTests(options);
          break;
        case "lint":
          await runner.runLinter(options);
          break;
        case "typecheck":
          await runner.runTypeChecker(options);
          break;
        case "deps":
          const action = args[1];
          const packages = args.slice(2).filter((arg) => !arg.startsWith("--"));
          await runner.manageDependencies(action, packages, options);
          break;
        case "setup":
          await runner.runSetup(options);
          break;
        default:
          runner.printHelp();
          process.exit(1);
      }
      console.log("\n✅ Command completed successfully");
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  runCommand();
}
