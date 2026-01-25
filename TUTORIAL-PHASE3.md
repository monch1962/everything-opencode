# Phase 3 Advanced Debugging - Interactive Tutorial

## 🎯 Welcome to Phase 3!

Congratulations on reaching the advanced debugging features! This tutorial will guide you through using all the new Phase 3 capabilities.

## 📋 Quick Start

### 1. Start the Enhanced Debug Server

```bash
# Start with our comprehensive test indicator
node scripts/pinescript/debug-server.js --file examples/pinescript-projects/debug-examples/phase3-comprehensive-test.pine --port 3000
```

### 2. Open the Debug Interface

- **Main Interface**: http://localhost:3000/
- **Debug Interface**: http://localhost:3000/debug

### 3. Explore Phase 3 Features

Use the comprehensive test indicator to see all features in action!

## 🧠 Memory Profiling Tutorial

### What It Does

Memory profiling helps you:

- Track memory usage of variables, arrays, and series
- Detect memory leaks before they cause issues
- Optimize memory usage for better performance
- Set warning and critical thresholds

### Hands-On Exercise

1. **Enable Memory Profiling** in the test indicator
   - Turn on "Enable Memory Profiling" input
   - Set "Memory Warning Threshold" to 30
   - Set "Memory Critical Threshold" to 50

2. **Watch Memory Usage**
   - Observe the "Avg Memory" plot (purple line)
   - Look for warnings when thresholds are exceeded

3. **Try Different Scenarios**
   - Increase "Max Bars to Process" to see memory growth
   - Enable/disable different indicator calculations
   - Watch how memory usage changes

### Code Example

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-memory.pine"

// Configure memory profiling
memoryProfilingEnabled = input.bool(true, "Enable Memory Profiling")
warningThreshold = input.int(50, "Memory Warning Threshold")

// Track variable memory
myVariable = close * 2
debug.trackVariable("myVariable", myVariable, "variable")

// Profile a code block
result = debug.profileMemory("Complex Calculation", () =>
    ta.rsi(close, 14) * ta.sma(close, 20)
)

// Visualize memory usage
debug.plotMemoryUsage()
debug.showMemoryTable()
```

## 📈 Code Coverage Tutorial

### What It Does

Code coverage analysis helps you:

- Track which parts of your code are executed
- Identify untested code sections
- Generate tests for uncovered code
- Measure testing completeness

### Hands-On Exercise

1. **Enable Code Coverage** in the test indicator
   - Turn on "Enable Code Coverage"
   - Set "Debug Level" to 2 or higher

2. **Watch Coverage Data**
   - Check the debug table on the last bar
   - Look at "Functions Called" and "Conditions Checked"
   - Observe the coverage percentage

3. **Experiment with Code Paths**
   - Change indicator parameters to trigger different conditions
   - Watch how coverage metrics change
   - Try to achieve 100% coverage!

### Code Example

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-coverage.pine"

// Register functions for coverage tracking
myFunction() =>
    debug.registerFunction("myFunction")
    debug.markFunctionExecuted("myFunction")
    // Your function logic here
    result = close * 2
    result

// Track conditions
condition = close > open
debug.registerCondition()
if condition
    debug.markConditionExecuted()
    debug.markBranchExecuted()  // True branch
else
    debug.markBranchExecuted()  // False branch

// View coverage information
debug.showCoverageTable()
debug.plotCoverageTrend()
```

## 🧪 Automated Test Generation Tutorial

### What It Does

Automated test generation helps you:

- Create tests from actual execution data
- Capture edge cases automatically
- Generate unit, integration, and condition tests
- Build comprehensive test suites

### Hands-On Exercise

1. **Enable Test Generation** in the test indicator
   - Turn on "Enable Test Generation"
   - Set "Debug Level" to 3

2. **Collect Test Data**
   - Let the indicator run for several bars
   - Watch test cases accumulate in the background

3. **View Generated Tests**
   - Check the "Test Data Export" label on last bar
   - See how many test cases were collected
   - Examine the test data format

### Code Example

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-testgen.pine"

// Collect test data during execution
value = close
calculated = myCalculation(value)
debug.collectTestData(value, calculated, "Close price calculation")

// Record function calls
debug.recordFunctionCall("myCalculation", [value], calculated)

