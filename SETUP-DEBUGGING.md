# PineScript Debugging Tools Setup Guide

## Overview

The PineScript debugging tools provide comprehensive debugging capabilities for PineScript indicator development, including:

- **Interactive debugging** with breakpoints and step execution
- **Variable inspection** with real-time monitoring
- **Performance profiling** and complexity analysis
- **Visual debugging** with charts and plots
- **Web-based interface** for remote debugging

## Quick Start

### 1. Install Dependencies

The debugging tools require Node.js and npm. Dependencies are already in `package.json`:

```bash
npm install
```

This installs:

- `express` - Web server framework
- `socket.io` - Real-time communication
- `codemirror` - Code editor for web interface
- `chart.js` - Live chart visualization

### 2. Start Debugging Server

#### Option A: Using the CLI command

```bash
node scripts/commands/pine-debug.js server --port 3000
```

#### Option B: Direct server start

```bash
node scripts/pinescript/debug-server.js --port 3000
```

#### Command Options:

- `--port, -p` - Port number (default: 3000)
- `--file, -f` - PineScript file to debug
- `--project, -d` - Project directory (default: current)
- `--help, -h` - Show help

### 3. Access Web Interface

Open your browser to:

- **Main interface**: http://localhost:3000/
- **Debug interface**: http://localhost:3000/debug

## Complete Setup for Full Features

### 1. Configure PineScript Project

For full debugging features (validation, optimization, backtesting), configure your project:

```bash
node scripts/commands/pine-setup.js
```

This will:

1. Detect PineScript tools and versions
2. Set up project configuration
3. Enable all debugging features

### 2. Install Debug Helpers in Your PineScript

Include debugging helpers in your PineScript files:

```pine
//@version=5
indicator("My Indicator", overlay=true)

// Include debug helpers
//@include "examples/pinescript-projects/debug-helpers/debug-helpers.pine"
//@include "examples/pinescript-projects/debug-helpers/debug-breakpoints.pine"

// Your indicator code here
rsi = ta.rsi(close, 14)

// Use debugging functions
debug.plot(rsi, "RSI", color=color.blue)
debug.setBreakpoint("rsi > 70", "Overbought")
```

### 3. Available Debugging Commands

#### `/pine-debug` Command Suite

```bash
# Inspect variables and their history
node scripts/commands/pine-debug.js inspect my-indicator.pine

# Trace variable values with plot code generation
node scripts/commands/pine-debug.js trace my-indicator.pine --variable rsi

# Monitor conditions and generate alerts
node scripts/commands/pine-debug.js monitor my-indicator.pine --condition "rsi > 70"

# Profile performance and complexity
node scripts/commands/pine-debug.js profile my-indicator.pine

# Generate debug helper library
node scripts/commands/pine-debug.js helpers --output my-debug-helpers.pine

# Start interactive debugging server
node scripts/commands/pine-debug.js server --port 3000 --file my-indicator.pine

# Run debugging tests
node scripts/commands/pine-debug.js test my-indicator.pine
```

## Web Debugging Interface Features

### 1. Code Editor

- Syntax highlighting for PineScript
- Breakpoint management (click gutter)
- Line numbers and navigation
- File loading from project

### 2. Variable Inspection

- Real-time variable values
- Type information
- Historical tracking
- Chart visualization

### 3. Breakpoint Management

- Set/clear breakpoints
- Conditional breakpoints
- Hit count tracking
- Visual indicators

### 4. Execution Control

- Start/pause/stop debugging
- Step execution (bar-by-bar)
- Speed control (1x to 10x)
- Call stack viewing

### 5. Live Charts

- Real-time variable plotting
- Multiple variable support
- Time-based visualization
- Chart controls and clearing

### 6. Console Output

- Debug messages
- Error reporting
- Execution logs
- User commands

## Debug Helper Functions

### Visual Debugging

```pine
debug.plot(value, label, color)        // Plot variable
debug.plotShape(condition, label, ...) // Plot shapes
debug.plotchar(value, label, char)     // Plot characters
debug.plotTable(title, rows)           // Display table
```

### Variable Analysis

```pine
debug.inspect(variable, label)         // Inspect variable
debug.trace(variable, label)           // Trace with history
debug.monitor(condition, label)        // Monitor condition
```

### Breakpoints

```pine
debug.setBreakpoint(condition, label)  // Set breakpoint
debug.clearBreakpoints()               // Clear all breakpoints
debug.checkBreakpoints()               // Check breakpoints
```

### Performance

```pine
debug.startTimer(label)                // Start performance timer
debug.stopTimer(label)                 // Stop and log timer
debug.profileSection(label)            // Profile code section
```

### Error Detection

```pine
debug.validate(condition, message)     // Validate condition
debug.assert(condition, message)       // Assert condition
debug.logError(message)                // Log error
```

## Example Projects

### 1. Complex Indicator with Debugging

