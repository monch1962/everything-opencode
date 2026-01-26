#!/usr/bin/env node
/**
 * Elixir Tool Detector
 *
 * Detects Elixir tools, versions, and provides installation guides
 * Includes Elixir-specific improvements for modern Elixir development
 */

const { runCommand, commandExists } = require('../../scripts/lib/utils');

class ElixirToolDetector {
  constructor() {
    this.tools = this.initializeTools();
  }

  /**
   * Initialize tool definitions with Elixir-specific improvements
   */
  initializeTools() {
    return {
      // Elixir runtime and compiler
      elixir: {
        command: 'elixir --version',
        description: 'Elixir programming language runtime',
        installGuide: {
          macos: 'brew install elixir',
          linux: 'sudo apt-get install elixir',
          windows: 'Download from https://elixir-lang.org/install.html#windows',
          docker: 'docker run --rm -it elixir:latest elixir --version',
        },
        priority: 10,
        minVersion: '1.14',
        recommendedVersion: '1.19',
      },

      // Mix build tool
      mix: {
        command: 'mix --version',
        description: 'Elixir build tool and dependency manager',
        installGuide: {
          macos: 'Part of Elixir installation',
          linux: 'Part of Elixir installation',
          windows: 'Part of Elixir installation',
        },
        priority: 9,
      },

      // Hex package manager
      hex: {
        command: 'mix hex.info',
        description: 'Package manager for the Erlang ecosystem',
        installGuide: {
          macos: 'mix local.hex --force',
          linux: 'mix local.hex --force',
          windows: 'mix local.hex --force',
        },
        priority: 9,
        recommended: true,
      },

      // Testing framework
      exunit: {
        command: 'mix test --help',
        description: "Elixir's built-in test framework",
        installGuide: {
          macos: 'Part of Elixir installation',
          linux: 'Part of Elixir installation',
          windows: 'Part of Elixir installation',
        },
        priority: 8,
      },

      // Code formatter
      formatter: {
        command: 'mix format --check-formatted .',
        description: 'Elixir code formatter (built-in)',
        installGuide: {
          macos: 'Part of Elixir installation',
          linux: 'Part of Elixir installation',
          windows: 'Part of Elixir installation',
        },
        priority: 8,
      },

      // Static code analysis
      credo: {
        command: 'mix credo --version',
        description: 'Static code analysis tool for Elixir',
        installGuide: {
          macos: 'mix archive.install hex credo --force',
          linux: 'mix archive.install hex credo --force',
          windows: 'mix archive.install hex credo --force',
        },
        priority: 8,
        recommended: true,
      },

      // Dialyzer for type checking
      dialyzer: {
        command: 'mix dialyzer --version',
        description:
          'Static analysis tool that identifies software discrepancies',
        installGuide: {
          macos:
            'Add {:dialyxir, "~> 1.4", only: [:dev], runtime: false} to mix.exs',
          linux:
            'Add {:dialyxir, "~> 1.4", only: [:dev], runtime: false} to mix.exs',
          windows:
            'Add {:dialyxir, "~> 1.4", only: [:dev], runtime: false} to mix.exs',
        },
        priority: 7,
      },

      // Phoenix framework (for web projects)
      phoenix: {
        command: 'mix phx.new --version',
        description: 'Productive web framework for Elixir',
        installGuide: {
          macos: 'mix archive.install hex phx_new --force',
          linux: 'mix archive.install hex phx_new --force',
          windows: 'mix archive.install hex phx_new --force',
        },
        priority: 6,
      },

      // Ecto database wrapper
      ecto: {
        command: 'mix ecto --version',
        description: 'Database wrapper and query generator for Elixir',
        installGuide: {
          macos: 'Add {:ecto_sql, "~> 3.0"} to mix.exs',
          linux: 'Add {:ecto_sql, "~> 3.0"} to mix.exs',
          windows: 'Add {:ecto_sql, "~> 3.0"} to mix.exs',
        },
        priority: 6,
      },

      // Livebook for interactive notebooks
      livebook: {
        command: 'livebook --version',
        description: 'Interactive and collaborative code notebooks for Elixir',
        installGuide: {
          macos: 'mix escript.install hex livebook',
          linux: 'mix escript.install hex livebook',
          windows: 'mix escript.install hex livebook',
        },
        priority: 5,
      },

      // IEx enhanced console
      iex: {
        command: 'iex --version',
        description: 'Interactive Elixir shell (built-in)',
        installGuide: {
          macos: 'Part of Elixir installation',
          linux: 'Part of Elixir installation',
          windows: 'Part of Elixir installation',
        },
        priority: 5,
      },
    };
  }

