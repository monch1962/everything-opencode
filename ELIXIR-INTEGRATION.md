# Elixir Language Support

Complete Elixir integration system for opencode with interactive configuration, smart detection, and command automation for Elixir development.

## Overview

This integration provides comprehensive Elixir language support with Elixir-specific improvements, including Phoenix framework support, Dialyzer type checking, Credo linting, and modern Elixir development workflows.

## Architecture

```
everything-opencode/
├── languages/elixir/               # Elixir-specific wizards
│   ├── config-wizard.js            # Elixir configuration wizard
│   └── tool-detector.js            # Elixir tool detection
├── scripts/elixir/                 # Elixir utilities
│   └── command-runner.js           # Elixir command runner
├── scripts/commands/               # Command implementations
│   ├── elixir-setup.js            # /elixir-setup command
│   ├── elixir-compile.js          # /elixir-compile command
│   ├── elixir-test.js             # /elixir-test command
│   ├── elixir-lint.js             # /elixir-lint command
│   ├── elixir-format.js           # /elixir-format command
│   ├── elixir-deps.js             # /elixir-deps command
│   └── elixir-typecheck.js        # /elixir-typecheck command
├── commands/                       # Command documentation
│   ├── elixir-setup.md
│   ├── elixir-compile.md
│   ├── elixir-test.md
│   ├── elixir-lint.md
│   ├── elixir-format.md
│   ├── elixir-deps.md
│   └── elixir-typecheck.md
├── examples/elixir-projects/       # Project templates
│   └── hello-world/
└── ELIXIR-INTEGRATION.md          # This documentation
```

## Features

### 1. Smart Project Detection

- **Elixir project types**: Application, Phoenix Web App, Umbrella Project, Library, OTP Application
- **Version detection**: Elixir and Erlang/OTP version detection
- **Tool detection**: Mix, Hex, Credo, Dialyzer, Phoenix, Ecto
- **Automatic configuration**: Based on project type and existing setup

### 2. Interactive Configuration

- **Project type selection**: Interactive wizard for project setup
- **Tool configuration**: Automatic tool detection and setup
- **Environment setup**: MIX_ENV configuration and optimization
- **Customization**: Project-specific configuration options

### 3. Command Automation

- **Complete workflow**: Setup → Compile → Test → Lint → Format → Type Check
- **Error handling**: Intelligent error suggestions and fixes
- **Progress reporting**: Clear status updates and progress indicators
- **Performance optimization**: Parallel execution where possible

## Commands

### Core Commands

#### `/elixir-setup`

Configure Elixir project for opencode integration with Elixir-specific improvements.

```bash
# Basic setup
/elixir-setup

# Quick setup with defaults
/elixir-setup --quick

# Phoenix web application
/elixir-setup --project-type phoenix

# Reconfigure existing project
/elixir-setup --reconfigure
```

#### `/elixir-compile`

Compile Elixir project with optimizations and error handling.

```bash
# Basic compilation
/elixir-compile

# Force clean compilation
/elixir-compile --force

# Compile in test environment
/elixir-compile --env test

# Strict compilation with warnings as errors
/elixir-compile --warnings-as-errors
```

#### `/elixir-test`

Run ExUnit tests with coverage, filtering, and performance analysis.

```bash
# Run all tests
/elixir-test

# Run with coverage
/elixir-test --coverage

# Run specific test file
/elixir-test test/my_test.exs

# Run with specific seed
/elixir-test --seed 12345

# Show slowest tests
/elixir-test --slowest 10
```

#### `/elixir-lint`

Lint code with Credo for code quality and consistency.

```bash
# Basic linting
/elixir-lint

# Strict linting
/elixir-lint --strict

# Lint specific files
/elixir-lint lib/my_module.ex

# JSON output format
/elixir-lint --format json
```

#### `/elixir-format`

Format code with Elixir's built-in formatter.

```bash
# Format all files
/elixir-format

# Check formatting without changes
/elixir-format --check

# Format specific files
/elixir-format lib/my_module.ex

# Dry run to see changes
/elixir-format --dry-run
```

#### `/elixir-deps`

Manage dependencies with Mix and Hex.

```bash
# Get all dependencies
/elixir-deps get

# Update specific package
/elixir-deps update phoenix

# Show dependency tree
/elixir-deps tree

# Show outdated dependencies
/elixir-deps outdated

# Unlock all dependencies
/elixir-deps unlock --all
```

#### `/elixir-typecheck`

Type check with Dialyzer for static analysis.

```bash
# Basic type checking
/elixir-typecheck

# Ignore warnings
/elixir-typecheck --ignore-warnings

# List unused functions
/elixir-typecheck --list-unused

# Short output format
/elixir-typecheck --format short
```

## Project Types

### 1. Simple Application

Basic Elixir application with supervision tree.

```elixir
# mix.exs example
defmodule MyApp.MixProject do
  use Mix.Project

  def project do
    [
      app: :my_app,
      version: "1.0.0",
      elixir: "~> 1.19",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {MyApp.Application, []}
    ]
  end

  defp deps do
    []
  end
end
```

