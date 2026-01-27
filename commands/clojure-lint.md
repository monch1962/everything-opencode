# Clojure Lint Command

Lint Clojure code with clj-kondo and other linters for code quality and best practices.

## Overview

The `/clojure-lint` command analyzes Clojure, ClojureScript, and EDN code for potential errors, style violations, and best practice issues. It uses clj-kondo as the primary linter with support for additional linters and custom rule sets.

## Features

- **clj-kondo Integration**: Primary linter with comprehensive rule sets
- **Multiple Linter Support**: Works with eastwood, kibit, and other Clojure linters
- **Custom Rule Configuration**: Define project-specific linting rules
- **Auto-fix Capabilities**: Automatically fix certain types of issues
- **Severity Levels**: Categorize issues as errors, warnings, or info
- **Exclusion Patterns**: Exclude specific files or directories from linting
- **CI/CD Ready**: Exit codes for pipeline integration
- **Performance Optimized**: Parallel linting and caching for speed

## Usage

```bash
/clojure-lint [options] [files...]
```

### Options

| Option      | Short | Description                      |
| ----------- | ----- | -------------------------------- |
| `--fix`     | `-f`  | Auto-fix fixable issues          |
| `--check`   | `-c`  | Check only (no auto-fix)         |
| `--verbose` | `-v`  | Show detailed linting output     |
| `--format`  |       | Output format (text, json, edn)  |
| `--config`  |       | Use custom linting configuration |
| `--rules`   |       | Specify which rules to apply     |
| `--exclude` | `-e`  | Exclude files/directories        |
| `--help`    | `-h`  | Show help message                |

## Examples

### Lint specific files

```bash
/clojure-lint src/core.clj test/core_test.clj
```

Lints the specified files.

### Auto-fix issues

```bash
/clojure-lint --fix src/
```

Automatically fixes fixable issues in the src directory.

### Check with custom config

```bash
/clojure-lint --config .clj-kondo/config.edn --all
```

Lints all files using custom configuration.

### Output JSON format

```bash
/clojure-lint --format json src/ > lint-report.json
```

Outputs linting results in JSON format for programmatic processing.

### Exclude directories

```bash
/clojure-lint --exclude target/ --exclude .git/ src/
```

Lints src directory excluding target and .git directories.

## Configuration

### clj-kondo Configuration

The command looks for clj-kondo configuration in this order:

1. `.clj-kondo/config.edn` - Project-specific configuration
2. `.clj-kondo/<filename>.clj` - File-specific configuration
3. `$HOME/.clj-kondo/config.edn` - User global configuration
4. Default clj-kondo configuration

### Example Configuration

```edn
;; .clj-kondo/config.edn
{:linters {:unused-binding {:level :warning}
           :unused-namespace {:level :error}
           :missing-docstring {:level :info}}
 :output {:format :text
          :summary true}
 :cache true
 :parallel true}
```

### Rule Configuration

Configure specific linting rules:

```edn
{:linters
 {:unused-binding {:exclude [".*test.*" ".*spec.*"]}
  :redundant-call {:level :warning}
  :unused-private-var {:level :error}
  :shadowed-var {:level :warning}}}
```

### Severity Levels

- `:error` - Must be fixed (exit code 1)
- `:warning` - Should be fixed (exit code 0)
- `:info` - Informational only (exit code 0)
- `:off` - Disable the rule

## Linter Details

### clj-kondo (Primary)

- **Static analysis**: No code execution required
- **Fast**: Parallel analysis and caching
- **Comprehensive**: 100+ built-in rules
- **Extensible**: Custom lint functions and hooks
- **IDE integration**: Editor plugins available

### Eastwood

- **Runtime analysis**: Requires code execution
- **Deep analysis**: Finds complex issues
- **Performance checking**: Identifies performance anti-patterns
- **Optional**: Can be enabled via configuration

### Kibit

- **Pattern matching**: Suggests better idioms
- **Learning tool**: Teaches Clojure best practices
- **Non-breaking**: Suggestions only, not errors

## Common Issues and Fixes

### Unused Variables

