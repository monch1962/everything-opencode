#!/usr/bin/env node
/**
 * Interactive Setup Script
 * 
 * Main entry point for interactive project configuration
 */

const path = require('path');
const fs = require('fs');
const InteractivePrompts = require('./interactive/prompts');
const ProjectDetector = require('./interactive/project-detector');
const ConfigManager = require('./interactive/config-manager');
const PythonConfigWizard = require('../languages/python/config-wizard');
const PythonToolDetector = require('./python/tool-detector');

class InteractiveSetup {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.prompts = new InteractivePrompts();
    this.detector = new ProjectDetector(projectPath);
    this.configManager = new ConfigManager(projectPath);
    this.pythonWizard = new PythonConfigWizard(projectPath);
    this.pythonToolDetector = new PythonToolDetector();
  }

  /**
   * Run complete interactive setup
   */
  async run() {
    try {
      this.prompts.header('🚀 opencode Interactive Setup');
      
      // Check if already configured
      if (this.configManager.isConfigured()) {
        const reconfigure = await this.prompts.confirm(
          'This project is already configured. Reconfigure?',
          false
        );
        
        if (!reconfigure) {
          this.prompts.info('Setup cancelled.');
          return true;
        }
      }
      
      // Step 1: Detect project
      const projectSummary = await this.detectProject();
      
      // Step 2: Determine primary language
      const primaryLanguage = await this.determinePrimaryLanguage(projectSummary);
      
      // Step 3: Run language-specific setup
      const setupResult = await this.runLanguageSetup(primaryLanguage, projectSummary);
      
      // Step 4: Save configuration
      if (setupResult) {
        await this.finalizeSetup(primaryLanguage);
      }
      
      return setupResult;
    } catch (error) {
      this.prompts.error(`Setup failed: ${error.message}`);
      return false;
    } finally {
      this.prompts.close();
    }
  }

  /**
   * Detect project and languages
   */
  async detectProject() {
    this.prompts.info('Analyzing project...');
    
    const summary = await this.detector.getProjectSummary();
    
    this.prompts.success('Project analysis complete:');
    console.log(`  • Primary language: ${summary.primaryLanguage || 'None detected'}`);
    console.log(`  • Confidence: ${Math.round(summary.primaryConfidence * 100)}%`);
    console.log(`  • Languages detected: ${summary.languages.length}`);
    
    if (summary.languages.length > 0) {
      this.prompts.info('Detected languages:');
      summary.languages.forEach(lang => {
        console.log(`  • ${lang.language}: ${Math.round(lang.confidence * 100)}% confidence`);
      });
    }
    
    if (summary.pythonProjectType && summary.pythonProjectType !== 'unknown') {
      console.log(`  • Python project type: ${summary.pythonProjectType}`);
    }
    
    return summary;
  }

  /**
   * Determine primary language (interactive if needed)
   */
  async determinePrimaryLanguage(projectSummary) {
    if (projectSummary.languages.length === 0) {
      this.prompts.warning('No programming languages detected.');
      
      const manualSelect = await this.prompts.confirm(
        'Would you like to manually select a language?',
        true
      );
      
      if (manualSelect) {
        const languageChoices = [
          { title: 'Python', description: 'General purpose programming', value: 'python' },
          { title: 'TypeScript/JavaScript', description: 'Web development', value: 'typescript' },
          { title: 'Go', description: 'Systems programming', value: 'go' },
          { title: 'Rust', description: 'Systems programming with safety', value: 'rust' },
          { title: 'PineScript', description: 'TradingView indicators/strategies', value: 'pinescript' }
        ];
        
        return await this.prompts.selectWithDescriptions(
          'Select primary language:',
          languageChoices
        );
      }
      
      return null;
    }
    
    // If only one language with reasonable confidence
    if (projectSummary.languages.length === 1 && projectSummary.primaryConfidence > 0.5) {
      this.prompts.success(`Using ${projectSummary.primaryLanguage} as primary language`);
      return projectSummary.primaryLanguage;
    }
    
    // If multiple languages or low confidence
    if (projectSummary.hasMultipleLanguages || projectSummary.primaryConfidence < 0.6) {
      this.prompts.info('Multiple languages detected or low confidence.');
      
      const languageChoices = projectSummary.languages.map(lang => ({
        title: lang.language,
        description: `${Math.round(lang.confidence * 100)}% confidence - ${lang.indicators.slice(0, 2).join(', ')}`,
        value: lang.language
      }));
      
      // Add "Other" option
      languageChoices.push({
        title: 'Other/Manual',
        description: 'Select a different language',
        value: 'manual'
      });
      
      const selected = await this.prompts.selectWithDescriptions(
        'Select primary language:',
        languageChoices
      );
      
      if (selected === 'manual') {
        const manualChoices = [
          { title: 'Python', value: 'python' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'Go', value: 'go' },
          { title: 'Rust', value: 'rust' },
          { title: 'PineScript', value: 'pinescript' }
        ];
        
        return await this.prompts.selectWithDescriptions(
          'Select language:',
          manualChoices
        );
      }
      
      return selected;
    }
    
    return projectSummary.primaryLanguage;
  }

  /**
   * Run language-specific setup
   */
  async runLanguageSetup(language, projectSummary) {
    if (!language) {
      this.prompts.error('No language selected. Setup cancelled.');
      return false;
    }
    
    this.prompts.header(`Configuring ${language} project`);
    
    switch (language) {
      case 'python':
        return await this.setupPython(projectSummary);
        
      case 'typescript':
        this.prompts.info('TypeScript setup coming soon!');
        return await this.setupGeneric(language);
        
      case 'go':
        this.prompts.info('Go setup coming soon!');
        return await this.setupGeneric(language);
        
      case 'rust':
        this.prompts.info('Rust setup coming soon!');
        return await this.setupGeneric(language);
        
      case 'pinescript':
        this.prompts.info('PineScript setup coming soon!');
        return await this.setupGeneric(language);
        
      default:
        this.prompts.warning(`Unsupported language: ${language}`);
        return await this.setupGeneric(language);
    }
  }

  /**
   * Setup Python project
   */
  async setupPython(projectSummary) {
    // Check if Python was actually detected
    const pythonResult = projectSummary.languages.find(lang => lang.language === 'python');
    
    if (!pythonResult || pythonResult.confidence < 0.3) {
      this.prompts.warning('Python detection confidence is low.');
      
      const proceed = await this.prompts.confirm(
        'Continue with Python setup anyway?',
        false
      );
      
      if (!proceed) {
        return false;
      }
    }
    
    // Run Python configuration wizard
    return await this.pythonWizard.run();
  }

  /**
   * Setup generic language (placeholder)
   */
  async setupGeneric(language) {
    this.prompts.info(`Setting up ${language} project...`);
    
    // For now, just create basic configuration
    const config = {
      language,
      configuredAt: new Date().toISOString(),
      notes: 'Basic configuration - detailed setup coming soon'
    };
    
    const save = await this.prompts.confirm(
      `Save basic ${language} configuration?`,
      true
    );
    
    if (save) {
      this.configManager.updateLanguageConfig(language, config);
      this.configManager.setPrimaryLanguage(language);
      this.prompts.success(`Basic ${language} configuration saved.`);
      return true;
    }
    
    return false;
  }

  /**
   * Finalize setup
   */
  async finalizeSetup(language) {
    this.prompts.header('✅ Setup Complete');
    
    // Load final configuration
    const config = this.configManager.loadConfig();
    
    if (config) {
      this.prompts.success('Configuration saved to .opencode/project-config.json');
      
      console.log('\n📋 Configuration summary:');
      console.log(`  • Primary language: ${config.primaryLanguage}`);
      console.log(`  • Configured at: ${new Date(config.configuredAt).toLocaleString()}`);
      
      if (config[language]) {
        const langConfig = config[language];
        console.log(`  • ${language} configuration:`);
        
        if (langConfig.projectType && langConfig.projectType !== 'unknown') {
          console.log(`    - Project type: ${langConfig.projectType}`);
        }
        
        if (langConfig.dependencyManager && langConfig.dependencyManager !== 'unknown') {
          console.log(`    - Dependency manager: ${langConfig.dependencyManager}`);
        }
        
        if (langConfig.testRunner && langConfig.testRunner !== 'none') {
          console.log(`    - Test runner: ${langConfig.testRunner}`);
        }
        
        if (langConfig.linter && langConfig.linter !== 'none') {
          console.log(`    - Linter: ${langConfig.linter}`);
        }
      }
    }
    
    // Provide next steps
    await this.provideNextSteps(language);
  }

  /**
   * Provide next steps
   */
  async provideNextSteps(language) {
    this.prompts.section('🎯 Next Steps');
    
    const commands = {
      python: [
        '/python-test    - Run tests with configured test runner',
        '/python-lint    - Run linter and formatter',
        '/python-typecheck - Run type checker',
        '/python-deps    - Manage dependencies',
        '/python-setup   - Re-run configuration wizard'
      ],
      typescript: [
        '/ts-build      - Build TypeScript project',
        '/ts-lint       - Run linter',
        '/ts-test       - Run tests'
      ],
      go: [
        '/go-build      - Build Go project',
        '/go-test       - Run tests',
        '/go-lint       - Run linter'
      ],
      rust: [
        '/rust-build    - Build Rust project',
        '/rust-test     - Run tests',
        '/rust-clippy   - Run linter'
      ],
      pinescript: [
        '/pine-validate - Validate PineScript code',
        '/pine-backtest - Run backtests',
        '/pine-optimize - Optimize strategies'
      ]
    };
    
    if (commands[language]) {
      this.prompts.info('Available commands:');
      commands[language].forEach(cmd => console.log(`  • ${cmd}`));
    }
    
    this.prompts.info('General commands:');
    console.log('  • /setup         - Re-run interactive setup');
    console.log('  • /config        - Show current configuration');
    console.log('  • /detect        - Detect project languages');
    console.log('  • /tools         - Show detected tools');
    
    console.log('\n💡 Tip: Type `/` followed by command name to use opencode commands.');
  }

  /**
   * Quick setup mode
   */
  async quickSetup() {
    this.prompts.header('⚡ Quick Setup');
    
    try {
      // Detect project
      const summary = await this.detector.getProjectSummary();
      
      if (!summary.primaryLanguage) {
        this.prompts.error('Could not detect project language.');
        return false;
      }
      
      // Use primary language
      const language = summary.primaryLanguage;
      this.prompts.info(`Detected ${language} project`);
      
      // Run appropriate quick setup
      if (language === 'python') {
        return await this.pythonWizard.quickSetup();
      } else {
        // Generic quick setup
        this.configManager.setPrimaryLanguage(language);
        this.prompts.success(`Set ${language} as primary language.`);
        return true;
      }
    } catch (error) {
      this.prompts.error(`Quick setup failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Show current configuration
   */
  async showConfig() {
    const config = this.configManager.loadConfig();
    
    if (!config) {
      this.prompts.info('No configuration found.');
      return;
    }
    
    this.prompts.header('📋 Current Configuration');
    
    console.log(`Project: ${config.project}`);
    console.log(`Primary language: ${config.primaryLanguage}`);
    console.log(`Configured: ${new Date(config.configuredAt).toLocaleString()}`);
    
    if (config.secondaryLanguages && config.secondaryLanguages.length > 0) {
      console.log(`Secondary languages: ${config.secondaryLanguages.join(', ')}`);
    }
    
    // Show language-specific config
    for (const [language, langConfig] of Object.entries(config)) {
      if (['project', 'configuredAt', 'primaryLanguage', 'secondaryLanguages', '$schema'].includes(language)) {
        continue;
      }
      
      console.log(`\n${language.toUpperCase()} configuration:`);
      this.printLanguageConfig(langConfig);
    }
  }

  /**
   * Print language configuration
   */
  printLanguageConfig(config, indent = '  ') {
    for (const [key, value] of Object.entries(config)) {
      if (key === 'tools' || key === 'userApproved') continue;
      
      if (typeof value === 'object' && value !== null) {
        console.log(`${indent}${key}:`);
        this.printLanguageConfig(value, indent + '  ');
      } else {
        console.log(`${indent}${key}: ${value}`);
      }
    }
  }

  /**
   * Detect tools
   */
  async detectTools() {
    this.prompts.header('🔧 Tool Detection');
    
    const summary = await this.detector.getProjectSummary();
    const language = summary.primaryLanguage || 'python';
    
    if (language === 'python') {
      const results = await this.pythonToolDetector.detectAll();
      this.pythonToolDetector.printResults(results, true);
    } else {
      this.prompts.info(`Tool detection for ${language} coming soon!`);
    }
  }
}

// Export for use in other scripts
module.exports = InteractiveSetup;

// CLI entry point
if (require.main === module) {
  const setup = new InteractiveSetup();
  const args = process.argv.slice(2);
  
  const command = args[0] || 'run';
  
  switch (command) {
    case 'run':
    case 'setup':
      setup.run().then(success => {
        process.exit(success ? 0 : 1);
      });
      break;
      
    case 'quick':
    case '--quick':
    case '-q':
      setup.quickSetup().then(success => {
        process.exit(success ? 0 : 1);
      });
      break;
      
    case 'config':
    case 'show':
      setup.showConfig().then(() => {
        process.exit(0);
      });
      break;
      
    case 'detect':
      setup.detector.getProjectSummary().then(summary => {
        console.log(JSON.stringify(summary, null, 2));
        process.exit(0);
      });
      break;
      
    case 'tools':
      setup.detectTools().then(() => {
        process.exit(0);
      });
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log(`
🚀 opencode Interactive Setup

Usage:
  node scripts/interactive-setup.js [command]

Commands:
  run, setup      Run interactive setup (default)
  quick, -q       Quick setup with automatic detection
  config, show    Show current configuration
  detect          Detect project languages
  tools           Detect installed tools
  help, -h        Show this help

Examples:
  node scripts/interactive-setup.js          # Run full interactive setup
  node scripts/interactive-setup.js quick    # Quick automatic setup
  node scripts/interactive-setup.js config   # Show current config
      `);
      process.exit(0);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use "node scripts/interactive-setup.js help" for usage information.');
      process.exit(1);
  }
}