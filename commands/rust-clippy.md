# Rust Clippy Command

Run Clippy, the Rust linter, to catch common mistakes and improve code quality with intelligent suggestions.

## Overview

The `/rust-clippy` command runs Clippy, the official Rust linter, to analyze your code for common mistakes, non-idiomatic patterns, and potential improvements. Clippy provides hundreds of lints covering correctness, performance, style, and complexity, with automatic fix suggestions for many issues.

## Features

- **Comprehensive Linting**: 500+ lints covering all aspects of Rust code
- **Automatic Fixes**: Apply fix suggestions automatically with `--fix`
- **Custom Configuration**: Enable/disable specific lints and configure lint levels
- **Performance Analysis**: Identify performance bottlenecks and anti-patterns
- **Idiomatic Code**: Ensure code follows Rust best practices and conventions
- **Safety Checking**: Catch unsafe patterns and potential bugs
- **Workspace Support**: Lint all crates in a workspace
- **Integration Ready**: Works with editors, CI/CD, and development workflows

## Usage

```bash
/rust-clippy [options] [clippy-options...]
```

### Options

| Option       | Short | Description                |
| ------------ | ----- | -------------------------- |
| `--fix`      | `-f`  | Apply automatic fixes      |
| `--allow`    | `-a`  | Allow specific lints       |
| `--warn`     | `-w`  | Warn for specific lints    |
| `--deny`     | `-d`  | Deny specific lints        |
| `--pedantic` | `-p`  | Enable pedantic lints      |
| `--nursery`  | `-n`  | Enable nursery (new) lints |
| `--cargo`    | `-c`  | Pass options to Cargo      |
| `--help`     | `-h`  | Show help message          |

## Examples

### Basic linting

```bash
/rust-clippy
```

Runs Clippy with default configuration.

### Apply automatic fixes

```bash
/rust-clippy --fix
```

Applies automatic fixes for fixable issues.

### Enable pedantic lints

```bash
/rust-clippy --pedantic
```

Enables additional strict lints.

### Allow specific warnings

```bash
/rust-clippy --allow clippy::too_many_arguments --allow clippy::complexity
```

Allows specific lints that would normally warn.

### Deny specific lints

```bash
/rust-clippy --deny clippy::unwrap_used --deny clippy::expect_used
```

Treats specific lints as errors.

### Workspace linting

```bash
/rust-clippy --workspace
```

Lints all crates in the workspace.

## Configuration

### Clippy Configuration File

Create `clippy.toml` or `.clippy.toml` for project-specific configuration:

```toml
# clippy.toml
# Lint levels
deny = ["clippy::unwrap_used"]
warn = ["clippy::pedantic"]
allow = ["clippy::too_many_lines"]

# Lint configuration
[clippy]
cognitive-complexity-threshold = 25
too-many-arguments-threshold = 7
type-complexity-threshold = 300

# Module-specific configuration
[[clippy.module]]
path = "src/legacy.rs"
allow = ["clippy::all"]

# Feature-specific configuration
[[clippy.features]]
name = "no-std"
allowed = ["clippy::std_instead_of_core"]
```

### Cargo.toml Configuration

Configure Clippy in `Cargo.toml`:

```toml
[package.metadata.clippy]
# Global configuration
all-targets = true
avoid-breaking-exported-api = false

# Lint configuration
[package.metadata.clippy.lints]
# Deny these lints
unwrap_used = "deny"
expect_used = "deny"

# Warn for these
missing_docs = "warn"
unused_imports = "warn"

# Allow these
too_many_arguments = "allow"
complexity = "allow"
```

### Rust Edition Compatibility

Clippy behavior varies by Rust edition:

- **2015 edition**: Basic lints
- **2018 edition**: Additional lints for new features
- **2021 edition**: Latest lints and improvements

## Lint Categories

### Correctness Lints

Catch bugs and incorrect code:

- **`clippy::unwrap_used`**: Using `unwrap()` without handling errors
- **`clippy::expect_used`**: Using `expect()` without proper context
- **`clippy::panic`**: Unnecessary panics
- **`clippy::unreachable`**: Unreachable code
- **`clippy::match_wildcard_for_single_variants`**: Inefficient pattern matching

### Performance Lints

Improve code performance:

- **`clippy::redundant_clone`**: Unnecessary clones
- **`clippy::slow_vector_initialization`**: Inefficient vector creation
- **`clippy::manual_memcpy`**: Manual copying instead of `copy_from_slice`
- **`clippy::inefficient_to_string`**: Inefficient string conversion

### Style Lints

Enforce consistent style:

- **`clippy::needless_return`**: Unnecessary `return` statements
- **`clippy::single_char_pattern`**: Single character string patterns
- **`clippy::collapsible_if`**: Nested if statements that can be combined
- **`clippy::comparison_to_empty`**: Comparing to empty string/collection

### Complexity Lints

Reduce code complexity:

- **`clippy::cognitive_complexity`**: High cognitive complexity
- **`clippy::too_many_arguments`**: Functions with too many parameters
- **`clippy::type_complexity`**: Complex type signatures
- **`clippy::many_single_char_names`**: Too many single character variables

### Pedantic Lints

Extra strict lints (enabled with `--pedantic`):

- **`clippy::must_use_candidate`**: Functions that should be marked `#[must_use]`
- **`clippy::missing_errors_doc`**: Missing error documentation
- **`clippy::missing_panics_doc`**: Missing panic documentation

## Automatic Fixes

### Fixable Lints

