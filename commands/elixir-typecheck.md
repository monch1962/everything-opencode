# /elixir-typecheck

Type check Elixir code using Dialyzer and type specifications.

## Description

Performs static type analysis on Elixir code using Dialyzer (Discrepancy Analyzer for ERlang) to detect type errors, unreachable code, and other issues. Supports Elixir's typespecs and gradual typing.

## Usage

```bash
/elixir-typecheck [options] [paths...]
```

## Options

### Type Checking Options

- `--all` - Type check all Elixir files in project
- `--strict` - Enable strict type checking
- `--warnings` - Show warnings in addition to errors
- `--no-warn` - Suppress warnings (errors only)
- `--check` - Check if type checking passes (dry run)

### Analysis Options

- `--plt` - Build or update PLT (Persistent Lookup Table)
- `--no-plt` - Skip PLT checking
- `--incremental` - Incremental type checking
- `--full` - Full type checking (non-incremental)

### Output Options

- `--verbose` - Verbose output with explanations
- `--quiet` - Minimal output
- `--json` - Output results as JSON
- `--format <format>` - Output format (dialyzer, short, raw)
- `--stats` - Show type checking statistics
- `--color` - Force colored output
- `--no-color` - Disable colored output

### File Selection

- `--include <pattern>` - Include files matching pattern
- `--exclude <pattern>` - Exclude files matching pattern
- `--since <commit>` - Type check files changed since commit
- `--staged` - Type check only staged files

### Help

- `--help, -h` - Show help message

## Examples

```bash
# Type check all Elixir files
/elixir-typecheck --all

# Build PLT and type check
/elixir-typecheck --plt

# Type check with strict mode
/elixir-typecheck --strict

# Type check specific files
/elixir-typecheck lib/my_module.ex test/my_test.exs

# Type check files changed since last commit
/elixir-typecheck --since HEAD~1

# Type check only staged files
/elixir-typecheck --staged

# Output JSON results
/elixir-typecheck --json

# Check if type checking passes
/elixir-typecheck --check

# Show warnings
/elixir-typecheck --warnings
```

## Type Specifications

### Basic Typespecs

```elixir
# Function specification
@spec add(integer(), integer()) :: integer()
def add(a, b), do: a + b

# Type definition
@type user_id :: integer()
@type username :: String.t()
@type user :: %User{id: user_id(), name: username()}

# Opaque type
@opaque secret :: String.t()
```

### Complex Types

```elixir
# Union types
@type result :: {:ok, term()} | {:error, String.t()}

# Optional types
@type optional_string :: String.t() | nil

# Lists and tuples
@type string_list :: [String.t()]
@type key_value :: {atom(), term()}

# Maps
@type user_map :: %{
  required(:id) => integer(),
  optional(:name) => String.t()
}
```

### Behaviours and Callbacks

```elixir
defmodule MyBehaviour do
  @callback process(term()) :: term()
  @callback validate(term()) :: boolean()
end

defmodule MyImplementation do
  @behaviour MyBehaviour

  @impl true
  def process(data), do: # ...

  @impl true
  def validate(data), do: # ...
end
```

## Configuration

### .dialyzer.exs

```elixir
[
  # PLT configuration
  plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
  plt_add_apps: [:ex_unit, :mix],
  plt_add_deps: true,

  # Analysis flags
  flags: [
    :error_handling,
    :race_conditions,
    :underspecs,
    :unknown,
    :unmatched_returns
  ],

  # Warning flags
  warnings: [
    :error_handling,
    :race_conditions,
    :underspecs,
    :unknown
  ],

  # Ignore warnings
  ignore_warnings: "dialyzer.ignore",

  # List of warnings to ignore
  list_unused_filters: true,

  # Path configuration
  paths: ["_build/dev/lib/my_app/ebin"],

  # Output configuration
  format: "dialyzer",
  raw: false
]
```

### Common Configuration Options

#### PLT Configuration

```elixir
# Custom PLT location
plt_file: {:no_warn, "priv/plts/dialyzer.plt"},

# Include additional apps
plt_add_apps: [:ex_unit, :mix, :eex],

# Include dependencies
plt_add_deps: true,

# PLT update policy
plt_update: :no_warn,
```

#### Analysis Flags

