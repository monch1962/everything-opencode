# `/pine-optimize` Command

Optimize PineScript strategy parameters using various optimization methods.

## Overview

The `/pine-optimize` command performs parameter optimization for PineScript trading strategies. It systematically tests different parameter combinations to find the optimal values that maximize performance metrics like net profit, Sharpe ratio, or win rate.

## Usage

```bash
/pine-optimize [options]
```

## Options

| Option               | Alias | Description                                                               | Default        |
| -------------------- | ----- | ------------------------------------------------------------------------- | -------------- |
| `--file`, `-f`       |       | PineScript file to optimize                                               | Auto-detected  |
| `--method`, `-m`     |       | Optimization method (`grid`, `random`, `bayesian`, `genetic`)             | `grid`         |
| `--iterations`, `-i` |       | Number of optimization iterations                                         | `100`          |
| `--metric`, `-M`     |       | Optimization metric (`net_profit`, `sharpe`, `win_rate`, `profit_factor`) | `net_profit`   |
| `--output`, `-o`     |       | Output format (`console`, `json`, `html`, `csv`)                          | `console`      |
| `--outputFile`, `-O` |       | Output file path                                                          |                |
| `--paramSpace`, `-p` |       | Parameter space definition file (JSON)                                    | Auto-generated |
| `--verbose`, `-v`    |       | Verbose output                                                            | `false`        |

## Examples

### Basic Optimization

```bash
/pine-optimize --file my-strategy.pine
```

### Grid Search Optimization

```bash
/pine-optimize --method grid --iterations 500 --metric sharpe
```

### Random Search with Custom Parameter Space

```bash
/pine-optimize --method random --paramSpace params.json --output json --outputFile results.json
```

### Bayesian Optimization

```bash
/pine-optimize --method bayesian --iterations 200 --metric win_rate --verbose
```

### Genetic Algorithm Optimization

```bash
/pine-optimize --method genetic --iterations 1000 --metric profit_factor --output html --outputFile optimization-report.html
```

## Optimization Methods

### Grid Search

- **Description**: Exhaustive search over a predefined parameter grid
- **Best for**: Small parameter spaces (2-3 parameters)
- **Pros**: Guaranteed to find global optimum in defined space
- **Cons**: Computationally expensive for large spaces

### Random Search

- **Description**: Random sampling of parameter combinations
- **Best for**: Medium to large parameter spaces
- **Pros**: More efficient than grid search for high dimensions
- **Cons**: May miss optimal regions

### Bayesian Optimization

- **Description**: Uses probabilistic model to guide search
- **Best for**: Expensive evaluations, limited iterations
- **Pros**: Efficient, learns from previous evaluations
- **Cons**: More complex, requires tuning

### Genetic Algorithm

- **Description**: Evolutionary algorithm inspired by natural selection
- **Best for**: Complex, non-convex optimization problems
- **Pros**: Good for global optimization, handles constraints
- **Cons**: Requires more iterations, parameter tuning

## Optimization Metrics

### Net Profit

- **Formula**: `Total Profit - Total Loss - Commission`
- **Best for**: Maximizing absolute returns
- **Considerations**: Ignores risk, may favor high-risk strategies

### Sharpe Ratio

- **Formula**: `(Returns - Risk-free Rate) / Standard Deviation`
- **Best for**: Risk-adjusted returns
- **Considerations**: Assumes normal distribution of returns

### Win Rate

- **Formula**: `Winning Trades / Total Trades`
- **Best for**: Consistency-focused strategies
- **Considerations**: Ignores trade magnitude

### Profit Factor

- **Formula**: `Gross Profit / Gross Loss`
- **Best for**: Risk management
- **Considerations**: Good for evaluating strategy robustness

## Parameter Space Definition

### Auto-generated Parameter Space

The command automatically detects common indicators and generates appropriate parameter spaces:

- **RSI-based strategies**: `rsi_length`, `rsi_overbought`, `rsi_oversold`
- **MACD-based strategies**: `fast_length`, `slow_length`, `signal_length`
- **SMA/EMA-based strategies**: `fast_length`, `slow_length`
- **Bollinger Bands**: `length`, `stddev`

### Custom Parameter Space File

Create a JSON file defining your parameter space:

```json
{
  "rsi_length": {
    "min": 5,
    "max": 30,
    "step": 1,
    "type": "integer"
  },
  "rsi_overbought": {
    "min": 60,
    "max": 90,
    "step": 5,
    "type": "integer"
  },
  "rsi_oversold": {
    "min": 10,
    "max": 40,
    "step": 5,
    "type": "integer"
  },
  "stop_loss": {
    "min": 0.5,
    "max": 5.0,
    "step": 0.5,
    "type": "float"
  },
  "take_profit": {
    "min": 1.0,
    "max": 10.0,
    "step": 1.0,
    "type": "float"
  }
}
```

### Parameter Types

- **integer**: Whole numbers (e.g., period lengths)
- **float**: Decimal numbers (e.g., percentages, multipliers)

## Output Formats

### Console Output

