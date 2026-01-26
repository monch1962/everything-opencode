#!/usr/bin/env node
/**
 * Platform Detector and Tool Path Resolver
 *
 * Cross-platform utility for detecting OS and resolving tool paths
 * Replaces hardcoded macOS paths with dynamic detection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class PlatformDetector {
  constructor() {
    this.platform = process.platform;
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.architecture = os.arch();
    this.isAppleSilicon = this.isMacOS && this.architecture === 'arm64';
  }

  /**
   * Get platform name for display purposes
   */
  getPlatformName() {
    if (this.isWindows) return 'windows';
    if (this.isMacOS) return 'macos';
    if (this.isLinux) return 'linux';
    return 'unknown';
  }

  /**
   * Get architecture for display purposes
   */
  getArchitecture() {
    return this.architecture;
  }

  /**
   * Check if a command exists in PATH
   */
  commandExists(command) {
    try {
      if (this.isWindows) {
        execSync(`where ${command}`, { stdio: 'ignore' });
      } else {
        execSync(`command -v ${command}`, { stdio: 'ignore' });
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find a tool in common installation locations
   */
  findTool(toolName, customLocations = []) {
    const locations = [
      // Check PATH first
      toolName,
      // Common macOS locations
      ...(this.isMacOS
        ? [
          `/opt/homebrew/bin/${toolName}`, // Apple Silicon Homebrew
          `/usr/local/bin/${toolName}`, // Intel Homebrew
          `/opt/local/bin/${toolName}`, // MacPorts
        ]
        : []),
      // Common Linux locations
      ...(this.isLinux
        ? [
          `/usr/bin/${toolName}`,
          `/usr/local/bin/${toolName}`,
          `/snap/bin/${toolName}`,
          `~/.local/bin/${toolName}`,
        ]
        : []),
      // Common Windows locations
      ...(this.isWindows
        ? [
          `C:\\Program Files\\${toolName}\\bin\\${toolName}.exe`,
          `C:\\Program Files (x86)\\${toolName}\\bin\\${toolName}.exe`,
          `C:\\${toolName}\\bin\\${toolName}.exe`,
          `${toolName}.exe`,
        ]
        : []),
      // Custom locations
      ...customLocations,
    ];

    for (const location of locations) {
      const expandedLocation = location.replace('~', os.homedir());

      try {
        if (this.isWindows) {
          // On Windows, check if file exists
          if (fs.existsSync(expandedLocation)) {
            return expandedLocation;
          }
          // Also check with .exe extension if not already present
          if (
            !expandedLocation.endsWith('.exe') &&
            fs.existsSync(`${expandedLocation}.exe`)
          ) {
            return `${expandedLocation}.exe`;
          }
        } else {
          // On Unix-like systems, check if executable exists
          if (fs.existsSync(expandedLocation)) {
            const stats = fs.statSync(expandedLocation);
            if (stats.isFile() && stats.mode & 0o111) {
              return expandedLocation;
            }
          }
        }
      } catch (error) {
        // Continue to next location
      }
    }

    // Last resort: try command in PATH
    if (this.commandExists(toolName)) {
      return toolName;
    }

    return null;
  }

  /**
   * Get the path to a specific tool with fallbacks
   */
  getToolPath(toolName, options = {}) {
    const {
      required = true,
      customLocations = [],
      fallbackToCommand = true,
    } = options;

    const toolPath = this.findTool(toolName, customLocations);

    if (!toolPath && required) {
      throw new Error(
        `${toolName} not found. Please install ${toolName} and ensure it's in your PATH.\n` +
          `Platform: ${this.getPlatformName()} (${this.getArchitecture()})\n` +
          `Common locations checked:\n` +
          `  • PATH environment variable\n` +
          `  • Platform-specific default locations\n` +
          `  • Custom locations: ${customLocations.join(', ')}`,
      );
    }

    if (!toolPath && fallbackToCommand && this.commandExists(toolName)) {
      return toolName;
    }

    return toolPath;
  }

  /**
   * Execute a command with platform-specific considerations
   */
  executeCommand(command, args = [], options = {}) {
    const { cwd = process.cwd(), env = process.env, timeout = 30000 } = options;

    const fullCommand = this.isWindows
      ? `${command} ${args.join(' ')}`
      : [command, ...args].join(' ');

    try {
      const result = execSync(fullCommand, {
        cwd,
        env,
        timeout,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return {
        success: true,
        output: result.trim(),
        command: fullCommand,
      };
    } catch (error) {
      return {
        success: false,
        output: error.stderr?.toString() || error.message,
        command: fullCommand,
        code: error.status || 1,
      };
    }
  }

  /**
   * Get installation instructions for a tool based on platform
   */
  getInstallationInstructions(toolName) {
    const instructions = {
      go: {
        macos: 'brew install go',
        linux:
          'sudo apt-get install golang-go  # Ubuntu/Debian\n  sudo yum install golang  # RHEL/CentOS\n  sudo pacman -S go  # Arch',
        windows: 'Download from https://golang.org/dl/ and run the installer',
      },
      mix: {
        macos: 'brew install elixir  # Includes mix',
        linux:
          'sudo apt-get install elixir  # Ubuntu/Debian\n  sudo yum install elixir  # RHEL/CentOS',
        windows: 'Download from https://elixir-lang.org/install.html#windows',
      },
      python3: {
        macos: 'brew install python@3.11',
        linux: 'sudo apt-get install python3 python3-pip  # Ubuntu/Debian',
        windows: 'Download from https://www.python.org/downloads/',
      },
      node: {
        macos: 'brew install node',
        linux:
          'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash - && sudo apt-get install -y nodejs',
        windows: 'Download from https://nodejs.org/',
      },
    };

    const platform = this.getPlatformName();
    const toolInstructions = instructions[toolName];

    if (!toolInstructions) {
      return `Please install ${toolName} for your platform (${platform}).`;
    }

    return (
      toolInstructions[platform] ||
      toolInstructions.linux ||
      `Please install ${toolName} for ${platform}.`
    );
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(tools = ['go', 'mix', 'python3', 'node']) {
    const report = {
      platform: this.getPlatformName(),
      architecture: this.getArchitecture(),
      tools: {},
      recommendations: [],
    };

    for (const tool of tools) {
      const toolPath = this.getToolPath(tool, { required: false });
      report.tools[tool] = {
        installed: !!toolPath,
        path: toolPath,
      };

      if (!toolPath) {
        report.recommendations.push({
          tool,
          message: `${tool} is not installed`,
          instructions: this.getInstallationInstructions(tool),
        });
      }
    }

    return report;
  }
}

module.exports = PlatformDetector;
