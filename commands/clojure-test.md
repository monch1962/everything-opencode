# Clojure Test Command

Run Clojure tests with comprehensive reporting, coverage analysis, and intelligent test discovery.

## Overview

The `/clojure-test` command runs Clojure and ClojureScript tests using the appropriate test runner for your project. It provides detailed test reporting, coverage analysis, and supports multiple test frameworks with intelligent test discovery and execution.

## Features

- **Multiple Test Framework Support**: Works with clojure.test, Midje, Expectations, and more
- **Intelligent Test Discovery**: Automatically finds and runs tests in your project
- **Parallel Test Execution**: Runs tests in parallel for faster execution
- **Coverage Analysis**: Generates code coverage reports
- **Watch Mode**: Continuous testing during development
- **Test Filtering**: Run specific tests or test suites
- **Detailed Reporting**: Comprehensive test results with failure analysis
- **CI/CD Integration**: Exit codes and formatted output for pipelines
- **Performance Profiling**: Identify slow tests and bottlenecks

## Usage

```bash
/clojure-test [options] [test-selectors...]
```

### Options

| Option       | Short | Description                       |
| ------------ | ----- | --------------------------------- |
| `--watch`    | `-w`  | Watch mode for continuous testing |
| `--parallel` | `-p`  | Run tests in parallel             |
| `--coverage` | `-c`  | Generate coverage report          |
| `--filter`   | `-f`  | Filter tests by name or tag       |
| `--report`   | `-r`  | Specify report format             |
| `--verbose`  | `-v`  | Show detailed test output         |
| `--timeout`  | `-t`  | Set test timeout (seconds)        |
| `--help`     | `-h`  | Show help message                 |

## Examples

### Run all tests

```bash
/clojure-test
```

Runs all tests in the project.

### Watch mode

```bash
/clojure-test --watch
```

Continuously runs tests as files change.

### With coverage

```bash
/clojure-test --coverage --report html
```

Runs tests and generates HTML coverage report.

### Filter tests

```bash
/clojure-test --filter "integration" --filter "slow"
```

Runs only tests tagged with "integration" or "slow".

### Parallel execution

```bash
/clojure-test --parallel 4
```

Runs tests using 4 parallel workers.

### Specific namespace

```bash
/clojure-test my.app.core-test
```

Runs tests in the `my.app.core-test` namespace.

## Configuration

### Test Framework Detection

The command automatically detects your test configuration:

1. **clojure.test**: Default Clojure test framework
2. **Midje**: Fact-based testing framework
3. **Expectations**: Minimalist testing framework
4. **cljs.test**: ClojureScript testing
5. **Custom runners**: Project-specific test runners

### Project Configuration

Create `.opencode/clojure-test.json` for custom test configuration:

```json
{
  "defaults": {
    "parallel": true,
    "workers": 4,
    "timeout": 30,
    "report": "pretty"
  },
  "coverage": {
    "enabled": true,
    "formats": ["html", "lcov"],
    "exclude": ["test/**", "target/**"]
  },
  "watch": {
    "delay": 100,
    "paths": ["src/**", "test/**"],
    "ignore": ["target/**", ".git/**"]
  },
  "profiles": {
    "ci": {
      "parallel": true,
      "report": "junit",
      "coverage": true
    },
    "dev": {
      "watch": true,
      "parallel": false,
      "verbose": true
    }
  }
}
```

### Build Tool Specific Configuration

#### Leiningen (`project.clj`)

```clojure
:profiles {:test {:dependencies [[cloverage "1.2.2"]]}
           :ci {:test-selectors {:default (complement :integration)
                                 :integration :integration}}}
:test-selectors {:default (constantly true)
                 :integration :integration}
```

#### deps.edn

```clojure
:aliases {:test {:extra-paths ["test"]
                 :extra-deps {io.github.cognitect-labs/test-runner
                              {:git/tag "v0.5.1" :git/sha "dfb30dd"}}
                 :main-opts ["-m" "cognitect.test-runner"]}}
```

#### Boot (`build.boot`)

```clojure
(deftask test
  "Run tests"
  [e environment ENV str "Test environment"]
  (merge-env! :source-paths #{"test"})
  (test :namespaces #{'my.app.test}))
```

## Test Execution

### Test Discovery

The command discovers tests using multiple strategies:

1. **Namespace pattern**: Looks for `*-test` namespaces
2. **Directory structure**: Tests in `test/` directory
3. **Metadata scanning**: Finds test functions with `:test` metadata
4. **Custom patterns**: Project-specific test patterns

### Parallel Execution

```bash
/clojure-test --parallel --workers 4
```

- Runs tests in isolated classloaders
- Configurable worker count
- Resource isolation between workers
- Aggregated results reporting

### Coverage Analysis

```bash
/clojure-test --coverage --formats html,lcov
```

- Line coverage analysis
- Branch coverage (when supported)
- Multiple output formats
- Coverage thresholds and alerts

### Watch Mode

```bash
/clojure-test --watch --delay 500
```

- File system monitoring
- Incremental test runs
- Smart test selection (only changed tests)
- Configurable debounce delay

## Test Frameworks

### clojure.test

```clojure
(ns my.app.core-test
  (:require [clojure.test :refer :all]
            [my.app.core :refer :all]))

(deftest addition-test
  (is (= 4 (+ 2 2)))
  (is (thrown? ArithmeticException (/ 1 0))))

(deftest ^:integration database-test
  (testing "Database operations"
    (is (connect-to-db))))
```

### Midje

```clojure
(ns my.app.core-test
  (:require [midje.sweet :refer :all]
            [my.app.core :refer :all]))

(fact "Addition works"
  (+ 2 2) => 4)

(fact "Database connection"
  (connect-to-db) => truthy
  (provided
    (get-db-config) => {:host "localhost"}))
```

