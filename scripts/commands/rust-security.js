#!/usr/bin/env node
/**
 * /rust-security command wrapper
 *
 * Run Rust security scanning tools
 */

const RustCommandRunner = require('../rust/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const extraArgs = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--tool' || arg === '-t') {
      options.tool = args[++i];
    } else if (arg === '--database' || arg === '-d') {
      options.database = args[++i];
    } else if (arg === '--config' || arg === '-c') {
      options.config = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--target') {
      options.target = args[++i];
    } else if (arg === '--ignore') {
      options.ignore = args[++i];
    } else if (arg === '--deny-warnings') {
      options.denyWarnings = true;
    } else if (arg === '--all-targets') {
      options.allTargets = true;
    } else if (arg === '--unsafe-only') {
      options.unsafeOnly = true;
    } else if (arg === '--recursive') {
      options.recursive = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--cargo-audit-only') {
      options.cargoAuditOnly = true;
    } else if (arg === '--cargo-deny-only') {
      options.cargoDenyOnly = true;
    } else if (arg === '--cargo-geiger-only') {
      options.cargoGeigerOnly = true;
    } else if (arg === '--cargo-crev-only') {
      options.cargoCrevOnly = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--setup') {
      options.setup = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      extraArgs.push(arg);
    }
  }

  try {
    const runner = new RustCommandRunner();

    if (options.setup) {
      console.log('🔧 Setting up Rust security scanning...');
      console.log('\n📦 Install security tools:');
      console.log('  • cargo install cargo-audit');
      console.log('  • cargo install cargo-deny');
      console.log('  • cargo install cargo-geiger');
      console.log('  • cargo install cargo-crev');
      console.log('\n🔧 Additional setup:');
      console.log('  • For cargo-audit: Update database with cargo audit fetch');
      console.log('  • For cargo-deny: Create deny.toml configuration');
      console.log('  • For cargo-crev: Initialize with cargo crev id new');
      process.exit(0);
    }

    console.log('🔒 Running Rust security scanning...\n');

    // Determine which tools to run
    let securityTools = [];

    if (options.cargoAuditOnly) {
      securityTools = ['cargo-audit'];
    } else if (options.cargoDenyOnly) {
      securityTools = ['cargo-deny'];
    } else if (options.cargoGeigerOnly) {
      securityTools = ['cargo-geiger'];
    } else if (options.cargoCrevOnly) {
      securityTools = ['cargo-crev'];
    } else if (options.tool) {
      securityTools = [options.tool];
    } else if (options.all) {
      securityTools = ['cargo-audit', 'cargo-deny', 'cargo-geiger', 'cargo-crev'];
    } else {
      // Default: cargo-audit and cargo-deny
      securityTools = ['cargo-audit', 'cargo-deny'];
    }

    options.securityTools = securityTools;

    const results = await runner.runSecurityScan(options);

    console.log('\n📊 Security Scan Results:');
    console.log('='.repeat(50));

    let allSuccess = true;
    results.forEach((result) => {
      if (result.success) {
        console.log(`✅ ${result.tool}: Security scan completed successfully`);
      } else {
        console.log(`❌ ${result.tool}: Failed - ${result.error}`);
        allSuccess = false;
      }
    });

    console.log('='.repeat(50));

    if (allSuccess) {
      console.log('\n✅ All security scans completed successfully');
      console.log('\n💡 Recommendations:');
      console.log('  • Run security scans regularly (e.g., in CI/CD)');
      console.log('  • Review and fix any vulnerabilities found');
      console.log('  • Keep dependencies updated with cargo update');
      console.log('  • Consider using cargo-audit in deny-warnings mode for CI');
      console.log('  • Use cargo-geiger to track unsafe code usage');
    } else {
      console.log('\n⚠️  Some security scans failed');
      console.log('\n🔧 Troubleshooting:');
      console.log('  • Install missing tools (see --setup for instructions)');
      console.log('  • Check Rust toolchain: rustc --version');
      console.log('  • Ensure project builds successfully');
      console.log('  • Run with --verbose for more details');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Security scanning failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/rust-security - Run Rust security scanning tools

Usage:
  /rust-security [options]

Options:
  --tool, -t <name>       Run specific security tool
  --database, -d <path>   Audit database path (for cargo-audit)
  --config, -c <path>     Configuration file (for cargo-deny)
  --output, -o <path>     Output file for results
  --format, -f <format>   Output format (json, text, etc.)
  --target <triple>       Target triple (for cargo-deny)
  --ignore <id>           Ignore specific advisory (for cargo-audit)
  --deny-warnings         Deny warnings (fail on warnings)
  --all-targets           Check all targets (for cargo-deny)
  --unsafe-only           Check only unsafe code (for cargo-geiger)
  --recursive             Recursive verification (for cargo-crev)
  --all                   Run all security tools
  --cargo-audit-only      Run only cargo-audit
  --cargo-deny-only       Run only cargo-deny
  --cargo-geiger-only     Run only cargo-geiger
  --cargo-crev-only       Run only cargo-crev
  --verbose, -v           Verbose output
  --quiet, -q             Minimal output
  --setup                 Show setup instructions
  --help, -h              Show this help

Examples:
  /rust-security
  /rust-security --all
  /rust-security --cargo-audit-only --deny-warnings
  /rust-security --cargo-deny-only --config deny.toml
  /rust-security --cargo-geiger-only --unsafe-only
  /rust-security --cargo-crev-only --recursive --verbose

Security Tools:
  • cargo-audit   - Audit Cargo.lock for crates with security vulnerabilities
  • cargo-deny    - Check dependencies for licenses, vulnerabilities, and sources
  • cargo-geiger  - Find usage of unsafe Rust in your codebase
  • cargo-crev    - Cryptographic code review and verification

Configuration:
  Reads from .opencode/project-config.json
  Uses rustConfig.securityTools array
  Default: ['cargo-audit', 'cargo-deny']

Note:
  Some tools require additional setup (see --setup)
  For production use, integrate with CI/CD pipelines
  Consider using GitHub Dependabot or GitLab Dependency Scanning for Rust
  `);
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;