```clojure
;; Before linting
(defn process [data options]
  (let [result (transform data)]
    result))

;; After --fix
(defn process [data _options]
  (transform data))
```

### Missing Documentation

```clojure
;; Warning: missing docstring
(defn calculate-total [items]
  (reduce + items))

;; Add docstring to fix
(defn calculate-total
  "Calculate total sum of items"
  [items]
  (reduce + items))
```

### Redundant Code

```clojure
;; Warning: redundant do
(do
  (println "Starting")
  (process-data))

;; Fixed version
(println "Starting")
(process-data)
```

### Namespace Issues

```clojure
;; Warning: unused require
(ns app.core
  (:require [clojure.string :as str]  ; Unused
            [clojure.set :as set]))

;; Fixed version
(ns app.core
  (:require [clojure.set :as set]))
```

## Integration

### Editor Integration

Many editors can use the command for real-time linting:

```json
// VSCode settings.json
{
  "clojure.linter.command": "/clojure-lint",
  "clojure.linter.args": ["--format", "json"],
  "clojure.linter.autoFixOnSave": true
}
```

### Git Hooks

```bash
# pre-commit hook
/clojure-lint --check --staged

# pre-push hook
/clojure-lint --check --all
```

### CI/CD Pipelines

```bash
# GitHub Actions
- name: Lint Clojure code
  run: /clojure-lint --check --all

# Exit on error
/clojure-lint --check --all || exit 1
```

### With Other Commands

```bash
# Lint before testing
/clojure-lint --check && /clojure-test

# Lint and format
/clojure-lint --fix && /clojure-format

# Lint as part of build
/clojure-lint --check && /clojure-build
```

## Performance

### Caching

- **File hash caching**: Only re-lints changed files
- **Result caching**: Caches linting results
- **Incremental linting**: Fast for large codebases

### Parallel Processing

```bash
# Use multiple cores
/clojure-lint --parallel --all

# Limit parallelism
/clojure-lint --parallel 4 src/
```

### Memory Management

- **Streaming analysis**: Processes files in chunks
- **Configurable limits**: Set memory limits for large projects
- **Cleanup**: Removes temporary files automatically

## Custom Rules

### Writing Custom Linters

```clojure
;; custom_rules/my_linter.clj
(ns custom-rules.my-linter
  (:require [clj-kondo.hooks-api :as api]))

(defn my-linter [{:keys [node]}]
  (when (and (api/list-node? node)
             (= 'defn (api/sexpr (first node))))
    ;; Check for defn without docstring
    (when (< (count node) 3)
      {:message "defn should have a docstring"
       :type :warning
       :row (api/row node)
       :col (api/col node)})))
```

### Configuration for Custom Rules

```edn
{:lint-as {my-app/defcustom def}
 :hooks {:analyze-call {my-app/defcustom custom-rules.my-linter/my-linter}}}
```

## Troubleshooting

### Common Issues

#### Linter Not Found

```bash
# Install clj-kondo
/clojure-deps --add clj-kondo/clj-kondo "2023.12.10"

# Or use built-in linting
/clojure-lint --linter built-in src/
```

#### Configuration Conflicts

```bash
# Show active configuration
/clojure-lint --show-config

# Use specific config file
/clojure-lint --config .clj-kondo/config.edn src/

# Reset to defaults
/clojure-lint --reset-config src/
```

#### False Positives

```bash
# Suppress specific rules
/clojure-lint --suppress unused-binding,redundant-call src/

# Exclude specific files
/clojure-lint --exclude src/legacy/ --exclude src/generated/

# Adjust severity
/clojure-lint --severity warning src/
```

### Performance Issues

```bash
# Profile linting
/clojure-lint --profile src/

# Disable caching for debugging
/clojure-lint --no-cache src/

# Limit file size
/clojure-lint --max-size 100kb src/
```

## Related Commands

- `/clojure-format` - Format Clojure code
- `/clojure-build` - Build Clojure projects
- `/clojure-test` - Test Clojure code
- `/clojure-run` - Run Clojure applications
- `/js-lint` - Lint JavaScript/TypeScript code
- `/python-lint` - Lint Python code
