# `/js-build` - JavaScript/TypeScript Build Command

Build JavaScript and TypeScript projects with intelligent defaults and framework detection.

## Overview

The `/js-build` command builds your JavaScript or TypeScript project using the appropriate build tool for your project type. It automatically detects your build configuration and runs the correct build command with optimized settings.

## Features

- **Automatic Build Tool Detection**: Detects TypeScript, Webpack, Vite, Rollup, Parcel, and framework-specific build tools
- **Production Optimization**: Builds with production optimizations when requested
- **Watch Mode**: Supports development watch mode for rapid iteration
- **Bundle Analysis**: Optional bundle size analysis for optimization
- **Framework Support**: Works with React, Vue, Angular, Next.js, Nuxt, Svelte, and more
- **Error Recovery**: Provides helpful suggestions for common build errors

## Usage

```bash
/js-build [options]
```

### Options

| Option         | Short | Description                      |
| -------------- | ----- | -------------------------------- |
| `--production` | `-p`  | Build for production (optimized) |
| `--watch`      | `-w`  | Watch mode for development       |
| `--analyze`    | `-a`  | Analyze bundle size              |
| `--help`       | `-h`  | Show help message                |

## What It Does

### 1. Project Detection

- Checks for `package.json` and build scripts
- Detects TypeScript configuration (`tsconfig.json`)
- Identifies framework and build tool
- Determines appropriate build command

### 2. Build Execution

- Runs the correct build command for your project
- Applies production optimizations when requested
- Handles framework-specific build requirements
- Provides real-time build output

### 3. Error Handling

- Catches and displays build errors clearly
- Provides framework-specific troubleshooting
- Suggests fixes for common issues
- Guides through dependency problems

## Supported Build Tools

### TypeScript Projects

- **TypeScript Compiler (tsc)**: Standard TypeScript compilation
- **tsup**: Fast TypeScript bundler
- **tsc --watch**: TypeScript watch mode

### Bundlers

- **Webpack**: Comprehensive module bundler
- **Vite**: Next-generation frontend tooling
- **Rollup**: Efficient ES module bundler
- **Parcel**: Zero-configuration bundler
- **esbuild**: Extremely fast JavaScript bundler

### Framework Build Commands

- **React**: `react-scripts build`, `vite build`
- **Vue**: `vue-cli-service build`, `vite build`
- **Angular**: `ng build`
- **Next.js**: `next build`
- **Nuxt**: `nuxt build`
- **Svelte**: `svelte-kit build`, `vite build`
- **Astro**: `astro build`

## Examples

### Basic Build

```bash
# Build for development
/js-build

# Output:
# 🔨 Building JavaScript/TypeScript project...
# ✅ Build completed successfully!
# 📦 Output: dist/ (or build/ depending on configuration)
```

### Production Build

```bash
# Build with production optimizations
/js-build --production

# Output:
# 🔨 Building for production...
# ⚡ Minifying code...
# 📦 Tree-shaking unused code...
# 🎯 Optimizing bundles...
# ✅ Production build completed!
# 📊 Bundle size: 124.5 kB (gzipped: 42.3 kB)
```

### Watch Mode

```bash
# Build in watch mode for development
/js-build --watch

# Output:
# 🔨 Building in watch mode...
# 👀 Watching for file changes...
# ✅ Initial build completed!
# ⏳ Waiting for changes...
```

### Bundle Analysis

```bash
# Build with bundle analysis
/js-build --analyze

# Output:
# 🔨 Building with bundle analysis...
# 📊 Analyzing bundle size...
# 📈 Bundle Report:
#   - main.js: 45.2 kB
#   - vendor.js: 89.7 kB
#   - Total: 134.9 kB
# 🔍 Largest dependencies:
#   - react-dom: 32.1 kB
#   - lodash: 28.4 kB
#   - moment: 22.8 kB
```

## Configuration

### Package.json Scripts

The command looks for these build scripts in your `package.json`:

```json
{
  "scripts": {
    "build": "your-build-command",
    "build:prod": "production-build-command",
    "build:watch": "watch-build-command"
  }
}
```

