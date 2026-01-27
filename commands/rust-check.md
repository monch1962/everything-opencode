# Rust Check Command

Check Rust code for errors without building binaries, providing fast feedback during development.

## Overview

The `/rust-check` command performs Rust code analysis without generating executable binaries. It's designed for fast feedback during development, checking syntax, types, and borrow rules while avoiding the overhead of code generation and linking.

## Features

- **Fast Error Checking**: Syntax and type checking without compilation overhead
- **Incremental Analysis**: Only checks changed files for speed
- **Detailed Error Messages**: Clear, actionable error reporting with suggestions
- **Multiple Check Modes**: Different levels of analysis for various needs
- **Workspace Support**: Check all crates in a workspace
- **Feature Flag Validation**: Verify feature flag usage and dependencies
- **CI/CD Ready**: Exit codes and formatted output for pipelines
- **Integration Support**: Works with editors and IDEs

## Usage

```bash
/rust-check [options] [cargo-check-options...]
```

### Options

| Option        | Short | Description                                    |
| ------------- | ----- | ---------------------------------------------- |
| `--all`       | `-a`  | Check all targets (lib, bins, tests, examples) |
| `--lib`       |       | Check only library target                      |
| `--bins`      |       | Check only binary targets                      |
| `--tests`     |       | Check only test targets                        |
| `--examples`  |       | Check only example targets                     |
| `--benches`   |       | Check only benchmark targets                   |
| `--features`  | `-f`  | Space-separated list of features to activate   |
| `--package`   | `-p`  | Package to check                               |
| `--workspace` | `-w`  | Check all crates in workspace                  |
| `--help`      | `-h`  | Show help message                              |

## Examples

### Basic check

```bash
/rust-check
```

Checks the current package for errors.

### Check all targets

```bash
/rust-check --all
```

Checks library, binaries, tests, and examples.

### Check with specific features

```bash
/rust-check --features "serde,json"
```

Checks code with serde and json features enabled.

### Workspace check

```bash
/rust-check --workspace
```

Checks all crates in the workspace.

### Check specific package

```bash
/rust-check --package my-crate
```

Checks only the specified package.

### Check for a specific target

```bash
/rust-check --target x86_64-unknown-linux-gnu
```

Checks code for a specific target architecture.

## Configuration

### Cargo.toml Integration

The command respects `Cargo.toml` configuration:

```toml
[package]
name = "my-project"
edition = "2021"

# Check configuration
[package.metadata.check]
strict = true
warnings-as-errors = true
deny-warnings = false

# Feature-specific checks
[features]
default = ["std"]
std = []
alloc = []

# Check profiles
[profile.check]
opt-level = 0
debug = true
incremental = true
```

### Check Profiles

Define custom check profiles in `Cargo.toml`:

```toml
[profile.check-dev]
inherits = "check"
# Development-specific settings

[profile.check-ci]
inherits = "check"
warnings-as-errors = true
all-targets = true
```

### Feature Validation

```toml
# Feature dependencies for checking
[features]
default = ["std"]
std = []
no-std = []

# Conditional checking based on features
[package.metadata.check.features]
std = { required-deps = ["alloc"] }
no-std = { forbidden-deps = ["std"] }
```

## Check Modes

### Syntax Check

```bash
/rust-check --syntax-only
```

- Fastest check mode
- Only validates Rust syntax
- No type checking or borrow checking

### Type Check

```bash
/rust-check --type-check
```

- Validates types and traits
- Checks type bounds and constraints
- No borrow checking or code generation

### Full Check (Default)

```bash
/rust-check
```

- Complete Rust analysis
- Syntax, types, and borrow checking
- No code generation or linking

### Strict Check

```bash
/rust-check --strict
```

- All warnings treated as errors
- Additional lints enabled
- Maximum safety checking

## Integration

### Editor Integration

Many editors can use the command for real-time checking:

```json
// VSCode settings.json
{
  "rust-analyzer.check.command": "/rust-check",
  "rust-analyzer.check.args": ["--all-targets"],
  "rust-analyzer.check.onSave": true
}
```

```lua
-- Neovim configuration
vim.g.rust_check_command = "/rust-check"
vim.g.rust_check_args = "--all"
vim.g.rust_check_autosave = true
```

### Git Hooks

```bash
# pre-commit hook
/rust-check --all-targets --warnings-as-errors

# pre-push hook
/rust-check --workspace --strict
```

