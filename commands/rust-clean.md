# Rust Clean Command

Clean Rust build artifacts, cache directories, and temporary files to free disk space and resolve build issues.

## Overview

The `/rust-clean` command removes Rust build artifacts, compilation caches, and temporary files. It helps maintain a clean workspace, resolve build issues caused by stale artifacts, and free up disk space by removing unnecessary files.

## Features

- **Comprehensive Cleaning**: Removes target directories, Cargo caches, and build artifacts
- **Selective Cleaning**: Clean specific build profiles or all artifacts
- **Workspace Support**: Clean all crates in a workspace
- **Dry Run Mode**: Preview what will be deleted before cleaning
- **Safe Operation**: Never deletes source code or important configuration files
- **Cache Management**: Clean Cargo cache and registry caches
- **Cross-Compilation Artifacts**: Clean artifacts for specific targets
- **Integration Ready**: Works with CI/CD pipelines and development workflows

## Usage

```bash
/rust-clean [options]
```

### Options

| Option        | Short | Description                                 |
| ------------- | ----- | ------------------------------------------- |
| `--all`       | `-a`  | Clean all artifacts (including Cargo cache) |
| `--release`   | `-r`  | Clean only release artifacts                |
| `--debug`     | `-d`  | Clean only debug artifacts                  |
| `--target`    | `-t`  | Clean artifacts for specific target         |
| `--package`   | `-p`  | Clean specific package only                 |
| `--workspace` | `-w`  | Clean all workspace members                 |
| `--dry-run`   | `-n`  | Show what would be deleted                  |
| `--verbose`   | `-v`  | Show detailed cleaning output               |
| `--help`      | `-h`  | Show help message                           |

## Examples

### Basic clean

```bash
/rust-clean
```

Removes target directory for current package.

### Clean all artifacts

```bash
/rust-clean --all
```

Removes all build artifacts including Cargo cache.

### Clean release builds only

```bash
/rust-clean --release
```

Removes only release build artifacts.

### Clean for specific target

```bash
/rust-clean --target x86_64-unknown-linux-gnu
```

Removes artifacts for the specified target.

### Dry run

```bash
/rust-clean --dry-run
```

Shows what would be deleted without actually deleting.

### Clean workspace

```bash
/rust-clean --workspace
```

Cleans all crates in the workspace.

## What Gets Cleaned

### Target Directory (`target/`)

- **Debug builds**: `target/debug/`
- **Release builds**: `target/release/`
- **Documentation**: `target/doc/`
- **Build scripts**: `target/debug/build/`
- **Incremental compilation**: `target/debug/incremental/`
- **Test artifacts**: `target/debug/deps/`, `target/debug/incremental/`

### Cargo Cache

- **Registry cache**: `~/.cargo/registry/`
- **Git dependencies**: `~/.cargo/git/`
- **Build cache**: `~/.cargo/.package-cache`

### Temporary Files

- **Cargo lock files**: Temporary lock files
- **Build logs**: Compilation logs and error logs
- **Profile data**: Profiling and benchmarking data
- **Coverage data**: Code coverage reports and data

### Workspace Artifacts

- **Member crates**: Each crate's target directory
- **Workspace target**: Shared target directory (if configured)
- **Integration tests**: Test artifacts across workspace

## Configuration

### Cleaning Profiles

Create `.opencode/rust-clean.json` for custom cleaning configuration:

```json
{
  "profiles": {
    "light": {
      "target": true,
      "incremental": true,
      "doc": false,
      "cache": false
    },
    "full": {
      "target": true,
      "incremental": true,
      "doc": true,
      "cache": true,
      "registry": true,
      "git": true
    },
    "ci": {
      "target": true,
      "incremental": false,
      "doc": false,
      "cache": false,
      "dryRun": false
    }
  },
  "exclude": ["target/release/my-important-binary", "target/doc/api", ".cargo/registry/index"],
  "safety": {
    "confirmLargeDeletes": true,
    "maxSizeWithoutConfirm": "1GB",
    "backupBeforeDelete": false
  }
}
```

### Build Tool Integration

The command works with different Rust build configurations:

#### Cargo Workspaces

```bash
# Clean entire workspace
/rust-clean --workspace

# Clean specific workspace member
/rust-clean --package my-crate

# Clean with workspace profile
/rust-clean --profile workspace
```

#### Cross-Compilation

```bash
# Clean specific target artifacts
/rust-clean --target wasm32-unknown-unknown

# Clean all cross-compilation artifacts
/rust-clean --all-targets

# Clean with target-specific options
/rust-clean --target x86_64-pc-windows-gnu --release
```

#### Custom Build Directories

```bash
# Clean custom build directory
/rust-clean --build-dir ./build

# Multiple build directories
/rust-clean --build-dir ./build1 --build-dir ./build2
```

## Common Use Cases

### Before Committing

```bash
/rust-clean
```

Ensure no build artifacts are accidentally committed to version control.

### Resolving Build Issues

```bash
/rust-clean --all
/rust-build
```

When experiencing strange build errors, clean everything and rebuild.

### Freeing Disk Space

```bash
/rust-clean --all --verbose
```

Identify and remove large cache directories to free disk space.

