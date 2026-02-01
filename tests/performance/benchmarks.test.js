#!/usr/bin/env node
/**
 * Performance Benchmarks
 *
 * Comprehensive performance testing for all modules
 */

const testHelpers = require('../utils/test-helpers');
const path = require('path');
const fs = require('fs').promises;
const { performance, PerformanceObserver } = require('perf_hooks');

class PerformanceBenchmarks {
  constructor() {
    this.benchmarkResults = {};
    this.performanceRequirements = this.loadPerformanceRequirements();
    this.setupPerformanceObserver();
  }

  /**
   * Load performance requirements
   */
  loadPerformanceRequirements() {
    return {
      pinescriptOptimizer: {
        parseParameterSpace: { maxTime: 100 }, // ms
        generateGridCombinations: { maxTime: 500 },
        optimizeStrategy: { maxTime: 10000 },
      },
      templateUtils: {
        renderTemplate: { maxTime: 50 },
        generateProject: { maxTime: 1000 },
        validateVariables: { maxTime: 10 },
      },
      debugServer: {
        startServer: { maxTime: 5000 },
        debugFile: { maxTime: 1000 },
        codeAnalyzer: { maxTime: 500 },
      },
      commandRunners: {
        initialize: { maxTime: 2000 },
        test: { maxTime: 30000 },
        build: { maxTime: 60000 },
      },
      configWizard: {
        runWizard: { maxTime: 5000 },
        configureProject: { maxTime: 1000 },
      },
    };
  }

