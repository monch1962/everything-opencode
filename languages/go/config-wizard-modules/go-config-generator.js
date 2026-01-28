#!/usr/bin/env node
/**
 * Go Config Generator Module for GoConfigWizard
 *
 * Configuration methods: configureProject, generateConfiguration, saveConfiguration
 */

const fs = require('fs');
const path = require('path');

class GoConfigGenerator {
  constructor(projectPath, toolDetector) {
    this.projectPath = projectPath;
    this.toolDetector = toolDetector;
  }

  /**
   * Configure project with Go-specific settings
   */
  async configureProject(projectInfo, detectedTools, _options) {
    console.log('\n⚙️ Configuring Go project...');

    const config = {
      ...projectInfo,
      tools: {},
      linting: {},
      testing: {},
      build: {},
    };

    // Configure tools based on detection
    if (detectedTools.golangci_lint?.installed) {
      config.tools.linter = 'golangci-lint';
      config.linting.tool = 'golangci-lint';
      config.linting.configFile = '.golangci.yml';
    } else if (detectedTools.staticcheck?.installed) {
      config.tools.linter = 'staticcheck';
      config.linting.tool = 'staticcheck';
    }

    if (detectedTools.goimports?.installed) {
      config.tools.formatter = 'goimports';
    } else {
      config.tools.formatter = 'gofmt';
    }

    // Configure testing
    if (detectedTools.gotestsum?.installed) {
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
            output: 'coverage.out',
            html: 'coverage.html',
          },
        },

        // Build configuration
        build: projectConfig.build || {
          flags: [],
          ldflags: [],
          output: 'bin/',
          platforms: ['linux/amd64', 'darwin/amd64', 'windows/amd64'],
        },

        // Dependencies
        dependencies: {
          updatePolicy: 'patch',
          allowPrerelease: false,
          vendor: false,
        },

