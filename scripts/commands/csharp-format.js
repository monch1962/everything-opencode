#!/usr/bin/env node
/**
 * C#/.NET Format Command
 *
 * Format C#/.NET code
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

      if (arg === '--check' || arg === '-c') {
        options.check = true;
        parsedArgs.push('--check');
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
      } else if (arg === '--verbosity' || arg === '-v') {
        if (i + 1 < args.length) {
          options.verbosity = args[i + 1];
          parsedArgs.push('--verbosity', args[i + 1]);
          i++;
        }
      } else if (arg === '--folder' || arg === '-f') {
        if (i + 1 < args.length) {
          options.folder = args[i + 1];
          parsedArgs.push('--folder', args[i + 1]);
          i++;
        }
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

    // Initialize and run formatter
    await runner.initialize();
    await runner.format(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Code formatting failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /csharp-setup first to configure your project.');
    }

    if (error.message.includes('dotnet-format') || error.message.includes('not installed')) {
      console.log('\n💡 Formatter not installed');
      console.log('   Install dotnet-format: dotnet tool install -g dotnet-format');
      console.log('   Update dotnet-format: dotnet tool update -g dotnet-format');
      console.log('   Run dotnet format --check to see formatting issues');
    }

    if (error.message.includes('editorconfig') || errorMessage.includes('.editorconfig')) {
      console.log('\n💡 EditorConfig issues');
      console.log('   Create .editorconfig file in project root');
      console.log('   Configure formatting rules in .editorconfig');
      console.log('   Use Visual Studio to generate .editorconfig');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🎨 C#/.NET Code Format Command

Usage: /csharp-format [options]

Options:
  --check, -c                   Check formatting without making changes
  --include, -i <pattern>       Include files matching pattern (e.g., **/*.cs) [default: **/*.cs]
  --exclude, -e <pattern>       Exclude files matching pattern
  --verbosity, -v <level>       Set verbosity level (quiet|minimal|normal|detailed|diagnostic)
  --folder, -f <path>           Folder to format (default: current directory)
  --no-restore, -nr             Skip restoring packages before formatting
  --help, -h                    Show this help message

Formatting Categories:
  whitespace  - Whitespace formatting (indentation, line endings, etc.)
  style       - Code style formatting (braces, using directives, etc.)
  analyzers   - Analyzer fixes (code quality issues)
  all         - All formatting categories (default)

Examples:
  /csharp-format                      # Format all C# files
  /csharp-format --check              # Check formatting without changes
  /csharp-format --include **/*.cs    # Format all C# files
  /csharp-format --exclude **/Test*.cs # Exclude test files
  /csharp-format --verbosity detailed # Show detailed output
  /csharp-format --folder ./src       # Format files in src folder

Supported Formatting Rules:
  • Indentation (4 spaces recommended)
  • Line endings (LF recommended)
  • Braces placement (K&R style: { on same line)
  • Using directives (inside/outside namespace)
  • Blank lines (between members, after using directives)
  • Line length (default: 120 characters)
  • Spacing (around operators, after commas, etc.)
  • Wrapping (method chains, parameters, etc.)

Configuration via .editorconfig:
  [*.cs]
  indent_style = space
  indent_size = 4
  end_of_line = lf
  insert_final_newline = true
  charset = utf-8
  
  # C# specific
  csharp_new_line_before_open_brace = all
  csharp_new_line_before_else = true
  csharp_new_line_before_catch = true
  csharp_new_line_before_finally = true
  csharp_new_line_before_members_in_object_initializers = true
  csharp_new_line_between_query_expression_clauses = true

Common File Patterns:
  **/*.cs              - All C# files
  **/*.csproj          - Project files
  **/*.sln             - Solution files
  !**/bin/**           - Exclude bin directories
  !**/obj/**           - Exclude obj directories
  !**/Test*/**         - Exclude test directories

Configuration:
  Run /csharp-setup first to configure your project.
  Create .editorconfig file for custom formatting rules.
  Use Visual Studio's Format Document (Ctrl+K, Ctrl+D) to see formatting in action.

For Teams:
  • Commit .editorconfig to source control
  • Use same formatting rules across all projects
  • Run /csharp-format --check in CI/CD pipeline
  • Consider using pre-commit hooks

Advanced Options:
  • Use --dry-run to see what would be formatted
  • Use --report to generate formatting report
  • Use --fix-whitespace, --fix-style, --fix-analyzers for specific fixes
  • Use --severity to control which issues to fix

Integration with IDEs:
  • Visual Studio: Tools > Options > Text Editor > C# > Code Style
  • VS Code: Install C# extension and configure .editorconfig
  • Rider: Settings > Editor > Code Style > C#
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
