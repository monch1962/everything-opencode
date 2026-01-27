# TypeScript Type Checking Command

Run TypeScript type checking with detailed error reporting and configuration validation.

## Overview

The `/ts-typecheck` command performs TypeScript type checking without emitting compiled JavaScript. It's designed for fast feedback during development, CI/CD pipelines, and pre-commit hooks. The command provides detailed error messages, suggestions for fixes, and configuration validation.

## Features

- **Fast Type Checking**: Checks types without compilation overhead
- **Detailed Error Reporting**: Clear, actionable error messages with code snippets
- **Configuration Validation**: Validates `tsconfig.json` and project structure
- **Watch Mode**: Continuous type checking during development
- **Strict Mode Enforcement**: Ensures strict TypeScript compliance
- **Incremental Checking**: Only checks changed files for speed
- **Error Suppression**: Manage and suppress specific error types
- **Performance Profiling**: Identify slow type checking operations

## Usage

```bash
/ts-typecheck [options]
```

### Options

| Option           | Short | Description                             |
| ---------------- | ----- | --------------------------------------- |
| `--strict`       | `-s`  | Enable strict type checking             |
| `--watch`        | `-w`  | Watch mode for continuous checking      |
| `--noEmit`       | `-n`  | Type check only (no output)             |
| `--project`      | `-p`  | Specify tsconfig.json file              |
| `--skipLibCheck` |       | Skip type checking of declaration files |
| `--diagnostics`  |       | Show diagnostic information             |
| `--listFiles`    |       | List files included in compilation      |
| `--help`         | `-h`  | Show help message                       |

## Examples

### Basic type checking

```bash
/ts-typecheck
```

Checks types using project's `tsconfig.json`.

### Strict type checking

```bash
/ts-typecheck --strict
```

Enables all strict TypeScript checks.

### Watch mode

```bash
/ts-typecheck --watch
```

Continuously checks types as files change.

### Check specific project

```bash
/ts-typecheck --project tsconfig.test.json
```

Checks types using a specific configuration file.

### Show diagnostics

```bash
/ts-typecheck --diagnostics
```

Shows detailed diagnostic information about the type checking process.

## Configuration

### tsconfig.json Validation

The command validates your TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true, // Recommended for type checking only
    "skipLibCheck": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Error Configuration

Configure how errors are handled:

```json
{
  "typeCheck": {
    "maxErrors": 20,
    "errorFormat": "pretty",
    "suppress": ["TS6133", "TS7006"],
    "warnAsError": false
  }
}
```

### Performance Configuration

```json
{
  "typeCheck": {
    "incremental": true,
    "maxFiles": 1000,
    "memoryLimit": "4GB",
    "workers": 4
  }
}
```

## Type Checking Strategies

### Development Checking

```bash
/ts-typecheck --watch --skipLibCheck
```

- Fast feedback during development
- Skip library checks for speed
- Continuous monitoring

### CI/CD Checking

```bash
/ts-typecheck --strict --noEmit --maxErrors 0
```

- Strict compliance checking
- Fail on any error
- No output files generated

### Pre-commit Hooks

```bash
/ts-typecheck --changed-only
```

- Only check changed files
- Fast enough for pre-commit
- Focus on recent changes

### Full Project Audit

```bash
/ts-typecheck --all --diagnostics --listFiles
```

- Comprehensive checking
- Performance diagnostics
- File inclusion analysis

## Error Handling

### Error Categories

#### Syntax Errors

- Missing imports
- Invalid TypeScript syntax
- Configuration issues

#### Type Errors

- Type mismatches
- Missing type annotations
- Interface violations

#### Configuration Errors

- Invalid `tsconfig.json`
- Missing dependencies
- Path resolution issues

### Error Messages

The command provides enhanced error messages:

```
❌ Type error in src/user.ts:42
   Property 'email' does not exist on type 'User'

   Code: TS2339
   Suggestion: Add email property to User interface or use optional chaining

   Related:
   - Interface definition: src/types.ts:15
   - Usage in other files: src/auth.ts:87, src/api.ts:123
```

### Error Suppression

```bash
# Suppress specific error codes
/ts-typecheck --suppress TS6133,TS7006

# Suppress errors in specific files
/ts-typecheck --exclude src/legacy/

# Convert warnings to errors
/ts-typecheck --warnAsError
```

## Performance Optimization

### Incremental Type Checking

```bash
/ts-typecheck --incremental
```

- Caches type information
- Only rechecks changed files
- Uses `.tsbuildinfo` file

### Parallel Checking

```bash
/ts-typecheck --workers 4
```

- Uses multiple CPU cores
- Faster for large codebases
- Configurable worker count

### Memory Management

```bash
# Limit memory usage
/ts-typecheck --maxMemory 4096

# Use file-based caching
/ts-typecheck --cache .tscache/

# Clean cache periodically
/ts-typecheck --clean-cache
```

## Integration

### With Editors

Many editors can use the command for real-time type checking:

```json
// VSCode settings.json
{
  "typescript.tsserver.enable": false,
  "typescript.validate.enable": true,
  "typescript.validate.command": "/ts-typecheck",
  "typescript.validate.args": ["--watch"]
}
```

### With Git Hooks

```bash
# pre-commit hook
/ts-typecheck --changed-only --maxErrors 0

# pre-push hook
/ts-typecheck --strict --noEmit
```

### With CI/CD

```bash
# GitHub Actions
- name: Type check
  run: /ts-typecheck --strict --noEmit

# Exit on error
/ts-typecheck --strict || exit 1
```

### With Build Process

```bash
# Type check before building
/ts-typecheck && /ts-build

# Or as part of build
/ts-build --noEmitOnError
```

## Common Issues

### Slow Type Checking

```bash
# Profile type checking
/ts-typecheck --profile

# Identify slow files
/ts-typecheck --listFiles --verbose

# Optimize configuration
/ts-typecheck --skipLibCheck --incremental
```

### False Positives

```bash
# Suppress specific errors
/ts-typecheck --suppress TS2345

# Use type assertions
/ts-typecheck --allowUnsafeTypeAssertions

# Configure strictness level
/ts-typecheck --strictness medium
```

### Configuration Issues

```bash
# Validate configuration
/ts-typecheck --validate-config

# Show effective configuration
/ts-typecheck --show-config

# Create default config
npx tsc --init --strict
```

### Memory Issues

```bash
# Increase memory limit
/ts-typecheck --maxMemory 8192

# Use disk caching
/ts-typecheck --cache-dir .tscache --maxMemory 2048

# Check in chunks
/ts-typecheck --chunk-size 100
```

## Advanced Features

### Custom Type Definitions

```bash
# Include custom type definitions
/ts-typecheck --typeRoots ./types

# Use specific lib files
/ts-typecheck --lib es2020,dom

# Add global declarations
/ts-typecheck --declaration --declarationDir ./types
```

### Path Mapping

```bash
# Use path mapping from tsconfig
/ts-typecheck --baseUrl src --paths '{"@/*":["*"]}'

# Validate path mappings
/ts-typecheck --validate-paths
```

### Project References

```bash
# Check project references
/ts-typecheck --build --verbose

# Check specific reference
/ts-typecheck --project packages/core/tsconfig.json
```

## Related Commands

- `/ts-build` - Build TypeScript projects
- `/js-lint` - Lint TypeScript code
- `/js-test` - Test TypeScript code
- `/js-dev` - Development server with type checking
- `/js-typecheck` - JavaScript type checking (with JSDoc)
