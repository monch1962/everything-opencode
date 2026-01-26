# `/js-setup` - JavaScript/TypeScript Project Setup

Interactive setup wizard for configuring JavaScript and TypeScript projects in opencode.

## Overview

The `/js-setup` command guides you through configuring your JavaScript or TypeScript project with opencode. It detects your project type, installed tools, and creates an optimized configuration for development.

## Features

- **Automatic Detection**: Detects Node.js, npm, TypeScript, ESLint, Prettier, and other tools
- **Project Type Detection**: Identifies React, Vue, Angular, Next.js, Nuxt, Svelte, and other frameworks
- **Environment Report**: Shows detailed information about your development environment
- **Smart Configuration**: Creates optimized configuration based on your project type
- **Tool Recommendations**: Suggests useful tools to install based on your project needs

## Usage

```bash
/js-setup
```

The command runs interactively and doesn't require any arguments.

## What It Does

### 1. Environment Detection

- Checks for Node.js and npm installation
- Detects TypeScript, ESLint, Prettier, and testing frameworks
- Identifies package manager (npm, yarn, pnpm, bun)
- Detects frameworks and build tools

### 2. Project Analysis

- Checks for existing `package.json` and configuration files
- Identifies project type (JavaScript, TypeScript, React, Vue, etc.)
- Analyzes dependencies and devDependencies

### 3. Interactive Configuration

- Guides you through project setup options
- Asks about preferred tools and configurations
- Sets up TypeScript if requested

### 4. Configuration Generation

- Creates opencode configuration for JavaScript/TypeScript
- Sets up tool paths and versions
- Configures framework-specific settings
- Generates recommendations for missing tools

## Output

After successful setup, you'll see:

1. **Environment Report**: Summary of detected tools and versions
2. **Project Configuration**: Details about your configured project
3. **Available Commands**: List of JavaScript/TypeScript commands now available
4. **Next Steps**: Recommended actions to get started

## Available Commands After Setup

Once configured, these commands become available:

- `/js-test` - Run tests with Jest, Mocha, or Vitest
- `/js-lint` - Run ESLint for code quality checking
- `/js-build` - Build your project
- `/js-dev` - Start development server
- `/js-format` - Format code with Prettier
- `/ts-typecheck` - TypeScript type checking (TypeScript projects)
- `/ts-build` - TypeScript compilation (TypeScript projects)

## Examples

### Basic JavaScript Project

```bash
# In a JavaScript project directory
/js-setup

# Output:
# 🚀 JavaScript/TypeScript Project Configuration Wizard
# 📊 Environment Report:
# ✅ Node.js: 18.17.0
# ✅ npm: 9.6.7
# ℹ️  TypeScript: Not installed (optional)
# 📦 Package Manager: npm v9.6.7
# 🎉 Configuration Complete!
```

### TypeScript + React Project

```bash
# In a TypeScript React project
/js-setup

# Output:
# 🚀 JavaScript/TypeScript Project Configuration Wizard
# 📊 Environment Report:
# ✅ Node.js: 18.17.0
# ✅ npm: 9.6.7
# ✅ TypeScript: 5.3.3
# 🏗️  Frameworks: React
# 🔧 Build Tools: Vite
# 🎉 Configuration Complete!
```

## Common Scenarios

### New Project Setup

1. Create project directory: `mkdir my-project && cd my-project`
2. Initialize npm: `npm init -y`
3. Run setup: `/js-setup`
4. Follow interactive prompts

### Existing Project Migration

1. Navigate to existing project: `cd existing-project`
2. Run setup: `/js-setup`
3. Review detected configuration
4. Update as needed

### Adding TypeScript to JavaScript Project

1. Run setup: `/js-setup`
2. When prompted, select TypeScript option
3. Install TypeScript: `npm install --save-dev typescript @types/node`
4. Create tsconfig.json: `npx tsc --init`

## Configuration File

The setup creates a configuration in `.opencode/config.json`:

```json
{
  "javascript": {
    "name": "my-project",
    "type": "typescript",
    "framework": "react",
    "language": "typescript",
    "version": "1.0.0",
    "tools": {
      "node": {
        "installed": true,
        "version": "18.17.0",
        "path": "/usr/local/bin/node"
      },
      "typescript": {
        "installed": true,
        "version": "5.3.3",
        "path": "./node_modules/.bin/tsc"
      }
    },
    "environment": {
      "nodeVersion": "18.17.0",
      "npmVersion": "9.6.7",
      "packageManager": "npm",
      "os": "darwin",
      "detectedAt": "2024-01-27T10:30:00.000Z"
    }
  }
}
```

## Troubleshooting

### "Node.js is not installed"

```bash
# Install Node.js first:
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
# Windows: Download from https://nodejs.org/
# Or use nvm: https://github.com/nvm-sh/nvm
```

### "npm command not found"

- npm comes with Node.js - reinstall Node.js
- Update npm: `npm install -g npm@latest`

### "Project not detected as JavaScript"

- Ensure `package.json` exists in project root
- Check for JavaScript/TypeScript files in the project
- Run setup from the correct directory

### Configuration Errors

- Delete `.opencode/config.json` and run `/js-setup` again
- Check file permissions for configuration directory
- Ensure you have write access to the project directory

## Related Commands

- `/js-test` - Run tests after setup
- `/js-lint` - Check code quality
- `/js-build` - Build your project
- `/js-dev` - Start development server
- `/ts-typecheck` - TypeScript type checking

## Notes

- The setup is non-destructive and won't modify your existing project files
- Configuration is stored in `.opencode/` directory in your project
- You can re-run `/js-setup` at any time to update configuration
- Framework-specific optimizations are applied automatically
- Tool recommendations are based on industry best practices
