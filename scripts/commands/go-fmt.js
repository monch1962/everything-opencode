#!/usr/bin/env node
/**
 * /go-fmt command wrapper
 *
 * Format Go code with Go-specific improvements
 */

const GoCommandRunner = require("../go/go-command-runner-refactored");

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--write' || arg === '-w') {
      options.write = true;
    } else if (arg === '--diff' || arg === '-d') {
      options.diff = true;
    } else if (arg === '--simplify' || arg === '-s') {
      options.simplify = true;
    } else if (arg === '--list' || arg === '-l') {
      options.list = true;
    } else if (arg === '--formatter') {
      options.formatter = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--check') {
      options.check = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a file or directory path
      options.paths = options.paths || [];
      options.paths.push(arg);
    }
  }

  try {
    const runner = new GoCommandRunner(process.cwd());
    await runner.initialize();

    // Override formatter from command line
    if (options.formatter && runner.goConfig.tools) {
      runner.goConfig.tools.formatter = options.formatter;
    }

    // Handle check mode (dry run)
    if (options.check) {
      return runFormatCheck(runner, options);
    }

    console.log('🎨 Formatting Go code...');
    const result = await runner.format(options);

    if (result.success) {
      if (options.write) {
        console.log('\n✅ Code formatted successfully!');
      } else if (options.diff) {
        // Diff output is already shown by the formatter
        console.log('\n📋 Formatting diff shown above');
      } else {
        console.log('\n✅ Code is properly formatted!');
      }
    } else {
      console.error('\n❌ Formatting failed');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Formatting failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Run format check (dry run)
 */
async function runFormatCheck(runner, options) {
  console.log('🔍 Checking Go code formatting...');

  try {
    // First check with gofmt
    const gofmtResult = await runner.format({
      ...options,
      diff: true,
      write: false,
      stdio: 'pipe',
    });

    if (gofmtResult.stdout && gofmtResult.stdout.trim()) {
      console.log('\n⚠️ Formatting issues found:');
      console.log(gofmtResult.stdout);
      console.log('\n💡 Run /go-fmt --write to fix these issues');
      process.exit(1);
    } else {
      console.log('\n✅ All Go files are properly formatted!');
    }

    // Also check imports if goimports is available
    if (runner.detectedTools.goimports?.installed) {
      console.log('\n🔍 Checking import organization...');

      const { runCommand } = require('../lib/utils');
      const importResult = runCommand('goimports -d .', {
        cwd: runner.projectPath,
        stdio: 'pipe',
      });

      if (importResult.stdout && importResult.stdout.trim()) {
        console.log('\n⚠️ Import organization issues found:');
        console.log(importResult.stdout);
        console.log(
          '\n💡 Run /go-fmt --write --formatter goimports to fix imports',
        );
        process.exit(1);
      } else {
        console.log('✅ Imports are properly organized!');
      }
    }
  } catch (error) {
    console.error(`❌ Format check failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🎨 Go Format Command

Usage: /go-fmt [options] [paths...]

Format Go code with Go-specific improvements and multiple formatter support.

Options:
  --write, -w            Write result to source files instead of stdout
  --diff, -d             Display diffs instead of rewriting files
  --simplify, -s         Apply simplifications during formatting
  --list, -l             List files whose formatting differs from gofmt's
  --formatter TOOL       Formatter tool: gofmt, goimports
  --verbose, -v          Verbose output
  --check                Check formatting without modifying files
  --help, -h             Show this help message

Formatters:
  • gofmt (default) - Official Go code formatter
  • goimports - gofmt with import organization

Go-specific features:
  • Multiple formatter support with fallback
  • Import organization with goimports
  • Code simplification
  • Format checking mode
  • Diff display for review
  • Batch formatting support

Examples:
  /go-fmt                     # Check formatting of all Go files
  /go-fmt --write            # Format all Go files
  /go-fmt --diff             # Show formatting differences
  /go-fmt --check            # Check formatting without modifying
  /go-fmt --formatter goimports # Format with import organization
  /go-fmt --simplify --write # Simplify and format code
  /go-fmt main.go pkg/       # Format specific files/directories
  /go-fmt --list             # List files needing formatting

gofmt features:
  • Standard Go code formatting
  • Consistent indentation (tabs)
  • Line length adjustment
  • Operator spacing
  • Comment formatting
  • Brace placement

goimports features:
  • All gofmt features plus:
  • Automatic import organization
  • Missing import addition
  • Unused import removal
  • Import path sorting
  • Vendor import handling

Formatting rules:
  • Uses tabs for indentation (1 tab = 8 spaces in display)
  • Max line length: 80 characters (configurable)
  • Operators have spaces
  • Comments start with identifier name
  • Braces follow K&R style
  • Imports grouped: stdlib, third-party, local

Common use cases:
  • Pre-commit formatting check
  • CI/CD pipeline formatting validation
  • Code review diff generation
  • Batch code cleanup
  • Import organization
  • Code simplification

Exit codes:
  0 - Success, code is properly formatted
  1 - Formatting issues found (in check mode)
  2 - Formatter execution failed

Environment variables:
  GOIMPORTS_LOCAL           - Local import prefixes
  GO111MODULE               - Go modules mode
  GOPATH                    - Go workspace path

Tips:
  • Use --check in CI pipelines to ensure consistent formatting
  • Use --write before commits to maintain clean code
  • Use --diff during code reviews to see formatting changes
  • Use goimports for automatic import management
  • Consider setting up editor to run gofmt on save
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
