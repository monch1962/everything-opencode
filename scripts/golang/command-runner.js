#!/usr/bin/env node
/**
 * Go Command Runner
 *
 * Execute Go commands with project-specific improvements
 */

const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const GoToolDetector = require('../../languages/golang/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ConfigUtils, FileUtils, ProjectUtils, LoggingUtils } = require('../lib');

class GoCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new GoToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.goConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with Go setup
   */
  async initialize() {
    // First, validate that we're in a Go project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'go' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn('This may not be a Go project. Some features may not work correctly.');
      } else if (projectInfo.type === 'go') {
        LoggingUtils.debug(`Detected Go project: ${projectInfo.framework || 'standard Go'}`);
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
        throw new Error('Project not configured. Run /go-setup first.');
      }

      // Get Go configuration
      this.goConfig = this.config.go;
      if (!this.goConfig) {
        throw new Error('Go configuration not found. Run /go-setup first.');
      }

      // Validate Go configuration schema
      ConfigUtils.validateConfig(this.goConfig, 'go');

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error('Failed to initialize Go command runner:', error.message);
      LoggingUtils.info('Run /go-setup to configure your Go project');
      throw error;
    }
  }

  /**
   * Check if a specific tool is available
   */
  checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(this.goConfig, toolName, required);

      if (!isInstalled && required) {
        throw new Error(
          `Required Go tool '${toolName}' is not installed. Run /go-setup to install it.`
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(`Go tool '${toolName}' check failed:`, error.message);
        LoggingUtils.info(`Run /go-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Find Go files in the project
   */
  findGoFiles(pattern = '**/*.go', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: 'go',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find Go files:', error.message);
      return [];
    }
  }

  /**
   * Get Go project metadata
   */
  getGoProjectInfo() {
    try {
      const fs = require('fs');
      const info = {
        hasGoMod: fs.existsSync(path.join(this.projectPath, 'go.mod')),
        hasGoSum: fs.existsSync(path.join(this.projectPath, 'go.sum')),
        hasGoWork: fs.existsSync(path.join(this.projectPath, 'go.work')),
        hasVendor: fs.existsSync(path.join(this.projectPath, 'vendor')),
        hasMakefile: fs.existsSync(path.join(this.projectPath, 'Makefile')),
        hasDockerfile:
          fs.existsSync(path.join(this.projectPath, 'Dockerfile')) ||
          fs.existsSync(path.join(this.projectPath, 'docker-compose.yml')) ||
          fs.existsSync(path.join(this.projectPath, 'docker-compose.yaml')),
        hasTestFiles: this.findGoFiles('**/*_test.go').length > 0,
        goFiles: this.findGoFiles('**/*.go').length,
        testFiles: this.findGoFiles('**/*_test.go').length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug('Failed to get Go project info:', error.message);
      return null;
    }
  }

  /**
   * Execute Go command with Go-specific improvements
   */
  async executeGoCommand(command, args = [], options = {}) {
    return this._executeGoCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with error handling
   */
  async _executeGoCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      await this.initialize();

      // Check if Go is available
      this.checkTool('go', true);

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

      LoggingUtils.info(`🚀 Executing: ${command} ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        const goPath = this.platformDetector.getToolPath('go', {
          required: true,
        });

        const cmd = `${goPath} ${command} ${args.join(' ')}`;
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        const child = spawn(goPath, [command, ...args], finalOptions);

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`${command} failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
          reject(new Error(`Failed to execute ${command}: ${error.message}`));
        });
      });
    } catch (error) {
      return this._handleGoError(error, { command, args, options });
    }
  }

  /**
   * Handle Go errors with Go-specific suggestions
   */
  _handleGoError(error, context = {}) {
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

    // Go-specific error suggestions
    this._suggestGoFix(error.message, context.command);

    // Re-throw enhanced error
    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest Go fixes based on error message
   */
  _suggestGoFix(errorMessage, _command) {
    LoggingUtils.info('\n💡 Go Error Suggestions:');

    if (
      errorMessage.includes('cannot find module') ||
      errorMessage.includes('no required module')
    ) {
      LoggingUtils.info('   • Initialize go.mod: go mod init <module-name>');
      LoggingUtils.info('   • Download dependencies: go mod tidy');
      LoggingUtils.info('   • Check go.mod file for correct module path');
    }

    if (errorMessage.includes('undefined') || errorMessage.includes('not declared')) {
      LoggingUtils.info('   • Check import statements');
      LoggingUtils.info('   • Run goimports to fix imports: goimports -w .');
      LoggingUtils.info('   • Check variable/function names for typos');
    }

    if (errorMessage.includes('syntax error')) {
      LoggingUtils.info('   • Check Go syntax (missing braces, parentheses, etc.)');
      LoggingUtils.info('   • Run gofmt to format code: gofmt -w .');
      LoggingUtils.info('   • Verify Go version compatibility');
    }

    if (errorMessage.includes('permission denied') || errorMessage.includes('EACCES')) {
      LoggingUtils.info('   • Check file permissions');
      LoggingUtils.info('   • Run with sudo if needed (for system-wide installs)');
      LoggingUtils.info('   • Check GOPATH/bin is in PATH');
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();

    // Check for test framework
    const projectInfo = this.getGoProjectInfo();
    let testCommand = 'test';
    let testArgs = [...args];

    // Detect test framework from config
    if (this.goConfig.testRunner === 'go test') {
      testCommand = 'test';
      // Add verbose flag if requested
      if (options.verbose) {
        testArgs = ['-v', ...testArgs];
      }
      // Add race detector if requested
      if (options.race) {
        testArgs = ['-race', ...testArgs];
      }
      // Add coverage if requested
      if (options.coverage) {
        testArgs = ['-cover', ...testArgs];
      }
    } else if (this.goConfig.testRunner === 'ginkgo') {
      testCommand = 'ginkgo';
      if (options.verbose) {
        testArgs = ['-v', ...testArgs];
      }
    } else {
      // Default to go test
      testCommand = 'test';
    }

    LoggingUtils.info(`🧪 Running tests with ${testCommand}...`);

    try {
      const result = await this.executeGoCommand(testCommand, testArgs, options);

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
  _showTestSummary(projectInfo) {
    try {
      // Try to read test results if available
      const fs = require('fs');
      const coveragePath = path.join(this.projectPath, 'coverage.out');

      if (fs.existsSync(coveragePath)) {
        LoggingUtils.info('\n📊 Test coverage report available at: coverage.out');
        LoggingUtils.info('   Run: go tool cover -html=coverage.out to view in browser');
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

    // Check for linter from config
    let lintCommand = 'golangci-lint';
    let lintArgs = ['run'];

    if (this.goConfig.linter === 'golangci-lint') {
      lintCommand = 'golangci-lint';
      lintArgs = ['run', ...args];
    } else if (this.goConfig.linter === 'staticcheck') {
      lintCommand = 'staticcheck';
      lintArgs = ['.', ...args];
    } else if (this.goConfig.linter === 'revive') {
      lintCommand = 'revive';
      lintArgs = ['./...', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools['golangci-lint']?.installed) {
        lintCommand = 'golangci-lint';
        lintArgs = ['run', ...args];
      } else if (this.detectedTools.staticcheck?.installed) {
        lintCommand = 'staticcheck';
        lintArgs = ['.', ...args];
      } else if (this.detectedTools.revive?.installed) {
        lintCommand = 'revive';
        lintArgs = ['./...', ...args];
      } else {
        throw new Error('No linter configured or detected. Run /go-setup first.');
      }
    }

    LoggingUtils.info(`🔍 Running linter with ${lintCommand}...`);

    try {
      const result = await this.executeGoCommand(lintCommand, lintArgs, options);

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

    // Check for formatter from config
    let formatCommand = 'gofmt';
    let formatArgs = ['-w', '.'];

    if (this.goConfig.formatter === 'gofmt') {
      formatCommand = 'gofmt';
      formatArgs = ['-w', '.', ...args];
    } else if (this.goConfig.formatter === 'goimports') {
      formatCommand = 'goimports';
      formatArgs = ['-w', '.', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools.gofmt?.installed) {
        formatCommand = 'gofmt';
        formatArgs = ['-w', '.', ...args];
      } else if (this.detectedTools.goimports?.installed) {
        formatCommand = 'goimports';
        formatArgs = ['-w', '.', ...args];
      } else {
        throw new Error('No formatter configured or detected. Run /go-setup first.');
      }
    }

    LoggingUtils.info(`🎨 Formatting code with ${formatCommand}...`);

    try {
      const result = await this.executeGoCommand(formatCommand, formatArgs, options);

      LoggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this._suggestFormatFix(error.message);
      throw error;
    }
  }

  /**
   * Security scanning
   */
  async security(args = [], options = {}) {
    await this.initialize();

    // Check for security scanner from config
    let securityCommand = 'gosec';
    let securityArgs = ['./...'];

    if (this.goConfig.securityScanner === 'gosec') {
      securityCommand = 'gosec';
      securityArgs = ['./...', ...args];
    } else if (this.goConfig.securityScanner === 'govulncheck') {
      securityCommand = 'govulncheck';
      securityArgs = ['./...', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools.gosec?.installed) {
        securityCommand = 'gosec';
        securityArgs = ['./...', ...args];
      } else if (this.detectedTools.govulncheck?.installed) {
        securityCommand = 'govulncheck';
        securityArgs = ['./...', ...args];
      } else {
        throw new Error('No security scanner configured or detected. Run /go-setup first.');
      }
    }

    LoggingUtils.info(`🔒 Running security scan with ${securityCommand}...`);

    try {
      const result = await this.executeGoCommand(securityCommand, securityArgs, options);

      LoggingUtils.info('✅ Security scanning completed');

      return result;
    } catch (error) {
      this._suggestSecurityFix(error.message);
      throw error;
    }
  }

  /**
   * Build project
   */
  async build(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getGoProjectInfo();
    const buildCommand = 'build';
    let buildArgs = args;

    // Add output flag if not specified
    if (!args.some((arg) => arg.startsWith('-o'))) {
      buildArgs = ['-o', 'bin/app', ...buildArgs];
    }

    LoggingUtils.info(`🔨 Building project...`);

    try {
      const result = await this.executeGoCommand(buildCommand, buildArgs, options);

      // Show build information
      this._showBuildInfo(projectInfo);

      return result;
    } catch (error) {
      this._suggestBuildFix(error.message);
      throw error;
    }
  }

  /**
   * Run Go program
   */
  async run(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.info(`▶️  Running Go program...`);

    try {
      const result = await this.executeGoCommand('run', args, options);

      LoggingUtils.info('✅ Program execution completed');

      return result;
    } catch (error) {
      this._suggestRunFix(error.message);
      throw error;
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();

    const fs = require('fs');
    const paths = require('path');

    const artifacts = ['bin', 'dist', 'coverage.out', '*.test', '*.exe', 'vendor'];

    let cleaned = 0;
    let errors = 0;

    LoggingUtils.info('🧹 Cleaning Go artifacts...');

    for (const pattern of artifacts) {
      try {
        const glob = require('glob');
        const files = glob.sync(pattern, {
          cwd: this.projectPath,
          dot: true,
          absolute: true,
        });

        for (const file of files) {
          try {
            const stat = fs.statSync(file);
            if (stat.isDirectory()) {
              fs.rmSync(file, { recursive: true, force: true });
              LoggingUtils.debug(`Removed directory: ${paths.relative(this.projectPath, file)}`);
            } else {
              fs.unlinkSync(file);
              LoggingUtils.debug(`Removed file: ${paths.relative(this.projectPath, file)}`);
            }
            cleaned++;
          } catch (err) {
            LoggingUtils.debug(`Failed to remove ${file}: ${err.message}`);
            errors++;
          }
        }
      } catch (err) {
        LoggingUtils.debug(`Failed to glob ${pattern}: ${err.message}`);
        errors++;
      }
    }

    // Also run go clean
    try {
      await this.executeGoCommand('clean', []);
      LoggingUtils.debug('Ran go clean command');
    } catch (error) {
      LoggingUtils.debug(`go clean failed: ${error.message}`);
    }

    if (cleaned > 0) {
      LoggingUtils.info(`✅ Cleaned ${cleaned} Go artifacts`);
    } else {
      LoggingUtils.info('✅ No Go artifacts to clean');
    }

    if (errors > 0) {
      LoggingUtils.warn(`⚠️  Encountered ${errors} errors during cleanup`);
    }

    return { cleaned, errors };
  }

  /**
   * Manage Go modules
   */
  async mod(args = [], options = {}) {
    await this.initialize();

    const modCommand = 'mod';
    const modArgs = args;

    LoggingUtils.info(`📦 Managing Go modules...`);

    try {
      const result = await this.executeGoCommand(modCommand, modArgs, options);

      LoggingUtils.info('✅ Go modules operation completed');

      return result;
    } catch (error) {
      this._suggestModFix(error.message);
      throw error;
    }
  }

  /**
   * Show build information
   */
  _showBuildInfo(projectInfo) {
    LoggingUtils.info('\n📊 Build Information:');
    LoggingUtils.info('='.repeat(40));
    LoggingUtils.info(`Go files: ${projectInfo.goFiles}`);
    LoggingUtils.info(`Test files: ${projectInfo.testFiles}`);
    LoggingUtils.info(`Has go.mod: ${projectInfo.hasGoMod ? 'Yes' : 'No'}`);
    LoggingUtils.info(`Has vendor: ${projectInfo.hasVendor ? 'Yes' : 'No'}`);
    LoggingUtils.info(`Has Makefile: ${projectInfo.hasMakefile ? 'Yes' : 'No'}`);
    LoggingUtils.info('='.repeat(40));
  }

  /**
   * Suggest test fixes
   */
  _suggestTestFix(errorMessage) {
    LoggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('no test files')) {
      LoggingUtils.info('   • Create test files with _test.go suffix');
      LoggingUtils.info('   • Run tests in specific directory: go test ./...');
      LoggingUtils.info('   • Check test file naming convention');
    }

    if (errorMessage.includes('import') || errorMessage.includes('package')) {
      LoggingUtils.info('   • Check import statements in test files');
      LoggingUtils.info('   • Run go mod tidy to fix dependencies');
      LoggingUtils.info('   • Verify package names match directory structure');
    }
  }

  /**
   * Suggest lint fixes
   */
  _suggestLintFix(errorMessage) {
    LoggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('golangci-lint') || errorMessage.includes('not found')) {
      LoggingUtils.info(
        '   • Install golangci-lint: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest'
      );
      LoggingUtils.info('   • Create .golangci.yml configuration');
      LoggingUtils.info('   • Run with --fix flag: golangci-lint run --fix');
    }

    if (errorMessage.includes('rule') || errorMessage.includes('violation')) {
      LoggingUtils.info('   • Fix code style violations');
      LoggingUtils.info('   • Disable specific linters in configuration');
      LoggingUtils.info('   • Run formatter before linter');
    }
  }

  /**
   * Suggest format fixes
   */
  _suggestFormatFix(errorMessage) {
    LoggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('gofmt') || errorMessage.includes('goimports')) {
      LoggingUtils.info('   • Install gofmt: part of Go installation');
      LoggingUtils.info(
        '   • Install goimports: go install golang.org/x/tools/cmd/goimports@latest'
      );
      LoggingUtils.info('   • Check Go installation');
    }

    if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {
      LoggingUtils.info('   • Fix syntax errors before formatting');
      LoggingUtils.info('   • Check Go version compatibility');
      LoggingUtils.info('   • Use --diff flag to see what would be changed');
    }
  }

  /**
   * Suggest security fixes
   */
  _suggestSecurityFix(errorMessage) {
    LoggingUtils.info('\n💡 Security Error Suggestions:');

    if (errorMessage.includes('gosec') || errorMessage.includes('govulncheck')) {
      LoggingUtils.info(
        '   • Install gosec: go install github.com/securego/gosec/v2/cmd/gosec@latest'
      );
      LoggingUtils.info(
        '   • Install govulncheck: go install golang.org/x/vuln/cmd/govulncheck@latest'
      );
      LoggingUtils.info('   • Update dependencies: go get -u ./...');
    }

    if (errorMessage.includes('vulnerability') || errorMessage.includes('CVE')) {
      LoggingUtils.info('   • Update vulnerable dependencies');
      LoggingUtils.info('   • Check security advisories');
      LoggingUtils.info('   • Consider alternative libraries');
    }
  }

  /**
   * Suggest build fixes
   */
  _suggestBuildFix(errorMessage) {
    LoggingUtils.info('\n💡 Build Error Suggestions:');

    if (
      errorMessage.includes('cannot find module') ||
      errorMessage.includes('no required module')
    ) {
      LoggingUtils.info('   • Initialize go.mod: go mod init <module-name>');
      LoggingUtils.info('   • Download dependencies: go mod tidy');
      LoggingUtils.info('   • Check module path in go.mod');
    }

    if (errorMessage.includes('undefined') || errorMessage.includes('not declared')) {
      LoggingUtils.info('   • Check import statements');
      LoggingUtils.info('   • Verify function/variable names');
      LoggingUtils.info('   • Check package visibility (capitalization)');
    }
  }

  /**
   * Suggest run fixes
   */
  _suggestRunFix(errorMessage) {
    LoggingUtils.info('\n💡 Run Error Suggestions:');

    if (errorMessage.includes('no Go files') || errorMessage.includes('cannot find')) {
      LoggingUtils.info('   • Check current directory contains Go files');
      LoggingUtils.info('   • Specify main package: go run cmd/main.go');
      LoggingUtils.info('   • Check file permissions');
    }

    if (errorMessage.includes('import') || errorMessage.includes('package')) {
      LoggingUtils.info('   • Check import statements');
      LoggingUtils.info('   • Run go mod tidy to fix dependencies');
      LoggingUtils.info('   • Verify go.mod exists');
    }
  }

  /**
   * Suggest mod fixes
   */
  _suggestModFix(errorMessage) {
    LoggingUtils.info('\n💡 Module Error Suggestions:');

    if (errorMessage.includes('go.mod not found')) {
      LoggingUtils.info('   • Initialize go.mod: go mod init <module-name>');
      LoggingUtils.info('   • Check current directory');
      LoggingUtils.info('   • Navigate to project root');
    }

    if (errorMessage.includes('version') || errorMessage.includes('dependency')) {
      LoggingUtils.info('   • Update dependencies: go get -u ./...');
      LoggingUtils.info('   • Clean module cache: go clean -modcache');
      LoggingUtils.info('   • Check go.sum for consistency');
    }
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    try {
      const goVersion = await this.executeGoCommand('version', [], {
        stdio: 'pipe',
      });
      const goEnv = await this.executeGoCommand('env', [], {
        stdio: 'pipe',
      });

      return {
        goVersion: goVersion.stdout?.trim() || 'unknown',
        goEnv: goEnv.stdout?.trim() || 'unknown',
        goConfig: this.goConfig,
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = GoCommandRunner;
