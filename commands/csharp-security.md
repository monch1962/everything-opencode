# C# Security Command (`/csharp-security`)

## Overview

The `/csharp-security` command runs C#/.NET security scanning tools to identify vulnerabilities in your code and dependencies. It integrates multiple security tools into a single command with consistent output and reporting for .NET projects.

## Features

- **Multiple Security Tools**: Integrates built-in .NET tools and third-party security scanners
- **Built-in Vulnerability Checking**: Uses `dotnet list package --vulnerable` for dependency scanning
- **Static Code Analysis**: Integrates with SecurityCodeScan and other Roslyn analyzers
- **CI/CD Integration**: Supports SonarQube and OWASP Dependency Check
- **Framework Awareness**: Works with .NET Framework, .NET Core, and .NET 5+
- **Comprehensive Reporting**: Detailed reports with actionable recommendations

## Installation

Security tools are automatically detected. If missing, install them with:

```bash
# Install dotnet format for security analyzers
dotnet tool install --global dotnet-format

# Install SecurityCodeScan analyzer
dotnet add package SecurityCodeScan

# Install SonarScanner (optional)
dotnet tool install --global dotnet-sonarscanner

# Install dotnet-outdated for checking outdated packages
dotnet tool install --global dotnet-outdated
```

## Usage

### Basic Usage

```bash
# Run default security tools (dotnet list package + security code scan)
/csharp-security

# Run all security tools
/csharp-security --all

# Run specific tool
/csharp-security --tool dotnet-list-package
/csharp-security --tool security-code-scan
/csharp-security --tool sonar-scanner
```

### Command Options

| Option                      | Description                                 | Example                         |
| --------------------------- | ------------------------------------------- | ------------------------------- |
| `--tool`, `-t`              | Run specific security tool                  | `--tool dotnet-list-package`    |
| `--format`, `-f`            | Output format                               | `--format json`                 |
| `--output`, `-o`            | Output file                                 | `--output security-report.json` |
| `--diagnostics`, `-d`       | Diagnostic IDs to check                     | `--diagnostics SEC001,SEC002`   |
| `--severity`, `-s`          | Severity level                              | `--severity error`              |
| `--key`, `-k`               | SonarQube project key                       | `--key myproject`               |
| `--name`, `-n`              | SonarQube project name                      | `--name "My Project"`           |
| `--version`, `-v`           | SonarQube project version                   | `--version 1.0.0`               |
| `--all`                     | Run all security tools                      | `--all`                         |
| `--dotnet-list-only`        | Run only `dotnet list package --vulnerable` | `--dotnet-list-only`            |
| `--security-code-scan-only` | Run only security code scan                 | `--security-code-scan-only`     |
| `--sonar-scanner-only`      | Run only SonarScanner                       | `--sonar-scanner-only`          |
| `--owasp-only`              | Run only OWASP Dependency Check             | `--owasp-only`                  |
| `--verbose`                 | Verbose output                              | `--verbose`                     |
| `--quiet`, `-q`             | Minimal output                              | `--quiet`                       |
| `--setup`                   | Show setup instructions                     | `--setup`                       |
| `--help`, `-h`              | Show help                                   | `--help`                        |

### Examples

```bash
# Comprehensive security scan with verbose output
/csharp-security --all --verbose

# Check dependencies against known vulnerabilities
/csharp-security --dotnet-list-only

# Generate JSON report for CI/CD integration
/csharp-security --all --format json --output security-report.json

# Run security code scan with specific diagnostics
/csharp-security --security-code-scan-only --diagnostics SEC001,SEC002 --severity error

# SonarQube analysis
/csharp-security --sonar-scanner-only --key myproject --name "My Project" --version 1.0.0

# OWASP dependency check with HTML report
/csharp-security --owasp-only --format html --output dependency-report.html
```

## Security Tools

### 1. dotnet list package --vulnerable

**Purpose**: Built-in .NET CLI command to check NuGet packages for known vulnerabilities.

**What it checks**:

- Known CVEs in installed NuGet packages
- Packages with security advisories
- Outdated packages with security fixes

**Database**: Uses Microsoft's vulnerability database

**Usage**:

```bash
/csharp-security --dotnet-list-only
```

### 2. Security Code Scan

**Purpose**: Roslyn-based static code analyzer for finding security issues in C# code.

**What it checks**:

- SQL injection vulnerabilities
- Cross-site scripting (XSS) risks
- Command injection vulnerabilities
- Path traversal vulnerabilities
- Insecure deserialization
- Weak cryptography usage

**Installation**:

```bash
dotnet add package SecurityCodeScan
```

**Configuration**: Add to `.csproj`:

```xml
<PropertyGroup>
  <EnableNETAnalyzers>true</EnableNETAnalyzers>
  <AnalysisMode>Security</AnalysisMode>
</PropertyGroup>
```

### 3. SonarScanner for .NET

**Purpose**: Integrates with SonarQube for continuous code quality and security inspection.

**What it provides**:

- Comprehensive security rule sets
- Quality gate enforcement
- Historical tracking of security issues
- Integration with pull requests

