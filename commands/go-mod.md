# /go-mod

Manage Go modules with Go-specific improvements.

## Description

The `/go-mod` command manages Go modules including downloading, updating, tidying, and auditing. It provides intelligent module management with security scanning, dependency graph visualization, and Go module support.

## Usage

```bash
/go-mod [action] [options]
```

## Examples

```bash
# Run go mod tidy (default action)
/go-mod

# Download dependencies to local cache
/go-mod download

# Vendor dependencies
/go-mod vendor

# Show dependency graph
/go-mod --graph

# Explain why a package is needed
/go-mod why --package github.com/gorilla/mux

# Update specific package
/go-mod --update

# Run security audit
/go-mod --security

# Verbose tidy operation
/go-mod tidy --verbose

# Dry run update
/go-mod --update --dry-run
```

## Actions

| Action     | Description                                   |
| ---------- | --------------------------------------------- |
| `tidy`     | Tidy go.mod file (add missing, remove unused) |
| `download` | Download dependencies to module cache         |
| `vendor`   | Vendor dependencies to vendor/ directory      |
| `verify`   | Verify dependency integrity                   |
| `graph`    | Show dependency graph                         |
| `why`      | Explain why a package or module is needed     |
| `audit`    | Security audit of dependencies                |

## Options

| Option                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `--tidy`, `-t`            | Run go mod tidy (default action)               |
| `--download`, `-d`        | Download dependencies                          |
| `--vendor`, `-v`          | Vendor dependencies                            |
| `--verify`                | Verify dependencies                            |
| `--graph`                 | Show dependency graph                          |
| `--why`                   | Explain why package is needed                  |
| `--package`, `-p PACKAGE` | Package for why/graph actions                  |
| `--update`                | Update to latest minor/patch versions          |
| `--update-all`            | Update all dependencies                        |
| `--dry-run`               | Show what would be done without making changes |
| `--verbose`               | Verbose output                                 |
| `--security`              | Security audit of dependencies                 |
| `--audit`                 | Alias for --security                           |
| `--help`, `-h`            | Show help message                              |

## Examples

```bash
# Tidy dependencies (default)
/go-deps

# Download dependencies
/go-deps download

# Vendor dependencies
/go-deps vendor

# Show dependency graph
/go-deps --graph

# Explain why a package is needed
/go-deps why --package github.com/gorilla/mux

# Update dependencies
/go-deps --update

# Security audit
/go-deps --security

# Verbose tidy
/go-deps tidy --verbose

# Dry run update
/go-deps --update --dry-run
```

## Dependency Management

### Go Modules

The command uses Go modules (`go.mod`) for dependency management. Key features:

- **Automatic version selection**: Go selects appropriate versions
- **Minimal version selection**: Uses lowest compatible version
- **Semantic versioning**: Supports v0, v1, v2+ modules
- **Replace directives**: Local development overrides
- **Exclude directives**: Exclude specific versions

### Common Operations

#### Tidy Dependencies

```bash
/go-deps tidy
```

- Adds missing dependencies
- Removes unused dependencies
- Updates go.mod and go.sum
- Ensures consistent module state

#### Download Dependencies

```bash
/go-deps download
```

- Downloads to module cache
- Verifies checksums
- Caches for offline use
- Supports proxy servers

#### Vendor Dependencies

```bash
/go-deps vendor
```

- Copies to vendor/ directory
- Enables reproducible builds
- Useful for CI/CD pipelines
- Requires go mod vendor

#### Security Audit

```bash
/go-deps --security
```

- Checks for known vulnerabilities
- Uses Go vulnerability database
- Provides remediation advice
- Can be integrated with CI/CD

## Security Features

### Vulnerability Scanning

- Checks against Go vulnerability database
- Identifies affected versions
- Suggests fixed versions
- Provides CVE information

### Dependency Verification

- Verifies module checksums
- Checks for tampered modules
- Validates digital signatures
- Ensures reproducible builds

### Best Practices

- Regular security audits
- Keep dependencies updated
- Use trusted modules
- Review dependency changes

## Performance Tips

### Module Cache

- Dependencies cached in `$GOPATH/pkg/mod`
- Shared across projects
- Can be cleared with `go clean -modcache`
- Proxy servers can accelerate downloads

### Vendor Directory

- Use for reproducible builds
- Commit to version control for CI/CD
- Update regularly with `go mod vendor`
- Can be large for many dependencies

### Proxy Configuration

- Set `GOPROXY` environment variable
- Use multiple proxies for reliability
- Consider private proxies for internal modules
- Offline mode with `GOPROXY=direct`

## Common Issues

### Version Conflicts

```bash
# Check for conflicts
/go-deps graph

# Update conflicting dependencies
/go-deps --update

# Use replace directive in go.mod
replace old/module => new/module v1.2.3
```

### Missing Dependencies

```bash
# Add missing dependencies
/go-deps tidy

# Download specific version
go get module@version

# Check why module is needed
/go-deps why --package module
```

### Build Failures

```bash
# Verify dependencies
/go-deps verify

# Clean module cache
go clean -modcache

# Vendor dependencies
/go-deps vendor
```

## Integration

### CI/CD Pipelines

```yaml
# GitHub Actions example
- name: Manage Dependencies
  run: |
    /go-deps tidy
    /go-deps --security
    git diff --exit-code go.mod go.sum
```

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for uncommitted go.mod changes
if ! git diff --cached --name-only | grep -q 'go.mod\|go.sum'; then
  /go-deps tidy --dry-run
  if [ $? -ne 0 ]; then
    echo "go.mod needs tidying. Run: /go-deps tidy"
    exit 1
  fi
fi
```

### Development Workflow

1. Add import to Go file
2. Run `/go-deps tidy` to add dependency
3. Run `/go-deps --security` to check safety
4. Test with updated dependencies
5. Commit go.mod and go.sum

## Related Commands

- `/go-build` - Build with dependencies
- `/go-test` - Test with dependencies
- `/go-fmt` - Format code (includes dependency-aware formatting)
- `/go-lint` - Lint code (checks dependency usage)
- `/go-setup` - Configure dependency management

## Environment Variables

- `GOPROXY` - Go module proxy (default: `https://proxy.golang.org,direct`)
- `GONOPROXY` - Modules to not proxy
- `GOSUMDB` - Checksum database (default: `sum.golang.org`)
- `GONOSUMDB` - Modules to not checksum
- `GOPRIVATE` - Private modules
- `GOVCS` - Version control system settings

## Notes

- Requires Go 1.11+ for module support
- go.mod and go.sum should be committed to version control
- Security auditing requires network access
- Vendor directory is optional but recommended for CI/CD
- Regular dependency updates improve security
- Consider using dependabot or similar for automated updates
