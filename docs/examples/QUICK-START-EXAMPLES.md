# Quick Start Examples

## PineScript Optimizer Examples

### Basic Optimization
```javascript
const PineOptimizer = require('./scripts/pinescript/optimizer');

async function runOptimization() {
  const optimizer = new PineOptimizer();
  
  const result = await optimizer.optimizeStrategy('strategy.pine', {
    method: 'grid',
    params: 'rsi_length:7-21-2',
    metric: 'sharpe',
    iterations: 50
  });
  
  if (result.success) {
    console.log('Best parameters:', result.results.bestParameters);
    console.log('Best score:', result.results.bestScore);
  }
}

runOptimization();
```

### Parameter Analysis
```javascript
const PineOptimizer = require('./scripts/pinescript/optimizer');

const optimizer = new PineOptimizer();

// Parse parameter space
const paramSpace = optimizer.parseParameterSpace('rsi_length:7-21-2,macd_fast:12-26-2');
console.log('Parameter space:', paramSpace);

// Generate combinations
const combinations = optimizer.generateGridCombinations(paramSpace, 10);
console.log('Generated combinations:', combinations.length);

// Generate random parameters
const randomParams = optimizer.generateRandomParameters(paramSpace);
console.log('Random parameters:', randomParams);
```

## TemplateUtils Examples

### Basic Template Rendering
```javascript
const TemplateUtils = require('./scripts/lib/template-utils');

// Simple template
const result = TemplateUtils.renderTemplate(
  'Hello {{name}}! Welcome to {{project}}.',
  { name: 'Developer', project: 'MyApp' }
);
console.log(result); // Hello Developer! Welcome to MyApp.

// Generate file
const fs = require('fs');
fs.writeFileSync('template.txt', 'Project: {{name}}\nVersion: {{version}}');

TemplateUtils.generateFile(
  'template.txt',
  'output.txt',
  { name: 'MyProject', version: '1.0.0' },
  { overwrite: true }
);
```

### Language Project Generation
```javascript
const TemplateUtils = require('./scripts/lib/template-utils');

// Generate Go project
const goResult = TemplateUtils.generateLanguageProject('go', './my-go-app', {
  name: 'My Go App',
  module: 'github.com/user/my-go-app',
  goVersion: '1.19'
});

// Generate Node.js project  
const nodeResult = TemplateUtils.generateLanguageProject('node', './my-node-app', {
  name: 'my-node-app',
  version: '1.0.0',
  description: 'A Node.js application',
  author: 'John Doe',
  license: 'MIT'
});

console.log('Go project files:', goResult.generated.length);
console.log('Node.js project files:', nodeResult.generated.length);
```

### Variable Validation
```javascript
const TemplateUtils = require('./scripts/lib/template-utils');

const validation = TemplateUtils.validateVariables({
  name: 'MyProject',
  version: '1.0.0',
  email: 'test@example.com',
  repository: 'https://github.com/user/repo'
}, ['name', 'version']);

console.log('Valid:', validation.isValid);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
```

## Integration Examples

### Custom Module Using PineOptimizer
```javascript
const PineOptimizer = require('./scripts/pinescript/optimizer');

class TradingBot {
  constructor() {
    this.optimizer = new PineOptimizer();
    this.results = [];
  }
  
  async backtestStrategy(strategyFile, params) {
    const result = await this.optimizer.optimizeStrategy(strategyFile, {
      method: 'grid',
      params,
      metric: 'sharpe',
      iterations: 20
    });
    
    if (result.success) {
      this.results.push(result.results);
      return result.results.bestParameters;
    }
    return null;
  }
  
  getPerformanceSummary() {
    return this.results.map(r => ({
      score: r.bestScore,
      parameters: r.bestParameters
    }));
  }
}

// Usage
const bot = new TradingBot();
bot.backtestStrategy('strategy.pine', 'param1:1-10-1');
```

