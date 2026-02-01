#!/usr/bin/env node
/**
 * /go-lint command wrapper
 *
 * Lint Go code with Go-specific improvements
 */

const GoCommandRunner = require('../golang/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  const lintArgs = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--fix') {
      lintArgs.push('--fix');
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--timeout') {
      lintArgs.push('--timeout', args[++i]);
    } else if (arg === '--config') {
      lintArgs.push('--config', args[++i]);
    } else if (arg === '--linter') {
      options.linter = args[++i];
    } else if (arg === '--fast') {
      lintArgs.push('--fast');
    } else if (arg === '--no-config') {
      lintArgs.push('--no-config');
    } else if (arg === '--out-format') {
      lintArgs.push('--out-format', args[++i]);
    } else if (arg === '--issues-exit-code') {
      lintArgs.push('--issues-exit-code', args[++i]);
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a file or directory path
      lintArgs.push(arg);
    }
  }

  try {
    const runner = new GoCommandRunner(process.cwd());
    await runner.initialize();

    console.log('🔍 Linting Go code...');
    const result = await runner.lint(lintArgs, options);

    if (result.success) {
      console.log('\n✅ No linting issues found!');
    } else {
      console.error('\n❌ Linting failed');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Linting failed: ${error.message}`);

    // Provide helpful suggestions for common linting errors
    if (error.message.includes('golangci-lint')) {
      console.log('\n💡 Try installing golangci-lint:');
      console.log('   go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest');
    } else if (error.message.includes('staticcheck')) {
      console.log('\n💡 Try installing staticcheck:');
      console.log('   go install honnef.co/go/tools/cmd/staticcheck@latest');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔍 Go Lint Command

Usage: /go-lint [options] [paths...]

Lint Go code with Go-specific improvements and multiple linter support.

Options:
  --fix                   Automatically fix issues where possible
  --verbose, -v          Verbose output
  --timeout DURATION     Linter timeout (e.g., 5m)
  --config FILE          Configuration file
  --linter TOOL          Linter tool: golangci-lint, staticcheck, revive, gofmt
  --fast                 Run only fast linters
  --no-config            Don't use config file
  --out-format FORMAT    Output format: colored-line-number, tab, checkstyle, json
  --issues-exit-code N   Exit code when issues found (default: 1)
  --help, -h            Show this help message

Supported linters:
  • golangci-lint (recommended) - 50+ linters in one tool
  • staticcheck - State of the art static analysis
  • revive - Fast, configurable, extensible linter
  • gofmt - Code formatting checker

Go-specific features:
  • Multiple linter integration with fallback
  • Automatic issue fixing where supported
  • Configurable linting rules
  • Fast mode for quick checks
  • Custom output formats
  • Exit code control

Examples:
  /go-lint                     # Lint entire project
  /go-lint --fix              # Lint and fix issues automatically
  /go-lint --verbose          # Verbose linting output
  /go-lint --linter staticcheck # Use specific linter
  /go-lint --timeout 10m      # Set 10-minute timeout
  /go-lint ./cmd/ ./pkg/      # Lint specific directories
  /go-lint main.go            # Lint specific file

golangci-lint features:
  • 50+ integrated linters
  • YAML configuration (.golangci.yml)
  • Fast parallel execution
  • Auto-fix for many issues
  • Custom rule sets
  • Exclude patterns

Common linters included:
  • errcheck      - Check for unchecked errors
  • gosimple      - Simplify code
  • govet         - Go vet checks
  • ineffassign   - Detect ineffective assignments
  • staticcheck   - Static analysis
  • typecheck     - Type checking
  • unused        - Detect unused code
  • gosec         - Security issues

Configuration:
  • Uses .golangci.yml if available
  • Falls back to sensible defaults
  • Can be overridden via command line
  • Project-specific rules supported

Auto-fix support:
  • gofmt formatting issues
  • goimports import organization
  • unused import removal
  • simple code simplifications
  • Comment formatting

Exit codes:
  0 - Success, no issues found
  1 - Issues found (default)
  2 - Linter execution failed
  Custom - Use --issues-exit-code to customize

Environment variables:
  GOLANGCI_LINT_CACHE      - Cache directory
  GOLANGCI_LINT_TIMEOUT    - Default timeout
  GO111MODULE              - Go modules mode
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
