# Go Language Integration

Comprehensive Go language support for opencode with Go-specific improvements and modern development workflows.

## Overview

The Go integration provides a complete development environment for Go projects with intelligent tooling, cross-compilation support, security auditing, and performance optimization features.

## Features

### 🚀 Core Features

- **Smart Project Setup** - Automatic detection and configuration
- **Cross-Compilation** - Build for multiple platforms simultaneously
- **Comprehensive Testing** - Unit tests, benchmarks, and coverage
- **Code Quality** - Multiple linters and formatters
- **Security** - Vulnerability scanning and dependency auditing
- **Performance** - Benchmarking and profiling support

### 🛠️ Go-Specific Improvements

- **Modern Go Tooling** - Support for Go 1.16+ features
- **Go Modules Integration** - Full module support with vendor option
- **Workspace Support** - Go 1.18+ workspace configuration
- **Race Detector** - Built-in race condition detection
- **Coverage Reporting** - Multiple format support (HTML, text, XML)

## Commands

### `/go-setup`

Configure Go project with intelligent defaults and Go-specific improvements.

```bash
/go-setup [options] [project-path]
```

**Options:**

- `--quick`, `-q` - Quick setup with defaults
- `--project-type TYPE` - `module`, `cli`, `web`, `library`, `workspace`
- `--module-name NAME` - Go module name
- `--linter TOOL` - `golangci-lint`, `staticcheck`, `revive`
- `--formatter TOOL` - `gofmt`, `goimports`
- `--reconfigure`, `-r` - Reconfigure existing project

**Examples:**

```bash
/go-setup --project-type cli
/go-setup --module-name github.com/myorg/myapp
/go-setup --linter golangci-lint --formatter goimports
```

### `/go-build`

Build Go projects with cross-compilation and optimization features.

```bash
/go-build [options] [package]
```

**Options:**

- `--output`, `-o FILE` - Output binary name
- `--target OS/ARCH` - Cross-compilation target
- `--race` - Enable race detector
- `--cross-compile` - Build for all platforms
- `--clean` - Clean before building
- `--ldflags FLAGS` - Linker flags for version embedding

**Examples:**

```bash
/go-build --race
/go-build --target linux/amd64
/go-build --cross-compile
/go-build --ldflags "-X main.version=1.0.0"
```

### `/go-test`

Run comprehensive tests with coverage and benchmarking.

```bash
/go-test [options] [test-pattern]
```

**Options:**

- `--coverage`, `-c` - Enable coverage
- `--race` - Enable race detector
- `--bench`, `-b` - Run benchmarks
- `--timeout DURATION` - Test timeout
- `--count N` - Run tests N times
- `--parallel N` - Parallel execution

**Examples:**

```bash
/go-test --coverage --race
/go-test --bench --benchmem
/go-test --timeout 30s --count=3
```

### `/go-lint`

Lint code with multiple linter support and auto-fix capabilities.

```bash
/go-lint [options] [paths...]
```

**Options:**

- `--fix` - Auto-fix issues
- `--linter TOOL` - Choose linter
- `--timeout DURATION` - Linter timeout
- `--fast` - Run only fast linters
- `--config FILE` - Configuration file

**Examples:**

```bash
/go-lint --fix
/go-lint --linter staticcheck
/go-lint --timeout 10m
```

### `/go-fmt`

Format code with import organization and simplification.

```bash
/go-fmt [options] [paths...]
```

**Options:**

- `--write`, `-w` - Write changes
- `--diff`, `-d` - Show differences
- `--check` - Check without modifying
- `--formatter TOOL` - `gofmt` or `goimports`
- `--simplify`, `-s` - Apply simplifications

**Examples:**

```bash
/go-fmt --write
/go-fmt --check
/go-fmt --formatter goimports --write
```

### `/go-deps`

Manage dependencies with security auditing and update management.

```bash
/go-deps [action] [options]
```

**Actions:**

- `tidy` - Add missing, remove unused modules
- `vendor` - Create vendor directory
- `verify` - Verify dependency integrity
- `graph` - Print dependency graph
- `why` - Explain why package is needed
- `security`, `audit` - Security audit
- `update` - Update specific package
- `update-all` - Update all dependencies

**Examples:**

```bash
/go-deps tidy
/go-deps security
/go-deps update-all
/go-deps why github.com/pkg/errors
```

## Project Types

### 1. CLI Application

Command-line interface applications with `cmd/` structure.

```bash
/go-setup --project-type cli --module-name github.com/user/myapp
```

**Structure:**

```
project/
├── cmd/
│   └── myapp/
│       └── main.go
├── internal/
│   └── ...
├── go.mod
└── .opencode/
    └── go-config.json
```

### 2. Web Service

