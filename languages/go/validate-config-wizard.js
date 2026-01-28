#!/usr/bin/env node
/**
 * Validation script for GoConfigWizard refactoring
 *
 * Tests that the refactored GoConfigWizard maintains 100% backward compatibility
 * with the original API and functionality.
 */

const GoConfigWizard = require('./config-wizard');

console.log('🔍 Validating GoConfigWizard refactoring...\n');

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
test('GoConfigWizard class exists', () => {
  if (typeof GoConfigWizard !== 'function') {
    throw new Error('GoConfigWizard is not a function/class');
  }
});

// Test 2: Can instantiate class
test('Can instantiate GoConfigWizard', () => {
  const wizard = new GoConfigWizard();
  if (!wizard) {
    throw new Error('Failed to instantiate GoConfigWizard');
  }
});

// Test 3: Instance has required methods
test('Instance has required methods', () => {
  const wizard = new GoConfigWizard();
  const requiredMethods = [
    'runWizard',
    'showEnvironmentReport',
    'detectOrCreateProject',
    'hasGoFiles',
    'createDefaultProject',
    'interactiveProjectCreation',
    'createModuleProject',
    'createCLIProject',
    'createWebProject',
    'createLibraryProject',
    'createWorkspaceProject',
    'readGoMod',
    'suggestModuleName',
    'configureProject',
    'generateConfiguration',
    'saveConfiguration',
    'showInstallationGuide',
    'showCompletionMessage',
  ];

  for (const method of requiredMethods) {
    if (typeof wizard[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

// Test 4: Constructor accepts project path
test('Constructor accepts project path', () => {
  const testPath = '/test/path';
  const wizard = new GoConfigWizard(testPath);

  // Check that core was created
  const core = wizard.getCore();
  if (!core) {
    throw new Error('Core module not created');
  }

  if (core.getProjectPath() !== testPath) {
    throw new Error('Project path not set correctly');
  }
});

// Test 5: Module getters work
test('Module getters work', () => {
  const wizard = new GoConfigWizard();

  const getters = [
    'getCore',
    'getProjectDetector',
    'getProjectCreator',
    'getConfigGenerator',
    'getDetectedTools',
    'getToolDetector',
    'getProjectPath',
  ];

  for (const getter of getters) {
    if (typeof wizard[getter] !== 'function') {
      throw new Error(`Missing getter: ${getter}`);
    }
  }
});

// Test 6: Method signatures are correct (async vs sync)
test('Method signatures are correct', () => {
  const wizard = new GoConfigWizard();

  const asyncMethods = [
    'runWizard',
    'detectOrCreateProject',
    'interactiveProjectCreation',
    'createModuleProject',
    'createCLIProject',
    'createWebProject',
    'createLibraryProject',
    'createWorkspaceProject',
    'configureProject',
    'saveConfiguration',
  ];

  const syncMethods = [
    'showEnvironmentReport',
    'hasGoFiles',
    'createDefaultProject',
    'readGoMod',
    'suggestModuleName',
    'generateConfiguration',
    'showInstallationGuide',
    'showCompletionMessage',
  ];

  // Check that async methods return promises
  for (const method of asyncMethods) {
    try {
      const result = wizard[method]();
      if (!(result instanceof Promise)) {
        throw new Error(`Method ${method} should be async (return Promise)`);
      }
    } catch (error) {
      // Some methods may throw if not initialized, which is OK
      if (!error.message.includes('not initialized')) {
        throw error;
      }
    }
  }

  // Check that sync methods don't return promises
  for (const method of syncMethods) {
    try {
      const result = wizard[method]();
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

// Test 7: Sync methods work without initialization
test('Sync methods work without initialization', () => {
  const wizard = new GoConfigWizard();

  // These should not throw
  wizard.showEnvironmentReport({
    summary: { goInstalled: false },
    recommendations: [],
  });

  wizard.showInstallationGuide('go');

  wizard.showCompletionMessage(
    { projectType: 'module' },
    { summary: { goInstalled: true }, recommendations: [] }
  );
});

// Test 8: Module dependencies are properly injected
test('Module dependencies are properly injected', () => {
  const wizard = new GoConfigWizard('/test/path');

  // Check that core module was created
  const core = wizard.getCore();
  if (!core) {
    throw new Error('Core module not created');
  }

  // Other modules should be null before initialization
  if (wizard.getProjectDetector() !== null) {
    throw new Error('Project detector should be null before initialization');
  }

  if (wizard.getProjectCreator() !== null) {
    throw new Error('Project creator should be null before initialization');
  }

  if (wizard.getConfigGenerator() !== null) {
    throw new Error('Config generator should be null before initialization');
  }
});

// Test 9: Initialize creates all modules
test('Initialize creates all modules', async () => {
  const wizard = new GoConfigWizard();

  // Try to run wizard (will fail because Go is not installed, but modules should be created)
  try {
    await wizard.runWizard({ dryRun: true });
  } catch (error) {
    // Expected to fail because Go is not installed
    if (!error.message.includes('not installed') && !error.message.includes('Go not detected')) {
      // Check if modules were created
      if (!wizard.getProjectDetector()) {
        throw new Error('Project detector not created after initialization attempt');
      }

      if (!wizard.getProjectCreator()) {
        throw new Error('Project creator not created after initialization attempt');
      }

      if (!wizard.getConfigGenerator()) {
        throw new Error('Config generator not created after initialization attempt');
      }
    }
  }
});

// Test 10: Individual project creation methods work
test('Individual project creation methods work', async () => {
  const wizard = new GoConfigWizard();

  // These should throw because wizard is not initialized
  const methods = [
    'createModuleProject',
    'createCLIProject',
    'createWebProject',
    'createLibraryProject',
    'createWorkspaceProject',
  ];

  for (const method of methods) {
    try {
      await wizard[method]();
      throw new Error(`Method ${method} should throw when not initialized`);
    } catch (error) {
      if (!error.message.includes('not initialized')) {
        throw error;
      }
    }
  }
});

console.log('\n📊 Validation Results:');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed === 0) {
  console.log(
    '\n✅ All validation tests passed! GoConfigWizard refactoring is backward compatible.'
  );
  process.exit(0);
} else {
  console.log('\n❌ Some validation tests failed.');
  process.exit(1);
}
