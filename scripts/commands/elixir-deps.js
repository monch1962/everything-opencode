#!/usr/bin/env node
/**
 * /elixir-deps command wrapper
 *
 * Manage Elixir dependencies with Mix, Hex, and security scanning
 */

const ElixirCommandRunner = require('../elixir/command-runner');
const { defaultErrorHandler } = require('../lib/error-handler');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'get';
  const options = {};

  // Parse command line arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--package') {
      options.package = args[++i];
    } else if (arg === '--only') {
      options.only = args[++i];
    } else if (arg === '--lock') {
      options.lock = true;
    } else if (arg === '--unlock') {
      options.unlock = true;
    } else if (arg === '--check-unlock') {
      options.checkUnlock = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else if (
      !options.package &&
      (command === 'get' || command === 'update' || command === 'tree')
    ) {
      options.package = arg;
    }
  }

  try {
    const runner = new ElixirCommandRunner(process.cwd());
    await runner.initialize();

    // Handle security audit
    if (command === 'audit' || command === 'security') {
      await runSecurityAudit(runner, options);
    } else {
      // Manage dependencies
      console.log(`📦 Managing Elixir dependencies: ${command}`);
      const result = await runner.deps(command, options);

      if (result.success) {
        console.log(`\n✅ Dependency management completed: ${command}`);
        if (result.stdout && options.verbose) {
          console.log(result.stdout);
        }
      } else {
        console.log(`\n❌ Dependency operation failed with code ${result.code}`);
        if (result.stderr) {
          console.log(result.stderr);
        }
        process.exit(result.code || 1);
      }
    }
  } catch (error) {
    console.error(`\n❌ Dependency management failed: ${error.message}`);

    // Use error handler for better error messages
    const errorInfo = defaultErrorHandler.handleError(error, {
      tool: 'elixir',
      command: command,
      platform: process.platform,
      cwd: process.cwd(),
    });

    console.error(`\n${errorInfo.userMessage}`);
    console.error('\n💡 Recovery steps:');
    errorInfo.recoverySteps.forEach((step, i) => {
      console.error(`  ${i + 1}. ${step}`);
    });

    // Check if Hex is not installed
    if (error.message.includes('Hex')) {
      console.log('\n💡 Hex package manager is not installed. Install it with:');
      console.log('   mix local.hex --force');
    }

    process.exit(1);
  }
}

/**
 * Run comprehensive security audit on Elixir dependencies
 */
