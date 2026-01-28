# PineScript Debugger API Documentation

*Generated: 2026-01-28T01:29:17.972Z*

### Main Class

*File: scripts/commands/pine-debug.js*


## Modules

### Ai Analyzer

*File: scripts/commands/pine-debug-modules/ai-analyzer.js*

* AI Analyzer for PineScript Debugger
 *
 * Provides AI-assisted debugging suggestions and pattern analysis
 

class AIAnalyzer

#### Methods

##### `loadAIPatterns()`

AI Analyzer for PineScript Debugger
 Provides AI-assisted debugging suggestions and pattern analysis

##### `generateAISuggestions()`

Generate AI suggestions for code

##### `getCategoriesToInclude()`

Get categories to include based on filter

##### `matchesAIPattern()`

Check if line matches AI pattern

##### `calculateConfidence()`

Calculate confidence score for pattern match

##### `printAISuggestions()`

Print AI suggestions in readable format

##### `formatAsText()`

Format suggestions as text

##### `formatAsMarkdown()`

Format suggestions as markdown

##### `formatCategoryName()`

Format category name for display

##### `saveAISuggestions()`

Save AI suggestions to file

##### `generateAIDebugHelpers()`

Generate AI debug helpers

##### `generateExample()`

Generate example for pattern

##### `generateMemoryProfilingHelpers()`

Generate memory profiling helpers

##### `analyzeWithAI()`

Analyze code with AI and return comprehensive report

##### `groupByCategory()`

Group suggestions by category

##### `calculateAverageConfidence()`

Calculate average confidence

#### Exports

`AIAnalyzer`

### Argument Parser

*File: scripts/commands/pine-debug-modules/argument-parser.js*

* Argument Parser for PineScript Debugger
 *
 * Parses command line arguments with schema validation and help generation
 

class ArgumentParser

#### Methods

##### `parseArgs()`

Argument Parser for PineScript Debugger
 Parses command line arguments with schema validation and help generation

##### `parseValue()`

Parse value according to type

##### `generateHelp()`

Generate help text from schema

##### `validateOptions()`

Validate options against schema

##### `mergeOptions()`

Merge multiple option sets

##### `getCommonDebugSchema()`

Extract common debugging options schema

##### `getServerSchema()`

Extract server options schema

##### `getAIAnalysisSchema()`

Extract AI analysis options schema

#### Exports

`ArgumentParser`

### Code Analyzer

*File: scripts/commands/pine-debug-modules/code-analyzer.js*

* Code Analyzer for PineScript Debugger
 *
 * Analyzes PineScript code for complexity, performance, memory usage, and coverage
 

class CodeAnalyzer

#### Methods

##### `loadComplexityPatterns()`

Code Analyzer for PineScript Debugger
 Analyzes PineScript code for complexity, performance, memory usage, and coverage

##### `loadPerformancePatterns()`

Load performance analysis patterns

##### `loadMemoryPatterns()`

Load memory analysis patterns

##### `analyzeComplexity()`

Analyze code complexity

##### `countFunctions()`

Count functions in code

##### `countVariables()`

Count variables in code

##### `countConditions()`

Count conditions in code

##### `countLoops()`

Count loops in code

##### `calculateNestingDepth()`

Calculate maximum nesting depth

##### `countMagicNumbers()`

Count magic numbers

##### `calculateComplexityScore()`

Calculate complexity score

##### `identifyComplexityIssues()`

Identify complexity issues

##### `generateComplexitySuggestions()`

Generate complexity suggestions

##### `analyzePerformancePatterns()`

Analyze performance patterns

##### `calculatePerformanceScore()`

Calculate performance score

##### `analyzeMemoryUsage()`

Analyze memory usage patterns

##### `calculateMemoryScore()`

Calculate memory score

##### `analyzeCodeCoverage()`

Analyze code coverage

##### `generatePerformanceSuggestions()`

Generate performance suggestions

##### `extractVariables()`

Extract variables from content using pattern

##### `matchesPattern()`

Check if name matches pattern (supports wildcards)

##### `getLineNumber()`

Get line number from character index

#### Exports

`CodeAnalyzer`

### Command Handler

*File: scripts/commands/pine-debug-modules/command-handler.js*

#### Methods

##### `inspect()`

Command Handler for PineScript Debugger
 Handles different debugging commands: inspect, trace, monitor, profile, etc.

##### `trace()`

Handle trace command

##### `monitor()`

Handle monitor command

##### `profile()`

Handle profile command

##### `startServer()`

Handle server command

##### `generateHelpers()`

Handle helpers command

##### `runTests()`

Handle test command

##### `analyzeWithAI()`

Handle AI command

##### `findPineScriptFile()`

Utility methods

##### `formatInspectionReport()`

Formatting methods

#### Exports

`CommandHandler`


## Usage Examples

For detailed usage examples, see:
- `docs/examples/QUICK-START-EXAMPLES.md` - Quick start examples
- `docs/examples/` - Comprehensive examples directory

## Validation

Run validation scripts to ensure module functionality:
```bash
node validate-optimizer.js
```

## Testing

Run the test suite to verify functionality:
```bash
npm test
```