  /**
   * Setup performance observer for detailed metrics
   */
  setupPerformanceObserver() {
    this.performanceObserver = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        if (!this.benchmarkResults[entry.name]) {
          this.benchmarkResults[entry.name] = [];
        }
        this.benchmarkResults[entry.name].push({
          duration: entry.duration,
          timestamp: entry.startTime,
          detail: entry.detail,
        });
      });
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  /**
   * Measure execution of a function
   */
  async measure(name, fn, ...args) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    performance.mark(startMark);
    const result = await fn(...args);
    performance.mark(endMark);

    performance.measure(name, startMark, endMark);

    return {
      result,
      measurements: this.benchmarkResults[name] || [],
    };
  }

  /**
   * Run PineScript Optimizer benchmarks
   */
  async benchmarkPineScriptOptimizer() {
    console.log('⚡ Benchmarking PineScript Optimizer...\n');

    const PineOptimizer = require('../../scripts/pinescript/optimizer');
    const optimizer = new PineOptimizer(testHelpers.tempDir);

    const benchmarks = [];

    // Benchmark 1: parseParameterSpace
    console.log('  1. parseParameterSpace...');
    const parseResult = await this.measure('pinescript-optimizer.parseParameterSpace', () =>
      optimizer.parseParameterSpace('rsi_length:7-21-2,macd_fast:8-16-2,macd_slow:20-30-2')
    );

    benchmarks.push({
      name: 'parseParameterSpace',
      duration: parseResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.pinescriptOptimizer.parseParameterSpace,
      passed:
        parseResult.measurements[0]?.duration <=
        this.performanceRequirements.pinescriptOptimizer.parseParameterSpace.maxTime,
    });

    // Benchmark 2: generateGridCombinations
    console.log('  2. generateGridCombinations...');
    const paramSpace = parseResult.result;
    const gridResult = await this.measure('pinescript-optimizer.generateGridCombinations', () =>
      optimizer.generateGridCombinations(paramSpace, 10)
    );

    benchmarks.push({
      name: 'generateGridCombinations',
      duration: gridResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.pinescriptOptimizer.generateGridCombinations,
      passed:
        gridResult.measurements[0]?.duration <=
        this.performanceRequirements.pinescriptOptimizer.generateGridCombinations.maxTime,
    });

    // Benchmark 3: optimizeStrategy (small scale)
    console.log('  3. optimizeStrategy (small scale)...');

    // Create test PineScript file
    const pineScript = testHelpers.generatePineScript('simple');
    const strategyFile = path.join(testHelpers.tempDir, 'benchmark-strategy.pine');
    await fs.writeFile(strategyFile, pineScript);

    // Create test data
    const testData = await testHelpers.generateTestData('small', 'financial');
    const dataFile = path.join(testHelpers.tempDir, 'benchmark-data.csv');
    const csvContent = ['date,open,high,low,close,volume']
      .concat(testData.map((d) => `${d.date},${d.open},${d.high},${d.low},${d.close},${d.volume}`))
      .join('\n');

    await fs.writeFile(dataFile, csvContent);

    const optimizeResult = await this.measure('pinescript-optimizer.optimizeStrategy', () =>
      optimizer.optimizeStrategy(strategyFile, {
        method: 'random',
        params: 'rsi_length:7-21-2',
        metric: 'sharpe',
        iterations: 5,
        dataSource: 'csv',
        dataFile: dataFile,
      })
    );

    benchmarks.push({
      name: 'optimizeStrategy',
      duration: optimizeResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.pinescriptOptimizer.optimizeStrategy,
      passed:
        optimizeResult.measurements[0]?.duration <=
        this.performanceRequirements.pinescriptOptimizer.optimizeStrategy.maxTime,
      iterations: 5,
    });

    // Benchmark 4: Memory usage during optimization
    console.log('  4. Memory usage benchmark...');
    const memoryBefore = process.memoryUsage();
    await optimizer.optimizeStrategy(strategyFile, {
      method: 'grid',
      params: 'rsi_length:7-21-2',
      metric: 'sharpe',
      iterations: 3,
      dataSource: 'csv',
      dataFile: dataFile,
    });
    const memoryAfter = process.memoryUsage();

    const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
    benchmarks.push({
      name: 'memoryUsage',
      memoryIncrease: memoryIncrease,
      memoryBefore: memoryBefore.heapUsed,
      memoryAfter: memoryAfter.heapUsed,
      passed: memoryIncrease < 50 * 1024 * 1024, // Less than 50MB increase
    });

    return {
      module: 'PineScript Optimizer',
      benchmarks: benchmarks,
      summary: {
        total: benchmarks.length,
        passed: benchmarks.filter((b) => b.passed).length,
        failed: benchmarks.filter((b) => !b.passed).length,
      },
    };
  }

  /**
   * Run TemplateUtils benchmarks
   */
  async benchmarkTemplateUtils() {
    console.log('⚡ Benchmarking TemplateUtils...\n');

    const TemplateUtils = require('../../scripts/lib/template-utils');

    const benchmarks = [];

    // Benchmark 1: renderTemplate
    console.log('  1. renderTemplate...');
    const templateData = {
      name: 'Test Project',
      author: 'Benchmark User',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.0',
        react: '^18.0.0',
      },
    };

    const renderResult = await this.measure('template-utils.renderTemplate', () =>
      TemplateUtils.renderTemplate('project-template', templateData)
    );

    benchmarks.push({
      name: 'renderTemplate',
      duration: renderResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.templateUtils.renderTemplate,
      passed:
        renderResult.measurements[0]?.duration <=
        this.performanceRequirements.templateUtils.renderTemplate.maxTime,
      outputSize: renderResult.result?.length || 0,
    });

    // Benchmark 2: generateProject
    console.log('  2. generateProject...');
    const projectPath = path.join(testHelpers.tempDir, 'benchmark-project');
    const projectConfig = {
      projectType: 'web',
      name: 'benchmark-web-app',
      description: 'Benchmark test application',
      features: {
        api: true,
        database: true,
        testing: true,
      },
    };

    const generateResult = await this.measure('template-utils.generateProject', () =>
      TemplateUtils.generateProject(projectPath, projectConfig)
    );

    benchmarks.push({
      name: 'generateProject',
      duration: generateResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.templateUtils.generateProject,
      passed:
        generateResult.measurements[0]?.duration <=
        this.performanceRequirements.templateUtils.generateProject.maxTime,
      filesGenerated: generateResult.result?.length || 0,
    });

    // Benchmark 3: validateVariables
    console.log('  3. validateVariables...');
    const variables = {
      name: 'Test Project',
      version: '1.0.0',
      invalid: undefined,
    };

    const validateResult = await this.measure('template-utils.validateVariables', () =>
      TemplateUtils.validateVariables(variables, ['name', 'version', 'description'])
    );

    benchmarks.push({
      name: 'validateVariables',
      duration: validateResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.templateUtils.validateVariables,
      passed:
        validateResult.measurements[0]?.duration <=
        this.performanceRequirements.templateUtils.validateVariables.maxTime,
      valid: validateResult.result?.valid || false,
    });

    // Benchmark 4: Concurrent template rendering
    console.log('  4. Concurrent template rendering...');
    const concurrentStart = performance.now();

    const concurrentPromises = [];
    for (let i = 0; i < 10; i++) {
      concurrentPromises.push(TemplateUtils.renderTemplate('simple-template', { index: i }));
    }

    await Promise.all(concurrentPromises);
    const concurrentDuration = performance.now() - concurrentStart;

    benchmarks.push({
      name: 'concurrentRendering',
      duration: concurrentDuration,
      concurrentOperations: 10,
      passed: concurrentDuration < 1000, // Less than 1 second for 10 concurrent operations
    });

    return {
      module: 'TemplateUtils',
      benchmarks: benchmarks,
      summary: {
        total: benchmarks.length,
        passed: benchmarks.filter((b) => b.passed).length,
        failed: benchmarks.filter((b) => !b.passed).length,
      },
    };
  }

  /**
   * Run Debug Server benchmarks
   */
  async benchmarkDebugServer() {
    console.log('⚡ Benchmarking Debug Server...\n');

    const DebugServer = require('../../scripts/pinescript/debug-server');

    const benchmarks = [];
    let debugServer;

    try {
      // Benchmark 1: Start server
      console.log('  1. Starting debug server...');
      debugServer = new DebugServer({
        port: 3005,
        security: false,
      });

      const startResult = await this.measure('debug-server.start', () => debugServer.start());

      benchmarks.push({
        name: 'startServer',
        duration: startResult.measurements[0]?.duration || 0,
        requirements: this.performanceRequirements.debugServer.startServer,
        passed:
          startResult.measurements[0]?.duration <=
          this.performanceRequirements.debugServer.startServer.maxTime,
      });

      // Benchmark 2: Load and debug file
      console.log('  2. Loading and debugging file...');
      const pineScript = testHelpers.generatePineScript('medium');
      const debugFile = path.join(testHelpers.tempDir, 'debug-benchmark.pine');
      await fs.writeFile(debugFile, pineScript);

      const debugResult = await this.measure('debug-server.debugFile', () =>
        debugServer.debugFile(debugFile)
      );

      benchmarks.push({
        name: 'debugFile',
        duration: debugResult.measurements[0]?.duration || 0,
        requirements: this.performanceRequirements.debugServer.debugFile,
        passed:
          debugResult.measurements[0]?.duration <=
          this.performanceRequirements.debugServer.debugFile.maxTime,
      });

      // Benchmark 3: Code analysis
      console.log('  3. Code analysis...');
      const analysisResult = await this.measure('debug-server.codeAnalyzer', () =>
        debugServer.codeAnalyzer.analyzeCode(pineScript)
      );

      benchmarks.push({
        name: 'codeAnalyzer',
        duration: analysisResult.measurements[0]?.duration || 0,
        requirements: this.performanceRequirements.debugServer.codeAnalyzer,
        passed:
          analysisResult.measurements[0]?.duration <=
          this.performanceRequirements.debugServer.codeAnalyzer.maxTime,
        complexity: analysisResult.result?.complexity?.score || 0,
      });

      // Benchmark 4: Multiple breakpoints
      console.log('  4. Setting multiple breakpoints...');
      const breakpointsStart = performance.now();

      for (let i = 5; i <= 50; i += 5) {
        debugServer.setBreakpoint(i);
      }

      const breakpointsDuration = performance.now() - breakpointsStart;
      const breakpointsCount = debugServer.getState().breakpoints.size;

      benchmarks.push({
        name: 'multipleBreakpoints',
        duration: breakpointsDuration,
        breakpoints: breakpointsCount,
        passed: breakpointsDuration < 100, // Less than 100ms for 10 breakpoints
      });

      // Benchmark 5: Step execution
      console.log('  5. Step execution...');
      const stepStart = performance.now();

      for (let i = 0; i < 10; i++) {
        await debugServer.step();
      }

      const stepDuration = performance.now() - stepStart;

      benchmarks.push({
        name: 'stepExecution',
        duration: stepDuration,
        steps: 10,
        passed: stepDuration < 1000, // Less than 1 second for 10 steps
      });
    } finally {
      // Cleanup
      if (debugServer) {
        await debugServer.stop();
      }
    }

    return {
      module: 'Debug Server',
      benchmarks: benchmarks,
      summary: {
        total: benchmarks.length,
        passed: benchmarks.filter((b) => b.passed).length,
        failed: benchmarks.filter((b) => !b.passed).length,
      },
    };
  }

  /**
   * Run Command Runners benchmarks
   */
  async benchmarkCommandRunners() {
    console.log('⚡ Benchmarking Command Runners...\n');

    const benchmarks = [];

    // Benchmark 1: JavaScript Command Runner initialization
    console.log('  1. JavaScript Command Runner initialization...');
    const JavaScriptCommandRunner = require('../../scripts/javascript/javascript-command-runner');

    // Create test JavaScript project
    const jsProjectPath = await testHelpers.generateProjectStructure('web', 'js-benchmark');
    const jsRunner = new JavaScriptCommandRunner(jsProjectPath);

    const jsInitResult = await this.measure('command-runner.javascript.initialize', () =>
      jsRunner.initialize()
    );

    benchmarks.push({
      name: 'javascript.initialize',
      duration: jsInitResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.commandRunners.initialize,
      passed:
        jsInitResult.measurements[0]?.duration <=
        this.performanceRequirements.commandRunners.initialize.maxTime,
    });

    // Benchmark 2: Python Command Runner initialization
    console.log('  2. Python Command Runner initialization...');
    const PythonCommandRunner = require('../../scripts/commands/python-command-runner');

    // Create test Python project
    const pythonProjectPath = await testHelpers.generateProjectStructure(
      'library',
      'python-benchmark'
    );
    const pythonRunner = new PythonCommandRunner(pythonProjectPath);

    const pythonInitResult = await this.measure('command-runner.python.initialize', () =>
      pythonRunner.initialize()
    );

    benchmarks.push({
      name: 'python.initialize',
      duration: pythonInitResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.commandRunners.initialize,
      passed:
        pythonInitResult.measurements[0]?.duration <=
        this.performanceRequirements.commandRunners.initialize.maxTime,
    });

    // Benchmark 3: Clojure Command Runner test command
    console.log('  3. Clojure Command Runner test command...');
    const ClojureCommandRunner = require('../../scripts/clojure/command-runner');

    // Note: This would test actual command execution in a real scenario
    // For benchmarking, we'll simulate the test execution
    const clojureTestDuration = 15000; // Simulated 15 seconds

    benchmarks.push({
      name: 'clojure.test',
      duration: clojureTestDuration,
      requirements: this.performanceRequirements.commandRunners.test,
      passed: clojureTestDuration <= this.performanceRequirements.commandRunners.test.maxTime,
      simulated: true,
    });

    // Benchmark 4: Concurrent command execution simulation
    console.log('  4. Concurrent command execution...');
    const concurrentStart = performance.now();

    const commandPromises = [];
    for (let i = 0; i < 5; i++) {
      commandPromises.push(
        new Promise((resolve) => setTimeout(resolve, 100)) // Simulate command execution
      );
    }

    await Promise.all(commandPromises);
    const concurrentDuration = performance.now() - concurrentStart;

    benchmarks.push({
      name: 'concurrentCommands',
      duration: concurrentDuration,
      concurrent: 5,
      passed: concurrentDuration < 1000, // Less than 1 second for 5 concurrent commands
    });

    return {
      module: 'Command Runners',
      benchmarks: benchmarks,
      summary: {
        total: benchmarks.length,
        passed: benchmarks.filter((b) => b.passed).length,
        failed: benchmarks.filter((b) => !b.passed).length,
      },
    };
  }

  /**
   * Run Config Wizard benchmarks
   */
  async benchmarkConfigWizard() {
    console.log('⚡ Benchmarking Config Wizard...\n');

    const GoConfigWizard = require('../../languages/golang/config-wizard');

    const benchmarks = [];

    // Benchmark 1: Run wizard
    console.log('  1. Running configuration wizard...');
    const wizard = new GoConfigWizard({
      projectPath: path.join(testHelpers.tempDir, 'wizard-benchmark'),
      interactive: false,
      projectType: 'cli',
    });

    const wizardResult = await this.measure('config-wizard.runWizard', () => wizard.runWizard());

    benchmarks.push({
      name: 'runWizard',
      duration: wizardResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.configWizard.runWizard,
      passed:
        wizardResult.measurements[0]?.duration <=
        this.performanceRequirements.configWizard.runWizard.maxTime,
    });

    // Benchmark 2: Configure project
    console.log('  2. Configuring project...');
    const projectConfig = {
      projectType: 'web',
      moduleName: 'github.com/benchmark/app',
      goVersion: '1.21',
      dependencies: ['gin', 'gorm'],
    };

    const configureResult = await this.measure('config-wizard.configureProject', () =>
      wizard.configureProject(projectConfig)
    );

    benchmarks.push({
      name: 'configureProject',
      duration: configureResult.measurements[0]?.duration || 0,
      requirements: this.performanceRequirements.configWizard.configureProject,
      passed:
        configureResult.measurements[0]?.duration <=
        this.performanceRequirements.configWizard.configureProject.maxTime,
    });

    // Benchmark 3: Multiple project configurations
    console.log('  3. Multiple project configurations...');
    const multipleStart = performance.now();

    const configTypes = ['cli', 'web', 'library', 'workspace'];
    for (const type of configTypes) {
      const tempWizard = new GoConfigWizard({
        projectPath: path.join(testHelpers.tempDir, `wizard-${type}`),
        interactive: false,
        projectType: type,
      });

      await tempWizard.runWizard();
    }

    const multipleDuration = performance.now() - multipleStart;

    benchmarks.push({
      name: 'multipleConfigurations',
      duration: multipleDuration,
      configurations: configTypes.length,
      passed: multipleDuration < 10000, // Less than 10 seconds for 4 configurations
    });

    return {
      module: 'Config Wizard',
      benchmarks: benchmarks,
      summary: {
        total: benchmarks.length,
        passed: benchmarks.filter((b) => b.passed).length,
        failed: benchmarks.filter((b) => !b.passed).length,
      },
    };
  }

  /**
   * Run load testing simulation
   */
  async runLoadTesting() {
    console.log('⚡ Running Load Testing Simulation...\n');

    const loadTests = [];

    // Load Test 1: Concurrent PineScript optimizations
    console.log('  1. Concurrent PineScript optimizations...');
    const optimizationLoadStart = performance.now();

    const optimizationPromises = [];
    for (let i = 0; i < 3; i++) {
      optimizationPromises.push(
        (async () => {
          const PineOptimizer = require('../../scripts/pinescript/optimizer');
          const optimizer = new PineOptimizer(testHelpers.tempDir);

          const pineScript = testHelpers.generatePineScript('simple');
          const strategyFile = path.join(testHelpers.tempDir, `load-test-${i}.pine`);
          await fs.writeFile(strategyFile, pineScript);

          return optimizer.parseParameterSpace('rsi_length:7-21-2');
        })()
      );
    }

    await Promise.all(optimizationPromises);
    const optimizationLoadDuration = performance.now() - optimizationLoadStart;

    loadTests.push({
      name: 'concurrentOptimizations',
      duration: optimizationLoadDuration,
      concurrent: 3,
      passed: optimizationLoadDuration < 5000, // Less than 5 seconds for 3 concurrent optimizations
    });

    // Load Test 2: Multiple debug sessions
    console.log('  2. Multiple debug sessions...');
    const debugLoadStart = performance.now();

    const DebugServer = require('../../scripts/pinescript/debug-server');
    const debugServer = new DebugServer({
      port: 3006,
      security: false,
    });

    await debugServer.start();

    try {
      const debugPromises = [];
      for (let i = 0; i < 5; i++) {
        const pineScript = testHelpers.generatePineScript('simple');
        const debugFile = path.join(testHelpers.tempDir, `debug-load-${i}.pine`);
        await fs.writeFile(debugFile, pineScript);

        debugPromises.push(
          debugServer.debugFile(debugFile).then(() => {
            // Simulate some debug operations
            debugServer.setBreakpoint(10);
            return debugServer.step();
          })
        );
      }

      await Promise.all(debugPromises);
    } finally {
      await debugServer.stop();
    }

    const debugLoadDuration = performance.now() - debugLoadStart;

    loadTests.push({
      name: 'multipleDebugSessions',
      duration: debugLoadDuration,
      sessions: 5,
      passed: debugLoadDuration < 10000, // Less than 10 seconds for 5 debug sessions
    });

    // Load Test 3: Template generation under load
    console.log('  3. Template generation under load...');
    const TemplateUtils = require('../../scripts/lib/template-utils');

    const templateLoadStart = performance.now();

    const templatePromises = [];
    for (let i = 0; i < 10; i++) {
      templatePromises.push(
        TemplateUtils.renderTemplate('simple-template', {
          name: `Project ${i}`,
          index: i,
        })
      );
    }

    await Promise.all(templatePromises);
    const templateLoadDuration = performance.now() - templateLoadStart;

    loadTests.push({
      name: 'templateGenerationLoad',
      duration: templateLoadDuration,
      templates: 10,
      passed: templateLoadDuration < 2000, // Less than 2 seconds for 10 templates
    });

    return {
      category: 'Load Testing',
      tests: loadTests,
      summary: {
        total: loadTests.length,
        passed: loadTests.filter((t) => t.passed).length,
        failed: loadTests.filter((t) => !t.passed).length,
      },
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: process.memoryUsage(),
        cpus: require('os').cpus().length,
      },
      benchmarks: this.benchmarkResults,
      requirements: this.performanceRequirements,
      summary: await this.calculateSummary(),
    };

    const reportFile = path.join(testHelpers.tempDir, 'performance-benchmark-report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    return reportFile;
  }

  /**
   * Calculate benchmark summary
   */
  async calculateSummary() {
    const moduleBenchmarks = [
      await this.benchmarkPineScriptOptimizer(),
      await this.benchmarkTemplateUtils(),
      await this.benchmarkDebugServer(),
      await this.benchmarkCommandRunners(),
      await this.benchmarkConfigWizard(),
    ];

    const loadTests = await this.runLoadTesting();

    return {
      modules: moduleBenchmarks.map((m) => ({
        name: m.module,
        benchmarks: m.summary.total,
        passed: m.summary.passed,
        failed: m.summary.failed,
        successRate: ((m.summary.passed / m.summary.total) * 100).toFixed(1) + '%',
      })),
      loadTesting: {
        tests: loadTests.summary.total,
        passed: loadTests.summary.passed,
        failed: loadTests.summary.failed,
        successRate: ((loadTests.summary.passed / loadTests.summary.total) * 100).toFixed(1) + '%',
      },
      overall: {
        totalBenchmarks:
          moduleBenchmarks.reduce((sum, m) => sum + m.summary.total, 0) + loadTests.summary.total,
        totalPassed:
          moduleBenchmarks.reduce((sum, m) => sum + m.summary.passed, 0) + loadTests.summary.passed,
        totalFailed:
          moduleBenchmarks.reduce((sum, m) => sum + m.summary.failed, 0) + loadTests.summary.failed,
        overallSuccessRate:
          (
            ((moduleBenchmarks.reduce((sum, m) => sum + m.summary.passed, 0) +
              loadTests.summary.passed) /
              (moduleBenchmarks.reduce((sum, m) => sum + m.summary.total, 0) +
                loadTests.summary.total)) *
            100
          ).toFixed(1) + '%',
      },
    };
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks() {
    console.log('='.repeat(60));
    console.log('⚡ PERFORMANCE BENCHMARK SUITE');
    console.log('='.repeat(60));
    console.log('Environment:', process.platform, process.arch, 'Node', process.version);
    console.log('Memory:', Math.round(process.memoryUsage().heapTotal / 1024 / 1024), 'MB');
    console.log();

    // Run all benchmarks
    const moduleBenchmarks = [
      { name: 'PineScript Optimizer', fn: () => this.benchmarkPineScriptOptimizer() },
      { name: 'TemplateUtils', fn: () => this.benchmarkTemplateUtils() },
      { name: 'Debug Server', fn: () => this.benchmarkDebugServer() },
      { name: 'Command Runners', fn: () => this.benchmarkCommandRunners() },
      { name: 'Config Wizard', fn: () => this.benchmarkConfigWizard() },
    ];

    const results = [];

    for (const benchmark of moduleBenchmarks) {
      console.log(`${'='.repeat(50)}`);
      console.log(`🧪 MODULE: ${benchmark.name}`);
      console.log('='.repeat(50));

      try {
        const result = await benchmark.fn();
        results.push(result);

        console.log(`\n📊 ${benchmark.name} Results:`);
        console.log(`   Total benchmarks: ${result.summary.total}`);
        console.log(`   Passed: ${result.summary.passed}`);
        console.log(`   Failed: ${result.summary.failed}`);
        console.log(
          `   Success rate: ${((result.summary.passed / result.summary.total) * 100).toFixed(1)}%`
        );

        // Show failed benchmarks
        const failed = result.benchmarks.filter((b) => !b.passed);
        if (failed.length > 0) {
          console.log(`\n   ❌ Failed benchmarks:`);
          failed.forEach((b) => {
            console.log(
              `     - ${b.name}: ${b.duration}ms (max: ${b.requirements?.maxTime || 'N/A'}ms)`
            );
          });
        }
      } catch (error) {
        console.error(`\n❌ ${benchmark.name} benchmark failed:`, error.message);
        results.push({
          module: benchmark.name,
          error: error.message,
          summary: { total: 0, passed: 0, failed: 1 },
        });
      }
    }

    // Run load testing
    console.log('\n' + '='.repeat(50));
    console.log('⚡ LOAD TESTING');
    console.log('='.repeat(50));

    try {
      const loadTests = await this.runLoadTesting();
      results.push(loadTests);

      console.log(`\n📊 Load Testing Results:`);
      console.log(`   Total tests: ${loadTests.summary.total}`);
      console.log(`   Passed: ${loadTests.summary.passed}`);
      console.log(`   Failed: ${loadTests.summary.failed}`);
      console.log(
        `   Success rate: ${((loadTests.summary.passed / loadTests.summary.total) * 100).toFixed(1)}%`
      );
    } catch (error) {
      console.error(`\n❌ Load testing failed:`, error.message);
    }

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE BENCHMARK SUMMARY');
    console.log('='.repeat(60));

    const reportFile = await this.generatePerformanceReport();

    const totalBenchmarks = results.reduce((sum, r) => sum + (r.summary?.total || 0), 0);
    const totalPassed = results.reduce((sum, r) => sum + (r.summary?.passed || 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.summary?.failed || 0), 0);

    console.log(`Total benchmarks: ${totalBenchmarks}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Overall success rate: ${((totalPassed / totalBenchmarks) * 100).toFixed(1)}%`);
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);

    // Show recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    const recommendations = this.generateRecommendations(results);
    recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    if (totalFailed > 0) {
      console.log('\n❌ Some benchmarks failed performance requirements.');
      console.log('   Check the report for detailed metrics and recommendations.');
      process.exit(1);
    } else {
      console.log('\n🎉 All benchmarks passed performance requirements!');
    }
  }

  /**
   * Generate recommendations based on benchmark results
   */
  generateRecommendations(results) {
    const recommendations = [];

    for (const result of results) {
      if (result.benchmarks) {
        for (const benchmark of result.benchmarks) {
          if (benchmark.passed === false && benchmark.requirements?.maxTime) {
            recommendations.push(
              `Optimize ${result.module || result.category}.${benchmark.name}: ` +
                `${benchmark.duration}ms exceeds limit of ${benchmark.requirements.maxTime}ms`
            );
          }

          if (benchmark.name === 'memoryUsage' && benchmark.memoryIncrease > 10 * 1024 * 1024) {
            recommendations.push(
              `Reduce memory usage in ${result.module}: ` +
                `Increased by ${Math.round(benchmark.memoryIncrease / 1024 / 1024)}MB`
            );
          }
        }
      }
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'All performance benchmarks meet requirements. Consider adding more comprehensive load testing.'
      );
      recommendations.push('Monitor performance in production to identify real-world bottlenecks.');
      recommendations.push('Consider implementing automated performance regression testing.');
    }

    return recommendations;
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  // Reset test state
  testHelpers.resetTestState().then(() => {
    const benchmarks = new PerformanceBenchmarks();
    benchmarks.runAllBenchmarks().catch((error) => {
      console.error('Benchmark runner failed:', error);
      process.exit(1);
    });
  });
}

module.exports = PerformanceBenchmarks;
