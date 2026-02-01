#!/usr/bin/env node
/**
 * Python Command Runner
 *
 * Execute Python commands with project-specific improvements
 */

const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const PythonToolDetector = require('../../languages/python/tool-detector');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ConfigUtils, FileUtils, ProjectUtils, LoggingUtils } = require('../lib');

class PythonCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new PythonToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.pythonConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with Python setup
   */
  async initialize() {
    // First, validate that we're in a Python project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'python' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn(
          'This may not be a Python project. Some features may not work correctly.'
        );
      } else if (projectInfo.type === 'python') {
        LoggingUtils.debug(
          `Detected Python project: ${projectInfo.framework || 'standard Python'}`
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
        throw new Error('Project not configured. Run /python-setup first.');
      }

      // Get Python configuration
      this.pythonConfig = this.config.python;
      if (!this.pythonConfig) {
        throw new Error('Python configuration not found. Run /python-setup first.');
      }

      // Validate Python configuration schema
      ConfigUtils.validateConfig(this.pythonConfig, 'python');

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error('Failed to initialize Python command runner:', error.message);
      LoggingUtils.info('Run /python-setup to configure your Python project');
      throw error;
    }
  }

  /**
   * Check if a specific tool is available
   */
  checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(this.pythonConfig, toolName, required);

      if (!isInstalled && required) {
        throw new Error(
          `Required Python tool '${toolName}' is not installed. Run /python-setup to install it.`
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(`Python tool '${toolName}' check failed:`, error.message);
        LoggingUtils.info(`Run /python-setup to install '${toolName}'`);
      }
      throw error;
    }
  }

  /**
   * Find Python files in the project
   */
  findPythonFiles(pattern = '**/*.py', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: 'python',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find Python files:', error.message);
      return [];
    }
  }

  /**
   * Get Python project metadata
   */
  getPythonProjectInfo() {
    try {
      const fs = require('fs');
      const info = {
        hasPyProjectToml: fs.existsSync(path.join(this.projectPath, 'pyproject.toml')),
        hasRequirementsTxt: fs.existsSync(path.join(this.projectPath, 'requirements.txt')),
        hasSetupPy: fs.existsSync(path.join(this.projectPath, 'setup.py')),
        hasPipfile: fs.existsSync(path.join(this.projectPath, 'Pipfile')),
        hasPipfileLock: fs.existsSync(path.join(this.projectPath, 'Pipfile.lock')),
        hasPoetryLock: fs.existsSync(path.join(this.projectPath, 'poetry.lock')),
        hasUvLock: fs.existsSync(path.join(this.projectPath, 'uv.lock')),
        hasCondaYml: fs.existsSync(path.join(this.projectPath, 'environment.yml')),
        hasVirtualEnv:
          fs.existsSync(path.join(this.projectPath, '.venv')) ||
          fs.existsSync(path.join(this.projectPath, 'venv')) ||
          fs.existsSync(path.join(this.projectPath, 'env')),
        hasDjangoSettings: fs.existsSync(path.join(this.projectPath, 'manage.py')),
        hasFlaskApp:
          fs.existsSync(path.join(this.projectPath, 'app.py')) ||
          fs.existsSync(path.join(this.projectPath, 'wsgi.py')),
        hasFastApiMain: fs.existsSync(path.join(this.projectPath, 'main.py')),
        pythonFiles: this.findPythonFiles('**/*.py').length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug('Failed to get Python project info:', error.message);
      return null;
    }
  }

  /**
   * Execute Python command with Python-specific improvements
   */
  async executePythonCommand(command, args = [], options = {}) {
    return this._executePythonCommandWithErrorHandling(command, args, options);
  }

  /**
   * Internal method with error handling
   */
  async _executePythonCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      await this.initialize();

      // Check if Python is available
      this.checkTool('python', true);

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
        const pythonPath = this.platformDetector.getToolPath('python', {
          required: true,
        });

        const cmd = `${pythonPath} ${command} ${args.join(' ')}`;
        LoggingUtils.debug(`🔍 Executing: ${cmd}`);
        LoggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        LoggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        const child = spawn(pythonPath, [command, ...args], finalOptions);

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
      return this._handlePythonError(error, { command, args, options });
    }
  }

  /**
   * Handle Python errors with Python-specific suggestions
   */
  _handlePythonError(error, context = {}) {
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

    // Python-specific error suggestions
    this._suggestPythonFix(error.message, context.command);

    // Re-throw enhanced error
    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest Python fixes based on error message
   */
  _suggestPythonFix(errorMessage, _command) {
    LoggingUtils.info('\n💡 Python Error Suggestions:');

    if (errorMessage.includes('ModuleNotFoundError') || errorMessage.includes('ImportError')) {
      LoggingUtils.info('   • Install missing package: pip install <package-name>');
      LoggingUtils.info('   • Check virtual environment activation');
      LoggingUtils.info('   • Verify PYTHONPATH environment variable');
    }

    if (errorMessage.includes('PermissionError') || errorMessage.includes('EACCES')) {
      LoggingUtils.info('   • Fix permissions: sudo chown -R $USER .venv');
      LoggingUtils.info('   • Use virtual environment instead of system Python');
      LoggingUtils.info('   • Check file permissions on Python files');
    }

    if (errorMessage.includes('SyntaxError') || errorMessage.includes('IndentationError')) {
      LoggingUtils.info('   • Check Python version compatibility');
      LoggingUtils.info('   • Verify indentation (4 spaces per level)');
      LoggingUtils.info('   • Run black formatter: black .');
    }

    if (errorMessage.includes('AttributeError') || errorMessage.includes('TypeError')) {
      LoggingUtils.info('   • Check object types and attributes');
      LoggingUtils.info('   • Use type hints and mypy for type checking');
      LoggingUtils.info('   • Review function signatures and return types');
    }
  }

  /**
   * Run tests
   */
  async test(args = [], options = {}) {
    await this.initialize();

    // Check for test framework
    const projectInfo = this.getPythonProjectInfo();
    let testCommand = 'python';
    let testArgs = ['-m', 'pytest'];

    // Detect test framework from config
    if (this.pythonConfig.testRunner === 'pytest') {
      testCommand = 'python';
      testArgs = ['-m', 'pytest', ...args];
    } else if (this.pythonConfig.testRunner === 'unittest') {
      testCommand = 'python';
      testArgs = ['-m', 'unittest', 'discover', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools?.pytest?.installed) {
        testCommand = 'python';
        testArgs = ['-m', 'pytest', ...args];
      } else if (this.detectedTools?.unittest?.installed) {
        testCommand = 'python';
        testArgs = ['-m', 'unittest', 'discover', ...args];
      } else {
        throw new Error('No test runner configured or detected. Run /python-setup first.');
      }
    }

    LoggingUtils.info(`🧪 Running tests with ${testArgs[1]}...`);

    try {
      const result = await this.executePythonCommand(testCommand, testArgs, options);

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
      const coveragePath = path.join(this.projectPath, 'htmlcov', 'index.html');

      if (fs.existsSync(coveragePath)) {
        LoggingUtils.info('\n📊 Test coverage report available at: htmlcov/index.html');
        LoggingUtils.info('   Run: coverage html to generate report');
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
    let lintCommand = 'python';
    let lintArgs = [];

    if (this.pythonConfig.linter === 'ruff') {
      lintCommand = 'ruff';
      lintArgs = ['check', '.', ...args];
    } else if (this.pythonConfig.linter === 'flake8') {
      lintCommand = 'flake8';
      lintArgs = ['.', ...args];
    } else if (this.pythonConfig.linter === 'pylint') {
      lintCommand = 'pylint';
      lintArgs = ['**/*.py', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools?.ruff?.installed) {
        lintCommand = 'ruff';
        lintArgs = ['check', '.', ...args];
      } else if (this.detectedTools?.flake8?.installed) {
        lintCommand = 'flake8';
        lintArgs = ['.', ...args];
      } else if (this.detectedTools?.pylint?.installed) {
        lintCommand = 'pylint';
        lintArgs = ['**/*.py', ...args];
      } else {
        throw new Error('No linter configured or detected. Run /python-setup first.');
      }
    }

    LoggingUtils.info(`🔍 Running linter with ${lintCommand}...`);

    try {
      const result = await this.executePythonCommand(lintCommand, lintArgs, options);

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
    let formatCommand = 'python';
    let formatArgs = [];

    if (this.pythonConfig.formatter === 'ruff') {
      formatCommand = 'ruff';
      formatArgs = ['format', '.', ...args];
    } else if (this.pythonConfig.formatter === 'black') {
      formatCommand = 'black';
      formatArgs = ['.', ...args];
    } else if (this.pythonConfig.formatter === 'autopep8') {
      formatCommand = 'autopep8';
      formatArgs = ['--in-place', '--recursive', '.', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools?.ruff?.installed) {
        formatCommand = 'ruff';
        formatArgs = ['format', '.', ...args];
      } else if (this.detectedTools?.black?.installed) {
        formatCommand = 'black';
        formatArgs = ['.', ...args];
      } else if (this.detectedTools?.autopep8?.installed) {
        formatCommand = 'autopep8';
        formatArgs = ['--in-place', '--recursive', '.', ...args];
      } else {
        throw new Error('No formatter configured or detected. Run /python-setup first.');
      }
    }

    LoggingUtils.info(`🎨 Formatting code with ${formatCommand}...`);

    try {
      const result = await this.executePythonCommand(formatCommand, formatArgs, options);

      LoggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this._suggestFormatFix(error.message);
      throw error;
    }
  }

  /**
   * Type checking
   */
  async typecheck(args = [], options = {}) {
    await this.initialize();

    // Check for type checker from config
    let typecheckCommand = 'python';
    let typecheckArgs = [];

    if (this.pythonConfig.typeChecker === 'pyright') {
      typecheckCommand = 'pyright';
      typecheckArgs = ['.', ...args];
    } else if (this.pythonConfig.typeChecker === 'mypy') {
      typecheckCommand = 'mypy';
      typecheckArgs = ['.', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools?.pyright?.installed) {
        typecheckCommand = 'pyright';
        typecheckArgs = ['.', ...args];
      } else if (this.detectedTools?.mypy?.installed) {
        typecheckCommand = 'mypy';
        typecheckArgs = ['.', ...args];
      } else {
        throw new Error('No type checker configured or detected. Run /python-setup first.');
      }
    }

    LoggingUtils.info(`🔍 Running type checker with ${typecheckCommand}...`);

    try {
      const result = await this.executePythonCommand(typecheckCommand, typecheckArgs, options);

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

    // Check for dependency manager from config
    let installCommand = 'pip';
    let installArgs = ['install'];

    if (this.pythonConfig.dependencyManager === 'uv') {
      installCommand = 'uv';
      installArgs = ['pip', 'install', ...args];
    } else if (this.pythonConfig.dependencyManager === 'poetry') {
      installCommand = 'poetry';
      installArgs = ['install', ...args];
    } else if (this.pythonConfig.dependencyManager === 'pip') {
      installCommand = 'pip';
      installArgs = ['install', ...args];
    } else if (this.pythonConfig.dependencyManager === 'conda') {
      installCommand = 'conda';
      installArgs = ['install', ...args];
    } else {
      // Auto-detect
      if (this.detectedTools?.uv?.installed) {
        installCommand = 'uv';
        installArgs = ['pip', 'install', ...args];
      } else if (this.detectedTools?.poetry?.installed) {
        installCommand = 'poetry';
        installArgs = ['install', ...args];
      } else if (this.detectedTools?.pip?.installed) {
        installCommand = 'pip';
        installArgs = ['install', ...args];
      } else {
        throw new Error('No dependency manager configured or detected. Run /python-setup first.');
      }
    }

    LoggingUtils.info(`📦 Installing dependencies with ${installCommand}...`);

    try {
      const result = await this.executePythonCommand(installCommand, installArgs, options);

      LoggingUtils.info('✅ Dependencies installed successfully');

      return result;
    } catch (error) {
      this._suggestInstallFix(error.message);
      throw error;
    }
  }

  /**
   * Start development server
   */
  async dev(args = [], options = {}) {
    await this.initialize();

    const projectInfo = this.getPythonProjectInfo();
    let devCommand = 'python';
    let devArgs = [];

    // Detect framework
    if (projectInfo.hasDjangoSettings) {
      devCommand = 'python';
      devArgs = ['manage.py', 'runserver', ...args];
    } else if (projectInfo.hasFlaskApp) {
      devCommand = 'python';
      devArgs = ['-m', 'flask', 'run', ...args];
    } else if (projectInfo.hasFastApiMain) {
      devCommand = 'uvicorn';
      devArgs = ['main:app', '--reload', ...args];
    } else {
      // Check config for project type
      if (this.pythonConfig.projectType === 'django') {
        devCommand = 'python';
        devArgs = ['manage.py', 'runserver', ...args];
      } else if (this.pythonConfig.projectType === 'flask') {
        devCommand = 'python';
        devArgs = ['-m', 'flask', 'run', ...args];
      } else if (this.pythonConfig.projectType === 'fastapi') {
        devCommand = 'uvicorn';
        devArgs = ['main:app', '--reload', ...args];
      } else {
        throw new Error('No development server configuration found. Run /python-setup first.');
      }
    }

    LoggingUtils.info(`🚀 Starting development server with ${devCommand}...`);

    try {
      const result = await this.executePythonCommand(devCommand, devArgs, options);

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
  async clean(options = {}) {
    await this.initialize();

    const fs = require('fs');
    const paths = require('path');

    const artifacts = [
      '__pycache__',
      '.pytest_cache',
      '.mypy_cache',
      '.ruff_cache',
      '.coverage',
      'htmlcov',
      'dist',
      'build',
      '*.egg-info',
      '*.pyc',
      '*.pyo',
      '*.pyd',
      '.Python',
      'pip-log.txt',
      'pip-delete-this-directory.txt',
    ];

    let cleaned = 0;
    let errors = 0;

    LoggingUtils.info('🧹 Cleaning Python artifacts...');

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

    if (cleaned > 0) {
      LoggingUtils.info(`✅ Cleaned ${cleaned} Python artifacts`);
    } else {
      LoggingUtils.info('✅ No Python artifacts to clean');
    }

    if (errors > 0) {
      LoggingUtils.warn(`⚠️  Encountered ${errors} errors during cleanup`);
    }

    return { cleaned, errors };
  }

  /**
   * Run custom Python script
   */
  async run(script, args = [], options = {}) {
    await this.initialize();

    LoggingUtils.info(`▶️  Running Python script: ${script}`);

    try {
      const result = await this.executePythonCommand('python', [script, ...args], options);

      LoggingUtils.info('✅ Script execution completed');

      return result;
    } catch (error) {
      this._suggestRunFix(error.message, script);
      throw error;
    }
  }

  /**
   * Get project information
   */
  async getProjectInfo() {
    try {
      const pythonVersion = await this.executePythonCommand('python', ['--version'], {
        stdio: 'pipe',
      });
      const pipVersion = await this.executePythonCommand('pip', ['--version'], {
        stdio: 'pipe',
      });

      return {
        pythonVersion: pythonVersion.stdout?.trim() || 'unknown',
        pipVersion: pipVersion.stdout?.trim() || 'unknown',
        pythonConfig: this.pythonConfig,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Suggest test fixes
   */
  _suggestTestFix(errorMessage) {
    LoggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('command')) {
      LoggingUtils.info('   • Install pytest: pip install pytest');
      LoggingUtils.info('   • Create test files in tests/ directory');
      LoggingUtils.info('   • Run tests with: python -m pytest');
    }

    if (errorMessage.includes('import') || errorMessage.includes('module')) {
      LoggingUtils.info('   • Check import statements in test files');
      LoggingUtils.info('   • Add __init__.py files to test directories');
      LoggingUtils.info('   • Install test dependencies: pip install -r requirements-test.txt');
    }
  }

  /**
   * Suggest lint fixes
   */
  _suggestLintFix(errorMessage) {
    LoggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('ruff') || errorMessage.includes('flake8')) {
      LoggingUtils.info('   • Install ruff: pip install ruff');
      LoggingUtils.info('   • Or install flake8: pip install flake8');
      LoggingUtils.info('   • Create pyproject.toml or .flake8 configuration');
    }

    if (errorMessage.includes('rule') || errorMessage.includes('violation')) {
      LoggingUtils.info('   • Fix code style violations');
      LoggingUtils.info('   • Disable specific rules with # noqa comments');
      LoggingUtils.info('   • Update linter configuration');
    }
  }

  /**
   * Suggest format fixes
   */
  _suggestFormatFix(errorMessage) {
    LoggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('black') || errorMessage.includes('ruff')) {
      LoggingUtils.info('   • Install black: pip install black');
      LoggingUtils.info('   • Or install ruff: pip install ruff');
      LoggingUtils.info('   • Create pyproject.toml configuration');
    }

    if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {
      LoggingUtils.info('   • Fix syntax errors before formatting');
      LoggingUtils.info('   • Check Python version compatibility');
      LoggingUtils.info('   • Use --check flag to see what would be changed');
    }
  }

  /**
   * Suggest type checking fixes
   */
  _suggestTypeCheckFix(errorMessage) {
    LoggingUtils.info('\n💡 Type Checking Error Suggestions:');

    if (errorMessage.includes('mypy') || errorMessage.includes('pyright')) {
      LoggingUtils.info('   • Install mypy: pip install mypy');
      LoggingUtils.info('   • Or install pyright: pip install pyright');
      LoggingUtils.info('   • Create mypy.ini or pyrightconfig.json');
    }

    if (errorMessage.includes('type') || errorMessage.includes('annotation')) {
      LoggingUtils.info('   • Add type hints to function signatures');
      LoggingUtils.info('   • Define TypeVar for generic types');
      LoggingUtils.info('   • Use typing module for complex types');
    }
  }

  /**
   * Suggest install fixes
   */
  _suggestInstallFix(errorMessage) {
    LoggingUtils.info('\n💡 Installation Error Suggestions:');

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      LoggingUtils.info('   • Check internet connection');
      LoggingUtils.info('   • Use different PyPI mirror: pip install --index-url <url>');
      LoggingUtils.info('   • Increase timeout: pip install --timeout 60');
    }

    if (errorMessage.includes('version') || errorMessage.includes('compatibility')) {
      LoggingUtils.info('   • Check Python version compatibility');
      LoggingUtils.info('   • Use version specifiers in requirements.txt');
      LoggingUtils.info('   • Install specific version: pip install package==1.0.0');
    }
  }

  /**
   * Suggest dev server fixes
   */
  _suggestDevFix(errorMessage) {
    LoggingUtils.info('\n💡 Development Server Error Suggestions:');

    if (errorMessage.includes('port') || errorMessage.includes('EADDRINUSE')) {
      LoggingUtils.info('   • Change port: python manage.py runserver 8001');
      LoggingUtils.info('   • Kill process using port: lsof -ti:8000 | xargs kill');
      LoggingUtils.info('   • Use different port in .env file');
    }

    if (errorMessage.includes('module') || errorMessage.includes('import')) {
      LoggingUtils.info('   • Check Django/Flask/FastAPI installation');
      LoggingUtils.info('   • Verify WSGI/ASGI application configuration');
      LoggingUtils.info('   • Check virtual environment activation');
    }
  }

  /**
   * Suggest run fixes
   */
  _suggestRunFix(errorMessage, script) {
    LoggingUtils.info('\n💡 Script Execution Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('No such file')) {
      LoggingUtils.info(`   • Check if ${script} exists in current directory`);
      LoggingUtils.info('   • Use absolute path: python /path/to/script.py');
      LoggingUtils.info('   • Check file permissions');
    }

    if (errorMessage.includes('permission') || errorMessage.includes('EACCES')) {
      LoggingUtils.info('   • Make script executable: chmod +x script.py');
      LoggingUtils.info('   • Use shebang: #!/usr/bin/env python3');
      LoggingUtils.info('   • Run with python interpreter: python script.py');
    }
  }
}

module.exports = PythonCommandRunner;
