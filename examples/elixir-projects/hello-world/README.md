# Elixir Hello World Example

This example demonstrates Elixir language support in opencode with Elixir-specific improvements.

## Project Structure

```
hello-world/
├── lib/
│   └── hello_world.ex      # Main application module
├── test/
│   └── hello_world_test.exs # Tests
├── mix.exs                 # Project configuration
└── README.md               # This file
```

## Features Demonstrated

### 1. Elixir Language Features

- Module and function definitions
- Pattern matching
- Pipe operator
- Struct types
- Documentation with @moduledoc and @doc
- Type specifications with @spec

### 2. opencode Integration

- `/elixir-setup` - Project configuration
- `/elixir-compile` - Compilation with optimizations
- `/elixir-test` - Testing with coverage
- `/elixir-lint` - Code quality checking with Credo
- `/elixir-format` - Code formatting
- `/elixir-deps` - Dependency management
- `/elixir-typecheck` - Type checking with Dialyzer

## Usage Examples

### Setup and Configuration

```bash
# Navigate to project directory
cd examples/elixir-projects/hello-world

# Configure project with opencode
/elixir-setup --project-type application --app-name hello_world
```

### Compilation

```bash
# Compile the project
/elixir-compile

# Force clean compilation
/elixir-compile --force

# Compile with warnings as errors
/elixir-compile --warnings-as-errors
```

### Testing

```bash
# Run all tests
/elixir-test

# Run tests with coverage
/elixir-test --coverage

# Run specific test file
/elixir-test test/hello_world_test.exs

# Run with random seed
/elixir-test --seed 12345
```

### Code Quality

```bash
# Format code
/elixir-format

# Check formatting
/elixir-format --check

# Lint code
/elixir-lint

# Lint with strict mode
/elixir-lint --strict
```

### Dependencies

```bash
# Get dependencies
/elixir-deps get

# Show dependency tree
/elixir-deps tree

# Check for outdated dependencies
/elixir-deps outdated
```

### Type Checking

```bash
# Run type checking
/elixir-typecheck

# Ignore warnings
/elixir-typecheck --ignore-warnings

# List unused functions
/elixir-typecheck --list-unused
```

## Elixir-Specific Improvements

### 1. Smart Compilation System

- Automatic dependency resolution
- Parallel compilation where possible
- Warning categorization and filtering
- Compilation profile support
- Environment-specific compilation
- Built-in compilation caching

### 2. Comprehensive Testing

- ExUnit integration with all features
- Test coverage with detailed reports
- Parallel test execution
- Test filtering and tagging
- Random seed for reproducible tests
- Slow test detection
- Failure limiting

### 3. Code Quality Tools

- Credo integration with 60+ checks
- Built-in formatter with configurable line length
- Dialyzer integration for type checking
- Custom configuration via .credo.exs and .formatter.exs
- Priority-based issue filtering
- Multiple output formats

### 4. Dependency Management

- Hex package manager integration
- Semantic versioning support
- Dependency locking with mix.lock
- Environment-specific dependencies
- Git and local dependencies
- Override and conflict resolution

## Project Configuration

After running `/elixir-setup`, the following configuration is created:

### `.opencode/elixir-config.json`

```json
{
  "language": "elixir",
  "version": "1.0",
  "config": {
    "projectType": "application",
    "elixir": {
      "version": "1.19.5",
      "otpVersion": "26"
    },
    "tools": {
      "formatter": "formatter",
      "linter": "credo",
      "typeChecker": "dialyzer",
      "testRunner": "exunit"
    },
    "testing": {
      "async": true,
      "coverage": true,
      "seed": "random"
    },
    "formatting": {
      "lineLength": 98,
      "inputs": ["*.{ex,exs}", "{config,lib,test}/**/*.{ex,exs}"]
    }
  }
}
```

### `.formatter.exs`

```elixir
[
  inputs: ["*.{ex,exs}", "{config,lib,test}/**/*.{ex,exs}"],
  line_length: 98
]
```

## Testing Features

### Unit Tests

- Test table-driven patterns
- Setup and teardown callbacks
- Custom assertions
- Property-based testing with StreamData
- Test tagging and filtering

### Integration Tests

- External service integration
- Database testing with Ecto
- API endpoint testing
- Concurrent test execution
- Test fixtures and factories

### Examples

- Documentation examples with output validation
- Usage demonstration
- Interactive examples in IEx
- Example-based testing

## Running the Application

```bash
# Start IEx with the project loaded
iex -S mix

# Run a specific function
iex> HelloWorld.greet("World")
"Hello, World!"

# Run the application
mix run -e 'HelloWorld.main()'
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Elixir CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: erlef/setup-elixir@v1
        with:
          elixir-version: "1.19"
          otp-version: "26"
      - run: /elixir-test --coverage
      - run: /elixir-lint --strict
      - run: /elixir-format --check
      - run: /elixir-typecheck

  compile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: erlef/setup-elixir@v1
        with:
          elixir-version: "1.19"
          otp-version: "26"
      - run: /elixir-compile --env prod
```

## Next Steps

1. **Add more features** to the HelloWorld module
2. **Implement additional tests** for edge cases
3. **Add integration tests** for external services
4. **Create API documentation** with ExDoc
5. **Set up CI/CD pipeline** with the provided examples

## See Also

- [Elixir Documentation](https://elixir-lang.org/docs.html)
- [Mix Build Tool](https://hexdocs.pm/mix/Mix.html)
- [Hex Package Manager](https://hex.pm/docs)
- [Credo Code Analysis](https://hexdocs.pm/credo/overview.html)
- [Dialyzer Type Checking](https://hexdocs.pm/dialyxir/readme.html)
- [opencode Elixir Integration](../ELIXIR-INTEGRATION.md)
