/**
 * JavaScript/TypeScript Tool Detector
 *
 * Detect JavaScript/TypeScript development tools with cross-platform support
 */

const { spawn } = require('child_process');
const { commandExists, runCommand } = require('../../scripts/lib/utils');
const PlatformDetector = require('../../scripts/lib/platform-detector');

class JSToolDetector {
  constructor() {
    this.platformDetector = new PlatformDetector();
    this.tools = [
      'node',
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'typescript',
      'eslint',
      'prettier',
      'jest',
      'mocha',
      'vitest',
      'webpack',
      'vite',
      'rollup',
      'parcel',
      'tsc',
      'ts-node',
      'nodemon',
    ];
  }

  /**
   * Detect all JavaScript/TypeScript tools
   */
  async detectTools() {
    const detectedTools = {};

    // Detect each tool
    for (const tool of this.tools) {
      detectedTools[tool] = await this.detectTool(tool);
    }

    // Detect package manager from project
    const packageManager = await this.detectPackageManager();
    if (packageManager) {
      detectedTools.packageManager = packageManager;
    }

    // Detect frameworks
    const frameworks = await this.detectFrameworks();
    if (frameworks.length > 0) {
      detectedTools.frameworks = frameworks;
    }

    // Detect build tools
    const buildTools = await this.detectBuildTools();
    if (buildTools.length > 0) {
      detectedTools.buildTools = buildTools;
    }

    return detectedTools;
  }

  /**
   * Detect a specific tool
   */
  async detectTool(toolName) {
    const toolInfo = {
      name: toolName,
      installed: false,
      version: null,
      path: null,
    };

    try {
      // Special handling for TypeScript compiler (tsc)
      if (toolName === 'typescript' || toolName === 'tsc') {
        return await this.detectTypeScript();
      }

      // Special handling for Node.js
      if (toolName === 'node') {
        return await this.detectNode();
      }

      // Special handling for npm
      if (toolName === 'npm') {
        return await this.detectNpm();
      }

      // Check if tool exists in PATH
      const exists = commandExists(toolName);
      if (!exists) {
        return toolInfo;
      }

      // Get version
      const version = await this.getToolVersion(toolName);

      toolInfo.installed = true;
      toolInfo.version = version;
      toolInfo.path = this.platformDetector.getToolPath(toolName);
    } catch (error) {
      // Tool not found or error detecting
      console.debug(`Failed to detect ${toolName}:`, error.message);
    }

    return toolInfo;
  }

  /**
   * Detect Node.js
   */
  async detectNode() {
    const toolInfo = {
      name: 'node',
      installed: false,
      version: null,
      path: null,
    };

    try {
      const result = await runCommand('node --version');
      if (result.success) {
        toolInfo.installed = true;
        toolInfo.version = result.output.trim().replace('v', '');
        toolInfo.path = this.platformDetector.getToolPath('node');
      }
    } catch (error) {
      // Node.js not installed
    }

    return toolInfo;
  }

  /**
   * Detect npm
   */
  async detectNpm() {
    const toolInfo = {
      name: 'npm',
      installed: false,
      version: null,
      path: null,
    };

    try {
      const result = await runCommand('npm --version');
      if (result.success) {
        toolInfo.installed = true;
        toolInfo.version = result.output.trim();
        toolInfo.path = this.platformDetector.getToolPath('npm');
      }
    } catch (error) {
      // npm not installed
    }

    return toolInfo;
  }

  /**
   * Detect TypeScript
   */
  async detectTypeScript() {
    const toolInfo = {
      name: 'typescript',
      installed: false,
      version: null,
      path: null,
    };

    try {
      // Try global TypeScript first
      let result = await runCommand('tsc --version');

      if (!result.success) {
        // Try local TypeScript (in node_modules/.bin)
        result = await runCommand('npx tsc --version');
      }

      if (result.success) {
        toolInfo.installed = true;
        // Extract version from output like "Version 5.3.3"
        const match = result.output.match(/Version (\d+\.\d+\.\d+)/);
        toolInfo.version = match ? match[1] : result.output.trim();
        toolInfo.path = this.platformDetector.getToolPath('tsc');
      }
    } catch (error) {
      // TypeScript not installed
    }

    return toolInfo;
  }

  /**
   * Get tool version
   */
  async getToolVersion(toolName) {
    try {
      const versionCommands = {
        yarn: 'yarn --version',
        pnpm: 'pnpm --version',
        bun: 'bun --version',
        eslint: 'eslint --version',
        prettier: 'prettier --version',
        jest: 'jest --version',
        mocha: 'mocha --version',
        vitest: 'vitest --version',
        webpack: 'webpack --version',
        vite: 'vite --version',
        rollup: 'rollup --version',
        parcel: 'parcel --version',
        'ts-node': 'ts-node --version',
        nodemon: 'nodemon --version',
      };

      const command = versionCommands[toolName] || `${toolName} --version`;
      const result = await runCommand(command);

      if (result.success) {
        return result.output.trim();
      }
    } catch (error) {
      // Could not get version
    }

    return null;
  }

