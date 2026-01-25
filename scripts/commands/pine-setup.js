#!/usr/bin/env node
/**
 * /pine-setup command wrapper
 *
 * Configure PineScript project for opencode integration
 */

const PineScriptConfigWizard = require("../../languages/pinescript/config-wizard");

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
    } else if (arg === "--version") {
      options.version = args[++i];
    } else if (arg === "--project-type") {
      options.projectType = args[++i];
    } else if (arg === "--backtesting") {
      options.backtesting = args[++i] === "true" || args[++i] === "enabled";
    } else if (arg === "--alerts") {
      options.alerts = args[++i] === "true" || args[++i] === "enabled";
    } else if (arg === "--no-prompt" || arg === "-y") {
      options.noPrompt = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--config") {
      options.config = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    const wizard = new PineScriptConfigWizard();

    if (options.quick) {
      console.log("🚀 Running PineScript quick setup...");
      const success = await wizard.quickSetup();
      if (!success) {
        console.error("❌ Quick setup failed");
        process.exit(1);
      }
    } else if (options.reconfigure) {
      console.log("🔄 Reconfiguring PineScript project...");
      const success = await wizard.run();
      if (!success) {
        console.error("❌ Reconfiguration failed");
        process.exit(1);
      }
    } else {
      console.log("📈 Running PineScript configuration wizard...");
      const success = await wizard.run();
      if (!success) {
        console.error("❌ Configuration failed");
        process.exit(1);
      }
    }

    console.log("\n✅ PineScript setup completed successfully");
  } catch (error) {
    console.error(`\n❌ Setup execution failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/pine-setup - Configure PineScript project for opencode integration

Usage:
  /pine-setup [options]

Options:
  --quick, -q              Quick setup with automatic detection
  --reconfigure, -r        Reconfigure existing project
  --version <version>      Set PineScript version (4, 5, 6, auto)
  --project-type <type>    Set project type (indicator, strategy, library)
  --backtesting <bool>     Enable/disable backtesting
  --alerts <bool>          Enable/disable alerts
  --no-prompt, -y          Skip confirmation prompts
  --verbose, -v            Verbose output
  --config <path>          Use alternative configuration file
  --help, -h               Show this help

Examples:
  /pine-setup                    # Run interactive wizard
  /pine-setup --quick            # Quick automatic setup
  /pine-setup --reconfigure      # Reconfigure existing project
  /pine-setup --version=5 --project-type=strategy

Configuration:
  Saves configuration to .opencode/project-config.json
  Sets up PineScript project type, version, and tooling

Next Steps:
  After setup, use:
    /pine-validate    - Validate PineScript files
    /pine-backtest    - Run backtesting (for strategies)
    /pine-optimize    - Optimize strategy parameters
    /pine-convert     - Convert between PineScript versions
    /pine-alert       - Configure alert system
  `);
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;
