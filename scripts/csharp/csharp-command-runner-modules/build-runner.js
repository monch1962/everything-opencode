class BuildRunner {
  constructor(runner, loggingUtils, platformDetector) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
    this.platformDetector = platformDetector;
  }

  async build(args = [], options = {}) {
    await this.runner.initialize();

    const buildCommand = 'build';
    let buildArgs = args;

    // Add configuration if not specified
    if (!args.includes('--configuration')) {
      buildArgs = ['--configuration', 'Release', ...buildArgs];
    }

    // Add verbosity if not specified
    if (!args.includes('--verbosity')) {
      buildArgs = ['--verbosity', 'minimal', ...buildArgs];
    }

    this.loggingUtils.info(`🔨 Building project...`);

    try {
      const result = await this.runner.executeDotnetCommand(buildCommand, buildArgs, options);

      // Show build information
      this._showBuildInfo();

      return result;
    } catch (error) {
      this._suggestBuildFix(error.message);
      throw error;
    }
  }

  async clean(args = [], options = {}) {
    const cleanArgs = args;

    if (options.all) {
      cleanArgs.push('--verbosity', 'detailed');
    }

    if (options.deps) {
      cleanArgs.push('--force');
    }

    this.loggingUtils.info(`🧹 Cleaning build artifacts...`);

    return await this.runner.executeDotnetCommand('clean', cleanArgs, options);
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

  async publish(args = [], options = {}) {
    await this.runner.initialize();

    const publishCommand = 'publish';
    let publishArgs = args;

    // Add common publish options
    if (!args.includes('--configuration')) {
      publishArgs = ['--configuration', 'Release', ...publishArgs];
    }

    if (!args.includes('--output')) {
      publishArgs = [...publishArgs, '--output', './publish'];
    }

    // Add self-contained if not specified
    if (!args.includes('--self-contained')) {
      publishArgs = ['--self-contained', 'false', ...publishArgs];
    }

    this.loggingUtils.info(`📤 Publishing project...`);

    try {
      const result = await this.runner.executeDotnetCommand(publishCommand, publishArgs, options);

      this.loggingUtils.info('✅ Project published successfully');

      // Show publish information
      this._showPublishInfo();

      return result;
    } catch (error) {
      this._suggestPublishFix(error.message);
      throw error;
    }
  }

  _showBuildInfo() {
    try {
      const projectInfo = this.runner.getCSharpProjectInfo();

      if (projectInfo) {
        this.loggingUtils.info('\n📊 Build Information:');
        this.loggingUtils.info('='.repeat(40));
        this.loggingUtils.info(`C# files: ${projectInfo.csFiles}`);
        this.loggingUtils.info(`Project files: ${projectInfo.csprojFiles}`);
        this.loggingUtils.info(`Solution files: ${projectInfo.slnFiles}`);
        this.loggingUtils.info(`Has Program.cs: ${projectInfo.hasProgramCs ? 'Yes' : 'No'}`);
        this.loggingUtils.info(`Has Startup.cs: ${projectInfo.hasStartupCs ? 'Yes' : 'No'}`);
        this.loggingUtils.info(
          `Has appsettings.json: ${projectInfo.hasAppSettings ? 'Yes' : 'No'}`
        );
        this.loggingUtils.info('='.repeat(40));
      }
    } catch (error) {
      // Silently fail - build info is optional
    }
  }

  _showPublishInfo() {
    try {
      const fs = require('fs');
      const path = require('path');
      const publishDir = path.join(this.runner.projectPath, 'publish');

      if (fs.existsSync(publishDir)) {
        const files = fs.readdirSync(publishDir);
        const exeFiles = files.filter((f) => f.endsWith('.exe'));
        const dllFiles = files.filter((f) => f.endsWith('.dll'));
        const configFiles = files.filter((f) => f.endsWith('.config') || f.endsWith('.json'));

        this.loggingUtils.info('\n📦 Publish Output:');
        this.loggingUtils.info('='.repeat(40));
        this.loggingUtils.info(`Executables: ${exeFiles.length}`);
        this.loggingUtils.info(`Libraries: ${dllFiles.length}`);
        this.loggingUtils.info(`Config files: ${configFiles.length}`);
        this.loggingUtils.info(`Total files: ${files.length}`);
        this.loggingUtils.info(`Location: ${publishDir}`);
        this.loggingUtils.info('='.repeat(40));
      }
    } catch (error) {
      // Silently fail - publish info is optional
    }
  }

  _suggestBuildFix(errorMessage) {
    this.loggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('SDK') || errorMessage.includes('version')) {
      this.loggingUtils.info('   • Check .csproj TargetFramework matches installed SDK');
      this.loggingUtils.info('   • Install required .NET SDK version');
      this.loggingUtils.info('   • Use global.json to specify SDK version');
    }

    if (errorMessage.includes('NuGet') || errorMessage.includes('package')) {
      this.loggingUtils.info('   • Restore packages: dotnet restore');
      this.loggingUtils.info('   • Check NuGet package sources in nuget.config');
      this.loggingUtils.info('   • Clear NuGet cache: dotnet nuget locals all --clear');
    }

    if (errorMessage.includes('CS') || errorMessage.includes('error')) {
      this.loggingUtils.info('   • Check for syntax errors in .cs files');
      this.loggingUtils.info('   • Fix missing using statements');
      this.loggingUtils.info('   • Check for missing references');
    }

    if (errorMessage.includes('warning') || errorMessage.includes('Warnings')) {
      this.loggingUtils.info('   • Treat warnings as errors: /warnaserror');
      this.loggingUtils.info('   • Suppress specific warnings: /nowarn:CSXXXX');
      this.loggingUtils.info('   • Fix code quality issues');
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

  _suggestPublishFix(errorMessage) {
    this.loggingUtils.info('\n💡 Publish Error Suggestions:');

    if (errorMessage.includes('runtime') || errorMessage.includes('RID')) {
      this.loggingUtils.info('   • Specify runtime identifier: --runtime win-x64');
      this.loggingUtils.info('   • Check available RIDs: dotnet --info');
      this.loggingUtils.info('   • Publish self-contained: --self-contained true');
    }

    if (errorMessage.includes('output') || errorMessage.includes('directory')) {
      this.loggingUtils.info('   • Specify output directory: --output ./publish');
      this.loggingUtils.info('   • Ensure output directory is writable');
      this.loggingUtils.info('   • Clean output directory before publishing');
    }

    if (errorMessage.includes('dependency') || errorMessage.includes('missing')) {
      this.loggingUtils.info('   • Include all dependencies: --include-all-dependencies');
      this.loggingUtils.info('   • Check for missing NuGet packages');
      this.loggingUtils.info('   • Restore packages before publishing');
    }
  }

  async buildWithConfiguration(config, args = [], options = {}) {
    const configArgs = ['--configuration', config, ...args];
    return this.build(configArgs, options);
  }

  async buildDebug(args = [], options = {}) {
    return this.buildWithConfiguration('Debug', args, options);
  }

  async buildRelease(args = [], options = {}) {
    return this.buildWithConfiguration('Release', args, options);
  }

  async publishForRuntime(runtime, args = [], options = {}) {
    const runtimeArgs = ['--runtime', runtime, ...args];
    return this.publish(runtimeArgs, options);
  }

  async publishSelfContained(args = [], options = {}) {
    const selfContainedArgs = ['--self-contained', 'true', ...args];
    return this.publish(selfContainedArgs, options);
  }
}

module.exports = BuildRunner;
