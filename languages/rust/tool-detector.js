/**
 * Rust Tool Detector
 *
 * Detect Rust tools, versions, and project configuration
 */

const fs = require('fs');
const path = require('path');
// const { commandExists, runCommand } = require('../../scripts/lib/utils');
const { runCommand } = require('../../scripts/lib/utils');

class RustToolDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect all Rust tools and versions
   */
  async detectTools() {
    const tools = {
      rustc: await this.detectRustc(),
      cargo: await this.detectCargo(),
      rustup: await this.detectRustup(),
      project: await this.detectProject(),
      frameworks: await this.detectFrameworks(),
      buildTools: await this.detectBuildTools(),
      linters: await this.detectLinters(),
      formatters: await this.detectFormatters(),
      testFrameworks: await this.detectTestFrameworks(),
    };

    return tools;
  }

  /**
   * Detect rustc compiler
   */
  async detectRustc() {
    try {
      const result = await runCommand('rustc', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/rustc (\d+\.\d+\.\d+)/);
        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('rustc'),
        };
      }
    } catch (error) {
      // rustc not found
    }

    return { installed: false };
  }

  /**
   * Detect Cargo package manager
   */
  async detectCargo() {
    try {
      const result = await runCommand('cargo', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/cargo (\d+\.\d+\.\d+)/);
        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('cargo'),
        };
      }
    } catch (error) {
      // cargo not found
    }

    return { installed: false };
  }

  /**
   * Detect rustup toolchain manager
   */
  async detectRustup() {
    try {
      const result = await runCommand('rustup', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/rustup (\d+\.\d+\.\d+)/);
        const toolchains = await this.getRustupToolchains();
        const defaultToolchain = await this.getDefaultToolchain();

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('rustup'),
          toolchains,
          defaultToolchain,
        };
      }
    } catch (error) {
      // rustup not found
    }

    return { installed: false };
  }

  /**
   * Detect Rust project configuration
   */
  async detectProject() {
    const projectInfo = {
      hasCargoToml: false,
      hasCargoLock: false,
      isWorkspace: false,
      isBinary: false,
      isLibrary: false,
      edition: null,
      name: null,
      version: null,
      dependencies: 0,
      devDependencies: 0,
      buildDependencies: 0,
    };

    // Check for Cargo.toml
    const cargoTomlPath = path.join(this.projectPath, 'Cargo.toml');
    if (fs.existsSync(cargoTomlPath)) {
      projectInfo.hasCargoToml = true;

      try {
        const content = fs.readFileSync(cargoTomlPath, 'utf8');
        const lines = content.split('\n');

        // Parse basic info
        for (const line of lines) {
          const trimmed = line.trim();

          // Project name
          if (trimmed.startsWith('name =')) {
            const match = trimmed.match(/name\s*=\s*"([^"]+)"/);
            if (match) projectInfo.name = match[1];
          }

          // Project version
          if (trimmed.startsWith('version =')) {
            const match = trimmed.match(/version\s*=\s*"([^"]+)"/);
            if (match) projectInfo.version = match[1];
          }

          // Edition
          if (trimmed.startsWith('edition =')) {
            const match = trimmed.match(/edition\s*=\s*"([^"]+)"/);
            if (match) projectInfo.edition = match[1];
          }

          // Package type
          if (trimmed.includes('[lib]')) {
            projectInfo.isLibrary = true;
          }
          if (trimmed.includes('[[bin]]')) {
            projectInfo.isBinary = true;
          }
          if (trimmed.includes('[workspace]')) {
            projectInfo.isWorkspace = true;
          }

          // Count dependencies
          if (trimmed.startsWith('[dependencies]')) {
            projectInfo.dependencies = this.countDependencies(lines, lines.indexOf(line));
          }
          if (trimmed.startsWith('[dev-dependencies]')) {
            projectInfo.devDependencies = this.countDependencies(lines, lines.indexOf(line));
          }
          if (trimmed.startsWith('[build-dependencies]')) {
            projectInfo.buildDependencies = this.countDependencies(lines, lines.indexOf(line));
          }
        }
      } catch (error) {
        // Failed to parse Cargo.toml
      }
    }

    // Check for Cargo.lock
    const cargoLockPath = path.join(this.projectPath, 'Cargo.lock');
    projectInfo.hasCargoLock = fs.existsSync(cargoLockPath);

    return projectInfo;
  }

  /**
   * Count dependencies in a section
   */
  countDependencies(lines, startIndex) {
    let count = 0;
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '' || line.startsWith('[')) {
        break; // Next section or empty line
      }
      if (line.includes('=') && !line.startsWith('#')) {
        count++;
      }
    }
    return count;
  }

  /**
   * Detect Rust frameworks
   */
  async detectFrameworks() {
    const frameworks = [];
    const cargoTomlPath = path.join(this.projectPath, 'Cargo.toml');

    if (!fs.existsSync(cargoTomlPath)) {
      return frameworks;
    }

    try {
      const content = fs.readFileSync(cargoTomlPath, 'utf8');

      // Check for web frameworks
      if (content.includes('actix-web') || content.includes('actix_web')) {
        frameworks.push('actix-web');
      }
      if (content.includes('rocket') || content.includes('rocket_codegen')) {
        frameworks.push('rocket');
      }
      if (content.includes('warp')) {
        frameworks.push('warp');
      }
      if (content.includes('axum')) {
        frameworks.push('axum');
      }

      // Check for GUI frameworks
      if (content.includes('gtk') || content.includes('gtk-rs')) {
        frameworks.push('gtk');
      }
      if (content.includes('slint')) {
        frameworks.push('slint');
      }
      if (content.includes('iced')) {
        frameworks.push('iced');
      }
      if (content.includes('druid')) {
        frameworks.push('druid');
      }

      // Check for async runtimes
      if (content.includes('tokio')) {
        frameworks.push('tokio');
      }
      if (content.includes('async-std')) {
        frameworks.push('async-std');
      }

      // Check for game engines
      if (content.includes('bevy')) {
        frameworks.push('bevy');
      }
      if (content.includes('ggez')) {
        frameworks.push('ggez');
      }
      if (content.includes('macroquad')) {
        frameworks.push('macroquad');
      }

      // Check for CLI frameworks
      if (content.includes('clap')) {
        frameworks.push('clap');
      }
      if (content.includes('structopt')) {
        frameworks.push('structopt');
      }
    } catch (error) {
      // Failed to read Cargo.toml
    }

    return frameworks;
  }

  /**
   * Detect build tools
   */
  async detectBuildTools() {
    const tools = [];

    // Check for common build tools
    const buildScriptPath = path.join(this.projectPath, 'build.rs');
    if (fs.existsSync(buildScriptPath)) {
      tools.push('build.rs');
    }

    // Check for cargo-make
    const cargoMakePath = path.join(this.projectPath, 'Makefile.toml');
    if (fs.existsSync(cargoMakePath)) {
      tools.push('cargo-make');
    }

    // Check for just
    const justfilePath = path.join(this.projectPath, 'justfile');
    if (fs.existsSync(justfilePath)) {
      tools.push('just');
    }

    // Check for cross-compilation
    const crossPath = path.join(this.projectPath, '.cargo', 'config.toml');
    if (fs.existsSync(crossPath)) {
      tools.push('cross-compilation');
    }

    return tools;
  }

  /**
   * Detect linters
   */
  async detectLinters() {
    const linters = [];

    // Check for clippy
    try {
      const result = await runCommand('cargo', ['clippy', '--version']);
      if (result.success) {
        linters.push('clippy');
      }
    } catch (error) {
      // clippy not available
    }

    // Check for cargo-audit
    try {
      const result = await runCommand('cargo', ['audit', '--version']);
      if (result.success) {
        linters.push('cargo-audit');
      }
    } catch (error) {
      // cargo-audit not available
    }

    // Check for cargo-deny
    try {
      const result = await runCommand('cargo', ['deny', '--version']);
      if (result.success) {
        linters.push('cargo-deny');
      }
    } catch (error) {
      // cargo-deny not available
    }

    return linters;
  }

  /**
   * Detect formatters
   */
  async detectFormatters() {
    const formatters = [];

    // Check for rustfmt
    try {
      const result = await runCommand('rustfmt', ['--version']);
      if (result.success) {
        formatters.push('rustfmt');
      }
    } catch (error) {
      // rustfmt not available
    }

    // Check for cargo-fmt
    try {
      const result = await runCommand('cargo', ['fmt', '--version']);
      if (result.success) {
        formatters.push('cargo-fmt');
      }
    } catch (error) {
      // cargo-fmt not available
    }

    return formatters;
  }

  /**
   * Detect test frameworks
   */
  async detectTestFrameworks() {
    const frameworks = ['cargo-test']; // Built-in

    // Check for additional test frameworks
    const cargoTomlPath = path.join(this.projectPath, 'Cargo.toml');
    if (fs.existsSync(cargoTomlPath)) {
      try {
        const content = fs.readFileSync(cargoTomlPath, 'utf8');

        if (content.includes('proptest')) {
          frameworks.push('proptest');
        }
        if (content.includes('quickcheck')) {
          frameworks.push('quickcheck');
        }
        if (content.includes('mockall')) {
          frameworks.push('mockall');
        }
        if (content.includes('criterion')) {
          frameworks.push('criterion');
        }
        if (content.includes('benchmark')) {
          frameworks.push('benchmark');
        }
      } catch (error) {
        // Failed to read Cargo.toml
      }
    }

    return frameworks;
  }

  /**
   * Get rustup toolchains
   */
  async getRustupToolchains() {
    try {
      const result = await runCommand('rustup', ['toolchain', 'list']);
      if (result.success) {
        return result.stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      }
    } catch (error) {
      // Failed to get toolchains
    }

    return [];
  }

  /**
   * Get default toolchain
   */
  async getDefaultToolchain() {
    try {
      const result = await runCommand('rustup', ['show', 'active-toolchain']);
      if (result.success) {
        return result.stdout.trim();
      }
    } catch (error) {
      // Failed to get default toolchain
    }

    return null;
  }

  /**
   * Get command path
   */
  async getCommandPath(command) {
    try {
      const result = await runCommand('which', [command]);
      if (result.success) {
        return result.stdout.trim();
      }
    } catch (error) {
      // Command not found
    }

    return null;
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(tools) {
    const report = [];

    report.push('Rust Environment Report');
    report.push('='.repeat(40));

    // Compiler info
    if (tools.rustc.installed) {
      report.push(`rustc: v${tools.rustc.version}`);
    } else {
      report.push('rustc: Not installed');
    }

    // Cargo info
    if (tools.cargo.installed) {
      report.push(`cargo: v${tools.cargo.version}`);
    } else {
      report.push('cargo: Not installed');
    }

    // Rustup info
    if (tools.rustup.installed) {
      report.push(`rustup: v${tools.rustup.version}`);
      if (tools.rustup.defaultToolchain) {
        report.push(`Default toolchain: ${tools.rustup.defaultToolchain}`);
      }
      if (tools.rustup.toolchains.length > 0) {
        report.push(`Toolchains: ${tools.rustup.toolchains.join(', ')}`);
      }
    }

    // Project info
    if (tools.project.hasCargoToml) {
      report.push('\nProject Information:');
      report.push(`Name: ${tools.project.name || 'Unknown'}`);
      report.push(`Version: ${tools.project.version || 'Unknown'}`);
      report.push(`Edition: ${tools.project.edition || '2018'}`);
      report.push(`Type: ${this.getProjectType(tools.project)}`);
      report.push(`Dependencies: ${tools.project.dependencies}`);
      report.push(`Dev Dependencies: ${tools.project.devDependencies}`);
      report.push(`Build Dependencies: ${tools.project.buildDependencies}`);
    }

    // Frameworks
    if (tools.frameworks.length > 0) {
      report.push(`\nFrameworks: ${tools.frameworks.join(', ')}`);
    }

    // Build tools
    if (tools.buildTools.length > 0) {
      report.push(`Build Tools: ${tools.buildTools.join(', ')}`);
    }

    // Linters
    if (tools.linters.length > 0) {
      report.push(`Linters: ${tools.linters.join(', ')}`);
    }

    // Formatters
    if (tools.formatters.length > 0) {
      report.push(`Formatters: ${tools.formatters.join(', ')}`);
    }

    // Test frameworks
    if (tools.testFrameworks.length > 0) {
      report.push(`Test Frameworks: ${tools.testFrameworks.join(', ')}`);
    }

    return report.join('\n');
  }

  /**
   * Get project type description
   */
  getProjectType(project) {
    const types = [];
    if (project.isBinary) types.push('Binary');
    if (project.isLibrary) types.push('Library');
    if (project.isWorkspace) types.push('Workspace');
    return types.length > 0 ? types.join(' + ') : 'Unknown';
  }

  /**
   * Get installation commands for missing tools
   */
  getInstallationCommands(tools) {
    const commands = [];

    if (!tools.rustc.installed || !tools.cargo.installed) {
      commands.push({
        tool: 'Rust',
        description: 'Rust compiler and package manager',
        command: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      });
    }

    if (!tools.rustup.installed && (tools.rustc.installed || tools.cargo.installed)) {
      commands.push({
        tool: 'rustup',
        description: 'Rust toolchain manager',
        command: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      });
    }

    if (tools.linters.length === 0) {
      commands.push({
        tool: 'clippy',
        description: 'Rust linter',
        command: 'rustup component add clippy',
      });
    }

    if (tools.formatters.length === 0) {
      commands.push({
        tool: 'rustfmt',
        description: 'Rust code formatter',
        command: 'rustup component add rustfmt',
      });
    }

    return commands;
  }
}

module.exports = RustToolDetector;
