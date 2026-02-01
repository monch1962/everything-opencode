# /go-security

Security scanning for Go code and dependencies.

## Description

The `/go-security` command performs security scanning on Go code and dependencies using multiple security scanners. It detects vulnerabilities, hardcoded secrets, security misconfigurations, and dependency vulnerabilities with comprehensive reporting and integration capabilities.

## Usage

```bash
/go-security [options] [paths...]
```

## Options

| Option               | Description                            |
| -------------------- | -------------------------------------- |
| `--scanner TOOL`     | Security scanner: gosec, govulncheck   |
| `--format FORMAT`    | Output format: text, json, html, sarif |
| `--output FILE`      | Output file for report                 |
| `--severity LEVEL`   | Minimum severity: low, medium, high    |
| `--confidence LEVEL` | Minimum confidence: low, medium, high  |
| `--exclude PATTERN`  | Exclude paths matching pattern         |
| `--include PATTERN`  | Include only paths matching pattern    |
| `--verbose`, `-v`    | Verbose output                         |
| `--quiet`, `-q`      | Quiet mode (minimal output)            |
| `--no-color`         | Disable colored output                 |
| `--json`             | Output in JSON format                  |
| `--html`             | Output in HTML format                  |
| `--sarif`            | Output in SARIF format                 |
| `--help`, `-h`       | Show help message                      |

## Examples

```bash
# Run security scan with default scanner
/go-security

# Use gosec scanner
/go-security --scanner gosec

# Use govulncheck scanner
/go-security --scanner govulncheck

# Output in JSON format
/go-security --format json

# Save report to HTML file
/go-security --output report.html

# Only show high severity issues
/go-security --severity high

# Exclude vendor directory
/go-security --exclude vendor

# Verbose output
/go-security --verbose

# Scan specific directories
/go-security ./cmd/ ./pkg/
```

## Security Scanners

### gosec (Go Security Checker)

Static analysis tool that finds security issues in Go code.

**Detects:**

- Hardcoded credentials (passwords, tokens, API keys)
- SQL injection vulnerabilities
- Command injection risks
- File inclusion issues
- Weak cryptographic algorithms
- Insecure random number generation

```bash
# Run gosec scanner
/go-security --scanner gosec

# Run with specific rules
/go-security --scanner gosec --include G101,G102
```

### govulncheck (Go Vulnerability Checker)

Checks for known vulnerabilities in dependencies.

**Features:**

- Uses Go vulnerability database
- Shows affected functions
- Provides remediation advice
- Checks for known CVEs
- Integration with go.mod

```bash
# Run govulncheck scanner
/go-security --scanner govulncheck

# Check specific package
/go-security --scanner govulncheck ./pkg/utils
```

## Secret Detection

The command includes comprehensive secret detection:

### Hardcoded Credentials

```bash
# Check for hardcoded secrets
/go-security --scanner gosec
```

**Detects:**

- `password`, `passwd`, `pwd`
- `secret`, `token`, `api_key`
- `private_key`, `jwt_secret`
- `oauth_token`, `oauth_secret`

### Entropy Analysis

Detects random-looking strings that might be secrets based on entropy thresholds.

## Severity Levels

| Level    | Description                            |
| -------- | -------------------------------------- |
| `LOW`    | Minor issues, best practices           |
| `MEDIUM` | Security concerns, should be addressed |
| `HIGH`   | Critical security vulnerabilities      |

## Confidence Levels

| Level    | Description                   |
| -------- | ----------------------------- |
| `LOW`    | Possible issue, needs review  |
| `MEDIUM` | Likely issue, should be fixed |
| `HIGH`   | Definite issue, must be fixed |

## Output Formats

### Text (Default)

Human-readable text output.

### JSON

Machine-readable JSON for automated processing.

### HTML

Interactive HTML report for browser viewing.

### SARIF

Static Analysis Results Interchange Format for CI/CD integration.

## Common Security Checks

### Code Security

- SQL injection vulnerabilities
- Command injection risks
- File inclusion issues
- Hardcoded credentials
- Weak cryptographic algorithms

### Dependency Security

- Known vulnerabilities in dependencies
- Outdated packages with security issues
- License compliance issues
- Supply chain attacks

### Configuration Security

- Insecure default configurations
- Missing security headers
- Excessive permissions
- Debug mode in production

## Integration

### CI/CD Pipelines

```yaml
# GitHub Actions example
- name: Security Scan
  run: /go-security --format json --output security-report.json
```

### Pre-commit Hooks

```bash
# .git/hooks/pre-commit
/go-security --severity high
```

### Code Review

```bash
# Check new changes
/go-security --include $(git diff --name-only HEAD)
```

## Exit Codes

| Code | Description                       |
| ---- | --------------------------------- |
| `0`  | Success, no security issues found |
| `1`  | Security issues found             |
| `2`  | Scanner execution failed          |
| `3`  | Configuration error               |

## Environment Variables

| Variable       | Description                |
| -------------- | -------------------------- |
| `GOSEC_CONFIG` | gosec configuration file   |
| `GOVULNDB`     | Vulnerability database URL |
| `GO111MODULE`  | Go modules mode            |

## Tips

### Regular Scanning

```bash
# Run security scans regularly
/go-security
```

### Critical Issues Only

```bash
# Only show critical issues
/go-security --severity high
```

### Automated Processing

```bash
# Output JSON for automated processing
/go-security --format json --output security-report.json
```

### Exclude Test Files

```bash
# Exclude test files from scanning
/go-security --exclude "*_test.go"
```

### Integration with CI/CD

```yaml
# Fail build on high severity issues
/go-security --severity high --format json
```

## Related Commands

- `/go-mod` - Manage dependencies (includes security audit)
- `/go-lint` - Code quality checking
- `/go-test` - Testing (can include security tests)
- `/go-build` - Building (security-hardened builds)

## Best Practices

1. **Scan before each commit**
2. **Scan dependencies regularly**
3. **Fix high severity issues immediately**
4. **Review medium severity issues**
5. **Document security decisions**
6. **Keep security tools updated**
7. **Integrate with CI/CD pipelines**

## Notes

- gosec is best for in-code security issues
- govulncheck is best for dependency vulnerabilities
- Consider using multiple scanners for comprehensive coverage
- Regular updates ensure detection of new vulnerabilities
- Custom configurations can reduce false positives
