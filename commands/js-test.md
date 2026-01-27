# `/js-test` - JavaScript/TypeScript Testing Command

Run tests for JavaScript and TypeScript projects with automatic test framework detection and intelligent defaults.

## Overview

The `/js-test` command runs tests for your JavaScript or TypeScript project, automatically detecting your test framework (Jest, Mocha, Vitest, etc.) and executing tests with appropriate configuration. It supports unit tests, integration tests, and end-to-end tests with comprehensive reporting.

## Features

- **Automatic Framework Detection**: Detects Jest, Mocha, Vitest, Jasmine, and other test frameworks
- **TypeScript Support**: Runs TypeScript tests with proper compilation
- **Watch Mode**: Continuous testing during development
- **Coverage Reporting**: Generates test coverage reports
- **Parallel Execution**: Runs tests in parallel for faster execution
- **Intelligent Filtering**: Run specific tests or test files
- **Framework Integration**: Works with React Testing Library, Vue Test Utils, Angular Testing, etc.
- **CI/CD Ready**: Produces machine-readable output for CI systems

## Usage

```bash
/js-test [options] [test-patterns...]
```

### Options

| Option       | Short | Description                |
| ------------ | ----- | -------------------------- |
| `--watch`    | `-w`  | Watch mode for development |
| `--coverage` | `-c`  | Generate coverage report   |
| `--verbose`  | `-v`  | Verbose output             |
| `--bail`     | `-b`  | Exit on first test failure |
| `--update`   | `-u`  | Update snapshots           |
| `--help`     | `-h`  | Show help message          |

### Test Patterns

You can specify which tests to run:

```bash
/js-test Button.test.js              # Run specific test file
/js-test src/components/            # Run tests in directory
/js-test --testNamePattern="login"  # Run tests matching pattern
/js-test --testPathPattern="utils"  # Run tests in paths matching pattern
```

## What It Does

### 1. Test Framework Detection

- Checks for test framework configuration files
- Detects installed test runners
- Identifies framework-specific test setups
- Determines appropriate test command

### 2. Test Execution

- Runs tests with detected framework
- Applies project-specific configuration
- Handles TypeScript compilation if needed
- Manages test environment setup

### 3. Results Reporting

- Shows test results with pass/fail status
- Provides detailed error information
- Generates coverage reports when requested
- Exits with appropriate status codes

## Supported Test Frameworks

### Primary Test Runners

- **Jest**: Facebook's testing framework with batteries included
- **Vitest**: Vite-native test runner, extremely fast
- **Mocha**: Flexible test framework, often used with Chai assertions
- **Jasmine**: Behavior-driven development framework
- **Ava**: Minimal test runner with parallel execution
- **Tape**: Simple tap-producing test library

### Assertion Libraries

- **Jest Assertions**: Built into Jest
- **Chai**: Expressive assertion library
- **Should.js**: BDD style assertions
- **Expect**: Minimal assertion library

### Testing Utilities

- **React Testing Library**: React component testing
- **Vue Test Utils**: Vue component testing
- **Angular Testing**: Angular testing utilities
- **Testing Library**: DOM testing utilities
- **Sinon**: Spies, stubs, and mocks
- **Nock**: HTTP server mocking

## Examples

### Basic Test Run

```bash
# Run all tests
/js-test

# Output:
# 🧪 Running tests with Jest...
#
# PASS src/utils/helpers.test.js
#   ✓ adds two numbers (2 ms)
#   ✓ subtracts two numbers (1 ms)
#
# PASS src/components/Button.test.js
#   ✓ renders button with text (5 ms)
#   ✓ handles click events (3 ms)
#
# Test Suites: 2 passed, 2 total
# Tests:       4 passed, 4 total
# Snapshots:   0 total
# Time:        1.234 s
# ✅ All tests passed!
```

### Watch Mode

```bash
# Run tests in watch mode
/js-test --watch

# Output:
# 🧪 Running tests in watch mode...
#
# No tests found related to files changed since last commit.
# Press `a` to run all tests, or run Jest with `--watchAll`.
#
# Watch Usage
#  › Press a to run all tests.
#  › Press f to run only failed tests.
#  › Press q to quit watch mode.
#  › Press Enter to trigger a test run.
```

### Coverage Report

```bash
# Run tests with coverage
/js-test --coverage

# Output:
# 🧪 Running tests with coverage...
#
# -----------------|---------|----------|---------|---------|-------------------
# File             | % Stmts | % Branch | % Func  | % Lines | Uncovered Line #s
# -----------------|---------|----------|---------|---------|-------------------
# All files        |   85.71 |       75 |   83.33 |   85.71 |
#  src/            |   85.71 |       75 |   83.33 |   85.71 |
#   utils.js       |     100 |      100 |     100 |     100 |
#   helpers.js     |   66.66 |       50 |      50 |   66.66 | 8-10
#   components/    |     100 |      100 |     100 |     100 |
#    Button.js     |     100 |      100 |     100 |     100 |
#
# ✅ Coverage report generated: coverage/lcov-report/index.html
```

### TypeScript Tests

```bash
# Run TypeScript tests
/js-test "**/*.test.ts" "**/*.test.tsx"

# Output:
# 🧪 Running TypeScript tests...
#
# PASS src/types/validation.test.ts
#   ✓ validates email addresses (4 ms)
#   ✓ validates phone numbers (3 ms)
#
# PASS src/components/Form.test.tsx
#   ✓ renders form fields (8 ms)
#   ✓ handles form submission (6 ms)
```

## Configuration

### Test Framework Configuration

