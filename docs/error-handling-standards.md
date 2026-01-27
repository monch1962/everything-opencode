# Error Handling Standards

## Overview

This document defines the standard error handling patterns for the everything-opencode project. Consistent error handling ensures:

1. **User-friendly error messages** that help users understand and fix issues
2. **Consistent logging** across all language runners and commands
3. **Recovery suggestions** that help users resolve common issues
4. **Structured error data** for debugging and monitoring
5. **Graceful degradation** when errors occur

## Error Handler Module

The central error handling is provided by `scripts/lib/error-handler.js`. All language runners and commands should use this module for consistent error handling.

### Import Pattern

```javascript
const { defaultErrorHandler } = require('../lib/error-handler');
const { LoggingUtils } = require('../lib');
```

### Basic Usage

```javascript
try {
  // Some operation that might fail
  await runner.someOperation();
} catch (error) {
  // Create context with relevant information
  const context = {
    operation: 'someOperation',
    language: 'clojure',
    tool: 'leiningen',
    file: 'project.clj',
    line: 42,
    additionalInfo: 'Helpful context for debugging',
  };

  // Handle error with comprehensive error handler
  const errorInfo = defaultErrorHandler.handleError(error, context);

  // Log user-friendly message
  LoggingUtils.error(errorInfo.userMessage);

  // Log recovery steps if available
  if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
    LoggingUtils.info('💡 Recovery steps:');
    errorInfo.recoverySteps.forEach((step, i) => {
      LoggingUtils.info(`  ${i + 1}. ${step}`);
    });
  }

  // Re-throw or handle as needed
  throw new Error(errorInfo.userMessage);
}
```

## Error Categories

Use these standard error categories when creating context:

### Tool Errors

- `TOOL_NOT_FOUND`: Required tool not installed or not in PATH
- `TOOL_VERSION`: Incompatible tool version
- `TOOL_PERMISSION`: Permission issues with tool execution

### Configuration Errors

- `CONFIG_MISSING`: Required configuration file missing
- `CONFIG_PARSE`: Configuration file parse error
- `CONFIG_INVALID`: Invalid configuration values

### Execution Errors

- `EXECUTION_FAILED`: Command execution failed
- `TIMEOUT`: Command timed out
- `PERMISSION_DENIED`: File or system permission issues

### Dependency Errors

- `DEPENDENCY_MISSING`: Required dependency missing
- `DEPENDENCY_VERSION`: Dependency version conflict
- `DEPENDENCY_RESOLUTION`: Dependency resolution failure

### Network Errors

- `NETWORK_ERROR`: Network connectivity issues
- `DOWNLOAD_FAILED`: File download failure
- `API_ERROR`: API call failure

### Platform Errors

- `PLATFORM_UNSUPPORTED`: Feature not supported on current platform
- `PLATFORM_SPECIFIC`: Platform-specific issues

### User Errors

- `USER_INPUT`: Invalid user input
- `USER_PERMISSION`: User permission issues
- `USER_CONFIG`: User configuration errors

## Context Best Practices

### Required Context Fields

Always include these fields in error context:

```javascript
const context = {
  // What operation was being performed
  operation: 'build', // e.g., 'build', 'test', 'run', 'lint'

  // Which language/tool
  language: 'clojure', // e.g., 'clojure', 'rust', 'python'
  tool: 'leiningen', // e.g., 'leiningen', 'cargo', 'pip'

  // Source of error (if applicable)
  file: 'project.clj', // File where error occurred
  line: 42, // Line number (if available)

  // Additional helpful information
  command: 'lein uberjar', // Command that failed
  exitCode: 1, // Exit code (if process exited)
  stderr: 'Error message', // stderr output (truncated if long)
};
```

### Language-Specific Context

Add language-specific context when relevant:

