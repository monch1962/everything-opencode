# Language Addition Guide

This guide explains how to add support for a new programming language to the everything-opencode project. Follow this pattern to ensure consistency and maintainability.

## Overview

Each language in everything-opencode follows a consistent structure with these components:

1. **Language Detection** - Detect if a project uses the language
2. **Tool Detection** - Detect language-specific tools and versions
3. **Configuration Wizard** - Interactive setup for the language
4. **Command Runner** - Execute language-specific commands
5. **Command Files** - Individual command implementations
6. **Documentation** - User-facing documentation

## Directory Structure

```
languages/
├── {language}/              # Language-specific code
│   ├── config-wizard.js     # Interactive configuration
│   └── tool-detector.js     # Tool detection
│
scripts/
├── {language}/              # Language command runner
│   └── command-runner.js    # Base command execution
│
scripts/commands/
├── {language}-setup.js      # Setup command
├── {language}-test.js       # Test command
├── {language}-build.js      # Build command
└── ...                      # Other commands

commands/
├── {language}-setup.md      # Setup documentation
├── {language}-test.md       # Test documentation
└── ...                      # Other documentation
```

## Step-by-Step Implementation

### 1. Create Language Directory

```bash
mkdir -p languages/{language}
```

### 2. Create Tool Detector

The tool detector detects language-specific tools and versions.

**File:** `languages/{language}/tool-detector.js`

```javascript
/**
 * {Language} Tool Detector
 *
 * Detect {Language} development tools with cross-platform support
 */

const { commandExists, runCommand } = require('../../scripts/lib/utils');
const PlatformDetector = require('../../scripts/lib/platform-detector');

class {Language}ToolDetector {
  constructor() {
    this.platformDetector = new PlatformDetector();
    this.tools = [
      // List of tools to detect
      '{language}',
      'build-tool',
      'formatter',
      'linter',
      'package-manager',
    ];
  }

  /**
   * Detect all {Language} tools
   */
  async detectTools() {
    const detectedTools = {};

    for (const tool of this.tools) {
      detectedTools[tool] = await this.detectTool(tool);
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
      // Special handling for main language
      if (toolName === '{language}') {
        return await this.detect{Language}();
      }

      // Check if tool exists
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
      // Tool not found
    }

    return toolInfo;
  }

  /**
   * Detect {Language} installation
   */
  async detect{Language}() {
    const toolInfo = {
      name: '{language}',
      installed: false,
      version: null,
      path: null,
    };

    try {
      const result = await runCommand('{language} --version');
      if (result.success) {
        toolInfo.installed = true;
        toolInfo.version = result.output.trim();
        toolInfo.path = this.platformDetector.getToolPath('{language}');
      }
    } catch (error) {
      // {Language} not installed
    }

    return toolInfo;
  }

  /**
   * Get tool version
   */
  async getToolVersion(toolName) {
    try {
      const result = await runCommand(`${toolName} --version`);
      if (result.success) {
        return result.output.trim();
      }
    } catch (error) {
      // Could not get version
    }

    return null;
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(detectedTools) {
    return {
      summary: {
        {language}Installed: detectedTools.{language}?.installed || false,
        // Add other summary fields
      },
      {language}: detectedTools.{language},
      // Include other tools
    };
  }
}

module.exports = {Language}ToolDetector;
```

### 3. Create Configuration Wizard

The configuration wizard provides interactive setup.

**File:** `languages/{language}/config-wizard.js`

