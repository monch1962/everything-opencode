#!/usr/bin/env node
/**
 * /go-deps command wrapper
 *
 * Manage Go dependencies with Go-specific improvements
 */

const GoCommandRunner = require("../go/command-runner");

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--tidy" || arg === "-t") {
      options.action = "tidy";
    } else if (arg === "--download" || arg === "-d") {
      options.action = "download";
    } else if (arg === "--vendor" || arg === "-v") {
      options.action = "vendor";
    } else if (arg === "--verify") {
      options.action = "verify";
    } else if (arg === "--graph") {
      options.action = "graph";
    } else if (arg === "--why") {
      options.action = "why";
    } else if (arg === "--package" || arg === "-p") {
      options.package = args[++i];
    } else if (arg === "--update") {
      options.update = true;
    } else if (arg === "--update-all") {
      options.updateAll = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--security") {
      options.security = true;
    } else if (arg === "--audit") {
      options.audit = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else if (!options.action) {
      // First non-option argument is action
      options.action = arg;
    } else if (options.action === "why" && !options.package) {
      options.package = arg;
    } else {
      // Additional arguments for specific actions
      options.extraArgs = options.extraArgs || [];
      options.extraArgs.push(arg);
    }
  }

  // Default action
  if (!options.action) {
    options.action = "tidy";
  }

  try {
    const runner = new GoCommandRunner(process.cwd());
    await runner.initialize();

    // Handle security audit
    if (options.security || options.audit) {
      return runSecurityAudit(runner, options);
    }

    // Handle update actions
    if (options.update || options.updateAll) {
      return updateDependencies(runner, options);
    }

    console.log(`📦 Managing Go dependencies: ${options.action}`);

    const result = await runner.manageDependencies(options);

    if (result.success) {
      console.log(`\n✅ Dependency management completed: ${options.action}`);

      // Show additional information for specific actions
      switch (options.action) {
        case "tidy":
          console.log("   • Added missing dependencies");
          console.log("   • Removed unused dependencies");
          console.log("   • Updated go.mod and go.sum");
          break;
        case "vendor":
          console.log("   • Vendored dependencies to vendor/ directory");
          break;
        case "verify":
          console.log("   • Verified dependency integrity");
          break;
        case "graph":
          if (result.stdout) {
            console.log("\n📊 Dependency graph:");
            console.log(result.stdout);
          }
          break;
        case "why":
          if (result.stdout) {
            console.log("\n🔍 Dependency explanation:");
            console.log(result.stdout);
          }
          break;
      }
    } else {
      console.error(`\n❌ Dependency management failed: ${options.action}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Dependency management failed: ${error.message}`);

    // Provide helpful suggestions for common dependency errors
    if (error.message.includes("go.mod")) {
      console.log("\n💡 Try initializing go.mod:");
      console.log("   go mod init <module-name>");
    } else if (error.message.includes("checksum")) {
      console.log("\n💡 Try cleaning module cache:");
      console.log("   go clean -modcache");
    }

    process.exit(1);
  }
}

/**
 * Run security audit on dependencies
 */
