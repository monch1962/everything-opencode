# Clojure REPL Command

Start an interactive Clojure REPL (Read-Eval-Print Loop) with project context and enhanced development features.

## Overview

The `/clojure-repl` command starts an interactive Clojure REPL session with your project loaded and configured. It provides a rich development environment with code completion, documentation lookup, namespace management, and debugging capabilities.

## Features

- **Project-Aware REPL**: Loads your project dependencies and source code
- **Multiple REPL Types**: Supports nREPL, Socket REPL, and traditional REPL
- **Code Completion**: Intelligent tab completion for functions and namespaces
- **Documentation Access**: Look up documentation without leaving the REPL
- **Namespace Management**: Easy namespace switching and reloading
- **Debugging Tools**: Built-in debugging and inspection capabilities
- **History Management**: Command history with search and navigation
- **Custom Prompts**: Configurable REPL prompts with project info
- **REPL Utilities**: Common development utilities built-in

## Usage

```bash
/clojure-repl [options]
```

### Options

| Option       | Short | Description                       |
| ------------ | ----- | --------------------------------- |
| `--nrepl`    | `-n`  | Start nREPL server                |
| `--socket`   | `-s`  | Start Socket REPL                 |
| `--port`     | `-p`  | Port for nREPL/Socket REPL        |
| `--headless` | `-h`  | Headless mode (no interactive UI) |
| `--debug`    | `-d`  | Enable debugging features         |
| `--profile`  |       | Load with profiling enabled       |
| `--preload`  |       | Preload specific namespaces       |
| `--help`     |       | Show help message                 |

## Examples

### Start interactive REPL

```bash
/clojure-repl
```

Starts an interactive REPL with project loaded.

### Start nREPL server

```bash
/clojure-repl --nrepl --port 7888
```

Starts an nREPL server on port 7888 for editor integration.

### Headless mode

```bash
/clojure-repl --headless --preload my.app.core
```

Starts a headless REPL with specific namespace preloaded.

### Debug mode

```bash
/clojure-repl --debug
```

Starts REPL with debugging capabilities enabled.

### Socket REPL

```bash
/clojure-repl --socket --port 5555
```

Starts a Socket REPL on port 5555.

## REPL Types

### Interactive REPL

- **Default mode**: Rich interactive interface
- **Features**: Syntax highlighting, completion, history
- **Best for**: Direct development and exploration

### nREPL (Network REPL)

- **Protocol**: Standard Clojure nREPL protocol
- **Editor Integration**: Works with CIDER, Calva, Conjure
- **Features**: Middleware support, async evaluation

### Socket REPL

- **Simple protocol**: Raw socket communication
- **Lightweight**: Minimal overhead
- **Tools**: Works with telnet, netcat, custom clients

### Headless REPL

- **Non-interactive**: For scripting and automation
- **Output only**: No prompt or input handling
- **Use cases**: CI/CD, batch processing, automation

## Configuration

### REPL Configuration File

Create `.opencode/clojure-repl.edn` for custom configuration:

```edn
{:repl
 {:type :nrepl
  :port 7888
  :middleware [cider.nrepl/cider-middleware]
  :init (do
          (require '[my.app.core])
          (println "REPL ready!"))
  :prompt (fn [ns] (str ns "=> "))
  :history-file ".repl-history"
  :color true
  :auto-complete true}}
```

### Project-Specific Init

The REPL automatically loads project-specific initialization:

1. `dev/user.clj` - Development utilities
2. `dev/dev.clj` - Development configuration
3. `.repl-init.clj` - REPL-specific initialization
4. Project dependencies and source paths

### Editor Integration

Configure your editor to connect to the nREPL:

```clojure
;; .dir-locals.el for Emacs
((clojure-mode . ((cider-preferred-build-tool . "opencode")
                  (cider-default-cljs-repl . "figwheel")
                  (cider-repl-init-code . "(do (require 'my.app.core) (in-ns 'my.app.core))"))))

;; .vscode/settings.json for VSCode
{
  "calva.replConnectSequences": [
    {
      "name": "OpenCode REPL",
      "projectType": "deps.edn",
      "replCommand": ["/clojure-repl", "--nrepl", "--port", "7888"]
    }
  ]
}
```

## REPL Features

### Code Completion

```clojure
; Type part of a function name and press Tab
(str▮  ; Press Tab
; Shows: str str? string? string stream? struct struct-map

; Complete namespace
(clojure.▮  ; Press Tab
; Shows: clojure.core clojure.set clojure.string etc.
```

### Documentation Lookup

```clojure
; Get documentation for a function
(doc map)
; Shows function signature and documentation

; Get source code
(source filter)
; Shows source code of the function

; Find functions by name
(find-doc "reduce")
; Shows all functions containing "reduce" in name or doc
```