```bash
examples/pinescript-projects/debug-examples/complex-indicator-debug.pine
```

- RSI + MACD + Composite indicator
- Integrated debugging throughout
- Breakpoint examples
- Performance profiling

### 2. Simple Test Indicator

```bash
examples/pinescript-projects/debug-examples/simple-test-indicator.pine
```

- Basic indicator with intentional bugs
- Debugging helper usage
- Error detection examples

### 3. Interactive Debugging Demo

```bash
examples/pinescript-projects/debug-examples/interactive-debugging-demo.pine
```

- Complete debugging demonstration
- All debug features in one file
- Step-by-step examples

### 4. Visualization Patterns

```bash
examples/pinescript-projects/debug-helpers/visualization-patterns.pine
```

- 10 standard visualization patterns
- Chart styling examples
- Plot configuration templates

## Troubleshooting

### Common Issues

#### 1. "Project not configured" warning

**Solution**: Run `/pine-setup` or use basic debugging mode

```bash
node scripts/commands/pine-setup.js
```

#### 2. Server won't start on port

**Solution**: Use a different port or check for existing processes

```bash
node scripts/pinescript/debug-server.js --port 3001
```

#### 3. Debug helpers not found in PineScript

**Solution**: Ensure correct include path

```pine
//@include "examples/pinescript-projects/debug-helpers/debug-helpers.pine"
```

#### 4. Charts not updating

**Solution**: Check browser console for errors and ensure numeric variables

#### 5. Breakpoints not hitting

**Solution**: Verify conditions are valid PineScript expressions

### Debug Server Logs

Check server output for:

- Port binding confirmation
- File loading status
- Connection events
- Error messages

### Browser Developer Tools

Use browser dev tools for:

- WebSocket connection status
- JavaScript errors
- Network requests
- Console logs

## Advanced Configuration

### Custom Port Configuration

Create `.debug-config.json`:

```json
{
  "port": 3000,
  "projectPath": "./my-pinescript-project",
  "defaultFile": "main.pine",
  "chartMaxPoints": 100,
  "debugLevel": "verbose"
}
```

### Environment Variables

```bash
export PINE_DEBUG_PORT=3000
export PINE_DEBUG_PROJECT=/path/to/project
export PINE_DEBUG_FILE=indicator.pine
```

### Integration with TradingView

1. **Copy debug helpers** to your TradingView script
2. **Use include comments** for organization
3. **Enable/disable debugging** with input boolean
4. **Export debug data** for analysis

## Performance Tips

### 1. Limit Chart Points

```javascript
// In debug.html, adjust maxPoints
function updateChart(variableName, value, maxPoints = 50) {
```

### 2. Selective Debugging

```pine
debugEnabled = input.bool(false, "Enable Debugging")

if debugEnabled
    debug.plot(rsi, "RSI")
    debug.setBreakpoint("rsi > 70")
```

### 3. Batch Updates

Group debug calls to reduce overhead:

```pine
// Instead of individual calls
debug.plot(rsi, "RSI")
debug.plot(sma, "SMA")
debug.plot(macd, "MACD")

// Use batch plotting
debug.plotMultiple([
    [rsi, "RSI", color.blue],
    [sma, "SMA", color.red],
    [macd, "MACD", color.green]
])
```

### 4. Conditional Debugging

Only debug when needed:

```pine
if bar_index % 10 == 0  // Every 10 bars
    debug.inspect(rsi, "RSI Sample")
```

## Security Considerations

### 1. Local Development Only

The debug server is designed for **local development only**. Do not expose it to the internet.

### 2. File Access

The server can read files in the project directory. Ensure sensitive files are excluded.

### 3. WebSocket Connections

Socket.IO connections are limited to localhost by default.

### 4. No Authentication

The web interface has no authentication. Use only in trusted environments.

## Next Steps

### 1. Explore Examples

```bash
# Load example in debug server
node scripts/pinescript/debug-server.js --file examples/pinescript-projects/debug-examples/complex-indicator-debug.pine
```

### 2. Integrate with Your Project

1. Copy debug helpers to your project
2. Add include statements to your indicators
3. Start debugging server
4. Load your indicator in the web interface

### 3. Customize for Your Needs

- Modify debug helper functions
- Add custom visualization
- Extend the web interface
- Integrate with your workflow

## Support

### Documentation

- This guide (`SETUP-DEBUGGING.md`)
- Example projects in `examples/pinescript-projects/`
- Code comments in debug helper files

### Debugging the Debugger

Enable verbose logging:

```bash
node scripts/pinescript/debug-server.js --verbose
```

Check browser console for client-side issues.

### Reporting Issues

Include:

1. Server logs
2. Browser console output
3. PineScript file
4. Steps to reproduce

## License

These debugging tools are part of the everything-opencode project. See main project license for details.

---

**Happy Debugging!** 🐛🔧
