#!/usr/bin/env node
/**
 * Go Wizard Core Module for GoConfigWizard
 *
 * Core wizard methods: constructor, runWizard, showEnvironmentReport, showInstallationGuide, showCompletionMessage
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('../../scripts/lib/utils');
const GoToolDetector = require('../tool-detector');

class GoWizardCore {
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

    // Return report for other modules to use
    return report;
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
   * Show installation guide for Go tools
   */
  showInstallationGuide(toolName) {
    const guides = {
      go: `
📦 Go Installation:

macOS (Homebrew):
  brew install go

Ubuntu/Debian:
  sudo apt update
  sudo apt install golang-go

Windows:
  Download from: https://golang.org/dl/

After installation, verify with:
  go version
      `,

      'golangci-lint': `
🔧 golangci-lint Installation:

macOS (Homebrew):
  brew install golangci-lint

Linux/Windows:
  # Install using go install
  go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

  # Or download binary
  curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin

Verify with:
  golangci-lint --version
      `,

      air: `
🌀 Air (Live Reload) Installation:

Using go install:
  go install github.com/cosmtrek/air@latest

Using curl:
  curl -sSfL https://raw.githubusercontent.com/cosmtrek/air/master/install.sh | sh -s -- -b $(go env GOPATH)/bin

Verify with:
  air -v
      `,

      delve: `
🐛 Delve (Debugger) Installation:

Using go install:
  go install github.com/go-delve/delve/cmd/dlv@latest

Verify with:
  dlv version
      `,
    };

    if (guides[toolName]) {
      console.log(guides[toolName]);
    } else {
      console.log(`Install ${toolName} using: go install ${toolName}`);
    }
  }

  /**
   * Show completion message with Go-specific resources
   */
  showCompletionMessage(config, environmentReport) {
    console.log('\n🎉 Go Project Configuration Complete!');
    console.log('='.repeat(50));

    console.log('\n📁 Project Structure:');
    if (config.projectType === 'module') {
      console.log('  • Single Go module');
    } else if (config.projectType === 'cli') {
      console.log('  • CLI application with cmd/ directory');
    } else if (config.projectType === 'web') {
      console.log('  • Web application with API structure');
    } else if (config.projectType === 'library') {
      console.log('  • Library with pkg/ directory');
    } else if (config.projectType === 'workspace') {
      console.log('  • Multi-module workspace');
    }

    console.log('\n⚙️  Configured Tools:');
    if (config.tools?.linter) {
      console.log(`  • Linter: ${config.tools.linter}`);
    }
    if (config.tools?.formatter) {
      console.log(`  • Formatter: ${config.tools.formatter}`);
    }
    if (config.tools?.testRunner) {
      console.log(`  • Test Runner: ${config.tools.testRunner}`);
    }

    console.log('\n🚀 Next Steps:');
    console.log('  1. Run: go mod tidy');
    console.log('  2. Run: go build ./...');
    console.log('  3. Run: go test ./...');

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

  /**
   * Get detected tools
   */
  getDetectedTools() {
    return this.detectedTools;
  }

  /**
   * Get tool detector
   */
  getToolDetector() {
    return this.toolDetector;
  }

  /**
   * Get project path
   */
  getProjectPath() {
    return this.projectPath;
  }
}

module.exports = GoWizardCore;
