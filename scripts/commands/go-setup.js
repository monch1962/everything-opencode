#!/usr/bin/env node
/**
 * Go Setup Command
 *
 * Interactive setup for Go projects
 */

const GoConfigWizard = require('../../languages/golang/config-wizard');

async function main() {
  try {
    const projectPath = process.cwd();
    const wizard = new GoConfigWizard(projectPath);

    console.log('🚀 Go Project Setup\n');

    // Check for command line arguments
    const args = process.argv.slice(2);

    let success = false;

    if (args.includes('--quick') || args.includes('-q')) {
      console.log('⚡ Running quick setup...\n');
      success = await wizard.quickSetup();
    } else {
      // Run the configuration wizard
      success = await wizard.run();
    }

    if (success) {
      console.log('\n✅ Go setup completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('  1. Run /go-test to test your project');
      console.log('  2. Run /go-lint to check code quality');
      console.log('  3. Run /go-format to format your code');
      console.log('  4. Run /go-security for security scanning (if configured)');
      console.log('  5. Run /go-build to build your project');
      console.log('  6. Run /go-run to run your Go program');
      console.log('  7. Run /go-mod to manage Go modules');
      console.log('  8. Run /go-clean to clean build artifacts');

      console.log('\n📚 Available Go commands:');
      console.log('  • /go-setup     - Configure Go project (run this again)');
      console.log('  • /go-test      - Run tests with configured test runner');
      console.log('  • /go-lint      - Run linter (golangci-lint/staticcheck/revive)');
      console.log('  • /go-format    - Format code (gofmt/goimports)');
      console.log('  • /go-security  - Security scanning (gosec/govulncheck)');
      console.log('  • /go-build     - Build project');
      console.log('  • /go-run       - Run Go program');
      console.log('  • /go-mod       - Manage Go modules');
      console.log('  • /go-clean     - Clean build artifacts');
    } else {
      console.log('\n❌ Setup failed. Please check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 Go Setup Command

Usage: /go-setup [options]

Interactive setup for Go projects with tool detection and configuration.

Options:
  --quick, -q          Quick setup with automatic detection
  --reconfigure        Reconfigure existing Go project
  --dry-run            Show configuration without saving
  --help, -h           Show this help message

Features:
  • Project type detection (CLI, web service, library, etc.)
  • Go tool detection (golangci-lint, gofmt, goimports, gosec, etc.)
  • Interactive configuration wizard
  • Quick setup with sensible defaults
  • Configuration validation
  • Next steps guidance

Project types:
  • CLI tool           - Command-line application
  • Web service        - HTTP/REST API service
  • Library           - Reusable Go package
  • Microservice      - Small, focused service
  • gRPC service      - gRPC-based service
  • HTTP server       - Simple HTTP server
  • Background worker - Long-running background job
  • Data processing   - Data transformation/processing

Detected tools:
  • Linters: golangci-lint, staticcheck, revive
  • Formatters: gofmt, goimports
  • Test runners: go test, ginkgo
  • Security scanners: gosec, govulncheck
  • Build tools: Makefile, Taskfile, magefile

Examples:
  /go-setup            # Interactive setup wizard
  /go-setup --quick    # Quick setup with automatic detection
  /go-setup --reconfigure # Reconfigure existing project
  /go-setup --dry-run  # Show configuration without saving

Configuration:
  • Saves to .opencode/project-config.json
  • Includes project type, tool preferences, detected tools
  • Used by all other Go commands
  • Can be manually edited if needed

Next steps after setup:
  1. Run tests: /go-test
  2. Check code quality: /go-lint
  3. Format code: /go-format
  4. Security scan: /go-security
  5. Build project: /go-build
  6. Run program: /go-run
  7. Manage modules: /go-mod
  8. Clean artifacts: /go-clean

Environment variables:
  GO111MODULE          - Go modules mode (auto, on, off)
  GOPATH               - Go workspace path
  GOROOT               - Go installation root

Tips:
  • Run quick setup first to get started quickly
  • Use interactive setup for fine-grained control
  • Reconfigure if you add new tools or change project type
  • Check configuration file for advanced settings
  • All Go commands use the same configuration

Configuration File:
  Saved to .opencode/project-config.json
  Includes project type, tool configuration, detected tools
  Used by other Go commands (/go-test, /go-lint, etc.)
  `);
}

// Check for help flag
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