**Setup**:

```bash
dotnet tool install --global dotnet-sonarscanner
```

**Usage**:

```bash
/csharp-security --sonar-scanner-only --key myproject --name "My Project"
```

### 4. OWASP Dependency Check

**Purpose**: Scans project dependencies for known vulnerabilities.

**What it checks**:

- Common Vulnerabilities and Exposures (CVEs)
- National Vulnerability Database (NVD)
- Other vulnerability databases

**Features**:

- Supports multiple output formats (HTML, JSON, XML, etc.)
- Can be integrated into CI/CD pipelines
- Provides evidence and references for vulnerabilities

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "csharp": {
    "securityTools": ["dotnet-list-package", "security-code-scan"],
    "sonarQube": {
      "url": "https://sonarqube.example.com",
      "token": "your-token"
    },
    "owasp": {
      "dataDirectory": "./.owasp-data"
    }
  }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: C# Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '7.0.x'

      - name: Install dependencies
        run: dotnet restore

      - name: Run security scan
        run: /csharp-security --all --format json --output security-report.json

      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json

      - name: Check for critical vulnerabilities
        run: |
          if grep -q '"severity": "critical"' security-report.json; then
            echo "❌ Critical vulnerabilities found"
            exit 1
          fi
```

### Azure DevOps Pipeline Example

```yaml
trigger:
  branches:
    include: ['main', 'develop']

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: UseDotNet@2
    inputs:
      packageType: 'sdk'
      version: '7.x'

  - script: dotnet restore
    displayName: 'Restore packages'

  - script: /csharp-security --all --format sarif --output security.sarif
    displayName: 'Run security scan'

  - task: PublishSecurityAnalysisLogs@2
    inputs:
      ArtifactName: 'CodeAnalysisLogs'
      ToolName: 'CSharpSecurity'
```

## Exit Codes

| Code | Meaning                  | Description                            |
| ---- | ------------------------ | -------------------------------------- |
| 0    | Success                  | All security scans passed              |
| 1    | Failure                  | One or more security scans failed      |
| 2    | Configuration Error      | Invalid configuration or missing tools |
| 3    | Critical Vulnerabilities | Critical security issues found         |
| 4    | Runtime Error            | Unexpected error during execution      |

## Best Practices

### 1. Regular Scanning

```bash
# Add to pre-commit hook or CI/CD pipeline
/csharp-security --all

# Check for critical issues in CI
/csharp-security --dotnet-list-only --severity critical
```

### 2. Focused Scans

```bash
# Before releases
/csharp-security --all --verbose

# Quick checks during development
/csharp-security --security-code-scan-only --severity error
```

### 3. Automated Remediation

```bash
# Update vulnerable packages
dotnet list package --vulnerable --format json | jq -r '.vulnerablePackages[].name' | xargs -I {} dotnet add package {} --version latest

# Fix security code issues
dotnet format analyzers --diagnostics SEC001,SEC002 --fix
```

### 4. Reporting and Compliance

```bash
# Generate reports for compliance
/csharp-security --all --format html --output security-report-$(date +%Y%m%d).html

# Track security metrics over time
/csharp-security --all --format json | jq '.summary'
```

## Troubleshooting

### Common Issues

1. **Tools not installed**

   ```
   ❌ dotnet-list-package: Failed - Command failed
   ```

   **Solution**: Ensure .NET SDK is installed: `dotnet --version`

2. **SecurityCodeScan not found**

   ```
   ❌ security-code-scan: Failed - No security analyzers found
   ```

   **Solution**: Install package: `dotnet add package SecurityCodeScan`

3. **SonarQube connection issues**

   ```
   ❌ sonar-scanner: Failed - Unable to connect to SonarQube
   ```

   **Solution**: Check SonarQube URL and token configuration

4. **OWASP data directory issues**
   ```
   ❌ owasp-dependency-check: Failed - Data directory not found
   ```
   **Solution**: Create directory: `mkdir -p .owasp-data`

### Debug Mode

```bash
# Run with verbose output for debugging
/csharp-security --all --verbose

# Check tool versions
dotnet --version
dotnet format --version
dotnet-sonarscanner --version
```

## Related Commands

- `/csharp-setup` - Configure C#/.NET project with security tools
- `/csharp-deps` - Manage dependencies with security scanning
- `/csharp-test` - Run tests (security tests can be included)
- `/csharp-lint` - Code quality checks (includes security diagnostics)
- `/csharp-format` - Code formatting (can fix security code style issues)

## References

- [.NET Security Documentation](https://docs.microsoft.com/en-us/dotnet/standard/security/)
- [SecurityCodeScan GitHub](https://github.com/security-code-scan/security-code-scan)
- [SonarScanner for .NET](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner-for-dotnet/)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [NuGet Security Alerts](https://docs.microsoft.com/en-us/nuget/consume-packages/managing-vulnerabilities)
- [.NET Vulnerability Scanning](https://devblogs.microsoft.com/nuget/how-to-scan-nuget-packages-for-security-vulnerabilities/)