### Custom Template Manager
```javascript
const TemplateUtils = require('./scripts/lib/template-utils');

class ComponentGenerator {
  constructor() {
    this.templates = {
      component: `// {{componentName}}.js
import React from 'react';

export default function {{componentName}}() {
  return <div>{{content}}</div>;
}`,
      service: `// {{serviceName}}.js
class {{serviceName}} {
  constructor() {
    this.initialized = false;
  }
  
  initialize() {
    this.initialized = true;
  }
}`
    };
  }
  
  generateComponent(name, outputPath, variables) {
    const template = this.templates.component;
    const rendered = TemplateUtils.renderTemplate(template, {
      componentName: name,
      ...variables
    });
    
    require('fs').writeFileSync(outputPath, rendered);
    return { path: outputPath, size: rendered.length };
  }
}

// Usage
const generator = new ComponentGenerator();
generator.generateComponent('Button', './src/Button.js', {
  content: 'Click me!'
});
```

## Error Handling Examples

### Graceful Error Recovery
```javascript
const PineOptimizer = require('./scripts/pinescript/optimizer');

async function safeOptimize(strategyFile, options, maxRetries = 3) {
  const optimizer = new PineOptimizer();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await optimizer.optimizeStrategy(strategyFile, options);
      if (result.success) return result;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Usage with error handling
safeOptimize('strategy.pine', { method: 'grid', params: 'param:1-10-1' })
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Failed:', error.message));
```

### Template Validation
```javascript
const TemplateUtils = require('./scripts/lib/template-utils');

function validateAndGenerate(template, variables, outputPath) {
  // Validate variables first
  const validation = TemplateUtils.validateVariables(variables, ['name', 'version']);
  
  if (!validation.isValid) {
    console.error('Validation failed:', validation.errors);
    return null;
  }
  
  // Generate file
  return TemplateUtils.generateFile(
    template,
    outputPath,
    validation.validated,
    { overwrite: true }
  );
}
```

## Testing Examples

### Basic Unit Test
```javascript
// test-optimizer.js
const PineOptimizer = require('./scripts/pinescript/optimizer');

describe('PineOptimizer', () => {
  let optimizer;
  
  beforeEach(() => {
    optimizer = new PineOptimizer();
  });
  
  test('should parse parameter space', () => {
    const paramSpace = optimizer.parseParameterSpace('param:1-10-1');
    expect(paramSpace.param.min).toBe(1);
    expect(paramSpace.param.max).toBe(10);
    expect(paramSpace.param.step).toBe(1);
  });
  
  test('should generate grid combinations', () => {
    const paramSpace = optimizer.parseParameterSpace('param:1-3-1');
    const combinations = optimizer.generateGridCombinations(paramSpace, 10);
    expect(combinations.length).toBe(3);
    expect(combinations[0].param).toBe(1);
  });
});
```

### Integration Test
```javascript
// integration-test.js
const TemplateUtils = require('./scripts/lib/template-utils');
const fs = require('fs');

describe('TemplateUtils Integration', () => {
  const testDir = './test-output';
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });
  
  test('should generate language project', () => {
    const result = TemplateUtils.generateLanguageProject('node', testDir, {
      name: 'test-app',
      version: '1.0.0'
    }, { overwrite: true });
    
    expect(result.generated.length).toBeGreaterThan(0);
    expect(fs.existsSync(`${testDir}/package.json`)).toBe(true);
    expect(fs.existsSync(`${testDir}/index.js`)).toBe(true);
  });
});
```

## CLI Usage Examples

### PineScript Optimizer CLI
```bash
# Basic optimization
node scripts/pinescript/optimizer.js strategy.pine --method grid --params "rsi_length:7-21-2"

# With more options
node scripts/pinescript/optimizer.js strategy.pine \
  --method random \
  --params "param1:1-10-1,param2:0.1-1.0-0.1" \
  --metric profit \
  --iterations 100 \
  --data-source csv \
  --data-file data.csv \
  --output-format json
```

