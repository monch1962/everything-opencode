#!/usr/bin/env node
/**
 * /go-test command wrapper
 *
 * Run Go tests with Go-specific improvements
 */

const GoCommandRunner = require('../go/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--coverage' || arg === '-c') {
      options.coverage = true;
    } else if (arg === '--coverage-profile') {
      options.coverageProfile = args[++i];
    } else if (arg === '--coverage-mode') {
      options.coverageMode = args[++i];
    } else if (arg === '--coverage-format') {
      options.coverageFormat = args[++i];
    } else if (arg === '--coverage-output') {
      options.coverageOutput = args[++i];
    } else if (arg === '--race') {
      options.race = true;
    } else if (arg === '--timeout') {
      options.timeout = args[++i];
    } else if (arg === '--count') {
      options.count = parseInt(args[++i]);
    } else if (arg === '--parallel') {
      options.parallel = parseInt(args[++i]);
    } else if (arg === '--bench' || arg === '-b') {
      options.bench = true;
    } else if (arg === '--benchtime') {
      options.benchtime = args[++i];
    } else if (arg === '--benchmem') {
      options.benchmem = true;
    } else if (arg === '--cpu') {
      options.cpu = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--short') {
      options.short = true;
    } else if (arg === '--fail-fast') {
      options.failFast = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      // Assume it's a test pattern
      options.pattern = arg;
    }
  }

  try {
    const runner = new GoCommandRunner(process.cwd());
    await runner.initialize();

    // Check if we're running benchmarks
    if (options.bench) {
      return runBenchmarks(runner, options);
    }

    // Run tests
    console.log('🧪 Running Go tests...');
    const result = await runner.test(options);

    if (result.success) {
      console.log('\n✅ All tests passed!');

      // Generate coverage report if requested
      if (options.coverage) {
        await generateCoverageReport(runner, options);
      }
    } else if (result.hasIssues) {
      console.log('\n⚠️ Tests completed with issues');
      process.exit(1);
    } else {
      console.error('\n❌ Tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Run benchmarks
 */
async function runBenchmarks(runner, options) {
  console.log('⚡ Running Go benchmarks...');

  try {
    const result = await runner.benchmark(options);

    if (result.success) {
      console.log('\n✅ Benchmarks completed!');

      // Parse and display benchmark results
      if (result.stdout) {
        displayBenchmarkResults(result.stdout);
      }
    } else {
      console.error('\n❌ Benchmarks failed');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Benchmark execution failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Display formatted benchmark results
 */
function displayBenchmarkResults(output) {
  const lines = output.split('\n');
  let inBenchmarkSection = false;
  const benchmarkResults = [];

  console.log('\n📊 Benchmark Results:');
  console.log('='.repeat(60));

  for (const line of lines) {
    if (line.startsWith('Benchmark')) {
      inBenchmarkSection = true;
      benchmarkResults.push(line);
    } else if (inBenchmarkSection && line.trim() === '') {
      break;
    }
  }

  // Parse and display benchmark results
  benchmarkResults.forEach((result) => {
    const parts = result.split('\t');
    if (parts.length >= 3) {
      const name = parts[0].trim();
      const iterations = parts[1].trim();
      const timePerOp = parts[2].trim();
      const memory = parts.length >= 4 ? parts[3].trim() : '';

      console.log(`\n${name}:`);
      console.log(`  Iterations: ${iterations}`);
      console.log(`  Time/op: ${timePerOp}`);
      if (memory) {
        console.log(`  Memory: ${memory}`);
      }
    }
  });

  // Show summary
  console.log('\n📈 Benchmark Summary:');
  console.log(`  Total benchmarks: ${benchmarkResults.length}`);

  // Calculate average time
  let totalTime = 0;
  benchmarkResults.forEach((result) => {
    const parts = result.split('\t');
    if (parts.length >= 3) {
      const timeStr = parts[2].trim();
      const match = timeStr.match(/([\d.]+)\s*(ns|µs|ms|s)/);
      if (match) {
        let time = parseFloat(match[1]);
        const unit = match[2];

        // Convert to nanoseconds for comparison
        switch (unit) {
          case 's':
            time *= 1e9;
            break;
          case 'ms':
            time *= 1e6;
            break;
          case 'µs':
            time *= 1e3;
            break;
          // ns stays the same
        }

        totalTime += time;
      }
    }
  });

  if (benchmarkResults.length > 0) {
    const avgTime = totalTime / benchmarkResults.length;
    console.log(`  Average time: ${formatTime(avgTime)}`);
  }
}

/**
 * Format time for display
 */
function formatTime(nanoseconds) {
  if (nanoseconds >= 1e9) {
    return `${(nanoseconds / 1e9).toFixed(2)} s`;
  } else if (nanoseconds >= 1e6) {
    return `${(nanoseconds / 1e6).toFixed(2)} ms`;
  } else if (nanoseconds >= 1e3) {
    return `${(nanoseconds / 1e3).toFixed(2)} µs`;
  } else {
    return `${nanoseconds.toFixed(0)} ns`;
  }
}

/**
 * Generate coverage report
 */
async function generateCoverageReport(runner, options) {
  console.log('\n📈 Generating coverage report...');

  try {
    const result = await runner.coverage({
      profile: options.coverageProfile,
      format: options.coverageFormat || 'html',
      output: options.coverageOutput,
    });

    if (result.success) {
      console.log('✅ Coverage report generated');

      // Show coverage statistics if available
      const coverageFile = options.coverageProfile || 'coverage.out';
      if (coverageFile) {
        await showCoverageStats(runner, coverageFile);
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not generate coverage report: ${error.message}`);
  }
}

/**
 * Show coverage statistics
 */
async function showCoverageStats(runner, profileFile) {
  try {
    const { runCommand } = require('../lib/utils');
    const result = runCommand(`go tool cover -func=${profileFile}`, {
      cwd: runner.projectPath,
      stdio: 'pipe',
    });

    if (result.success) {
      const lines = result.output.split('\n');
      let totalCoverage = '';

      // Find total coverage line
      for (const line of lines) {
        if (line.includes('total:')) {
          totalCoverage = line.trim();
          break;
        }
      }

      if (totalCoverage) {
        console.log(`📊 ${totalCoverage}`);

        // Parse coverage percentage
        const match = totalCoverage.match(/(\d+\.\d+)%/);
        if (match) {
          const coverage = parseFloat(match[1]);
          const threshold = runner.goConfig?.testing?.coverage?.threshold || 80;

          if (coverage >= threshold) {
            console.log(`✅ Coverage meets threshold (${threshold}%)`);
          } else {
            console.log(`⚠️ Coverage below threshold (${threshold}%)`);
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors in coverage stats display
  }
}

function showHelp() {
  console.log(`
🧪 Go Test Command

Usage: /go-test [options] [test-pattern]

Run Go tests with Go-specific improvements.

Options:
  --coverage, -c         Enable test coverage
  --coverage-profile FILE Coverage profile file (default: coverage.out)
  --coverage-mode MODE   Coverage mode: set, count, atomic
  --coverage-format FMT  Coverage report format: html, text, xml
  --coverage-output FILE Coverage output file
  --race                 Enable race detector
  --timeout DURATION     Test timeout (e.g., 30s, 5m)
  --count N              Run each test N times
  --parallel N           Run tests in parallel with N goroutines
  --bench, -b            Run benchmarks instead of tests
  --benchtime DURATION   Benchmark run duration (e.g., 5s, 100x)
  --benchmem             Print memory allocation statistics for benchmarks
  --cpu LIST             Comma-separated list of CPU counts to use
  --verbose, -v          Verbose output
  --short                Run short tests only
  --fail-fast            Exit on first test failure
  --json                 Output test results in JSON format
  --help, -h             Show this help message

Go-specific features:
  • Smart test runner selection (gotestsum if available)
  • Comprehensive coverage reporting with multiple formats
  • Benchmark execution with detailed results
  • Race detector integration
  • Parallel test execution
  • Coverage threshold checking
  • Test result formatting and analysis

Examples:
  /go-test                     # Run all tests
  /go-test --coverage         # Run tests with coverage
  /go-test --race             # Run tests with race detector
  /go-test --bench            # Run benchmarks
  /go-test --timeout 30s      # Run tests with 30-second timeout
  /go-test ./pkg/...          # Run tests in specific package
  /go-test TestMyFunction     # Run specific test function
  /go-test -v --count=3       # Run tests 3 times with verbose output

Coverage reporting:
  • HTML report for browser viewing
  • Text summary with function-level coverage
  • Coverage threshold enforcement
  • Multiple coverage modes (set, count, atomic)

Benchmark features:
  • Detailed benchmark results with time/operation
  • Memory allocation statistics
  • Custom benchmark durations
  • CPU profiling support
  • Benchmark comparison tools

Test patterns:
  • ./...                    # All packages
  • ./pkg/...               # All packages under pkg
  • TestMyFunction          # Specific test function
  • TestMyFunction/Subtest  # Specific subtest
  • BenchmarkMyFunction     # Specific benchmark

Environment variables:
  GO111MODULE      - Go modules mode
  GORACE           - Race detector options
  GODEBUG          - Go debug settings
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
