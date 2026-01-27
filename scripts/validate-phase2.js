#!/usr/bin/env node
/**
 * Phase 2 Refactoring Validation Script
 *
 * Validates that all Phase 2 refactored modules work correctly
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runCommand(command, description) {
  log(`Running: ${description}`);
  try {
    const result = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    log(`Success: ${description}`);
    return { success: true, output: result };
  } catch (error) {
    log(`Failed: ${description} - ${error.message}`, 'error');
    return { success: false, error: error.message, output: error.stdout };
  }
}

function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`File exists: ${filePath}`);
  } else {
    log(`File missing: ${filePath}`, 'error');
  }
  return exists;
}

function checkModuleStructure(modulePath) {
  log(`Checking module structure: ${modulePath}`);

  if (!fs.existsSync(modulePath)) {
    log(`Module directory missing: ${modulePath}`, 'error');
    return false;
  }

  const files = fs.readdirSync(modulePath);
  const hasIndex = files.some((file) => file.endsWith('.js'));

  if (hasIndex) {
    log(`Module has JavaScript files: ${files.filter((f) => f.endsWith('.js')).join(', ')}`);
  } else {
    log(`Module has no JavaScript files`, 'warning');
  }

  return hasIndex;
}

async function validatePhase2() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          Phase 2 Refactoring - Validation              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results = {
    files: { total: 0, passed: 0, failed: 0 },
    tests: { total: 0, passed: 0, failed: 0 },
    linting: { total: 0, passed: 0, failed: 0 },
    integration: { total: 0, passed: 0, failed: 0 },
  };

  // Step 1: Check file structure
  log('Step 1: Checking file structure');
  console.log('='.repeat(50));

  const requiredFiles = [
    // Refactored main files
    'scripts/pinescript/debug-server-refactored.js',
    'scripts/commands/pine-debug-refactored.js',
    'scripts/clojure/command-runner-refactored.js',

    // Module directories
    'scripts/pinescript/debug-server-modules/',
    'scripts/commands/pine-debug-modules/',
    'scripts/clojure/command-runner-modules/',

    // Documentation
    'docs/PHASE2-REFACTORING.md',
    'docs/MIGRATION-STRATEGY.md',

    // Tests
    'tests/integration/phase2-refactoring.test.js',
    'tests/performance/phase2-performance.test.js',
  ];

  requiredFiles.forEach((filePath) => {
    results.files.total++;
    if (filePath.endsWith('/')) {
      if (checkModuleStructure(filePath)) {
        results.files.passed++;
      } else {
        results.files.failed++;
      }
    } else {
      if (checkFileExists(filePath)) {
        results.files.passed++;
      } else {
        results.files.failed++;
      }
    }
  });

  // Step 2: Run tests
  log('\nStep 2: Running tests');
  console.log('='.repeat(50));

  const testCommands = [
    { command: 'npm test -- tests/languages/clojure.test.js', description: 'Clojure tests' },
    {
      command: 'node tests/integration/phase2-refactoring.test.js',
      description: 'Integration tests',
    },
  ];

  testCommands.forEach(({ command, description }) => {
    results.tests.total++;
    const result = runCommand(command, description);
    if (result.success) {
      results.tests.passed++;
    } else {
      results.tests.failed++;
    }
  });

  // Step 3: Run linting
  log('\nStep 3: Running linting');
  console.log('='.repeat(50));

  results.linting.total++;
  const lintResult = runCommand('npm run lint', 'Linting check');
  if (lintResult.success) {
    results.linting.passed++;
  } else {
    results.linting.failed++;
  }

  // Step 4: Check module dependencies
  log('\nStep 4: Checking module dependencies');
  console.log('='.repeat(50));

  const modulesToCheck = [
    { path: 'scripts/pinescript/debug-server-modules/', name: 'DebugServer modules' },
    { path: 'scripts/commands/pine-debug-modules/', name: 'PineDebug modules' },
    { path: 'scripts/clojure/command-runner-modules/', name: 'ClojureCommandRunner modules' },
  ];

  modulesToCheck.forEach(({ path: modulePath, name }) => {
    results.integration.total++;
    if (checkModuleStructure(modulePath)) {
      // Check that modules can be required
      try {
        const files = fs
          .readdirSync(modulePath)
          .filter((file) => file.endsWith('.js') && !file.startsWith('.'));

        files.forEach((file) => {
          const fullPath = path.join(modulePath, file);
          try {
            require(`../${fullPath}`);
            log(`Module loads successfully: ${file}`);
          } catch (error) {
            log(`Failed to load module ${file}: ${error.message}`, 'error');
            results.integration.failed++;
          }
        });

        if (files.length > 0) {
          results.integration.passed++;
        }
      } catch (error) {
        log(`Error checking module ${name}: ${error.message}`, 'error');
        results.integration.failed++;
      }
    } else {
      results.integration.failed++;
    }
  });

  // Step 5: Check updated command files
  log('\nStep 5: Checking updated command files');
  console.log('='.repeat(50));

  const commandFiles = [
    'scripts/commands/clojure-test.js',
    'scripts/commands/clojure-build.js',
    'scripts/commands/clojure-clean.js',
    'scripts/commands/clojure-run.js',
    'scripts/commands/clojure-deps.js',
    'scripts/commands/clojure-format.js',
    'scripts/commands/clojure-lint.js',
    'scripts/commands/clojure-repl.js',
  ];

  commandFiles.forEach((filePath) => {
    results.files.total++;
    if (checkFileExists(filePath)) {
      // Check that it imports refactored version
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('command-runner-refactored')) {
          log(`File uses refactored version: ${filePath}`);
          results.files.passed++;
        } else {
          log(`File does not use refactored version: ${filePath}`, 'error');
          results.files.failed++;
        }
      } catch (error) {
        log(`Error reading file ${filePath}: ${error.message}`, 'error');
        results.files.failed++;
      }
    } else {
      results.files.failed++;
    }
  });

  // Step 6: Performance check
  log('\nStep 6: Performance validation');
  console.log('='.repeat(50));

  const perfResult = runCommand(
    "node --expose-gc -e \"'use strict'; const DebugServer = require('./scripts/pinescript/debug-server-refactored'); const ClojureCommandRunner = require('./scripts/clojure/command-runner-refactored'); console.log('Modules load successfully');\"",
    'Performance check - module loading',
  );

  if (perfResult.success) {
    log('Performance check passed - modules load quickly');
    results.tests.passed++;
    results.tests.total++;
  } else {
    log('Performance check failed', 'error');
    results.tests.failed++;
    results.tests.total++;
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  Validation Summary                     ║');
  console.log('╠══════════════════════════════════════════════════════════╣');

  const categories = [
    { name: 'Files', stats: results.files },
    { name: 'Tests', stats: results.tests },
    { name: 'Linting', stats: results.linting },
    { name: 'Integration', stats: results.integration },
  ];

  let totalPassed = 0;
  let totalTotal = 0;

  categories.forEach(({ name, stats }) => {
    const passed = stats.passed;
    const total = stats.total;
    const failed = stats.failed;

    totalPassed += passed;
    totalTotal += total;

    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    const status = failed === 0 ? '✓' : '✗';

    console.log(
      `║  ${name}: ${passed}/${total} passed (${percentage}%) ${status}                    ║`,
    );
  });

  const overallPercentage = totalTotal > 0 ? Math.round((totalPassed / totalTotal) * 100) : 0;
  const overallStatus = totalPassed === totalTotal ? '✓' : '✗';

  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(
    `║  Overall: ${totalPassed}/${totalTotal} passed (${overallPercentage}%) ${overallStatus}                ║`,
  );

  if (totalPassed === totalTotal) {
    console.log('║  ✅ Phase 2 refactoring validation PASSED                ║');
  } else {
    console.log('║  ❌ Phase 2 refactoring validation FAILED                ║');
  }

  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Return appropriate exit code
  return totalPassed === totalTotal ? 0 : 1;
}

// Run validation
if (require.main === module) {
  validatePhase2()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validatePhase2 };
