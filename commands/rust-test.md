# Rust Test Command

Run Rust tests with Cargo, featuring comprehensive test execution, coverage analysis, and intelligent test discovery.

## Overview

The `/rust-test` command runs Rust tests using Cargo's test runner with enhanced features for development and CI/CD. It provides detailed test reporting, coverage analysis, parallel execution, and supports multiple test types including unit tests, integration tests, documentation tests, and benchmarks.

## Features

- **Cargo Test Integration**: Full Cargo test compatibility with enhanced features
- **Parallel Test Execution**: Run tests in parallel for faster execution
- **Coverage Analysis**: Generate code coverage reports
- **Test Discovery**: Intelligent test discovery and filtering
- **Watch Mode**: Continuous testing during development
- **Multiple Test Types**: Unit, integration, doc, and benchmark tests
- **Detailed Reporting**: Comprehensive test results with failure analysis
- **CI/CD Ready**: Exit codes and formatted output for pipelines
- **Performance Profiling**: Identify slow tests and bottlenecks

## Usage

```bash
/rust-test [options] [test-filters...]
```

### Options

| Option       | Short | Description                       |
| ------------ | ----- | --------------------------------- |
| `--watch`    | `-w`  | Watch mode for continuous testing |
| `--parallel` | `-p`  | Run tests in parallel             |
| `--coverage` | `-c`  | Generate coverage report          |
| `--bench`    | `-b`  | Run benchmarks                    |
| `--doc`      | `-d`  | Run documentation tests           |
| `--filter`   | `-f`  | Filter tests by name              |
| `--report`   | `-r`  | Specify report format             |
| `--verbose`  | `-v`  | Show detailed test output         |
| `--help`     | `-h`  | Show help message                 |

## Examples

### Run all tests

```bash
/rust-test
```

Runs all tests in the project.

### Watch mode

```bash
/rust-test --watch
```

Continuously runs tests as files change.

### With coverage

```bash
/rust-test --coverage --report html
```

Runs tests and generates HTML coverage report.

### Run benchmarks

```bash
/rust-test --bench
```

Runs benchmark tests.

### Filter tests

```bash
/rust-test --filter "test_function_name"
```

Runs only tests containing "test_function_name" in their name.

### Parallel execution

```bash
/rust-test --parallel 4
```

Runs tests using 4 parallel workers.

### Documentation tests

```bash
/rust-test --doc
```

Runs documentation tests only.

## Configuration

### Cargo.toml Test Configuration

Configure test behavior in `Cargo.toml`:

```toml
[package]
name = "my-crate"
version = "0.1.0"

# Test configuration
[package.metadata.test]
# Default test settings
default-profile = "dev"
parallel = true
timeout = 30

# Profile-specific settings
[package.metadata.test.profiles]
dev = {
    features = ["dev"],
    env = { "RUST_LOG" = "debug" },
    filter = "not slow"
}
ci = {
    features = [],
    env = { "RUST_LOG" = "info" },
    parallel = true,
    coverage = true
}

# Test type configuration
[package.metadata.test.types]
unit = {
    path = "tests/unit",
    pattern = "*_test.rs"
}
integration = {
    path = "tests/integration",
    pattern = "*.rs"
}
bench = {
    path = "benches",
    pattern = "*.rs"
}
```

### Test Filter Configuration

Create `.test-filter.toml` for custom test filtering:

```toml
# .test-filter.toml
# Include/exclude patterns
include = ["*test*"]
exclude = ["*slow*", "*integration*"]

# Test categories
[categories]
unit = ["test_*"]
integration = ["integration_*"]
benchmark = ["bench_*"]

# Tag-based filtering
[tags]
slow = { action = "skip" }
flaky = { action = "retry", retries = 3 }
critical = { action = "run-first" }
```

## Test Types

### Unit Tests

```rust
// src/lib.rs or src/*.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    #[should_panic]
    fn test_panic() {
        panic!("This test should panic");
    }
}
```

### Integration Tests

```rust
// tests/integration_test.rs
use my_crate;

#[test]
fn integration_test() {
    let result = my_crate::some_function();
    assert!(result.is_ok());
}
```

### Documentation Tests

````rust
/// Example documentation
///
/// ```
/// use my_crate::add;
/// assert_eq!(add(2, 2), 4);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
````

### Benchmark Tests

```rust
// benches/my_benchmark.rs
use criterion::{criterion_group, criterion_main, Criterion};
use my_crate;

fn benchmark_function(c: &mut Criterion) {
    c.bench_function("my_function", |b| {
        b.iter(|| my_crate::my_function());
    });
}

criterion_group!(benches, benchmark_function);
criterion_main!(benches);
```

## Test Execution

### Parallel Execution

```bash
/rust-test --parallel --jobs 4
```

- Runs tests in isolated processes
- Configurable worker count
- Resource isolation between workers
- Aggregated results reporting

### Coverage Analysis

```bash
/rust-test --coverage --formats html,lcov
```

- Line coverage analysis
- Branch coverage (when supported)
- Multiple output formats
- Coverage thresholds and alerts

### Watch Mode

```bash
/rust-test --watch --delay 500
```

- File system monitoring
- Incremental test runs
- Smart test selection (only changed tests)
- Configurable debounce delay

### Test Filtering

