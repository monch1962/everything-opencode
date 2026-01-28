# PineScript Optimizer API Documentation

*Generated: 2026-01-28T01:10:24.096Z*

### Main Class

*File: scripts/pinescript/optimizer.js*

* PineScript Optimizer - Refactored Version
 *
 * Strategy parameter optimization utilities
 * This is a refactored version that delegates to modular components while
 * maintaining 100% backward compatibility with the original API.
 

const OptimizerCore = require('./optimizer-modules/optimizer-core');
const ParameterHandler = require('./optimizer-modules/parameter-handler');
const OptimizationAlgorithms = require('./optimizer-modules/optimization-algorithms');
const AnalysisReporter = require('./optimizer-modules/analysis-reporter');

/**
 * PineScript Optimizer - Main class for strategy parameter optimization
 *
 * This class delegates to modular components while maintaining 100% backward
 * compatibility with the original API. It provides methods for optimizing
 * PineScript strategy parameters using various optimization algorithms.
 *
 * @class PineOptimizer
 */
class PineOptimizer

#### Methods

##### `constructor()`

PineScript Optimizer - Refactored Version
 Strategy parameter optimization utilities
 This is a refactored version that delegates to modular components while
 maintaining 100% backward compatibility with the original API.

##### `detectParameters()`

Detect parameters from strategy file comments

##### `parseParameterSpace()`

Parse parameter space specification

##### `gridSearch()`

Grid search optimization

##### `randomSearch()`

Random search optimization

##### `bayesianOptimization()`

Bayesian optimization

##### `geneticAlgorithm()`

Genetic algorithm optimization

##### `generateGridCombinations()`

Generate grid combinations for parameter space

##### `generateRandomParameters()`

Generate random parameters from parameter space

##### `createParameterizedStrategy()`

Create parameterized strategy file

##### `calculateMetricScore()`

Calculate metric score

##### `analyzeParameterSensitivity()`

Analyze parameter sensitivity

##### `generateOptimizationReport()`

Generate optimization report

##### `generateConsoleOptimizationReport()`

Generate console optimization report

##### `generateHTMLOptimizationReport()`

Generate HTML optimization report

#### Exports

`PineOptimizer`


## Modules

### Analysis Reporter

*File: scripts/pinescript/optimizer-modules/analysis-reporter.js*

* Analysis Reporter Module for PineOptimizer
 *
 * Analysis and reporting methods: analyzeParameterSensitivity, generateOptimizationReport,
 * generateConsoleOptimizationReport, generateHTMLOptimizationReport
 

class AnalysisReporter

#### Methods

##### `analyzeParameterSensitivity()`

Analysis Reporter Module for PineOptimizer
 Analysis and reporting methods: analyzeParameterSensitivity, generateOptimizationReport,
 generateConsoleOptimizationReport, generateHTMLOptimizationReport

##### `generateOptimizationReport()`

Generate optimization report

##### `generateConsoleOptimizationReport()`

Generate console optimization report

##### `generateHTMLOptimizationReport()`

Generate HTML optimization report

##### `generateJSONReport()`

Generate JSON report

##### `generateSummaryStatistics()`

Generate summary statistics

##### `exportResultsToCSV()`

Export results to CSV

##### `exportResultsToJSON()`

Export results to JSON

#### Exports

`AnalysisReporter`

### Optimization Algorithms

*File: scripts/pinescript/optimizer-modules/optimization-algorithms.js*

#### Methods

##### `gridSearch()`

Optimization Algorithms Module for PineOptimizer
 Optimization algorithms: gridSearch, randomSearch, bayesianOptimization, geneticAlgorithm

##### `randomSearch()`

Random search optimization

##### `bayesianOptimization()`

Bayesian optimization

##### `geneticAlgorithm()`

Genetic algorithm optimization

##### `evaluateParameters()`

Evaluate parameters by running backtest

##### `calculateMetricScore()`

Calculate metric score

##### `sampleNearParameters()`

Sample parameters near existing parameters

##### `crossover()`

Crossover two parameter sets

##### `mutate()`

Mutate parameters

##### `getAlgorithmDescriptions()`

Get algorithm descriptions

#### Exports

`OptimizationAlgorithms`

### Optimizer Core

*File: scripts/pinescript/optimizer-modules/optimizer-core.js*

#### Methods

##### `optimizeStrategy()`

Optimizer Core Module for PineOptimizer
 Core optimization methods: constructor, optimizeStrategy, detectParameters

##### `detectParameters()`

Detect parameters from strategy file comments

##### `getBacktester()`

Get backtester instance

##### `getProjectPath()`

Get project path

##### `validateOptimizationConfig()`

Validate optimization configuration

##### `getOptimizationMethods()`

Get optimization methods

##### `getOptimizationMetrics()`

Get optimization metrics

#### Exports

`OptimizerCore`

### Parameter Handler

*File: scripts/pinescript/optimizer-modules/parameter-handler.js*

#### Methods

##### `parseParameterSpace()`

Parameter Handler Module for PineOptimizer
 Parameter handling methods: parseParameterSpace, generateGridCombinations, generateRandomParameters, createParameterizedStrategy

##### `generateGridCombinations()`

Generate grid combinations for parameter space

##### `sampleParameterSpace()`

Sample parameter space (for large spaces)

##### `generateRandomParameters()`

Generate random parameters from parameter space

##### `createParameterizedStrategy()`

Create parameterized strategy file

##### `calculateParameterSpaceSize()`

Calculate parameter space size

##### `getParameterStatistics()`

Get parameter statistics

##### `validateParameterSpace()`

Validate parameter space

##### `formatParameterSpace()`

Format parameter space for display

#### Exports

`ParameterHandler`


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