### CI/CD Pipelines

```bash
/rust-clean --profile ci
/rust-build --release
```

Start with a clean slate for reproducible builds in CI.

### Development Workflow

```bash
# Clean between different build types
/rust-clean --release
/rust-build --debug

# Clean specific test artifacts
/rust-clean --tests
/rust-test
```

## Safety Features

### Confirmation Prompts

```bash
# Ask for confirmation before large deletions
/rust-clean --confirm

# Set size threshold for confirmation
/rust-clean --confirm-size 100MB
```

### Backup Options

```bash
# Create backup before cleaning
/rust-clean --backup

# Specify backup directory
/rust-clean --backup-dir ./backups

# Restore from backup
/rust-clean --restore ./backups/backup.tar.gz
```

### Exclusion Patterns

```bash
# Exclude specific files or directories
/rust-clean --exclude "target/release/important"

# Use .gitignore-style patterns
/rust-clean --ignore-file .cleanignore

# Preserve specific artifacts
/rust-clean --preserve "*.so" --preserve "*.dll"
```

## Performance

### Cleaning Speed

```bash
# Parallel cleaning for speed
/rust-clean --parallel

# Limit parallel jobs
/rust-clean --jobs 4

# Skip expensive operations
/rust-clean --skip-scan
```

### Disk Space Impact

Typical space recovered:

- **Small project**: 100-500 MB
- **Medium project**: 500 MB - 2 GB
- **Large project**: 2 GB - 10 GB
- **With Cargo cache**: 10 GB+ (when using `--all`)

### Memory Usage

```bash
# Limit memory usage during cleaning
/rust-clean --memory-limit 1G

# Use streaming for large directories
/rust-clean --stream

# Clean in chunks
/rust-clean --chunk-size 1000
```

## Integration

### With Build Process

```bash
# Clean before building
/rust-clean && /rust-build

# Clean specific profile before building
/rust-clean --release && /rust-build --release
```

### With Testing

```bash
# Clean test artifacts before testing
/rust-clean --tests && /rust-test

# Clean between test runs
/rust-clean --incremental && /rust-test --watch
```

### In Scripts

```bash
#!/bin/bash
# Build script with cleaning
/rust-clean --profile ci
/rust-build --release
/rust-test
```

### With Other Commands

```bash
# Complete development cycle
/rust-clean
/rust-check
/rust-build
/rust-test
/rust-clippy
```

## Troubleshooting

### Common Issues

#### Permission Denied Errors

```bash
# Check permissions
/rust-clean --dry-run --verbose

# Use sudo for system directories (be careful!)
sudo /rust-clean --target-dir /usr/local/lib

# Clean user cache only
/rust-clean --user-cache
```

#### Accidental Deletion

```bash
# Restore from backup if available
/rust-clean --restore latest

# Check git for lost files
git status
git checkout -- lost-file.rs

# Use version control recovery
git fsck --lost-found
```

#### Incomplete Cleaning

```bash
# Force clean locked files
/rust-clean --force

# Clean with elevated privileges
sudo /rust-clean --all

# Manual cleanup for stubborn files
find . -name "*.rlib" -delete
```

### Performance Issues

#### Slow Cleaning

```bash
# Profile cleaning operation
/rust-clean --profile

# Skip scanning phase
/rust-clean --skip-scan --paths target/

# Clean specific directories only
/rust-clean --only target/debug --only target/release
```

#### Memory Exhaustion

```bash
# Clean in batches
/rust-clean --batch-size 100

# Use disk-based operations
/rust-clean --disk-based

# Skip memory-intensive operations
/rust-clean --skip-duplicate-check
```

### Recovery Options

#### From Dry Run

```bash
# Generate deletion script
/rust-clean --dry-run --script clean.sh

# Review and execute
chmod +x clean.sh
./clean.sh
```

#### From Backup

```bash
# List available backups
/rust-clean --list-backups

# Restore specific backup
/rust-clean --restore-backup 2024-01-27

# Verify backup integrity
/rust-clean --verify-backup backup.tar.gz
```

## Advanced Features

### Custom Cleaning Scripts

```bash
# Execute custom pre-clean script
/rust-clean --pre-clean-script ./scripts/pre-clean.sh

# Execute custom post-clean script
/rust-clean --post-clean-script ./scripts/post-clean.sh

# Chain multiple scripts
/rust-clean --scripts ./clean1.sh,./clean2.sh
```

### Pattern-Based Cleaning

```bash
# Clean by file pattern
/rust-clean --pattern "*.rlib" --pattern "*.so"

# Clean by modification time
/rust-clean --older-than 30d

# Clean by size
/rust-clean --larger-than 100MB
```

### Integration with System Cleaners

```bash
# Clean system temp files too
/rust-clean --system-temp

# Clean browser caches (if configured)
/rust-clean --browser-caches

# Comprehensive system clean
/rust-clean --system --user --all
```

## Related Commands

- `/rust-build` - Build Rust projects
- `/rust-check` - Check Rust code
- `/rust-test` - Run tests
- `/rust-run` - Run applications
- `/rust-update` - Update dependencies
- `/js-clean` - Clean JavaScript projects (for mixed projects)
