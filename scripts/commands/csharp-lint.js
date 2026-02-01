#!/usr/bin/env node
/**
 * C#/.NET Lint Command
 *
 * Run code analysis for C#/.NET projects
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

      if (arg === '--fix' || arg === '-f') {
        options.fix = true;
        parsedArgs.push('--fix-analyzers', '--fix-style', '--fix-whitespace');
      } else if (arg === '--verify' || arg === '-v') {
        options.verify = true;
        parsedArgs.push('--verify-no-changes');
      } else if (arg === '--severity' || arg === '-s') {
        if (i + 1 < args.length) {
          options.severity = args[i + 1];
          parsedArgs.push('--severity', args[i + 1]);
          i++;
        }
      } else if (arg === '--diagnostics' || arg === '-d') {
        if (i + 1 < args.length) {
          options.diagnostics = args[i + 1];
          parsedArgs.push('--diagnostics', args[i + 1]);
          i++;
        }
      } else if (arg === '--include' || arg === '-i') {
        if (i + 1 < args.length) {
          options.include = args[i + 1];
          parsedArgs.push('--include', args[i + 1]);
          i++;
        }
      } else if (arg === '--exclude' || arg === '-e') {
        if (i + 1 < args.length) {
          options.exclude = args[i + 1];
          parsedArgs.push('--exclude', args[i + 1]);
          i++;
        }
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run linter
    await runner.initialize();
    await runner.lint(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Code analysis failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /csharp-setup first to configure your project.');
    }

    if (error.message.includes('analyzers') || error.message.includes('Roslyn')) {
      console.log('\n💡 Code analyzer issues');
      console.log(
        '   Install Roslyn analyzers: dotnet add package Microsoft.CodeAnalysis.Analyzers'
      );
      console.log('   Configure analyzers in .editorconfig');
      console.log('   Install StyleCop if using StyleCop analyzers');
    }

    if (error.message.includes('format') || error.message.includes('dotnet-format')) {
      console.log('\n💡 Formatter issues');
      console.log('   Install dotnet-format: dotnet tool install -g dotnet-format');
      console.log('   Run dotnet format to fix formatting issues');
      console.log('   Configure formatting rules in .editorconfig');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔍 C#/.NET Code Analysis Command

Usage: /csharp-lint [options]

Options:
  --fix, -f                     Fix analyzable issues automatically
  --verify, -v                  Verify no changes would be made
  --severity, -s <level>        Minimum severity (error|warning|info|hidden) [default: warning]
  --diagnostics, -d <ids>       Comma-separated diagnostic IDs to check
  --include, -i <pattern>       Include files matching pattern (e.g., **/*.cs)
  --exclude, -e <pattern>       Exclude files matching pattern
  --help, -h                    Show this help message

Diagnostic Categories:
  style     - Code style issues (IDEXXXX)
  quality   - Code quality issues (CAXXXX)
  performance - Performance issues (PERFXXXX)
  security  - Security issues (SECXXXX)
  design    - Design issues (DESIGNXXXX)
  all       - All diagnostic categories

Examples:
  /csharp-lint                          # Run code analysis
  /csharp-lint --fix                    # Fix analyzable issues
  /csharp-lint --verify                 # Verify no changes needed
  /csharp-lint --severity error         # Show only errors
  /csharp-lint --diagnostics style,quality  # Check specific categories
  /csharp-lint --include **/*.cs        # Include all C# files
  /csharp-lint --exclude **/Test*.cs    # Exclude test files

Supported Analyzers:
  • Roslyn Analyzers (built-in)
  • Microsoft.CodeAnalysis.Analyzers
  • StyleCop.Analyzers
  • SonarAnalyzer.CSharp
  • Other third-party analyzers

Code Style Rules:
  • Naming conventions (PascalCase, camelCase)
  • Using directives placement
  • Braces placement (K&R, Allman)
  • Indentation (4 spaces recommended)
  • Line length (default: 120 characters)
  • Expression-bodied members
  • Pattern matching preferences

Configuration:
  Run /csharp-setup first to configure your project.
  Configure rules in .editorconfig or .ruleset files.
  Set rule severity: dotnet_diagnostic.<rule>.severity = error|warning|suggestion|silent

Common Diagnostic IDs:
  • IDE0001 - Simplify names
  • IDE0002 - Simplify member access
  • IDE0003 - Remove this qualification
  • IDE0004 - Remove cast
  • CA1303 - Do not pass literals as localized parameters
  • CA1707 - Identifiers should not contain underscores
  • CA1822 - Mark members as static
  • CA2007 - Do not directly await a Task

For EditorConfig:
  • Create .editorconfig in project root
  • Use Visual Studio to generate default configuration
  • Configure specific rules for your team

Advanced Options:
  • Use --dry-run to see what would be fixed
  • Use --report to generate analysis report
  • Use --verbosity to control output detail
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
