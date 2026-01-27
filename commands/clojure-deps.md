# Clojure Dependencies Command

Manage Clojure project dependencies with intelligent updates and conflict resolution.

## Overview

The `/clojure-deps` command manages dependencies for Clojure projects. It downloads, updates, and resolves dependencies for your chosen build tool (Leiningen, deps.edn, Boot, or tools.build), with intelligent conflict resolution and version management.

## Features

- **Multi-tool Support**: Works with Leiningen, deps.edn, Boot, and tools.build
- **Intelligent Updates**: Updates dependencies while maintaining compatibility
- **Conflict Resolution**: Automatically resolves version conflicts between dependencies
- **Transitive Dependency Management**: Handles complex dependency graphs
- **Offline Mode**: Works with cached dependencies when offline
- **Security Scanning**: Optional vulnerability scanning for dependencies
- **Dependency Tree Visualization**: Shows dependency relationships

## Usage

```bash
/clojure-deps [options] [dependencies...]
```

### Options

| Option      | Short | Description                                |
| ----------- | ----- | ------------------------------------------ |
| `--update`  | `-u`  | Update all dependencies to latest versions |
| `--add`     | `-a`  | Add new dependencies                       |
| `--remove`  | `-r`  | Remove dependencies                        |
| `--tree`    | `-t`  | Show dependency tree                       |
| `--check`   | `-c`  | Check for outdated dependencies            |
| `--offline` | `-o`  | Work offline using cache                   |
| `--force`   | `-f`  | Force update even with conflicts           |
| `--help`    | `-h`  | Show help message                          |

## Examples

### Download/update dependencies

```bash
/clojure-deps
```

Downloads or updates all project dependencies.

### Add a new dependency

```bash
/clojure-deps --add org.clojure/data.json "1.0.0"
```

Adds `org.clojure/data.json` version 1.0.0 to the project.

### Update all dependencies

```bash
/clojure-deps --update
```

Updates all dependencies to their latest compatible versions.

### Show dependency tree

```bash
/clojure-deps --tree
```

Displays a visual tree of all dependencies and their relationships.

### Check for outdated dependencies

```bash
/clojure-deps --check
```

Lists dependencies that have newer versions available.

## Configuration

### Build Tool Specific Behavior

#### Leiningen (`project.clj`)

- Updates dependencies in `:dependencies` vector
- Manages repositories in `:repositories`
- Handles profiles and aliases
- Supports `:exclusions` and `:classifier`

#### deps.edn (Clojure CLI)

- Updates `deps.edn` file with Maven coordinates
- Manages `:mvn/repos` repositories
- Handles `:extra-deps` and `:override-deps`
- Supports Git and local dependencies

#### Boot (`build.boot`)

- Updates dependencies in `:dependencies` task option
- Manages repositories with `:repositories` task
- Handles profiles and environments
- Supports `:exclusions` and `:scope`

#### tools.build (`build.clj`)

- Updates dependencies in `deps.edn` or `build.clj`
- Manages Maven repositories
- Handles both runtime and build-time dependencies

### Dependency Sources

The command supports multiple dependency sources:

- **Maven Central**: Primary source for Java/Clojure libraries
- **Clojars**: Clojure-specific repository
- **Git repositories**: Direct Git dependencies
- **Local files**: Local JAR or directory dependencies
- **Custom repositories**: User-defined Maven repositories

## Common Operations

### Adding Dependencies

```bash
# Add with specific version
/clojure-deps --add org.clojure/clojure "1.11.1"

# Add with latest version
/clojure-deps --add reagent/reagent

# Add multiple dependencies
/clojure-deps --add org.clojure/clojure "1.11.1" reagent/reagent "1.2.0"
```

### Removing Dependencies

```bash
# Remove a dependency
/clojure-deps --remove org.old/library

# Remove and clean up
/clojure-deps --remove org.old/library --clean
```

### Updating Dependencies

```bash
# Update all dependencies
/clojure-deps --update

# Update specific dependency
/clojure-deps --update org.clojure/clojure

# Update with version constraint
/clojure-deps --update org.clojure/clojure "[1.11,1.12)"
```

## Conflict Resolution

### Automatic Resolution

The command automatically:

1. Detects version conflicts between dependencies
2. Suggests compatible versions
3. Updates transitive dependencies to resolve conflicts
4. Preserves explicit version constraints

### Manual Intervention

When automatic resolution fails:

```bash
# See conflict details
/clojure-deps --check --verbose

# Force a specific version
/clojure-deps --add org.conflicting/lib "[1.2.0]" --force

# Exclude problematic transitive dependency
/clojure-deps --add org.main/lib "1.0.0" --exclude org.problematic/transitive
```

## Security Features

### Vulnerability Scanning

```bash
# Check for known vulnerabilities
/clojure-deps --security-scan

# Update vulnerable dependencies
/clojure-deps --update --security-only
```

### Integrity Verification

- Verifies checksums for downloaded artifacts
- Validates PGP signatures when available
- Checks repository authenticity

### Audit Trail

- Logs all dependency changes
- Creates backup before major updates
- Supports rollback to previous versions

## Performance

### Caching

- Local Maven cache (`~/.m2/repository/`)
- Clojars cache
- Git repository caching
- Offline mode support

### Parallel Downloads

- Downloads multiple dependencies in parallel
- Connection pooling for repositories
- Resume interrupted downloads

### Memory Management

- Streams large dependency files
- Cleans temporary files automatically
- Monitors disk space usage

## Integration

### With Build Process

```bash
# Typical development workflow
/clojure-deps --check
/clojure-deps --update
/clojure-build
/clojure-test
```

### In CI/CD Pipelines

```bash
# Clean dependency resolution
/clojure-clean --deps
/clojure-deps --offline  # Use cached dependencies
/clojure-build --uberjar
```

### With Other Commands

```bash
# Update deps and run tests
/clojure-deps --update && /clojure-test

# Check deps and build
/clojure-deps --check && /clojure-build

# Add deps and start REPL
/clojure-deps --add new/lib "1.0.0" && /clojure-repl
```

## Troubleshooting

### Common Issues

#### Download Failures

```bash
# Try with different repository
/clojure-deps --repo https://repo.clojars.org/

# Use offline mode with existing cache
/clojure-deps --offline

# Clear cache and retry
/clojure-clean --deps && /clojure-deps
```

#### Version Conflicts

```bash
# See conflict details
/clojure-deps --tree --verbose

# Force a resolution strategy
/clojure-deps --update --force --strategy "newest"

# Exclude problematic dependency
/clojure-deps --add main/lib "1.0.0" --exclude conflict/lib
```

#### Memory Issues

```bash
# Increase memory for large dependency graphs
export JVM_OPTS="-Xmx4g"
/clojure-deps --update

# Process in chunks for very large projects
/clojure-deps --update --chunk-size 50
```

## Related Commands

- `/clojure-build` - Build project with dependencies
- `/clojure-clean` - Clean dependency caches
- `/clojure-test` - Test with dependencies
- `/clojure-run` - Run application with dependencies
- `/js-deps` - Manage JavaScript dependencies (for mixed projects)
