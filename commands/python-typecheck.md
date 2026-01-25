# /python-typecheck

Run Python type checker based on project configuration.

## Description

Executes type checking tools configured for the Python project. Supports pyright and mypy with automatic configuration detection and type inference.

## Usage

```bash
/python-typecheck [options]
```

## Options

### Checking Options
- `--strict` - Enable strict type checking
- `--warn-unused` - Warn about unused imports/ignores
- `--warn-return` - Warn about missing return types
- `--warn-untyped` - Warn about untyped function definitions
- `--ignore-missing` - Ignore missing imports

### File Selection
- `--all` - Check all files (default)
- `--file <path>` - Check specific file
- `--module <name>` - Check specific module
- `--package <name>` - Check specific package
- `--diff` - Only check changed files (git diff)
- `--staged` - Only check staged files (git diff --cached)

### Output Options
- `--verbose` - Verbose output
- `--quiet` - Minimal output
- `--json` - Output JSON format
- `--html` - Generate HTML report
- `--statistics` - Show type checking statistics

### Configuration
- `--config <path>` - Use alternative configuration file
- `--python-version <version>` - Target Python version (3.8, 3.9, etc.)
- `--platform <platform>` - Target platform (linux, win32, darwin)

### Tool Selection
- `--tool <name>` - Use specific tool (overrides config)
- `--pyright` - Use pyright (Microsoft)
- `--mypy` - Use mypy

## Examples

```bash
# Check all files with configured tool
/python-typecheck

# Strict type checking
/python-typecheck --strict

# Check specific file
/python-typecheck --file app/main.py

# Use pyright specifically
/python-typecheck --pyright

# Use mypy with strict mode
/python-typecheck --mypy --strict

# Only check changed files
/python-typecheck --diff

# Generate JSON report
/python-typecheck --json

# Check with specific Python version
/python-typecheck --python-version 3.11
```

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "python": {
    "typeChecker": "pyright",
    "typeCheckOptions": {
      "strict": false,
      "pythonVersion": "3.11",
      "warnUnused": true,
      "warnReturnAny": true
    }
  }
}
```

### Supported Tools

1. **pyright** (recommended)
   - Fast type checker from Microsoft
   - Good editor integration (VS Code, PyCharm)
   - Built-in type inference
   - No runtime dependencies

2. **mypy**
   - Most popular Python type checker
   - Extensive plugin ecosystem
   - Good for complex codebases
   - Can check at runtime

### Type Checking Modes

#### Basic Checking
- Function/method signatures
- Variable assignments
- Import statements
- Basic type inference

#### Strict Checking
- Require type annotations for all functions
- Check generic types
- Verify protocol implementations
- Validate type guards

#### Advanced Features
- Type narrowing with isinstance()
- Literal types
- TypedDict support
- NewType definitions
- Type aliases

## Integration

### With opencode Configuration
- Uses type checker from project configuration
- Respects project-specific type checking options
- Can override configuration with command-line options

### With Editor Integration
- Output can be parsed by editors for inline display
- JSON output for machine processing
- Compatible with VS Code, PyCharm, etc.

### With CI/CD
- Exit codes indicate success/failure
- Can be integrated into quality gates
- Statistics for tracking type coverage

## Exit Codes

- `0` - No type errors found
- `1` - Type errors found
- `2` - Tool execution error
- `3` - Configuration error
- `4` - No Python files found

## Implementation

The command:
1. Reads project configuration from `.opencode/project-config.json`
2. Determines type checker tool (pyright/mypy)
3. Discovers Python files to check
4. Constructs appropriate command based on options
5. Executes type checker with proper configuration
6. Captures and displays results
7. Returns appropriate exit code

## Notes

- Requires Python and configured type checker to be installed
- pyright requires Node.js (installed via npm)
- mypy requires Python package installation
- Configuration files (pyproject.toml, pyrightconfig.json, mypy.ini) are respected
- Type checking can be slow for large codebases (consider incremental checking)
- Some third-party libraries may lack type stubs

## Performance Tips

1. **Use pyright** for faster checking
2. **Enable caching** where available
3. **Check incrementally** with `--diff`
4. **Exclude test files** from checking
5. **Use type stubs** for untyped libraries

## Common Issues

### Missing Type Stubs
```bash
# Install type stubs for common libraries
pip install types-requests types-python-dateutil
```

### Third-party Library Issues
```bash
# Ignore missing imports for specific libraries
/python-typecheck --ignore-missing
```

### Slow Performance
```bash
# Check only changed files
/python-typecheck --diff

# Use faster tool
/python-typecheck --pyright
```

## See Also

- `/python-test` - Run tests
- `/python-lint` - Run linter and formatter
- `/python-deps` - Manage dependencies
- `/python-setup` - Configure Python project