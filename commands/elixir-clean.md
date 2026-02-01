# /elixir-clean

Clean Elixir build artifacts and cache with Elixir-specific improvements.

## Description

The `/elixir-clean` command removes build artifacts, cache files, and temporary files from Elixir projects. It provides selective cleaning options, dry-run mode, and project-aware cleaning to ensure build consistency and recover disk space.

## Usage

```bash
/elixir-clean [options]
```

## Options

| Option            | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `--deps`, `-d`    | Clean dependencies cache                             |
| `--build`, `-b`   | Clean build artifacts                                |
| `--all`, `-a`     | Clean everything (dependencies + build)              |
| `--verbose`, `-v` | Verbose output                                       |
| `--dry-run`, `-n` | Show what would be cleaned without actually cleaning |
| `--help`, `-h`    | Show help message                                    |

## Cleaning Targets

### Build Artifacts (`--build`)

Cleans files generated during compilation and build processes.

**Files cleaned:**

- `_build/` directory
- Compiled BEAM files (`*.beam`)
- Mix compile cache
- Dialyzer PLT files
- Coverage reports (`cover/`)
- Documentation files (`doc/`)
- Release artifacts (`rel/`)
- Crash dumps (`erl_crash.dump`)

**Example:**

```bash
/elixir-clean --build
```

### Dependencies Cache (`--deps`)

Cleans dependency-related files and cache.

**Files cleaned:**

- `deps/` directory
- Hex package cache (`~/.hex/`)
- Rebar3 build cache (`~/.cache/rebar3/`)
- Mix lock file artifacts
- Dependency build artifacts
- Transitive dependency cache
- Package metadata

**Example:**

```bash
/elixir-clean --deps
```

### Everything (`--all`)

Comprehensive cleaning of all generated files.

**Files cleaned:**

- All build artifacts
- All dependencies cache
- Temporary files (`tmp/`)
- Log files (`log/`)
- Test artifacts
- Benchmark results
- Profile data
- Upload cache

**Example:**

```bash
/elixir-clean --all
```

### Standard Clean (No options)

Balanced cleaning for common development scenarios.

**Files cleaned:**

- `_build/` directory (except dependencies)
- Mix compile cache
- Dialyzer PLT files
- Coverage reports
- Documentation files

**Example:**

```bash
/elixir-clean
```

## Examples

### Basic Cleaning

```bash
# Standard clean (recommended for most cases)
/elixir-clean

# Clean build artifacts
/elixir-clean --build

# Clean dependencies cache
/elixir-clean --deps

# Clean everything
/elixir-clean --all
```

### Advanced Usage

```bash
# Verbose cleaning output
/elixir-clean --verbose

# Dry run (show what would be cleaned)
/elixir-clean --dry-run

# Combined options
/elixir-clean --build --verbose

# Clean with confirmation
/elixir-clean --all --verbose
```

### Project-Specific Cleaning

```bash
# Phoenix project cleaning
/elixir-clean --build  # Cleans Phoenix assets too

# Umbrella project cleaning
/elixir-clean --all    # Cleans all umbrella apps

# Library project cleaning
/elixir-clean          # Light cleaning for libraries
```

## When to Clean

### 1. After Elixir/Erlang Version Changes

```bash
# After upgrading Elixir
/elixir-clean --all

# After upgrading Erlang/OTP
/elixir-clean --build --deps
```

### 2. When Experencing Strange Errors

```bash
# Unexplained compilation errors
/elixir-clean --build

# Dependency resolution issues
/elixir-clean --deps

# General weird behavior
/elixir-clean --all
```

### 3. Before Sharing Project

```bash
# Remove personal cache files
/elixir-clean --all --verbose

# Verify nothing personal remains
/elixir-clean --dry-run
```

### 4. When Disk Space is Low

```bash
# Check disk usage
du -sh _build deps

# Clean large directories
/elixir-clean --all

# Monitor disk space recovery
df -h .
```

### 5. After Major Dependency Updates

```bash
# Update dependencies
/elixir-deps update --all

# Clean old dependency artifacts
/elixir-clean --deps
```

### 6. Before Creating a Release

```bash
# Ensure clean build
/elixir-clean --all

# Build release
/elixir-compile --env prod
```

### 7. When Switching Environments

```bash
# Switching from dev to prod
/elixir-clean --build

# Switching between test configurations
/elixir-clean --build
```

## Safety Features

### File Preservation

**Never deleted:**

- Source code files (`*.ex`, `*.exs`)
- Configuration files (`config/`)
- Git files (`.git/`)
- Project metadata (`mix.exs`, `.gitignore`)
- User documentation (`README.md`, `CHANGELOG.md`)
- License files
- Test files (preserved, only artifacts cleaned)

### Confirmation Prompts

```bash
# Large operations require confirmation
/elixir-clean --all
# Are you sure you want to clean everything? [y/N]
```

### Backup Mechanism

```bash
# Important files are backed up
/elixir-clean --build  # Backs up PLT files before cleaning
```

### Validation

```bash
# Validates cleaning targets
/elixir-clean --invalid-target
# Error: Invalid cleaning target: --invalid-target
```

### Progress Indicators

```bash
/elixir-clean --verbose
# Cleaning build artifacts...
# [=====>] 75% (15/20 files)
# Cleaning complete!
```

