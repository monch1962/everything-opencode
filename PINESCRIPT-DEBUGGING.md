# PineScript Debugging Tools

Comprehensive debugging suite for PineScript custom indicator development.

## Overview

This debugging suite provides advanced tools for PineScript developers to identify, diagnose, and fix issues in custom indicators and strategies. Built on top of the existing PineScript integration, it addresses the #1 pain point for advanced developers: debugging complex calculations and logic.

## Quick Start

### 1. Basic Validation with Debugging Suggestions

```bash
/pine-validate --file my-indicator.pine
```

### 2. Generate Debugging Helpers

```bash
/pine-debug helpers --output debug-helpers.pine
```

### 3. Inspect Variables

```bash
/pine-debug inspect --var "myVariable" --bars 20
```

### 4. Profile Performance

```bash
/pine-debug profile --metrics complexity --iterations 1000
```

## Command Reference

### `/pine-debug` - Debugging Command Suite

#### `inspect` - Variable Inspection

```bash
/pine-debug inspect --var "variableName" --bars 20 --format json
```

**Options:**

- `--file, -f` - PineScript file (auto-detected)
- `--var, -v` - Variable name (supports wildcards: `*`, `rsi*`)
- `--bars, -b` - Historical bars to inspect (default: 10)
- `--format` - Output format: `text`, `json`, `csv`
- `--output, -o` - Output file path

#### `trace` - Variable Tracing

```bash
/pine-debug trace --var "macdLine" --plot --bars 50
```

**Options:**

- `--plot, -p` - Generate debug plot code
- `--step, -s` - Step size for tracing (default: 1)
- `--bars, -b` - Bars to trace (default: 20)

#### `monitor` - Condition Monitoring

```bash
/pine-debug monitor --condition "crossover(fastMA, slowMA)" --alert
```

**Options:**

- `--condition, -c` - Condition expression to monitor
- `--watch, -w` - Watch variables (comma-separated)
- `--alert, -a` - Generate alert code
- `--bars, -b` - Bars to monitor (default: 50)

#### `profile` - Performance Profiling

```bash
/pine-debug profile --metrics cpu,memory,complexity --iterations 1000
```

**Options:**

- `--iterations, -i` - Number of iterations (default: 1000)
- `--metrics, -m` - Metrics: `cpu`, `memory`, `complexity`
- `--output, -o` - Output file for JSON report

#### `helpers` - Generate Debug Helpers

```bash
/pine-debug helpers --output my-debug-helpers.pine --include advanced
```

**Options:**

- `--output, -o` - Output file (default: `debug-helpers.pine`)
- `--include` - Helpers to include: `all`, `basic`, `advanced`, `custom`

#### `server` - Interactive Debugging Server

```bash
/pine-debug server --port 3000 --file indicator.pine
```

**Options:**

- `--port` - Server port (default: 3000)
- `--file, -f` - PineScript file to debug

#### `test` - Run Debugging Tests

```bash
/pine-debug test --file indicator.pine --test-cases tests.json
```

**Options:**

- `--test-cases` - Test cases file (JSON)
- `--output, -o` - Test results output

## Debug Helper Library

### Core Functions

#### Basic Debugging

```pine
//@include "debug-helpers.pine"

debug.plot(value, "Label", color=color.blue)
debug.plotchar(value, "Value Display")
debug.plotshape(condition, "Condition", shape.triangleup)
```

#### Series Analysis

```pine
debug.series(value, "Historical Series", lookback=50, showHistory=true)
debug.monitorSeries(value, "Anomaly Detection", threshold=2.0)
```

#### Condition Tracking

```pine
debug.monitorCondition(condition, "State Tracking", alertOnChange=true)
debug.conditionBreakdown(mainCondition, subConditions, conditionLabels)
```

#### Error Detection

```pine
debug.errorCheck(value, "Validation", checks=["na", "inf", "zero"])
```

#### Performance Monitoring

```pine
debug.trackCalculation("Expensive Calculation")
debug.memoryMonitor(valuesArray, labelsArray)
```

