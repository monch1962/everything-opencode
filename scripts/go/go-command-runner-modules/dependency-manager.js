#!/usr/bin/env node
/**
 * Go Dependency Manager Module
 *
 * Handles Go dependency management operations
 */

const { LoggingUtils } = require('../../lib');

class GoDependencyManager {
  constructor(projectPath, commandExecutor, goConfig) {
    this.projectPath = projectPath;
    this.commandExecutor = commandExecutor;
    this.goConfig = goConfig;
  }

  /**
   * Manage Go dependencies
   */
  async manageDependencies(options = {}) {
    const args = [];

    // Add operation
    if (options.operation === 'tidy') {
      args.push('tidy');
    } else if (options.operation === 'download') {
      args.push('download');
    } else if (options.operation === 'vendor') {
      args.push('vendor');
    } else {
      // Default to tidy
      args.push('tidy');
    }

    // Add verbose flag
    if (options.verbose) {
      args.push('-v');
    }

    LoggingUtils.info('📦 Managing Go dependencies...');

    try {
      const result = await this.commandExecutor.executeGoCommand('mod', args, options);

      if (result.success) {
        switch (args[0]) {
          case 'tidy':
            LoggingUtils.success('Dependencies tidied successfully');
            break;
          case 'download':
            LoggingUtils.success('Dependencies downloaded successfully');
            break;
          case 'vendor':
            LoggingUtils.success('Vendor directory created/updated');
            break;
        }

        // Show dependency information
        if (options.verbose) {
          await this.showDependencyInfo();
        }
      }

      return result;
    } catch (error) {
      LoggingUtils.error('Dependency management failed:', error.message);

      // Provide helpful suggestions
      this.suggestDependencyFix(error.message);
      throw error;
    }
  }

  /**
   * Show dependency information
   */
  async showDependencyInfo() {
    try {
      // Get module graph
      const graphResult = await this.commandExecutor.executeGoCommand('mod', ['graph'], {
        stdio: 'pipe',
      });

      if (graphResult.success && graphResult.stdout) {
        const lines = graphResult.stdout.trim().split('\n');
        LoggingUtils.info(`📊 Dependency Graph: ${lines.length} relationships`);

        // Show top-level dependencies
        const topLevelDeps = lines
          .filter((line) => line.includes('@'))
          .map((line) => {
            const parts = line.split(' ');
            return parts[0]; // Source module
          })
          .filter((value, index, self) => self.indexOf(value) === index)
          .slice(0, 10); // Show first 10

        if (topLevelDeps.length > 0) {
          LoggingUtils.info('  Top-level dependencies:');
          topLevelDeps.forEach((dep) => {
            LoggingUtils.info(`    • ${dep}`);
          });
        }
      }

      // Get why information for specific dependencies
      if (this.goConfig.dependencies?.track) {
        LoggingUtils.info('  Tracked dependencies:');
        for (const dep of this.goConfig.dependencies.track) {
          try {
            const whyResult = await this.commandExecutor.executeGoCommand('mod', ['why', dep], {
              stdio: 'pipe',
            });

            if (whyResult.success && whyResult.stdout) {
              const lines = whyResult.stdout.trim().split('\n');
              if (lines.length > 1) {
                LoggingUtils.info(`    • ${dep}: ${lines[1]}`);
              }
            }
          } catch (error) {
            // Ignore errors for individual dependency checks
          }
        }
      }
    } catch (error) {
      LoggingUtils.debug('Failed to show dependency info:', error.message);
    }
  }

  /**
   * Suggest fixes for common dependency errors
   */
  suggestDependencyFix(errorMessage) {
    const suggestions = [];

    if (errorMessage.includes('go.mod')) {
      suggestions.push('Check if go.mod file exists and is valid');
      suggestions.push('Initialize module with: go mod init <module-name>');
      suggestions.push('Verify module path in go.mod');
    }

    if (errorMessage.includes('checksum')) {
      suggestions.push('Clear Go module cache: go clean -modcache');
      suggestions.push('Update dependencies: go get -u ./...');
      suggestions.push('Verify network connectivity');
    }

    if (errorMessage.includes('version')) {
      suggestions.push('Check Go version compatibility');
      suggestions.push('Update Go to latest version');
      suggestions.push('Use compatible dependency versions');
    }

    if (errorMessage.includes('import')) {
      suggestions.push('Check import statements in Go files');
      suggestions.push('Verify module paths match imports');
      suggestions.push('Run /go-deps to download missing dependencies');
    }

    if (suggestions.length > 0) {
      LoggingUtils.info('💡 Dependency error suggestions:');
      suggestions.forEach((suggestion, i) => {
        LoggingUtils.info(`  ${i + 1}. ${suggestion}`);
      });
    }
  }
}

module.exports = GoDependencyManager;
