# Python Command Runner

## Overview

The `python-command-runner` is the base class for executing Python commands based on project configuration. It provides a unified interface for running Python tools, managing dependencies, and handling errors consistently across all Python commands in the everything-opencode system.

## Features

- **Project detection**: Automatically detects Python projects and frameworks
- **Tool management**: Checks for required Python tools and dependencies
- **Environment handling**: Manages Python environment variables and paths
- **Error recovery**: Provides comprehensive error handling with recovery suggestions
- **Configuration integration**: Works with project configuration from `python-setup`
- **Cross-platform support**: Works on Windows, macOS, and Linux

## Architecture

The Python command runner serves as the foundation for all Python-specific commands:

```
Python Command Runner (Base Class)
├── Python Setup Command
├── Python Dependencies Command
├── Python Test Command
├── Python Lint Command
└── Python Typecheck Command
```

## Usage

The command runner is not invoked directly but is used by specific Python commands:

```bash
# These commands use the Python command runner internally:
python-setup      # Configure Python project
python-deps       # Manage Python dependencies
python-test       # Run Python tests
python-lint       # Lint Python code
python-typecheck  # Type check Python code
```

## Configuration

The command runner reads configuration from the project's `.opencode/config.json`:

### Example Configuration

```json
{
  "python": {
    "version": "3.11",
    "interpreter": "python3",
    "packageManager": "pip",
    "virtualEnv": ".venv",
    "testRunner": "pytest",
    "linter": "ruff",
    "formatter": "black",
    "typeChecker": "mypy",
    "tools": {
      "python3": {
        "installed": true,
        "version": "3.11.5",
        "path": "/usr/bin/python3"
      },
      "pip": {
        "installed": true,
        "version": "23.2.1"
      },
      "pytest": {
        "installed": true,
        "version": "7.4.2"
      }
    },
    "paths": {
      "source": "src",
      "tests": "tests",
      "requirements": "requirements.txt",
      "pyproject": "pyproject.toml"
    }
  }
}
```

## Methods

### Core Methods

1. **`initialize()`**: Loads configuration and validates project setup
2. **`checkTool(toolName, required)`**: Verifies if a tool is installed
3. **`getPythonExecutable()`**: Returns the appropriate Python executable
4. **`executeCommand(command, args, options)`**: Executes shell commands
5. **`executePythonModule(module, args, options)`**: Runs Python modules with `-m`

### Project Detection

```javascript
// Detects project type and framework
const projectInfo = ProjectUtils.detectProjectType(projectPath);

// Returns:
{
  type: 'python',
  confidence: 0.95,
  framework: 'django', // or 'flask', 'fastapi', etc.
  languages: ['python'],
  // ... other metadata
}
```

### Error Handling

The command runner provides comprehensive error handling:

```javascript
try {
  await runner.executeCommand('python', ['-m', 'pytest']);
} catch (error) {
  // Enhanced error with context and recovery steps
  console.error(error.errorInfo.userMessage);
  error.errorInfo.recoverySteps.forEach((step) => {
    console.log(`  • ${step}`);
  });
}
```

## Integration

### With Python Setup

```javascript
// python-setup.js uses the command runner
const runner = new PythonCommandRunner();
await runner.initialize();
await runner.checkTool('python3');
// ... setup logic
```

### With Python Test

```javascript
// python-test.js extends the command runner
class PythonTestCommand extends PythonCommandRunner {
  async runTests(options) {
    await this.initialize();
    const testRunner = this.pythonConfig.testRunner || 'pytest';
    await this.checkTool(testRunner);
    return this.executePythonModule(testRunner, args);
  }
}
```

### With Python Lint

```javascript
// python-lint.js uses the command runner
const runner = new PythonCommandRunner();
await runner.initialize();
const linter = runner.pythonConfig.linter || 'ruff';
await runner.checkTool(linter);
await runner.executePythonModule(linter, ['--check', '.']);
```

## Error Recovery

The command runner provides intelligent error recovery suggestions:

### Common Issues and Solutions

#### Python Not Found

