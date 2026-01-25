# PineScript Integration Guide

Complete TradingView PineScript integration for opencode with strategy validation, backtesting, optimization, and alert configuration.

## Overview

This integration adds comprehensive PineScript support to everything-opencode, enabling TradingView developers to validate, test, optimize, and deploy their indicators and strategies directly from their development environment.

### Key Features

- **Smart Project Detection**: Automatic PineScript project detection with confidence scoring
- **Interactive Configuration**: Wizard-based setup for PineScript projects
- **Syntax Validation**: Comprehensive PineScript syntax and version validation
- **Backtesting Integration**: External backtesting engine support with performance metrics
- **Strategy Optimization**: Parameter optimization with grid search and walk-forward analysis
- **Alert System**: Webhook-based alert configuration with multiple channels
- **Version Management**: PineScript v4/v5/v6 conversion and compatibility checking

## Architecture

```
everything-opencode/
├── languages/pinescript/          # PineScript core components
│   ├── config-wizard.js           # Interactive configuration wizard
│   ├── tool-detector.js           # PineScript tool detection
│   └── templates/                 # Project templates
├── scripts/pinescript/            # PineScript utilities
│   ├── command-runner.js          # Base command runner
│   ├── validator.js               # Validation engine
│   └── backtester.js              # Backtesting integration
├── scripts/commands/              # Command implementations
│   ├── pine-setup.js              # /pine-setup command
│   ├── pine-validate.js           # /pine-validate command
│   ├── pine-backtest.js           # /pine-backtest command
│   ├── pine-optimize.js           # /pine-optimize command
│   ├── pine-convert.js            # /pine-convert command
│   └── pine-alert.js              # /pine-alert command
├── commands/                      # Command documentation
│   ├── pine-setup.md
│   ├── pine-validate.md
│   ├── pine-backtest.md
│   ├── pine-optimize.md
│   ├── pine-convert.md
│   └── pine-alert.md
└── examples/pinescript-projects/  # Example projects
    ├── basic-indicator/           # Simple SMA crossover example
    ├── trading-strategy/          # RSI+MACD strategy example
    └── alert-webhook/             # Alert integration example
```

## Quick Start

### 1. Installation

```bash
# Clone the repository or install as opencode plugin
git clone https://github.com/yourusername/everything-opencode.git
cd everything-opencode

# Install dependencies
npm install
```

### 2. First PineScript Project

```bash
# Create a new PineScript project
mkdir my-pinescript-project
cd my-pinescript-project

# Create a simple PineScript file
echo '//@version=5
indicator("My Indicator", overlay=true)
plot(close)' > my-indicator.pine

# Run the setup wizard
node ../scripts/commands/pine-setup.js

# Validate your PineScript
node ../scripts/commands/pine-validate.js
```

### 3. Using PineScript Commands

```bash
# Interactive setup wizard
/pine-setup

# Validate PineScript syntax
/pine-validate my-strategy.pine

# Run backtesting on strategy
/pine-backtest --data historical.csv my-strategy.pine

# Optimize strategy parameters
/pine-optimize --method grid my-strategy.pine

# Convert between PineScript versions
/pine-convert --to=5 v4-strategy.pine

# Configure alert system
/pine-alert --setup
```

## Features in Detail

### 1. Smart Project Detection

The system automatically detects PineScript projects with confidence scoring:

**Detection Indicators:**

- `.pine` file extensions
- `//@version=` declarations
- `indicator()` or `strategy()` function calls
- Trading-related directories (`indicators/`, `strategies/`, `backtests/`)
- Configuration files (`pine-config.json`, `backtest-config.json`)

**Confidence Scoring:**

- Base: 0.1 per PineScript file (max 0.8)
- Version declaration: +0.1
- Indicator/strategy detection: +0.1
- v5+ syntax: +0.1
- Trading directories: +0.05 each

### 2. Interactive Configuration Wizard

The `/pine-setup` command provides an interactive wizard:

**Configuration Steps:**

1. **Project Detection**: Auto-detects PineScript projects
2. **Version Selection**: Choose PineScript v4, v5, v6, or auto-detect
3. **Project Type**: Indicator, strategy, or library
4. **Backtesting Setup**: Data sources, optimization methods, metrics
5. **Alert Configuration**: Webhooks, email, Discord, Telegram
6. **TradingView Integration**: Publishing and workspace management

**Example Configuration:**

