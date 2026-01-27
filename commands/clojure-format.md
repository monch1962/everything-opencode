# Clojure Format Command

Format Clojure code with zprint and other formatters using intelligent defaults.

## Overview

The `/clojure-format` command formats Clojure, ClojureScript, and EDN code using configurable formatters. It supports multiple formatting tools (zprint, cljfmt) with intelligent defaults that respect your project's style conventions.

## Features

- **Multiple Formatter Support**: Works with zprint, cljfmt, and other Clojure formatters
- **Project-Aware Formatting**: Detects and respects project-specific formatting rules
- **Interactive Mode**: Preview changes before applying them
- **Batch Processing**: Format entire directories or specific file patterns
- **Custom Configuration**: Supports `.zprint.edn`, `.cljfmt.edn`, and other config files
- **Syntax Preservation**: Maintains code semantics while improving readability
- **Diff View**: See what changes will be made before applying

## Usage

```bash
/clojure-format [options] [files...]
```

### Options

| Option          | Short | Description                             |
| --------------- | ----- | --------------------------------------- |
| `--check`       | `-c`  | Check formatting without changing files |
| `--fix`         | `-f`  | Fix formatting issues automatically     |
| `--diff`        | `-d`  | Show diff of changes                    |
| `--interactive` | `-i`  | Interactive mode (confirm changes)      |
| `--all`         | `-a`  | Format all Clojure files in project     |
| `--config`      |       | Use custom configuration file           |
| `--formatter`   |       | Specify formatter (zprint, cljfmt)      |
| `--help`        | `-h`  | Show help message                       |

## Examples

### Format specific files

```bash
/clojure-format src/core.clj test/core_test.clj
```

Formats the specified files.

### Check formatting

```bash
/clojure-format --check src/
```

Checks formatting in the src directory without making changes.

### Fix formatting issues

```bash
/clojure-format --fix --all
```

Fixes formatting issues in all Clojure files.

### Interactive formatting

```bash
/clojure-format --interactive src/core.clj
```

Shows changes and asks for confirmation before applying.

### Show diff

```bash
/clojure-format --diff src/
```

Shows what changes would be made to files in src/.

## Configuration

### Formatter Detection

The command automatically detects available formatters:

1. **zprint**: Preferred formatter with extensive configuration options
2. **cljfmt**: Alternative formatter used in some projects
3. **Built-in**: Simple formatting when no external formatter is available

### Configuration Files

The command looks for configuration files in this order:

1. `.zprint.edn` - zprint configuration
2. `.cljfmt.edn` - cljfmt configuration
3. `project.clj` - Leiningen formatting config
4. `deps.edn` - CLI tools formatting aliases
5. `.opencode/clojure-format.json` - opencode-specific config

### Example Configuration

```edn
; .zprint.edn
{:style :community
 :map {:comma? false}
 :vector {:wrap? false}
 :list {:indent 1}}
```

```json
// .opencode/clojure-format.json
{
  "formatter": "zprint",
  "options": {
    "width": 80,
    "parallel?": true,
    "color?": true
  },
  "exclude": ["target/", ".git/", "*.min.cljs"]
}
```

## Formatter Details

### zprint

- **Default formatter** when available
- Highly configurable with `.zprint.edn`
- Supports Clojure, ClojureScript, and EDN
- Parallel processing for speed
- Colorized output option

### cljfmt

- Simpler, opinionated formatting
- Good for projects with existing cljfmt setup
- Less configuration needed
- Faster for small projects

### Built-in Formatter

- Basic indentation and alignment
- Used when no external formatter is installed
- Minimal dependencies
- Always available

## Common Operations

### Formatting New Code

```bash
# Format a new file
/clojure-format new-file.clj

# Format with specific style
/clojure-format --formatter zprint --style :community new-file.clj
```

### Maintaining Code Style

```bash
# Check entire project
/clojure-format --check --all

# Fix issues
/clojure-format --fix --all

# Update formatting for changed files only
git diff --name-only HEAD | grep '\.clj[cs]*$' | xargs /clojure-format --fix
```

### CI/CD Integration

```bash
# Check formatting in CI
/clojure-format --check --all

# Exit with error if formatting issues found
/clojure-format --check --all || exit 1

# Auto-fix in pre-commit hook
/clojure-format --fix --staged
```

## Integration

### With Editor Integration

Many editors can use the command as a formatter:

```bash
# Emacs
(add-hook 'clojure-mode-hook (lambda () (setq format-command "/clojure-format")))

# VSCode
"clojure.format.command": "/clojure-format",
"clojure.format.args": ["--fix"]
```

### With Git Hooks

```bash
# pre-commit hook
/clojure-format --fix --staged
git add -u
```

### With Build Process

```bash
# Format before building
/clojure-format --fix --all
/clojure-build
```

## Performance

### Caching

- Caches formatting results for unchanged files
- Incremental formatting for large codebases
- Parallel processing with `--parallel` option

### Large Codebases

For large projects:

```bash
# Format in chunks
/clojure-format --chunk-size 50 src/

# Use parallel processing
/clojure-format --parallel --all

# Skip already formatted files
/clojure-format --skip-formatted --all
```

### Memory Usage

- Streams files to avoid loading everything into memory
- Configurable batch size for memory-constrained environments
- Cleanup of temporary files

## Troubleshooting

### Common Issues

#### Formatter Not Found

```bash
# Install zprint
/clojure-deps --add mvxcvi/zprint "1.2.4"

# Or use built-in formatter
/clojure-format --formatter built-in src/
```

#### Configuration Conflicts

```bash
# Show active configuration
/clojure-format --show-config

# Use specific config file
/clojure-format --config .zprint.edn src/

# Reset to defaults
/clojure-format --reset-config src/
```

#### Syntax Errors

```bash
# Skip files with syntax errors
/clojure-format --skip-errors src/

# Show syntax errors
/clojure-format --verbose src/ 2>&1 | grep -i error

# Format valid files only
/clojure-format --check src/ | grep -v "ERROR" | xargs /clojure-format --fix
```

### Performance Issues

```bash
# Profile formatting
/clojure-format --profile src/

# Limit resources
/clojure-format --max-memory 2g --parallel 2 src/

# Skip large files
/clojure-format --max-size 100kb src/
```

## Related Commands

- `/clojure-lint` - Lint Clojure code
- `/clojure-build` - Build Clojure projects
- `/clojure-test` - Test Clojure code
- `/js-format` - Format JavaScript/TypeScript code
- `/python-format` - Format Python code