```bash
# Run only unit tests
/rust-test --test

# Run only integration tests
/rust-test --test --test-type integration

# Run tests matching pattern
/rust-test --test --pattern "*auth*"

# Exclude slow tests
/rust-test --test --exclude "*slow*"
```

## Integration

### With Development

```bash
# Run tests during development
/rust-test --watch

# Run specific test module
/rust-test tests/auth_test.rs

# Run tests from REPL
/rust-repl
// In REPL: cargo test -- --nocapture
```

### With Build Process

```bash
# Test before building
/rust-test && /rust-build

# Test as part of build
/rust-build --with-tests

# Test release build
/rust-test --release
```

### With Code Quality Tools

```bash
# Complete quality pipeline
/rust-fmt --check && /rust-clippy && /rust-test

# Test with coverage
/rust-test --coverage --threshold 80

# Test with performance profiling
/rust-test --profile
```

### In CI/CD Pipelines

```bash
# Run tests in CI
/rust-test --parallel --report junit --coverage

# Fail pipeline on test failure
/rust-test || exit 1

# Generate test artifacts
/rust-test --artifacts
```

## Performance Optimization

### Test Selection

```bash
# Run only fast tests
/rust-test --filter "not slow"

# Run specific test suites
/rust-test --suite unit --suite integration

# Run tests changed since commit
/rust-test --changed-since HEAD
```

### Parallel Execution Tuning

```bash
# Auto-detect optimal workers
/rust-test --parallel auto

# Limit memory per worker
/rust-test --parallel --worker-memory 512m

# Isolate heavy tests
/rust-test --isolate "heavy.*test"
```

### Caching and Incremental Testing

```bash
# Cache test results
/rust-test --cache

# Only run failed tests
/rust-test --only-failed

# Skip passing tests
/rust-test --skip-passing
```

## Reporting

### Report Formats

```bash
# Pretty terminal output (default)
/rust-test --report pretty

# JUnit XML for CI
/rust-test --report junit --output test-results.xml

# JSON for programmatic processing
/rust-test --report json --output test-results.json

# TeamCity format
/rust-test --report teamcity

# Custom format
/rust-test --report custom --template custom.toml
```

### Coverage Reports

```bash
# HTML report
/rust-test --coverage --report html --output coverage/

# LCOV for codecov
/rust-test --coverage --report lcov --output lcov.info

# Multiple formats
/rust-test --coverage --formats html,lcov,clover
```

### Failure Analysis

```bash
# Show detailed failure information
/rust-test --verbose --show-stack-traces

# Retry flaky tests
/rust-test --retry 3 --flaky-threshold 0.8

# Generate failure report
/rust-test --failure-report failures.json
```

## Advanced Features

### Property-Based Testing

```bash
# Run property-based tests
/rust-test --property

# Configure quickcheck
/rust-test --property --quickcheck-iterations 1000

# Generate property test reports
/rust-test --property-report property.html
```

### Fuzz Testing

```bash
# Run fuzz tests
/rust-test --fuzz

# Configure fuzzing
/rust-test --fuzz --timeout 60 --iterations 10000

# Generate fuzz test reports
/rust-test --fuzz-report fuzz.json
```

### Mutation Testing

```bash
# Run mutation tests
/rust-test --mutation

# Configure mutation testing
/rust-test --mutation --mutants 100

# Generate mutation test reports
/rust-test --mutation-report mutation.html
```

## Troubleshooting

### Common Issues

#### Test Discovery Problems

```bash
# Force test discovery
/rust-test --discover --verbose

# Specify test directories
/rust-test --test-dirs tests,benches

# Use custom test pattern
/rust-test --pattern "*_spec.rs"
```

#### Memory Issues

```bash
# Increase memory for tests
/rust-test --memory 2g

# Isolate memory-intensive tests
/rust-test --isolate-memory "memory.*test"

# Enable GC between tests
/rust-test --gc-between-tests
```

#### Slow Tests

```bash
# Profile test execution
/rust-test --profile

# Identify slow tests
/rust-test --slow-threshold 1000

# Run slow tests separately
/rust-test --filter "slow" --timeout 60
```

#### Flaky Tests

```bash
# Retry flaky tests
/rust-test --retry 3 --flaky

# Mark tests as flaky
/rust-test --flaky-tags flaky,unreliable

# Generate flaky test report
/rust-test --flaky-report flaky.json
```

### Debugging

#### Test Failures

```bash
# Run with debug output
/rust-test --debug --verbose

# Isolate failing test
/rust-test --filter "failing.test.name"

# Run with REPL on failure
/rust-test --repl-on-failure
```

#### Coverage Issues

```bash
# Debug coverage collection
/rust-test --coverage --debug-coverage

# Check coverage thresholds
/rust-test --coverage --threshold 80

# Generate coverage diff
/rust-test --coverage-diff HEAD~1
```

#### Performance Problems

```bash
# Generate flame graph
/rust-test --flamegraph

# Profile specific tests
/rust-test --profile --filter "slow.*"

# Memory profiling
/rust-test --profile-memory
```

## Related Commands

- `/rust-build` - Build Rust projects
- `/rust-run` - Run Rust applications
- `/rust-check` - Check code
- `/rust-clippy` - Lint code
- `/rust-fmt` - Format code
- `/rust-doc` - Generate documentation
- `/js-test` - Test JavaScript/TypeScript
- `/python-test` - Test Python code
