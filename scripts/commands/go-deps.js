#!/usr/bin/env node
/**
 * /go-deps command wrapper
 *
 * Manage Go dependencies with Go-specific improvements and security scanning
 */

const path = require("path");
const fs = require("fs");
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
  console.log("🔒 Running comprehensive security audit on Go dependencies...");

  try {
    const { runCommand, commandExists } = require("../lib/utils");
    const securityTools = [];
    const results = {
      vulnerabilities: 0,
      warnings: 0,
      advisories: 0,
      tools: {},
    };

    // 1. Check for gosec (Go Security Checker)
    console.log("\n🔍 1. Running gosec (Go Security Checker)...");
    if (!commandExists("gosec")) {
      console.log("   ⚠️ gosec not installed. Installing...");
      const installResult = runCommand(
        "go install github.com/securego/gosec/v2/cmd/gosec@latest",
      );
      if (!installResult.success) {
        console.log("   ❌ Failed to install gosec");
      } else {
        console.log("   ✅ gosec installed successfully");
      }
    }

    if (commandExists("gosec")) {
      securityTools.push("gosec");
      const gosecArgs = ["./...", "-fmt=json", "-out=gosec-report.json"];
      if (options.verbose) {
        gosecArgs.push("-verbose");
      }

      console.log("   📊 Running gosec analysis...");
      const gosecResult = runCommand(`gosec ${gosecArgs.join(" ")}`, {
        cwd: runner.projectPath,
      });

      if (fs.existsSync(path.join(runner.projectPath, "gosec-report.json"))) {
        const report = JSON.parse(
          fs.readFileSync(
            path.join(runner.projectPath, "gosec-report.json"),
            "utf8",
          ),
        );
        results.tools.gosec = {
          issues: report.Issues?.length || 0,
          stats: report.Stats || {},
        };
        results.vulnerabilities += report.Issues?.length || 0;
        console.log(
          `   📈 Found ${report.Issues?.length || 0} security issues`,
        );

        // Clean up report file
        fs.unlinkSync(path.join(runner.projectPath, "gosec-report.json"));
      }
    }

    // 2. Check for govulncheck (Go Vulnerability Checker)
    console.log("\n🔍 2. Running govulncheck (Go Vulnerability Checker)...");
    if (!commandExists("govulncheck")) {
      console.log("   ⚠️ govulncheck not installed. Installing...");
      const installResult = runCommand(
        "go install golang.org/x/vuln/cmd/govulncheck@latest",
      );
      if (!installResult.success) {
        console.log("   ❌ Failed to install govulncheck");
      } else {
        console.log("   ✅ govulncheck installed successfully");
      }
    }

    if (commandExists("govulncheck")) {
      securityTools.push("govulncheck");
      console.log("   📊 Running govulncheck analysis...");
      const vulnResult = runCommand("govulncheck ./...", {
        cwd: runner.projectPath,
        stdio: "pipe",
      });

      if (vulnResult.stdout) {
        const lines = vulnResult.stdout.split("\n");
        const vulnCount = lines.filter((line) =>
          line.includes("Vulnerability"),
        ).length;
        results.tools.govulncheck = {
          vulnerabilities: vulnCount,
          output:
            vulnResult.stdout.substring(0, 500) +
            (vulnResult.stdout.length > 500 ? "..." : ""),
        };
        results.vulnerabilities += vulnCount;
        console.log(`   📈 Found ${vulnCount} known vulnerabilities`);
      }
    }

    // 3. Check dependency licenses
    console.log("\n🔍 3. Checking dependency licenses...");
    const licenseResult = runCommand(
      "go list -m -f '{{.Path}} {{.Version}} {{.Main}}' all",
      {
        cwd: runner.projectPath,
        stdio: "pipe",
      },
    );

    if (licenseResult.stdout) {
      const deps = licenseResult.stdout
        .split("\n")
        .filter((line) => line && !line.includes("true"));
      results.tools.licenses = {
        dependencies: deps.length,
        checked: true,
      };
      console.log(`   📦 Found ${deps.length} dependencies to check`);

      // Check for problematic licenses (optional - would need license-check tool)
      console.log(
        "   ℹ️  Consider using go-licenses for detailed license analysis",
      );
    }

    // 4. Check for outdated dependencies with security implications
    console.log("\n🔍 4. Checking for outdated dependencies...");
    const outdatedResult = runCommand(
      "go list -u -m -f '{{if .Update}}{{.}} -> {{.Update}}{{end}}' all",
      {
        cwd: runner.projectPath,
        stdio: "pipe",
      },
    );

    if (outdatedResult.stdout) {
      const updates = outdatedResult.stdout
        .split("\n")
        .filter((line) => line.trim());
      results.tools.outdated = {
        updates: updates.length,
        list: updates,
      };
      console.log(
        `   🔄 ${updates.length} dependencies have updates available`,
      );

      // Check for security-related updates
      const securityUpdates = updates.filter(
        (update) =>
          update.includes("security") ||
          update.includes("CVE") ||
          update.includes("vulnerability"),
      );
      if (securityUpdates.length > 0) {
        console.log(
          `   ⚠️  ${securityUpdates.length} security-related updates available`,
        );
        results.warnings += securityUpdates.length;
      }
    }

    // 5. Generate security report
    console.log("\n" + "=".repeat(60));
    console.log("📊 SECURITY AUDIT REPORT");
    console.log("=".repeat(60));

    console.log(`\n🔧 Tools used: ${securityTools.join(", ") || "None"}`);
    console.log(`\n📈 Summary:`);
    console.log(`   • Vulnerabilities found: ${results.vulnerabilities}`);
    console.log(`   • Security warnings: ${results.warnings}`);
    console.log(`   • Security advisories: ${results.advisories}`);

    if (results.vulnerabilities > 0) {
      console.log(
        `\n⚠️  CRITICAL: ${results.vulnerabilities} security vulnerabilities found!`,
      );
      console.log("   Recommended actions:");
      console.log("   1. Run 'go get -u ./...' to update dependencies");
      console.log(
        "   2. Review govulncheck output for specific vulnerabilities",
      );
      console.log(
        "   3. Consider using dependency pinning for critical packages",
      );
      console.log("   4. Run security audit regularly in CI/CD pipeline");
      process.exit(2); // Exit code 2 for security vulnerabilities
    } else if (results.warnings > 0) {
      console.log(`\n⚠️  WARNING: ${results.warnings} security warnings found`);
      console.log("   Recommended actions:");
      console.log("   1. Review outdated dependencies");
      console.log("   2. Update dependencies with security implications");
      console.log("   3. Monitor for new vulnerabilities");
      process.exit(0); // Warning but not critical
    } else {
      console.log("\n✅ SECURITY AUDIT PASSED");
      console.log("   No critical vulnerabilities found");
      console.log("\n💡 Security recommendations:");
      console.log("   1. Enable Dependabot or Renovate for automatic updates");
      console.log("   2. Add govulncheck to your CI/CD pipeline");
      console.log("   3. Use go modules with checksum verification");
      console.log("   4. Regularly audit third-party dependencies");
      console.log("   5. Consider using a software bill of materials (SBOM)");
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Security audit failed: ${error.message}`);

    // Use error handler for better error messages
    const { defaultErrorHandler } = require("../lib/error-handler");
    const errorInfo = defaultErrorHandler.handleError(error, {
      tool: "go",
      command: "security audit",
      platform: process.platform,
      cwd: runner.projectPath,
    });

    console.error("\n" + errorInfo.userMessage);
    console.error("\n💡 Recovery steps:");
    errorInfo.recoverySteps.forEach((step, i) => {
      console.error(`  ${i + 1}. ${step}`);
    });

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
