#!/usr/bin/env node
/**
 * Elixir Compilation Manager Module
 *
 * Handles Elixir compilation operations and information display
 */

const { runCommand } = require('../../lib/utils');
const { FileUtils, LoggingUtils } = require('../../lib');

class ElixirCompilationManager {
  constructor(projectPath, commandExecutor, elixirConfig, detectedTools) {
    this.projectPath = projectPath;
    this.commandExecutor = commandExecutor;
    this.elixirConfig = elixirConfig;
    this.detectedTools = detectedTools;
  }

  /**
   * Compile Elixir project with Elixir-specific improvements
   */
  async compile(options = {}) {
    const args = [];

    // Add compilation flags from config
    if (this.elixirConfig.compile?.flags) {
      args.push(...this.elixirConfig.compile.flags);
    }

    // Add warnings as errors
    if (options.warningsAsErrors) {
      args.push('--warnings-as-errors');
    }

    // Add force compilation
    if (options.force) {
      args.push('--force');
    }

    // Add verbose output
    if (options.verbose) {
      args.push('--verbose');
    }

    // Add long compilation
    if (options.longCompilation) {
      args.push('--long-compilation');
    }

    // Add profile
    if (options.profile) {
      args.push('--profile');
    }

    try {
      // Log compilation information
      const projectInfo = this.commandExecutor.getElixirProjectInfo();
      if (projectInfo) {
        LoggingUtils.debug(`Elixir files: ${projectInfo.elixirFiles}`);
        LoggingUtils.debug(`Has mix.exs: ${projectInfo.hasMixExs}`);
      }

      const result = await this.commandExecutor.executeMixCommand('compile', args, options);

      // Elixir-specific: Show compilation information
      if (result.success) {
        await this.showCompilationInfo(options);
      }

      return result;
    } catch (error) {
      // Elixir-specific: Provide helpful compilation error suggestions
      this.suggestCompilationFix(error.message);
      throw error;
    }
  }

  /**
   * Show compilation information
   */
  async showCompilationInfo(options) {
    try {
      // Get Elixir version
      const versionResult = runCommand('elixir --version', { cwd: this.projectPath });

      // Get OTP version
      const otpResult = runCommand(
        'erl -eval "erlang:display(erlang:system_info(otp_release)), halt()." -noshell',
        {
          cwd: this.projectPath,
        }
      );

      // Get mix environment
      const envResult = runCommand('mix env', { cwd: this.projectPath });

      LoggingUtils.info('📦 Compilation Information:');

      if (versionResult.stdout) {
        const versionMatch = versionResult.stdout.match(/Elixir (\d+\.\d+\.\d+)/);
        if (versionMatch) {
          LoggingUtils.info(`  • Elixir Version: ${versionMatch[1]}`);
        }
      }

      if (otpResult.stdout) {
        const otpMatch = otpResult.stdout.match(/"(\d+)"/);
        if (otpMatch) {
          LoggingUtils.info(`  • OTP Version: ${otpMatch[1]}`);
        }
      }

      if (envResult.stdout) {
        LoggingUtils.info(`  • Mix Environment: ${envResult.stdout.trim()}`);
      }

      // Show project structure
      const projectInfo = this.commandExecutor.getElixirProjectInfo();
      if (projectInfo) {
        LoggingUtils.info('  • Project Structure:');
        if (projectInfo.hasMixExs) LoggingUtils.info('    ✓ mix.exs');
        if (projectInfo.hasMixLock) LoggingUtils.info('    ✓ mix.lock');
        if (projectInfo.hasConfig) LoggingUtils.info('    ✓ config/');
        if (projectInfo.hasLib) LoggingUtils.info('    ✓ lib/');
        if (projectInfo.hasTest) LoggingUtils.info('    ✓ test/');
        LoggingUtils.info(`    • Elixir Files: ${projectInfo.elixirFiles}`);
      }

      // Show detected tools
      if (this.detectedTools) {
        const availableTools = Object.entries(this.detectedTools)
          .filter(([_, info]) => info.installed)
          .map(([name, _]) => name);

        if (availableTools.length > 0) {
          LoggingUtils.info(`  • Available Tools: ${availableTools.join(', ')}`);
        }
      }
    } catch (error) {
      LoggingUtils.debug('Failed to show compilation info:', error.message);
    }
  }

  /**
   * Suggest fixes for common compilation errors
   */
  suggestCompilationFix(errorMessage) {
    const suggestions = [];

    if (errorMessage.includes('module not found') || errorMessage.includes('undefined function')) {
      suggestions.push('Run /elixir-deps get to download dependencies');
      suggestions.push('Check if mix.exs file exists and is valid');
      suggestions.push('Verify module names and imports');
    }

    if (errorMessage.includes('syntax error')) {
      suggestions.push('Check for missing parentheses, commas, or do/end blocks');
      suggestions.push('Verify Elixir syntax in the problematic file');
      suggestions.push('Run /elixir-format to format code and catch syntax errors');
    }

    if (errorMessage.includes('compile error')) {
      suggestions.push('Check function arities (number of arguments)');
      suggestions.push('Verify pattern matching in function definitions');
      suggestions.push('Look for type mismatches');
    }

    if (errorMessage.includes('dependency')) {
      suggestions.push('Run /elixir-deps get to fetch dependencies');
      suggestions.push('Check hex.pm for package availability');
      suggestions.push('Verify dependency versions in mix.exs');
    }

    if (suggestions.length > 0) {
      LoggingUtils.info('💡 Compilation error suggestions:');
      suggestions.forEach((suggestion, i) => {
        LoggingUtils.info(`  ${i + 1}. ${suggestion}`);
      });
    }
  }
}

module.exports = ElixirCompilationManager;