### TemplateUtils CLI
```bash
# Render template
node scripts/lib/template-utils.js render "Hello {{name}}" '{"name":"World"}'

# Generate file
node scripts/lib/template-utils.js generate template.txt output.txt --variables '{"name":"Test"}'

# Generate project
node scripts/lib/template-utils.js project node ./my-project --variables '{"name":"my-app","version":"1.0.0"}'

# Validate variables
node scripts/lib/template-utils.js validate '{"name":"test","version":"1.0.0"}' --required name,version
```

## Performance Examples

### Benchmarking Optimization
```javascript
const PineOptimizer = require('./scripts/pinescript/optimizer');

async function benchmarkOptimization() {
  const optimizer = new PineOptimizer();
  const iterations = [10, 50, 100];
  const results = [];
  
  for (const iter of iterations) {
    console.time(`optimization-${iter}`);
    
    const result = await optimizer.optimizeStrategy('strategy.pine', {
      method: 'grid',
      params: 'param:1-20-1',
      metric: 'sharpe',
      iterations: iter
    });
    
    console.timeEnd(`optimization-${iter}`);
    
    results.push({
      iterations: iter,
      time: console.timers[`optimization-${iter}`],
      score: result.success ? result.results.bestScore : null
    });
  }
  
  return results;
}

benchmarkOptimization().then(console.table);
```

### Memory Usage Monitoring
```javascript
const TemplateUtils = require('./scripts/lib/template-utils');

function monitorMemoryUsage(operation) {
  const startMemory = process.memoryUsage();
  
  const result = operation();
  
  const endMemory = process.memoryUsage();
  const memoryDiff = {
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external
  };
  
  return { result, memoryDiff };
}

// Monitor template generation
const { result, memoryDiff } = monitorMemoryUsage(() => {
  return TemplateUtils.generateLanguageProject('go', './test', {
    name: 'Test',
    module: 'test',
    goVersion: '1.19'
  }, { overwrite: true });
});

console.log('Memory usage:', memoryDiff);
console.log('Files generated:', result.generated.length);
```

## Real-World Use Cases

### Automated Trading Strategy Optimization
```javascript
const PineOptimizer = require('./scripts/pinescript/optimizer');
const fs = require('fs');

class StrategyOptimizer {
  constructor(dataDir) {
    this.optimizer = new PineOptimizer();
    this.dataDir = dataDir;
    this.optimizedStrategies = new Map();
  }
  
  async optimizeAllStrategies() {
    const strategyFiles = fs.readdirSync(this.dataDir)
      .filter(file => file.endsWith('.pine'));
    
    for (const file of strategyFiles) {
      const strategyPath = `${this.dataDir}/${file}`;
      console.log(`Optimizing ${file}...`);
      
      try {
        const result = await this.optimizer.optimizeStrategy(strategyPath, {
          method: 'grid',
          params: this.detectCommonParams(strategyPath),
          metric: 'sharpe',
          iterations: 30,
          dataSource: 'csv',
          dataFile: `${this.dataDir}/market-data.csv`
        });
        
        if (result.success) {
          this.optimizedStrategies.set(file, {
            parameters: result.results.bestParameters,
            score: result.results.bestScore,
            report: result.report
          });
          
          // Save optimized version
          this.saveOptimizedStrategy(file, result.results.bestParameters);
        }
      } catch (error) {
        console.error(`Failed to optimize ${file}:`, error.message);
      }
    }
    
    return this.getOptimizationSummary();
  }
  
  detectCommonParams(strategyPath) {
    // Simplified parameter detection
    return 'rsi_length:7-21-2,macd_fast:12-26-2,stop_loss:1-5-0.5';
  }
  
  saveOptimizedStrategy(filename, parameters) {
    const content = fs.readFileSync(`${this.dataDir}/${filename}`, 'utf8');
    const optimized = this.applyParameters(content, parameters);
    fs.writeFileSync(`${this.dataDir}/optimized_${filename}`, optimized);
  }
  
  applyParameters(content, parameters) {
    // Apply parameters to strategy
    let result = content;
    for (const [param, value] of Object.entries(parameters)) {
      result = result.replace(new RegExp(`{{${param}}}`, 'g'), value);
    }
    return result;
  }
  
  getOptimizationSummary() {
    return Array.from(this.optimizedStrategies.entries())
      .map(([file, data]) => ({
        strategy: file,
        score: data.score,
        parameters: data.parameters
      }))
      .sort((a, b) => b.score - a.score);
  }
}

// Usage
const optimizer = new StrategyOptimizer('./strategies');
optimizer.optimizeAllStrategies().then(summary => {
  console.log('Top strategies:');
  summary.slice(0, 5).forEach((s, i) => {
    console.log(`${i + 1}. ${s.strategy}: ${s.score.toFixed(4)}`);
  });
});
```

