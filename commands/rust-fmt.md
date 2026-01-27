# Rust Fmt Command

Format Rust code with rustfmt, ensuring consistent style and adherence to Rust conventions.

## Overview

The `/rust-fmt` command formats Rust code using rustfmt, the official Rust code formatter. It applies consistent formatting rules across your codebase, enforces Rust style guidelines, and can automatically fix formatting issues. The command supports custom configuration, incremental formatting, and integration with development workflows.

## Features

- **rustfmt Integration**: Full rustfmt compatibility with enhanced features
- **Automatic Formatting**: Apply consistent formatting automatically
- **Custom Configuration**: Project-specific formatting rules
- **Incremental Formatting**: Only format changed files for speed
- **Check Mode**: Verify formatting without making changes
- **Workspace Support**: Format all crates in a workspace
- **Editor Integration**: Works with editors and IDEs
- **CI/CD Ready**: Exit codes and formatted output for pipelines

## Usage

```bash
/rust-fmt [options] [files...]
```

### Options

| Option        | Short | Description                             |
| ------------- | ----- | --------------------------------------- |
| `--check`     | `-c`  | Check formatting without changing files |
| `--fix`       | `-f`  | Fix formatting issues automatically     |
| `--diff`      | `-d`  | Show diff of formatting changes         |
| `--verbose`   | `-v`  | Show detailed formatting output         |
| `--config`    |       | Use custom rustfmt configuration        |
| `--edition`   |       | Rust edition (2015, 2018, 2021)         |
| `--workspace` | `-w`  | Format all crates in workspace          |
| `--help`      | `-h`  | Show help message                       |

## Examples

### Format specific files

```bash
/rust-fmt src/lib.rs src/main.rs
```

Formats the specified files.

### Check formatting

```bash
/rust-fmt --check src/
```

Checks formatting in src/ directory without making changes.

### Fix formatting issues

```bash
/rust-fmt --fix --all
```

Fixes formatting issues in all Rust files.

### Show diff

```bash
/rust-fmt --diff src/
```

Shows what formatting changes would be made.

### Workspace formatting

```bash
/rust-fmt --workspace
```

Formats all crates in the workspace.

### Custom configuration

```bash
/rust-fmt --config .rustfmt.toml src/
```

Formats using custom configuration.

## Configuration

### rustfmt Configuration File

Create `rustfmt.toml` or `.rustfmt.toml` for project-specific configuration:

```toml
# rustfmt.toml
# Formatting style
max_width = 100
tab_spaces = 4
newline_style = "Auto"

# Import formatting
imports_granularity = "Crate"
group_imports = "StdExternalCrate"

# Control flow
control_brace_style = "AlwaysSameLine"
match_arm_blocks = true

# Comments
wrap_comments = true
comment_width = 80
format_code_in_doc_blocks = true

# Advanced formatting
merge_imports = true
reorder_impl_items = true
reorder_modules = true
```

### Cargo.toml Configuration

Configure rustfmt in `Cargo.toml`:

```toml
[package]
name = "my-crate"

# rustfmt configuration
[package.metadata.rustfmt]
max_width = 100
hard_tabs = false
tab_spaces = 4

# Edition-specific formatting
[package.metadata.rustfmt.edition]
2018 = { max_width = 99 }
2021 = { max_width = 100 }

# Feature-specific formatting
[package.metadata.rustfmt.features]
default = { imports_granularity = "Crate" }
no-std = { imports_granularity = "Item" }
```

### Editor Configuration

Configure your editor to use the command:

```json
// VSCode settings.json
{
  "rust-analyzer.rustfmt.extraArgs": ["--config", ".rustfmt.toml"],
  "rust-analyzer.rustfmt.overrideCommand": ["/rust-fmt", "--fix"],
  "[rust]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  }
}
```

```lua
-- Neovim configuration
vim.g.rustfmt_command = "/rust-fmt"
vim.g.rustfmt_autosave = 1
vim.g.rustfmt_fail_silently = 0
```

## Formatting Rules

### Basic Formatting

rustfmt applies these basic rules automatically:

- **Indentation**: Consistent 4-space indentation
- **Line length**: Default 100 characters (configurable)
- **Spacing**: Consistent spacing around operators and keywords
- **Braces**: Consistent brace placement
- **Imports**: Organized and deduplicated imports

### Import Organization

```rust
// Before formatting
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use serde::{Deserialize, Serialize};
use crate::module::Submodule;

// After formatting (with imports_granularity = "Crate")
use std::{collections::HashMap, fs, io::{Read, Write}};
use serde::{Deserialize, Serialize};
use crate::module::Submodule;
```

### Code Style

```rust
// Before formatting
fn example(x:i32,y:i32)->i32{
    if x>y{
        return x
    }else{
        return y
    }
}

// After formatting
fn example(x: i32, y: i32) -> i32 {
    if x > y {
        return x;
    } else {
        return y;
    }
}
```

