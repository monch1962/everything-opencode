#!/usr/bin/env node
/**
 * Build Tool Detector for Clojure Command Runner
 *
 * Detects and manages Clojure build tools (Clojure CLI, Leiningen, Boot)
 */

const path = require('path');
const fs = require('fs');
const { LoggingUtils } = require('../../lib');

class BuildToolDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.detectedTools = null;
    this.buildTool = null;
  }

  /**
   * Detect available build tools
   */
  async detectTools() {
    const tools = {
      clojureCli: await this.detectClojureCli(),
      leiningen: await this.detectLeiningen(),
      boot: await this.detectBoot(),
      project: this.detectProjectFiles(),
    };

    this.detectedTools = tools;
    this.buildTool = this.determineBuildTool(tools);

    return tools;
  }

  /**
   * Detect Clojure CLI (deps.edn)
   */
  async detectClojureCli() {
    const result = {
      installed: false,
      version: null,
      path: null,
      depsEdnPath: null,
      hasDepsEdn: false,
    };

    try {
      // Check if clojure command exists
      const { spawn } = require('child_process');
      const clojureCheck = spawn('which', ['clojure'], { stdio: 'pipe' });

      await new Promise((resolve) => {
        clojureCheck.on('close', (code) => {
          result.installed = code === 0;
          resolve();
        });
      });

      if (result.installed) {
        // Get version
        const versionCheck = spawn('clojure', ['--version'], { stdio: 'pipe' });
        let output = '';

        versionCheck.stdout.on('data', (data) => {
          output += data.toString();
        });

        await new Promise((resolve) => {
          versionCheck.on('close', () => {
            const match = output.match(/Clojure CLI version (\d+\.\d+\.\d+)/);
            if (match) {
              result.version = match[1];
            }
            resolve();
          });
        });

        // Check for deps.edn
        const depsEdnPath = path.join(this.projectPath, 'deps.edn');
        result.hasDepsEdn = fs.existsSync(depsEdnPath);
        result.depsEdnPath = result.hasDepsEdn ? depsEdnPath : null;
      }
    } catch (error) {
      LoggingUtils.debug(`Clojure CLI detection error: ${error.message}`);
    }

    return result;
  }

  /**
   * Detect Leiningen (project.clj)
   */
  async detectLeiningen() {
    const result = {
      installed: false,
      version: null,
      path: null,
      projectCljPath: null,
      hasProjectClj: false,
    };

    try {
      // Check if lein command exists
      const { spawn } = require('child_process');
      const leinCheck = spawn('which', ['lein'], { stdio: 'pipe' });

      await new Promise((resolve) => {
        leinCheck.on('close', (code) => {
          result.installed = code === 0;
          resolve();
        });
      });

      if (result.installed) {
        // Get version
        const versionCheck = spawn('lein', ['version'], { stdio: 'pipe' });
        let output = '';

        versionCheck.stdout.on('data', (data) => {
          output += data.toString();
        });

        await new Promise((resolve) => {
          versionCheck.on('close', () => {
            const match = output.match(/Leiningen (\d+\.\d+\.\d+)/);
            if (match) {
              result.version = match[1];
            }
            resolve();
          });
        });

        // Check for project.clj
        const projectCljPath = path.join(this.projectPath, 'project.clj');
        result.hasProjectClj = fs.existsSync(projectCljPath);
        result.projectCljPath = result.hasProjectClj ? projectCljPath : null;
      }
    } catch (error) {
      LoggingUtils.debug(`Leiningen detection error: ${error.message}`);
    }

    return result;
  }

  /**
   * Detect Boot (build.boot)
   */
  async detectBoot() {
    const result = {
      installed: false,
      version: null,
      path: null,
      buildBootPath: null,
      hasBuildBoot: false,
    };

    try {
      // Check if boot command exists
      const { spawn } = require('child_process');
      const bootCheck = spawn('which', ['boot'], { stdio: 'pipe' });

      await new Promise((resolve) => {
        bootCheck.on('close', (code) => {
          result.installed = code === 0;
          resolve();
        });
      });

      if (result.installed) {
        // Get version
        const versionCheck = spawn('boot', ['--version'], { stdio: 'pipe' });
        let output = '';

        versionCheck.stdout.on('data', (data) => {
          output += data.toString();
        });

        await new Promise((resolve) => {
          versionCheck.on('close', () => {
            const match = output.match(/Boot (\d+\.\d+\.\d+)/);
            if (match) {
              result.version = match[1];
            }
            resolve();
          });
        });

        // Check for build.boot
        const buildBootPath = path.join(this.projectPath, 'build.boot');
        result.hasBuildBoot = fs.existsSync(buildBootPath);
        result.buildBootPath = result.hasBuildBoot ? buildBootPath : null;
      }
    } catch (error) {
      LoggingUtils.debug(`Boot detection error: ${error.message}`);
    }

    return result;
  }

  /**
   * Detect project files
   */
  detectProjectFiles() {
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');
    const buildBootPath = path.join(this.projectPath, 'build.boot');

    return {
      hasDepsEdn: fs.existsSync(depsEdnPath),
      hasProjectClj: fs.existsSync(projectCljPath),
      hasBuildBoot: fs.existsSync(buildBootPath),
      depsEdnPath: fs.existsSync(depsEdnPath) ? depsEdnPath : null,
      projectCljPath: fs.existsSync(projectCljPath) ? projectCljPath : null,
      buildBootPath: fs.existsSync(buildBootPath) ? buildBootPath : null,
    };
  }

  /**
   * Determine which build tool to use
   */
  determineBuildTool(tools) {
    if (!tools) {
      throw new Error('Tools not detected. Call detectTools() first.');
    }

    // Check for Clojure CLI (deps.edn)
    if (tools.clojureCli?.installed && tools.project?.hasDepsEdn) {
      return 'clojure-cli';
    }

    // Check for Leiningen (project.clj)
    if (tools.leiningen?.installed && tools.project?.hasProjectClj) {
      return 'leiningen';
    }

    // Check for Boot (build.boot)
    if (tools.boot?.installed && tools.project?.hasBuildBoot) {
      return 'boot';
    }

    // Default to Clojure CLI if available
    if (tools.clojureCli?.installed) {
      return 'clojure-cli';
    }

    // Default to Leiningen if available
    if (tools.leiningen?.installed) {
      return 'leiningen';
    }

    // Default to Boot if available
    if (tools.boot?.installed) {
      return 'boot';
    }

    // No build tool found
    return null;
  }

  /**
   * Get build tool information
   */
  getBuildToolInfo() {
    if (!this.detectedTools || !this.buildTool) {
      return null;
    }

    const toolMap = {
      'clojure-cli': this.detectedTools.clojureCli,
      leiningen: this.detectedTools.leiningen,
      boot: this.detectedTools.boot,
    };

    const tool = toolMap[this.buildTool];
    if (!tool) {
      return null;
    }

    return {
      name: this.buildTool,
      version: tool.version,
      installed: tool.installed,
      projectFile: this.getProjectFilePath(),
    };
  }

  /**
   * Get project file path for current build tool
   */
  getProjectFilePath() {
    if (!this.buildTool || !this.detectedTools?.project) {
      return null;
    }

    switch (this.buildTool) {
      case 'clojure-cli':
        return this.detectedTools.project.depsEdnPath;
      case 'leiningen':
        return this.detectedTools.project.projectCljPath;
      case 'boot':
        return this.detectedTools.project.buildBootPath;
      default:
        return null;
    }
  }

  /**
   * Validate that essential tools are available
   */
  async validateEssentialTools() {
    if (!this.detectedTools) {
      throw new Error('Tools not detected. Call detectTools() first.');
    }

    const errors = [];
    const warnings = [];

    // Check if any build tool is installed
    if (
      !this.detectedTools.clojureCli.installed &&
      !this.detectedTools.leiningen.installed &&
      !this.detectedTools.boot.installed
    ) {
      errors.push('No Clojure build tool found. Please install Clojure CLI, Leiningen, or Boot.');
    }

    // Check if project file matches installed tool
    if (this.detectedTools.project.hasDepsEdn && !this.detectedTools.clojureCli.installed) {
      warnings.push('deps.edn found but Clojure CLI is not installed.');
    }

    if (this.detectedTools.project.hasProjectClj && !this.detectedTools.leiningen.installed) {
      warnings.push('project.clj found but Leiningen is not installed.');
    }

    if (this.detectedTools.project.hasBuildBoot && !this.detectedTools.boot.installed) {
      warnings.push('build.boot found but Boot is not installed.');
    }

    // Check Java installation (required for all Clojure tools)
    try {
      const { spawn } = require('child_process');
      const javaCheck = spawn('which', ['java'], { stdio: 'pipe' });

      await new Promise((resolve) => {
        javaCheck.on('close', (code) => {
          if (code !== 0) {
            warnings.push('Java not found. Clojure tools require Java.');
          }
          resolve();
        });
      });
    } catch (error) {
      warnings.push(`Java check failed: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      buildTool: this.buildTool,
      tools: this.detectedTools,
    };
  }

  /**
   * Get recommended build tool based on project structure
   */
  getRecommendedBuildTool() {
    if (!this.detectedTools) {
      return null;
    }

    // Prefer tool that matches project file
    if (this.detectedTools.project.hasDepsEdn && this.detectedTools.clojureCli.installed) {
      return 'clojure-cli';
    }

    if (this.detectedTools.project.hasProjectClj && this.detectedTools.leiningen.installed) {
      return 'leiningen';
    }

    if (this.detectedTools.project.hasBuildBoot && this.detectedTools.boot.installed) {
      return 'boot';
    }

    // Fall back to any installed tool
    if (this.detectedTools.clojureCli.installed) {
      return 'clojure-cli';
    }

    if (this.detectedTools.leiningen.installed) {
      return 'leiningen';
    }

    if (this.detectedTools.boot.installed) {
      return 'boot';
    }

    return null;
  }

  /**
   * Get installation instructions for missing tools
   */
  getInstallationInstructions() {
    const instructions = [];

    if (!this.detectedTools?.clojureCli.installed) {
      instructions.push({
        tool: 'Clojure CLI',
        instructions: [
          'macOS: brew install clojure/tools/clojure',
          'Linux: See https://clojure.org/guides/getting_started',
          'Windows: Use Windows Subsystem for Linux (WSL)',
        ],
      });
    }

    if (!this.detectedTools?.leiningen.installed) {
      instructions.push({
        tool: 'Leiningen',
        instructions: [
          'Download lein script: https://leiningen.org/#install',
          'Place in ~/bin or /usr/local/bin',
          'Make executable: chmod +x ~/bin/lein',
        ],
      });
    }

    if (!this.detectedTools?.boot.installed) {
      instructions.push({
        tool: 'Boot',
        instructions: [
          'Download boot script: https://github.com/boot-clj/boot#install',
          'Place in ~/bin or /usr/local/bin',
          'Make executable: chmod +x ~/bin/boot',
        ],
      });
    }

    return instructions;
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport() {
    if (!this.detectedTools) {
      return 'Tools not detected. Call detectTools() first.';
    }

    const lines = [];
    lines.push('Clojure Environment Report');
    lines.push('==========================');
    lines.push('');

    // Build tools
    lines.push('Build Tools:');
    lines.push(
      `  Clojure CLI: ${this.detectedTools.clojureCli.installed ? `✓ ${this.detectedTools.clojureCli.version || 'unknown'}` : '✗ Not installed'},`,
    );
    lines.push(
      `  Leiningen: ${this.detectedTools.leiningen.installed ? `✓ ${this.detectedTools.leiningen.version || 'unknown'}` : '✗ Not installed'},`,
    );
    lines.push(
      `  Boot: ${this.detectedTools.boot.installed ? `✓ ${this.detectedTools.boot.version || 'unknown'}` : '✗ Not installed'},`,
    );
    lines.push('');

    // Project files
    lines.push('Project Files:');
    lines.push(`  deps.edn: ${this.detectedTools.project.hasDepsEdn ? '✓ Found' : '✗ Not found'},`);
    lines.push(
      `  project.clj: ${this.detectedTools.project.hasProjectClj ? '✓ Found' : '✗ Not found'},`,
    );
    lines.push(
      `  build.boot: ${this.detectedTools.project.hasBuildBoot ? '✓ Found' : '✗ Not found'},`,
    );
    lines.push('');

    // Selected build tool
    lines.push('Selected Build Tool:');
    lines.push(`  ${this.buildTool ? `✓ ${this.buildTool}` : '✗ No suitable build tool found'}`);

    if (this.buildTool) {
      const toolInfo = this.getBuildToolInfo();
      if (toolInfo) {
        lines.push(`  Version: ${toolInfo.version || 'unknown'}`);
        lines.push(`  Project file: ${toolInfo.projectFile || 'none'}`);
      }
    }

    return lines.join('\n');
  }
}

module.exports = BuildToolDetector;
