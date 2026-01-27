/**
 * Tests for Clojure language implementation
 *
 * Run with: node tests/languages/clojure.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import Clojure modules
const ClojureToolDetector = require('../../languages/clojure/tool-detector');
const ClojureConfigWizard = require('../../languages/clojure/config-wizard');
const ClojureCommandRunner = require('../../scripts/clojure/command-runner-refactored');
const BuildToolDetector = require('../../scripts/clojure/command-runner-modules/build-tool-detector');

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
  console.log('\n=== Testing Clojure Implementation ===\n');

  let passed = 0;
  let failed = 0;

  // Create a temporary test directory
  const tempDir = path.join(os.tmpdir(), `opencode-clojure-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Test 1: Tool Detector instantiation
    console.log('Tool Detector:');

    if (
      test('can instantiate tool detector', () => {
        const detector = new ClojureToolDetector();
        assert.ok(detector instanceof ClojureToolDetector);
        assert.strictEqual(typeof detector.detectTools, 'function');
      })
    )
      passed++;
    else failed++;

    if (
      test('detectTools returns object with expected structure', async () => {
        const detector = new ClojureToolDetector();
        const tools = await detector.detectTools();

        assert.ok(tools !== null);
        assert.strictEqual(typeof tools, 'object');

        // Check for expected properties
        assert.ok('java' in tools);
        assert.ok('clojureCli' in tools);
        assert.ok('leiningen' in tools);
        assert.ok('boot' in tools);
        assert.ok('project' in tools);
        assert.ok('frameworks' in tools);
        assert.ok('linters' in tools);
        assert.ok('formatters' in tools);
        assert.ok('testFrameworks' in tools);
        assert.ok('replTypes' in tools);
        assert.ok('clojurescript' in tools);
      })
    )
      passed++;
    else failed++;

    // Test 2: Config Wizard instantiation
    console.log('\nConfig Wizard:');

    if (
      test('can instantiate config wizard', () => {
        const wizard = new ClojureConfigWizard(tempDir);
        assert.ok(wizard instanceof ClojureConfigWizard);
        assert.strictEqual(wizard.projectPath, tempDir);
      })
    )
      passed++;
    else failed++;

    if (
      test('has required methods', () => {
        const wizard = new ClojureConfigWizard();
        assert.strictEqual(typeof wizard.runWizard, 'function');
        assert.strictEqual(typeof wizard.showEnvironmentReport, 'function');
        assert.strictEqual(typeof wizard.checkMissingTools, 'function');
        assert.strictEqual(typeof wizard.showMissingTools, 'function');
        assert.strictEqual(typeof wizard.detectProjectType, 'function');
        assert.strictEqual(typeof wizard.configureProject, 'function');
        assert.strictEqual(typeof wizard.getProjectTypeLabel, 'function');
      })
    )
      passed++;
    else failed++;

    // Test 3: Command Runner
    console.log('\nCommand Runner:');

    if (
      test('can instantiate command runner', () => {
        const runner = new ClojureCommandRunner();
        assert.ok(runner instanceof ClojureCommandRunner);
        assert.strictEqual(typeof runner.initialize, 'function');
        assert.strictEqual(typeof runner.test, 'function');
        assert.strictEqual(typeof runner.build, 'function');
        assert.strictEqual(typeof runner.repl, 'function');
        assert.strictEqual(typeof runner.lint, 'function');
        assert.strictEqual(typeof runner.format, 'function');
      })
    )
      passed++;
    else failed++;

    // Test 4: Tool Detector methods
    console.log('\nTool Detector Methods:');

    if (
      test('generateEnvironmentReport returns string', async () => {
        const detector = new ClojureToolDetector();
        const report = await detector.generateEnvironmentReport();

        assert.strictEqual(typeof report, 'string');
        assert.ok(report.length > 0);
      })
    )
      passed++;
    else failed++;

    if (
      test('detectFrameworks returns array', async () => {
        const detector = new ClojureToolDetector();
        const frameworks = await detector.detectFrameworks();

        assert.ok(Array.isArray(frameworks));
      })
    )
      passed++;
    else failed++;

    if (
      test('detectProjectType returns object', async () => {
        const detector = new ClojureToolDetector();
        const projectType = await detector.detectProjectType();

        assert.ok(projectType !== null);
        assert.strictEqual(typeof projectType, 'object');
        assert.ok('type' in projectType);
      })
    )
      passed++;
    else failed++;

    // Test 5: Mock deps.edn detection
    console.log('\ndeps.edn Detection:');

    // Create a mock deps.edn
    // Write as EDN (simplified for test)
    const depsEdnContent = `{:deps {org.clojure/clojure {:mvn/version "1.11.1"}
            ring/ring-core {:mvn/version "1.9.6"}}
 :aliases {:test {:extra-paths ["test"]
                  :extra-deps {org.clojure/test.check {:mvn/version "1.1.1"}}}
           :dev {:extra-deps {nrepl/nrepl {:mvn/version "0.9.0"}}}}}`;

    fs.writeFileSync(path.join(tempDir, 'deps.edn'), depsEdnContent);

    if (
      test('detects deps.edn configuration', async () => {
        const detector = new ClojureToolDetector(tempDir);
        const tools = await detector.detectTools();

        assert.ok(tools.project);
        assert.ok(tools.project.hasDepsEdn);
        assert.ok(tools.project.dependencies);
        assert.ok(tools.project.aliases);
      })
    )
      passed++;
    else failed++;

    // Test 6: Mock project.clj detection
    console.log('\nproject.clj Detection:');

    // Create a mock project.clj
    const mockProjectClj = `(defproject test-project "0.1.0-SNAPSHOT"
  :description "A test Clojure project"
  :dependencies [[org.clojure/clojure "1.11.1"]
                 [ring/ring-core "1.9.6"]]
  :plugins [[lein-cljfmt "0.9.0"]]
  :profiles {:dev {:dependencies [[nrepl/nrepl "0.9.0"]]}}
  :aliases {"test" ["run" "-m" "test-runner"]})`;

    fs.writeFileSync(path.join(tempDir, 'project.clj'), mockProjectClj);

    if (
      test('detects project.clj configuration', async () => {
        const detector = new ClojureToolDetector(tempDir);
        const tools = await detector.detectTools();

        assert.ok(tools.project);
        assert.ok(tools.project.hasProjectClj);
        assert.ok(tools.project.dependencies);
        assert.ok(tools.project.plugins);
      })
    )
      passed++;
    else failed++;

    // Test 7: Command Runner methods
    console.log('\nCommand Runner Methods:');

    if (
      test('has expected command methods', () => {
        const runner = new ClojureCommandRunner();

        // Check for expected methods
        assert.strictEqual(typeof runner.run, 'function');
        assert.strictEqual(typeof runner.clean, 'function');
        assert.strictEqual(typeof runner.deps, 'function');
        assert.strictEqual(typeof runner.getClojureProjectInfo, 'function');
        assert.strictEqual(typeof runner.getProjectInfo, 'function');
      })
    )
      passed++;
    else failed++;

    if (
      test('getClojureProjectInfo returns object', async () => {
        const runner = new ClojureCommandRunner();

        // Mock the build tool detector to avoid actual tool detection
        runner.buildToolDetector = {
          detectedTools: {
            java: { installed: false },
            clojureCli: { installed: false },
            leiningen: { installed: false },
            boot: { installed: false },
            project: {},
            frameworks: [],
            linters: [],
            formatters: [],
            testFrameworks: [],
            replTypes: [],
            clojurescript: {},
          },
          buildTool: 'clojure-cli',
        };

        // Mock project manager
        runner.projectManager = {
          getClojureProjectInfo: (detectedTools, buildTool) => ({
            tools: detectedTools,
            buildTool: buildTool,
            project: detectedTools.project,
            frameworks: detectedTools.frameworks,
            linters: detectedTools.linters,
            formatters: detectedTools.formatters,
            testFrameworks: detectedTools.testFrameworks,
            replTypes: detectedTools.replTypes,
            clojurescript: detectedTools.clojurescript,
          }),
        };

        // Mock initialized flag
        runner.initialized = true;

        const projectInfo = runner.getClojureProjectInfo();

        assert.ok(projectInfo !== null);
        assert.strictEqual(typeof projectInfo, 'object');
        assert.ok('tools' in projectInfo);
        assert.ok('buildTool' in projectInfo);
        assert.strictEqual(projectInfo.buildTool, 'clojure-cli');
      })
    )
      passed++;
    else failed++;

    if (
      test('build tool detector determines build tool', async () => {
        const BuildToolDetector = require('../../scripts/clojure/command-runner-modules/build-tool-detector');
        const detector = new BuildToolDetector();

        // Test with mock tools
        detector.detectedTools = {
          clojureCli: { installed: true },
          leiningen: { installed: false },
          boot: { installed: false },
          project: { hasDepsEdn: true, hasProjectClj: false, hasBuildBoot: false },
        };

        const buildTool = detector.determineBuildTool(detector.detectedTools);

        assert.ok(buildTool !== null);
        assert.strictEqual(typeof buildTool, 'string');
        assert.strictEqual(buildTool, 'clojure-cli');
      })
    )
      passed++;
    else failed++;

    // Test 8: Command files exist
    console.log('\nCommand Files:');

    const commandFiles = [
      'clojure-setup.js',
      'clojure-test.js',
      'clojure-build.js',
      'clojure-repl.js',
      'clojure-lint.js',
      'clojure-format.js',
      'clojure-deps.js',
      'clojure-run.js',
      'clojure-clean.js',
    ];

    commandFiles.forEach((fileName) => {
      if (
        test(`command file ${fileName} exists`, () => {
          const filePath = path.join(__dirname, '../../scripts/commands', fileName);
          assert.ok(fs.existsSync(filePath));

          const content = fs.readFileSync(filePath, 'utf8');
          assert.ok(content.includes('#!/usr/bin/env node'));
          assert.ok(content.includes('main'));

          // Check for appropriate import based on command type
          if (fileName === 'clojure-setup.js') {
            assert.ok(content.includes('ClojureConfigWizard'));
          } else {
            assert.ok(content.includes('ClojureCommandRunner'));
          }
        })
      )
        passed++;
      else failed++;
    });
  } finally {
    // Clean up
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  // Test 9: Integration
  console.log('\nIntegration:');

  if (
    test('tool detector and config wizard work together', async () => {
      const detector = new ClojureToolDetector();
      const wizard = new ClojureConfigWizard();

      const tools = await detector.detectTools();
      const analysis = await wizard.analyzeEnvironment();

      assert.ok(tools !== null);
      assert.ok(analysis !== null);
      assert.ok(analysis.tools !== null);
    })
  )
    passed++;
  else failed++;

  if (
    test('command runner uses build tool detector', () => {
      const runner = new ClojureCommandRunner();

      // Check that build tool detector is properly initialized
      assert.ok(runner.buildToolDetector !== null);
      assert.ok(runner.buildToolDetector instanceof BuildToolDetector);
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
