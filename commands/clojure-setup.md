# Clojure Setup Command (`/clojure-setup`)

Interactive setup for Clojure projects. Detects Clojure tools, build systems, and provides recommendations for Java, Clojure CLI, Leiningen, Boot, and other Clojure ecosystem tools.

## Overview

The Clojure setup command helps you configure your Clojure project by:

1. Detecting installed Java runtime and Clojure tools
2. Analyzing your project structure and build system (deps.edn, project.clj, build.boot)
3. Identifying frameworks (Luminus, Pedestal, Compojure, Ring, Reitit, Fulcro)
4. Providing tool recommendations (clj-kondo, zprint, kaocha, nREPL)
5. Saving configuration for future use

## Usage

```bash
/clojure-setup
```

## What It Does

### 1. Tool Detection

- **Java**: Java Runtime Environment (JRE 8+ required)
- **Clojure CLI**: Official Clojure command-line tools (deps.edn)
- **Leiningen**: Traditional Clojure build tool (project.clj)
- **Boot**: Alternative build tool (build.boot)
- **clj-kondo**: Static analyzer and linter
- **zprint**: Code formatter
- **kaocha**: Test runner
- **nREPL**: Network REPL server

### 2. Project Analysis

- **Build system**: Detects deps.edn, project.clj, or build.boot
- **Project type**: Library, application, or full-stack (ClojureScript)
- **Frameworks**: Web frameworks, database libraries, UI frameworks
- **REPL types**: nREPL, Socket REPL, prepl
- **ClojureScript**: shadow-cljs, figwheel, lein-figwheel

### 3. Configuration

Saves project configuration to `.opencode/config.json` with:

- Project metadata
- Tool versions and paths
- Build system information
- Framework detection
- Custom settings and recommendations

## Features

### Multi-Build System Support

- **Clojure CLI (deps.edn)**: Modern, lightweight build system
- **Leiningen (project.clj)**: Traditional, feature-rich build tool
- **Boot (build.boot)**: Flexible, task-oriented build tool

### Comprehensive Framework Detection

- **Web frameworks**: Luminus, Pedestal, Compojure, Ring, Reitit
- **UI frameworks**: Fulcro, Re-frame, Rum, Hoplon
- **Database**: next.jdbc, HugSQL, Toucan, HoneySQL
- **Testing**: clojure.test, kaocha, expectations, midje

### Smart Recommendations

- Essential tools (Java, build tools)
- Development tools (clj-kondo, zprint)
- Testing tools (kaocha)
- REPL enhancements (nREPL, CIDER, Calva)

### Error Recovery

- Clear error messages for missing Java or build tools
- Platform-specific installation instructions
- Troubleshooting suggestions for common issues

## Examples

### Basic Setup with Clojure CLI

```bash
/clojure-setup
```

Output:

```
☕ Clojure Project Configuration Wizard

Clojure Environment Report
========================================
Java: OpenJDK 17.0.9 (installed)
Clojure CLI: 1.11.1.1347 (installed)
Leiningen: Not installed
Boot: Not installed

Project Information:
Build system: Clojure CLI (deps.edn)
Project type: Library
Dependencies: 8
Aliases: test, dev, build
Frameworks: ring, compojure
Linters: clj-kondo (installed)
Formatters: zprint (installed)
Test Frameworks: clojure.test
REPL types: nREPL
ClojureScript: Not detected

✅ Configuration saved successfully!

🎉 Clojure Configuration Complete!
==================================================
Project: my-clojure-app
Type: library
Build system: Clojure CLI
Frameworks: ring, compojure
Java: OpenJDK 17.0.9
==================================================

☕ Available Commands:
  /clojure-setup    - Setup Clojure project and install tools
  /clojure-test     - Run tests
  /clojure-build    - Build project (uberjar)
  /clojure-repl     - Start REPL session
  /clojure-lint     - Run clj-kondo linter
  /clojure-format   - Format code with zprint
  /clojure-run      - Run application
  /clojure-deps     - Update dependencies
  /clojure-clean    - Clean build artifacts

💡 Recommended Tools to Install:
  1. kaocha: Next-generation test runner
     Command: Add to deps.edn or project.clj dependencies

🚀 Next Steps:
  1. Run /clojure-setup to install recommended tools
  2. Run /clojure-lint to check your code
  3. Run /clojure-test to run tests
  4. Run /clojure-build to build your project
  5. Run /clojure-repl to start a nREPL session
```