Many Clippy lints can be fixed automatically:

```rust
// Before: unnecessary return
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}

// After automatic fix
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```rust
// Before: redundant clone
let v2 = v.clone();

// After automatic fix
let v2 = v;
```

```rust
// Before: single character string pattern
if s.contains("x") { ... }

// After automatic fix
if s.contains('x') { ... }
```

### Fix Application

```bash
# Preview fixes without applying
/rust-clippy --fix --dry-run

# Apply fixes interactively
/rust-clippy --fix --interactive

# Apply fixes for specific lints only
/rust-clippy --fix --lint clippy::redundant_clone,clippy::needless_return
```

## Integration

### Editor Integration

Many editors support Clippy integration:

```json
// VSCode settings.json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.check.extraArgs": ["--", "-W", "clippy::pedantic"],
  "rust-analyzer.check.onSave": true
}
```

```lua
-- Neovim configuration
vim.g.rust_clippy_command = "/rust-clippy"
vim.g.rust_clippy_args = "-- -W clippy::pedantic"
vim.g.rust_clippy_autosave = true
```

### Git Hooks

```bash
# pre-commit hook
/rust-clippy --fix --allow-staged

# pre-push hook
/rust-clippy --deny warnings
```

### CI/CD Pipelines

```bash
# GitHub Actions
- name: Run Clippy
  run: /rust-clippy -- -D warnings

# Exit on any warnings
/rust-clippy -- -D warnings || exit 1

# Generate lint report
/rust-clippy --json --output clippy-report.json
```

### With Other Commands

```bash
# Lint as part of build process
/rust-check && /rust-clippy && /rust-build

# Complete quality pipeline
/rust-fmt --check && /rust-clippy && /rust-test
```

## Performance

### Incremental Linting

```bash
# Only lint changed files
/rust-clippy --changed-only

# Cache lint results
/rust-clippy --cache

# Skip already linted files
/rust-clippy --skip-clean
```

### Parallel Linting

```bash
# Use multiple CPU cores
/rust-clippy --jobs $(nproc)

# Limit parallelism
/rust-clippy --jobs 4

# Isolate heavy lints
/rust-clippy --isolate-heavy
```

### Memory Management

```bash
# Limit memory usage
/rust-clippy --memory-limit 2G

# Use disk caching for large projects
/rust-clippy --disk-cache

# Lint in chunks
/rust-clippy --chunk-size 100
```

## Custom Lints

### Creating Custom Lints

```rust
// custom_lints.rs
use clippy_utils::diagnostics::span_lint;
use rustc_hir::Expr;
use rustc_lint::{LateContext, LateLintPass};

declare_clippy_lint! {
    pub MY_CUSTOM_LINT,
    "restriction",
    "custom lint description"
}

pub struct MyCustomLint;

impl LateLintPass<'_> for MyCustomLint {
    fn check_expr(&mut self, cx: &LateContext<'_>, expr: &Expr<'_>) {
        // Custom lint logic
        span_lint(cx, MY_CUSTOM_LINT, expr.span, "custom lint message");
    }
}
```

### Using Custom Lints

```bash
# Load custom lint plugin
/rust-clippy --plugin ./target/debug/libcustom_lints.so

# Configure custom lints
/rust-clippy --custom-lints custom_lints.toml
```

## Troubleshooting

### Common Issues

#### False Positives

```bash
# Suppress specific lints
/rust-clippy --allow clippy::lint_name

# Use attribute to suppress
#[allow(clippy::lint_name)]
fn my_function() { ... }

# File-level suppression
#![allow(clippy::lint_name)]
```

#### Performance Problems

```bash
# Profile Clippy execution
/rust-clippy --profile

# Skip expensive lints
/rust-clippy --skip clippy::cognitive_complexity

# Limit analysis depth
/rust-clippy --max-depth 3
```

#### Configuration Conflicts

```bash
# Show effective configuration
/rust-clippy --show-config

# Test configuration
/rust-clippy --test-config

# Reset to defaults
/rust-clippy --reset-config
```

### Debugging

#### Understanding Lints

```bash
# Show lint explanations
/rust-clippy --explain clippy::lint_name

# Generate lint documentation
/rust-clippy --generate-docs

# Show lint categories
/rust-clippy --list-categories
```

#### Lint Analysis

```bash
# Show detailed lint information
/rust-clippy --verbose

# Generate lint report
/rust-clippy --report html --output clippy-report.html

# Compare lint results
/rust-clippy --diff HEAD~1
```

## Advanced Features

### Lint Groups

```bash
# Use predefined lint groups
/rust-clippy --group correctness
/rust-clippy --group perf
/rust-clippy --group style
/rust-clippy --group complexity
/rust-clippy --group cargo
```

### Feature-Specific Linting

```bash
# Lint with specific features enabled
/rust-clippy --features "serde,json"

# Lint without default features
/rust-clippy --no-default-features

# Lint feature combinations
/rust-clippy --feature-combinations
```

### Cross-Target Linting

```bash
# Lint for specific target
/rust-clippy --target wasm32-unknown-unknown

# Lint no_std code
/rust-clippy --no-std

# Lint embedded code
/rust-clippy --target thumbv7em-none-eabihf
```

## Related Commands

- `/rust-check` - Check Rust code
- `/rust-fmt` - Format Rust code
- `/rust-build` - Build Rust projects
- `/rust-test` - Run tests
- `/rust-run` - Run applications
- `/js-lint` - Lint JavaScript/TypeScript
- `/python-lint` - Lint Python code