```
❌ Python not found. Install Python 3.8+ and run /python-setup.

💡 Recovery steps:
  1. Install Python 3.8 or later from python.org
  2. Ensure python3 is in your PATH
  3. Run /python-setup to configure your project
```

#### Missing Dependencies

```
❌ ModuleNotFoundError: No module named 'pytest'

💡 Recovery steps:
  1. Install pytest: pip install pytest
  2. Run /python-deps to install all dependencies
  3. Check your virtual environment activation
```

#### Configuration Issues

```
❌ Project not configured. Run /python-setup first.

💡 Recovery steps:
  1. Run /python-setup to configure your project
  2. Verify .opencode/config.json exists
  3. Check file permissions
```

## Best Practices

### 1. Always Initialize First

```javascript
const runner = new PythonCommandRunner();
await runner.initialize(); // Required before any operations
```

### 2. Check Required Tools

```javascript
// Check for essential tools
await runner.checkTool('python3', true);
await runner.checkTool('pip', true);

// Check for optional tools
const hasPytest = await runner.checkTool('pytest', false);
```

### 3. Use executePythonModule for Python Tools

```javascript
// Good: Uses Python module system
await runner.executePythonModule('pytest', ['tests/']);

// Avoid: Direct command execution
await runner.executeCommand('pytest', ['tests/']);
```

### 4. Handle Errors Gracefully

```javascript
try {
  await runner.executePythonModule('mypy', ['.']);
} catch (error) {
  if (error.errorInfo?.category === 'configuration') {
    // Configuration errors
    console.log('Run /python-setup to fix configuration');
  } else if (error.errorInfo?.category === 'dependency') {
    // Dependency errors
    console.log('Run /python-deps to install missing packages');
  }
  throw error; // Re-throw for higher-level handling
}
```

## Extending the Command Runner

### Creating New Commands

```javascript
// Example: Custom Python command
const { PythonCommandRunner } = require('./python-command-runner');

class CustomPythonCommand extends PythonCommandRunner {
  async runCustomOperation(args = []) {
    await this.initialize();

    // Custom logic using base class methods
    await this.checkTool('custom-tool');
    return this.executePythonModule('custom_tool', args);
  }
}

module.exports = { CustomPythonCommand };
```

### Adding New Error Handlers

```javascript
// Extend error handling for specific tools
class EnhancedPythonCommandRunner extends PythonCommandRunner {
  async _executeCommandWithErrorHandling(command, args, options) {
    try {
      return await super._executeCommandWithErrorHandling(command, args, options);
    } catch (error) {
      // Add custom error handling
      if (command === 'black') {
        error.errorInfo.recoverySteps.push('Run black --check to see formatting issues');
      }
      throw error;
    }
  }
}
```

## Testing

The command runner includes built-in testing support:

```javascript
// Test initialization
const runner = new PythonCommandRunner(testProjectPath);
await runner.initialize();
expect(runner.pythonConfig).toBeDefined();

// Test tool checking
const hasPython = await runner.checkTool('python3', false);
expect(hasPython).toBe(true);

// Test command execution
const result = await runner.executeCommand('python', ['--version']);
expect(result.success).toBe(true);
```

## Performance Considerations

1. **Lazy Initialization**: Configuration is loaded only when needed
2. **Tool Caching**: Tool detection results are cached
3. **Parallel Execution**: Multiple commands can run in parallel
4. **Resource Management**: Proper cleanup of spawned processes

## Security

- **Path sanitization**: All paths are validated and sanitized
- **Command injection prevention**: Arguments are properly escaped
- **Environment isolation**: Commands run in isolated environments
- **Permission checks**: File and directory permissions are verified

## Related Components

- **Python Tool Detector**: Detects installed Python tools and versions
- **Config Manager**: Manages project configuration
- **Error Handler**: Provides consistent error handling across languages
- **Project Utils**: Detects project types and frameworks

## Notes

- Requires Python 3.8 or later
- Works with virtual environments (venv, conda, pipenv)
- Supports multiple Python package managers (pip, poetry, pdm)
- Compatible with major Python frameworks (Django, Flask, FastAPI)
- Integrates with common Python tools (pytest, black, ruff, mypy)
