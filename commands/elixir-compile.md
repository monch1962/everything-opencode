# /elixir-compile

Compile Elixir code with Mix and handle compilation errors.

## Description

Compiles Elixir projects using Mix, providing detailed error reporting, dependency resolution, and compilation optimization. Supports incremental compilation, dependency fetching, and compilation warnings/errors.

## Usage

```bash
/elixir-compile [options]
```

## Options

### Compilation Options

- `--all` - Force full recompilation
- `--deps` - Compile dependencies only
- `--no-deps` - Skip dependency compilation
- `--no-archives-check` - Skip archives check
- `--no-elixir-version-check` - Skip Elixir version check
- `--no-protocol-consolidation` - Skip protocol consolidation
- `--no-warnings-as-errors` - Don't treat warnings as errors
- `--verbose` - Verbose compilation output

### Output Options

- `--quiet` - Minimal output
- `--json` - Output compilation results as JSON
- `--stats` - Show compilation statistics
- `--time` - Show compilation timing

### Help

- `--help, -h` - Show help message

## Examples

```bash
# Compile project
/elixir-compile

# Force full recompilation
/elixir-compile --all

# Compile with verbose output
/elixir-compile --verbose

# Skip dependency compilation
/elixir-compile --no-deps

# Show compilation statistics
/elixir-compile --stats

# Output JSON results
/elixir-compile --json
```

## Compilation Process

### 1. Dependency Resolution

- Checks and fetches dependencies from Hex
- Verifies dependency versions
- Downloads missing dependencies

### 2. Compilation

- Compiles Elixir source files (.ex, .exs)
- Handles module dependencies
- Generates BEAM bytecode
- Performs protocol consolidation

### 3. Error Handling

- Detailed error messages with line numbers
- Warning categorization
- Dependency conflict resolution
- Missing module detection

## Common Compilation Issues

### Dependency Problems

```bash
# Missing dependencies
mix deps.get

# Outdated dependencies
mix deps.update --all

# Lock file issues
rm mix.lock && mix deps.get
```

### Compilation Errors

- Syntax errors with line numbers
- Undefined functions
- Module name conflicts
- Protocol implementation issues
- Macro expansion problems

### Warnings

- Unused variables
- Deprecated functions
- Pattern match coverage
- Type specification issues

## Configuration

### mix.exs Settings

```elixir
def project do
  [
    # Compilation options
    elixir: "~> 1.14",
    build_embedded: Mix.env() == :prod,
    start_permanent: Mix.env() == :prod,

    # Compiler options
    compilers: [:gettext, :phoenix] ++ Mix.compilers(),
    elixirc_paths: elixirc_paths(Mix.env()),

    # Warning options
    warnings_as_errors: false,
    dialyzer: [
      plt_file: {:no_warn, "priv/plts/dialyzer.plt"}
    ]
  ]
end
```

### Environment Variables

- `MIX_ENV` - Mix environment (default: `dev`)
- `MIX_QUIET` - Suppress Mix output
- `MIX_DEBUG` - Enable debug output
- `ERL_AFLAGS` - Erlang compiler flags

## Performance Tips

### Incremental Compilation

- Mix caches compilation results
- Only recompiles changed files
- Use `--all` sparingly

### Dependency Management

- Keep dependencies up to date
- Use specific version constraints
- Clean unused dependencies regularly

### Protocol Consolidation

- Consolidates protocols for performance
- Required for production deployments
- Can be disabled with `--no-protocol-consolidation`

## Related Commands

- `/elixir-deps` - Manage dependencies
- `/elixir-test` - Run tests after compilation
- `/elixir-setup` - Project configuration
- `/elixir-lint` - Code quality checks

## Notes

- Requires Elixir and Mix to be installed
- First compilation may be slow due to dependency fetching
- Protocol consolidation is automatic in production
- Warnings can be treated as errors in CI environments
- Compilation results are cached in `_build/` directory
