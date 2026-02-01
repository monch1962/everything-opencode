#!/usr/bin/env node
/**
 * /python-security command wrapper
 *
 * Run Python security scanning tools
 */

const PythonCommandRunner = require('../python/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const extraArgs = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--tool' || arg === '-t') {
      options.tool = args[++i];
    } else if (arg === '--config' || arg === '-c') {
      options.config = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--file' || arg === '-r') {
      options.file = args[++i];
    } else if (arg === '--full-report') {
      options.fullReport = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--bandit-only') {
      options.banditOnly = true;
    } else if (arg === '--safety-only') {
      options.safetyOnly = true;
    } else if (arg === '--pip-audit-only') {
      options.pipAuditOnly = true;
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
    const runner = new PythonCommandRunner();

    if (options.setup) {
      console.log('🔧 Setting up Python security scanning...');
      console.log('Run /python-setup to configure security tools.');
      process.exit(0);
    }

    console.log('🔒 Running Python security scanning...\n');

    // Determine which tools to run
    let securityTools = [];

    if (options.banditOnly) {
      securityTools = ['bandit'];
    } else if (options.safetyOnly) {
      securityTools = ['safety'];
    } else if (options.pipAuditOnly) {
      securityTools = ['pip-audit'];
    } else if (options.tool) {
      securityTools = [options.tool];
    } else if (options.all) {
      securityTools = ['bandit', 'safety', 'pip-audit'];
    } else {
      // Default: bandit and safety
      securityTools = ['bandit', 'safety'];
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
      console.log('  • Keep dependencies updated');
      console.log('  • Consider using pip-audit for dependency vulnerability checking');
    } else {
      console.log('\n⚠️  Some security scans failed');
      console.log('\n🔧 Troubleshooting:');
      console.log('  • Install missing tools: pip install bandit safety pip-audit');
      console.log('  • Check Python environment and permissions');
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
/python-security - Run Python security scanning tools

Usage:
  /python-security [options]

Options:
  --tool, -t <name>       Run specific security tool (bandit, safety, pip-audit)
  --config, -c <path>     Configuration file for security tool
  --format, -f <format>   Output format (text, json, html, etc.)
  --output, -o <path>     Output file for results
  --file, -r <path>       Requirements file to check (for safety/pip-audit)
  --full-report           Show full report (for safety)
  --json                  Output results in JSON format
  --all                   Run all security tools (bandit, safety, pip-audit)
  --bandit-only           Run only bandit (code security)
  --safety-only           Run only safety (dependency vulnerabilities)
  --pip-audit-only        Run only pip-audit (dependency vulnerabilities)
  --verbose, -v           Verbose output
  --quiet, -q             Minimal output
  --setup                 Show setup instructions
  --help, -h              Show this help

Examples:
  /python-security
  /python-security --all
  /python-security --bandit-only --verbose
  /python-security --safety-only --file requirements.txt
  /python-security --pip-audit-only --json
  /python-security --tool bandit --config .bandit.yml

Security Tools:
  • bandit      - Security linter for Python code
  • safety      - Check Python dependencies for known vulnerabilities
  • pip-audit   - Audit Python dependencies for vulnerabilities

Configuration:
  Reads from .opencode/project-config.json
  Uses pythonConfig.securityTools array
  Default: ['bandit', 'safety']

Note:
  Install tools with: pip install bandit safety pip-audit
  Run /python-setup to configure security tools
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
