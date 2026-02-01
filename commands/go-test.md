# /go-test

Run Go tests with Go-specific improvements.

## Description

The `/go-test` command runs Go tests with enhanced features including coverage analysis, race detection, benchmarking, and intelligent test execution. It provides detailed reporting, parallel test execution, and integration with Go's testing ecosystem.

## Usage

```bash
/go-test [options] [test-pattern]
```

## Options

### Test Execution

| Option                     | Description                                   |
| -------------------------- | --------------------------------------------- |
| `--coverage`, `-c`         | Generate coverage profile                     |
| `--coverage-profile FILE`  | Coverage profile file (default: coverage.out) |
| `--coverage-mode MODE`     | Coverage mode (set, count, atomic)            |
| `--coverage-format FORMAT` | Coverage format (html, text, xml)             |
| `--coverage-output DIR`    | Coverage output directory                     |
| `--race`                   | Enable race detector                          |
| `--timeout DURATION`       | Test timeout (e.g., "30s", "5m")              |
| `--count N`                | Run tests N times                             |
| `--parallel N`             | Run tests in parallel with N goroutines       |
| `--short`                  | Run short tests only                          |
| `--fail-fast`              | Stop after first test failure                 |

### Benchmarking

| Option                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `--bench`, `-b`        | Run benchmarks instead of tests                  |
| `--benchtime DURATION` | Benchmark duration per test (e.g., "1s", "100x") |
| `--benchmem`           | Print memory allocation statistics               |
| `--cpu LIST`           | Comma-separated list of CPU counts to use        |

### Output Options

| Option            | Description                   |
| ----------------- | ----------------------------- |
| `--verbose`, `-v` | Verbose output                |
| `--json`          | Output results in JSON format |
| `--help`, `-h`    | Show help message             |

## Examples

```bash
# Run all tests
/go-test

# Run tests with coverage
/go-test --coverage

# Run tests with race detector
/go-test --race

# Run specific test
/go-test TestMyFunction

# Run tests matching pattern
/go-test "Test.*Integration"

# Run tests with timeout
/go-test --timeout 30s

# Run tests in parallel
/go-test --parallel 4

# Run benchmarks
/go-test --bench

# Run benchmarks with memory stats
/go-test --bench --benchmem

# Generate HTML coverage report
/go-test --coverage --coverage-format html --coverage-output ./coverage/

# Verbose test output
/go-test --verbose

# Output JSON results
/go-test --json
```

## Test Organization

### Test Files

- Test files end with `_test.go`
- In same package as code being tested
- Can be in separate `_test` package for integration tests

### Test Functions

```go
// Unit test
func TestFunctionName(t *testing.T) {
    // Test logic
}

// Benchmark
func BenchmarkFunctionName(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Benchmark logic
    }
}

// Example (documentation)
func ExampleFunctionName() {
    // Example usage
    // Output: expected output
}
```

### Test Helpers

```go
// Test helper (not run as test)
func helperFunction(t *testing.T) {
    t.Helper() // Marks this as helper function
    // Helper logic
}
```

## Coverage Analysis

### Coverage Modes

- **set**: Whether each statement was executed
- **count**: How many times each statement was executed
- **atomic**: Like count but for parallel tests

### Coverage Reports

```bash
# Generate coverage profile
/go-test --coverage

# Generate HTML report
/go-test --coverage --coverage-format html --coverage-output ./coverage/

# View coverage in terminal
go tool cover -func=coverage.out

# View HTML coverage
go tool cover -html=coverage.out
```

### Coverage Thresholds

```bash
# Check coverage meets threshold
/go-test --coverage --coverage-profile coverage.out
go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//'
```

## Race Detection

### Enabling Race Detector

```bash
# Run tests with race detector
/go-test --race

# Build with race detector for manual testing
go build -race
```

### Common Race Conditions

- Concurrent map access
- Shared variable modification
- Unsynchronized goroutines
- Data races in struct fields

## Benchmarking

### Running Benchmarks

```bash
# Run all benchmarks
/go-test --bench

# Run specific benchmark
/go-test --bench BenchmarkMyFunction

# Run benchmarks with memory stats
/go-test --bench --benchmem

# Set benchmark duration
/go-test --bench --benchtime 5s

# Run benchmarks multiple times
/go-test --bench --count 3
```

### Benchmark Results

```
BenchmarkMyFunction-8   	 1000000	      1203 ns/op	     480 B/op	       5 allocs/op
```

- `-8`: Number of CPUs used
- `1000000`: Number of iterations
- `1203 ns/op`: Time per operation
- `480 B/op`: Bytes allocated per operation
- `5 allocs/op`: Allocations per operation

## Integration

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    /go-test --race --coverage
    go tool cover -func=coverage.out

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: coverage.out
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run tests on changed Go files
if git diff --cached --name-only | grep -q '\.go$'; then
  /go-test ./...
  if [ $? -ne 0 ]; then
    echo "Tests failed. Fix before committing."
    exit 1
  fi
fi
```

### Makefile Integration

```makefile
test:
	/go-test --race --coverage

test-verbose:
	/go-test --verbose

bench:
	/go-test --bench --benchmem

coverage:
	/go-test --coverage --coverage-format html --coverage-output ./coverage/
	open ./coverage/index.html
```

## Performance Tips

### Parallel Testing

```bash
# Use available CPUs
/go-test --parallel $(nproc)

# Limit parallel execution
/go-test --parallel 4
```

### Test Caching

- Go caches test results
- Cache invalidated when code changes
- Use `-count=1` to disable caching

### Selective Testing

```bash
# Test only changed packages
/go-test ./...

# Test specific package
/go-test ./pkg/mypackage

# Test with pattern
/go-test -run "Test.*Integration"
```

## Common Issues

### Test Timeouts

```bash
# Increase timeout
/go-test --timeout 5m

# Debug slow tests
/go-test --verbose
```

### Race Conditions

```bash
# Run with race detector
/go-test --race

# Fix common issues:
# - Use mutexes for shared data
# - Use channels for communication
# - Avoid global variables
```

### Coverage Issues

```bash
# Generate coverage
/go-test --coverage

# Check coverage
go tool cover -func=coverage.out

# Exclude generated code
//go:build !test
```

## Related Commands

- `/go-build` - Build code before testing
- `/go-lint` - Lint code (catches issues before testing)
- `/go-format` - Format code (consistent code style)
- `/go-setup` - Configure testing environment

## Environment Variables

- `GO_TEST_TIMEOUT_SCALE` - Scale test timeouts
- `GO_TEST_JSON` - Output test results as JSON
- `GO_TEST_TRACE` - Generate execution trace
- `GO_TEST_SHORT` - Run short tests only
- `GO_TEST_RACE` - Enable race detector

## Notes

- Tests should be fast and independent
- Use table-driven tests for multiple cases
- Benchmark critical code paths
- Coverage should be meaningful, not just high percentage
- Race detector adds overhead but catches important bugs
- Integration tests may require external services
- Mock dependencies for unit tests
- Test files should be in same package for white-box testing
- Use `_test` package for black-box testing
