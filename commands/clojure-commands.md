# Clojure Commands Reference

Complete reference for all Clojure commands in the everything-opencode project.

## Command Overview

| Command           | Description                                  | Build Systems Supported |
| ----------------- | -------------------------------------------- | ----------------------- |
| `/clojure-setup`  | Interactive project setup and tool detection | All                     |
| `/clojure-test`   | Run tests with appropriate test runner       | All                     |
| `/clojure-build`  | Build project (optionally create uberjar)    | All                     |
| `/clojure-repl`   | Start REPL session                           | All                     |
| `/clojure-lint`   | Run clj-kondo linter                         | All                     |
| `/clojure-format` | Format code with zprint                      | All                     |
| `/clojure-run`    | Run application main function                | All                     |
| `/clojure-deps`   | Update dependencies                          | All                     |
| `/clojure-clean`  | Clean build artifacts                        | All                     |

## `/clojure-test` - Run Tests

Run Clojure tests with the appropriate test runner for your build system.

### Usage

```bash
/clojure-test [options]
```

### Options

- No specific options - passes through to underlying test runner

### Examples

```bash
# Run all tests
/clojure-test

# Run tests in specific namespace (Clojure CLI)
/clojure-test -n my.namespace

# Run tests with kaocha (if configured)
/clojure-test --watch
```

### Build System Behavior

- **Clojure CLI**: Runs `clojure -M:test`
- **Leiningen**: Runs `lein test`
- **Boot**: Runs `boot test`

### Test Framework Support

- **clojure.test**: Default test framework
- **kaocha**: Next-generation test runner (if installed)
- **expectations**: Behavior-driven testing
- **midje**: Test framework with mocking

## `/clojure-build` - Build Project

Build Clojure project, optionally creating an uberjar for deployment.

### Usage

```bash
/clojure-build [options]
```

### Options

- `--uberjar`, `-u`: Create uberjar (deployable JAR)
- `--release`: Build with release optimizations

### Examples

```bash
# Standard build
/clojure-build

# Create uberjar
/clojure-build --uberjar

# Build with release profile (Leiningen)
/clojure-build --release
```

### Build System Behavior

- **Clojure CLI**: Runs AOT compilation or creates uberjar via tools.build
- **Leiningen**: Runs `lein compile` or `lein uberjar`
- **Boot**: Runs `boot build` or `boot uberjar`

## `/clojure-repl` - Start REPL

Start a REPL session with project context.

### Usage

```bash
/clojure-repl [options]
```

### Options

- No specific options - passes through to underlying REPL

### Examples

```bash
# Start REPL
/clojure-repl

# Start nREPL server (if configured)
/clojure-repl
```

### REPL Types Supported

- **nREPL**: Network REPL (default if available)
- **Socket REPL**: Simple socket-based REPL
- **prepl**: Programmable REPL

### Editor Integration

Connect with:

- **Emacs + CIDER**: `cider-connect` to nREPL port
- **VS Code + Calva**: Connect to nREPL
- **Vim/Neovim + Conjure**: Connect to nREPL
- **IntelliJ + Cursive**: Connect to nREPL

## `/clojure-lint` - Run Linter

Run clj-kondo static analyzer and linter on Clojure code.

### Usage

```bash
/clojure-lint [options]
```

### Options

- No specific options - passes through to clj-kondo

### Examples

```bash
# Lint all files
/clojure-lint

# Lint specific directory
/clojure-lint src/
```

### Features

- **Unused vars**: Detect unused functions and variables
- **Type hints**: Suggest type hints for performance
- **Namespace conflicts**: Detect naming conflicts
- **Code style**: Enforce consistent code style
- **Error detection**: Find potential runtime errors

### Configuration

clj-kondo reads from:

- `.clj-kondo/config.edn` - Project configuration
- `$HOME/.clj-kondo/config.edn` - User configuration

## `/clojure-format` - Format Code

Format Clojure code with zprint code formatter.

### Usage

```bash
/clojure-format [options]
```

### Options

- No specific options - passes through to zprint

### Examples

```bash
# Format all files
/clojure-format

# Format specific file
/clojure-format src/my/namespace.clj
```

### Features

- **Highly configurable**: Extensive formatting options
- **Respects comments**: Preserves comment placement
- **Multiple styles**: Support for different coding styles
- **Fast**: Efficient formatting of large codebases

### Configuration

zprint reads from:

- `.zprint.edn` - Project configuration
- `$HOME/.zprint.edn` - User configuration

## `/clojure-run` - Run Application

Run Clojure application main function.

### Usage

```bash
/clojure-run [args...]
```

### Arguments

- Any arguments are passed to the application's main function

### Examples

```bash
# Run application
/clojure-run

# Run with arguments
/clojure-run --port 8080 --debug
```

### Requirements

- Project must have a `-main` function
- Main namespace must be configured in build config
- For Clojure CLI: `:exec-fn` or `:main-opts` in deps.edn
- For Leiningen: `:main` in project.clj

## `/clojure-deps` - Update Dependencies

Update project dependencies.

### Usage

```bash
/clojure-deps [options]
```

### Options

- No specific options - passes through to build tool

### Examples

```bash
# Update dependencies
/clojure-deps

# Force update (Clojure CLI)
/clojure-deps -Sforce
```

### Build System Behavior

- **Clojure CLI**: Runs `clojure -Sforce` to update dependencies
- **Leiningen**: Runs `lein deps` to update dependencies
- **Boot**: Runs `boot deps` to update dependencies

