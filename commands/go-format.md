# /go-format

Format Go code with Go-specific improvements.

## Description

The `/go-format` command formats Go source code according to the Go standard formatting rules. It provides enhanced formatting with intelligent defaults, formatting checks, and integration with various Go formatters.

## Usage

```bash
/go-format [options] [paths...]
```

## Options

| Option             | Description                                        |
| ------------------ | -------------------------------------------------- |
| `--write`, `-w`    | Write result to source file instead of stdout      |
| `--diff`, `-d`     | Display diffs instead of rewriting files           |
| `--simplify`, `-s` | Simplify code (apply gofmt -s)                     |
| `--list`, `-l`     | List files whose formatting differs from gofmt's   |
| `--formatter TOOL` | Use specific formatter (gofmt, goimports, gofumpt) |
| `--verbose`, `-v`  | Verbose output                                     |
| `--check`          | Check if files need formatting (dry run)           |
| `--help`, `-h`     | Show help message                                  |

## Examples

```bash
# Check formatting of all Go files
/go-format

# Format all Go files (write changes)
/go-format --write

# Show formatting differences
/go-format --diff

# Simplify and format code
/go-format --simplify --write

# List files needing formatting
/go-format --list

# Check formatting without modifying files
/go-format --check

# Format specific files
/go-format main.go utils.go

# Format specific directory
/go-format ./pkg/

# Format with goimports (organizes imports)
/go-format --formatter goimports

# Verbose output
/go-format --verbose
```

## Formatters

### gofmt (Default)

The standard Go formatter that formats Go programs according to the Go style guide.

```bash
# Use gofmt explicitly
/go-format --formatter gofmt
```

### goimports

gofmt + automatic import management. Adds missing imports and removes unused imports.

```bash
# Use goimports for import management
/go-format --formatter goimports
```

### gofumpt

Stricter gofmt with additional formatting rules. Enforces a stricter format.

```bash
# Use gofumpt for stricter formatting
/go-format --formatter gofumpt
```

## Formatting Rules

### Indentation

- Use tabs for indentation (not spaces)
- Tab width is 8 spaces in display
- Consistent indentation levels

### Line Length

- No hard line length limit
- Break lines at logical points
- Prefer readability over strict limits

### Spacing

- Operators have spaces around them
- Commas have spaces after them
- No spaces inside parentheses
- Proper spacing in control structures

### Braces

- Opening brace on same line
- Closing brace on its own line
- Consistent brace placement

### Imports

- Grouped: standard library, third-party, local
- Alphabetical within groups
- No blank lines within groups
- One blank line between groups

## Integration

### Editor Integration

Most Go editors automatically format on save:

- **VS Code**: Go extension with format on save
- **GoLand**: Built-in formatting
- **Vim**: vim-go plugin
- **Emacs**: go-mode

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check Go formatting
/go-format --check

if [ $? -ne 0 ]; then
  echo "Go files need formatting. Run: /go-format --write"
  exit 1
fi
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Check Go Formatting
  run: /go-format --check
```

## Common Formatting Issues

### Import Organization

```go
// Bad: Unorganized imports
import (
    "fmt"
    "github.com/gorilla/mux"
    "os"
    "strings"
)

// Good: Organized imports
import (
    "fmt"
    "os"
    "strings"

    "github.com/gorilla/mux"
)
```

### Line Breaking

```go
// Bad: Long line
result := veryLongFunctionName(param1, param2, param3, param4, param5, param6)

// Good: Broken at logical point
result := veryLongFunctionName(
    param1, param2, param3,
    param4, param5, param6,
)
```

### Error Handling

```go
// Bad: Inline error handling
if err != nil { return err }

// Good: Separate line for error handling
if err != nil {
    return err
}
```

## Performance Tips

### Batch Formatting

- Format entire directories at once
- Use `--write` for automatic fixes
- Cache formatting results

### Incremental Formatting

- Format only changed files
- Use `--check` in CI/CD
- Format during development, not just before commit

### Large Codebases

- Format in parallel where possible
- Use `.gofmtignore` to exclude files
- Consider formatting as separate CI job

## Configuration

### .gofmtignore

Create a `.gofmtignore` file to exclude files from formatting:

```
# Generated files
*_generated.go
*_pb.go

# Vendor directory
vendor/

# Test data
testdata/
```

### Editor Configuration

```json
// VS Code settings.json
{
  "go.formatTool": "goimports",
  "editor.formatOnSave": true,
  "[go]": {
    "editor.defaultFormatter": "golang.go"
  }
}
```

## Related Commands

- `/go-lint` - Lint Go code (includes formatting checks)
- `/go-build` - Build formatted code
- `/go-test` - Test formatted code
- `/go-setup` - Configure formatting tools

## Environment Variables

- `GOFMT` - Path to gofmt executable
- `GOIMPORTS` - Path to goimports executable
- `GOFUMPT` - Path to gofumpt executable
- `GOPATH` - Go workspace (affects import resolution)

## Notes

- Formatting is idempotent (running twice has no effect)
- Always format before committing code
- Consider using goimports for automatic import management
- gofumpt provides stricter formatting for teams
- Formatting should be checked in CI/CD pipelines
- Generated files should be excluded from formatting
- Formatting rules follow the official Go style guide