```elixir
flags: [
  # Basic checks
  :unmatched_returns,
  :error_handling,
  :race_conditions,
  :underspecs,
  :unknown,

  # Advanced checks
  :no_return,
  :extra_return,
  :no_opaque,
  :no_improper_lists,
  :no_fun_app,
  :no_contracts,
  :no_behaviours,
  :no_fail_call,
  :no_missing_calls,
  :no_undefined_callbacks
]
```

#### Warning Configuration

```elixir
# Enable specific warnings
warnings: [
  :error_handling,
  :race_conditions,
  :underspecs,
  :unknown
],

# Ignore file
ignore_warnings: "dialyzer.ignore",

# List unused filters
list_unused_filters: true,
```

## Common Type Errors

### Type Mismatch

```elixir
# Error: Function add/2 expects integer(), integer() but gets string()
@spec add(integer(), integer()) :: integer()
def add(a, b), do: a + b

add(1, "2")  # Type error
```

### Undefined Function

```elixir
# Error: Function undefined_function/0 is undefined
def call_undefined do
  undefined_function()  # Type error
end
```

### Contract Violation

```elixir
# Error: The call violates the contract
@spec process(integer()) :: String.t()
def process(num), do: num  # Returns integer instead of string
```

### Unreachable Code

```elixir
# Warning: Clause will never match
def never_matches(x) when is_integer(x) and not is_integer(x) do
  x  # Unreachable
end
```

## Integration

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Type check staged Elixir files
mix dialyzer --check $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ex|exs)$')

if [ $? -ne 0 ]; then
  echo "Type checking failed. Fix issues before committing."
  exit 1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/typecheck.yml
name: Type Check
on: [push, pull_request]
jobs:
  dialyzer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: erlef/setup-elixir@v1
        with:
          elixir-version: "1.14"
          otp-version: "25"
      - run: mix deps.get
      - run: mix dialyzer --plt
      - run: mix dialyzer
```

### Editor Integration

- **VS Code**: ElixirLS with Dialyzer support
- **IntelliJ**: Elixir plugin with type checking
- **Emacs**: elixir-mode with flycheck-dialyzer
- **Vim**: ale with dialyzer integration

## Performance Tips

### PLT Management

- Build PLT once and reuse
- Update PLT when dependencies change
- Store PLT in CI cache
- Use incremental PLT updates

### Incremental Checking

- Use `--incremental` for large codebases
- Type check only changed files
- Cache type checking results

### Configuration Optimization

- Disable expensive checks for development
- Use warning filters for known issues
- Configure PLT to include only necessary apps

## Common Issues and Solutions

### PLT Build Failures

```bash
# Clean and rebuild PLT
rm -rf priv/plts/
mix dialyzer --plt

# Build PLT with specific apps
mix dialyzer --plt --plt-add-apps ex_unit mix

# Skip PLT checking
mix dialyzer --no-plt
```

### Slow Type Checking

```bash
# Use incremental checking
mix dialyzer --incremental

# Check only specific files
mix dialyzer lib/my_module.ex

# Disable expensive checks
# In .dialyzer.exs
flags: [
  :error_handling,
  :race_conditions
  # Remove :underspecs, :unknown if too slow
]
```

### False Positives

```elixir
# Add to dialyzer.ignore
# Function my_function/1 has no local return
{:warn_return_no_exit, {'lib/my_module.ex', 123}, :no_return}

# The call will never return
{:warn_not_called, {'lib/my_module.ex', 456}, :no_return}
```

## Related Commands

- `/elixir-compile` - Compile code before type checking
- `/elixir-test` - Test code after type checking
- `/elixir-lint` - Lint code (complements type checking)
- `/elixir-setup` - Configure type checking

## Environment Variables

- `DIALYZER_PLT` - Path to PLT file
- `DIALYZER_FLAGS` - Additional Dialyzer flags
- `ERL_AFLAGS` - Erlang compiler flags
- `MIX_ENV` - Mix environment

## Notes

- Requires Dialyzer (part of Erlang/OTP)
- PLT building can be slow initially
- Type specifications are optional but recommended
- Dialyzer uses success typing (optimistic)
- Some false positives may occur
- Can be integrated with CI/CD pipelines
- Works best with comprehensive typespecs
- Supports gradual typing (mix of typed/untyped code)
