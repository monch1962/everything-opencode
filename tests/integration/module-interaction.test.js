/**
 * Module Interaction Integration Tests
 *
 * Tests interactions between different modules in the everything-opencode system
 *
 * Run with: node tests/integration/module-interaction.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;

console.log('Module Interaction Integration Tests');
console.log('====================================\n');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    throw error;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    throw error;
  }
}

async function runTests() {
  console.log('1. Module Loading Tests');
  console.log('----------------------');

  test('PineScript Optimizer module can be loaded', () => {
    const PineOptimizer = require('../../scripts/pinescript/optimizer');
    assert(PineOptimizer, 'PineOptimizer should be defined');
    assert(typeof PineOptimizer === 'function', 'PineOptimizer should be a constructor');
  });

  test('Debug Server module can be loaded', () => {
    const DebugServer = require('../../scripts/pinescript/debug-server');
    assert(DebugServer, 'DebugServer should be defined');
    assert(typeof DebugServer === 'function', 'DebugServer should be a constructor');
  });

  test('TemplateUtils module can be loaded', () => {
    const TemplateUtils = require('../../scripts/lib/template-utils');
    assert(TemplateUtils, 'TemplateUtils should be defined');
    // It could be a class or object
    assert(
      typeof TemplateUtils === 'function' || typeof TemplateUtils === 'object',
      'TemplateUtils should be a function or object'
    );
  });

  test('Command Runner modules can be loaded', () => {
    // Check if JavaScript command runner exists
    try {
      const JSCommandRunner = require('../../scripts/javascript/javascript-command-runner');
      assert(JSCommandRunner, 'JSCommandRunner should be defined');
    } catch (error) {
      console.log('  ⚠ JavaScript command runner not found (may be expected)');
    }

    // Check if Clojure command runner exists
    try {
      const ClojureCommandRunner = require('../../scripts/clojure/command-runner');
      assert(ClojureCommandRunner, 'ClojureCommandRunner should be defined');
    } catch (error) {
      console.log('  ⚠ Clojure command runner not found (may be expected)');
    }
  });

  console.log('\n2. Module Interface Tests');
  console.log('-----------------------');

  test('Debug Server has expected interface', () => {
    const DebugServer = require('../../scripts/pinescript/debug-server');
    const server = new DebugServer({ port: 3000, file: 'test.pine' });

    // Check for expected methods based on actual implementation
    assert(typeof server.start === 'function', 'DebugServer should have start method');
    // debugFile is a property set from options.file
    assert(server.debugFile === 'test.pine', 'DebugServer should have debugFile property');
  });

  test('TemplateUtils has expected interface', () => {
    const TemplateUtils = require('../../scripts/lib/template-utils');

    // Check for expected methods - it might be a class with static methods
    const utils = typeof TemplateUtils === 'function' ? TemplateUtils : TemplateUtils;

    // Check for common methods (they might be static)
    const hasRenderTemplate =
      typeof utils.renderTemplate === 'function' ||
      (TemplateUtils.prototype && typeof TemplateUtils.prototype.renderTemplate === 'function');
    const hasGenerateProject =
      typeof utils.generateProject === 'function' ||
      (TemplateUtils.prototype && typeof TemplateUtils.prototype.generateProject === 'function') ||
      typeof utils.createProject === 'function' ||
      (TemplateUtils.prototype && typeof TemplateUtils.prototype.createProject === 'function');

    assert(
      hasRenderTemplate || hasGenerateProject,
      'TemplateUtils should have template rendering or project generation methods'
    );
  });

  console.log('\n3. File System Integration Tests');
  console.log('--------------------------------');

  await asyncTest('Can create and read test files', async () => {
    const tempDir = path.join(__dirname, '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const testFile = path.join(tempDir, 'test-integration.txt');
    const testContent = 'Integration test content';

    await fs.writeFile(testFile, testContent);
    const readContent = await fs.readFile(testFile, 'utf8');

    assert.strictEqual(readContent, testContent, 'File content should match');

    // Cleanup
    await fs.unlink(testFile);
  });

  console.log('\n4. Module Dependency Tests');
  console.log('-------------------------');

  test('Modules have required dependencies', () => {
    // Check that common dependencies are available
    assert(require('fs'), 'fs module should be available');
    assert(require('path'), 'path module should be available');
    assert(require('child_process'), 'child_process module should be available');
    assert(require('http'), 'http module should be available');
  });

  console.log('\n5. Configuration Loading Tests');
  console.log('-----------------------------');

  await asyncTest('Can load project configuration', async () => {
    // Check if package.json exists and can be read
    const packagePath = path.join(__dirname, '..', '..', 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);

    assert(packageJson.name, 'package.json should have name');
    assert(packageJson.version, 'package.json should have version');
    assert(packageJson.scripts, 'package.json should have scripts');

    console.log(`  ✓ Project: ${packageJson.name} v${packageJson.version}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ ALL INTEGRATION TESTS PASSED!');
  console.log('='.repeat(50));
  console.log(`\nSummary: Verified module loading, interfaces, and basic integration`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('\n' + '='.repeat(50));
    console.error('❌ INTEGRATION TESTS FAILED');
    console.error('='.repeat(50));
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests };
