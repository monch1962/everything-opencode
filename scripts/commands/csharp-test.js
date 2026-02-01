#!/usr/bin/env node
/**
 * C#/.NET Test Command
 *
 * Run tests for C#/.NET projects
 */

const CSharpCommandRunner = require('../csharp/command-runner');

async function main() {
  try {
    const projectPath = process.cwd();
    const runner = new CSharpCommandRunner(projectPath);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};

    // Parse options
    const parsedArgs = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--filter' || arg === '-f') {
        if (i + 1 < args.length) {
          options.filter = args[i + 1];
          parsedArgs.push('--filter', args[i + 1]);
          i++;
        }
      } else if (arg === '--configuration' || arg === '-c') {
        if (i + 1 < args.length) {
          options.configuration = args[i + 1];
          parsedArgs.push('--configuration', args[i + 1]);
          i++;
        }
      } else if (arg === '--framework' || arg === '-fr') {
        if (i + 1 < args.length) {
          options.framework = args[i + 1];
          parsedArgs.push('--framework', args[i + 1]);
          i++;
        }
      } else if (arg === '--logger' || arg === '-l') {
        if (i + 1 < args.length) {
          options.logger = args[i + 1];
          parsedArgs.push('--logger', args[i + 1]);
          i++;
        }
      } else if (arg === '--coverage' || arg === '-cov') {
        options.coverage = true;
        parsedArgs.push('--collect:"XPlat Code Coverage"');
      } else if (arg === '--verbosity' || arg === '-v') {
        if (i + 1 < args.length) {
          options.verbosity = args[i + 1];
          parsedArgs.push('--verbosity', args[i + 1]);
          i++;
        }
      } else if (arg === '--no-build' || arg === '-nb') {
        options.noBuild = true;
        parsedArgs.push('--no-build');
      } else if (arg === '--no-restore' || arg === '-nr') {
        options.noRestore = true;
        parsedArgs.push('--no-restore');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run tests
    await runner.initialize();
    await runner.test(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /csharp-setup first to configure your project.');
    }

    if (error.message.includes('test') || error.message.includes('Test')) {
      console.log('\n💡 Test framework issues');
      console.log('   Install test framework: dotnet add package xunit');
      console.log('   Add test project to solution');
      console.log('   Create test files in Tests directory');
    }

    if (error.message.includes('assembly') || error.message.includes('reference')) {
      console.log('\n💡 Reference issues');
      console.log('   Add project reference: dotnet add reference ../src/Project.csproj');
      console.log('   Check .csproj file for missing references');
      console.log('   Restore packages: dotnet restore');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧪 C#/.NET Test Command

Usage: /csharp-test [options] [test-pattern]

Options:
  --filter, -f <expression>    Run tests that match the given expression
  --configuration, -c <config> Build configuration (Debug|Release) [default: Debug]
  --framework, -fr <framework> Target framework (net6.0, net7.0, net8.0, etc.)
  --logger, -l <logger>        Logger to use for test results (trx, console, etc.)
  --coverage, -cov             Generate test coverage report
  --verbosity, -v <level>      Set verbosity level (quiet|minimal|normal|detailed|diagnostic)
  --no-build, -nb              Don't build the test project before running
  --no-restore, -nr            Skip restoring packages before testing
  --help, -h                   Show this help message

Filter Expressions:
  FullyQualifiedName~MyNamespace.MyClass.MyMethod  # Run specific test method
  Name~MyTest                                      # Run tests containing "MyTest"
  Category=Integration                             # Run tests with specific category

Examples:
  /csharp-test                          # Run all tests
  /csharp-test --coverage               # Run tests with coverage
  /csharp-test --filter "Name~MyTest"   # Run tests containing "MyTest"
  /csharp-test --configuration Release  # Run tests with Release configuration
  /csharp-test --logger trx             # Generate TRX test results file
  /csharp-test --verbosity detailed     # Show detailed test output

Supported Test Frameworks:
  • xUnit (default)
  • NUnit
  • MSTest
  • Other frameworks via test adapters

Test Coverage:
  • Install coverlet.collector: dotnet add package coverlet.collector
  • Use --coverage flag to generate coverage report
  • Generate HTML report: dotnet reportgenerator -reports:coverage.cobertura.xml -targetdir:coverage

Configuration:
  Run /csharp-setup first to configure your project.
  Configure test frameworks in .csproj or test project settings.

For Multi-Project Solutions:
  • Run all tests: dotnet test
  • Run specific test project: dotnet test Tests/MyTests.csproj
  • Run solution tests: dotnet test MySolution.sln

Advanced Options:
  • Use --blame to collect crash dumps for failing tests
  • Use --diag to generate diagnostic log files
  • Use --results-directory to specify output directory
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
