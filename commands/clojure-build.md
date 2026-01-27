# Clojure Build Command

Build Clojure projects with intelligent defaults and build tool detection.

## Overview

The `/clojure-build` command builds your Clojure project using the appropriate build tool (Leiningen, deps.edn, Boot, or tools.build). It automatically detects your build configuration and runs the correct build command with optimized settings.

## Features

- **Automatic Build Tool Detection**: Detects Leiningen, deps.edn, Boot, and tools.build configurations
- **Uberjar Support**: Creates standalone executable JAR files with `--uberjar` option
- **Incremental Compilation**: Uses AOT compilation only when necessary for performance
- **Dependency Management**: Automatically downloads and manages dependencies
- **Multi-module Projects**: Supports building projects with multiple modules or subprojects
- **Error Recovery**: Provides helpful suggestions for common Clojure build errors

## Usage

```bash
/clojure-build [options]
```

### Options

| Option      | Short | Description                           |
| ----------- | ----- | ------------------------------------- |
| `--uberjar` | `-u`  | Create an uberjar (standalone JAR)    |
| `--aot`     | `-a`  | Force AOT (ahead-of-time) compilation |
| `--clean`   | `-c`  | Clean build artifacts before building |
| `--verbose` | `-v`  | Show detailed build output            |
| `--help`    | `-h`  | Show help message                     |

## Examples

### Basic build

```bash
/clojure-build
```

Builds the project using the detected build tool.

### Create uberjar

```bash
/clojure-build --uberjar
```

Creates a standalone executable JAR file containing all dependencies.

### Force AOT compilation

```bash
/clojure-build --aot
```

Forces ahead-of-time compilation, which can improve startup time.

### Clean build

```bash
/clojure-build --clean
```

Cleans build artifacts before building for a fresh start.

## Configuration

### Build Tool Detection

The command automatically detects your build configuration:

1. **Leiningen**: Looks for `project.clj`
2. **deps.edn**: Looks for `deps.edn` (Clojure CLI)
3. **Boot**: Looks for `build.boot`
4. **tools.build**: Looks for `build.clj` or `deps.edn` with `:build` alias

### Project Structure

The command expects standard Clojure project structure:

```
project/
├── src/          # Source code
├── test/         # Test code
├── resources/    # Resource files
└── [build config file]
```

### Custom Build Configuration

You can customize build behavior by creating a `.opencode/clojure-config.json` file:

```json
{
  "build": {
    "mainNamespace": "your.app.main",
    "aotNamespaces": ["your.app.core"],
    "jvmOptions": ["-Xmx2g", "-XX:+UseG1GC"],
    "uberjarName": "app-standalone.jar"
  }
}
```

## Common Issues

### Missing Dependencies

If dependencies are missing, the command will:

1. Attempt to download them automatically
2. Provide installation instructions if manual intervention is needed
3. Suggest alternative dependencies if conflicts are detected

### AOT Compilation Errors

Common AOT issues and solutions:

- **Namespace conflicts**: Check for duplicate namespace declarations
- **Missing requires**: Ensure all required namespaces are available
- **Circular dependencies**: Refactor to break dependency cycles

### Memory Issues

For large projects, you may need to increase JVM memory:

- Set `JAVA_OPTS` environment variable: `export JAVA_OPTS="-Xmx4g"`
- Use `--jvm-options` flag if supported by your build tool

## Integration

### With Development Server

Use with the development server for live reloading:

```bash
/clojure-run --watch  # Start development server
/clojure-build        # Build for production
```

### With Testing

Build and test in sequence:

```bash
/clojure-build && /clojure-test
```

### With Packaging

Create distribution packages:

```bash
/clojure-build --uberjar
# Creates standalone JAR ready for deployment
```

## Performance Tips

1. **Use AOT selectively**: Only AOT compile namespaces that benefit from it
2. **Enable incremental compilation**: Most build tools support incremental builds
3. **Cache dependencies**: Dependencies are cached between builds
4. **Parallel compilation**: Some build tools support parallel namespace compilation
5. **Profile builds**: Use `--verbose` to identify slow compilation steps

## Related Commands

- `/clojure-run` - Run Clojure applications
- `/clojure-test` - Run Clojure tests
- `/clojure-repl` - Start a REPL session
- `/clojure-deps` - Manage dependencies
- `/clojure-format` - Format Clojure code
- `/clojure-lint` - Lint Clojure code
