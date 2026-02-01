const { spawn } = require('child_process');
const { defaultErrorHandler } = require('../../lib/error-handler');

class CommandExecutor {
  constructor(runner, loggingUtils, platformDetector) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
    this.platformDetector = platformDetector;
  }

  async executeDotnetCommand(command, args = [], options = {}) {
    return this._executeDotnetCommandWithErrorHandling(command, args, options);
  }

  async _executeDotnetCommandWithErrorHandling(command, args = [], options = {}) {
    try {
      await this.runner.initialize();

      this.runner.checkTool('dotnet', true);

      const defaultOptions = {
        cwd: this.runner.projectPath,
        stdio: 'inherit',
        shell: true,
        env: process.env,
      };

      const finalOptions = {
        ...defaultOptions,
        ...options,
        env: options.env ? { ...defaultOptions.env, ...options.env } : defaultOptions.env,
      };

      this.loggingUtils.info(`🚀 Executing: dotnet ${command} ${args.join(' ')}`);

      return await new Promise((resolve, reject) => {
        const dotnetPath = this.platformDetector.getToolPath('dotnet', {
          required: true,
        });

        const cmd = `${dotnetPath} ${command} ${args.join(' ')}`;
        this.loggingUtils.debug(`🔍 Executing: ${cmd}`);
        this.loggingUtils.debug(`🔍 CWD: ${finalOptions.cwd}`);
        this.loggingUtils.debug(`🔍 Platform: ${this.platformDetector.getPlatformName()}`);

        const child = spawn(dotnetPath, [command, ...args], finalOptions);

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: 0 });
          } else {
            reject(new Error(`dotnet ${command} failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          this.loggingUtils.debug(`🔍 Exec error: ${error.message}`);
          reject(new Error(`Failed to execute dotnet ${command}: ${error.message}`));
        });
      });
    } catch (error) {
      return this._handleDotnetError(error, { command, args, options });
    }
  }

  _handleDotnetError(error, context = {}) {
    const errorInfo = defaultErrorHandler.handleError(error, context);

    this.loggingUtils.error(errorInfo.userMessage);

    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      this.loggingUtils.info('💡 Recovery steps:');
      errorInfo.recoverySteps.forEach((step, i) => {
        this.loggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    this._suggestDotnetFix(error.message, context.command);

    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  _suggestDotnetFix(errorMessage, _command) {
    this.loggingUtils.info('\n💡 C#/.NET Error Suggestions:');

    if (errorMessage.includes('not found') || errorMessage.includes('command')) {
      this.loggingUtils.info('   • Install .NET SDK: https://dotnet.microsoft.com/download');
      this.loggingUtils.info('   • Verify dotnet is in PATH: dotnet --version');
      this.loggingUtils.info('   • Restart terminal after installation');
    }

    if (errorMessage.includes('SDK') || errorMessage.includes('version')) {
      this.loggingUtils.info('   • Check installed SDKs: dotnet --list-sdks');
      this.loggingUtils.info('   • Update .NET SDK to required version');
      this.loggingUtils.info('   • Use global.json to specify SDK version');
    }

    if (errorMessage.includes('NuGet') || errorMessage.includes('package')) {
      this.loggingUtils.info('   • Restore packages: dotnet restore');
      this.loggingUtils.info('   • Check NuGet package sources');
      this.loggingUtils.info('   • Clear NuGet cache: dotnet nuget locals all --clear');
    }

    if (errorMessage.includes('build') || errorMessage.includes('compile')) {
      this.loggingUtils.info('   • Clean solution: dotnet clean');
      this.loggingUtils.info('   • Restore packages: dotnet restore');
      this.loggingUtils.info('   • Check for syntax errors in .cs files');
    }

    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      this.loggingUtils.info('   • Run as administrator (Windows) or use sudo (Linux/macOS)');
      this.loggingUtils.info('   • Check file permissions on project directory');
      this.loggingUtils.info('   • Try running in a different directory');
    }

    if (errorMessage.includes('project') || errorMessage.includes('csproj')) {
      this.loggingUtils.info('   • Check if .csproj file exists in current directory');
      this.loggingUtils.info('   • Specify project file: dotnet build MyProject.csproj');
      this.loggingUtils.info('   • Navigate to project directory');
    }

    if (errorMessage.includes('framework') || errorMessage.includes('TargetFramework')) {
      this.loggingUtils.info('   • Check TargetFramework in .csproj file');
      this.loggingUtils.info('   • Install required .NET runtime');
      this.loggingUtils.info('   • Update .csproj to use compatible framework');
    }
  }
}

module.exports = CommandExecutor;
