# /elixir-setup

Configure Elixir project for opencode integration.

## Description

Interactive wizard for setting up Elixir projects with opencode, configuring tools, dependencies, and project structure. Detects existing Elixir projects and guides through configuration options.

## Usage

```bash
/elixir-setup [options]
```

## Options

### Setup Mode

- `--quick` - Quick setup with automatic detection
- `--interactive` - Interactive setup wizard (default)
- `--minimal` - Minimal configuration
- `--full` - Full configuration with all options

### Configuration Options

- `--force` - Force setup even if already configured
- `--reset` - Reset existing configuration
- `--update` - Update existing configuration
- `--validate` - Validate current configuration

### Output Options

- `--verbose` - Verbose output
- `--quiet` - Minimal output
- `--json` - Output configuration as JSON
- `--dry-run` - Show what would be configured

### Help

- `--help, -h` - Show help message

## Examples

```bash
# Interactive setup wizard
/elixir-setup

# Quick automatic setup
/elixir-setup --quick

# Minimal configuration
/elixir-setup --minimal

# Force setup even if configured
/elixir-setup --force

# Update existing configuration
/elixir-setup --update

# Validate current configuration
/elixir-setup --validate

# Output configuration as JSON
/elixir-setup --json
```

## Setup Process

### 1. Project Detection

- Detects Elixir project structure
- Checks for `mix.exs` and Elixir files
- Identifies project type (Phoenix, Ecto, Library, etc.)
- Detects existing tools and dependencies

### 2. Tool Configuration

- **Mix** - Project build tool
- **Hex** - Package manager
- **Credo** - Code linting
- **Dialyzer** - Type checking
- **ExUnit** - Testing framework
- **Formatter** - Code formatting

### 3. Project Type Configuration

- **Phoenix** - Web framework setup
- **Ecto** - Database integration
- **Library** - Package configuration
- **CLI** - Command-line tool setup
- **Umbrella** - Multi-app project setup

### 4. Integration Configuration

- Editor configuration (VS Code, IntelliJ, etc.)
- CI/CD pipeline setup
- Docker configuration
- Deployment settings

## Configuration Options

### Project Structure

```elixir
# Directory layout
project/
├── lib/          # Source code
├── test/         # Tests
├── config/       # Configuration
├── priv/         # Private assets
├── assets/       # Frontend assets (Phoenix)
└── .opencode/    # opencode configuration
```

### Tool Configuration

```elixir
# mix.exs dependencies
defp deps do
  [
    # Development tools
    {:credo, "~> 1.6", only: [:dev, :test], runtime: false},
    {:dialyxir, "~> 1.0", only: [:dev], runtime: false},
    {:ex_doc, "~> 0.27", only: :dev, runtime: false},

    # Testing
    {:excoveralls, "~> 0.10", only: :test},

    # Optional tools
    {:sobelow, "~> 0.8", only: [:dev, :test]},
    {:mix_audit, "~> 0.1", only: [:dev, :test]}
  ]
end
```

### opencode Configuration

```json
{
  "language": "elixir",
  "version": "1.14.0",
  "tools": {
    "mix": true,
    "hex": true,
    "credo": true,
    "dialyzer": true,
    "exunit": true,
    "formatter": true
  },
  "project_type": "phoenix",
  "config_files": {
    "mix.exs": true,
    ".formatter.exs": true,
    ".credo.exs": true,
    ".dialyzer.exs": true
  }
}
```

## Project Types

### Phoenix Web Application

```elixir
# Features
- Web framework with LiveView
- Database integration with Ecto
- Asset compilation
- WebSocket support
- Authentication/authorization

# Configuration
- Endpoint configuration
- Database setup
- Asset pipeline
- Deployment settings
```

### Library Package

```elixir
# Features
- Hex package publishing
- Documentation generation
- Version management
- Dependency management

# Configuration
- Package metadata
- Documentation settings
- Version constraints
- CI/CD for publishing
```