### Multi-Language Project Generator
```javascript
const TemplateUtils = require('./scripts/lib/template-utils');

class MultiLanguageProject {
  constructor(projectName, author) {
    this.projectName = projectName;
    this.author = author;
    this.languages = ['go', 'python', 'node', 'elixir'];
  }
  
  generateAll(outputDir) {
    const results = {};
    
    for (const language of this.languages) {
      console.log(`Generating ${language} project...`);
      
      const projectPath = `${outputDir}/${this.projectName}-${language}`;
      const variables = this.getLanguageVariables(language);
      
      try {
        const result = TemplateUtils.generateLanguageProject(
          language,
          projectPath,
          variables,
          { overwrite: true, createDir: true }
        );
        
        // Generate README
        TemplateUtils.generateReadme(projectPath, {
          name: this.projectName,
          description: `A ${language} implementation of ${this.projectName}`,
          installation: this.getInstallationCommand(language),
          usage: this.getUsageCommand(language),
          features: ['Feature 1', 'Feature 2', 'Feature 3']
        });
        
        // Generate .gitignore
        TemplateUtils.generateGitignore(projectPath, language);
        
        results[language] = {
          success: true,
          path: projectPath,
          files: result.generated.length
        };
      } catch (error) {
        results[language] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  }
  
  getLanguageVariables(language) {
    const base = {
      name: this.projectName,
      version: '1.0.0',
      description: `A ${language} project`,
      author: this.author
    };
    
    switch (language) {
      case 'go':
        return { ...base, module: `github.com/${this.author}/${this.projectName}`, goVersion: '1.19' };
      case 'python':
        return { ...base };
      case 'node':
        return { ...base, license: 'MIT' };
      case 'elixir':
        return { ...base, app: this.projectName.replace(/-/g, '_'), elixirVersion: '1.14' };
      default:
        return base;
    }
  }
  
  getInstallationCommand(language) {
    switch (language) {
      case 'go': return 'go mod download';
      case 'python': return 'pip install -r requirements.txt';
      case 'node': return 'npm install';
      case 'elixir': return 'mix deps.get';
      default: return 'See language-specific instructions';
    }
  }
  
  getUsageCommand(language) {
    switch (language) {
      case 'go': return 'go run main.go';
      case 'python': return 'python main.py';
      case 'node': return 'npm start';
      case 'elixir': return 'mix run';
      default: return 'See language-specific instructions';
    }
  }
}

// Usage
const generator = new MultiLanguageProject('my-project', 'john-doe');
const results = generator.generateAll('./generated-projects');

console.log('Generation results:');
for (const [lang, result] of Object.entries(results)) {
  console.log(`${lang}: ${result.success ? '✅' : '❌'} ${result.success ? result.files + ' files' : result.error}`);
}
```

These examples demonstrate practical usage of the refactored modules. For more detailed examples, check the `docs/examples/` directory.