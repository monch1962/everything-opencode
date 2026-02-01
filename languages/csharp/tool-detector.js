/**
 * C#/.NET Tool Detector
 *
 * Detect C#/.NET development tools with cross-platform support
 * Following TypeScript/JavaScript pattern exactly
 */

const { commandExists, runCommand } = require('../../scripts/lib/utils');
const PlatformDetector = require('../../scripts/lib/platform-detector');

class CSharpToolDetector {
  constructor() {
    this.platformDetector = new PlatformDetector();
    this.tools = [
      'dotnet', // .NET SDK (required)
      'msbuild', // MSBuild (legacy)
      'nuget', // NuGet CLI
      'xunit', // xUnit testing framework
      'nunit', // NUnit testing framework
      'mstest', // MSTest framework
      'dotnet-format', // Code formatter
      'coverlet', // Coverage tool
      'reportgenerator', // Coverage reports
    ];
  }

  /**
   * Detect all C#/.NET tools
   */
  async detectTools() {
    const detectedTools = {};

    // Detect each tool
    for (const tool of this.tools) {
      detectedTools[tool] = await this.detectTool(tool);
    }

    // Detect .NET SDK workloads
    const workloads = await this.detectWorkloads();
    if (workloads.length > 0) {
      detectedTools.workloads = workloads;
    }

    // Detect frameworks
    const frameworks = await this.detectFrameworks();
    if (frameworks.length > 0) {
      detectedTools.frameworks = frameworks;
    }

    // Detect build tools
    const buildTools = await this.detectBuildTools();
    if (buildTools.length > 0) {
      detectedTools.buildTools = buildTools;
    }

    return detectedTools;
  }

  /**
   * Detect a specific tool
   */
  async detectTool(toolName) {
    const toolInfo = {
      name: toolName,
      installed: false,
      version: null,
      path: null,
    };

    try {
      // Special handling for .NET SDK
      if (toolName === 'dotnet') {
        return await this.detectDotNet();
      }

      // Special handling for MSBuild
      if (toolName === 'msbuild') {
        return await this.detectMSBuild();
      }

      // Special handling for NuGet
      if (toolName === 'nuget') {
        return await this.detectNuGet();
      }

      // Check if tool exists in PATH
      const exists = commandExists(toolName);
      if (!exists) {
        return toolInfo;
      }

      // Get version
      const version = await this.getToolVersion(toolName);

      toolInfo.installed = true;
      toolInfo.version = version;
      toolInfo.path = this.platformDetector.getToolPath(toolName);
    } catch (error) {
      // Tool not found or error detecting
      console.debug(`Failed to detect ${toolName}:`, error.message);
    }

    return toolInfo;
  }

  /**
   * Detect .NET SDK
   */
  async detectDotNet() {
    const toolInfo = {
      name: 'dotnet',
      installed: false,
      version: null,
      path: null,
    };

    try {
      const result = await runCommand('dotnet --version');
      if (result.success) {
        toolInfo.installed = true;
        toolInfo.version = result.output.trim();
        toolInfo.path = this.platformDetector.getToolPath('dotnet');
      }
    } catch (error) {
      // .NET SDK not installed
    }

    return toolInfo;
  }

  /**
   * Detect MSBuild
   */
  async detectMSBuild() {
    const toolInfo = {
      name: 'msbuild',
      installed: false,
      version: null,
      path: null,
    };

    try {
      // Try different MSBuild commands
      const commands = ['msbuild -version', 'msbuild /version', 'dotnet msbuild -version'];

      for (const command of commands) {
        try {
          const result = await runCommand(command.split(' ')[0] + ' --help');
          if (result.success) {
            toolInfo.installed = true;

            // Try to get version
            const versionResult = await runCommand(command);
            if (versionResult.success) {
              const match = versionResult.output.match(/(\d+\.\d+\.\d+)/);
              if (match) {
                toolInfo.version = match[1];
              }
            }

            toolInfo.path = this.platformDetector.getToolPath('msbuild');
            break;
          }
        } catch (cmdError) {
          continue;
        }
      }
    } catch (error) {
      // MSBuild not installed
    }

    return toolInfo;
  }

