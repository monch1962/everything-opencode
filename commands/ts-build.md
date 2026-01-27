# TypeScript Build Command

Compile TypeScript projects with intelligent configuration detection and optimization.

## Overview

The `/ts-build` command compiles TypeScript code to JavaScript using the TypeScript compiler (tsc) with intelligent defaults. It automatically detects your TypeScript configuration, handles different project types, and provides optimized compilation options.

## Features

- **Automatic Configuration Detection**: Finds and uses `tsconfig.json` with appropriate settings
- **Incremental Compilation**: Faster builds by only recompiling changed files
- **Watch Mode**: Continuous compilation during development
- **Multiple Output Targets**: Supports ES modules, CommonJS, and other module systems
- **Declaration Files**: Generates `.d.ts` type declaration files
- **Source Maps**: Creates source maps for debugging
- **Project References**: Handles TypeScript project references
- **Error Recovery**: Provides helpful suggestions for compilation errors

## Usage

```bash
/ts-build [options]
```

### Options

| Option          | Short | Description                           |
| --------------- | ----- | ------------------------------------- |
| `--watch`       | `-w`  | Watch mode for continuous compilation |
| `--incremental` | `-i`  | Use incremental compilation           |
| `--sourceMap`   | `-s`  | Generate source maps                  |
| `--declaration` | `-d`  | Generate declaration files            |
| `--outDir`      | `-o`  | Output directory                      |
| `--target`      | `-t`  | ECMAScript target version             |
| `--module`      | `-m`  | Module system                         |
| `--strict`      |       | Enable all strict type checks         |
| `--noEmit`      |       | Type check without emitting files     |
| `--help`        | `-h`  | Show help message                     |

## Examples

### Basic compilation

```bash
/ts-build
```

Compiles TypeScript using settings from `tsconfig.json`.

### Watch mode

```bash
/ts-build --watch
```

Continuously compiles TypeScript as files change.

### Generate declarations

```bash
/ts-build --declaration --sourceMap
```

Compiles with declaration files and source maps.

### Custom output

```bash
/ts-build --outDir dist --target es2020 --module commonjs
```

Compiles to specific output directory with custom target and module system.

### Type check only

```bash
/ts-build --noEmit
```

Checks types without generating output files.

## Configuration

### tsconfig.json Detection

The command automatically detects and uses `tsconfig.json` with these priorities:

1. `tsconfig.json` in current directory
2. `tsconfig.build.json` for production builds
3. Configuration via `--project` flag
4. Default TypeScript compiler options

### Common Configurations

#### Basic TypeScript

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  }
}
```

#### Library Project

```json
{
  "compilerOptions": {
    "target": "es2015",
    "module": "esnext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./lib",
    "rootDir": "./src"
  }
}
```

#### Node.js Application

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Advanced Features

#### Project References

```json
{
  "references": [{ "path": "./packages/core" }, { "path": "./packages/ui" }],
  "compilerOptions": {
    "composite": true
  }
}
```

#### Path Mapping

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"]
    }
  }
}
```

## Compilation Strategies

### Development Builds

```bash
/ts-build --watch --sourceMap --incremental
```

- Fast incremental compilation
- Source maps for debugging
- Continuous watching

### Production Builds

```bash
/ts-build --declaration --sourceMap --strict
```

- Type declaration files
- Source maps (optional)
- Strict type checking
- Optimized output

### Library Builds

```bash
/ts-build --declaration --declarationMap --outDir lib
```

- Declaration files with maps
- Separate output directory
- Clean build artifacts

## Integration

### With JavaScript Build

For mixed TypeScript/JavaScript projects:

```bash
# Build TypeScript first
/ts-build

# Then bundle JavaScript
/js-build
```

### With Testing

```bash
# Build then test
/ts-build && /js-test

# Or build tests separately
/ts-build --project tsconfig.test.json
```

### In CI/CD Pipelines

```bash
# Type check in CI
/ts-build --noEmit

# Production build
/ts-build --declaration --sourceMap false

# Build with specific config
/ts-build --project tsconfig.prod.json
```

## Performance Optimization

### Incremental Compilation

```bash
/ts-build --incremental
```

- Only recompiles changed files
- Maintains compilation state in `.tsbuildinfo`
- Significantly faster for large projects

### Project References

```bash
/ts-build --build
```

- Builds referenced projects in correct order
- Only rebuilds changed projects
- Parallel building where possible

### Memory Management

```bash
# Limit memory usage
/ts-build --maxNodeMemory 4096

# Use workers for large projects
/ts-build --workers 4
```

## Common Issues

### Missing tsconfig.json

```bash
# Initialize TypeScript project
npx tsc --init

# Or use default configuration
/ts-build --target es2020 --module commonjs --outDir dist
```

### Type Errors

```bash
# Show detailed error information
/ts-build --verbose

# Skip type checking for quick builds
/ts-build --noEmitOnError false

# Show error codes and messages
/ts-build --diagnostics
```

### Slow Compilation

```bash
# Enable incremental compilation
/ts-build --incremental

# Skip library checking
/ts-build --skipLibCheck

# Use project references for monorepos
/ts-build --build
```

### Module Resolution Issues

```bash
# Specify module resolution
/ts-build --moduleResolution node

# Set base URL for path mapping
/ts-build --baseUrl src

# Use specific paths configuration
/ts-build --paths '{"@/*":["src/*"]}'
```

## TypeScript Version Management

### Multiple Versions

```bash
# Use project-specific TypeScript
/ts-build --typescript ./node_modules/typescript/bin/tsc

# Check TypeScript version
/ts-build --version

# Force specific compiler options
/ts-build --lib es2020,dom --target es2020
```

### Compatibility

- **TypeScript 3.0+**: Full support
- **TypeScript 4.0+**: Advanced features (variadic tuples, labeled tuples)
- **TypeScript 4.5+**: Latest features (template string types, etc.)

## Related Commands

- `/ts-typecheck` - Type check without building
- `/js-build` - Build JavaScript projects
- `/js-dev` - Development server for TypeScript/JavaScript
- `/js-lint` - Lint TypeScript code
- `/js-test` - Test TypeScript code
