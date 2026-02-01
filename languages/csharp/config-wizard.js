/**
 * C#/.NET Configuration Wizard
 *
 * Interactive configuration for C#/.NET projects
 * Following TypeScript/JavaScript pattern exactly
 */

const fs = require('fs');
const path = require('path');
const CSharpToolDetector = require('./tool-detector');

class CSharpConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new CSharpToolDetector();
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard for C#/.NET projects
   */
  async runWizard(options = {}) {
    console.log('🚀 C#/.NET Project Configuration Wizard\n');

    // Detect tools first
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(this.detectedTools);

    // Show environment report
    this.showEnvironmentReport(report);

    // Check if .NET SDK is installed
    if (!report.summary.dotnetInstalled) {
      console.log('❌ .NET SDK is not installed. Please install .NET SDK first.');
      this.showInstallationGuide('dotnet');
      return null;
    }

    // Detect project type (Console, Web API, Blazor, etc.)
    const projectType = await this.detectProjectType(options);

    // Configure project based on type
    const config = await this.configureProject(projectType, options);

    // Generate configuration
    const fullConfig = this.generateConfiguration(config, report);

    // Save configuration
    const saved = await this.saveConfiguration(fullConfig);

    if (saved) {
      this.showSuccessMessage(fullConfig);
    }

    return fullConfig;
  }

  /**
   * Show environment report
   */
  showEnvironmentReport(report) {
    console.log('📊 C#/.NET Environment Report:');
    console.log('='.repeat(50));

    // .NET SDK information
    if (report.dotnet) {
      console.log(`✅ .NET SDK: ${report.dotnet.version}`);
    } else {
      console.log('❌ .NET SDK: Not installed');
    }

    // MSBuild information
    if (report.msbuild) {
      console.log(`✅ MSBuild: ${report.msbuild.version || 'Available'}`);
    } else {
      console.log('ℹ️  MSBuild: Not installed (optional for .NET Core)');
    }

    // NuGet information
    if (report.nuget) {
      console.log(`✅ NuGet: ${report.nuget.version || 'Available'}`);
    } else {
      console.log('ℹ️  NuGet: Not installed globally (dotnet CLI has built-in NuGet)');
    }

    // Testing framework detection
    if (report.summary.hasTesting) {
      const testingFrameworks = [];
      if (report.xunit?.installed) testingFrameworks.push(`xUnit ${report.xunit.version || ''}`);
      if (report.nunit?.installed) testingFrameworks.push(`NUnit ${report.nunit.version || ''}`);
      if (report.mstest?.installed) testingFrameworks.push(`MSTest ${report.mstest.version || ''}`);
      console.log(`🧪 Testing: ${testingFrameworks.join(', ') || 'No testing framework detected'}`);
    } else {
      console.log('ℹ️  Testing: No testing framework detected (xUnit recommended)');
    }

    // Formatter detection
    if (report.summary.hasFormatter) {
      console.log(`🎨 Formatter: dotnet-format ${report['dotnet-format']?.version || 'Available'}`);
    } else {
      console.log('ℹ️  Formatter: dotnet-format not installed (recommended)');
    }

    // Coverage tool detection
    if (report.summary.hasCoverage) {
      console.log(`📊 Coverage: Coverlet ${report.coverlet?.version || 'Available'}`);
    } else {
      console.log('ℹ️  Coverage: Coverlet not installed (optional)');
    }

    // Framework detection
    if (report.frameworks && report.frameworks.length > 0) {
      console.log(`🏗️  Frameworks: ${report.frameworks.join(', ')}`);
    }

    // Build tool detection
    if (report.buildTools && report.buildTools.length > 0) {
      console.log(`🔧 Build Tools: ${report.buildTools.join(', ')}`);
    }

    // .NET Workloads
    if (report.workloads && report.workloads.length > 0) {
      console.log(`📦 Installed Workloads: ${report.workloads.map((w) => w.id).join(', ')}`);
    }

    console.log('');
  }

  /**
   * Show installation guide for a tool
   */
  showInstallationGuide(toolName) {
    const command = this.toolDetector.getInstallationCommand(toolName);
    console.log(`💡 Installation command: ${command}`);
    console.log('');
  }

  /**
   * Detect project type
   */
  async detectProjectType(options = {}) {
    const fs = require('fs');
    const path = require('path');

    // Check for existing .csproj files
    const csprojFiles = this.findFiles('**/*.csproj');

    if (csprojFiles.length === 0) {
      // No existing project, ask user
      return this.askForProjectType();
    }

    // Analyze existing project
    const projectTypes = new Set();

    for (const csprojFile of csprojFiles) {
      try {
        const content = fs.readFileSync(path.join(this.projectPath, csprojFile), 'utf8');

        if (content.includes('Microsoft.NET.Sdk.Web') || content.includes('Microsoft.AspNetCore')) {
          if (content.includes('Microsoft.AspNetCore.Components.Web')) {
            projectTypes.add('blazor');
          } else {
            projectTypes.add('aspnetcore');
          }
        } else if (content.includes('Microsoft.NET.Sdk.WindowsDesktop')) {
          if (content.includes('UseWPF')) {
            projectTypes.add('wpf');
          } else if (content.includes('UseWindowsForms')) {
            projectTypes.add('winforms');
          }
        } else if (content.includes('Microsoft.NET.Sdk.Maui')) {
          projectTypes.add('maui');
        } else if (content.includes('OutputType') && content.includes('Library')) {
          projectTypes.add('library');
        } else {
          projectTypes.add('console');
        }
      } catch (error) {
        // Could not read or parse csproj file
        projectTypes.add('unknown');
      }
    }

    // If multiple project types, use the first one
    const detectedType = Array.from(projectTypes)[0] || 'console';

    console.log(`🔍 Detected project type: ${detectedType}`);
    return detectedType;
  }

  /**
   * Ask user for project type
   */
  askForProjectType() {
    // For now, default to console app
    // In a full implementation, this would show interactive prompts
    console.log('📝 No existing C# project detected.');
    console.log('📝 Defaulting to Console Application.');
    return 'console';
  }

  /**
   * Configure project based on type
   */
  async configureProject(projectType, options = {}) {
    const config = {
      projectType: projectType,
      framework: 'net8.0', // Default to .NET 8
      testingFramework: 'xunit', // Default to xUnit
      includeFormatter: true,
      includeCoverage: false,
      includeDevServer: projectType === 'aspnetcore' || projectType === 'blazor',
    };

    // Set framework based on project type
    if (projectType === 'aspnetcore' || projectType === 'blazor') {
      config.framework = 'net8.0';
    } else if (projectType === 'maui') {
      config.framework = 'net8.0';
    }

    // Check for existing testing framework
    if (this.detectedTools?.xunit?.installed) {
      config.testingFramework = 'xunit';
    } else if (this.detectedTools?.nunit?.installed) {
      config.testingFramework = 'nunit';
    } else if (this.detectedTools?.mstest?.installed) {
      config.testingFramework = 'mstest';
    }

    // Check for existing formatter
    if (this.detectedTools?.['dotnet-format']?.installed) {
      config.includeFormatter = true;
    }

    console.log(`⚙️  Configuration:`);
    console.log(`   • Project Type: ${config.projectType}`);
    console.log(`   • Target Framework: ${config.framework}`);
    console.log(`   • Testing Framework: ${config.testingFramework}`);
    console.log(`   • Include Formatter: ${config.includeFormatter ? 'Yes' : 'No'}`);
    console.log(`   • Include Dev Server: ${config.includeDevServer ? 'Yes' : 'No'}`);
    console.log('');

    return config;
  }

  /**
   * Generate configuration object
   */
  generateConfiguration(config, report) {
    const fullConfig = {
      csharp: {
        projectType: config.projectType,
        framework: config.framework,
        testingFramework: config.testingFramework,
        includeFormatter: config.includeFormatter,
        includeCoverage: config.includeCoverage,
        includeDevServer: config.includeDevServer,
        tools: {},
        frameworks: report.frameworks || [],
        buildTools: report.buildTools || [],
      },
    };

    // Add tool information
    if (report.dotnet) {
      fullConfig.csharp.tools.dotnet = {
        installed: report.dotnet.installed,
        version: report.dotnet.version,
        path: report.dotnet.path,
      };
    }

    if (report.nuget) {
      fullConfig.csharp.tools.nuget = {
        installed: report.nuget.installed,
        version: report.nuget.version,
        path: report.nuget.path,
      };
    }

    if (report.xunit?.installed) {
      fullConfig.csharp.tools.xunit = {
        installed: report.xunit.installed,
        version: report.xunit.version,
      };
    }

    if (report['dotnet-format']?.installed) {
      fullConfig.csharp.tools['dotnet-format'] = {
        installed: report['dotnet-format'].installed,
        version: report['dotnet-format'].version,
      };
    }

    return fullConfig;
  }

  /**
   * Save configuration to .opencode/config.json
   */
  async saveConfiguration(config) {
    const fs = require('fs');
    const path = require('path');

    const opencodeDir = path.join(this.projectPath, '.opencode');
    const configPath = path.join(opencodeDir, 'config.json');

    try {
      // Create .opencode directory if it doesn't exist
      if (!fs.existsSync(opencodeDir)) {
        fs.mkdirSync(opencodeDir, { recursive: true });
      }

      // Read existing config if it exists
      let existingConfig = {};
      if (fs.existsSync(configPath)) {
        try {
          existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
          console.warn('⚠️  Could not parse existing config.json, creating new one');
        }
      }

      // Merge new C# config with existing config
      const mergedConfig = {
        ...existingConfig,
        ...config,
      };

      // Write config
      fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), 'utf8');

      return true;
    } catch (error) {
      console.error('❌ Failed to save configuration:', error.message);
      return false;
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(config) {
    console.log('✅ C#/.NET project configuration saved!');
    console.log('');
    console.log('📋 Available commands:');
    console.log('   • /csharp-setup    - Re-run configuration wizard');
    console.log('   • /csharp-build    - Build project');
    console.log('   • /csharp-test     - Run tests');

    if (config.csharp.includeDevServer) {
      console.log('   • /csharp-dev      - Start development server');
    }

    console.log('   • /csharp-lint     - Run code analysis');
    console.log('   • /csharp-format   - Format code');
    console.log('   • /csharp-deps     - Manage NuGet packages');
    console.log('');
    console.log('📁 Configuration saved to: .opencode/config.json');
    console.log('');
  }

  /**
   * Find files using glob pattern
   */
  findFiles(pattern) {
    try {
      const { globSync } = require('../../scripts/lib/utils');
      return globSync(pattern, { cwd: this.projectPath, nodir: true });
    } catch (error) {
      return [];
    }
  }
}

module.exports = CSharpConfigWizard;
