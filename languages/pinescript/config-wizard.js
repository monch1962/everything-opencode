#!/usr/bin/env node
/**
 * PineScript Configuration Wizard
 *
 * Interactive wizard for configuring PineScript projects in opencode
 */

const path = require('path');
const fs = require('fs');
const { commandExists, runCommand } = require('../../scripts/lib/utils');
const InteractivePrompts = require('../../scripts/interactive/prompts');
const ProjectDetector = require('../../scripts/interactive/project-detector');
const ConfigManager = require('../../scripts/interactive/config-manager');

class PineScriptConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.prompts = new InteractivePrompts();
    this.detector = new ProjectDetector(projectPath);
    this.configManager = new ConfigManager(projectPath);
    this.config = null;
  }

  /**
   * Run the complete PineScript configuration wizard
   */
  async run() {
    try {
      this.prompts.header('📈 PineScript Project Configuration');

      // Step 1: Detect PineScript project
      const pineDetection = await this.detectPineScriptProject();
      if (!pineDetection.isPineScript) {
        this.prompts.error('This does not appear to be a PineScript project.');
        return false;
      }

      // Step 2: Detect project type
      const projectType = await this.detectProjectType();

      // Step 3: Detect PineScript version
      const detectedVersion = await this.detectVersion();

      // Step 4: Interactive configuration
      const userConfig = await this.interactiveConfiguration(
        projectType,
        detectedVersion,
      );

      // Step 5: Save configuration
      const saved = await this.saveConfiguration(userConfig);

      // Step 6: Provide next steps
      await this.provideNextSteps(userConfig);

      return saved;
    } catch (error) {
      this.prompts.error(`Configuration failed: ${error.message}`);
      return false;
    } finally {
      this.prompts.close();
    }
  }

  /**
   * Detect if this is a PineScript project
   */
  async detectPineScriptProject() {
    this.prompts.info('Detecting PineScript project...');

    const summary = await this.detector.getProjectSummary();
    const pineResult = summary.languages.find(
      (lang) => lang.language === 'pinescript',
    );

    if (!pineResult || pineResult.confidence < 0.3) {
      return {
        isPineScript: false,
        confidence: pineResult?.confidence || 0,
        indicators: pineResult?.indicators || [],
      };
    }

    this.prompts.success(
      `Detected PineScript project with ${Math.round(pineResult.confidence * 100)}% confidence`,
    );

    if (pineResult.indicators.length > 0) {
      this.prompts.info('Indicators found:');
      pineResult.indicators.slice(0, 5).forEach((indicator) => {
        console.log(`  • ${indicator}`);
      });
    }

    return {
      isPineScript: true,
      confidence: pineResult.confidence,
      indicators: pineResult.indicators,
      files: pineResult.files,
      detectedVersion: pineResult.detectedVersion,
      projectType: pineResult.projectType,
    };
  }

  /**
   * Detect PineScript project type
   */
  async detectProjectType() {
    this.prompts.info('Detecting project type...');

    const projectType = await this.detector.detectPineScriptProjectType();

    const typeDescriptions = {
      indicator: 'TradingView indicator (technical analysis)',
      strategy: 'Trading strategy with backtesting',
      library: 'PineScript library/utility functions',
      unknown: 'General PineScript project',
    };

    if (projectType !== 'unknown') {
      this.prompts.success(`Detected: ${typeDescriptions[projectType]}`);
    } else {
      this.prompts.warning('Could not determine specific project type');
    }

    return projectType;
  }

  /**
   * Detect PineScript version
   */
  async detectVersion() {
    this.prompts.info('Detecting PineScript version...');

    const pineResult = await this.detector.detectPineScript();

    if (pineResult.detectedVersion) {
      this.prompts.success(
        `Detected: PineScript v${pineResult.detectedVersion}`,
      );
      return pineResult.detectedVersion;
    }

    // Check for version hints in files
    const pineFiles = await this.detector.glob('**/*.pine', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });

    for (const file of pineFiles.slice(0, 3)) {
      try {
        const content = fs.readFileSync(
          path.join(this.projectPath, file),
          'utf8',
        );
        const versionMatch = content.match(/\/\/@version=(\d+)/);
        if (versionMatch) {
          this.prompts.success(
            `Detected: PineScript v${versionMatch[1]} in ${file}`,
          );
          return versionMatch[1];
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    this.prompts.warning('Could not detect PineScript version');
    return 'auto';
  }

  /**
   * Interactive configuration based on project type
   */
  async interactiveConfiguration(projectType, detectedVersion) {
    this.prompts.section('Configuration Options');

    const config = {
      projectType,
      version: detectedVersion,
      backtesting: {
        enabled: false,
        dataSource: 'tradingview',
        optimization: {
          enabled: false,
          method: 'grid',
          maxIterations: 100,
          walkForward: false,
        },
        metrics: ['netProfit', 'winRate', 'maxDrawdown'],
      },
      alerts: {
        enabled: false,
        webhooks: [],
        email: false,
        discord: false,
        telegram: false,
      },
      tradingview: {
        publish: false,
        apiKey: '',
        workspace: 'default',
      },
      userApproved: false,
    };

    // 1. Version selection
    const versionChoices = [
      {
        title: `v${detectedVersion} (detected)`,
        description: 'Use detected version',
        value: detectedVersion,
        recommended: true,
      },
      {
        title: 'v6',
        description: 'Latest PineScript version',
        value: '6',
        recommended: detectedVersion === 'auto',
      },
      {
        title: 'v5',
        description: 'Current stable version',
        value: '5',
        recommended: false,
      },
      {
        title: 'v4',
        description: 'Legacy version (compatibility)',
        value: '4',
        recommended: false,
      },
      {
        title: 'Auto-detect',
        description: 'Detect version from files',
        value: 'auto',
      },
    ];

    config.version = await this.prompts.selectWithDescriptions(
      'Select PineScript version:',
      versionChoices,
    );

    // 2. Backtesting configuration (for strategies)
    if (projectType === 'strategy') {
      const enableBacktesting = await this.prompts.confirm(
        'Enable backtesting for this strategy?',
        true,
      );

      config.backtesting.enabled = enableBacktesting;

      if (enableBacktesting) {
        // Data source selection
        const dataSourceChoices = [
          {
            title: 'TradingView',
            description: 'Use TradingView historical data',
            value: 'tradingview',
            recommended: true,
          },
          {
            title: 'CSV files',
            description: 'Import data from CSV files',
            value: 'csv',
            recommended: false,
          },
          {
            title: 'API',
            description: 'Fetch data from external API',
            value: 'api',
            recommended: false,
          },
          {
            title: 'Skip for now',
            description: 'Configure data source later',
            value: 'tradingview',
          },
        ];

        config.backtesting.dataSource =
          await this.prompts.selectWithDescriptions(
            'Select data source for backtesting:',
            dataSourceChoices,
          );

        // Optimization configuration
        const enableOptimization = await this.prompts.confirm(
          'Enable strategy parameter optimization?',
          false,
        );

        config.backtesting.optimization.enabled = enableOptimization;

        if (enableOptimization) {
          const optimizationMethod = await this.prompts.select(
            'Select optimization method:',
            ['grid', 'random', 'bayesian', 'genetic'],
            0,
          );

          config.backtesting.optimization.method = [
            'grid',
            'random',
            'bayesian',
            'genetic',
          ][optimizationMethod];

          const maxIterations = await this.prompts.input(
            'Maximum optimization iterations:',
            '100',
          );

          config.backtesting.optimization.maxIterations =
            parseInt(maxIterations) || 100;

          config.backtesting.optimization.walkForward =
            await this.prompts.confirm(
              'Enable walk-forward optimization?',
              false,
            );
        }
      }
    }

    // 3. Alert configuration
    const enableAlerts = await this.prompts.confirm(
      'Configure alert system for this project?',
      projectType === 'strategy',
    );

    config.alerts.enabled = enableAlerts;

    if (enableAlerts) {
      // Webhook configuration
      const configureWebhooks = await this.prompts.confirm(
        'Configure webhook alerts?',
        true,
      );

      if (configureWebhooks) {
        this.prompts.info(
          'Webhook configuration can be added later using /pine-alert command',
        );
      }

      // Notification channels
      config.alerts.email = await this.prompts.confirm(
        'Enable email notifications?',
        false,
      );

      config.alerts.discord = await this.prompts.confirm(
        'Enable Discord notifications?',
        false,
      );

      config.alerts.telegram = await this.prompts.confirm(
        'Enable Telegram notifications?',
        false,
      );
    }

    // 4. TradingView integration (for all project types)
    const configureTradingView = await this.prompts.confirm(
      'Configure TradingView integration?',
      true,
    );

    if (configureTradingView) {
      config.tradingview.publish = await this.prompts.confirm(
        'Enable automatic publishing to TradingView?',
        false,
      );

      if (config.tradingview.publish) {
        const apiKey = await this.prompts.input(
          'TradingView API key (optional, can be set later):',
          '',
        );

        if (apiKey) {
          config.tradingview.apiKey = apiKey;
        }

        const workspace = await this.prompts.input(
          'TradingView workspace name:',
          'default',
        );

        config.tradingview.workspace = workspace;
      }
    }

    // 5. Get user approval
    this.prompts.section('Configuration Summary');

    console.log('\nConfiguration to be saved:');
    console.log(`  • Project type: ${projectType}`);
    console.log(`  • PineScript version: v${config.version}`);

    if (config.backtesting.enabled) {
      console.log(
        `  • Backtesting: Enabled (${config.backtesting.dataSource})`,
      );
      if (config.backtesting.optimization.enabled) {
        console.log(
          `  • Optimization: ${config.backtesting.optimization.method} (${config.backtesting.optimization.maxIterations} iterations)`,
        );
      }
    }

    if (config.alerts.enabled) {
      const alertChannels = [];
      if (config.alerts.email) alertChannels.push('Email');
      if (config.alerts.discord) alertChannels.push('Discord');
      if (config.alerts.telegram) alertChannels.push('Telegram');
      console.log(
        `  • Alerts: Enabled${alertChannels.length > 0 ? ` (${alertChannels.join(', ')})` : ''}`,
      );
    }

    if (config.tradingview.publish) {
      console.log(
        `  • TradingView: Auto-publish enabled (${config.tradingview.workspace})`,
      );
    }

    config.userApproved = await this.prompts.confirm(
      '\nSave this configuration?',
      true,
    );

    return config;
  }

  /**
   * Save configuration to project
   */
  async saveConfiguration(config) {
    if (!config.userApproved) {
      this.prompts.warning('Configuration not saved (user declined)');
      return false;
    }

    this.prompts.info('Saving configuration...');

    // Update config manager with PineScript configuration
    const saved = this.configManager.updateLanguageConfig('pinescript', config);

    if (saved) {
      // Set PineScript as primary language if it's the main language
      const summary = await this.detector.getProjectSummary();
      const pineResult = summary.languages.find(
        (lang) => lang.language === 'pinescript',
      );
      const pythonResult = summary.languages.find(
        (lang) => lang.language === 'python',
      );

      // Set PineScript as primary if it has higher confidence than Python
      if (
        pineResult &&
        (!pythonResult || pineResult.confidence > pythonResult.confidence)
      ) {
        this.configManager.setPrimaryLanguage('pinescript');
      }

      this.prompts.success(
        'Configuration saved to .opencode/project-config.json',
      );
      return true;
    } else {
      this.prompts.error('Failed to save configuration');
      return false;
    }
  }

  /**
   * Provide next steps and recommendations
   */
  async provideNextSteps(config) {
    this.prompts.header('🎯 Next Steps');

    const recommendations = [];

    // Version-specific recommendations
    if (config.version === '4') {
      recommendations.push(
        'Consider upgrading to PineScript v5 or v6 for modern features',
      );
    }

    if (config.version === 'auto') {
      recommendations.push(
        'Add //@version=X comment to your PineScript files for version detection',
      );
    }

    // Project type specific recommendations
    if (config.projectType === 'strategy' && config.backtesting.enabled) {
      recommendations.push(
        'Run backtest: `/pine-backtest` to test your strategy',
      );

      if (config.backtesting.optimization.enabled) {
        recommendations.push(
          'Optimize strategy: `/pine-optimize` to find best parameters',
        );
      }
    }

    if (config.projectType === 'indicator') {
      recommendations.push(
        'Validate indicator: `/pine-validate` to check syntax and best practices',
      );
    }

    // Alert system recommendations
    if (config.alerts.enabled) {
      recommendations.push(
        'Configure alerts: `/pine-alert --setup` to set up notification channels',
      );
    }

    // TradingView integration recommendations
    if (config.tradingview.publish && !config.tradingview.apiKey) {
      recommendations.push(
        'Add TradingView API key to configuration for automatic publishing',
      );
    }

    // General recommendations
    recommendations.push(
      'Validate PineScript files: `/pine-validate` for syntax checking',
    );
    recommendations.push('Convert between versions: `/pine-convert` if needed');
    recommendations.push(
      'Check documentation: See PINESCRIPT-INTEGRATION.md for detailed guides',
    );

    // Display recommendations
    if (recommendations.length > 0) {
      this.prompts.info('Recommended actions:');
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Available opencode commands
    this.prompts.info('Available PineScript commands:');
    console.log('  • /pine-setup    - Re-run configuration wizard');
    console.log('  • /pine-validate - Validate PineScript syntax and version');
    console.log('  • /pine-backtest - Run backtesting on strategies');
    console.log('  • /pine-optimize - Optimize strategy parameters');
    console.log('  • /pine-convert  - Convert between PineScript versions');
    console.log('  • /pine-alert    - Configure alert system');

    this.prompts.success('\nPineScript configuration complete! 🎉');
    console.log(
      '\nStart developing your TradingView indicators and strategies!',
    );
  }

  /**
   * Quick setup with minimal prompts
   */
  async quickSetup() {
    this.prompts.header('⚡ PineScript Quick Setup');

    const pineDetection = await this.detectPineScriptProject();
    if (!pineDetection.isPineScript) {
      this.prompts.error('This does not appear to be a PineScript project.');
      return false;
    }

    const projectType = await this.detectProjectType();
    const detectedVersion = await this.detectVersion();

    // Use sensible defaults
    const config = {
      projectType,
      version: detectedVersion,
      backtesting: {
        enabled: projectType === 'strategy',
        dataSource: 'tradingview',
        optimization: {
          enabled: false,
          method: 'grid',
          maxIterations: 100,
          walkForward: false,
        },
        metrics: ['netProfit', 'winRate', 'maxDrawdown'],
      },
      alerts: {
        enabled: projectType === 'strategy',
        webhooks: [],
        email: false,
        discord: false,
        telegram: false,
      },
      tradingview: {
        publish: false,
        apiKey: '',
        workspace: 'default',
      },
      userApproved: true,
    };

    this.prompts.info('Using automatic configuration:');
    console.log(`  • Project type: ${config.projectType}`);
    console.log(`  • PineScript version: v${config.version}`);
    console.log(
      `  • Backtesting: ${config.backtesting.enabled ? 'Enabled' : 'Disabled'}`,
    );
    console.log(
      `  • Alerts: ${config.alerts.enabled ? 'Enabled' : 'Disabled'}`,
    );

    const approved = await this.prompts.confirm(
      'Apply this configuration?',
      true,
    );

    if (approved) {
      config.userApproved = true;
      const saved = this.configManager.updateLanguageConfig(
        'pinescript',
        config,
      );

      // Set PineScript as primary if appropriate
      const summary = await this.detector.getProjectSummary();
      const pineResult = summary.languages.find(
        (lang) => lang.language === 'pinescript',
      );
      if (pineResult && pineResult.confidence > 0.5) {
        this.configManager.setPrimaryLanguage('pinescript');
      }

      if (saved) {
        this.prompts.success('Quick setup complete!');
        return true;
      }
    }

    return false;
  }
}

// Export for use in other scripts
module.exports = PineScriptConfigWizard;

// CLI entry point
if (require.main === module) {
  const wizard = new PineScriptConfigWizard();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📈 PineScript Configuration Wizard

Usage:
  node languages/pinescript/config-wizard.js [options]

Options:
  --quick, -q    Quick setup with automatic detection
  --help, -h     Show this help message

Examples:
  node languages/pinescript/config-wizard.js          # Run interactive wizard
  node languages/pinescript/config-wizard.js --quick  # Quick automatic setup
    `);
    process.exit(0);
  } else if (args.includes('--quick') || args.includes('-q')) {
    wizard.quickSetup().then((success) => {
      process.exit(success ? 0 : 1);
    });
  } else {
    wizard.run().then((success) => {
      process.exit(success ? 0 : 1);
    });
  }
}
