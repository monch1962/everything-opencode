#!/usr/bin/env node
/**
 * Go Configuration Wizard
 *
 * Interactive configuration for Go projects with Go-specific improvements
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('../../scripts/lib/utils');
const GoToolDetector = require('./tool-detector');

class GoConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new GoToolDetector();
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard with Go-specific improvements
   */
  async runWizard(options = {}) {
    console.log('🚀 Go Project Configuration Wizard\n');

    // Detect tools first
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(this.detectedTools);

    // Show environment report
    this.showEnvironmentReport(report);

    // Check if Go is installed
    if (!report.summary.goInstalled) {
      console.log('❌ Go is not installed. Please install Go first.');
      this.showInstallationGuide('go');
      return null;
    }

    // Detect existing Go project or create new
    const projectType = await this.detectOrCreateProject(options);

    // Configure project based on type
    const config = await this.configureProject(projectType, options);

    // Generate configuration
    const fullConfig = this.generateConfiguration(config, report);

    // Save configuration
    if (!options.dryRun) {
      await this.saveConfiguration(fullConfig);
    }

    // Show next steps
    this.showNextSteps(fullConfig, report);

    return fullConfig;
  }

  /**
   * Show Go-specific environment report
   */
  showEnvironmentReport(report) {
    console.log('📊 Go Environment Report:');
    console.log('='.repeat(50));

    if (report.summary.goInstalled) {
      console.log(`✅ Go ${report.summary.goVersion} installed`);
      console.log(`📦 Using Go modules: ${report.summary.usingModules ? '✅ Yes' : '❌ No'}`);
      console.log(`🏢 Using Go workspace: ${report.summary.usingWorkspace ? '✅ Yes' : '❌ No'}`);
      console.log(`🔧 Tools detected: ${report.summary.totalToolsDetected}`);

      if (report.environment) {
        console.log(`📁 GOPATH: ${report.environment.gopath || 'Not set'}`);
        console.log(`📁 GOROOT: ${report.environment.goroot || 'Not set'}`);
      }
    } else {
      console.log('❌ Go not detected');
    }

    console.log('');

    // Show recommendations
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach((rec, _i) => {
        const icon =
          rec.priority === 'critical'
            ? '🔴'
            : rec.priority === 'high'
              ? '🟡'
              : rec.priority === 'recommended'
                ? '🟢'
                : '🔵';
        console.log(`  ${icon} ${rec.message}`);
      });
      console.log('');
    }
  }

  /**
   * Detect existing Go project or create new with Go-specific logic
   */
  async detectOrCreateProject(options) {
    console.log('🔍 Detecting Go project...');

    // Check for existing Go project files
    const hasGoMod = fs.existsSync(path.join(this.projectPath, 'go.mod'));
    const hasGoWork = fs.existsSync(path.join(this.projectPath, 'go.work'));
    const hasGoFiles = this.hasGoFiles(this.projectPath);

    if (hasGoMod || hasGoWork || hasGoFiles) {
      console.log('✅ Existing Go project detected');

      if (hasGoMod) {
        const modInfo = this.readGoMod();
        console.log(`   Module: ${modInfo.module || 'unknown'}`);
        if (modInfo.go) console.log(`   Go version: ${modInfo.go}`);
      }

      if (hasGoWork) {
        console.log('   📦 Go workspace detected (go.work)');
      }

      return {
        type: 'existing',
        hasGoMod,
        hasGoWork,
        hasGoFiles,
      };
    }

    // No existing project - create new
    console.log('📝 No existing Go project detected');

    if (options.quick || options.noPrompt) {
      return this.createDefaultProject(options);
    }

    // Interactive project creation
    return this.interactiveProjectCreation(options);
  }

  /**
   * Check if directory has Go files
   */
  hasGoFiles(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      return files.some((file) => file.endsWith('.go'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Read go.mod file
   */
  readGoMod() {
    try {
      const goModPath = path.join(this.projectPath, 'go.mod');
      const content = fs.readFileSync(goModPath, 'utf8');

      const moduleMatch = content.match(/module\s+(\S+)/);
      const goMatch = content.match(/go\s+(\d+\.\d+)/);

      return {
        module: moduleMatch ? moduleMatch[1] : null,
        go: goMatch ? goMatch[1] : null,
        content,
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Create default project configuration
   */
  createDefaultProject(_options) {
    console.log('📁 Creating default Go module...');

    const moduleName = this.suggestModuleName();

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log(`✅ Created go.mod for module: ${moduleName}`);
    } catch (error) {
      console.log(`⚠️ Could not create go.mod: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'module',
      goVersion: this.detectedTools.go?.version || '1.21',
    };
  }

  /**
   * Interactive project creation with Go-specific options
   */
  async interactiveProjectCreation(options) {
    console.log('\n📋 Create new Go project:');
    console.log('1. Simple Go module');
    console.log('2. CLI application');
    console.log('3. Web service/API');
    console.log('4. Library/package');
    console.log('5. Go workspace (multiple modules)');
    console.log('6. Cancel');

    // In a real implementation, this would use interactive prompts
    // For now, default to simple module
    const choice = options.projectType || '1';

    let projectConfig;

    switch (choice) {
      case '1':
      case 'module':
        projectConfig = await this.createModuleProject();
        break;
      case '2':
      case 'cli':
        projectConfig = await this.createCLIProject();
        break;
      case '3':
      case 'web':
        projectConfig = await this.createWebProject();
        break;
      case '4':
      case 'library':
        projectConfig = await this.createLibraryProject();
        break;
      case '5':
      case 'workspace':
        projectConfig = await this.createWorkspaceProject();
        break;
      default:
        console.log('Project creation cancelled');
        process.exit(0);
    }

    return projectConfig;
  }

  /**
   * Create a simple Go module
   */
  async createModuleProject() {
    const moduleName = this.suggestModuleName();

    console.log(`\n📦 Creating Go module: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');
    } catch (error) {
      console.log(`⚠️ Could not create go.mod: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'module',
      goVersion: this.detectedTools.go?.version || '1.21',
    };
  }

  /**
   * Create a CLI application project
   */
  async createCLIProject() {
    const moduleName = this.suggestModuleName();

    console.log(`\n🖥️ Creating CLI application: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');

      // Create cmd directory structure
      const cmdDir = path.join(this.projectPath, 'cmd', moduleName.split('/').pop() || 'app');
      fs.mkdirSync(cmdDir, { recursive: true });

      // Create main.go template
      const mainGo = `package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: ${moduleName.split('/').pop() || 'app'} <command>")
		fmt.Println("Commands:")
		fmt.Println("  hello - Say hello")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "hello":
		fmt.Println("Hello from ${moduleName}!")
	default:
		fmt.Printf("Unknown command: %s\\n", os.Args[1])
		os.Exit(1)
	}
}
`;

      fs.writeFileSync(path.join(cmdDir, 'main.go'), mainGo);
      console.log('✅ Created CLI structure in cmd/');
    } catch (error) {
      console.log(`⚠️ Error creating CLI project: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'cli',
      goVersion: this.detectedTools.go?.version || '1.21',
      hasCmdStructure: true,
    };
  }

  /**
   * Create a web service/API project
   */
  async createWebProject() {
    const moduleName = this.suggestModuleName();

    console.log(`\n🌐 Creating web service: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');

      // Add common web dependencies
      console.log('📦 Adding common web dependencies...');
      runCommand('go get github.com/gorilla/mux', { cwd: this.projectPath });
      runCommand('go get github.com/rs/cors', { cwd: this.projectPath });

      // Create directory structure
      const dirs = ['cmd/api', 'internal/handler', 'internal/middleware', 'internal/service'];
      dirs.forEach((dir) => {
        fs.mkdirSync(path.join(this.projectPath, dir), { recursive: true });
      });

      console.log('✅ Created web service structure');
    } catch (error) {
      console.log(`⚠️ Error creating web project: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'web',
      goVersion: this.detectedTools.go?.version || '1.21',
      framework: 'standard',
      dependencies: ['gorilla/mux', 'rs/cors'],
    };
  }

  /**
   * Create a library/package project
   */
  async createLibraryProject() {
    const moduleName = this.suggestModuleName();

    console.log(`\n📚 Creating library/package: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');

      // Create library structure
      const libDir = path.join(this.projectPath, 'pkg');
      fs.mkdirSync(libDir, { recursive: true });

      console.log('✅ Created library structure in pkg/');
    } catch (error) {
      console.log(`⚠️ Error creating library project: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'library',
      goVersion: this.detectedTools.go?.version || '1.21',
      hasPkgStructure: true,
    };
  }

  /**
   * Create a Go workspace project
   */
  async createWorkspaceProject() {
    console.log('\n🏢 Creating Go workspace');

    try {
      runCommand('go work init', { cwd: this.projectPath });
      console.log('✅ Created go.work');

      // Create example modules
      const modules = ['api', 'cli', 'shared'];

      for (const module of modules) {
        const moduleDir = path.join(this.projectPath, module);
        fs.mkdirSync(moduleDir, { recursive: true });

        runCommand(`go mod init ${this.suggestModuleName()}/${module}`, {
          cwd: moduleDir,
        });
        runCommand(`go work use ./${module}`, { cwd: this.projectPath });

        console.log(`✅ Added module: ${module}`);
      }
    } catch (error) {
      console.log(`⚠️ Error creating workspace: ${error.message}`);
    }

    return {
      type: 'new',
      projectType: 'workspace',
      goVersion: this.detectedTools.go?.version || '1.21',
      modules: ['api', 'cli', 'shared'],
    };
  }

  /**
   * Suggest a module name based on directory
   */
  suggestModuleName() {
    const dirName = path.basename(this.projectPath);
    const sanitized = dirName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Try to detect GitHub username from git config
    try {
      const gitUser = runCommand('git config user.name', { stdio: 'pipe' });
      if (gitUser.success) {
        const username = gitUser.output.trim().toLowerCase().replace(/\s+/g, '');
        return `github.com/${username}/${sanitized}`;
      }
    } catch (error) {
      // Ignore git errors
    }

    // Fallback to local module name
    return `example.com/${sanitized}`;
  }

  /**
   * Configure project with Go-specific settings
   */
  async configureProject(projectInfo, _options) {
    console.log('\n⚙️ Configuring Go project...');

    const config = {
      ...projectInfo,
      tools: {},
      linting: {},
      testing: {},
      build: {},
    };

    // Configure tools based on detection
    if (this.detectedTools.golangci_lint?.installed) {
      config.tools.linter = 'golangci-lint';
      config.linting.tool = 'golangci-lint';
      config.linting.configFile = '.golangci.yml';
    } else if (this.detectedTools.staticcheck?.installed) {
      config.tools.linter = 'staticcheck';
      config.linting.tool = 'staticcheck';
    }

    if (this.detectedTools.goimports?.installed) {
      config.tools.formatter = 'goimports';
    } else {
      config.tools.formatter = 'gofmt';
    }

    // Configure testing
    if (this.detectedTools.gotestsum?.installed) {
      config.tools.testRunner = 'gotestsum';
      config.testing.tool = 'gotestsum';
      config.testing.flags = ['--format', 'testname'];
    } else {
      config.tools.testRunner = 'go test';
      config.testing.tool = 'go test';
      config.testing.flags = ['-v', '-race'];
    }

    // Configure build settings
    config.build.flags = [];
    config.build.ldflags = [];

    // Add Go version constraint
    if (projectInfo.goVersion) {
      config.goVersion = projectInfo.goVersion;
    }

    // Add module info if available
    if (projectInfo.moduleName) {
      config.module = projectInfo.moduleName;
    }

    return config;
  }

  /**
   * Generate complete configuration with Go-specific improvements
   */
  generateConfiguration(projectConfig, environmentReport) {
    return {
      $schema: 'https://json.schemastore.org/opencode-go-config.json',
      project: this.projectPath,
      language: 'go',
      timestamp: new Date().toISOString(),

      // Go-specific configuration
      go: {
        version: projectConfig.goVersion || environmentReport.summary.goVersion,
        module: projectConfig.module || null,
        projectType: projectConfig.projectType || 'module',
        usingModules: environmentReport.summary.usingModules,
        usingWorkspace: environmentReport.summary.usingWorkspace,

        // Environment
        environment: environmentReport.environment || {},

        // Tools configuration
        tools: projectConfig.tools || {},

        // Linting configuration
        linting: projectConfig.linting || {
          enabled: true,
          tool: 'golangci-lint',
          configFile: '.golangci.yml',
          rules: {
            enable: ['govet', 'errcheck', 'staticcheck', 'gosimple', 'ineffassign'],
            disable: ['deadcode', 'varcheck'],
          },
        },

        // Testing configuration
        testing: projectConfig.testing || {
          enabled: true,
          tool: 'go test',
          flags: ['-v', '-race'],
          coverage: {
            enabled: true,
            threshold: 80,
          },
        },

        // Build configuration
        build: projectConfig.build || {
          flags: [],
          ldflags: [],
          targets: ['linux/amd64', 'darwin/amd64', 'darwin/arm64', 'windows/amd64'],
        },

        // Dependencies
        dependencies: {
          managed: 'modules',
          vendor: false,
          updatePolicy: 'patch',
        },
      },

      // Project metadata
      metadata: {
        type: projectConfig.type || 'unknown',
        created: new Date().toISOString(),
        wizardVersion: '1.0.0',
      },
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config) {
    const configDir = path.join(this.projectPath, '.opencode');
    const configPath = path.join(configDir, 'go-config.json');

    try {
      // Ensure directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Save configuration
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`\n✅ Configuration saved to: ${configPath}`);

      // Create .golangci.yml if using golangci-lint
      if (config.go.linting.tool === 'golangci-lint') {
        this.createGolangCIConfig();
      }

      // Create .gitignore for Go if not exists
      this.createGitignore();
    } catch (error) {
      console.log(`❌ Error saving configuration: ${error.message}`);
    }
  }

  /**
   * Create .golangci.yml configuration
   */
  createGolangCIConfig() {
    const configPath = path.join(this.projectPath, '.golangci.yml');

    if (!fs.existsSync(configPath)) {
      const config = `# golangci-lint configuration
# See https://golangci-lint.run/usage/configuration/

run:
  timeout: 5m
  modules-download-mode: vendor

linters:
  disable-all: true
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - typecheck
    - unused

linters-settings:
  govet:
    check-shadowing: true
    settings:
      printf:
        funcs:
          - (github.com/golangci/golangci-lint/pkg/logutils.Log).Infof
          - (github.com/golangci/golangci-lint/pkg/logutils.Log).Warnf
          - (github.com/golangci/golangci-lint/pkg/logutils.Log).Errorf
          - (github.com/golangci/golangci-lint/pkg/logutils.Log).Fatalf

issues:
  exclude-rules:
    - path: _test\\.go
      linters:
        - gosec

output:
  format: colored-line-number
  print-issued-lines: true
  print-linter-name: true
`;

      fs.writeFileSync(configPath, config);
      console.log('✅ Created .golangci.yml configuration');
    }
  }

  /**
   * Create .gitignore for Go
   */
  createGitignore() {
    const gitignorePath = path.join(this.projectPath, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
      const gitignore = `# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary, built with \`go test -c\`
*.test

# Output of the go coverage tool, specifically when used with LiteIDE
*.out

# Dependency directories (remove the comment below to include it)
# vendor/

# Go workspace file
go.work

# IDE files
.vscode/
.idea/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
`;

      fs.writeFileSync(gitignorePath, gitignore);
      console.log('✅ Created .gitignore for Go');
    }
  }

  /**
   * Show installation guide for a tool
   */
  showInstallationGuide(toolName) {
    const tool = this.toolDetector.tools[toolName];
    if (tool && tool.installGuide) {
      console.log(`\n📦 Installation guide for ${toolName}:`);
      console.log('  macOS:', tool.installGuide.macos);
      console.log('  Linux:', tool.installGuide.linux);
      console.log('  Windows:', tool.installGuide.windows);
    }
  }

  /**
   * Show next steps after configuration
   */
  showNextSteps(config, environmentReport) {
    console.log('\n🎉 Go project configuration complete!');
    console.log('='.repeat(50));

    console.log('\n📋 Next steps:');

    if (config.go.projectType === 'new') {
      console.log('1. Write your Go code in .go files');
      console.log('2. Run tests: /go-test');
      console.log('3. Build project: /go-build');
      console.log('4. Format code: /go-fmt');
      console.log('5. Lint code: /go-lint');
    }

    console.log('\n🔧 Available commands:');
    console.log('  /go-setup    - Configure Go project');
    console.log('  /go-build    - Build Go project');
    console.log('  /go-test     - Run tests');
    console.log('  /go-lint     - Lint code');
    console.log('  /go-fmt      - Format code');
    console.log('  /go-deps     - Manage dependencies');

    // Show recommendations
    if (environmentReport.recommendations.length > 0) {
      console.log('\n💡 Recommended actions:');
      environmentReport.recommendations.forEach((rec) => {
        if (rec.priority === 'critical' || rec.priority === 'recommended') {
          console.log(`  • ${rec.message}`);
        }
      });
    }

    console.log('\n📚 Documentation:');
    console.log('  • Go documentation: https://golang.org/doc/');
    console.log('  • Go modules: https://go.dev/ref/mod');
    console.log('  • golangci-lint: https://golangci-lint.run/');
  }
}

module.exports = GoConfigWizard;