```json
{
  "pinescript": {
    "version": "5",
    "projectType": "strategy",
    "backtesting": {
      "enabled": true,
      "dataSource": "csv",
      "optimization": {
        "enabled": true,
        "method": "grid",
        "maxIterations": 1000,
        "walkForward": true
      }
    },
    "alerts": {
      "enabled": true,
      "webhooks": [
        {
          "url": "https://api.example.com/webhook",
          "method": "POST",
          "template": "trade-alert"
        }
      ]
    }
  }
}
```

### 3. PineScript Validation

The `/pine-validate` command provides comprehensive validation:

**Validation Checks:**

- Syntax and structure validation
- Version compatibility checking
- Deprecated function detection
- Common PineScript pitfalls
- Best practices recommendations
- TradingView publishing readiness

**Auto-Fix Capabilities:**

- Add missing version declarations
- Update deprecated functions (`security()` → `request.security()`)
- Fix common syntax errors
- Suggest improvements

**Output Formats:**

- Console output (default)
- JSON format for programmatic use
- HTML reports for sharing
- CI/CD integration friendly

### 4. Backtesting Integration

The `/pine-backtest` command integrates with external backtesting engines:

**Supported Backtesting Engines:**

- **backtesting.py** (Python) - Lightweight, easy integration
- **vectorbt** (Python) - Vectorized, high performance
- **Custom JavaScript backtester** - Pure JS implementation

**Backtesting Features:**

- Historical data from multiple sources (CSV, API, TradingView)
- Custom commission and slippage models
- Performance metrics calculation
- Equity curve analysis
- Trade-by-trade analysis

**Performance Metrics:**

- Net profit/loss and profit factor
- Win rate and average win/loss
- Maximum drawdown and recovery factor
- Sharpe ratio and Sortino ratio
- Risk of ruin and value at risk (VaR)

### 5. Strategy Optimization

The `/pine-optimize` command provides parameter optimization:

**Optimization Methods:**

- **Grid Search**: Exhaustive parameter combination testing
- **Random Search**: Random parameter sampling
- **Bayesian Optimization**: Smart parameter search
- **Genetic Algorithms**: Evolutionary optimization
- **Walk-Forward Analysis**: In-sample/out-of-sample testing

**Optimization Workflow:**

1. Define parameter search space
2. Execute backtests for each parameter set
3. Evaluate performance metrics
4. Select optimal parameters
5. Generate optimization report

**Example Optimization:**

```bash
# Optimize RSI strategy parameters
/pine-optimize --method grid \
  --params "rsi_length:7-21,rsi_overbought:70-90,rsi_oversold:20-40" \
  --metric sharpe \
  my-strategy.pine
```

### 6. Version Conversion

The `/pine-convert` command converts between PineScript versions:

**Conversion Support:**

- v4 → v5 conversion (primary focus)
- v5 → v4 conversion (limited)
- Syntax modernization
- Deprecated function replacement

**Conversion Rules:**

- `security()` → `request.security()` (v5+)
- `study()` → `indicator()` or `strategy()` (v5+)
- Function signature updates
- Built-in function replacements

### 7. Alert System

The `/pine-alert` command configures real-time alert systems:

**Alert Types:**

- Trade signals (buy/sell alerts)
- Performance alerts (drawdown, profit targets)
- System alerts (errors, connectivity issues)
- Scheduled reports (daily/weekly performance)

**Notification Channels:**

- Webhooks (HTTP POST/GET)
- Email notifications
- Discord webhooks
- Telegram bots
- Custom integrations

**Alert Features:**

- Custom payload templates
- Rate limiting and retry logic
- Delivery monitoring
- Alert history and testing

## Command Reference

### `/pine-setup`

Interactive configuration wizard for PineScript projects.

**Options:**

- `--quick`, `-q` - Quick setup with automatic detection
- `--reconfigure`, `-r` - Force reconfiguration
- `--version <ver>` - Set PineScript version
- `--project-type <type>` - Set project type
- `--backtesting <bool>` - Enable/disable backtesting
- `--alerts <bool>` - Enable/disable alerts

### `/pine-validate`

Validate PineScript syntax and version compatibility.

**Options:**

- `--fix`, `-f` - Attempt to fix common issues
- `--verbose`, `-v` - Verbose output
- `--json` - JSON output format
- `--version`, `-V <ver>` - Validate against specific version
- `--strict` - Enable strict validation

### `/pine-backtest`

Run backtesting on PineScript strategies.

**Options:**

- `--data <source>` - Data source (csv, api, tradingview)
- `--from <date>` - Start date for backtesting
- `--to <date>` - End date for backtesting
- `--commission <pct>` - Commission percentage
- `--slippage <pct>` - Slippage percentage
- `--report <format>` - Report format (html, json, text)

### `/pine-optimize`

