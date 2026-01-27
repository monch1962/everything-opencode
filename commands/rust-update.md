# Rust Update Command

## Overview

The `rust-update` command updates Rust dependencies in your project using Cargo's update functionality. It intelligently handles dependency resolution, provides helpful error suggestions, and ensures your project's dependencies are up-to-date.

## Features

- **Smart dependency updates**: Updates all dependencies while maintaining compatibility
- **Error recovery**: Provides helpful suggestions when updates fail
- **Network handling**: Manages network issues gracefully
- **Version conflict resolution**: Helps resolve dependency conflicts
- **Progress reporting**: Shows real-time update progress

## Usage

```bash
# Update all dependencies
rust-update

# Update specific dependencies
rust-update package1 package2

# Update with specific version constraints
rust-update --precise package=1.2.3

# Update in offline mode
rust-update --offline

# Update with verbose output
rust-update --verbose

# Update and write lockfile
rust-update --locked
```

## Examples

```bash
# Basic update
rust-update

# Update specific crate
rust-update serde

# Update to specific version
rust-update --precise tokio=1.35.0

# Update with aggressive strategy
rust-update --aggressive

# Update workspace members only
rust-update --workspace
```

## Configuration

The command respects the following configuration options:

### Cargo.toml Settings

```toml
[package]
name = "your-project"
version = "0.1.0"
edition = "2021"

[dependencies]
# Dependencies to be updated
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }

[workspace]
members = ["crates/*"]
```

### Command Options

- `--precise`: Update to specific versions
- `--offline`: Run without network access
- `--verbose`: Show detailed output
- `--locked`: Require Cargo.lock to be up-to-date
- `--frozen`: Require Cargo.lock and cache to exist
- `--workspace`: Update workspace members only
- `--aggressive`: Update all dependencies aggressively
- `--dry-run`: Show what would be updated without making changes

## Error Handling

The command provides helpful suggestions for common update issues:

### Network Issues

```bash
# When network connection fails:
❌ Rust update failed: network error

💡 Update Error Suggestions:
   • Check internet connection
   • Check crates.io accessibility
   • Use cargo update --offline if available
```

### Version Conflicts

```bash
# When dependencies conflict:
❌ Rust update failed: version conflict

💡 Update Error Suggestions:
   • Check Cargo.lock for conflicts
   • Use cargo tree to see dependency graph
   • Consider using cargo update --precise
```

### Dependency Resolution

```bash
# When dependencies can't be resolved:
❌ Rust update failed: could not resolve dependencies

💡 Update Error Suggestions:
   • Check dependency compatibility
   • Review semver requirements
   • Consider updating major versions separately
```

## Integration

The update command integrates with:

### CI/CD Pipelines

```yaml
# GitHub Actions example
jobs:
  update-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
      - run: rust-update
      - run: cargo build --locked
```

### Development Workflow

```bash
# Typical development workflow
git checkout main
git pull
rust-update
cargo check
cargo test
```

### Pre-commit Hooks

```bash
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: rust-update-check
        name: Check for outdated dependencies
        entry: rust-update --dry-run
        language: system
        pass_filenames: false
```

## Best Practices

1. **Regular Updates**: Update dependencies regularly to stay secure
2. **Lockfile Management**: Commit Cargo.lock for reproducible builds
3. **Version Pinning**: Pin critical dependencies to specific versions
4. **Update Testing**: Always test after updating dependencies
5. **Incremental Updates**: Update one major version at a time

## Troubleshooting

### Common Issues

1. **Network Timeouts**: Use `--offline` flag or check proxy settings
2. **Version Conflicts**: Use `cargo tree` to visualize dependencies
3. **Broken Updates**: Use `cargo update --dry-run` to preview changes
4. **Memory Issues**: Update in smaller batches for large projects

### Debug Commands

```bash
# Show dependency tree
cargo tree

# Show outdated dependencies
cargo outdated

# Show update preview
rust-update --dry-run --verbose

# Check dependency compatibility
cargo check --all-targets
```

## Related Commands

- `rust-deps`: Manage Rust dependencies
- `rust-build`: Build Rust projects
- `rust-test`: Run Rust tests
- `rust-check`: Check Rust code
- `rust-clean`: Clean Rust build artifacts

## Notes

- Updates respect semver compatibility
- Works with workspaces and multiple crates
- Preserves feature flags and optional dependencies
- Handles git dependencies appropriately
- Supports both stable and nightly toolchains
