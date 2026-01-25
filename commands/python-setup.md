# /python-setup

Configure Python project for opencode integration.

## Description

Interactive setup wizard for configuring Python projects. Detects project type, tools, and sets up appropriate configuration for opencode integration.

## Usage

```bash
/python-setup [options]
```

## Options

- `--quick` - Quick setup with automatic detection
- `--reconfigure` - Force reconfiguration even if already configured
- `--project-type <type>` - Specify project type (overrides detection)
- `--manager <name>` - Specify dependency manager
- `--test-runner <name>` - Specify test runner
- `--linter <name>` - Specify linter
- `--formatter <name>` - Specify formatter
- `--type-checker <name>` - Specify type checker
- `--no-prompt` - Use defaults without prompting
- `--verbose` - Verbose output
- `--config <path>` - Save configuration to specific path

## Examples

```bash
# Interactive setup wizard
/python-setup

# Quick automatic setup
/python-setup --quick

# Force reconfiguration
/python-setup --reconfigure

# Specify project type
/python-setup --project-type fastapi

# Use specific tools
/python-setup --manager uv --test-runner pytest --linter ruff

# Non-interactive with defaults
/python-setup --no-prompt
```

## Setup Process

### 1. Project Detection
- Detects programming languages (Python priority)
- Identifies Python project type:
  - FastAPI web application
  - Django web framework
  - Flask microframework
  - Data science/analysis
  - Machine learning
  - CLI tool
  - Library/package
- Calculates confidence scores

### 2. Tool Detection
- Detects installed Python tools:
  - Python interpreters (python, python3)
  - Dependency managers (uv, poetry, pip, conda)
  - Testing frameworks (pytest, unittest)
  - Linting/formatting tools (ruff, black, flake8, etc.)
  - Type checkers (pyright, mypy)
  - Build tools (setuptools, wheel, build)
- Checks versions and compatibility

### 3. Interactive Configuration
- Project type confirmation
- Dependency manager selection
- Test runner selection
- Linter selection
- Formatter selection
- Type checker selection
- Project-specific options:
  - FastAPI: API documentation, WebSocket support
  - Data Science: Jupyter notebook support
  - CLI: Framework selection (click, typer, argparse)
  - Library: Package structure

### 4. Configuration Saving
- Saves to `.opencode/project-config.json`
- Sets Python as primary language
- Stores tool detection results
- Requires user approval

## Configuration File

Generated configuration example:

```json
{
  "project": "/path/to/project",
  "configuredAt": "2025-01-25T10:30:00.000Z",
  "primaryLanguage": "python",
  "python": {
    "projectType": "fastapi",
    "dependencyManager": "uv",
    "testRunner": "pytest",
    "linter": "ruff",
    "formatter": "ruff",
    "typeChecker": "pyright",
    "tools": {
      "python": { "installed": true, "version": "3.11.0" },
      "uv": { "installed": true, "version": "0.1.0" },
      "pytest": { "installed": true, "version": "7.4.0" },
      "ruff": { "installed": true, "version": "0.1.0" }
    },
    "fastapiOptions": {
      "includeDocs": true,
      "includeWebSocket": false
    },
    "userApproved": true
  }
}
```

## Project Types

### FastAPI Projects
- Automatic API documentation (Swagger/ReDoc)
- WebSocket support detection
- Dependency injection setup
- Database configuration hints

### Django Projects
- Django admin setup
- App structure configuration
- Database migration setup
- Static file configuration

### Flask Projects
- Blueprint structure
- Extension configuration
- Template engine setup
- Development server options

### Data Science Projects
- Jupyter notebook support
- Data visualization libraries
- Experiment tracking
- Model serialization

### Machine Learning Projects
- Framework selection (PyTorch/TensorFlow)
- Training pipeline setup
- Model evaluation
- Deployment configuration

### CLI Tools
- Framework selection (click, typer, argparse)
- Command structure
- Argument parsing
- Help text generation

### Libraries
- Package structure
- Documentation setup
- Testing configuration
- Publishing preparation

## Tool Recommendations

### New Projects
- **Dependency manager**: uv (fast, modern)
- **Test runner**: pytest (feature-rich)
- **Linter**: ruff (extremely fast)
- **Formatter**: ruff format (consistent with linting)
- **Type checker**: pyright (fast, good editor integration)

### Existing Projects
- Use detected tools if available
- Migrate gradually to recommended tools
- Maintain compatibility with existing workflow

## Integration

### With opencode Commands
- Enables `/python-test`, `/python-lint`, etc.
- Provides context for AI assistance
- Customizes command behavior per project

### With Development Workflow
- Git hooks integration
- CI/CD pipeline configuration
- Editor/IDE setup recommendations
- Team collaboration standards

### With Virtual Environments
- Automatic virtual environment detection
- Creation guidance if needed
- Activation scripts generation

## Exit Codes

- `0` - Setup completed successfully
- `1` - Setup failed
- `2` - User cancelled
- `3` - Not a Python project
- `4` - Configuration error

## Implementation

The command:
1. Runs project detection with confidence scoring
2. Detects installed Python tools
3. Presents interactive configuration wizard
4. Saves configuration to `.opencode/project-config.json`
5. Provides next steps and recommendations

## Next Steps After Setup

### Available Commands
```bash
# Run tests
/python-test

# Lint and format code
/python-lint

# Type checking
/python-typecheck

# Manage dependencies
/python-deps

# Reconfigure project
/python-setup
```

### Project Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Install dependencies
/python-deps install

# Initialize git (if not already)
git init
```

## Notes

- Configuration is project-specific
- Can be reconfigured at any time
- Tools can be installed later
- Configuration can be shared across team
- Works with existing projects

## Troubleshooting

### Detection Issues
```bash
# Force specific project type
/python-setup --project-type fastapi

# Manual tool selection
/python-setup --manager pip --test-runner unittest
```

### Configuration Issues
```bash
# View current configuration
cat .opencode/project-config.json

# Remove configuration
rm .opencode/project-config.json

# Reconfigure
/python-setup --reconfigure
```

### Tool Installation
```bash
# Install recommended tools
curl -LsSf https://astral.sh/uv/install.sh | sh
pip install pytest ruff pyright
```

## See Also

- `/python-test` - Run tests
- `/python-lint` - Run linter and formatter
- `/python-typecheck` - Run type checker
- `/python-deps` - Manage dependencies
- `/setup` - General project setup