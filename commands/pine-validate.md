# /pine-validate

Validate PineScript syntax and version compatibility.

## Description

Comprehensive validation tool for TradingView PineScript code. Checks syntax, version compatibility, deprecated functions, and common pitfalls. Provides actionable suggestions for fixing issues.

## Usage

```bash
/pine-validate [options] [files...]
```

## Options

- `--fix`, `-f` - Attempt to fix common issues automatically
- `--verbose`, `-v` - Verbose output with detailed information
- `--quiet`, `-q` - Minimal output (errors only)
- `--json` - Output results in JSON format
- `--html` - Generate HTML validation report
- `--version`, `-V <version>` - Validate against specific version (4, 5, 6)
- `--strict` - Enable strict validation (more comprehensive checks)
- `--help`, `-h` - Show this help message

## Examples

```bash
# Validate all .pine files in current directory
/pine-validate

# Validate specific file
/pine-validate my-strategy.pine

# Validate multiple files
/pine-validate indicators/*.pine strategies/*.pine

# Strict validation for PineScript v5
/pine-validate --version=5 --strict

# Attempt to fix common issues
/pine-validate --fix my-indicator.pine

# JSON output for programmatic use
/pine-validate --json --quiet

# Generate HTML report
/pine-validate --html --output=validation-report.html
```

## Validation Checks

### 1. Syntax and Structure

- **File extension**: Must be `.pine`
- **Version declaration**: Checks for `//@version=` comment
- **Function declarations**: Validates `indicator()`, `strategy()`, `library()` usage
- **Plot functions**: Checks for visualization functions (`plot()`, `plotshape()`, etc.)
- **Variable declarations**: Validates variable naming and scope

### 2. Version Compatibility

- **Version detection**: Reads `//@version=` from file
- **Compatibility checking**: Ensures code matches configured version
- **Deprecated functions**: Flags functions removed in newer versions
- **New features**: Warns about features not available in specified version

### 3. Common Pitfalls

- **Look-ahead bias**: Checks for future data access
- **Series handling**: Validates series variable usage
- **Function arguments**: Checks argument types and counts
- **Return values**: Validates function return types

### 4. Best Practices

- **Code organization**: Checks for proper structure
- **Commenting**: Encourages descriptive comments
- **Naming conventions**: Suggests improved variable/function names
- **Performance**: Flags inefficient code patterns

### 5. TradingView Specific

- **Publishing readiness**: Checks requirements for TradingView publishing
- **Alert conditions**: Validates `alertcondition()` usage
- **Input parameters**: Checks `input()` function usage
- **Security functions**: Validates `request.security()` usage (v5+)

## Output Formats

### Console Output (Default)

```
🔍 Validating: my-strategy.pine

📋 Validation Report
==================================================
File: my-strategy.pine
Version: 5
Checks: 8

❌ Errors:
  1. No version declaration found.
     💡 Add //@version=5 or your preferred version

⚠️  Warnings:
  1. security() function is deprecated in v5+.
     💡 Use request.security() instead

📊 Validation Summary:
  Files validated: 1
  Total errors: 1
  Total warnings: 1
```

### JSON Output (`--json`)

```json
{
  "summary": {
    "files": 1,
    "errors": 1,
    "warnings": 1,
    "passed": 0
  },
  "results": [
    {
      "file": "my-strategy.pine",
      "version": "5",
      "checks": [
        {
          "type": "error",
          "message": "No version declaration found.",
          "suggestion": "Add //@version=5 or your preferred version",
          "line": 1,
          "column": 1
        }
      ]
    }
  ]
}
```

### HTML Report (`--html`)

Generates a styled HTML report with:

- File-by-file breakdown
- Color-coded issues (errors/warnings/info)
- Clickable suggestions
- Export functionality

## Auto-Fix Capabilities

With `--fix` flag, the validator can automatically fix common issues:

### Fixable Issues

1. **Add version declaration**: Adds `//@version=5` if missing
2. **Update deprecated functions**:
   - `security()` → `request.security()` (v5+)
   - `study()` → `indicator()` (v5+)
3. **Fix common syntax errors**:
   - Missing semicolons
   - Incorrect function arguments
   - Variable scope issues

### Backup Strategy

- Creates backup of original file with `.backup` extension
- Shows diff of changes before applying
- Requires confirmation for destructive changes

## Configuration Integration

### Project Configuration

Reads from `.opencode/project-config.json`:

```json
{
  "pinescript": {
    "version": "5",
    "projectType": "strategy"
  }
}
```

### Version Override

Use `--version` to override project configuration:

```bash
# Validate as v4 even if project is configured as v5
/pine-validate --version=4 legacy-strategy.pine
```

## Exit Codes

- `0` - All files passed validation (no errors)
- `1` - Validation failed (errors found)
- `2` - Configuration error (missing setup)
- `3` - File not found or unreadable
- `4` - Invalid command line arguments

## Performance

### Validation Speed

- Single file: < 100ms
- Directory with 100 files: ~2-3 seconds
- Can be run in CI/CD pipelines

### Memory Usage

- Minimal memory footprint
- Processes files sequentially
- Suitable for large codebases

## Integration Examples

### CI/CD Pipeline

```yaml
# GitHub Actions example
name: Validate PineScript
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate PineScript
        run: |
          npx everything-opencode /pine-validate --strict
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
echo "Validating PineScript files..."
/pine-validate --quiet
if [ $? -ne 0 ]; then
  echo "❌ PineScript validation failed"
  exit 1
fi
```

### Editor Integration

```json
// VS Code tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate PineScript",
      "type": "shell",
      "command": "/pine-validate ${file}",
      "group": "build"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **"File not found"**

   ```bash
   # Use relative or absolute paths
   /pine-validate ./path/to/file.pine
   ```

2. **"Project not configured"**

   ```bash
   # Run setup first
   /pine-setup
   ```

3. **Version conflicts**

   ```bash
   # Specify version explicitly
   /pine-validate --version=5 my-file.pine
   ```

4. **Permission errors**
   ```bash
   # Check file permissions
   ls -la my-file.pine
   ```

### Debug Mode

```bash
# Enable verbose output for debugging
/pine-validate --verbose my-file.pine

# Check configuration
cat .opencode/project-config.json
```

## Best Practices

1. **Regular Validation**: Run validation before committing changes
2. **Version Consistency**: Keep all files at same PineScript version
3. **Incremental Fixes**: Use `--fix` flag for common issues
4. **CI Integration**: Add to your build pipeline
5. **Team Standards**: Share validation configuration across team

## See Also

- `/pine-setup` - Configure PineScript project
- `/pine-convert` - Convert between PineScript versions
- `/pine-backtest` - Run backtesting on strategies
- `PINESCRIPT-INTEGRATION.md` - Comprehensive PineScript guide