### 2. Phoenix Web Application

Full-featured web application with Phoenix framework.

```bash
# Setup Phoenix project
/elixir-setup --project-type phoenix --app-name my_phoenix_app

# Features included:
# • LiveView support
# • Ecto database integration
# • Asset pipeline
# • Authentication scaffolding
# • API endpoint generation
```

### 3. Umbrella Project

Multi-application Elixir project for complex systems.

```bash
# Setup umbrella project
/elixir-setup --project-type umbrella

# Structure:
# apps/
#   ├── web_app/      # Phoenix web interface
#   ├── admin_app/    # Admin interface
#   ├── core/         # Business logic
#   └── workers/      # Background jobs
```

### 4. Library/Package

Reusable Elixir library for distribution on Hex.pm.

```elixir
# Library configuration
defmodule MyLib.MixProject do
  use Mix.Project

  def project do
    [
      app: :my_lib,
      version: "1.0.0",
      elixir: "~> 1.19",
      description: "My awesome library",
      package: [
        licenses: ["MIT"],
        links: %{"GitHub" => "https://github.com/user/my_lib"}
      ],
      deps: deps()
    ]
  end
end
```

### 5. OTP Application

Production OTP application with supervision and release support.

```bash
# OTP application features:
# • Supervision trees
# • GenServer processes
# • Dynamic supervision
# • Release configuration
# • Hot code upgrades
```

## Tool Integration

### Credo Configuration

Static code analysis with 60+ checks.

```elixir
# .credo.exs
%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "src/", "test/", "web/", "apps/"],
        excluded: []
      },
      checks: [
        {Credo.Check.Consistency.ExceptionNames},
        {Credo.Check.Consistency.LineEndings},
        {Credo.Check.Design.AliasUsage, priority: :low},
        {Credo.Check.Readability.MaxLineLength, priority: :low, max_length: 98}
      ]
    }
  ]
}
```

### Dialyzer Configuration

Type checking and static analysis.

```elixir
# config/config.exs
config :dialyxir,
  plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
  flags: [
    :error_handling,
    :race_conditions,
    :underspecs
  ],
  ignore_warnings: "dialyzer.ignore"
```

### Formatter Configuration

Code formatting with consistent style.

```elixir
# .formatter.exs
[
  import_deps: [:ecto, :phoenix],
  inputs: ["*.{ex,exs}", "{config,lib,test}/**/*.{ex,exs}"],
  line_length: 98,
  locals_without_parens: [
    # Ecto
    field: 3,
    belongs_to: 3,
    # Phoenix
    pipe_through: 1,
    resources: 2
  ]
]
```

## Development Workflow

### 1. Project Setup

```bash
# Create new project
mkdir my_elixir_app && cd my_elixir_app

# Configure with opencode
/elixir-setup --project-type application --app-name my_app

# Install dependencies
/elixir-deps get
```

### 2. Development Cycle

```bash
# Compile project
/elixir-compile

# Run tests
/elixir-test --coverage

# Lint code
/elixir-lint --strict

# Format code
/elixir-format

# Type check
/elixir-typecheck
```

### 3. Continuous Integration

```bash
# CI pipeline example
/elixir-compile --env test
/elixir-test --coverage --max-failures 1
/elixir-lint --strict
/elixir-format --check
/elixir-typecheck --ignore-warnings
```

## Environment Variables

### Essential Variables

```bash
# Elixir environment
export MIX_ENV=prod
export MIX_QUIET=1

# Hex configuration
export HEX_HOME="$HOME/.hex"
export HEX_MIRROR="https://hex.pm"

# Dialyzer PLT location
export DIALYZER_PLT="$HOME/.dialyzer_plt"
```

### Development Variables

```bash
# Development optimizations
export ERL_AFLAGS="-kernel shell_history enabled"
export ELIXIR_ERL_OPTIONS="+sssdio 256"

# Phoenix development
export PHX_HOST=localhost
export PHX_PORT=4000
export DATABASE_URL="postgres://localhost/myapp_dev"
```

## Error Handling

### Common Issues and Solutions

#### 1. Compilation Errors

```bash
# Missing dependencies
/elixir-deps get

# Stale artifacts
/elixir-compile --force

# Version conflicts
# Check mix.exs dependencies
```

#### 2. Test Failures

```bash
# Random test failures
/elixir-test --seed 12345

# Slow tests
/elixir-test --slowest 10

# Coverage issues
/elixir-test --coverage
```

#### 3. Linting Issues

```bash
# Install Credo if missing
mix archive.install hex credo --force

# Custom configuration
# Create .credo.exs

# Ignore specific files
# Add to .credo.exs excluded list
```

#### 4. Type Checking Issues

```bash
# Build PLT first
mix dialyzer --plt

# Add type specifications
@spec function_name(type1, type2) :: return_type

# Ignore false positives
# Add to dialyzer.ignore
```

## Performance Optimization

### Compilation Optimization

```bash
# Parallel compilation
/elixir-compile --long-compilation

# Profile compilation
/elixir-compile --profile

# Environment-specific compilation
/elixir-compile --env prod
```