HTTP API services with common web dependencies.

```bash
/go-setup --project-type web --module-name github.com/user/api
```

**Features:**

- Gorilla mux integration
- CORS middleware support
- Structured logging
- Health check endpoints

### 3. Library/Package

Reusable Go packages for distribution.

```bash
/go-setup --project-type library --module-name github.com/user/mylib
```

**Structure:**

```
project/
├── pkg/
│   └── mylib/
│       └── mylib.go
├── go.mod
└── .opencode/
    └── go-config.json
```

### 4. Go Workspace

Multi-module projects (Go 1.18+).

```bash
/go-setup --project-type workspace
```

**Structure:**

```
project/
├── api/
│   └── go.mod
├── cli/
│   └── go.mod
├── shared/
│   └── go.mod
├── go.work
└── .opencode/
    └── go-config.json
```

## Configuration

### Project Configuration (`.opencode/go-config.json`)

```json
{
  "go": {
    "version": "1.21.0",
    "module": "github.com/user/project",
    "projectType": "cli",
    "usingModules": true,
    "usingWorkspace": false,
    "tools": {
      "linter": "golangci-lint",
      "formatter": "goimports",
      "testRunner": "gotestsum"
    },
    "linting": {
      "enabled": true,
      "tool": "golangci-lint",
      "configFile": ".golangci.yml"
    },
    "testing": {
      "enabled": true,
      "tool": "go test",
      "flags": ["-v", "-race"],
      "coverage": {
        "enabled": true,
        "threshold": 80
      }
    },
    "build": {
      "flags": [],
      "ldflags": [],
      "targets": [
        "linux/amd64",
        "darwin/amd64",
        "darwin/arm64",
        "windows/amd64"
      ]
    }
  }
}
```

### Linter Configuration (`.golangci.yml`)

```yaml
run:
  timeout: 5m
  modules-download-mode: vendor

linters:
  disable-all: true
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - typecheck
    - unused

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - gosec

output:
  format: colored-line-number
  print-issued-lines: true
  print-linter-name: true
```

## Tool Integration

### Supported Tools

| Tool            | Purpose               | Priority    |
| --------------- | --------------------- | ----------- |
| `golangci-lint` | Comprehensive linting | Recommended |
| `staticcheck`   | Static analysis       | High        |
| `goimports`     | Import organization   | High        |
| `gotestsum`     | Test runner           | Recommended |
| `delve`         | Debugging             | Optional    |
| `gosec`         | Security scanning     | Recommended |
| `pprof`         | Profiling             | Optional    |

### Installation Guides

The system provides platform-specific installation guides:

```bash
# macOS
brew install go golangci-lint

# Linux
sudo apt-get install golang-go
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh

# Windows
# Download from https://golang.org/dl/
scoop install golangci-lint
```

## Cross-Compilation

### Supported Platforms

- **Linux**: `amd64`, `arm64`, `arm`
- **macOS**: `amd64`, `arm64`
- **Windows**: `amd64`, `386`

### Batch Compilation

```bash
/go-build --cross-compile
```

**Outputs:**

- `myapp-linux-amd64`
- `myapp-linux-arm64`
- `myapp-darwin-amd64`
- `myapp-darwin-arm64`
- `myapp-windows-amd64.exe`

### Environment Variables

```bash
# Manual cross-compilation
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 /go-build
```

## Testing Framework

### Test Types

1. **Unit Tests** - Function and method testing
2. **Benchmarks** - Performance measurement
3. **Examples** - Documentation examples
4. **Integration Tests** - Component integration

### Coverage Reporting

```bash
/go-test --coverage --coverage-format html --coverage-output coverage.html
```

**Formats:**

- `html` - Interactive HTML report
- `text` - Text summary
- `xml` - CI integration format

### Benchmark Analysis

```bash
/go-test --bench --benchmem --benchtime 5s
```

**Metrics:**

- Time per operation
- Memory allocations
- Bytes per operation
- Allocations per operation

## Security Features

### Dependency Auditing

```bash
/go-deps security
```

**Checks:**

- Known vulnerabilities
- Outdated dependencies
- License compliance
- Checksum verification

### Code Security

```bash
/go-lint --linter gosec
```

**Scans:**

- Hardcoded credentials
- SQL injection risks
- File inclusion vulnerabilities
- Command injection

## Performance Optimization

### Profiling

```bash
# CPU profiling
go test -cpuprofile cpu.prof -bench .

# Memory profiling
go test -memprofile mem.prof -bench .
```

### Benchmark Comparison

```bash
# Run benchmarks
/go-test --bench --benchtime 10s > current.txt

# Compare with previous run
benchcmp previous.txt current.txt
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Go CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: /go-test --coverage --race
      - run: /go-lint
      - run: /go-fmt --check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: /go-build --cross-compile

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: /go-deps security
```

