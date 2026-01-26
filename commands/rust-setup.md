# Rust Setup Command (`/rust-setup`)

Interactive setup for Rust projects. Detects Rust tools, configurations, and provides recommendations.

## Overview

The Rust setup command helps you configure your Rust project by:

1. Detecting installed Rust tools (rustc, cargo, rustup)
2. Analyzing your project structure and dependencies
3. Providing tool recommendations
4. Saving configuration for future use

## Usage

```bash
/rust-setup
```

## What It Does

### 1. Tool Detection

- **rustc**: Rust compiler version and installation status
- **cargo**: Rust package manager and build system
- **rustup**: Rust toolchain manager (if installed)
- **clippy**: Rust linter (if installed)
- **rustfmt**: Rust code formatter (if installed)

### 2. Project Analysis

- **Project type**: Binary, library, or workspace
- **Rust edition**: 2015, 2018, or 2021
- **Dependencies**: Count of regular, dev, and build dependencies
- **Frameworks**: Detected web, GUI, async, or game frameworks

### 3. Configuration

Saves project configuration to `.opencode/config.json` with:

- Project metadata
- Tool versions
- Framework information
- Custom settings

## Features

### Automatic Detection

- Detects Rust installation status
- Identifies project type and structure
- Finds installed frameworks and tools

### Smart Recommendations

- Suggests missing essential tools
- Recommends useful development tools
- Provides installation commands

### Error Recovery

- Clear error messages for missing tools
- Installation instructions
- Troubleshooting suggestions

## Examples

### Basic Setup

```bash
/rust-setup
```

Output:

```
🦀 Rust Project Configuration Wizard

Rust Environment Report
========================================
rustc: v1.75.0
cargo: v1.75.0
rustup: v1.26.0
Default toolchain: stable-x86_64-apple-darwin

Project Information:
Name: my-project
Version: 0.1.0
Edition: 2021
Type: Binary
Dependencies: 5
Dev Dependencies: 3
Build Dependencies: 0

Frameworks: tokio, clap
Linters: clippy
Formatters: rustfmt
Test Frameworks: cargo-test

✅ Configuration saved successfully!

🎉 Rust Configuration Complete!
==================================================
Project: my-project
Type: binary
Edition: 2021
Frameworks: tokio, clap
==================================================

🦀 Available Commands:
  /rust-setup    - Setup Rust project and install tools
  /rust-test     - Run tests
  /rust-build    - Build project
  /rust-check    - Check code without building
  /rust-clippy   - Run clippy linter
  /rust-fmt      - Format code
  /rust-run      - Run project
  /rust-doc      - Generate documentation

💡 Recommended Tools to Install:
  1. cargo-watch: Automatically run commands on file changes
     Command: cargo install cargo-watch

🚀 Next Steps:
  1. Run /rust-setup to install recommended tools
  2. Run /rust-check to check your code
  3. Run /rust-test to run tests
  4. Run /rust-build to build your project
```

### Missing Tools

If Rust is not installed:

```bash
/rust-setup
```

Output:

```
🦀 Rust Project Configuration Wizard

Rust Environment Report
========================================
rustc: Not installed
cargo: Not installed

⚠️  Missing Essential Tools:
  • rustc (Rust compiler)
  • cargo (Rust package manager)

📦 Installation Instructions:
  To install Rust and Cargo, run:
  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh

  After installation, restart your terminal or run:
  source $HOME/.cargo/env
```

## Common Issues

### Rust Not Installed

**Solution**: Install Rust using rustup:

```bash
curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Outdated Rust Version

**Solution**: Update Rust:

```bash
rustup update
```

### Missing Cargo.toml

**Solution**: Create a new Rust project:

```bash
cargo new my-project
cd my-project
/rust-setup
```

### Permission Issues

**Solution**: Fix cargo directory permissions:

```bash
sudo chown -R $(whoami) ~/.cargo
```

## Related Commands

- `/rust-test` - Run Rust tests
- `/rust-build` - Build Rust project
- `/rust-check` - Check code without building
- `/rust-clippy` - Run clippy linter
- `/rust-fmt` - Format code with rustfmt
- `/rust-run` - Run the project
- `/rust-doc` - Generate documentation
- `/rust-clean` - Clean build artifacts
- `/rust-update` - Update dependencies

## Configuration File

The setup creates/updates `.opencode/config.json`:

```json
{
  "rust": {
    "name": "my-project",
    "type": "binary",
    "edition": "2021",
    "frameworks": ["tokio", "clap"],
    "language": "rust",
    "tools": {
      "rustc": {
        "installed": true,
        "version": "1.75.0",
        "path": "/Users/username/.cargo/bin/rustc"
      },
      "cargo": {
        "installed": true,
        "version": "1.75.0",
        "path": "/Users/username/.cargo/bin/cargo"
      }
    },
    "project": {
      "hasCargoToml": true,
      "hasCargoLock": true,
      "name": "my-project",
      "version": "0.1.0",
      "dependencies": 5,
      "devDependencies": 3,
      "buildDependencies": 0
    },
    "recommendations": [
      {
        "tool": "cargo-watch",
        "reason": "Automatically run commands on file changes",
        "command": "cargo install cargo-watch"
      }
    ]
  }
}
```

## Tips

1. **Run setup first**: Always run `/rust-setup` before other Rust commands
2. **Keep tools updated**: Regularly update Rust and tools with `rustup update`
3. **Use recommended tools**: Install suggested tools for better development experience
4. **Check configuration**: Review `.opencode/config.json` for project settings
5. **Re-run after changes**: Run `/rust-setup` after major project changes

## Support

For issues with Rust setup:

1. Check Rust installation: `rustc --version`
2. Verify cargo works: `cargo --version`
3. Check project has Cargo.toml
4. Review error messages for specific issues

If problems persist, check the [Rust installation guide](https://www.rust-lang.org/tools/install).