```javascript
/**
 * {Language} Configuration Wizard
 *
 * Interactive configuration for {Language} projects
 */

const fs = require('fs');
const path = require('path');
const {Language}ToolDetector = require('./tool-detector');

class {Language}ConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new {Language}ToolDetector();
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard
   */
  async runWizard(options = {}) {
    console.log(`🚀 {Language} Project Configuration Wizard\n`);

    // Detect tools
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(
      this.detectedTools,
    );

    // Show environment report
    this.showEnvironmentReport(report);

    // Check if {Language} is installed
    if (!report.summary.{language}Installed) {
      console.log(`❌ {Language} is not installed. Please install {Language} first.`);
      this.showInstallationGuide('{language}');
      return null;
    }

    // Detect project
    const projectType = await this.detectProjectType(options);

    // Configure project
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

    if (report.{language}) {
      console.log(`✅ {Language}: ${report.{language}.version}`);
    } else {
      console.log(`❌ {Language}: Not installed`);
    }

    // Add other tools
    console.log('='.repeat(40) + '\n');
  }

  /**
   * Detect project type
   */
  async detectProjectType(options = {}) {
    // Check for language-specific project files
    const projectInfo = {
      type: '{language}',
      // Add project-specific information
    };

    return projectInfo;
  }

  /**
   * Configure project
   */
  async configureProject(projectType, options = {}) {
    const config = {
      name: path.basename(this.projectPath),
      type: projectType.type,
      version: '1.0.0',
      tools: {},
    };

    // Add detected tools
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

    return config;
  }

  /**
   * Generate full configuration
   */
  generateConfiguration(config, report) {
    return {
      {language}: {
        ...config,
        environment: {
          {language}Version: report.{language}?.version || 'unknown',
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

    // Add language-specific recommendations
    // Example: recommend formatter if not installed

    return recommendations;
  }

  /**
   * Save configuration
   */
  async saveConfiguration(config) {
    try {
      const configManager = require('../../scripts/interactive/config-manager');
      const manager = new configManager(this.projectPath);

      const existingConfig = manager.loadConfig() || {};
      const mergedConfig = {
        ...existingConfig,
        ...config,
      };

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
   * Show success message
   */
  showSuccessMessage(config) {
    console.log(`\n🎉 {Language} Configuration Complete!`);
    console.log('='.repeat(50));
    console.log(`Project: ${config.{language}.name}`);
    console.log(`Type: ${config.{language}.type}`);
    console.log('='.repeat(50));

    console.log('\n🚀 Available Commands:');
    console.log(`  /{language}-test      - Run tests`);
    console.log(`  /{language}-build     - Build project`);
    // Add other commands

    console.log('\n💡 Next Steps:');
    console.log(`  1. Run /{language}-setup to install recommended tools`);
    console.log(`  2. Run /{language}-test to run your tests`);
    console.log(`  3. Run /{language}-build to build your project`);
  }

  /**
   * Show installation guide
   */
  showInstallationGuide(tool) {
    console.log('\n📖 Installation Guide:');

    switch (tool) {
      case '{language}':
        console.log(`  macOS: brew install {language}`);
        console.log(`  Ubuntu: sudo apt install {language}`);
        console.log(`  Windows: Download from {language-url}`);
        break;
      default:
        console.log(`  Install ${tool}: {installation-command}`);
    }

    console.log('');
  }
}

module.exports = {Language}ConfigWizard;
```

### 4. Create Command Runner

The command runner executes language-specific commands.

**File:** `scripts/{language}/command-runner.js`

