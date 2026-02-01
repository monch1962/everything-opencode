#!/usr/bin/env node
/**
 * /go-security command wrapper
 *
 * Security scanning for Go code and dependencies
 */

const GoCommandRunner = require('../golang/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  const securityArgs = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--scanner') {
      options.scanner = args[++i];
    } else if (arg === '--format') {
      options.format = args[++i];
    } else if (arg === '--output') {
      options.output = args[++i];
    } else if (arg === '--severity') {
      options.severity = args[++i];
    } else if (arg === '--confidence') {
      options.confidence = args[++i];
    } else if (arg === '--exclude') {
      securityArgs.push('--exclude', args[++i]);
    } else if (arg === '--include') {
      securityArgs.push('--include', args[++i]);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--no-color') {
      options.noColor = true;
    } else if (arg === '--json') {
      options.format = 'json';
    } else if (arg === '--html') {
      options.format = 'html';
    } else if (arg === '--sarif') {
      options.format = 'sarif';
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a file or directory path
      securityArgs.push(arg);
    }
  }

  try {
    const runner = new GoCommandRunner(process.cwd());
    await runner.initialize();

    console.log('🔒 Running Go security scan...');
    const result = await runner.security(securityArgs, options);

    if (result.success) {
      console.log('\n✅ Security scan completed successfully!');

      // Show summary if available
      if (result.stdout && result.stdout.includes('Issues:')) {
        const lines = result.stdout.split('\n');
        const issueLine = lines.find((line) => line.includes('Issues:'));
        if (issueLine) {
          console.log(`   ${issueLine.trim()}`);
        }
      }
    } else {
      console.error('\n❌ Security scan failed');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Security scan failed: ${error.message}`);

    // Provide helpful suggestions
    if (error.message.includes('gosec')) {
      console.log('\n💡 Try installing gosec:');
      console.log('   go install github.com/securego/gosec/v2/cmd/gosec@latest');
    } else if (error.message.includes('govulncheck')) {
      console.log('\n💡 Try installing govulncheck:');
      console.log('   go install golang.org/x/vuln/cmd/govulncheck@latest');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔒 Go Security Command

Usage: /go-security [options] [paths...]

Security scanning for Go code and dependencies with multiple scanner support.

Options:
  --scanner TOOL        Security scanner: gosec, govulncheck
  --format FORMAT       Output format: text, json, html, sarif
  --output FILE         Output file for report
  --severity LEVEL      Minimum severity: low, medium, high
  --confidence LEVEL    Minimum confidence: low, medium, high
  --exclude PATTERN     Exclude paths matching pattern
  --include PATTERN     Include only paths matching pattern
  --verbose, -v         Verbose output
  --quiet, -q           Quiet mode (minimal output)
  --no-color            Disable colored output
  --json                Output in JSON format
  --html                Output in HTML format
  --sarif               Output in SARIF format
  --help, -h            Show this help message

Security scanners:
  • gosec (default) - Go Security Checker
  • govulncheck - Go Vulnerability Checker

Go-specific features:
  • Multiple security scanner support
  • Vulnerability detection in code and dependencies
  • Custom severity and confidence thresholds
  • Multiple output formats
  • Path filtering and exclusion
  • Integration with CI/CD pipelines

Examples:
  /go-security                     # Run security scan with default scanner
  /go-security --scanner gosec    # Use gosec scanner
  /go-security --scanner govulncheck # Use govulncheck scanner
  /go-security --format json      # Output in JSON format
  /go-security --output report.html # Save report to HTML file
  /go-security --severity high    # Only show high severity issues
  /go-security --exclude vendor   # Exclude vendor directory
  /go-security --verbose          # Verbose output
  /go-security ./cmd/ ./pkg/      # Scan specific directories

gosec features:
  • Static analysis for security issues
  • Checks for: SQL injection, command injection, file inclusion, etc.
  • Custom rule configuration
  • Severity and confidence levels
  • Multiple output formats
  • Exclude patterns

govulncheck features:
  • Vulnerability detection in dependencies
  • Uses Go vulnerability database
  • Shows affected functions
  • Provides remediation advice
  • Checks for known CVEs
  • Integration with go.mod

Common security checks:
  • SQL injection vulnerabilities
  • Command injection risks
  • File inclusion issues
  • Hardcoded credentials
  • Weak cryptographic algorithms
  • Insecure random number generation
  • Missing error handling
  • Race conditions

Severity levels:
  • LOW: Minor issues, best practices
  • MEDIUM: Security concerns, should be addressed
  • HIGH: Critical security vulnerabilities

Confidence levels:
  • LOW: Possible issue, needs review
  • MEDIUM: Likely issue, should be fixed
  • HIGH: Definite issue, must be fixed

Output formats:
  • text: Human-readable text (default)
  • json: Machine-readable JSON
  • html: Interactive HTML report
  • sarif: Static Analysis Results Interchange Format

Exit codes:
  0 - Success, no security issues found
  1 - Security issues found
  2 - Scanner execution failed
  3 - Configuration error

Environment variables:
  GOSEC_CONFIG         - gosec configuration file
  GOVULNDB             - Vulnerability database URL
  GO111MODULE          - Go modules mode

Tips:
  • Run security scans in CI/CD pipelines
  • Use --severity high for critical issues only
  • Export reports in JSON for automated processing
  • Exclude test files if needed
  • Update scanners regularly for new checks
  • Review and fix high severity issues immediately
  • Consider security scanning as part of code review

Integration:
  • Pre-commit hooks
  • CI/CD pipeline gates
  • Code review automation
  • Security dashboards
  • Alerting systems

Best practices:
  • Scan code before each commit
  • Scan dependencies regularly
  • Fix high severity issues immediately
  • Review medium severity issues
  • Document security decisions
  • Keep security tools updated
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
