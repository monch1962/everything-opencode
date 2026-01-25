# PineScript Library Integration Examples

This directory contains examples of integrating Phase 3 debugging features with popular PineScript library patterns and common indicator types.

## Available Examples

### 1. Technical Indicator Libraries

- **RSI-based strategies** with debugging
- **MACD variations** with performance benchmarking
- **Bollinger Bands** with memory profiling
- **Moving Average systems** with code coverage

### 2. Pattern Recognition Libraries

- **Candlestick patterns** with test generation
- **Chart patterns** with debugging integration
- **Support/Resistance** with session export/import

### 3. Risk Management Libraries

- **Position sizing** with memory profiling
- **Stop loss systems** with performance benchmarking
- **Risk/reward calculators** with code coverage

### 4. Utility Libraries

- **Math utilities** with comprehensive debugging
- **Date/time utilities** with test generation
- **Formatting helpers** with TradingView integration

## Integration Patterns

### Pattern 1: Wrapper Functions

```pine
// Wrap library functions with debugging
libraryRSI(src, length) =>
    debug.profileMemory("Library RSI", () =>
        ta.rsi(src, length)  // Or custom RSI implementation
    )
```

### Pattern 2: Decorator Pattern

```pine
// Add debugging to existing functions
withDebugging(fn, label) =>
    (args...) =>
        debug.benchmark(label, () => fn(args...))
```

### Pattern 3: Configuration-Based

```pine
// Enable/disable debugging per library
libraryConfig = {
    rsi: { debug: true, level: 2 },
    macd: { debug: false, level: 1 },
    bbands: { debug: true, level: 3 }
}
```

## Usage

Each example includes:

1. The library implementation
2. Debugging integration
3. Configuration examples
4. Performance optimization tips
5. TradingView deployment guide

## Best Practices

1. **Start simple**: Add basic debugging first
2. **Measure impact**: Profile before and after integration
3. **Optimize**: Use appropriate debug levels
4. **Test thoroughly**: Ensure debugging doesn't break functionality
5. **Document**: Keep integration notes for future reference
