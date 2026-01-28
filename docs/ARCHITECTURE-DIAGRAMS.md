# Architecture Diagrams

## PineScript Optimizer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PineOptimizer (Main Class)               │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Optimizer   │  │ Parameter   │  │ Analysis    │        │
│  │   Core      │  │  Handler    │  │  Reporter   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │              │              │                    │
│         └──────────────┼──────────────┘                    │
│                        │                                   │
│                ┌─────────────┐                            │
│                │ Optimization│                            │
│                │ Algorithms  │                            │
│                └─────────────┘                            │
│                        │                                   │
│                ┌─────────────┐                            │
│                │ PineBack-   │                            │
│                │ tester      │                            │
│                └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

**OptimizerCore** (`optimizer-core.js`)

- Strategy file validation
- Configuration management
- Backtester initialization
- Parameter detection

**ParameterHandler** (`parameter-handler.js`)

- Parameter space parsing
- Grid combination generation
- Random parameter generation
- Parameterized strategy creation

**OptimizationAlgorithms** (`optimization-algorithms.js`)

- Grid search implementation
- Random search implementation
- Bayesian optimization
- Genetic algorithm
- Metric score calculation

**AnalysisReporter** (`analysis-reporter.js`)

- Parameter sensitivity analysis
- Optimization report generation
- Console/HTML report formatting
- Results visualization

## TemplateUtils Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  TemplateUtils (Main Class)                 │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Template    │  │ Directory   │  │ Language    │        │
│  │   Core      │  │  Processor  │  │ Templates   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │              │              │                    │
│         └──────────────┼──────────────┘                    │
│                        │                                   │
│                ┌─────────────┐  ┌─────────────┐          │
│                │ Project     │  │ Template    │          │
│                │ Generator   │  │ Validator   │          │
│                └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

**TemplateCore** (`template-core.js`)

- Basic template rendering (`{{variable}}` syntax)
- Template file reading
- File generation with backup/overwrite options

**DirectoryProcessor** (`directory-processor.js`)

- Recursive directory template processing
- Template file detection (.template, .tmpl extensions)
- Batch file generation
- Skip existing file handling

**LanguageTemplates** (`language-templates.js`)

- Language-specific template storage (Go, Python, Node.js, Elixir)
- Project generation from templates
- Configuration file generation
- Template variable injection

**ProjectGenerator** (`project-generator.js`)

- README.md file generation
- .gitignore file generation (language-specific)
- Project structure documentation
- Deployment instructions

**TemplateValidator** (`template-validator.js`)

- Variable validation and sanitization
- Required field checking
- Type validation (email, version, URL, etc.)
- Template syntax checking

## Data Flow Diagrams

### PineScript Optimizer Data Flow

```
1. User Input
   └── Strategy File + Options
        │
        ▼
2. PineOptimizer.optimizeStrategy()
        │
        ▼
3. OptimizerCore.validateAndConfigure()
        │
        ▼
4. ParameterHandler.parseParameterSpace()
        │
        ▼
5. OptimizationAlgorithms.[method]()
        │
        ▼
6. PineBacktester.runBacktest()
        │
        ▼
7. AnalysisReporter.generateReport()
        │
        ▼
8. Return Results
```

### TemplateUtils Data Flow

```
1. Template + Variables
        │
        ▼
2. TemplateValidator.validateVariables()
        │
        ▼
3. TemplateCore.renderTemplate()
        │
        ▼
4. File/Directory Generation
   ├── Single File: TemplateCore.generateFile()
   └── Directory: DirectoryProcessor.generateFromTemplateDir()
        │
        ▼
5. Output Files
```

## Dependency Graph

### PineScript Optimizer Dependencies

```
PineOptimizer
    ├── OptimizerCore
    │   └── PineBacktester
    ├── ParameterHandler
    ├── OptimizationAlgorithms
    │   ├── PineBacktester (via OptimizerCore)
    │   └── ParameterHandler
    └── AnalysisReporter
```

