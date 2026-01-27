# Clojure Run Command

Run Clojure applications with intelligent configuration detection and runtime optimization.

## Overview

The `/clojure-run` command executes Clojure applications, handling dependency resolution, JVM configuration, and runtime optimization. It automatically detects your project type and main function, providing a seamless execution experience for both development and production.

## Features

- **Automatic Main Detection**: Finds and runs the appropriate main function
- **JVM Optimization**: Configures JVM settings for optimal performance
- **Dependency Management**: Handles classpath and dependency resolution
- **Runtime Monitoring**: Real-time monitoring of application performance
- **Hot Code Reloading**: Development mode with automatic code reloading
- **Profile Support**: Run with different profiles (dev, test, prod)
- **Environment Management**: Handles environment variables and configuration
- **Graceful Shutdown**: Proper shutdown handling for long-running applications

## Usage

```bash
/clojure-run [options] [args...]
```

### Options

| Option          | Short | Description                |
| --------------- | ----- | -------------------------- |
| `--main`        | `-m`  | Specify main namespace     |
| `--watch`       | `-w`  | Watch mode with hot reload |
| `--profile`     | `-p`  | Run with specific profile  |
| `--jvm-options` | `-j`  | Additional JVM options     |
| `--port`        |       | Port for web applications  |
| `--debug`       | `-d`  | Enable debug mode          |
| `--memory`      |       | Set JVM memory limits      |
| `--help`        | `-h`  | Show help message          |

## Examples

### Run default main function

```bash
/clojure-run
```

Runs the detected main function with default settings.

### Run with hot reload

```bash
/clojure-run --watch
```

Runs application with file watching and hot code reloading.

### Specify main namespace

```bash
/clojure-run --main my.app.core
```

Runs the `-main` function in `my.app.core` namespace.

### Run with production profile

```bash
/clojure-run --profile prod --memory 2g
```

Runs with production profile and 2GB memory limit.

### Web application on specific port

```bash
/clojure-run --port 8080 --main my.webapp
```

Runs web application on port 8080.

### Debug mode

```bash
/clojure-run --debug --jvm-options "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
```

Runs with debugger enabled on port 5005.

## Configuration

### Main Function Detection

The command automatically detects main functions in this order:

1. `:main` in `project.clj` (Leiningen)
2. `-main` function in namespace specified by `:main-opts` in `deps.edn`
3. `:main` in `build.boot` (Boot)
4. `main` function in `build.clj` (tools.build)
5. Looks for `-main` function in common namespaces (`core`, `main`)

### Project Configuration

Create `.opencode/clojure-run.json` for custom run configuration:

```json
{
  "defaults": {
    "main": "my.app.core",
    "jvmOptions": ["-Xmx2g", "-XX:+UseG1GC"],
    "profiles": {
      "dev": {
        "repl": true,
        "watch": true,
        "jvmOptions": ["-Xmx1g"]
      },
      "prod": {
        "jvmOptions": ["-Xmx4g", "-XX:+UseStringDeduplication"],
        "gcOptions": ["-XX:+UseG1GC", "-XX:MaxGCPauseMillis=200"]
      }
    }
  },
  "web": {
    "port": 8080,
    "host": "0.0.0.0",
    "ssl": false
  },
  "monitoring": {
    "metrics": true,
    "healthChecks": true,
    "logging": "json"
  }
}
```

### Build Tool Specific Configuration

#### Leiningen (`project.clj`)

```clojure
:profiles {:dev {:jvm-opts ["-Xmx1g"]}
           :prod {:jvm-opts ["-Xmx4g"]}}
:main my.app.core
```

#### deps.edn

```clojure
:aliases {:run {:main-opts ["-m" "my.app.core"]
                :jvm-opts ["-Xmx2g"]}}
```

#### Boot (`build.boot`)

```clojure
(task-options!
  run {:main 'my.app.core
       :jvm-options ["-Xmx2g"]})
```

## Runtime Features

### Hot Code Reloading

```bash
/clojure-run --watch
```

- Watches source files for changes
- Reloads changed namespaces automatically
- Maintains application state during reload
- Shows reload status and errors

### Performance Monitoring

```bash
/clojure-run --monitor
```

- Real-time CPU and memory monitoring
- Garbage collection statistics
- Request latency tracking (web apps)
- Custom metric collection

### Health Checks

```bash
/clojure-run --health
```

- Startup health checks
- Readiness and liveness probes
- Dependency health (database, services)
- Custom health endpoints

### Logging Configuration

```bash
/clojure-run --log-level debug --log-format json
```

- Configurable log levels
- Multiple log formats (text, json, structured)
- Log aggregation support
- Request correlation IDs

## Common Use Cases

### Web Application Development

```bash
# Development with hot reload
/clojure-run --watch --port 3000 --main my.webapp

# Production-like local testing
/clojure-run --profile prod --port 8080 --memory 4g
```

