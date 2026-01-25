# /go-setup

Configure Go project for opencode integration with Go-specific improvements.

## Description

The `/go-setup` command configures Go projects for integration with opencode, providing Go-specific improvements and modern Go development workflows. It detects existing Go projects or creates new ones with appropriate structure and tooling.

## Usage

```bash
/go-setup [options] [project-path]
```

## Options

| Option                 | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `--quick`, `-q`        | Quick setup with defaults                                    |
| `--reconfigure`, `-r`  | Reconfigure existing project                                 |
| `--project-type TYPE`  | Project type: `module`, `cli`, `web`, `library`, `workspace` |
| `--module-name NAME`   | Go module name (e.g., `github.com/user/project`)             |
| `--go-version VERSION` | Go version constraint (e.g., `1.21`)                         |
| `--linter TOOL`        | Linter tool: `golangci-lint`, `staticcheck`, `revive`        |
| `--formatter TOOL`     | Formatter: `gofmt`, `goimports`                              |
| `--test-runner TOOL`   | Test runner: `go test`, `gotestsum`                          |
| `--no-prompt`, `-y`    | Skip interactive prompts                                     |
| `--verbose`, `-v`      | Verbose output                                               |
| `--dry-run`            | Show configuration without saving                            |
| `--help`, `-h`         | Show help message                                            |

## Examples

```bash
# Configure current directory
/go-setup

# Quick setup with defaults
/go-setup --quick

# Create CLI application
/go-setup --project-type cli

# Reconfigure existing project
/go-setup --reconfigure

# Configure specific directory
/go-setup /path/to/project

# Create web service with specific module name
/go-setup --project-type web --module-name github.com/myorg/myservice
```

## Go-Specific Features

### Automatic Detection

- Detects existing Go projects (go.mod, go.work, .go files)
- Identifies Go version and installed tools
- Detects GOPATH vs Go modules environment
- Identifies Go workspace support (Go 1.18+)

### Project Types

1. **Simple Go Module** - Basic Go module structure
2. **CLI Application** - Command-line application with `cmd/` structure
3. **Web Service/API** - Web service with common dependencies and structure
4. **Library/Package** - Library project with `pkg/` structure
5. **Go Workspace** - Multi-module workspace (Go 1.18+)

### Tool Integration

- **Linters**: golangci-lint, staticcheck, revive
- **Formatters**: gofmt, goimports
- **Test Runners**: go test, gotestsum
- **Debugging**: delve integration
- **Security**: gosec scanning
- **Documentation**: godoc generation

### Configuration Generation

- Creates `.opencode/go-config.json`
- Generates `.golangci.yml` for golangci-lint
- Creates `.gitignore` for Go projects
- Sets up Go module (`go mod init`)
- Configures build, test, and lint settings

## Environment Detection

The command detects:

- Go version and installation
- Installed Go tools and versions
- GOPATH and GOROOT settings
- Go module support and configuration
- Go workspace availability
- Platform-specific tool availability

## Installation Guides

Provides platform-specific installation guides for:

- **macOS**: Homebrew installation commands
- **Linux**: apt-get/yum/dnf installation
- **Windows**: Download links and installation steps
- **Docker**: Container-based installation

## Configuration File

Creates `.opencode/go-config.json` with:

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

## Generated Files

1. **`.opencode/go-config.json`** - Go project configuration
2. **`.golangci.yml`** - golangci-lint configuration (if using)
3. **`.gitignore`** - Go-specific gitignore rules
4. **`go.mod`** - Go module definition (if new project)
5. **`go.work`** - Go workspace file (if workspace project)

## Project Structures

### CLI Application

```
project/
├── cmd/
│   └── app-name/
│       └── main.go
├── internal/
│   └── ...
├── pkg/
│   └── ...
├── go.mod
└── .opencode/
    └── go-config.json
```

### Web Service

```
project/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── handler/
│   ├── middleware/
│   └── service/
├── go.mod
└── .opencode/
    └── go-config.json
```

### Go Workspace

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

## Recommendations

Based on detection, provides recommendations for:

- Installing missing tools
- Upgrading outdated Go versions
- Enabling Go modules (if using GOPATH)
- Setting up Go workspace (for multi-module projects)
- Configuring linters and formatters

## Next Steps

After setup, you can use:

- `/go-build` - Build Go project
- `/go-test` - Run tests
- `/go-lint` - Lint code
- `/go-fmt` - Format code
- `/go-deps` - Manage dependencies

## Exit Codes

| Code | Description          |
| ---- | -------------------- |
| 0    | Success              |
| 1    | Configuration failed |
| 2    | Go not installed     |
| 3    | Invalid arguments    |

## See Also

- `/go-build` - Build Go projects
- `/go-test` - Run Go tests
- `/go-lint` - Lint Go code
- `/go-fmt` - Format Go code
- `/go-deps` - Manage Go dependencies
- [Go Documentation](https://golang.org/doc/)
- [Go Modules Reference](https://go.dev/ref/mod)
- [golangci-lint Documentation](https://golangci-lint.run/)
