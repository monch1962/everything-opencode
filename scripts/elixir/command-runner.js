#!/usr/bin/env node
/**
 * Elixir Command Runner
 *
 * Execute Elixir commands with Elixir-specific improvements and error handling
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { runCommand, commandExists } = require("../lib/utils");
const ConfigManager = require("../interactive/config-manager");
const ElixirToolDetector = require("../../languages/elixir/tool-detector");
const PlatformDetector = require("../lib/platform-detector");
const { defaultErrorHandler } = require("../lib/error-handler");

class ElixirCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new ElixirToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.elixirConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with Elixir-specific setup
   */
  async initialize() {
    // Load configuration
    this.config = this.configManager.loadConfig();
    if (!this.config) {
      throw new Error("Project not configured. Run /elixir-setup first.");
    }

    // Get Elixir configuration
    this.elixirConfig = this.config.elixir;
    if (!this.elixirConfig) {
      throw new Error(
        "Elixir configuration not found. Run /elixir-setup first.",
      );
    }

    // Detect tools
    this.detectedTools = await this.toolDetector.detectTools();

    return true;
  }

  /**
   * Check if a specific tool is available
   */
  hasTool(toolName, required = true) {
    const toolInfo = this.elixirConfig.tools?.[toolName];

    if (!toolInfo || !toolInfo.installed) {
      if (required) {
        throw new Error(
          `Required Elixir tool '${toolName}' is not installed. Run /elixir-setup to install it.`,
        );
      }
      return false;
    }

    return true;
  }

  /**
   * Execute Mix command with Elixir-specific improvements
   */
  async executeMixCommand(command, args = [], options = {}) {
    return this._executeMixCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with comprehensive error handling
   */
  async _executeMixCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      // Ensure critical Elixir environment variables are set
      const elixirEnv = {
        ...process.env,
        MIX_ENV: options.env || process.env.MIX_ENV || "dev",
        MIX_QUIET: "1",
      };

      // Set HOME if not set
      if (!elixirEnv.HOME) {
        elixirEnv.HOME = require("os").homedir();
      }

      const defaultOptions = {
        cwd: this.projectPath,
        stdio: "inherit",
        env: elixirEnv,
        timeout: 300000, // 5 minutes for Elixir commands
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        // Merge environment objects instead of overwriting
        env: options.env
          ? { ...defaultOptions.env, ...options.env }
          : defaultOptions.env,
      };

      console.log(`🚀 Executing: mix ${command} ${args.join(" ")}`);

      return await new Promise((resolve, reject) => {
        const { exec } = require("child_process");

        // Build the command string with dynamic path to mix
        const mixPath = this.platformDetector.getToolPath("mix", {
          required: true,
          customLocations: [
            // Additional Elixir installation locations
            "/usr/local/bin/mix",
            "/usr/bin/mix",
            "C:\\Program Files\\Elixir\\bin\\mix.bat",
          ],
        });

        const cmd = `${mixPath} ${command} ${args.join(" ")}`;
        console.log(`🔍 Executing: ${cmd}`);
        console.log(`🔍 CWD: ${finalOptions.cwd}`);
        console.log(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        exec(cmd, finalOptions, (error, stdout, stderr) => {
          if (error) {
            console.log(`🔍 Exec error: ${error.message}`);
            reject(
              new Error(`Failed to execute mix ${command}: ${error.message}`),
            );
          } else {
            resolve({
              success: error ? false : true,
              code: error ? error.code : 0,
              stdout,
              stderr,
            });
          }
        });
      });
    } catch (error) {
      // Enhance error with context
      const context = {
        tool: "elixir",
        command: `mix ${command} ${args.join(" ")}`,
        platform: this.platformDetector.getPlatformName(),
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
   * Compile Elixir project with Elixir-specific improvements
   */
  async compile(options = {}) {
    // Only initialize if not already initialized
    if (!this.detectedTools) {
      await this.initialize();
    }

    const args = [];

    // Add compilation flags from config
    if (this.elixirConfig.compile?.flags) {
      args.push(...this.elixirConfig.compile.flags);
    }

    // Add warnings as errors
    if (options.warningsAsErrors) {
      args.push("--warnings-as-errors");
    }

    // Add force compilation
    if (options.force) {
      args.push("--force");
    }

    // Add verbose output
    if (options.verbose) {
      args.push("--verbose");
    }

    // Add long compilation
    if (options.longCompilation) {
      args.push("--long-compilation");
    }

    // Add profile
    if (options.profile) {
      args.push("--profile");
    }

    try {
      const result = await this.executeMixCommand("compile", args, options);

      // Elixir-specific: Show compilation information
      if (result.success) {
        await this.showCompilationInfo(options);
      }

      return result;
    } catch (error) {
      // Elixir-specific: Provide helpful compilation error suggestions
      this.suggestCompilationFix(error.message);
      throw error;
    }
  }

  /**
   * Run tests with ExUnit and Elixir-specific improvements
   */
  async test(options = {}) {
    // Only initialize if not already initialized
    if (!this.detectedTools) {
      await this.initialize();
    }

    const args = [];

    // Add test file or directory
    if (options.file) {
      args.push(options.file);
    } else if (options.directory) {
      args.push(options.directory);
    }

    // Add test filtering
    if (options.only) {
      args.push("--only", options.only);
    }

    if (options.exclude) {
      args.push("--exclude", options.exclude);
    }

    // Add seed for reproducible tests
    if (options.seed) {
      args.push("--seed", options.seed);
    }

    // Add coverage
    if (options.coverage) {
      args.push("--cover");
    }

    // Add trace
    if (options.trace) {
      args.push("--trace");
    }

    // Add max failures
    if (options.maxFailures) {
      args.push("--max-failures", options.maxFailures);
    }

    // Add timeout
    if (options.timeout) {
      args.push("--timeout", options.timeout);
    }

    // Add verbose
    if (options.verbose) {
      args.push("--verbose");
    }

    // Add slowest tests
    if (options.slowest) {
      args.push("--slowest", options.slowest);
    }

    try {
      const result = await this.executeMixCommand("test", args, options);

      // Elixir-specific: Show test summary
      if (result.success) {
        await this.showTestSummary(options);
      }

      return result;
    } catch (error) {
      // Elixir-specific: Provide helpful test error suggestions
      this.suggestTestFix(error.message);
      throw error;
    }
  }

  /**
   * Format code with Elixir formatter
   */
  async format(options = {}) {
    // Only initialize if not already initialized
    if (!this.detectedTools) {
      await this.initialize();
    }

    const args = [];

    // Add check formatting
    if (options.check) {
      args.push("--check-formatted");
    }

    // Add dry run
    if (options.dryRun) {
      args.push("--dry-run");
    }

    // Add specific files
    if (options.files) {
      args.push(...options.files.split(","));
    }

    // Add verbose
    if (options.verbose) {
      args.push("--verbose");
    }

    try {
      return await this.executeMixCommand("format", args, options);
    } catch (error) {
      // Elixir-specific: Provide helpful formatting suggestions
      this.suggestFormatFix(error.message);
      throw error;
    }
  }

  /**
   * Lint code with Credo
   */
  async lint(options = {}) {
    // Only initialize if not already initialized
    if (!this.detectedTools) {
      await this.initialize();
    }

    // Check if Credo is installed
    this.hasTool("credo", true);

    const args = [];

    // Add strict mode
    if (options.strict) {
      args.push("--strict");
    }

    // Add all warnings
    if (options.all) {
      args.push("--all");
    }

    // Add all priorites
    if (options.allPriorities) {
      args.push("--all-priorities");
    }

    // Add format
    if (options.format) {
      args.push("--format", options.format);
    }

    // Add config file
    if (options.config) {
      args.push("--config", options.config);
    }

    // Add files
    if (options.files) {
      args.push(...options.files.split(","));
    }

    // Add verbose
    if (options.verbose) {
      args.push("--verbose");
    }

    try {
      return await this.executeMixCommand("credo", args, options);
    } catch (error) {
      // Elixir-specific: Provide helpful linting suggestions
      this.suggestLintFix(error.message);
      throw error;
    }
  }

  /**
   * Type check with Dialyzer
   */
  async typecheck(options = {}) {
    // Only initialize if not already initialized
    if (!this.detectedTools) {
      await this.initialize();
    }

    // Check if Dialyzer is available
    this.hasTool("dialyzer", false);

    const args = [];

    // Add ignore warnings
    if (options.ignoreWarnings) {
      args.push("--ignore-warnings");
    }

    // Add format
    if (options.format) {
      args.push("--format", options.format);
    }

    // Add list unused
    if (options.listUnused) {
      args.push("--list-unused");
    }

    // Add verbose
    if (options.verbose) {
      args.push("--verbose");
    }

    try {
      return await this.executeMixCommand("dialyzer", args, options);
    } catch (error) {
      // Elixir-specific: Provide helpful type checking suggestions
      this.suggestTypeCheckFix(error.message);
      throw error;
    }
  }

  /**
   * Manage dependencies
   */
  async deps(command, options = {}) {
    // Only initialize if not already initialized
    if (!this.detectedTools) {
      await this.initialize();
    }

    const args = [];

    // For Mix, subcommands use dots: deps.get, deps.update, etc.
    // So we need to handle this specially
    let mixCommand = "deps";

    // Check if it's a subcommand that needs a dot
    const subcommandsWithDot = [
      "get",
      "update",
      "clean",
      "compile",
      "unlock",
      "tree",
    ];
    if (subcommandsWithDot.includes(command)) {
      mixCommand = `deps.${command}`;
    } else {
      args.push(command);
    }

    // Add package name for get, update, tree
    if (options.package) {
      args.push(options.package);
    }

    // Add only environment
    if (options.only) {
      args.push("--only", options.only);
    }

    // Add lock
    if (options.lock) {
      args.push("--lock");
    }

    // Add unlock
    if (options.unlock) {
      args.push("--unlock");
    }

    // Add check unlock
    if (options.checkUnlock) {
      args.push("--check-unlock");
    }

    // Add verbose
    if (options.verbose) {
      args.push("--verbose");
    }

    try {
      return await this.executeMixCommand(mixCommand, args, options);
    } catch (error) {
      // Elixir-specific: Provide helpful dependency suggestions
      this.suggestDepsFix(error.message);
      throw error;
    }
  }

  /**
   * Show compilation information
   */
  async showCompilationInfo(options) {
    try {
      // Get Elixir version
      const versionResult = await this.executeMixCommand("--version", [], {
        stdio: "pipe",
      });

      // Get project info
      const projectResult = await this.executeMixCommand(
        "run",
        ["-e", 'IO.puts("Project: #{Mix.Project.config()[:app]}")'],
        {
          stdio: "pipe",
        },
      );

      console.log("\n📊 Compilation Information:");
      console.log("=".repeat(50));
      console.log(`Elixir: ${versionResult.stdout.trim()}`);
      console.log(`Project: ${projectResult.stdout.trim()}`);
      console.log(`Environment: ${options.env || "dev"}`);
      console.log("=".repeat(50));
    } catch (error) {
      // Silently fail - this is just informational
    }
  }

  /**
   * Show test summary
   */
  async showTestSummary(options) {
    console.log("\n✅ Tests completed successfully!");

    if (options.coverage) {
      console.log("📊 Coverage report generated in cover/ directory");
    }
  }

  /**
   * Suggest compilation fixes
   */
  suggestCompilationFix(errorMessage) {
    console.log("\n💡 Compilation Error Suggestions:");

    if (errorMessage.includes("Dependency")) {
      console.log("   • Run 'mix deps.get' to fetch dependencies");
      console.log("   • Check mix.exs for correct dependency versions");
    }

    if (errorMessage.includes("undefined function")) {
      console.log("   • Check function name and arity");
      console.log("   • Ensure module is compiled and available");
      console.log("   • Check imports and aliases");
    }

    if (errorMessage.includes("module not found")) {
      console.log("   • Check module name spelling");
      console.log("   • Ensure file exists in lib/ directory");
      console.log("   • Check file extension (.ex vs .exs)");
    }
  }

  /**
   * Suggest test fixes
   */
  suggestTestFix(errorMessage) {
    console.log("\n💡 Test Error Suggestions:");

    if (errorMessage.includes("assert")) {
      console.log("   • Check assertion values match expected");
      console.log("   • Use assert_in_delta for floating point comparisons");
      console.log("   • Check test setup and teardown");
    }

    if (errorMessage.includes("timeout")) {
      console.log("   • Increase timeout with --timeout option");
      console.log("   • Check for infinite loops or long-running operations");
      console.log("   • Consider using async: false for integration tests");
    }
  }

  /**
   * Suggest formatting fixes
   */
  suggestFormatFix(errorMessage) {
    console.log("\n💡 Formatting Error Suggestions:");

    if (errorMessage.includes("not formatted")) {
      console.log("   • Run 'mix format' to fix formatting");
      console.log("   • Check .formatter.exs configuration");
      console.log("   • Ensure line length is within limits");
    }
  }

  /**
   * Suggest linting fixes
   */
  suggestLintFix(errorMessage) {
    console.log("\n💡 Linting Error Suggestions:");

    if (errorMessage.includes("Credo")) {
      console.log("   • Install Credo: mix archive.install hex credo");
      console.log("   • Check .credo.exs configuration");
      console.log("   • Run 'mix credo --strict' for detailed analysis");
    }
  }

  /**
   * Suggest type checking fixes
   */
  suggestTypeCheckFix(errorMessage) {
    console.log("\n💡 Type Checking Error Suggestions:");

    if (errorMessage.includes("Dialyzer")) {
      console.log(
        '   • Add dialyxir to mix.exs: {:dialyxir, "~> 1.4", only: [:dev]}',
      );
      console.log("   • Run 'mix dialyzer --plt' to build PLT");
      console.log("   • Check type specifications with @spec");
    }
  }

  /**
   * Suggest dependency fixes
   */
  suggestDepsFix(errorMessage) {
    console.log("\n💡 Dependency Error Suggestions:");

    if (errorMessage.includes("Hex")) {
      console.log("   • Install Hex: mix local.hex");
      console.log("   • Check internet connection for Hex.pm");
      console.log("   • Verify package name and version in mix.exs");
    }

    if (errorMessage.includes("lock")) {
      console.log("   • Run 'mix deps.unlock --all' to clear lock");
      console.log("   • Run 'mix deps.get' to refetch dependencies");
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    const args = [];

    if (options.all) {
      args.push("--all");
    }

    if (options.deps) {
      args.push("--deps");
    }

    if (options.build) {
      args.push("--build");
    }

    if (options.release) {
      args.push("--release");
    }

    if (options.logs) {
      args.push("--logs");
    }

    return await this.executeMixCommand("clean", args, options);
  }

  /**
   * Run custom Mix task
   */
  async run(task, args = [], options = {}) {
    const allArgs = [task, ...args];
    return await this.executeMixCommand("run", allArgs, options);
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    try {
      const version = await this.executeMixCommand("--version", [], {
        stdio: "pipe",
      });
      const deps = await this.executeMixCommand("deps", [], { stdio: "pipe" });
      const compile = await this.executeMixCommand("compile", [], {
        stdio: "pipe",
      });

      return {
        version: version.stdout.trim(),
        dependencies: deps.stdout,
        compilation: compile.stdout,
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = ElixirCommandRunner;
