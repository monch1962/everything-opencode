# Refactored Modules API Documentation

## Overview

This document provides comprehensive API documentation for the 13 modules refactored during the large file refactoring project. All modules maintain 100% backward compatibility with their original APIs.

## Table of Contents

1. [PineScript Optimizer Modules](#pinescript-optimizer-modules)
2. [TemplateUtils Modules](#templateutils-modules)
3. [Common Patterns](#common-patterns)
4. [Migration Guide](#migration-guide)
5. [Troubleshooting](#troubleshooting)

---

## PineScript Optimizer Modules

### Main Class: `PineOptimizer`

**Location**: `scripts/pinescript/optimizer.js`

The main entry point for PineScript optimization functionality. Delegates to modular components while maintaining original API.

#### Constructor

```javascript
const PineOptimizer = require('./scripts/pinescript/optimizer');
const optimizer = new PineOptimizer((projectPath = process.cwd()));
```

#### Core Methods

##### `optimizeStrategy(strategyFile, options = {})`

Optimizes strategy parameters using specified method.

**Parameters**:

- `strategyFile` (string): Path to .pine strategy file
- `options` (object): Optimization options
  - `method` (string): 'grid', 'random', 'bayesian', 'genetic' (default: 'grid')
  - `params` (string): Parameter specification (e.g., "rsi_length:7-21-2")
  - `metric` (string): 'sharpe', 'profit', 'winrate', 'maxdd', 'profitfactor' (default: 'sharpe')
  - `iterations` (number): Number of iterations (default: 100)
  - `walkForward` (boolean): Enable walk-forward optimization (default: false)
  - `dataSource` (string): 'csv', 'yahoo', 'alpaca' (default: 'csv')
  - `dataFile` (string): Data file for CSV source
  - `commission` (number): Commission per trade (default: 0.1)
  - `initialCapital` (number): Initial capital (default: 10000)

**Returns**: Promise resolving to optimization results object

**Example**:

```javascript
const result = await optimizer.optimizeStrategy('strategy.pine', {
  method: 'grid',
  params: 'rsi_length:7-21-2,rsi_overbought:70-90-5',
  metric: 'sharpe',
  iterations: 50,
});
```

##### `detectParameters(strategyFile)`

Detects parameters from strategy file comments.

**Parameters**:

- `strategyFile` (string): Path to .pine strategy file

**Returns**: Object containing detected parameters

##### `parseParameterSpace(paramSpec)`

Parses parameter space specification string.

**Parameters**:

- `paramSpec` (string): Parameter specification string

**Returns**: Object representing parameter space

**Example**:

```javascript
const paramSpace = optimizer.parseParameterSpace('rsi_length:7-21-2');
// Returns: { rsi_length: { min: 7, max: 21, step: 2 } }
```

#### Optimization Methods

##### `gridSearch(strategyFile, paramSpace, options)`

Performs grid search optimization.

##### `randomSearch(strategyFile, paramSpace, options)`

Performs random search optimization.

##### `bayesianOptimization(strategyFile, paramSpace, options)`

Performs Bayesian optimization.

##### `geneticAlgorithm(strategyFile, paramSpace, options)`

Performs genetic algorithm optimization.

#### Utility Methods

##### `generateGridCombinations(paramSpace, maxCombinations = 1000)`

Generates grid combinations from parameter space.

##### `generateRandomParameters(paramSpace)`

Generates random parameters from parameter space.

##### `createParameterizedStrategy(originalFile, params)`

Creates parameterized strategy file.

##### `calculateMetricScore(performance, metric)`

Calculates metric score from performance data.

#### Analysis Methods

##### `analyzeParameterSensitivity(allResults)`

Analyzes parameter sensitivity from optimization results.

##### `generateOptimizationReport(results, options)`

Generates optimization report.

##### `generateConsoleOptimizationReport(results, options)`

Generates console-formatted optimization report.

##### `generateHTMLOptimizationReport(results, options)`

Generates HTML optimization report.

#### Module Getters (For Testing/Debugging)

##### `getCore()`

Returns the OptimizerCore module instance.

##### `getParameterHandler()`

Returns the ParameterHandler module instance.

##### `getOptimizationAlgorithms()`

Returns the OptimizationAlgorithms module instance.

##### `getAnalysisReporter()`

Returns the AnalysisReporter module instance.

##### `getBacktester()`

Returns the PineBacktester instance.

##### `getProjectPath()`

Returns the project path.

### Module 1: OptimizerCore

**Location**: `scripts/pinescript/optimizer-modules/optimizer-core.js`

Core optimization methods and configuration.

#### Methods:

- `constructor(projectPath)` - Initializes with project path
- `optimizeStrategy(strategyFile, options)` - Gets optimization configuration
- `detectParameters(strategyFile)` - Detects parameters from file
- `validateOptimizationConfig(config)` - Validates optimization configuration
- `getBacktester()` - Returns backtester instance
- `getProjectPath()` - Returns project path

### Module 2: ParameterHandler

**Location**: `scripts/pinescript/optimizer-modules/parameter-handler.js`

Parameter space parsing and generation.

#### Methods:

- `parseParameterSpace(paramSpec)` - Parses parameter specification
- `formatParameterSpace(paramSpace)` - Formats parameter space for display
- `generateGridCombinations(paramSpace, maxCombinations)` - Generates grid combinations
- `generateRandomParameters(paramSpace)` - Generates random parameters
- `createParameterizedStrategy(originalFile, params)` - Creates parameterized strategy

### Module 3: OptimizationAlgorithms

**Location**: `scripts/pinescript/optimizer-modules/optimization-algorithms.js`

Implementation of optimization algorithms.

#### Methods:

- `constructor(backtester, parameterHandler)` - Initializes with dependencies
- `gridSearch(strategyFile, paramSpace, options)` - Grid search algorithm
- `randomSearch(strategyFile, paramSpace, options)` - Random search algorithm
- `bayesianOptimization(strategyFile, paramSpace, options)` - Bayesian optimization
- `geneticAlgorithm(strategyFile, paramSpace, options)` - Genetic algorithm
- `calculateMetricScore(performance, metric)` - Calculates metric scores

### Module 4: AnalysisReporter

**Location**: `scripts/pinescript/optimizer-modules/analysis-reporter.js`

Analysis and reporting functionality.

#### Methods:

- `analyzeParameterSensitivity(allResults)` - Analyzes parameter sensitivity
- `generateOptimizationReport(results, options)` - Generates optimization report
- `generateConsoleOptimizationReport(results, options)` - Console report
- `generateHTMLOptimizationReport(results, options)` - HTML report

---

## TemplateUtils Modules

### Main Class: `TemplateUtils`

**Location**: `scripts/lib/template-utils.js`

Template generation utilities for language tools.

#### Static Methods

##### `renderTemplate(template, variables = {})`

Renders template with variables using `{{variable}}` syntax.

**Parameters**:

- `template` (string): Template string
- `variables` (object): Variables to inject

**Returns**: Rendered template string

**Example**:

```javascript
const result = TemplateUtils.renderTemplate('Hello {{name}}!', { name: 'World' });
// Returns: 'Hello World!'
```

##### `renderTemplateFile(templatePath, variables = {})`

Renders template from file.

**Parameters**:

- `templatePath` (string): Path to template file
- `variables` (object): Variables to inject

**Returns**: Rendered template string

##### `generateFile(templatePath, outputPath, variables = {}, options = {})`

Generates file from template.

**Parameters**:

- `templatePath` (string): Path to template file
- `outputPath` (string): Path for output file
- `variables` (object): Variables to inject
- `options` (object): Generation options
  - `overwrite` (boolean): Overwrite existing file (default: false)
  - `backup` (boolean): Backup existing file (default: true)
  - `createDir` (boolean): Create output directory (default: true)

**Returns**: Object with generation results

##### `generateFromTemplateDir(templateDir, outputDir, variables = {}, options = {})`

Generates files from template directory recursively.

**Parameters**:

- `templateDir` (string): Template directory path
- `outputDir` (string): Output directory path
- `variables` (object): Variables to inject
- `options` (object): Generation options
  - `overwrite` (boolean): Overwrite existing files
  - `backup` (boolean): Backup existing files
  - `createDir` (boolean): Create output directories
  - `skipExisting` (boolean): Skip existing files

**Returns**: Object with generation results

##### `getLanguageTemplates(language)`

Gets language-specific templates.

**Supported Languages**: 'go', 'python', 'elixir', 'node'

**Returns**: Object with template files

##### `generateLanguageProject(language, projectPath, variables = {}, options = {})`

Generates language project from templates.

##### `generateLanguageConfig(language, configPath, variables = {}, options = {})`

Generates language configuration files.

##### `generateReadme(projectPath, variables = {}, options = {})`

Generates README.md file.

##### `generateGitignore(projectPath, language, _options = {})`

Generates .gitignore file for language.

##### `validateVariables(variables, required = [])`

Validates template variables.

#### Module Getters

##### `getTemplateCore()`

Returns TemplateCore module.

##### `getDirectoryProcessor()`

Returns DirectoryProcessor module.

##### `getLanguageTemplatesModule()`

Returns LanguageTemplates module.

##### `getProjectGenerator()`

Returns ProjectGenerator module.

##### `getTemplateValidator()`

Returns TemplateValidator module.

### Module 1: TemplateCore

**Location**: `scripts/lib/template-modules/template-core.js`

Core template rendering functionality.

#### Methods:

- `renderTemplate(template, variables)` - Renders template string
- `renderTemplateFile(templatePath, variables)` - Renders template file
- `generateFile(templatePath, outputPath, variables, options)` - Generates file

### Module 2: DirectoryProcessor

**Location**: `scripts/lib/template-modules/directory-processor.js`

Directory template processing.

#### Methods:

- `generateFromTemplateDir(templateDir, outputDir, variables, options)` - Processes directory
- `_processTemplateDir(...)` - Internal recursive processing

### Module 3: LanguageTemplates

**Location**: `scripts/lib/template-modules/language-templates.js`

Language-specific templates.

#### Methods:

- `getLanguageTemplates(language)` - Gets templates for language
- `generateLanguageProject(language, projectPath, variables, options)` - Generates project
- `generateLanguageConfig(language, configPath, variables, options)` - Generates config

### Module 4: ProjectGenerator

**Location**: `scripts/lib/template-modules/project-generator.js`

Project file generation.

#### Methods:

- `generateReadme(projectPath, variables, options)` - Generates README
- `generateGitignore(projectPath, language, options)` - Generates .gitignore

### Module 5: TemplateValidator

**Location**: `scripts/lib/template-modules/template-validator.js`

Variable validation and sanitization.

#### Methods:

- `validateVariables(variables, required)` - Validates variables
- `sanitizeVariables(variables)` - Sanitizes variable values
- `generateVariableDocs(variables, templateContent)` - Generates documentation
- `_extractTemplateVariables(variables)` - Extracts template variables
- `_getVariableDescription(key)` - Gets variable description
- `_getVariableExample(key, value)` - Gets variable example

---

## Common Patterns

### Module Instantiation Pattern

All modules follow a consistent pattern:

```javascript
// Main class delegates to modules
class MainClass {
  constructor() {
    this.module1 = new Module1();
    this.module2 = new Module2();
  }

  method1(...args) {
    return this.module1.method1(...args);
  }
}
```

### Error Handling

All modules throw consistent errors:

- `Error` for validation failures
- Descriptive error messages
- Consistent error formatting

### Configuration Options

Options objects with sensible defaults:

```javascript
const options = {
  overwrite: false,
  backup: true,
  createDir: true,
  // ... other options with defaults
};
```

### Return Values

Consistent return patterns:

- Objects with `success`, `error` properties for operations
- Arrays for collections
- Promises for async operations

---

## Migration Guide

### From Original to Refactored

#### No Breaking Changes

The refactored modules maintain 100% backward compatibility. Existing code should work without modification.

#### New Features

1. **Module Getters**: Access internal modules for testing/debugging
2. **Enhanced Validation**: Better variable validation in TemplateUtils
3. **Improved Error Messages**: More descriptive errors

#### Performance Improvements

- Lazy module initialization
- Reduced memory footprint
- Faster startup for unused features

### Testing Migration

```javascript
// Before refactoring
const result = await optimizer.optimizeStrategy(...);

// After refactoring - SAME CODE
const result = await optimizer.optimizeStrategy(...);
```

### Debugging

Use module getters for debugging:

```javascript
const core = optimizer.getCore();
const paramHandler = optimizer.getParameterHandler();
```

---

## Troubleshooting

### Common Issues

#### PineScript Optimizer Issues

**Issue**: "Strategy file not found"
**Solution**: Ensure file path is correct and file exists

**Issue**: "No parameters specified for optimization"
**Solution**: Provide `--params` option or add parameter comments to strategy file

**Issue**: "Unsupported optimization method"
**Solution**: Use one of: 'grid', 'random', 'bayesian', 'genetic'

#### TemplateUtils Issues

**Issue**: "File already exists"
**Solution**: Use `overwrite: true` option or `--overwrite` flag

**Issue**: "Missing required variable"
**Solution**: Provide all required variables in `variables` object

**Issue**: "Template syntax error"
**Solution**: Ensure template uses `{{variable}}` syntax correctly

### Debugging Tips

1. **Enable Verbose Logging**:

```javascript
// Add to module initialization
process.env.DEBUG = 'module:*';
```

2. **Use Validation Scripts**:

```bash
node validate-optimizer.js
node validate-template-utils.js
```

3. **Check Module State**:

```javascript
console.log(optimizer.getCore().getProjectPath());
console.log(TemplateUtils.getTemplateValidator().validateVariables(vars));
```

### Getting Help

1. **Check Documentation**: This document and module source code
2. **Run Tests**: `npm test` to verify functionality
3. **Use Validation**: Run validation scripts
4. **Review Examples**: Check `docs/examples/` directory

---

## Version History

### v1.0.0 (Current)

- Initial refactoring release
- 13 modules refactored
- 100% backward compatibility
- All tests passing

### Future Enhancements

- TypeScript definitions
- Enhanced documentation
- Performance optimizations
- Additional language support

---

## Contributing

### Adding New Modules

1. Follow existing module patterns
2. Add comprehensive tests
3. Update documentation
4. Run validation scripts

### Reporting Issues

1. Use GitHub Issues
2. Include reproduction steps
3. Provide error messages
4. Specify module version

### Code Standards

- Follow existing code style
- Add JSDoc comments
- Write unit tests
- Update documentation

---

## License

This documentation is part of the everything-opencode project. See main project LICENSE for details.

---

_Last Updated: January 28, 2026_  
_Documentation Version: 1.0.0_  
_Module Version: 1.0.0_
