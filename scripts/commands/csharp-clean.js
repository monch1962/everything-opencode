#!/usr/bin/env node
/**
 * C#/.NET Clean Command
 *
 * Clean build artifacts for C#/.NET projects
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
      } else if (arg === '--verbosity' || arg === '-v') {
        if (i + 1 < args.length) {
          options.verbosity = args[i + 1];
          parsedArgs.push('--verbosity', args[i + 1]);
          i++;
        }
      } else if (arg === '--force' || arg === '-F') {
        options.force = true;
        parsedArgs.push('--force');
      } else if (arg === '--all' || arg === '-a') {
        options.all = true;
        parsedArgs.push('--verbosity', 'detailed');
      } else if (arg === '--deps' || arg === '-d') {
        options.deps = true;
        parsedArgs.push('--force');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run clean
    await runner.initialize();
    await runner.clean(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Clean failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /csharp-setup first to configure your project.');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧹 C#/.NET Clean Command

Usage: /csharp-clean [options]

Options:
  --configuration, -c <config>  Clean specific configuration (Debug|Release|All) [default: All]
  --framework, -f <framework>   Clean specific framework (net6.0, net7.0, net8.0, etc.)
  --verbosity, -v <level>       Set verbosity level (quiet|minimal|normal|detailed|diagnostic)
  --force, -F                   Force clean (remove all intermediate files)
  --all, -a                     Clean all configurations and frameworks (detailed output)
  --deps, -d                    Clean dependencies (force clean)
  --help, -h                    Show this help message

What Gets Cleaned:
  • bin/ directories (compiled assemblies, executables)
  • obj/ directories (intermediate build files)
  • TestResults/ directories (test output)
  • publish/ directories (published output)
  • coverage/ directories (test coverage reports)
  • *.user files (user-specific settings)
  • *.suo files (solution user options)

Examples:
  /csharp-clean                          # Clean default configuration
  /csharp-clean --configuration Debug    # Clean Debug configuration only
  /csharp-clean --framework net8.0       # Clean specific framework
  /csharp-clean --force                  # Force clean (remove all intermediate files)
  /csharp-clean --all                    # Clean all configurations and frameworks
  /csharp-clean --deps                   # Clean dependencies
  /csharp-clean --verbosity detailed     # Show detailed cleaning output

Common Clean Scenarios:
  • Before committing code
  • After changing build configurations
  • When experiencing build issues
  • Before creating a release
  • When disk space is limited

Configuration-Specific Cleaning:
  Debug     - Development build artifacts
  Release   - Production build artifacts
  All       - All build configurations (default)

For Multi-Project Solutions:
  • Clean all projects: dotnet clean
  • Clean specific project: dotnet clean MyProject.csproj
  • Clean solution: dotnet clean MySolution.sln

Manual Cleanup (if automatic fails):
  • Delete bin/ and obj/ directories manually
  • Clear NuGet cache: dotnet nuget locals all --clear
  • Delete .vs/ directory (Visual Studio cache)
  • Delete TestResults/ directory

Advanced Options:
  • Use --nologo to suppress copyright banner
  • Use --interactive for interactive authentication
  • Use MSBuild properties: /p:Property=Value

Integration with Build Process:
  • Clean before rebuild for fresh build
  • Clean between configuration switches
  • Clean before publishing to ensure clean output
  • Consider adding clean step to CI/CD pipeline

Disk Space Considerations:
  • Build artifacts can consume significant disk space
  • Regular cleaning helps maintain disk space
  • Consider excluding from version control (add to .gitignore):
      bin/
      obj/
      TestResults/
      publish/
      coverage/
      *.user
      *.suo
      .vs/
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