```text
Optimizing PineScript strategy: rsi-strategy.pine
Method: grid, Iterations: 100, Metric: net_profit
Starting optimization...
Optimization completed in 45.23 seconds

=== OPTIMIZATION RESULTS ===
Best net_profit: 15234.56
Best parameters:
  rsi_length: 14
  rsi_overbought: 70
  rsi_oversold: 30

Evaluated 100 parameter combinations

Parameter sensitivity analysis:
  rsi_length: 0.4231
  rsi_overbought: 0.2876
  rsi_oversold: 0.1893
```

### JSON Output

```json
{
  "optimization": {
    "file": "rsi-strategy.pine",
    "method": "grid",
    "iterations": 100,
    "metric": "net_profit",
    "duration": 45.23
  },
  "bestParameters": {
    "rsi_length": 14,
    "rsi_overbought": 70,
    "rsi_oversold": 30
  },
  "bestScore": 15234.56,
  "allResults": [
    {
      "parameters": {
        "rsi_length": 14,
        "rsi_overbought": 70,
        "rsi_oversold": 30
      },
      "score": 15234.56,
      "metrics": { "net_profit": 15234.56, "sharpe": 1.23, "win_rate": 0.58 }
    }
  ],
  "sensitivity": {
    "rsi_length": 0.4231,
    "rsi_overbought": 0.2876,
    "rsi_oversold": 0.1893
  }
}
```

### HTML Report

Generates an interactive HTML report with:

- Optimization summary
- Parameter performance charts
- Sensitivity analysis
- Top parameter combinations table
- Downloadable results

### CSV Export

Creates CSV files for:

- All evaluated parameter combinations
- Performance metrics
- Sensitivity scores

## Best Practices

### 1. Start with Grid Search

```bash
/pine-optimize --method grid --iterations 50 --verbose
```

Use for initial exploration of small parameter spaces.

### 2. Refine with Bayesian Optimization

```bash
/pine-optimize --method bayesian --iterations 100 --metric sharpe
```

Use after identifying promising parameter ranges.

### 3. Validate with Out-of-Sample Testing

```bash
/pine-optimize --paramSpace optimized-params.json --output json --outputFile validation.json
```

Test optimized parameters on unseen data.

### 4. Consider Multiple Metrics

```bash
/pine-optimize --metric sharpe
/pine-optimize --metric profit_factor
```

Optimize for different objectives to understand trade-offs.

### 5. Use Parameter Constraints

Define realistic parameter ranges based on:

- Market characteristics
- Trading style
- Risk tolerance
- Computational limits

## Common Issues

### No Input Parameters Found

**Error**: "No input parameters found. Optimization requires input parameters to vary."
**Solution**: Ensure your PineScript file has `input` statements:

```pinescript
// @version=5
strategy("My Strategy", overlay=true)

rsi_length = input.int(14, "RSI Length", minval=5, maxval=30)
rsi_overbought = input.int(70, "RSI Overbought", minval=60, maxval=90)
rsi_oversold = input.int(30, "RSI Oversold", minval=10, maxval=40)
```

### Optimization Takes Too Long

**Solution**:

- Reduce parameter ranges
- Increase step sizes
- Use fewer iterations
- Try random search instead of grid search

### Overfitting

**Symptoms**: Excellent in-sample performance but poor out-of-sample results
**Prevention**:

- Use walk-forward optimization
- Implement cross-validation
- Regularize parameter space
- Optimize for robustness metrics (Sharpe, profit factor)

## Integration with Other Commands

### With `/pine-backtest`

```bash
# First optimize parameters
/pine-optimize --file strategy.pine --output json --outputFile optimized-params.json

# Then backtest with optimized parameters
/pine-backtest --file strategy.pine --params optimized-params.json
```

### With `/pine-setup`

```bash
# Configure optimization settings
/pine-setup

# Run optimization with configured settings
/pine-optimize
```

## Performance Tips

### 1. Parallel Processing

Enable parallel evaluation for faster optimization (if supported by your environment).

### 2. Caching Results

The optimizer caches evaluated parameter combinations to avoid redundant calculations.

### 3. Early Stopping

Configure early stopping criteria for genetic and Bayesian methods.

### 4. Memory Management

For large optimizations, use file-based storage instead of in-memory storage.

## Advanced Features

### Custom Objective Functions

Extend the optimizer to use custom objective functions:

```javascript
const customMetric = (results) => {
  const netProfit = results.metrics.net_profit;
  const maxDrawdown = results.metrics.max_drawdown;
  const winRate = results.metrics.win_rate;

  // Custom composite metric
  return netProfit * (1 - maxDrawdown) * winRate;
};
```

### Multi-objective Optimization

Optimize for multiple objectives simultaneously using Pareto optimization.

### Walk-forward Optimization

Implement time-based validation to prevent overfitting.

## Exit Codes

| Code | Description         |
| ---- | ------------------- |
| 0    | Success             |
| 1    | General error       |
| 2    | Configuration error |
| 3    | File error          |
| 4    | Optimization error  |

## See Also

- [`/pine-setup`](pine-setup.md) - Configure PineScript settings
- [`/pine-backtest`](pine-backtest.md) - Backtest PineScript strategies
- [`/pine-validate`](pine-validate.md) - Validate PineScript syntax
- [PineScript Integration Guide](../../PINESCRIPT-INTEGRATION.md) - Comprehensive PineScript integration documentation