        // Development tools
        devTools: {
          debugger: 'delve',
          liveReload: 'air',
          documentation: 'godoc',
        },
      },

      // Project metadata
      metadata: {
        name: projectConfig.moduleName || path.basename(this.projectPath),
        description: 'Go project configured with opencode',
        version: '0.1.0',
        authors: [],
        license: 'MIT',
      },

      // Commands
      commands: {
        test: 'go test ./...',
        lint: 'golangci-lint run',
        format: 'go fmt ./...',
        build: 'go build ./...',
        clean: 'go clean',
        deps: 'go mod tidy',
      },
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config) {
    const configPath = path.join(this.projectPath, '.opencode-go.json');

    try {
      const jsonConfig = JSON.stringify(config, null, 2);
      fs.writeFileSync(configPath, jsonConfig);
      console.log(`✅ Configuration saved to: ${configPath}`);

      // Also create .golangci.yml if using golangci-lint
      if (config.go.linting.tool === 'golangci-lint') {
        this.createGolangCIConfig();
      }

      return configPath;
    } catch (error) {
      console.log(`❌ Failed to save configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create .golangci.yml configuration
   */
  createGolangCIConfig() {
    const golangciPath = path.join(this.projectPath, '.golangci.yml');

    const config = `# golangci-lint configuration
# See: https://golangci-lint.run/usage/configuration/

linters:
  enable:
    - govet
    - errcheck
    - staticcheck
    - gosimple
    - ineffassign
    - gofmt
    - goimports
    - typecheck
    - unused

  disable:
    - deadcode
    - varcheck

linters-settings:
  govet:
    check-shadowing: true
    fieldalignment: false

  staticcheck:
    checks: ["all"]

issues:
  exclude-rules:
    - path: _test\\.go
      linters:
        - errcheck

  max-issues-per-linter: 0
  max-same-issues: 0

run:
  timeout: 5m
  modules-download-mode: readonly

output:
  format: colored-line-number
  print-issued-lines: true
  print-linter-name: true

severity:
  default: "error"
`;

    try {
      fs.writeFileSync(golangciPath, config);
      console.log(`✅ Created .golangci.yml configuration`);
    } catch (error) {
      console.log(`⚠️ Could not create .golangci.yml: ${error.message}`);
    }
  }

  /**
   * Create Makefile for Go project
   */
  createMakefile(projectConfig) {
    const makefilePath = path.join(this.projectPath, 'Makefile');

    const makefile = `# Go Project Makefile

.PHONY: help build test lint format clean deps

# Project variables
MODULE := ${projectConfig.module || 'example'}
BIN_DIR := bin
COVERAGE_FILE := coverage.out

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\\n", $$1, $$2}'

build: ## Build the project
	@echo "Building $(MODULE)..."
	@mkdir -p $(BIN_DIR)
	go build -o $(BIN_DIR)/ ./...

test: ## Run tests
	@echo "Running tests..."
	go test -v -race ./...

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	go test -v -race -coverprofile=$(COVERAGE_FILE) ./...
	go tool cover -html=$(COVERAGE_FILE) -o coverage.html

lint: ## Run linter
	@echo "Running linter..."
	golangci-lint run ./...

format: ## Format code
	@echo "Formatting code..."
	go fmt ./...
	goimports -w .

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf $(BIN_DIR) $(COVERAGE_FILE) coverage.html

deps: ## Update dependencies
	@echo "Updating dependencies..."
	go mod tidy
	go mod download

run: build ## Build and run
	@echo "Running..."
	./$(BIN_DIR)/$(shell basename $(MODULE))

install-tools: ## Install development tools
	@echo "Installing tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install golang.org/x/tools/cmd/goimports@latest
	go install github.com/go-delve/delve/cmd/dlv@latest
	go install github.com/cosmtrek/air@latest

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t $(MODULE):latest .

docker-run: docker-build ## Build and run Docker container
	@echo "Running Docker container..."
	docker run -p 8080:8080 $(MODULE):latest
`;

    try {
      fs.writeFileSync(makefilePath, makefile);
      console.log(`✅ Created Makefile`);
    } catch (error) {
      console.log(`⚠️ Could not create Makefile: ${error.message}`);
    }
  }

  /**
   * Create README.md for Go project
   */
  createReadme(projectConfig) {
    const readmePath = path.join(this.projectPath, 'README.md');

    const readme = `# ${projectConfig.moduleName || path.basename(this.projectPath)}

A Go project configured with opencode.

## Project Structure

\`\`\`
${this.projectPath}/
├── cmd/          # Command-line applications
├── internal/     # Private application code
├── pkg/          # Public library code
├── api/          # API definitions
├── web/          # Web assets
├── scripts/      # Build and deployment scripts
├── go.mod        # Go module definition
└── README.md     # This file
\`\`\`

## Getting Started

### Prerequisites
- Go ${projectConfig.goVersion || '1.21'} or later

### Installation
\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${path.basename(this.projectPath)}

# Install dependencies
make deps

# Build the project
make build
\`\`\`

### Development
\`\`\`bash
# Run tests
make test

# Run linter
make lint

# Format code
make format

# Run with live reload (if air is installed)
air
\`\`\`

## Available Commands

See the [Makefile](Makefile) for all available commands, or run:
\`\`\`bash
make help
\`\`\`

## Configuration

This project uses the following tools:
- **Linter**: ${projectConfig.tools?.linter || 'golangci-lint'}
- **Formatter**: ${projectConfig.tools?.formatter || 'gofmt'}
- **Test Runner**: ${projectConfig.tools?.testRunner || 'go test'}

Configuration files:
- \`.opencode-go.json\` - Project configuration
- \`.golangci.yml\` - Linter configuration (if using golangci-lint)

## License

MIT
`;

    try {
      fs.writeFileSync(readmePath, readme);
      console.log(`✅ Created README.md`);
    } catch (error) {
      console.log(`⚠️ Could not create README.md: ${error.message}`);
    }
  }
}

module.exports = GoConfigGenerator;
