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

class PineCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new PineScriptToolDetector();
    this.config = null;
    this.pineConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner
   */
  async initialize() {
    // Load configuration
    this.config = this.configManager.loadConfig();
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

    // Detect tools
    this.detectedTools = await this.toolDetector.detectTools();

    return true;
  }

  /**
   * Check if required tool is installed
   */
  async checkTool(toolName, required = true) {
    const toolInfo = this.detectedTools?.[toolName];

    if (!toolInfo || !toolInfo.installed) {
      if (required) {
        throw new Error(
          `${toolName} is not installed. Install it or check tool recommendations.`,
        );
      }
      return false;
    }

    return true;
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
      console.log(`\n🚀 Executing: ${fullCommand}`);

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
      console.log(`⚠️  Warning: ${versionCheck.warning}`);
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

    return validationResults;
  }

  /**
   * Generate validation report
   */
  generateValidationReport(results, options = {}) {
    console.log("\n📋 Validation Report");
    console.log("=".repeat(50));
    console.log(`File: ${results.file}`);
    console.log(`Version: ${results.version}`);
    console.log(`Checks: ${results.checks.length}`);

    const errors = results.checks.filter((c) => c.type === "error");
    const warnings = results.checks.filter((c) => c.type === "warning");
    const info = results.checks.filter((c) => c.type === "info");

    if (errors.length > 0) {
      console.log("\n❌ Errors:");
      errors.forEach((check, i) => {
        console.log(`  ${i + 1}. ${check.message}`);
        if (check.suggestion) {
          console.log(`     💡 ${check.suggestion}`);
        }
      });
    }

    if (warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      warnings.forEach((check, i) => {
        console.log(`  ${i + 1}. ${check.message}`);
        if (check.suggestion) {
          console.log(`     💡 ${check.suggestion}`);
        }
      });
    }

    if (info.length > 0) {
      console.log("\nℹ️  Info:");
      info.forEach((check, i) => {
        console.log(`  ${i + 1}. ${check.message}`);
      });
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log("\n✅ No issues found!");
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
          console.error(`❌ Validation failed: ${error.message}`);
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error(`❌ Initialization failed: ${error.message}`);
        process.exit(1);
      });
  } else if (args[0] === "config") {
    runner
      .initialize()
      .then(() => {
        const summary = runner.getConfigSummary();
        console.log("\n📊 PineScript Configuration Summary:");
        console.log(`  • Version: v${summary.version}`);
        console.log(`  • Project Type: ${summary.projectType}`);
        console.log(
          `  • Backtesting: ${summary.backtesting ? "Enabled" : "Disabled"}`,
        );
        console.log(`  • Alerts: ${summary.alerts ? "Enabled" : "Disabled"}`);
        console.log(
          `  • TradingView Publish: ${summary.tradingview ? "Enabled" : "Disabled"}`,
        );
      })
      .catch((error) => {
        console.error(`❌ Failed to load configuration: ${error.message}`);
        process.exit(1);
      });
  } else if (args[0] === "tools") {
    runner
      .initialize()
      .then(async () => {
        console.log("\n🔧 Detected Tools:");
        Object.entries(runner.detectedTools || {}).forEach(([name, info]) => {
          console.log(
            `  ${info.installed ? "✅" : "❌"} ${name}: ${info.installed ? `v${info.version}` : "Not installed"}`,
          );
        });
      })
      .catch((error) => {
        console.error(`❌ Failed to load tools: ${error.message}`);
        process.exit(1);
      });
  } else {
    console.error("Unknown command. Use --help for usage information.");
    process.exit(1);
  }
}