### GitLab CI

```yaml
stages:
  - test
  - build
  - security

go-test:
  stage: test
  image: golang:1.21
  script:
    - /go-test --coverage
    - /go-lint
    - /go-fmt --check

go-build:
  stage: build
  image: golang:1.21
  script:
    - /go-build --cross-compile
  artifacts:
    paths:
      - bin/

go-security:
  stage: security
  image: golang:1.21
  script:
    - /go-deps security
```

## Error Handling

### Common Errors and Solutions

#### Module Not Found

```
Error: cannot find module providing package github.com/example/pkg
```

**Solution:**

```bash
/go-deps tidy
# or
go get github.com/example/pkg
```

#### Build Constraints

```
Error: build constraints exclude all Go files
```

**Solution:**

```bash
# Check build tags
/go-build --tags "integration,debug"

# Review .go files for build constraints
```

#### Race Detector Issues

```
WARNING: DATA RACE
```

**Solution:**

- Run with `--race` flag to detect
- Use mutexes or channels for synchronization
- Review concurrent access patterns

## Best Practices

### 1. Project Structure

- Use `cmd/` for executables
- Use `internal/` for private code
- Use `pkg/` for public libraries
- Keep `go.mod` at root

### 2. Testing

- Write table-driven tests
- Use subtests for organization
- Include benchmarks for performance-critical code
- Maintain high test coverage

### 3. Code Quality

- Run `/go-lint --fix` regularly
- Use `/go-fmt --check` in CI
- Enable race detector in tests
- Audit dependencies monthly

### 4. Security

- Run `/go-deps security` in CI
- Use `gosec` for code scanning
- Keep dependencies updated
- Review vulnerability reports

### 5. Performance

- Profile before optimizing
- Use benchmarks for comparison
- Monitor memory allocations
- Consider cross-compilation targets

## Migration Guide

### From GOPATH to Go Modules

```bash
# Initialize module
go mod init github.com/user/project

# Migrate dependencies
go mod tidy

# Verify migration
/go-deps verify
```

### From Dep to Go Modules

```bash
# Remove dep files
rm Gopkg.toml Gopkg.lock

# Initialize module
go mod init

# Convert dependencies
go mod tidy
```

### From Vendor to Go Modules

```bash
# Remove vendor directory
rm -rf vendor/

# Initialize module
go mod init

# Let Go manage dependencies
/go-deps tidy
```

## Examples

See the [example Go projects](../examples/go-projects/) for complete working examples:

1. **Hello World** - Basic CLI application
2. **Web Service** - HTTP API example
3. **Library Package** - Reusable package example
4. **Workspace** - Multi-module workspace example

## Troubleshooting

### Common Issues

#### Tool Not Found

```
Error: golangci-lint not found
```

**Solution:**

```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

#### Permission Denied

```
Error: permission denied
```

**Solution:**

```bash
# Check file permissions
ls -la

# Fix permissions
chmod +x /path/to/tool
```

#### Out of Memory

```
Error: out of memory
```

**Solution:**

- Increase system memory
- Use `--fast` flag with linters
- Limit parallel execution

### Debugging

```bash
# Verbose output
/go-build --verbose

# Dry run
/go-deps --dry-run tidy

# Debug environment
go env
```

## Contributing

### Adding New Tools

1. Add tool detection to `languages/go/tool-detector.js`
2. Update installation guides
3. Add configuration options
4. Update documentation

### Extending Commands

1. Add new command to `scripts/commands/`
2. Update command runner
3. Add documentation
4. Create examples

### Testing Changes

```bash
# Run Go tests
/go-test

# Test cross-compilation
/go-build --cross-compile

# Verify linting
/go-lint

# Check formatting
/go-fmt --check
```

## Resources

### Official Documentation

- [Go Language](https://golang.org/doc/)
- [Go Modules](https://go.dev/ref/mod)
- [Go Workspaces](https://go.dev/doc/tutorial/workspaces)

### Tool Documentation

- [golangci-lint](https://golangci-lint.run/)
- [staticcheck](https://staticcheck.io/)
- [delve](https://github.com/go-delve/delve)
- [gosec](https://github.com/securego/gosec)

### Community Resources

- [Go Blog](https://blog.golang.org/)
- [Go Forum](https://forum.golangbridge.org/)
- [Go Reddit](https://www.reddit.com/r/golang/)

## License

Go integration is part of the opencode project. See the main [LICENSE](../LICENSE) file for details.

## Support

For issues and questions:

1. Check the [troubleshooting](#troubleshooting) section
2. Review [examples](../examples/go-projects/)
3. Open an issue on GitHub
4. Consult the Go community resources
