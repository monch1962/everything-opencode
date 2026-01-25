# 🐍 Python Integration for opencode

## Overview

This Python integration adds deep, interactive Python project configuration to opencode. It provides:

- **Smart project detection** with confidence scoring
- **Interactive configuration wizard** for Python projects
- **Tool detection** for Python development tools
- **Project-specific configuration** stored in `.opencode/project-config.json`
- **Support for multiple Python project types** (FastAPI, Django, Flask, Data Science, ML, CLI, Library)

## Architecture

```
everything-opencode/
├── scripts/interactive/          # Core interactive system
│   ├── prompts.js               # Interactive prompts (color-coded UX)
│   ├── config-manager.js        # Configuration management
│   └── project-detector.js      # Language detection with confidence scoring
├── languages/python/            # Python-specific wizards
│   └── config-wizard.js         # Python configuration wizard
├── scripts/python/              # Python utilities
│   └── tool-detector.js         # Python tool detection
├── scripts/interactive-setup.js # Main setup script
└── examples/python-projects/    # Project templates (coming soon)
```

## Features

### 1. Smart Project Detection
- Detects 5 languages: Python, TypeScript, Go, Rust, PineScript
- Confidence-based scoring (0-0.95)
- Multiple indicators per language
- Python project type detection (FastAPI, Django, Flask, etc.)

### 2. Interactive Configuration
- Color-coded prompts for better UX
- Multiple choice with descriptions
- Yes/no confirmations with defaults
- Text input with validation
- Progress indicators

### 3. Python-Specific Features
- **Dependency manager selection**: uv, poetry, pip, conda
- **Testing framework**: pytest, unittest
- **Linting**: ruff, flake8, pylint
- **Formatting**: ruff, black, autopep8
- **Type checking**: pyright, mypy
- **Project type support**: FastAPI, Django, Flask, Data Science, ML, CLI, Library

### 4. Tool Detection
- Detects 30+ Python tools and libraries
- Version checking
- Installation guides per platform (macOS, Linux, Windows)
- Compatibility checking

## Usage

### Quick Start

```bash
# Run interactive setup
node scripts/interactive-setup.js

# Quick setup (automatic detection)
node scripts/interactive-setup.js quick

# Show current configuration
node scripts/interactive-setup.js config

# Detect project languages
node scripts/interactive-setup.js detect

# Detect installed tools
node scripts/interactive-setup.js tools
```

### Python-Specific Setup

```bash
# Run Python configuration wizard
node languages/python/config-wizard.js

# Quick Python setup
node languages/python/config-wizard.js --quick

# Detect Python tools
node scripts/python/tool-detector.js
```

## Configuration

Configuration is stored in `.opencode/project-config.json`:

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
      "uv": { "installed": true, "version": "0.1.0" }
    },
    "userApproved": true
  }
}
```

## Project Types Supported

### 1. FastAPI Projects
- Automatic API documentation (Swagger/ReDoc)
- Dependency injection support
- WebSocket support detection

### 2. Django Projects
- Django admin detection
- App structure analysis
- Database configuration hints

### 3. Flask Projects
- Blueprint detection
- Extension analysis
- Template structure

### 4. Data Science Projects
- Jupyter notebook support
- pandas/numpy/matplotlib detection
- Data pipeline structure

### 5. Machine Learning Projects
- PyTorch/TensorFlow detection
- Model training pipeline analysis
- Experiment tracking hints

### 6. CLI Tools
- Click/Typer/argparse detection
- Command structure analysis
- Argument parsing setup

### 7. Libraries
- Package structure validation
- Documentation generation hints
- Testing setup recommendations

## Tool Detection

The system detects:
- **Python interpreters**: python, python3
- **Dependency managers**: uv, poetry, pip, conda
- **Testing frameworks**: pytest, unittest
- **Linting/formatting**: ruff, black, flake8, pylint, autopep8, isort
- **Type checking**: pyright, mypy
- **Build tools**: setuptools, wheel, build
- **Virtual environments**: venv, virtualenv
- **Frameworks**: FastAPI, Django, Flask, pandas, numpy, torch, tensorflow, click, typer

## Integration with opencode

### Planned Commands
- `/python-test` - Run tests with configured test runner
- `/python-lint` - Run linter and formatter
- `/python-typecheck` - Run type checker
- `/python-deps` - Manage dependencies
- `/python-setup` - Re-run configuration wizard

### Hooks Integration
- Pre-commit hooks for Python projects
- Pre-push hooks for testing
- CI/CD integration hints

## Development

### Adding New Python Tools

1. Add tool definition to `scripts/python/tool-detector.js`:
```javascript
toolName: {
  command: 'tool --version',
  description: 'Tool description',
  installGuide: {
    macos: 'brew install tool',
    linux: 'apt-get install tool',
    windows: 'Download from...'
  },
  priority: 5
}
```

2. Add to configuration schema in `scripts/interactive/config-manager.js`

3. Add to wizard options in `languages/python/config-wizard.js`

### Adding New Project Types

1. Add detection logic to `scripts/interactive/project-detector.js`
2. Add configuration options to wizard
3. Add project templates to `examples/python-projects/`

## Testing

```bash
# Run test suite
node test-python-setup.js

# Create test project
mkdir test-project && cd test-project
echo 'print("Hello")' > main.py
node ../scripts/interactive-setup.js
```

## Next Steps

### Phase 2: Python Commands
- Implement `/python-test`, `/python-lint`, etc.
- Create command definitions in `commands/` directory
- Integrate with existing opencode command system

### Phase 3: Project Templates
- Create example projects in `examples/python-projects/`
- FastAPI production template
- Data science pipeline template
- Trading bot template (PineScript bridge)

### Phase 4: Skills and Agents
- Create Python skills in `skills/python-development/`
- Build Python agents in `agents/` directory
- Integrate with AI assistance

## Contributing

1. Follow existing code patterns and conventions
2. Add tests for new functionality
3. Update documentation
4. Use the interactive prompt system for user interaction
5. Store configurations in `.opencode/project-config.json`

## License

Part of the everything-opencode project.