Optimize strategy parameters.

**Options:**

- `--method <name>` - Optimization method (grid, random, bayesian)
- `--params <spec>` - Parameter search space
- `--metric <name>` - Optimization metric (sharpe, profit, winrate)
- `--iterations <n>` - Maximum iterations
- `--walk-forward` - Enable walk-forward optimization

### `/pine-convert`

Convert between PineScript versions.

**Options:**

- `--to <version>` - Target version (4, 5, 6)
- `--validate` - Validate after conversion
- `--backup` - Create backup of original file
- `--dry-run` - Show changes without applying

### `/pine-alert`

Configure and test alert system.

**Options:**

- `--setup` - Interactive alert setup
- `--test` - Test alert delivery
- `--monitor` - Monitor alert status
- `--send <message>` - Send test alert
- `--webhook <url>` - Add webhook endpoint

## Example Projects

### 1. Basic Indicator (Simple)

**Location**: `examples/pinescript-projects/basic-indicator/`

**Features:**

- Simple Moving Average (SMA) crossover indicator
- PineScript v5 syntax
- Basic plot visualization
- Alert condition examples
- Configuration for opencode validation

**Files:**

- `sma-crossover.pine` - Indicator implementation
- `opencode-config.json` - Project configuration
- `backtest-config.json` - Backtesting configuration
- `README.md` - Usage instructions

### 2. Trading Strategy (Complex)

**Location**: `examples/pinescript-projects/trading-strategy/`

**Features:**

- RSI + MACD combo strategy
- Multiple time frame analysis
- Stop loss and take profit management
- Position sizing based on equity
- Alert system integration
- Optimization configuration

**Files:**

- `rsi-macd-strategy.pine` - Strategy implementation
- `opencode-config.json` - Full project configuration
- `optimization-config.json` - Parameter optimization settings
- `alert-config.json` - Alert system configuration
- `backtest-report.html` - Sample backtest report

### 3. Alert Webhook Integration (Advanced)

**Location**: `examples/pinescript-projects/alert-webhook/`

**Features:**

- Strategy with real-time alert conditions
- Webhook server implementation
- Custom payload templates
- Rate limiting and retry logic
- Delivery monitoring
- Testing utilities

**Files:**

- `strategy-with-alerts.pine` - Strategy with alert integration
- `webhook-server.js` - Test webhook server
- `alert-templates.json` - Custom alert templates
- `webhook-config.json` - Webhook configuration
- `monitoring-dashboard.md` - Alert monitoring setup

## Configuration

### Project Configuration

Stored in `.opencode/project-config.json`:

```json
{
  "pinescript": {
    "version": "5",
    "projectType": "strategy",
    "backtesting": {
      "enabled": true,
      "dataSource": "csv",
      "optimization": {
        "enabled": true,
        "method": "grid",
        "maxIterations": 1000,
        "walkForward": false
      },
      "metrics": ["netProfit", "winRate", "maxDrawdown", "sharpeRatio"]
    },
    "alerts": {
      "enabled": true,
      "webhooks": [
        {
          "url": "https://api.example.com/webhook",
          "method": "POST",
          "template": "trade-alert",
          "events": ["buy", "sell", "stop_loss", "take_profit"]
        }
      ],
      "email": false,
      "discord": true,
      "telegram": false
    },
    "tradingview": {
      "publish": false,
      "apiKey": "",
      "workspace": "default"
    },
    "userApproved": true
  }
}
```

### Environment Variables

```bash
# PineScript configuration
export PINESCRIPT_VERSION=5
export PINESCRIPT_PROJECT_TYPE=strategy

# Backtesting configuration
export BACKTESTING_DATA_SOURCE=csv
export BACKTESTING_COMMISSION=0.1

# Alert system
export ALERT_WEBHOOK_URL=https://api.example.com/webhook
export ALERT_DISCORD_WEBHOOK=https://discord.com/api/webhooks/...

# TradingView integration
export TRADINGVIEW_API_KEY=your_api_key_here
export TRADINGVIEW_WORKSPACE=production
```

## Integration with Existing Systems

### TradingView Integration

- Compatible with TradingView PineScript syntax
- Supports TradingView publishing workflow
- Alert system integrates with TradingView webhooks
- Backtesting compatible with TradingView data formats

### Python Integration

- Backtesting engines use Python (backtesting.py, vectorbt)
- Data analysis with pandas/numpy
- Machine learning integration for optimization
- Custom metric implementation in Python

### CI/CD Integration

