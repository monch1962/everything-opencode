#!/usr/bin/env node
/**
 * Go Tool Detector
 *
 * Detects Go tools, versions, and provides installation guides
 * Includes Go-specific improvements for modern Go development
 */

const { runCommand, commandExists } = require("../../scripts/lib/utils");

class GoToolDetector {
  constructor() {
    this.tools = this.initializeTools();
  }

  /**
   * Initialize tool definitions with Go-specific improvements
   */
  initializeTools() {
    return {
      // Go compilers and runtime
      go: {
        command: "go version",
        description: "Go compiler and runtime",
        installGuide: {
          macos: "brew install go",
          linux: "sudo apt-get install golang-go",
          windows: "Download from https://golang.org/dl/",
          docker: "docker run --rm -it golang:latest go version",
        },
        priority: 10,
        minVersion: "1.16",
        recommendedVersion: "1.21",
      },

      // Build and development tools
      gofmt: {
        command: "gofmt -version",
        description: "Go code formatter (built-in)",
        installGuide: {
          macos: "Part of Go installation",
          linux: "Part of Go installation",
          windows: "Part of Go installation",
        },
        priority: 9,
      },

      goimports: {
        command: "goimports --version",
        description:
          "Updates Go import lines, adds missing ones, removes unreferenced ones",
        installGuide: {
          macos: "go install golang.org/x/tools/cmd/goimports@latest",
          linux: "go install golang.org/x/tools/cmd/goimports@latest",
          windows: "go install golang.org/x/tools/cmd/goimports@latest",
        },
        priority: 8,
      },

      // Linting and static analysis
      golangci_lint: {
        command: "golangci-lint --version",
        description: "Fast linters runner for Go with 50+ linters",
        installGuide: {
          macos: "brew install golangci-lint",
          linux:
            "curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin",
          windows: "scoop install golangci-lint",
        },
        priority: 8,
        recommended: true,
      },

      staticcheck: {
        command: "staticcheck --version",
        description: "State of the art linter for Go",
        installGuide: {
          macos: "go install honnef.co/go/tools/cmd/staticcheck@latest",
          linux: "go install honnef.co/go/tools/cmd/staticcheck@latest",
          windows: "go install honnef.co/go/tools/cmd/staticcheck@latest",
        },
        priority: 7,
      },

      revive: {
        command: "revive --version",
        description:
          "Fast, configurable, extensible, flexible, and beautiful linter for Go",
        installGuide: {
          macos: "go install github.com/mgechev/revive@latest",
          linux: "go install github.com/mgechev/revive@latest",
          windows: "go install github.com/mgechev/revive@latest",
        },
        priority: 6,
      },

      // Testing tools
      gotest: {
        command: "go test -version",
        description: "Go testing framework (built-in)",
        installGuide: {
          macos: "Part of Go installation",
          linux: "Part of Go installation",
          windows: "Part of Go installation",
        },
        priority: 9,
      },

      gotestsum: {
        command: "gotestsum --version",
        description: "Human-friendly `go test` runner with rich output",
        installGuide: {
          macos: "go install gotest.tools/gotestsum@latest",
          linux: "go install gotest.tools/gotestsum@latest",
          windows: "go install gotest.tools/gotestsum@latest",
        },
        priority: 7,
      },

      // Debugging tools
      delve: {
        command: "dlv version",
        description: "Debugger for the Go programming language",
        installGuide: {
          macos: "go install github.com/go-delve/delve/cmd/dlv@latest",
          linux: "go install github.com/go-delve/delve/cmd/dlv@latest",
          windows: "go install github.com/go-delve/delve/cmd/dlv@latest",
        },
        priority: 7,
      },

      // Code generation
      mockgen: {
        command: "mockgen --version",
        description: "Mock interface generation for Go",
        installGuide: {
          macos: "go install go.uber.org/mock/mockgen@latest",
          linux: "go install go.uber.org/mock/mockgen@latest",
          windows: "go install go.uber.org/mock/mockgen@latest",
        },
        priority: 6,
      },

      // Dependency management
      go_mod: {
        command: "go mod version",
        description: "Go modules dependency management (built-in)",
        installGuide: {
          macos: "Part of Go installation (Go 1.11+)",
          linux: "Part of Go installation (Go 1.11+)",
          windows: "Part of Go installation (Go 1.11+)",
        },
        priority: 9,
      },

      // Profiling and performance
      pprof: {
        command: "go tool pprof -version",
        description: "CPU and memory profiling tool (built-in)",
        installGuide: {
          macos: "Part of Go installation",
          linux: "Part of Go installation",
          windows: "Part of Go installation",
        },
        priority: 6,
      },

      // Security tools
      gosec: {
        command: "gosec --version",
        description: "Security scanner for Go code",
        installGuide: {
          macos: "go install github.com/securego/gosec/v2/cmd/gosec@latest",
          linux: "go install github.com/securego/gosec/v2/cmd/gosec@latest",
          windows: "go install github.com/securego/gosec/v2/cmd/gosec@latest",
        },
        priority: 6,
      },

      // Documentation
      godoc: {
        command: "godoc -version",
        description: "Go documentation server and generator",
        installGuide: {
          macos: "go install golang.org/x/tools/cmd/godoc@latest",
          linux: "go install golang.org/x/tools/cmd/godoc@latest",
          windows: "go install golang.org/x/tools/cmd/godoc@latest",
        },
        priority: 5,
      },
    };
  }

