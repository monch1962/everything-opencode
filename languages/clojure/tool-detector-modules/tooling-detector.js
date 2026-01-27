#!/usr/bin/env node
/**
 * Tooling Detector Module for Clojure Tool Detector
 *
 * Detects linters, formatters, and test frameworks
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('../../../scripts/lib/utils');

class ToolingDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect linters
   */
  async detectLinters() {
    const linters = [];

    // Check for clj-kondo
    try {
      const result = await runCommand('clj-kondo', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/clj-kondo v(\d+\.\d+\.\d+)/);
        linters.push({
          name: 'clj-kondo',
          description: 'Clojure linter and static analyzer',
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          configFiles: this.findConfigFiles(['.clj-kondo', 'clj-kondo.edn']),
        });
      }
    } catch (error) {
      // clj-kondo not found
    }

    // Check for eastwood
    try {
      const result = await runCommand('lein', ['run', '-m', 'eastwood.lint']);
      if (result.success || result.stderr?.includes('eastwood')) {
        linters.push({
          name: 'eastwood',
          description: 'Leiningen plugin for linting',
          installed: true,
          version: 'unknown',
          configFiles: this.findConfigFiles(['.eastwood']),
        });
      }
    } catch (error) {
      // eastwood not found or not configured
    }

    // Check for kibit
    try {
      const result = await runCommand('lein', ['kibit']);
      if (result.success || result.stdout?.includes('kibit')) {
        linters.push({
          name: 'kibit',
          description: 'Static code analyzer for Clojure',
          installed: true,
          version: 'unknown',
          configFiles: this.findConfigFiles(['.kibit']),
        });
      }
    } catch (error) {
      // kibit not found or not configured
    }

    // Check for bikeshed
    try {
      const result = await runCommand('lein', ['bikeshed']);
      if (result.success || result.stdout?.includes('bikeshed')) {
        linters.push({
          name: 'bikeshed',
          description: 'Leiningen plugin for code style checking',
          installed: true,
          version: 'unknown',
          configFiles: this.findConfigFiles(['.bikeshed']),
        });
      }
    } catch (error) {
      // bikeshed not found or not configured
    }

    return linters;
  }

  /**
   * Detect formatters
   */
  async detectFormatters() {
    const formatters = [];

    // Check for zprint
    try {
      const result = await runCommand('zprint', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/zprint (\d+\.\d+\.\d+)/);
        formatters.push({
          name: 'zprint',
          description: 'Code formatter for Clojure',
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          configFiles: this.findConfigFiles(['.zprint.edn', 'zprint.edn']),
        });
      }
    } catch (error) {
      // zprint not found
    }

    // Check for cljfmt (via lein)
    try {
      const result = await runCommand('lein', ['cljfmt', 'check']);
      if (result.success || result.stdout?.includes('cljfmt')) {
        formatters.push({
          name: 'cljfmt',
          description: 'Clojure code formatting tool',
          installed: true,
          version: 'unknown',
          configFiles: this.findConfigFiles(['.cljfmt.edn', 'cljfmt.edn']),
        });
      }
    } catch (error) {
      // cljfmt not found or not configured
    }

    return formatters;
  }

  /**
   * Detect test frameworks
   */
  async detectTestFrameworks() {
    const testFrameworks = [];

    // Check project files for test dependencies
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    // Common test frameworks
    const commonFrameworks = [
      { name: 'clojure.test', description: 'Built-in Clojure test framework' },
      { name: 'midje', description: 'Test framework with readable syntax' },
      { name: 'expectations', description: 'Minimalist testing framework' },
      { name: 'clojure.test.check', description: 'Property-based testing' },
      { name: 'kaocha', description: 'Next generation test runner' },
      { name: 'cognitect.test-runner', description: 'Simple test runner for deps.edn' },
    ];

    // Check for kaocha
    try {
      const result = await runCommand('bin/kaocha', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/kaocha (\d+\.\d+\.\d+)/);
        testFrameworks.push({
          name: 'kaocha',
          description: 'Next generation test runner',
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          configFiles: this.findConfigFiles(['tests.edn', '.kaocha']),
        });
      }
    } catch (error) {
      // kaocha not found in bin/
    }

    // Check for kaocha via lein
    try {
      const result = await runCommand('lein', ['kaocha', '--version']);
      if (result.success) {
        testFrameworks.push({
          name: 'kaocha',
          description: 'Next generation test runner (Leiningen)',
          installed: true,
          version: 'unknown',
          configFiles: this.findConfigFiles(['tests.edn', '.kaocha']),
        });
      }
    } catch (error) {
      // kaocha not found via lein
    }

    // Always include clojure.test as it's built-in
    testFrameworks.push({
      name: 'clojure.test',
      description: 'Built-in Clojure test framework',
      installed: true,
      version: 'built-in',
      configFiles: [],
    });

    return testFrameworks;
  }

  /**
   * Find configuration files in project
   */
  findConfigFiles(patterns) {
    const configFiles = [];

    for (const pattern of patterns) {
      const filePath = path.join(this.projectPath, pattern);
      if (fs.existsSync(filePath)) {
        configFiles.push(pattern);
      }
    }

    return configFiles;
  }
}

module.exports = ToolingDetector;
