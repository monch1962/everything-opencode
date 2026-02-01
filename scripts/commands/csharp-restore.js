#!/usr/bin/env node
/**
 * C#/.NET Restore Command
 *
 * Restore NuGet packages for C#/.NET projects
 */

const CSharpCommandRunner = require('../csharp/command-runner');

async function main() {
  try {
    const projectPath = process.cwd();
    const runner = new CSharpCommandRunner(projectPath);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};

    // Parse options
    const parsedArgs = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--source' || arg === '-s') {
        if (i + 1 < args.length) {
          options.source = args[i + 1];
          parsedArgs.push('--source', args[i + 1]);
          i++;
        }
      } else if (arg === '--runtime' || arg === '-r') {
        if (i + 1 < args.length) {
          options.runtime = args[i + 1];
          parsedArgs.push('--runtime', args[i + 1]);
          i++;
        }
      } else if (arg === '--packages' || arg === '-p') {
        if (i + 1 < args.length) {
          options.packages = args[i + 1];
          parsedArgs.push('--packages', args[i + 1]);
          i++;
        }
      } else if (arg === '--disable-parallel' || arg === '-dp') {
        options.disableParallel = true;
        parsedArgs.push('--disable-parallel');
      } else if (arg === '--no-cache' || arg === '-nc') {
        options.noCache = true;
        parsedArgs.push('--no-cache');
      } else if (arg === '--ignore-failed-sources' || arg === '-ifs') {
        options.ignoreFailedSources = true;
        parsedArgs.push('--ignore-failed-sources');
      } else if (arg === '--force' || arg === '-f') {
        options.force = true;
        parsedArgs.push('--force');
      } else if (arg === '--verbosity' || arg === '-v') {
        if (i + 1 < args.length) {
          options.verbosity = args[i + 1];
          parsedArgs.push('--verbosity', args[i + 1]);
          i++;
        }
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run restore
    await runner.initialize();
    await runner.restore(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Package restore failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /csharp-setup first to configure your project.');
    }

    if (error.message.includes('source') || error.message.includes('feed')) {
      console.log('\n💡 Package source issues');
      console.log('   Check NuGet package sources: dotnet nuget list source');
      console.log('   Add missing package source: dotnet nuget add source <url>');
      console.log('   Use --source flag to specify source');
    }

    if (error.message.includes('version') || error.message.includes('compatible')) {
      console.log('\n💡 Version compatibility issues');
      console.log('   Check package versions in .csproj file');
      console.log('   Update package to compatible version');
      console.log('   Check TargetFramework compatibility');
    }

    if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('\n💡 Network issues');
      console.log('   Check internet connection');
      console.log('   Increase timeout: --timeout 300');
      console.log('   Use local NuGet cache');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📦 C#/.NET Package Restore Command

Usage: /csharp-restore [options]

Options:
  --source, -s <source>           NuGet package source to use
  --runtime, -r <rid>             Target runtime to restore packages for
  --packages, -p <directory>      Directory to restore packages to
  --disable-parallel, -dp         Disable parallel restores
  --no-cache, -nc                 Disable using the HTTP cache
  --ignore-failed-sources, -ifs   Only warn for failed sources instead of erroring
  --force, -f                     Force restore (re-evaluate dependencies)
  --verbosity, -v <level>         Set verbosity level (quiet|minimal|normal|detailed|diagnostic)
  --help, -h                      Show this help message

What Gets Restored:
  • NuGet packages referenced in .csproj files
  • Project-to-project references
  • Tool references (dotnet tools)
  • Package dependencies (transitive dependencies)
  • Framework references

Examples:
  /csharp-restore                          # Restore packages from default sources
  /csharp-restore --source https://api.nuget.org/v3/index.json  # Use specific source
  /csharp-restore --runtime win-x64        # Restore for Windows 64-bit runtime
  /csharp-restore --packages ./packages    # Restore to custom packages directory
  /csharp-restore --disable-parallel       # Disable parallel restoration
  /csharp-restore --no-cache               # Don't use HTTP cache
  /csharp-restore --force                  # Force re-evaluation of dependencies
  /csharp-restore --verbosity detailed     # Show detailed restore output

Common Package Sources:
  • https://api.nuget.org/v3/index.json (NuGet official)
  • https://pkgs.dev.azure.com/... (Azure Artifacts)
  • https://nuget.pkg.github.com/... (GitHub Packages)
  • Local directory or network share

When to Restore:
  • After cloning a repository
  • After adding new packages
  • After updating package versions
  • When experiencing build errors
  • When switching branches with different dependencies
  • Before building or running tests

For Multi-Project Solutions:
  • Restore all projects: dotnet restore
  • Restore specific project: dotnet restore MyProject.csproj
  • Restore solution: dotnet restore MySolution.sln

NuGet Cache Management:
  • List cache locations: dotnet nuget locals all --list
  • Clear HTTP cache: dotnet nuget locals http-cache --clear
  • Clear global packages: dotnet nuget locals global-packages --clear
  • Clear temp cache: dotnet nuget locals temp --clear
  • Clear all caches: dotnet nuget locals all --clear

Configuration:
  • Configure package sources in nuget.config
  • Set default package directory in nuget.config
  • Configure credentials for private feeds
  • Use API keys for authenticated feeds

Advanced Options:
  • Use --configfile to specify custom nuget.config
  • Use --interactive for interactive authentication
  • Use --use-lock-file to use package lock files
  • Use --locked-mode for deterministic restore

Troubleshooting:
  • Check nuget.config for correct sources
  • Verify internet connectivity
  • Check firewall settings for NuGet feeds
  • Clear NuGet cache if experiencing issues
  • Check package version compatibility

Integration with CI/CD:
  • Always restore before build in pipelines
  • Use cached packages directory for speed
  • Configure private feed authentication
  • Use package lock files for deterministic builds
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