  /**
   * Detect all Elixir tools with Elixir-specific improvements
   */
  async detectTools() {
    const results = {};
    const toolNames = Object.keys(this.tools);

    for (const toolName of toolNames) {
      const tool = this.tools[toolName];
      try {
        const result = runCommand(tool.command, {
          cwd: process.cwd(),
          timeout: 10000,
        });

        results[toolName] = {
          installed: result.success,
          version: this.extractVersion(result.output, '', toolName),
          description: tool.description,
          priority: tool.priority,
          recommended: tool.recommended || false,
          minVersion: tool.minVersion,
          recommendedVersion: tool.recommendedVersion,
        };
      } catch (error) {
        results[toolName] = {
          installed: false,
          version: null,
          description: tool.description,
          priority: tool.priority,
          recommended: tool.recommended || false,
          minVersion: tool.minVersion,
          recommendedVersion: tool.recommendedVersion,
        };
      }
    }

    return results;
  }

  /**
   * Extract version from command output with Elixir-specific parsing
   */
  extractVersion(stdout, stderr, toolName) {
    const output = stdout || stderr || '';

    // Elixir version pattern: "Elixir 1.19.5 (compiled with Erlang/OTP 28)"
    if (toolName === 'elixir') {
      const match = output.match(/Elixir\s+([\d.]+)/);
      return match ? match[1] : null;
    }

    // Mix version pattern: "Mix 1.19.5"
    if (toolName === 'mix') {
      const match = output.match(/Mix\s+([\d.]+)/);
      return match ? match[1] : null;
    }

    // Hex version pattern: "Hex:    2.2.2" (from mix hex.info)
    if (toolName === 'hex') {
      const match = output.match(/Hex:\s+([\d.]+)/);
      return match ? match[1] : null;
    }

    // Credo version pattern: "1.7.0"
    if (toolName === 'credo') {
      const match = output.match(/(\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    }

    // Phoenix version pattern: "Phoenix installer v1.7.10"
    if (toolName === 'phoenix') {
      const match = output.match(/v(\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    }

    // Generic version pattern - search across all lines
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/(\d+\.\d+(\.\d+)?)/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Generate environment report with Elixir-specific insights
   */
  generateEnvironmentReport(detectedTools) {
    const report = {
      summary: {
        elixirInstalled: detectedTools.elixir?.installed || false,
        mixInstalled: detectedTools.mix?.installed || false,
        hexInstalled: detectedTools.hex?.installed || false,
        toolsDetected: Object.values(detectedTools).filter((t) => t.installed)
          .length,
        recommendedTools: Object.values(detectedTools).filter(
          (t) => t.recommended && t.installed,
        ).length,
        totalTools: Object.keys(detectedTools).length,
      },
      tools: detectedTools,
      recommendations: [],
    };

    // Generate recommendations
    if (!detectedTools.elixir?.installed) {
      report.recommendations.push({
        type: 'critical',
        message: 'Elixir is not installed',
        tool: 'elixir',
        installGuide: this.tools.elixir.installGuide,
      });
    }

    if (detectedTools.elixir?.installed && !detectedTools.hex?.installed) {
      report.recommendations.push({
        type: 'high',
        message: 'Hex package manager is recommended for Elixir development',
        tool: 'hex',
        installGuide: this.tools.hex.installGuide,
      });
    }

    if (detectedTools.elixir?.installed && !detectedTools.credo?.installed) {
      report.recommendations.push({
        type: 'medium',
        message: 'Credo is recommended for code quality analysis',
        tool: 'credo',
        installGuide: this.tools.credo.installGuide,
      });
    }

    // Check version compatibility
    if (detectedTools.elixir?.installed && detectedTools.elixir.version) {
      const currentVersion = detectedTools.elixir.version;
      const minVersion = this.tools.elixir.minVersion;
      const recommendedVersion = this.tools.elixir.recommendedVersion;

      if (this.compareVersions(currentVersion, minVersion) < 0) {
        report.recommendations.push({
          type: 'high',
          message: `Elixir version ${currentVersion} is below minimum recommended ${minVersion}`,
          tool: 'elixir',
          action: 'Upgrade Elixir',
        });
      }

      if (this.compareVersions(currentVersion, recommendedVersion) < 0) {
        report.recommendations.push({
          type: 'medium',
          message: `Consider upgrading to Elixir ${recommendedVersion} for latest features`,
          tool: 'elixir',
          action: 'Upgrade to recommended version',
        });
      }
    }

    return report;
  }

  /**
   * Compare version strings for Elixir-specific version checking
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      if (part1 !== part2) {
        return part1 - part2;
      }
    }
    return 0;
  }

  /**
   * Get installation guide for a specific tool and platform
   */
  getInstallationGuide(toolName, platform = process.platform) {
    const tool = this.tools[toolName];
    if (!tool) {
      return null;
    }

    let osKey = 'linux';
    if (platform === 'darwin') osKey = 'macos';
    if (platform === 'win32') osKey = 'windows';

    return tool.installGuide[osKey] || tool.installGuide.linux;
  }

  /**
   * Check if a specific tool is available
   */
  async checkTool(toolName) {
    const tool = this.tools[toolName];
    if (!tool) {
      return { installed: false, version: null };
    }

    try {
      const result = runCommand(tool.command, {
        cwd: process.cwd(),
        timeout: 5000,
      });

      return {
        installed: result.success,
        version: this.extractVersion(result.output, '', toolName),
      };
    } catch (error) {
      return { installed: false, version: null };
    }
  }
}

module.exports = ElixirToolDetector;