  /**
   * Detect NuGet
   */
  async detectNuGet() {
    const toolInfo = {
      name: 'nuget',
      installed: false,
      version: null,
      path: null,
    };

    try {
      // Try nuget command
      const result = await runCommand('nuget help');
      if (result.success) {
        toolInfo.installed = true;

        // Try to get version
        const versionResult = await runCommand('nuget');
        if (versionResult.success) {
          const match = versionResult.output.match(/NuGet Version: (\d+\.\d+\.\d+)/);
          if (match) {
            toolInfo.version = match[1];
          }
        }

        toolInfo.path = this.platformDetector.getToolPath('nuget');
      }
    } catch (error) {
      // NuGet not installed globally, check dotnet tool
      try {
        const dotnetResult = await runCommand('dotnet nuget --version');
        if (dotnetResult.success) {
          toolInfo.installed = true;
          toolInfo.version = dotnetResult.output.trim();
          toolInfo.path = this.platformDetector.getToolPath('dotnet');
        }
      } catch (dotnetError) {
        // NuGet not available
      }
    }

    return toolInfo;
  }

  /**
   * Get tool version
   */
  async getToolVersion(toolName) {
    try {
      const versionCommands = {
        xunit: 'dotnet test --help | grep -i xunit || echo "xUnit not detected"',
        nunit: 'dotnet test --help | grep -i nunit || echo "NUnit not detected"',
        mstest: 'dotnet test --help | grep -i mstest || echo "MSTest not detected"',
        'dotnet-format': 'dotnet format --version',
        coverlet: 'coverlet --version || dotnet tool list -g | grep coverlet',
        reportgenerator: 'reportgenerator --version',
      };

      const command = versionCommands[toolName] || `${toolName} --version`;
      const result = await runCommand(command);

      if (result.success) {
        // Extract version from output
        const match = result.output.match(/(\d+\.\d+\.\d+)/);
        return match ? match[1] : result.output.trim();
      }
    } catch (error) {
      // Could not get version
    }

    return null;
  }

  /**
   * Detect .NET SDK workloads
   */
  async detectWorkloads() {
    const workloads = [];

    try {
      const result = await runCommand('dotnet workload list');
      if (result.success) {
        const lines = result.output.split('\n');
        let inWorkloadSection = false;

        for (const line of lines) {
          if (line.includes('Installed Workloads')) {
            inWorkloadSection = true;
            continue;
          }

          if (inWorkloadSection && line.trim() && !line.includes('---')) {
            const workloadMatch = line.match(/^(\S+)\s+(.+)$/);
            if (workloadMatch) {
              workloads.push({
                id: workloadMatch[1].trim(),
                description: workloadMatch[2].trim(),
                installed: true,
              });
            }
          }
        }
      }
    } catch (error) {
      // Could not detect workloads
    }

    return workloads;
  }

  /**
   * Detect C#/.NET frameworks
   */
  async detectFrameworks() {
    const fs = require('fs');
    const path = require('path');
    const frameworks = [];

    // Check for .csproj files
    const csprojFiles = this.findFiles('**/*.csproj');
    if (csprojFiles.length === 0) {
      return frameworks;
    }

    for (const csprojFile of csprojFiles) {
      try {
        const content = fs.readFileSync(path.join(process.cwd(), csprojFile), 'utf8');

        // Check for ASP.NET Core
        if (
          content.includes('Microsoft.AspNetCore') ||
          content.includes('AspNetCore') ||
          csprojFile.includes('web') ||
          csprojFile.includes('api')
        ) {
          frameworks.push('aspnetcore');
        }

        // Check for Blazor
        if (content.includes('Microsoft.AspNetCore.Components.Web') || content.includes('Blazor')) {
          frameworks.push('blazor');
        }

        // Check for WPF
        if (content.includes('Microsoft.NET.Sdk.WindowsDesktop') || content.includes('UseWPF')) {
          frameworks.push('wpf');
        }

        // Check for WinForms
        if (
          content.includes('Microsoft.NET.Sdk.WindowsDesktop') ||
          content.includes('UseWindowsForms')
        ) {
          frameworks.push('winforms');
        }

        // Check for MAUI
        if (content.includes('Microsoft.NET.Sdk.Maui') || content.includes('UseMaui')) {
          frameworks.push('maui');
        }

        // Check for Console app (default if no other framework detected)
        if (frameworks.length === 0 && content.includes('Microsoft.NET.Sdk')) {
          frameworks.push('console');
        }

        // Check for Class Library
        if (content.includes('OutputType') && content.includes('Library')) {
          frameworks.push('library');
        }
      } catch (error) {
        // Could not read or parse csproj file
      }
    }

    // Remove duplicates
    return [...new Set(frameworks)];
  }

