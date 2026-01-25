#!/usr/bin/env node
/**
 * /go-setup command wrapper
 *
 * Configure Go project for opencode integration with Go-specific improvements
 */

const GoConfigWizard = require("../../languages/go/config-wizard");
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
    } else if (arg === "--module-name") {
      options.moduleName = args[++i];
    } else if (arg === "--go-version") {
      options.goVersion = args[++i];
    } else if (arg === "--linter") {
      options.linter = args[++i];
    } else if (arg === "--formatter") {
      options.formatter = args[++i];
    } else if (arg === "--test-runner") {
      options.testRunner = args[++i];
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

    console.log(`🚀 Configuring Go project at: ${projectPath}`);
    console.log("=".repeat(60));

    // Check if project is already configured
    const configManager = new ConfigManager(projectPath);
    const existingConfig = configManager.loadConfig();

    if (existingConfig?.go && !options.reconfigure) {
      console.log("✅ Go project is already configured.");
      console.log("   Use --reconfigure to reconfigure or update settings.");

      // Show current configuration
      console.log("\n📋 Current Go configuration:");
      console.log(`   Module: ${existingConfig.go.module || "Not set"}`);
      console.log(`   Go version: ${existingConfig.go.version || "Not set"}`);
      console.log(
        `   Project type: ${existingConfig.go.projectType || "module"}`,
      );
      console.log(`   Linter: ${existingConfig.go.linting?.tool || "Not set"}`);

      process.exit(0);
    }

    // Run configuration wizard
    const wizard = new GoConfigWizard(projectPath);
    const config = await wizard.runWizard(options);

    if (!config) {
      console.error("❌ Configuration failed");
      process.exit(1);
    }

    // Update main project config
    if (!options.dryRun) {
      const fullConfig = existingConfig || {
        $schema: "https://json.schemastore.org/opencode-project-config.json",
        project: projectPath,
        timestamp: new Date().toISOString(),
      };

      fullConfig.go = config.go;
      fullConfig.languages = fullConfig.languages || [];
      if (!fullConfig.languages.includes("go")) {
        fullConfig.languages.push("go");
      }

      configManager.saveConfig(fullConfig);

      console.log("\n✅ Go project configuration saved successfully!");
      console.log(`   Configuration file: ${configManager.configPath}`);
    } else {
      console.log("\n✅ Dry run completed. Configuration would be:");
      console.log(JSON.stringify(config, null, 2));
    }
  } catch (error) {
    console.error(`❌ Configuration failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 Go Project Setup

Usage: /go-setup [options] [project-path]

Configure Go project for opencode integration with Go-specific improvements.

Options:
  --quick, -q            Quick setup with defaults
  --reconfigure, -r      Reconfigure existing project
  --project-type TYPE    Project type: module, cli, web, library, workspace
  --module-name NAME     Go module name (e.g., github.com/user/project)
  --go-version VERSION   Go version constraint (e.g., 1.21)
  --linter TOOL          Linter tool: golangci-lint, staticcheck, revive
  --formatter TOOL       Formatter: gofmt, goimports
  --test-runner TOOL     Test runner: go test, gotestsum
  --no-prompt, -y        Skip interactive prompts
  --verbose, -v          Verbose output
  --dry-run              Show configuration without saving
  --help, -h             Show this help message

Examples:
  /go-setup                         # Configure current directory
  /go-setup --quick                 # Quick setup with defaults
  /go-setup --project-type cli      # Create CLI application
  /go-setup --reconfigure           # Reconfigure existing project
  /go-setup /path/to/project        # Configure specific directory

Go-specific features:
  • Automatic Go module detection and creation
  • Go workspace support (Go 1.18+)
  • Multiple linter integration (golangci-lint, staticcheck, revive)
  • Smart dependency management with go mod
  • Cross-compilation support
  • Built-in race detector integration
  • Coverage reporting with multiple formats
  • Benchmark execution and reporting

Environment detection:
  • Go version and tool detection
  • GOPATH vs Go modules detection
  • Workspace mode detection
  • Cross-platform tool installation guides

Next steps after setup:
  1. Write your Go code
  2. Run tests: /go-test
  3. Build project: /go-build
  4. Format code: /go-fmt
  5. Lint code: /go-lint
  6. Manage dependencies: /go-deps
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
