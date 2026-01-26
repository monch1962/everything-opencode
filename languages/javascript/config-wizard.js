/**
 * JavaScript/TypeScript Configuration Wizard
 *
 * Interactive configuration for JavaScript/TypeScript projects
 */

const fs = require('fs');
const path = require('path');
const JSToolDetector = require('./tool-detector');

class JSConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new JSToolDetector();
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard for JavaScript/TypeScript projects
   */
  async runWizard(options = {}) {
    console.log('🚀 JavaScript/TypeScript Project Configuration Wizard\n');

    // Detect tools first
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(this.detectedTools);

    // Show environment report
    this.showEnvironmentReport(report);

    // Check if Node.js is installed
    if (!report.summary.nodeInstalled) {
      console.log('❌ Node.js is not installed. Please install Node.js first.');
      this.showInstallationGuide('node');
      return null;
    }

    // Detect project type (JavaScript, TypeScript, React, Vue, etc.)
    const projectType = await this.detectProjectType(options);

    // Configure project based on type
    const config = await this.configureProject(projectType, options);

    // Generate configuration
    const fullConfig = this.generateConfiguration(config, report);

    // Save configuration
    const saved = await this.saveConfiguration(fullConfig);

    if (saved) {
      this.showSuccessMessage(fullConfig);
    }

    return fullConfig;
  }

  /**
   * Show environment report
   */
  showEnvironmentReport(report) {
    console.log('📊 Environment Report:');
    console.log('='.repeat(40));

    // Node.js information
    if (report.node) {
      console.log(`✅ Node.js: ${report.node.version}`);
    } else {
      console.log('❌ Node.js: Not installed');
    }

    // npm information
    if (report.npm) {
      console.log(`✅ npm: ${report.npm.version}`);
    } else {
      console.log('❌ npm: Not installed');
    }

    // TypeScript information
    if (report.typescript) {
      console.log(`✅ TypeScript: ${report.typescript.version}`);
    } else {
      console.log('ℹ️  TypeScript: Not installed (optional)');
    }

    // Package manager detection
    if (report.packageManager) {
      console.log(
        `📦 Package Manager: ${report.packageManager.name} v${report.packageManager.version}`
      );
    }

    // Framework detection
    if (report.frameworks && report.frameworks.length > 0) {
      console.log(`🏗️  Frameworks: ${report.frameworks.join(', ')}`);
    }

    // Build tool detection
    if (report.buildTools && report.buildTools.length > 0) {
      console.log(`🔧 Build Tools: ${report.buildTools.join(', ')}`);
    }

    console.log('='.repeat(40) + '\n');
  }

  /**
   * Detect project type
   */
  async detectProjectType(options = {}) {
    const projectInfo = {
      type: 'javascript',
      framework: null,
      hasTypeScript: false,
      hasReact: false,
      hasVue: false,
      hasAngular: false,
      hasNextJS: false,
      hasNuxt: false,
      hasSvelte: false,
    };

    // Check for package.json
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        // Check for TypeScript
        if (
          fs.existsSync(path.join(this.projectPath, 'tsconfig.json')) ||
          (packageJson.devDependencies && packageJson.devDependencies.typescript) ||
          (packageJson.dependencies && packageJson.dependencies.typescript)
        ) {
          projectInfo.hasTypeScript = true;
          projectInfo.type = 'typescript';
        }

        // Check for frameworks
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps.react) {
          projectInfo.hasReact = true;
          projectInfo.framework = 'react';
        }

        if (deps.vue) {
          projectInfo.hasVue = true;
          projectInfo.framework = 'vue';
        }

        if (deps['@angular/core']) {
          projectInfo.hasAngular = true;
          projectInfo.framework = 'angular';
        }

        if (deps.next) {
          projectInfo.hasNextJS = true;
          projectInfo.framework = 'nextjs';
        }

        if (deps.nuxt) {
          projectInfo.hasNuxt = true;
          projectInfo.framework = 'nuxt';
        }

        if (deps.svelte) {
          projectInfo.hasSvelte = true;
          projectInfo.framework = 'svelte';
        }
      } catch (error) {
        console.log('⚠️  Could not parse package.json:', error.message);
      }
    }

    // If no package.json, ask user
    if (!fs.existsSync(packageJsonPath)) {
      console.log('📁 No package.json found. Creating new JavaScript project.');
      projectInfo.type = await this.promptForProjectType();
    }

    return projectInfo;
  }

  /**
   * Prompt user for project type
   */
  async promptForProjectType() {
    // In a real implementation, this would use a proper prompt library
    // For now, default to JavaScript
    console.log('Select project type:');
    console.log('1. JavaScript');
    console.log('2. TypeScript');
    console.log('3. React (JavaScript)');
    console.log('4. React (TypeScript)');
    console.log('5. Vue (JavaScript)');
    console.log('6. Vue (TypeScript)');
    console.log('7. Node.js API');

    // Default to JavaScript for now
    return 'javascript';
  }

  /**
   * Configure project based on type
   */
  async configureProject(projectType, options = {}) {
    const config = {
      name: path.basename(this.projectPath),
      type: projectType.type,
      framework: projectType.framework,
      language: projectType.hasTypeScript ? 'typescript' : 'javascript',
      version: '1.0.0',
      tools: {},
    };

    // Configure based on detected tools
    if (this.detectedTools) {
      for (const [toolName, toolInfo] of Object.entries(this.detectedTools)) {
        if (toolInfo.installed) {
          config.tools[toolName] = {
            installed: true,
            version: toolInfo.version,
            path: toolInfo.path,
          };
        }
      }
    }

    // Add TypeScript-specific configuration
    if (projectType.hasTypeScript) {
      config.tsconfig = {
        compilerOptions: {
          target: 'es2020',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      };
    }

    // Add framework-specific configuration
    if (projectType.framework === 'react') {
      config.react = {
        version: '18.0.0',
        hasRouter: false,
        hasStateManagement: false,
      };
    }

    return config;
  }

  /**
   * Generate full configuration
   */
  generateConfiguration(config, report) {
    return {
      javascript: {
        ...config,
        environment: {
          nodeVersion: report.node?.version || 'unknown',
          npmVersion: report.npm?.version || 'unknown',
          packageManager: report.packageManager?.name || 'npm',
          os: process.platform,
          detectedAt: new Date().toISOString(),
        },
        recommendations: this.generateRecommendations(config, report),
      },
    };
  }

  /**
   * Generate tool recommendations
   */
  generateRecommendations(config, report) {
    const recommendations = [];

    // TypeScript recommendation for JavaScript projects
    if (config.language === 'javascript' && !report.typescript) {
      recommendations.push({
        tool: 'typescript',
        reason: 'Adds type safety and better tooling',
        command: 'npm install --save-dev typescript @types/node',
      });
    }

    // ESLint recommendation
    if (!report.eslint) {
      recommendations.push({
        tool: 'eslint',
        reason: 'Code linting and style enforcement',
        command: 'npm install --save-dev eslint',
      });
    }

    // Prettier recommendation
    if (!report.prettier) {
      recommendations.push({
        tool: 'prettier',
        reason: 'Code formatting',
        command: 'npm install --save-dev prettier',
      });
    }

    // Testing framework recommendation
    if (!report.jest && !report.mocha && !report.vitest) {
      recommendations.push({
        tool: 'jest',
        reason: 'Testing framework',
        command: 'npm install --save-dev jest @types/jest',
      });
    }

    return recommendations;
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config) {
    try {
      const configManager = require('../../scripts/interactive/config-manager');
      const manager = new configManager(this.projectPath);

      // Load existing config
      const existingConfig = manager.loadConfig() || {};

      // Merge with new JavaScript config
      const mergedConfig = {
        ...existingConfig,
        ...config,
      };

      // Save configuration
      const saved = manager.saveConfig(mergedConfig);

      if (saved) {
        console.log('✅ Configuration saved successfully!');
        return true;
      } else {
        console.log('❌ Failed to save configuration');
        return false;
      }
    } catch (error) {
      console.log('❌ Error saving configuration:', error.message);
      return false;
    }
  }

  /**
   * Show success message with next steps
   */
  showSuccessMessage(config) {
    console.log('\n🎉 JavaScript/TypeScript Configuration Complete!');
    console.log('='.repeat(50));
    console.log(`Project: ${config.javascript.name}`);
    console.log(`Type: ${config.javascript.type}`);
    console.log(`Framework: ${config.javascript.framework || 'None'}`);
    console.log(`Language: ${config.javascript.language}`);
    console.log('='.repeat(50));

    console.log('\n🚀 Available Commands:');
    console.log('  /js-test      - Run tests');
    console.log('  /js-lint      - Run linter');
    console.log('  /js-build     - Build project');
    console.log('  /js-dev       - Start development server');

    if (config.javascript.language === 'typescript') {
      console.log('  /ts-typecheck - TypeScript type checking');
      console.log('  /ts-build     - TypeScript compilation');
    }

    console.log('\n💡 Next Steps:');
    console.log('  1. Run /js-setup to install recommended tools');
    console.log('  2. Run /js-test to run your tests');
    console.log('  3. Run /js-dev to start development server');
  }

  /**
   * Show installation guide for missing tool
   */
  showInstallationGuide(tool) {
    console.log('\n📖 Installation Guide:');

    switch (tool) {
      case 'node':
        console.log('  macOS: brew install node');
        console.log('  Ubuntu: sudo apt install nodejs npm');
        console.log('  Windows: Download from https://nodejs.org/');
        console.log('  Or use nvm: https://github.com/nvm-sh/nvm');
        break;
      case 'npm':
        console.log('  npm comes with Node.js');
        console.log('  Update npm: npm install -g npm@latest');
        break;
      default:
        console.log(`  Install ${tool}: npm install -g ${tool}`);
    }

    console.log('');
  }
}

module.exports = JSConfigWizard;