### TypeScript Configuration

For TypeScript projects, ensure you have `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Framework Configuration

Framework-specific configuration files are automatically detected:

- `vite.config.js` - Vite configuration
- `webpack.config.js` - Webpack configuration
- `rollup.config.js` - Rollup configuration
- `next.config.js` - Next.js configuration
- `nuxt.config.js` - Nuxt configuration

## Common Issues and Solutions

### Missing Build Script

**Error**: `No build script found in package.json`

**Solution**:

```bash
# Add build script to package.json
echo '{"scripts": {"build": "your-build-command"}}' > package.json

# Or run setup first
/js-setup
```

### TypeScript Not Installed

**Error**: `TypeScript compiler not found`

**Solution**:

```bash
# Install TypeScript
npm install --save-dev typescript

# Initialize TypeScript configuration
npx tsc --init
```

### Missing Dependencies

**Error**: `Cannot find module`

**Solution**:

```bash
# Install dependencies
npm install

# Or install specific missing dependency
npm install missing-package-name
```

### Build Tool Not Found

**Error**: `Command 'vite' not found` (or similar)

**Solution**:

```bash
# Install the build tool
npm install --save-dev vite

# Or use npx
npx vite build
```

## Advanced Usage

### Custom Build Arguments

Pass additional arguments to your build command:

```bash
# Pass custom arguments to build command
/js-build -- --mode development --sourcemap
```

### Environment Variables

Set environment variables for the build:

```bash
# Set environment variable
NODE_ENV=production /js-build

# Or use cross-env for cross-platform compatibility
npm install --save-dev cross-env
# Then in package.json: "build": "cross-env NODE_ENV=production your-build-command"
```

### Multiple Build Targets

Handle multiple build configurations:

```bash
# Build for different environments
/js-build --production  # Production build
/js-build --watch      # Development watch mode
/js-build              # Standard development build
```

## Performance Tips

### 1. Use Production Builds for Deployment

```bash
# Always use --production for deployment
/js-build --production
```

### 2. Enable Caching

Configure your build tool to use caching:

- **Vite**: Automatic caching
- **Webpack**: `cache: true` in configuration
- **esbuild**: Extremely fast by default

### 3. Optimize Bundle Size

- Use `--analyze` to identify large dependencies
- Implement code splitting
- Use tree-shaking compatible imports
- Consider lazy loading

### 4. Parallel Builds

Some build tools support parallel execution:

- **esbuild**: Built-in parallelism
- **Vite**: Multi-threaded by default
- **Webpack**: `parallel: true` in configuration

## Integration with Other Commands

### Development Workflow

```bash
# Complete development workflow
/js-setup           # Configure project
/js-dev            # Start development server
/js-build --watch  # Build in watch mode
/js-test           # Run tests
/js-lint           # Check code quality
```

### CI/CD Pipeline

```bash
# Example CI/CD script
/js-setup
/js-lint
/js-test
/js-build --production
```

### TypeScript Projects

```bash
# TypeScript-specific workflow
/js-setup
/ts-typecheck      # Type checking
/js-build          # Build TypeScript
/js-test           # Run tests
```

## Related Commands

- `/js-setup` - Configure JavaScript/TypeScript project
- `/js-dev` - Start development server
- `/js-test` - Run tests
- `/js-lint` - Check code quality
- `/ts-typecheck` - TypeScript type checking
- `/ts-build` - TypeScript-specific build

## Tips

1. **Run setup first**: Always run `/js-setup` before first build
2. **Use watch mode**: Use `--watch` during development for faster iteration
3. **Analyze bundles**: Regularly use `--analyze` to optimize bundle size
4. **Check errors**: Read build error messages carefully - they often include specific fixes
5. **Update dependencies**: Keep build tools and dependencies updated
6. **Use production builds**: Always use `--production` for deployment builds
7. **Monitor performance**: Use bundle analysis to identify optimization opportunities
8. **Framework updates**: Keep framework build configurations updated

For framework-specific build issues, check the framework's documentation or run `/js-setup` to reconfigure your project.
