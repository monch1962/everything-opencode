# /elixir-security

Security scanning for Elixir projects with Elixir-specific improvements.

## Description

The `/elixir-security` command performs comprehensive security scanning on Elixir projects using multiple security tools. It includes Phoenix-specific security analysis, dependency vulnerability checking, and general security best practices enforcement.

## Usage

```bash
/elixir-security [options]
```

## Options

| Option              | Description                                     |
| ------------------- | ----------------------------------------------- |
| `--format FORMAT`   | Output format: `compact`, `detailed`, or `json` |
| `--verbose`, `-v`   | Verbose output                                  |
| `--quiet`, `-q`     | Quiet mode (minimal output)                     |
| `--exit`            | Exit with non-zero code on any finding          |
| `--exit-on-vuln`    | Exit with non-zero code only on vulnerabilities |
| `--env ENVIRONMENT` | Set Mix environment: `dev`, `test`, or `prod`   |
| `--help`, `-h`      | Show help message                               |

## Security Tools

### Sobelow (Phoenix Security)

Security-focused static analysis for Phoenix applications.

**Checks performed:**

- Configuration security
- SQL injection vulnerabilities
- XSS (Cross-site scripting)
- CSRF protection
- Clickjacking protection
- Secure headers
- Content security policy

**Example:**

```bash
/elixir-security  # Includes Sobelow for Phoenix projects
```

### mix_audit (Dependency Security)

Security audit for Mix dependencies.

**Checks performed:**

- Known vulnerabilities in Hex packages
- Outdated dependencies with security issues
- CVEs in dependencies
- Severity assessment

**Example:**

```bash
/elixir-security --verbose  # Shows detailed vulnerability information
```

### General Security Checks

Additional security analysis beyond specific tools.

**Checks performed:**

- Hardcoded secrets and credentials
- Insecure random number generation
- File inclusion vulnerabilities
- Command injection risks
- Configuration security
- Authentication and authorization issues

## Examples

```bash
# Run all security scans
/elixir-security

# Verbose security scan
/elixir-security --verbose

# Output results as JSON
/elixir-security --format json

# Exit on any security finding
/elixir-security --exit

# Exit only on vulnerabilities
/elixir-security --exit-on-vuln

# Run in production environment
/elixir-security --env prod
```

## Integration

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Security Scan
  run: /elixir-security --exit-on-vuln
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run security scan on Elixir files
if git diff --cached --name-only | grep -q '\.ex$'; then
  /elixir-security --quiet
  if [ $? -ne 0 ]; then
    echo "Security issues found. Fix before committing."
    exit 1
  fi
fi
```

### Scheduled Scanning

```bash
# Daily security scan (add to cron)
0 2 * * * cd /path/to/project && /elixir-security --quiet --exit-on-vuln
```

## Configuration

### Security Tool Configuration

Configure security tools via `/elixir-setup`:

```bash
/elixir-setup --configure-security
```

**Configuration options:**

- Enable/disable specific security checks
- Set severity thresholds
- Configure ignore patterns
- Set custom rules
- Configure output formats
- Set exit code behavior

### Ignoring False Positives

Create `.sobelow-ignore` for Sobelow:

```yaml
# .sobelow-ignore
- rule: Config.Secrets
  file: config/prod.exs
  line: 15
  reason: 'This is a test secret for CI'
```

### Custom Security Rules

Add custom security rules in project configuration:

```json
{
  "elixir": {
    "security": {
      "customRules": [
        {
          "id": "CUSTOM_001",
          "pattern": "System.get_env\\(\"SECRET_.*\"\\)",
          "message": "Avoid direct secret access",
          "severity": "medium"
        }
      ]
    }
  }
}
```

## Common Security Issues

### Hardcoded Secrets

**Issue:**

```elixir
# Bad
config :my_app, api_key: "hardcoded-secret-123"

# Good
config :my_app, api_key: System.get_env("API_KEY")
```

**Fix:** Use environment variables or secret management systems.

### SQL Injection

**Issue:**

```elixir
# Bad
query = "SELECT * FROM users WHERE name = '#{user_input}'"

# Good
query = from u in User, where: u.name == ^user_input
```

**Fix:** Use Ecto query syntax with parameter binding.

### XSS Vulnerabilities

**Issue:**

```elixir
# Bad
<%= raw(user_content) %>

# Good
<%= Phoenix.HTML.html_escape(user_content) %>
```

**Fix:** Always escape user content in templates.

### Insecure Dependencies

**Issue:**

```elixir
# mix.exs
{:vulnerable_package, "~> 1.0"}  # Has known CVEs
```

**Fix:**

```bash
# Check for vulnerabilities
/elixir-security

# Update vulnerable dependencies
/elixir-deps update vulnerable_package
```

## Best Practices

### 1. Regular Scanning

```bash
# Scan daily in development
/elixir-security

# Scan before releases
/elixir-security --env prod --exit
```

### 2. Fix Critical Issues First

```bash
# Show only critical issues
/elixir-security --format detailed | grep -i "critical"
```

### 3. Integrate with CI/CD

- Run security scans on every pull request
- Block deployment on critical vulnerabilities
- Generate security reports

### 4. Keep Dependencies Updated

```bash
# Regular dependency updates
/elixir-deps update --all
/elixir-security  # Verify no new vulnerabilities
```

### 5. Security Training

- Review security scan results with team
- Document security practices
- Regular security awareness training

## Exit Codes

| Code | Description                        |
| ---- | ---------------------------------- |
| 0    | Success - No security issues found |
| 1    | Failure - Security issues found    |
| 2    | Configuration error                |
| 3    | Tool execution error               |

## Related Commands

- `/elixir-setup` - Configure security tools
- `/elixir-deps` - Update vulnerable dependencies
- `/elixir-lint` - Code quality (includes some security checks)
- `/elixir-test` - Security testing integration

## Environment Variables

- `MIX_ENV` - Mix environment (affects configuration loading)
- `ELIXIR_SECURITY_FORMAT` - Default output format
- `ELIXIR_SECURITY_EXIT_ON` - Default exit behavior
- `SOBELOW_CONFIG` - Sobelow configuration file
- `MIX_AUDIT_CONFIG` - mix_audit configuration

## Notes

- Security scanning is environment-aware
- Phoenix projects get additional security checks
- False positives can be configured to ignore
- Critical findings are highlighted in output
- Recommendations are provided for fixes
- Regular updates improve detection accuracy
- Custom rules can be added for project-specific needs

## Resources

- [Sobelow Documentation](https://hexdocs.pm/sobelow)
- [mix_audit Documentation](https://hexdocs.pm/mix_audit)
- [Elixir Security Guide](https://hexdocs.pm/phoenix/security.html)
- [OWASP Top 10 for Elixir](https://owasp.org/www-project-top-ten/)
