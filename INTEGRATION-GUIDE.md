# 🐍 Python Integration Guide for opencode

## Overview

Complete Python integration system for opencode with interactive configuration, smart detection, and command automation.

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
├── scripts/commands/            # Command implementations
│   ├── python-command-runner.js # Base command runner
│   ├── python-test.js           # /python-test command
│   ├── python-lint.js           # /python-lint command
│   ├── python-typecheck.js      # /python-typecheck command
│   ├── python-deps.js           # /python-deps command
│   └── python-setup.js          # /python-setup command
├── commands/                    # Command documentation
│   ├── python-test.md
│   ├── python-lint.md
│   ├── python-typecheck.md
│   ├── python-deps.md
│   └── python-setup.md
├── examples/python-projects/    # Project templates
│   └── README.md
├── scripts/interactive-setup.js # Main setup script
├── PYTHON-INTEGRATION.md        # Technical documentation
└── INTEGRATION-GUIDE.md         # This guide
```

## Features

### 1. Smart Project Detection

- **6 languages**: Python (priority), PineScript, TypeScript, Go, Rust
- **Confidence scoring**: 0-0.95 based on multiple indicators
- **Python project types**: FastAPI, Django, Flask, Data Science, ML, CLI, Library
- **PineScript project types**: Indicator, Strategy, Library with version detection (v4, v5, v6)
- **Go project types**: CLI, Web Service, Library, Module, Workspace (Go 1.18+)
- **Automatic primary language determination**

### 2. Interactive Configuration

- **Color-coded prompts** for better UX
- **Multiple choice with descriptions** for informed decisions
- **Yes/no confirmations** with smart defaults
- **Progress indicators** for long operations
- **User approval** before saving configuration

### 3. Python Tool Detection

- **30+ tools** detected with version checking
- **Installation guides** per platform (macOS, Linux, Windows)
- **Compatibility checking** with version constraints
- **Priority-based recommendations**

### 4. Command Automation

#### Python Commands

- **/python-test** - Run tests with configured test runner
- **/python-lint** - Run linter and formatter
- **/python-typecheck** - Run type checker
- **/python-deps** - Manage dependencies
- **/python-setup** - Configure Python project

#### PineScript Commands

- **/pine-setup** - Configure PineScript project with interactive wizard
- **/pine-validate** - Validate PineScript syntax and version compatibility
- **/pine-backtest** - Run backtesting on strategies with performance metrics
- **/pine-optimize** - Optimize strategy parameters with grid search
- **/pine-convert** - Convert between PineScript versions (v4 ↔ v5 ↔ v6)
- **/pine-alert** - Configure alert system with webhooks and notifications

#### Go Commands

- **/go-setup** - Configure Go project with Go-specific improvements (CLI, web, library, workspace)
- **/go-build** - Build Go projects with cross-compilation for 5 platforms and race detection
- **/go-test** - Run comprehensive tests with coverage, benchmarks, and race detection
- **/go-lint** - Lint code with multiple linter support (golangci-lint, staticcheck, revive)
- **/go-fmt** - Format code with gofmt/goimports and formatting checks
- **/go-deps** - Manage dependencies with security auditing and update management

## Quick Start

### 1. Initial Setup

```bash
# Run interactive setup
node scripts/interactive-setup.js

# Or quick setup
node scripts/interactive-setup.js quick

# Or Python-specific setup
node scripts/commands/python-setup.js
```

### 2. Using Python Commands

```bash
# Run tests
node scripts/commands/python-test.js

# Lint and format code
node scripts/commands/python-lint.js --fix

# Type checking
node scripts/commands/python-typecheck.js --strict

# Manage dependencies
node scripts/commands/python-deps.js install
node scripts/commands/python-deps.js add fastapi --dev

# Reconfigure project
node scripts/commands/python-setup.js --reconfigure
```

### 3. Manual Testing

```bash
# Test project detection
node scripts/interactive-setup.js detect

# Test tool detection
node scripts/interactive-setup.js tools

# Show current configuration
node scripts/interactive-setup.js config
```

## Configuration

### Project Configuration File

Saved to `.opencode/project-config.json`:

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
      "ruff": { "installed": true, "version": "0.1.0" },
      "pyright": { "installed": true, "version": "1.1.0" }
    },
    "fastapiOptions": {
      "includeDocs": true
    },
    "userApproved": true
  }
}
```

### Tool Recommendations

#### New Projects

- **Dependency manager**: uv (fast, modern)
- **Test runner**: pytest (feature-rich)
- **Linter**: ruff (extremely fast)
- **Formatter**: ruff format (consistent)
- **Type checker**: pyright (fast, good editor integration)

#### Existing Projects

- Use detected tools if available
- Migrate gradually to recommended tools
- Maintain compatibility with existing workflow

## Integration with opencode

### Command Integration

The Python commands are designed to integrate with opencode's command system:

1. **Command discovery** - Commands are documented in `commands/` directory
2. **Configuration-aware** - Commands read from `.opencode/project-config.json`
3. **Interactive feedback** - Color-coded output and progress indicators
4. **Exit codes** - Proper exit codes for automation

### AI Assistant Integration

The system provides context for AI assistance:

- Project type and structure
- Installed tools and versions
- Configuration preferences
- Common patterns for the project type

### Development Workflow

