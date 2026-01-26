# /elixir-format

Format Elixir code according to the Elixir style guide.

## Description

Formats Elixir source code using the built-in `mix format` tool, ensuring consistent code style across the project. Supports configuration via `.formatter.exs`, incremental formatting, and validation.

## Usage

```bash
/elixir-format [options] [paths...]
```

## Options

### Formatting Options

- `--check` - Check if files need formatting (dry run)
- `--dry-run` - Show what would be formatted without making changes
- `--stdin` - Format code from stdin
- `--stdout` - Output formatted code to stdout
- `--all` - Format all Elixir files in project
- `--fix` - Automatically fix formatting issues

### File Selection

- `--include <pattern>` - Include files matching pattern
- `--exclude <pattern>` - Exclude files matching pattern
- `--extensions <exts>` - File extensions to format (default: .ex,.exs)
- `--since <commit>` - Format files changed since commit
- `--staged` - Format only staged files

### Output Options

- `--verbose` - Verbose output
- `--quiet` - Minimal output
- `--json` - Output results as JSON
- `--diff` - Show diff of changes

### Help

- `--help, -h` - Show help message

## Examples

```bash
# Format all Elixir files
/elixir-format --all

# Check formatting without making changes
/elixir-format --check

# Format specific files
/elixir-format lib/my_module.ex test/my_test.exs

# Format files changed since last commit
/elixir-format --since HEAD~1

# Format only staged files
/elixir-format --staged

# Format with custom extensions
/elixir-format --extensions ".ex,.exs,.heex"

# Show what would be formatted
/elixir-format --dry-run

# Output JSON results
/elixir-format --check --json
```

## Configuration

### .formatter.exs

```elixir
[
  # Input and output
  inputs: [
    "*.{ex,exs}",
    "priv/*/seeds.exs",
    "{config,lib,test}/**/*.{ex,exs,heex}"
  ],

  # Line length
  line_length: 80,

  # Subdirectories
  subdirectories: ["priv/*/migrations"],

  # Export options
  export: [
    locals_without_parens: [
      # Custom macros/functions
      :my_macro,
      {:assert, 2},
      {:refute, 2}
    ]
  ],

  # Plugins
  plugins: [Phoenix.LiveView.HTMLFormatter],

  # File patterns to exclude
  exclude_patterns: [
    "deps/**",
    "_build/**",
    "assets/**"
  ]
]
```

### Common Configuration Options

#### Line Length

```elixir
line_length: 100  # Increase from default 80
```

#### File Patterns

```elixir
inputs: [
  "*.{ex,exs}",
  "{config,lib,test}/**/*.{ex,exs}",
  "priv/**/seeds.exs",
  "*.{heex,leex}"
]
```

#### Export Configuration

```elixir
export: [
  locals_without_parens: [
    # Testing
    :assert, :refute, :assert_raise, :assert_receive,

    # Phoenix
    :plug, :pipe_through, :get, :post, :put, :patch, :delete,

    # Custom
    :my_macro, :another_macro
  ]
]
```

## Formatting Rules

### Indentation

- 2 spaces per indent level
- Consistent alignment for multi-line expressions
- Proper indentation for pipelines

### Line Breaks

- Break lines at 80 characters (configurable)
- Logical line breaks for function chains
- Consistent line breaks in pattern matching

### Spacing

- Spaces around operators
- No spaces after `[`, `{`, `(`
- No spaces before `]`, `}`, `)`
- Spaces after commas in lists/tuples

### Parentheses

- Omit parentheses for zero-arity function calls
- Include parentheses for function calls with arguments
- Consistent parentheses in macro calls

### Pipelines

- Start pipelines with a raw value
- Break pipelines at logical points
- Consistent indentation for multi-line pipelines

## Integration

### Editor Integration

```elixir
# .editorconfig
[*.{ex,exs,heex}]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Format staged Elixir files
mix format --check-formatted $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ex|exs|heex)$')

if [ $? -ne 0 ]; then
  echo "Some files need formatting. Run: mix format"
  exit 1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/format.yml
name: Format Check
on: [push, pull_request]
jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: erlef/setup-elixir@v1
        with:
          elixir-version: "1.14"
      - run: mix format --check-formatted
```

## Common Issues

### Formatting Conflicts

```bash
# Check for formatting issues
mix format --check-formatted

# Format specific file
mix format path/to/file.ex

# Reset formatting to default
rm .formatter.exs && mix format
```

### Large Codebases

```bash
# Format incrementally
mix format --since HEAD~10

# Format specific directories
mix format lib/ test/

# Exclude generated files
mix format --exclude "**/_build/**" --exclude "**/deps/**"
```

### Custom Macros

```elixir
# Add to .formatter.exs
export: [
  locals_without_parens: [
    :my_custom_macro,
    {:assert, 2},
    {:setup, 1}
  ]
]
```

## Performance Tips

### Incremental Formatting

- Use `--since` for large codebases
- Format only changed files
- Cache formatting results

### Exclude Directories

```elixir
exclude_patterns: [
  "deps/**",
  "_build/**",
  "node_modules/**",
  "priv/static/**"
]
```

### Parallel Formatting

- Format multiple files in parallel
- Use batch processing for large projects
- Consider formatting during CI only

## Related Commands

- `/elixir-lint` - Lint code for style issues
- `/elixir-compile` - Compile formatted code
- `/elixir-test` - Test formatted code
- `/elixir-setup` - Configure formatting

## Environment Variables

- `MIX_ENV` - Mix environment
- `MIX_QUIET` - Suppress output
- `MIX_DEBUG` - Debug output

## Notes

- Requires Elixir 1.6 or later
- Configuration file is `.formatter.exs`
- Formatting is idempotent (running twice has no effect)
- Can be integrated with editors (VS Code, IntelliJ, etc.)
- Formatted code should be committed to version control
