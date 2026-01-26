/**
 * JavaScript/TypeScript Command Runner
 *
 * Execute JavaScript/TypeScript commands with project-specific improvements
 */

const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const JSToolDetector = require('../../languages/javascript/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ConfigUtils, FileUtils, ProjectUtils, LoggingUtils } = require('../lib');

class JSCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new JSToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.jsConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with JavaScript/TypeScript setup
   */
  async initialize() {
    // First, validate that we're in a JavaScript project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'javascript' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`,
        );
        LoggingUtils.warn(
          'This may not be a JavaScript project. Some features may not work correctly.',
        );
      } else if (projectInfo.type === 'javascript') {
        LoggingUtils.debug(
          `Detected JavaScript project: ${projectInfo.framework || 'standard JavaScript'}`,
        );
      }

      // Log detected languages if available
      if (projectInfo.languages && projectInfo.languages.length > 0) {
        LoggingUtils.debug(`Detected languages: ${projectInfo.languages.join(', ')}`);
      }
    } catch (error) {
      LoggingUtils.debug('Project detection failed:', error.message);
    }

    // Load configuration using ConfigUtils
    try {
      this.config = ConfigUtils.loadConfig(this.projectPath);
      if (!this.config) {
        throw new Error('Project not configured. Run /js-setup first.');
      }

      // Get JavaScript configuration
      this.jsConfig = this.config.javascript;
      if (!this.jsConfig) {
        throw new Error('JavaScript configuration not found. Run /js-setup first.');
      }

      // Validate JavaScript configuration schema
      ConfigUtils.validateConfig(this.jsConfig, 'javascript');

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error('Failed to initialize JavaScript command runner:', error.message);
      LoggingUtils.info('Run /js-setup to configure your JavaScript project');
      throw error;
    }
  }

  /**
   * Check if a specific tool is available
   */
  checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(this.jsConfig, toolName, required);

      if (!isInstalled && required) {
        throw new Error(
          `Required JavaScript tool '${toolName}' is not installed. Run /js-setup to install it.`,
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(`JavaScript tool '${toolName}' check failed:`, error.message);
        LoggingUtils.info(`Run /js-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Find JavaScript/TypeScript files in the project
   */
  findJSFiles(pattern = '**/*.{js,jsx,ts,tsx}', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: 'javascript',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find JavaScript files:', error.message);
      return [];
    }
  }

  /**
   * Get JavaScript project metadata
   */
  getJSProjectInfo() {
    try {
      const fs = require('fs');
      const info = {
        hasPackageJson: fs.existsSync(path.join(this.projectPath, 'package.json')),
        hasNodeModules: fs.existsSync(path.join(this.projectPath, 'node_modules')),
        hasTsConfig: fs.existsSync(path.join(this.projectPath, 'tsconfig.json')),
        hasEslintConfig:
          fs.existsSync(path.join(this.projectPath, '.eslintrc.js')) ||
          fs.existsSync(path.join(this.projectPath, '.eslintrc.json')) ||
          fs.existsSync(path.join(this.projectPath, '.eslintrc')),
        hasPrettierConfig:
          fs.existsSync(path.join(this.projectPath, '.prettierrc')) ||
          fs.existsSync(path.join(this.projectPath, 'prettier.config.js')),
        hasJestConfig:
          fs.existsSync(path.join(this.projectPath, 'jest.config.js')) ||
          fs.existsSync(path.join(this.projectPath, 'jest.config.json')),
        jsFiles: this.findJSFiles('**/*.{js,jsx}').length,
        tsFiles: this.findJSFiles('**/*.{ts,tsx}').length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug('Failed to get JavaScript project info:', error.message);
      return null;
    }
  }

  /**
   * Execute npm command with JavaScript-specific improvements
   */
  async executeNpmCommand(command, args = [], options = {}) {
    return this._executeNpmCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with error handling
   */
  async _executeNpmCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      await this.initialize();

      // Check if npm is available
      this.checkTool('npm', true);

      const defaultOptions = {
        cwd: this.projectPath,
        stdio: 'inherit',
        shell: true,
        env: process.env,
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        env: options.env ? { ...defaultOptions.env, ...options.env } : defaultOptions.env,
      };

      LoggingUtils.info(`🚀 Executing: npm ${command} ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        const npmPath = this.platformDetector.getToolPath('npm', {
          required: true,
        });

        const cmd = `${npmPath} ${command} ${args.join(' ')}`;
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        const child = spawn(npmPath, [command, ...args], finalOptions);

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`npm ${command} failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
          reject(new Error(`Failed to execute npm ${command}: ${error.message}`));
        });
      });
    } catch (error) {
      return this._handleNpmError(error, { command, args, options });
    }
  }

  /**
   * Handle npm errors with JavaScript-specific suggestions
   */
  _handleNpmError(error, context = {}) {
    const errorInfo = defaultErrorHandler.handleError(error, context);

    // Log user-friendly error message using LoggingUtils
    LoggingUtils.error(errorInfo.userMessage);

    // Log recovery steps using LoggingUtils
    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      LoggingUtils.info('💡 Recovery steps:');
      errorInfo.recoverySteps.forEach((step, i) => {
        LoggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    // JavaScript-specific error suggestions
    this._suggestNpmFix(error.message, context.command);

    // Re-throw enhanced error
    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest npm fixes based on error message
   */
  _suggestNpmFix(errorMessage, _command) {
    LoggingUtils.info('\n💡 JavaScript/TypeScript Error Suggestions:');

    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Run: npm install');
      LoggingUtils.info('   • Check package.json for correct dependencies');
      LoggingUtils.info('   • Verify node_modules directory exists');
    }

    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      LoggingUtils.info('   • Fix permissions: sudo chown -R $USER node_modules');
      LoggingUtils.info('   • Or use: npm install --unsafe-perm');
      LoggingUtils.info('   • Consider using nvm for better permission management');
    }

    if (errorMessage.includes('version') || errorMessage.includes('incompatible')) {
      LoggingUtils.info('   • Update packages: npm update');
      LoggingUtils.info('   • Check package.json version constraints');
      LoggingUtils.info('   • Clear cache: npm cache clean --force');
    }

    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      LoggingUtils.info('   • Increase memory: export NODE_OPTIONS=--max-old-space-size=4096');
      LoggingUtils.info('   • Close other applications using memory');
      LoggingUtils.info('   • Consider using --no-optional flag');
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();

    // Check for test framework
    const projectInfo = this.getJSProjectInfo();
    let testCommand = 'test';
    let testArgs = args;

    // Detect test framework
    if (projectInfo.hasJestConfig) {
      testCommand = 'jest';
    } else if (this.detectedTools?.vitest?.installed) {
      testCommand = 'vitest';
    } else if (this.detectedTools?.mocha?.installed) {
      testCommand = 'mocha';
    }

    // Add TypeScript support if needed
    if (projectInfo.hasTsConfig && testCommand === 'jest') {
      testArgs = ['--preset', 'ts-jest', ...testArgs];
    }

    LoggingUtils.info(`🧪 Running tests with ${testCommand}...`);

    try {
      const result = await this.executeNpmCommand('run', [testCommand, ...testArgs], options);

      // Show test summary if available
      this._showTestSummary(projectInfo);

      return result;
    } catch (error) {
      this._suggestTestFix(error.message);
      throw error;
    }
  }

  /**
   * Show test summary
   */
  _showTestSummary(_projectInfo) {
    try {
      // Try to read test results if available
      const fs = require('fs');
      const coveragePath = path.join(this.projectPath, 'coverage', 'coverage-summary.json');

      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const total = coverage.total;

        LoggingUtils.info('\n📊 Test Coverage Summary:');
        LoggingUtils.info('='.repeat(40));
        LoggingUtils.info(`Lines: ${total.lines.pct}%`);
        LoggingUtils.info(`Statements: ${total.statements.pct}%`);
        LoggingUtils.info(`Functions: ${total.functions.pct}%`);
        LoggingUtils.info(`Branches: ${total.branches.pct}%`);
        LoggingUtils.info('='.repeat(40));
      }
    } catch (error) {
      // Silently fail - coverage is optional
    }
  }

  /**
   * Run linter
   */
  async lint(args = [], options = {}) {
    await this.initialize();

    // Check for linter
    const projectInfo = this.getJSProjectInfo();
    let lintCommand = 'lint';
    let lintArgs = args;

    // Use ESLint if available
    if (projectInfo.hasEslintConfig || this.detectedTools?.eslint?.installed) {
      lintCommand = 'eslint';
      lintArgs = ['.', '--ext', '.js,.jsx,.ts,.tsx', ...lintArgs];
    }

    LoggingUtils.info(`🔍 Running linter with ${lintCommand}...`);

    try {
      const result = await this.executeNpmCommand('run', [lintCommand, ...lintArgs], options);

      // Show lint summary
      LoggingUtils.info('✅ Linting completed successfully');

      return result;
    } catch (error) {
      this._suggestLintFix(error.message);
      throw error;
    }
  }

  /**
   * Format code
   */
  async format(args = [], options = {}) {
    await this.initialize();

    // Check for formatter
    const projectInfo = this.getJSProjectInfo();
    let formatCommand = 'format';
    let formatArgs = args;

    // Use Prettier if available
    if (projectInfo.hasPrettierConfig || this.detectedTools?.prettier?.installed) {
      formatCommand = 'prettier';
      formatArgs = ['--write', '.', ...formatArgs];
    }

    LoggingUtils.info(`🎨 Formatting code with ${formatCommand}...`);

    try {
      const result = await this.executeNpmCommand('run', [formatCommand, ...formatArgs], options);

      LoggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this._suggestFormatFix(error.message);
      throw error;
    }
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getJSProjectInfo();
    const buildCommand = 'build';
    let buildArgs = args;

    // TypeScript compilation
    if (projectInfo.hasTsConfig) {
      buildArgs = ['tsc', ...buildArgs];
    }

    LoggingUtils.info(`🔨 Building project...`);

    try {
      const result = await this.executeNpmCommand('run', [buildCommand, ...buildArgs], options);

      // Show build information
      this._showBuildInfo(projectInfo);

      return result;
    } catch (error) {
      this._suggestBuildFix(error.message);
      throw error;
    }
  }

  /**
   * Start development server
   */
  async dev(args = [], options = {}) {
    await this.initialize();

    let devCommand = 'dev';
    const devArgs = args;

    // Check for common dev scripts
    const scripts = ['dev', 'start', 'develop'];
    const packageJsonPath = path.join(this.projectPath, 'package.json');

    try {
      const fs = require('fs');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        for (const script of scripts) {
          if (packageJson.scripts && packageJson.scripts[script]) {
            devCommand = script;
            break;
          }
        }
      }
    } catch (error) {
      // Use default dev command
    }

    LoggingUtils.info(`🚀 Starting development server with ${devCommand}...`);

    try {
      const result = await this.executeNpmCommand('run', [devCommand, ...devArgs], options);

      LoggingUtils.info('✅ Development server started');

      return result;
    } catch (error) {
      this._suggestDevFix(error.message);
      throw error;
    }
  }

  /**
   * TypeScript type checking
   */
  async typecheck(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getJSProjectInfo();
    if (!projectInfo.hasTsConfig) {
      throw new Error('TypeScript configuration (tsconfig.json) not found.');
    }

    LoggingUtils.info(`🔍 Running TypeScript type checking...`);

    try {
      const result = await this.executeNpmCommand('run', ['typecheck', ...args], options);

      LoggingUtils.info('✅ Type checking completed successfully');

      return result;
    } catch (error) {
      this._suggestTypeCheckFix(error.message);
      throw error;
    }
  }

  /**
   * Install dependencies
   */
  async install(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.info(`📦 Installing dependencies...`);

    try {
      const result = await this.executeNpmCommand('install', args, options);

      LoggingUtils.info('✅ Dependencies installed successfully');

      return result;
    } catch (error) {
      this._suggestInstallFix(error.message);
      throw error;
    }
  }

  /**
   * Show build information
   */
  _showBuildInfo(projectInfo) {
    LoggingUtils.info('\n📊 Build Information:');
    LoggingUtils.info('='.repeat(40));
    LoggingUtils.info(`JavaScript files: ${projectInfo.jsFiles}`);
    LoggingUtils.info(`TypeScript files: ${projectInfo.tsFiles}`);
    LoggingUtils.info(`Has TypeScript: ${projectInfo.hasTsConfig ? 'Yes' : 'No'}`);
    LoggingUtils.info(`Has ESLint: ${projectInfo.hasEslintConfig ? 'Yes' : 'No'}`);
    LoggingUtils.info(`Has Prettier: ${projectInfo.hasPrettierConfig ? 'Yes' : 'No'}`);
    LoggingUtils.info('='.repeat(40));
  }

  /**
   * Suggest test fixes
   */
  _suggestTestFix(errorMessage) {
    LoggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('command')) {
      LoggingUtils.info('   • Install test framework: npm install --save-dev jest');
      LoggingUtils.info('   • Add test script to package.json');
      LoggingUtils.info('   • Create test files in __tests__ or test directory');
    }

    if (errorMessage.includes('import') || errorMessage.includes('module')) {
      LoggingUtils.info('   • Check import statements in test files');
      LoggingUtils.info('   • Configure module resolution in jest.config.js');
      LoggingUtils.info('   • Use babel-jest for ES6+ syntax');
    }
  }

  /**
   * Suggest lint fixes
   */
  _suggestLintFix(errorMessage) {
    LoggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('ESLint') || errorMessage.includes('parser')) {
      LoggingUtils.info('   • Install ESLint: npm install --save-dev eslint');
      LoggingUtils.info('   • Create .eslintrc.js configuration');
      LoggingUtils.info('   • Install TypeScript ESLint if using TypeScript');
    }

    if (errorMessage.includes('rule') || errorMessage.includes('configuration')) {
      LoggingUtils.info('   • Check ESLint rule configuration');
      LoggingUtils.info('   • Disable problematic rules with // eslint-disable-next-line');
      LoggingUtils.info('   • Update ESLint to latest version');
    }
  }

  /**
   * Suggest format fixes
   */
  _suggestFormatFix(errorMessage) {
    LoggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('Prettier') || errorMessage.includes('parser')) {
      LoggingUtils.info('   • Install Prettier: npm install --save-dev prettier');
      LoggingUtils.info('   • Create .prettierrc configuration');
      LoggingUtils.info('   • Add prettier script to package.json');
    }
  }

  /**
   * Suggest build fixes
   */
  _suggestBuildFix(errorMessage) {
    LoggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('TypeScript') || errorMessage.includes('tsc')) {
      LoggingUtils.info('   • Install TypeScript: npm install --save-dev typescript');
      LoggingUtils.info('   • Create tsconfig.json configuration');
      LoggingUtils.info('   • Check TypeScript compiler options');
    }

    if (errorMessage.includes('module') || errorMessage.includes('import')) {
      LoggingUtils.info('   • Check import/export statements');
      LoggingUtils.info('   • Configure module resolution in tsconfig.json');
      LoggingUtils.info('   • Install missing type definitions: @types/package-name');
    }
  }

  /**
   * Suggest dev server fixes
   */
  _suggestDevFix(errorMessage) {
    LoggingUtils.info('\n💡 Development Server Error Suggestions:');

    if (errorMessage.includes('port') || errorMessage.includes('EADDRINUSE')) {
      LoggingUtils.info('   • Change port: npm run dev -- --port 3001');
      LoggingUtils.info('   • Kill process using port: lsof -ti:3000 | xargs kill');
      LoggingUtils.info('   • Use different port in .env file');
    }

    if (errorMessage.includes('hot reload') || errorMessage.includes('HMR')) {
      LoggingUtils.info('   • Check webpack/vite configuration for HMR');
      LoggingUtils.info('   • Ensure dev server supports hot module replacement');
      LoggingUtils.info('   • Check browser console for HMR errors');
    }
  }

  /**
   * Suggest type checking fixes
   */
  _suggestTypeCheckFix(errorMessage) {
    LoggingUtils.info('\n💡 Type Checking Error Suggestions:');

    if (errorMessage.includes('type') || errorMessage.includes('interface')) {
      LoggingUtils.info('   • Add type annotations to function parameters and return types');
      LoggingUtils.info('   • Define interfaces for complex objects');
      LoggingUtils.info('   • Use type guards for runtime type checking');
    }

    if (errorMessage.includes('any') || errorMessage.includes('unknown')) {
      LoggingUtils.info('   • Avoid using "any" type - use specific types instead');
      LoggingUtils.info('   • Use "unknown" with type guards for safer code');
      LoggingUtils.info('   • Enable strict mode in tsconfig.json');
    }
  }

  /**
   * Suggest install fixes
   */
  _suggestInstallFix(errorMessage) {
    LoggingUtils.info('\n💡 Installation Error Suggestions:');

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      LoggingUtils.info('   • Check internet connection');
      LoggingUtils.info(
        '   • Use different registry: npm config set registry https://registry.npmjs.org/',
      );
      LoggingUtils.info('   • Clear npm cache: npm cache clean --force');
    }

    if (errorMessage.includes('peer') || errorMessage.includes('dependency')) {
      LoggingUtils.info('   • Install peer dependencies manually');
      LoggingUtils.info('   • Use --legacy-peer-deps flag for npm 7+');
      LoggingUtils.info('   • Check package.json for version conflicts');
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    const args = [];

    if (options.all) {
      args.push('--all');
    }

    if (options.deps) {
      args.push('--deps');
    }

    if (options.build) {
      args.push('--build');
    }

    return await this.executeNpmCommand('run', ['clean', ...args], options);
  }

  /**
   * Run custom npm script
   */
  async run(script, args = [], options = {}) {
    const allArgs = [script, ...args];
    return await this.executeNpmCommand('run', allArgs, options);
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    try {
      const version = await this.executeNpmCommand('--version', [], {
        stdio: 'pipe',
      });
      const deps = await this.executeNpmCommand('list', [], { stdio: 'pipe' });

      return {
        npmVersion: version.stdout?.trim() || 'unknown',
        dependencies: deps.stdout || 'No dependencies listed',
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = JSCommandRunner;
