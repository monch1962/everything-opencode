# /python-deps

Manage Python dependencies based on project configuration.

## Description

Manages Python dependencies using the configured dependency manager (uv, poetry, pip, conda). Supports installing, updating, removing, and listing dependencies with lock file management.

## Usage

```bash
/python-deps [command] [options]
```

## Commands

### Install
```bash
/python-deps install [packages...]
```
Install dependencies. If no packages specified, install all from lock file.

### Add
```bash
/python-deps add <package> [--dev] [--optional] [--extras]
```
Add new dependency to project.

### Remove
```bash
/python-deps remove <package>
```
Remove dependency from project.

### Update
```bash
/python-deps update [packages...]
```
Update dependencies. If no packages specified, update all.

### List
```bash
/python-deps list [--tree] [--outdated]
```
List installed dependencies.

### Sync
```bash
/python-deps sync
```
Sync dependencies with lock file.

### Lock
```bash
/python-deps lock
```
Generate/update lock file.

### Check
```bash
/python-deps check
```
Check for dependency conflicts.

### Audit
```bash
/python-deps audit
```
Audit dependencies for security vulnerabilities.

## Options

### Dependency Options
- `--dev` - Development dependency
- `--optional` - Optional dependency
- `--extras <extras>` - Package extras
- `--group <group>` - Dependency group (poetry/uv)
- `--python <version>` - Python version constraint

### Installation Options
- `--no-dev` - Don't install development dependencies
- `--no-optional` - Don't install optional dependencies
- `--only <group>` - Only install specific group
- `--frozen` - Install exact versions from lock file
- `--upgrade` - Upgrade existing packages

### Output Options
- `--verbose` - Verbose output
- `--quiet` - Minimal output
- `--json` - Output JSON format
- `--tree` - Show dependency tree
- `--outdated` - Show outdated packages

### Configuration
- `--manager <name>` - Use specific dependency manager
- `--file <path>` - Use alternative dependency file
- `--no-lock` - Don't update lock file

## Examples

```bash
# Install all dependencies
/python-deps install

# Add new dependency
/python-deps add fastapi

# Add development dependency
/python-deps add pytest --dev

# Update all dependencies
/python-deps update

# Update specific package
/python-deps update fastapi

# List dependencies as tree
/python-deps list --tree

# Show outdated packages
/python-deps list --outdated

# Remove dependency
/python-deps remove old-package

# Sync with lock file
/python-deps sync

# Check for conflicts
/python-deps check

# Audit for security issues
/python-deps audit

# Install with specific manager
/python-deps install --manager uv
```

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "python": {
    "dependencyManager": "uv",
    "dependencyOptions": {
      "devDependencies": true,
      "lockFile": true,
      "groups": ["dev", "test", "docs"]
    }
  }
}
```

### Supported Dependency Managers

1. **uv** (recommended)
   - Modern, fast Python package manager
   - Built by Astral (makers of ruff)
   - Compatible with pip and pip-tools
   - Fast dependency resolution

2. **poetry**
   - Dependency management and packaging
   - Good for library development
   - Built-in publishing to PyPI
   - Virtual environment management

3. **pip**
   - Standard Python package installer
   - Good for simple projects
   - Wide compatibility
   - Requires virtualenv/venv separately

4. **conda**
   - Package and environment manager
   - Good for data science/ML
   - Non-Python dependencies
   - Cross-platform

## Integration

### With opencode Configuration
- Uses dependency manager from project configuration
- Respects project-specific dependency options
- Can override configuration with command-line options

### With Virtual Environments
- Automatically detects and uses virtual environment
- Can create virtual environment if needed
- Respects .python-version files

### With CI/CD
- Lock file for reproducible builds
- Security auditing
- Dependency conflict checking
- Can be integrated into build pipelines

## Exit Codes

- `0` - Success
- `1` - Command failed
- `2` - Dependency conflict
- `3` - Security vulnerability found
- `4` - Configuration error
- `5` - Manager not installed

## Implementation

The command:
1. Reads project configuration from `.opencode/project-config.json`
2. Determines dependency manager (uv/poetry/pip/conda)
3. Executes appropriate command based on subcommand
4. Handles virtual environment detection/creation
5. Captures and displays results
6. Returns appropriate exit code

## Notes

- Requires Python and configured dependency manager to be installed
- Virtual environment is recommended (autodetected)
- Lock files (uv.lock, poetry.lock, requirements.txt) are managed
- Security auditing requires additional tools (safety, pip-audit)
- Some managers have different feature sets

## Best Practices

### Version Pinning
```bash
# Pin specific version
/python-deps add fastapi==0.104.0

# Pin compatible version
/python-deps add "fastapi>=0.100.0,<0.105.0"
```

### Dependency Groups
```bash
# Development dependencies
/python-deps add pytest --dev

# Test dependencies
/python-deps add pytest-cov --group test

# Documentation dependencies
/python-deps add mkdocs --group docs
```

### Security
```bash
# Regular security audits
/python-deps audit

# Update vulnerable dependencies
/python-deps update --security
```

## Common Issues

### Manager Not Installed
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install poetry
curl -sSL https://install.python-poetry.org | python3 -
```

### Dependency Conflicts
```bash
# Check for conflicts
/python-deps check

# Try updating
/python-deps update

# Use different version constraints
```

### Slow Resolution
```bash
# Use uv (faster)
/python-deps --manager uv

# Use existing lock file
/python-deps sync
```

## See Also

- `/python-test` - Run tests
- `/python-lint` - Run linter and formatter
- `/python-typecheck` - Run type checker
- `/python-setup` - Configure Python project