# /pine-setup

Configure PineScript project for opencode integration.

## Description

Interactive setup wizard for configuring TradingView PineScript projects. Detects project type, PineScript version, and sets up appropriate configuration for backtesting, alerts, and TradingView integration.

## Usage

```bash
/pine-setup [options]
```

## Options

- `--quick`, `-q` - Quick setup with automatic detection
- `--reconfigure`, `-r` - Force reconfiguration even if already configured
- `--version <version>` - Specify PineScript version (4, 5, 6, auto)
- `--project-type <type>` - Specify project type (indicator, strategy, library)
- `--backtesting <bool>` - Enable/disable backtesting (true/false/enabled/disabled)
- `--alerts <bool>` - Enable/disable alerts (true/false/enabled/disabled)
- `--no-prompt`, `-y` - Use defaults without prompting
- `--verbose`, `-v` - Verbose output
- `--config <path>` - Use alternative configuration file

## Examples

```bash
# Interactive setup wizard
/pine-setup

# Quick automatic setup
/pine-setup --quick

# Force reconfiguration
/pine-setup --reconfigure

# Specify version and project type
/pine-setup --version=5 --project-type=strategy

# Enable backtesting and alerts
/pine-setup --backtesting=enabled --alerts=enabled

# Non-interactive with defaults
/pine-setup --no-prompt
```

## Setup Process

### 1. Project Detection

- Scans for `.pine` files in the project
- Detects PineScript version from `//@version=` declarations
- Identifies project type (indicator, strategy, or library)
- Checks for existing configuration

### 2. Configuration Options

#### PineScript Version

- **v4**: Legacy version (compatibility mode)
- **v5**: Current stable version (recommended for most projects)
- **v6**: Latest version with new features
- **auto**: Detect version from files

#### Project Type

- **Indicator**: Technical analysis indicators (plotting only)
- **Strategy**: Trading strategies with backtesting capabilities
- **Library**: Utility functions and shared code

#### Backtesting Configuration (for strategies)

- Data source selection (TradingView, CSV, API, database)
- Optimization settings (grid search, random search, etc.)
- Performance metrics to track

#### Alert System

- Webhook configuration
- Email, Discord, Telegram notifications
- Alert templates and triggers

#### TradingView Integration

- Automatic publishing to TradingView
- Workspace management
- API key configuration

### 3. Configuration Saving

Saves configuration to `.opencode/project-config.json`:

```json
{
  "pinescript": {
    "version": "5",
    "projectType": "strategy",
    "backtesting": {
      "enabled": true,
      "dataSource": "tradingview",
      "optimization": {
        "enabled": false,
        "method": "grid",
        "maxIterations": 100
      }
    },
    "alerts": {
      "enabled": true,
      "webhooks": []
    },
    "tradingview": {
      "publish": false,
      "workspace": "default"
    }
  }
}
```

## Next Steps

After setup, use these commands:

- `/pine-validate` - Validate PineScript syntax and version compatibility
- `/pine-backtest` - Run backtesting on strategies (if enabled)
- `/pine-optimize` - Optimize strategy parameters (if enabled)
- `/pine-convert` - Convert between PineScript versions
- `/pine-alert` - Configure and test alert system

## Troubleshooting

### Common Issues

1. **"No PineScript files found"**
   - Ensure you have `.pine` files in your project
   - Check file extensions (must be `.pine`)

2. **Version detection fails**
   - Add `//@version=5` (or your version) to PineScript files
   - Use `--version` option to specify manually

3. **Configuration not saving**
   - Check write permissions in project directory
   - Verify `.opencode/` directory exists

4. **Tool detection issues**
   - Install required tools (see recommendations in wizard)
   - Run `/pine-setup --reconfigure` after installing tools

### Manual Configuration

If the wizard fails, you can manually create `.opencode/project-config.json`:

```bash
# Create minimal configuration
echo '{
  "pinescript": {
    "version": "5",
    "projectType": "indicator",
    "userApproved": true
  }
}' > .opencode/project-config.json
```

## Integration

### With TradingView

- Configuration supports TradingView publishing
- API key can be added later via `/pine-setup --reconfigure`
- Workspace management for organization

### With Backtesting Systems

- Compatible with external backtesting engines
- Data source configuration for historical data
- Performance metric tracking

### With Alert Systems

- Webhook integration for real-time alerts
- Multiple notification channels
- Template-based alert messages

## Best Practices

1. **Version Control**: Always specify PineScript version in files
2. **Project Organization**: Use directories for indicators, strategies, libraries
3. **Configuration Backup**: Keep `.opencode/project-config.json` in version control
4. **Regular Updates**: Re-run setup when adding new features or tools

## See Also

- `/pine-validate` - Validate PineScript files
- `/python-setup` - Python project configuration
- `PINESCRIPT-INTEGRATION.md` - Comprehensive PineScript guide
