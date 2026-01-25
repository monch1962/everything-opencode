# /python-lint

Run Python linter and formatter based on project configuration.

## Description

Executes linting and formatting tools configured for the Python project. Supports ruff, black, flake8, pylint, autopep8, and isort with automatic configuration detection.

## Usage

```bash
/python-lint [options]
```

## Options

### Linting Options
- `--check` - Check code without making changes (default)
- `--fix` - Automatically fix linting issues
- `--strict` - Enable stricter linting rules
- `--ignore <codes>` - Ignore specific error codes
- `--select <codes>` - Only check specific error codes

### Formatting Options
- `--format` - Format code (if formatter configured)
- `--check-format` - Check formatting without changes
- `--line-length <n>` - Set maximum line length
- `--target-version <version>` - Target Python version (py311, py312, etc.)

### File Selection
- `--all` - Check all files (default)
- `--file <path>` - Check specific file
- `--diff` - Only check changed files (git diff)
- `--staged` - Only check staged files (git diff --cached)

### Output Options
- `--verbose` - Verbose output
- `--quiet` - Minimal output
- `--statistics` - Show statistics
- `--json` - Output JSON format
- `--html` - Generate HTML report

### Tool Selection
- `--tool <name>` - Use specific tool (overrides config)
- `--no-lint` - Skip linting
- `--no-format` - Skip formatting

## Examples

```bash
# Check code (no changes)
/python-lint

# Fix linting issues automatically
/python-lint --fix

# Format code
/python-lint --format

# Check and fix with specific line length
/python-lint --fix --format --line-length 100

# Only check changed files
/python-lint --diff

# Use specific tool
/python-lint --tool ruff

# Generate HTML report
/python-lint --html

# Strict checking
/python-lint --strict
```

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "python": {
    "linter": "ruff",
    "formatter": "ruff",
    "lintOptions": {
      "lineLength": 88,
      "targetVersion": "py311",
      "ignore": ["E501", "B008"],
      "select": ["E", "W", "F", "I", "B"]
    }
  }
}
```

### Supported Tools

#### Linters
1. **ruff** (recommended)
   - Extremely fast Python linter
   - Built-in formatter
   - Supports flake8, isort, pyupgrade rules
   - Automatic fixes

2. **flake8**
   - Popular style guide enforcement
   - Plugin ecosystem
   - Good for legacy projects

3. **pylint**
   - Comprehensive code analysis
   - Type checking capabilities
   - Detailed error messages

#### Formatters
1. **ruff format** (if ruff is linter)
   - Fast formatting
   - Consistent with ruff linting

2. **black**
   - Uncompromising code formatter
   - Deterministic output
   - PEP 8 compliant

3. **autopep8**
   - Automatically formats to PEP 8
   - Good for legacy codebases

4. **isort**
   - Python import sorter
   - Can be combined with other formatters

## Integration

### With opencode Configuration
- Uses linter/formatter from project configuration
- Respects project-specific linting options
- Can override configuration with command-line options

### With Git Hooks
- `--diff` and `--staged` options for pre-commit hooks
- Exit codes indicate success/failure
- Can be integrated into CI/CD pipelines

### With Editor Integration
- Output can be parsed by editors for inline display
- JSON output for machine processing
- Exit codes for automation

## Exit Codes

- `0` - No issues found (or all fixed)
- `1` - Issues found (check mode)
- `2` - Tool execution error
- `3` - Configuration error
- `4` - No Python files found

## Implementation

The command:
1. Reads project configuration from `.opencode/project-config.json`
2. Determines linter and formatter tools
3. Discovers Python files to check
4. Constructs appropriate commands based on options
5. Executes tools with proper configuration
6. Captures and displays results
7. Returns appropriate exit code

## Notes

- Requires Python and configured tools to be installed
- ruff is recommended for new projects (fast, all-in-one)
- Can run multiple tools in sequence
- Configuration files (pyproject.toml, .ruff.toml, etc.) are respected
- Git integration requires git to be installed

## See Also

- `/python-test` - Run tests
- `/python-typecheck` - Run type checker
- `/python-deps` - Manage dependencies
- `/python-setup` - Configure Python project