# Rust Build Command

Build Rust projects with Cargo, featuring intelligent defaults, dependency management, and optimization.

## Overview

The `/rust-build` command builds Rust projects using Cargo with intelligent configuration detection and optimization. It handles dependency resolution, compilation, linking, and produces optimized binaries for various targets and platforms.

## Features

- **Cargo Integration**: Full Cargo compatibility with enhanced features
- **Intelligent Optimization**: Automatic optimization based on build type
- **Cross-Compilation**: Build for different targets and platforms
- **Incremental Compilation**: Faster builds by reusing compilation artifacts
- **Dependency Management**: Handles crate dependencies and version resolution
- **Profile Support**: Multiple build profiles (dev, release, bench, test)
- **Feature Flags**: Manage conditional compilation features
- **Workspace Support**: Handle multi-crate workspaces
- **Error Recovery**: Helpful suggestions for common build errors

## Usage

```bash
/rust-build [options] [cargo-options...]
```

### Options

| Option                  | Short | Description                                  |
| ----------------------- | ----- | -------------------------------------------- |
| `--release`             | `-r`  | Build in release mode (optimized)            |
| `--debug`               | `-d`  | Build with debug symbols                     |
| `--target`              | `-t`  | Target triple for cross-compilation          |
| `--features`            | `-f`  | Space-separated list of features to activate |
| `--no-default-features` |       | Do not activate default features             |
| `--workspace`           | `-w`  | Build all crates in workspace                |
| `--package`             | `-p`  | Package to build                             |
| `--help`                | `-h`  | Show help message                            |

## Examples

### Development build

```bash
/rust-build
```

Builds the project in development mode with debug symbols.

### Release build

```bash
/rust-build --release
```

Builds optimized binaries for production.

### Cross-compilation

```bash
/rust-build --target x86_64-unknown-linux-gnu --release
```

Builds for Linux target from other platforms.

### With specific features

```bash
/rust-build --features "serde,json" --release
```

Builds with serde and json features enabled.

### Workspace build

```bash
/rust-build --workspace --release
```

Builds all crates in the workspace.

### Specific package

```bash
/rust-build --package my-crate --release
```

Builds only the specified package.

## Configuration

### Cargo.toml Detection

The command automatically detects and uses `Cargo.toml` configuration:

```toml
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }

[features]
default = ["json", "logging"]
json = ["serde/json"]
logging = ["tracing"]

[profile.dev]
opt-level = 0
debug = true

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

### Build Profiles

The command supports multiple build profiles:

#### Development (`--debug` or default)

- Optimized for compile speed
- Debug symbols enabled
- Panic unwinding for better debugging
- Default optimization level 0

#### Release (`--release`)

- Maximum optimization (level 3)
- Link-time optimization (LTO)
- Dead code elimination
- Stripped debug symbols (configurable)

#### Benchmark (`--profile bench`)

- Optimized for performance measurement
- Additional instrumentation
- Stable performance characteristics

#### Custom Profiles

Define custom profiles in `Cargo.toml`:

```toml
[profile.custom]
inherits = "release"
opt-level = 2
debug = 1
```

### Feature Management

```bash
# Enable specific features
/rust-build --features "feature1,feature2"

# Disable default features
/rust-build --no-default-features --features "custom-feature"

# Combine multiple feature sets
/rust-build --features "default serde/json tokio/full"
```

## Build Process

### Dependency Resolution

```bash
# Update dependencies before building
/rust-build --update

# Use offline mode
/rust-build --offline

# Lock dependency versions
/rust-build --locked
```

### Compilation Optimization

```bash
# Parallel compilation
/rust-build --jobs 8

# Incremental compilation (faster development)
/rust-build --incremental

# Control code generation units
/rust-build --codegen-units 16
```

### Output Configuration

```bash
# Specify output directory
/rust-build --out-dir ./dist

# Build specific artifact type
/rust-build --bin my-app
/rust-build --lib
/rust-build --example demo

# Generate build artifacts
/rust-build --artifacts
```

## Advanced Features

### Cross-Compilation

```bash
# Install target
rustup target add x86_64-unknown-linux-gnu

# Build for target
/rust-build --target x86_64-unknown-linux-gnu --release

# Multiple targets
/rust-build --target x86_64-pc-windows-gnu --target x86_64-apple-darwin
```

### Workspace Management

```bash
# Build all workspace members
/rust-build --workspace