### Test Optimization

```bash
# Parallel test execution
# Set async: true in test files

# Test filtering
/elixir-test --only "integration"

# Failure limiting
/elixir-test --max-failures 3
```

### Dependency Optimization

```bash
# Clean dependency cache
/elixir-deps clean

# Update outdated dependencies
/elixir-deps outdated
/elixir-deps update --all

# Lock dependencies for production
/elixir-deps get --only prod
```

## Integration with Other Tools

### Editor Integration

- **VS Code**: ElixirLS extension
- **IntelliJ**: Elixir plugin
- **Vim/Neovim**: ale or coc-elixir
- **Emacs**: alchemist or elixir-mode

### CI/CD Integration

- **GitHub Actions**: elixir-setup action
- **GitLab CI**: elixir image
- **CircleCI**: circleci/elixir image
- **Docker**: elixir:latest image

### Monitoring and Observability

- **Telemetry**: Application metrics
- **AppSignal**: Performance monitoring
- **New Relic**: APM for Elixir
- **Prometheus**: Metrics collection

## Best Practices

### 1. Code Organization

```elixir
# Module organization
lib/
├── my_app/
│   ├── application.ex
│   ├── supervisor.ex
│   └── web/
│       ├── endpoint.ex
│       ├── router.ex
│       └── controllers/
└── my_app.ex
```

### 2. Testing Strategy

```elixir
# Test organization
test/
├── my_app_test.exs
├── integration/
│   └── api_test.exs
├── support/
│   └── test_helpers.ex
└── test_helper.exs
```

### 3. Documentation

```elixir
# Module documentation
@moduledoc """
Main application module.

## Examples

    iex> MyApp.hello()
    :world
"""

# Function documentation
@doc """
Returns a greeting.

## Examples

    iex> MyApp.greet("world")
    "Hello, world!"
"""
def greet(name), do: "Hello, #{name}!"
```

### 4. Error Handling

```elixir
# With result tuples
def get_user(id) do
  case Repo.get(User, id) do
    nil -> {:error, :not_found}
    user -> {:ok, user}
  end
end

# With with syntax
def create_order(params) do
  with {:ok, user} <- get_user(params.user_id),
       {:ok, product} <- get_product(params.product_id),
       {:ok, order} <- Order.create(user, product) do
    {:ok, order}
  else
    error -> error
  end
end
```

## Migration from Other Languages

### From Ruby/Rails

```elixir
# Ruby -> Elixir comparison
# Ruby: User.find(1)
# Elixir: Repo.get(User, 1)

# Ruby: User.where(name: "John")
# Elixir: from(u in User, where: u.name == "John") |> Repo.all()

# Ruby: user.save
# Elixir: Repo.insert(user) or Repo.update(user)
```

### From JavaScript/Node.js

```elixir
# JavaScript -> Elixir comparison
# JS: async function getData() { return await fetch() }
# Elixir: def get_data(), do: HTTPoison.get(url)

# JS: try { ... } catch (error) { ... }
# Elixir: try do ... rescue error -> ... end

# JS: const user = { name: "John", age: 30 }
# Elixir: user = %{name: "John", age: 30}
```

### From Python

```elixir
# Python -> Elixir comparison
# Python: def add(a, b): return a + b
# Elixir: def add(a, b), do: a + b

# Python: users = [user for user in users if user.active]
# Elixir: Enum.filter(users, & &1.active)

# Python: with open('file.txt') as f: data = f.read()
# Elixir: File.read("file.txt")
```

## Resources

### Official Documentation

- [Elixir Language](https://elixir-lang.org/docs.html)
- [Mix Build Tool](https://hexdocs.pm/mix/Mix.html)
- [Hex Package Manager](https://hex.pm/docs)
- [Phoenix Framework](https://hexdocs.pm/phoenix/overview.html)

### Community Resources

- [Elixir Forum](https://elixirforum.com)
- [Elixir Slack](https://elixir-slackin.herokuapp.com)
- [Elixir Weekly](https://elixirweekly.net)
- [Elixir Radar](https://elixir-radar.com)

### Learning Resources

- [Elixir School](https://elixirschool.com)
- [Exercism Elixir Track](https://exercism.org/tracks/elixir)
- [Elixir in Action](https://www.manning.com/books/elixir-in-action)
- [Programming Elixir](https://pragprog.com/titles/elixir16/programming-elixir-1-6/)

## Contributing

### Adding New Features

1. Follow existing patterns in `languages/elixir/`
2. Add comprehensive documentation
3. Include example projects
4. Update integration guide

### Testing Changes

```bash
# Run Elixir tests
/elixir-test

# Check code quality
/elixir-lint --strict

# Verify type checking
/elixir-typecheck

# Ensure formatting
/elixir-format --check
```

### Documentation Updates

1. Update command documentation in `commands/`
2. Update integration guide
3. Add example code
4. Include migration guides

## License

This Elixir integration is part of the everything-opencode project and follows the same licensing terms.

## Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing documentation
- Refer to Elixir community resources
- Review example projects
