# /elixir-deps

Manage Elixir dependencies with Mix and Hex.

## Description

Manages Elixir project dependencies including fetching, updating, cleaning, and auditing. Integrates with Hex package manager and provides dependency resolution, version locking, and security auditing.

## Usage

```bash
/elixir-deps [command] [options]
```

## Commands

### Dependency Management

- `get` - Fetch dependencies (default)
- `update` - Update dependencies
- `clean` - Remove unused dependencies
- `compile` - Compile dependencies
- `tree` - Show dependency tree
- `audit` - Audit dependencies for security issues

### Information

- `list` - List dependencies
- `outdated` - Show outdated dependencies
- `info <package>` - Show package information
- `search <query>` - Search Hex packages

## Options

### General Options

- `--all` - Apply to all dependencies
- `--only <env>` - Only for specific environment
- `--no-archives` - Don't check archives
- `--no-compile` - Don't compile after fetching
- `--no-ensure` - Don't ensure dependencies are fetched
- `--verbose` - Verbose output
- `--quiet` - Minimal output

### Update Options

- `--major` - Allow major version updates
- `--minor` - Allow minor version updates (default)
- `--patch` - Only patch updates
- `--pre` - Include pre-releases

### Audit Options

- `--critical` - Only show critical vulnerabilities
- `--high` - Show high and critical vulnerabilities
- `--medium` - Show medium, high, and critical vulnerabilities
- `--json` - Output audit results as JSON

### Help

- `--help, -h` - Show help message

## Examples

```bash
# Fetch dependencies
/elixir-deps get

# Update all dependencies
/elixir-deps update --all

# Update specific dependency
/elixir-deps update phoenix

# Show dependency tree
/elixir-deps tree

# List outdated dependencies
/elixir-deps outdated

# Clean unused dependencies
/elixir-deps clean

# Audit dependencies for security issues
/elixir-deps audit

# Show package information
/elixir-deps info phoenix

# Search for packages
/elixir-deps search "web framework"
```

## Dependency Management

### mix.exs Configuration

```elixir
defp deps do
  [
    # Production dependencies
    {:phoenix, "~> 1.7.0"},
    {:phoenix_html, "~> 3.3"},
    {:phoenix_live_view, "~> 0.20.0"},
    {:ecto_sql, "~> 3.10"},
    {:postgrex, ">= 0.0.0"},

    # Development dependencies
    {:phoenix_live_reload, "~> 1.2", only: :dev},
    {:esbuild, "~> 0.7", runtime: false},

    # Test dependencies
    {:excoveralls, "~> 0.10", only: :test},

    # Optional dependencies
    {:jason, "~> 1.2", optional: true},

    # Overrides
    {:plug, "~> 1.14", override: true}
  ]
end
```

### Version Constraints

- `~> 1.2.3` - >= 1.2.3 and < 1.3.0
- `>= 1.2.3 and < 2.0.0` - Explicit range
- `== 1.2.3` - Exact version
- `> 1.2.3` - Greater than
- `>= 1.2.3` - Greater than or equal
- `<= 1.2.3` - Less than or equal

## Hex Integration

### Package Sources

- **Hex** - Default package repository
- **Git** - Git repositories
- **Path** - Local paths
- **Custom** - Custom repositories

### Git Dependencies

```elixir
{:phoenix, git: "https://github.com/phoenixframework/phoenix.git", tag: "v1.7.0"}
```

### Local Dependencies

```elixir
{:my_lib, path: "../my_lib"}
```

## Security Auditing

### Vulnerability Checks

- CVEs from National Vulnerability Database
- Hex package advisories
- Dependency confusion prevention
- Malicious package detection

### Audit Reports

- Severity levels (critical, high, medium, low)
- Affected versions
- Remediation advice
- CVE references

## Performance Tips

### Dependency Resolution

- Use specific version constraints
- Avoid overly permissive ranges
- Regularly update dependencies
- Clean unused dependencies

### Compilation Caching

- Dependencies are cached in `_build/`
- Lock file ensures reproducible builds
- Clean cache with `mix deps.clean --all`

### Large Projects

- Use umbrella projects for separation
- Consider application boundaries
- Monitor dependency tree depth

## Common Issues

### Dependency Conflicts

```bash
# Check for conflicts
mix deps.tree --only conflicts

# Update conflicting dependencies
mix deps.update conflicting_dep

# Use overrides in mix.exs
{:plug, "~> 1.14", override: true}
```

### Missing Dependencies

```bash
# Clear lock file and refetch
rm mix.lock && mix deps.get

# Check network connectivity
mix hex.info

# Verify Hex credentials
mix hex.user whoami
```

### Compilation Issues

```bash
# Clean and recompile
mix deps.clean --all && mix deps.get && mix compile

# Check Erlang/Elixir compatibility
elixir --version
```

## Related Commands

- `/elixir-compile` - Compile with dependencies
- `/elixir-test` - Test with dependencies
- `/elixir-setup` - Configure dependency management
- `/elixir-lint` - Check dependency usage

## Environment Variables

- `HEX_API_URL` - Hex API URL
- `HEX_API_KEY` - Hex API key
- `HEX_MIRROR` - Hex mirror URL
- `HEX_UNSAFE_REGISTRY` - Allow unsafe registry
- `HEX_NO_VERIFY_REGISTRY_ORIGIN` - Skip registry origin verification

## Notes

- Requires Hex to be installed (`mix local.hex`)
- First-time use may require Hex authentication
- Git dependencies require git to be installed
- Security auditing requires network access
- Lock file (`mix.lock`) should be committed to version control