## `/clojure-clean` - Clean Build Artifacts

Clean build artifacts and temporary files.

### Usage

```bash
/clojure-clean [options]
```

### Options

- `--all`, `-a`: Clean all artifacts (including caches)

### Examples

```bash
# Clean standard artifacts
/clojure-clean

# Clean all artifacts including caches
/clojure-clean --all
```

### Files Cleaned

- `target/` directory (Leiningen, Boot)
- `.cpcache/` directory (Clojure CLI)
- `.cljs_rhino_repl/` directory (ClojureScript)
- `out/` directory (ClojureScript compilation)
- `node_modules/` (if ClojureScript project)

## Workflow Examples

### New Project Setup

```bash
# 1. Create project
mkdir my-project
cd my-project
echo '{:deps {org.clojure/clojure {:mvn/version "1.11.1"}}}' > deps.edn

# 2. Run setup
/clojure-setup

# 3. Install recommended tools
# Follow instructions from setup

# 4. Create source file
mkdir -p src/my_project
echo '(ns my-project.core) (defn -main [& args] (println "Hello, Clojure!"))' > src/my_project/core.clj

# 5. Run linter
/clojure-lint

# 6. Run tests
/clojure-test

# 7. Run application
/clojure-run
```

### Existing Project Workflow

```bash
# 1. Clone and setup
git clone https://github.com/example/clojure-project
cd clojure-project
/clojure-setup

# 2. Update dependencies
/clojure-deps

# 3. Run tests
/clojure-test

# 4. Format code
/clojure-format

# 5. Start REPL for development
/clojure-repl

# 6. Build for deployment
/clojure-build --uberjar
```

### CI/CD Pipeline

```bash
# Install dependencies
/clojure-deps

# Run linter
/clojure-lint

# Run tests
/clojure-test

# Build artifact
/clojure-build --uberjar

# Clean workspace
/clojure-clean --all
```

## Troubleshooting

### Common Issues

1. **Java not found**

   ```bash
   # Check Java installation
   java -version

   # Install Java if missing
   # macOS: brew install --cask temurin
   # Ubuntu: sudo apt install openjdk-11-jdk
   ```

2. **Build tool not found**

   ```bash
   # Check Clojure CLI
   clojure --version

   # Check Leiningen
   lein version

   # Install missing tools from /clojure-setup recommendations
   ```

3. **Dependency resolution failures**

   ```bash
   # Clear local cache
   rm -rf ~/.m2/repository

   # Force dependency update
   /clojure-deps
   ```

4. **REPL connection issues**

   ```bash
   # Check nREPL port
   cat .nrepl-port 2>/dev/null || echo "No nREPL port file"

   # Start fresh REPL
   /clojure-repl
   ```

### Performance Tips

1. **Use AOT compilation for production**

   ```bash
   /clojure-build --uberjar
   ```

2. **Enable JVM optimizations**

   ```bash
   # Add to deps.edn or project.clj
   :jvm-opts ["-Xmx2g" "-server"]
   ```

3. **Use clj-kondo cache**

   ```bash
   # clj-kondo caches analysis results
   /clojure-lint
   ```

4. **Parallel test execution**
   ```bash
   # With kaocha
   /clojure-test --parallel
   ```

## Configuration Reference

### .opencode/config.json

The Clojure configuration includes:

```json
{
  "clojure": {
    "name": "project-name",
    "type": "library|application|full-stack",
    "buildSystem": "clojure-cli|leiningen|boot",
    "frameworks": ["framework1", "framework2"],
    "tools": {
      "java": { "installed": true, "version": "..." },
      "clojureCli": { "installed": true, "version": "..." },
      "leiningen": { "installed": false },
      "boot": { "installed": false }
    },
    "project": {
      "hasDepsEdn": true,
      "hasProjectClj": false,
      "dependencies": 10,
      "aliases": ["test", "dev"]
    },
    "recommendations": [
      {
        "tool": "kaocha",
        "reason": "Next-generation test runner",
        "command": "Add to deps.edn",
        "priority": 6
      }
    ]
  }
}
```

### Environment Variables

- `JAVA_HOME`: Java installation directory
- `LEIN_HOME`: Leiningen home directory
- `BOOT_HOME`: Boot home directory
- `CLJ_CACHE`: Clojure CLI cache directory

## Best Practices

1. **Always run setup first**: `/clojure-setup` detects tools and configures project
2. **Use clj-kondo**: Run `/clojure-lint` regularly to catch issues early
3. **Format code consistently**: Use `/clojure-format` before committing
4. **Test frequently**: Run `/clojure-test` during development
5. **REPL-driven development**: Use `/clojure-repl` for interactive exploration
6. **Keep dependencies updated**: Use `/clojure-deps` regularly
7. **Clean build artifacts**: Use `/clojure-clean` in CI/CD pipelines
8. **Build uberjars for deployment**: Use `/clojure-build --uberjar` for production

## Further Resources

- [Clojure Documentation](https://clojure.org/guides)
- [Clojure CLI Guide](https://clojure.org/guides/deps_and_cli)
- [Leiningen Documentation](https://leiningen.org/)
- [clj-kondo Documentation](https://github.com/clj-kondo/clj-kondo)
- [zprint Documentation](https://github.com/kkinnear/zprint)
- [kaocha Documentation](https://github.com/lambdaisland/kaocha)
- [nREPL Documentation](https://nrepl.org/)

For additional help, join the [Clojure community](https://clojure.org/community) or check the [Clojure subreddit](https://reddit.com/r/clojure).
