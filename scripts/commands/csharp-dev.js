#!/usr/bin/env node
/**
 * C#/.NET Development Server Command
 *
 * Start development server for C#/.NET projects
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

      if (arg === '--watch' || arg === '-w') {
        options.watch = true;
        parsedArgs.push('--watch');
      } else if (arg === '--urls' || arg === '-u') {
        if (i + 1 < args.length) {
          options.urls = args[i + 1];
          parsedArgs.push('--urls', args[i + 1]);
          i++;
        }
      } else if (arg === '--environment' || arg === '-e') {
        if (i + 1 < args.length) {
          options.environment = args[i + 1];
          parsedArgs.push('--environment', args[i + 1]);
          i++;
        }
      } else if (arg === '--launch-profile' || arg === '-lp') {
        if (i + 1 < args.length) {
          options.launchProfile = args[i + 1];
          parsedArgs.push('--launch-profile', args[i + 1]);
          i++;
        }
      } else if (arg === '--no-hot-reload' || arg === '-nhr') {
        options.noHotReload = true;
        // Remove --watch if present
        const watchIndex = parsedArgs.indexOf('--watch');
        if (watchIndex !== -1) {
          parsedArgs.splice(watchIndex, 1);
        }
      } else if (arg === '--no-build' || arg === '-nb') {
        options.noBuild = true;
        parsedArgs.push('--no-build');
      } else if (arg === '--no-restore' || arg === '-nr') {
        options.noRestore = true;
        parsedArgs.push('--no-restore');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and start dev server
    await runner.initialize();
    await runner.dev(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Development server failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /csharp-setup first to configure your project.');
    }

    if (error.message.includes('port') || error.message.includes('in use')) {
      console.log('\n💡 Port is already in use. Try:');
      console.log('   /csharp-dev --urls http://localhost:5001');
      console.log('   Or kill process:');
      console.log('     Windows: netstat -ano | findstr :5000');
      console.log('     Linux/macOS: lsof -ti:5000 | xargs kill');
    }

    if (error.message.includes('certificate') || error.message.includes('HTTPS')) {
      console.log('\n💡 HTTPS certificate issues');
      console.log('   Trust development certificate: dotnet dev-certs https --trust');
      console.log('   Generate new certificate: dotnet dev-certs https --clean');
      console.log('   Use HTTP instead: --urls http://localhost:5000');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 C#/.NET Development Server Command

Usage: /csharp-dev [options]

Options:
  --watch, -w                     Enable hot reload (default for web projects)
  --urls, -u <urls>               URLs to listen on (default: http://localhost:5000;https://localhost:5001)
  --environment, -e <env>         Environment (Development|Staging|Production) [default: Development]
  --launch-profile, -lp <profile> Launch profile to use
  --no-hot-reload, -nhr           Disable hot reload
  --no-build, -nb                 Don't build the project before running
  --no-restore, -nr               Skip restoring packages before running
  --help, -h                      Show this help message

Common URL Formats:
  http://localhost:5000           # HTTP on port 5000
  https://localhost:5001          # HTTPS on port 5001
  http://0.0.0.0:5000            # All network interfaces
  http://*:5000                  # All hosts on port 5000

Examples:
  /csharp-dev                          # Start dev server with hot reload
  /csharp-dev --watch                  # Explicitly enable hot reload
  /csharp-dev --urls http://localhost:8080  # Start on port 8080
  /csharp-dev --environment Staging    # Use Staging environment
  /csharp-dev --launch-profile IISExpress  # Use IIS Express profile
  /csharp-dev --no-hot-reload          # Disable hot reload

Supported Project Types:
  • ASP.NET Core Web Applications (MVC, Razor Pages, Web API)
  • Blazor Applications (Server, WebAssembly)
  • Console Applications (runs without server)
  • Other project types that support dotnet run

Hot Reload (--watch):
  • Automatically applies code changes without restarting
  • Supported in ASP.NET Core 6+ and .NET 6+
  • Works with C# code changes (not all changes supported)
  • Use --no-hot-reload to disable

Launch Profiles:
  • Configured in Properties/launchSettings.json
  • Common profiles: IIS Express, Project, Docker
  • Custom profiles for different environments

Configuration:
  Run /csharp-setup first to configure your project.
  Configure launch profiles in Properties/launchSettings.json.
  Set environment variables in appsettings.json or appsettings.{Environment}.json.

For ASP.NET Core Projects:
  • Default ports: HTTP 5000, HTTPS 5001
  • Environment-specific configuration supported
  • Kestrel web server used by default
  • IIS Express available on Windows

Advanced Options:
  • Use --no-launch-profile to run without a profile
  • Use --project to specify project file
  • Use --framework to target specific framework
  • Use --configuration to use specific build configuration
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