```bash
# Typical workflow
/python-setup                    # Configure project
/python-deps install             # Install dependencies
/python-lint --fix               # Fix linting issues
/python-test                     # Run tests
/python-typecheck                # Type checking
# ... develop ...
/python-lint                     # Check code quality
/python-test --coverage          # Test with coverage
```

## Extending the System

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

1. Add detection logic to `scripts/interactive/project-detector.js`:

```javascript
// Check for project type markers
const hasMarkers = await checkPythonProjectType(projectPath, "new-type", [
  "import newframework",
  "from newframework import",
]);
```

2. Add configuration options to wizard
3. Add project templates to `examples/python-projects/`

### Creating New Commands

1. Create command documentation in `commands/` directory
2. Implement command in `scripts/commands/` directory
3. Use `PythonCommandRunner` base class
4. Test with sample project

## Testing

### Unit Tests

```bash
# Test project detection
node -e "const ProjectDetector = require('./scripts/interactive/project-detector'); const d = new ProjectDetector(); d.getProjectSummary().then(console.log)"

# Test tool detection
node -e "const PythonToolDetector = require('./scripts/python/tool-detector'); const d = new PythonToolDetector(); d.detectAll().then(r => d.printResults(r))"

# Test command runner
node scripts/commands/python-test.js --help
```

### Integration Tests

1. Create test Python project
2. Run `/python-setup` to configure
3. Test each command functionality
4. Verify configuration persistence

## Performance Considerations

### Detection Performance

- **File scanning**: Limited to first 10 Python files for import detection
- **Glob patterns**: Efficient file pattern matching
- **Caching**: Configuration cached after first detection
- **Parallel detection**: Language detectors run independently

### Command Performance

- **Lazy initialization**: Configuration loaded only when needed
- **Tool checking**: Tools checked once per command
- **Parallel execution**: Where supported (test parallelization)
- **Incremental checking**: `--diff` option for changed files only

## Security

### Configuration Security

- **User approval**: Configurations only saved with user consent
- **No secrets**: Configuration files don't contain secrets
- **Validation**: JSON schema validation for configuration
- **Import/export**: Safe configuration sharing

### Command Security

- **Command validation**: Validate commands before execution
- **No arbitrary execution**: Commands are predefined
- **Environment isolation**: Commands run in project directory
- **Exit code handling**: Proper error reporting

## Troubleshooting

### Common Issues

#### Project Not Detected

```bash
# Force Python project type
node scripts/commands/python-setup.js --project-type python

# Check detection manually
node scripts/interactive-setup.js detect
```

#### Tools Not Found

```bash
# Detect tools manually
node scripts/interactive-setup.js tools

# Install missing tools
curl -LsSf https://astral.sh/uv/install.sh | sh
pip install pytest ruff pyright
```

#### Configuration Issues

```bash
# View current configuration
cat .opencode/project-config.json

# Remove and reconfigure
rm .opencode/project-config.json
node scripts/commands/python-setup.js
```

#### Command Execution Issues

```bash
# Test with --help
node scripts/commands/python-test.js --help

# Check Python installation
python --version

# Verify virtual environment
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

### Debug Mode

```bash
# Verbose output
node scripts/commands/python-test.js --verbose

# Debug initialization
node -e "const runner = require('./scripts/commands/python-command-runner'); new runner().initialize().catch(console.error)"
```

## Future Enhancements

### Phase 3: Advanced Features

1. **Python skills** - AI assistance patterns for Python projects
2. **Python agents** - Specialized agents for different project types
3. **Template generation** - Code generation from templates
4. **Migration tools** - Tool migration assistance

### Phase 4: Ecosystem Integration

1. **CI/CD integration** - GitHub Actions, GitLab CI templates
2. **Editor integration** - VS Code, PyCharm configuration
3. **Package publishing** - PyPI publishing assistance
4. **Documentation generation** - Auto-documentation tools

### Phase 5: Multi-language Support

1. **TypeScript integration** - Node.js/TypeScript project support
2. **Go integration** - Go project configuration
3. **Rust integration** - Rust project setup
4. **PineScript integration** - TradingView strategy development

## Contributing

### Development Guidelines

1. **Follow existing patterns** - Maintain consistency
2. **Add tests** - Test new functionality
3. **Update documentation** - Keep docs current
4. **Use interactive prompts** - For user interaction
5. **Store configurations properly** - In `.opencode/project-config.json`

### Code Style

- **JavaScript**: ES6+ with async/await
- **Python**: PEP 8 with type hints (for templates)
- **Documentation**: Markdown with examples
- **Error handling**: Graceful degradation with clear messages

### Testing Strategy

1. **Unit tests** - Individual component testing
2. **Integration tests** - End-to-end workflow testing
3. **Manual testing** - Interactive testing with sample projects
4. **Documentation testing** - Verify examples work

## Support

### Getting Help

1. **Check documentation** - `PYTHON-INTEGRATION.md` and `INTEGRATION-GUIDE.md`
2. **Test commands** - Use `--help` flag for command usage
3. **Examine configuration** - Check `.opencode/project-config.json`
4. **Create test case** - Reproduce issue with minimal example

### Reporting Issues

1. **Describe the problem** - What happened vs expected
2. **Include configuration** - Project type and tools
3. **Provide reproduction steps** - How to reproduce the issue
4. **Share error messages** - Complete error output

## License

Part of the everything-opencode project. See project LICENSE for details.

---

**🎉 Python Integration Complete!** The system is ready for use and extensible for future enhancements.
