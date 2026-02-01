/**
 * Go Tool Detector
 *
 * Detect Go development tools with cross-platform support
 * Following JavaScript/TypeScript pattern exactly
 */

const { commandExists, runCommand } = require('../../scripts/lib/utils');
const PlatformDetector = require('../../scripts/lib/platform-detector');

class GoToolDetector {
  constructor() {
    this.platformDetector = new PlatformDetector();
    this.tools = [
      'go', // Go compiler and toolchain (required)
      'gofmt', // Go code formatter (built-in)
      'goimports', // Updates Go import lines
      'golint', // Go linter (deprecated but still used)
      'golangci-lint', // Fast Go linters runner
      'staticcheck', // Advanced Go static analysis
      'revive', // Fast, configurable, extensible linter
      'gosec', // Go security checker
      'govulncheck', // Go vulnerability checker
      'gotest', // Go test runner (built-in)
      'go test', // Go test command
      'go vet', // Go vet (built-in)
      'go mod', // Go modules
      'go get', // Go package installer
      'go install', // Go install command
      'go build', // Go build command
      'go run', // Go run command
      'ginkgo', // BDD testing framework
      'gomega', // Matcher library for Ginkgo
      'testify', // Testing toolkit
      'mockery', // Mock code generator
      'gomock', // Go mocking framework
      'wire', // Compile-time dependency injection
      'cobra', // CLI framework
      'viper', // Configuration solution
      'air', // Live reload for Go apps
      'delve', // Go debugger
      'pprof', // Go profiling tool
      'go-coverage', // Go test coverage
      'godoc', // Go documentation tool
      'goreleaser', // Release automation
      'gox', // Cross-compilation tool
      'upx', // Executable compressor
    ];
  }

  /**
   * Detect all Go tools
   */
  async detectTools() {
    const detectedTools = {};

    // Detect each tool
    for (const tool of this.tools) {
      detectedTools[tool] = await this.detectTool(tool);
    }

    // Detect Go version and environment
    const goInfo = await this.detectGoInfo();
    if (goInfo) {
      detectedTools.goInfo = goInfo;
    }

    // Detect Go modules
    const goModules = await this.detectGoModules();
    if (goModules) {
      detectedTools.goModules = goModules;
    }

    // Detect Go workspace
    const goWorkspace = await this.detectGoWorkspace();
    if (goWorkspace) {
      detectedTools.goWorkspace = goWorkspace;
    }

    // Detect Go frameworks
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
      installed: false,
      version: null,
      path: null,
    };

