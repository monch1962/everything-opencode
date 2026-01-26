#!/usr/bin/env node
/**
 * PineScript Command Runner
 *
 * Base class for executing PineScript commands based on project configuration
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { runCommand, commandExists } = require("../lib/utils");
const ConfigManager = require("../interactive/config-manager");
const PineScriptToolDetector = require("../../languages/pinescript/tool-detector");
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

class PineCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new PineScriptToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.pineConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner
   */
  async initialize() {
    // First, validate that we're in a PineScript project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== "pinescript" && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn(
          "This may not be a PineScript project. Some features may not work correctly.",
        );
      } else if (projectInfo.type === "pinescript") {
        LoggingUtils.debug(
          `Detected PineScript project: ${projectInfo.framework || "standard PineScript"}`,
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
        throw new Error("Project not configured. Run /pine-setup first.");
      }

      // Get PineScript configuration
      this.pineConfig = this.config.pinescript;
      if (!this.pineConfig) {
        throw new Error(
          "PineScript configuration not found. Run /pine-setup first.",
        );
      }

      // Validate PineScript configuration schema
      ConfigUtils.validateConfig(this.pineConfig, "pinescript");

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error(
        "Failed to initialize PineScript command runner:",
        error.message,
      );
      LoggingUtils.info("Run /pine-setup to configure your PineScript project");
      throw error;
    }
  }

  /**
   * Check if required tool is installed
   */
  checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(
        this.pineConfig,
        toolName,
        required,
      );

      if (!isInstalled && required) {
        throw new Error(
          `${toolName} is not installed. Install it or check tool recommendations.`,
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(
          `PineScript tool '${toolName}' check failed:`,
          error.message,
        );
        LoggingUtils.info(`Run /pine-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Find PineScript files in the project
   */
  findPineScriptFiles(pattern = "**/*.pine", excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: "pinescript",
      });
    } catch (error) {
      LoggingUtils.warn("Failed to find PineScript files:", error.message);
      return [];
    }
  }

  /**
   * Get PineScript project metadata
   */
  getPineScriptProjectInfo() {
    try {
      const info = {
        hasPineFiles: this.findPineScriptFiles().length > 0,
        pineScriptFiles: this.findPineScriptFiles().length,
        hasConfig: fs.existsSync(path.join(this.projectPath, "config")),
        hasScripts: fs.existsSync(path.join(this.projectPath, "scripts")),
        hasIndicators: fs.existsSync(path.join(this.projectPath, "indicators")),
        hasStrategies: fs.existsSync(path.join(this.projectPath, "strategies")),
      };

      return info;
    } catch (error) {
      LoggingUtils.debug(
        "Failed to get PineScript project info:",
        error.message,
      );
      return null;
    }
  }

  /**
   * Validate PineScript file exists and is readable
   */
  validatePineFile(filePath) {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.projectPath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`PineScript file not found: ${filePath}`);
    }

    if (!fs.statSync(fullPath).isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    if (!fullPath.endsWith(".pine")) {
      throw new Error(`File must have .pine extension: ${filePath}`);
    }

    return fullPath;
  }

  /**
   * Read PineScript file content
   */
  readPineFile(filePath) {
    const fullPath = this.validatePineFile(filePath);

    try {
      return fs.readFileSync(fullPath, "utf8");
    } catch (error) {
      throw new Error(`Failed to read PineScript file: ${error.message}`);
    }
  }

  /**
   * Get PineScript version from file content
   */
  getPineVersionFromContent(content) {
    const versionMatch = content.match(/\/\/@version=(\d+)/);
    return versionMatch ? versionMatch[1] : null;
  }

  /**
   * Validate PineScript version compatibility
   */
  validateVersionCompatibility(fileVersion, configVersion) {
    if (!fileVersion) {
      return { compatible: true, warning: "No version specified in file" };
    }

    if (configVersion === "auto") {
      return { compatible: true, version: fileVersion };
    }

    const fileVerNum = parseInt(fileVersion);
    const configVerNum = parseInt(configVersion);

    if (isNaN(fileVerNum) || isNaN(configVerNum)) {
      return { compatible: true, warning: "Could not parse version numbers" };
    }

    if (fileVerNum < configVerNum) {
      return {
        compatible: false,
        error: `File version (v${fileVersion}) is older than configured version (v${configVersion})`,
      };
    }

    if (fileVerNum > configVerNum) {
      return {
        compatible: true,
        warning: `File version (v${fileVersion}) is newer than configured version (v${configVersion})`,
      };
    }

    return { compatible: true, version: fileVersion };
  }

  /**
   * Execute command with proper error handling
   */
  async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const fullCommand = [command, ...args].join(" ");
      LoggingUtils.info(`\n🚀 Executing: ${fullCommand}`);

      const child = spawn(command, args, {
        cwd: this.projectPath,
        stdio: options.stdio || "inherit",
        shell: options.shell || true,
        env: { ...process.env, ...options.env },
      });

      let stdout = "";
      let stderr = "";

      if (child.stdout) {
        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });
      }

      child.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr, code });
        } else {
          reject(
            new Error(
              `Command failed with code ${code}: ${stderr || "Unknown error"}`,
            ),
          );
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Command execution failed: ${error.message}`));
      });
    });
  }

  /**
   * Run PineScript validation
   */
  async runValidation(filePath, options = {}) {
    await this.checkTool("pineParser", true);

    const content = this.readPineFile(filePath);
    const fileVersion = this.getPineVersionFromContent(content);
    const versionCheck = this.validateVersionCompatibility(
      fileVersion,
      this.pineConfig.version,
    );

    if (!versionCheck.compatible) {
      throw new Error(`Version compatibility error: ${versionCheck.error}`);
    }

    if (versionCheck.warning) {
      LoggingUtils.warn(`⚠️  Warning: ${versionCheck.warning}`);
    }

    // Basic validation checks
    const validationResults = {
      file: filePath,
      version: fileVersion || "unknown",
      checks: [],
    };

    // Check for required PineScript structure
    if (!content.includes("//@version=")) {
      validationResults.checks.push({
        type: "warning",
        message: "No version declaration found. Add //@version=X comment.",
        suggestion: "Add //@version=5 or your preferred version",
      });
    }

    // Check for study/indicator/strategy declaration
    if (
      !content.includes("indicator(") &&
      !content.includes("strategy(") &&
      !content.includes("study(")
    ) {
      validationResults.checks.push({
        type: "error",
        message: "No indicator, strategy, or study declaration found.",
        suggestion: 'Add indicator("My Indicator") or strategy("My Strategy")',
      });
    }

    // Check for plot or plotshape (basic visualization)
    if (
      !content.includes("plot(") &&
      !content.includes("plotshape(") &&
      !content.includes("plotchar(")
    ) {
      validationResults.checks.push({
        type: "warning",
        message: "No plot functions found. Indicator may not be visible.",
        suggestion: "Add plot(close) or plotshape() for visualization",
      });
    }

    // Check for common syntax issues
    if (content.includes("security(") && this.pineConfig.version >= 5) {
      validationResults.checks.push({
        type: "warning",
        message: "security() function is deprecated in v5+.",
        suggestion: "Use request.security() instead",
      });
    }

    if (content.includes("study(") && this.pineConfig.version >= 5) {
      validationResults.checks.push({
        type: "warning",
        message: "study() function is deprecated in v5+.",
        suggestion: "Use indicator() or strategy() instead",
      });
    }

    // Add debugging suggestions for complex indicators
    if (options.debugSuggestions !== false) {
      const debugSuggestions = this.generateDebugSuggestions(content);
      validationResults.checks.push(...debugSuggestions);
    }

    return validationResults;
  }

  /**
   * Generate debugging suggestions for PineScript code
   */
  generateDebugSuggestions(content) {
    const suggestions = [];

    // Analyze code complexity
    const lines = content.split("\n");
    const lineCount = lines.length;
    const variableCount = (content.match(/\w+\s*=/g) || []).length;
    const functionCount = (content.match(/=>/g) || []).length;
    const conditionCount = (content.match(/if\s+|when\s+|and\s+|or\s+/gi) || [])
      .length;

    // Complexity analysis
    if (lineCount > 100) {
      suggestions.push({
        type: "info",
        message: `Complex indicator (${lineCount} lines, ${variableCount} variables).`,
        suggestion: "Consider using /pine-debug profile to analyze performance",
        debug: true,
      });
    }

    // Check for intermediate variable debugging
    const hasPlot = content.includes("plot(");
    const hasPlotchar = content.includes("plotchar(");
    const hasPlotshape = content.includes("plotshape(");

    if (variableCount > 10 && !hasPlotchar && !hasPlotshape) {
      suggestions.push({
        type: "info",
        message: `Many variables (${variableCount}) without debug visualization.`,
        suggestion: "Add plotchar() for key variables or use debug helpers",
        debug: true,
      });
    }

    // Check for complex conditions
    if (conditionCount > 5) {
      suggestions.push({
        type: "info",
        message: `Complex logic (${conditionCount} conditions).`,
        suggestion: "Use /pine-debug monitor to track condition states",
        debug: true,
      });
    }

    // Check for custom calculations
    const customCalcPattern =
      /(\w+)\s*=\s*(?!ta\.|math\.|str\.|input\.|request\.)/g;
    const customMatches = [...content.matchAll(customCalcPattern)];

    if (customMatches.length > 3) {
      suggestions.push({
        type: "info",
        message: `Custom calculations detected (${customMatches.length}).`,
        suggestion: "Use debug.plot() to visualize intermediate results",
        debug: true,
      });
    }

    // Check for series operations
    const seriesOps = (content.match(/\[1\]|\[2\]|\[3\]/g) || []).length;
    if (seriesOps > 5) {
      suggestions.push({
        type: "info",
        message: `Multiple series operations (${seriesOps}).`,
        suggestion: "Use debug.series() to track historical values",
        debug: true,
      });
    }

    // Check for error handling
    const hasNaCheck = content.includes("na(") || content.includes("nz(");
    if (!hasNaCheck && variableCount > 5) {
      suggestions.push({
        type: "info",
        message: "No explicit NA handling detected.",
        suggestion: "Add na() checks or use debug.errorCheck()",
        debug: true,
      });
    }

    // Check for performance patterns
    const nestedLoops = (
      content.match(/for\s+\w+\s*=\s*\w+\s+to\s+\w+/gi) || []
    ).length;
    if (nestedLoops > 0) {
      suggestions.push({
        type: "warning",
        message: "Loop structures detected (performance concern).",
        suggestion: "Use /pine-debug profile to optimize performance",
        debug: true,
      });
    }

    // Suggest debug helpers for complex indicators
    if (lineCount > 50 || variableCount > 15 || conditionCount > 10) {
      suggestions.push({
        type: "info",
        message: "Complex indicator suitable for advanced debugging.",
        suggestion: "Run /pine-debug helpers to generate debugging utilities",
        debug: true,
      });
    }

    return suggestions;
  }

  /**
   * Generate validation report
   */
  generateValidationReport(results, options = {}) {
    LoggingUtils.info("\n📋 Validation Report");
    LoggingUtils.info("=".repeat(50));
    LoggingUtils.info(`File: ${results.file}`);
    LoggingUtils.info(`Version: ${results.version}`);
    LoggingUtils.info(`Checks: ${results.checks.length}`);

    const errors = results.checks.filter((c) => c.type === "error");
    const warnings = results.checks.filter((c) => c.type === "warning");
    const info = results.checks.filter((c) => c.type === "info" && !c.debug);
    const debugSuggestions = results.checks.filter((c) => c.debug);

    if (errors.length > 0) {
      LoggingUtils.error("\n❌ Errors:");
      errors.forEach((check, i) => {
        LoggingUtils.error(`  ${i + 1}. ${check.message}`);
        if (check.suggestion) {
          LoggingUtils.info(`     💡 ${check.suggestion}`);
        }
      });
    }

    if (warnings.length > 0) {
      LoggingUtils.warn("\n⚠️  Warnings:");
      warnings.forEach((check, i) => {
        LoggingUtils.warn(`  ${i + 1}. ${check.message}`);
        if (check.suggestion) {
          LoggingUtils.info(`     💡 ${check.suggestion}`);
        }
      });
    }

    if (info.length > 0) {
      LoggingUtils.info("\nℹ️  Info:");
      info.forEach((check, i) => {
        LoggingUtils.info(`  ${i + 1}. ${check.message}`);
        if (check.suggestion) {
          LoggingUtils.info(`     💡 ${check.suggestion}`);
        }
      });
    }

    if (debugSuggestions.length > 0) {
      LoggingUtils.info("\n🔧 Debugging Suggestions:");
      debugSuggestions.forEach((check, i) => {
        const icon = check.type === "warning" ? "⚠️" : "💡";
        LoggingUtils.info(`  ${i + 1}. ${icon} ${check.message}`);
        if (check.suggestion) {
          LoggingUtils.info(`     🛠️  ${check.suggestion}`);
        }
      });

      LoggingUtils.info("\n🚀 Quick Debugging Commands:");
      LoggingUtils.info("   /pine-debug inspect --var VARIABLE_NAME");
      LoggingUtils.info("   /pine-debug trace --var VARIABLE_NAME --plot");
      LoggingUtils.info("   /pine-debug profile --metrics complexity");
      LoggingUtils.info("   /pine-debug helpers --output debug-helpers.pine");
    }

    if (errors.length === 0 && warnings.length === 0) {
      LoggingUtils.info("\n✅ No issues found!");
    }

    return {
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      errorCount: errors.length,
      warningCount: warnings.length,
    };
  }

  /**
   * Get project configuration summary
   */
  getConfigSummary() {
    return {
      version: this.pineConfig.version,
      projectType: this.pineConfig.projectType,
      backtesting: this.pineConfig.backtesting?.enabled || false,
      alerts: this.pineConfig.alerts?.enabled || false,
      tradingview: this.pineConfig.tradingview?.publish || false,
    };
  }
}

