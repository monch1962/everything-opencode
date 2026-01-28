#!/usr/bin/env node
/**
 * Go Configuration Wizard - Refactored Version
 *
 * Interactive configuration for Go projects with Go-specific improvements
 * This is a refactored version that delegates to modular components while
 * maintaining 100% backward compatibility with the original API.
 */

const GoWizardCore = require('./config-wizard-modules/go-wizard-core');
const GoProjectDetector = require('./config-wizard-modules/go-project-detector');
const GoProjectCreator = require('./config-wizard-modules/go-project-creator');
const GoConfigGenerator = require('./config-wizard-modules/go-config-generator');

class GoConfigWizard {
  constructor(projectPath = process.cwd()) {
    // Initialize core module
    this.core = new GoWizardCore(projectPath);

    // Other modules will be initialized after core setup
    this.projectDetector = null;
    this.projectCreator = null;
    this.configGenerator = null;
  }

  /**
   * Run interactive configuration wizard with Go-specific improvements
   */
  async runWizard(options = {}) {
    // Run core wizard (detects tools, shows environment report)
    const environmentReport = await this.core.runWizard(options);
    if (!environmentReport) {
      return null; // Go not installed
    }

    // Initialize other modules
    this.projectDetector = new GoProjectDetector(
      this.core.getProjectPath(),
      this.core.getToolDetector()
    );

    this.projectCreator = new GoProjectCreator(this.core.getProjectPath(), this.projectDetector);

    this.configGenerator = new GoConfigGenerator(
      this.core.getProjectPath(),
      this.core.getToolDetector()
    );

    // Detect or create project
    const projectInfo = await this.projectDetector.detectOrCreateProject(options);

    let projectConfig;
    if (projectInfo.type === 'existing') {
      // Configure existing project
      projectConfig = await this.configGenerator.configureProject(
        projectInfo,
        this.core.getDetectedTools(),
        options
      );
    } else if (projectInfo.needsInteractive) {
      // Interactive project creation
      projectConfig = await this.projectCreator.interactiveProjectCreation(options);
    } else {
      // Use default project config
      projectConfig = projectInfo;
    }

    // Generate full configuration
    const fullConfig = this.configGenerator.generateConfiguration(projectConfig, environmentReport);

    // Save configuration
    if (!options.dryRun) {
      await this.configGenerator.saveConfiguration(fullConfig);

      // Create additional files
      this.configGenerator.createMakefile(projectConfig);
      this.configGenerator.createReadme(projectConfig);

      // Show completion message
      this.core.showCompletionMessage(projectConfig, environmentReport);
    }

    return fullConfig;
  }

  /**
   * Show Go-specific environment report
   */
  showEnvironmentReport(report) {
    return this.core.showEnvironmentReport(report);
  }

  /**
   * Detect existing Go project or create new with Go-specific logic
   */
  async detectOrCreateProject(options) {
    if (!this.projectDetector) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectDetector.detectOrCreateProject(options);
  }

  /**
   * Check if directory has Go files
   */
  hasGoFiles(dirPath) {
    if (!this.projectDetector) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectDetector.hasGoFiles(dirPath);
  }

  /**
   * Create default project configuration
   */
  createDefaultProject(options) {
    if (!this.projectDetector) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectDetector.createDefaultProject(options);
  }

  /**
   * Interactive project creation with Go-specific options
   */
  async interactiveProjectCreation(options) {
    if (!this.projectCreator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectCreator.interactiveProjectCreation(options);
  }

  /**
   * Create a simple Go module
   */
  async createModuleProject() {
    if (!this.projectCreator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectCreator.createModuleProject();
  }

  /**
   * Create a CLI application project
   */
  async createCLIProject() {
    if (!this.projectCreator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectCreator.createCLIProject();
  }

  /**
   * Create a web service/API project
   */
  async createWebProject() {
    if (!this.projectCreator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectCreator.createWebProject();
  }

  /**
   * Create a library/package project
   */
  async createLibraryProject() {
    if (!this.projectCreator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectCreator.createLibraryProject();
  }

  /**
   * Create a Go workspace (multiple modules)
   */
  async createWorkspaceProject() {
    if (!this.projectCreator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectCreator.createWorkspaceProject();
  }

  /**
   * Read go.mod file
   */
  readGoMod() {
    if (!this.projectDetector) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectDetector.readGoMod();
  }

  /**
   * Suggest module name based on directory
   */
  suggestModuleName() {
    if (!this.projectDetector) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.projectDetector.suggestModuleName();
  }

  /**
   * Configure project with Go-specific settings
   */
  async configureProject(projectInfo, options) {
    if (!this.configGenerator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.configGenerator.configureProject(
      projectInfo,
      this.core.getDetectedTools(),
      options
    );
  }

  /**
   * Generate complete configuration with Go-specific improvements
   */
  generateConfiguration(projectConfig, environmentReport) {
    if (!this.configGenerator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.configGenerator.generateConfiguration(projectConfig, environmentReport);
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config) {
    if (!this.configGenerator) {
      throw new Error('Wizard not initialized. Call runWizard() first.');
    }
    return this.configGenerator.saveConfiguration(config);
  }

  /**
   * Show installation guide for Go tools
   */
  showInstallationGuide(toolName) {
    return this.core.showInstallationGuide(toolName);
  }

  /**
   * Show completion message with Go-specific resources
   */
  showCompletionMessage(config, environmentReport) {
    return this.core.showCompletionMessage(config, environmentReport);
  }

  // Getter methods for internal modules (for testing/debugging)
  getCore() {
    return this.core;
  }

  getProjectDetector() {
    return this.projectDetector;
  }

  getProjectCreator() {
    return this.projectCreator;
  }

  getConfigGenerator() {
    return this.configGenerator;
  }

  getDetectedTools() {
    return this.core.getDetectedTools();
  }

  getToolDetector() {
    return this.core.getToolDetector();
  }

  getProjectPath() {
    return this.core.getProjectPath();
  }
}

// Export the class
module.exports = GoConfigWizard;

// CLI execution (main function)
if (require.main === module) {
  const wizard = new GoConfigWizard();

  const runWizard = async () => {
    try {
      const args = process.argv.slice(2);
      const options = {};

      // Parse options
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--dry-run') {
          options.dryRun = true;
        } else if (args[i] === '--quick') {
          options.quick = true;
        } else if (args[i] === '--no-prompt') {
          options.noPrompt = true;
        } else if (args[i] === '--project-type' && args[i + 1]) {
          options.projectType = args[++i];
        } else if (args[i] === '--help') {
          console.log(`
Go Configuration Wizard

Usage:
  node config-wizard.js [options]

Options:
  --dry-run           Show configuration without saving
  --quick             Use default configuration without prompts
  --no-prompt         Non-interactive mode
  --project-type TYPE Set project type (module, cli, web, library, workspace)
  --help              Show this help

Examples:
  node config-wizard.js
  node config-wizard.js --quick
  node config-wizard.js --project-type cli
          `);
          process.exit(0);
        }
      }

      const config = await wizard.runWizard(options);
      if (config) {
        console.log('\n✅ Go project configuration complete!');
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  };

  runWizard();
}