# Build specific workspace members
/rust-build --package crate-a --package crate-b

# Exclude specific crates
/rust-build --workspace --exclude integration-tests
```

### Custom Build Scripts

```bash
# Run build.rs script
/rust-build --build-script

# Force rebuild of build script dependencies
/rust-build --force-rebuild

# Custom build script arguments
/rust-build --build-arg "feature=production"
```

## Integration

### With Testing

```bash
# Build then test
/rust-build && /rust-test

# Build tests without running
/rust-build --tests

# Build benchmarks
/rust-build --benches
```

### With Code Quality Tools

```bash
# Build then check
/rust-build && /rust-check

# Build then lint
/rust-build && /rust-clippy

# Build then format check
/rust-build && /rust-fmt --check
```

### In CI/CD Pipelines

```bash
# Build for CI
/rust-build --release --target x86_64-unknown-linux-musl

# Generate build artifacts
/rust-build --release --out-dir artifacts

# Build verification
/rust-build --check-only
```

## Performance Optimization

### Compilation Speed

```bash
# Use more CPU cores
/rust-build --jobs $(nproc)

# Enable incremental compilation
/rust-build --incremental

# Cache dependencies
/rust-build --cached

# Skip dependency updates
/rust-build --frozen
```

### Binary Optimization

```bash
# Aggressive optimization
/rust-build --release --opt-level 3 --lto

# Size optimization
/rust-build --release --opt-level s --strip

# Performance profiling
/rust-build --release --profile-generate
```

### Memory Management

```bash
# Limit memory usage
/rust-build --memory-limit 4G

# Control parallelism
/rust-build --jobs 4 --codegen-units 1

# Use system allocator
/rust-build --features "system-allocator"
```

## Troubleshooting

### Common Build Errors

#### Dependency Issues

```bash
# Update dependencies
/rust-update

# Clear cache and rebuild
/rust-clean && /rust-build

# Check dependency tree
/rust-build --tree
```

#### Compilation Errors

```bash
# Show detailed error messages
/rust-build --verbose

# Build with backtraces
RUST_BACKTRACE=1 /rust-build

# Check specific crate
/rust-build --package problematic-crate
```

#### Linker Errors

```bash
# Check linker configuration
/rust-build --print-link-args

# Use system linker
/rust-build --linker gcc

# Cross-compilation linker
/rust-build --target arm-unknown-linux-gnueabihf --linker arm-linux-gnueabihf-gcc
```

### Performance Issues

#### Slow Compilation

```bash
# Profile compilation
/rust-build --timings

# Identify slow crates
/rust-build --time-passes

# Use sccache for caching
/rust-build --sccache
```

#### Large Binaries

```bash
# Analyze binary size
/rust-build --release && cargo-bloat

# Strip debug symbols
/rust-build --release --strip

# Use LTO and optimization
/rust-build --release --lto --opt-level z
```

#### Memory Exhaustion

```bash
# Reduce parallelism
/rust-build --jobs 2 --codegen-units 1

# Increase swap space
/rust-build --swap

# Build in chunks
/rust-build --chunk-size 10
```

## Advanced Usage

### Custom Toolchains

```bash
# Use nightly toolchain
/rust-build --toolchain nightly

# Specific Rust version
/rust-build --toolchain 1.75.0

# Custom toolchain path
/rust-build --toolchain-path /path/to/toolchain
```

### Build Variants

```bash
# Build with sanitizers
/rust-build --sanitizer address
/rust-build --sanitizer thread
/rust-build --sanitizer memory

# Build for embedded
/rust-build --target thumbv7em-none-eabihf --no-std

# Build with custom flags
/rust-build --rustflags "-C target-cpu=native"
```

### Artifact Management

```bash
# Generate multiple artifacts
/rust-build --artifacts bin,lib,example

# Sign artifacts
/rust-build --release --sign

# Package artifacts
/rust-build --release --package-format tar.gz
```

## Related Commands

- `/rust-check` - Check code without building
- `/rust-test` - Run tests
- `/rust-run` - Run Rust applications
- `/rust-clippy` - Lint Rust code
- `/rust-fmt` - Format Rust code
- `/rust-clean` - Clean build artifacts
- `/rust-update` - Update dependencies