### Missing Java Installation

If Java is not installed:

```bash
/clojure-setup
```

Output:

```
☕ Clojure Project Configuration Wizard

Clojure Environment Report
========================================
Java: Not installed
Clojure CLI: Not installed
Leiningen: Not installed
Boot: Not installed

⚠️  Missing Essential Tools:
  • Java Runtime Environment (JRE 8+)

📦 Installation Instructions:
  1. Java: Required for all Clojure tools
     Command: Install Java 8 or higher from https://adoptium.net/

📖 Installation Guide:
  Install Java 8 or higher:
  • macOS: brew install --cask temurin
  • Ubuntu: sudo apt install openjdk-11-jdk
  • Windows: Download from https://adoptium.net/
  • All platforms: https://clojure.org/guides/getting_started
```

### Leiningen Project Detection

For a Leiningen project (project.clj):

```bash
/clojure-setup
```

Output:

```
☕ Clojure Project Configuration Wizard

Clojure Environment Report
========================================
Java: OpenJDK 17.0.9 (installed)
Clojure CLI: 1.11.1.1347 (installed)
Leiningen: 2.10.0 (installed)
Boot: Not installed

Project Information:
Build system: Leiningen (project.clj)
Project type: Web Application
Dependencies: 15
Plugins: lein-cljfmt, lein-ancient
Frameworks: luminus, ring, compojure, hiccup
Linters: clj-kondo (installed)
Formatters: cljfmt (via lein-cljfmt)
Test Frameworks: clojure.test, kaocha
REPL types: nREPL
ClojureScript: shadow-cljs

✅ Configuration saved successfully!
```

## Common Issues

### Java Not Installed

**Solution**: Install Java 8 or higher:

```bash
# macOS
brew install --cask temurin

# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# Windows
# Download from https://adoptium.net/
```

### Clojure CLI Not Installed

**Solution**: Install Clojure CLI tools:

```bash
# macOS
brew install clojure/tools/clojure

# Linux
curl -O https://download.clojure.org/install/linux-install-1.11.1.1347.sh
chmod +x linux-install-1.11.1.1347.sh
sudo ./linux-install-1.11.1.1347.sh

# All platforms: https://clojure.org/guides/getting_started
```

### Leiningen Not Installed

**Solution**: Install Leiningen:

```bash
# Download lein script
curl -O https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein

# Make it executable
chmod +x lein

# Move to PATH
sudo mv lein /usr/local/bin/

# Run once to install
lein version
```

### Missing Build Configuration

**Solution**: Create a Clojure project:

```bash
# Clojure CLI project
mkdir my-project
cd my-project
echo '{:deps {org.clojure/clojure {:mvn/version "1.11.1"}}}' > deps.edn

# Leiningen project
lein new app my-project
cd my-project

# Then run setup
/clojure-setup
```

### Permission Issues

**Solution**: Fix permissions on Java or build tools:

```bash
# Check Java installation
java -version

# Fix Leiningen permissions
chmod +x ~/bin/lein  # or wherever lein is installed

# Clear Maven cache if needed
rm -rf ~/.m2/repository
```

## Related Commands

- `/clojure-test` - Run Clojure tests
- `/clojure-build` - Build Clojure project (uberjar)
- `/clojure-repl` - Start REPL session
- `/clojure-lint` - Run clj-kondo linter
- `/clojure-format` - Format code with zprint
- `/clojure-run` - Run the application
- `/clojure-deps` - Update dependencies
- `/clojure-clean` - Clean build artifacts

## Configuration File

The setup creates/updates `.opencode/config.json`:

