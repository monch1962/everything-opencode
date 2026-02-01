#!/usr/bin/env node
/**
 * Elixir Security Command
 *
 * Security scanning for Elixir projects
 */

const ElixirCommandRunner = require('../elixir/command-runner');

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--format') {
        options.format = args[++i];
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--quiet' || arg === '-q') {
        options.quiet = true;
      } else if (arg === '--exit') {
        options.exit = true;
      } else if (arg === '--exit-on-vuln') {
        options.exitOnVuln = true;
      } else if (arg === '--env') {
        options.env = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        process.exit(0);
      } else if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
      }
    }

    const runner = new ElixirCommandRunner(process.cwd());

    console.log('🛡️  Running Elixir security scan...\n');

    const result = await runner.security(options);

    if (result.success) {
      console.log('\n✅ Security scan passed!');

      // Show tool results
      console.log('\n📊 Security Tools Summary:');
      result.results.forEach((toolResult) => {
        if (toolResult.success) {
          console.log(`  ✅ ${toolResult.tool}: No issues found`);
        } else {
          console.log(`  ⚠️  ${toolResult.tool}: ${toolResult.error || 'Issues found'}`);
        }
      });
    } else {
      console.log('\n❌ Security scan failed!');

      // Show detailed results
      console.log('\n📋 Security Issues Found:');
      result.results.forEach((toolResult) => {
        if (!toolResult.success) {
          console.log(`\n🔍 ${toolResult.tool}:`);
          if (toolResult.output) {
            console.log(toolResult.output);
          } else if (toolResult.error) {
            console.log(`  Error: ${toolResult.error}`);
          }
        }
      });

      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Security scan failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🛡️ Elixir Security Command

Usage: /elixir-security [options]

Security scanning for Elixir projects with multiple tools.

Options:
  --format FORMAT           Output format (compact, detailed, json)
  --verbose, -v             Verbose output
  --quiet, -q               Quiet mode (minimal output)
  --exit                    Exit with non-zero code on any finding
  --exit-on-vuln            Exit with non-zero code only on vulnerabilities
  --env ENVIRONMENT         Set Mix environment (dev, test, prod)
  --help, -h                Show this help message

Security Tools:
  • Sobelow                 - Security-focused static analysis for Phoenix
  • mix_audit               - Security audit for Mix dependencies
  • Credo (security checks) - Security-related code analysis

Features:
  • Multiple security tool integration
  • Phoenix-specific security scanning
  • Dependency vulnerability checking
  • Hardcoded secret detection
  • SQL injection detection
  • XSS (Cross-site scripting) detection
  • CSRF protection verification
  • Configuration security checks
  • Output formatting options

Scans Performed:
  1. Sobelow (Phoenix security):
     • Configuration security
     • SQL injection
     • XSS vulnerabilities
     • CSRF protection
     • Clickjacking protection
     • Secure headers
     • Content security policy

  2. mix_audit (Dependencies):
     • Known vulnerabilities in Hex packages
     • Outdated dependencies with security issues
     • CVEs in dependencies
     • Severity assessment

  3. General Security:
     • Hardcoded secrets and credentials
     • Insecure random number generation
     • File inclusion vulnerabilities
     • Command injection risks

Examples:
  /elixir-security                    # Run all security scans
  /elixir-security --verbose          # Verbose security scan
  /elixir-security --format json      # Output results as JSON
  /elixir-security --exit             # Exit on any security finding
  /elixir-security --exit-on-vuln     # Exit only on vulnerabilities

Notes:
  • Sobelow requires Phoenix framework (automatically skips if not Phoenix)
  • mix_audit requires Hex package manager
  • Security checks are environment-aware
  • False positives are marked for review
  • Critical findings are highlighted
  • Recommendations are provided for fixes

Configuration:
  Security tools can be configured via /elixir-setup:
    • Enable/disable specific security checks
    • Set severity thresholds
    • Configure ignore patterns
    • Set custom rules
`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
