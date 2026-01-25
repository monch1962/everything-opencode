# /pine-backtest

Run backtesting on PineScript strategies.

## Description

Comprehensive backtesting tool for TradingView PineScript strategies. Executes historical backtests with configurable parameters, calculates performance metrics, and generates detailed reports. Supports multiple data sources and output formats.

## Usage

```bash
/pine-backtest [options] <strategy.pine> [more-strategies.pine...]
```

## Options

- `--data`, `-d <file>` - Data file for backtesting (CSV format)
- `--data-source`, `-s <src>` - Data source: `csv`, `tradingview`, `api`, `database` (default: `csv`)
- `--from`, `-f <date>` - Start date for backtesting (YYYY-MM-DD)
- `--to`, `-t <date>` - End date for backtesting (YYYY-MM-DD)
- `--commission`, `-c <pct>` - Commission percentage (default: `0.1`)
- `--slippage`, `-S <pct>` - Slippage percentage (default: `0.0`)
- `--capital`, `-C <amount>` - Initial capital (default: `10000`)
- `--report`, `-r <format>` - Report format: `console`, `json`, `html`, `csv` (default: `console`)
- `--output`, `-o <file>` - Save report to file
- `--verbose`, `-v` - Verbose output with detailed information
- `--quiet`, `-q` - Minimal output (errors only)
- `--json` - Output results in JSON format (alias for `--report json`)
- `--html` - Generate HTML report (alias for `--report html`)
- `--csv` - Generate CSV report (alias for `--report csv`)
- `--check-tools` - Check if backtesting tools are available
- `--help`, `-h` - Show this help message

## Examples

### Basic Backtesting

```bash
# Backtest single strategy with CSV data
/pine-backtest my-strategy.pine --data historical.csv

# Backtest with TradingView data
/pine-backtest --data-source tradingview strategy.pine

# Backtest with custom commission and capital
/pine-backtest --commission 0.2 --capital 50000 strategy.pine --data data.csv
```

### Report Generation

```bash
# Generate HTML report
/pine-backtest --html --output report.html strategy.pine

# Generate JSON for programmatic use
/pine-backtest --json --quiet strategy.pine --data data.csv > results.json

# Generate CSV report
/pine-backtest --csv --output results.csv strategy.pine
```

### Multiple Strategies

```bash
# Compare multiple strategies
/pine-backtest strategy1.pine strategy2.pine strategy3.pine --data historical.csv

# Backtest directory of strategies
/pine-backtest strategies/*.pine --data data.csv
```

### Tool Checking

```bash
# Check if backtesting tools are available
/pine-backtest --check-tools
```

## Backtesting Process

### 1. Strategy Validation

- Verifies file contains `strategy()` function (not `indicator()`)
- Checks PineScript version compatibility
- Validates strategy syntax and structure

### 2. Data Loading

- Loads historical data from specified source
- Validates data format and completeness
- Filters data by date range if specified

### 3. Execution

- Executes strategy against historical data
- Applies commission and slippage models
- Trades positions according to strategy logic
- Calculates equity curve and performance metrics

### 4. Reporting

- Generates comprehensive performance report
- Calculates risk-adjusted metrics
- Provides trade-by-trade analysis
- Creates visualizations (HTML reports)

## Performance Metrics

### Profitability Metrics

- **Net Profit/Loss**: Total profit after commissions
- **Total Return**: Percentage return on initial capital
- **Profit Factor**: Gross profits / gross losses
- **Expectancy**: Average profit per trade

### Trade Statistics

- **Total Trades**: Number of trades executed
- **Winning Trades**: Number of profitable trades
- **Win Rate**: Percentage of winning trades
- **Average Win/Loss**: Average profit/loss per trade
- **Largest Win/Loss**: Maximum single trade profit/loss
- **Avg Trade Duration**: Average holding period

### Risk Metrics

