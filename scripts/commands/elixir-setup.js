#!/usr/bin/env node
/**
 * /elixir-setup command wrapper
 *
 * Configure Elixir project for opencode integration with Elixir-specific improvements
 */

const ElixirConfigWizard = require("../../languages/elixir/config-wizard");
const ConfigManager = require("../interactive/config-manager");

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--quick" || arg === "-q") {
      options.quick = true;
    } else if (arg === "--reconfigure" || arg === "-r") {
      options.reconfigure = true;
    } else if (arg === "--project-type") {
      options.projectType = args[++i];
    } else if (arg === "--app-name") {
      options.appName = args[++i];
    } else if (arg === "--elixir-version") {
      options.elixirVersion = args[++i];
    } else if (arg === "--otp-version") {
      options.otpVersion = args[++i];
    } else if (arg === "--linter") {
      options.linter = args[++i];
    } else if (arg === "--formatter") {
      options.formatter = args[++i];
    } else if (arg === "--test-runner") {
      options.testRunner = args[++i];
    } else if (arg === "--type-checker") {
      options.typeChecker = args[++i];
    } else if (arg === "--no-prompt" || arg === "-y") {
      options.noPrompt = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a project path
      options.projectPath = arg;
    }
  }

  try {
    const projectPath = options.projectPath || process.cwd();
    const wizard = new ElixirConfigWizard(projectPath);

    console.log(`🧪 Configuring Elixir project at: ${projectPath}`);
    console.log("=".repeat(60));

    // Check for existing configuration
    const configManager = new ConfigManager(projectPath);
    const existingConfig = configManager.loadConfig();

    if (existingConfig && existingConfig.elixir && !options.reconfigure) {
      console.log("✅ Elixir project already configured.");
      console.log("   Use --reconfigure to update configuration.");
      return;
    }

    // Run configuration wizard
    const config = await wizard.runWizard(options);

    if (config) {
      // Save to main config
      const fullConfig = {
        ...(existingConfig || {}),
        elixir: config,
        language: "elixir",
        configuredAt: new Date().toISOString(),
      };

      configManager.saveConfig(fullConfig);

      console.log("\n🎉 Elixir project configuration complete!");
      console.log("=".repeat(60));

      console.log("\n📋 Next steps:\n");
      console.log("🔧 Available commands:");
      console.log("  /elixir-setup    - Configure Elixir project");
      console.log("  /elixir-compile  - Compile Elixir project");
      console.log("  /elixir-test     - Run tests");
      console.log("  /elixir-lint     - Lint code");
      console.log("  /elixir-format   - Format code");
      console.log("  /elixir-deps     - Manage dependencies");
      console.log("  /elixir-typecheck - Type checking\n");

      console.log("💡 Recommended actions:");
      if (!config.environment.reportSummary.hexInstalled) {
        console.log("  • Install Hex package manager: mix local.hex");
      }
      if (!config.environment.reportSummary.recommendedTools) {
        console.log(
          "  • Install Credo for code analysis: mix archive.install hex credo",
        );
      }

      console.log("\n📚 Documentation:");
      console.log("  • Elixir: https://elixir-lang.org/docs.html");
      console.log("  • Mix: https://hexdocs.pm/mix/Mix.html");
      console.log("  • Hex: https://hex.pm/docs");
      console.log("  • Credo: https://hexdocs.pm/credo/overview.html");

      console.log("\n✅ Elixir project configuration saved successfully!");
      console.log(
        `   Configuration file: ${projectPath}/.opencode/project-config.json`,
      );
    }
  } catch (error) {
    console.error(`\n❌ Configuration failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧪 Elixir Project Setup

Usage: /elixir-setup [options] [project-path]

Configure Elixir project for opencode integration with Elixir-specific improvements.

Options:
  --quick, -q            Quick setup with defaults
  --reconfigure, -r      Reconfigure existing project
  --project-type TYPE    Project type: application, phoenix, umbrella, library, otp
  --app-name NAME        Application name (for new projects)
  --elixir-version VER   Elixir version constraint (e.g., 1.19)
  --otp-version VER      OTP version constraint (e.g., 26)
  --linter TOOL          Linter tool: credo
  --formatter TOOL       Formatter: formatter (built-in)
  --test-runner TOOL     Test runner: exunit (built-in)
  --type-checker TOOL    Type checker: dialyzer
  --no-prompt, -y        Skip interactive prompts
  --verbose, -v          Verbose output
  --dry-run              Show configuration without saving
  --help, -h             Show this help message

Examples:
  /elixir-setup                         # Configure current directory
  /elixir-setup --quick                 # Quick setup with defaults
  /elixir-setup --project-type phoenix  # Create Phoenix web application
  /elixir-setup --reconfigure           # Reconfigure existing project
  /elixir-setup /path/to/project        # Configure specific directory

Elixir-specific features:
  • Automatic Elixir and OTP version detection
  • Phoenix framework support with LiveView
  • Umbrella project configuration
  • Built-in formatter with configurable line length
  • Credo integration for static analysis
  • Dialyzer integration for type checking
  • Hex package management
  • ExUnit testing with coverage

Environment detection:
  • Elixir and Erlang/OTP version detection
  • Mix project detection and analysis
  • Tool availability checking (Credo, Dialyzer, etc.)
  • Cross-platform installation guides

Next steps after setup:
  1. Write your Elixir code
  2. Run tests: /elixir-test
  3. Compile project: /elixir-compile
  4. Format code: /elixir-format
  5. Lint code: /elixir-lint
  6. Manage dependencies: /elixir-deps
  7. Type checking: /elixir-typecheck
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