  /**
   * Detect build tools
   */
  async detectBuildTools() {
    const fs = require('fs');
    const path = require('path');
    const buildTools = [];

    // Check for configuration files
    const configFiles = {
      'Directory.Build.props': 'msbuild',
      'Directory.Build.targets': 'msbuild',
      '.csproj': 'dotnet',
      '.sln': 'visualstudio',
      'global.json': 'dotnet',
      'nuget.config': 'nuget',
    };

    for (const [configFile, tool] of Object.entries(configFiles)) {
      const files = this.findFiles(`**/${configFile}`);
      if (files.length > 0) {
        buildTools.push(tool);
      }
    }

    return [...new Set(buildTools)];
  }

  /**
   * Find files using glob pattern
   */
  findFiles(pattern) {
    try {
      const fs = require('fs');
      const path = require('path');
      const { globSync } = require('../../scripts/lib/utils');

      return globSync(pattern, { cwd: process.cwd(), nodir: true });
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(detectedTools) {
    const report = {
      summary: {
        dotnetInstalled: detectedTools.dotnet?.installed || false,
        msbuildInstalled: detectedTools.msbuild?.installed || false,
        nugetInstalled: detectedTools.nuget?.installed || false,
        hasTesting:
          detectedTools.xunit?.installed ||
          detectedTools.nunit?.installed ||
          detectedTools.mstest?.installed,
        hasFormatter: detectedTools['dotnet-format']?.installed || false,
        hasCoverage: detectedTools.coverlet?.installed || false,
      },
      dotnet: detectedTools.dotnet,
      msbuild: detectedTools.msbuild,
      nuget: detectedTools.nuget,
      xunit: detectedTools.xunit,
      nunit: detectedTools.nunit,
      mstest: detectedTools.mstest,
      'dotnet-format': detectedTools['dotnet-format'],
      coverlet: detectedTools.coverlet,
      reportgenerator: detectedTools.reportgenerator,
      workloads: detectedTools.workloads || [],
      frameworks: detectedTools.frameworks || [],
      buildTools: detectedTools.buildTools || [],
    };

    return report;
  }

  /**
   * Get tool installation command
   */
  getInstallationCommand(toolName, _options = {}) {
    const commands = {
      dotnet: {
        macos: 'brew install --cask dotnet',
        linux:
          'wget https://dot.net/v1/dotnet-install.sh && chmod +x dotnet-install.sh && ./dotnet-install.sh',
        windows: 'Download from https://dotnet.microsoft.com/download',
      },
      msbuild: {
        macos: 'Install Visual Studio for Mac',
        linux: 'sudo apt install mono-devel',
        windows: 'Install Visual Studio Build Tools',
      },
      nuget: 'dotnet tool install -g nuget',
      'dotnet-format': 'dotnet tool install -g dotnet-format',
      coverlet: 'dotnet tool install -g coverlet.console',
      reportgenerator: 'dotnet tool install -g dotnet-reportgenerator-globaltool',
      xunit: 'dotnet add package xunit',
      nunit: 'dotnet add package NUnit',
      mstest: 'dotnet add package MSTest',
    };

    const command = commands[toolName];

    if (typeof command === 'object') {
      const platform = this.platformDetector.getPlatformName();
      return command[platform] || command[Object.keys(command)[0]];
    }

    return command || `dotnet tool install -g ${toolName}`;
  }

  /**
   * Check if tool meets minimum version requirement
   */
  checkVersion(toolInfo, minVersion) {
    if (!toolInfo.installed || !toolInfo.version) {
      return false;
    }

    // Simple version comparison
    const current = toolInfo.version.split('.').map(Number);
    const required = minVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, required.length); i++) {
      const cur = current[i] || 0;
      const req = required[i] || 0;

      if (cur > req) return true;
      if (cur < req) return false;
    }

    return true; // Versions are equal
  }
}

module.exports = CSharpToolDetector;
