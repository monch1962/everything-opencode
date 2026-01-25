# PineScript Debugging Examples

Comprehensive examples of debugging techniques for custom PineScript indicator development.

## Overview

This directory contains examples and patterns for debugging PineScript indicators using the `/pine-debug` command suite and debugging helper library.

## Files

### 1. `debug-helpers.pine`

Complete debugging library with:

- **Visual debugging**: `debug.plot()`, `debug.plotchar()`, `debug.plotshape()`
- **Series analysis**: `debug.series()`, `debug.monitorSeries()`
- **Condition tracking**: `debug.monitorCondition()`, `debug.conditionBreakdown()`
- **Performance monitoring**: `debug.trackCalculation()`, `debug.memoryMonitor()`
- **Error detection**: `debug.errorCheck()`, range validation
- **Table display**: `debug.table()`, `debug.compareSeries()`

**Usage:**

```pine
//@include "debug-helpers.pine"
debug.plot(myValue, "My Indicator")
debug.monitorCondition(buySignal, "Buy Signal", true)
```

### 2. `complex-indicator-debug.pine`

Advanced custom indicator with integrated debugging:

- **Composite indicator** with trend, momentum, and volatility components
- **Integrated debugging** at multiple levels
- **Performance monitoring** and error checking
- **Test framework** for validation
- **Debug table** for value inspection

**Features:**

- 4-level debug configuration
- Multiple output channels (plot, alert, table, all)
- Statistical debugging and anomaly detection
- Performance profiling hooks
- Comprehensive error checking

### 3. `visualization-patterns.pine`

10 visualization patterns for debugging:

1. **Value Tracking** - Reference lines and ranges
2. **Condition Visualization** - Shapes, arrows, labels
3. **Historical Comparison** - Bands and statistical ranges
4. **Multi-Series Comparison** - Correlation and scaling
5. **State Machine Visualization** - State tracking and transitions
6. **Anomaly Detection** - Error and outlier marking
7. **Performance Metrics** - Real-time performance visualization
8. **Data Table Display** - Tabular data in data window
9. **Trend Visualization** - Multi-timeframe analysis
10. **Interactive Debugging** - User-controlled debug levels

## Quick Start

### 1. Generate Debug Helpers

```bash
/pine-debug helpers --output my-debug-helpers.pine
```

### 2. Analyze Your Indicator

```bash
# Basic validation with debugging suggestions
/pine-validate --file my-indicator.pine

# Inspect specific variables
/pine-debug inspect --var "rsiValue" --bars 20 --format json

# Trace variable changes
/pine-debug trace --var "macdLine" --plot

# Monitor conditions
/pine-debug monitor --condition "crossover(fastMA, slowMA)" --alert

# Profile performance
/pine-debug profile --metrics cpu,memory,complexity --output profile.json
```

### 3. Integrate Debugging

Add to your PineScript:

```pine
//@include "debug-helpers.pine"

// Configure debugging
debugLevel = input.int(2, "Debug Level")
debugOutput = input.string("plot", "Debug Output")

// Add debug plots
debug.plot(myCalculation, "My Calculation")
debug.monitorCondition(buySignal, "Buy Signal")

// Error checking
debug.errorCheck(myValue, "My Value", ["na", "inf"])
```

## Debugging Workflow

### Phase 1: Initial Analysis

```bash
# 1. Validate syntax and get debugging suggestions
/pine-validate --file indicator.pine

# 2. Generate debugging helpers
/pine-debug helpers

# 3. Profile initial performance
/pine-debug profile --iterations 1000
```

### Phase 2: Variable Inspection

```bash
# 1. List all variables
/pine-debug inspect --var "*" --format text

# 2. Trace key variables
/pine-debug trace --var "importantValue" --bars 50 --plot

# 3. Monitor conditions
/pine-debug monitor --condition "complexCondition" --watch "var1,var2,var3"
```

### Phase 3: Performance Optimization

```bash
# 1. Profile with different metrics
/pine-debug profile --metrics complexity --verbose

# 2. Identify bottlenecks
/pine-debug inspect --var "*" --format json | grep -i "complex"

# 3. Test optimizations
/pine-debug profile --iterations 5000 --output before.json
# Make optimizations...
/pine-debug profile --iterations 5000 --output after.json
```

### Phase 4: Advanced Debugging

```bash
# 1. Generate debug plot code
/pine-debug trace --var "problematicVar" --plot

# 2. Create test alerts
/pine-debug monitor --condition "edgeCase" --alert

# 3. Compare versions
/pine-debug inspect --file v1.pine v2.pine --var "keyMetric"
```

