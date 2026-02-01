/**
 * C#/.NET Command Runner
 *
 * Execute C#/.NET commands with project-specific improvements
 */

const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const CSharpToolDetector = require('../../languages/csharp/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ConfigUtils, FileUtils, ProjectUtils, LoggingUtils } = require('../lib');

class CSharpCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new CSharpToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.csharpConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with C#/.NET setup
   */
  async initialize() {
    // First, validate that we're in a C# project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'csharp' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn('This may not be a C# project. Some features may not work correctly.');
      } else if (projectInfo.type === 'csharp') {
        LoggingUtils.debug(`Detected C# project: ${projectInfo.framework || 'standard C#'}`);
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
        throw new Error('Project not configured. Run /csharp-setup first.');
      }

      // Get C# configuration
      this.csharpConfig = this.config.csharp;
      if (!this.csharpConfig) {
        throw new Error('C# configuration not found. Run /csharp-setup first.');
      }

      // Validate C# configuration schema
      ConfigUtils.validateConfig(this.csharpConfig, 'csharp');

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error('Failed to initialize C# command runner:', error.message);
      LoggingUtils.info('Run /csharp-setup to configure your C# project');
      throw error;
    }
  }

  /**
   * Check if a specific tool is available
   */
  checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(this.csharpConfig, toolName, required);

      if (!isInstalled && required) {
        throw new Error(
          `Required C# tool '${toolName}' is not installed. Run /csharp-setup to install it.`
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(`C# tool '${toolName}' check failed:`, error.message);
        LoggingUtils.info(`Run /csharp-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Find C# files in the project
   */
  findCSharpFiles(pattern = '**/*.{cs,csproj,sln}', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: 'csharp',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find C# files:', error.message);
      return [];
    }
  }

  /**
   * Get C# project metadata
   */
  getCSharpProjectInfo() {
    try {
      const fs = require('fs');
      const info = {
        hasCsProj: fs.existsSync(path.join(this.projectPath, '*.csproj')),
        hasSln: fs.existsSync(path.join(this.projectPath, '*.sln')),
        hasProgramCs: fs.existsSync(path.join(this.projectPath, 'Program.cs')),
        hasStartupCs: fs.existsSync(path.join(this.projectPath, 'Startup.cs')),
        hasAppSettings: fs.existsSync(path.join(this.projectPath, 'appsettings.json')),
        hasWebConfig: fs.existsSync(path.join(this.projectPath, 'web.config')),
        hasAppConfig: fs.existsSync(path.join(this.projectPath, 'App.config')),
        csFiles: this.findCSharpFiles('**/*.cs').length,
        csprojFiles: this.findCSharpFiles('**/*.csproj').length,
        slnFiles: this.findCSharpFiles('**/*.sln').length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug('Failed to get C# project info:', error.message);
      return null;
    }
  }

  /**
   * Execute dotnet command with C#-specific improvements
   */
  async executeDotnetCommand(command, args = [], options = {}) {
    return this._executeDotnetCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with error handling
   */
  async _executeDotnetCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      await this.initialize();

      // Check if dotnet is available
      this.checkTool('dotnet', true);

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

      LoggingUtils.info(`🚀 Executing: dotnet ${command} ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        const dotnetPath = this.platformDetector.getToolPath('dotnet', {
          required: true,
        });

        const cmd = `${dotnetPath} ${command} ${args.join(' ')}`;
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        const child = spawn(dotnetPath, [command, ...args], finalOptions);

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`dotnet ${command} failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
          reject(new Error(`Failed to execute dotnet ${command}: ${error.message}`));
        });
      });
    } catch (error) {
      return this._handleDotnetError(error, { command, args, options });
    }
  }

  /**
   * Handle dotnet errors with C#-specific suggestions
   */
  _handleDotnetError(error, context = {}) {
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

    // C#-specific error suggestions
    this._suggestDotnetFix(error.message, context.command);

    // Re-throw enhanced error
    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest dotnet fixes based on error message
   */
  _suggestDotnetFix(errorMessage, _command) {
    LoggingUtils.info('\n💡 C#/.NET Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('command')) {
      LoggingUtils.info('   • Install .NET SDK: https://dotnet.microsoft.com/download');
      LoggingUtils.info('   • Verify dotnet is in PATH: dotnet --version');
      LoggingUtils.info('   • Restart terminal after installation');
    }

    if (errorMessage.includes('SDK') || errorMessage.includes('version')) {
      LoggingUtils.info('   • Check installed SDKs: dotnet --list-sdks');
      LoggingUtils.info('   • Update .NET SDK to required version');
      LoggingUtils.info('   • Use global.json to specify SDK version');
    }

    if (errorMessage.includes('NuGet') || errorMessage.includes('package')) {
      LoggingUtils.info('   • Restore packages: dotnet restore');
      LoggingUtils.info('   • Check NuGet package sources');
      LoggingUtils.info('   • Clear NuGet cache: dotnet nuget locals all --clear');
    }

    if (errorMessage.includes('build') || errorMessage.includes('compile')) {
      LoggingUtils.info('   • Clean solution: dotnet clean');
      LoggingUtils.info('   • Restore packages: dotnet restore');
      LoggingUtils.info('   • Check for syntax errors in .cs files');
    }

    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      LoggingUtils.info('   • Run as administrator (Windows) or use sudo (Linux/macOS)');
      LoggingUtils.info('   • Check file permissions on project directory');
      LoggingUtils.info('   • Try running in a different directory');
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();

    // Check for test framework
    const projectInfo = this.getCSharpProjectInfo();
    let testCommand = 'test';
    let testArgs = args;

    // Detect test framework
    if (this.detectedTools?.xunit?.installed) {
      testCommand = 'xunit';
    } else if (this.detectedTools?.nunit?.installed) {
      testCommand = 'nunit';
    } else if (this.detectedTools?.mstest?.installed) {
      testCommand = 'mstest';
    }

    // Add coverage if requested
    if (options.coverage) {
      testArgs = ['--collect:"XPlat Code Coverage"', ...testArgs];
    }

    LoggingUtils.info(`🧪 Running tests with ${testCommand}...`);

    try {
      const result = await this.executeDotnetCommand(testCommand, testArgs, options);

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
      const testResultsPath = path.join(this.projectPath, 'TestResults', '*.trx');
      const coveragePath = path.join(this.projectPath, 'coverage.cobertura.xml');

      if (fs.existsSync(coveragePath)) {
        LoggingUtils.info('\n📊 Test Coverage Available:');
        LoggingUtils.info('='.repeat(40));
        LoggingUtils.info(
          'Run: dotnet reportgenerator -reports:coverage.cobertura.xml -targetdir:coverage'
        );
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
    const projectInfo = this.getCSharpProjectInfo();
    let lintCommand = 'format';
    let lintArgs = ['analyzers', ...args];

    // Use Roslyn analyzers if available
    if (this.detectedTools?.dotnetFormat?.installed) {
      lintCommand = 'format';
      lintArgs = ['--verify-no-changes', ...args];
    }

    LoggingUtils.info(`🔍 Running linter with ${lintCommand}...`);

    try {
      const result = await this.executeDotnetCommand(lintCommand, lintArgs, options);

      // Show lint summary
      LoggingUtils.info('✅ Code analysis completed successfully');

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
    const projectInfo = this.getCSharpProjectInfo();
    let formatCommand = 'format';
    let formatArgs = args;

    // Use dotnet-format if available
    if (this.detectedTools?.dotnetFormat?.installed) {
      formatCommand = 'format';
      formatArgs = ['--include', '**/*.cs', ...formatArgs];
    }

    LoggingUtils.info(`🎨 Formatting code with ${formatCommand}...`);

    try {
      const result = await this.executeDotnetCommand(formatCommand, formatArgs, options);

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

    const projectInfo = this.getCSharpProjectInfo();
    const buildCommand = 'build';
    let buildArgs = args;

    // Add configuration if not specified
    if (!args.includes('--configuration')) {
      buildArgs = ['--configuration', 'Release', ...buildArgs];
    }

    LoggingUtils.info(`🔨 Building project...`);

    try {
      const result = await this.executeDotnetCommand(buildCommand, buildArgs, options);

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

    let devCommand = 'run';
    const devArgs = args;

    // Check for ASP.NET Core project
    const projectInfo = this.getCSharpProjectInfo();
    if (projectInfo.hasProgramCs || projectInfo.hasStartupCs) {
      devCommand = 'run';
      // Add watch for hot reload
      if (!args.includes('--watch')) {
        devArgs.unshift('--watch');
      }
    }

    LoggingUtils.info(`🚀 Starting development server with ${devCommand}...`);

    try {
      const result = await this.executeDotnetCommand(devCommand, devArgs, options);

      LoggingUtils.info('✅ Development server started');

      return result;
    } catch (error) {
      this._suggestDevFix(error.message);
      throw error;
    }
  }

  /**
   * Clean build artifacts
   */
  async clean(args = [], options = {}) {
    const cleanArgs = args;

    if (options.all) {
      cleanArgs.push('--verbosity', 'detailed');
    }

    if (options.deps) {
      cleanArgs.push('--force');
    }

    return await this.executeDotnetCommand('clean', cleanArgs, options);
  }

  /**
   * Restore NuGet packages
   */
  async restore(args = [], options = {}) {
    await this.initialize();

    LoggingUtils.info(`📦 Restoring NuGet packages...`);

    try {
      const result = await this.executeDotnetCommand('restore', args, options);

      LoggingUtils.info('✅ Packages restored successfully');

      return result;
    } catch (error) {
      this._suggestRestoreFix(error.message);
      throw error;
    }
  }

  /**
   * Publish project
   */
  async publish(args = [], options = {}) {
    await this.initialize();

    const publishCommand = 'publish';
    let publishArgs = args;

    // Add common publish options
    if (!args.includes('--configuration')) {
      publishArgs = ['--configuration', 'Release', ...publishArgs];
    }

    if (!args.includes('--output')) {
      publishArgs = [...publishArgs, '--output', './publish'];
    }

    LoggingUtils.info(`📤 Publishing project...`);

    try {
      const result = await this.executeDotnetCommand(publishCommand, publishArgs, options);

      LoggingUtils.info('✅ Project published successfully');

      return result;
    } catch (error) {
      this._suggestPublishFix(error.message);
      throw error;
    }
  }

  /**
   * Add NuGet package
   */
  async addPackage(packageName, args = [], options = {}) {
    await this.initialize();

    const addArgs = ['package', packageName, ...args];

    LoggingUtils.info(`📦 Adding package: ${packageName}`);

    try {
      const result = await this.executeDotnetCommand('add', addArgs, options);

      LoggingUtils.info(`✅ Package ${packageName} added successfully`);

      return result;
    } catch (error) {
      this._suggestPackageFix(error.message, packageName);
      throw error;
    }
  }

  /**
   * Remove NuGet package
   */
  async removePackage(packageName, args = [], options = {}) {
    await this.initialize();

    const removeArgs = ['package', packageName, ...args];

    LoggingUtils.info(`🗑️  Removing package: ${packageName}`);

    try {
      const result = await this.executeDotnetCommand('remove', removeArgs, options);

      LoggingUtils.info(`✅ Package ${packageName} removed successfully`);

      return result;
    } catch (error) {
      this._suggestPackageFix(error.message, packageName);
      throw error;
    }
  }

  /**
   * Show build information
   */
  _showBuildInfo(projectInfo) {
    LoggingUtils.info('\n📊 Build Information:');
    LoggingUtils.info('='.repeat(40));
    LoggingUtils.info(`C# files: ${projectInfo.csFiles}`);
    LoggingUtils.info(`Project files: ${projectInfo.csprojFiles}`);
    LoggingUtils.info(`Solution files: ${projectInfo.slnFiles}`);
    LoggingUtils.info(`Has Program.cs: ${projectInfo.hasProgramCs ? 'Yes' : 'No'}`);
    LoggingUtils.info(`Has Startup.cs: ${projectInfo.hasStartupCs ? 'Yes' : 'No'}`);
    LoggingUtils.info(`Has appsettings.json: ${projectInfo.hasAppSettings ? 'Yes' : 'No'}`);
    LoggingUtils.info('='.repeat(40));
  }

  /**
   * Suggest test fixes
   */
  _suggestTestFix(errorMessage) {
    LoggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('command')) {
      LoggingUtils.info('   • Install test framework: dotnet add package xunit');
      LoggingUtils.info('   • Add test project to solution');
      LoggingUtils.info('   • Create test files in Tests directory');
    }

    if (errorMessage.includes('assembly') || errorMessage.includes('reference')) {
      LoggingUtils.info('   • Add project reference: dotnet add reference ../src/Project.csproj');
      LoggingUtils.info('   • Check .csproj file for missing references');
      LoggingUtils.info('   • Restore packages: dotnet restore');
    }
  }

  /**
   * Suggest lint fixes
   */
  _suggestLintFix(errorMessage) {
    LoggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('analyzers') || errorMessage.includes('Roslyn')) {
      LoggingUtils.info(
        '   • Install Roslyn analyzers: dotnet add package Microsoft.CodeAnalysis.Analyzers'
      );
      LoggingUtils.info('   • Configure analyzers in .editorconfig');
      LoggingUtils.info('   • Install StyleCop if using StyleCop analyzers');
    }

    if (errorMessage.includes('format') || errorMessage.includes('dotnet-format')) {
      LoggingUtils.info('   • Install dotnet-format: dotnet tool install -g dotnet-format');
      LoggingUtils.info('   • Run dotnet format to fix formatting issues');
      LoggingUtils.info('   • Configure formatting rules in .editorconfig');
    }
  }

  /**
   * Suggest format fixes
   */
  _suggestFormatFix(errorMessage) {
    LoggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('dotnet-format') || errorMessage.includes('not installed')) {
      LoggingUtils.info('   • Install dotnet-format: dotnet tool install -g dotnet-format');
      LoggingUtils.info('   • Update dotnet-format: dotnet tool update -g dotnet-format');
      LoggingUtils.info('   • Run dotnet format --check to see formatting issues');
    }

    if (errorMessage.includes('editorconfig') || errorMessage.includes('.editorconfig')) {
      LoggingUtils.info('   • Create .editorconfig file in project root');
      LoggingUtils.info('   • Configure formatting rules in .editorconfig');
      LoggingUtils.info('   • Use Visual Studio to generate .editorconfig');
    }
  }

  /**
   * Suggest build fixes
   */
  _suggestBuildFix(errorMessage) {
    LoggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('SDK') || errorMessage.includes('version')) {
      LoggingUtils.info('   • Check .csproj TargetFramework matches installed SDK');
      LoggingUtils.info('   • Install required .NET SDK version');
      LoggingUtils.info('   • Use global.json to specify SDK version');
    }

    if (errorMessage.includes('NuGet') || errorMessage.includes('package')) {
      LoggingUtils.info('   • Restore packages: dotnet restore');
      LoggingUtils.info('   • Check NuGet package sources in nuget.config');
      LoggingUtils.info('   • Clear NuGet cache: dotnet nuget locals all --clear');
    }

    if (errorMessage.includes('CS') || errorMessage.includes('error')) {
      LoggingUtils.info('   • Check for syntax errors in .cs files');
      LoggingUtils.info('   • Fix missing using statements');
      LoggingUtils.info('   • Check for missing references');
    }
  }

  /**
   * Suggest dev server fixes
   */
  _suggestDevFix(errorMessage) {
    LoggingUtils.info('\n💡 Development Server Error Suggestions:');

    if (errorMessage.includes('port') || errorMessage.includes('in use')) {
      LoggingUtils.info('   • Change port: dotnet run --urls http://localhost:5001');
      LoggingUtils.info('   • Kill process using port (Windows: netstat -ano | findstr :5000)');
      LoggingUtils.info('   • Use different port in launchSettings.json');
    }

    if (errorMessage.includes('hot reload') || errorMessage.includes('watch')) {
      LoggingUtils.info('   • Ensure --watch flag is included');
      LoggingUtils.info('   • Check if project supports hot reload (ASP.NET Core 6+)');
      LoggingUtils.info('   • Restart development server');
    }
  }

  /**
   * Suggest restore fixes
   */
  _suggestRestoreFix(errorMessage) {
    LoggingUtils.info('\n💡 Package Restore Error Suggestions:');

    if (errorMessage.includes('source') || errorMessage.includes('feed')) {
      LoggingUtils.info('   • Check NuGet package sources in nuget.config');
      LoggingUtils.info('   • Add missing package source: dotnet nuget add source');
      LoggingUtils.info('   • Use --source flag to specify package source');
    }

    if (errorMessage.includes('version') || errorMessage.includes('compatible')) {
      LoggingUtils.info('   • Check package versions in .csproj file');
      LoggingUtils.info('   • Update package to compatible version');
      LoggingUtils.info('   • Check TargetFramework compatibility');
    }
  }

  /**
   * Suggest publish fixes
   */
  _suggestPublishFix(errorMessage) {
    LoggingUtils.info('\n💡 Publish Error Suggestions:');

    if (errorMessage.includes('runtime') || errorMessage.includes('RID')) {
      LoggingUtils.info('   • Specify runtime identifier: --runtime win-x64');
      LoggingUtils.info('   • Check available RIDs: dotnet --info');
      LoggingUtils.info('   • Publish self-contained: --self-contained true');
    }

    if (errorMessage.includes('output') || errorMessage.includes('directory')) {
      LoggingUtils.info('   • Specify output directory: --output ./publish');
      LoggingUtils.info('   • Ensure output directory is writable');
      LoggingUtils.info('   • Clean output directory before publishing');
    }
  }

  /**
   * Suggest package fixes
   */
  _suggestPackageFix(errorMessage, packageName) {
    LoggingUtils.info('\n💡 Package Management Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('exists')) {
      LoggingUtils.info(`   • Check if package '${packageName}' exists on NuGet`);
      LoggingUtils.info('   • Verify package name spelling');
      LoggingUtils.info('   • Check NuGet package sources');
    }

    if (errorMessage.includes('version') || errorMessage.includes('compatible')) {
      LoggingUtils.info('   • Specify version: dotnet add package PackageName --version 1.0.0');
      LoggingUtils.info('   • Check package compatibility with TargetFramework');
      LoggingUtils.info('   • Try different package version');
    }
  }

  /**
   * Run custom dotnet command
   */
  async run(command, args = [], options = {}) {
    const allArgs = [command, ...args];
    return await this.executeDotnetCommand(command, allArgs, options);
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    try {
      const version = await this.executeDotnetCommand('--version', [], {
        stdio: 'pipe',
      });
      const info = await this.executeDotnetCommand('--info', [], { stdio: 'pipe' });

      return {
        dotnetVersion: version.stdout?.trim() || 'unknown',
        dotnetInfo: info.stdout || 'No information available',
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Run C#/.NET security scanning
   */
  async runSecurityScan(options = {}) {
    await this.initialize();

    const securityTools = this.csharpConfig.securityTools || [
      'dotnet-list-package',
      'security-code-scan',
    ];
    const results = [];

    LoggingUtils.info('🔒 Running C#/.NET security scanning...');

    for (const tool of securityTools) {
      try {
        LoggingUtils.info(`Running ${tool}...`);
        const command = this.buildSecurityCommand(tool, options);
        await this.executeCommand(command, {
          cwd: this.projectPath,
          stdio: 'inherit',
        });
        results.push({ tool, success: true });
      } catch (error) {
        LoggingUtils.warn(`${tool} failed: ${error.message}`);
        results.push({ tool, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Build security scanning command
   */
  buildSecurityCommand(tool, options) {
    const args = [];

    switch (tool) {
      case 'dotnet-list-package':
        args.push('dotnet', 'list', 'package', '--vulnerable');
        if (options.output) args.push('--output', options.output);
        if (options.format) args.push('--format', options.format);
        break;

      case 'security-code-scan':
        args.push('dotnet', 'format', 'analyzers');
        if (options.diagnostics) args.push('--diagnostics', options.diagnostics);
        if (options.severity) args.push('--severity', options.severity);
        break;

      case 'sonar-scanner':
        args.push('dotnet', 'sonarscanner', 'begin');
        if (options.key) args.push('/k:' + options.key);
        if (options.name) args.push('/n:' + options.name);
        if (options.version) args.push('/v:' + options.version);
        args.push('&&', 'dotnet', 'build');
        args.push('&&', 'dotnet', 'sonarscanner', 'end');
        break;

      case 'owasp-dependency-check':
        args.push('dependency-check', '--scan', this.projectPath);
        if (options.format) args.push('--format', options.format);
        if (options.output) args.push('--out', options.output);
        break;

      default:
        args.push('dotnet', 'list', 'package', '--vulnerable');
    }

    return args;
  }

  /**
   * Manage C#/.NET dependencies
   */
  async manageDeps(action, packages = [], options = {}) {
    await this.initialize();

    LoggingUtils.info(`📦 Managing C#/.NET dependencies: ${action}`);

    try {
      switch (action) {
        case 'add':
          for (const pkg of packages) {
            await this.executeDotnetCommand(
              'add',
              ['package', pkg, ...this.buildDepsArgs(options)],
              options
            );
            LoggingUtils.info(`✅ Added package: ${pkg}`);
          }
          break;

        case 'remove':
          for (const pkg of packages) {
            await this.executeDotnetCommand('remove', ['package', pkg], options);
            LoggingUtils.info(`✅ Removed package: ${pkg}`);
          }
          break;

        case 'update':
          await this.executeDotnetCommand('update', options.all ? [] : packages, options);
          LoggingUtils.info(`✅ Updated ${options.all ? 'all' : packages.length} packages`);
          break;

        case 'list':
          const result = await this.executeDotnetCommand('list', ['package'], {
            ...options,
            stdio: 'pipe',
          });
          console.log(result.stdout);
          break;

        case 'outdated':
          await this.executeDotnetCommand('outdated', [], options);
          break;

        default:
          throw new Error(`Unknown dependency action: ${action}`);
      }

      return true;
    } catch (error) {
      LoggingUtils.error(`Dependency management failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build dependency management arguments
   */
  buildDepsArgs(options) {
    const args = [];

    if (options.version) args.push('--version', options.version);
    if (options.source) args.push('--source', options.source);
    if (options.framework) args.push('--framework', options.framework);
    if (options.prerelease) args.push('--prerelease');
    if (options.noRestore) args.push('--no-restore');

    return args;
  }
}

module.exports = CSharpCommandRunner;