#### Table Display

```pine
debug.table(values, labels, "Debug Table")
debug.compareSeries(seriesArray, labels, comparison="pct")
```

### Configuration

```pine
debugLevel = input.int(2, "Debug Level", minval=0, maxval=3)
debugOutput = input.string("plot", "Debug Output", options=["plot", "alert", "table", "all"])
```

## Enhanced Validation with Debugging Suggestions

The `/pine-validate` command now includes debugging suggestions:

### Automatic Analysis

- **Complexity detection**: Flags indicators with >100 lines or >10 variables
- **Performance patterns**: Identifies loops and expensive calculations
- **Debugging opportunities**: Suggests where to add debug visualizations
- **Error handling**: Checks for missing NA/infinity handling

### Example Output

```
🔧 Debugging Suggestions:
  1. 💡 Complex indicator (150 lines, 25 variables).
     🛠️  Consider using /pine-debug profile to analyze performance
  2. 💡 Many variables (25) without debug visualization.
     🛠️  Add plotchar() for key variables or use debug helpers
  3. ⚠️  Loop structures detected (performance concern).
     🛠️  Use /pine-debug profile to optimize performance

🚀 Quick Debugging Commands:
   /pine-debug inspect --var VARIABLE_NAME
   /pine-debug trace --var VARIABLE_NAME --plot
   /pine-debug profile --metrics complexity
   /pine-debug helpers --output debug-helpers.pine
```

## Visualization Patterns

### 10 Standard Patterns

1. **Value Tracking** - Reference lines, ranges, background colors
2. **Condition Visualization** - Shapes, arrows, labels for discrete events
3. **Historical Comparison** - Bands, statistical ranges, fills
4. **Multi-Series Comparison** - Correlation, scaling, multiple axes
5. **State Machine Visualization** - State tracking, transitions, colors
6. **Anomaly Detection** - Error markers, outlier detection, severity coding
7. **Performance Metrics** - Real-time metrics, threshold bands
8. **Data Table Display** - Tabular data in data window
9. **Trend Visualization** - Multi-timeframe analysis, strength indicators
10. **Interactive Debugging** - User-controlled debug levels, conditional plotting

### Example Pattern

```pine
// Pattern 1: Value Tracking with Reference Lines
plot(value, "Value", color=color.blue, linewidth=2)
plot(ta.sma(value, 20), "Mean", color=color.gray)
plot(ta.lowest(value, 20), "Min", color=color.red, linewidth=1)
plot(ta.highest(value, 20), "Max", color=color.green, linewidth=1)
bgcolor(value > ta.sma(value, 20) ? color.new(color.green, 90) : color.new(color.red, 90))
```

## Example Projects

### 1. Complex Indicator with Debugging

`examples/pinescript-projects/debug-examples/complex-indicator-debug.pine`

- Complete custom indicator with integrated debugging
- Multiple debug levels and output channels
- Performance monitoring and error checking
- Test framework for validation

### 2. Visualization Patterns

`examples/pinescript-projects/debug-examples/visualization-patterns.pine`

- 10 standard visualization patterns
- Color schemes and styling guidelines
- Interactive debugging controls
- Best practices and usage examples

### 3. Simple Test Indicator

`examples/pinescript-projects/debug-examples/simple-test-indicator.pine`

- Intentional bugs for debugging practice
- Step-by-step debugging exercises
- Expected issues and fixes
- Learning objectives and practice tasks

### 4. Debug Helpers Library

`examples/pinescript-projects/debug-helpers/debug-helpers.pine`

- Comprehensive debugging function library
- Configurable debug levels and outputs
- Error detection and validation
- Performance monitoring utilities

## Debugging Workflow

### Phase 1: Initial Analysis

```bash
# 1. Validate and get suggestions
/pine-validate --file indicator.pine

# 2. Generate debug helpers
/pine-debug helpers

# 3. Profile baseline performance
/pine-debug profile --iterations 1000 --output baseline.json
```

### Phase 2: Variable Inspection

