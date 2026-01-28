#!/usr/bin/env node
/**
 * PineScript Optimizer - Refactored Version
 *
 * Strategy parameter optimization utilities
 * This is a refactored version that delegates to modular components while
 * maintaining 100% backward compatibility with the original API.
 */

const OptimizerCore = require('./optimizer-modules/optimizer-core');
const ParameterHandler = require('./optimizer-modules/parameter-handler');
const OptimizationAlgorithms = require('./optimizer-modules/optimization-algorithms');
const AnalysisReporter = require('./optimizer-modules/analysis-reporter');

class PineOptimizer {
  constructor(projectPath = process.cwd()) {
    // Initialize modules
    this.core = new OptimizerCore(projectPath);
    this.parameterHandler = new ParameterHandler();
    this.analysisReporter = new AnalysisReporter();

    // Optimization algorithms will be initialized after core setup
    this.optimizationAlgorithms = null;

    // Setup optimization methods for backward compatibility
    this.optimizationMethods = {
      grid: this.gridSearch.bind(this),
      random: this.randomSearch.bind(this),
      bayesian: this.bayesianOptimization.bind(this),
      genetic: this.geneticAlgorithm.bind(this),
    };
  }

  /**
   * Optimize strategy parameters
   */
  async optimizeStrategy(strategyFile, options = {}) {
    // Get optimization configuration from core
    const config = await this.core.optimizeStrategy(strategyFile, options);

    // Validate configuration
    const validation = this.core.validateOptimizationConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid optimization configuration: ${validation.errors.join(', ')}`);
    }

    // Parse parameter space
    const paramSpace = this.parameterHandler.parseParameterSpace(config.params);
    if (Object.keys(paramSpace).length === 0) {
      throw new Error(
        'No parameters specified for optimization. Use --params or add parameter comments.'
      );
    }

    console.log(`\n📋 Parameter Space:`);
    console.log(this.parameterHandler.formatParameterSpace(paramSpace));

    // Initialize optimization algorithms
    this.optimizationAlgorithms = new OptimizationAlgorithms(
      this.core.getBacktester(),
      this.parameterHandler
    );

    // Select optimization method
    const optimizeMethod = this.optimizationMethods[config.method];
    if (!optimizeMethod) {
      throw new Error(
        `Unsupported optimization method: ${config.method}. Available: ${Object.keys(this.optimizationMethods).join(', ')}`
      );
    }

    try {
      const results = await optimizeMethod(strategyFile, paramSpace, {
        metric: config.metric,
        iterations: config.iterations,
        walkForward: config.walkForward,
        dataSource: config.dataSource,
        dataFile: config.dataFile,
        commission: config.commission,
        initialCapital: config.initialCapital,
      });

      // Generate optimization report
      const report = this.analysisReporter.generateOptimizationReport(results, options);

      return {
        success: true,
        results,
        report,
      };
    } catch (error) {
      console.error(`Optimization failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect parameters from strategy file comments
   */
  detectParameters(strategyFile) {
    return this.core.detectParameters(strategyFile);
  }

  /**
   * Parse parameter space specification
   */
  parseParameterSpace(paramSpec) {
    return this.parameterHandler.parseParameterSpace(paramSpec);
  }

  /**
   * Grid search optimization
   */
  async gridSearch(strategyFile, paramSpace, options) {
    if (!this.optimizationAlgorithms) {
      throw new Error('Optimizer not initialized. Call optimizeStrategy() first.');
    }
    return this.optimizationAlgorithms.gridSearch(strategyFile, paramSpace, options);
  }

  /**
   * Random search optimization
   */
  async randomSearch(strategyFile, paramSpace, options) {
    if (!this.optimizationAlgorithms) {
      throw new Error('Optimizer not initialized. Call optimizeStrategy() first.');
    }
    return this.optimizationAlgorithms.randomSearch(strategyFile, paramSpace, options);
  }

  /**
   * Bayesian optimization
   */
  async bayesianOptimization(strategyFile, paramSpace, options) {
    if (!this.optimizationAlgorithms) {
      throw new Error('Optimizer not initialized. Call optimizeStrategy() first.');
    }
    return this.optimizationAlgorithms.bayesianOptimization(strategyFile, paramSpace, options);
  }

  /**
   * Genetic algorithm optimization
   */
  async geneticAlgorithm(strategyFile, paramSpace, options) {
    if (!this.optimizationAlgorithms) {
      throw new Error('Optimizer not initialized. Call optimizeStrategy() first.');
    }
    return this.optimizationAlgorithms.geneticAlgorithm(strategyFile, paramSpace, options);
  }

  /**
   * Generate grid combinations for parameter space
   */
  generateGridCombinations(paramSpace, maxCombinations = 1000) {
    return this.parameterHandler.generateGridCombinations(paramSpace, maxCombinations);
  }

  /**
   * Generate random parameters from parameter space
   */
  generateRandomParameters(paramSpace) {
    return this.parameterHandler.generateRandomParameters(paramSpace);
  }

  /**
   * Create parameterized strategy file
   */
  createParameterizedStrategy(originalFile, params) {
    return this.parameterHandler.createParameterizedStrategy(originalFile, params);
  }

  /**
   * Calculate metric score
   */
  calculateMetricScore(performance, metric) {
    if (!this.optimizationAlgorithms) {
      throw new Error('Optimizer not initialized. Call optimizeStrategy() first.');
    }
    return this.optimizationAlgorithms.calculateMetricScore(performance, metric);
  }

  /**
   * Analyze parameter sensitivity
   */
  analyzeParameterSensitivity(allResults) {
    return this.analysisReporter.analyzeParameterSensitivity(allResults);
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(results, options) {
    return this.analysisReporter.generateOptimizationReport(results, options);
  }

  /**
   * Generate console optimization report
   */
  generateConsoleOptimizationReport(results, options) {
    return this.analysisReporter.generateConsoleOptimizationReport(results, options);
  }

  /**
   * Generate HTML optimization report
   */
  generateHTMLOptimizationReport(results, options) {
    return this.analysisReporter.generateHTMLOptimizationReport(results, options);
  }

  // Getter methods for internal modules (for testing/debugging)
  getCore() {
    return this.core;
  }

  getParameterHandler() {
    return this.parameterHandler;
  }

  getOptimizationAlgorithms() {
    return this.optimizationAlgorithms;
  }

  getAnalysisReporter() {
    return this.analysisReporter;
  }

  getBacktester() {
    return this.core.getBacktester();
  }

  getProjectPath() {
    return this.core.getProjectPath();
  }
}

// Export the class
module.exports = PineOptimizer;

// CLI execution (main function)
if (require.main === module) {
  const optimizer = new PineOptimizer();

  const runOptimization = async () => {
    try {
      const args = process.argv.slice(2);

      if (args.includes('--help')) {
        console.log(`
PineScript Optimizer

Usage:
  node optimizer.js <strategy.pine> [options]

Options:
  --method <method>      Optimization method (grid, random, bayesian, genetic)
  --params <spec>        Parameter specification (e.g., "rsi_length:7-21-2,rsi_overbought:70-90-5")
  --metric <metric>      Optimization metric (sharpe, profit, winrate, maxdd, profitfactor)
  --iterations <num>     Number of iterations (default: 100)
  --walk-forward         Enable walk-forward optimization
  --data-source <src>    Data source (csv, yahoo, alpaca)
  --data-file <file>     Data file for CSV source
  --commission <amt>     Commission per trade (default: 0.1)
  --initial-capital <amt> Initial capital (default: 10000)
  --output-format <fmt>  Output format (console, json, html)
  --dry-run              Show configuration without running
  --test-params          Test parameter parsing
  --help                 Show this help

Examples:
  node optimizer.js strategy.pine --method grid --params "rsi_length:7-21-2"
  node optimizer.js strategy.pine --method random --iterations 50 --metric profit
  node optimizer.js strategy.pine --test-params
        `);
        process.exit(0);
      }

      if (args.includes('--test-params')) {
        const paramSpace = optimizer.parseParameterSpace(
          'rsi_length:7-21-2,rsi_overbought:70-90-5'
        );
        console.log('Parameter space:', paramSpace);

        const combinations = optimizer.generateGridCombinations(paramSpace, 50);
        console.log(`Generated ${combinations.length} combinations`);

        const randomParams = optimizer.generateRandomParameters(paramSpace);
        console.log('Random parameters:', randomParams);
        process.exit(0);
      }

      const strategyFile = args[0];
      if (!strategyFile || !strategyFile.endsWith('.pine')) {
        console.log('Error: First argument must be a .pine strategy file');
        console.log('Use --help for usage information.');
        process.exit(1);
      }

      const options = {};

      // Parse options
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--method' && args[i + 1]) {
          options.method = args[++i];
        } else if (args[i] === '--params' && args[i + 1]) {
          options.params = args[++i];
        } else if (args[i] === '--metric' && args[i + 1]) {
          options.metric = args[++i];
        } else if (args[i] === '--iterations' && args[i + 1]) {
          options.iterations = parseInt(args[++i], 10);
        } else if (args[i] === '--walk-forward') {
          options.walkForward = true;
        } else if (args[i] === '--data-source' && args[i + 1]) {
          options.dataSource = args[++i];
        } else if (args[i] === '--data-file' && args[i + 1]) {
          options.dataFile = args[++i];
        } else if (args[i] === '--commission' && args[i + 1]) {
          options.commission = parseFloat(args[++i]);
        } else if (args[i] === '--initial-capital' && args[i + 1]) {
          options.initialCapital = parseFloat(args[++i]);
        } else if (args[i] === '--output-format' && args[i + 1]) {
          options.outputFormat = args[++i];
        } else if (args[i] === '--dry-run') {
          options.dryRun = true;
        }
      }

      const result = await optimizer.optimizeStrategy(strategyFile, options);

      if (result.success) {
        console.log('\n✅ Optimization completed successfully!');

        if (options.outputFormat === 'json') {
          console.log(result.report);
        } else if (options.outputFormat === 'html') {
          const fs = require('fs');
          const htmlFile = `optimization_report_${Date.now()}.html`;
          fs.writeFileSync(htmlFile, result.report);
          console.log(`HTML report saved to: ${htmlFile}`);
        }
      } else {
        console.log(`❌ Optimization failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  };

  runOptimization();
}