### Match Expression Formatting

```rust
// Before formatting
match value {
    Some(x) => { println!("{}", x); }
    None => { println!("none"); }
}

// After formatting
match value {
    Some(x) => {
        println!("{}", x);
    }
    None => {
        println!("none");
    }
}
```

## Integration

### Editor Integration

Many editors support rustfmt integration:

```bash
# Configure editor to use command
/rust-fmt --generate-editor-config vscode
/rust-fmt --generate-editor-config neovim
/rust-fmt --generate-editor-config emacs
```

### Git Hooks

```bash
# pre-commit hook
/rust-fmt --check --staged

# pre-push hook
/rust-fmt --check --all
```

### CI/CD Pipelines

```bash
# GitHub Actions
- name: Check formatting
  run: /rust-fmt --check --all

# Exit on formatting issues
/rust-fmt --check --all || exit 1

# Generate formatting report
/rust-fmt --check --json --output fmt-report.json
```

### With Other Commands

```bash
# Format before building
/rust-fmt --fix && /rust-build

# Complete quality pipeline
/rust-fmt --check && /rust-clippy && /rust-test

# Development workflow
/rust-fmt --fix --watch
```

## Performance

### Incremental Formatting

```bash
# Only format changed files
/rust-fmt --changed-only

# Cache formatting results
/rust-fmt --cache

# Skip already formatted files
/rust-fmt --skip-formatted
```

### Parallel Formatting

```bash
# Format files in parallel
/rust-fmt --parallel

# Limit parallel jobs
/rust-fmt --jobs $(nproc)

# Parallel with progress
/rust-fmt --parallel --progress
```

### Memory Management

```bash
# Limit memory usage
/rust-fmt --memory-limit 2G

# Use streaming for large files
/rust-fmt --stream

# Format in chunks
/rust-fmt --chunk-size 100
```

## Custom Formatting

### Custom Rules

```bash
# Use custom rules file
/rust-fmt --rules ./custom-rules.toml

# Multiple rule files
/rust-fmt --rules ./base.toml,./overrides.toml

# Generate rules from existing code
/rust-fmt --generate-rules
```

### Formatting Profiles

```bash
# Use specific formatting profile
/rust-fmt --profile minimal
/rust-fmt --profile strict
/rust-fmt --profile custom

# Profile-specific options
/rust-fmt --profile strict --max-width 80
```

### Language Features

```bash
# Format with specific edition
/rust-fmt --edition 2021

# Format with features enabled
/rust-fmt --features "serde,json"

# Format no_std code
/rust-fmt --no-std
```

## Troubleshooting

### Common Issues

#### Formatting Conflicts

```bash
# Show formatting conflicts
/rust-fmt --conflicts

# Resolve conflicts automatically
/rust-fmt --resolve-conflicts

# Ignore specific formatting rules
/rust-fmt --ignore "max_width,imports_granularity"
```

#### Performance Problems

```bash
# Profile formatting performance
/rust-fmt --profile

# Skip expensive formatting operations
/rust-fmt --skip-complex

# Format in batches
/rust-fmt --batch-size 50
```

#### Configuration Issues

```bash
# Validate configuration
/rust-fmt --validate-config

# Show effective configuration
/rust-fmt --show-config

# Reset to defaults
/rust-fmt --reset-config
```

### Debugging

#### Understanding Changes

```bash
# Show detailed change information
/rust-fmt --verbose --diff

# Generate change report
/rust-fmt --change-report changes.json

# Explain formatting decisions
/rust-fmt --explain
```

#### Formatting Errors

```bash
# Show formatting errors with context
/rust-fmt --verbose --check

# Generate error report
/rust-fmt --error-report errors.json

# Skip files with errors
/rust-fmt --skip-errors
```

## Advanced Features

### Formatting Modes

```bash
# Interactive formatting
/rust-fmt --interactive

# Dry run (show what would change)
/rust-fmt --dry-run

# Force formatting (ignore .rustfmtignore)
/rust-fmt --force
```

### Code Generation

```bash
# Format generated code
/rust-fmt --generated

# Format with code generation hints
/rust-fmt --codegen

# Format macro expansions
/rust-fmt --macro-expansion
```

### Documentation Formatting

```bash
# Format documentation comments
/rust-fmt --doc-comments

# Format code in documentation
/rust-fmt --code-in-doc

# Format documentation examples
/rust-fmt --doc-examples
```

## Related Commands

- `/rust-check` - Check Rust code
- `/rust-clippy` - Lint Rust code
- `/rust-build` - Build Rust projects
- `/rust-test` - Run tests
- `/rust-run` - Run applications
- `/rust-doc` - Generate documentation
- `/js-fmt` - Format JavaScript/TypeScript
- `/python-fmt` - Format Python code
