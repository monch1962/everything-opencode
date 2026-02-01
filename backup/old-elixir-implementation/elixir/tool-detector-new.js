/**
 * Elixir Tool Detector
 *
 * Detect Elixir development tools with cross-platform support
 * Following JavaScript/TypeScript pattern exactly
 */

const { commandExists, runCommand } = require('../../scripts/lib/utils');
const PlatformDetector = require('../../scripts/lib/platform-detector');

class ElixirToolDetector {
  constructor() {
    this.platformDetector = new PlatformDetector();
    this.tools = [
      'elixir', // Elixir runtime (required)
      'mix', // Elixir build tool and dependency manager
      'iex', // Interactive Elixir shell
      'elixirc', // Elixir compiler
      'erl', // Erlang runtime (required for Elixir)
      'erlc', // Erlang compiler
      'rebar3', // Erlang build tool
      'hex', // Package manager for the Erlang ecosystem
      'exunit', // Elixir's built-in test framework
      'credo', // Static code analysis tool for Elixir
      'dialyzer', // Static analysis tool for type checking
      'sobelow', // Security-focused static analysis for Phoenix
      'mix_audit', // Security audit for Mix dependencies
      'ex_doc', // Documentation generation for Elixir projects
      'excoveralls', // Coverage reporting for Elixir
      'hound', // Browser automation and testing
      'wallaby', // Concurrent browser testing
      'phoenix', // Web framework for Elixir
      'ecto', // Database wrapper and query builder
      'absinthe', // GraphQL implementation for Elixir
      'broadway', // Concurrent data processing pipelines
      'livebook', // Interactive code notebooks
      'nx', // Numerical computing library
      'axon', // Neural network library
      'oban', // Robust job processing
      'ash', // Resource-oriented framework
      'surface', // Server-side rendering component library
      'slime', // Template engine
      'swoosh', // Composable email library
      'bamboo', // Testable email library
      'tesla', // HTTP client library
      'finch', // HTTP client with connection pooling
      'mint', // Low-level HTTP client
      'bandit', // Pure-Elixir HTTP server
      'cowboy', // Small, fast, modern HTTP server
      'plug', // Specification for composable modules
      'corsica', // CORS plug for Elixir
      'guardian', // Authentication library
      'comeonin', // Password hashing library
      'bcrypt_elixir', // bcrypt password hashing
      'argon2_elixir', // Argon2 password hashing
    ];
  }

  /**
   * Detect all Elixir tools
   */
  async detectTools() {
    const detectedTools = {};

    // Detect each tool
    for (const tool of this.tools) {
      detectedTools[tool] = await this.detectTool(tool);
    }

    // Detect Elixir version and environment
    const elixirInfo = await this.detectElixirInfo();
    if (elixirInfo) {
      detectedTools.elixirInfo = elixirInfo;
    }

    // Detect Erlang/OTP version
    const erlangInfo = await this.detectErlangInfo();
    if (erlangInfo) {
      detectedTools.erlangInfo = erlangInfo;
    }

    // Detect Mix project
    const mixProject = await this.detectMixProject();
    if (mixProject) {
      detectedTools.mixProject = mixProject;
    }

    // Detect Elixir frameworks
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
      details: {},
    };

    try {
      // Special handling for Elixir
      if (toolName === 'elixir') {
        return await this.detectElixir();
      }

      // Special handling for Erlang
      if (toolName === 'erl') {
        return await this.detectErlang();
      }

      // Special handling for Mix
      if (toolName === 'mix') {
        return await this.detectMix();
      }

      // Special handling for Hex
      if (toolName === 'hex') {
        return await this.detectHex();
      }

      // Check if tool exists in PATH
      const exists = commandExists(toolName);
      if (!exists) {
        // For Elixir-specific tools, check if they're available via Mix
        if (this.isElixirTool(toolName)) {
          return await this.detectElixirToolViaMix(toolName);
        }
        return toolInfo;
      }

      // Get version if possible
      const version = await this.getToolVersion(toolName);
      if (version) {
        toolInfo.installed = true;
        toolInfo.version = version;
        toolInfo.path = await this.getToolPath(toolName);
      }

      // Add tool-specific details
      toolInfo.details = await this.getToolDetails(toolName);
    } catch (error) {
      console.error(`Error detecting tool ${toolName}:`, error.message);
    }

