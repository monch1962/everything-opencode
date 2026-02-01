#!/usr/bin/env node
/**
 * /csharp-deps command wrapper
 *
 * Manage C#/.NET dependencies with security scanning and vulnerability detection
 */

const CSharpCommandRunner = require('../csharp/command-runner');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const action = args[0];
  const packages = args.slice(1).filter((arg) => !arg.startsWith('--'));
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--version' || arg === '-v') {
      options.version = args[++i];
    } else if (arg === '--source' || arg === '-s') {
      options.source = args[++i];
    } else if (arg === '--framework' || arg === '-f') {
      options.framework = args[++i];
    } else if (arg === '--prerelease' || arg === '-p') {
      options.prerelease = true;
    } else if (arg === '--no-restore' || arg === '-nr') {
      options.noRestore = true;
    } else if (arg === '--interactive' || arg === '-i') {
      options.interactive = true;
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--outdated' || arg === '-o') {
      options.outdated = true;
    } else if (arg === '--vulnerable' || arg === '-vu') {
      options.vulnerable = true;
    } else if (arg === '--security-scan' || arg === '-ss') {
      options.securityScan = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    const runner = new CSharpCommandRunner();

    console.log(`📦 C#/.NET Dependency Management: ${action}`);

    // Handle special cases
    if (options.outdated && action === 'list') {
      console.log('\n🔍 Checking for outdated packages...');
      await runner.manageDeps('outdated', [], options);
      return;
    }

    if (options.vulnerable && action === 'list') {
      console.log('\n🔒 Checking for vulnerable packages...');
      // This would use the security scanning functionality
      const securityResults = await runner.runSecurityScan({ tool: 'dotnet-list-package' });
      return;
    }

    if (options.securityScan && (action === 'add' || action === 'update')) {
      console.log('\n🔒 Running security scan before/after operation...');
      // Run security scan before
      await runner.runSecurityScan({ tool: 'dotnet-list-package', quiet: true });

      // Perform the action
      await runner.manageDeps(action, packages, options);

      // Run security scan after
      await runner.runSecurityScan({ tool: 'dotnet-list-package', quiet: true });
      return;
    }

    // Normal dependency management
    await runner.manageDeps(action, packages, options);

    console.log(`\n✅ ${action} operation completed successfully`);

    // Show recommendations
    if (action === 'add' || action === 'update') {
      console.log('\n💡 Recommendations:');
      console.log('  • Run tests: /csharp-test');
      console.log('  • Check for vulnerabilities: /csharp-security');
      console.log('  • Build project: /csharp-build');
    }
  } catch (error) {
    console.error(`\n❌ Dependency management failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/csharp-deps - Manage C#/.NET dependencies with security scanning

Usage:
  /csharp-deps <command> [packages...] [options]

Commands:
  add <package...>      Add one or more NuGet packages
  remove <package...>   Remove one or more NuGet packages
  update [package...]   Update packages (all if no packages specified)
  list                  List installed packages
  outdated              Show outdated packages (alias: list --outdated)
  vulnerable            Show vulnerable packages (alias: list --vulnerable)

Options:
  --version, -v <ver>   Package version (for add/update)
  --source, -s <url>    NuGet package source
  --framework, -f <fw>  Target framework
  --prerelease, -p      Allow prerelease packages
  --no-restore, -nr     Don't restore packages after operation
  --interactive, -i     Interactive mode
  --all, -a             Apply to all packages (for update)
  --outdated, -o        Show outdated packages (with list)
  --vulnerable, -vu     Show vulnerable packages (with list)
  --security-scan, -ss  Run security scan before/after operation
  --verbose             Verbose output
  --quiet, -q           Minimal output
  --dry-run, -d         Show what would be done without making changes
  --help, -h            Show this help

Examples:
  # Basic package management
  /csharp-deps add Newtonsoft.Json
  /csharp-deps add Microsoft.EntityFrameworkCore.SqlServer --version 7.0.0
  /csharp-deps remove OldPackage
  /csharp-deps update
  /csharp-deps update Microsoft.AspNetCore.* --all

  # Listing packages
  /csharp-deps list
  /csharp-deps list --outdated
  /csharp-deps list --vulnerable

  # With security scanning
  /csharp-deps add NewPackage --security-scan
  /csharp-deps update --all --security-scan

  # Advanced usage
  /csharp-deps add Package1 Package2 Package3 --source https://api.nuget.org/v3/index.json
  /csharp-deps update --dry-run --verbose
  /csharp-deps remove DeprecatedPackage --no-restore

Security Integration:
  • Automatically checks for vulnerabilities when adding/updating packages
  • Integrates with /csharp-security command
  • Can block installation of known vulnerable packages
  • Provides security recommendations

Configuration:
  Reads from .opencode/project-config.json
  Uses csharpConfig.packageSources for custom NuGet sources
  Can be configured to require security scans for certain operations

Note:
  For production use, consider pinning package versions
  Regularly run /csharp-deps list --outdated to check for updates
  Use /csharp-security regularly for security audits
  Consider using lock files (packages.lock.json) for reproducible builds
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