### TemplateUtils Dependencies

```
TemplateUtils
    ├── TemplateCore
    ├── DirectoryProcessor
    │   └── TemplateCore
    ├── LanguageTemplates
    │   └── TemplateCore
    ├── ProjectGenerator
    │   └── TemplateCore
    └── TemplateValidator
```

## Module Interaction Patterns

### Delegation Pattern

```javascript
// Main class delegates to modules
class MainClass {
  constructor() {
    this.module = new Module();
  }

  publicMethod(...args) {
    return this.module.method(...args);
  }
}
```

### Factory Pattern (Module Initialization)

```javascript
// Modules are initialized in constructor
constructor() {
  this.modules = {
    core: new CoreModule(),
    processor: new ProcessorModule(),
    // ...
  };
}
```

### Observer Pattern (Event Handling)

```javascript
// Modules can emit events
class Module {
  constructor() {
    this.listeners = [];
  }

  emit(event, data) {
    this.listeners.forEach((listener) => listener(event, data));
  }
}
```

## Performance Considerations

### Lazy Loading

```javascript
// OptimizationAlgorithms loaded only when needed
class PineOptimizer {
  constructor() {
    this.algorithms = null; // Not initialized yet
  }

  async optimizeStrategy() {
    if (!this.algorithms) {
      this.algorithms = new OptimizationAlgorithms(...);
    }
    // Use algorithms...
  }
}
```

### Caching Strategy

```javascript
// Template caching
class TemplateCore {
  constructor() {
    this.templateCache = new Map();
  }

  renderTemplate(template, variables) {
    const cacheKey = `${template}:${JSON.stringify(variables)}`;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }
    // Render and cache...
  }
}
```

## Security Architecture

### Input Validation Layers

```
1. TemplateUtils.validateVariables()
   └── Type checking, format validation
        │
        ▼
2. TemplateCore.sanitizeInput()
   └── HTML escaping, special character removal
        │
        ▼
3. File System Security
   └── Path traversal prevention, permission checks
```

### Error Handling Strategy

```javascript
try {
  // Operation that might fail
  const result = await module.method();
  return { success: true, data: result };
} catch (error) {
  // Graceful error handling
  return {
    success: false,
    error: error.message,
    module: module.name,
    timestamp: new Date().toISOString(),
  };
}
```

## Scalability Considerations

### Horizontal Scaling

- Each module can be deployed independently
- Stateless design allows multiple instances
- Load balancing between module instances

### Vertical Scaling

- Memory-efficient module design
- Lazy loading reduces initial memory footprint
- Connection pooling for database/API modules

### Database Scaling

- Module-specific data partitioning
- Read replicas for analysis modules
- Caching layer for frequently accessed data

## Monitoring Architecture

### Health Checks

```javascript
// Each module provides health status
class Module {
  getHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      lastError: this.lastError,
      metrics: this.metrics,
    };
  }
}
```

### Metrics Collection

```javascript
// Performance metrics
class MetricsCollector {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      // ...
    };
  }

  recordMetric(metric, value) {
    this.metrics[metric] = value;
  }
}
```

## Deployment Architecture

### Containerization

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  PineOptimizer  │  │  TemplateUtils  │  │    Shared Libs  │
│    Container    │  │    Container    │  │    Container    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                     ┌─────────────────┐
                     │   API Gateway   │
                     │   (Load Balancer)│
                     └─────────────────┘
```

### Service Discovery

```javascript
// Module registry
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  register(moduleName, moduleInstance) {
    this.modules.set(moduleName, {
      instance: moduleInstance,
      health: 'healthy',
      lastSeen: Date.now(),
    });
  }

  getModule(moduleName) {
    return this.modules.get(moduleName);
  }
}
```

This architecture provides a solid foundation for the refactored modules, ensuring maintainability, scalability, and performance while maintaining 100% backward compatibility.
