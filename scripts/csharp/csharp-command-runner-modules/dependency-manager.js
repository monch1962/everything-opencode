const path = require('path');

class DependencyManager {
  constructor(runner, loggingUtils, platformDetector) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
    this.platformDetector = platformDetector;
  }

  async addPackage(packageName, args = [], options = {}) {
    await this.runner.initialize();

    const addArgs = ['package', packageName, ...args];

    this.loggingUtils.info(`📦 Adding package: ${packageName}`);

    try {
      const result = await this.runner.executeDotnetCommand('add', addArgs, options);

      this.loggingUtils.info(`✅ Package ${packageName} added successfully`);

      // Show package information
      this._showPackageInfo(packageName);

      return result;
    } catch (error) {
      this._suggestPackageFix(error.message, packageName);
      throw error;
    }
  }

  async removePackage(packageName, args = [], options = {}) {
    await this.runner.initialize();

    const removeArgs = ['package', packageName, ...args];

    this.loggingUtils.info(`🗑️  Removing package: ${packageName}`);

    try {
      const result = await this.runner.executeDotnetCommand('remove', removeArgs, options);

      this.loggingUtils.info(`✅ Package ${packageName} removed successfully`);

      return result;
    } catch (error) {
      this._suggestPackageFix(error.message, packageName);
      throw error;
    }
  }

  async listPackages(args = [], options = {}) {
    await this.runner.initialize();

    const listArgs = ['list', 'package', ...args];

    this.loggingUtils.info(`📋 Listing packages...`);

    try {
      const result = await this.runner.executeDotnetCommand('list', listArgs, {
        ...options,
        stdio: 'pipe',
      });

      if (result.stdout) {
        this._formatPackageList(result.stdout);
      }

      return result;
    } catch (error) {
      this._suggestListFix(error.message);
      throw error;
    }
  }

  async updatePackage(packageName, args = [], options = {}) {
    await this.runner.initialize();

    const updateArgs = packageName ? ['package', packageName, ...args] : [...args];

    this.loggingUtils.info(`🔄 Updating package${packageName ? `: ${packageName}` : 's'}...`);

    try {
      const result = await this.runner.executeDotnetCommand('update', updateArgs, options);

      this.loggingUtils.info(
        `✅ Package${packageName ? ` ${packageName}` : 's'} updated successfully`
      );

      return result;
    } catch (error) {
      this._suggestUpdateFix(error.message, packageName);
      throw error;
    }
  }

  async restore(args = [], options = {}) {
    await this.runner.initialize();

    this.loggingUtils.info(`📦 Restoring NuGet packages...`);

    try {
      const result = await this.runner.executeDotnetCommand('restore', args, options);

      this.loggingUtils.info('✅ Packages restored successfully');

      return result;
    } catch (error) {
      this._suggestRestoreFix(error.message);
      throw error;
    }
  }

  async clearCache(args = [], options = {}) {
    const clearArgs = ['locals', 'all', '--clear', ...args];

    this.loggingUtils.info(`🧹 Clearing NuGet cache...`);

    try {
      const result = await this.runner.executeDotnetCommand('nuget', clearArgs, options);

      this.loggingUtils.info('✅ NuGet cache cleared successfully');

      return result;
    } catch (error) {
      this._suggestCacheFix(error.message);
      throw error;
    }
  }

  async addProjectReference(projectPath, args = [], options = {}) {
    await this.runner.initialize();

    const referenceArgs = ['reference', projectPath, ...args];

    this.loggingUtils.info(`🔗 Adding project reference: ${projectPath}`);

    try {
      const result = await this.runner.executeDotnetCommand('add', referenceArgs, options);

      this.loggingUtils.info(`✅ Project reference added successfully`);

      return result;
    } catch (error) {
      this._suggestReferenceFix(error.message, projectPath);
      throw error;
    }
  }

  async removeProjectReference(projectPath, args = [], options = {}) {
    await this.runner.initialize();

    const referenceArgs = ['reference', projectPath, ...args];

    this.loggingUtils.info(`🔗 Removing project reference: ${projectPath}`);

    try {
      const result = await this.runner.executeDotnetCommand('remove', referenceArgs, options);

      this.loggingUtils.info(`✅ Project reference removed successfully`);

      return result;
    } catch (error) {
      this._suggestReferenceFix(error.message, projectPath);
      throw error;
    }
  }

  _formatPackageList(output) {
    const lines = output.split('\n').filter((line) => line.trim());

    this.loggingUtils.info('\n📦 Installed Packages:');
    this.loggingUtils.info('='.repeat(60));

    let inPackageSection = false;
    let packageCount = 0;

    for (const line of lines) {
      if (line.includes('Top-level Package') || line.includes('Project `')) {
        inPackageSection = true;
        this.loggingUtils.info(`\n${line}`);
        this.loggingUtils.info('-'.repeat(60));
        continue;
      }

      if (inPackageSection && line.trim() && !line.includes('---')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const packageName = parts[0];
          const version = parts[1];
          this.loggingUtils.info(`   • ${packageName.padEnd(40)} ${version}`);
          packageCount++;
        }
      }
    }

    this.loggingUtils.info('='.repeat(60));
    this.loggingUtils.info(`Total packages: ${packageCount}`);
  }

  _showPackageInfo(packageName) {
    try {
      const fs = require('fs');
      const csprojFiles = this.runner.findCSharpFiles('**/*.csproj');

      if (csprojFiles.length > 0) {
        const csprojPath = csprojFiles[0];
        const content = fs.readFileSync(csprojPath, 'utf8');

        // Simple check if package was added
        if (content.includes(packageName)) {
          this.loggingUtils.info('\n📄 Package added to:');
          this.loggingUtils.info(`   • ${path.basename(csprojPath)}`);
        }
      }
    } catch (error) {
      // Silently fail - package info is optional
    }
  }

  _suggestPackageFix(errorMessage, packageName) {
    this.loggingUtils.info('\n💡 Package Management Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('exists')) {
      this.loggingUtils.info(`   • Check if package '${packageName}' exists on NuGet`);
      this.loggingUtils.info('   • Verify package name spelling');
      this.loggingUtils.info('   • Check NuGet package sources');
    }

    if (errorMessage.includes('version') || errorMessage.includes('compatible')) {
      this.loggingUtils.info(
        '   • Specify version: dotnet add package PackageName --version 1.0.0'
      );
      this.loggingUtils.info('   • Check package compatibility with TargetFramework');
      this.loggingUtils.info('   • Try different package version');
    }

    if (errorMessage.includes('source') || errorMessage.includes('feed')) {
      this.loggingUtils.info('   • Check NuGet package sources: dotnet nuget list source');
      this.loggingUtils.info('   • Add package source: dotnet nuget add source <url>');
      this.loggingUtils.info('   • Use --source flag to specify source');
    }

    if (errorMessage.includes('restore') || errorMessage.includes('dependency')) {
      this.loggingUtils.info('   • Restore packages first: dotnet restore');
      this.loggingUtils.info('   • Check for version conflicts');
      this.loggingUtils.info('   • Clear NuGet cache: dotnet nuget locals all --clear');
    }
  }

  _suggestListFix(errorMessage) {
    this.loggingUtils.info('\n💡 Package List Error Suggestions:');

    if (errorMessage.includes('project') || errorMessage.includes('csproj')) {
      this.loggingUtils.info(
        '   • Specify project file: dotnet list package --project MyProject.csproj'
      );
      this.loggingUtils.info('   • Navigate to project directory');
      this.loggingUtils.info('   • Check if .csproj file exists');
    }

    if (errorMessage.includes('outdated') || errorMessage.includes('update')) {
      this.loggingUtils.info('   • Check for updates: dotnet list package --outdated');
      this.loggingUtils.info('   • Update packages: dotnet update');
      this.loggingUtils.info('   • Update specific package: dotnet update package PackageName');
    }
  }

  _suggestUpdateFix(errorMessage, packageName) {
    this.loggingUtils.info('\n💡 Package Update Error Suggestions:');

    if (errorMessage.includes('version') || errorMessage.includes('constraint')) {
      this.loggingUtils.info('   • Check version constraints in .csproj');
      this.loggingUtils.info('   • Use --version flag to specify version');
      this.loggingUtils.info('   • Check for breaking changes in new version');
    }

    if (errorMessage.includes('dependency') || errorMessage.includes('conflict')) {
      this.loggingUtils.info('   • Check dependency conflicts');
      this.loggingUtils.info('   • Update all dependencies together');
      this.loggingUtils.info('   • Use --no-restore to skip automatic restore');
    }

    if (!packageName && errorMessage.includes('multiple')) {
      this.loggingUtils.info('   • Update specific package instead of all');
      this.loggingUtils.info('   • Check each package for compatibility');
      this.loggingUtils.info('   • Update packages one by one');
    }
  }

  _suggestRestoreFix(errorMessage) {
    this.loggingUtils.info('\n💡 Package Restore Error Suggestions:');

    if (errorMessage.includes('source') || errorMessage.includes('feed')) {
      this.loggingUtils.info('   • Check NuGet package sources in nuget.config');
      this.loggingUtils.info('   • Add missing package source: dotnet nuget add source');
      this.loggingUtils.info('   • Use --source flag to specify package source');
    }

    if (errorMessage.includes('version') || errorMessage.includes('compatible')) {
      this.loggingUtils.info('   • Check package versions in .csproj file');
      this.loggingUtils.info('   • Update package to compatible version');
      this.loggingUtils.info('   • Check TargetFramework compatibility');
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      this.loggingUtils.info('   • Check internet connection');
      this.loggingUtils.info('   • Increase timeout: --timeout 300');
      this.loggingUtils.info('   • Use local NuGet cache');
    }
  }

  _suggestCacheFix(errorMessage) {
    this.loggingUtils.info('\n💡 Cache Clear Error Suggestions:');

    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      this.loggingUtils.info('   • Run as administrator (Windows) or use sudo (Linux/macOS)');
      this.loggingUtils.info('   • Check file permissions on cache directory');
      this.loggingUtils.info('   • Manually delete cache files');
    }

    if (errorMessage.includes('location') || errorMessage.includes('path')) {
      this.loggingUtils.info('   • Check NuGet cache location: dotnet nuget locals all --list');
      this.loggingUtils.info('   • Clear specific cache: http-cache, global-packages, temp');
      this.loggingUtils.info('   • Use --force flag to force clear');
    }
  }

  _suggestReferenceFix(errorMessage, projectPath) {
    this.loggingUtils.info('\n💡 Project Reference Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('exist')) {
      this.loggingUtils.info(`   • Check if project exists at: ${projectPath}`);
      this.loggingUtils.info('   • Use relative or absolute path');
      this.loggingUtils.info('   • Verify .csproj file extension');
    }

    if (errorMessage.includes('circular') || errorMessage.includes('dependency')) {
      this.loggingUtils.info('   • Check for circular references');
      this.loggingUtils.info('   • Remove conflicting references');
      this.loggingUtils.info('   • Restructure project dependencies');
    }

    if (errorMessage.includes('framework') || errorMessage.includes('incompatible')) {
      this.loggingUtils.info('   • Check TargetFramework compatibility');
      this.loggingUtils.info('   • Update projects to use same framework');
      this.loggingUtils.info('   • Use multi-targeting if needed');
    }
  }

  async addPackageWithVersion(packageName, version, args = [], options = {}) {
    const versionArgs = ['--version', version, ...args];
    return this.addPackage(packageName, versionArgs, options);
  }

  async addDevPackage(packageName, args = [], options = {}) {
    const devArgs = ['--package-directory', 'packages', ...args];
    return this.addPackage(packageName, devArgs, options);
  }

  async listOutdated(args = [], options = {}) {
    const outdatedArgs = ['--outdated', ...args];
    return this.listPackages(outdatedArgs, options);
  }

  async listTransitive(args = [], options = {}) {
    const transitiveArgs = ['--include-transitive', ...args];
    return this.listPackages(transitiveArgs, options);
  }

  async addFrameworkReference(frameworkName, args = [], options = {}) {
    const frameworkArgs = ['reference', frameworkName, ...args];
    return this.runner.executeDotnetCommand('add', frameworkArgs, options);
  }
}

module.exports = DependencyManager;
