# Go Hello World Example

This example demonstrates Go language support in opencode with Go-specific improvements.

## Project Structure

```
hello-world/
├── main.go          # Main application
├── greeter_test.go  # Tests and benchmarks
└── README.md        # This file
```

## Features Demonstrated

### 1. Go Language Features

- Struct types with methods
- Error handling
- Testing and benchmarking
- Example functions
- Command-line argument parsing

### 2. opencode Integration

- `/go-setup` - Project configuration
- `/go-build` - Building with optimizations
- `/go-test` - Testing with coverage
- `/go-lint` - Code quality checking
- `/go-fmt` - Code formatting
- `/go-deps` - Dependency management

## Usage Examples

### Setup and Configuration

```bash
# Navigate to project directory
cd examples/go-projects/hello-world

# Configure project with opencode
/go-setup --project-type cli --module-name github.com/example/hello-world
```

### Building

```bash
# Build the project
/go-build

# Build with race detector
/go-build --race

# Cross-compile for multiple platforms
/go-build --cross-compile

# Build with version embedding
/go-build --ldflags "-X main.version=1.0.0"
```

### Testing

```bash
# Run all tests
/go-test

# Run tests with coverage
/go-test --coverage

# Run benchmarks
/go-test --bench

# Run with race detector
/go-test --race
```

### Code Quality

```bash
# Format code
/go-fmt --write

# Check formatting
/go-fmt --check

# Lint code
/go-lint

# Lint and fix issues
/go-lint --fix
```

### Dependencies

```bash
# Tidy dependencies
/go-deps tidy

# Run security audit
/go-deps security

# Update dependencies
/go-deps update-all
```

## Go-Specific Improvements

### 1. Smart Build System

- Automatic output directory management
- Cross-compilation support
- Race detector integration
- Build information display
- Error suggestion system

### 2. Comprehensive Testing

- Unit test execution
- Benchmark support
- Coverage reporting
- Race detection
- Example function validation

### 3. Code Quality Tools

- Multiple linter support (golangci-lint, staticcheck, revive)
- Automatic formatting with gofmt/goimports
- Import organization
- Security vulnerability scanning

### 4. Dependency Management

- Go modules integration
- Security auditing
- Version constraint management
- Vendor directory support

## Project Configuration

After running `/go-setup`, the following configuration is created:

### `.opencode/go-config.json`

```json
{
  "go": {
    "version": "1.21.0",
    "module": "github.com/example/hello-world",
    "projectType": "cli",
    "tools": {
      "linter": "golangci-lint",
      "formatter": "goimports",
      "testRunner": "gotestsum"
    },
    "testing": {
      "coverage": {
        "enabled": true,
        "threshold": 80
      }
    }
  }
}
```

### `.golangci.yml`

```yaml
run:
  timeout: 5m
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - staticcheck
    - typecheck
```

## Testing Features

### Unit Tests

- Test table-driven patterns
- Subtest support
- Error case testing
- Edge case coverage

### Benchmarks

- Performance measurement
- Memory allocation tracking
- Comparative analysis

### Examples

- Documentation examples
- Output validation
- Usage demonstration

## Build Output

### Standard Build

```bash
$ /go-build
🔨 Building Go project...
📊 Build Information:
========================================
Go: go version go1.21.0 darwin/amd64
Module: github.com/example/hello-world
Output: ./bin/hello-world
✅ Build successful!
```

### Cross-Compilation

```bash
$ /go-build --cross-compile
🌍 Cross-compiling for multiple platforms...
📊 Cross-compilation summary:
========================================
✅ Successful: 5
❌ Failed: 0
📁 Built binaries:
   • linux/amd64: ./bin/hello-world-linux-amd64
   • linux/arm64: ./bin/hello-world-linux-arm64
   • darwin/amd64: ./bin/hello-world-darwin-amd64
   • darwin/arm64: ./bin/hello-world-darwin-arm64
   • windows/amd64: ./bin/hello-world-windows-amd64.exe
```

## Running the Application

```bash
# Run the built binary
./bin/hello-world

# With command line arguments
./bin/hello-world Alice

# With loud mode
./bin/hello-world Bob --loud
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Go CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: /go-test --coverage --race
      - run: /go-lint
      - run: /go-fmt --check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: /go-build --cross-compile
```

## Next Steps

1. **Add more features** to the Greeter type
2. **Implement additional tests** for edge cases
3. **Add integration tests** for CLI behavior
4. **Create API documentation** with godoc
5. **Set up CI/CD pipeline** with the provided examples

## See Also

- [Go Documentation](https://golang.org/doc/)
- [Go Modules](https://go.dev/ref/mod)
- [golangci-lint](https://golangci-lint.run/)
- [opencode Go Integration](../README.md)
