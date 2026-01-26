# /pine-debug

Debugging utilities for PineScript indicator development.

## Description

The `/pine-debug` command provides advanced debugging tools for PineScript indicator development, including variable inspection, tracing, monitoring, profiling, and AI-assisted analysis. It helps identify issues in PineScript code and provides insights into indicator behavior.

## Usage

```bash
/pine-debug <action> [options]
```

## Actions

| Action    | Description                        |
| --------- | ---------------------------------- |
| `inspect` | Inspect variables and their values |
| `trace`   | Trace variable changes over time   |
| `monitor` | Monitor conditions and expressions |
| `profile` | Profile performance and complexity |
| `server`  | Start interactive debugging server |
| `helpers` | Generate debugging helper library  |
| `test`    | Run debugging tests                |
| `ai`      | AI-assisted code analysis          |

## Options

### Common Options

| Option                   | Description                      |
| ------------------------ | -------------------------------- |
| `--file`, `-f FILE`      | PineScript file to debug         |
| `--var`, `-v VAR`        | Variable name to inspect/trace   |
| `--bars`, `-b N`         | Number of historical bars        |
| `--condition`, `-c COND` | Condition expression to monitor  |
| `--memory`               | Enable advanced memory profiling |
| `--output`, `-o FILE`    | Output file path                 |
| `--verbose`              | Verbose output                   |
| `--help`, `-h`           | Show help message                |

### Action-Specific Options

- **inspect**: `--format FORMAT` (text, json, csv)
- **trace**: `--plot` (plot traced values), `--interval N` (sampling interval)
- **monitor**: `--alert` (send alerts), `--threshold N` (threshold value)
- **profile**: `--metrics LIST` (cpu,memory,complexity), `--iterations N`
- **server**: `--port N` (server port), `--host HOST` (server host)
- **helpers**: `--include LIST` (functions to include), `--template NAME`
- **test**: `--scenarios LIST` (test scenarios), `--coverage` (test coverage)
- **ai**: `--patterns LIST` (pattern categories), `--suggestions N` (number of suggestions)

## Examples

```bash
# Inspect variable values
/pine-debug inspect --var "rsiValue" --bars 20

# Trace variable changes
/pine-debug trace --var "macdLine" --plot

# Monitor conditions
/pine-debug monitor --condition "crossover(fastMA, slowMA)" --alert

# Profile performance
/pine-debug profile --metrics cpu,memory,complexity --memory

# Generate debugging helpers
/pine-debug helpers --output my-debug-helpers.pine

# Start debugging server
/pine-debug server --port 8080

# Run debugging tests
/pine-debug test --scenarios basic,edge-cases

# AI-assisted analysis
/pine-debug ai --file my_indicator.pine --patterns performance,bugs
```

## Debugging Features

### Variable Inspection

- View variable values at different bars
- Support for arrays, series, and simple variables
- Historical value tracking
- Export to various formats (JSON, CSV, text)

### Tracing

- Track variable changes over time
- Visual plotting of traced values
- Sampling at custom intervals
- Comparison between multiple variables

### Monitoring

- Monitor conditions and expressions
- Alert generation when conditions met
- Threshold-based monitoring
- Real-time condition evaluation

### Profiling

- CPU usage analysis
- Memory consumption tracking
- Code complexity metrics
- Performance bottleneck identification

### AI Analysis

- Pattern recognition in code
- Bug detection and suggestions
- Performance optimization tips
- Code style recommendations

## Debugging Helpers

### Generated Helper Library

The `helpers` action generates a PineScript library with debugging functions:

```pine
// Include in your PineScript
//@include "debug-helpers.pine"

// Example usage
debug.plot(myValue, "My Value", color.purple)
debug.alert(myCondition, "Condition met!")
debug.trace(myValue > threshold, "Value above threshold")
```

### Available Helper Functions

- `debug.plot()` - Plot values with debug styling
- `debug.alert()` - Generate debugging alerts
- `debug.trace()` - Trace condition changes
- `debug.log()` - Log values to console/output
- `debug.monitor()` - Monitor expressions
- `debug.profile()` - Profile code sections