```javascript
/**
 * {Language} Command Runner
 *
 * Execute {Language} commands with project-specific improvements
 */

const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const {Language}ToolDetector = require('../../languages/{language}/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const {
  ConfigUtils,
  FileUtils,
  ProjectUtils,
  LoggingUtils,
} = require('../lib');

class {Language}CommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new {Language}ToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.{language}Config = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner
   */
  async initialize() {
    // Validate project type
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== '{language}' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn(
          'This may not be a {Language} project. Some features may not work correctly.',
        );
      } else if (projectInfo.type === '{language}') {
        LoggingUtils.debug(
          `Detected {Language} project: ${projectInfo.framework || 'standard {Language}'}`,
        );
      }
    } catch (error) {
      LoggingUtils.debug('Project detection failed:', error.message);
    }

    // Load configuration
    try {
      this.config = ConfigUtils.loadConfig(this.projectPath);
      if (!this.config) {
        throw new Error(`Project not configured. Run /{language}-setup first.`);
      }

      this.{language}Config = this.config.{language};
      if (!this.{language}Config) {
        throw new Error(
          `{Language} configuration not found. Run /{language}-setup first.`,
        );
      }

      ConfigUtils.validateConfig(this.{language}Config, '{language}');
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      LoggingUtils.error(
        'Failed to initialize {Language} command runner:',
        error.message,
      );
      LoggingUtils.info(`Run /{language}-setup to configure your {Language} project`);
      throw error;
    }
  }

  /**
   * Check if tool is available
   */
  checkTool(toolName, required = true) {
    try {
      const isInstalled = ConfigUtils.checkToolInstalled(
        this.{language}Config,
        toolName,
        required,
      );

      if (!isInstalled && required) {
        throw new Error(
          `Required {Language} tool '${toolName}' is not installed. Run /{language}-setup to install it.`,
        );
      }

      return isInstalled;
    } catch (error) {
      if (required) {
        LoggingUtils.error(
          `{Language} tool '${toolName}' check failed:`,
          error.message,
        );
        LoggingUtils.info(`Run /{language}-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Execute {Language} command
   */
  async execute{Language}Command(command, args = [], options = {}) {
    try {
      await this.initialize();
      this.checkTool('{language}', true);

      const defaultOptions = {
        cwd: this.projectPath,
        stdio: 'inherit',
        shell: true,
        env: process.env,
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        env: options.env
          ? { ...defaultOptions.env, ...options.env }
          : defaultOptions.env,
      };

      LoggingUtils.info(`🚀 Executing: {language} ${command} ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        const {language}Path = this.platformDetector.getToolPath('{language}', {
          required: true,
        });

        const child = spawn({language}Path, [command, ...args], finalOptions);

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`{language} ${command} failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
          reject(new Error(`Failed to execute {language} ${command}: ${error.message}`));
        });
      });
    } catch (error) {
      return this._handle{Language}Error(error, { command, args, options });
    }
  }

  /**
   * Handle errors
   */
  _handle{Language}Error(error, context = {}) {
    const errorInfo = defaultErrorHandler.handleError(error, context);

    LoggingUtils.error(errorInfo.userMessage);

    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      LoggingUtils.info('💡 Recovery steps:');
      errorInfo.recoverySteps.forEach((step, i) => {
        LoggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    this._suggest{Language}Fix(error.message, context.command);

    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest fixes
   */
  _suggest{Language}Fix(errorMessage, command) {
    LoggingUtils.info('\n💡 {Language} Error Suggestions:');

    // Add language-specific suggestions
    if (errorMessage.includes('not found')) {
      LoggingUtils.info(`   • Install {language}: {installation-command}`);
      LoggingUtils.info(`   • Check PATH environment variable`);
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();
    // Implement test execution
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();
    // Implement build execution
  }
}

module.exports = {Language}CommandRunner;
```

### 5. Create Command Files

Create individual command files in `scripts/commands/`.

**Example:** `scripts/commands/{language}-setup.js`

```javascript
#!/usr/bin/env node
/**
 * {Language} Setup Command
 *
 * Interactive setup for {Language} projects
 */

const {Language}ConfigWizard = require('../../languages/{language}/config-wizard');

async function main() {
  try {
    const projectPath = process.cwd();
    const wizard = new {Language}ConfigWizard(projectPath);

    console.log(`🚀 {Language} Project Setup\n`);

    const config = await wizard.runWizard();

    if (config) {
      console.log(`\n✅ Setup completed successfully!`);
      console.log(`\n💡 Next steps:`);
      console.log(`  1. Run /{language}-test to test your project`);
      console.log(`  2. Run /{language}-build to build your project`);
    } else {
      console.log(`\n❌ Setup failed. Please check the errors above.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Setup failed:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
```

### 6. Create Documentation

Create user documentation in `commands/`.

**Example:** `commands/{language}-setup.md`

````markdown
# `/{language}-setup` - {Language} Project Setup

Interactive setup wizard for configuring {Language} projects in opencode.

## Overview

The `/{language}-setup` command guides you through configuring your {Language} project with opencode.

## Usage

```bash
/{language}-setup
```
````

## Features

- **Automatic Detection**: Detects {Language} and related tools
- **Environment Report**: Shows detailed information about your setup
- **Smart Configuration**: Creates optimized configuration
- **Tool Recommendations**: Suggests useful tools to install

## What It Does

1. Checks for {Language} installation
2. Detects project type and tools
3. Guides through configuration options
4. Saves configuration for opencode

## Output

After successful setup, you'll see:

1. **Environment Report**: Summary of detected tools
2. **Project Configuration**: Details about your project
3. **Available Commands**: List of {Language} commands
4. **Next Steps**: Recommended actions

## Available Commands After Setup

- `/{language}-test` - Run tests
- `/{language}-build` - Build project
- `/{language}-run` - Run project

## Examples

```bash
# In a {Language} project directory
/{language}-setup
```

## Troubleshooting

### "{Language} is not installed"

```bash
# Install {Language} first:
# macOS: brew install {language}
# Ubuntu: sudo apt install {language}
# Windows: Download from {language-url}
```

### "Project not detected as {Language}"

- Ensure {Language} project files exist
- Check for language-specific configuration files
- Run setup from the correct directory

## Related Commands

- `/{language}-test` - Run tests after setup
- `/{language}-build` - Build your project
- `/{language}-run` - Run your project

````

## Testing Your Implementation

### 1. Syntax Check
```bash
node -c languages/{language}/config-wizard.js
node -c languages/{language}/tool-detector.js
node -c scripts/{language}/command-runner.js
node -c scripts/commands/{language}-*.js
````

### 2. Run Existing Tests

```bash
npm test
```

### 3. Manual Testing

```bash
# Test setup command
node scripts/commands/{language}-setup.js

# Test other commands
node scripts/commands/{language}-test.js --help
```

## Best Practices

### 1. Follow Existing Patterns

- Use the same code structure as other languages
- Follow naming conventions (camelCase for functions, PascalCase for classes)
- Use shared utilities (ConfigUtils, FileUtils, LoggingUtils)

### 2. Error Handling

- Use try-catch blocks for async operations
- Provide helpful error messages
- Include recovery suggestions

### 3. Cross-Platform Support

- Use PlatformDetector for tool paths
- Handle different path separators (/, \)
- Consider Windows/macOS/Linux differences

### 4. Documentation

- Document all public methods with JSDoc
- Create user documentation for each command
- Include examples and troubleshooting

### 5. Code Quality

- Run ESLint: `npm run lint`
- Format code: `npm run format`
- Follow the project's coding standards

## Example Implementations

Study these existing implementations for reference:

- **JavaScript/TypeScript**: `languages/javascript/`, `scripts/javascript/`
- **Go**: `languages/go/`, `scripts/go/`
- **Python**: `languages/python/`, `scripts/commands/python-*.js`
- **Elixir**: `languages/elixir/`, `scripts/elixir/`
- **PineScript**: `languages/pinescript/`, `scripts/pinescript/`

## Common Patterns

### Tool Detection Pattern

```javascript
async detectTool(toolName) {
  const toolInfo = {
    name: toolName,
    installed: false,
    version: null,
    path: null,
  };

  try {
    const exists = commandExists(toolName);
    if (!exists) return toolInfo;

    const version = await this.getToolVersion(toolName);

    toolInfo.installed = true;
    toolInfo.version = version;
    toolInfo.path = this.platformDetector.getToolPath(toolName);

  } catch (error) {
    // Tool not found
  }

  return toolInfo;
}
```

### Command Execution Pattern

```javascript
async executeCommand(command, args = [], options = {}) {
  await this.initialize();
  this.checkTool('tool-name', true);

  LoggingUtils.info(`🚀 Executing: ${command} ${args.join(' ')}`);

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: this.projectPath,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...options.env },
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, code: 0 });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to execute command: ${error.message}`));
    });
  });
}
```

### Error Handling Pattern

```javascript
_handleError(error, context = {}) {
  const errorInfo = defaultErrorHandler.handleError(error, context);

  LoggingUtils.error(errorInfo.userMessage);

  if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
    LoggingUtils.info('💡 Recovery steps:');
    errorInfo.recoverySteps.forEach((step, i) => {
      LoggingUtils.info(`  ${i + 1}. ${step}`);
    });
  }

  // Language-specific suggestions
  this._suggestFix(error.message, context.command);

  const enhancedError = new Error(errorInfo.userMessage);
  enhancedError.recoverySteps = errorInfo.recoverySteps;
  enhancedError.originalError = error;
  throw enhancedError;
}
```

## Adding to the Test Suite

Once your implementation is complete, consider adding tests:

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test command execution
3. **Cross-Platform Tests**: Test on different operating systems

## Submission Process

1. **Code Review**: Ensure code follows project standards
2. **Testing**: Run all existing tests
3. **Documentation**: Verify documentation is complete
4. **Examples**: Provide usage examples
5. **Pull Request**: Submit for review

## Support

If you need help:

- Check existing language implementations
- Review this guide
- Ask for help in project discussions
- Submit issues for bugs or questions

## Contributing

Thank you for contributing to everything-opencode! Your language implementation will help other developers work more efficiently with their preferred programming languages.
