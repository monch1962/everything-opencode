#!/usr/bin/env node
/**
 * Go Command Runner
 *
 * Base class for executing Go commands with Go-specific improvements
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { runCommand, commandExists } = require("../lib/utils");
const ConfigManager = require("../interactive/config-manager");
const GoToolDetector = require("../../languages/go/tool-detector");
const PlatformDetector = require("../lib/platform-detector");
const {
  defaultErrorHandler,
  createCommandRunner,
} = require("../lib/error-handler");

// Import shared utilities
const {
  ConfigUtils,
  FileUtils,
  ProjectUtils,
  LoggingUtils,
  ensureDir,
} = require("../lib");

class GoCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new GoToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.goConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with Go-specific setup
   */
  async initialize() {
    // First, validate that we're in a Go project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== "go" && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn(
          "This may not be a Go project. Some features may not work correctly.",
        );
      } else if (projectInfo.type === "go") {
        LoggingUtils.debug(
          `Detected Go project: ${projectInfo.module || "unknown module"}`,
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
        throw new Error("Project not configured. Run /go-setup first.");
      }

      // Get Go configuration
      this.goConfig = this.config.go;
      if (!this.goConfig) {
        throw new Error("Go configuration not found. Run /go-setup first.");
      }

      // Validate Go configuration schema
      ConfigUtils.validateConfig(this.goConfig, "go");

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error(
        "Failed to initialize Go command runner:",
        error.message,
      );
      LoggingUtils.info("Run /go-setup to configure your Go project");
      throw error;
    }
  }

  /**
   * Check if required Go tool is installed
   */
  checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(
        this.goConfig,
        toolName,
        required,
      );

      if (!isInstalled && required) {
        throw new Error(
          `Required Go tool '${toolName}' is not installed. Run /go-setup to install it.`,
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(
          `Go tool '${toolName}' check failed:`,
          error.message,
        );
        LoggingUtils.info(`Run /go-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Execute Go command with Go-specific improvements
   */
  async executeGoCommand(command, args = [], options = {}) {
    return this._executeGoCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with comprehensive error handling
   */
  async _executeGoCommandWithErrorHandling(command, args = [], options = {}) {
    const context = {
      tool: "go",
      command: `go ${command} ${args.join(" ")}`.trim(),
      platform: this.platformDetector.getPlatformName(),
      cwd: this.projectPath,
    };

    try {
      // Ensure critical Go environment variables are set
      const goEnv = {
        ...process.env,
        GO111MODULE: "on",
      };

      // Set HOME if not set (required for GOCACHE)
      if (!goEnv.HOME) {
        goEnv.HOME = require("os").homedir();
      }

      // Set GOCACHE if not set
      if (!goEnv.GOCACHE) {
        goEnv.GOCACHE = `${goEnv.HOME}/.cache/go-build`;
      }

      const defaultOptions = {
        cwd: this.projectPath,
        stdio: "inherit",
        env: goEnv,
        timeout: 300000, // 5 minutes for Go commands
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        // Merge environment objects instead of overwriting
        env: options.env
          ? { ...defaultOptions.env, ...options.env }
          : defaultOptions.env,
      };

      LoggingUtils.info(`🚀 Executing: go ${command} ${args.join(" ")}`);

      // Debug: Check if go is in PATH
      if (finalOptions.verbose) {
        LoggingUtils.debug(`🔍 PATH: ${process.env.PATH}`);
        LoggingUtils.debug(
          `🔍 Go executable check: ${require("child_process").execSync('which go || echo "go not found"').toString()}`,
        );
      }

      return await new Promise((resolve, reject) => {
        const { exec } = require("child_process");

        // Build the command string with dynamic path to go
        const goPath = this.platformDetector.getToolPath("go", {
          required: true,
          customLocations: [
            // Additional Go installation locations
            "/usr/local/go/bin/go",
            "/usr/lib/go/bin/go",
            "C:\\Go\\bin\\go.exe",
          ],
        });

        const cmd = `${goPath} ${command} ${args.join(" ")}`;
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(
          `🔍 Platform: ${this.platformDetector.getPlatformName()}`,
        );

        exec(cmd, finalOptions, (error, stdout, stderr) => {
          if (error) {
            // Enhance error with additional context
            error.context = context;
            error.command = cmd;
            error.goPath = goPath;
            reject(error);
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
      // Handle error with comprehensive error handler
      const errorInfo = defaultErrorHandler.handleError(error, context);

      // Log user-friendly message using LoggingUtils
      LoggingUtils.error(errorInfo.userMessage);

      // Log recovery steps using LoggingUtils
      if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
        LoggingUtils.info("💡 Recovery steps:");
        errorInfo.recoverySteps.forEach((step, i) => {
          LoggingUtils.info(`  ${i + 1}. ${step}`);
        });
      }

      // Re-throw with enhanced error information
      const enhancedError = new Error(errorInfo.userMessage);
      enhancedError.originalError = error;
      enhancedError.errorInfo = errorInfo;
      throw enhancedError;
    }
  }

  /**
   * Build Go project with Go-specific improvements
   */
  async build(options = {}) {
    // Only initialize if not already initialized
    if (!this.detectedTools) {
      await this.initialize();
    }

    const args = [];

    // Add build flags from config
    if (this.goConfig.build?.flags) {
      args.push(...this.goConfig.build.flags);
    }

    // Add output directory
    if (options.output) {
      args.push("-o", options.output);
    } else {
      // Default output to ./bin/
      const binDir = path.join(this.projectPath, "bin");

      // Use ensureDir to create directory if it doesn't exist
      ensureDir(binDir);

      const outputName = this.getOutputName();
      args.push("-o", path.join(binDir, outputName));
    }

    // Add ldflags
    if (
      this.goConfig.build?.ldflags &&
      this.goConfig.build.ldflags.length > 0
    ) {
      args.push("-ldflags", this.goConfig.build.ldflags.join(" "));
    }

    // Add tags
    if (options.tags) {
      args.push("-tags", options.tags);
    }

    // Add race detector
    if (options.race) {
      args.push("-race");
    }

    // Add build mode
    if (options.buildMode) {
      args.push("-buildmode", options.buildMode);
    }

    // Handle cross-compilation via environment variables
    const target = options.target || this.detectBuildTarget();
    if (target) {
      const [goos, goarch] = target.split("/");
      if (goos && goarch) {
        // Set environment variables for cross-compilation
        options.env = {
          ...(options.env || {}),
          GOOS: goos,
          GOARCH: goarch,
          CGO_ENABLED: "0",
        };
      }
    }

    // Add verbose flag
    if (options.verbose) {
      args.push("-v");
    }

    try {
      // Log some build information before starting
      const goFiles = this.findGoFiles();
      if (goFiles.length > 0) {
        LoggingUtils.debug(`Found ${goFiles.length} Go files to build`);
      }

      const moduleInfo = this.getGoModuleInfo();
      if (moduleInfo) {
        LoggingUtils.debug(`Building module: ${moduleInfo}`);
      }

      const result = await this.executeGoCommand("build", args, options);

      // Go-specific: Show build information
      if (result.success) {
        await this.showBuildInfo(options);
      }

      return result;
    } catch (error) {
      // Go-specific: Provide helpful build error suggestions
      this.suggestBuildFix(error.message);
      throw error;
    }
  }

  /**
   * Get output name based on project type
   */
  getOutputName() {
    if (this.goConfig.projectType === "cli") {
      const moduleParts = (this.goConfig.module || "app").split("/");
      return moduleParts[moduleParts.length - 1];
    }

    // Default to directory name
    return path.basename(this.projectPath);
  }

  /**
   * Find Go files in the project
   */
  findGoFiles(pattern = "**/*.go", excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(pattern, {
        cwd: this.projectPath,
        exclude: excludePatterns,
        language: "go",
      });
    } catch (error) {
      LoggingUtils.warn("Failed to find Go files:", error.message);
      return [];
    }
  }

  /**
   * Get Go module information
   */
  getGoModuleInfo() {
    try {
      const goModPath = path.join(this.projectPath, "go.mod");
      if (FileUtils.fileExists(goModPath)) {
        const content = FileUtils.readFile(goModPath);
        const moduleMatch = content.match(/module\s+(\S+)/);
        return moduleMatch ? moduleMatch[1] : null;
      }
      return null;
    } catch (error) {
      LoggingUtils.debug("Failed to read go.mod:", error.message);
      return null;
    }
  }

  /**
   * Detect build target based on environment
   */
  detectBuildTarget() {
    const platform = process.platform;
    const arch = process.arch;

    const targetMap = {
      darwin: {
        x64: "darwin/amd64",
        arm64: "darwin/arm64",
      },
      linux: {
        x64: "linux/amd64",
        arm64: "linux/arm64",
        arm: "linux/arm",
      },
      win32: {
        x64: "windows/amd64",
        ia32: "windows/386",
      },
    };

    return targetMap[platform]?.[arch] || null;
  }

  /**
   * Show build information
   */
  async showBuildInfo(options) {
    try {
      // Get Go version
      const versionResult = runCommand("go version", { cwd: this.projectPath });

      // Get module info
      const moduleResult = runCommand("go list -m", { cwd: this.projectPath });

      // Get build constraints
      const constraintsResult = runCommand('go list -f "{{.GoFiles}}" ./...', {
        cwd: this.projectPath,
      });

      // Use LoggingUtils for formatted output
      LoggingUtils.info("\n📊 Build Information:");
      LoggingUtils.info("=".repeat(40));
      LoggingUtils.info("Go:", versionResult.output.trim());
      LoggingUtils.info("Module:", moduleResult.output.trim());

      if (options.target) {
        LoggingUtils.info("Target:", options.target);
      }

      if (options.race) {
        LoggingUtils.info("Race detector: enabled");
      }

      // Show output path
      const outputArg =
        options.output || path.join("bin", this.getOutputName());
      LoggingUtils.info("Output:", path.resolve(this.projectPath, outputArg));
    } catch (error) {
      // Ignore errors in info display
    }
  }

  /**
   * Suggest fixes for common build errors
   */
  suggestBuildFix(errorMessage) {
    LoggingUtils.info("\n💡 Build Error Suggestions:");

    if (errorMessage.includes("cannot find module providing package")) {
      LoggingUtils.info("  • Run: go mod tidy");
      LoggingUtils.info("  • Run: go get <missing-package>");
    }

    if (errorMessage.includes("undefined:")) {
      LoggingUtils.info("  • Check for typos in function/variable names");
      LoggingUtils.info("  • Ensure all imports are correct");
    }

    if (errorMessage.includes("imported and not used")) {
      LoggingUtils.info(
        "  • Remove unused imports or use blank identifier (_)",
      );
    }

    if (errorMessage.includes("missing go.sum entry")) {
      LoggingUtils.info("  • Run: go mod tidy");
      LoggingUtils.info("  • Run: go mod download");
    }

    if (errorMessage.includes("CGO_ENABLED")) {
      LoggingUtils.info("  • Install C compiler or disable CGO: CGO_ENABLED=0");
    }
  }

  /**
   * Run Go tests with Go-specific improvements
   */
  async test(options = {}) {
    await this.initialize();

    const args = [];

    // Add test flags from config
    if (this.goConfig.testing?.flags) {
      args.push(...this.goConfig.testing.flags);
    }

    // Add coverage
    if (options.coverage || this.goConfig.testing?.coverage?.enabled) {
      args.push("-cover");

      if (options.coverageProfile) {
        args.push("-coverprofile", options.coverageProfile);
      } else {
        args.push("-coverprofile", "coverage.out");
      }

      if (options.coverageMode) {
        args.push("-covermode", options.coverageMode);
      }
    }

    // Add race detector
    if (options.race) {
      args.push("-race");
    }

    // Add timeout
    if (options.timeout) {
      args.push("-timeout", options.timeout);
    }

    // Add count for repeated tests
    if (options.count) {
      args.push("-count", options.count);
    }

    // Add parallel execution
    if (options.parallel) {
      args.push("-parallel", options.parallel);
    }

    // Add test pattern
    if (options.pattern) {
      args.push(options.pattern);
    } else {
      args.push("./...");
    }

    // Use gotestsum if available
    if (this.detectedTools.gotestsum?.installed && !options.forceGoTest) {
      return this.runTestsWithGotestsum(args, options);
    }

    // Use standard go test
    return this.executeGoCommand("test", args, options);
  }

  /**
   * Run tests with gotestsum for better output
   */
  async runTestsWithGotestsum(args, options) {
    LoggingUtils.info("📊 Running tests with gotestsum...");

    const gotestsumArgs = ["--"];

    // Remove ./... from args for gotestsum
    const testArgs = args.filter((arg) => arg !== "./...");
    gotestsumArgs.push(...testArgs);

    // Add test pattern if specified
    if (options.pattern) {
      gotestsumArgs.push(options.pattern);
    } else {
      gotestsumArgs.push("./...");
    }

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: "inherit",
      env: { ...process.env, GO111MODULE: "on" },
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const process = spawn("gotestsum", gotestsumArgs, finalOptions);

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      process.on("error", (error) => {
        reject(new Error(`Failed to execute gotestsum: ${error.message}`));
      });
    });
  }

  /**
   * Generate test coverage report
   */
  async coverage(options = {}) {
    await this.initialize();

    const profileFile = options.profile || "coverage.out";
    const outputFormat = options.format || "html";
    const outputFile = options.output || `coverage.${outputFormat}`;

    // Run tests with coverage
    await this.test({
      ...options,
      coverage: true,
      coverageProfile: profileFile,
      forceGoTest: true, // Use go test for coverage
    });

    // Generate coverage report
    const args = [outputFormat];

    if (profileFile) {
      args.push("-o", outputFile);
      args.push(profileFile);
    }

    LoggingUtils.info(`📈 Generating ${outputFormat} coverage report...`);

    try {
      const result = await this.executeGoCommand("tool", ["cover", ...args]);

      if (result.success && outputFormat === "html") {
        LoggingUtils.success(`Coverage report generated: ${outputFile}`);
        LoggingUtils.info(
          `   Open in browser: file://${path.resolve(this.projectPath, outputFile)}`,
        );
      }

      return result;
    } catch (error) {
      LoggingUtils.error(`Failed to generate coverage report:`, error.message);
      throw error;
    }
  }

  /**
   * Lint Go code with Go-specific improvements
   */
  async lint(options = {}) {
    await this.initialize();

    const linter = this.goConfig.linting?.tool || "golangci-lint";

    switch (linter) {
      case "golangci-lint":
        return this.lintWithGolangCILint(options);
      case "staticcheck":
        return this.lintWithStaticcheck(options);
      case "revive":
        return this.lintWithRevive(options);
      default:
        return this.lintWithGofmt(options);
    }
  }

  /**
   * Lint with golangci-lint
   */
  async lintWithGolangCILint(options = {}) {
    await this.checkTool("golangci_lint", false);

    const args = ["run"];

    // Add config file if specified
    if (this.goConfig.linting?.configFile) {
      args.push("--config", this.goConfig.linting.configFile);
    }

    // Add fix flag
    if (options.fix) {
      args.push("--fix");
    }

    // Add verbose flag
    if (options.verbose) {
      args.push("--verbose");
    }

    // Add timeout
    if (options.timeout) {
      args.push("--timeout", options.timeout);
    } else {
      args.push("--timeout", "5m");
    }

    // Add path
    args.push("./...");

    LoggingUtils.info("🔍 Running golangci-lint...");

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: "inherit",
      env: { ...process.env, GO111MODULE: "on" },
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const process = spawn("golangci-lint", args, finalOptions);

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          // golangci-lint returns non-zero for linting issues
          resolve({ success: false, code, hasIssues: true });
        }
      });

      process.on("error", (error) => {
        reject(new Error(`Failed to execute golangci-lint: ${error.message}`));
      });
    });
  }

  /**
   * Lint with staticcheck
   */
  async lintWithStaticcheck(options = {}) {
    await this.checkTool("staticcheck", false);

    const args = ["./..."];

    LoggingUtils.info("🔍 Running staticcheck...");

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: "inherit",
      env: { ...process.env, GO111MODULE: "on" },
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const process = spawn("staticcheck", args, finalOptions);

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          resolve({ success: false, code, hasIssues: true });
        }
      });

      process.on("error", (error) => {
        reject(new Error(`Failed to execute staticcheck: ${error.message}`));
      });
    });
  }

  /**
   * Format Go code with Go-specific improvements
   */
  async format(options = {}) {
    await this.initialize();

    const formatter = this.goConfig.tools?.formatter || "gofmt";

    const args = [];

    if (options.write) {
      args.push("-w");
    }

    if (options.diff) {
      args.push("-d");
    }

    if (options.simplify) {
      args.push("-s");
    }

    // Add paths
    if (options.paths && options.paths.length > 0) {
      args.push(...options.paths);
    } else {
      args.push(".");
    }

    LoggingUtils.info(`🎨 Formatting with ${formatter}...`);

    const defaultOptions = {
      cwd: this.projectPath,
      stdio: "inherit",
      env: { ...process.env, GO111MODULE: "on" },
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const process = spawn(formatter, args, finalOptions);

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject(new Error(`${formatter} failed with code ${code}`));
        }
      });

      process.on("error", (error) => {
        reject(new Error(`Failed to execute ${formatter}: ${error.message}`));
      });
    });
  }

  /**
   * Manage Go dependencies
   */
  async manageDependencies(options = {}) {
    await this.initialize();

    const action = options.action || "tidy";

    switch (action) {
      case "tidy":
        return this.executeGoCommand("mod", ["tidy"], options);
      case "download":
        return this.executeGoCommand("mod", ["download"], options);
      case "vendor":
        return this.executeGoCommand("mod", ["vendor"], options);
      case "verify":
        return this.executeGoCommand("mod", ["verify"], options);
      case "graph":
        return this.executeGoCommand("mod", ["graph"], options);
      case "why":
        if (!options.package) {
          throw new Error('Package name required for "why" action');
        }
        return this.executeGoCommand("mod", ["why", options.package], options);
      default:
        throw new Error(`Unknown dependency action: ${action}`);
    }
  }

  /**
   * Run Go benchmarks
   */
  async benchmark(options = {}) {
    await this.initialize();

    const args = ["-bench", "."];

    if (options.benchtime) {
      args.push("-benchtime", options.benchtime);
    }

    if (options.count) {
      args.push("-count", options.count);
    }

    if (options.cpu) {
      args.push("-cpu", options.cpu);
    }

    if (options.benchmem) {
      args.push("-benchmem");
    }

    if (options.timeout) {
      args.push("-timeout", options.timeout);
    }

    // Add test pattern
    if (options.pattern) {
      args.push(options.pattern);
    } else {
      args.push("./...");
    }

    LoggingUtils.info("⚡ Running benchmarks...");

    return this.executeGoCommand("test", args, options);
  }

  /**
   * Generate documentation
   */
  async generateDocs(options = {}) {
    await this.initialize();

    const args = [];

    if (options.html) {
      args.push("-html");
    }

    if (options.http) {
      args.push("-http", options.http);
    }

    LoggingUtils.info("📚 Generating documentation...");

    if (this.detectedTools.godoc?.installed) {
      const defaultOptions = {
        cwd: this.projectPath,
        stdio: "inherit",
        env: { ...process.env, GO111MODULE: "on" },
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        // Merge environment objects instead of overwriting
        env: options.env
          ? { ...defaultOptions.env, ...options.env }
          : defaultOptions.env,
      };

      LoggingUtils.debug(
        `🔍 defaultOptions.env keys: ${Object.keys(defaultOptions.env || {}).join(", ")}`,
      );
      LoggingUtils.debug(
        `🔍 options.env keys: ${Object.keys(options.env || {}).join(", ")}`,
      );
      LoggingUtils.debug(
        `🔍 finalOptions.env keys: ${Object.keys(finalOptions.env || {}).join(", ")}`,
      );
      LoggingUtils.debug(`🔍 finalOptions.env.HOME: ${finalOptions.env?.HOME}`);
      LoggingUtils.debug(
        `🔍 finalOptions.env.GOCACHE: ${finalOptions.env?.GOCACHE}`,
      );

      return new Promise((resolve, reject) => {
        const process = spawn("godoc", args, finalOptions);

        process.on("close", (code) => {
          if (code === 0) {
            resolve({ success: true, code });
          } else {
            reject(new Error(`godoc failed with code ${code}`));
          }
        });

        process.on("error", (error) => {
          reject(new Error(`Failed to execute godoc: ${error.message}`));
        });
      });
    } else {
      // Fallback to go doc
      return this.executeGoCommand(
        "doc",
        options.package ? [options.package] : ["./..."],
        options,
      );
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();

    const args = [];

    if (options.cache) {
      args.push("-cache");
    }

    if (options.testcache) {
      args.push("-testcache");
    }

    if (options.modcache) {
      args.push("-modcache");
    }

    LoggingUtils.info("🧹 Cleaning build artifacts...");

    return this.executeGoCommand("clean", args, options);
  }
}

module.exports = GoCommandRunner;