### CI/CD Pipelines

```bash
# GitHub Actions
- name: Check Rust code
  run: /rust-check --all-targets --warnings-as-errors

# Exit on any issues
/rust-check --strict || exit 1

# Generate check report
/rust-check --json --output check-report.json
```

### With Other Commands

```bash
# Check before building
/rust-check && /rust-build

# Check before testing
/rust-check && /rust-test

# Check as part of quality pipeline
/rust-check && /rust-clippy && /rust-fmt --check
```

## Performance

### Incremental Checking

```bash
# Enable incremental analysis
/rust-check --incremental

# Cache check results
/rust-check --cache

# Only check changed files
/rust-check --changed-only
```

### Parallel Checking

```bash
# Use multiple CPU cores
/rust-check --jobs $(nproc)

# Check crates in parallel
/rust-check --parallel-crates

# Limit memory usage per job
/rust-check --job-memory 1G
```

### Memory Optimization

```bash
# Limit total memory
/rust-check --memory-limit 4G

# Use disk caching
/rust-check --disk-cache

# Check in chunks
/rust-check --chunk-size 10
```

## Error Handling

### Error Categories

#### Syntax Errors

- Missing semicolons
- Invalid token sequences
- Macro expansion issues

#### Type Errors

- Mismatched types
- Missing trait implementations
- Generic parameter issues

#### Borrow Checker Errors

- Moving borrowed values
- Multiple mutable borrows
- Lifetime issues

#### Feature Errors

- Missing feature dependencies
- Conflicting features
- Unused features

### Error Messages

The command provides enhanced error messages:

```
❌ Type error in src/lib.rs:42
   expected `String`, found `&str`

   help: try using `.to_string()`: `arg.to_string()`

   note: this error occurs in function `process` at line 42
   context: called from `main` at line 15
```

### Error Suppression

```bash
# Suppress specific warnings
/rust-check --allow deprecated --allow unused

# Ignore specific files
/rust-check --ignore src/legacy.rs

# Set warning levels
/rust-check --warn missing-docs --deny unsafe-code
```

## Advanced Features

### Custom Lints

```bash
# Use custom lint crate
/rust-check --lints my-lints

# Configure lint levels
/rust-check --lint-level warn=clippy::all --lint-level allow=clippy::pedantic

# Generate lint report
/rust-check --lint-report lints.json
```

### Cross-Target Checking

```bash
# Check for multiple targets
/rust-check --target x86_64-unknown-linux-gnu --target wasm32-unknown-unknown

# Check no_std compatibility
/rust-check --no-std

# Check embedded targets
/rust-check --target thumbv7em-none-eabihf
```

### Dependency Analysis

```bash
# Check unused dependencies
/rust-check --unused-deps

# Check dependency versions
/rust-check --dep-versions

# Check feature dependencies
/rust-check --feature-deps
```

## Troubleshooting

### Common Issues

#### False Positives

```bash
# Suppress specific error types
/rust-check --suppress E0382 --suppress E0599

# Use more precise checking
/rust-check --precise

# Check with different Rust edition
/rust-check --edition 2021
```

#### Performance Problems

```bash
# Profile checking performance
/rust-check --profile

# Identify slow checks
/rust-check --timings

# Skip expensive analyses
/rust-check --skip-borrow-check --skip-type-check
```

#### Memory Issues

```bash
# Reduce memory usage
/rust-check --jobs 2 --incremental

# Use swap for large codebases
/rust-check --use-swap

# Check in separate processes
/rust-check --isolate
```

### Debugging

#### Understanding Errors

```bash
# Show error explanations
/rust-check --explain

# Generate error report
/rust-check --error-report errors.json

# Show error context
/rust-check --verbose --backtrace
```

#### Configuration Issues

```bash
# Validate configuration
/rust-check --validate-config

# Show effective configuration
/rust-check --show-config

# Test with minimal configuration
/rust-check --minimal
```

#### Integration Problems

```bash
# Test editor integration
/rust-check --editor-test

# Generate IDE configuration
/rust-check --generate-config vscode

# Check compatibility
/rust-check --compatibility
```

## Related Commands

- `/rust-build` - Build Rust projects
- `/rust-clippy` - Lint Rust code
- `/rust-fmt` - Format Rust code
- `/rust-test` - Run tests
- `/rust-run` - Run applications
- `/rust-clean` - Clean build artifacts