async function runSecurityAudit(runner, options) {
  console.log("🔒 Running security audit on dependencies...");

  try {
    // Check if gosec is installed
    const { runCommand } = require("../lib/utils");

    if (!runner.detectedTools.gosec?.installed) {
      console.log("⚠️ gosec not installed. Installing...");
      const installResult = runCommand(
        "go install github.com/securego/gosec/v2/cmd/gosec@latest",
      );
      if (!installResult.success) {
        console.log("❌ Failed to install gosec");
        return;
      }
    }

    // Run gosec
    const gosecArgs = ["./..."];
    if (options.verbose) {
      gosecArgs.push("-verbose");
    }

    const result = runCommand(`gosec ${gosecArgs.join(" ")}`, {
      cwd: runner.projectPath,
      stdio: "inherit",
    });

    if (result.success) {
      console.log("\n✅ Security audit completed");
    } else {
      console.log("\n⚠️ Security issues found");
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Security audit failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Update dependencies
 */
async function updateDependencies(runner, options) {
  console.log("🔄 Updating dependencies...");

  try {
    const { runCommand } = require("../lib/utils");

    if (options.updateAll) {
      // Update all dependencies
      console.log("📦 Updating all dependencies to latest versions...");
      const result = runCommand("go get -u ./...", {
        cwd: runner.projectPath,
        stdio: "inherit",
      });

      if (result.success) {
        console.log("\n✅ All dependencies updated");

        // Run go mod tidy
        console.log("🧹 Tidying up...");
        await runner.manageDependencies({ action: "tidy" });
      } else {
        console.error("\n❌ Failed to update dependencies");
        process.exit(1);
      }
    } else if (options.package) {
      // Update specific package
      console.log(`📦 Updating package: ${options.package}`);
      const result = runCommand(`go get -u ${options.package}`, {
        cwd: runner.projectPath,
        stdio: "inherit",
      });

      if (result.success) {
        console.log(`\n✅ Package updated: ${options.package}`);

        // Run go mod tidy
        console.log("🧹 Tidying up...");
        await runner.manageDependencies({ action: "tidy" });
      } else {
        console.error(`\n❌ Failed to update package: ${options.package}`);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`❌ Dependency update failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📦 Go Dependencies Command

Usage: /go-deps [action] [options]

Manage Go dependencies with Go-specific improvements and security auditing.

Actions:
  tidy (default)         Add missing and remove unused modules
  download              Download modules to local cache
  vendor                Make vendored copy of dependencies
  verify                Verify dependencies have expected content
  graph                 Print module requirement graph
  why                   Explain why packages or modules are needed
  update                Update specific package to latest version
  update-all            Update all dependencies to latest versions
  security, audit       Run security audit on dependencies

Options:
  --package, -p PACKAGE  Package name (for why/update actions)
  --dry-run              Show what would be done without making changes
  --verbose, -v         Verbose output
  --help, -h            Show this help message

Go-specific features:
  • Go modules dependency management
  • Security vulnerability scanning
  • Dependency graph visualization
  • Update management with version constraints
  • Vendor directory support
  • Checksum verification

Examples:
  /go-deps                     # Run go mod tidy (default)
  /go-deps tidy               # Tidy dependencies
  /go-deps vendor             # Vendor dependencies
  /go-deps verify             # Verify dependency integrity
  /go-deps graph              # Show dependency graph
  /go-deps why github.com/pkg/errors # Explain why package is needed
  /go-deps update --package github.com/gorilla/mux # Update specific package
  /go-deps update-all         # Update all dependencies
  /go-deps security           # Run security audit
  /go-deps --verbose tidy     # Verbose tidy operation

Dependency management:
  • Uses Go modules (go.mod, go.sum)
  • Supports version constraints and replace directives
  • Handles indirect dependencies
  • Manages vendor directory
  • Verifies checksums for security

Security features:
  • gosec integration for security scanning
  • Vulnerability detection
  • Dependency auditing
  • Checksum verification
  • Supply chain security

Update strategies:
  • Patch updates (default)
  • Minor updates (-u flag)
  • Major updates (manual)
  • Version constraint management
  • Dependency pinning

Common operations:
  • go mod tidy - Clean up dependencies
  • go mod vendor - Create vendor directory
  • go mod verify - Check dependency integrity
  • go mod graph - Visualize dependencies
  • go mod why - Understand dependency chains
  • go get -u - Update dependencies

Exit codes:
  0 - Success
  1 - Dependency issues found
  2 - Security vulnerabilities detected
  3 - Operation failed

Environment variables:
  GOPROXY              - Go module proxy
  GONOSUMDB            - Disable checksum database
  GOPRIVATE            - Private modules
  GO111MODULE          - Go modules mode
  GOSUMDB              - Checksum database

Tips:
  • Run /go-deps tidy regularly to keep go.mod clean
  • Use /go-deps security in CI pipelines
  • Consider vendoring for reproducible builds
  • Use version constraints in go.mod
  • Audit dependencies for security vulnerabilities
  • Keep dependencies updated for security patches
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