    return toolInfo;
  }

  /**
   * Detect Elixir installation
   */
  async detectElixir() {
    const toolInfo = {
      installed: false,
      version: null,
      path: null,
      details: {},
    };

    try {
      const exists = commandExists('elixir');
      if (!exists) {
        return toolInfo;
      }

      // Get Elixir version
      const result = await runCommand('elixir --version');
      if (result.success && result.stdout) {
        const versionMatch = result.stdout.match(/Elixir (\d+\.\d+\.\d+)/);
        if (versionMatch) {
          toolInfo.installed = true;
          toolInfo.version = versionMatch[1];
          toolInfo.path = await this.getToolPath('elixir');

          // Parse additional details from version output
          const lines = result.stdout.split('\n');
          toolInfo.details = {
            elixirVersion: versionMatch[1],
            otpVersion:
              lines
                .find((l) => l.includes('OTP'))
                ?.split(' ')
                .pop() || null,
            compiledWith: lines.find((l) => l.includes('compiled with'))?.split(': ')[1] || null,
          };
        }
      }
    } catch (error) {
      console.error('Error detecting Elixir:', error.message);
    }

    return toolInfo;
  }

  /**
   * Detect Erlang installation
   */
  async detectErlang() {
    const toolInfo = {
      installed: false,
      version: null,
      path: null,
      details: {},
    };

    try {
      const exists = commandExists('erl');
      if (!exists) {
        return toolInfo;
      }

      // Get Erlang version
      const result = await runCommand(
        "erl -eval 'erlang:display(erlang:system_info(otp_release)), halt().' -noshell"
      );
      if (result.success && result.stdout) {
        const version = result.stdout.trim().replace(/"/g, '');
        toolInfo.installed = true;
        toolInfo.version = version;
        toolInfo.path = await this.getToolPath('erl');

        // Get more detailed Erlang info
        const detailsResult = await runCommand('erl -version 2>&1');
        if (detailsResult.success && detailsResult.stdout) {
          toolInfo.details = {
            erlangVersion: version,
            fullVersion: detailsResult.stdout.trim(),
          };
        }
      }
    } catch (error) {
      console.error('Error detecting Erlang:', error.message);
    }

    return toolInfo;
  }

  /**
   * Detect Mix installation
   */
  async detectMix() {
    const toolInfo = {
      installed: false,
      version: null,
      path: null,
      details: {},
    };

    try {
      const exists = commandExists('mix');
      if (!exists) {
        return toolInfo;
      }

      // Get Mix version (part of Elixir)
      const elixirResult = await runCommand('elixir --version');
      if (elixirResult.success && elixirResult.stdout) {
        const versionMatch = elixirResult.stdout.match(/Elixir (\d+\.\d+\.\d+)/);
        if (versionMatch) {
          toolInfo.installed = true;
          toolInfo.version = versionMatch[1];
          toolInfo.path = await this.getToolPath('mix');
          toolInfo.details = {
            isMix: true,
            elixirVersion: versionMatch[1],
          };
        }
      }
    } catch (error) {
      console.error('Error detecting Mix:', error.message);
    }

    return toolInfo;
  }

  /**
   * Detect Hex package manager
   */
  async detectHex() {
    const toolInfo = {
      installed: false,
      version: null,
      path: null,
      details: {},
    };

    try {
      // Check if Hex is installed via Mix
      const result = await runCommand('mix hex.info 2>&1');
      if (result.success && result.stdout && !result.stdout.includes('not found')) {
        toolInfo.installed = true;

        // Try to get Hex version
        const versionResult = await runCommand('mix hex --version 2>&1');
        if (versionResult.success && versionResult.stdout) {
          const versionMatch = versionResult.stdout.match(/Hex:\s+(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            toolInfo.version = versionMatch[1];
          }
        }

        toolInfo.details = {
          isHex: true,
          registry: 'https://hex.pm',
        };
      }
    } catch (error) {
      console.error('Error detecting Hex:', error.message);
    }

    return toolInfo;
  }

  /**
   * Detect Elixir tool via Mix (for tools installed as Mix archives)
   */
  async detectElixirToolViaMix(toolName) {
    const toolInfo = {
      installed: false,
      version: null,
      path: null,
      details: {},
    };

    try {
      // Map tool names to Mix archive names
      const toolMap = {
        credo: 'credo',
        sobelow: 'sobelow',
        ex_doc: 'ex_doc',
        mix_audit: 'mix_audit',
      };

      const mixToolName = toolMap[toolName];
      if (!mixToolName) {
        return toolInfo;
      }

      // Check if tool is available via Mix
      const result = await runCommand(`mix ${mixToolName} --help 2>&1`);
      if (result.success && result.stdout && !result.stdout.includes('not found')) {
        toolInfo.installed = true;
        toolInfo.details = {
          installedViaMix: true,
          mixToolName: mixToolName,
        };

        // Try to get version
        const versionResult = await runCommand(`mix ${mixToolName} --version 2>&1`);
        if (versionResult.success && versionResult.stdout) {
          const versionMatch = versionResult.stdout.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            toolInfo.version = versionMatch[1];
          }
        }
      }
    } catch (error) {
      console.error(`Error detecting Elixir tool ${toolName} via Mix:`, error.message);
    }

    return toolInfo;
  }

  /**
   * Check if a tool is an Elixir-specific tool
   */
  isElixirTool(toolName) {
    const elixirTools = [
      'credo',
      'dialyzer',
      'sobelow',
      'ex_doc',
      'excoveralls',
      'hound',
      'wallaby',
      'mix_audit',
    ];
    return elixirTools.includes(toolName);
  }

  /**
   * Get tool version
   */
  async getToolVersion(toolName) {
    try {
      // Different tools have different version commands
      const versionCommands = {
        rebar3: 'rebar3 version',
        exunit: 'mix test --version 2>&1',
        phoenix: 'mix phx.new --version 2>&1',
        ecto: 'mix ecto --version 2>&1',
      };

      const command = versionCommands[toolName] || `${toolName} --version`;
      const result = await runCommand(command);

      if (result.success && result.stdout) {
        // Extract version number from output
        const versionMatch = result.stdout.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          return versionMatch[1];
        }
      }
    } catch (error) {
      // Version detection failed
    }
    return null;
  }

  /**
   * Get tool path
   */
  async getToolPath(toolName) {
    try {
      const platform = this.platformDetector.detectPlatform();

      if (platform.os === 'windows') {
        const result = await runCommand(`where ${toolName}`);
        if (result.success && result.stdout) {
          return result.stdout.trim().split('\n')[0];
        }
      } else {
        const result = await runCommand(`which ${toolName}`);
        if (result.success && result.stdout) {
          return result.stdout.trim();
        }
      }
    } catch (error) {
      // Path detection failed
    }
    return null;
  }

  /**
   * Get tool-specific details
   */
  async getToolDetails(toolName) {
    const details = {};

    // Add tool-specific details based on tool name
    switch (toolName) {
      case 'phoenix':
        details.frameworkType = 'web';
        details.description = 'Productive web framework';
        break;
      case 'ecto':
        details.frameworkType = 'database';
        details.description = 'Database wrapper and query builder';
        break;
      case 'absinthe':
        details.frameworkType = 'graphql';
        details.description = 'GraphQL implementation';
        break;
      case 'credo':
        details.toolType = 'linter';
        details.description = 'Static code analysis';
        break;
      case 'dialyzer':
        details.toolType = 'type_checker';
        details.description = 'Success typing analysis';
        break;
      case 'sobelow':
        details.toolType = 'security';
        details.description = 'Security-focused static analysis';
        break;
    }

    return details;
  }

  /**
   * Detect Elixir version and environment info
   */
  async detectElixirInfo() {
    try {
      const result = await runCommand('elixir --version');
      if (result.success && result.stdout) {
        const lines = result.stdout.split('\n');
        const info = {
          elixirVersion: lines.find((l) => l.includes('Elixir'))?.split(' ')[1] || null,
          erlangVersion:
            lines
              .find((l) => l.includes('OTP'))
              ?.split(' ')
              .pop() || null,
          compiledWith: lines.find((l) => l.includes('compiled with'))?.split(': ')[1] || null,
        };
        return info;
      }
    } catch (error) {
      console.error('Error detecting Elixir info:', error.message);
    }
    return null;
  }

  /**
   * Detect Erlang/OTP version
   */
  async detectErlangInfo() {
    try {
      const result = await runCommand(
        'erl -eval \'io:format("~s~n", [erlang:system_info(otp_release)]), halt().\' -noshell'
      );
      if (result.success && result.stdout) {
        const version = result.stdout.trim();
        return {
          otpVersion: version,
          isErlangInstalled: true,
        };
      }
    } catch (error) {
      console.error('Error detecting Erlang info:', error.message);
    }
    return null;
  }

  /**
   * Detect Mix project information
   */
  async detectMixProject() {
    try {
      // Check if we're in a Mix project directory
      const result = await runCommand('mix run -e "IO.puts Mix.Project.get() != nil" 2>&1');
      if (result.success && result.stdout && result.stdout.trim() === 'true') {
        // Get project name and version
        const projectResult = await runCommand(
          'mix run -e "project = Mix.Project.get(); IO.puts project.project[:app]" 2>&1'
        );
        const versionResult = await runCommand(
          'mix run -e "project = Mix.Project.get(); IO.puts project.project[:version]" 2>&1'
        );

        return {
          isMixProject: true,
          projectName: projectResult.success ? projectResult.stdout.trim() : null,
          projectVersion: versionResult.success ? versionResult.stdout.trim() : null,
        };
      }
    } catch (error) {
      // Not a Mix project or error
    }
    return null;
  }

  /**
   * Detect Elixir frameworks
   */
  async detectFrameworks() {
    const frameworks = [];

    try {
      // Check for Phoenix
      const phoenixResult = await runCommand('mix phx.new --version 2>&1');
      if (phoenixResult.success && !phoenixResult.stdout.includes('not found')) {
        frameworks.push({
          name: 'phoenix',
          type: 'web',
          installed: true,
        });
      }

      // Check for Nerves (embedded)
      const nervesResult = await runCommand('mix nerves.new --version 2>&1');
      if (nervesResult.success && !nervesResult.stdout.includes('not found')) {
        frameworks.push({
          name: 'nerves',
          type: 'embedded',
          installed: true,
        });
      }

      // Check for Ash
      const ashResult = await runCommand('mix ash.new --version 2>&1');
      if (ashResult.success && !ashResult.stdout.includes('not found')) {
        frameworks.push({
          name: 'ash',
          type: 'resource',
          installed: true,
        });
      }

      // Check for Surface
      const surfaceResult = await runCommand('mix surface.new --version 2>&1');
      if (surfaceResult.success && !surfaceResult.stdout.includes('not found')) {
        frameworks.push({
          name: 'surface',
          type: 'ui',
          installed: true,
        });
      }
    } catch (error) {
      console.error('Error detecting frameworks:', error.message);
    }

    return frameworks;
  }

  /**
   * Detect build tools
   */
  async detectBuildTools() {
    const buildTools = [];

    try {
      // Check for Rebar3
      const rebarResult = await runCommand('rebar3 version 2>&1');
      if (rebarResult.success && !rebarResult.stdout.includes('not found')) {
        buildTools.push({
          name: 'rebar3',
          type: 'build',
          installed: true,
        });
      }

      // Check for Make
      const makeResult = await runCommand('make --version 2>&1');
      if (makeResult.success) {
        buildTools.push({
          name: 'make',
          type: 'build',
          installed: true,
        });
      }

      // Check for Docker (commonly used with Elixir)
      const dockerResult = await runCommand('docker --version 2>&1');
      if (dockerResult.success) {
        buildTools.push({
          name: 'docker',
          type: 'container',
          installed: true,
        });
      }
    } catch (error) {
      console.error('Error detecting build tools:', error.message);
    }

    return buildTools;
  }

  /**
   * Generate installation guide for missing tools
   */
  generateInstallationGuide(toolName, platform = null) {
    const guides = {
      elixir: {
        macos: 'brew install elixir',
        linux: 'sudo apt-get install elixir',
        windows: 'Download from https://elixir-lang.org/install.html#windows',
        docker: 'docker run --rm -it elixir:latest',
      },
      hex: {
        macos: 'mix local.hex --force',
        linux: 'mix local.hex --force',
        windows: 'mix local.hex --force',
        all: 'Run: mix local.hex --force',
      },
      credo: {
        all: 'mix archive.install hex credo --force',
      },
      sobelow: {
        all: 'mix archive.install hex sobelow --force',
      },
      ex_doc: {
        all: 'mix archive.install hex ex_doc --force',
      },
      mix_audit: {
        all: 'mix archive.install hex mix_audit --force',
      },
    };

    const toolGuide = guides[toolName];
    if (!toolGuide) {
      return `Installation guide not available for ${toolName}`;
    }

    if (!platform) {
      platform = this.platformDetector.detectPlatform().os;
    }

    return (
      toolGuide[platform] || toolGuide.all || toolGuide.macos || `See documentation for ${toolName}`
    );
  }
}

module.exports = ElixirToolDetector;
