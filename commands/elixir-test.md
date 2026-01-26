# /elixir-test

Run Elixir tests with ExUnit and Elixir-specific improvements.

## Description

Executes Elixir tests using ExUnit with support for coverage, filtering, parallel execution, and advanced test features. Integrates with Elixir's test ecosystem including property-based testing with StreamData.

## Usage

```bash
/elixir-test [options] [test-file]
```

## Options

### Test Selection

- `--file, -f FILE` - Run specific test file
- `--directory, -d DIR` - Run tests in specific directory
- `--only PATTERN` - Run only tests matching pattern
- `--exclude PATTERN` - Exclude tests matching pattern

### Test Execution

- `--seed SEED` - Set random seed for reproducible tests
- `--max-failures N` - Stop after N failures
- `--timeout MS` - Set test timeout in milliseconds
- `--trace, -t` - Trace test execution
- `--verbose, -v` - Verbose output
- `--slowest N` - Show N slowest tests

### Coverage & Reporting

- `--coverage, -c` - Generate test coverage report
- `--html` - Generate HTML coverage report
- `--json` - Generate JSON test report

### Help

- `--help, -h` - Show help message

## Examples

```bash
# Run all tests
/elixir-test

# Run tests with coverage
/elixir-test --coverage

# Run specific test file
/elixir-test test/my_test.exs

# Run only integration tests
/elixir-test --only "integration"

# Stop after 3 failures
/elixir-test --max-failures 3

# Show 10 slowest tests
/elixir-test --slowest 10

# Run tests with specific seed
/elixir-test --seed 12345
```

## Elixir-Specific Features

### ExUnit Integration

- Full ExUnit integration with all features
- Parallel test execution
- Test filtering and tagging
- Random seed for reproducible tests
- Slow test detection
- Failure limiting

### Test Organization

- Unit tests in `test/` directory
- Integration tests with `async: false`
- Property-based testing with StreamData
- Test fixtures and setup/teardown
- Custom assertions and helpers

### Coverage Reports

- HTML coverage report in `cover/` directory
- Line coverage percentage
- Missing coverage highlighting
- Coverage summary in console

### Common Patterns

- `describe` blocks for test organization
- `setup` and `setup_all` callbacks
- Custom tags for test categorization
- Shared examples with `ExUnit.CaseTemplate`

## Configuration

The command reads from `.opencode/project-config.json` for project-specific settings:

- Test directory location
- Default test options
- Coverage configuration
- Parallel execution settings

## Environment Variables

- `MIX_ENV` - Mix environment (default: `test`)
- `EXUNIT_MAX_FAILURES` - Maximum failures before stopping
- `EXUNIT_SEED` - Random seed for tests
- `EXUNIT_TRACE` - Enable test tracing

## Related Commands

- `/elixir-setup` - Configure Elixir project
- `/elixir-compile` - Compile Elixir code
- `/elixir-lint` - Lint Elixir code
- `/elixir-format` - Format Elixir code
- `/elixir-typecheck` - Type check Elixir code
- `/elixir-deps` - Manage dependencies

## Notes

- Requires Elixir and Mix to be installed
- Coverage requires `:excoveralls` or similar in `mix.exs`
- Parallel tests require proper test isolation
- Property-based tests may require `:stream_data` dependency
