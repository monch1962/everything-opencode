#!/usr/bin/env node
/**
 * Go Build Manager Module
 *
 * Handles Go build operations including cross-compilation
 */

const path = require('path');
const { runCommand } = require('../../lib/utils');
const { FileUtils, LoggingUtils, ensureDir } = require('../../lib');

class GoBuildManager {
  constructor(projectPath, commandExecutor, goConfig, detectedTools) {
    this.projectPath = projectPath;
    this.commandExecutor = commandExecutor;
    this.goConfig = goConfig;
    this.detectedTools = detectedTools;
  }

  /**
   * Build Go project with Go-specific improvements
   */
  async build(options = {}) {
    const args = [];

    // Add build flags from config
    if (this.goConfig.build?.flags) {
      args.push(...this.goConfig.build.flags);
    }

    // Add output directory
    if (options.output) {
      args.push('-o', options.output);
    } else {
      // Default output to ./bin/
      const binDir = path.join(this.projectPath, 'bin');

      // Use ensureDir to create directory if it doesn't exist
      ensureDir(binDir);

      const outputName = this.getOutputName();
      args.push('-o', path.join(binDir, outputName));
    }

    // Add ldflags
    if (this.goConfig.build?.ldflags && this.goConfig.build.ldflags.length > 0) {
      args.push('-ldflags', this.goConfig.build.ldflags.join(' '));
    }

    // Add tags
    if (options.tags) {
      args.push('-tags', options.tags);
    }

    // Add race detector
    if (options.race) {
      args.push('-race');
    }

    // Add build mode
    if (options.buildMode) {
      args.push('-buildmode', options.buildMode);
    }

    // Handle cross-compilation via environment variables
    const target = options.target || this.detectBuildTarget();
    if (target) {
      const [goos, goarch] = target.split('/');
      if (goos && goarch) {
        // Set environment variables for cross-compilation
        options.env = {
          ...(options.env || {}),
          GOOS: goos,
          GOARCH: goarch,
          CGO_ENABLED: '0',
        };
      }
    }

    // Add verbose flag
    if (options.verbose) {
      args.push('-v');
    }

    try {
      // Log some build information before starting
      const goFiles = this.findGoFiles();
      if (goFiles.length > 0) {
        LoggingUtils.debug(`Found ${goFiles.length} Go files to build`);
      }

      const moduleInfo = this.getGoModuleInfo();
      if (moduleInfo) {
        LoggingUtils.debug(`Building module: ${moduleInfo}`);
      }

      const result = await this.commandExecutor.executeGoCommand('build', args, options);

      // Go-specific: Show build information
      if (result.success) {
        await this.showBuildInfo(options);
      }

      return result;
    } catch (error) {
      // Go-specific: Provide helpful build error suggestions
      this.suggestBuildFix(error.message);
      throw error;
    }
  }

  /**
   * Get output name based on project type
   */
  getOutputName() {
    if (this.goConfig.projectType === 'cli') {
      const moduleParts = (this.goConfig.module || 'app').split('/');
      return moduleParts[moduleParts.length - 1];
    }

    // Default to directory name
    return path.basename(this.projectPath);
  }

  /**
   * Find Go files in the project
   */
  findGoFiles(pattern = '**/*.go', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(pattern, {
        cwd: this.projectPath,
        exclude: excludePatterns,
        language: 'go',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find Go files:', error.message);
      return [];
    }
  }

  /**
   * Get Go module information
   */
  getGoModuleInfo() {
    try {
      const goModPath = path.join(this.projectPath, 'go.mod');
      if (FileUtils.fileExists(goModPath)) {
        const content = FileUtils.readFile(goModPath);
        const moduleMatch = content.match(/module\s+(\S+)/);
        return moduleMatch ? moduleMatch[1] : null;
      }
      return null;
    } catch (error) {
      LoggingUtils.debug('Failed to read go.mod:', error.message);
      return null;
    }
  }

  /**
   * Detect build target based on environment
   */
  detectBuildTarget() {
    const platform = process.platform;
    const arch = process.arch;

    const targetMap = {
      darwin: {
        x64: 'darwin/amd64',
        arm64: 'darwin/arm64',
      },
      linux: {
        x64: 'linux/amd64',
        arm64: 'linux/arm64',
        arm: 'linux/arm',
      },
      win32: {
        x64: 'windows/amd64',
        ia32: 'windows/386',
      },
    };

    return targetMap[platform]?.[arch] || null;
  }

  /**
   * Show build information
   */
  async showBuildInfo(options) {
    try {
      // Get Go version
      const versionResult = runCommand('go version', { cwd: this.projectPath });

      // Get module info
      const moduleResult = runCommand('go list -m', { cwd: this.projectPath });

      // Get build constraints
      const constraintsResult = runCommand('go list -f "{{.GoFiles}}" ./...', {
        cwd: this.projectPath,
      });

      LoggingUtils.info('📦 Build Information:');
      LoggingUtils.info(`  • Go Version: ${versionResult.stdout?.trim() || 'Unknown'}`);
      LoggingUtils.info(`  • Module: ${moduleResult.stdout?.trim() || 'Not a module'}`);

      if (constraintsResult.stdout) {
        const fileCount = constraintsResult.stdout.split(/\s+/).filter(Boolean).length;
        LoggingUtils.info(`  • Go Files: ${fileCount}`);
      }

      // Show cross-compilation info if applicable
      if (options.env?.GOOS || options.env?.GOARCH) {
        LoggingUtils.info(
          `  • Target: ${options.env.GOOS || 'current'}/${options.env.GOARCH || 'current'}`
        );
      }

      // Show output location
      const outputDir = path.join(this.projectPath, 'bin');
      if (FileUtils.directoryExists(outputDir)) {
        const files = FileUtils.findFilesByPattern('*', { cwd: outputDir });
        LoggingUtils.info(`  • Output Directory: ${outputDir} (${files.length} files)`);
      }
    } catch (error) {
      LoggingUtils.debug('Failed to show build info:', error.message);
    }
  }

  /**
   * Suggest fixes for common build errors
   */
  suggestBuildFix(errorMessage) {
    const suggestions = [];

    if (errorMessage.includes('cannot find package')) {
      suggestions.push('Run /go-deps to download dependencies');
      suggestions.push('Check if go.mod file exists and is valid');
      suggestions.push('Verify module path in go.mod matches import statements');
    }

    if (errorMessage.includes('undefined')) {
      suggestions.push('Check for typos in function/variable names');
      suggestions.push('Verify imports are correct');
      suggestions.push('Run /go-fmt to format code and catch syntax errors');
    }

    if (errorMessage.includes('syntax error')) {
      suggestions.push('Run /go-fmt to format code');
      suggestions.push('Check for missing parentheses, braces, or semicolons');
      suggestions.push('Verify Go version compatibility');
    }

    if (errorMessage.includes('CGO')) {
      suggestions.push('Set CGO_ENABLED=0 for pure Go builds');
      suggestions.push('Install C compiler if CGO is required');
      suggestions.push('Check cross-compilation settings');
    }

    if (suggestions.length > 0) {
      LoggingUtils.info('💡 Build error suggestions:');
      suggestions.forEach((suggestion, i) => {
        LoggingUtils.info(`  ${i + 1}. ${suggestion}`);
      });
    }
  }
}

module.exports = GoBuildManager;