**Jest Configuration** (`jest.config.js`):

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Vitest Configuration** (`vitest.config.js`):

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/*.test.{js,ts,tsx}'],
  },
});
```

**Mocha Configuration** (`.mocharc.js`):

```javascript
module.exports = {
  extension: ['js', 'ts'],
  spec: 'test/**/*.test.js',
  require: ['ts-node/register'],
  timeout: 5000,
};
```

### TypeScript Test Configuration

For TypeScript projects, ensure proper compilation:

```json
// tsconfig.json for tests
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "jsx": "react-jsx",
    "types": ["jest", "node"]
  }
}
```

### Framework-Specific Test Setup

**React Testing Setup**:

```javascript
// jest.setup.js for React
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

**Vue Testing Setup**:

```javascript
// vitest.setup.js for Vue
import { config } from '@vue/test-utils';

config.global.stubs = {
  Transition: false,
  TransitionGroup: false,
};
```

## Common Issues and Solutions

### Test Framework Not Found

**Error**: `No test framework detected`

**Solution**:

```bash
# Install a test framework
npm install --save-dev jest

# Or run setup to configure
/js-setup
```

### TypeScript Test Compilation Errors

**Error**: `SyntaxError: Unexpected token`

**Solution**:

```bash
# Install TypeScript test runner
npm install --save-dev ts-jest  # For Jest
npm install --save-dev @vitest/plugin-vue-jsx  # For Vitest with Vue

# Configure test runner for TypeScript
```

### Missing Test Files

**Error**: `No test files found`

**Solution**:

```bash
# Create test files with proper naming
# Jest: *.test.js, *.spec.js
# Mocha: *.test.js
# Vitest: *.test.js

# Or configure test pattern in config file
```

### Slow Test Execution

**Symptoms**: Tests run slowly

**Solution**:

```bash
# Run tests in parallel
/js-test --maxWorkers=4  # For Jest

# Use watch mode for development
/js-test --watch

# Consider switching to Vitest for faster execution
```

## Advanced Usage

### Test Filtering

```bash
# Run specific tests
/js-test --testNamePattern="login"      # Tests with "login" in name
/js-test --testPathPattern="components" # Tests in components directory
/js-test Button.test.js                 # Specific test file
/js-test src/utils/ helpers.test.js     # Multiple specific files
```

### Snapshot Testing

```bash
# Update snapshots
/js-test --update

# Output:
# 🧪 Running tests and updating snapshots...
#
# › 2 snapshots updated.
#
# Snapshot Summary
# › 2 snapshots updated in 1 test suite.
```

### CI Mode

```bash
# Run tests in CI mode (no watch, coverage, etc.)
/js-test --ci

# Or with specific CI configuration
CI=true /js-test --coverage --maxWorkers=2
```

### Custom Reporters

```bash
# Use different reporters
/js-test --reporters=default  # Default reporter
/js-test --reporters=summary  # Summary reporter
/js-test --reporters=verbose  # Verbose reporter

# Generate JUnit XML for CI
/js-test --reporters="jest-junit"
```

## Integration with Development Workflow

### Pre-commit Testing

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "/js-test",
    "test:watch": "/js-test --watch",
    "test:coverage": "/js-test --coverage",
    "precommit": "/js-test"
  }
}
```

### CI/CD Pipeline

```bash
# Example CI script
/js-setup
/js-lint
/js-test --coverage --maxWorkers=2
/js-build --production

# Upload coverage reports
# - codecov, coveralls, etc.
```

### Test-Driven Development (TDD)

```bash
# TDD workflow
/js-test --watch  # Start in watch mode
# Write failing test
# Implement code to make test pass
# Refactor with confidence
```

## Performance Tips

### 1. Use Appropriate Test Runner

- **Vitest**: Fastest for Vite projects
- **Jest**: Most feature-complete, good for large projects
- **Mocha**: Most flexible, good for custom setups

### 2. Parallel Test Execution

```bash
# Run tests in parallel (Jest)
/js-test --maxWorkers=4

# Vitest runs in parallel by default
```

### 3. Test Isolation

- Mock external dependencies
- Use test doubles (spies, stubs, mocks)
- Clean up after each test
- Avoid shared state between tests

### 4. Selective Testing

```bash
# Run only relevant tests during development
/js-test --testPathPattern="src/components/Button"

# Use watch mode with filter
/js-test --watch --testNamePattern="login"
```

## Related Commands

- `/js-setup` - Configure testing framework
- `/js-lint` - Code quality checking
- `/js-build` - Build project (often runs tests)
- `/e2e` - End-to-end testing
- `/tdd` - Test-driven development workflow

## Best Practices

### 1. Test Structure

- Organize tests alongside source code
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent

### 2. Test Coverage

- Aim for meaningful coverage, not 100%
- Focus on critical paths
- Test edge cases and error conditions
- Use coverage as guidance, not goal

### 3. Test Data

- Use factories or builders for test data
- Keep test data close to tests
- Use fixtures for complex data
- Consider using test data generation

### 4. Continuous Testing

- Run tests on every change
- Integrate with CI/CD pipeline
- Monitor test performance
- Regularly review and update tests

## Tips

1. **Run setup first**: Use `/js-setup` to configure testing properly
2. **Use watch mode**: Save time with `--watch` during development
3. **Start simple**: Begin with unit tests, then add integration tests
4. **Mock external services**: Isolate tests from external dependencies
5. **Keep tests fast**: Slow tests discourage running them
6. **Test behavior, not implementation**: Focus on what code does, not how
7. **Regular maintenance**: Update tests when code changes
8. **Document test patterns**: Establish team testing conventions

For complex testing scenarios or specific framework requirements, check the test framework's documentation or run `/js-setup` to reconfigure your testing setup.