  /**
   * Detect all Go tools with Go-specific improvements
   */
  async detectTools() {
    console.log("🔍 Detecting Go tools...");

    const detectedTools = {};
    const detectionPromises = [];

    for (const [toolName, toolInfo] of Object.entries(this.tools)) {
      detectionPromises.push(
        this.detectTool(toolName, toolInfo, detectedTools),
      );
    }

    await Promise.all(detectionPromises);

    // Go-specific: Check Go module support
    await this.detectGoModuleSupport(detectedTools);

    // Go-specific: Check GOPATH vs Go modules
    await this.detectGoEnvironment(detectedTools);

    // Go-specific: Check Go workspace support (Go 1.18+)
    await this.detectGoWorkspaceSupport(detectedTools);

    return detectedTools;
  }

  /**
   * Detect individual tool with Go-specific version parsing
   */
  async detectTool(toolName, toolInfo, detectedTools) {
    try {
      const result = runCommand(toolInfo.command, {
        stdio: "pipe",
        timeout: 5000,
      });

      if (result.success) {
        toolInfo.installed = true;

        // Go-specific version parsing
        const output = result.output.trim();
        toolInfo.version = this.parseGoVersion(toolName, output);

        // Go-specific: Check if version meets minimum requirement
        if (toolInfo.minVersion) {
          toolInfo.meetsMinimum =
            this.compareGoVersions(toolInfo.version, toolInfo.minVersion) >= 0;
        }

        detectedTools[toolName] = { ...toolInfo };
      } else {
        toolInfo.installed = false;
        toolInfo.version = null;
        detectedTools[toolName] = { ...toolInfo };
      }
    } catch (error) {
      toolInfo.installed = false;
      toolInfo.version = null;
      detectedTools[toolName] = { ...toolInfo };
    }
  }

  /**
   * Go-specific version parsing
   */
  parseGoVersion(toolName, output) {
    // Special handling for different tool version outputs
    if (toolName === "go") {
      // Example: "go version go1.21.0 darwin/amd64"
      const match = output.match(/go(\d+\.\d+(?:\.\d+)?)/);
      return match ? match[1] : output;
    } else if (toolName === "gofmt") {
      // gofmt doesn't have version flag, use go version
      const result = runCommand("go version", { stdio: "pipe" });
      if (result.success) {
        const match = result.output.match(/go(\d+\.\d+(?:\.\d+)?)/);
        return match ? match[1] : "unknown";
      }
      return "unknown";
    } else if (toolName === "golangci_lint") {
      // Example: "golangci-lint has version v1.54.2 built from ..."
      const match = output.match(/v(\d+\.\d+\.\d+)/);
      return match ? match[1] : output;
    } else if (toolName === "staticcheck") {
      // Example: "staticcheck 2023.1.6 (v0.4.3)"
      const match = output.match(/v(\d+\.\d+\.\d+)/);
      return match ? match[1] : output;
    }

    // Default: try to extract version number
    const versionMatch = output.match(/(\d+\.\d+\.\d+|\d+\.\d+)/);
    return versionMatch ? versionMatch[0] : output;
  }