  /**
   * Detect package manager from project
   */
  async detectPackageManager() {
    const fs = require('fs');
    const path = require('path');

    const lockFiles = {
      'package-lock.json': 'npm',
      'yarn.lock': 'yarn',
      'pnpm-lock.yaml': 'pnpm',
      'bun.lockb': 'bun',
    };

    // Check for lock files
    for (const [lockFile, manager] of Object.entries(lockFiles)) {
      if (fs.existsSync(path.join(process.cwd(), lockFile))) {
        try {
          const version = await this.getToolVersion(manager);
          return {
            name: manager,
            version: version,
            lockFile: lockFile,
          };
        } catch (error) {
          return {
            name: manager,
            version: null,
            lockFile: lockFile,
          };
        }
      }
    }

    // Check package.json for packageManager field
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.packageManager) {
          // Format: "npm@8.19.4" or "yarn@1.22.19"
          const match = packageJson.packageManager.match(/^(\w+)@(.+)$/);
          if (match) {
            return {
              name: match[1],
              version: match[2],
              source: 'package.json',
            };
          }
        }
      } catch (error) {
        // Could not parse package.json
      }
    }

    return null;
  }

  /**
   * Detect JavaScript frameworks
   */
  async detectFrameworks() {
    const fs = require('fs');
    const path = require('path');
    const frameworks = [];

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return frameworks;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // React detection
      if (deps.react) {
        frameworks.push('react');
      }

      // Vue detection
      if (deps.vue) {
        frameworks.push('vue');
      }

      // Angular detection
      if (deps['@angular/core']) {
        frameworks.push('angular');
      }

      // Next.js detection
      if (deps.next) {
        frameworks.push('nextjs');
      }

      // Nuxt detection
      if (deps.nuxt) {
        frameworks.push('nuxt');
      }

      // Svelte detection
      if (deps.svelte) {
        frameworks.push('svelte');
      }

      // Express detection
      if (deps.express) {
        frameworks.push('express');
      }

      // NestJS detection
      if (deps['@nestjs/core']) {
        frameworks.push('nestjs');
      }
    } catch (error) {
      // Could not detect frameworks
    }

    return frameworks;
  }

  /**
   * Detect build tools
   */
  async detectBuildTools() {
    const fs = require('fs');
    const path = require('path');
    const buildTools = [];

    // Check for configuration files
    const configFiles = {
      'webpack.config.js': 'webpack',
      'vite.config.js': 'vite',
      'vite.config.ts': 'vite',
      'rollup.config.js': 'rollup',
      'parcel.config.js': 'parcel',
      'tsconfig.json': 'typescript',
      'babel.config.js': 'babel',
      '.babelrc': 'babel',
    };

    for (const [configFile, tool] of Object.entries(configFiles)) {
      if (fs.existsSync(path.join(process.cwd(), configFile))) {
        buildTools.push(tool);
      }
    }

    return buildTools;
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(detectedTools) {
    const report = {
      summary: {
        nodeInstalled: detectedTools.node?.installed || false,
        npmInstalled: detectedTools.npm?.installed || false,
        typescriptInstalled: detectedTools.typescript?.installed || false,
        hasLinter: detectedTools.eslint?.installed || false,
        hasFormatter: detectedTools.prettier?.installed || false,
        hasTesting:
          detectedTools.jest?.installed ||
          detectedTools.mocha?.installed ||
          detectedTools.vitest?.installed,
      },
      node: detectedTools.node,
      npm: detectedTools.npm,
      typescript: detectedTools.typescript,
      eslint: detectedTools.eslint,
      prettier: detectedTools.prettier,
      jest: detectedTools.jest,
      mocha: detectedTools.mocha,
      vitest: detectedTools.vitest,
      packageManager: detectedTools.packageManager,
      frameworks: detectedTools.frameworks || [],
      buildTools: detectedTools.buildTools || [],
    };

    return report;
  }

  /**
   * Get tool installation command
   */
  getInstallationCommand(toolName, options = {}) {
    const commands = {
      node: {
        macos: 'brew install node',
        linux: 'sudo apt install nodejs npm',
        windows: 'Download from https://nodejs.org/',
      },
      npm: 'npm install -g npm@latest',
      typescript: 'npm install -g typescript',
      eslint: 'npm install -g eslint',
      prettier: 'npm install -g prettier',
      jest: 'npm install -g jest',
    };

    const command = commands[toolName];

    if (typeof command === 'object') {
      const platform = this.platformDetector.getPlatformName();
      return command[platform] || command[Object.keys(command)[0]];
    }

    return command || `npm install -g ${toolName}`;
  }

  /**
   * Check if tool meets minimum version requirement
   */
  checkVersion(toolInfo, minVersion) {
    if (!toolInfo.installed || !toolInfo.version) {
      return false;
    }

    // Simple version comparison (for demonstration)
    // In production, use a proper semver library
    const current = toolInfo.version.split('.').map(Number);
    const required = minVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, required.length); i++) {
      const cur = current[i] || 0;
      const req = required[i] || 0;

      if (cur > req) return true;
      if (cur < req) return false;
    }

    return true; // Versions are equal
  }
}

module.exports = JSToolDetector;
