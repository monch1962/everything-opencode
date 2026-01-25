# TradingView Integration Guide

## Overview

This guide explains how to integrate the PineScript debugging tools with TradingView for live debugging and development workflow optimization.

## Integration Methods

### Method 1: Direct Code Integration

Copy debug helpers directly into your TradingView PineScript:

```pine
//@version=5
indicator("My Indicator with Debugging", overlay=true)

// === DEBUG HELPERS (Copy from debug-helpers.pine) ===
debug = {
    // Basic debugging functions
    plot: (value, title, color) => plot(value, title, color=color.new(color ? color : color.purple, 0), linewidth=1),
    plotchar: (value, title) => plotchar(value, title, "", location.top, size=size.tiny, color=color.new(color.blue, 0)),
    log: (message) => label.new(bar_index, high, message, color=color.new(color.gray, 0), style=label.style_label_down),

    // Your indicator logic with debugging
    myRSI: (src, length) =>
        up = ta.rma(math.max(ta.change(src), 0), length)
        down = ta.rma(-math.min(ta.change(src), 0), length)
        rsi = down == 0 ? 100 : up == 0 ? 0 : 100 - (100 / (1 + up / down))
        debug.plot(rsi, "RSI Debug")
        rsi
}

// Use debug functions
rsiValue = debug.myRSI(close, 14)
debug.log("RSI: " + str.tostring(rsiValue))
```

### Method 2: External Script Reference

Use TradingView's `//@import` directive (if available) or manually include debug helpers:

```pine
//@version=5
indicator("External Debug Integration", overlay=true)

// Manually include debug functions (copy from debug-helpers.pine)
//@include "debug-helpers.pine"  // If TradingView supports external includes

// Or define minimal debug functions
debugEnabled = input.bool(true, "Enable Debugging")

plotRSI = (value) =>
    if debugEnabled
        plot(value, "RSI Debug", color=color.blue)

rsi = ta.rsi(close, 14)
plotRSI(rsi)
```

### Method 3: Conditional Debugging

Use input parameters to enable/disable debugging features:

```pine
//@version=5
indicator("Conditional Debugging", overlay=true)

// Debug controls
showDebug = input.bool(false, "Show Debug Output")
debugLevel = input.int(1, "Debug Level", minval=0, maxval=3)
logToChart = input.bool(true, "Log to Chart")

// Debug function with levels
debugLog = (message, level = 1) =>
    if showDebug and level <= debugLevel
        if logToChart
            label.new(bar_index, high, message, color=color.new(color.gray, 0))
        message
    else
        ""

// Usage
rsi = ta.rsi(close, 14)
debugLog("RSI: " + str.tostring(rsi), 1)

crossover = ta.crossover(rsi, 70)
if crossover
    debugLog("RSI crossed above 70!", 2)
```

## Live Debugging Workflow

### Step 1: Development in Debug Environment

1. **Write and test** your indicator using the debug server
2. **Use all debug features**: breakpoints, variable inspection, profiling
3. **Generate test cases** and validate logic

### Step 2: Prepare for TradingView

1. **Extract debug helpers** needed for TradingView
2. **Add input controls** for enabling/disabling debugging
3. **Test in debug environment** with TradingView-like constraints

### Step 3: Deploy to TradingView

1. **Copy final code** to TradingView
2. **Enable basic debugging** with input controls
3. **Monitor performance** and adjust as needed

## Debug Data Export from TradingView

### Manual Export Method

Add export functions to your TradingView script:

```pine
//@version=5
indicator("Data Export", overlay=true)

// Data collection
var float[] debugData = array.new_float(0)
var string[] debugLabels = array.new_string(0)

// Collect data
collectData = input.bool(true, "Collect Debug Data")
if collectData and barstate.islast
    array.push(debugData, close)
    array.push(debugLabels, "Close: " + str.tostring(close))

    // Display collected data
    for i = 0 to array.size(debugData) - 1
        label.new(bar_index - i * 5, high, array.get(debugLabels, i),
                 color=color.new(color.gray, 0))

// Manual copy-paste export
if barstate.islast
    exportString = "Debug Data:\n"
    for i = 0 to array.size(debugData) - 1
        exportString := exportString + array.get(debugLabels, i) + "\n"

    // This would be copied manually from TradingView
    // and pasted into debug server
```

### Automated Export (Conceptual)

For advanced integration, you could:

