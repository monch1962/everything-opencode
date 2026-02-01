# Python Run Command (`/python-run`)

## Overview

The `/python-run` command executes Python scripts and applications with support for various frameworks, environments, and runtime options. It provides a unified interface for running Python code regardless of the project type or framework.

## Features

- **Framework Awareness**: Automatically detects and supports Django, Flask, FastAPI, and standard Python projects
- **Flexible Execution**: Run scripts, modules, or framework-specific commands
- **Environment Management**: Support for virtual environments, environment variables, and configuration
- **Development Features**: Watch mode, auto-reload, debug mode, and port configuration
- **Unified Interface**: Consistent command structure across different Python projects

## Usage

### Basic Usage

```bash
# Run default script (main.py)
/python-run

# Run specific script
/python-run app.py

# Run Python module
/python-run --module http.server 8080

# Run with arguments
/python-run script.py --arg1 value1 --arg2 value2
```

### Command Options

| Option            | Description                             | Example                        |
| ----------------- | --------------------------------------- | ------------------------------ |
| `--script`, `-s`  | Python script to run                    | `--script app.py`              |
| `--args`, `-a`    | Arguments to pass to script             | `--args "--port 8080 --debug"` |
| `--module`, `-m`  | Run Python module with `-m` flag        | `--module http.server`         |
| `--watch`, `-w`   | Watch for file changes and restart      | `--watch`                      |
| `--reload`        | Enable auto-reload (for web frameworks) | `--reload`                     |
| `--port`, `-p`    | Port to run on (for web servers)        | `--port 8000`                  |
| `--host`, `-h`    | Host to bind to (for web servers)       | `--host 0.0.0.0`               |
| `--debug`         | Enable debug mode                       | `--debug`                      |
| `--verbose`, `-v` | Verbose output                          | `--verbose`                    |
| `--quiet`, `-q`   | Minimal output                          | `--quiet`                      |
| `--env`, `-e`     | Environment variables                   | `--env KEY=VALUE,KEY2=VALUE2`  |
| `--setup`         | Show setup instructions                 | `--setup`                      |
| `--help`          | Show help                               | `--help`                       |

## Framework-Specific Usage

### Django Projects

```bash
# Run development server
/python-run --script manage.py runserver
/python-run --script manage.py runserver --port 8000

# Run management commands
/python-run --script manage.py migrate
/python-run --script manage.py createsuperuser
/python-run --script manage.py shell

# With auto-reload
/python-run --script manage.py runserver --reload

# With specific settings
/python-run --env DJANGO_SETTINGS_MODULE=myproject.settings.dev --script manage.py runserver
```

### Flask Projects

```bash
# Run Flask application
/python-run --script app.py

# With environment variables
/python-run --env FLASK_APP=app.py,FLASK_ENV=development --script app.py

# Run on specific port
/python-run --script app.py --args "--port 5000"

# With debug mode
/python-run --script app.py --debug
```

### FastAPI Projects

```bash
# Run with uvicorn
/python-run --module uvicorn main:app --reload --port 8000

# Run with gunicorn (for production)
/python-run --module gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# With specific host
/python-run --module uvicorn main:app --host 0.0.0.0 --port 8000
```

### Standard Python Projects

```bash
# Run main script
/python-run

# Run specific script with arguments
/python-run process_data.py --input data.csv --output results.json

# Run module
/python-run --module mypackage.cli --args "process --verbose"

# Run tests
/python-run --module pytest tests/ --verbose
```

## Advanced Features

### Watch Mode

```bash
# Watch for changes and restart
/python-run --watch app.py

# Watch with specific extensions
/python-run --watch --script app.py --env WATCH_FILES="*.py,*.html,*.css"
```

### Environment Variables

```bash
# Set single variable
/python-run --env DEBUG=true --script app.py

# Set multiple variables
/python-run --env DATABASE_URL=postgres://...,SECRET_KEY=abc123 --script app.py

# Load from .env file (automatically detected)
# Create .env file in project root
DATABASE_URL=postgres://user:pass@localhost/db
DEBUG=true
SECRET_KEY=your-secret-key
```

### Debug Mode

```bash
# Enable debug mode
/python-run --debug --script app.py

# With Python debugger (pdb)
/python-run --script debug_script.py --args "--pdb"

# With debug logging
/python-run --env LOG_LEVEL=DEBUG --script app.py
```