```json
{
  "clojure": {
    "name": "my-clojure-app",
    "type": "library",
    "buildSystem": "clojure-cli",
    "frameworks": ["ring", "compojure"],
    "hasClojureScript": false,
    "language": "clojure",
    "tools": {
      "java": {
        "installed": true,
        "version": "17.0.9",
        "path": "/usr/bin/java"
      },
      "clojureCli": {
        "installed": true,
        "version": "1.11.1.1347",
        "path": "/usr/local/bin/clojure"
      },
      "leiningen": {
        "installed": false
      },
      "boot": {
        "installed": false
      }
    },
    "project": {
      "hasDepsEdn": true,
      "hasProjectClj": false,
      "hasBuildBoot": false,
      "isLibrary": true,
      "isApplication": false,
      "isFullStack": false,
      "dependencies": 8,
      "aliases": ["test", "dev", "build"],
      "mainNamespace": "my-clojure-app.core"
    },
    "frameworks": ["ring", "compojure"],
    "linters": ["clj-kondo"],
    "formatters": ["zprint"],
    "testFrameworks": ["clojure.test"],
    "replTypes": ["nrepl"],
    "clojurescript": {
      "tool": null,
      "installed": false
    },
    "recommendations": [
      {
        "tool": "kaocha",
        "reason": "Next-generation test runner for larger projects",
        "command": "Add to deps.edn or project.clj dependencies",
        "priority": 6
      }
    ]
  }
}
```

## Tips

1. **Java first**: Ensure Java is installed before Clojure tools
2. **Build system choice**: Use Clojure CLI for new projects, Leiningen for existing ones
3. **Essential tools**: Install clj-kondo and zprint for better development experience
4. **REPL workflow**: Use nREPL with your editor (CIDER, Calva, Conjure)
5. **Project structure**: Keep source code in `src/`, tests in `test/`
6. **Dependency management**: Regularly update dependencies with `/clojure-deps`
7. **Testing**: Use kaocha for complex test suites, clojure.test for simple tests
8. **Formatting**: Run `/clojure-format` before committing code
9. **Linting**: Run `/clojure-lint` to catch common errors
10. **REPL-driven development**: Use `/clojure-repl` for interactive development

## Support

For issues with Clojure setup:

1. Check Java installation: `java -version`
2. Verify Clojure CLI: `clojure --version`
3. Check Leiningen: `lein version`
4. Verify project has deps.edn or project.clj
5. Review error messages for specific issues

If problems persist:

- **Clojure CLI**: https://clojure.org/guides/getting_started
- **Leiningen**: https://leiningen.org/
- **Java installation**: https://adoptium.net/
- **Community support**: https://clojure.org/community

## Build System Comparison

| Feature             | Clojure CLI (deps.edn)  | Leiningen (project.clj) | Boot (build.boot) |
| ------------------- | ----------------------- | ----------------------- | ----------------- |
| **Philosophy**      | Minimal, composable     | Batteries-included      | Task-oriented     |
| **Configuration**   | EDN maps                | Clojure code            | Clojure code      |
| **Dependency Mgmt** | Maven + git deps        | Maven + git deps        | Maven + git deps  |
| **REPL**            | Built-in                | Plugin-based            | Built-in          |
| **Community**       | Growing, official       | Large, established      | Smaller, niche    |
| **Best for**        | New projects, libraries | Web apps, existing code | Custom workflows  |

## Framework Detection

The setup detects these Clojure frameworks:

### Web Frameworks

- **Luminus**: Full-stack framework with batteries included
- **Pedestal**: Service-oriented, interceptors-based
- **Compojure**: Routing library for Ring
- **Ring**: HTTP abstraction layer
- **Reitit**: Fast data-driven router

### UI Frameworks

- **Fulcro**: Full-stack, data-driven UI framework
- **Re-frame**: Reactive framework for Reagent
- **Rum**: Simple, decomplected React wrapper
- **Hoplon**: JVM-centric, no-Virtual-DOM approach

### Database

- **next.jdbc**: Modern JDBC wrapper
- **HugSQL**: SQL-based database access
- **Toucan**: ORM-like layer for HoneySQL
- **HoneySQL**: SQL as Clojure data structures

## Next Steps

After running `/clojure-setup`:

1. **Install recommended tools** from the suggestions
2. **Run linter**: `/clojure-lint` to check code quality
3. **Run tests**: `/clojure-test` to ensure tests pass
4. **Start REPL**: `/clojure-repl` for interactive development
5. **Build project**: `/clojure-build` to create deployable artifact
6. **Format code**: `/clojure-format` to maintain consistent style

For more information, visit the [Clojure documentation](https://clojure.org/guides) or join the [Clojure community](https://clojure.org/community).