### Background Job Processing

```bash
# Run worker with monitoring
/clojure-run --main my.worker --memory 2g --monitor

# Multiple instances
/clojure-run --main my.worker --instance 1
/clojure-run --main my.worker --instance 2
```

### CLI Application

```bash
# Run CLI tool
/clojure-run --main my.cli -- arg1 arg2

# With specific JVM options
/clojure-run --main my.cli --jvm-options "-Dconfig.file=config.edn" -- arg1 arg2
```

### Long-Running Service

```bash
# Service with health checks
/clojure-run --main my.service --health --port 8080

# With graceful shutdown
/clojure-run --main my.service --shutdown-timeout 30
```

## Integration

### With REPL

```bash
# Run with REPL enabled
/clojure-run --repl --port 7888

# Connect to running application REPL
/clojure-repl --connect localhost:7888
```

### With Testing

```bash
# Run tests before starting
/clojure-test && /clojure-run

# Development with test watcher
/clojure-run --watch & /clojure-test --watch
```

### With Build Process

```bash
# Build and run
/clojure-build --uberjar && java -jar target/app-standalone.jar

# Or use run command for development
/clojure-run --watch
```

### In CI/CD Pipelines

```bash
# Test run in CI
/clojure-run --main my.app.test-runner --profile test

# Smoke test after deployment
/clojure-run --main my.app.smoke-test --timeout 60
```

## Performance Optimization

### JVM Tuning

```bash
# Optimize for throughput
/clojure-run --jvm-options "-XX:+UseParallelGC -XX:MaxGCPauseMillis=100"

# Optimize for low latency
/clojure-run --jvm-options "-XX:+UseG1GC -XX:MaxGCPauseMillis=50"

# Large heap configuration
/clojure-run --memory 8g --jvm-options "-XX:+UseZGC"
```

### Classpath Optimization

```bash
# Use cached classpath
/clojure-run --cached

# Lazy class loading
/clojure-run --lazy

# AOT compilation for startup
/clojure-run --aot
```

### Monitoring and Adjustment

```bash
# Run with profiling
/clojure-run --profile-cpu --profile-memory

# Auto-adjust based on metrics
/clojure-run --auto-adjust

# Generate flame graphs
/clojure-run --flamegraph
```

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check for missing dependencies
/clojure-deps --check

# Increase startup timeout
/clojure-run --startup-timeout 60

# Run with verbose logging
/clojure-run --verbose --main my.app.core
```

#### Memory Issues

```bash
# Increase heap size
/clojure-run --memory 4g

# Enable GC logging
/clojure-run --jvm-options "-Xlog:gc*:file=gc.log"

# Profile memory usage
/clojure-run --profile-memory --duration 300
```

#### Port Conflicts

```bash
# Use different port
/clojure-run --port 8081

# Check what's using the port
lsof -i :8080

# Bind to specific interface
/clojure-run --host 127.0.0.1 --port 8080
```

### Debugging

#### Remote Debugging

```bash
# Start with debug agent
/clojure-run --debug --port 5005

# Connect with IDE
# IntelliJ: Run -> Debug -> Remote JVM Debug
# VS Code: Java Debugger extension
```

#### Log Analysis

```bash
# Structured logging for analysis
/clojure-run --log-format json --log-level debug

# Log to file
/clojure-run --log-file app.log --log-level info

# Log aggregation
/clojure-run --log-format json | jq '.'
```

#### Performance Issues

```bash
# CPU profiling
/clojure-run --profile-cpu --duration 60

# Generate flame graph
/clojure-run --flamegraph --output flame.svg

# Monitor in real-time
/clojure-run --monitor --interval 5
```

## Advanced Features

### Custom Runtime Hooks

```clojure
;; Add startup hooks
(defn startup-hook []
  (println "Application starting...")
  (initialize-components))

;; Add shutdown hooks
(defn shutdown-hook []
  (println "Application shutting down...")
  (cleanup-components))

;; Register hooks
/clojure-run --hook startup:my.hooks/startup-hook --hook shutdown:my.hooks/shutdown-hook
```

### Dynamic Configuration

```bash
# Environment-specific config
/clojure-run --config dev.config.edn

# Override configuration
/clojure-run --override "db.host=localhost" --override "db.port=5432"

# Use encrypted configuration
/clojure-run --encrypted-config config.encrypted.edn
```

### Cluster Deployment

```bash
# Run as cluster node
/clojure-run --cluster --node node-1 --port 8080

# Join existing cluster
/clojure-run --cluster --join node-1:8080 --port 8081

# Cluster with discovery
/clojure-run --cluster --discovery consul --port 8080
```

## Related Commands

- `/clojure-repl` - Interactive development REPL
- `/clojure-test` - Run tests
- `/clojure-build` - Build applications
- `/clojure-debug` - Debug applications
- `/js-run` - Run JavaScript/TypeScript applications
- `/python-run` - Run Python applications
