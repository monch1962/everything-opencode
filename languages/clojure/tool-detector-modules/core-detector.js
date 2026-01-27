#!/usr/bin/env node
/**
 * Core Detector Module for Clojure Tool Detector
 *
 * Detects core runtime components: Java, Clojure CLI, Leiningen, Boot
 */

const { runCommand } = require('../../../scripts/lib/utils');

class CoreDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect Java runtime
   */
  async detectJava() {
    try {
      const result = await runCommand('java', ['-version']);
      if (result.success) {
        // Parse Java version from stderr (java -version outputs to stderr)
        const versionOutput = result.stderr || result.stdout || '';
        const versionMatch =
          versionOutput.match(/version\s+"([^"]+)"/) || versionOutput.match(/version\s+([^\s]+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('java'),
        };
      }
    } catch (error) {
      // java not found
    }

    return { installed: false };
  }

  /**
   * Detect Clojure CLI tools
   */
  async detectClojure() {
    try {
      const result = await runCommand('clojure', ['--version']);
      if (result.success) {
        // Parse Clojure version
        const versionMatch =
          result.stdout.match(/Clojure CLI version (\d+\.\d+\.\d+)/) ||
          result.stdout.match(/Clojure version (\d+\.\d+\.\d+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('clojure'),
          type: 'cli',
        };
      }
    } catch (error) {
      // clojure not found
    }

    return { installed: false };
  }

  /**
   * Detect Leiningen build tool
   */
  async detectLeiningen() {
    try {
      const result = await runCommand('lein', ['version']);
      if (result.success) {
        // Parse Leiningen version
        const versionMatch = result.stdout.match(/Leiningen (\d+\.\d+\.\d+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('lein'),
          type: 'leiningen',
        };
      }
    } catch (error) {
      // lein not found
    }

    return { installed: false };
  }

  /**
   * Detect Boot build tool
   */
  async detectBoot() {
    try {
      const result = await runCommand('boot', ['--version']);
      if (result.success) {
        // Parse Boot version
        const versionMatch = result.stdout.match(/Boot (\d+\.\d+\.\d+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('boot'),
          type: 'boot',
        };
      }
    } catch (error) {
      // boot not found
    }

    return { installed: false };
  }

  /**
   * Get command path using which/where
   */
  async getCommandPath(command) {
    try {
      const isWindows = process.platform === 'win32';
      const whichCommand = isWindows ? 'where' : 'which';
      const result = await runCommand(whichCommand, [command]);

      if (result.success && result.stdout) {
        return result.stdout.trim().split('\n')[0];
      }
    } catch (error) {
      // command not found
    }

    return null;
  }
}

module.exports = CoreDetector;