## Configuration

The command reads configuration from `.opencode/project-config.json`:

```json
{
  "python": {
    "framework": "django",
    "defaultScript": "manage.py",
    "defaultArgs": "runserver",
    "environment": {
      "DJANGO_SETTINGS_MODULE": "myproject.settings.dev",
      "DEBUG": "true"
    },
    "watchPatterns": ["*.py", "*.html", "*.css"]
  }
}
```

## Examples

### Complete Examples

```bash
# Django development with auto-reload on custom port
/python-run --script manage.py runserver --reload --port 9000 --env DEBUG=true

# Flask API with JSON logging
/python-run --script api.py --port 5000 --env LOG_FORMAT=json,LOG_LEVEL=info

# Data processing script with input/output
/python-run process.py --input large_dataset.csv --output results.json --verbose

# Run tests with coverage
/python-run --module pytest tests/ --cov=myapp --cov-report=html

# Background task worker
/python-run --script worker.py --env REDIS_URL=redis://...,QUEUE_NAME=default
```

### Development Workflow

```bash
# 1. Setup project
/python-setup

# 2. Install dependencies
/python-deps install

# 3. Run development server with watch mode
/python-run --watch --reload --port 8000

# 4. In another terminal, run tests
/python-test --watch

# 5. Check code quality
/python-lint --fix
```

## Integration with Other Commands

### Combined with Setup

```bash
# Quick start for new projects
/python-setup --quick
/python-run --setup  # Shows framework-specific run commands
```

### Combined with Testing

```bash
# Run tests before starting server
/python-test && /python-run --script app.py

# Or in watch mode
/python-run --watch --script app.py &
/python-test --watch
```

### Combined with Security

```bash
# Security check before running
/python-security --bandit-only && /python-run --script app.py
```

## Best Practices

### 1. Use Virtual Environments

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Unix/macOS
# or
venv\Scripts\activate     # On Windows

# Then run your application
/python-run --script app.py
```

### 2. Environment Configuration

```bash
# Use .env file for sensitive data
echo "SECRET_KEY=$(openssl rand -hex 32)" > .env
echo "DATABASE_URL=postgres://..." >> .env

# Run with environment
/python-run --script app.py
```

### 3. Production vs Development

```bash
# Development (with debug and auto-reload)
/python-run --script manage.py runserver --reload --debug --port 8000

# Production (no debug, specific settings)
/python-run --env DJANGO_SETTINGS_MODULE=myproject.settings.prod \
  --script manage.py runserver --port 8000
```

### 4. Logging and Monitoring

```bash
# With structured logging
/python-run --env LOG_FORMAT=json,LOG_LEVEL=info --script app.py

# Redirect output to log file
/python-run --script app.py > app.log 2>&1

# With process manager (like pm2 for Python)
pm2 start "/python-run --script app.py" --name myapp
```

## Troubleshooting

### Common Issues

1. **Module not found**

   ```
   ModuleNotFoundError: No module named 'myapp'
   ```

   **Solution**: Ensure Python path is set correctly or install the package

2. **Port already in use**

   ```
   OSError: [Errno 98] Address already in use
   ```

   **Solution**: Use different port or stop existing process

3. **Permission denied**

   ```
   PermissionError: [Errno 13] Permission denied
   ```

   **Solution**: Check file permissions or run with appropriate user

4. **Environment variables not set**
   ```
   KeyError: 'DATABASE_URL'
   ```
   **Solution**: Set environment variables with `--env` or `.env` file

### Debugging Tips

```bash
# Run with verbose output
/python-run --verbose --script app.py

# Check Python version and environment
python --version
which python
echo $PYTHONPATH

# Test script directly
python -c "import sys; print(sys.path)"
python app.py --help
```

## Related Commands

- `/python-setup` - Configure Python project
- `/python-test` - Run tests
- `/python-lint` - Code quality checks
- `/python-deps` - Dependency management
- `/python-security` - Security scanning
- `/python-clean` - Clean build artifacts

## References

- [Python Documentation](https://docs.python.org/3/using/cmdline.html)
- [Django runserver](https://docs.djangoproject.com/en/stable/ref/django-admin/#runserver)
- [Flask CLI](https://flask.palletsprojects.com/en/stable/cli/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Uvicorn](https://www.uvicorn.org/)
- [Gunicorn](https://gunicorn.org/)