```yaml
# GitHub Actions workflow
name: PineScript CI
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate PineScript
        run: /pine-validate --strict

  backtest:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v3
      - name: Run Backtests
        run: /pine-backtest --data test-data.csv --report html

  optimize:
    runs-on: ubuntu-latest
    needs: backtest
    steps:
      - uses: actions/checkout@v3
      - name: Optimize Strategy
        run: /pine-optimize --method grid --iterations 100
```

## Best Practices

### 1. Project Organization

```
my-pinescript-project/
├── indicators/           # Technical indicators
│   ├── sma-crossover.pine
│   └── rsi-divergence.pine
├── strategies/          # Trading strategies
│   ├── trend-following.pine
│   └── mean-reversion.pine
├── libraries/           # Shared utilities
│   └── risk-management.pine
├── tests/              # Validation tests
│   └── validation-tests.js
├── data/               # Historical data
│   └── historical.csv
└── .opencode/          # Configuration
    └── project-config.json
```

### 2. Version Management

- Always specify PineScript version with `//@version=X`
- Keep all files at the same version
- Use `/pine-convert` for version upgrades
- Test compatibility before deploying

### 3. Validation Workflow

1. Syntax validation (`/pine-validate`)
2. Version compatibility checking
3. Backtesting with historical data
4. Optimization for best parameters
5. Alert system configuration
6. Final validation before deployment

### 4. Performance Optimization

- Use vectorized operations where possible
- Limit historical data lookback
- Cache indicator calculations
- Use efficient data structures
- Monitor memory usage during backtesting

## Troubleshooting

### Common Issues

1. **"No PineScript files found"**

   ```bash
   # Check file extensions
   ls *.pine

   # Run setup to detect project
   /pine-setup --quick
   ```

2. **Version compatibility errors**

   ```bash
   # Check version in file
   head -1 my-file.pine

   # Convert to compatible version
   /pine-convert --to=5 my-file.pine
   ```

3. **Backtesting failures**

   ```bash
   # Check data source
   /pine-backtest --data test-data.csv --verbose

   # Test with minimal configuration
   /pine-backtest --commission 0 --slippage 0
   ```

4. **Alert delivery issues**

   ```bash
   # Test webhook delivery
   /pine-alert --test

   # Check configuration
   cat .opencode/project-config.json | grep alerts
   ```

### Debug Mode

```bash
# Enable verbose output
/pine-validate --verbose my-file.pine
/pine-backtest --verbose --data test.csv

# Check configuration
node scripts/pinescript/command-runner.js config

# List detected tools
node scripts/pinescript/command-runner.js tools
```

## Development

### Adding New Features

1. **New Command**

   ```javascript
   // Create command implementation
   // scripts/commands/pine-newcommand.js

   // Create documentation
   // commands/pine-newcommand.md

   // Update integration guide
   // PINESCRIPT-INTEGRATION.md
   ```

2. **New Validation Check**

   ```javascript
   // Add to PineCommandRunner.runValidation()
   // Update validation rules and suggestions
   ```

3. **New Backtesting Metric**
   ```python
   # Implement in Python backtesting engine
   # Add to configuration schema
   # Update command options
   ```

### Testing

```bash
# Run validation tests
node scripts/commands/pine-validate.js examples/pinescript-projects/basic-indicator/sma-crossover.pine

# Test setup wizard
node scripts/commands/pine-setup.js --quick

# Test command runner
node scripts/pinescript/command-runner.js validate examples/pinescript-projects/basic-indicator/sma-crossover.pine
```

## Future Development

### Planned Features

1. **Machine Learning Integration**
   - Strategy optimization with ML
   - Pattern recognition
   - Predictive analytics

2. **Advanced Analytics**
   - Portfolio-level backtesting
   - Risk parity optimization
   - Monte Carlo simulation

3. **Trading Automation**
   - Automated strategy deployment
   - Real-time monitoring
   - Performance tracking

4. **Community Features**
   - Strategy marketplace
   - Performance sharing
   - Collaborative development

### Contributing

See `CONTRIBUTING.md` for guidelines on contributing to PineScript integration.

## Support

### Documentation

- This guide (`PINESCRIPT-INTEGRATION.md`)
- Command documentation (`commands/pine-*.md`)
- Example projects (`examples/pinescript-projects/`)

### Issues

Report issues at: https://github.com/yourusername/everything-opencode/issues

### Community

Join the discussion at: https://github.com/yourusername/everything-opencode/discussions

## License

MIT License - See `LICENSE` file for details.

---

_Last updated: January 2025_  
_PineScript integration version: 1.0.0_  
_Compatible with PineScript: v4, v5, v6_  
_Target audience: Experienced TradingView developers_