### Error Recovery

```bash
# If cleaning fails mid-operation
/elixir-clean --build
# Error: Permission denied on _build/dev/lib/myapp/ebin
# Attempting to recover...
# Recovery complete, some files may remain
```

## Integration

### Makefile Integration

```makefile
# Makefile
clean:
	/elixir-clean --build

clean-all:
	/elixir-clean --all

clean-deps:
	/elixir-clean --deps
```

### CI/CD Pipeline

```yaml
# GitHub Actions
- name: Clean before build
  run: /elixir-clean --build

- name: Clean cache
  run: |
    /elixir-clean --deps --dry-run
    /elixir-clean --deps
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Clean test artifacts before commit
/elixir-clean --dry-run | grep -q "test artifacts"
if [ $? -eq 0 ]; then
  echo "Cleaning test artifacts..."
  /elixir-clean 2>/dev/null
fi
```

### Scheduled Cleaning

```bash
# Weekly cleaning (add to cron)
0 3 * * 0 cd /path/to/project && /elixir-clean --build
```

## Configuration

### Project Configuration

Configure cleaning behavior via `/elixir-setup`:

```bash
/elixir-setup --configure-cleaning
```

**Configuration options:**

- Default cleaning options
- Files to always preserve
- Cache locations
- Clean frequency
- Backup settings
- Confirmation thresholds

### Ignore Patterns

Create `.cleanignore` for custom ignore patterns:

```gitignore
# .cleanignore
# Preserve these files even with --all
_build/dev/lib/myapp/priv/static/*
_build/prod/rel/myapp/releases/*

# Preserve specific cache files
.cache/important_data.json
.tmp/upload_cache/
```

### Environment-Specific Cleaning

```bash
# Development (light cleaning)
/elixir-clean

# Testing (clean test artifacts)
/elixir-clean --build

# Production (thorough cleaning)
/elixir-clean --all
```

## Best Practices

### 1. Regular Maintenance

```bash
# Weekly maintenance
0 2 * * 0 /elixir-clean --build

# Before major operations
/elixir-clean --build
/elixir-deps update --all
```

### 2. Space Management

```bash
# Monitor disk usage
du -sh _build deps | sort -h

# Clean when over limit
if [ $(du -s _build | cut -f1) -gt 1000000 ]; then
  /elixir-clean --build
fi
```

### 3. Build Consistency

```bash
# Ensure clean builds for releases
/elixir-clean --all
/elixir-compile --env prod
```

### 4. Team Coordination

```bash
# Clean before pushing
/elixir-clean --dry-run
git status

# Clean after pulling
git pull
/elixir-clean --deps
```

### 5. Documentation

```bash
# Document cleaning procedures
echo "Run /elixir-clean --build after dependency changes" >> README.md
```

## Common Issues and Solutions

### Permission Errors

```bash
# Run with appropriate permissions
sudo /elixir-clean --build  # Not recommended

# Fix permissions instead
chmod -R u+w _build
/elixir-clean --build
```

### Insufficient Space

```bash
# Check available space
df -h .

# Clean incrementally
/elixir-clean --build
/elixir-clean --deps
```

### Long Cleaning Times

```bash
# Use verbose mode to monitor progress
/elixir-clean --verbose

# Clean specific targets only
/elixir-clean --build  # Skip dependencies
```

### Partial Cleaning

```bash
# If cleaning was interrupted
/elixir-clean --build  # Resume cleaning

# Manual cleanup if needed
rm -rf _build/dev/lib/problematic_app
```

## Exit Codes

| Code | Description                            |
| ---- | -------------------------------------- |
| 0    | Success - Cleaning completed           |
| 1    | Failure - Cleaning error               |
| 2    | Dry run completed (no cleaning)        |
| 3    | User cancelled (confirmation declined) |
| 4    | Configuration error                    |

## Related Commands

- `/elixir-compile` - Compile after cleaning
- `/elixir-deps` - Update dependencies after cleaning
- `/elixir-test` - Run tests after cleaning
- `/elixir-setup` - Configure cleaning behavior

## Environment Variables

- `ELIXIR_CLEAN_VERBOSE` - Default verbose mode
- `ELIXIR_CLEAN_CONFIRM` - Auto-confirm prompts
- `ELIXIR_CLEAN_BACKUP` - Enable/disable backups
- `ELIXIR_CLEAN_IGNORE` - Custom ignore file
- `ELIXIR_CLEAN_TIMEOUT` - Cleaning timeout

## Notes

- Source code is never deleted
- Cleaning is generally safe but can be time-consuming
- Dependencies will be re-fetched if cleaned
- Build times increase after cleaning dependencies
- Regular cleaning improves build consistency
- Dry-run mode is recommended for first-time use
- Verbose mode shows detailed progress
- Backups are created for important files
- Confirmation prevents accidental data loss

## Resources

- [Mix Clean Task](https://hexdocs.pm/mix/Mix.Tasks.Clean.html)
- [Hex Cache Management](https://hex.pm/docs/usage)
- [Rebar3 Cache](https://rebar3.org/docs/configuration/)
- [Disk Space Management](https://hexdocs.pm/phoenix/asset_management.html)
- [Build Artifacts](https://hexdocs.pm/mix/Mix.Tasks.Compile.html)