### Expectations

```clojure
(ns my.app.core-test
  (:require [expectations :refer :all]
            [my.app.core :refer :all]))

(expect 4 (+ 2 2))
(expect ArithmeticException (/ 1 0))
```

## Integration

### With REPL Development

```bash
# Run tests from REPL
/clojure-repl
(require '[clojure.test :as t])
(t/run-tests 'my.app.core-test)

# Or use test command
/clojure-test --watch
```

### With Build Process

```bash
# Test before building
/clojure-test && /clojure-build

# Test as part of build
/clojure-build --with-tests
```

### In CI/CD Pipelines

```bash
# Run tests in CI
/clojure-test --parallel --report junit --coverage

# Fail pipeline on test failure
/clojure-test || exit 1

# Generate coverage badge
/clojure-test --coverage --badge coverage.svg
```

### With Code Quality Tools

```bash
# Lint and test
/clojure-lint --check && /clojure-test

# Format, lint, and test
/clojure-format --check && /clojure-lint --check && /clojure-test
```

## Performance Optimization

### Test Selection

```bash
# Run only fast tests
/clojure-test --filter "not slow"

# Run specific test suites
/clojure-test --suite unit --suite integration

# Run tests changed since commit
/clojure-test --changed-since HEAD
```

### Parallel Execution Tuning

```bash
# Auto-detect optimal workers
/clojure-test --parallel auto

# Limit memory per worker
/clojure-test --parallel --worker-memory 512m

# Isolate heavy tests
/clojure-test --isolate "heavy.*test"
```

### Caching and Incremental Testing

```bash
# Cache test results
/clojure-test --cache

# Only run failed tests
/clojure-test --only-failed

# Skip passing tests
/clojure-test --skip-passing
```

## Reporting

### Report Formats

```bash
# Pretty terminal output (default)
/clojure-test --report pretty

# JUnit XML for CI
/clojure-test --report junit --output test-results.xml

# JSON for programmatic processing
/clojure-test --report json --output test-results.json

# TeamCity format
/clojure-test --report teamcity

# Custom format
/clojure-test --report custom --template custom.edn
```

### Coverage Reports

```bash
# HTML report
/clojure-test --coverage --report html --output coverage/

# LCOV for codecov
/clojure-test --coverage --report lcov --output lcov.info

# Multiple formats
/clojure-test --coverage --formats html,lcov,clover
```

### Failure Analysis

```bash
# Show detailed failure information
/clojure-test --verbose --show-stack-traces

# Retry flaky tests
/clojure-test --retry 3 --flaky-threshold 0.8

# Generate failure report
/clojure-test --failure-report failures.json
```

## Troubleshooting

### Common Issues

#### Test Discovery Problems

```bash
# Force test discovery
/clojure-test --discover --verbose

# Specify test directories
/clojure-test --test-dirs test,spec,check

# Use custom namespace pattern
/clojure-test --pattern "*_spec.clj"
```

#### Memory Issues

```bash
# Increase memory for tests
/clojure-test --memory 2g

# Isolate memory-intensive tests
/clojure-test --isolate-memory "memory.*test"

# Enable GC between tests
/clojure-test --gc-between-tests
```

#### Slow Tests

```bash
# Profile test execution
/clojure-test --profile

# Identify slow tests
/clojure-test --slow-threshold 1000

# Run slow tests separately
/clojure-test --filter "slow" --timeout 60
```

#### Flaky Tests

```bash
# Retry flaky tests
/clojure-test --retry 3 --flaky

# Mark tests as flaky
/clojure-test --flaky-tags flaky,unreliable

# Generate flaky test report
/clojure-test --flaky-report flaky.json
```

### Debugging

#### Test Failures

```bash
# Run with debug output
/clojure-test --debug --verbose

# Isolate failing test
/clojure-test --filter "failing.test.name"

# Run with REPL on failure
/clojure-test --repl-on-failure
```

#### Coverage Issues

```bash
# Debug coverage collection
/clojure-test --coverage --debug-coverage

# Check coverage thresholds
/clojure-test --coverage --threshold 80

# Generate coverage diff
/clojure-test --coverage-diff HEAD~1
```

#### Performance Problems

```bash
# Generate flame graph
/clojure-test --flamegraph

# Profile specific tests
/clojure-test --profile --filter "slow.*"

# Memory profiling
/clojure-test --profile-memory
```

## Advanced Features

### Custom Test Runners

```clojure
;; Create custom test runner
(ns my.custom-runner
  (:require [clojure.test :as t]))

(defn run-tests [options]
  (let [results (t/run-tests)]
    (generate-report results options)))

;; Use custom runner
/clojure-test --runner my.custom-runner/run-tests
```

### Test Fixtures

```clojure
;; Define test fixtures
(ns my.test-fixtures
  (:require [clojure.test :as t]))

(defn db-fixture [f]
  (setup-database)
  (f)
  (teardown-database))

;; Use fixtures
/clojure-test --fixture my.test-fixtures/db-fixture
```

### Property-Based Testing

```bash
# Run property-based tests
/clojure-test --property-tests

# Configure test.check
/clojure-test --property-options "{:num-tests 1000 :max-size 100}"

# Generate property test reports
/clojure-test --property-report property.html
```

## Related Commands

- `/clojure-run` - Run Clojure applications
- `/clojure-repl` - Interactive development
- `/clojure-build` - Build projects
- `/clojure-lint` - Lint code
- `/js-test` - Test JavaScript/TypeScript
- `/python-test` - Test Python code