// Record edge cases
if close == 0
    debug.recordEdgeCase("Zero price", [close], calculated)

// Generate and view tests
if barstate.islast
    testSuite = debug.generateTestSuite()
    debug.log(testSuite)
```

## ⚡ Performance Benchmarking Tutorial

### What It Does

Performance benchmarking helps you:

- Compare your code against standard indicators
- Measure execution time and memory usage
- Calculate accuracy scores
- Get performance ratings and recommendations

### Hands-On Exercise

1. **Enable Benchmarking** in the test indicator
   - Turn on "Enable Benchmarking"
   - Set "Debug Level" to 2 or higher

2. **Analyze Performance**
   - Watch the "Avg Exec Time" plot (orange line)
   - Check the performance summary on last bar
   - Look at the performance score and rating

3. **Compare Implementations**
   - Try different calculation methods
   - Watch how performance metrics change
   - Aim for "Excellent" or "Good" ratings

### Code Example

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-benchmark.pine"

// Benchmark your custom RSI
customRSI = debug.benchmark("My RSI", () =>
    // Your custom RSI implementation
    ta.rsi(close, 14)
)

// Compare against standard RSI
[rsiRatio, rsiAccuracy, testTime, standardTime] = debug.benchmarkRSI(() =>
    customRSI
)

// View benchmark results
debug.showBenchmarkTable()
debug.plotPerformanceTrends()
```

## 💾 Session Export/Import Tutorial

### What It Does

Session export/import helps you:

- Save and restore debugging sessions
- Share sessions with team members
- Analyze sessions offline
- Track debugging history

### Hands-On Exercise

1. **Start a Debugging Session**
   - Load the comprehensive test indicator
   - Set some breakpoints
   - Run a few bars of execution

2. **Export the Session**

   ```bash
   # Export to JSON file
   curl http://localhost:3000/api/export/file?format=json > my-session.json

   # Or use the web interface export button
   ```

3. **Examine the Export**

   ```bash
   # Look at the exported data
   cat my-session.json | python3 -m json.tool | head -50
   ```

4. **Import the Session**
   ```bash
   # Import from JSON file
   curl -X POST -H "Content-Type: application/json" \
     -d @my-session.json \
     http://localhost:3000/api/import
   ```

### Web Interface Usage

1. **Export**: Click the "Export Session" button in the debug interface
2. **Import**: Click the "Import Session" button and select a file
3. **Formats**: Choose between JSON (programmatic) and CSV (spreadsheet)

## 📱 TradingView Integration Tutorial

### What It Does

TradingView integration helps you:

- Use debug functions within TradingView constraints
- Export data from TradingView to debug server
- Maintain a seamless development workflow
- Deploy debug-enabled indicators safely

### Hands-On Exercise

1. **Examine the TV Example**

   ```bash
   # Look at the TradingView example
   cat examples/pinescript-projects/tradingview-integration/tv-debug-example.pine | head -100
   ```

2. **Key Concepts to Note**
   - Conditional debugging with input controls
   - Performance-optimized debug functions
   - Data export via chart labels
   - Level-based debug controls

3. **Integration Workflow**
   ```
   Develop → Debug Server (full features)
      ↓
   Test → With comprehensive debugging
      ↓
   Extract → TV-compatible debug functions
      ↓
   Deploy → To TradingView (debug disabled)
      ↓
   Enable → Debugging when needed
      ↓
   Export → Data back to debug server
   ```

### Code Pattern

```pine
//@version=5
indicator("TV Debug", overlay=true)

// Debug controls
debugEnabled = input.bool(false, "Enable Debugging")
debugLevel = input.int(1, "Debug Level", 0, 3)

// TV-compatible debug functions
debugPlot(value, title) =>
    if debugEnabled and debugLevel >= 1
        plot(value, title, color=color.new(color.blue, 70))

// Usage
rsi = ta.rsi(close, 14)
debugPlot(rsi, "RSI Debug")

// Data export on last bar
if barstate.islast and debugEnabled
    exportData = "close=" + str.tostring(close) + ",rsi=" + str.tostring(rsi)
    label.new(bar_index, low, "📋 " + exportData, color=color.new(color.blue, 90))
```

## 🎮 Interactive Challenges

### Challenge 1: Memory Leak Detection

