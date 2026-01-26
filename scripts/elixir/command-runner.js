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

// Import shared utilities
const {
  ConfigUtils,
  FileUtils,
  ProjectUtils,
  LoggingUtils,
  ensureDir,
} = require("../lib");

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
    // First, validate that we're in an Elixir project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== "elixir" && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn(
          "This may not be an Elixir project. Some features may not work correctly.",
        );
      } else if (projectInfo.type === "elixir") {
        LoggingUtils.debug(
          `Detected Elixir project: ${projectInfo.framework || "standard Elixir"}`,
        );
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(
          `Detected languages: ${projectInfo.languages.join(", ")}`,
        );
      }
    } catch (error) {
      LoggingUtils.debug("Project detection failed:", error.message);
    }

    // Load configuration using ConfigUtils
    try {
      this.config = ConfigUtils.loadConfig(this.projectPath);
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

      // Validate Elixir configuration schema
      ConfigUtils.validateConfig(this.elixirConfig, "elixir");

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error(
        "Failed to initialize Elixir command runner:",
        error.message,
      );
      LoggingUtils.info("Run /elixir-setup to configure your Elixir project");
      throw error;
    }
  }

  /**
   * Check if a specific tool is available
   */
  hasTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(
        this.elixirConfig,
        toolName,
        required,
      );

      if (!isInstalled && required) {
        throw new Error(
          `Required Elixir tool '${toolName}' is not installed. Run /elixir-setup to install it.`,
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(
          `Elixir tool '${toolName}' check failed:`,
          error.message,
        );
        LoggingUtils.info(`Run /elixir-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Find Elixir files in the project
   */
  findElixirFiles(pattern = "**/*.{ex,exs}", excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: "elixir",
      });
    } catch (error) {
      LoggingUtils.warn("Failed to find Elixir files:", error.message);
      return [];
    }
  }

  /**
   * Get Elixir project metadata
   */
  getElixirProjectInfo() {
    try {
      const info = {
        hasMixExs: fs.existsSync(path.join(this.projectPath, "mix.exs")),
        hasMixLock: fs.existsSync(path.join(this.projectPath, "mix.lock")),
        hasConfig: fs.existsSync(path.join(this.projectPath, "config")),
        hasLib: fs.existsSync(path.join(this.projectPath, "lib")),
        hasTest: fs.existsSync(path.join(this.projectPath, "test")),
        elixirFiles: this.findElixirFiles().length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug("Failed to get Elixir project info:", error.message);
      return null;
    }
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

      LoggingUtils.info(`🚀 Executing: mix ${command} ${args.join(" ")}`);

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
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(
          `🔍 Platform: ${this.platformDetector.getPlatformName()}`,
        );

        exec(cmd, finalOptions, (error, stdout, stderr) => {
          if (error) {
            LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
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

      // Log user-friendly error message using LoggingUtils
      LoggingUtils.error(errorInfo.userMessage);

      // Log recovery steps using LoggingUtils
      if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
        LoggingUtils.info("💡 Recovery steps:");
        errorInfo.recoverySteps.forEach((step, i) => {
          LoggingUtils.info(`  ${i + 1}. ${step}`);
        });
      }

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
      // Log compilation information
      const projectInfo = this.getElixirProjectInfo();
      if (projectInfo) {
        LoggingUtils.debug(`Elixir files: ${projectInfo.elixirFiles}`);
        LoggingUtils.debug(`Has mix.exs: ${projectInfo.hasMixExs}`);
      }

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

      LoggingUtils.info("\n📊 Compilation Information:");
      LoggingUtils.info("=".repeat(50));
      LoggingUtils.info(`Elixir: ${versionResult.stdout.trim()}`);
      LoggingUtils.info(`Project: ${projectResult.stdout.trim()}`);
      LoggingUtils.info(`Environment: ${options.env || "dev"}`);
      LoggingUtils.info("=".repeat(50));
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
    LoggingUtils.info("\n💡 Compilation Error Suggestions:");

    if (errorMessage.includes("Dependency")) {
      LoggingUtils.info("   • Run 'mix deps.get' to fetch dependencies");
      LoggingUtils.info("   • Check mix.exs for correct dependency versions");
    }

    if (errorMessage.includes("undefined function")) {
      LoggingUtils.info("   • Check function name and arity");
      LoggingUtils.info("   • Ensure module is compiled and available");
      LoggingUtils.info("   • Check imports and aliases");
    }

    if (errorMessage.includes("module not found")) {
      LoggingUtils.info("   • Check module name spelling");
      LoggingUtils.info("   • Ensure file exists in lib/ directory");
      LoggingUtils.info("   • Check file extension (.ex vs .exs)");
    }
  }

  /**
   * Suggest test fixes
   */
  suggestTestFix(errorMessage) {
    LoggingUtils.info("\n💡 Test Error Suggestions:");

    if (errorMessage.includes("assert")) {
      LoggingUtils.info("   • Check assertion values match expected");
      LoggingUtils.info(
        "   • Use assert_in_delta for floating point comparisons",
      );
      LoggingUtils.info("   • Check test setup and teardown");
    }

    if (errorMessage.includes("timeout")) {
      LoggingUtils.info("   • Increase timeout with --timeout option");
      LoggingUtils.info(
        "   • Check for infinite loops or long-running operations",
      );
      LoggingUtils.info(
        "   • Consider using async: false for integration tests",
      );
    }
  }

  /**
   * Suggest formatting fixes
   */
  suggestFormatFix(errorMessage) {
    LoggingUtils.info("\n💡 Formatting Error Suggestions:");

    if (errorMessage.includes("not formatted")) {
      LoggingUtils.info("   • Run 'mix format' to fix formatting");
      LoggingUtils.info("   • Check .formatter.exs configuration");
      LoggingUtils.info("   • Ensure line length is within limits");
    }
  }

  /**
   * Suggest linting fixes
   */
  suggestLintFix(errorMessage) {
    LoggingUtils.info("\n💡 Linting Error Suggestions:");

    if (errorMessage.includes("Credo")) {
      LoggingUtils.info("   • Install Credo: mix archive.install hex credo");
      LoggingUtils.info("   • Check .credo.exs configuration");
      LoggingUtils.info("   • Run 'mix credo --strict' for detailed analysis");
    }
  }

  /**
   * Suggest type checking fixes
   */
  suggestTypeCheckFix(errorMessage) {
    LoggingUtils.info("\n💡 Type Checking Error Suggestions:");

    if (errorMessage.includes("Dialyzer")) {
      LoggingUtils.info(
        '   • Add dialyxir to mix.exs: {:dialyxir, "~> 1.4", only: [:dev]}',
      );
      LoggingUtils.info("   • Run 'mix dialyzer --plt' to build PLT");
      LoggingUtils.info("   • Check type specifications with @spec");
    }
  }

  /**
   * Suggest dependency fixes
   */
  suggestDepsFix(errorMessage) {
    LoggingUtils.info("\n💡 Dependency Error Suggestions:");

    if (errorMessage.includes("Hex")) {
      LoggingUtils.info("   • Install Hex: mix local.hex");
      LoggingUtils.info("   • Check internet connection for Hex.pm");
      LoggingUtils.info("   • Verify package name and version in mix.exs");
    }

    if (errorMessage.includes("lock")) {
      LoggingUtils.info("   • Run 'mix deps.unlock --all' to clear lock");
      LoggingUtils.info("   • Run 'mix deps.get' to refetch dependencies");
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
