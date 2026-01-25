# /python-test

Run Python tests with the configured test runner.

## Description

Executes Python tests using the test runner configured in the project's opencode configuration. Supports pytest and unittest with various options for coverage, filtering, and reporting.

## Usage

```bash
/python-test [options]
```

## Options

### Test Selection
- `--all` - Run all tests (default)
- `--file <path>` - Run tests in specific file
- `--test <name>` - Run specific test by name pattern
- `--module <name>` - Run tests in specific module
- `--marker <marker>` - Run tests with specific pytest marker

### Output Options
- `--verbose` - Verbose output
- `--quiet` - Minimal output
- `--coverage` - Generate coverage report
- `--html` - Generate HTML coverage report
- `--xml` - Generate XML test report (JUnit format)

### Behavior Options
- `--failed-first` - Run failed tests first
- `--last-failed` - Only run previously failed tests
- `--no-capture` - Don't capture output (show print statements)
- `--parallel` - Run tests in parallel (if supported)

### Configuration
- `--config <path>` - Use alternative configuration file
- `--setup` - Run test setup/configuration wizard

## Examples

```bash
# Run all tests
/python-test

# Run tests with coverage
/python-test --coverage

# Run specific test file
/python-test --file tests/test_auth.py

# Run tests matching pattern
/python-test --test "test_login*"

# Run with verbose output and HTML coverage
/python-test --verbose --coverage --html

# Run failed tests first
/python-test --failed-first

# Run tests in parallel
/python-test --parallel
```

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "python": {
    "testRunner": "pytest",
    "testOptions": {
      "coverage": true,
      "parallel": false,
      "markers": ["slow", "integration"]
    }
  }
}
```

### Supported Test Runners

1. **pytest** (recommended)
   - Feature-rich testing framework
   - Supports fixtures, parameterization, markers
   - Parallel execution with pytest-xdist
   - Coverage integration with pytest-cov

2. **unittest**
   - Python built-in testing framework
   - Simple and straightforward
   - Good for basic testing needs

## Integration

### With opencode Configuration
- Uses test runner from project configuration
- Respects project-specific test options
- Can override configuration with command-line options

### With CI/CD
- Generates JUnit XML reports for CI systems
- Produces coverage reports for code quality gates
- Exit codes indicate test success/failure

### With Development Workflow
- `--failed-first` for rapid feedback on failing tests
- `--last-failed` to focus on broken tests
- `--parallel` for faster test execution

## Exit Codes

- `0` - All tests passed
- `1` - Tests failed
- `2` - Test execution error
- `3` - Configuration error
- `4` - No tests found

## Implementation

The command:
1. Reads project configuration from `.opencode/project-config.json`
2. Determines test runner (pytest/unittest)
3. Constructs appropriate command based on options
4. Executes tests with proper environment
5. Captures and displays results
6. Generates reports if requested
7. Returns appropriate exit code

## Notes

- Requires Python and the configured test runner to be installed
- Coverage reports require pytest-cov for pytest
- Parallel execution requires pytest-xdist for pytest
- Test discovery follows standard Python conventions
- Configuration can be overridden per-project

## See Also

- `/python-lint` - Run linter and formatter
- `/python-typecheck` - Run type checker
- `/python-deps` - Manage dependencies
- `/python-setup` - Configure Python project