**Goal**: Create an indicator that demonstrates a memory leak and use memory profiling to detect it.

**Steps**:

1. Create an array that grows without cleanup
2. Enable memory profiling
3. Run for many bars
4. Watch for memory leak warnings
5. Fix the leak and verify

### Challenge 2: 100% Code Coverage

**Goal**: Achieve 100% code coverage on a simple indicator.

**Steps**:

1. Create a simple indicator with multiple conditions
2. Enable code coverage tracking
3. Test all possible code paths
4. Use coverage data to identify gaps
5. Add tests for uncovered code

### Challenge 3: Performance Optimization

**Goal**: Optimize an indicator to achieve "Excellent" performance rating.

**Steps**:

1. Start with a working but slow indicator
2. Enable benchmarking
3. Identify performance bottlenecks
4. Optimize the slowest parts
5. Verify improved performance score

### Challenge 4: Complete Workflow

**Goal**: Use all Phase 3 features in a complete development workflow.

**Steps**:

1. Develop indicator in debug server
2. Use memory profiling and coverage analysis
3. Generate tests automatically
4. Benchmark against standards
5. Deploy to TradingView with debug support
6. Export/import sessions as needed

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Memory Profiling Overhead

**Issue**: Indicator runs slowly with memory profiling.
**Solution**:

- Increase warning/critical thresholds
- Use `debug.profileMemory()` selectively
- Disable memory profiling in production

#### 2. Coverage Tracking Gaps

**Issue**: Coverage percentages seem incorrect.
**Solution**:

- Ensure all code paths are registered
- Check `mark...Executed()` calls
- Verify coverage configuration

#### 3. Test Generation Limitations

**Issue**: Not enough test cases generated.
**Solution**:

- Increase `maxTestCases` parameter
- Manually record edge cases
- Run through more diverse scenarios

#### 4. Benchmark Variability

**Issue**: Benchmark results vary between runs.
**Solution**:

- Increase `benchmarkIterations`
- Ensure sufficient `warmupBars`
- Run benchmarks multiple times

#### 5. TradingView Compatibility

**Issue**: Debug functions don't work in TradingView.
**Solution**:

- Use TV-compatible functions from examples
- Test with minimal configuration first
- Disable unsupported features

## 📚 Learning Resources

### Documentation Files

- **`ADVANCED-DEBUGGING.md`**: Complete Phase 3 documentation
- **`SETUP-DEBUGGING.md`**: Basic debugging setup guide
- **`tradingview-integration.md`**: TV integration details

### Example Files

- **`phase3-comprehensive-test.pine`**: All features in one indicator
- **`tv-debug-example.pine`**: TradingView implementation
- **`debug-*.pine`**: Individual feature helpers

### API Reference

- **Debug Server API**: `/api/export`, `/api/import`, etc.
- **CLI Commands**: `pine-debug profile` with advanced options
- **PineScript Functions**: `debug.*` functions for each feature

## 🚀 Next Steps

### For Beginners

1. Start with the comprehensive test indicator
2. Enable one feature at a time
3. Follow the hands-on exercises
4. Try the interactive challenges

### For Intermediate Users

1. Integrate features into your own indicators
2. Develop a complete workflow
3. Optimize performance based on benchmarks
4. Create comprehensive test suites

### For Advanced Users

1. Extend the debug helpers with custom features
2. Integrate with CI/CD pipelines
3. Develop custom benchmarking suites
4. Create specialized TradingView integrations

## 🎉 Congratulations!

You've completed the Phase 3 Advanced Debugging tutorial! You now have access to:

✅ **Memory Profiling** - Optimize memory usage and detect leaks  
✅ **Code Coverage** - Ensure complete testing of your code  
✅ **Test Generation** - Automatically create comprehensive test suites  
✅ **Performance Benchmarking** - Compare against standards and optimize  
✅ **Session Export/Import** - Collaborate and analyze debugging sessions  
✅ **TradingView Integration** - Seamless development and deployment workflow

These tools will help you develop more robust, efficient, and maintainable PineScript indicators. Happy debugging! 🐛🔧

---

**Need Help?**

- Review the documentation files
- Examine the example indicators
- Try the interactive challenges
- Refer to the troubleshooting guide

**Ready to Build?**
Start integrating these features into your own PineScript projects today!
