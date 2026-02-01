#!/usr/bin/env node
/**
 * Elixir Setup Command
 *
 * Interactive setup for Elixir projects
 */

const ElixirConfigWizard = require('../../languages/elixir/config-wizard');

async function main() {
  try {
    const projectPath = process.cwd();
    const wizard = new ElixirConfigWizard(projectPath);

    console.log('🧪 Elixir Project Setup\n');

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
      console.log('\n✅ Elixir setup completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('  1. Run /elixir-test to test your project');
      console.log('  2. Run /elixir-lint to check code quality');
      console.log('  3. Run /elixir-format to format your code');
      console.log('  4. Run /elixir-typecheck for type checking (if configured)');
      console.log('  5. Run /elixir-security for security scanning (if configured)');
      console.log('  6. Run /elixir-compile to compile your project');
      console.log('  7. Run /elixir-run to run your Elixir application');
      console.log('  8. Run /elixir-deps to manage dependencies');
      console.log('  9. Run /elixir-clean to clean build artifacts');

      console.log('\n📚 Available Elixir commands:');
      console.log('  • /elixir-setup     - Configure Elixir project (run this again)');
      console.log('  • /elixir-test      - Run tests with ExUnit');
      console.log('  • /elixir-lint      - Run linter (Credo)');
      console.log('  • /elixir-format    - Format code (mix format)');
      console.log('  • /elixir-typecheck - Type checking (Dialyzer)');
      console.log('  • /elixir-security  - Security scanning (Sobelow, mix_audit)');
      console.log('  • /elixir-compile   - Compile project');
      console.log('  • /elixir-run       - Run Elixir application');
      console.log('  • /elixir-deps      - Manage dependencies');
      console.log('  • /elixir-clean     - Clean build artifacts');
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
🧪 Elixir Setup Command

Usage: /elixir-setup [options]

Interactive setup for Elixir projects with tool detection and configuration.

Options:
  --quick, -q          Quick setup with automatic detection
  --reconfigure        Reconfigure existing Elixir project
  --dry-run            Show configuration without saving
  --help, -h           Show this help message

Features:
  • Project type detection (Standard, Phoenix, Library, Umbrella, Nerves)
  • Elixir tool detection (Mix, Hex, Credo, Sobelow, Dialyzer, etc.)
  • Interactive configuration wizard
  • Quick setup with sensible defaults
  • Configuration validation
  • Next steps guidance

Project types:
  • Standard          - Basic Elixir application
  • Phoenix           - Full-stack web framework
  • Library           - Reusable Elixir package
  • Umbrella          - Multi-application project
  • Nerves            - Embedded systems with Elixir
  • LiveView          - Real-time Phoenix applications

Detected tools:
  • Build tools: Mix, Rebar3
  • Package manager: Hex
  • Linters: Credo, Dialyzer
  • Formatters: mix format
  • Test runners: ExUnit, Wallaby, Hound
  • Security scanners: Sobelow, mix_audit
  • Documentation: ex_doc
  • Coverage: excoveralls

Examples:
  /elixir-setup                 # Interactive setup
  /elixir-setup --quick         # Quick setup with defaults
  /elixir-setup --reconfigure   # Reconfigure existing project

Configuration files created:
  • .opencode/elixir-config.json  # Project configuration
  • .formatter.exs                # Code formatting rules
  • .credo.exs                    # Linting configuration (if Credo enabled)
  • mix.exs                       # Mix project file (if new project)

After setup, you can use all Elixir commands with Elixir-specific improvements.
`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