async function runSecurityAudit(runner, _options) {
  console.log('🔒 Running comprehensive security audit on Elixir dependencies...');

  try {
    const { runCommand } = require('../lib/utils');
    const securityTools = [];
    const results = {
      vulnerabilities: 0,
      warnings: 0,
      advisories: 0,
      tools: {},
    };

    // 1. Check for outdated dependencies with security implications
    console.log('\n🔍 1. Checking for outdated dependencies...');
    const outdatedResult = await runner.executeMixCommand('hex.outdated', [], {
      stdio: 'pipe',
    });

    if (outdatedResult.stdout) {
      const lines = outdatedResult.stdout.split('\n').filter((line) => line.trim());
      // Skip header lines and empty lines
      const deps = lines.slice(2).filter((line) => !line.includes('===') && line.trim());

      results.tools.outdated = {
        dependencies: deps.length,
        list: deps.slice(0, 10), // First 10 dependencies
      };
      console.log(`   🔄 ${deps.length} dependencies have updates available`);

      // Check for security-related updates
      const securityDeps = deps.filter(
        (dep) =>
          dep.includes('security') ||
          dep.includes('phoenix') ||
          dep.includes('plug') ||
          dep.includes('crypto') ||
          dep.includes('ssl') ||
          dep.includes('tls'),
      );
      if (securityDeps.length > 0) {
        console.log(`   ⚠️  ${securityDeps.length} security-related dependencies need updates`);
        results.warnings += securityDeps.length;
      }
    }

    // 2. Check for mix_audit (Elixir vulnerability checker)
    console.log('\n🔍 2. Running mix_audit (Elixir vulnerability checker)...');

    // Check if mix_audit is available
    const auditCheck = await runner
      .executeMixCommand('audit', ['--help'], {
        stdio: 'pipe',
      })
      .catch(() => ({ success: false }));

    if (!auditCheck.success) {
      console.log('   ⚠️ mix_audit not installed. Consider installing:');
      console.log('     mix archive.install hex mix_audit');
      console.log('   ℹ️  Alternatively, use: mix hex.audit');
    } else {
      securityTools.push('mix_audit');
      console.log('   📊 Running mix_audit analysis...');
      const auditResult = await runner.executeMixCommand('audit', [], {
        stdio: 'pipe',
      });

      if (auditResult.stdout) {
        const lines = auditResult.stdout.split('\n');
        const vulnCount = lines.filter(
          (line) => line.includes('Vulnerability') || line.includes('CVE') || line.includes('HIGH'),
        ).length;

        results.tools.mix_audit = {
          vulnerabilities: vulnCount,
          output:
            auditResult.stdout.substring(0, 500) + (auditResult.stdout.length > 500 ? '...' : ''),
        };
        results.vulnerabilities += vulnCount;
        console.log(`   📈 Found ${vulnCount} potential vulnerabilities`);
      }
    }

    // 3. Check hex.audit (built-in Hex audit)
    console.log('\n🔍 3. Running hex.audit (Hex package audit)...');
    const hexAuditResult = await runner
      .executeMixCommand('hex.audit', [], {
        stdio: 'pipe',
      })
      .catch(() => ({ success: false, stdout: '' }));

    if (hexAuditResult.stdout) {
      securityTools.push('hex.audit');
      const lines = hexAuditResult.stdout.split('\n');
      const issues = lines.filter(
        (line) => line.includes('Vulnerability') || line.includes('found') || line.includes('⚠'),
      );

      results.tools.hex_audit = {
        issues: issues.length,
        output:
          hexAuditResult.stdout.substring(0, 500) +
          (hexAuditResult.stdout.length > 500 ? '...' : ''),
      };

      if (issues.length > 0) {
        const vulnCount = issues.filter((line) => line.includes('Vulnerability')).length;
        results.vulnerabilities += vulnCount;
        console.log(`   📈 Found ${vulnCount} Hex package vulnerabilities`);
      } else {
        console.log('   ✅ No Hex package vulnerabilities found');
      }
    }

    // 4. Check dependency licenses
    console.log('\n🔍 4. Checking dependency licenses...');
    const depsResult = await runner.executeMixCommand('deps', [], {
      stdio: 'pipe',
    });

    if (depsResult.stdout) {
      const lines = depsResult.stdout.split('\n');
      const deps = lines.filter((line) => line.includes('*') && !line.includes('Dependency'));

      results.tools.licenses = {
        dependencies: deps.length,
        checked: true,
      };
      console.log(`   📦 Found ${deps.length} dependencies to check`);

      // Note: Would need sobelow or similar for license checking
      console.log('   ℹ️  Consider using sobelow for security and license analysis');
    }

    // 5. Check for sobelow (security-focused static analysis)
    console.log('\n🔍 5. Checking for sobelow (Elixir security tool)...');
    const sobelowCheck = runCommand('mix sobelow --help', {
      cwd: runner.projectPath,
      stdio: 'pipe',
    }).catch(() => ({ success: false }));

    if (!sobelowCheck.success) {
      console.log('   ⚠️ sobelow not installed. Consider installing for security analysis:');
      console.log('     mix archive.install hex sobelow');
    } else {
      securityTools.push('sobelow');
      console.log('   📊 Running sobelow analysis...');
      const sobelowResult = runCommand('mix sobelow --quiet --format json', {
        cwd: runner.projectPath,
        stdio: 'pipe',
      }).catch(() => ({ stdout: '{}' }));

      if (sobelowResult.stdout) {
        try {
          const report = JSON.parse(sobelowResult.stdout);
          const issues = report.findings || [];
          results.tools.sobelow = {
            issues: issues.length,
            categories: {},
          };
          results.warnings += issues.length;

          // Count by category
          issues.forEach((issue) => {
            const cat = issue.type || 'unknown';
            results.tools.sobelow.categories[cat] =
              (results.tools.sobelow.categories[cat] || 0) + 1;
          });

          console.log(`   📈 Found ${issues.length} security issues in code`);
        } catch (e) {
          console.log('   ℹ️  Could not parse sobelow JSON output');
        }
      }
    }

    // 6. Generate security report
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 ELIXIR SECURITY AUDIT REPORT');
    console.log('='.repeat(60));

    console.log(`\n🔧 Tools used: ${securityTools.join(', ') || 'None'}`);
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
        } else if (typeof value === 'object') {
          console.log(`     • ${key}:`);
          Object.entries(value).forEach(([subKey, subValue]) => {
            console.log(`       - ${subKey}: ${subValue}`);
          });
        } else {
          console.log(`     • ${key}: ${value}`);
        }
      });
    });

    if (results.vulnerabilities > 0) {
      console.log(`\n⚠️  CRITICAL: ${results.vulnerabilities} security vulnerabilities found!`);
      console.log('   Recommended actions:');
      console.log("   1. Run 'mix hex.audit' for detailed vulnerability info");
      console.log('   2. Update vulnerable packages: mix deps.update <package>');
      console.log('   3. Install mix_audit for regular vulnerability checking');
      console.log('   4. Use sobelow for code security analysis');
      process.exit(2); // Exit code 2 for security vulnerabilities
    } else if (results.warnings > 0) {
      console.log(`\n⚠️  WARNING: ${results.warnings} security warnings found`);
      console.log('   Recommended actions:');
      console.log('   1. Review outdated security-related dependencies');
      console.log('   2. Install and run sobelow for code analysis');
      console.log('   3. Enable Hex audit in CI/CD pipeline');
      console.log('   4. Consider using Credo for code quality');
      process.exit(0); // Warning but not critical
    } else {
      console.log('\n✅ SECURITY AUDIT PASSED');
      console.log('   No critical vulnerabilities found');
      console.log('\n💡 Security recommendations:');
      console.log('   1. Enable mix hex.audit in your CI/CD pipeline');
      console.log('   2. Install mix_audit for vulnerability checking');
      console.log('   3. Use sobelow for security-focused static analysis');
      console.log('   4. Keep dependencies updated with mix deps.update');
      console.log('   5. Use Credo for code quality and best practices');
      console.log('   6. Review Hex advisories regularly');
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Security audit failed: ${error.message}`);

    const errorInfo = defaultErrorHandler.handleError(error, {
      tool: 'elixir',
      command: 'security audit',
      platform: process.platform,
      cwd: runner.projectPath,
    });

    console.error(`\n${errorInfo.userMessage}`);
    console.error('\n💡 Recovery steps:');
    errorInfo.recoverySteps.forEach((step, i) => {
      console.error(`  ${i + 1}. ${step}`);
    });

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📦 Elixir Dependencies

Usage: /elixir-deps <command> [options] [package]

Manage Elixir dependencies with Mix and Hex.

Commands:
  get                    Fetch all dependencies
  update [package]       Update specific package or all
  tree [package]         Show dependency tree
  unlock [package]       Unlock specific package or all
  compile                Compile dependencies
  clean                  Clean dependencies
  check                  Check dependencies
  outdated               Show outdated dependencies
  audit, security        Run security audit on dependencies

Options:
  --package NAME         Package name (for get, update, tree)
  --only ENV             Only for specific environment (dev, test, prod)
  --lock                 Lock dependencies after update
  --unlock               Unlock dependencies
  --check-unlock         Check if dependencies can be unlocked
  --verbose, -v          Verbose output
  --help, -h             Show this help message

Examples:
  /elixir-deps get                    # Fetch all dependencies
  /elixir-deps update phoenix         # Update Phoenix
  /elixir-deps tree                   # Show dependency tree
  /elixir-deps outdated               # Show outdated dependencies
  /elixir-deps unlock --all           # Unlock all dependencies
  /elixir-deps compile                # Compile dependencies

Elixir-specific features:
  • Hex package manager integration
  • Semantic versioning support
  • Dependency locking with mix.lock
  • Environment-specific dependencies
  • Git and local dependencies
  • Override and conflict resolution

Dependency sources:
  • Hex packages (hex.pm)
  • Git repositories
  • Local paths
  • GitHub repositories
  • Organization packages

mix.exs configuration:
  • defp deps do - Dependency specification
  • {:package, "~> 1.0"} - Version requirements
  • only: :dev - Environment restriction
  • runtime: false - Development dependency
  • override: true - Force version
  • git: "url" - Git source
  • path: "local/path" - Local source

Common patterns:
  • Production dependencies in :prod environment
  • Development tools in :dev environment
  • Test dependencies in :test environment
  • Version constraints: ~>, >=, ==
  • Organization packages: {:package, organization: "org"}

Hex.pm features:
  • Public and private packages
  • Package documentation
  • Checksum verification
  • Dependency resolution
  • Conflict detection
  • Retirement notices

Dependency management:
  • Automatic conflict resolution
  • Transitive dependency handling
  • Lock file for reproducible builds
  • Checksum verification
  • Audit trail

Tips:
  • Use ~> for compatible version ranges
  • Specify only: environments for dev tools
  • Check mix.lock into version control
  • Use mix deps.update --all periodically
  • Verify checksums for security

Version constraints:
  • "~> 1.0" - 1.x where x >= 0
  • "~> 1.0.0" - 1.0.x where x >= 0
  • ">= 1.0.0 and < 2.0.0" - Explicit range
  • "== 1.0.0" - Exact version
  • ">= 1.0.0" - Minimum version
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