    try {
      // Special handling for go command
      if (toolName === 'go') {
        return await this.detectGo();
      }

      // Special handling for gofmt (built-in with go)
      if (toolName === 'gofmt') {
        return await this.detectGofmt();
      }

      // Special handling for go test (built-in with go)
      if (toolName === 'go test' || toolName === 'gotest') {
        return await this.detectGoTest();
      }

      // Special handling for go vet (built-in with go)
      if (toolName === 'go vet') {
        return await this.detectGoVet();
      }

      // Special handling for go mod (built-in with go)
      if (toolName === 'go mod') {
        return await this.detectGoMod();
      }

      // Check if tool exists in PATH
      const exists = await commandExists(toolName);
      if (!exists) {
        return toolInfo;
      }

      toolInfo.installed = true;
      toolInfo.path = this.platformDetector.getToolPath(toolName);

      // Try to get version
      try {
        const versionCommand = `${toolName} --version`;
        const result = await runCommand(versionCommand);

        if (result.success) {
          // Extract version number
          const versionMatch = result.output.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            toolInfo.version = versionMatch[1];
          } else {
            // Try alternative version patterns
            const altMatch = result.output.match(/version\s+(\S+)/i);
            if (altMatch) {
              toolInfo.version = altMatch[1];
            } else {
              toolInfo.version = result.output.trim().split('\n')[0] || 'unknown';
            }
          }
        }
      } catch (error) {
        // Could not get version, but tool is installed
      }
    } catch (error) {
      // Tool not found or error detecting
    }

    return toolInfo;
  }

  /**
   * Detect Go compiler
   */
  async detectGo() {
    const toolInfo = {
      name: 'go',
      installed: false,
      version: null,
      path: null,
    };

    try {
      const exists = await commandExists('go');
      if (!exists) {
        return toolInfo;
      }

      toolInfo.installed = true;
      toolInfo.path = this.platformDetector.getToolPath('go');

      // Get Go version
      const result = await runCommand('go version');
      if (result.success) {
        // Extract version from "go version go1.21.0 linux/amd64"
        const versionMatch = result.output.match(/go(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          toolInfo.version = versionMatch[1];
        } else {
          toolInfo.version = 'unknown';
        }
      }
    } catch (error) {
      // Go not found
    }

    return toolInfo;
  }

  /**
   * Detect gofmt (built-in formatter)
   */
  async detectGofmt() {
    const toolInfo = {
      name: 'gofmt',
      installed: false,
      version: null,
      path: null,
    };

    try {
      // gofmt is part of Go installation
      const goResult = await this.detectGo();
      if (goResult.installed) {
        toolInfo.installed = true;
        toolInfo.version = goResult.version;
        toolInfo.path =
          this.platformDetector.getToolPath('gofmt') || goResult.path.replace('go', 'gofmt');
      }
    } catch (error) {
      // gofmt not found
    }

    return toolInfo;
  }

  /**
   * Detect go test (built-in test runner)
   */
  async detectGoTest() {
    const toolInfo = {
      name: 'go test',
      installed: false,
      version: null,
      path: null,
    };

    try {
      // go test is part of Go installation
      const goResult = await this.detectGo();
      if (goResult.installed) {
        toolInfo.installed = true;
        toolInfo.version = goResult.version;
        toolInfo.path = goResult.path;
      }
    } catch (error) {
      // go test not found
    }

    return toolInfo;
  }

  /**
   * Detect go vet (built-in vet tool)
   */
  async detectGoVet() {
    const toolInfo = {
      name: 'go vet',
      installed: false,
      version: null,
      path: null,
    };

    try {
      // go vet is part of Go installation
      const goResult = await this.detectGo();
      if (goResult.installed) {
        toolInfo.installed = true;
        toolInfo.version = goResult.version;
        toolInfo.path = goResult.path;
      }
    } catch (error) {
      // go vet not found
    }

    return toolInfo;
  }

  /**
   * Detect go mod (built-in module tool)
   */
  async detectGoMod() {
    const toolInfo = {
      name: 'go mod',
      installed: false,
      version: null,
      path: null,
    };

    try {
      // go mod is part of Go installation
      const goResult = await this.detectGo();
      if (goResult.installed) {
        toolInfo.installed = true;
        toolInfo.version = goResult.version;
        toolInfo.path = goResult.path;
      }
    } catch (error) {
      // go mod not found
    }

    return toolInfo;
  }

  /**
   * Detect Go version and environment details
   */
  async detectGoInfo() {
    try {
      const goResult = await this.detectGo();
      if (!goResult.installed) {
        return null;
      }

      // Get Go environment
      const envResult = await runCommand('go env');
      if (!envResult.success) {
        return {
          version: goResult.version,
          installed: true,
        };
      }

      const envLines = envResult.output.trim().split('\n');
      const env = {};

      for (const line of envLines) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let value = parts.slice(1).join('=').trim();
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }

      return {
        version: goResult.version,
        installed: true,
        goPath: env.GOPATH || '',
        goRoot: env.GOROOT || '',
        goArch: env.GOARCH || '',
        goOs: env.GOOS || '',
        goProxy: env.GOPROXY || '',
        goNoProxy: env.GONOPROXY || '',
        goPrivate: env.GOPRIVATE || '',
        cgoEnabled: env.CGO_ENABLED === '1',
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect Go modules
   */
  async detectGoModules() {
    try {
      const goResult = await this.detectGo();
      if (!goResult.installed) {
        return null;
      }

      // Check if go.mod exists in current directory
      const fs = require('fs');
      const path = require('path');
      const cwd = process.cwd();

      let goModPath = null;
      let currentDir = cwd;

      // Walk up the directory tree to find go.mod
      while (currentDir !== path.parse(currentDir).root) {
        const potentialGoMod = path.join(currentDir, 'go.mod');
        if (fs.existsSync(potentialGoMod)) {
          goModPath = potentialGoMod;
          break;
        }
        currentDir = path.dirname(currentDir);
      }

      if (!goModPath) {
        return {
          enabled: false,
          path: null,
        };
      }

      // Read go.mod to get module name
      let moduleName = 'unknown';
      try {
        const content = fs.readFileSync(goModPath, 'utf8');
        const moduleMatch = content.match(/module\s+(\S+)/);
        if (moduleMatch) {
          moduleName = moduleMatch[1];
        }
      } catch (error) {
        // Could not read go.mod
      }

      return {
        enabled: true,
        path: goModPath,
        moduleName,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect Go workspace
   */
  async detectGoWorkspace() {
    try {
      const fs = require('fs');
      const path = require('path');
      const cwd = process.cwd();

      // Check for go.work file
      const goWorkPath = path.join(cwd, 'go.work');
      if (fs.existsSync(goWorkPath)) {
        return {
          enabled: true,
          path: goWorkPath,
          type: 'workspace',
        };
      }

      return {
        enabled: false,
        path: null,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect Go frameworks
   */
  async detectFrameworks() {
    const frameworks = [];
    const fs = require('fs');
    const path = require('path');
    const cwd = process.cwd();

    // Check for framework indicators in go.mod
    const goModules = await this.detectGoModules();
    if (goModules?.enabled) {
      try {
        const content = fs.readFileSync(goModules.path, 'utf8');

        // Check for web frameworks
        if (content.includes('github.com/gin-gonic/gin')) {
          frameworks.push({ name: 'gin', type: 'web' });
        }
        if (content.includes('github.com/labstack/echo')) {
          frameworks.push({ name: 'echo', type: 'web' });
        }
        if (content.includes('github.com/gorilla/mux')) {
          frameworks.push({ name: 'gorilla/mux', type: 'web' });
        }
        if (content.includes('github.com/go-chi/chi')) {
          frameworks.push({ name: 'chi', type: 'web' });
        }
        if (content.includes('github.com/beego/beego')) {
          frameworks.push({ name: 'beego', type: 'web' });
        }
        if (content.includes('github.com/gofiber/fiber')) {
          frameworks.push({ name: 'fiber', type: 'web' });
        }

        // Check for CLI frameworks
        if (content.includes('github.com/spf13/cobra')) {
          frameworks.push({ name: 'cobra', type: 'cli' });
        }
        if (content.includes('github.com/urfave/cli')) {
          frameworks.push({ name: 'urfave/cli', type: 'cli' });
        }

        // Check for ORM frameworks
        if (content.includes('gorm.io/gorm')) {
          frameworks.push({ name: 'gorm', type: 'orm' });
        }
        if (content.includes('github.com/jinzhu/gorm')) {
          frameworks.push({ name: 'gorm (v1)', type: 'orm' });
        }
        if (content.includes('github.com/upper/db')) {
          frameworks.push({ name: 'upper/db', type: 'orm' });
        }

        // Check for testing frameworks
        if (content.includes('github.com/onsi/ginkgo')) {
          frameworks.push({ name: 'ginkgo', type: 'testing' });
        }
        if (content.includes('github.com/onsi/gomega')) {
          frameworks.push({ name: 'gomega', type: 'testing' });
        }
        if (content.includes('github.com/stretchr/testify')) {
          frameworks.push({ name: 'testify', type: 'testing' });
        }
      } catch (error) {
        // Could not analyze go.mod
      }
    }

    return frameworks;
  }

  /**
   * Detect Go build tools
   */
  async detectBuildTools() {
    const buildTools = [];
    const fs = require('fs');
    const path = require('path');
    const cwd = process.cwd();

    // Check for Makefile
    if (fs.existsSync(path.join(cwd, 'Makefile'))) {
      buildTools.push({ name: 'make', type: 'build' });
    }

    // Check for Taskfile
    if (
      fs.existsSync(path.join(cwd, 'Taskfile.yml')) ||
      fs.existsSync(path.join(cwd, 'Taskfile.yaml'))
    ) {
      buildTools.push({ name: 'task', type: 'build' });
    }

    // Check for magefile
    if (fs.existsSync(path.join(cwd, 'magefile.go'))) {
      buildTools.push({ name: 'mage', type: 'build' });
    }

    // Check for air (live reload)
    const airExists = await commandExists('air');
    if (airExists) {
      buildTools.push({ name: 'air', type: 'dev' });
    }

    // Check for goreleaser
    if (
      fs.existsSync(path.join(cwd, '.goreleaser.yml')) ||
      fs.existsSync(path.join(cwd, '.goreleaser.yaml'))
    ) {
      buildTools.push({ name: 'goreleaser', type: 'release' });
    }

    return buildTools;
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(detectedTools) {
    const report = {
      summary: {
        goInstalled: detectedTools.go?.installed || false,
        gofmtInstalled: detectedTools.gofmt?.installed || false,
        hasTesting: detectedTools['go test']?.installed || false,
        hasLinter:
          detectedTools['golangci-lint']?.installed || detectedTools.golint?.installed || false,
        hasFormatter: detectedTools.gofmt?.installed || detectedTools.goimports?.installed || false,
        hasVet: detectedTools['go vet']?.installed || false,
        hasModules: detectedTools.goModules?.enabled || false,
        hasWorkspace: detectedTools.goWorkspace?.enabled || false,
        hasFrameworks: detectedTools.frameworks?.length > 0 || false,
        hasBuildTools: detectedTools.buildTools?.length > 0 || false,
      },
      go: detectedTools.go,
      goInfo: detectedTools.goInfo,
      goModules: detectedTools.goModules,
      goWorkspace: detectedTools.goWorkspace,
      frameworks: detectedTools.frameworks || [],
      buildTools: detectedTools.buildTools || [],
      tools: {
        gofmt: detectedTools.gofmt,
        goimports: detectedTools.goimports,
        golint: detectedTools.golint,
        'golangci-lint': detectedTools['golangci-lint'],
        staticcheck: detectedTools.staticcheck,
        revive: detectedTools.revive,
        gosec: detectedTools.gosec,
        'go test': detectedTools['go test'],
        'go vet': detectedTools['go vet'],
        'go mod': detectedTools['go mod'],
      },
    };

    return report;
  }

  /**
   * Get tool installation command
   */
  getInstallationCommand(toolName, options = {}) {
    const commands = {
      go: {
        macos: 'brew install go',
        linux: 'sudo apt-get install golang',
        windows: 'Download from https://golang.org/dl/',
      },
      'golangci-lint': {
        macos: 'brew install golangci-lint',
        linux:
          'curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin',
        windows: 'go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest',
      },
      staticcheck: 'go install honnef.co/go/tools/cmd/staticcheck@latest',
      revive: 'go install github.com/mgechev/revive@latest',
      gosec: 'go install github.com/securego/gosec/v2/cmd/gosec@latest',
      govulncheck: 'go install golang.org/x/vuln/cmd/govulncheck@latest',
      goimports: 'go install golang.org/x/tools/cmd/goimports@latest',
      ginkgo: 'go install github.com/onsi/ginkgo/v2/ginkgo@latest',
      gomega: 'go install github.com/onsi/gomega@latest',
      testify: 'go install github.com/stretchr/testify@latest',
      mockery: 'go install github.com/vektra/mockery/v2@latest',
      wire: 'go install github.com/google/wire/cmd/wire@latest',
      cobra: 'go install github.com/spf13/cobra-cli@latest',
      air: 'go install github.com/cosmtrek/air@latest',
      delve: 'go install github.com/go-delve/delve/cmd/dlv@latest',
      goreleaser: 'go install github.com/goreleaser/goreleaser@latest',
      gox: 'go install github.com/mitchellh/gox@latest',
    };

    const command = commands[toolName];

    if (typeof command === 'object' && !Array.isArray(command)) {
      const platform = this.platformDetector.getPlatformName();
      return command[platform] || command[Object.keys(command)[0]];
    }

    return command || `go install ${toolName}@latest`;
  }

  /**
   * Print detection results
   */
  printResults(results, verbose = false) {
    console.log('\n🚀 Go Tool Detection Results\n');

    const installed = Object.entries(results)
      .filter(([_, info]) => info && info.installed)
      .sort((a, b) => a[0].localeCompare(b[0]));

    const missing = Object.entries(results)
      .filter(([_, info]) => info && !info.installed)
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (installed.length > 0) {
      console.log('✅ Installed tools:');
      installed.forEach(([tool, info]) => {
        const versionText = info.version ? `v${info.version}` : 'unknown version';
        console.log(`  • ${tool}: ${versionText}`);
      });
      console.log('');
    }

    if (missing.length > 0 && verbose) {
      console.log('❌ Missing tools:');
      missing.forEach(([tool, _]) => {
        console.log(`  • ${tool}`);
      });
      console.log('');
    }

    // Show Go environment info
    if (results.goInfo) {
      console.log('📦 Go Environment:');
      console.log(`  • Version: ${results.goInfo.version}`);
      console.log(`  • GOPATH: ${results.goInfo.goPath || 'not set'}`);
      console.log(`  • GOROOT: ${results.goInfo.goRoot || 'not set'}`);
      console.log(`  • GOOS/GOARCH: ${results.goInfo.goOs}/${results.goInfo.goArch}`);
      console.log('');
    }

    // Show Go modules info
    if (results.goModules) {
      console.log('📁 Go Modules:');
      console.log(`  • Enabled: ${results.goModules.enabled ? 'Yes' : 'No'}`);
      if (results.goModules.enabled) {
        console.log(`  • Module: ${results.goModules.moduleName}`);
        console.log(`  • Path: ${results.goModules.path}`);
      }
      console.log('');
    }

    // Show frameworks
    if (results.frameworks && results.frameworks.length > 0) {
      console.log('🏗️  Detected Frameworks:');
      results.frameworks.forEach((framework) => {
        console.log(`  • ${framework.name} (${framework.type})`);
      });
      console.log('');
    }

    // Show build tools
    if (results.buildTools && results.buildTools.length > 0) {
      console.log('🔨 Build Tools:');
      results.buildTools.forEach((tool) => {
        console.log(`  • ${tool.name} (${tool.type})`);
      });
      console.log('');
    }

    console.log(
      `📊 Summary: ${installed.length} installed${verbose ? `, ${missing.length} missing` : ''}`
    );

    return {
      installed: installed.length,
      missing: missing.length,
      tools: results,
    };
  }
}

module.exports = GoToolDetector;