```bash
# 1. List all variables
/pine-debug inspect --var "*" --format text

# 2. Trace problematic variables
/pine-debug trace --var "problematicVar" --bars 100 --plot

# 3. Monitor complex conditions
/pine-debug monitor --condition "complexLogic" --watch "input1,input2,input3"
```

### Phase 3: Performance Optimization

```bash
# 1. Identify bottlenecks
/pine-debug profile --metrics complexity --verbose

# 2. Test optimizations
/pine-debug profile --iterations 5000 --output optimized.json

# 3. Compare results
diff baseline.json optimized.json
```

### Phase 4: Advanced Debugging

```bash
# 1. Interactive debugging
/pine-debug server --port 3000

# 2. Visual regression testing
/pine-debug compare --file v1.pine v2.pine --data test-data.csv

# 3. Generate documentation
/pine-debug docs --file indicator.pine --output DEBUGGING.md
```

## Common Debugging Scenarios

### Scenario 1: Indicator Not Plotting

```bash
# Check calculations
/pine-debug inspect --var "finalValue" --bars 10

# Generate debug visualization
/pine-debug trace --var "finalValue" --plot

# Check for NA values
/pine-debug inspect --var "*" --format json | grep -i "na"
```

### Scenario 2: Performance Issues

```bash
# Profile with different metrics
/pine-debug profile --metrics cpu,memory --iterations 5000

# Identify expensive calculations
/pine-debug inspect --var "*" | grep -i "custom\|loop"

# Check memory patterns
/pine-debug profile --metrics memory --verbose
```

### Scenario 3: Unexpected Values

```bash
# Trace variable history
/pine-debug trace --var "unexpectedValue" --bars 50 --step 1

# Monitor contributing conditions
/pine-debug monitor --condition "affectsValue" --watch "unexpectedValue"

# Check bounds and validation
/pine-debug inspect --var "unexpectedValue" --format json
```

### Scenario 4: Complex Logic Debugging

```bash
# Break down complex conditions
/pine-debug monitor --condition "mainCondition" --watch "sub1,sub2,sub3"

# Generate condition visualization code
/pine-debug trace --var "conditionState" --plot

# Track state changes
/pine-debug inspect --var "stateVariable" --bars 20
```

## Best Practices

### 1. Progressive Debugging

```pine
// Level 0: Production (no debugging)
// Level 1: Basic plots and alerts
// Level 2: Intermediate values and conditions
// Level 3: Detailed analysis and profiling
if debugLevel >= 1
    debug.plot(mainValue, "Main")
if debugLevel >= 2
    debug.plot(intermediate, "Intermediate")
if debugLevel >= 3
    debug.series(detailed, "Detailed", 50, true)
```

### 2. Performance-Aware Debugging

```pine
// Only debug on last bar for expensive operations
if barstate.islast and debugLevel > 0
    debug.table(values, labels, "Final Analysis")

// Sample debug output for high-frequency indicators
debugSampling = bar_index % 5 == 0
if debugSampling
    debug.plot(value, "Sampled Value")
```

### 3. Organized Output

```pine
// Group related debug outputs
debug.plot(group1Value, "Group 1 - Value", color=color.blue)
debug.plotchar(group1Condition, "Group 1 - Condition")

// Use consistent locations
debug.plotchar(value1, "Value 1", location=location.top)
debug.plotchar(value2, "Value 2", location=location.top - 1)
debug.plotchar(value3, "Value 3", location=location.top - 2)
```

### 4. Error Handling Integration

```pine
// Validate inputs and calculations
debug.errorCheck(inputValue, "Input", ["na", "inf"])
debug.errorCheck(calculation, "Calculation", ["na", "inf", "zero"])

// Graceful degradation
if debug.errorCheck(value, "Critical Value", ["na", "inf"])
    // Use fallback value
    safeValue = nz(value, defaultValue)
```

## Integration with Development Workflow

### Pre-commit Hooks

