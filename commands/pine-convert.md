# `/pine-convert` Command

Convert PineScript code between different versions (v4 ↔ v5 ↔ v6).

## Overview

The `/pine-convert` command helps migrate PineScript code between different versions of the language. It handles syntax changes, function renames, and API updates while preserving the core logic of your indicators and strategies.

## Usage

```bash
/pine-convert [options]
```

## Options

| Option            | Alias | Description                               | Default        |
| ----------------- | ----- | ----------------------------------------- | -------------- |
| `--file`, `-f`    |       | PineScript file to convert                | Auto-detected  |
| `--from`          |       | Source version (`v4`, `v5`, `v6`, `auto`) | `auto`         |
| `--to`, `-t`      |       | Target version (`v4`, `v5`, `v6`)         | **Required**   |
| `--output`, `-o`  |       | Output file path                          | Auto-generated |
| `--backup`, `-b`  |       | Create backup of original file            | `true`         |
| `--dryRun`, `-d`  |       | Show changes without writing              | `false`        |
| `--verbose`, `-v` |       | Verbose output                            | `false`        |

## Examples

### Convert v4 to v5

```bash
/pine-convert --file my-indicator.pine --from v4 --to v5
```

### Convert v5 to v6 (auto-detect source)

```bash
/pine-convert --to v6
```

### Convert with custom output file

```bash
/pine-convert --file strategy.pine --to v5 --output strategy-v5.pine
```

### Dry run to preview changes

```bash
/pine-convert --from v5 --to v4 --dryRun --verbose
```

### Convert without backup

```bash
/pine-convert --to v6 --backup false
```

## Version Compatibility

### Supported Conversions

- **v4 → v5**: Full support with automatic detection
- **v4 → v6**: Two-step conversion (v4 → v5 → v6)
- **v5 → v4**: Partial support (some features may be lost)
- **v5 → v6**: Full support
- **v6 → v5**: Basic version change
- **v6 → v4**: Two-step conversion (v6 → v5 → v4)

### Version Detection

The command automatically detects PineScript version from:

1. `//@version=` declaration
2. Function usage (`study()` vs `indicator()`/`strategy()`)
3. API calls (`security()` vs `request.security()`)

## Conversion Details

### v4 to v5 Changes

| v4 Syntax                  | v5 Syntax                                   | Notes                          |
| -------------------------- | ------------------------------------------- | ------------------------------ |
| `study("Title")`           | `indicator("Title")` or `strategy("Title")` | Auto-detected based on content |
| `plotshape(cond, "Title")` | `plotshape(cond, title="Title")`            | Named arguments                |
| `input(defval, "Title")`   | `input(defval, title="Title")`              | Named arguments                |
| `security()`               | `request.security()`                        | New namespace                  |
| `//@version=4`             | `//@version=5`                              | Version declaration            |

### v5 to v6 Changes

| v5 Syntax         | v6 Syntax                        | Notes               |
| ----------------- | -------------------------------- | ------------------- |
| `//@version=5`    | `//@version=6`                   | Version declaration |
| Minor API updates | Same functions with enhancements | Backward compatible |

### Breaking Changes to Note

#### v4 → v5

1. **`study()` function**: Replaced by `indicator()` or `strategy()`
   - Trading logic may need manual adjustment
   - Strategy-specific functions (`strategy.entry`, `strategy.exit`) preserved

2. **`security()` function**: Moved to `request.security()` namespace
   - Syntax changes required
   - Additional parameters available in v5

3. **Function arguments**: Many functions now use named arguments
   - `plotshape(cond, "Title")` → `plotshape(cond, title="Title")`
   - Manual review recommended for complex plots

#### v5 → v4 (Downgrade)

1. **Strategy features**: May be lost when converting to `study()`
2. **New v5 functions**: Not available in v4
3. **Namespace changes**: `request.security()` reverts to `security()`

## Output Files

### Default Naming Convention

- **Original**: `my-strategy.pine`
- **v5 output**: `my-strategy.v5.pine`
- **v6 output**: `my-strategy.v6.pine`
- **v4 output**: `my-strategy.v4.pine`

### Backup Files

When `--backup true` (default):

- Original file copied to `[filename].backup`
- Preserves original version
- Can be restored if needed

## Conversion Process

### 1. Version Detection

```bash
/pine-convert --file script.pine --from auto --to v5
```

Auto-detects version from file content.

### 2. Syntax Transformation

Applies version-specific syntax changes:

- Function renames
- Argument format updates
- Namespace changes

### 3. Validation

Checks for:

- Breaking changes
- Compatibility issues
- Missing functions

### 4. Output Generation

Creates converted file with:

- Updated version declaration
- Transformed syntax
- Preserved comments and formatting

## Common Conversion Scenarios

### Simple Indicator (v4 → v5)

**Original v4:**

```pinescript
//@version=4
study("My Indicator", overlay=true)
plot(close, color=color.red)
```

**Converted v5:**

