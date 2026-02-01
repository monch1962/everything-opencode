# /go-clean

Clean Go build artifacts and cache.

## Description

The `/go-clean` command cleans Go build artifacts, cache, and temporary files. It provides comprehensive cleanup options for build artifacts, test cache, module cache, and other temporary files generated during Go development.

## Usage

```bash
/go-clean [options]
```

## Options

| Option            | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `--cache`         | Clean build cache                                    |
| `--testcache`     | Clean test cache                                     |
| `--modcache`      | Clean module cache                                   |
| `--all`           | Clean all caches and artifacts                       |
| `--verbose`, `-v` | Verbose output                                       |
| `--dry-run`       | Show what would be cleaned without actually cleaning |
| `--help`, `-h`    | Show help message                                    |

## Examples

```bash
# Clean build artifacts
/go-clean

# Clean build cache
/go-clean --cache

# Clean test cache
/go-clean --testcache

# Clean module cache
/go-clean --modcache

# Clean all caches and artifacts
/go-clean --all

# Verbose cleanup output
/go-clean --verbose

# Show what would be cleaned
/go-clean --dry-run
```

## What Gets Cleaned

### Build Artifacts

- `bin/` directory
- `dist/` directory
- `coverage.out` files
- `*.test` binaries
- `*.exe` binaries (Windows)
- `vendor/` directory (optional)

### Cache Directories

- **Build cache**: `$GOCACHE` (default: `~/.cache/go-build`)
- **Test cache**: `$GOTESTCACHE` (default: `~/.cache/go-test`)
- **Module cache**: `$GOMODCACHE` (default: `~/go/pkg/mod`)

## Common Use Cases

### Free Up Disk Space

```bash
# Clean all caches and artifacts
/go-clean --all
```

### Fix Build Issues

```bash
# Clean build cache and artifacts
/go-clean --cache
```

### Reset Test State

```bash
# Clean test cache
/go-clean --testcache
```

### Fresh Module Downloads

```bash
# Clean module cache for fresh downloads
/go-clean --modcache
```

## Safety Features

The command includes several safety features:

1. **Never deletes source code**
2. **Confirms before deleting large caches**
3. **Shows summary of what was cleaned**
4. **Supports dry-run mode for safety**
5. **Verbose mode shows detailed operations**

## Environment Variables

| Variable      | Description               |
| ------------- | ------------------------- |
| `GOCACHE`     | Go build cache directory  |
| `GOTESTCACHE` | Go test cache directory   |
| `GOMODCACHE`  | Go module cache directory |
| `GO111MODULE` | Go modules mode           |

## Tips

### Use Dry-Run First

```bash
# See what will be cleaned
/go-clean --dry-run
```

### Regular Maintenance

```bash
# Clean before major releases
/go-clean --all
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Clean Go Artifacts
  run: /go-clean --cache --testcache
```

### Fix Corrupted Downloads

```bash
# If you suspect corrupted module downloads
/go-clean --modcache
```

### Unexpected Test Behavior

```bash
# If tests are behaving unexpectedly
/go-clean --testcache
```

## Exit Codes

| Code | Description       |
| ---- | ----------------- |
| `0`  | Success           |
| `1`  | Clean failed      |
| `2`  | Permission issues |

## Related Commands

- `/go-build` - Build Go projects
- `/go-test` - Run Go tests
- `/go-mod` - Manage Go modules
- `/go-run` - Run Go programs

## Notes

- Regular cleanup helps maintain disk space
- Consider automating cleanup in CI/CD pipelines
- Module cache can be large (several GB)
- Test cache helps speed up test execution
- Build cache improves compilation performance