### CLI Application

```elixir
# Features
- Command-line interface
- Argument parsing
- Configuration management
- Logging and output

# Configuration
- CLI framework (OptionParser, etc.)
- Command structure
- Help system
- Installation method
```

### Umbrella Project

```elixir
# Features
- Multiple applications
- Shared dependencies
- Independent deployment
- Cross-app communication

# Configuration
- App boundaries
- Shared configuration
- Dependency sharing
- Testing strategy
```

## Integration Features

### Editor Support

- **VS Code**: ElixirLS, Phoenix Framework tools
- **IntelliJ**: Elixir plugin with debugger
- **Emacs**: alchemist, flycheck-elixir
- **Vim**: vim-elixir, ale

### CI/CD Pipelines

```yaml
# GitHub Actions example
name: Elixir CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - uses: erlef/setup-elixir@v1
        with:
          elixir-version: "1.14"
          otp-version: "25"
      - run: mix deps.get
      - run: mix compile --warnings-as-errors
      - run: mix credo --strict
      - run: mix test
      - run: mix dialyzer
```

### Docker Configuration

```dockerfile
# Dockerfile example
FROM elixir:1.14-alpine AS builder
WORKDIR /app
COPY mix.exs mix.lock ./
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get --only prod
COPY . .
RUN mix compile --force && \
    mix release

FROM alpine:latest
RUN apk add --no-cache openssl ncurses-libs
WORKDIR /app
COPY --from=builder /app/_build/prod/rel/my_app .
CMD ["./bin/my_app", "start"]
```

## Common Setup Issues

### Missing Dependencies

```bash
# Install Elixir
brew install elixir  # macOS
apt-get install elixir  # Ubuntu

# Install Hex
mix local.hex --force

# Install Rebar
mix local.rebar --force
```

### Configuration Conflicts

```bash
# Reset configuration
rm -rf .opencode/
/elixir-setup --reset

# Update configuration
/elixir-setup --update

# Validate configuration
/elixir-setup --validate
```

### Project Detection Issues

```bash
# Ensure mix.exs exists
touch mix.exs

# Initialize new project
mix new my_project

# Convert existing project
mix phx.new . --app my_app --no-ecto --no-html --no-gettext --no-dashboard --no-mailer
```

## Migration from Other Tools

### From asdf

```bash
# Install Elixir plugin
asdf plugin-add elixir
asdf install elixir 1.14.0
asdf global elixir 1.14.0
```

### From kiex

```bash
# Install Elixir
kiex install 1.14.0
kiex use 1.14.0
```

### From exenv

```bash
# Install Elixir
exenv install 1.14.0
exenv global 1.14.0
```

## Performance Optimization

### Compilation Speed

- Use `MIX_ENV=prod` for production builds
- Enable incremental compilation
- Cache dependencies in CI/CD
- Use `--no-deps-check` for faster builds

### Tool Configuration

- Configure Credo checks selectively
- Use Dialyzer PLT caching
- Enable parallel test execution
- Use formatter caching

### Large Projects

- Consider umbrella structure
- Use application boundaries
- Implement module lazy loading
- Optimize dependency tree

## Related Commands

- `/elixir-compile` - Compile configured project
- `/elixir-test` - Test configured project
- `/elixir-lint` - Lint configured project
- `/elixir-format` - Format configured project
- `/elixir-deps` - Manage dependencies
- `/elixir-typecheck` - Type check configured project

## Environment Variables

- `MIX_ENV` - Mix environment (dev, test, prod)
- `HEX_API_KEY` - Hex API key for private packages
- `DATABASE_URL` - Database connection URL
- `SECRET_KEY_BASE` - Phoenix secret key base

## Notes

- Requires Elixir 1.7 or later for full feature support
- Phoenix projects require Node.js for assets
- Database configuration may require additional setup
- Production deployment requires release configuration
- Configuration is stored in `.opencode/project-config.json`
- Can be re-run to update configuration as project evolves
