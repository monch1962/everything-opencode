# /elixir-run

Run Elixir applications with Elixir-specific improvements.

## Description

The `/elixir-run` command executes Elixir applications with intelligent project awareness, automatic compilation, environment configuration, and application argument forwarding. It supports various application types including Phoenix servers, command-line tools, background workers, and one-off scripts.

## Usage

```bash
/elixir-run [options] [--] [application-arguments]
```

## Options

| Option              | Description                                   |
| ------------------- | --------------------------------------------- |
| `--no-compile`      | Skip compilation before running               |
| `--verbose`, `-v`   | Verbose output                                |
| `--env ENVIRONMENT` | Set Mix environment: `dev`, `test`, or `prod` |
| `--detached`, `-d`  | Run in detached mode (for servers)            |
| `--help`, `-h`      | Show help message                             |

## Application Arguments

Arguments passed after `--` are forwarded to the Elixir application. If no `--` is present, all arguments are forwarded to the application.

**Example:**

```bash
# These are equivalent
/elixir-run -- --port 4000 --name myapp
/elixir-run --port 4000 --name myapp
```

## Features

### Automatic Compilation

- Compiles project before running (unless `--no-compile`)
- Only recompiles changed files
- Shows compilation progress and errors
- Handles dependency compilation

### Environment Awareness

- Loads environment-specific configuration
- Sets appropriate Mix environment
- Configures logging based on environment
- Applies environment-specific optimizations

### Application Types

#### 1. Phoenix Web Servers

```bash
# Development server
/elixir-run --verbose

# Production server
/elixir-run --env prod -- --port 4000

# Detached production server
/elixir-run --env prod --detached -- --port 4000
```

#### 2. Command-Line Tools

```bash
# Run custom Mix task
/elixir-run -- --migrate

# Run with arguments
/elixir-run -- --seed --count 100

# Run in test environment
/elixir-run --env test -- --verify
```

#### 3. Background Workers

```bash
# Run worker in production
/elixir-run --env prod --detached

# Run with specific queue
/elixir-run --env prod -- --queue high_priority
```

#### 4. One-off Scripts

```bash
# Run data migration
/elixir-run -- --migrate-data

# Run cleanup task
/elixir-run -- --cleanup-old-data
```

#### 5. Interactive Sessions

```bash
# Run IEx with project context
/elixir-run -- --iex

# Run with specific modules loaded
/elixir-run -- --iex -S mix
```

## Examples

### Basic Usage

```bash
# Run default application
/elixir-run

# Run with verbose output
/elixir-run --verbose

# Run without recompiling
/elixir-run --no-compile
```

### Environment Configuration

```bash
# Development (default)
/elixir-run --env dev

# Testing
/elixir-run --env test -- --seed 12345

# Production
/elixir-run --env prod --detached -- --port 4000
```

### Server Management

```bash
# Start Phoenix server
/elixir-run --verbose -- --server

# Start on specific port
/elixir-run -- --port 8080

# Start with SSL
/elixir-run -- --ssl --ssl-port 8443
```

### Task Execution

```bash
# Run Ecto migrations
/elixir-run -- --migrate

# Run seeds
/elixir-run -- --seed

# Run custom Mix task
/elixir-run -- --my-custom-task arg1 arg2
```

### Advanced Examples

```bash
# Run with custom node name
/elixir-run -- --name myapp@localhost

# Run with distributed Erlang
/elixir-run -- --sname myapp --cookie secret

# Run with profiling
/elixir-run -- --profile cpu
```

## Integration

### Process Management

```bash
# Start as background process
/elixir-run --detached -- --port 4000

# Check if running
ps aux | grep beam

# Stop gracefully
pkill -TERM beam.smp
```

### Docker Integration

```dockerfile
# Dockerfile
FROM elixir:1.19

WORKDIR /app
COPY . .

# Run application
CMD ["/elixir-run", "--env", "prod", "--", "--port", "4000"]
```

### Systemd Service

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Elixir Application
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/myapp
ExecStart=/elixir-run --env prod --detached -- --port 4000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### CI/CD Pipeline

```yaml
# GitHub Actions
- name: Run tests
  run: /elixir-run --env test -- --seed ${{ github.run_id }}

- name: Run migrations
  run: /elixir-run --env prod -- --migrate
```