### Namespace Management

```clojure
; Switch to a namespace
(in-ns 'my.app.core)

; Require a namespace
(require '[clojure.string :as str])

; Reload a namespace
(require 'my.app.core :reload)

; List loaded namespaces
(all-ns)
```

### Debugging Tools

```clojure
; Debug a function
(debug my-function)

; Step through execution
(step (my-function arg1 arg2))

; Inspect a value
(inspect some-data-structure)

; Trace function calls
(trace my-namespace/*)
```

## Common Workflows

### Development Session

```bash
# Start REPL with project
/clojure-repl

# In REPL:
(require '[my.app.core])
(in-ns 'my.app.core)
; Start developing...
```

### Editor Integration

```bash
# Start nREPL server
/clojure-repl --nrepl --port 7888

# Connect from editor
# Emacs: M-x cider-connect
# VSCode: Calva: Connect to a Running REPL
```

### Testing in REPL

```clojure
; Load and run tests
(require '[my.app.test-core :refer :all])
(run-tests 'my.app.test-core)

; Test specific function
(test-vars [#'test-my-function])

; Run tests with coverage
(run-tests-with-coverage)
```

### Debugging Session

```clojure
; Start debug REPL
/clojure-repl --debug

; Set breakpoint
(break my-function)

; Step through code
(step (my-function arg))

; Inspect variables
(inspect *1)  ; Last result
(inspect *e)  ; Last exception
```

## Integration

### With Build Tools

```bash
# REPL with specific build tool
/clojure-repl --tool lein
/clojure-repl --tool deps
/clojure-repl --tool boot
```

### With Testing

```bash
# REPL for test development
/clojure-repl --preload my.app.test-core

# Run tests from REPL
(do
  (require '[clojure.test :as t])
  (t/run-tests 'my.app.test-core))
```

### With Application

```bash
# REPL with application running
/clojure-repl --with-app

# Connect to running application
/clojure-repl --connect app-host:7890
```

## Performance

### Memory Management

```bash
# Start REPL with memory limits
/clojure-repl --max-heap 2g --init-heap 512m

# Enable GC logging
/clojure-repl --gc-log

# Monitor memory usage
/clojure-repl --monitor
```

### Startup Optimization

```bash
# Skip dependency resolution
/clojure-repl --skip-deps

# Use cached classpath
/clojure-repl --cached

# Minimal startup
/clojure-repl --minimal
```

### Large Projects

For large projects:

```bash
# Incremental loading
/clojure-repl --incremental

# Load namespaces on demand
/clojure-repl --lazy

# Profile startup
/clojure-repl --profile-startup
```

## Troubleshooting

### Common Issues

#### REPL Won't Start

```bash
# Check for port conflicts
/clojure-repl --port 7890

# Try different REPL type
/clojure-repl --socket
/clojure-repl --nrepl

# Increase timeout
/clojure-repl --timeout 30
```

#### Dependency Issues

```bash
# Clean dependencies and retry
/clojure-clean --deps
/clojure-repl

# Skip dependency checking
/clojure-repl --skip-deps-check

# Use offline mode
/clojure-repl --offline
```

#### Memory Issues

```bash
# Increase heap size
/clojure-repl --max-heap 4g

# Enable GC tuning
/clojure-repl --gc-options "-XX:+UseG1GC"

# Monitor and adjust
/clojure-repl --monitor --adjust
```

### Connection Issues

```bash
# Check if REPL is running
netstat -an | grep 7888

# Connect with different client
telnet localhost 5555  # For Socket REPL

# Debug connection
/clojure-repl --verbose --nrepl --port 7888
```

## Advanced Features

### Custom REPL Middleware

```clojure
;; Create custom middleware
(defn my-middleware [handler]
  (fn [{:keys [op] :as msg}]
    (case op
      :eval (do (println "Evaluating:" (:code msg))
                (handler msg))
      (handler msg))))

;; Use in REPL
/clojure-repl --middleware my.middleware/my-middleware
```

### REPL Scripting

```bash
# Execute script in REPL
/clojure-repl --eval "(println \"Hello\")"

# Load and execute file
/clojure-repl --load script.clj

# Pipe commands to REPL
echo "(println (+ 1 2))" | /clojure-repl --headless
```

### REPL as Server

```bash
# Start REPL as long-running server
/clojure-repl --server --port 7890 --daemon

# Connect multiple clients
# Each gets isolated session
```

## Related Commands

- `/clojure-run` - Run Clojure applications
- `/clojure-test` - Run Clojure tests
- `/clojure-build` - Build Clojure projects
- `/clojure-debug` - Debug Clojure code
- `/js-repl` - JavaScript/TypeScript REPL
- `/python-repl` - Python REPL