1. **Use TradingView alerts** to send data to webhook
2. **Parse alert messages** in debug server
3. **Reconstruct debugging session** from alert data

```pine
// Example alert-based export
exportAlert = input.bool(false, "Enable Export Alerts")

if exportAlert and barstate.islast
    alertMessage = "DEBUG_DATA:" +
                  "close=" + str.tostring(close) + "," +
                  "rsi=" + str.tostring(ta.rsi(close, 14)) + "," +
                  "bar_index=" + str.tostring(bar_index)

    alert(alertMessage, alert.freq_once_per_bar_close)
```

## Performance Considerations for TradingView

### TradingView Limitations

1. **Execution time limits**: Keep calculations efficient
2. **Memory constraints**: Avoid large arrays
3. **Plot limits**: Too many plots can slow down rendering
4. **Alert frequency**: Limited alert capabilities

### Optimization Tips

1. **Disable debug in production**: Use input bool to turn off debugging
2. **Limit data collection**: Only collect essential debug data
3. **Use efficient data structures**: Prefer series over arrays when possible
4. **Batch operations**: Group similar calculations

### Sample Optimized Debug Setup

```pine
//@version=5
indicator("Optimized Debug", overlay=true)

// Debug configuration
debug = {
    enabled: input.bool(false, "Enable Debugging"),
    level: input.int(1, "Debug Level", minval=0, maxval=2),

    // Efficient debug plot (only when enabled)
    plot: (value, title) =>
        if debug.enabled and debug.level >= 1
            plot(value, title, color=color.new(color.blue, 70), linewidth=1),

    // Efficient logging (only on last bar)
    log: (message) =>
        if debug.enabled and debug.level >= 2 and barstate.islast
            label.new(bar_index, high, message, color=color.new(color.gray, 0))
}

// Usage
rsi = ta.rsi(close, 14)
debug.plot(rsi, "RSI")

if ta.crossover(rsi, 70) and debug.enabled
    debug.log("Overbought signal at bar " + str.tostring(bar_index))
```

## Integration with Debug Server

### Real-time Data Sync (Conceptual)

For true live debugging, you could:

1. **Run indicator in TradingView** with data export enabled
2. **Stream data to debug server** via webhooks or alerts
3. **Mirror execution** in debug server
4. **Compare results** and debug discrepancies

### Setup Example

```javascript
// debug-server-tv-integration.js
// Additional module for TradingView integration

class TradingViewIntegration {
  constructor(debugServer) {
    this.debugServer = debugServer;
    this.tvData = new Map();
  }

  // Parse TradingView alert data
  parseAlertData(alertMessage) {
    if (alertMessage.startsWith("DEBUG_DATA:")) {
      const dataStr = alertMessage.substring(11);
      const data = {};

      dataStr.split(",").forEach((pair) => {
        const [key, value] = pair.split("=");
        data[key] = parseFloat(value) || value;
      });

      return data;
    }
    return null;
  }

  // Update debug session with TradingView data
  updateWithTVData(tvData) {
    const { bar_index, close, rsi, ...otherVars } = tvData;

    // Update debug state
    this.debugServer.debugState.currentBar = bar_index || 0;
    this.debugServer.debugState.variables.set("close", close);
    this.debugServer.debugState.variables.set("rsi", rsi);

    // Add other variables
    Object.entries(otherVars).forEach(([key, value]) => {
      this.debugServer.debugState.variables.set(key, value);
    });

    // Notify clients
    this.debugServer.io.emit("tvDataUpdated", {
      bar: bar_index,
      variables: Array.from(this.debugServer.debugState.variables.entries()),
    });
  }
}
```

## Best Practices

### 1. Development Workflow

```
TradingView Script Development Workflow:
1. Prototype → Debug Server (full features)
2. Test → Debug Server (validation)
3. Optimize → Remove heavy debugging
4. Deploy → TradingView (light debugging)
5. Monitor → TradingView + basic logs
```

### 2. Code Organization

```pine
// Recommended structure
//@version=5
indicator("Well-Structured Debug", overlay=true)

// === CONFIGURATION ===
debugConfig = {
    enabled: input.bool(false, "🛠️ Debug Mode"),
    level: input.int(1, "Debug Level", minval=0, maxval=3),
    export: input.bool(false, "Export Data"),
}

// === DEBUG FUNCTIONS ===
debugHelpers = {
    // Minimal, efficient functions
}

// === INDICATOR LOGIC ===
calculateRSI() => ta.rsi(close, 14)

// === DEBUG INTEGRATION ===
main() =>
    rsi = calculateRSI()

    if debugConfig.enabled
        debugHelpers.plot(rsi, "RSI Debug")

    if debugConfig.export and barstate.islast
        exportData()

    rsi

// === EXECUTION ===
plot(main(), "Main Output")
```

