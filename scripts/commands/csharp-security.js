#!/usr/bin/env node
/**
 * /csharp-security command wrapper
 *
 * Run C#/.NET security scanning tools
 */

const CSharpCommandRunner = require('../csharp/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const extraArgs = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--tool' || arg === '-t') {
      options.tool = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--diagnostics' || arg === '-d') {
      options.diagnostics = args[++i];
    } else if (arg === '--severity' || arg === '-s') {
      options.severity = args[++i];
    } else if (arg === '--key' || arg === '-k') {
      options.key = args[++i];
    } else if (arg === '--name' || arg === '-n') {
      options.name = args[++i];
    } else if (arg === '--version' || arg === '-v') {
      options.version = args[++i];
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--dotnet-list-only') {
      options.dotnetListOnly = true;
    } else if (arg === '--security-code-scan-only') {
      options.securityCodeScanOnly = true;
    } else if (arg === '--sonar-scanner-only') {
      options.sonarScannerOnly = true;
    } else if (arg === '--owasp-only') {
      options.owaspOnly = true;
    } else if (arg === '--verbose') {
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
    const runner = new CSharpCommandRunner();

    if (options.setup) {
      console.log('🔧 Setting up C#/.NET security scanning...');
      console.log('\n📦 Install security tools:');
      console.log('  • dotnet tool install --global dotnet-format (for security analyzers)');
      console.log('  • dotnet tool install --global dotnet-outdated (for outdated packages)');
      console.log('  • Install SecurityCodeScan analyzer: dotnet add package SecurityCodeScan');
      console.log('  • For SonarQube: dotnet tool install --global dotnet-sonarscanner');
      console.log('  • For OWASP: Download from https://owasp.org/www-project-dependency-check/');
      process.exit(0);
    }

    console.log('🔒 Running C#/.NET security scanning...\n');

    // Determine which tools to run
    let securityTools = [];

    if (options.dotnetListOnly) {
      securityTools = ['dotnet-list-package'];
    } else if (options.securityCodeScanOnly) {
      securityTools = ['security-code-scan'];
    } else if (options.sonarScannerOnly) {
      securityTools = ['sonar-scanner'];
    } else if (options.owaspOnly) {
      securityTools = ['owasp-dependency-check'];
    } else if (options.tool) {
      securityTools = [options.tool];
    } else if (options.all) {
      securityTools = [
        'dotnet-list-package',
        'security-code-scan',
        'sonar-scanner',
        'owasp-dependency-check',
      ];
    } else {
      // Default: dotnet list package and security code scan
      securityTools = ['dotnet-list-package', 'security-code-scan'];
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
      console.log('  • Keep dependencies updated with `dotnet outdated`');
      console.log('  • Consider using SonarQube for continuous inspection');
      console.log('  • Enable NuGet security alerts in GitHub/GitLab');
    } else {
      console.log('\n⚠️  Some security scans failed');
      console.log('\n🔧 Troubleshooting:');
      console.log('  • Install missing tools (see --setup for instructions)');
      console.log('  • Check .NET SDK version: dotnet --version');
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
/csharp-security - Run C#/.NET security scanning tools

Usage:
  /csharp-security [options]

Options:
  --tool, -t <name>       Run specific security tool
  --format, -f <format>   Output format (text, json, sarif, etc.)
  --output, -o <path>     Output file for results
  --diagnostics, -d <ids> Diagnostic IDs to check
  --severity, -s <level>  Severity level (error, warning, info)
  --key, -k <key>         SonarQube project key
  --name, -n <name>       SonarQube project name
  --version, -v <ver>     SonarQube project version
  --all                   Run all security tools
  --dotnet-list-only      Run only dotnet list package --vulnerable
  --security-code-scan-only Run only security code scan
  --sonar-scanner-only    Run only SonarScanner
  --owasp-only            Run only OWASP Dependency Check
  --verbose               Verbose output
  --quiet, -q             Minimal output
  --setup                 Show setup instructions
  --help, -h              Show this help

Examples:
  /csharp-security
  /csharp-security --all
  /csharp-security --dotnet-list-only --verbose
  /csharp-security --security-code-scan-only --severity error
  /csharp-security --sonar-scanner-only --key myproject --name "My Project"
  /csharp-security --owasp-only --format html --output report.html

Security Tools:
  • dotnet-list-package    - Check for vulnerable NuGet packages
  • security-code-scan     - Static code analysis for security issues
  • sonar-scanner          - SonarQube analysis (requires SonarQube server)
  • owasp-dependency-check - OWASP dependency vulnerability scanning

Configuration:
  Reads from .opencode/project-config.json
  Uses csharpConfig.securityTools array
  Default: ['dotnet-list-package', 'security-code-scan']

Note:
  Some tools require additional setup (see --setup)
  For production use, integrate with CI/CD pipelines
  Consider using GitHub Dependabot or GitLab Dependency Scanning
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
