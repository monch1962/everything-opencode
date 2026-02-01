# Rust Security Command (`/rust-security`)

## Overview

The `/rust-security` command runs Rust security scanning tools to identify vulnerabilities in your code and dependencies. It integrates multiple security tools into a single command with consistent output and reporting for Rust projects.

## Features

- **Multiple Security Tools**: Integrates cargo-audit, cargo-deny, cargo-geiger, and cargo-crev
- **Dependency Vulnerability Scanning**: Checks Cargo.lock for crates with security vulnerabilities
- **License Compliance**: Verifies dependency licenses with cargo-deny
- **Unsafe Code Detection**: Finds usage of unsafe Rust in your codebase
- **Cryptographic Verification**: Uses cargo-crev for cryptographic code review
- **Comprehensive Reporting**: Detailed reports with actionable recommendations

## Installation

Security tools are automatically detected. If missing, install them with:

```bash
# Install cargo-audit for vulnerability scanning
cargo install cargo-audit

# Install cargo-deny for license and vulnerability checking
cargo install cargo-deny

# Install cargo-geiger for unsafe code detection
cargo install cargo-geiger

# Install cargo-crev for cryptographic verification
cargo install cargo-crev
```

## Usage

### Basic Usage

```bash
# Run default security tools (cargo-audit + cargo-deny)
/rust-security

# Run all security tools
/rust-security --all

# Run specific tool
/rust-security --tool cargo-audit
/rust-security --tool cargo-deny
/rust-security --tool cargo-geiger
```

### Command Options

| Option                | Description                      | Example                             |
| --------------------- | -------------------------------- | ----------------------------------- |
| `--tool`, `-t`        | Run specific security tool       | `--tool cargo-audit`                |
| `--database`, `-d`    | Audit database path              | `--database ./audit-db`             |
| `--config`, `-c`      | Configuration file               | `--config deny.toml`                |
| `--output`, `-o`      | Output file                      | `--output security-report.json`     |
| `--format`, `-f`      | Output format                    | `--format json`                     |
| `--target`            | Target triple                    | `--target x86_64-unknown-linux-gnu` |
| `--ignore`            | Ignore specific advisory         | `--ignore RUSTSEC-2021-0001`        |
| `--deny-warnings`     | Deny warnings (fail on warnings) | `--deny-warnings`                   |
| `--all-targets`       | Check all targets                | `--all-targets`                     |
| `--unsafe-only`       | Check only unsafe code           | `--unsafe-only`                     |
| `--recursive`         | Recursive verification           | `--recursive`                       |
| `--all`               | Run all security tools           | `--all`                             |
| `--cargo-audit-only`  | Run only cargo-audit             | `--cargo-audit-only`                |
| `--cargo-deny-only`   | Run only cargo-deny              | `--cargo-deny-only`                 |
| `--cargo-geiger-only` | Run only cargo-geiger            | `--cargo-geiger-only`               |
| `--cargo-crev-only`   | Run only cargo-crev              | `--cargo-crev-only`                 |
| `--verbose`, `-v`     | Verbose output                   | `--verbose`                         |
| `--quiet`, `-q`       | Minimal output                   | `--quiet`                           |
| `--setup`             | Show setup instructions          | `--setup`                           |
| `--help`, `-h`        | Show help                        | `--help`                            |

### Examples

```bash
# Comprehensive security scan with verbose output
/rust-security --all --verbose

# Check dependencies against known vulnerabilities
/rust-security --cargo-audit-only --deny-warnings

# Generate JSON report for CI/CD integration
/rust-security --all --format json --output security-report.json

# Run cargo-deny with custom configuration
/rust-security --cargo-deny-only --config deny.toml --all-targets

# Check unsafe code usage
/rust-security --cargo-geiger-only --unsafe-only

# Cryptographic verification
/rust-security --cargo-crev-only --recursive --verbose
```

## Security Tools

### 1. cargo-audit

**Purpose**: Audit Cargo.lock for crates with security vulnerabilities.

**What it checks**:

- Known CVEs in Rust crates
- Security advisories from RustSec database
- Outdated crates with security fixes

