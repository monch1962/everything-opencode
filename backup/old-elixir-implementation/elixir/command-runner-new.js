#!/usr/bin/env node
/**
 * Elixir Command Runner
 *
 * Execute Elixir commands with project-specific improvements
 */

const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../interactive/config-manager');
const ElixirToolDetector = require('../../languages/elixir/tool-detector-new');
const PlatformDetector = require('../lib/platform-detector');
const { defaultErrorHandler } = require('../lib/error-handler');

// Import shared utilities
const { ConfigUtils, FileUtils, ProjectUtils, LoggingUtils } = require('../lib');

class ElixirCommandRunner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new ElixirToolDetector();
    this.platformDetector = new PlatformDetector();
    this.config = null;
    this.elixirConfig = null;
    this.detectedTools = null;
  }

  /**
   * Initialize command runner with Elixir setup
   */
  async initialize() {
    // First, validate that we're in an Elixir project using ProjectUtils
    try {
      const projectInfo = ProjectUtils.detectProjectType(this.projectPath);

      if (projectInfo.type !== 'elixir' && projectInfo.confidence < 0.7) {
        LoggingUtils.warn(
          `Project detection: ${projectInfo.type} (confidence: ${projectInfo.confidence})`
        );
        LoggingUtils.warn(
          'This may not be an Elixir project. Some features may not work correctly.'
        );
      } else if (projectInfo.type === 'elixir') {
        LoggingUtils.debug(
          `Detected Elixir project: ${projectInfo.framework || 'standard Elixir'}`
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
        throw new Error('Project not configured. Run /elixir-setup first.');
      }

      // Get Elixir configuration
      this.elixirConfig = this.config.elixir;
      if (!this.elixirConfig) {
        throw new Error('Elixir configuration not found. Run /elixir-setup first.');
      }

      // Validate Elixir configuration schema
      ConfigUtils.validateConfig(this.elixirConfig, 'elixir');

      // Detect tools
      this.detectedTools = await this.toolDetector.detectTools();

      return true;
    } catch (error) {
      // Use LoggingUtils for better error display
      LoggingUtils.error('Failed to initialize Elixir command runner:', error.message);
      LoggingUtils.info('Run /elixir-setup to configure your Elixir project');
      throw error;
    }
  }

  /**
   * Check if a specific tool is available
   */
  checkTool(toolName, required = true) {
    try {
      // Use ConfigUtils to check if tool is installed
      const isInstalled = ConfigUtils.checkToolInstalled(this.elixirConfig, toolName, required);

      if (!isInstalled && required) {
        throw new Error(
          `Required Elixir tool '${toolName}' is not installed. Run /elixir-setup to install it.`
        );
      }

      return isInstalled;
    } catch (error) {
      // Use LoggingUtils for better error display
      if (required) {
        LoggingUtils.error(`Elixir tool '${toolName}' check failed:`, error.message);
        throw error;
      }
      return false;
    }
  }

  /**
   * Execute a Mix command with proper error handling
   */
  async runMixCommand(args, options = {}) {
    const defaultOptions = {
      cwd: this.projectPath,
      stdio: 'inherit',
      env: { ...process.env, MIX_ENV: options.env || 'dev' },
      timeout: 300000, // 5 minutes default timeout
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      LoggingUtils.info(`Running: mix ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        const child = spawn('mix', args, finalOptions);

        let stdout = '';
        let stderr = '';

        if (child.stdout) {
          child.stdout.on('data', (data) => {
            stdout += data.toString();
            if (finalOptions.stdio === 'inherit') {
              process.stdout.write(data);
            }
          });
        }

        if (child.stderr) {
          child.stderr.on('data', (data) => {
            stderr += data.toString();
            if (finalOptions.stdio === 'inherit') {
              process.stderr.write(data);
            }
          });
        }

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0, stdout, stderr });
          } else {
            const error = new Error(`Mix command failed with exit code ${code}`);
            error.code = code;
            error.stdout = stdout;
            error.stderr = stderr;
            reject(error);
          }
        });

        child.on('error', (error) => {
          reject(error);
        });

        // Handle timeout
        if (finalOptions.timeout) {
          setTimeout(() => {
            child.kill('SIGTERM');
            reject(new Error(`Mix command timed out after ${finalOptions.timeout}ms`));
          }, finalOptions.timeout);
        }
      });
    } catch (error) {
      // Use defaultErrorHandler for consistent error handling
      defaultErrorHandler.handleError(error, {
        command: `mix ${args.join(' ')}`,
        tool: 'mix',
        category: 'COMMAND_EXECUTION',
      });
      throw error;
    }
  }

  /**
   * Execute an Elixir script
   */
  async runElixirScript(script, options = {}) {
    const defaultOptions = {
      cwd: this.projectPath,
      stdio: 'inherit',
      env: { ...process.env, MIX_ENV: options.env || 'dev' },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      LoggingUtils.info('Running Elixir script');

      return await new Promise((resolve, reject) => {
        const child = spawn('elixir', ['-e', script], finalOptions);

        let stdout = '';
        let stderr = '';

        if (child.stdout) {
          child.stdout.on('data', (data) => {
            stdout += data.toString();
            if (finalOptions.stdio === 'inherit') {
              process.stdout.write(data);
            }
          });
        }

        if (child.stderr) {
          child.stderr.on('data', (data) => {
            stderr += data.toString();
            if (finalOptions.stdio === 'inherit') {
              process.stderr.write(data);
            }
          });
        }

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0, stdout, stderr });
          } else {
            const error = new Error(`Elixir script failed with exit code ${code}`);
            error.code = code;
            error.stdout = stdout;
            error.stderr = stderr;
            reject(error);
          }
        });

        child.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      defaultErrorHandler.handleError(error, {
        command: 'elixir -e ...',
        tool: 'elixir',
        category: 'SCRIPT_EXECUTION',
      });
      throw error;
    }
  }

  /**
   * Run IEx (Interactive Elixir) with project context
   */
  async runIEx(args = [], options = {}) {
    const defaultOptions = {
      cwd: this.projectPath,
      stdio: 'inherit',
      env: { ...process.env, MIX_ENV: options.env || 'dev' },
    };

    const finalOptions = { ...defaultOptions, ...options };
    const iexArgs = ['-S', 'mix', ...args];

    try {
      LoggingUtils.info('Starting IEx (Interactive Elixir)');

      return await new Promise((resolve, reject) => {
        const child = spawn('iex', iexArgs, finalOptions);

        child.on('close', (code) => {
          if (code === 0 || code === 130) {
            // 130 is SIGINT (Ctrl+C)
            resolve({ success: true, code });
          } else {
            const error = new Error(`IEx session ended with exit code ${code}`);
            error.code = code;
            reject(error);
          }
        });

        child.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      defaultErrorHandler.handleError(error, {
        command: `iex ${iexArgs.join(' ')}`,
        tool: 'iex',
        category: 'INTERACTIVE_SESSION',
      });
      throw error;
    }
  }

  /**
   * Compile Elixir project
   */
  async compile(options = {}) {
    await this.initialize();

    const args = ['compile'];

    if (options.verbose) {
      args.push('--verbose');
    }

    if (options.warningsAsErrors) {
      args.push('--warnings-as-errors');
    }

    if (options.force) {
      args.push('--force');
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Run tests
   */
  async test(testPattern = null, options = {}) {
    await this.initialize();

    const args = ['test'];

    if (testPattern) {
      args.push(testPattern);
    }

    if (options.cover) {
      args.push('--cover');
    }

    if (options.trace) {
      args.push('--trace');
    }

    if (options.maxFailures) {
      args.push('--max-failures', options.maxFailures.toString());
    }

    if (options.seed) {
      args.push('--seed', options.seed.toString());
    }

    if (options.timeout) {
      args.push('--timeout', options.timeout.toString());
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Format code
   */
  async format(paths = ['.'], options = {}) {
    await this.initialize();

    const args = ['format'];

    if (paths && paths.length > 0) {
      args.push(...paths);
    }

    if (options.checkFormatted) {
      args.push('--check-formatted');
    }

    if (options.dryRun) {
      args.push('--dry-run');
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Lint code
   */
  async lint(paths = ['.'], options = {}) {
    await this.initialize();

    // Check if Credo is available
    const credoAvailable = this.checkTool('credo', false);

    if (!credoAvailable) {
      LoggingUtils.warn(
        'Credo not found. Using basic linting with mix compile --warnings-as-errors'
      );
      return await this.compile({ warningsAsErrors: true, ...options });
    }

    const args = ['credo'];

    if (paths && paths.length > 0) {
      args.push(...paths);
    }

    if (options.strict) {
      args.push('--strict');
    }

    if (options.all) {
      args.push('--all');
    }

    if (options.allPriorities) {
      args.push('--all-priorities');
    }

    if (options.format) {
      args.push('--format', options.format);
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Type checking with Dialyzer
   */
  async typecheck(options = {}) {
    await this.initialize();

    // Check if Dialyzer is configured
    const dialyzerAvailable = this.checkTool('dialyzer', false);

    if (!dialyzerAvailable) {
      throw new Error('Dialyzer not configured. Run /elixir-setup to configure type checking.');
    }

    const args = ['dialyzer'];

    if (options.ignoreExitStatus) {
      args.push('--ignore-exit-status');
    }

    if (options.listUnknown) {
      args.push('--list-unknown');
    }

    if (options.format) {
      args.push('--format', options.format);
    }

    if (options.noCheck) {
      args.push('--no-check');
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Security scanning
   */
  async security(options = {}) {
    await this.initialize();

    const securityTools = [];
    const results = [];

    // Check for Sobelow
    const sobelowAvailable = this.checkTool('sobelow', false);
    if (sobelowAvailable) {
      securityTools.push('sobelow');
    }

    // Check for mix_audit
    const mixAuditAvailable = this.checkTool('mix_audit', false);
    if (mixAuditAvailable) {
      securityTools.push('mix_audit');
    }

    if (securityTools.length === 0) {
      throw new Error(
        'No security tools configured. Run /elixir-setup to configure security scanning.'
      );
    }

    LoggingUtils.info(`Running security scan with: ${securityTools.join(', ')}`);

    // Run Sobelow if available
    if (sobelowAvailable) {
      try {
        LoggingUtils.info('Running Sobelow security scan...');
        const sobelowArgs = ['sobelow'];

        if (options.format) {
          sobelowArgs.push('--format', options.format);
        }

        if (options.verbose) {
          sobelowArgs.push('--verbose');
        }

        if (options.quiet) {
          sobelowArgs.push('--quiet');
        }

        if (options.exit) {
          sobelowArgs.push('--exit');
        }

        const sobelowResult = await this.runMixCommand(sobelowArgs, { ...options, stdio: 'pipe' });
        results.push({
          tool: 'sobelow',
          success: sobelowResult.code === 0,
          output: sobelowResult.stdout,
        });
      } catch (error) {
        results.push({
          tool: 'sobelow',
          success: false,
          error: error.message,
        });
      }
    }

    // Run mix_audit if available
    if (mixAuditAvailable) {
      try {
        LoggingUtils.info('Running mix_audit dependency scan...');
        const auditArgs = ['audit'];

        if (options.exitOnVuln) {
          auditArgs.push('--exit-on-vuln');
        }

        const auditResult = await this.runMixCommand(auditArgs, { ...options, stdio: 'pipe' });
        results.push({
          tool: 'mix_audit',
          success: auditResult.code === 0,
          output: auditResult.stdout,
        });
      } catch (error) {
        results.push({
          tool: 'mix_audit',
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: results.every((r) => r.success),
      tools: securityTools,
      results,
    };
  }

  /**
   * Dependency management
   */
  async deps(action = 'get', options = {}) {
    await this.initialize();

    const validActions = ['get', 'update', 'clean', 'compile', 'unlock', 'tree'];

    if (!validActions.includes(action)) {
      throw new Error(`Invalid action: ${action}. Valid actions: ${validActions.join(', ')}`);
    }

    const args = ['deps', action];

    if (options.only) {
      args.push('--only', options.only);
    }

    if (options.env) {
      args.push('--env', options.env);
    }

    if (options.target) {
      args.push('--target', options.target);
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Run Elixir application
   */
  async run(appArgs = [], options = {}) {
    await this.initialize();

    // First compile to ensure everything is up to date
    if (options.compile !== false) {
      await this.compile({ ...options, stdio: 'pipe' });
    }

    const args = ['run'];

    if (appArgs && appArgs.length > 0) {
      args.push('--');
      args.push(...appArgs);
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Clean build artifacts
   */
  async clean(options = {}) {
    await this.initialize();

    const args = ['clean'];

    if (options.deps) {
      args.push('--deps');
    }

    if (options.build) {
      args.push('--build');
    }

    if (options.all) {
      args.push('--all');
    }

    return await this.runMixCommand(args, options);
  }

  /**
   * Get project information
   */
  async info() {
    await this.initialize();

    const info = {
      project: {
        path: this.projectPath,
        config: this.elixirConfig,
      },
      tools: this.detectedTools,
      environment: {
        elixir: this.detectedTools.elixirInfo,
        erlang: this.detectedTools.erlangInfo,
        mixProject: this.detectedTools.mixProject,
      },
    };

    return info;
  }

  /**
   * Create new Elixir project
   */
  async createProject(projectType, projectName, options = {}) {
    const args = ['new', projectName];

    if (projectType === 'phoenix') {
      args[0] = 'phx.new';

      if (options.noEcto) {
        args.push('--no-ecto');
      }

      if (options.noHtml) {
        args.push('--no-html');
      }

      if (options.noWebpack) {
        args.push('--no-webpack');
      }

      if (options.database) {
        args.push('--database', options.database);
      }

      if (options.binaryId) {
        args.push('--binary-id');
      }

      if (options.umbrella) {
        args.push('--umbrella');
      }

      if (options.live) {
        args.push('--live');
      }
    } else if (projectType === 'umbrella') {
      args.push('--umbrella');
    } else if (projectType === 'app') {
      args.push('--app');
    } else if (projectType === 'lib') {
      args.push('--lib');
    }

    if (options.module) {
      args.push('--module', options.module);
    }

    return await this.runMixCommand(args, {
      ...options,
      cwd: path.dirname(path.join(this.projectPath, projectName)),
    });
  }
}

module.exports = ElixirCommandRunner;
