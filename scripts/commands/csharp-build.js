#!/usr/bin/env node
/**
 * C#/.NET Build Command
 *
 * Build C#/.NET projects
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

      if (arg === '--configuration' || arg === '-c') {
        if (i + 1 < args.length) {
          options.configuration = args[i + 1];
          parsedArgs.push('--configuration', args[i + 1]);
          i++;
        }
      } else if (arg === '--framework' || arg === '-f') {
        if (i + 1 < args.length) {
          options.framework = args[i + 1];
          parsedArgs.push('--framework', args[i + 1]);
          i++;
        }
      } else if (arg === '--runtime' || arg === '-r') {
        if (i + 1 < args.length) {
          options.runtime = args[i + 1];
          parsedArgs.push('--runtime', args[i + 1]);
          i++;
        }
      } else if (arg === '--output' || arg === '-o') {
        if (i + 1 < args.length) {
          options.output = args[i + 1];
          parsedArgs.push('--output', args[i + 1]);
          i++;
        }
      } else if (arg === '--verbosity' || arg === '-v') {
        if (i + 1 < args.length) {
          options.verbosity = args[i + 1];
          parsedArgs.push('--verbosity', args[i + 1]);
          i++;
        }
      } else if (arg === '--no-restore' || arg === '-nr') {
        options.noRestore = true;
        parsedArgs.push('--no-restore');
      } else if (arg === '--no-dependencies' || arg === '-nd') {
        options.noDependencies = true;
        parsedArgs.push('--no-dependencies');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run build
    await runner.initialize();
    await runner.build(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /csharp-setup first to configure your project.');
    }

    if (error.message.includes('SDK') || error.message.includes('version')) {
      console.log('\n💡 .NET SDK version mismatch');
      console.log('   Check installed SDKs: dotnet --list-sdks');
      console.log('   Update .csproj TargetFramework if needed');
      console.log('   Use global.json to specify SDK version');
    }

    if (error.message.includes('NuGet') || error.message.includes('package')) {
      console.log('\n💡 NuGet package issues');
      console.log('   Restore packages: dotnet restore');
      console.log('   Clear NuGet cache: dotnet nuget locals all --clear');
      console.log('   Check package sources in nuget.config');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔨 C#/.NET Build Command

Usage: /csharp-build [options]

Options:
  --configuration, -c <config>  Build configuration (Debug|Release) [default: Release]
  --framework, -f <framework>   Target framework (net6.0, net7.0, net8.0, etc.)
  --runtime, -r <rid>          Target runtime identifier (win-x64, linux-x64, etc.)
  --output, -o <path>          Output directory for built artifacts
  --verbosity, -v <level>      Set verbosity level (quiet|minimal|normal|detailed|diagnostic)
  --no-restore, -nr            Skip restoring packages before building
  --no-dependencies, -nd       Don't build project-to-project references
  --help, -h                   Show this help message

Common Build Configurations:
  Debug     - For development (includes debug symbols, no optimizations)
  Release   - For production (optimized, no debug symbols)

Examples:
  /csharp-build                    # Build with Release configuration
  /csharp-build --configuration Debug  # Build with Debug configuration
  /csharp-build --framework net8.0     # Build for specific framework
  /csharp-build --runtime win-x64      # Build for Windows 64-bit
  /csharp-build --output ./publish     # Output to specific directory
  /csharp-build --no-restore           # Skip package restore

Supported Project Types:
  • Console Applications
  • ASP.NET Core Web Applications
  • Class Libraries
  • Blazor Applications
  • WPF Applications
  • WinForms Applications
  • Xamarin Applications
  • MAUI Applications

Configuration:
  Run /csharp-setup first to configure your project.
  Add build configurations to .csproj or Directory.Build.props.

For Multi-Project Solutions:
  • Build all projects: dotnet build
  • Build specific project: dotnet build MyProject.csproj
  • Build solution: dotnet build MySolution.sln

Advanced Options:
  • Use MSBuild properties: /p:Property=Value
  • Enable parallel build: /maxcpucount
  • Treat warnings as errors: /warnaserror
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
