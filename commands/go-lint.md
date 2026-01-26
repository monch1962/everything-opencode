# /go-lint

Lint Go code with Go-specific improvements.

## Description

The `/go-lint` command performs static analysis on Go code to identify bugs, style issues, and potential problems. It supports multiple linters including golangci-lint, staticcheck, and revive with intelligent configuration and automatic fixes.

## Usage

```bash
/go-lint [options] [paths...]
```

## Options

| Option                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `--fix`                   | Automatically fix issues where possible                  |
| `--verbose`, `-v`         | Verbose output                                           |
| `--timeout DURATION`      | Timeout for linting (e.g., "5m", "30s")                  |
| `--config FILE`           | Use custom configuration file                            |
| `--linter TOOL`           | Use specific linter (golangci-lint, staticcheck, revive) |
| `--fast`                  | Run only fast linters                                    |
| `--no-config`             | Don't use config file (use defaults)                     |
| `--out-format FORMAT`     | Output format (colored-line-number, json, etc.)          |
| `--issues-exit-code CODE` | Exit code when issues found (default: 1)                 |
| `--help`, `-h`            | Show help message                                        |

## Examples

```bash
# Lint all Go files in current directory
/go-lint

# Lint with automatic fixes
/go-lint --fix

# Lint specific files
/go-lint main.go utils.go

# Lint directory
/go-lint ./pkg/

# Use specific linter
/go-lint --linter staticcheck

# Use custom configuration
/go-lint --config .golangci.custom.yml

# Verbose output
/go-lint --verbose

# Fast linting (skip slow linters)
/go-lint --fast

# Set timeout
/go-lint --timeout 5m

# Output JSON format
/go-lint --out-format json
```

## Supported Linters

### golangci-lint (Default)

Fast, parallel linter that runs multiple linters simultaneously.

```bash
# Use golangci-lint explicitly
/go-lint --linter golangci-lint
```

### staticcheck

Advanced static analysis with focus on correctness.

```bash
# Use staticcheck for correctness analysis
/go-lint --linter staticcheck
```

### revive

Fast, configurable linter with focus on code style.

```bash
# Use revive for style checking
/go-lint --linter revive
```

## Common Linting Issues

### Style Issues

- **Naming conventions**: Exported vs unexported names
- **Comment formatting**: Proper godoc comments
- **Function length**: Functions should be focused
- **Cognitive complexity**: Code should be understandable

### Potential Bugs

- **Unused variables**: Variables declared but not used
- **Shadowed variables**: Variables shadowing outer scope
- **Error handling**: Unhandled errors
- **Nil pointer dereferences**: Potential nil pointer access

### Performance Issues

- **Inefficient allocations**: Unnecessary memory allocations
- **Loop variable capture**: Goroutine closure issues
- **String concatenation**: Inefficient string building

### Security Issues

- **Hardcoded credentials**: Secrets in code
- **Insecure randomness**: Weak random number generation
- **Command injection**: Unsafe command execution

## Configuration

### .golangci.yml (golangci-lint)

```yaml
run:
  timeout: 5m
  modules-download-mode: readonly

linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - typecheck
    - unused

linters-settings:
  gocyclo:
    min-complexity: 15
  revive:
    rules:
      - name: exported
        severity: warning

issues:
  exclude-use-default: false
  max-issues-per-linter: 0
  max-same-issues: 0
```

### .staticcheck.conf (staticcheck)

```json
{
  "checks": ["all"],
  "initialisms": ["API", "HTTP", "ID", "JSON", "URL"],
  "dot-import-whitelist": []
}
```

### revive.toml (revive)

```toml
ignoreGeneratedHeader = false
severity = "warning"
confidence = 0.8

[rule.blank-imports]
[rule.context-as-argument]
[rule.context-keys-type]
[rule.dot-imports]
[rule.error-return]
[rule.error-strings]
[rule.error-naming]
```

## Integration

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Lint Go files
/go-lint $(git diff --cached --name-only --diff-filter=ACM | grep '\.go$')

if [ $? -ne 0 ]; then
  echo "Linting failed. Fix issues before committing."
  exit 1
fi
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Lint Go Code
  run: /go-lint
```

### Editor Integration

- **VS Code**: Go extension with linting
- **GoLand**: Built-in linting
- **Vim**: ALE or vim-go with linting
- **Emacs**: flycheck with go-mode

## Automatic Fixes

### Available Fixes

- **Unused imports**: Remove unused imports
- **Simplify code**: Apply simplifications
- **Formatting**: Fix formatting issues
- **Error handling**: Suggest better error patterns

### Using --fix Flag

```bash
# Automatically fix issues
/go-lint --fix

# Fix and show what was fixed
/go-lint --fix --verbose
```

## Performance Tips

### Caching

- golangci-lint supports caching
- Cache linting results between runs
- Clear cache with `golangci-lint cache clean`

### Parallel Linting

- golangci-lint runs linters in parallel
- Use `--concurrency` flag for control
- Consider machine resources

### Selective Linting

- Lint only changed files
- Use `--fast` for quick feedback
- Disable slow linters in development

## Common Issues and Solutions

### Missing Linter

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Install staticcheck
go install honnef.co/go/tools/cmd/staticcheck@latest

# Install revive
go install github.com/mgechev/revive@latest
```

### Configuration Issues

```bash
# Generate default configuration
golangci-lint config init

# Use default configuration
/go-lint --no-config

# Debug configuration
golangci-lint run --debug
```

### False Positives

```yaml
# In .golangci.yml
issues:
  exclude:
    - "EXC0001" # Exclude specific check
    - "from regexp:.*" # Exclude by regex
```

## Related Commands

- `/go-fmt` - Format code (complements linting)
- `/go-build` - Build code (catches compilation errors)
- `/go-test` - Test code (catches runtime issues)
- `/go-setup` - Configure linting tools

## Environment Variables

- `GOLANGCI_LINT_CACHE` - Cache directory for golangci-lint
- `STATICCHECK_CONFIG` - Configuration file for staticcheck
- `REVIVE_CONFIG` - Configuration file for revive
- `GO111MODULE` - Go modules mode (affects linting)

## Notes

- Linting should be part of development workflow
- Consider different linters for different purposes
- Automatic fixes (`--fix`) are safe but review changes
- Configuration can be shared across team
- Linting in CI/CD catches issues early
- Regular updates to linters improve detection
- Custom rules can be added for project-specific requirements
