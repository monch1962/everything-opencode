# Clojure Clean Command

Clean Clojure build artifacts and temporary files.

## Overview

The `/clojure-clean` command removes build artifacts, compiled classes, dependency caches, and other temporary files from your Clojure project. It helps maintain a clean workspace and can resolve build issues caused by stale artifacts.

## Features

- **Comprehensive Cleaning**: Removes compiled classes, dependency caches, and build outputs
- **Build Tool Aware**: Works with Leiningen, deps.edn, Boot, and tools.build
- **Selective Cleaning**: Option to clean specific artifacts or all temporary files
- **Safe Operation**: Never deletes source code or important configuration files
- **Dry Run Mode**: Preview what will be deleted before actually cleaning

## Usage

```bash
/clojure-clean [options]
```

### Options

| Option      | Short | Description                                          |
| ----------- | ----- | ---------------------------------------------------- |
| `--all`     | `-a`  | Clean all artifacts (including dependency caches)    |
| `--classes` | `-c`  | Clean only compiled classes                          |
| `--deps`    | `-d`  | Clean only dependency caches                         |
| `--target`  | `-t`  | Clean only target/output directories                 |
| `--dry-run` | `-n`  | Show what would be deleted without actually deleting |
| `--verbose` | `-v`  | Show detailed cleaning output                        |
| `--help`    | `-h`  | Show help message                                    |

## Examples

### Basic clean

```bash
/clojure-clean
```

Removes compiled classes and target directories.

### Clean all artifacts

```bash
/clojure-clean --all
```

Removes all build artifacts including dependency caches.

### Clean only dependency caches

```bash
/clojure-clean --deps
```

Removes only dependency cache directories.

### Dry run

```bash
/clojure-clean --dry-run
```

Shows what would be deleted without actually deleting anything.

## Configuration

### Build Tool Specific Cleaning

The command handles different build tools appropriately:

#### Leiningen (`project.clj`)

- Removes `target/` directory
- Cleans `.lein-repl-history` if present
- Removes `.lein-deps-sum` cache file

#### deps.edn (Clojure CLI)

- Removes `.cpcache/` directory
- Cleans `.cljs/` cache if present
- Removes `target/` directory for tools.build projects

#### Boot (`build.boot`)

- Removes `target/` directory
- Cleans `.boot/cache/` directory
- Removes `.boot-env` file

#### tools.build (`build.clj`)

- Removes `target/` directory
- Cleans `.cpcache/` directory
- Removes any custom output directories defined in build config

### Protected Files

The command never deletes:

- Source code (`src/`, `test/`)
- Configuration files (`project.clj`, `deps.edn`, `build.boot`)
- Git files (`.git/`)
- Documentation
- User data

## Common Use Cases

### Before Committing

```bash
/clojure-clean
```

Ensure no build artifacts are accidentally committed.

### Resolving Build Issues

```bash
/clojure-clean --all
```

When experiencing strange build errors, clean everything and rebuild.

### Freeing Disk Space

```bash
/clojure-clean --all --verbose
```

Identify and remove large cache directories.

### CI/CD Pipelines

```bash
/clojure-clean && /clojure-build
```

Start with a clean slate for reproducible builds.

## Integration

### With Build Command

```bash
/clojure-clean && /clojure-build
```

Clean before building for a fresh start.

### With Test Command

```bash
/clojure-clean --classes && /clojure-test
```

Clean compiled classes before running tests.

### In Scripts

```bash
#!/bin/bash
# Build script
/clojure-clean
/clojure-deps
/clojure-build --uberjar
```

## Safety Features

1. **Confirmation for large deletions**: Asks for confirmation when deleting large cache directories
2. **Backup option**: Can create backups before cleaning with `--backup` flag
3. **Exclusion patterns**: Respects `.gitignore` and `.cleanignore` files
4. **Progress indicators**: Shows progress during cleaning operations
5. **Error recovery**: Can resume interrupted cleaning operations

## Performance

### What Gets Cleaned

- **Compiled classes**: `.class` files in `target/classes/` or similar
- **Dependency caches**: `.m2/repository/` (local Maven cache), `.cpcache/`
- **Build outputs**: JAR files, WAR files, documentation
- **Temporary files**: `.nrepl-port`, `.lein-repl-history`, `.boot-env`

### Disk Space Impact

Typical space recovered:

- Small project: 10-50 MB
- Medium project: 50-200 MB
- Large project: 200 MB - 1 GB
- With dependencies: 1 GB+ (when using `--all`)

## Troubleshooting

### "Permission Denied" Errors

If you encounter permission errors:

```bash
sudo /clojure-clean --dry-run  # Check what needs sudo
# Then selectively clean with appropriate permissions
```

### Accidental Deletion Recovery

If you accidentally delete something:

1. Check if your IDE has local history
2. Look for backups in `.opencode/backups/`
3. Use git to restore: `git checkout -- <file>`

### Cleaning Specific Directories

To clean custom directories not covered by default:

```bash
# Manual cleaning
rm -rf custom-build-dir/
# Or add to .cleanignore exclusion
```

## Related Commands

- `/clojure-build` - Build Clojure projects
- `/clojure-deps` - Manage dependencies
- `/clojure-test` - Run tests
- `/clojure-run` - Run applications
- `/js-clean` - Clean JavaScript projects (for mixed projects)
