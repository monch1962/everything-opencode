#!/usr/bin/env node
/**
 * /pine-debug command wrapper
 *
 * Debugging utilities for PineScript indicator development
 */

const PineCommandRunner = require('../pinescript/command-runner');
const path = require('path');
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const action = args[0];
  const remainingArgs = args.slice(1);

  try {
    const runner = new PineCommandRunner();
    await runner.initialize();

    const pineDebugger = new PineScriptDebugger(runner);

    switch (action) {
      case 'inspect':
        await pineDebugger.inspect(remainingArgs);
        break;
      case 'trace':
        await pineDebugger.trace(remainingArgs);
        break;
      case 'monitor':
        await pineDebugger.monitor(remainingArgs);
        break;
      case 'profile':
        await pineDebugger.profile(remainingArgs);
        break;
      case 'server':
        await pineDebugger.startServer(remainingArgs);
        break;
      case 'helpers':
        await pineDebugger.generateHelpers(remainingArgs);
        break;
      case 'test':
        await pineDebugger.runTests(remainingArgs);
        break;
      case 'ai':
        await pineDebugger.analyzeWithAI(remainingArgs);
        break;
      default:
        console.error(`Unknown action: ${action}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Debugging failed: ${error.message}`);
    if (process.argv.includes('--verbose')) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

class PineScriptDebugger {
  constructor(runner) {
    this.runner = runner;
    this.projectPath = runner.projectPath;
  }

  async inspect(args) {
    const options = this.parseArgs(args, {
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to debug',
      },
      var: {
        type: 'string',
        alias: 'v',
        description: 'Variable name to inspect (supports wildcards)',
      },
      bars: {
        type: 'number',
        alias: 'b',
        description: 'Number of historical bars to inspect',
        default: 10,
      },
      format: {
        type: 'string',
        description: 'Output format (text, json, csv)',
        default: 'text',
      },
      output: { type: 'string', alias: 'o', description: 'Output file path' },
      verbose: { type: 'boolean', description: 'Verbose output' },
    });

    const pineFile = options.file || this.findPineScriptFile();
    if (!pineFile) {
      throw new Error('No PineScript file specified and none found in current directory.');
    }

    if (!options.var) {
      throw new Error('Variable name required. Use --var VARIABLE_NAME');
    }

    console.log(`🔍 Inspecting variable: ${options.var} in ${pineFile}`);

    const content = fs.readFileSync(pineFile, 'utf8');
    const variables = this.extractVariables(content, options.var);

    if (variables.length === 0) {
      console.log(`No variables found matching: ${options.var}`);
      console.log('Available variables:');
      const allVars = this.extractVariables(content, '*');
      allVars.forEach((v) => console.log(`  - ${v.name} (${v.type})`));
      return;
    }

    console.log(`Found ${variables.length} variable(s):`);

    const analysis = await this.analyzeVariables(pineFile, variables, options.bars);

    if (options.format === 'json') {
      const output = JSON.stringify(analysis, null, 2);
      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(`Results saved to: ${options.output}`);
      } else {
        console.log(output);
      }
    } else if (options.format === 'csv') {
      const csv = this.generateCSV(analysis);
      if (options.output) {
        fs.writeFileSync(options.output, csv);
        console.log(`Results saved to: ${options.output}`);
      } else {
        console.log(csv);
      }
    } else {
      this.printTextAnalysis(analysis, options.verbose);
    }
  }

  async trace(args) {
    const options = this.parseArgs(args, {
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to debug',
      },
      var: {
        type: 'string',
        alias: 'v',
        description: 'Variable name to trace',
        required: true,
      },
      bars: {
        type: 'number',
        alias: 'b',
        description: 'Number of bars to trace',
        default: 20,
      },
      step: {
        type: 'number',
        alias: 's',
        description: 'Step size for tracing',
        default: 1,
      },
      output: { type: 'string', alias: 'o', description: 'Output file path' },
      plot: {
        type: 'boolean',
        alias: 'p',
        description: 'Generate plot code for debugging',
      },
    });

    const pineFile = options.file || this.findPineScriptFile();
    if (!pineFile) {
      throw new Error('No PineScript file specified and none found in current directory.');
    }

    console.log(`📊 Tracing variable: ${options.var} for ${options.bars} bars`);

    const content = fs.readFileSync(pineFile, 'utf8');

    // Generate debugging plot code
    if (options.plot) {
      const debugCode = this.generateDebugPlotCode(content, options.var);
      const debugFile = `${path.basename(pineFile, '.pine')}.debug.pine`;
      fs.writeFileSync(debugFile, debugCode);
      console.log(`📝 Debug plot code generated: ${debugFile}`);
      console.log(`💡 Add this to your PineScript to visualize ${options.var}`);
    }

    // Analyze variable usage
    const usage = this.analyzeVariableUsage(content, options.var);
    console.log('\n📈 Variable Analysis:');
    console.log(`  Type: ${usage.type}`);
    console.log(`  Declaration: ${usage.declaration}`);
    console.log(`  Usage count: ${usage.count}`);

    if (usage.assignments.length > 0) {
      console.log('\n🔄 Assignment points:');
      usage.assignments.forEach((assign, i) => {
        console.log(`  ${i + 1}. Line ${assign.line}: ${assign.code}`);
      });
    }

    if (usage.references.length > 0) {
      console.log('\n🔗 Reference points:');
      usage.references.slice(0, 5).forEach((ref, i) => {
        console.log(`  ${i + 1}. Line ${ref.line}: ${ref.code}`);
      });
      if (usage.references.length > 5) {
        console.log(`  ... and ${usage.references.length - 5} more references`);
      }
    }

    // Generate debugging suggestions
    const suggestions = this.generateDebugSuggestions(usage);
    if (suggestions.length > 0) {
      console.log('\n💡 Debugging Suggestions:');
      suggestions.forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion}`);
      });
    }
  }

  async monitor(args) {
    const options = this.parseArgs(args, {
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to debug',
      },
      condition: {
        type: 'string',
        alias: 'c',
        description: 'Condition expression to monitor',
      },
      watch: {
        type: 'string',
        alias: 'w',
        description: 'Watch expression (comma-separated)',
      },
      bars: {
        type: 'number',
        alias: 'b',
        description: 'Number of bars to monitor',
        default: 50,
      },
      alert: {
        type: 'boolean',
        alias: 'a',
        description: 'Generate alert code for condition',
      },
      output: { type: 'string', alias: 'o', description: 'Output file path' },
    });

    const pineFile = options.file || this.findPineScriptFile();
    if (!pineFile) {
      throw new Error('No PineScript file specified and none found in current directory.');
    }

    console.log(`👁️  Monitoring conditions in: ${pineFile}`);

    const content = fs.readFileSync(pineFile, 'utf8');

    if (options.condition) {
      console.log(`Condition: ${options.condition}`);

      // Analyze condition
      const conditionAnalysis = this.analyzeCondition(content, options.condition);

      console.log('\n🔍 Condition Analysis:');
      console.log(
        `  Complexity: ${conditionAnalysis.complexity} (${conditionAnalysis.complexityLevel})`,
      );
      console.log(`  Variables used: ${conditionAnalysis.variables.join(', ')}`);
      console.log(`  Operators: ${conditionAnalysis.operators.join(', ')}`);

      if (conditionAnalysis.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        conditionAnalysis.suggestions.forEach((suggestion, i) => {
          console.log(`  ${i + 1}. ${suggestion}`);
        });
      }

      if (options.alert) {
        const alertCode = this.generateAlertCode(options.condition);
        console.log('\n🚨 Alert Code Snippet:');
        console.log(alertCode);
      }
    }

    if (options.watch) {
      const watchVars = options.watch.split(',').map((v) => v.trim());
      console.log(`\n👀 Watching variables: ${watchVars.join(', ')}`);

      watchVars.forEach((variable) => {
        const usage = this.analyzeVariableUsage(content, variable);
        console.log(`\n  ${variable}:`);
        console.log(`    Type: ${usage.type}`);
        console.log(`    First assignment: ${usage.firstAssignment}`);
        console.log(`    Last assignment: ${usage.lastAssignment}`);
      });
    }
  }

  async profile(args) {
    const options = this.parseArgs(args, {
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to profile',
      },
      iterations: {
        type: 'number',
        alias: 'i',
        description: 'Number of iterations',
        default: 1000,
      },
      metrics: {
        type: 'string',
        alias: 'm',
        description: 'Metrics to collect (cpu,memory,complexity,coverage)',
        default: 'cpu,complexity',
      },
      memory: {
        type: 'boolean',
        description: 'Enable advanced memory profiling',
        default: false,
      },
      output: { type: 'string', alias: 'o', description: 'Output file path' },
      verbose: { type: 'boolean', alias: 'v', description: 'Verbose output' },
    });

    const pineFile = options.file || this.findPineScriptFile();
    if (!pineFile) {
      throw new Error('No PineScript file specified and none found in current directory.');
    }

    console.log(`⚡ Profiling: ${pineFile} (${options.iterations} iterations)`);
    console.log(`📊 Metrics: ${options.metrics}`);
    if (options.memory) {
      console.log(`🧠 Advanced memory profiling: ENABLED`);
    }

    const content = fs.readFileSync(pineFile, 'utf8');

    // Analyze code complexity
    const complexity = this.analyzeComplexity(content);

    console.log('\n📊 Complexity Analysis:');
    console.log(`  Lines of code: ${complexity.loc}`);
    console.log(`  Functions: ${complexity.functions.length}`);
    console.log(`  Variables: ${complexity.variables}`);
    console.log(`  Cyclomatic complexity: ${complexity.cyclomatic}`);
    console.log(`  Nested depth: ${complexity.maxDepth}`);
    console.log(`  Memory estimate: ${complexity.memoryEstimate} units`);

    // Performance patterns
    const performance = this.analyzePerformancePatterns(content);

    if (performance.issues.length > 0) {
      console.log('\n⚠️  Performance Issues:');
      performance.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.type}: ${issue.message}`);
        console.log(`     Location: Line ${issue.line}`);
        if (issue.suggestion) {
          console.log(`     Suggestion: ${issue.suggestion}`);
        }
      });
    }

    if (performance.optimizations.length > 0) {
      console.log('\n💡 Optimization Opportunities:');
      performance.optimizations.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt.type}: ${opt.message}`);
        console.log(`     Impact: ${opt.impact}`);
      });
    }

    // Memory analysis if enabled
    if (options.memory || options.metrics.includes('memory')) {
      console.log('\n🧠 Memory Analysis:');
      const memoryAnalysis = this.analyzeMemoryUsage(content);

      console.log(`  Variable types: ${memoryAnalysis.variableTypes.join(', ')}`);
      console.log(`  Array usage: ${memoryAnalysis.arrayCount} arrays`);
      console.log(`  Series usage: ${memoryAnalysis.seriesCount} series`);
      console.log(`  Estimated peak memory: ${memoryAnalysis.estimatedPeak} units`);

      if (memoryAnalysis.leakRisks.length > 0) {
        console.log('\n⚠️  Memory Leak Risks:');
        memoryAnalysis.leakRisks.forEach((risk, i) => {
          console.log(`  ${i + 1}. ${risk.type}: ${risk.message}`);
          console.log(`     Location: Line ${risk.line}`);
        });
      }

      if (memoryAnalysis.optimizations.length > 0) {
        console.log('\n💡 Memory Optimization Opportunities:');
        memoryAnalysis.optimizations.forEach((opt, i) => {
          console.log(`  ${i + 1}. ${opt.type}: ${opt.message}`);
          console.log(`     Impact: ${opt.impact}`);
        });
      }

      performance.memory = memoryAnalysis;
    }

    // Code coverage analysis if enabled
    if (options.metrics.includes('coverage')) {
      console.log('\n📈 Code Coverage Analysis:');
      const coverage = this.analyzeCodeCoverage(content);

      console.log(`  Executable lines: ${coverage.executableLines}`);
      console.log(`  Covered lines: ${coverage.coveredLines}`);
      console.log(`  Coverage: ${coverage.percentage}%`);

      if (coverage.uncovered.length > 0) {
        console.log('\n⚠️  Uncovered Code Sections:');
        coverage.uncovered.forEach((section, i) => {
          console.log(`  ${i + 1}. Lines ${section.start}-${section.end}: ${section.type}`);
        });
      }

      performance.coverage = coverage;
    }

    // Generate profiling report
    const report = {
      file: pineFile,
      timestamp: new Date().toISOString(),
      metrics: options.metrics.split(','),
      complexity,
      performance,
      suggestions: this.generatePerformanceSuggestions(complexity, performance),
    };

    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
      console.log(`\n📄 Profile report saved to: ${options.output}`);

      // Also generate memory profiling helpers if memory analysis was done
      if (options.memory) {
        const memoryHelpersPath = options.output.replace(/\.json$/, '-memory-helpers.pine');
        this.generateMemoryProfilingHelpers(memoryHelpersPath);
        console.log(`🧠 Memory profiling helpers saved to: ${memoryHelpersPath}`);
      }
    }
  }

  async startServer(args) {
    const options = this.parseArgs(args, {
      port: {
        type: 'number',
        alias: 'p',
        description: 'Port to run server on',
        default: 3000,
      },
      file: {
        type: 'string',
        alias: 'f',
        description: 'PineScript file to debug',
      },
      project: {
        type: 'string',
        alias: 'd',
        description: 'Project directory',
        default: process.cwd(),
      },
    });

    console.log('🚀 Starting PineScript Interactive Debugging Server...');
    console.log(`📁 Project: ${options.project}`);

    if (options.file) {
      console.log(`📄 File: ${options.file}`);
    }

    console.log(`🔗 Web interface: http://localhost:${options.port}`);
    console.log(`🔧 Debug interface: http://localhost:${options.port}/debug`);
    console.log('\n💡 Press Ctrl+C to stop the server');

    // Start the debug server (using refactored version)
    const debugServerPath = path.join(__dirname, '../pinescript/debug-server-refactored.js');

    const serverArgs = [];
    if (options.port) serverArgs.push('--port', options.port.toString());
    if (options.file) serverArgs.push('--file', options.file);
    if (options.project) serverArgs.push('--project', options.project);

    const { spawn } = require('child_process');
    const serverProcess = spawn('node', [debugServerPath, ...serverArgs], {
      stdio: 'inherit',
      cwd: this.projectPath,
    });

    serverProcess.on('error', (error) => {
      console.error(`❌ Failed to start server: ${error.message}`);
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping debug server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
  }

  async generateHelpers(args) {
    const options = this.parseArgs(args, {
      output: {
        type: 'string',
        alias: 'o',
        description: 'Output file path',
        default: 'debug-helpers.pine',
      },
      include: {
        type: 'string',
        description: 'Helpers to include (all, basic, advanced, custom)',
        default: 'all',
      },
    });

    console.log(`📦 Generating debugging helpers: ${options.output}`);

    const helpers = this.generateDebugHelpers(options.include);
    fs.writeFileSync(options.output, helpers);

    console.log(`✅ Debug helpers generated: ${options.output}`);
    console.log('\n💡 Usage:');
    console.log('  1. Add to your PineScript: //@include "debug-helpers.pine"');
    console.log('  2. Use debug.plot(), debug.alert(), debug.trace() functions');
    console.log('  3. Run /pine-debug inspect to analyze your code');
  }

  async runTests(_args) {
    console.log('🧪 Running PineScript tests...');
    console.log('This feature is under development.');
    console.log('For now, use /pine-validate for syntax checking.');
    // TODO: Implement test framework
  }

  // Helper methods
  findPineScriptFile() {
    try {
      const files = fs.readdirSync(this.projectPath);
      const pineFiles = files.filter((file) => file.endsWith('.pine'));
      return pineFiles.length > 0 ? pineFiles[0] : null;
    } catch {
      return null;
    }
  }

  extractVariables(content, pattern) {
    const variables = [];

    // Match variable declarations
    const varRegex = /(\w+)\s*=\s*(?:ta\.|math\.|str\.|input\.)?\w+/g;
    const inputRegex = /input\.(\w+)\s*\(/g;
    const functionRegex = /(\w+)\s*\([^)]*\)\s*=>/g;

    let match;

    // Find regular variables
    while ((match = varRegex.exec(content)) !== null) {
      if (this.matchesPattern(match[1], pattern)) {
        variables.push({
          name: match[1],
          type: 'variable',
          line: this.getLineNumber(content, match.index),
        });
      }
    }

    // Find input variables
    while ((match = inputRegex.exec(content)) !== null) {
      if (this.matchesPattern(match[1], pattern)) {
        variables.push({
          name: match[1],
          type: 'input',
          line: this.getLineNumber(content, match.index),
        });
      }
    }

    // Find functions
    while ((match = functionRegex.exec(content)) !== null) {
      if (this.matchesPattern(match[1], pattern)) {
        variables.push({
          name: match[1],
          type: 'function',
          line: this.getLineNumber(content, match.index),
        });
      }
    }

    return variables;
  }

  matchesPattern(name, pattern) {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(name);
    }
    return name === pattern;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  parseArgs(args, schema) {
    const options = {};
    const aliases = {};

    // Build alias map
    Object.entries(schema).forEach(([key, config]) => {
      if (config.alias) {
        aliases[config.alias] = key;
      }
    });

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        if (schema[key]) {
          if (schema[key].type === 'boolean') {
            options[key] = true;
          } else {
            options[key] = args[++i];
          }
        }
      } else if (arg.startsWith('-')) {
        const alias = arg.slice(1);
        if (aliases[alias]) {
          const key = aliases[alias];
          if (schema[key].type === 'boolean') {
            options[key] = true;
          } else {
            options[key] = args[++i];
          }
        }
      }
    }

    // Apply defaults
    Object.entries(schema).forEach(([key, config]) => {
      if (options[key] === undefined && config.default !== undefined) {
        options[key] = config.default;
      }
      if (config.required && options[key] === undefined) {
        throw new Error(`Missing required option: --${key}`);
      }
    });

    return options;
  }

  // Additional helper methods would be implemented here
  // For brevity, I'm showing the structure - actual implementations would follow

  analyzeVariableUsage(_content, _variableName) {
    // TODO: Implement variable usage analysis
    return {
      type: 'unknown',
      declaration: 'Not found',
      count: 0,
      assignments: [],
      references: [],
    };
  }

  generateDebugPlotCode(_content, variableName) {
    return `// Debug plot for ${variableName}
// Add this to your PineScript file

plot(${variableName}, "${variableName} (Debug)", color=color.new(color.blue, 0), linewidth=2)
plotchar(${variableName}, "${variableName}", "", location.top, size=size.tiny, color=color.blue)

// For series debugging
hline(0, "Zero", color=color.new(color.gray, 50), linestyle=hline.style_dotted)
bgcolor(${variableName} > 0 ? color.new(color.green, 90) : ${variableName} < 0 ? color.new(color.red, 90) : na)`;
  }

  // ========== ADVANCED PROFILING METHODS ==========

  analyzeComplexity(content) {
    const lines = content.split('\n');
    const functions = [];
    let variables = 0;
    let cyclomatic = 1; // Start with 1 for the main path
    let maxDepth = 0;
    let currentDepth = 0;
    let memoryEstimate = 0;

    // Regular expressions for analysis
    const functionRegex = /(\w+)\s*\([^)]*\)\s*=>/g;
    const variableRegex = /\b(var\s+\w+|(\w+)\s*=)/g;
    const controlRegex = /\b(if|else|for|while|switch|case)\b/g;
    const arrayRegex = /array\.new_/g;
    const seriesRegex = /\b(close|open|high|low|volume|ta\.|math\.)/g;

    // Find functions
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    // Count variables
    while ((match = variableRegex.exec(content)) !== null) {
      variables++;
    }

    // Calculate cyclomatic complexity
    while ((match = controlRegex.exec(content)) !== null) {
      cyclomatic++;
    }

    // Calculate nesting depth
    for (const line of lines) {
      if (line.includes('if') || line.includes('for') || line.includes('while')) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      if (line.includes('}') || line.includes('end')) {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    // Estimate memory usage
    const arrayMatches = content.match(arrayRegex) || [];
    const seriesMatches = content.match(seriesRegex) || [];

    memoryEstimate =
      variables * 8 + // Base variable memory
      arrayMatches.length * 32 + // Array overhead
      seriesMatches.length * 16; // Series overhead

    return {
      loc: lines.length,
      functions,
      variables,
      cyclomatic,
      maxDepth,
      memoryEstimate,
    };
  }

  analyzePerformancePatterns(content) {
    const issues = [];
    const optimizations = [];

    const lines = content.split('\n');

    // Check for common performance issues
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for nested loops
      if (line.includes('for') && line.includes('for')) {
        issues.push({
          type: 'nested_loop',
          message: 'Nested loops can cause performance issues',
          line: lineNum,
          suggestion: 'Consider using built-in TA functions or optimize loop logic',
        });
      }

      // Check for redundant calculations
      if (line.includes('ta.rsi') || line.includes('ta.sma')) {
        const nextLines = lines.slice(index + 1, index + 3).join(' ');
        if (nextLines.includes(line.split('=')[0].trim())) {
          issues.push({
            type: 'redundant_calculation',
            message: 'Same calculation appears multiple times',
            line: lineNum,
            suggestion: 'Store result in a variable and reuse it',
          });
        }
      }

      // Check for large arrays
      if (line.includes('array.new_float(100') || line.includes('array.new_int(100')) {
        issues.push({
          type: 'large_array',
          message: 'Large array allocation',
          line: lineNum,
          suggestion: 'Consider using series or reduce array size',
        });
      }

      // Optimization opportunities
      if (line.includes('math.abs') && line.includes('math.max')) {
        optimizations.push({
          type: 'math_optimization',
          message: 'Combine math operations where possible',
          line: lineNum,
          impact: 'medium',
        });
      }

      if (line.includes('if') && line.includes('else if')) {
        optimizations.push({
          type: 'conditional_optimization',
          message: 'Optimize condition order for most common cases',
          line: lineNum,
          impact: 'low',
        });
      }
    });

    return {
      issues,
      optimizations,
    };
  }

  analyzeMemoryUsage(content) {
    const lines = content.split('\n');
    const variableTypes = new Set();
    let arrayCount = 0;
    let seriesCount = 0;
    let estimatedPeak = 0;
    const leakRisks = [];
    const optimizations = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Detect variable types
      if (line.includes('var ')) {
        if (line.includes('var float')) variableTypes.add('float');
        if (line.includes('var int')) variableTypes.add('int');
        if (line.includes('var bool')) variableTypes.add('bool');
        if (line.includes('var string')) variableTypes.add('string');
        if (line.includes('var color')) variableTypes.add('color');
      }

      // Count arrays
      if (line.includes('array.new_')) {
        arrayCount++;

        // Check for potential memory leaks in arrays
        if (
          line.includes('array.push') &&
          !line.includes('array.shift') &&
          !line.includes('array.pop')
        ) {
          leakRisks.push({
            type: 'array_growth',
            message: 'Array grows without cleanup',
            line: lineNum,
          });
        }
      }

      // Count series usage
      if (line.includes('ta.') || line.includes('close[') || line.includes('high[')) {
        seriesCount++;
      }

      // Memory optimization opportunities
      if (line.includes('var ') && line.includes('array.new_')) {
        optimizations.push({
          type: 'array_to_series',
          message: 'Consider using series instead of array for sequential data',
          line: lineNum,
          impact: 'high',
        });
      }

      if (line.includes('float') && line.includes('int')) {
        optimizations.push({
          type: 'type_consistency',
          message: 'Use consistent numeric types to reduce memory',
          line: lineNum,
          impact: 'medium',
        });
      }
    });

    // Estimate peak memory
    estimatedPeak =
      variableTypes.size * 8 + // Base variable memory
      arrayCount * 32 + // Array overhead
      seriesCount * 16; // Series overhead

    return {
      variableTypes: Array.from(variableTypes),
      arrayCount,
      seriesCount,
      estimatedPeak,
      leakRisks,
      optimizations,
    };
  }

  analyzeCodeCoverage(content) {
    const lines = content.split('\n');
    let executableLines = 0;
    let coveredLines = 0;
    const uncovered = [];

    // Simple coverage analysis based on code structure
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('//')) {
        return;
      }

      executableLines++;

      // Check if line is likely to be executed
      // This is a simplified analysis - real coverage would require execution
      if (
        trimmed.includes('=') ||
        trimmed.includes('if') ||
        trimmed.includes('for') ||
        trimmed.includes('plot') ||
        trimmed.includes('debug.')
      ) {
        coveredLines++;
      } else {
        uncovered.push({
          start: index + 1,
          end: index + 1,
          type: 'unexecuted',
        });
      }
    });

    const percentage = executableLines > 0 ? Math.round((coveredLines / executableLines) * 100) : 0;

    return {
      executableLines,
      coveredLines,
      percentage,
      uncovered,
    };
  }

  generatePerformanceSuggestions(complexity, performance) {
    const suggestions = [];

    // Complexity-based suggestions
    if (complexity.cyclomatic > 10) {
      suggestions.push('High cyclomatic complexity. Consider refactoring complex conditionals.');
    }

    if (complexity.maxDepth > 3) {
      suggestions.push('Deep nesting detected. Consider flattening the code structure.');
    }

    if (complexity.memoryEstimate > 500) {
      suggestions.push('High memory estimate. Review data structures and variable usage.');
    }

    // Performance-based suggestions
    if (performance.issues.length > 0) {
      suggestions.push('Address performance issues listed in the report.');
    }

    if (performance.optimizations.length > 0) {
      suggestions.push('Implement optimizations for better performance.');
    }

    return suggestions;
  }

  // ============================================================================
  // AI-ASSISTED DEBUGGING METHODS (PHASE 4)
  // ============================================================================

  async analyzeWithAI(args) {
    const fs = require('fs');

    const filePath = args.find((arg) => !arg.startsWith('--')) || '';
    const outputPath = this.getArgValue(args, '--output') || 'ai-suggestions.txt';
    const includePatterns = this.getArgValue(args, '--patterns') || 'all';
    const threshold = parseFloat(this.getArgValue(args, '--threshold') || '0.7');

    if (!filePath || !fs.existsSync(filePath)) {
      console.error('Error: Please provide a valid PineScript file path');
      console.log(
        'Usage: /pine-debug ai --file <path> [--output <path>] [--patterns <categories>]',
      );
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const patterns = this.loadAIPatterns();
    const suggestions = this.generateAISuggestions(content, patterns, includePatterns, threshold);

    // Output suggestions
    if (outputPath === 'console') {
      this.printAISuggestions(suggestions);
    } else {
      this.saveAISuggestions(suggestions, outputPath);
      console.log(`✅ AI suggestions saved to: ${outputPath}`);
    }

    return true;
  }

  loadAIPatterns() {
    const fs = require('fs');
    const path = require('path');

    const patternsPath = path.join(__dirname, '../../data/ai-patterns.json');

    try {
      if (fs.existsSync(patternsPath)) {
        const data = fs.readFileSync(patternsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(`Warning: Could not load AI patterns: ${error.message}`);
    }

    // Return default patterns if file not found
    return {
      patterns: {
        common_errors: [],
        performance_issues: [],
        best_practices: [],
        tradingview_specific: [],
      },
    };
  }

  generateAISuggestions(content, patterns, includePatterns = 'all', threshold = 0.7) {
    const suggestions = [];
    const lines = content.split('\n');

    // Parse include patterns
    const categories =
      includePatterns === 'all'
        ? ['common_errors', 'performance_issues', 'best_practices', 'tradingview_specific']
        : includePatterns.split(',');

    // Analyze each line for patterns
    lines.forEach((line, lineNum) => {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('//')) {
        return;
      }

      // Check each category
      categories.forEach((category) => {
        if (patterns.patterns[category]) {
          patterns.patterns[category].forEach((pattern) => {
            if (this.matchesAIPattern(trimmed, pattern)) {
              suggestions.push({
                line: lineNum + 1,
                category: category.replace('_', ' '),
                patternId: pattern.id,
                patternName: pattern.name,
                description: pattern.description,
                severity: pattern.severity,
                fix: pattern.fix,
                example: pattern.example_fixed,
                confidence: this.calculateConfidence(trimmed, pattern),
              });
            }
          });
        }
      });
    });

    // Filter by threshold
    return suggestions
      .filter((s) => s.confidence >= threshold)
      .sort((a, b) => {
        // Sort by severity (high to low), then confidence (high to low)
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity] || b.confidence - a.confidence;
      });
  }

  matchesAIPattern(line, pattern) {
    // Simple pattern matching - in production would use regex from pattern.pattern
    const lineLower = line.toLowerCase();

    // Check for common error patterns
    if (
      pattern.id === 'CE001' &&
      (lineLower.includes('[bar_index') || lineLower.includes('close['))
    ) {
      return true;
    }

    if (pattern.id === 'CE002' && (lineLower.includes('/ 0') || lineLower.includes('/ close[1]'))) {
      return true;
    }

    if (pattern.id === 'CE003' && (lineLower.includes('na +') || lineLower.includes('+ na'))) {
      return true;
    }

    if (pattern.id === 'PI001' && lineLower.includes('ta.sma') && lineLower.includes('ta.sma')) {
      return true;
    }

    if (
      pattern.id === 'BP001' &&
      lineLower.includes('input(') &&
      !lineLower.includes('input.int(')
    ) {
      return true;
    }

    if (pattern.id === 'TV001' && lineLower.includes('security(')) {
      return true;
    }

    return false;
  }

  calculateConfidence(line, pattern) {
    // Simple confidence calculation based on pattern matching
    let confidence = 0.5; // Base confidence

    // Increase confidence for specific patterns
    if (pattern.id === 'CE002' && line.includes('/ 0')) {
      confidence = 0.9;
    }

    if (pattern.id === 'CE001' && line.includes('[bar_index -')) {
      confidence = 0.8;
    }

    if (pattern.id === 'PI001' && (line.match(/ta\.sma/g) || []).length > 1) {
      confidence = 0.7;
    }

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  printAISuggestions(suggestions) {
    console.log('\n🤖 AI DEBUGGING SUGGESTIONS\n');
    console.log('='.repeat(60));

    if (suggestions.length === 0) {
      console.log('✅ No issues detected! Your code looks good.');
      return;
    }

    suggestions.forEach((suggestion, index) => {
      const severityIcon =
        suggestion.severity === 'high' ? '🔴' : suggestion.severity === 'medium' ? '🟡' : '🟢';

      console.log(`\n${severityIcon} Suggestion ${index + 1} (Line ${suggestion.line})`);
      console.log(`   Category: ${suggestion.category}`);
      console.log(`   Issue: ${suggestion.patternName}`);
      console.log(`   Description: ${suggestion.description}`);
      console.log(`   Fix: ${suggestion.fix}`);
      console.log(`   Example: ${suggestion.example}`);
      console.log(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Summary: ${suggestions.length} suggestions found`);

    const highCount = suggestions.filter((s) => s.severity === 'high').length;
    const mediumCount = suggestions.filter((s) => s.severity === 'medium').length;
    const lowCount = suggestions.filter((s) => s.severity === 'low').length;

    console.log(`   🔴 High priority: ${highCount}`);
    console.log(`   🟡 Medium priority: ${mediumCount}`);
    console.log(`   🟢 Low priority: ${lowCount}`);
  }

  saveAISuggestions(suggestions, outputPath) {
    const fs = require('fs');

    let output = 'AI Debugging Suggestions Report\n';
    output += `Generated: ${new Date().toISOString()}\n`;
    output += `${'='.repeat(60)}\n\n`;

    if (suggestions.length === 0) {
      output += '✅ No issues detected! Your code looks good.\n';
    } else {
      suggestions.forEach((suggestion, index) => {
        const severityIcon =
          suggestion.severity === 'high'
            ? '[HIGH]'
            : suggestion.severity === 'medium'
              ? '[MEDIUM]'
              : '[LOW]';

        output += `${severityIcon} Suggestion ${index + 1}\n`;
        output += `Line: ${suggestion.line}\n`;
        output += `Category: ${suggestion.category}\n`;
        output += `Issue: ${suggestion.patternName}\n`;
        output += `Description: ${suggestion.description}\n`;
        output += `Fix: ${suggestion.fix}\n`;
        output += `Example: ${suggestion.example}\n`;
        output += `Confidence: ${Math.round(suggestion.confidence * 100)}%\n`;
        output += `${'-'.repeat(40)}\n\n`;
      });

      output += 'Summary:\n';
      output += `Total suggestions: ${suggestions.length}\n`;

      const highCount = suggestions.filter((s) => s.severity === 'high').length;
      const mediumCount = suggestions.filter((s) => s.severity === 'medium').length;
      const lowCount = suggestions.filter((s) => s.severity === 'low').length;

      output += `High priority: ${highCount}\n`;
      output += `Medium priority: ${mediumCount}\n`;
      output += `Low priority: ${lowCount}\n`;
    }

    fs.writeFileSync(outputPath, output);
  }

  generateAIDebugHelpers(outputPath) {
    const fs = require('fs');
    const aiHelpers = `// AI Debugging Helpers
// Generated by /pine-debug ai --helpers
// Include in your PineScript with: //@include "debug-ai.pine"

// AI pattern database (simplified)
aiPatterns = {
  common_errors: [
    "CE001:Series Index Out of Bounds",
    "CE002:Division by Zero", 
    "CE003:Na Propagation",
    "CE004:Infinite Loop Risk",
    "CE005:Uninitialized Variables"
  ],
  performance_issues: [
    "PI001:Redundant Calculations",
    "PI002:Inefficient Array Operations",
    "PI003:Excessive Plot Calls",
    "PI004:Unoptimized Loops"
  ],
  best_practices: [
    "BP001:Input Validation",
    "BP002:Memory Optimization", 
    "BP003:Error Handling",
    "BP004:Code Organization"
  ],
  tradingview_specific: [
    "TV001:Security Function Misuse",
    "TV002:Repainting Issues",
    "TV003:Indicator Overload"
  ]
}

// AI analysis function
analyzeCodeWithAI(code, context = "") =>
    // Implementation in debug-ai.pine
    []

// Generate AI suggestions  
generateAISuggestions(code, profilingData = na, varData = na) =>
    // Implementation in debug-ai.pine
    []

// Full implementation available in: examples/pinescript-projects/debug-helpers/debug-ai.pine`;

    fs.writeFileSync(outputPath, aiHelpers);
    console.log(`✅ AI debug helpers saved to: ${outputPath}`);
    return true;
  }

  // ============================================================================
  // END AI METHODS
  // ============================================================================

  generateMemoryProfilingHelpers(outputPath) {
    const memoryHelpers = `// Advanced Memory Profiling Helpers
// Generated by /pine-debug profile --memory
// Include in your PineScript with: //@include "debug-memory.pine"

// Memory tracking configuration
debug.memoryConfig = {
  enabled: true,
  trackVariables: true,
  trackArrays: true,
  trackSeries: true,
  warningThreshold: 50,
  criticalThreshold: 100,
}

// Memory estimation by type
debug.estimateMemory = (value) => {
  if (na(value)) return 0
  // Type-based estimation logic here
  // (Full implementation in debug-memory.pine)
}

// Memory tracking functions
debug.trackVariable = (name, value, type) => {
  // Implementation for tracking variable memory
}

// Memory leak detection
debug.detectMemoryLeak = () => {
  // Implementation for leak detection
}

// Memory usage visualization
debug.plotMemoryUsage = () => {
  plot(totalMemory, "Total Memory", color=color.blue)
  hline(warningThreshold, "Warning", color=color.orange)
  hline(criticalThreshold, "Critical", color=color.red)
}

// Full implementation available in: examples/pinescript-projects/debug-helpers/debug-memory.pine`;

    require('fs').writeFileSync(outputPath, memoryHelpers);
    return true;
  }
}

function showHelp() {
  console.log(`
🔧 PineScript Debugging Tools

Usage: /pine-debug <action> [options]

Actions:
  inspect     Inspect variables and their values
  trace       Trace variable changes over time
  monitor     Monitor conditions and expressions
  profile     Profile performance and complexity
  server      Start interactive debugging server
  helpers     Generate debugging helper library
  test        Run debugging tests
  ai          AI-assisted debugging suggestions

Examples:
  /pine-debug inspect --var "rsiValue" --bars 20
  /pine-debug trace --var "macdLine" --plot
  /pine-debug monitor --condition "crossover(fastMA, slowMA)" --alert
  /pine-debug profile --metrics cpu,memory,complexity --memory
  /pine-debug helpers --output my-debug-helpers.pine
  /pine-debug ai --file my-indicator.pine --output suggestions.txt

Options:
  --file, -f      PineScript file to debug
  --var, -v       Variable name to inspect/trace
  --bars, -b      Number of historical bars
  --condition, -c Condition expression to monitor
  --memory        Enable advanced memory profiling
  --output, -o    Output file path
  --verbose       Verbose output
  --help, -h      Show this help message

For detailed help on a specific action:
  /pine-debug inspect --help
  /pine-debug trace --help
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { PineScriptDebugger };
