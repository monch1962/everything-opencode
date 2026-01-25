# Advanced PineScript Debugging Features

## Overview

This document covers the advanced debugging features implemented in Phase 3 of the PineScript debugging tools development. These features provide professional-grade debugging capabilities for serious PineScript indicator development.

## Table of Contents

1. [Memory Profiling](#memory-profiling)
2. [Code Coverage Analysis](#code-coverage-analysis)
3. [Automated Test Generation](#automated-test-generation)
4. [Performance Benchmarking](#performance-benchmarking)
5. [Session Export/Import](#session-exportimport)
6. [TradingView Integration](#tradingview-integration)
7. [Complete Workflow Example](#complete-workflow-example)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

## Memory Profiling

### Overview

Advanced memory profiling helps identify memory leaks, optimize memory usage, and prevent performance issues in PineScript indicators.

### Key Features

- **Type-based memory estimation**: Different memory costs for variables, arrays, series
- **Leak detection**: Trend analysis to identify growing memory usage
- **Threshold alerts**: Warning and critical thresholds for memory usage
- **Visualization**: Memory usage charts and tables
- **Optimization suggestions**: Specific recommendations based on memory patterns

### Usage

#### 1. Include Memory Profiling Helpers

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-memory.pine"
```

#### 2. Configure Memory Profiling

```pine
// Enable memory profiling
memoryProfilingEnabled = input.bool(true, "Enable Memory Profiling")

// Set thresholds
warningThreshold = input.int(50, "Memory Warning Threshold")
criticalThreshold = input.int(100, "Memory Critical Threshold")
```

#### 3. Track Variable Memory

```pine
// Track variable memory usage
myVar = close * 2
debug.trackVariable("myVar", myVar, "variable")

// Track array memory
myArray = array.new_float(0)
array.push(myArray, close)
debug.trackVariable("myArray", myArray, "array")
```

#### 4. Profile Code Blocks

```pine
// Profile memory usage of a function
result = debug.profileMemory("RSI Calculation", () =>
    ta.rsi(close, 14)
)
```

#### 5. Visualize Memory Usage

```pine
// Plot memory usage
debug.plotMemoryUsage()

// Show memory statistics table
debug.showMemoryTable()

// Generate memory report
if barstate.islast
    report = debug.generateMemoryReport()
    debug.log(report)
```

### CLI Commands

```bash
# Profile with memory analysis
node scripts/commands/pine-debug.js profile --metrics memory --memory --output memory-profile.json

# Generate memory profiling helpers
node scripts/commands/pine-debug.js profile --memory --output profile.json
```

## Code Coverage Analysis

### Overview

Code coverage analysis helps ensure your PineScript code is thoroughly tested by tracking which parts of your code are executed during debugging sessions.

### Key Features

- **Multi-dimensional coverage**: Functions, conditions, loops, lines, branches
- **Real-time tracking**: Coverage updates as code executes
- **Gap identification**: Highlights untested code sections
- **Visualization**: Coverage trends and percentages
- **Test generation**: Creates tests for uncovered code

### Usage

#### 1. Include Coverage Helpers

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-coverage.pine"
```

#### 2. Configure Coverage Tracking

```pine
// Enable coverage tracking
coverageEnabled = input.bool(true, "Enable Code Coverage")

// Set tracking granularity
trackFunctions = input.bool(true, "Track Function Coverage")
trackConditions = input.bool(true, "Track Condition Coverage")
```

#### 3. Register Code Elements

```pine
// Register functions
myFunction() =>
    debug.registerFunction("myFunction")
    debug.markFunctionExecuted("myFunction")
    // Function logic
    result = close * 2
    result

// Register and track conditions
condition = close > open
debug.registerCondition()
if condition
    debug.markConditionExecuted()
    debug.markBranchExecuted()  // True branch
else
    debug.markBranchExecuted()  // False branch
```

#### 4. View Coverage Information

```pine
// Show coverage table
debug.showCoverageTable()

// Plot coverage trends
debug.plotCoverageTrend()

// Generate coverage report
if barstate.islast
    report = debug.generateCoverageReport()
    debug.log(report)
```

#### 5. Generate Tests from Coverage

```pine
// Generate test cases from coverage data
if barstate.islast
    testSuite = debug.generateTestCases()
    debug.log("\n=== GENERATED TEST SUITE ===\n" + testSuite)
```

### CLI Commands

```bash
# Analyze code coverage
node scripts/commands/pine-debug.js profile --metrics coverage --output coverage-report.json
```

## Automated Test Generation

### Overview

Automated test generation creates comprehensive test suites from debugging sessions, capturing real execution patterns and edge cases.

### Key Features

- **Data-driven tests**: Generates tests from actual execution data
- **Multiple test types**: Unit, integration, edge case, condition tests
- **Intelligent generation**: Identifies patterns and creates relevant tests
- **Export capabilities**: Export test data for external use
- **Assertion framework**: Built-in assertion functions for testing

### Usage

#### 1. Include Test Generation Helpers

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-testgen.pine"
```

#### 2. Configure Test Generation

```pine
// Enable test generation
testGenEnabled = input.bool(true, "Enable Test Generation")

// Set generation modes
generateUnitTests = input.bool(true, "Generate Unit Tests")
generateEdgeCaseTests = input.bool(true, "Generate Edge Cases")
```

#### 3. Collect Test Data

```pine
// Collect input/output data
value = close
calculated = myCalculation(value)
debug.collectTestData(value, calculated, "Close price doubled")

// Collect conditions
isBullish = close > open
debug.collectTestCondition(isBullish, "Bullish candle")

// Record function calls
debug.recordFunctionCall("myCalculation", [value], calculated)

// Record edge cases
if close == 0
    debug.recordEdgeCase("Zero price", [close], calculated)
```

#### 4. Generate and Run Tests

```pine
// Generate complete test suite
if barstate.islast
    testSuite = debug.generateTestSuite()
    debug.log(testSuite)

    // Export test data
    exportData = debug.exportTestData()
    debug.log("\n" + exportData)
```

#### 5. Use Assertion Functions

```pine
// Assertion in tests
debug.assertEqual(expectedValue, actualValue, 0.001, "Values should match")

// Assert with custom message
debug.assert(condition, "Condition should be true")

// Test error conditions
debug.assertThrows(() =>
    // Code that should throw an error
    1 / 0
, "Division by zero should throw error")
```

### CLI Integration

Test generation works seamlessly with the debug server. As you debug your indicator, test data is automatically collected and can be exported for use in automated testing pipelines.

## Performance Benchmarking

### Overview

Performance benchmarking compares your custom indicators against standard TradingView indicators, providing objective performance metrics and optimization guidance.

### Key Features

- **Standard comparison**: Benchmarks against RSI, SMA, MACD
- **Multi-metric analysis**: Execution time, memory usage, accuracy
- **Performance scoring**: 0-100 score with ratings
- **Visualization**: Performance trends and comparisons
- **Optimization recommendations**: Specific suggestions for improvement

### Usage

#### 1. Include Benchmarking Helpers

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-benchmark.pine"
```

#### 2. Configure Benchmarking

```pine
// Enable benchmarking
benchmarkEnabled = input.bool(true, "Enable Benchmarking")

// Set comparison targets
compareToRSI = input.bool(true, "Compare to RSI")
compareToSMA = input.bool(true, "Compare to SMA")

// Set benchmark parameters
benchmarkIterations = input.int(100, "Benchmark Iterations")
```

#### 3. Benchmark Your Code

```pine
// Your custom RSI calculation
myRSI(src, length) =>
    // Benchmark this calculation
    debug.benchmark("myRSI", () =>
        up = ta.rma(math.max(ta.change(src), 0), length)
        down = ta.rma(-math.min(ta.change(src), 0), length)
        rsi = down == 0 ? 100 : up == 0 ? 0 : 100 - (100 / (1 + up / down))
        rsi
    )

// Benchmark against standard RSI
[rsiRatio, rsiAccuracy, testTime, standardTime] = debug.benchmarkRSI(() =>
    myRSI(close, 14)
)
```

#### 4. View Benchmark Results

```pine
// Show benchmark table
debug.showBenchmarkTable()

// Plot performance trends
debug.plotPerformanceTrends()

// Generate benchmark report
if barstate.islast
    report = debug.generateBenchmarkReport()
    debug.log(report)
```

#### 5. Use Timing Functions

```pine
// Manual timing
timer = debug.startTimer("My Calculation")
result = complexCalculation()
elapsedTime = debug.stopTimer(timer)
```

### CLI Commands

```bash
# Run comprehensive benchmarking
node scripts/commands/pine-debug.js profile --metrics cpu,memory,accuracy --output benchmark.json
```

## Session Export/Import

### Overview

Session export/import enables collaboration, session persistence, and analysis of debugging sessions across different environments.

### Key Features

- **Complete session capture**: Breakpoints, watches, variables, call stack
- **Multiple formats**: JSON for programmatic use, CSV for spreadsheet analysis
- **File upload/download**: Easy sharing of debugging sessions
- **Metadata preservation**: Project info, timestamps, configuration
- **Real-time sharing**: Export while debugging is in progress

### Usage

#### 1. Export Session via API

```bash
# Export to JSON file
curl http://localhost:3000/api/export/file?format=json > debug-session.json

# Export to CSV
curl http://localhost:3000/api/export/file?format=csv > debug-session.csv

# Get JSON data
curl http://localhost:3000/api/export
```

#### 2. Import Session via API

```bash
# Import from JSON file
curl -X POST -H "Content-Type: application/json" \
  -d @debug-session.json \
  http://localhost:3000/api/import

# Import via file upload (using curl with form data)
curl -X POST -F "sessionFile=@debug-session.json" \
  http://localhost:3000/api/import/file
```

#### 3. Web Interface

The debug web interface includes export/import buttons:

- **Export**: Download session as JSON or CSV
- **Import**: Upload session file to restore state

#### 4. Session Data Structure

```json
{
  "metadata": {
    "version": "1.0.0",
    "exportDate": "2024-01-25T10:30:00Z",
    "projectPath": "/path/to/project",
    "debugFile": "my-indicator.pine",
    "totalBars": 1000
  },
  "debugState": {
    "currentBar": 500,
    "breakpoints": [10, 25, 50],
    "watches": [["rsi", "ta.rsi(close, 14)"], ["sma", "ta.sma(close, 20)"]],
    "variables": [["close", 105.25], ["rsi", 65.5]],
    "callStack": [...],
    "executionSpeed": 1,
    "isRunning": false,
    "paused": false
  },
  "statistics": {
    "barsExecuted": 500,
    "breakpointsHit": 3,
    "variablesTracked": 15,
    "watchesActive": 2
  }
}
```

#### 5. Integration with Debug Server

The debug server automatically includes export/import capabilities. No additional configuration is needed.

## TradingView Integration

### Overview

TradingView integration provides a bridge between the full-featured debug environment and the constrained TradingView platform, enabling a seamless development workflow.

### Key Features

- **TV-compatible debug functions**: Minimal overhead, maximum compatibility
- **Conditional debugging**: Enable/disable via input controls
- **Data export**: Extract debug data from TradingView
- **Performance optimization**: Debug functions designed for TV constraints
- **Workflow integration**: Develop in debug server, deploy to TradingView

### Usage

#### 1. Basic TradingView Debug Setup

```pine
//@version=5
indicator("TV Debug Example", overlay=true)

// Debug configuration
debugEnabled = input.bool(false, "🔧 Enable Debugging")
debugLevel = input.int(1, "Debug Level", minval=0, maxval=3)

// Minimal debug functions
debugPlot(value, title) =>
    if debugEnabled and debugLevel >= 1
        plot(value, title, color=color.new(color.blue, 70))

debugLabel(message) =>
    if debugEnabled and debugLevel >= 2 and barstate.islast
        label.new(bar_index, high, message, color=color.new(color.gray, 50))

// Usage
rsi = ta.rsi(close, 14)
debugPlot(rsi, "RSI Debug")

if ta.crossover(rsi, 70)
    debugLabel("Overbought at bar " + str.tostring(bar_index))
```

#### 2. Complete TradingView Integration Example

See `examples/pinescript-projects/tradingview-integration/tv-debug-example.pine` for a full implementation.

#### 3. Data Export from TradingView

```pine
// Collect data for export
var string exportData = ""
if barstate.islast and debugEnabled
    exportData := "close=" + str.tostring(close) + "," +
                 "rsi=" + str.tostring(ta.rsi(close, 14)) + "," +
                 "bar_index=" + str.tostring(bar_index)

    // Display for manual copy-paste
    label.new(bar_index, low, "📋 Copy debug data:\n" + exportData,
             color=color.new(color.blue, 90))
```

#### 4. Integration Workflow

1. **Develop** in debug server with full features
2. **Test** with comprehensive debugging tools
3. **Optimize** using memory profiling and benchmarking
4. **Extract** TV-compatible debug functions
5. **Deploy** to TradingView with conditional debugging
6. **Export** data from TradingView back to debug server

#### 5. Best Practices

- **Disable in production**: Use input bool to turn off debugging
- **Level-based control**: Different debug levels for different needs
- **Performance first**: Minimal overhead when debugging is disabled
- **Data collection**: Only collect essential debug data
- **Manual export**: Use labels for data copy-paste

## Complete Workflow Example

### End-to-End Development Process

#### Step 1: Initial Development

```bash
# Start debug server with your indicator
node scripts/pinescript/debug-server.js --file my-indicator.pine --port 3000

# Open debug interface
# http://localhost:3000/debug
```

#### Step 2: Comprehensive Testing

```bash
# Run code coverage analysis
node scripts/commands/pine-debug.js profile --metrics coverage --output coverage.json

# Analyze memory usage
node scripts/commands/pine-debug.js profile --metrics memory --memory --output memory.json

# Generate tests from debugging session
# (Tests are automatically generated during debugging)
```

#### Step 3: Performance Optimization

```bash
# Benchmark against standard indicators
node scripts/commands/pine-debug.js profile --metrics cpu,memory,accuracy --output benchmark.json

# Review optimization suggestions in the report
```

#### Step 4: TradingView Preparation

```pine
// Extract TV-compatible debug functions from:
// examples/pinescript-projects/tradingview-integration/tv-debug-example.pine

// Add to your TradingView script with input controls
debugEnabled = input.bool(false, "Enable Debugging")
```

#### Step 5: Deployment and Monitoring

1. **Deploy** to TradingView with debug disabled
2. **Enable debugging** for troubleshooting
3. **Export data** from TradingView when issues occur
4. **Import data** to debug server for analysis
5. **Fix issues** and repeat the cycle

### Sample Workflow Script

```bash
#!/bin/bash
# complete-workflow.sh

# 1. Start debug server
echo "Starting debug server..."
node scripts/pinescript/debug-server.js --file $1 --port 3000 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# 2. Open debug interface (macOS)
open http://localhost:3000/debug

# 3. Run comprehensive analysis
echo "Running comprehensive analysis..."
node scripts/commands/pine-debug.js profile --file $1 --metrics all --memory --output analysis.json

# 4. Generate test suite
echo "Generating test suite..."
# (Test generation happens during debugging)

# 5. Cleanup
echo "Press Ctrl+C to stop the server"
wait $SERVER_PID
```

## API Reference

### Debug Server API Endpoints

#### GET `/api/export`

Export current debugging session as JSON.

**Response:**

```json
{
  "metadata": {...},
  "debugState": {...},
  "statistics": {...}
}
```

#### GET `/api/export/file`

Export session to file.

**Parameters:**

- `format`: `json` or `csv` (default: `json`)

**Response:** File download

#### POST `/api/import`

Import debugging session from JSON.

**Request Body:** Session JSON

**Response:**

```json
{
  "success": true,
  "message": "Session imported successfully",
  "bars": 500,
  "breakpoints": 3,
  "variables": 15
}
```

#### POST `/api/import/file`

Import session from uploaded file.

**Request:** Multipart form with `sessionFile`

**Response:** Same as `/api/import`

### CLI Command Reference

#### Profile Command

```bash
node scripts/commands/pine-debug.js profile [options]
```

**Options:**

- `--file, -f`: PineScript file to profile
- `--metrics`: Metrics to collect (cpu,memory,complexity,coverage,accuracy)
- `--memory`: Enable advanced memory profiling
- `--iterations, -i`: Number of iterations (default: 1000)
- `--output, -o`: Output file path
- `--verbose, -v`: Verbose output

**Examples:**

```bash
# Comprehensive analysis
node scripts/commands/pine-debug.js profile --metrics all --memory --output full-analysis.json

# Memory-focused analysis
node scripts/commands/pine-debug.js profile --metrics memory --memory --output memory-analysis.json

# Coverage analysis
node scripts/commands/pine-debug.js profile --metrics coverage --output coverage-report.json
```

### PineScript Debug Functions

#### Memory Profiling Functions

- `debug.trackVariable(name, value, type)`
- `debug.profileMemory(label, codeBlock)`
- `debug.plotMemoryUsage()`
- `debug.generateMemoryReport()`

#### Coverage Analysis Functions

- `debug.registerFunction(name)`
- `debug.markFunctionExecuted(name)`
- `debug.registerCondition()`
- `debug.markConditionExecuted()`
- `debug.generateCoverageReport()`
- `debug.generateTestCases()`

#### Test Generation Functions

- `debug.collectTestData(input, output, label)`
- `debug.recordFunctionCall(name, args, result)`
- `debug.generateTestSuite()`
- `debug.assertEqual(expected, actual, tolerance, message)`

#### Benchmarking Functions

- `debug.benchmark(label, codeBlock)`
- `debug.benchmarkRSI(testCode)`
- `debug.benchmarkSMA(testCode)`
- `debug.benchmarkMACD(testCode)`
- `debug.generateBenchmarkReport()`

## Troubleshooting

### Common Issues

#### 1. Memory Profiling Overhead

**Issue:** Indicator runs slowly with memory profiling enabled.

**Solution:**

- Reduce tracking granularity
- Increase warning/critical thresholds
- Disable memory profiling in production
- Use `debug.profileMemory()` only for specific code blocks

#### 2. Coverage Tracking Inaccuracy

**Issue:** Coverage percentages don't match expectations.

**Solution:**

- Ensure all code elements are properly registered
- Check that `mark...Executed()` calls are in the right places
- Verify coverage configuration (trackFunctions, trackConditions, etc.)
- Use `debug.generateCoverageReport()` for detailed analysis

#### 3. Test Generation Limitations

**Issue:** Generated tests don't cover all edge cases.

**Solution:**

- Increase `maxTestCases` parameter
- Manually record edge cases with `debug.recordEdgeCase()`
- Add specific test conditions with `debug.collectTestCondition()`
- Review and enhance generated tests manually

#### 4. Benchmarking Inconsistency

**Issue:** Benchmark results vary between runs.

**Solution:**

- Increase `benchmarkIterations` for more stable results
- Ensure `warmupBars` is sufficient
- Run benchmarks multiple times and average results
- Check for external factors affecting performance

#### 5. Session Import/Export Issues

**Issue:** Imported session doesn't match exported state.

**Solution:**

- Verify both systems are using the same version
- Check for data type compatibility issues
- Ensure all required fields are present in exported data
- Use JSON format for maximum compatibility

#### 6. TradingView Compatibility

**Issue:** Debug functions don't work in TradingView.

**Solution:**

- Use TV-compatible functions from `tv-debug-example.pine`
- Ensure all functions work within TV constraints
- Disable unsupported features with conditional logic
- Test with minimal debug configuration first

### Performance Optimization Tips

1. **Disable when not needed**: Use input controls to turn off debugging
2. **Level-based control**: Different debug levels for different scenarios
3. **Selective tracking**: Only track what you need
4. **Batch operations**: Group similar debug operations
5. **Last-bar execution**: Perform heavy operations only on last bar

### Debug Server Issues

#### Server Won't Start

```bash
# Check port availability
lsof -i :3000

# Try different port
node scripts/pinescript/debug-server.js --port 3001

# Check dependencies
npm install
```

#### API Endpoints Not Working

```bash
# Test basic connectivity
curl http://localhost:3000/api/status

# Check server logs for errors
# Verify CORS headers are set correctly
```

#### File Upload Issues

```bash
# Check file size limits
# Verify express-fileupload is installed
# Check file format (must be valid JSON)
```

## Conclusion

The advanced debugging features provide a complete professional debugging ecosystem for PineScript development. By combining memory profiling, code coverage analysis, automated test generation, performance benchmarking, session export/import, and TradingView integration, you can:

1. **Develop** with confidence using comprehensive debugging tools
2. **Test** thoroughly with automated test generation and coverage analysis
3. **Optimize** performance with memory profiling and benchmarking
4. **Deploy** seamlessly to TradingView with compatible debug functions
5. **Collaborate** effectively with session export/import capabilities
6. **Maintain** quality with ongoing monitoring and analysis

Start with the basic features and gradually incorporate advanced capabilities as needed. The system is designed to scale with your development needs, from simple debugging to professional-grade indicator development.

## Additional Resources

- **Basic Debugging Guide**: `SETUP-DEBUGGING.md`
- **TradingView Integration**: `examples/pinescript-projects/debug-helpers/tradingview-integration.md`
- **Example Indicators**: `examples/pinescript-projects/`
- **Debug Server**: `scripts/pinescript/debug-server.js`
- **CLI Commands**: `scripts/commands/pine-debug.js`

For support and additional information, refer to the main project documentation or create an issue in the project repository.
