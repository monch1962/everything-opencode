#!/usr/bin/env node
/**
 * /elixir-deps command wrapper
 *
 * Manage Elixir dependencies with Mix and Hex
 */

const ElixirCommandRunner = require("../elixir/command-runner");

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "get";
  const options = {};

  // Parse command line arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--package") {
      options.package = args[++i];
    } else if (arg === "--only") {
      options.only = args[++i];
    } else if (arg === "--lock") {
      options.lock = true;
    } else if (arg === "--unlock") {
      options.unlock = true;
    } else if (arg === "--check-unlock") {
      options.checkUnlock = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else if (
      !options.package &&
      (command === "get" || command === "update" || command === "tree")
    ) {
      options.package = arg;
    }
  }

  try {
    const runner = new ElixirCommandRunner(process.cwd());
    await runner.initialize();

    // Manage dependencies
    console.log(`📦 Managing Elixir dependencies: ${command}`);
    const result = await runner.deps(command, options);

    if (result.success) {
      console.log(`\n✅ Dependency management completed: ${command}`);
      if (result.stdout && options.verbose) {
        console.log(result.stdout);
      }
    } else {
      console.log(`\n❌ Dependency operation failed with code ${result.code}`);
      if (result.stderr) {
        console.log(result.stderr);
      }
      process.exit(result.code || 1);
    }
  } catch (error) {
    console.error(`\n❌ Dependency management failed: ${error.message}`);

    // Check if Hex is not installed
    if (error.message.includes("Hex")) {
      console.log(
        "\n💡 Hex package manager is not installed. Install it with:",
      );
      console.log("   mix local.hex --force");
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📦 Elixir Dependencies

Usage: /elixir-deps <command> [options] [package]

Manage Elixir dependencies with Mix and Hex.

Commands:
  get                    Fetch all dependencies
  update [package]       Update specific package or all
  tree [package]         Show dependency tree
  unlock [package]       Unlock specific package or all
  compile                Compile dependencies
  clean                  Clean dependencies
  check                  Check dependencies
  outdated               Show outdated dependencies

Options:
  --package NAME         Package name (for get, update, tree)
  --only ENV             Only for specific environment (dev, test, prod)
  --lock                 Lock dependencies after update
  --unlock               Unlock dependencies
  --check-unlock         Check if dependencies can be unlocked
  --verbose, -v          Verbose output
  --help, -h             Show this help message

Examples:
  /elixir-deps get                    # Fetch all dependencies
  /elixir-deps update phoenix         # Update Phoenix
  /elixir-deps tree                   # Show dependency tree
  /elixir-deps outdated               # Show outdated dependencies
  /elixir-deps unlock --all           # Unlock all dependencies
  /elixir-deps compile                # Compile dependencies

Elixir-specific features:
  • Hex package manager integration
  • Semantic versioning support
  • Dependency locking with mix.lock
  • Environment-specific dependencies
  • Git and local dependencies
  • Override and conflict resolution

Dependency sources:
  • Hex packages (hex.pm)
  • Git repositories
  • Local paths
  • GitHub repositories
  • Organization packages

mix.exs configuration:
  • defp deps do - Dependency specification
  • {:package, "~> 1.0"} - Version requirements
  • only: :dev - Environment restriction
  • runtime: false - Development dependency
  • override: true - Force version
  • git: "url" - Git source
  • path: "local/path" - Local source

Common patterns:
  • Production dependencies in :prod environment
  • Development tools in :dev environment
  • Test dependencies in :test environment
  • Version constraints: ~>, >=, ==
  • Organization packages: {:package, organization: "org"}

Hex.pm features:
  • Public and private packages
  • Package documentation
  • Checksum verification
  • Dependency resolution
  • Conflict detection
  • Retirement notices

Dependency management:
  • Automatic conflict resolution
  • Transitive dependency handling
  • Lock file for reproducible builds
  • Checksum verification
  • Audit trail

Tips:
  • Use ~> for compatible version ranges
  • Specify only: environments for dev tools
  • Check mix.lock into version control
  • Use mix deps.update --all periodically
  • Verify checksums for security

Version constraints:
  • "~> 1.0" - 1.x where x >= 0
  • "~> 1.0.0" - 1.0.x where x >= 0
  • ">= 1.0.0 and < 2.0.0" - Explicit range
  • "== 1.0.0" - Exact version
  • ">= 1.0.0" - Minimum version
  
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
