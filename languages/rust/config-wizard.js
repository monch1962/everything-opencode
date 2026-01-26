/**
 * Rust Configuration Wizard
 *
 * Interactive configuration for Rust projects
 */

// const fs = require('fs');
const path = require('path');
const RustToolDetector = require('./tool-detector');

class RustConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new RustToolDetector(projectPath);
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard for Rust projects
   */
  async runWizard(_options = {}) {
    console.log('🦀 Rust Project Configuration Wizard\n');

    // Detect tools first
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(this.detectedTools);

    // Show environment report
    this.showEnvironmentReport(report);

    // Check for missing tools
    const missingTools = this.checkMissingTools(this.detectedTools);
    if (missingTools.length > 0) {
      this.showMissingTools(missingTools);
    }

    // Detect project type
    const projectType = await this.detectProjectType();

    // Generate configuration
    const config = await this.configureProject(projectType);

    // Save configuration
    const saved = await this.saveConfiguration(config);

    if (saved) {
      this.showSuccessMessage(config);
    }

    return config;
  }

  /**
   * Show environment report
   */
  showEnvironmentReport(report) {
    console.log(report);
    console.log('');
  }

  /**
   * Check for missing essential tools
   */
  checkMissingTools(tools) {
    const missing = [];

    if (!tools.rustc.installed) {
      missing.push('rustc (Rust compiler)');
    }

    if (!tools.cargo.installed) {
      missing.push('cargo (Rust package manager)');
    }

    return missing;
  }

  /**
   * Show missing tools with installation instructions
   */
  showMissingTools(missingTools) {
    console.log('⚠️  Missing Essential Tools:');
    missingTools.forEach((tool) => {
      console.log(`  • ${tool}`);
    });
    console.log('');

    console.log('📦 Installation Instructions:');
    console.log('  To install Rust and Cargo, run:');
    console.log('  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh');
    console.log('');
    console.log('  After installation, restart your terminal or run:');
    console.log('  source $HOME/.cargo/env');
    console.log('');
  }

  /**
   * Detect project type
   */
  async detectProjectType() {
    const projectInfo = {
      type: 'rust',
      isBinary: this.detectedTools.project.isBinary,
      isLibrary: this.detectedTools.project.isLibrary,
      isWorkspace: this.detectedTools.project.isWorkspace,
      edition: this.detectedTools.project.edition || '2021',
      frameworks: this.detectedTools.frameworks,
    };

    // Determine primary project type
    if (projectInfo.isWorkspace) {
      projectInfo.primaryType = 'workspace';
    } else if (projectInfo.isBinary && projectInfo.isLibrary) {
      projectInfo.primaryType = 'mixed';
    } else if (projectInfo.isBinary) {
      projectInfo.primaryType = 'binary';
    } else if (projectInfo.isLibrary) {
      projectInfo.primaryType = 'library';
    } else {
      projectInfo.primaryType = 'unknown';
    }

    return projectInfo;
  }

  /**
   * Configure project based on type
   */
  async configureProject(projectType) {
    const config = {
      name: path.basename(this.projectPath),
      type: projectType.primaryType,
      edition: projectType.edition,
      frameworks: projectType.frameworks,
      language: 'rust',
    };

    // Add tool-specific configuration
    config.tools = {
      rustc: this.detectedTools.rustc,
      cargo: this.detectedTools.cargo,
      rustup: this.detectedTools.rustup,
      linters: this.detectedTools.linters,
      formatters: this.detectedTools.formatters,
      testFrameworks: this.detectedTools.testFrameworks,
    };

    // Add project-specific configuration
    config.project = {
      hasCargoToml: this.detectedTools.project.hasCargoToml,
      hasCargoLock: this.detectedTools.project.hasCargoLock,
      name: this.detectedTools.project.name,
      version: this.detectedTools.project.version,
      dependencies: this.detectedTools.project.dependencies,
      devDependencies: this.detectedTools.project.devDependencies,
      buildDependencies: this.detectedTools.project.buildDependencies,
    };

    // Generate recommendations
    config.recommendations = this.generateRecommendations(config);

    return config;
  }

  /**
   * Generate tool recommendations
   */
  generateRecommendations(config) {
    const recommendations = [];

    // Rustup recommendation
    if (!config.tools.rustup.installed) {
      recommendations.push({
        tool: 'rustup',
        reason: 'Toolchain management and updates',
        command: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      });
    }

    // Clippy recommendation
    if (!config.tools.linters.includes('clippy')) {
      recommendations.push({
        tool: 'clippy',
        reason: 'Advanced Rust linter',
        command: 'rustup component add clippy',
      });
    }

    // Rustfmt recommendation
    if (!config.tools.formatters.includes('rustfmt')) {
      recommendations.push({
        tool: 'rustfmt',
        reason: 'Code formatting',
        command: 'rustup component add rustfmt',
      });
    }

    // Cargo-audit recommendation for security
    if (!config.tools.linters.includes('cargo-audit')) {
      recommendations.push({
        tool: 'cargo-audit',
        reason: 'Security vulnerability checking',
        command: 'cargo install cargo-audit',
      });
    }

    // Cargo-watch recommendation for development
    recommendations.push({
      tool: 'cargo-watch',
      reason: 'Automatically run commands on file changes',
      command: 'cargo install cargo-watch',
    });

    // Edition upgrade recommendation
    if (config.edition === '2015' || config.edition === '2018') {
      recommendations.push({
        tool: 'Edition upgrade',
        reason: `Upgrade from ${config.edition} to 2021 for latest features`,
        command: 'Update edition in Cargo.toml to "2021"',
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

      // Merge with new Rust config
      const mergedConfig = {
        ...existingConfig,
        rust: config,
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
    console.log('\n🎉 Rust Configuration Complete!');
    console.log('='.repeat(50));
    console.log(`Project: ${config.name}`);
    console.log(`Type: ${config.type}`);
    console.log(`Edition: ${config.edition}`);
    console.log(
      `Frameworks: ${config.frameworks.length > 0 ? config.frameworks.join(', ') : 'None'}`,
    );
    console.log('='.repeat(50));

    console.log('\n🦀 Available Commands:');
    console.log('  /rust-setup    - Setup Rust project and install tools');
    console.log('  /rust-test     - Run tests');
    console.log('  /rust-build    - Build project');
    console.log('  /rust-check    - Check code without building');
    console.log('  /rust-clippy   - Run clippy linter');
    console.log('  /rust-fmt      - Format code');
    console.log('  /rust-run      - Run project');
    console.log('  /rust-doc      - Generate documentation');

    if (config.recommendations.length > 0) {
      console.log('\n💡 Recommended Tools to Install:');
      config.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.tool}: ${rec.reason}`);
        console.log(`     Command: ${rec.command}`);
      });
    }

    console.log('\n🚀 Next Steps:');
    console.log('  1. Run /rust-setup to install recommended tools');
    console.log('  2. Run /rust-check to check your code');
    console.log('  3. Run /rust-test to run tests');
    console.log('  4. Run /rust-build to build your project');
  }

  /**
   * Show installation guide for missing tool
   */
  showInstallationGuide(tool) {
    console.log('\n📖 Installation Guide:');

    switch (tool) {
      case 'rustc':
      case 'cargo':
      case 'rustup':
        console.log('  Install Rust using rustup:');
        console.log('  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh');
        console.log('');
        console.log('  After installation, restart your terminal or run:');
        console.log('  source $HOME/.cargo/env');
        break;
      case 'clippy':
        console.log('  Install clippy:');
        console.log('  rustup component add clippy');
        break;
      case 'rustfmt':
        console.log('  Install rustfmt:');
        console.log('  rustup component add rustfmt');
        break;
      default:
        console.log(`  Install ${tool}: cargo install ${tool}`);
    }

    console.log('');
  }
}

module.exports = RustConfigWizard;