**Database**: Uses RustSec Advisory Database (https://rustsec.org)

**Usage**:

```bash
/rust-security --cargo-audit-only
```

**Configuration**: Create `audit.toml`:

```toml
[advisories]
ignore = ["RUSTSEC-2021-0001", "RUSTSEC-2020-0002"]
```

### 2. cargo-deny

**Purpose**: Check dependencies for licenses, vulnerabilities, and sources.

**What it checks**:

- License compliance (allow/deny lists)
- Vulnerability scanning
- Banned crates
- Multiple source registries

**Installation**:

```bash
cargo install cargo-deny
```

**Configuration**: Create `deny.toml`:

```toml
[licenses]
allow = ["MIT", "Apache-2.0"]
deny = ["GPL-3.0"]

[bans]
multiple-versions = "deny"

[vulnerabilities]
severity = "high"
```

### 3. cargo-geiger

**Purpose**: Find usage of unsafe Rust in your codebase.

**What it checks**:

- Unsafe function usage
- Unsafe trait implementations
- Unsafe block usage
- Unsafe dependency usage

**Features**:

- Visual output showing unsafe code density
- Can check dependencies for unsafe code
- Multiple output formats

**Usage**:

```bash
/rust-security --cargo-geiger-only --unsafe-only
```

### 4. cargo-crev

**Purpose**: Cryptographic code review and verification system.

**What it provides**:

- Cryptographic verification of code reviews
- Trust network for dependency verification
- Proof of review for security-critical code

**Setup**:

```bash
cargo install cargo-crev
cargo crev id new  # Create your identity
```

**Usage**:

```bash
/rust-security --cargo-crev-only --recursive
```

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "rust": {
    "securityTools": ["cargo-audit", "cargo-deny"],
    "cargoAudit": {
      "database": "./audit-db",
      "denyWarnings": false
    },
    "cargoDeny": {
      "config": "deny.toml",
      "allTargets": true
    }
  }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Rust Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install security tools
        run: |
          cargo install cargo-audit
          cargo install cargo-deny

      - name: Run security scan
        run: /rust-security --all --deny-warnings

      - name: Check for critical vulnerabilities
        run: |
          if /rust-security --cargo-audit-only --quiet; then
            echo "✅ No critical vulnerabilities found"
          else
            echo "❌ Critical vulnerabilities found"
            exit 1
          fi
```

### GitLab CI Example

```yaml
security_scan:
  image: rust:latest
  script:
    - cargo install cargo-audit cargo-deny
    - /rust-security --all --format json --output security-report.json
  artifacts:
    paths:
      - security-report.json
```

## Exit Codes

| Code | Meaning                  | Description                            |
| ---- | ------------------------ | -------------------------------------- |
| 0    | Success                  | All security scans passed              |
| 1    | Failure                  | One or more security scans failed      |
| 2    | Configuration Error      | Invalid configuration or missing tools |
| 3    | Critical Vulnerabilities | Critical security issues found         |
| 4    | License Violation        | License compliance issues found        |
| 5    | Runtime Error            | Unexpected error during execution      |

## Best Practices

### 1. Regular Scanning

```bash
# Add to pre-commit hook or CI/CD pipeline
/rust-security --all

# Check for critical issues in CI
/rust-security --cargo-audit-only --deny-warnings
```

### 2. Focused Scans

```bash
# Before releases
/rust-security --all --verbose

# Quick checks during development
/rust-security --cargo-audit-only
```

### 3. Automated Remediation

```bash
# Update vulnerable dependencies
cargo update

# Fix license issues
# Update deny.toml to allow appropriate licenses

# Reduce unsafe code usage
# Refactor unsafe code to safe alternatives
```

### 4. Reporting and Compliance

```bash
# Generate reports for compliance
/rust-security --all --format json --output security-report-$(date +%Y%m%d).json

# Track security metrics over time
/rust-security --all --format json | jq '.summary'
```

## Troubleshooting

### Common Issues

1. **Tools not installed**

   ```
   ❌ cargo-audit: Failed - Command 'cargo-audit' not found
   ```

   **Solution**: Install tools: `cargo install cargo-audit cargo-deny`

2. **Audit database outdated**

   ```
   ❌ cargo-audit: Failed - Database is outdated
   ```

   **Solution**: Update database: `cargo audit fetch`

3. **License compliance issues**

   ```
   ❌ cargo-deny: Failed - License violations found
   ```

   **Solution**: Update `deny.toml` to allow appropriate licenses

4. **Unsafe code warnings**
   ```
   ⚠️ cargo-geiger: Found unsafe code usage
   ```
   **Solution**: Review unsafe code and consider safer alternatives

### Debug Mode

```bash
# Run with verbose output for debugging
/rust-security --all --verbose

# Check tool versions
cargo audit --version
cargo deny --version
cargo geiger --version
cargo crev --version
```

## Related Commands

- `/rust-setup` - Configure Rust project with security tools
- `/rust-update` - Update dependencies (security updates)
- `/rust-test` - Run tests (security tests can be included)
- `/rust-clippy` - Code quality checks (includes security lints)
- `/rust-fmt` - Code formatting

## References

- [RustSec Advisory Database](https://rustsec.org)
- [cargo-audit Documentation](https://github.com/RustSec/cargo-audit)
- [cargo-deny Documentation](https://github.com/EmbarkStudios/cargo-deny)
- [cargo-geiger Documentation](https://github.com/rust-secure-code/cargo-geiger)
- [cargo-crev Documentation](https://github.com/crev-dev/cargo-crev)
- [Rust Security Working Group](https://www.rust-lang.org/governance/wgs/wg-security)
- [Unsafe Rust Guidelines](https://doc.rust-lang.org/nomicon/)
