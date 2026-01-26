# /elixir-lint

Lint Elixir code for style, correctness, and best practices.

## Description

Analyzes Elixir code using Credo and other linting tools to identify style violations, potential bugs, and code quality issues. Provides detailed reports with suggestions for improvement.

## Usage

```bash
/elixir-lint [options] [paths...]
```

## Options

### Linting Options

- `--all` - Lint all Elixir files in project
- `--strict` - Enable all checks (including controversial)
- `--fix` - Automatically fix safe issues
- `--safe-fix` - Only fix safe issues (no behavior changes)
- `--check` - Check if linting passes (dry run)

### Check Selection

- `--checks <checks>` - Run specific checks (comma-separated)
- `--ignore-checks <checks>` - Ignore specific checks
- `--categories <cats>` - Run checks in specific categories
- `--min-priority <level>` - Minimum priority to show (1-99)

### Output Options

- `--verbose` - Verbose output with explanations
- `--quiet` - Minimal output
- `--json` - Output results as JSON
- `--format <format>` - Output format (flycheck, oneline, json, etc.)
- `--stats` - Show linting statistics
- `--color` - Force colored output
- `--no-color` - Disable colored output

### File Selection

- `--include <pattern>` - Include files matching pattern
- `--exclude <pattern>` - Exclude files matching pattern
- `--since <commit>` - Lint files changed since commit
- `--staged` - Lint only staged files

### Help

- `--help, -h` - Show help message

## Examples

```bash
# Lint all Elixir files
/elixir-lint --all

# Lint with automatic fixes
/elixir-lint --fix

# Lint specific files
/elixir-lint lib/my_module.ex test/my_test.exs

# Lint with strict checks
/elixir-lint --strict

# Lint files changed since last commit
/elixir-lint --since HEAD~1

# Lint only staged files
/elixir-lint --staged

# Output JSON results
/elixir-lint --json

# Run specific checks
/elixir-lint --checks "Readability,Refactor"

# Check if linting passes
/elixir-lint --check
```

## Check Categories

### Readability (Recommended)

- Consistent naming conventions
- Clear function and variable names
- Proper module organization
- Documentation standards

### Design (Recommended)

- Function complexity
- Module cohesion
- Code duplication
- Abstraction levels

### Refactor (Recommended)

- Code simplification opportunities
- Unused variables and imports
- Redundant code
- Complex expressions

### Warning (Optional)

- Potential performance issues
- Code smells
- Questionable patterns
- Deprecated functions

### Consistency (Optional)

- Formatting consistency
- Import organization
- Code structure patterns
- Configuration consistency

### Controversial (Disabled by Default)

- Subjective style preferences
- Opinionated patterns
- Framework-specific conventions

## Configuration

### .credo.exs

```elixir
%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "src/", "test/", "web/", "apps/"],
        excluded: [~r"/_build/", ~r"/deps/", ~r"/node_modules/"]
      },
      checks: [
        # Readability
        {Credo.Check.Readability.ModuleDoc, false},
        {Credo.Check.Readability.Specs, false},

        # Design
        {Credo.Check.Design.AliasUsage, priority: :low, if_nested_deeper_than: 2},

        # Refactor
        {Credo.Check.Refactor.CyclomaticComplexity, max_complexity: 10},
        {Credo.Check.Refactor.Nesting, max_nesting: 4},

        # Consistency
        {Credo.Check.Consistency.TabsOrSpaces},

        # Warning
        {Credo.Check.Warning.IExPry, false},
        {Credo.Check.Warning.LazyLogging, false},

        # Custom checks
        {MyApp.CustomChecks.SomeCheck, []}
      ]
    }
  ]
}
```

### Common Configuration Options

#### Priority Levels

- `:high` - Critical issues (default: show all)
- `:normal` - Important issues (default: show all)
- `:low` - Minor issues (default: show in verbose)
- `:lower` - Informational issues (default: hide)

#### File Patterns

```elixir
files: %{
  included: ["lib/", "test/", "web/"],
  excluded: [
    ~r"/_build/",
    ~r"/deps/",
    ~r"/node_modules/",
    "**/migrations/*",
    "**/seeds.exs"
  ]
}
```

#### Check Configuration

```elixir
# Enable/disable specific checks
{Credo.Check.Readability.ModuleDoc, false},

# Configure check parameters
{Credo.Check.Refactor.CyclomaticComplexity, max_complexity: 15},

# Set priority
{Credo.Check.Design.AliasUsage, priority: :low},
```

## Common Issues and Fixes

### Readability Issues

```elixir
# Bad: Unclear variable name
x = calculate_total(items)

# Good: Descriptive variable name
total = calculate_total(items)

# Bad: Missing module documentation
defmodule MyModule do
  # ...
end

# Good: Documented module
defmodule MyModule do
  @moduledoc """
  Module for handling user accounts.
  """
  # ...
end
```

### Design Issues

```elixir
# Bad: Function too complex
def process_data(data) do
  # 50 lines of complex logic
end

# Good: Split into smaller functions
def process_data(data) do
  data
  |> validate()
  |> transform()
  |> analyze()
end
```

### Refactor Opportunities

```elixir
# Bad: Nested conditionals
if user do
  if user.active? do
    if user.subscribed? do
      # ...
    end
  end
end

# Good: Flatten with pattern matching
case {user, user.active?, user.subscribed?} do
  {nil, _, _} -> :error
  {_, false, _} -> :inactive
  {_, _, false} -> :unsubscribed
  _ -> :ok
end
```

## Integration

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Lint staged Elixir files
mix credo --strict $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ex|exs)$')

if [ $? -ne 0 ]; then
  echo "Linting failed. Fix issues before committing."
  exit 1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/lint.yml
name: Lint Check
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: erlef/setup-elixir@v1
        with:
          elixir-version: "1.14"
      - run: mix deps.get
      - run: mix credo --strict
```

### Editor Integration

- **VS Code**: ElixirLS extension
- **IntelliJ**: Elixir plugin
- **Emacs**: alchemist or elixir-mode
- **Vim**: vim-elixir

## Performance Tips

### Incremental Linting

- Use `--since` for large codebases
- Lint only changed files
- Cache linting results

### Check Selection

- Disable expensive checks for large projects
- Use category-based filtering
- Adjust priority thresholds

### Parallel Processing

- Credo supports parallel file processing
- Use multiple workers for large projects
- Consider linting during CI only

## Related Commands

- `/elixir-format` - Format code before/after linting
- `/elixir-compile` - Compile code after linting
- `/elixir-test` - Test code after linting
- `/elixir-setup` - Configure linting

## Environment Variables

- `MIX_ENV` - Mix environment
- `CREDO_CONFIG` - Path to custom config file
- `CREDO_CACHE` - Enable/disable caching
- `CREDO_PARALLEL` - Enable parallel processing

## Notes

- Requires Credo as a dependency in `mix.exs`
- Configuration file is `.credo.exs`
- Can be integrated with CI/CD pipelines
- Some checks may have false positives
- Automatic fixes (`--fix`) are safe but review changes
- Custom checks can be created for project-specific rules