### 3. Performance Monitoring

Add performance tracking to your TradingView script:

```pine
// Performance monitoring
var int executionCount = 0
var float totalTime = 0.0

startTime = timenow

// Your calculations here
rsi = ta.rsi(close, 14)

endTime = timenow
executionTime := executionTime + (endTime - startTime)
executionCount := executionCount + 1

if barstate.islast
    avgTime = executionCount > 0 ? executionTime / executionCount : 0
    label.new(bar_index, high,
             "Avg exec: " + str.tostring(avgTime, "#.##") + "ms\n" +
             "Total bars: " + str.tostring(executionCount),
             color=color.new(color.gray, 0))
```

## Troubleshooting

### Common Issues

1. **TradingView rejects code**: Remove unsupported debug functions
2. **Performance issues**: Disable debug or reduce debug level
3. **Memory errors**: Limit data collection arrays
4. **Plot overload**: Use conditional plotting

### Debugging in Production

When debugging live in TradingView:

1. **Start with minimal debugging**: Enable one feature at a time
2. **Monitor performance**: Watch for slowdowns
3. **Use chart labels**: For simple message logging
4. **Leverage alerts**: For important debug events

## Example: Complete Integration

Here's a complete example showing all integration aspects:

```pine
//@version=5
indicator("Complete Debug Integration", overlay=true)

// ===== DEBUG CONFIGURATION =====
debug = {
    // User controls
    enabled: input.bool(false, "🔧 Enable Debugging"),
    level: input.int(1, "Debug Level", 0, 3, 1),

    // Internal state
    data: {},

    // Debug functions (only execute when enabled)
    plot: (value, title, color) =>
        if debug.enabled and debug.level >= 1
            plot(value, title, color=color.new(color ? color : color.blue, 70)),

    log: (message, importance = 1) =>
        if debug.enabled and debug.level >= importance and barstate.islast
            label.new(bar_index, high, message, color=color.new(color.gray, 50)),

    // Data collection for export
    collect: (key, value) =>
        if debug.enabled
            debug.data[key] := value
}

// ===== INDICATOR LOGIC =====
calculateIndicator() =>
    rsi = ta.rsi(close, 14)
    sma = ta.sma(close, 20)

    // Debug collection
    debug.collect("rsi", rsi)
    debug.collect("sma", sma)
    debug.collect("bar", bar_index)

    [rsi, sma]

// ===== SIGNAL GENERATION =====
generateSignals(rsi, sma) =>
    buySignal = rsi < 30 and close > sma
    sellSignal = rsi > 70 and close < sma

    debug.collect("buySignal", buySignal)
    debug.collect("sellSignal", sellSignal)

    [buySignal, sellSignal]

// ===== MAIN EXECUTION =====
[rsiValue, smaValue] = calculateIndicator()
[buy, sell] = generateSignals(rsiValue, smaValue)

// Debug visualization
debug.plot(rsiValue, "RSI")
debug.plot(smaValue, "SMA", color=color.orange)

plotshape(buy, "Buy", shape.triangleup, location.belowbar, color.green, 0, 0)
plotshape(sell, "Sell", shape.triangledown, location.abovebar, color.red, 0, 0)

// Debug logging
if buy
    debug.log("BUY at " + str.tostring(close), 2)
if sell
    debug.log("SELL at " + str.tostring(close), 2)

// Data export (for manual copy-paste to debug server)
if debug.enabled and barstate.islast
    exportStr = "=== DEBUG DATA EXPORT ===\n"
    for [key, value] in debug.data
        exportStr := exportStr + key + ": " + str.tostring(value) + "\n"

    debug.log(exportStr, 3)
```

## Next Steps

1. **Start simple**: Add basic debug logging to your TradingView scripts
2. **Test thoroughly**: Use debug server for development
3. **Optimize**: Remove debug overhead before final deployment
4. **Iterate**: Continuously improve your debug integration

Remember: The goal is to create a seamless workflow between development (debug server) and production (TradingView) while maintaining performance and usability.