// Export for use in other scripts
module.exports = PineCommandRunner;

// Test the command runner
if (require.main === module) {
  const runner = new PineCommandRunner();

  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🚀 PineScript Command Runner

Usage:
  node scripts/pinescript/command-runner.js [command] [options]

Commands:
  validate <file>    Validate PineScript file
  config             Show configuration summary
  tools              List detected tools

Options:
  --help, -h         Show this help message

Examples:
  node scripts/pinescript/command-runner.js validate my-strategy.pine
  node scripts/pinescript/command-runner.js config
    `);
    process.exit(0);
  } else if (args[0] === "validate" && args[1]) {
    runner
      .initialize()
      .then(async () => {
        try {
          const results = await runner.runValidation(args[1]);
          runner.generateValidationReport(results);
        } catch (error) {
          LoggingUtils.error(`❌ Validation failed: ${error.message}`);
          process.exit(1);
        }
      })
      .catch((error) => {
        LoggingUtils.error(`❌ Initialization failed: ${error.message}`);
        process.exit(1);
      });
  } else if (args[0] === "config") {
    runner
      .initialize()
      .then(() => {
        const summary = runner.getConfigSummary();
        LoggingUtils.info("\n📊 PineScript Configuration Summary:");
        LoggingUtils.info(`  • Version: v${summary.version}`);
        LoggingUtils.info(`  • Project Type: ${summary.projectType}`);
        LoggingUtils.info(
          `  • Backtesting: ${summary.backtesting ? "Enabled" : "Disabled"}`,
        );
        LoggingUtils.info(
          `  • Alerts: ${summary.alerts ? "Enabled" : "Disabled"}`,
        );
        LoggingUtils.info(
          `  • TradingView Publish: ${summary.tradingview ? "Enabled" : "Disabled"}`,
        );
      })
      .catch((error) => {
        LoggingUtils.error(`❌ Failed to load configuration: ${error.message}`);
        process.exit(1);
      });
  } else if (args[0] === "tools") {
    runner
      .initialize()
      .then(async () => {
        LoggingUtils.info("\n🔧 Detected Tools:");
        Object.entries(runner.detectedTools || {}).forEach(([name, info]) => {
          LoggingUtils.info(
            `  ${info.installed ? "✅" : "❌"} ${name}: ${info.installed ? `v${info.version}` : "Not installed"}`,
          );
        });
      })
      .catch((error) => {
        LoggingUtils.error(`❌ Failed to load tools: ${error.message}`);
        process.exit(1);
      });
  } else {
    LoggingUtils.error("Unknown command. Use --help for usage information.");
    process.exit(1);
  }
}
