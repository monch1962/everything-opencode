# LSP Integration Optimization

## When to Use

When working with opencode's Language Server Protocol (LSP) integration for:
- Real-time code analysis and suggestions
- Intelligent autocompletion
- Refactoring assistance
- Error detection and fixes
- Cross-file navigation

## How It Works

opencode's LSP integration provides deep language understanding by connecting to language servers. This skill optimizes that integration for maximum productivity.

## Configuration Guidelines

### 1. Language Server Setup

```json
// ~/.opencode/lsp-servers.json
{
  "typescript": {
    "command": "typescript-language-server",
    "args": ["--stdio"],
    "filetypes": ["typescript", "typescriptreact", "javascript", "javascriptreact"],
    "rootPatterns": ["package.json", "tsconfig.json", "jsconfig.json"],
    "initializationOptions": {
      "preferences": {
        "includeAutomaticOptionalChainCompletions": true,
        "includeCompletionsForImportStatements": true,
        "includeCompletionsWithSnippetText": true
      }
    }
  },
  "python": {
    "command": "pylsp",
    "args": [],
    "filetypes": ["python"],
    "rootPatterns": ["pyproject.toml", "setup.py", "requirements.txt"],
    "settings": {
      "pylsp": {
        "plugins": {
          "pylint": {"enabled": true},
          "pycodestyle": {"enabled": false},
          "flake8": {"enabled": true}
        }
      }
    }
  },
  "rust": {
    "command": "rust-analyzer",
    "args": [],
    "filetypes": ["rust"],
    "rootPatterns": ["Cargo.toml"]
  }
}
```

### 2. Performance Optimization

**Memory Management:**
```json
{
  "lsp": {
    "maxMemoryMB": 512,
    "idleTimeoutSeconds": 300,
    "diagnosticsDelayMs": 500,
    "completionTimeoutMs": 1000
  }
}
```

**Selective Loading:**
```json
{
  "lsp": {
    "autoStart": ["typescript", "python"],  // Always start these
    "onDemand": ["rust", "go", "java"],     // Start when files are opened
    "disabled": ["css", "html"]             // Disable for lightweight languages
  }
}
```

### 3. Integration with opencode Tools

**Combine LSP with opencode tools:**
```javascript
// Example: Use LSP diagnostics with opencode's code review
// 1. LSP provides real-time syntax/semantic errors
// 2. opencode agents provide architectural/design feedback
// 3. Combined workflow catches issues at multiple levels
```

## Best Practices

### 1. Project-Specific Configuration

Create `.opencode/lsp-config.json` in each project:

```json
{
  "typescript": {
    "preferences": {
      "quoteStyle": "single",
      "importModuleSpecifier": "relative"
    },
    "diagnostics": {
      "excludedCodes": [6133, 6192]  // Ignore unused variable warnings
    }
  }
}
```

### 2. Memory-Efficient Setup

```bash
# Monitor LSP memory usage
ps aux | grep -E "(typescript-language-server|pylsp|rust-analyzer)"

# Configure memory limits
export NODE_OPTIONS="--max-old-space-size=512"  # For Node-based LSPs
```

### 3. Fallback Strategies

When LSP is unavailable or slow:
1. Use opencode's built-in syntax highlighting
2. Enable incremental parsing
3. Fall back to regex-based analysis
4. Cache LSP results for offline use

## Troubleshooting

### Common Issues and Solutions

**1. LSP Server Not Starting:**
```bash
# Check if language server is installed
which typescript-language-server
which pylsp
which rust-analyzer

# Install missing servers
npm install -g typescript-language-server
pip install python-lsp-server
```

**2. High Memory Usage:**
```json
{
  "lsp": {
    "maxInstances": 3,
    "restartThresholdMB": 256,
    "diagnosticsBatchSize": 10
  }
}
```

**3. Slow Completions:**
- Reduce the number of active LSP servers
- Increase completion timeout
- Use simpler completion triggers
- Disable expensive plugins

## Advanced Features

### 1. Code Actions Integration

Configure LSP code actions to work with opencode commands:

```json
{
  "codeActions": {
    "refactor": {
      "extractFunction": "/refactor extract-function",
      "renameSymbol": "/refactor rename",
      "organizeImports": "/organize-imports"
    },
    "quickFix": {
      "addMissingImports": true,
      "fixSpelling": true,
      "addTypeAnnotation": true
    }
  }
}
```

### 2. Cross-File Analysis

Enable LSP to analyze across multiple files:

```json
{
  "crossFileAnalysis": {
    "enabled": true,
    "maxFiles": 50,
    "cacheResults": true,
    "updateOnSave": true
  }
}
```

### 3. Custom LSP Commands

Add project-specific LSP commands:

```json
{
  "customCommands": {
    "generateTests": {
      "command": "typescript.generateTests",
      "title": "Generate Tests",
      "arguments": ["${file}", "${range}"]
    },
    "extractInterface": {
      "command": "typescript.extractInterface",
      "title": "Extract Interface",
      "arguments": ["${file}", "${range}"]
    }
  }
}
```

## Integration Examples

### TypeScript + React Project

```json
{
  "lsp": {
    "typescript": {
      "preferences": {
        "jsxAttributeCompletionStyle": "auto",
        "includeCompletionsWithInsertText": true
      },
      "plugins": [
        {
          "name": "@styled/typescript-styled-plugin",
          "location": "node_modules/@styled/typescript-styled-plugin"
        }
      ]
    }
  },
  "hooks": {
    "onFileSave": {
      "runTsc": "npx tsc --noEmit",
      "organizeImports": "npx organize-imports-cli"
    }
  }
}
```

### Python Data Science Project

```json
{
  "lsp": {
    "python": {
      "settings": {
        "pylsp": {
          "plugins": {
            "jedi_completion": {"enabled": true},
            "pydocstyle": {"enabled": false},
            "autopep8": {"enabled": true}
          }
        }
      }
    }
  },
  "notebookSupport": {
    "jupyter": true,
    "convertToScript": true,
    "executeCells": true
  }
}
```

## Performance Metrics

Track LSP performance:

```json
{
  "metrics": {
    "enabled": true,
    "logFile": "~/.opencode/lsp-metrics.json",
    "track": [
      "completionTime",
      "diagnosticsTime",
      "hoverTime",
      "definitionTime"
    ],
    "alertThresholds": {
      "completionTimeMs": 1000,
      "memoryUsageMB": 512
    }
  }
}
```

## Resources

- [Language Server Protocol Specification](https://microsoft.github.io/language-server-protocol/)
- [opencode LSP Documentation](https://opencode.ai/docs/lsp-integration)
- [TypeScript LSP Configuration](https://github.com/typescript-language-server/typescript-language-server)
- [Python LSP Server](https://github.com/python-lsp/python-lsp-server)
- [Rust Analyzer](https://rust-analyzer.github.io/)