## Common Debugging Scenarios

### Scenario 1: Indicator Not Plotting

```bash
# Check for plot functions
/pine-validate --file indicator.pine

# Inspect calculation values
/pine-debug inspect --var "finalValue" --bars 10

# Generate debug plot
/pine-debug trace --var "finalValue" --plot
```

### Scenario 2: Performance Issues

```bash
# Profile performance
/pine-debug profile --metrics cpu,complexity --verbose

# Identify complex calculations
/pine-debug inspect --var "*" | grep -i "custom"

# Check for loops
grep -n "for\|while" indicator.pine
```

### Scenario 3: Unexpected Values

```bash
# Trace variable history
/pine-debug trace --var "suspiciousVar" --bars 100

# Monitor conditions affecting the variable
/pine-debug monitor --condition "affectsSuspiciousVar" --watch "suspiciousVar"

# Check for NA/Inf values
/pine-debug inspect --var "suspiciousVar" --format json | grep -i "na\|inf"
```

### Scenario 4: Complex Logic Debugging

```bash
# Break down complex conditions
/pine-debug monitor --condition "complexCondition" --watch "subCond1,subCond2,subCond3"

# Generate condition visualization
# Add to PineScript: debug.conditionBreakdown(mainCondition, subConditions, labels)

# Track state changes
/pine-debug trace --var "stateVariable" --step 1
```

## Best Practices

### 1. Start Simple

```pine
// Begin with basic debugging
debug.plot(keyValue, "Key Value")
debug.plotchar(condition, "Condition")
```

### 2. Progressive Detail

```pine
// Level 1: Basic plots
if debugLevel >= 1
    debug.plot(mainValue, "Main")

// Level 2: Intermediate values
if debugLevel >= 2
    debug.plot(intermediate, "Intermediate")

// Level 3: Detailed analysis
if debugLevel >= 3
    debug.series(detailed, "Detailed", 50, true)
```

### 3. Performance-Aware Debugging

```pine
// Only debug on last bar for heavy calculations
if barstate.islast and debugLevel > 0
    debug.table(values, labels, "Final Values")

// Use sampling for high-frequency debugging
debugSampling = bar_index % 10 == 0
if debugSampling
    debug.plot(value, "Sampled Value")
```

### 4. Organized Output

```pine
// Group related debug outputs
debug.plot(group1Value, "Group 1 - Value")
debug.plotchar(group1Condition, "Group 1 - Condition")

// Use consistent colors
debug.plot(bullishValue, "Bullish", color=color.green)
debug.plot(bearishValue, "Bearish", color=color.red)
```

## Integration with Development Workflow

### 1. Pre-commit Checks

```bash
# Add to pre-commit hook
/pine-validate --strict
/pine-debug profile --metrics complexity --iterations 100
```

### 2. Continuous Integration

```yaml
# GitHub Actions example
- name: PineScript Debugging
  run: |
    /pine-validate --file *.pine
    /pine-debug profile --metrics complexity --output profile.json
    /pine-debug inspect --var "*" --format json --output variables.json
```

### 3. Development Script

```bash
#!/bin/bash
# dev-debug.sh
/pine-validate --file $1
/pine-debug helpers --output debug-helpers.pine
/pine-debug inspect --var "*" --bars 20 --format text
/pine-debug profile --iterations 1000 --output /tmp/profile-$(date +%s).json
```

## Troubleshooting

### Debug Helpers Not Loading

```pine
// Ensure proper include path
//@include "debug-helpers.pine"  // Same directory
//@include "../debug-helpers.pine"  // Parent directory
//@include "/full/path/to/debug-helpers.pine"  // Absolute path
```

### Performance Impact

- Reduce `debugLevel` when not needed
- Use `barstate.islast` for expensive operations
- Disable historical tracking for long series
- Sample debug output instead of every bar

### Visualization Clutter

- Use different `location` values for plotchar
- Limit the number of simultaneous plots
- Group related visuals together
- Use transparency for background elements

## Next Steps

1. **Explore the examples** - Study the patterns in each file
2. **Try the commands** - Run `/pine-debug` with different options
3. **Integrate gradually** - Add one debugging technique at a time
4. **Customize for your needs** - Modify debug helpers for your workflow
5. **Share patterns** - Contribute your debugging techniques

## Support

- Use `/pine-debug --help` for command reference
- Check validation output for debugging suggestions
- Refer to visualization patterns for inspiration
- Modify debug helpers for custom requirements

Happy debugging! 🐛➡️✅