  /**
   * Compare Go versions (Go-specific semantic version comparison)
   */
  compareGoVersions(version1, version2) {
    if (!version1 || !version2) return 0;

    const v1 = version1.split(".").map(Number);
    const v2 = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * Go-specific: Detect Go module support
   */
  async detectGoModuleSupport(detectedTools) {
    try {
      const result = runCommand("go env GOMOD", { stdio: "pipe" });
      detectedTools.go_module_support = {
        enabled: result.success && result.output.trim() !== "",
        goModPath: result.success ? result.output.trim() : null,
      };
    } catch (error) {
      detectedTools.go_module_support = { enabled: false, goModPath: null };
    }
  }

  /**
   * Go-specific: Detect GOPATH vs Go modules environment
   */
  async detectGoEnvironment(detectedTools) {
    try {
      const gopathResult = runCommand("go env GOPATH", { stdio: "pipe" });
      const gorootResult = runCommand("go env GOROOT", { stdio: "pipe" });

      detectedTools.go_environment = {
        gopath: gopathResult.success ? gopathResult.output.trim() : null,
        goroot: gorootResult.success ? gorootResult.output.trim() : null,
        usingModules: detectedTools.go_module_support?.enabled || false,
      };
    } catch (error) {
      detectedTools.go_environment = {
        gopath: null,
        goroot: null,
        usingModules: false,
      };
    }
  }

  /**
   * Go-specific: Detect Go workspace support (Go 1.18+)
   */
  async detectGoWorkspaceSupport(detectedTools) {
    try {
      const result = runCommand("go work", { stdio: "pipe" });
      detectedTools.go_workspace_support = {
        available: result.success,
        // Check if go.work file exists
        hasWorkspace:
          runCommand('test -f go.work && echo "yes" || echo "no"', {
            stdio: "pipe",
          }).output.trim() === "yes",
      };
    } catch (error) {
      detectedTools.go_workspace_support = {
        available: false,
        hasWorkspace: false,
      };
    }
  }

  /**
   * Get installation recommendations based on detected tools
   */
  getInstallationRecommendations(detectedTools) {
    const recommendations = [];

    // Check for required tools
    if (!detectedTools.go?.installed) {
      recommendations.push({
        tool: "go",
        priority: "critical",
        message: "Go compiler is required for Go development",
        installGuide: detectedTools.go?.installGuide,
      });
    } else if (detectedTools.go.minVersion && !detectedTools.go.meetsMinimum) {
      recommendations.push({
        tool: "go",
        priority: "high",
        message: `Go version ${detectedTools.go.version} is below minimum required ${detectedTools.go.minVersion}`,
        action: "Upgrade Go to latest version",
      });
    }

    // Check for recommended tools
    if (
      !detectedTools.golangci_lint?.installed &&
      detectedTools.go?.installed
    ) {
      recommendations.push({
        tool: "golangci-lint",
        priority: "recommended",
        message: "golangci-lint is recommended for comprehensive Go linting",
        installGuide: detectedTools.golangci_lint?.installGuide,
      });
    }

    if (!detectedTools.goimports?.installed && detectedTools.go?.installed) {
      recommendations.push({
        tool: "goimports",
        priority: "recommended",
        message: "goimports is recommended for automatic import management",
        installGuide: detectedTools.goimports?.installGuide,
      });
    }

    // Check for modern Go features
    if (
      detectedTools.go?.version &&
      this.compareGoVersions(detectedTools.go.version, "1.18") >= 0
    ) {
      if (!detectedTools.go_workspace_support?.hasWorkspace) {
        recommendations.push({
          tool: "go work",
          priority: "info",
          message:
            "Consider using Go workspaces for multi-module development (Go 1.18+)",
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate Go-specific environment report
   */
  generateEnvironmentReport(detectedTools) {
    const report = {
      summary: {
        goInstalled: detectedTools.go?.installed || false,
        goVersion: detectedTools.go?.version || "not installed",
        usingModules: detectedTools.go_module_support?.enabled || false,
        usingWorkspace:
          detectedTools.go_workspace_support?.hasWorkspace || false,
        totalToolsDetected: Object.keys(detectedTools).filter(
          (t) => detectedTools[t]?.installed,
        ).length,
      },
      tools: {},
      recommendations: this.getInstallationRecommendations(detectedTools),
    };

    // Categorize tools
    for (const [toolName, toolInfo] of Object.entries(detectedTools)) {
      if (toolInfo.installed) {
        report.tools[toolName] = {
          version: toolInfo.version,
          description: toolInfo.description,
          meetsMinimum: toolInfo.meetsMinimum,
        };
      }
    }

    // Add environment info
    if (detectedTools.go_environment) {
      report.environment = detectedTools.go_environment;
    }

    return report;
  }
}

module.exports = GoToolDetector;