```javascript
// Clojure-specific
const clojureContext = {
  ...baseContext,
  buildTool: 'leiningen', // or 'deps.edn', 'boot', 'tools.build'
  namespace: 'my.app.core',
  clojureVersion: '1.11.1',
};

// Rust-specific
const rustContext = {
  ...baseContext,
  cargoVersion: '1.75.0',
  rustcVersion: '1.75.0',
  target: 'x86_64-unknown-linux-gnu',
  profile: 'release',
};

// Python-specific
const pythonContext = {
  ...baseContext,
  pythonVersion: '3.11.0',
  virtualEnv: 'venv',
  packageManager: 'pip', // or 'poetry', 'pipenv'
};
```

## Recovery Suggestions

Provide actionable recovery steps in error context:

```javascript
const context = {
  // ... other context fields

  recoverySteps: [
    'Check if Clojure is installed: `clojure --version`',
    'Install Leiningen: https://leiningen.org/#install',
    'Verify project configuration in project.clj',
    'Check network connectivity for dependency downloads',
  ],

  // Links to documentation
  documentation: [
    'https://opencode.ai/docs/clojure/troubleshooting',
    'https://leiningen.org/#troubleshooting',
  ],

  // Common solutions
  commonSolutions: [
    'Run `/clojure-deps` to update dependencies',
    'Try `/clojure-clean` to clear build artifacts',
    'Check `.opencode/clojure-config.json` for configuration issues',
  ],
};
```

## Logging Standards

### Error Logging

Use `LoggingUtils` for consistent error logging:

```javascript
// Basic error logging
LoggingUtils.error('Build failed: ' + error.message);

// With context
LoggingUtils.error('Build failed', {
  operation: 'build',
  language: 'clojure',
  duration: '2.5s',
});

// Structured logging for debugging
LoggingUtils.debug('Detailed error information', {
  error: error.stack,
  context: fullContext,
  timestamp: new Date().toISOString(),
});
```

### Log Levels

- `error()`: For errors that prevent operation completion
- `warn()`: For warnings that don't prevent completion
- `info()`: For informational messages about progress
- `debug()`: For detailed debugging information
- `verbose()`: For very detailed tracing information

## Testing Error Handling

### Test Error Scenarios

Create tests for common error scenarios:

```javascript
// Example test for tool not found error
describe('Tool not found error handling', () => {
  it('should provide helpful recovery steps', async () => {
    const runner = new ClojureCommandRunner();

    // Mock tool detection to fail
    jest
      .spyOn(runner.toolDetector, 'detectTools')
      .mockResolvedValue({ leiningen: { installed: false } });

    try {
      await runner.build();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Leiningen not found');
      expect(error.recoverySteps).toContain('Install Leiningen');
    }
  });
});
```

### Error Handler Tests

Test the error handler module directly:

```javascript
describe('ErrorHandler', () => {
  it('should handle tool not found errors', () => {
    const error = new Error('Command not found: lein');
    const context = { tool: 'leiningen', operation: 'build' };

    const result = defaultErrorHandler.handleError(error, context);

    expect(result.category).toBe('TOOL_NOT_FOUND');
    expect(result.userMessage).toContain('Leiningen not found');
    expect(result.recoverySteps).toHaveLength.greaterThan(0);
  });
});
```

## Implementation Checklist

For each language runner, ensure:

### ✅ Import Error Handler

```javascript
const { defaultErrorHandler } = require('../lib/error-handler');
```

### ✅ Wrap Operations in Try/Catch

```javascript
async someOperation(args, options) {
  try {
    // Operation logic
  } catch (error) {
    // Error handling
  }
}
```

### ✅ Provide Rich Context

```javascript
const context = {
  operation: 'operationName',
  language: 'languageName',
  tool: 'toolName',
  // Additional relevant context
};
```

### ✅ Log Appropriately

```javascript
LoggingUtils.error(errorInfo.userMessage);
if (errorInfo.recoverySteps) {
  LoggingUtils.info('Recovery steps:');
  // Log each step
}
```

