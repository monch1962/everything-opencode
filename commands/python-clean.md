# Python Clean Command (`/python-clean`)

## Overview

The `/python-clean` command removes Python build artifacts, cache files, and temporary files to free up disk space and ensure clean builds. It's essential for maintaining a clean development environment and avoiding issues caused by stale cache files.

## Features

- **Comprehensive Cleaning**: Removes all common Python build artifacts and cache files
- **Selective Cleaning**: Target specific types of files (cache, build, test, etc.)
- **Safety First**: Dry-run mode and confirmation prompts prevent accidental deletions
- **Framework Aware**: Handles framework-specific build artifacts (Django, Flask, etc.)
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Why Clean Python Files?

Python generates various temporary files that can cause issues:

1. **Cache Conflicts**: Stale `.pyc` files can cause import errors
2. **Disk Space**: Build artifacts can consume significant space
3. **Build Issues**: Old build files can interfere with new builds
4. **Test Pollution**: Previous test results can affect new tests
5. **Version Control**: Avoid committing generated files to Git

## Usage

### Basic Usage

```bash
# Clean everything (default)
/python-clean

# Dry run - show what would be cleaned
/python-clean --dry-run

# Clean with confirmation prompt
/python-clean --confirm
```

### Command Options

| Option            | Description                     | Example           |
| ----------------- | ------------------------------- | ----------------- |
| `--all`, `-a`     | Clean everything (default)      | `--all`           |
| `--cache-only`    | Clean only cache files          | `--cache-only`    |
| `--build-only`    | Clean only build directories    | `--build-only`    |
| `--dist-only`     | Clean only dist directories     | `--dist-only`     |
| `--egg-only`      | Clean only egg-info directories | `--egg-only`      |
| `--coverage-only` | Clean only coverage files       | `--coverage-only` |
| `--test-only`     | Clean only test artifacts       | `--test-only`     |
| `--dry-run`       | Show what would be cleaned      | `--dry-run`       |
| `--verbose`, `-v` | Verbose output                  | `--verbose`       |
| `--quiet`, `-q`   | Minimal output                  | `--quiet`         |
| `--confirm`, `-c` | Ask for confirmation            | `--confirm`       |
| `--setup`         | Show setup instructions         | `--setup`         |
| `--help`, `-h`    | Show help                       | `--help`          |

## What Gets Cleaned

### Cache Files (Default)

- `__pycache__/` directories
- `*.pyc` files (compiled Python bytecode)
- `*.pyo` files (optimized bytecode)
- `*.pyd` files (Windows DLLs)

### Build Artifacts

- `build/` directories (setuptools/distutils builds)
- `dist/` directories (distribution packages)
- `*.egg-info/` directories (egg metadata)
- `*.egg` files (egg distributions)

### Test Artifacts

- `.coverage` files (coverage.py data)
- `htmlcov/` directories (HTML coverage reports)
- `coverage.xml` files (XML coverage reports)
- `.pytest_cache/` directories (pytest cache)
- `test-results.xml` files (test reports)
- `.tox/` directories (tox environments)

### Framework-Specific

- `migrations/__pycache__/` (Django migrations cache)
- `staticfiles/` (Django collected static files, if empty)
- `media/` cache files (if temporary)

## Examples

### Common Use Cases

```bash
# Before committing code
/python-clean --cache-only --test-only

# Before building a package
/python-clean --build-only --dist-only --egg-only

# Before running tests
/python-clean --test-only --coverage-only

# Free up disk space
/python-clean --all --verbose

# Safe cleanup with preview
/python-clean --dry-run --confirm
```

### Development Workflow

```bash
# 1. Clean before starting new feature
/python-clean

# 2. Develop and test
/python-test
/python-lint

# 3. Clean before commit
/python-clean --cache-only --test-only

# 4. Commit code
git add .
git commit -m "New feature"
```

### CI/CD Integration

```bash
# In CI pipeline before build
/python-clean --build-only --dist-only

# After tests to clean up
/python-clean --test-only --coverage-only

# Complete cleanup job
name: Cleanup
run: /python-clean --all --quiet
```

## Safety Features

### Dry Run Mode

```bash
# Preview what will be deleted
/python-clean --dry-run --verbose

# Output example:
📋 Dry run - showing what would be cleaned:
==========================================
• __pycache__ directories
• *.pyc files
• *.pyo files
• *.pyd files
• build/ directories
• dist/ directories
• *.egg-info directories
• .coverage files
• htmlcov/ directories
• .pytest_cache/ directories
==========================================
✅ Dry run completed - no files were deleted
```

### Confirmation Prompt