```bash
#!/bin/bash
# pre-commit.sh
/pine-validate --strict
/pine-debug profile --metrics complexity --iterations 100
/pine-debug inspect --var "*" --format json --output variables.json
```

### Continuous Integration

```yaml
# .github/workflows/pinescript-ci.yml
name: PineScript CI
on: [push, pull_request]
jobs:
  debug:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Debugging Analysis
        run: |
          /pine-validate --file *.pine
          /pine-debug profile --metrics complexity --output profile.json
          /pine-debug inspect --var "*" --format json --output variables.json
```

### Development Scripts

```bash
#!/bin/bash
# dev-debug.sh
INDICATOR=$1

echo "🔍 Analyzing: $INDICATOR"
/pine-validate --file $INDICATOR
/pine-debug helpers --output /tmp/debug-helpers.pine
/pine-debug inspect --var "*" --bars 20 --format text
/pine-debug profile --iterations 1000 --output /tmp/profile-$(date +%s).json
```

## Troubleshooting

### Common Issues

#### Debug Helpers Not Loading

```pine
// Check include path
//@include "debug-helpers.pine"           // Same directory
//@include "../debug-helpers.pine"        // Parent directory
//@include "/full/path/debug-helpers.pine" // Absolute path
```

#### Performance Problems

- Reduce `debugLevel` when not needed
- Use `barstate.islast` for expensive operations
- Disable historical tracking for long series
- Sample debug output instead of every bar

#### Visualization Clutter

- Use different `location` values
- Limit simultaneous plots
- Group related visuals
- Use transparency for backgrounds

#### Command Not Found

```bash
# Ensure command is executable
chmod +x scripts/commands/pine-debug.js

# Test basic functionality
node scripts/commands/pine-debug.js --help
```

## Advanced Features

### Custom Debugging Extensions

```javascript
// Extend PineScriptDebugger class
class CustomDebugger extends PineScriptDebugger {
  async customAnalysis(args) {
    // Add custom debugging logic
  }
}
```

### Integration with External Tools

```bash
# Export data for external analysis
/pine-debug inspect --var "*" --format csv --output data.csv

# Import profiling results
/pine-debug profile --input external-profile.json
```

### Plugin System

```javascript
// Debugging plugins can add:
// - New analysis methods
// - Custom visualization patterns
// - Integration with other tools
// - Advanced profiling techniques
```

## Future Development

### Planned Features

1. **Visual Debugging Interface** - Web-based GUI for interactive debugging
2. **Backtesting Debugger** - Step-through backtest execution
3. **Optimization Debugger** - Visualize parameter optimization process
4. **Machine Learning Integration** - AI-powered bug detection
5. **Collaborative Debugging** - Real-time shared debugging sessions

### Community Contributions

- Custom debugging patterns
- Performance optimization techniques
- Integration with trading platforms
- Educational debugging exercises
- Benchmark datasets for testing

## Support

### Documentation

- This guide (`PINESCRIPT-DEBUGGING.md`)
- Example projects in `examples/pinescript-projects/debug-examples/`
- Command help: `/pine-debug --help`

### Getting Help

1. Run `/pine-validate` for initial debugging suggestions
2. Check example projects for patterns
3. Use `/pine-debug helpers` to generate debugging utilities
4. Refer to visualization patterns for inspiration

### Reporting Issues

- Command issues: Check executable permissions and dependencies
- Debugging problems: Provide indicator code and debug output
- Feature requests: Describe use case and expected behavior

## Conclusion

The PineScript debugging suite provides comprehensive tools for advanced indicator development:

✅ **Immediate debugging capabilities** with `/pine-debug` commands  
✅ **Professional debugging patterns** with visualization library  
✅ **Enhanced validation** with automatic debugging suggestions  
✅ **Performance profiling** for optimization guidance  
✅ **Example projects** for learning and reference  
✅ **Integration ready** for development workflows

Start debugging with:

```bash
/pine-validate --file your-indicator.pine
/pine-debug helpers
/pine-debug inspect --var "*"
```

Happy debugging! 🐛🔍🚀