```pinescript
//@version=5
indicator("My Indicator", overlay=true)
plot(close, color=color.red)
```

### Strategy with Inputs (v4 → v5)

**Original v4:**

```pinescript
//@version=4
study("My Strategy", overlay=true)
length = input(14, "RSI Length")
rsi = rsi(close, length)
plot(rsi, "RSI")
```

**Converted v5:**

```pinescript
//@version=5
indicator("My Strategy", overlay=true)
length = input(14, title="RSI Length")
rsi = ta.rsi(close, length)
plot(rsi, "RSI")
```

### Complex Strategy (v5 → v6)

**Original v5:**

```pinescript
//@version=5
strategy("Trading Strategy", overlay=true)
rsiLength = input.int(14, "RSI Length")
rsi = ta.rsi(close, rsiLength)
if rsi < 30
    strategy.entry("Buy", strategy.long)
if rsi > 70
    strategy.entry("Sell", strategy.short)
```

**Converted v6:**

```pinescript
//@version=6
strategy("Trading Strategy", overlay=true)
rsiLength = input.int(14, "RSI Length")
rsi = ta.rsi(close, rsiLength)
if rsi < 30
    strategy.entry("Buy", strategy.long)
if rsi > 70
    strategy.entry("Sell", strategy.short)
```

## Best Practices

### 1. Always Backup First

```bash
/pine-convert --backup true
```

Preserves original file in case of issues.

### 2. Preview Changes

```bash
/pine-convert --dryRun --verbose
```

Review changes before applying them.

### 3. Test Thoroughly

```bash
/pine-validate --file converted-file.pine
```

Validate converted code for syntax errors.

### 4. Manual Review

Check for:

- Strategy logic preservation
- Plot formatting
- Input parameter compatibility
- Function availability in target version

### 5. Incremental Conversion

For complex scripts:

```bash
# Convert structure first
/pine-convert --to v5 --dryRun

# Manual adjustments

# Final conversion
/pine-convert --to v5
```

## Troubleshooting

### Conversion Errors

#### "Could not detect PineScript version"

**Solution**: Specify version manually:

```bash
/pine-convert --from v4 --to v5
```

#### "Unsupported conversion"

**Solution**: Check supported conversions table above.

#### Syntax errors after conversion

**Solution**:

1. Review breaking changes
2. Check function availability in target version
3. Manual adjustment may be needed

### Common Issues

#### Strategy features lost in v4 → v5 conversion

**Cause**: `study()` doesn't support trading functions
**Solution**: Use `strategy()` instead of `indicator()` for trading scripts

#### Plot formatting issues

**Cause**: Named argument syntax changes
**Solution**: Manually adjust plot function calls

#### Input parameter problems

**Cause**: `input()` function signature changes
**Solution**: Update input calls to use named arguments

## Integration with Other Commands

### With `/pine-validate`

```bash
# Convert version
/pine-convert --to v5

# Validate converted code
/pine-validate --file converted-file.pine
```

### With `/pine-backtest`

```bash
# Convert to latest version
/pine-convert --to v6

# Backtest converted strategy
/pine-backtest --file strategy.v6.pine
```

### With `/pine-setup`

```bash
# Configure default target version
/pine-setup

# Convert using configured settings
/pine-convert
```

## Advanced Usage

### Batch Conversion

Convert multiple files:

```bash
for file in *.pine; do
  /pine-convert --file "$file" --to v5
done
```

### Custom Conversion Rules

Extend the converter with custom rules:

```javascript
const customConversions = [
  {
    pattern: /myCustomFunction\(/g,
    replacement: "newCustomFunction(",
    description: "Custom function update",
  },
];
```

### Integration with CI/CD

```yaml
# GitHub Actions example
- name: Convert PineScript
  run: |
    /pine-convert --file ./scripts/*.pine --to v6 --backup false
```

## Limitations

### Partial Support for v5 → v4

- Strategy features may be lost
- New v5 functions not available
- Manual adjustment often required

### No Semantic Analysis

- Simple text replacement
- Doesn't understand PineScript semantics
- May miss complex patterns

### No Guarantee of Correctness

- Always validate converted code
- Test thoroughly
- Manual review recommended

## Exit Codes

| Code | Description             |
| ---- | ----------------------- |
| 0    | Success                 |
| 1    | General error           |
| 2    | Configuration error     |
| 3    | File error              |
| 4    | Conversion error        |
| 5    | Version detection error |

## See Also

- [`/pine-validate`](pine-validate.md) - Validate PineScript syntax
- [`/pine-setup`](pine-setup.md) - Configure PineScript settings
- [`/pine-backtest`](pine-backtest.md) - Backtest PineScript strategies
- [PineScript Integration Guide](../../PINESCRIPT-INTEGRATION.md) - Comprehensive PineScript integration documentation
- [TradingView PineScript Documentation](https://www.tradingview.com/pine-script-docs/) - Official PineScript docs