- **Maximum Drawdown**: Largest peak-to-trough decline
- **Drawdown Duration**: Length of maximum drawdown
- **Recovery Factor**: Net profit / maximum drawdown
- **Risk of Ruin**: Probability of losing entire capital

### Risk-Adjusted Returns

- **Sharpe Ratio**: Return per unit of total risk
- **Sortino Ratio**: Return per unit of downside risk
- **Calmar Ratio**: Return per unit of maximum drawdown
- **Omega Ratio**: Probability-weighted gains vs losses

## Data Sources

### CSV Files

**Format requirements:**

```
date,open,high,low,close,volume
2023-01-01,100.50,101.20,99.80,100.10,1000000
2023-01-02,100.20,102.50,100.10,102.00,1200000
```

**Supported date formats:**

- `YYYY-MM-DD`
- `YYYY-MM-DD HH:MM:SS`
- Unix timestamp (seconds)

### TradingView Data

- Uses TradingView historical data API
- Requires TradingView API key configuration
- Supports multiple symbols and timeframes
- Real-time and historical data

### API Data Sources

- Custom API endpoints for data fetching
- JSON or CSV response formats
- Configurable authentication and headers
- Caching for performance

### Database Sources

- PostgreSQL, MySQL, SQLite support
- Custom query configuration
- Connection pooling and optimization
- Incremental data loading

## Configuration

### Project Configuration

Reads from `.opencode/project-config.json`:

```json
{
  "pinescript": {
    "backtesting": {
      "dataSource": "csv",
      "defaultCommission": 0.1,
      "defaultSlippage": 0.0,
      "defaultCapital": 10000
    }
  }
}
```

### Environment Variables

```bash
# Backtesting defaults
export BACKTESTING_DATA_SOURCE=csv
export BACKTESTING_COMMISSION=0.1
export BACKTESTING_CAPITAL=10000

# TradingView API
export TRADINGVIEW_API_KEY=your_api_key
export TRADINGVIEW_SYMBOL=BTCUSD

# Database connection
export DB_HOST=localhost
export DB_NAME=trading_data
export DB_USER=backtester
```

## Report Formats

### Console Output (Default)

```
📊 BACKTEST REPORT
============================================================

Strategy: rsi-macd-strategy.pine
Period: 85 trades

📊 PERFORMANCE METRICS
────────────────────────────────────────
Net Profit: $2,450.50 (24.51%)
Total Trades: 85
Winning Trades: 52 (61.2%)
Profit Factor: 1.85
Average Win: $125.50
Average Loss: $85.20
Maximum Drawdown: $1,250.75 (12.51%)
Sharpe Ratio: 1.42
```

### JSON Format

```json
{
  "strategy": "rsi-macd-strategy.pine",
  "performance": {
    "netProfit": 2450.50,
    "totalTrades": 85,
    "winRate": 61.2,
    "profitFactor": 1.85,
    "maxDrawdown": 1250.75
  },
  "trades": [...],
  "equityCurve": [...]
}
```

### HTML Report

- Interactive charts and graphs
- Sortable trade tables
- Export functionality
- Responsive design for all devices

### CSV Format

- Machine-readable output
- Compatible with spreadsheets
- Easy import into other tools
- Columnar data structure

