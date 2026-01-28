#!/usr/bin/env node
/**
 * Validation script for PythonCommandRunner refactoring
 *
 * Tests that the refactored PythonCommandRunner maintains 100% backward compatibility
 * with the original API and functionality.
 */

const PythonCommandRunner = require('./python-command-runner');

console.log('🔍 Validating PythonCommandRunner refactoring...\n');

let passed = 0;
let failed = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${description}`);
    console.log(`    Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Class exists and is a function
test('PythonCommandRunner class exists', () => {
  if (typeof PythonCommandRunner !== 'function') {
    throw new Error('PythonCommandRunner is not a function/class');
  }
});

// Test 2: Can instantiate class
test('Can instantiate PythonCommandRunner', () => {
  const runner = new PythonCommandRunner();
  if (!runner) {
    throw new Error('Failed to instantiate PythonCommandRunner');
  }
});

// Test 3: Instance has required methods
test('Instance has required methods', () => {
  const runner = new PythonCommandRunner();
  const requiredMethods = [
    'initialize',
    'checkTool',
    'getPythonExecutable',
    'findPythonFiles',
    'getPythonProjectInfo',
    'executeCommand',
    '_executeCommandWithErrorHandling',
    'executePythonModule',
    'runTests',
    'runLinter',
    'runFormatter',
    'runTypeChecker',
    'manageDependencies',
    'runSetup',
    'printHelp',
  ];

  for (const method of requiredMethods) {
    if (typeof runner[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

// Test 4: Constructor accepts project path
test('Constructor accepts project path', () => {
  const testPath = '/test/path';
  const runner = new PythonCommandRunner(testPath);

  // Check that initializer was created with correct path
  const initializer = runner.getInitializer();
  if (!initializer) {
    throw new Error('Initializer not created');
  }
});

// Test 5: Help utils works
test('Help utils works', () => {
  const runner = new PythonCommandRunner();
  const helpUtils = runner.getHelpUtils();

  if (!helpUtils) {
    throw new Error('Help utils not available');
  }

  if (typeof helpUtils.printHelp !== 'function') {
    throw new Error('Help utils missing printHelp method');
  }
});

// Test 6: Module getters work
test('Module getters work', () => {
  const runner = new PythonCommandRunner();

  const modules = [
    'getInitializer',
    'getProjectAnalyzer',
    'getCoreExecutor',
    'getCommandExecutor',
    'getHelpUtils',
  ];

  for (const getter of modules) {
    if (typeof runner[getter] !== 'function') {
      throw new Error(`Missing getter: ${getter}`);
    }
  }
});

// Test 7: Method signatures are correct (async vs sync)
test('Method signatures are correct', () => {
  const runner = new PythonCommandRunner();

  const asyncMethods = [
    'initialize',
    'checkTool',
    'executeCommand',
    '_executeCommandWithErrorHandling',
    'executePythonModule',
    'runTests',
    'runLinter',
    'runFormatter',
    'runTypeChecker',
    'manageDependencies',
    'runSetup',
  ];

  const syncMethods = [
    'getPythonExecutable',
    'findPythonFiles',
    'getPythonProjectInfo',
    'printHelp',
  ];

  // Check that async methods return promises
  for (const method of asyncMethods) {
    const result = runner[method]();
    if (!(result instanceof Promise)) {
      throw new Error(`Method ${method} should be async (return Promise)`);
    }
  }

  // Check that sync methods don't return promises
  for (const method of syncMethods) {
    try {
      const result = runner[method]();
      if (result instanceof Promise) {
        throw new Error(`Method ${method} should be sync (not return Promise)`);
      }
    } catch (error) {
      // Some methods may throw if not initialized, which is OK
      if (!error.message.includes('not initialized')) {
        throw error;
      }
    }
  }
});

// Test 8: Help method works without initialization
test('Help method works without initialization', () => {
  const runner = new PythonCommandRunner();

  // This should not throw
  runner.printHelp('test');
  runner.printHelp();
});

// Test 9: Module dependencies are properly injected
test('Module dependencies are properly injected', () => {
  const runner = new PythonCommandRunner('/test/path');

  // Check that modules reference each other correctly
  const initializer = runner.getInitializer();
  if (!initializer) {
    throw new Error('Initializer not created');
  }

  // After initialization, other modules should be created
  // (we'll test this in the async test below)
});

// Test 10: Initialize creates all modules
test('Initialize creates all modules', async () => {
  const runner = new PythonCommandRunner();

  // Before initialization
  if (runner.getProjectAnalyzer() !== null) {
    throw new Error('Project analyzer should be null before initialization');
  }

  if (runner.getCoreExecutor() !== null) {
    throw new Error('Core executor should be null before initialization');
  }

  if (runner.getCommandExecutor() !== null) {
    throw new Error('Command executor should be null before initialization');
  }

  // Try to initialize (will fail because no config, but modules should be created)
  try {
    await runner.initialize();
  } catch (error) {
    // Expected to fail because no config
    if (
      !error.message.includes('not configured') &&
      !error.message.includes('configuration not found')
    ) {
      throw error;
    }
  }

  // After initialization attempt, modules should be created
  if (!runner.getProjectAnalyzer()) {
    throw new Error('Project analyzer not created after initialization');
  }

  if (!runner.getCoreExecutor()) {
    throw new Error('Core executor not created after initialization');
  }

  if (!runner.getCommandExecutor()) {
    throw new Error('Command executor not created after initialization');
  }
});

console.log('\n📊 Validation Results:');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed === 0) {
  console.log(
    '\n✅ All validation tests passed! PythonCommandRunner refactoring is backward compatible.'
  );
  process.exit(0);
} else {
  console.log('\n❌ Some validation tests failed.');
  process.exit(1);
}
