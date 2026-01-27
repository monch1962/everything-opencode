#!/usr/bin/env node
/**
 * Phase 2 Refactoring Performance Tests
 *
 * Tests performance characteristics of refactored modules
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Import refactored modules
const DebugServer = require('../../scripts/pinescript/debug-server-refactored');
const ClojureCommandRunner = require('../../scripts/clojure/command-runner-refactored');

// Import original modules for comparison
const OriginalDebugServer = require('../../scripts/pinescript/debug-server');
const OriginalClojureCommandRunner = require('../../scripts/clojure/command-runner');

// Performance test helper
function benchmark(name, fn, iterations = 1000) {
  const start = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = process.hrtime.bigint();
  const durationNs = Number(end - start);
  const durationMs = durationNs / 1000000;
  const avgMs = durationMs / iterations;

  return {
    name,
    iterations,
    totalMs: durationMs,
    avgMs,
    opsPerSec: iterations / (durationMs / 1000),
  };
}

function formatResult(result) {
  return `${result.name}: ${result.avgMs.toFixed(3)}ms avg (${result.opsPerSec.toFixed(0)} ops/sec)`;
}

async function runPerformanceTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      Phase 2 Refactoring - Performance Tests           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results = [];
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-test-'));

  try {
    // Test 1: Module Instantiation Performance
    console.log('Test 1: Module Instantiation Performance');
    console.log('========================================');

    const instantiationResults = [
      benchmark(
        'Original DebugServer instantiation',
        () => {
          new OriginalDebugServer();
        },
        1000,
      ),

      benchmark(
        'Refactored DebugServer instantiation',
        () => {
          new DebugServer();
        },
        1000,
      ),

      benchmark(
        'Original ClojureCommandRunner instantiation',
        () => {
          new OriginalClojureCommandRunner();
        },
        1000,
      ),

      benchmark(
        'Refactored ClojureCommandRunner instantiation',
        () => {
          new ClojureCommandRunner();
        },
        1000,
      ),
    ];

    instantiationResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Test 2: Method Execution Performance
    console.log('\nTest 2: Method Execution Performance');
    console.log('====================================');

    // DebugServer methods - test setup methods instead of start
    const originalDebugServer = new OriginalDebugServer();
    const refactoredDebugServer = new DebugServer();

    const debugServerResults = [
      benchmark(
        'Original DebugServer.setupMiddleware',
        () => {
          originalDebugServer.setupMiddleware();
        },
        1000,
      ),

      benchmark(
        'Refactored DebugServer.setupMiddleware',
        () => {
          refactoredDebugServer.setupMiddleware();
        },
        1000,
      ),
    ];

    debugServerResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // PineDebug modules
    const ArgumentParser = require('../../scripts/commands/pine-debug-modules/argument-parser');

    const pineDebugResults = [
      benchmark(
        'ArgumentParser.parseArgs',
        () => {
          const parser = new ArgumentParser();
          const schema = {
            file: { type: 'string' },
            debug: { type: 'boolean' },
          };
          parser.parseArgs(['--file', 'test.pine', '--debug'], schema);
        },
        1000,
      ),
    ];

    pineDebugResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Test 3: Memory Usage Comparison
    console.log('\nTest 3: Memory Usage Comparison');
    console.log('===============================');

    const memoryTests = [];

    // Test memory usage for creating many instances
    const testMemoryUsage = (name, createInstance) => {
      const instances = [];
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 1000; i++) {
        instances.push(createInstance());
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = finalMemory - initialMemory;
      const avgMemory = memoryUsed / 1000;

      instances.length = 0; // Clear references

      if (global.gc) {
        global.gc();
      }

      memoryTests.push({
        name,
        totalMemoryKB: memoryUsed / 1024,
        avgMemoryKB: avgMemory / 1024,
      });
    };

    testMemoryUsage('Original DebugServer', () => new OriginalDebugServer());
    testMemoryUsage('Refactored DebugServer', () => new DebugServer());
    testMemoryUsage('ArgumentParser', () => new ArgumentParser());

    memoryTests.forEach((test) => {
      console.log(`  ${test.name}: ${test.avgMemoryKB.toFixed(2)}KB avg per instance`);
    });

    // Test 4: Concurrent Execution Performance
    console.log('\nTest 4: Concurrent Execution Performance');
    console.log('========================================');

    const concurrentResults = [];

    // Test concurrent method execution
    const testConcurrent = async (name, fn, concurrentCount = 10) => {
      const start = process.hrtime.bigint();

      const promises = [];
      for (let i = 0; i < concurrentCount; i++) {
        promises.push(fn());
      }

      await Promise.all(promises);

      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationMs = durationNs / 1000000;

      concurrentResults.push({
        name,
        concurrentCount,
        totalMs: durationMs,
        avgMs: durationMs / concurrentCount,
      });
    };

    // Create mock functions for testing
    const mockAsyncOperation = () => new Promise((resolve) => setTimeout(resolve, 1));

    await testConcurrent('Refactored async operations', async () => {
      await mockAsyncOperation();
    });

    console.log(
      `  ${concurrentResults[0].name}: ${concurrentResults[0].avgMs.toFixed(3)}ms avg per concurrent operation`,
    );

    // Test 5: File System Operation Performance
    console.log('\nTest 5: File System Operation Performance');
    console.log('=========================================');

    // Create test files
    const testFile = path.join(tempDir, 'test.pine');
    fs.writeFileSync(testFile, '// Test file content\n'.repeat(100));

    const fileSystemResults = [
      benchmark(
        'File read (100 lines)',
        () => {
          fs.readFileSync(testFile, 'utf8');
        },
        100,
      ),

      benchmark(
        'File exists check',
        () => {
          fs.existsSync(testFile);
        },
        1000,
      ),

      benchmark(
        'Path joining',
        () => {
          path.join(tempDir, 'subdir', 'file.txt');
        },
        10000,
      ),
    ];

    fileSystemResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Test 6: JSON Parsing Performance (common in modules)
    console.log('\nTest 6: JSON Processing Performance');
    console.log('====================================');

    const testData = {
      name: 'Test Object',
      value: 42,
      nested: {
        array: [1, 2, 3, 4, 5],
        object: { a: 1, b: 2, c: 3 },
      },
      timestamp: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(testData);

    const jsonResults = [
      benchmark(
        'JSON.stringify',
        () => {
          JSON.stringify(testData);
        },
        1000,
      ),

      benchmark(
        'JSON.parse',
        () => {
          JSON.parse(jsonString);
        },
        1000,
      ),
    ];

    jsonResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Test 7: Regular Expression Performance
    console.log('\nTest 7: Regular Expression Performance');
    console.log('======================================');

    const testText = 'This is a test string with some patterns to match.';
    const regex = /test|pattern|match/gi;

    const regexResults = [
      benchmark(
        'Regex test',
        () => {
          regex.test(testText);
        },
        10000,
      ),

      benchmark(
        'Regex match',
        () => {
          testText.match(regex);
        },
        10000,
      ),
    ];

    regexResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Test 8: Array Operations Performance
    console.log('\nTest 8: Array Operations Performance');
    console.log('====================================');

    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random(),
    }));

    const arrayResults = [
      benchmark(
        'Array.filter',
        () => {
          largeArray.filter((item) => item.value > 0.5);
        },
        100,
      ),

      benchmark(
        'Array.map',
        () => {
          largeArray.map((item) => ({ ...item, processed: true }));
        },
        100,
      ),

      benchmark(
        'Array.reduce',
        () => {
          largeArray.reduce((sum, item) => sum + item.value, 0);
        },
        100,
      ),
    ];

    arrayResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Test 9: Object Operations Performance
    console.log('\nTest 9: Object Operations Performance');
    console.log('=====================================');

    const testObject = {};
    for (let i = 0; i < 1000; i++) {
      testObject[`key${i}`] = `value${i}`;
    }

    const objectResults = [
      benchmark(
        'Object.keys',
        () => {
          Object.keys(testObject);
        },
        100,
      ),

      benchmark(
        'Object.values',
        () => {
          Object.values(testObject);
        },
        100,
      ),

      benchmark(
        'Object.entries',
        () => {
          Object.entries(testObject);
        },
        100,
      ),
    ];

    objectResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Test 10: Error Handling Performance
    console.log('\nTest 10: Error Handling Performance');
    console.log('====================================');

    const errorResults = [
      benchmark(
        'Try-catch (no error)',
        () => {
          try {
            const result = 1 + 1;
            return result;
          } catch (error) {
            // No error
          }
        },
        10000,
      ),

      benchmark(
        'Try-catch (with error)',
        () => {
          try {
            throw new Error('Test error');
          } catch (error) {
            // Catch error
          }
        },
        10000,
      ),

      benchmark(
        'Error creation',
        () => {
          new Error('Test error');
        },
        10000,
      ),
    ];

    errorResults.forEach((result) => {
      console.log(`  ${formatResult(result)}`);
      results.push(result);
    });

    // Summary Analysis
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                  Performance Summary                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');

    // Calculate averages
    const refactoredAvg =
      results.filter((r) => r.name.includes('Refactored')).reduce((sum, r) => sum + r.avgMs, 0) /
      results.filter((r) => r.name.includes('Refactored')).length;

    const originalAvg =
      results.filter((r) => r.name.includes('Original')).reduce((sum, r) => sum + r.avgMs, 0) /
      results.filter((r) => r.name.includes('Original')).length;

    const performanceDiff = ((refactoredAvg - originalAvg) / originalAvg) * 100;

    console.log(`║  Original avg: ${originalAvg.toFixed(3)}ms                         ║`);
    console.log(`║  Refactored avg: ${refactoredAvg.toFixed(3)}ms                       ║`);
    console.log(`║  Performance difference: ${performanceDiff.toFixed(1)}%              ║`);

    // Memory summary
    const refactoredMemory =
      memoryTests
        .filter((m) => m.name.includes('Refactored'))
        .reduce((sum, m) => sum + m.avgMemoryKB, 0) /
      memoryTests.filter((m) => m.name.includes('Refactored')).length;

    const originalMemory =
      memoryTests
        .filter((m) => m.name.includes('Original'))
        .reduce((sum, m) => sum + m.avgMemoryKB, 0) /
      memoryTests.filter((m) => m.name.includes('Original')).length;

    const memoryDiff = ((refactoredMemory - originalMemory) / originalMemory) * 100;

    console.log(`║  Original memory: ${originalMemory.toFixed(2)}KB avg                ║`);
    console.log(`║  Refactored memory: ${refactoredMemory.toFixed(2)}KB avg              ║`);
    console.log(`║  Memory difference: ${memoryDiff.toFixed(1)}%                    ║`);

    // Performance assessment
    console.log('╠══════════════════════════════════════════════════════════╣');

    if (performanceDiff < 10 && memoryDiff < 20) {
      console.log('║  ✅ Performance: ACCEPTABLE - Minimal regression           ║');
    } else if (performanceDiff < 25 && memoryDiff < 50) {
      console.log('║  ⚠️  Performance: MODERATE - Some regression acceptable    ║');
    } else {
      console.log('║  ❌ Performance: UNACCEPTABLE - Significant regression     ║');
    }

    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Return success if performance is acceptable
    const success = performanceDiff < 25 && memoryDiff < 50;
    return { success, results, memoryTests, performanceDiff, memoryDiff };
  } finally {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Enable garbage collection for memory tests
  if (global.gc) {
    console.log('Garbage collection enabled for memory tests\n');
  } else {
    console.log('Note: Run with --expose-gc flag for accurate memory tests\n');
  }

  runPerformanceTests()
    .then((results) => {
      if (results.success) {
        console.log('✅ Performance tests passed - refactored code meets performance criteria');
        process.exit(0);
      } else {
        console.log(
          '❌ Performance tests failed - refactored code has significant performance regression',
        );
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Performance test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests, benchmark };
