# Python Security Command (`/python-security`)

## Overview

The `/python-security` command runs Python security scanning tools to identify vulnerabilities in your code and dependencies. It integrates multiple security tools into a single command with consistent output and reporting.

## Features

- **Multiple Security Tools**: Integrates bandit (code security), safety (dependency vulnerabilities), and pip-audit (dependency vulnerabilities)
- **Configurable**: Choose which tools to run or run all at once
- **Flexible Output**: Support for text, JSON, and other output formats
- **Framework Awareness**: Automatically detects project type (Django, Flask, FastAPI, etc.)
- **Comprehensive Reporting**: Detailed reports with actionable recommendations

## Installation

Security tools are automatically detected. If missing, install them with:

```bash
pip install bandit safety pip-audit
```

## Usage

### Basic Usage

```bash
# Run default security tools (bandit + safety)
/python-security

# Run all security tools
/python-security --all

# Run specific tool
/python-security --tool bandit
/python-security --tool safety
/python-security --tool pip-audit
```

### Command Options

| Option             | Description                | Example                         |
| ------------------ | -------------------------- | ------------------------------- |
| `--tool`, `-t`     | Run specific security tool | `--tool bandit`                 |
| `--config`, `-c`   | Configuration file         | `--config .bandit.yml`          |
| `--format`, `-f`   | Output format              | `--format json`                 |
| `--output`, `-o`   | Output file                | `--output security-report.json` |
| `--file`, `-r`     | Requirements file          | `--file requirements.txt`       |
| `--full-report`    | Show full report (safety)  | `--full-report`                 |
| `--json`           | Output in JSON format      | `--json`                        |
| `--all`            | Run all security tools     | `--all`                         |
| `--bandit-only`    | Run only bandit            | `--bandit-only`                 |
| `--safety-only`    | Run only safety            | `--safety-only`                 |
| `--pip-audit-only` | Run only pip-audit         | `--pip-audit-only`              |
| `--verbose`, `-v`  | Verbose output             | `--verbose`                     |
| `--quiet`, `-q`    | Minimal output             | `--quiet`                       |
| `--setup`          | Show setup instructions    | `--setup`                       |
| `--help`, `-h`     | Show help                  | `--help`                        |

### Examples

```bash
# Comprehensive security scan with verbose output
/python-security --all --verbose

# Check dependencies against known vulnerabilities
/python-security --safety-only --file requirements.txt

# Generate JSON report for CI/CD integration
/python-security --all --json --output security-report.json

# Run bandit with custom configuration
/python-security --tool bandit --config .bandit.yml

# Quick security check
/python-security --quiet
```

## Security Tools

### 1. Bandit - Code Security Scanner

**Purpose**: Static analysis tool for finding common security issues in Python code.

**What it checks**:

- SQL injection vulnerabilities
- Command injection risks
- Hardcoded passwords and secrets
- Insecure use of cryptographic functions
- File system access issues
- XML external entity (XXE) vulnerabilities

**Configuration**: Create `.bandit.yml` in project root:

```yaml
skips: ['B101'] # Skip assert statements check
tests: ['B301', 'B302', 'B303'] # Only check blacklist issues
```

### 2. Safety - Dependency Vulnerability Checker

**Purpose**: Checks Python dependencies against known security vulnerabilities.

**What it checks**:

- Known CVEs in installed packages
- Outdated packages with security fixes
- Packages with known vulnerabilities

**Database**: Uses the Safety DB (https://github.com/pyupio/safety-db)

**Usage with requirements files**:

```bash
/python-security --safety-only --file requirements.txt
```

### 3. pip-audit - Dependency Vulnerability Auditor

**Purpose**: Audits Python environments for packages with known vulnerabilities.

**What it checks**:

- Python Package Index (PyPI) packages
- Local packages and dependencies
- Comprehensive vulnerability database

**Features**:

- Supports multiple output formats (JSON, CSV, etc.)
- Can fix vulnerabilities by upgrading packages
- Integrates with CI/CD pipelines

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "python": {
    "securityTools": ["bandit", "safety", "pip-audit"],
    "banditConfig": ".bandit.yml",
    "safetyConfig": null,
    "pipAuditConfig": null
  }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install bandit safety pip-audit

      - name: Run security scan
        run: /python-security --all --json --output security-report.json

      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json
```

### GitLab CI Example

```yaml
security_scan:
  image: python:3.10
  script:
    - pip install bandit safety pip-audit
    - /python-security --all --json --output security-report.json
  artifacts:
    paths:
      - security-report.json
```

## Exit Codes

| Code | Meaning             | Description                            |
| ---- | ------------------- | -------------------------------------- |
| 0    | Success             | All security scans passed              |
| 1    | Failure             | One or more security scans failed      |
| 2    | Configuration Error | Invalid configuration or missing tools |
| 3    | Runtime Error       | Unexpected error during execution      |

## Best Practices

### 1. Regular Scanning

```bash
# Add to pre-commit hook or CI/CD pipeline
/python-security --all
```

### 2. Focused Scans

```bash
# Before releases
/python-security --all --verbose

# Quick checks during development
/python-security --bandit-only
```

### 3. Automated Remediation

```bash
# Check for fixable vulnerabilities
/pip-audit --fix

# Update vulnerable dependencies
pip install --upgrade $(/python-security --safety-only --json | jq -r '.vulnerable_packages[]')
```

### 4. Reporting

```bash
# Generate reports for compliance
/python-security --all --json --output security-report-$(date +%Y%m%d).json

# Track security metrics over time
```

## Troubleshooting

### Common Issues

1. **Tools not installed**

   ```
   ❌ bandit: Failed - Command 'bandit' not found
   ```

   **Solution**: `pip install bandit safety pip-audit`

2. **False positives**

   ```
   Bandit reports issues in test files or generated code
   ```

   **Solution**: Configure `.bandit.yml` to skip specific files or tests

3. **Network issues with safety DB**

   ```
   ❌ safety: Failed - Unable to fetch vulnerability database
   ```

   **Solution**: Check network connectivity or use offline mode

4. **Permission issues**
   ```
   ❌ Permission denied when writing reports
   ```
   **Solution**: Check file permissions or use `--output` with writable path

### Debug Mode

```bash
# Run with verbose output for debugging
/python-security --all --verbose

# Check tool versions
bandit --version
safety --version
pip-audit --version
```

## Related Commands

- `/python-setup` - Configure Python project with security tools
- `/python-deps` - Manage dependencies with security scanning
- `/python-test` - Run tests (security tests can be included)
- `/python-lint` - Code quality checks (complements security scanning)

## References

- [Bandit Documentation](https://bandit.readthedocs.io/)
- [Safety Documentation](https://github.com/pyupio/safety)
- [pip-audit Documentation](https://github.com/trailofbits/pip-audit)
- [Python Security Best Practices](https://docs.python.org/3/library/security.html)
- [OWASP Python Security](https://owasp.org/www-project-python-security/)
