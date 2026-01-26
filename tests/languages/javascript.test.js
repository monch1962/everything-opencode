/**
 * Tests for JavaScript/TypeScript language implementation
 *
 * Run with: node tests/languages/javascript.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import the modules
const JSConfigWizard = require('../../languages/javascript/config-wizard');
const JSToolDetector = require('../../languages/javascript/tool-detector');
const JSCommandRunner = require('../../scripts/javascript/command-runner');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Test suite
async function runTests() {
  console.log('\n=== Testing JavaScript/TypeScript Implementation ===\n');

  let passed = 0;
  let failed = 0;

  // Create a temporary test directory
  const tempDir = path.join(os.tmpdir(), `opencode-js-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Test 1: Tool Detector instantiation
    console.log('Tool Detector:');

    if (
      test('can instantiate tool detector', () => {
        const detector = new JSToolDetector();
        assert.ok(detector instanceof JSToolDetector);
        assert.strictEqual(typeof detector.detectTools, 'function');
      })
    )
      passed++;
    else failed++;

    if (
      test('detectTools returns object with expected structure', async () => {
        const detector = new JSToolDetector();
        const tools = await detector.detectTools();

        assert.ok(tools !== null);
        assert.strictEqual(typeof tools, 'object');

        // Check for expected properties
        assert.ok('node' in tools);
        assert.ok('npm' in tools);
        assert.ok('packageManager' in tools);
        assert.ok('typescript' in tools);
        assert.ok('eslint' in tools);
        assert.ok('prettier' in tools);
        assert.ok('jest' in tools);
        assert.ok('frameworks' in tools);
      })
    )
      passed++;
    else failed++;

    // Test 2: Config Wizard instantiation
    console.log('\nConfig Wizard:');

    if (
      test('can instantiate config wizard', () => {
        const wizard = new JSConfigWizard(tempDir);
        assert.ok(wizard instanceof JSConfigWizard);
        assert.strictEqual(wizard.projectPath, tempDir);
      })
    )
      passed++;
    else failed++;

    if (
      test('has required methods', () => {
        const wizard = new JSConfigWizard();
        assert.strictEqual(typeof wizard.runWizard, 'function');
        assert.strictEqual(typeof wizard.showEnvironmentReport, 'function');
        assert.strictEqual(typeof wizard.detectProjectType, 'function');
        assert.strictEqual(typeof wizard.generateConfiguration, 'function');
        assert.strictEqual(typeof wizard.generateRecommendations, 'function');
      })
    )
      passed++;
    else failed++;

    // Test 3: Command Runner
    console.log('\nCommand Runner:');

    if (
      test('can instantiate command runner', () => {
        const runner = new JSCommandRunner();
        assert.ok(runner instanceof JSCommandRunner);
        assert.strictEqual(typeof runner.initialize, 'function');
        assert.strictEqual(typeof runner.test, 'function');
        assert.strictEqual(typeof runner.lint, 'function');
        assert.strictEqual(typeof runner.build, 'function');
        assert.strictEqual(typeof runner.dev, 'function');
      })
    )
      passed++;
    else failed++;

    // Test 4: Tool Detector methods
    console.log('\nTool Detector Methods:');

    if (
      test('generateEnvironmentReport returns string', async () => {
        const detector = new JSToolDetector();
        const tools = await detector.detectTools();
        const report = detector.generateEnvironmentReport(tools);

        assert.strictEqual(typeof report, 'string');
        assert.ok(report.length > 0);
      })
    )
      passed++;
    else failed++;

    if (
      test('detectFrameworks returns array', async () => {
        const detector = new JSToolDetector();
        const frameworks = await detector.detectFrameworks(tempDir);

        assert.ok(Array.isArray(frameworks));
      })
    )
      passed++;
    else failed++;

    // Test 5: Mock package.json detection
    console.log('\nPackage.json Detection:');

    // Create a mock package.json
    const mockPackageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        test: 'jest',
        build: 'tsc',
        dev: 'node server.js',
      },
      dependencies: {
        react: '^18.0.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        eslint: '^8.0.0',
      },
    };

    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(mockPackageJson, null, 2));

    if (
      test('detects package.json scripts', async () => {
        const detector = new JSToolDetector(tempDir);
        const tools = await detector.detectTools();

        assert.ok(tools.hasPackageJson);
        assert.ok(tools.packageJson);
        assert.strictEqual(tools.packageJson.name, 'test-project');
        assert.ok(tools.packageJson.scripts);
      })
    )
      passed++;
    else failed++;

    // Test 6: Framework detection from package.json
    if (
      test('detects React from dependencies', async () => {
        const detector = new JSToolDetector(tempDir);
        const frameworks = await detector.detectFrameworks(tempDir);

        // Should detect React
        assert.ok(frameworks.includes('react'));
      })
    )
      passed++;
    else failed++;

    // Test 7: TypeScript detection
    console.log('\nTypeScript Detection:');

    // Create a mock tsconfig.json
    const mockTsConfig = {
      compilerOptions: {
        target: 'es2020',
        module: 'commonjs',
      },
    };

    fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), JSON.stringify(mockTsConfig, null, 2));

    if (
      test('detects TypeScript config', async () => {
        const detector = new JSToolDetector(tempDir);
        const tools = await detector.detectTools();

        assert.ok(tools.hasTypeScriptConfig);
        assert.ok(tools.typescriptConfig);
      })
    )
      passed++;
    else failed++;
  } finally {
    // Clean up
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  // Test 8: Command Runner has expected methods
  console.log('\nCommand Runner Methods:');

  if (
    test('has expected command methods', () => {
      const runner = new JSCommandRunner();

      // Check for expected methods
      assert.strictEqual(typeof runner.typecheck, 'function');
      assert.strictEqual(typeof runner.install, 'function');
      assert.strictEqual(typeof runner.clean, 'function');
      assert.strictEqual(typeof runner.run, 'function');
      assert.strictEqual(typeof runner.getProjectInfo, 'function');
    })
  )
    passed++;
  else failed++;

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