## Integration Examples

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Backtest Strategies
on: [push, pull_request]
jobs:
  backtest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Backtests
        run: |
          /pine-backtest --json --quiet strategies/*.pine --data test-data.csv > results.json
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: backtest-results
          path: results.json
```

### Automated Testing

```bash
#!/bin/bash
# automated-test.sh

echo "Running strategy backtests..."

# Backtest all strategies
/pine-backtest strategies/*.pine --data historical.csv --json > results.json

# Check for minimum performance criteria
python -c "
import json
with open('results.json') as f:
    data = json.load(f)
for result in data:
    perf = result['performance']
    if perf['winRate'] < 40:
        print(f'❌ {result[\"strategy\"]}: Win rate below 40%')
        exit(1)
    if perf['profitFactor'] < 1.2:
        print(f'❌ {result[\"strategy\"]}: Profit factor below 1.2')
        exit(1)
print('✅ All strategies meet minimum criteria')
"
```

### Performance Monitoring

```python
# monitor-performance.py
import subprocess
import json
import datetime

def run_backtest(strategy):
    """Run backtest and return results"""
    cmd = ['/pine-backtest', '--json', '--quiet', strategy, '--data', 'historical.csv']
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

def track_performance(strategies):
    """Track strategy performance over time"""
    timestamp = datetime.datetime.now().isoformat()
    performance_data = {
        'timestamp': timestamp,
        'strategies': {}
    }

    for strategy in strategies:
        results = run_backtest(strategy)
        performance_data['strategies'][strategy] = results['performance']

    # Save to database or file
    with open(f'performance-{timestamp}.json', 'w') as f:
        json.dump(performance_data, f, indent=2)

    return performance_data
```

## Best Practices

### 1. Data Quality

- Use clean, adjusted historical data
- Handle missing data appropriately
- Validate data before backtesting
- Use multiple data sources for robustness

### 2. Strategy Design

- Avoid look-ahead bias in strategy logic
- Implement proper risk management
- Test with out-of-sample data
- Consider transaction costs realistically

### 3. Backtesting Configuration

- Use realistic commission and slippage
- Test with sufficient historical data
- Run multiple time periods
- Compare against benchmarks

### 4. Performance Analysis

- Focus on risk-adjusted returns
- Consider maximum drawdown tolerance
- Analyze trade distribution
- Check for curve fitting

## Troubleshooting

### Common Issues

1. **"No strategy() function found"**

   ```bash
   # Check if file contains strategy() not indicator()
   grep "strategy(" my-file.pine

   # Convert indicator to strategy if needed
   # Update indicator() to strategy() in PineScript file
   ```

2. **Data file not found**

   ```bash
   # Use absolute or relative path
   /pine-backtest strategy.pine --data ./data/historical.csv

   # Check file exists
   ls -la ./data/historical.csv
   ```

3. **Insufficient historical data**

   ```bash
   # Check data file content
   head -20 historical.csv

   # Ensure sufficient data points
   wc -l historical.csv
   ```

4. **Performance metrics unrealistic**
   ```bash
   # Check for data snooping bias
   # Use walk-forward testing
   /pine-backtest --from 2020-01-01 --to 2022-12-31 strategy.pine
   /pine-backtest --from 2023-01-01 --to 2023-12-31 strategy.pine
   ```

### Debug Mode

```bash
# Enable verbose output
/pine-backtest --verbose strategy.pine --data test.csv

# Check individual trades
/pine-backtest --report json strategy.pine | jq '.trades[] | select(.profitLoss < -100)'

# Validate data separately
python -c "
import pandas as pd
df = pd.read_csv('historical.csv')
print(f'Rows: {len(df)}')
print(f'Date range: {df.date.min()} to {df.date.max()}')
print(f'Missing values: {df.isnull().sum().sum()}')
"
```

## Limitations

### Current Implementation

- **Simulated backtesting**: Current version uses simulated results
- **Basic data sources**: CSV support with simulated API/database
- **Limited optimization**: Basic parameter optimization only

### Future Enhancements

1. **Real backtesting engine**: Integration with backtesting.py
2. **Advanced data sources**: Real TradingView API, database connections
3. **Machine learning**: ML-based optimization and analysis
4. **Portfolio backtesting**: Multiple strategy portfolio optimization
5. **Real-time testing**: Integration with live trading platforms

## See Also

- `/pine-validate` - Validate PineScript syntax before backtesting
- `/pine-optimize` - Optimize strategy parameters
- `/pine-setup` - Configure PineScript project
- `/python-test` - Python testing framework
- `PINESCRIPT-INTEGRATION.md` - Comprehensive PineScript guide
