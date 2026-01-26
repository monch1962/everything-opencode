#!/usr/bin/env node
/**
 * /elixir-typecheck command wrapper
 *
 * Type check Elixir code with Dialyzer
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--ignore-warnings') {
      options.ignoreWarnings = true;
    } else if (arg === '--format') {
      options.format = args[++i];
    } else if (arg === '--list-unused') {
      options.listUnused = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
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

    // Type check code
    console.log('🔍 Type checking Elixir code...');
    const result = await runner.typecheck(options);

    if (result.success) {
      console.log('\n✅ Type checking passed!');
      if (result.stdout && options.verbose) {
        console.log(result.stdout);
      }
    } else {
      console.log(`\n⚠️  Type checking issues found (code: ${result.code})`);
      if (result.stdout) {
        console.log(result.stdout);
      }
      if (result.stderr) {
        console.log(result.stderr);
      }

      // Don't exit with error if we're ignoring warnings
      if (!options.ignoreWarnings) {
        process.exit(result.code || 1);
      }
    }
  } catch (error) {
    console.error(`\n❌ Type checking failed: ${error.message}`);

    // Check if Dialyzer/dialyxir is not installed
    if (
      error.message.includes('Dialyzer') ||
      error.message.includes('dialyxir')
    ) {
      console.log('\n💡 Dialyzer/dialyxir is not configured. Add to mix.exs:');
      console.log('   {:dialyxir, "~> 1.4", only: [:dev], runtime: false}');
      console.log('\nThen run:');
      console.log('   mix deps.get');
      console.log('   mix dialyzer --plt');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔍 Elixir Type Check

Usage: /elixir-typecheck [options]

Type check Elixir code with Dialyzer.

Options:
  --ignore-warnings      Ignore warnings (exit with success)
  --format FORMAT        Output format: short, raw, etc.
  --list-unused          List unused functions
  --verbose, -v          Verbose output
  --help, -h             Show this help message

Examples:
  /elixir-typecheck                    # Run type checking
  /elixir-typecheck --ignore-warnings  # Ignore warnings
  /elixir-typecheck --format short     # Short output format
  /elixir-typecheck --list-unused      # List unused functions

Elixir-specific features:
  • Dialyzer integration via dialyxir
  • Success typing analysis
  • Type specification checking
  • Unused function detection
  • PLT (Persistent Lookup Table) caching
  • Incremental analysis

Dialyzer capabilities:
  • Type inference and checking
  • Contract violation detection
  • Dead code detection
  • Unreachable code detection
  • Type specification validation
  • Success typing guarantees

Type specifications (@spec):
  • Function type declarations
  • Custom type definitions (@type)
  • Opaque types (@opaque)
  • Type parameterization
  • Union and intersection types
  • Optional and required types

Common Dialyzer warnings:
  • The call will never return
  • Function has no local return
  • The test can never evaluate to 'true'
  • Function clause will never be matched
  • The pattern can never match the type
  • Guard test can never succeed

mix.exs configuration:
  • Add dialyxir to dev dependencies
  • Configure dialyzer in config/
  • Custom warning options
  • PLT configuration
  • Path configuration

Configuration example (config/config.exs):
  config :dialyxir,
    plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
    flags: [
      :error_handling,
      :race_conditions,
      :underspecs,
      :unknown,
      :unmatched_returns
    ],
    plt_add_apps: [:ex_unit],
    ignore_warnings: "dialyzer.ignore"

Type specification examples:
  @spec add(integer, integer) :: integer
  def add(a, b), do: a + b

  @type user_id :: integer
  @type user :: %User{id: user_id, name: String.t()}
  
  @spec get_user(user_id) :: {:ok, user} | {:error, String.t()}
  def get_user(id) do
    # implementation
  end

PLT management:
  • Build PLT with mix dialyzer --plt
  • Update PLT with new dependencies
  • Share PLT across projects
  • Cache PLT for faster analysis
  • Verify PLT integrity

Tips:
  • Build PLT after adding new dependencies
  • Use @spec for public API functions
  • Start with basic types and refine
  • Use dialyzer.ignore for false positives
  • Run type checking in CI/CD
  • Fix high-priority warnings first

Common patterns:
  • Success typing with {:ok, result} | {:error, reason}
  • Optional types with nil | type
  • Union types for multiple return possibilities
  • Type parameters for generic functions
  • Opaque types for encapsulation
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