## Configuration

### Project Configuration

Configure run behavior via `/elixir-setup`:

```bash
/elixir-setup --configure-run
```

**Configuration options:**

- Default environment
- Compilation settings
- Logging configuration
- Resource limits
- Signal handling
- Application arguments
- Environment variables

### Environment Files

Create environment-specific configuration:

```elixir
# config/dev.exs
config :my_app,
  port: 4000,
  debug_errors: true

# config/prod.exs
config :my_app,
  port: 80,
  cache_static_manifest: "priv/static/cache_manifest.json"
```

### Runtime Configuration

Set runtime configuration via environment variables:

```bash
# Set database URL
DATABASE_URL=postgres://user:pass@localhost/db /elixir-run

# Set secret key base
SECRET_KEY_BASE=$(openssl rand -base64 64) /elixir-run --env prod
```

## Best Practices

### 1. Environment Separation

```bash
# Development
/elixir-run --env dev --verbose

# Testing
/elixir-run --env test -- --seed random

# Production
/elixir-run --env prod --detached -- --port 4000
```

### 2. Resource Management

```bash
# Monitor resource usage
/elixir-run --verbose  # Shows memory and CPU usage

# Set limits
ELIXIR_ERL_OPTS="+P 1000000" /elixir-run  # Process limit
```

### 3. Logging Configuration

```bash
# Structured logging
/elixir-run -- --logger-format json

# Log level control
LOG_LEVEL=debug /elixir-run --verbose
```

### 4. Health Checks

```bash
# Add health check endpoint
/elixir-run -- --health-check

# Monitor application health
curl http://localhost:4000/health
```

### 5. Graceful Shutdown

```bash
# Handle signals gracefully
trap 'pkill -TERM beam.smp' SIGTERM
/elixir-run --detached
```

## Common Issues and Solutions

### Compilation Errors

```bash
# Show detailed errors
/elixir-run --verbose

# Clean and retry
/elixir-clean
/elixir-run
```

### Port Already in Use

```bash
# Use different port
/elixir-run -- --port 4001

# Find and kill process
lsof -ti:4000 | xargs kill -9
```

### Memory Issues

```bash
# Increase memory limit
ELIXIR_ERL_OPTS="+MMscs 1024" /elixir-run

# Monitor memory usage
/elixir-run --verbose | grep -i memory
```

### Dependency Issues

```bash
# Update dependencies
/elixir-deps update --all

# Clean and rebuild
/elixir-clean --all
/elixir-run
```

## Exit Codes

| Code | Description                           |
| ---- | ------------------------------------- |
| 0    | Success - Application exited normally |
| 1    | Failure - Application error           |
| 2    | Compilation error                     |
| 3    | Configuration error                   |
| 130  | Interrupted - SIGINT (Ctrl+C)         |
| 143  | Terminated - SIGTERM                  |

## Related Commands

- `/elixir-compile` - Compile without running
- `/elixir-test` - Run tests
- `/elixir-deps` - Manage dependencies
- `/elixir-clean` - Clean before running
- `/elixir-setup` - Configure run behavior

## Environment Variables

- `MIX_ENV` - Mix environment
- `PORT` - Application port
- `DATABASE_URL` - Database connection
- `SECRET_KEY_BASE` - Application secret
- `ELIXIR_ERL_OPTS` - Erlang VM options
- `LOG_LEVEL` - Logging level
- `HOSTNAME` - Application hostname

## Notes

- Applications are compiled in development mode by default
- Production mode enables optimizations and caching
- Detached mode is recommended for servers
- Signal handling allows graceful shutdown
- Resource limits prevent memory exhaustion
- Logging is configured based on environment
- Configuration is loaded from appropriate files
- Application arguments are properly forwarded
- Exit codes indicate application status

## Resources

- [Mix Task Runner](https://hexdocs.pm/mix/Mix.html)
- [Phoenix Server Guide](https://hexdocs.pm/phoenix/Phoenix.Endpoint.html)
- [Erlang VM Options](https://erlang.org/doc/man/erl.html)
- [Elixir Releases](https://hexdocs.pm/mix/Mix.Tasks.Release.html)
- [Process Management](https://hexdocs.pm/elixir/Process.html)
