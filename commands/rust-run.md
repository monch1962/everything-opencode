# Rust Run Command

Run Rust applications with Cargo, featuring intelligent execution, monitoring, and debugging.

## Overview

The `/rust-run` command executes Rust applications using Cargo with enhanced features for development and production. It handles dependency resolution, compilation, and execution with intelligent defaults, performance monitoring, and debugging support.

## Features

- **Cargo Execution**: Full Cargo compatibility with enhanced features
- **Intelligent Compilation**: Automatic detection of build requirements
- **Performance Monitoring**: Real-time monitoring of application performance
- **Debugging Support**: Integrated debugging with breakpoints and inspection
- **Profile Management**: Multiple run profiles (dev, release, bench, test)
- **Environment Management**: Handle environment variables and configuration
- **Hot Reloading**: Development mode with automatic code reloading
- **Resource Management**: Monitor and manage CPU, memory, and I/O usage

## Usage

```bash
/rust-run [options] [args...]
```

### Options

| Option       | Short | Description                                  |
| ------------ | ----- | -------------------------------------------- |
| `--release`  | `-r`  | Run in release mode (optimized)              |
| `--debug`    | `-d`  | Run with debugger attached                   |
| `--profile`  | `-p`  | Run with specific profile                    |
| `--features` | `-f`  | Space-separated list of features to activate |
| `--watch`    | `-w`  | Watch mode with hot reload                   |
| `--memory`   |       | Set memory limits                            |
| `--port`     |       | Port for network applications                |
| `--help`     | `-h`  | Show help message                            |

## Examples

### Run development build

```bash
/rust-run
```

Runs the application in development mode.

### Run release build

```bash
/rust-run --release
```

Runs optimized release build.

### Run with hot reload

```bash
/rust-run --watch
```

Runs with file watching and automatic reloading.

### Run with specific features

```bash
/rust-run --features "serde,json"
```

Runs with serde and json features enabled.

### Run with debugger

```bash
/rust-run --debug
```

Runs with debugger attached on port 5005.

### Run web application

```bash
/rust-run --port 8080
```

Runs web application on port 8080.

### Run with memory limits

```bash
/rust-run --memory 2g
```

Runs with 2GB memory limit.

## Configuration

### Cargo.toml Run Configuration

Configure run behavior in `Cargo.toml`:

```toml
[package]
name = "my-app"
version = "0.1.0"

# Run configuration
[package.metadata.run]
# Default run settings
default-profile = "dev"
watch-delay = 100
open-browser = true

# Profile-specific settings
[package.metadata.run.profiles]
dev = {
    features = ["dev"],
    env = { "RUST_LOG" = "debug" },
    args = ["--verbose"]
}
release = {
    features = [],
    env = { "RUST_LOG" = "info" },
    memory = "4g"
}

# Application-specific settings
[package.metadata.run.app]
# Web application
web = {
    port = 8080,
    host = "0.0.0.0",
    ssl = false
}

# CLI application
cli = {
    interactive = true,
    color = true,
    progress = true
}
```

### Environment Configuration

Create `.env.run` for environment-specific configuration:

```bash
# .env.run
# Development environment
RUST_LOG=debug
DATABASE_URL=postgres://localhost/dev
REDIS_URL=redis://localhost:6379

# Feature flags
ENABLE_FEATURE_X=true
ENABLE_FEATURE_Y=false

# Performance tuning
RUST_BACKTRACE=1
RAYON_NUM_THREADS=4
```

## Execution Modes

### Development Mode

```bash
/rust-run
```

- Debug symbols enabled
- Fast compilation
- Hot reloading available
- Development features enabled

### Release Mode

```bash
/rust-run --release
```

- Optimized binaries
- Stripped debug symbols
- Production configuration
- Performance monitoring

### Debug Mode

```bash
/rust-run --debug
```

- Debugger attached
- Breakpoint support
- Variable inspection
- Step-through debugging

### Watch Mode

```bash
/rust-run --watch
```

- File system monitoring
- Automatic recompilation
- State preservation
- Fast iteration

## Application Types

### CLI Applications

```bash
# Run CLI tool with arguments
/rust-run -- arg1 arg2 arg3

# Interactive CLI
/rust-run --interactive

# CLI with color output
/rust-run --color
```

### Web Applications

```bash
# Run web server
/rust-run --port 3000

# HTTPS server
/rust-run --port 443 --ssl

# Multiple instances
/rust-run --instances 4 --port 3000
```

### Background Services

```bash
# Run as background service
/rust-run --daemon

# Service with health checks
/rust-run --health

# Service with metrics
/rust-run --metrics
```

