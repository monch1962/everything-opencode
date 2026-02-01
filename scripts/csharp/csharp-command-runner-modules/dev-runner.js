const path = require('path');

class DevRunner {
  constructor(runner, loggingUtils, platformDetector) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
    this.platformDetector = platformDetector;
  }

  async startDevServer(args = [], options = {}) {
    await this.runner.initialize();

    let devCommand = 'run';
    const devArgs = args;

    // Check for ASP.NET Core project
    const projectInfo = this.runner.getCSharpProjectInfo();
    if (projectInfo.hasProgramCs || projectInfo.hasStartupCs) {
      devCommand = 'run';
      // Add watch for hot reload
      if (!args.includes('--watch')) {
        devArgs.unshift('--watch');
      }
    }

    // Check for launch profile
    const launchProfile = this._detectLaunchProfile();
    if (launchProfile && !args.includes('--launch-profile')) {
      devArgs.push('--launch-profile', launchProfile);
    }

    this.loggingUtils.info(`🚀 Starting development server with ${devCommand}...`);

    try {
      const result = await this.runner.executeDotnetCommand(devCommand, devArgs, options);

      this.loggingUtils.info('✅ Development server started');

      // Show server information
      this._showServerInfo(projectInfo);

      return result;
    } catch (error) {
      this._suggestDevFix(error.message);
      throw error;
    }
  }

  async startWithHotReload(args = [], options = {}) {
    const hotReloadArgs = ['--watch', ...args];
    return this.startDevServer(hotReloadArgs, options);
  }

  async startWithProfile(profile, args = [], options = {}) {
    const profileArgs = ['--launch-profile', profile, ...args];
    return this.startDevServer(profileArgs, options);
  }

  async stopDevServer() {
    this.loggingUtils.info('🛑 Stopping development server...');

    // This is a placeholder - in a real implementation, we would track the running process
    this.loggingUtils.info('💡 Manually stop the server with Ctrl+C');
    return { success: true, message: 'Server stop requested' };
  }

  async restartDevServer(args = [], options = {}) {
    this.loggingUtils.info('🔄 Restarting development server...');

    // Simulate restart by stopping and starting
    await this.stopDevServer();
    return this.startDevServer(args, options);
  }

  _detectLaunchProfile() {
    try {
      const fs = require('fs');
      const launchSettingsPath = path.join(
        this.runner.projectPath,
        'Properties',
        'launchSettings.json'
      );

      if (fs.existsSync(launchSettingsPath)) {
        const launchSettings = JSON.parse(fs.readFileSync(launchSettingsPath, 'utf8'));
        const profiles = launchSettings.profiles;

        if (profiles) {
          // Prefer IIS Express for Windows, Kestrel for cross-platform
          if (this.platformDetector.getPlatformName() === 'windows' && profiles['IIS Express']) {
            return 'IIS Express';
          } else if (profiles[Object.keys(profiles)[0]]) {
            return Object.keys(profiles)[0];
          }
        }
      }

      // Check for common project types
      const projectInfo = this.runner.getCSharpProjectInfo();
      if (projectInfo.hasProgramCs) {
        return 'Project'; // Default profile name
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  _showServerInfo(projectInfo) {
    this.loggingUtils.info('\n🌐 Server Information:');
    this.loggingUtils.info('='.repeat(40));

    if (projectInfo.hasProgramCs || projectInfo.hasStartupCs) {
      this.loggingUtils.info('   • ASP.NET Core Web Application');
      this.loggingUtils.info('   • Hot reload enabled (--watch)');
      this.loggingUtils.info('   • Default URL: http://localhost:5000');
      this.loggingUtils.info('   • HTTPS URL: https://localhost:5001');
    } else if (projectInfo.hasCsProj) {
      this.loggingUtils.info('   • Console Application');
      this.loggingUtils.info('   • Running in development mode');
    }

    this.loggingUtils.info('='.repeat(40));
    this.loggingUtils.info('💡 Press Ctrl+C to stop the server');
  }

  _suggestDevFix(errorMessage) {
    this.loggingUtils.info('\n💡 Development Server Error Suggestions:');

    if (errorMessage.includes('port') || errorMessage.includes('in use')) {
      this.loggingUtils.info('   • Change port: dotnet run --urls http://localhost:5001');
      this.loggingUtils.info('   • Kill process using port:');
      this.loggingUtils.info('     Windows: netstat -ano | findstr :5000');
      this.loggingUtils.info('     Linux/macOS: lsof -ti:5000 | xargs kill');
      this.loggingUtils.info('   • Use different port in launchSettings.json');
    }

    if (errorMessage.includes('hot reload') || errorMessage.includes('watch')) {
      this.loggingUtils.info('   • Ensure --watch flag is included');
      this.loggingUtils.info('   • Check if project supports hot reload (ASP.NET Core 6+)');
      this.loggingUtils.info('   • Restart development server');
    }

    if (errorMessage.includes('certificate') || errorMessage.includes('HTTPS')) {
      this.loggingUtils.info('   • Trust development certificate: dotnet dev-certs https --trust');
      this.loggingUtils.info('   • Generate new certificate: dotnet dev-certs https --clean');
      this.loggingUtils.info('   • Use HTTP instead: --urls http://localhost:5000');
    }

    if (errorMessage.includes('launch') || errorMessage.includes('profile')) {
      this.loggingUtils.info('   • Check Properties/launchSettings.json file');
      this.loggingUtils.info('   • Specify profile: --launch-profile ProfileName');
      this.loggingUtils.info('   • Create launch profile if missing');
    }

    if (errorMessage.includes('build') || errorMessage.includes('compile')) {
      this.loggingUtils.info('   • Build project first: dotnet build');
      this.loggingUtils.info('   • Fix compilation errors');
      this.loggingUtils.info('   • Restore packages: dotnet restore');
    }
  }

  async getServerStatus() {
    try {
      const projectInfo = this.runner.getCSharpProjectInfo();
      const launchProfile = this._detectLaunchProfile();

      return {
        isAspNetCore: projectInfo.hasProgramCs || projectInfo.hasStartupCs,
        hasLaunchProfile: !!launchProfile,
        launchProfile: launchProfile,
        projectType: projectInfo.hasProgramCs
          ? 'ASP.NET Core'
          : projectInfo.hasStartupCs
            ? 'ASP.NET Core (Legacy)'
            : projectInfo.hasCsProj
              ? 'Console Application'
              : 'Unknown',
        hotReloadSupported: projectInfo.hasProgramCs || projectInfo.hasStartupCs,
        defaultPorts: {
          http: 5000,
          https: 5001,
        },
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async openInBrowser(browser = 'default') {
    const status = await this.getServerStatus();

    if (status.error) {
      this.loggingUtils.error('Cannot open browser:', status.error);
      return { success: false, error: status.error };
    }

    if (!status.isAspNetCore) {
      this.loggingUtils.warn('Not an ASP.NET Core web application');
      return { success: false, error: 'Not a web application' };
    }

    const url = `http://localhost:${status.defaultPorts.http}`;
    this.loggingUtils.info(`🌐 Opening ${url} in browser...`);

    try {
      const { exec } = require('child_process');

      let command;
      switch (this.platformDetector.getPlatformName()) {
        case 'windows':
          command = `start ${url}`;
          break;
        case 'macos':
          command = `open ${url}`;
          break;
        case 'linux':
          command = `xdg-open ${url}`;
          break;
        default:
          command = `echo "Open ${url} in your browser"`;
      }

      exec(command);
      return { success: true, url };
    } catch (error) {
      this.loggingUtils.error('Failed to open browser:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DevRunner;
