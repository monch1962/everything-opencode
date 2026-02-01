# /go-run

Run Go programs with enhanced features.

## Description

The `/go-run` command runs Go programs with enhanced features including race detection, environment variable management, and improved error handling. It provides a convenient way to execute Go programs during development with additional debugging and monitoring capabilities.

## Usage

```bash
/go-run [options] [package] [arguments...]
```

## Options

| Option            | Description               |
| ----------------- | ------------------------- |
| `--race`          | Enable race detector      |
| `--env KEY=VALUE` | Set environment variables |
| `--verbose`, `-v` | Verbose output            |
| `--help`, `-h`    | Show help message         |

## Examples

```bash
# Run main.go in current directory
/go-run

# Run with race detector
/go-run --race

# Run with environment variables
/go-run --env DEBUG=true --env PORT=8080

# Run specific Go file
/go-run main.go

# Run with arguments
/go-run -- arg1 arg2

# Verbose output
/go-run --verbose

# Run package
/go-run ./cmd/server
```

## Features

### Race Detection

```bash
# Enable Go race detector
/go-run --race
```

The race detector helps find race conditions in concurrent Go programs.

### Environment Management

```bash
# Set multiple environment variables
/go-run --env DEBUG=true --env PORT=8080
```

### Package Support

```bash
# Run package
/go-run ./cmd/server

# Run with package arguments
/go-run ./cmd/server --port 8080 --debug
```

### File Execution

```bash
# Run specific Go file
/go-run main.go

# Run multiple files
/go-run main.go utils.go
```

## Common Use Cases

### Development Testing

```bash
# Quick test during development
/go-run
```

### Debugging Race Conditions

```bash
# Check for race conditions
/go-run --race
```

### Environment Configuration

```bash
# Run with development configuration
/go-run --env NODE_ENV=development --env DEBUG=true
```

### Integration Testing

```bash
# Run integration tests
/go-run ./tests/integration
```

## Error Handling

The command provides enhanced error handling:

1. **Clear error messages** with suggestions
2. **Missing dependency detection**
3. **Build error explanations**
4. **Environment variable validation**

## Exit Codes

| Code | Description              |
| ---- | ------------------------ |
| `0`  | Success                  |
| `1`  | Program execution failed |
| `2`  | Build/compilation failed |
| `3`  | Invalid arguments        |

## Environment Variables

You can set environment variables in multiple ways:

### Command Line

```bash
/go-run --env KEY1=value1 --env KEY2=value2
```

### Shell Environment

```bash
export DEBUG=true
export PORT=8080
/go-run
```

### .env File

```bash
# .env file
DEBUG=true
PORT=8080

# Run with .env file
/go-run
```

## Related Commands

- `/go-build` - Build Go projects
- `/go-test` - Run Go tests
- `/go-clean` - Clean build artifacts
- `/go-mod` - Manage Go modules

## Tips

### Quick Development Cycle

```bash
# Edit code, then run
/go-run
```

### Debugging

```bash
# Run with race detector for concurrency issues
/go-run --race

# Run with verbose output
/go-run --verbose
```

### Integration with Editors

```bash
# Can be integrated with editor/IDE run configurations
/go-run --env NODE_ENV=test
```

### Testing Different Configurations

```bash
# Test with different environment configurations
/go-run --env CONFIG=development
/go-run --env CONFIG=staging
/go-run --env CONFIG=production
```

## Limitations

- Not suitable for production deployment
- Limited to single execution (no daemon mode)
- No built-in hot reload (use external tools)

## Alternatives

For production deployment, consider:

- `/go-build` to create production binaries
- Containerization (Docker)
- Systemd services
- Process managers (supervisord, pm2)

## Notes

- Use for development and testing only
- Race detector adds overhead
- Environment variables are passed to the Go program
- Arguments after `--` are passed to the Go program
- Supports both files and package paths