### ✅ Re-throw or Return Error Info

```javascript
// Option 1: Re-throw with user-friendly message
throw new Error(errorInfo.userMessage);

// Option 2: Return error information
return {
  success: false,
  error: errorInfo,
};
```

### ✅ Test Error Scenarios

Create tests for:

- Tool not found errors
- Configuration errors
- Execution failures
- Permission errors
- Network errors

## Examples

### Complete Example: Clojure Build Error

```javascript
async build(args, options = {}) {
  const context = {
    operation: 'build',
    language: 'clojure',
    tool: this.detectedTool || 'unknown',
    args: args.join(' '),
    options,
  };

  try {
    // Build logic
    const result = await this._executeBuild(args, options);
    return result;
  } catch (error) {
    // Add build-specific context
    context.buildType = options.release ? 'release' : 'debug';
    context.projectFile = this.projectConfig?.file || 'unknown';

    // Handle error
    const errorInfo = defaultErrorHandler.handleError(error, context);

    // Log error
    LoggingUtils.error(`Clojure build failed: ${errorInfo.userMessage}`);

    // Log recovery steps
    if (errorInfo.recoverySteps?.length > 0) {
      LoggingUtils.info('💡 Try these steps to fix the issue:');
      errorInfo.recoverySteps.forEach((step, i) => {
        LoggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    // Re-throw with user-friendly message
    throw new Error(`Build failed: ${errorInfo.userMessage}`);
  }
}
```

### Example: Tool Detection Error

```javascript
async detectTools() {
  const context = {
    operation: 'detectTools',
    language: 'clojure',
  };

  try {
    // Tool detection logic
    const tools = await this.toolDetector.detectTools();
    return tools;
  } catch (error) {
    // Handle detection error
    const errorInfo = defaultErrorHandler.handleError(error, context);

    LoggingUtils.warn(`Tool detection issues: ${errorInfo.userMessage}`);

    // Return partial results or default
    return {
      success: false,
      error: errorInfo,
      tools: {}, // Empty tools object
    };
  }
}
```

## Monitoring and Metrics

### Error Metrics

Track error metrics for monitoring:

```javascript
// In error handler or logging
const errorMetrics = {
  timestamp: new Date().toISOString(),
  category: errorInfo.category,
  operation: context.operation,
  language: context.language,
  tool: context.tool,
  resolved: false, // Set to true when user resolves
};

// Log metrics (could be sent to monitoring system)
LoggingUtils.metric('error_occurred', errorMetrics);
```

### Error Rate Monitoring

Monitor error rates by category:

```javascript
// Track error rates
const errorRates = {
  TOOL_NOT_FOUND: 0,
  CONFIG_MISSING: 0,
  EXECUTION_FAILED: 0,
  // ... other categories
};

// Increment on error
errorRates[errorInfo.category] = (errorRates[errorInfo.category] || 0) + 1;

// Log if rate exceeds threshold
if (errorRates[errorInfo.category] > 10) {
  LoggingUtils.warn(`High error rate for ${errorInfo.category}`);
}
```

## Updates and Maintenance

### Adding New Error Categories

1. Add category to `errorCategories` in error-handler.js
2. Add mapping logic in `categorizeError` method
3. Add recovery suggestions for new category
4. Update documentation
5. Add tests for new category

### Updating Recovery Suggestions

1. Review common user issues
2. Add new recovery steps to appropriate categories
3. Test recovery suggestions work
4. Update documentation examples

### Performance Considerations

1. Error handling should not significantly impact performance
2. Use lazy evaluation for expensive recovery step generation
3. Cache common error patterns
4. Limit context collection for frequent errors

## Related Documentation

- [Logging Standards](./logging-standards.md)
- [Testing Standards](./testing-standards.md)
- [Language Runner Architecture](./language-runner-architecture.md)
- [User Experience Guidelines](./ux-guidelines.md)
