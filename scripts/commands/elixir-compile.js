#!/usr/bin/env node
/**
 * /elixir-compile command wrapper
 *
 * Compile Elixir projects with Elixir-specific improvements
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--warnings-as-errors') {
      options.warningsAsErrors = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--long-compilation') {
      options.longCompilation = true;
    } else if (arg === '--profile') {
      options.profile = true;
    } else if (arg === '--env') {
      options.env = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    }
  }

  try {
    const runner = new ElixirCommandRunner(process.cwd());
    await runner.initialize();

    // Compile the project
    console.log('🔨 Compiling Elixir project...');
    const result = await runner.compile(options);

    if (result.success) {
      console.log('\n✅ Compilation successful!');
    } else {
      console.log(`\n❌ Compilation failed with code ${result.code}`);
      if (result.stderr) {
        console.log(result.stderr);
      }
      process.exit(result.code || 1);
    }
  } catch (error) {
    console.error(`\n❌ Compilation failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔨 Elixir Compile

Usage: /elixir-compile [options]

Compile Elixir project with Elixir-specific improvements.

Options:
  --force, -f            Force compilation (clean before compile)
  --warnings-as-errors   Treat warnings as errors
  --verbose, -v          Verbose output
  --long-compilation     Enable long compilation mode
  --profile              Profile compilation
  --env ENVIRONMENT      Set MIX_ENV (default: dev)
  --help, -h             Show this help message

Examples:
  /elixir-compile                    # Compile in dev environment
  /elixir-compile --force            # Force clean compilation
  /elixir-compile --env test         # Compile in test environment
  /elixir-compile --warnings-as-errors # Strict compilation

Elixir-specific features:
  • Automatic dependency resolution
  • Parallel compilation where possible
  • Warning categorization and filtering
  • Compilation profile support
  • Environment-specific compilation
  • Built-in compilation caching

Compilation outputs:
  • Compiled .beam files in _build/
  • Consolidated protocols
  • Application manifest
  • Dependency artifacts

Common issues:
  • Missing dependencies: Run /elixir-deps get first
  • Stale artifacts: Use --force to clean and recompile
  • Version conflicts: Check mix.exs dependencies
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
