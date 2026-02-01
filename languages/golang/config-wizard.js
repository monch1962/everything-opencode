#!/usr/bin/env node
/**
 * Go Configuration Wizard
 *
 * Interactive wizard for configuring Go projects in opencode
 */

const InteractivePrompts = require('../../scripts/interactive/prompts');
const ProjectDetector = require('../../scripts/interactive/project-detector');
const ConfigManager = require('../../scripts/interactive/config-manager');
const GoToolDetector = require('./tool-detector');

class GoConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.prompts = new InteractivePrompts();
    this.detector = new ProjectDetector(projectPath);
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new GoToolDetector();
    this.config = null;
  }

  /**
   * Run the complete Go configuration wizard
   */
  async run() {
    try {
      this.prompts.header('🚀 Go Project Configuration');

      // Step 1: Detect Go project
      const goDetection = await this.detectGoProject();
      if (!goDetection.isGo) {
        this.prompts.error('This does not appear to be a Go project.');
        return false;
      }

      // Step 2: Detect project type
      const projectType = await this.detectProjectType();

      // Step 3: Detect existing tools
      const detectedTools = await this.detectTools();

      // Step 4: Interactive configuration
      const userConfig = await this.interactiveConfiguration(projectType, detectedTools);

      // Step 5: Save configuration
      const saved = await this.saveConfiguration(userConfig);

      // Step 6: Provide next steps
      await this.provideNextSteps(userConfig, detectedTools);

      return saved;
    } catch (error) {
      this.prompts.error(`Configuration failed: ${error.message}`);
      return false;
    } finally {
      this.prompts.close();
    }
  }

  /**
   * Detect if this is a Go project
   */
  async detectGoProject() {
    this.prompts.info('Detecting Go project...');

    const summary = await this.detector.getProjectSummary();
    const goResult = summary.languages.find((lang) => lang.language === 'go');

    if (!goResult || goResult.confidence < 0.3) {
      return {
        isGo: false,
        confidence: goResult?.confidence || 0,
        indicators: goResult?.indicators || [],
      };
    }

    this.prompts.success(
      `Detected Go project with ${Math.round(goResult.confidence * 100)}% confidence`
    );

    if (goResult.indicators.length > 0) {
      this.prompts.info('Indicators found:');
      goResult.indicators.slice(0, 5).forEach((indicator) => {
        console.log(`  • ${indicator}`);
      });
    }

    return {
      isGo: true,
      confidence: goResult.confidence,
      indicators: goResult.indicators,
      files: goResult.files,
    };
  }

  /**
   * Detect Go project type
   */
  async detectProjectType() {
    this.prompts.info('Detecting project type...');

    const projectType = await this.detector.detectGoProjectType();

    const typeDescriptions = {
      'cli-tool': 'Command-line interface tool',
      'web-service': 'Web service/API',
      library: 'Go library/package',
      microservice: 'Microservice',
      'grpc-service': 'gRPC service',
      'http-server': 'HTTP server',
      'background-worker': 'Background worker/daemon',
      'data-processing': 'Data processing pipeline',
      unknown: 'General Go project',
    };

    if (projectType !== 'unknown') {
      this.prompts.success(`Detected: ${typeDescriptions[projectType]}`);
    } else {
      this.prompts.warning('Could not determine specific project type');
    }

    return projectType;
  }

  /**
   * Detect installed Go tools using the Go tool detector
   */
  async detectTools() {
    this.prompts.info('Detecting Go tools...');

    // Use the Go tool detector for consistent detection
    const detectedTools = await this.toolDetector.detectTools();

    // Show detection results
    let installedCount = 0;
    const installedTools = [];

    for (const [toolName, toolInfo] of Object.entries(detectedTools)) {
      if (toolInfo && toolInfo.installed) {
        installedCount++;
        installedTools.push({ name: toolName, info: toolInfo });
      }
    }

    this.prompts.info(`Detected ${installedCount} Go tools`);

    // Show installed tools
    if (installedCount > 0) {
      this.prompts.info('Installed tools:');
      for (const { name, info } of installedTools) {
        const versionText = info.version ? `v${info.version}` : 'unknown version';
        console.log(`  • ${name}: ${versionText}`);
      }
    }

    // Show recommendations based on what's missing
    const recommendations = [];

    if (!detectedTools.go?.installed) {
      recommendations.push({ type: 'critical', message: 'Go is not installed' });
    }

    if (recommendations.length > 0) {
      this.prompts.info('Recommendations:');
      recommendations.forEach((rec) => {
        const icon = rec.type === 'critical' ? '❌' : rec.type === 'high' ? '⚠️' : '🔵';
        console.log(`  ${icon} ${rec.message}`);
      });
    }

    return detectedTools;
  }

  /**
   * Interactive configuration based on project type
   */
  async interactiveConfiguration(projectType, detectedTools) {
    this.prompts.section('Configuration Options');

    const config = {
      projectType,
      linter: 'none',
      formatter: 'none',
      testRunner: 'go test',
      tools: {},
      userApproved: false,
    };

    // 1. Linter selection
    const linterChoices = [
      {
        title: 'golangci-lint',
        description: 'Fast linters runner with many checks (recommended)',
        value: 'golangci-lint',
        recommended: true,
      },
      {
        title: 'staticcheck',
        description: 'Advanced static analysis',
        value: 'staticcheck',
        recommended:
          detectedTools.staticcheck?.installed && !detectedTools['golangci-lint']?.installed,
      },
      {
        title: 'revive',
        description: 'Fast, configurable, extensible linter',
        value: 'revive',
        recommended: detectedTools.revive?.installed,
      },
      {
        title: 'Skip linting',
        description: 'No linter',
        value: 'none',
      },
    ];

    config.linter = await this.prompts.selectWithDescriptions('Select linter:', linterChoices);

    // 2. Formatter selection
    const formatterChoices = [
      {
        title: 'gofmt',
        description: 'Go built-in formatter (recommended)',
        value: 'gofmt',
        recommended: true,
      },
      {
        title: 'goimports',
        description: 'gofmt with import management',
        value: 'goimports',
        recommended: detectedTools.goimports?.installed && !detectedTools.gofmt?.installed,
      },
      {
        title: 'Skip formatting',
        description: 'No formatter',
        value: 'none',
      },
    ];

    config.formatter = await this.prompts.selectWithDescriptions(
      'Select code formatter:',
      formatterChoices
    );

    // 3. Test runner selection (Go has built-in, but we can add extras)
    const testRunnerChoices = [
      {
        title: 'go test',
        description: 'Go built-in testing (recommended)',
        value: 'go test',
        recommended: true,
      },
      {
        title: 'ginkgo',
        description: 'BDD testing framework',
        value: 'ginkgo',
        recommended: detectedTools.ginkgo?.installed,
      },
      {
        title: 'Skip testing',
        description: 'No testing framework',
        value: 'none',
      },
    ];

    config.testRunner = await this.prompts.selectWithDescriptions(
      'Select testing framework:',
      testRunnerChoices
    );

    // 4. Security scanning
    const securityChoices = [
      {
        title: 'gosec',
        description: 'Go security checker',
        value: 'gosec',
        recommended: detectedTools.gosec?.installed,
      },
      {
        title: 'govulncheck',
        description: 'Go vulnerability checker',
        value: 'govulncheck',
        recommended: detectedTools.govulncheck?.installed,
      },
      {
        title: 'Skip security scanning',
        description: 'No security scanner',
        value: 'none',
      },
    ];

    config.securityScanner = await this.prompts.selectWithDescriptions(
      'Select security scanner:',
      securityChoices
    );

    // 5. Project-specific options based on type
    if (projectType === 'cli-tool') {
      const cliFramework = await this.prompts.select(
        'Select CLI framework:',
        ['cobra', 'urfave/cli', 'none'],
        0
      );
      config.cliOptions = {
        framework: ['cobra', 'urfave/cli', 'none'][cliFramework],
      };
    }

    if (projectType === 'web-service' || projectType === 'http-server') {
      const webFramework = await this.prompts.select(
        'Select web framework:',
        ['gin', 'echo', 'fiber', 'chi', 'gorilla/mux', 'none'],
        0
      );
      config.webOptions = {
        framework: ['gin', 'echo', 'fiber', 'chi', 'gorilla/mux', 'none'][webFramework],
      };
    }

    if (projectType === 'grpc-service') {
      const includeProtobuf = await this.prompts.confirm('Include Protocol Buffers support?', true);
      config.grpcOptions = { includeProtobuf };
    }

    // 6. Build options
    const includeDocker = await this.prompts.confirm('Include Docker support?', false);

    const includeMakefile = await this.prompts.confirm('Include Makefile for common tasks?', true);

    config.buildOptions = {
      includeDocker,
      includeMakefile,
    };

    // 7. Store detected tools info
    config.tools = detectedTools;

    // 8. Get user approval
    this.prompts.section('Configuration Summary');

    console.log('\nConfiguration to be saved:');
    console.log(`  • Project type: ${projectType}`);
    console.log(`  • Linter: ${config.linter}`);
    console.log(`  • Formatter: ${config.formatter}`);
    console.log(`  • Test runner: ${config.testRunner}`);
    console.log(`  • Security scanner: ${config.securityScanner}`);

    if (config.cliOptions) {
      console.log(`  • CLI framework: ${config.cliOptions.framework}`);
    }

    if (config.webOptions) {
      console.log(`  • Web framework: ${config.webOptions.framework}`);
    }

    console.log(`  • Docker support: ${config.buildOptions.includeDocker ? 'Yes' : 'No'}`);
    console.log(`  • Makefile: ${config.buildOptions.includeMakefile ? 'Yes' : 'No'}`);

    config.userApproved = await this.prompts.confirm('\nSave this configuration?', true);

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

    // Update config manager with Go configuration
    const saved = this.configManager.updateLanguageConfig('go', config);

    if (saved) {
      // Set Go as primary language
      this.configManager.setPrimaryLanguage('go');

      this.prompts.success('Configuration saved to .opencode/project-config.json');
      return true;
    } else {
      this.prompts.error('Failed to save configuration');
      return false;
    }
  }

  /**
   * Provide next steps and recommendations
   */
  async provideNextSteps(config, detectedTools) {
    this.prompts.header('🎯 Next Steps');

    const recommendations = [];

    // Check for missing recommended tools
    if (config.linter !== 'none' && !detectedTools[config.linter]?.installed) {
      recommendations.push(`Install ${config.linter}: Recommended for code linting`);
    }

    if (config.formatter !== 'none' && !detectedTools[config.formatter]?.installed) {
      recommendations.push(`Install ${config.formatter}: Required for code formatting`);
    }

    if (config.securityScanner !== 'none' && !detectedTools[config.securityScanner]?.installed) {
      recommendations.push(`Install ${config.securityScanner}: Recommended for security scanning`);
    }

    // Project type specific recommendations
    if (config.projectType === 'cli-tool' && config.cliOptions?.framework !== 'none') {
      recommendations.push(
        `Install ${config.cliOptions.framework}: go get -u ${config.cliOptions.framework}`
      );
    }

    if (config.projectType === 'web-service' && config.webOptions?.framework !== 'none') {
      recommendations.push(
        `Install ${config.webOptions.framework}: go get -u ${config.webOptions.framework}`
      );
    }

    if (config.projectType === 'grpc-service' && config.grpcOptions?.includeProtobuf) {
      recommendations.push('Install protoc compiler for Protocol Buffers');
      recommendations.push('Install protoc-gen-go and protoc-gen-go-grpc plugins');
    }

    // Build tool recommendations
    if (config.buildOptions.includeDocker) {
      recommendations.push('Create Dockerfile for containerization');
    }

    if (config.buildOptions.includeMakefile) {
      recommendations.push('Create Makefile with common Go tasks');
    }

    // General Go recommendations
    recommendations.push('Initialize go.mod if not already: go mod init <module-name>');
    recommendations.push(
      'Add .gitignore for Go: curl -o .gitignore https://www.toptal.com/developers/gitignore/api/go'
    );
    recommendations.push('Create README.md with project documentation');

    // Display recommendations
    if (recommendations.length > 0) {
      this.prompts.info('Recommended actions:');
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Available opencode commands
    this.prompts.info('Available opencode commands:');
    console.log('  • /go-test      - Run tests with configured test runner');
    console.log('  • /go-lint      - Run linter');
    console.log('  • /go-format    - Run formatter');
    console.log('  • /go-build     - Build project');
    console.log('  • /go-run       - Run Go program');
    console.log('  • /go-clean     - Clean build artifacts');
    console.log('  • /go-mod       - Manage Go modules');
    console.log('  • /go-setup     - Re-run configuration wizard');

    this.prompts.success('\nGo configuration complete! 🎉');
  }

  /**
   * Quick setup with minimal prompts
   */
  async quickSetup() {
    this.prompts.header('⚡ Go Quick Setup');

    const goDetection = await this.detectGoProject();
    if (!goDetection.isGo) {
      this.prompts.error('This does not appear to be a Go project.');
      return false;
    }

    const projectType = await this.detectProjectType();
    const detectedTools = await this.detectTools();

    // Use sensible defaults
    const config = {
      projectType,
      linter: detectedTools['golangci-lint']?.installed
        ? 'golangci-lint'
        : detectedTools.staticcheck?.installed
          ? 'staticcheck'
          : 'none',
      formatter: detectedTools.gofmt?.installed
        ? 'gofmt'
        : detectedTools.goimports?.installed
          ? 'goimports'
          : 'none',
      testRunner: detectedTools['go test']?.installed
        ? 'go test'
        : detectedTools.ginkgo?.installed
          ? 'ginkgo'
          : 'none',
      securityScanner: detectedTools.gosec?.installed
        ? 'gosec'
        : detectedTools.govulncheck?.installed
          ? 'govulncheck'
          : 'none',
      tools: detectedTools,
      userApproved: true,
      buildOptions: {
        includeDocker: false,
        includeMakefile: true,
      },
    };

    this.prompts.info('Using automatic configuration:');
    console.log(`  • Linter: ${config.linter}`);
    console.log(`  • Formatter: ${config.formatter}`);
    console.log(`  • Test runner: ${config.testRunner}`);
    console.log(`  • Security scanner: ${config.securityScanner}`);
    console.log(`  • Makefile: ${config.buildOptions.includeMakefile ? 'Yes' : 'No'}`);

    const approved = await this.prompts.confirm('Apply this configuration?', true);

    if (approved) {
      config.userApproved = true;
      const saved = this.configManager.updateLanguageConfig('go', config);
      this.configManager.setPrimaryLanguage('go');

      if (saved) {
        this.prompts.success('Quick setup complete!');
        return true;
      }
    }

    return false;
  }
}

// Export for use in other scripts
module.exports = GoConfigWizard;

// CLI entry point
if (require.main === module) {
  const wizard = new GoConfigWizard();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Go Configuration Wizard

Usage:
  node languages/golang/config-wizard.js [options]

Options:
  --quick, -q    Quick setup with automatic detection
  --help, -h     Show this help message

Examples:
  node languages/golang/config-wizard.js          # Run interactive wizard
  node languages/golang/config-wizard.js --quick  # Quick automatic setup
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