```bash
/python-clean --confirm

# Output:
Are you sure you want to clean Python build artifacts? (y/N): y
🧹 Cleaning Python build artifacts...
✅ Clean completed successfully
```

### What's NOT Cleaned

The command is designed to be safe and never deletes:

- Source code files (`*.py`)
- Configuration files (`*.json`, `*.yaml`, `*.toml`, `*.ini`)
- Documentation files (`*.md`, `*.rst`)
- Data files (`*.csv`, `*.json`, `*.xml`)
- Virtual environment directories (unless empty `__pycache__` inside)
- Git repository files (`.git/`)

## Best Practices

### 1. Regular Cleaning

```bash
# Add to pre-commit hook
#!/bin/bash
/python-clean --cache-only --test-only --quiet

# Or schedule regular cleanup
0 2 * * * /python-clean --all --quiet  # Daily at 2 AM
```

### 2. Project-Specific Cleaning

```bash
# Create project-specific clean script
#!/bin/bash
# clean.sh
/python-clean --cache-only
/python-clean --test-only
find . -name "*.log" -delete
find . -name "*.tmp" -delete
```

### 3. Framework-Specific Patterns

```bash
# Django projects
/python-clean --cache-only
find . -path "*/migrations/__pycache__/*" -delete
find . -name "*.pyc" -path "*/migrations/*" -delete

# Package development
/python-clean --build-only --dist-only --egg-only
rm -rf .eggs/ .tox/ .pytest_cache/

# Data science projects
find . -name "*.ipynb_checkpoints" -type d -exec rm -rf {} +
find . -name ".ipynb_checkpoints" -type d -exec rm -rf {} +
```

### 4. Integration with Build Tools

```bash
# setup.py integration
from setuptools import setup
from setuptools.command.clean import clean as _clean

class CleanCommand(_clean):
    def run(self):
        import subprocess
        subprocess.run(['/python-clean', '--all', '--quiet'], check=False)
        super().run()

setup(
    cmdclass={'clean': CleanCommand},
    # ... other setup config
)

# Makefile integration
clean:
    /python-clean --all --quiet
    rm -f *.log
    rm -f *.pid

distclean: clean
    rm -rf venv/
    rm -rf .venv/
```

## Troubleshooting

### Common Issues

1. **Permission denied errors**

   ```
   rm: cannot remove '...': Permission denied
   ```

   **Solution**: Run with appropriate permissions or use `sudo` (with caution)

2. **Files reappear after cleaning**

   ```
   Cache files regenerated immediately
   ```

   **Solution**: Python regenerates `.pyc` files on import. This is normal.

3. **Slow cleaning on large projects**

   ```
   Cleaning takes a long time
   ```

   **Solution**: Use selective cleaning or exclude large directories

4. **Accidental deletion (rare)**
   ```
   Important file was deleted
   ```
   **Solution**: Always use `--dry-run` first, keep backups, use version control

### Performance Tips

```bash
# Clean only recent cache files (last 7 days)
find . -name "__pycache__" -type d -mtime +7 -exec rm -rf {} +
find . -name "*.pyc" -type f -mtime +7 -delete

# Exclude large directories
/python-clean --cache-only --verbose | grep -v "/large_dataset/"

# Parallel cleaning (Linux/macOS)
find . -name "__pycache__" -type d -print0 | xargs -0 -P4 rm -rf
```

## Integration with Other Commands

### Combined Workflow

```bash
# Complete development cycle
/python-clean --cache-only --test-only
/python-test --coverage
/python-lint --fix
/python-security --all
/python-clean --coverage-only
```

### Pre-commit Hook Example

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Clean cache files
/python-clean --cache-only --quiet

# Run tests
if ! /python-test --quiet; then
    echo "❌ Tests failed"
    exit 1
fi

# Run linter
if ! /python-lint --check; then
    echo "❌ Lint checks failed"
    exit 1
fi

echo "✅ Pre-commit checks passed"
```

## Related Commands

- `/python-setup` - Configure Python project
- `/python-test` - Run tests (creates test artifacts)
- `/python-lint` - Code quality checks
- `/python-deps` - Dependency management
- `/python-security` - Security scanning
- `/python-run` - Run applications (may create cache files)

## References

- [Python `.pyc` Files](https://docs.python.org/3/library/py_compile.html)
- [setuptools clean command](https://setuptools.pypa.io/en/latest/userguide/commands.html#clean-command)
- [pytest cache](https://docs.pytest.org/en/stable/cache.html)
- [coverage.py data files](https://coverage.readthedocs.io/en/stable/cmd.html#data-file)
- [tox environments](https://tox.wiki/en/latest/config.html#envlist)
