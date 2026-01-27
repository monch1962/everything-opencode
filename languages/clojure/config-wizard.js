/**
 * Clojure Configuration Wizard
 *
 * Interactive configuration for Clojure projects
 * Supports Clojure CLI (deps.edn), Leiningen (project.clj), and Boot (build.boot)
 */

const path = require('path');
const ClojureToolDetector = require('./clojure-tool-detector-refactored');

class ClojureConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new ClojureToolDetector(projectPath);
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard for Clojure projects
   */
  async runWizard(_options = {}) {
    console.log('☕ Clojure Project Configuration Wizard\n');

    // Detect tools first
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(this.detectedTools);

    // Show environment report
    this.showEnvironmentReport(report);

    // Check for missing essential tools
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

    // Java is absolutely required
    if (!tools.java.installed) {
      missing.push('Java Runtime Environment (JRE 8+)');
    }

    // Check if we have at least one build tool for the detected build system
    const hasBuildSystem = tools.buildSystem.length > 0;
    const hasClojureTool =
      tools.clojure.installed || tools.leiningen.installed || tools.boot.installed;

    if (hasBuildSystem && !hasClojureTool) {
      const primarySystem = tools.buildSystem.find((sys) => sys.primary);
      if (primarySystem) {
        missing.push(`${primarySystem.name} build tool`);
      }
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

    const installationCommands = this.toolDetector.getInstallationCommands(this.detectedTools);

    if (installationCommands.length > 0) {
      console.log('📦 Installation Instructions:');
      installationCommands.forEach((cmd, index) => {
        console.log(`\n${index + 1}. ${cmd.tool}: ${cmd.description}`);
        console.log(`   Command: ${cmd.command}`);
      });
      console.log('');
    }
  }

  /**
   * Detect project type
   */
  async detectProjectType() {
    const projectInfo = {
      type: 'clojure',
      buildSystem: this.detectedTools.buildSystem,
      isLibrary: this.detectedTools.project.isLibrary,
      isApplication: this.detectedTools.project.isApplication,
      isFullStack: this.detectedTools.project.isFullStack,
      hasClojureScript: this.detectedTools.project.hasClojureScript,
      frameworks: this.detectedTools.frameworks,
      linters: this.detectedTools.linters,
      formatters: this.detectedTools.formatters,
      testFrameworks: this.detectedTools.testFrameworks,
      repl: this.detectedTools.repl,
      clojurescript: this.detectedTools.clojurescript,
    };

    // Determine primary build system
    const primarySystem = projectInfo.buildSystem.find((sys) => sys.primary);
    projectInfo.primaryBuildSystem = primarySystem ? primarySystem.name : 'unknown';

    return projectInfo;
  }

  /**
   * Configure project based on type
   */
  async configureProject(projectType) {
    const config = {
      name: path.basename(this.projectPath),
      type: this.getProjectTypeLabel(projectType),
      buildSystem: projectType.primaryBuildSystem,
      frameworks: projectType.frameworks,
      hasClojureScript: projectType.hasClojureScript,
      language: 'clojure',
    };

    // Add tool-specific configuration
    config.tools = {
      java: this.detectedTools.java,
      clojure: this.detectedTools.clojure,
      leiningen: this.detectedTools.leiningen,
      boot: this.detectedTools.boot,
      linters: this.detectedTools.linters,
      formatters: this.detectedTools.formatters,
      testFrameworks: this.detectedTools.testFrameworks,
      repl: this.detectedTools.repl,
      clojurescript: this.detectedTools.clojurescript,
    };

    // Add project-specific configuration
    config.project = {
      hasDepsEdn: this.detectedTools.project.hasDepsEdn,
      hasProjectClj: this.detectedTools.project.hasProjectClj,
      hasBuildBoot: this.detectedTools.project.hasBuildBoot,
      name: this.detectedTools.project.name,
      version: this.detectedTools.project.version,
      description: this.detectedTools.project.description,
      dependencies: this.detectedTools.project.dependencies,
      devDependencies: this.detectedTools.project.devDependencies,
      aliases: this.detectedTools.project.aliases,
      sourceDirs: this.detectedTools.project.sourceDirs,
      testDirs: this.detectedTools.project.testDirs,
      resourceDirs: this.detectedTools.project.resourceDirs,
    };

    // Generate recommendations
    config.recommendations = this.generateRecommendations(config);

    return config;
  }

  /**
   * Get project type label
   */
  getProjectTypeLabel(projectType) {
    const types = [];

    if (projectType.isLibrary) types.push('library');
    if (projectType.isApplication) types.push('application');
    if (projectType.isFullStack) types.push('full-stack');
    if (projectType.hasClojureScript) types.push('clojurescript');

    return types.length > 0 ? types.join('-') : 'standard';
  }

  /**
   * Generate tool recommendations
   */
  generateRecommendations(config) {
    const recommendations = [];

    // Java version recommendation
    if (config.tools.java.installed && config.tools.java.version) {
      const javaVersion = parseFloat(config.tools.java.version.match(/\d+/)?.[0] || '0');
      if (javaVersion < 8) {
        recommendations.push({
          tool: 'Java Update',
          reason: `Java ${config.tools.java.version} is outdated. Clojure works best with Java 8+.`,
          command: 'Update Java from https://adoptium.net/',
          priority: 10,
        });
      } else if (javaVersion < 11) {
        recommendations.push({
          tool: 'Java Update',
          reason: `Consider upgrading to Java 11+ for better performance and features.`,
          command: 'Update Java from https://adoptium.net/',
          priority: 5,
        });
      }
    }

    // Build tool recommendation based on project
    if (config.project.hasDepsEdn && !config.tools.clojure.installed) {
      recommendations.push({
        tool: 'Clojure CLI',
        reason: 'Project uses deps.edn but Clojure CLI is not installed',
        command: 'Install from https://clojure.org/guides/getting_started',
        priority: 9,
      });
    }

    if (config.project.hasProjectClj && !config.tools.leiningen.installed) {
      recommendations.push({
        tool: 'Leiningen',
        reason: 'Project uses project.clj but Leiningen is not installed',
        command: 'Install from https://leiningen.org/',
        priority: 9,
      });
    }

    // clj-kondo recommendation
    const hasCljKondo = config.tools.linters.some((l) => l.name === 'clj-kondo');
    if (!hasCljKondo) {
      recommendations.push({
        tool: 'clj-kondo',
        reason: 'Essential Clojure linter for static analysis',
        command:
          'bash <(curl -s https://raw.githubusercontent.com/clj-kondo/clj-kondo/master/script/install-clj-kondo)',
        priority: 8,
      });
    }

    // zprint recommendation
    const hasZprint = config.tools.formatters.some((f) => f.name === 'zprint');
    if (!hasZprint) {
      recommendations.push({
        tool: 'zprint',
        reason: 'Highly configurable code formatter',
        command: 'curl -s https://raw.githubusercontent.com/kkinnear/zprint/main/install | bash',
        priority: 7,
      });
    }

    // kaocha recommendation for testing
    const hasKaocha = config.tools.testFrameworks.includes('kaocha');
    if (!hasKaocha && config.project.dependencies > 5) {
      recommendations.push({
        tool: 'kaocha',
        reason: 'Next-generation test runner for larger projects',
        command: 'Add to deps.edn or project.clj dependencies',
        priority: 6,
      });
    }

    // nREPL recommendation
    if (!config.tools.repl.nrepl && config.project.isApplication) {
      recommendations.push({
        tool: 'nREPL',
        reason: 'Network REPL for better development experience',
        command: 'Add nREPL dependency to your project',
        priority: 5,
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
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

      // Merge with new Clojure config
      const mergedConfig = {
        ...existingConfig,
        clojure: config,
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
    console.log('\n🎉 Clojure Configuration Complete!');
    console.log('='.repeat(50));
    console.log(`Project: ${config.name}`);
    console.log(`Type: ${config.type}`);
    console.log(`Build System: ${config.buildSystem}`);

    if (config.frameworks.length > 0) {
      console.log(`Frameworks: ${config.frameworks.join(', ')}`);
    }

    if (config.hasClojureScript) {
      console.log(`ClojureScript: Yes (${config.tools.clojurescript.buildTool})`);
    }

    console.log('='.repeat(50));

    console.log('\n☕ Available Commands:');
    console.log('  /clojure-setup    - Setup Clojure project and install tools');
    console.log('  /clojure-test     - Run tests');
    console.log('  /clojure-build    - Build project');
    console.log('  /clojure-repl     - Start REPL session');
    console.log('  /clojure-lint     - Run linter (clj-kondo)');
    console.log('  /clojure-format   - Format code (zprint)');
    console.log('  /clojure-deps     - Manage dependencies');
    console.log('  /clojure-run      - Run application');
    console.log('  /clojure-clean    - Clean build artifacts');

    if (config.recommendations.length > 0) {
      console.log('\n💡 Recommended Tools to Install:');
      config.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.tool}: ${rec.reason}`);
        console.log(`     Command: ${rec.command}`);
      });
    }

    console.log('\n🚀 Next Steps:');
    console.log('  1. Run /clojure-setup to install recommended tools');
    console.log('  2. Run /clojure-lint to check your code');
    console.log('  3. Run /clojure-test to run tests');
    console.log('  4. Run /clojure-build to build your project');

    if (config.tools.repl.type) {
      console.log(`  5. Run /clojure-repl to start a ${config.tools.repl.type} session`);
    }
  }

  /**
   * Show installation guide for missing tool
   */
  showInstallationGuide(tool) {
    console.log('\n📖 Installation Guide:');

    switch (tool.toLowerCase()) {
      case 'java':
      case 'jre':
      case 'jdk':
        console.log('  Install Java 8 or higher:');
        console.log('  • macOS: brew install --cask temurin');
        console.log('  • Ubuntu: sudo apt install openjdk-11-jdk');
        console.log('  • Windows: Download from https://adoptium.net/');
        console.log('  • All platforms: https://clojure.org/guides/getting_started');
        break;

      case 'clojure':
      case 'clojure cli':
        console.log('  Install Clojure CLI tools:');
        console.log('  • macOS: brew install clojure/tools/clojure');
        console.log('  • Linux: Follow instructions at https://clojure.org/guides/getting_started');
        console.log('  • Windows: Use Windows Subsystem for Linux (WSL)');
        console.log('  • Or use install script:');
        console.log(
          '    curl -O https://download.clojure.org/install/linux-install-1.11.1.1347.sh'
        );
        console.log('    chmod +x linux-install-1.11.1.1347.sh');
        console.log('    sudo ./linux-install-1.11.1.1347.sh');
        break;

      case 'leiningen':
        console.log('  Install Leiningen:');
        console.log('  • Download lein script:');
        console.log(
          '    curl -O https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein'
        );
        console.log('  • Make it executable:');
        console.log('    chmod +x lein');
        console.log('  • Move to PATH:');
        console.log('    sudo mv lein /usr/local/bin/');
        console.log('  • Run once to install:');
        console.log('    lein version');
        break;

      case 'clj-kondo':
        console.log('  Install clj-kondo:');
        console.log('  • Using install script:');
        console.log(
          '    bash <(curl -s https://raw.githubusercontent.com/clj-kondo/clj-kondo/master/script/install-clj-kondo)'
        );
        console.log('  • Or download binary from:');
        console.log('    https://github.com/clj-kondo/clj-kondo/releases');
        break;

      case 'zprint':
        console.log('  Install zprint:');
        console.log('  • Using install script:');
        console.log(
          '    curl -s https://raw.githubusercontent.com/kkinnear/zprint/main/install | bash'
        );
        console.log('  • Or as a CLI tool:');
        console.log('    clojure -Ttools install-latest :lib io.github.kkinnear/zprint :as zprint');
        break;

      default:
        console.log(`  Install ${tool}: Check the tool's official documentation`);
    }

    console.log('');
  }
}

module.exports = ClojureConfigWizard;