### GUI Applications

```bash
# GUI application
/rust-run --gui

# GUI with specific backend
/rust-run --gui --backend gtk

# GUI with window size
/rust-run --gui --width 800 --height 600
```

## Performance Monitoring

### Resource Monitoring

```bash
# Monitor CPU and memory
/rust-run --monitor

# Monitor with specific interval
/rust-run --monitor --interval 5

# Generate performance report
/rust-run --monitor --report performance.json
```

### Profiling

```bash
# CPU profiling
/rust-run --profile-cpu

# Memory profiling
/rust-run --profile-memory

# Generate flame graph
/rust-run --flamegraph
```

### Benchmarking

```bash
# Run benchmarks
/rust-run --bench

# Compare with previous run
/rust-run --bench --compare

# Generate benchmark report
/rust-run --bench --report benchmarks.json
```

## Integration

### With Debugging

```bash
# Run with debugger
/rust-run --debug

# Connect debugger
# IntelliJ: Run -> Debug -> Remote JVM Debug
# VS Code: Rust Debugger extension

# Debug with specific breakpoints
/rust-run --debug --breakpoints main.rs:42
```

### With Testing

```bash
# Run tests before execution
/rust-test && /rust-run

# Run with test configuration
/rust-run --profile test

# Run integration tests
/rust-run --integration-tests
```

### With Development Tools

```bash
# Run with REPL
/rust-run --repl

# Run with documentation server
/rust-run --doc-server

# Run with metrics dashboard
/rust-run --metrics-dashboard
```

### In CI/CD Pipelines

```bash
# Smoke test in CI
/rust-run --smoke-test

# Performance test
/rust-run --performance-test --timeout 60

# Integration test
/rust-run --integration --env test
```

## Advanced Features

### Custom Entry Points

```bash
# Run specific binary
/rust-run --bin my-binary

# Run example
/rust-run --example demo

# Run benchmark
/rust-run --bench my-benchmark

# Run test as executable
/rust-run --test integration_test
```

### Cross-Compilation Execution

```bash
# Run for specific target
/rust-run --target wasm32-unknown-unknown

# Run in container
/rust-run --container docker

# Run on remote server
/rust-run --remote user@server
```

### State Management

```bash
# Save application state
/rust-run --save-state

# Load previous state
/rust-run --load-state

# State snapshots
/rust-run --snapshot-interval 60
```

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check dependencies
/rust-run --check-deps

# Increase startup timeout
/rust-run --startup-timeout 30

# Run with verbose logging
/rust-run --verbose
```

#### Memory Issues

```bash
# Increase heap size
/rust-run --memory 4g

# Enable GC logging
/rust-run --gc-log

# Profile memory usage
/rust-run --profile-memory --duration 300
```

#### Performance Problems

```bash
# CPU profiling
/rust-run --profile-cpu --duration 60

# Identify bottlenecks
/rust-run --bottleneck-analysis

# Optimize runtime
/rust-run --optimize
```

### Debugging

#### Remote Debugging

```bash
# Start with debug agent
/rust-run --debug --port 5005

# Connect with IDE
# Debug configuration:
# - Host: localhost
# - Port: 5005
# - Protocol: lldb/gdb
```

#### Log Analysis

```bash
# Structured logging
/rust-run --log-format json

# Log to file
/rust-run --log-file app.log

# Log aggregation
/rust-run --log-format json | jq '.'
```

#### Crash Analysis

```bash
# Generate core dumps
/rust-run --core-dumps

# Analyze crashes
/rust-run --crash-analysis

# Automatic recovery
/rust-run --auto-recover
```

## Security

### Secure Execution

```bash
# Run with reduced privileges
/rust-run --user nobody --group nogroup

# Sandbox execution
/rust-run --sandbox

# Resource limits
/rust-run --rlimit cpu=60 --rlimit as=2g
```

### Network Security

```bash
# Firewall rules
/rust-run --firewall

# Network isolation
/rust-run --network-isolation

# TLS configuration
/rust-run --tls-cert cert.pem --tls-key key.pem
```

### Input Validation

```bash
# Validate input arguments
/rust-run --validate-input

# Sanitize environment
/rust-run --sanitize-env

# Security scanning
/rust-run --security-scan
```

## Related Commands

- `/rust-build` - Build Rust projects
- `/rust-test` - Run tests
- `/rust-check` - Check code
- `/rust-clippy` - Lint code
- `/rust-fmt` - Format code
- `/rust-doc` - Generate documentation
- `/js-run` - Run JavaScript/TypeScript applications
- `/python-run` - Run Python applications
