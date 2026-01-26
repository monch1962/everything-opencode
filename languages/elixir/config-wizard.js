#!/usr/bin/env node
/**
 * Elixir Configuration Wizard
 *
 * Interactive configuration for Elixir projects with Elixir-specific improvements
 */

const fs = require("fs");
const path = require("path");
const { runCommand, commandExists } = require("../../scripts/lib/utils");
const ElixirToolDetector = require("./tool-detector");

class ElixirConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new ElixirToolDetector();
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard with Elixir-specific improvements
   */
  async runWizard(options = {}) {
    console.log("🧪 Elixir Project Configuration Wizard\n");

    // Detect tools first
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(
      this.detectedTools,
    );

    // Show environment report
    this.showEnvironmentReport(report);

    // Check if Elixir is installed
    if (!report.summary.elixirInstalled) {
      console.log("❌ Elixir is not installed. Please install Elixir first.");
      this.showInstallationGuide("elixir");
      return null;
    }

    // Detect existing Elixir project or create new
    const projectType = await this.detectOrCreateProject(options);

    // Configure project based on type
    const config = await this.configureProject(projectType, options);

    // Generate configuration
    const fullConfig = this.generateConfiguration(config, report);

    // Save configuration
    if (!options.dryRun) {
      await this.saveConfiguration(fullConfig);
    }

    return fullConfig;
  }

  /**
   * Show environment report with Elixir-specific insights
   */
  showEnvironmentReport(report) {
    console.log("🔍 Detecting Elixir tools...");
    console.log("📊 Elixir Environment Report:");
    console.log("=".repeat(50));

    const { summary } = report;

    console.log(
      `✅ Elixir ${this.detectedTools.elixir?.version || "?"} installed`,
    );
    console.log(`📦 Using Mix: ${summary.mixInstalled ? "✅ Yes" : "❌ No"}`);
    console.log(`📦 Using Hex: ${summary.hexInstalled ? "✅ Yes" : "❌ No"}`);
    console.log(
      `🔧 Tools detected: ${summary.toolsDetected}/${summary.totalTools}`,
    );
    console.log(`⭐ Recommended tools: ${summary.recommendedTools}`);

    // Show detected tools
    console.log("\n📋 Detected Tools:");
    Object.entries(this.detectedTools).forEach(([name, tool]) => {
      if (tool.installed) {
        const versionInfo = tool.version ? ` v${tool.version}` : "";
        const recommended = tool.recommended ? " ⭐" : "";
        console.log(`   • ${name}:${versionInfo}${recommended}`);
      }
    });

    // Show recommendations
    if (report.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      report.recommendations.forEach((rec) => {
        const icon =
          rec.type === "critical" ? "❌" : rec.type === "high" ? "⚠️" : "🔵";
        console.log(`   ${icon} ${rec.message}`);
        if (rec.installGuide) {
          // Get platform-specific installation guide
          const platform =
            process.platform === "darwin"
              ? "macos"
              : process.platform === "win32"
                ? "windows"
                : "linux";
          const guide = rec.installGuide[platform] || rec.installGuide.linux;
          console.log(`      → ${guide}`);
        }
      });
    }

    console.log("=".repeat(50));
  }

  /**
   * Detect existing Elixir project or create new one
   */
  async detectOrCreateProject(options) {
    const hasMixExs = fs.existsSync(path.join(this.projectPath, "mix.exs"));
    const hasMixLock = fs.existsSync(path.join(this.projectPath, "mix.lock"));

    if (hasMixExs) {
      console.log("\n✅ Existing Elixir project detected");

      // Try to read mix.exs to determine project type
      try {
        const mixExsContent = fs.readFileSync(
          path.join(this.projectPath, "mix.exs"),
          "utf8",
        );

        if (mixExsContent.includes(":phoenix")) {
          return "phoenix";
        } else if (mixExsContent.includes(":umbrella")) {
          return "umbrella";
        } else if (mixExsContent.includes(":app")) {
          return "application";
        } else {
          return "library";
        }
      } catch (error) {
        return "application"; // Default to application
      }
    } else {
      console.log("\n📁 No existing Elixir project found");

      if (options.quick || options.noPrompt) {
        return options.projectType || "application";
      }

      // Interactive project type selection
      console.log("\n📝 Select project type:");
      console.log("   1. Simple Application (mix new)");
      console.log("   2. Phoenix Web Application");
      console.log("   3. Umbrella Project (multiple apps)");
      console.log("   4. Library/Package");
      console.log("   5. OTP Application");

      // In a real implementation, we would use interactive prompts
      // For now, default to simple application
      return "application";
    }
  }

  /**
   * Configure project based on type with Elixir-specific options
   */
  async configureProject(projectType, options) {
    console.log(`\n⚙️ Configuring ${projectType} project...`);

    const config = {
      projectType,
      elixir: {
        version: this.detectedTools.elixir?.version || "1.19",
        otpVersion: await this.detectOTPVersion(),
      },
      tools: {
        formatter: this.detectedTools.formatter?.installed ? "formatter" : null,
        linter: this.detectedTools.credo?.installed ? "credo" : null,
        typeChecker: this.detectedTools.dialyzer?.installed ? "dialyzer" : null,
        testRunner: "exunit",
      },
      testing: {
        async: true,
        coverage: true,
        seed: "random",
      },
      formatting: {
        lineLength: 98,
        inputs: ["*.{ex,exs}", "{config,lib,test}/**/*.{ex,exs}"],
      },
    };

    // Project type specific configurations
    switch (projectType) {
      case "phoenix":
        config.web = {
          framework: "phoenix",
          assets: true,
          database: this.detectedTools.ecto?.installed,
          liveView: true,
        };
        break;

      case "umbrella":
        config.umbrella = {
          apps: ["app1", "app2"], // Would be detected from apps/ directory
          sharedDeps: true,
        };
        break;

      case "library":
        config.library = {
          docs: true,
          exDoc: true,
          hexPublish: this.detectedTools.hex?.installed,
        };
        break;

      case "application":
        config.application = {
          supervisionTree: true,
          release: true,
          hotCodeUpgrade: false,
        };
        break;
    }

    // Apply user options
    if (options.linter) config.tools.linter = options.linter;
    if (options.formatter) config.tools.formatter = options.formatter;
    if (options.testRunner) config.tools.testRunner = options.testRunner;

    return config;
  }

  /**
   * Detect OTP version for Elixir compatibility
   */
  async detectOTPVersion() {
    try {
      const { stdout } = await runCommand(
        "erl -eval 'erlang:display(erlang:system_info(otp_release)), halt().' -noshell",
        {
          cwd: this.projectPath,
          timeout: 5000,
        },
      );

      const match = stdout.match(/"(\d+)"/);
      return match ? match[1] : "26";
    } catch (error) {
      return "26"; // Default to OTP 26
    }
  }

  /**
   * Generate complete configuration
   */
  generateConfiguration(config, report) {
    return {
      language: "elixir",
      version: "1.0",
      config,
      environment: {
        detectedTools: this.detectedTools,
        reportSummary: report.summary,
        timestamp: new Date().toISOString(),
      },
      commands: {
        setup: "/elixir-setup",
        compile: "/elixir-compile",
        test: "/elixir-test",
        lint: "/elixir-lint",
        format: "/elixir-format",
        deps: "/elixir-deps",
        typecheck: "/elixir-typecheck",
      },
    };
  }

  /**
   * Save configuration to .opencode directory
   */
  async saveConfiguration(config) {
    const opencodeDir = path.join(this.projectPath, ".opencode");
    const configFile = path.join(opencodeDir, "elixir-config.json");

    // Create .opencode directory if it doesn't exist
    if (!fs.existsSync(opencodeDir)) {
      fs.mkdirSync(opencodeDir, { recursive: true });
    }

    // Save configuration
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

    // Create .gitignore for Elixir
    const gitignorePath = path.join(this.projectPath, ".gitignore");
    const elixirGitignore = `
# Elixir specific
/_build/
/deps/
/.fetch
erl_crash.dump
*.ez
*.beam
cover/
*.coverdata

# Mix artifacts
/mix.lock
/.mix/
/mix.manifest

# Dialyzer
/.dialyzer/
/dialyxir_erlang*.json

# Documentation
/doc/
/.docs/

# Environment
.env
.env.local
.env.*.local

# Archives
/archives/

# Temporary files
*.tmp
*.swp
*.swo
*~
`;

    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, elixirGitignore.trim());
    } else {
      // Append if not already present
      const existing = fs.readFileSync(gitignorePath, "utf8");
      if (!existing.includes("# Elixir specific")) {
        fs.appendFileSync(gitignorePath, elixirGitignore);
      }
    }

    console.log(`\n✅ Configuration saved to: ${configFile}`);
    console.log(`✅ Created .gitignore for Elixir`);

    return configFile;
  }

  /**
   * Show installation guide for a tool
   */
  showInstallationGuide(toolName) {
    const guide = this.toolDetector.getInstallationGuide(toolName);
    if (guide) {
      console.log(`\n💡 Installation guide for ${toolName}:`);
      console.log(`   ${guide}`);
    }
  }

  /**
   * Get project configuration
   */
  getConfig() {
    const configFile = path.join(
      this.projectPath,
      ".opencode",
      "elixir-config.json",
    );

    if (fs.existsSync(configFile)) {
      try {
        return JSON.parse(fs.readFileSync(configFile, "utf8"));
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  /**
   * Update project configuration
   */
  updateConfig(updates) {
    const currentConfig = this.getConfig() || {};
    const newConfig = { ...currentConfig, ...updates };

    const opencodeDir = path.join(this.projectPath, ".opencode");
    const configFile = path.join(opencodeDir, "elixir-config.json");

    if (!fs.existsSync(opencodeDir)) {
      fs.mkdirSync(opencodeDir, { recursive: true });
    }

    fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 2));
    return newConfig;
  }
}

module.exports = ElixirConfigWizard;
