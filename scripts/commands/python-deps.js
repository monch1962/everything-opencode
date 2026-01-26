#!/usr/bin/env node
/**
 * /python-deps command wrapper
 *
 * Manage Python dependencies with security scanning and vulnerability detection
 */

const path = require("path");
const fs = require("fs");
const PythonCommandRunner = require("./python-command-runner");
const { defaultErrorHandler } = require("../lib/error-handler");

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const packages = [];
  const options = {};

  // Parse command line arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--dev" || arg === "-d") {
      options.dev = true;
    } else if (arg === "--optional" || arg === "-o") {
      options.optional = true;
    } else if (arg === "--extras") {
      options.extras = args[++i];
    } else if (arg === "--group") {
      options.group = args[++i];
    } else if (arg === "--python") {
      options.python = args[++i];
    } else if (arg === "--no-dev") {
      options.noDev = true;
    } else if (arg === "--no-optional") {
      options.noOptional = true;
    } else if (arg === "--only") {
      options.only = args[++i];
    } else if (arg === "--frozen") {
      options.frozen = true;
    } else if (arg === "--upgrade" || arg === "-U") {
      options.upgrade = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--quiet" || arg === "-q") {
      options.quiet = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--tree" || arg === "-t") {
      options.tree = true;
    } else if (arg === "--outdated") {
      options.outdated = true;
    } else if (arg === "--manager") {
      options.manager = args[++i];
    } else if (arg === "--file") {
      options.file = args[++i];
    } else if (arg === "--no-lock") {
      options.noLock = true;
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      packages.push(arg);
    }
  }

  // Validate command
  const validCommands = [
    "install",
    "add",
    "remove",
    "update",
    "list",
    "sync",
    "lock",
    "check",
    "audit",
  ];
  if (!validCommands.includes(command)) {
    console.error(`Invalid command: ${command}`);
    showHelp();
    process.exit(1);
  }

  try {
    const runner = new PythonCommandRunner();

    // Handle security audit separately
    if (command === "audit") {
      await runSecurityAudit(runner, options);
    } else {
      await runner.manageDependencies(command, packages, options);

      // Success messages
      const successMessages = {
        install: "Dependencies installed successfully",
        add: "Dependency added successfully",
        remove: "Dependency removed successfully",
        update: "Dependencies updated successfully",
        list: "",
        sync: "Dependencies synced successfully",
        lock: "Lock file generated successfully",
        check: "Dependency check completed",
        audit: "Security audit completed",
      };

      if (successMessages[command]) {
        console.log(`\n✅ ${successMessages[command]}`);
      }
    }
  } catch (error) {
    console.error(`\n❌ Dependency management failed: ${error.message}`);

    // Use error handler for better error messages
    const errorInfo = defaultErrorHandler.handleError(error, {
      tool: "python",
      command: command,
      platform: process.platform,
      cwd: process.cwd(),
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
 * Run comprehensive security audit on Python dependencies
 */
async function runSecurityAudit(runner, options) {
  console.log(
    "🔒 Running comprehensive security audit on Python dependencies...",
  );

  try {
    const { runCommand, commandExists } = require("../lib/utils");
    const securityTools = [];
    const results = {
      vulnerabilities: 0,
      warnings: 0,
      advisories: 0,
      tools: {},
    };

    // Get Python executable
    const python = runner.getPythonExecutable();

    // 1. Check for safety (vulnerability scanner)
    console.log("\n🔍 1. Running safety (Python vulnerability scanner)...");
    if (!commandExists("safety")) {
      console.log("   ⚠️ safety not installed. Installing...");
      const installResult = runCommand(`${python} -m pip install safety`);
      if (!installResult.success) {
        console.log("   ❌ Failed to install safety");
      } else {
        console.log("   ✅ safety installed successfully");
      }
    }

    if (commandExists("safety")) {
      securityTools.push("safety");
      console.log("   📊 Running safety analysis...");

      // First generate requirements.txt if it doesn't exist
      const reqFile = path.join(runner.projectPath, "requirements.txt");
      if (!fs.existsSync(reqFile)) {
        console.log("   ℹ️  Generating requirements.txt...");
        const freezeResult = runCommand(`${python} -m pip freeze`, {
          cwd: runner.projectPath,
          stdio: "pipe",
        });
        if (freezeResult.stdout) {
          fs.writeFileSync(reqFile, freezeResult.stdout);
          console.log("   ✅ requirements.txt generated");
        }
      }

      if (fs.existsSync(reqFile)) {
        const safetyResult = runCommand(`safety check -r ${reqFile} --json`, {
          cwd: runner.projectPath,
          stdio: "pipe",
        });

        if (safetyResult.stdout) {
          try {
            const report = JSON.parse(safetyResult.stdout);
            results.tools.safety = {
              vulnerabilities: report.vulnerabilities?.length || 0,
              scanned: report.scanned_packages || 0,
            };
            results.vulnerabilities += report.vulnerabilities?.length || 0;
            console.log(
              `   📈 Found ${report.vulnerabilities?.length || 0} security vulnerabilities`,
            );

            // Show critical vulnerabilities
            if (report.vulnerabilities && report.vulnerabilities.length > 0) {
              const critical = report.vulnerabilities.filter(
                (v) => v.severity === "CRITICAL",
              );
              const high = report.vulnerabilities.filter(
                (v) => v.severity === "HIGH",
              );
              if (critical.length > 0 || high.length > 0) {
                console.log(
                  `   ⚠️  Critical/High: ${critical.length} critical, ${high.length} high severity`,
                );
              }
            }
          } catch (e) {
            console.log("   ℹ️  Could not parse safety JSON output");
          }
        }
      }
    }

    // 2. Check for bandit (security linter)
    console.log("\n🔍 2. Running bandit (security linter)...");
    if (!commandExists("bandit")) {
      console.log("   ⚠️ bandit not installed. Installing...");
      const installResult = runCommand(`${python} -m pip install bandit`);
      if (!installResult.success) {
        console.log("   ❌ Failed to install bandit");
      } else {
        console.log("   ✅ bandit installed successfully");
      }
    }

    if (commandExists("bandit")) {
      securityTools.push("bandit");
      console.log("   📊 Running bandit analysis...");
      const banditResult = runCommand(
        "bandit -r . -f json -o bandit-report.json",
        {
          cwd: runner.projectPath,
        },
      );

      const banditReport = path.join(runner.projectPath, "bandit-report.json");
      if (fs.existsSync(banditReport)) {
        try {
          const report = JSON.parse(fs.readFileSync(banditReport, "utf8"));
          results.tools.bandit = {
            issues: report.metrics?.total_issues || 0,
            confidence_high: report.metrics?.CONFIDENCE.HIGH || 0,
            severity_high: report.metrics?.SEVERITY.HIGH || 0,
          };
          results.warnings += report.metrics?.total_issues || 0;
          console.log(
            `   📈 Found ${report.metrics?.total_issues || 0} security issues in code`,
          );

          // Clean up report file
          fs.unlinkSync(banditReport);
        } catch (e) {
          console.log("   ℹ️  Could not parse bandit report");
        }
      }
    }

    // 3. Check for pip-audit (vulnerability checker)
    console.log("\n🔍 3. Running pip-audit (Python vulnerability checker)...");
    if (!commandExists("pip-audit")) {
      console.log("   ⚠️ pip-audit not installed. Installing...");
      const installResult = runCommand(`${python} -m pip install pip-audit`);
      if (!installResult.success) {
        console.log("   ❌ Failed to install pip-audit");
      } else {
        console.log("   ✅ pip-audit installed successfully");
      }
    }

    if (commandExists("pip-audit")) {
      securityTools.push("pip-audit");
      console.log("   📊 Running pip-audit analysis...");
      const auditResult = runCommand("pip-audit --desc --json", {
        cwd: runner.projectPath,
        stdio: "pipe",
      });

      if (auditResult.stdout) {
        try {
          const report = JSON.parse(auditResult.stdout);
          results.tools.pipAudit = {
            vulnerabilities: report.vulnerabilities?.length || 0,
            dependencies: report.dependencies?.length || 0,
          };
          results.vulnerabilities += report.vulnerabilities?.length || 0;
          console.log(
            `   📈 Found ${report.vulnerabilities?.length || 0} package vulnerabilities`,
          );
        } catch (e) {
          console.log("   ℹ️  Could not parse pip-audit JSON output");
        }
      }
    }

    // 4. Check for outdated dependencies
    console.log("\n🔍 4. Checking for outdated dependencies...");
    const outdatedResult = runCommand(
      `${python} -m pip list --outdated --format=json`,
      {
        cwd: runner.projectPath,
        stdio: "pipe",
      },
    );

    if (outdatedResult.stdout) {
      try {
        const outdated = JSON.parse(outdatedResult.stdout);
        results.tools.outdated = {
          packages: outdated.length,
          list: outdated.map((p) => p.name).slice(0, 10), // First 10 packages
        };
        console.log(`   🔄 ${outdated.length} packages have updates available`);

        // Check for security-related updates
        const securityPackages = outdated.filter(
          (p) =>
            p.latest_version &&
            p.version &&
            (p.latest_version.split(".")[0] > p.version.split(".")[0] || // Major version bump
              p.name.includes("security") ||
              p.name.includes("auth") ||
              p.name.includes("crypto") ||
              p.name.includes("ssl")),
        );
        if (securityPackages.length > 0) {
          console.log(
            `   ⚠️  ${securityPackages.length} security-related packages need updates`,
          );
          results.warnings += securityPackages.length;
        }
      } catch (e) {
        console.log("   ℹ️  Could not parse outdated packages list");
      }
    }

    // 5. Generate security report
    console.log("\n" + "=".repeat(60));
    console.log("📊 PYTHON SECURITY AUDIT REPORT");
    console.log("=".repeat(60));

    console.log(`\n🔧 Tools used: ${securityTools.join(", ") || "None"}`);
    console.log(`\n📈 Summary:`);
    console.log(`   • Package vulnerabilities: ${results.vulnerabilities}`);
    console.log(`   • Code security issues: ${results.warnings}`);
    console.log(`   • Security advisories: ${results.advisories}`);

    // Show tool-specific results
    Object.entries(results.tools).forEach(([tool, data]) => {
      console.log(`\n   ${tool}:`);
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          console.log(`     • ${key}: ${value.length} items`);
        } else {
          console.log(`     • ${key}: ${value}`);
        }
      });
    });

    if (results.vulnerabilities > 0) {
      console.log(
        `\n⚠️  CRITICAL: ${results.vulnerabilities} security vulnerabilities found in packages!`,
      );
      console.log("   Recommended actions:");
      console.log("   1. Run 'pip-audit' to see specific vulnerabilities");
      console.log("   2. Update vulnerable packages: pip install -U <package>");
      console.log("   3. Use safety check in CI/CD pipeline");
      console.log("   4. Consider using pip-tools for dependency pinning");
      process.exit(2); // Exit code 2 for security vulnerabilities
    } else if (results.warnings > 0) {
      console.log(`\n⚠️  WARNING: ${results.warnings} security warnings found`);
      console.log("   Recommended actions:");
      console.log("   1. Review bandit findings in your code");
      console.log("   2. Update outdated security-related packages");
      console.log("   3. Enable Dependabot for Python");
      console.log("   4. Use virtual environments for isolation");
      process.exit(0); // Warning but not critical
    } else {
      console.log("\n✅ SECURITY AUDIT PASSED");
      console.log("   No critical vulnerabilities found");
      console.log("\n💡 Security recommendations:");
      console.log("   1. Enable GitHub Dependabot for Python");
      console.log("   2. Add safety/pip-audit to CI/CD pipeline");
      console.log("   3. Use virtual environments (venv/conda)");
      console.log("   4. Pin dependencies in requirements.txt");
      console.log("   5. Regularly update dependencies");
      console.log("   6. Use bandit for code security scanning");
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Security audit failed: ${error.message}`);

    const errorInfo = defaultErrorHandler.handleError(error, {
      tool: "python",
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

function showHelp() {
  console.log(`
/python-deps - Manage Python dependencies

Usage:
  /python-deps <command> [packages...] [options]

Commands:
  install [packages...]    Install dependencies
  add <package> [--dev]    Add new dependency
  remove <package>         Remove dependency
  update [packages...]     Update dependencies
  list                     List installed dependencies
  sync                     Sync dependencies with lock file
  lock                     Generate/update lock file
  check                    Check for dependency conflicts
  audit                    Audit dependencies for security vulnerabilities

Options:
  --dev, -d                Development dependency
  --optional, -o           Optional dependency
  --extras <extras>        Package extras
  --group <group>          Dependency group (poetry/uv)
  --python <version>       Python version constraint
  --no-dev                 Don't install development dependencies
  --no-optional            Don't install optional dependencies
  --only <group>           Only install specific group
  --frozen                 Install exact versions from lock file
  --upgrade, -U            Upgrade existing packages
  --verbose, -v            Verbose output
  --quiet, -q              Minimal output
  --json                   Output JSON format
  --tree, -t               Show dependency tree
  --outdated               Show outdated packages
  --manager <name>         Use specific dependency manager
  --file <path>            Use alternative dependency file
  --no-lock                Don't update lock file
  --help, -h               Show this help

Examples:
  /python-deps install                    # Install all dependencies
  /python-deps add fastapi                # Add new dependency
  /python-deps add pytest --dev           # Add development dependency
  /python-deps update                     # Update all dependencies
  /python-deps update fastapi             # Update specific package
  /python-deps list --tree                # List dependencies as tree
  /python-deps list --outdated            # Show outdated packages
  /python-deps remove old-package         # Remove dependency
  /python-deps sync                       # Sync with lock file
  /python-deps check                      # Check for conflicts
  /python-deps audit                      # Audit for security issues

Configuration:
  Reads from .opencode/project-config.json
  Uses dependencyManager: uv, poetry, pip, or conda
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