## Interactive Debugging Server

### Starting the Server

```bash
/pine-debug server --port 8080 --host localhost
```

### Server Features

- Web-based debugging interface
- Real-time variable inspection
- Interactive chart visualization
- Code execution control
- Breakpoint management

### Web Interface

- Access at `http://localhost:8080`
- Real-time updates
- Chart visualization
- Variable explorer
- Code editor with debugging

## Performance Profiling

### Metrics Collected

- **CPU Time**: Execution time per bar/iteration
- **Memory Usage**: Variable memory consumption
- **Complexity**: Cyclomatic complexity analysis
- **Calls**: Function call frequency
- **Dependencies**: Variable dependency analysis

### Profiling Reports

- Text summary in console
- HTML reports with charts
- CSV export for analysis
- Comparison between runs

## AI-Assisted Analysis

### Analysis Categories

- **Performance**: Optimization opportunities
- **Bugs**: Potential bugs and issues
- **Patterns**: Code patterns and anti-patterns
- **Style**: Code style improvements
- **Logic**: Logical errors and improvements

### AI Features

- Pattern recognition in PineScript code
- Suggestions for optimization
- Bug detection with explanations
- Code restructuring recommendations
- Best practices guidance

## Integration

### Development Workflow

1. Write PineScript indicator
2. Add debug helper includes
3. Use debug functions in code
4. Run `/pine-debug inspect` to check values
5. Use `/pine-debug profile` for performance
6. Apply AI suggestions for improvements

### Testing Strategy

```bash
# Run basic tests
/pine-debug test --scenarios basic

# Run edge case tests
/pine-debug test --scenarios edge-cases

# Run performance tests
/pine-debug test --scenarios performance

# Run all tests with coverage
/pine-debug test --scenarios all --coverage
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Debug PineScript
  run: |
    /pine-debug inspect --var "mainIndicator" --bars 50 --format json
    /pine-debug profile --metrics complexity
    /pine-debug test --scenarios basic
```

## Common Debugging Scenarios

### Indicator Not Plotting

```bash
# Check variable values
/pine-debug inspect --var "plotValue" --bars 20

# Trace calculation
/pine-debug trace --var "calculationResult" --plot

# Monitor conditions
/pine-debug monitor --condition "not na(plotValue)" --alert
```

### Performance Issues

```bash
# Profile CPU usage
/pine-debug profile --metrics cpu --iterations 1000

# Check memory consumption
/pine-debug profile --metrics memory

# Analyze complexity
/pine-debug profile --metrics complexity
```

### Logic Errors

```bash
# AI analysis for logic issues
/pine-debug ai --file indicator.pine --patterns logic,bugs

# Test edge cases
/pine-debug test --scenarios edge-cases

# Monitor specific conditions
/pine-debug monitor --condition "unexpectedCondition" --alert
```

## Related Commands

- `/pine-setup` - Setup PineScript development environment
- `/pine-backtest` - Backtest indicators (complements debugging)
- `/pine-optimize` - Optimize indicator parameters
- `/pine-validate` - Validate indicator code
- `/pine-convert` - Convert between PineScript versions
- `/pine-alert` - Configure alerts (works with debug monitoring)

## Environment Variables

- `PINE_DEBUG_PORT` - Default debugging server port
- `PINE_DEBUG_HOST` - Default debugging server host
- `PINE_DEBUG_OUTPUT` - Default output directory
- `PINE_DEBUG_VERBOSE` - Enable verbose debugging output

## Notes

- Debugging requires PineScript source code
- Some features require TradingView PineScript v5+
- AI analysis requires network access
- Performance profiling adds overhead
- Debugging server runs locally by default
- Generated helpers should be included in PineScript
- Regular debugging improves indicator quality
- Consider privacy when using AI analysis
- Debug output can be large for many bars
- Use `--verbose` for detailed error information
