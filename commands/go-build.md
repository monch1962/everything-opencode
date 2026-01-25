# /go-build

Build Go projects with Go-specific improvements.

## Description

The `/go-build` command builds Go projects with intelligent defaults, cross-compilation support, and Go-specific optimizations. It provides build information, error suggestions, and supports modern Go build features.

## Usage

```bash
/go-build [options] [package]
```

## Options

| Option                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `--output`, `-o FILE` | Output binary file name                            |
| `--target OS/ARCH`    | Build target (e.g., `linux/amd64`, `darwin/arm64`) |
| `--race`              | Enable race detector                               |
| `--tags TAGS`         | Build tags (comma-separated)                       |
| `--build-mode MODE`   | Build mode (`ex`, `pie`, `shared`, etc.)           |
| `--ldflags FLAGS`     | Linker flags                                       |
| `--verbose`, `-v`     | Verbose output                                     |
| `--clean`             | Clean build artifacts before building              |
| `--cross-compile`     | Cross-compile for multiple platforms               |
| `--help`, `-h`        | Show help message                                  |

## Examples

```bash
# Build current project
/go-build

# Build with specific output name
/go-build --output myapp

# Build with race detector
/go-build --race

# Cross-compile for Linux
/go-build --target linux/amd64

# Cross-compile for all platforms
/go-build --cross-compile

# Clean and build
/go-build --clean

# Build specific package
/go-build ./cmd/myapp

# Build with custom ldflags
/go-build --ldflags "-X main.version=1.0.0 -X main.commit=$(git rev-parse HEAD)"
```

## Go-Specific Features

### Smart Output Management

- Default output to `./bin/` directory
- Automatic binary naming based on project type
- Platform-specific extensions (`.exe` for Windows)
- Output directory creation if not exists

### Cross-Compilation Support

- **Linux**: `amd64`, `arm64`, `arm`
- **macOS**: `amd64`, `arm64`
- **Windows**: `amd64`, `386`
- Automatic `CGO_ENABLED=0` for static binaries
- Platform-specific output naming

### Build Information

- Shows Go version and module info
- Displays build constraints and flags
- Provides output path information
- Shows race detector status
- Displays target platform

### Error Suggestions

- Provides fixes for common build errors
- Suggests dependency management commands
- Recommends tool installations
- Offers workarounds for platform-specific issues

### Build Optimization

- Race detector integration
- Build tag support
- LDFLAGS for version embedding
- Build mode selection
- Cache management

## Build Process

### 1. Environment Detection

- Checks Go version and tools
- Detects Go module configuration
- Identifies build constraints
- Checks for race detector support

### 2. Build Configuration

- Applies configuration from `.opencode/go-config.json`
- Sets build flags and ldflags
- Configures output location
- Sets up environment variables

### 3. Build Execution

- Executes `go build` with appropriate flags
- Handles cross-compilation environment
- Manages build cache
- Captures build output

### 4. Post-Build Actions

- Shows build information
- Verifies binary output
- Provides next steps
- Cleans up temporary files

## Cross-Compilation

### Supported Platforms

```bash
# Linux
/go-build --target linux/amd64
/go-build --target linux/arm64
/go-build --target linux/arm

# macOS
/go-build --target darwin/amd64
/go-build --target darwin/arm64

# Windows
/go-build --target windows/amd64
/go-build --target windows/386
```

### Batch Cross-Compilation

```bash
# Build for all supported platforms
/go-build --cross-compile

# Output files:
# - myapp-linux-amd64
# - myapp-linux-arm64
# - myapp-darwin-amd64
# - myapp-darwin-arm64
# - myapp-windows-amd64.exe
```

### Environment Variables

Cross-compilation automatically sets:

- `GOOS` - Target operating system
- `GOARCH` - Target architecture
- `CGO_ENABLED=0` - Disable CGO for static binaries
- `GO111MODULE=on` - Enable Go modules

## Build Flags

### Common Flags

- `-v` - Verbose output
- `-race` - Race detector
- `-tags` - Build constraints
- `-ldflags` - Linker flags
- `-buildmode` - Build mode

### LDFLAGS Examples

```bash
# Version embedding
/go-build --ldflags "-X main.version=1.0.0"

# Commit hash embedding
/go-build --ldflags "-X main.commit=$(git rev-parse HEAD)"

# Build time embedding
/go-build --ldflags "-X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Multiple flags
/go-build --ldflags "\
  -X main.version=1.0.0 \
  -X main.commit=$(git rev-parse HEAD) \
  -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

## Build Modes

### Available Modes

- `exe` - Executable (default)
- `pie` - Position Independent Executable
- `shared` - Shared library
- `c-shared` - C shared library
- `c-archive` - C archive

### Examples

```bash
# Position Independent Executable
/go-build --build-mode pie

# Shared library
/go-build --build-mode shared

# C shared library
/go-build --build-mode c-shared
```

## Error Handling

### Common Errors and Fixes

#### Module Not Found

```
Error: cannot find module providing package github.com/example/pkg
```

**Fix:**

```bash
/go-deps tidy
# or
go get github.com/example/pkg
```

#### Undefined Symbol

```
Error: undefined: SomeFunction
```

**Fix:**

- Check import statements
- Verify function name spelling
- Ensure package is imported correctly

#### Imported and Not Used

```
Error: imported and not used: "fmt"
```

**Fix:**

- Remove unused import
- Or use blank identifier: `_ "fmt"`

#### Missing go.sum Entry

```
Error: missing go.sum entry for module
```

**Fix:**

```bash
/go-deps tidy
# or
go mod download
```

## Build Information Display

After successful build, shows:

```
📊 Build Information:
========================================
Go: go version go1.21.0 darwin/amd64
Module: github.com/user/project
Target: darwin/arm64
Race detector: enabled
Output: /path/to/project/bin/myapp
```

## Performance Tips

### Build Cache

- Uses Go build cache automatically
- Cache location: `$GOCACHE`
- Can be cleared with `--clean` flag

### Parallel Building

- Go builds modules in parallel
- Use `-p` flag to control parallelism
- Defaults to number of CPU cores

### Incremental Builds

- Subsequent builds are faster
- Only changed packages are rebuilt
- Cache invalidated on dependency changes

## Integration

### CI/CD Pipelines

```yaml
# GitHub Actions example
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: /go-build --cross-compile
```

### Makefile Integration

```makefile
.PHONY: build
build:
	/go-build --output $(BINARY)

.PHONY: build-all
build-all:
	/go-build --cross-compile

.PHONY: clean-build
clean-build:
	/go-build --clean
```

## Exit Codes

| Code | Description                       |
| ---- | --------------------------------- |
| 0    | Build successful                  |
| 1    | Build failed                      |
| 2    | Configuration error               |
| 3    | Cross-compilation partial failure |

## Environment Variables

| Variable      | Description             |
| ------------- | ----------------------- |
| `GOOS`        | Target operating system |
| `GOARCH`      | Target architecture     |
| `CGO_ENABLED` | CGO enable/disable      |
| `GO111MODULE` | Go modules mode         |
| `GOCACHE`     | Build cache directory   |
| `GOPATH`      | Go workspace path       |

## See Also

- `/go-setup` - Configure Go project
- `/go-test` - Run Go tests
- `/go-lint` - Lint Go code
- `/go-fmt` - Format Go code
- `/go-deps` - Manage dependencies
- [Go Build Command](https://pkg.go.dev/cmd/go#hdr-Compile_packages_and_dependencies)
- [Cross-compilation Guide](https://go.dev/doc/install/source#environment)
- [Build Constraints](https://pkg.go.dev/go/build#hdr-Build_Constraints)
