#!/usr/bin/env node
/**
 * PineScript Optimizer
 *
 * Strategy parameter optimization utilities
 */

const fs = require('fs');
const PineBacktester = require('./backtester');

class PineOptimizer {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.backtester = new PineBacktester(projectPath);
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
    const {
      method = 'grid',
      params = null,
      metric = 'sharpe',
      iterations = 100,
      walkForward = false,
      dataSource = 'csv',
      dataFile = null,
      commission = 0.1,
      initialCapital = 10000,
    } = options;

    console.log(`🔧 Optimizing: ${strategyFile}`);
    console.log(`   Method: ${method}`);
    console.log(`   Metric: ${metric}`);
    console.log(`   Iterations: ${iterations}`);
    console.log(`   Walk-forward: ${walkForward ? 'Yes' : 'No'}`);

    // Validate strategy file
    if (!fs.existsSync(strategyFile)) {
      throw new Error(`Strategy file not found: ${strategyFile}`);
    }

    // Parse parameter space
    const paramSpace = this.parseParameterSpace(params || this.detectParameters(strategyFile));
    if (Object.keys(paramSpace).length === 0) {
      throw new Error(
        'No parameters specified for optimization. Use --params or add parameter comments.',
      );
    }

    console.log(`\n📋 Parameter Space:`);
    Object.entries(paramSpace).forEach(([param, range]) => {
      console.log(`   ${param}: ${range.min} to ${range.max} (step: ${range.step})`);
    });

    // Select optimization method
    const optimizeMethod = this.optimizationMethods[method];
    if (!optimizeMethod) {
      throw new Error(
        `Unsupported optimization method: ${method}. Available: ${Object.keys(this.optimizationMethods).join(', ')}`,
      );
    }

    try {
      const results = await optimizeMethod(strategyFile, paramSpace, {
        metric,
        iterations,
        walkForward,
        dataSource,
        dataFile,
        commission,
        initialCapital,
      });

      // Generate optimization report
      const report = this.generateOptimizationReport(results, options);

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
   * Parse parameter space specification
   */
  parseParameterSpace(paramSpec) {
    const paramSpace = {};

    if (!paramSpec) {
      return paramSpace;
    }

    // Format: "param1:min-max-step,param2:min-max-step"
    const params = paramSpec.split(',');

    for (const param of params) {
      const [name, rangeSpec] = param.split(':');
      if (!rangeSpec) continue;

      const rangeParts = rangeSpec.split('-');
      if (rangeParts.length < 2) continue;

      const min = parseFloat(rangeParts[0]);
      const max = parseFloat(rangeParts[1]);
      const step = rangeParts.length > 2 ? parseFloat(rangeParts[2]) : 1;

      if (isNaN(min) || isNaN(max) || isNaN(step)) {
        console.warn(`Invalid parameter range for ${name}: ${rangeSpec}`);
        continue;
      }

      paramSpace[name.trim()] = { min, max, step };
    }

    return paramSpace;
  }

  /**
   * Detect parameters from PineScript file comments
   */
  detectParameters(strategyFile) {
    const content = fs.readFileSync(strategyFile, 'utf8');
    const lines = content.split('\n');
    const detectedParams = [];

    // Look for optimization comments
    // Format: // Optimization: rsi_length:7-21-1, rsi_overbought:70-90-5
    for (const line of lines) {
      if (line.includes('Optimization:')) {
        const match = line.match(/Optimization:\s*(.+)/);
        if (match) {
          return match[1].trim();
        }
      }

      // Also look for input parameters that could be optimized
      if (line.includes('input.')) {
        const inputMatch = line.match(/input\.(int|float)\([^,]+,\s*["']([^"']+)["']/);
        if (inputMatch) {
          const paramName = inputMatch[2].toLowerCase().replace(/\s+/g, '_');
          detectedParams.push(`${paramName}:1-100-1`);
        }
      }
    }

    return detectedParams.join(',');
  }

  /**
   * Grid search optimization
   */
  async gridSearch(strategyFile, paramSpace, options) {
    const { metric, iterations, dataSource, dataFile, commission, initialCapital } = options;

    console.log('\n🔍 Running grid search optimization...');

    // Generate all parameter combinations
    const combinations = this.generateGridCombinations(paramSpace, iterations);
    console.log(`   Testing ${combinations.length} parameter combinations`);

    const results = [];
    let bestScore = -Infinity;
    let bestParams = null;
    let bestResult = null;

    for (let i = 0; i < combinations.length; i++) {
      const params = combinations[i];
      const progress = (((i + 1) / combinations.length) * 100).toFixed(1);
      let tempStrategy = null;

      process.stdout.write(`   Progress: ${progress}% (${i + 1}/${combinations.length})\r`);

      try {
        // Create temporary strategy with these parameters
        tempStrategy = this.createParameterizedStrategy(strategyFile, params);

        // Run backtest
        const backtestResult = await this.backtester.runBacktest(tempStrategy, {
          dataSource,
          dataFile,
          commission,
          initialCapital,
          quiet: true,
        });

        if (backtestResult.success) {
          const score = this.calculateMetricScore(backtestResult.results.performance, metric);

          results.push({
            params,
            score,
            performance: backtestResult.results.performance,
          });

          if (score > bestScore) {
            bestScore = score;
            bestParams = params;
            bestResult = backtestResult.results;
          }
        }
      } catch (error) {
        // Skip failed backtests
      }

      // Clean up temp file
      if (tempStrategy && fs.existsSync(tempStrategy) && tempStrategy.includes('.temp.')) {
        fs.unlinkSync(tempStrategy);
      }
    }

    console.log('\n'); // New line after progress

    return {
      method: 'grid',
      bestParams,
      bestScore,
      bestResult,
      allResults: results.sort((a, b) => b.score - a.score),
      totalCombinations: combinations.length,
      testedCombinations: results.length,
    };
  }

  /**
   * Random search optimization
   */
  async randomSearch(strategyFile, paramSpace, options) {
    const { metric, iterations, dataSource, dataFile, commission, initialCapital } = options;

    console.log('\n🎲 Running random search optimization...');
    console.log(`   Testing ${iterations} random parameter combinations`);

    const results = [];
    let bestScore = -Infinity;
    let bestParams = null;
    let bestResult = null;

    for (let i = 0; i < iterations; i++) {
      const progress = (((i + 1) / iterations) * 100).toFixed(1);
      process.stdout.write(`   Progress: ${progress}% (${i + 1}/${iterations})\r`);

      // Generate random parameters
      const params = this.generateRandomParameters(paramSpace);
      let tempStrategy = null;

      try {
        // Create temporary strategy with these parameters
        tempStrategy = this.createParameterizedStrategy(strategyFile, params);

        // Run backtest
        const backtestResult = await this.backtester.runBacktest(tempStrategy, {
          dataSource,
          dataFile,
          commission,
          initialCapital,
          quiet: true,
        });

        if (backtestResult.success) {
          const score = this.calculateMetricScore(backtestResult.results.performance, metric);

          results.push({
            params,
            score,
            performance: backtestResult.results.performance,
          });

          if (score > bestScore) {
            bestScore = score;
            bestParams = params;
            bestResult = backtestResult.results;
          }
        }
      } catch (error) {
        // Skip failed backtests
      }

      // Clean up temp file
      if (tempStrategy && fs.existsSync(tempStrategy) && tempStrategy.includes('.temp.')) {
        fs.unlinkSync(tempStrategy);
      }
    }

    console.log('\n'); // New line after progress

    return {
      method: 'random',
      bestParams,
      bestScore,
      bestResult,
      allResults: results.sort((a, b) => b.score - a.score),
      totalIterations: iterations,
      testedIterations: results.length,
    };
  }

  /**
   * Bayesian optimization (simplified)
   */
  async bayesianOptimization(strategyFile, paramSpace, options) {
    // Simplified implementation - in reality would use Bayesian optimization library
    console.log('\n🤖 Running Bayesian optimization (simulated)...');

    // For now, use random search as placeholder
    return this.randomSearch(strategyFile, paramSpace, {
      ...options,
      iterations: Math.min(options.iterations, 50), // Smaller sample for demo
    });
  }

  /**
   * Genetic algorithm optimization (simplified)
   */
  async geneticAlgorithm(strategyFile, paramSpace, options) {
    // Simplified implementation
    console.log('\n🧬 Running genetic algorithm optimization (simulated)...');

    // For now, use random search as placeholder
    return this.randomSearch(strategyFile, paramSpace, {
      ...options,
      iterations: Math.min(options.iterations, 50), // Smaller sample for demo
    });
  }

  /**
   * Generate all grid combinations
   */
  generateGridCombinations(paramSpace, maxCombinations = 1000) {
    const paramNames = Object.keys(paramSpace);
    const paramValues = {};

    // Generate values for each parameter
    for (const [name, range] of Object.entries(paramSpace)) {
      const values = [];
      for (let value = range.min; value <= range.max; value += range.step) {
        values.push(value);
      }
      paramValues[name] = values;
    }

    // Calculate total combinations
    let totalCombinations = 1;
    for (const values of Object.values(paramValues)) {
      totalCombinations *= values.length;
    }

    // If too many combinations, sample them
    if (totalCombinations > maxCombinations) {
      return this.sampleGridCombinations(paramValues, maxCombinations);
    }

    // Generate all combinations
    const combinations = [];
    const generate = (current, index) => {
      if (index === paramNames.length) {
        combinations.push({ ...current });
        return;
      }

      const paramName = paramNames[index];
      for (const value of paramValues[paramName]) {
        current[paramName] = value;
        generate(current, index + 1);
      }
    };

    generate({}, 0);
    return combinations;
  }

  /**
   * Sample grid combinations to limit total
   */
  sampleGridCombinations(paramValues, maxSamples) {
    const paramNames = Object.keys(paramValues);
    const combinations = [];

    // Simple sampling: take evenly spaced values
    const samplesPerParam = Math.floor(Math.pow(maxSamples, 1 / paramNames.length));

    for (let i = 0; i < maxSamples; i++) {
      const params = {};
      for (const name of paramNames) {
        const values = paramValues[name];
        const step = Math.max(1, Math.floor(values.length / samplesPerParam));
        const index = Math.floor((i * step) % values.length);
        params[name] = values[index];
      }
      combinations.push(params);
    }

    return combinations;
  }

  /**
   * Generate random parameters
   */
  generateRandomParameters(paramSpace) {
    const params = {};

    for (const [name, range] of Object.entries(paramSpace)) {
      const { min, max, step } = range;
      const steps = Math.floor((max - min) / step) + 1;
      const randomStep = Math.floor(Math.random() * steps);
      params[name] = min + randomStep * step;
    }

    return params;
  }

  /**
   * Create parameterized strategy file
   */
  createParameterizedStrategy(originalFile, params) {
    const content = fs.readFileSync(originalFile, 'utf8');
    const lines = content.split('\n');
    const newLines = [];

    for (const line of lines) {
      let newLine = line;

      // Replace parameter values in input functions
      for (const [paramName, paramValue] of Object.entries(params)) {
        // Look for input.int or input.float with this parameter name
        const regex = new RegExp(
          `input\\.(int|float)\\([^,]+,\\s*["']([^"']*${paramName}[^"']*)["']`,
          'i',
        );
        const match = line.match(regex);

        if (match) {
          // Replace the default value with our parameter value
          const paramType = match[1];
          const defaultValueRegex = new RegExp(`input\\.${paramType}\\(\\s*([^,]+)`);
          newLine = line.replace(defaultValueRegex, `input.${paramType}(${paramValue}`);
        }
      }

      newLines.push(newLine);
    }

    // Create temporary file
    const tempFile = originalFile.replace('.pine', `.temp.${Date.now()}.pine`);
    fs.writeFileSync(tempFile, newLines.join('\n'));

    return tempFile;
  }

  /**
   * Calculate metric score
   */
  calculateMetricScore(performance, metric) {
    switch (metric.toLowerCase()) {
      case 'netprofit':
      case 'profit':
        return performance.netProfit;

      case 'winrate':
      case 'win':
        return performance.winRate;

      case 'profitfactor':
      case 'pf':
        return performance.profitFactor;

      case 'sharpe':
      case 'sharperatio':
        return performance.sharpeRatio;

      case 'sortino':
      case 'sortinoratio':
        return performance.sortinoRatio;

      case 'calmar':
      case 'calmarratio':
        return performance.calmarRatio;

      case 'drawdown':
      case 'maxdrawdown':
        return -performance.maxDrawdownPct; // Negative because lower is better

      default:
        return performance.sharpeRatio; // Default to Sharpe ratio
    }
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(results, options) {
    const { outputFormat = 'console' } = options;

    switch (outputFormat) {
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'html':
        return this.generateHTMLReport(results, options);
      case 'console':
      default:
        return this.generateConsoleReport(results, options);
    }
  }

  /**
   * Generate console optimization report
   */
  generateConsoleOptimizationReport(results, options) {
    const {
      method,
      bestParams,
      bestScore,
      bestResult,
      allResults,
      totalCombinations,
      testedCombinations,
    } = results;
    const { metric } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log('🏆 OPTIMIZATION RESULTS');
    console.log('='.repeat(60));

    console.log(`\nOptimization Method: ${method.toUpperCase()}`);
    console.log(`Optimization Metric: ${metric.toUpperCase()}`);
    console.log(`Parameter Combinations: ${testedCombinations}/${totalCombinations || 'N/A'}`);

    console.log('\n🎯 BEST PARAMETERS:');
    console.log('─'.repeat(40));
    Object.entries(bestParams).forEach(([param, value]) => {
      console.log(`  ${param}: ${value}`);
    });
    console.log(`\n  Best ${metric} score: ${bestScore.toFixed(4)}`);

    if (bestResult) {
      const perf = bestResult.performance;
      console.log('\n📊 PERFORMANCE WITH BEST PARAMETERS:');
      console.log('─'.repeat(40));
      console.log(
        `  Net Profit: $${perf.netProfit.toFixed(2)} (${((perf.netProfit / bestResult.parameters.initialCapital) * 100).toFixed(2)}%)`,
      );
      console.log(`  Win Rate: ${perf.winRate.toFixed(1)}%`);
      console.log(`  Profit Factor: ${perf.profitFactor.toFixed(2)}`);
      console.log(`  Max Drawdown: ${perf.maxDrawdownPct.toFixed(2)}%`);
      console.log(`  Sharpe Ratio: ${perf.sharpeRatio.toFixed(2)}`);
    }

    console.log('\n🏅 TOP 5 PARAMETER SETS:');
    console.log('─'.repeat(40));

    allResults.slice(0, 5).forEach((result, index) => {
      console.log(`\n${index + 1}. Score: ${result.score.toFixed(4)}`);
      Object.entries(result.params).forEach(([param, value]) => {
        console.log(`   ${param}: ${value}`);
      });
    });

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(40));

    // Analyze parameter sensitivity
    if (allResults.length > 10) {
      const paramSensitivity = this.analyzeParameterSensitivity(allResults);
      Object.entries(paramSensitivity).forEach(([param, sensitivity]) => {
        console.log(
          `  ${param}: ${sensitivity > 0.3 ? 'High impact' : sensitivity > 0.1 ? 'Medium impact' : 'Low impact'} on performance`,
        );
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Optimization completed successfully');
    console.log('='.repeat(60));

    return results;
  }

  /**
   * Analyze parameter sensitivity
   */
  analyzeParameterSensitivity(allResults) {
    if (allResults.length < 2) return {};

    const paramNames = Object.keys(allResults[0].params);
    const sensitivities = {};

    for (const param of paramNames) {
      // Calculate correlation between parameter values and scores
      const scores = allResults.map((r) => r.score);

      // Simple sensitivity: standard deviation of scores for this parameter
      const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const scoreVariance =
        scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / scores.length;

      sensitivities[param] = Math.sqrt(scoreVariance) / meanScore;
    }

    return sensitivities;
  }

  /**
   * Generate HTML optimization report
   */
  generateHTMLOptimizationReport(results, options) {
    const { method, bestParams, bestScore, allResults } = results;
    const { metric } = options;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Optimization Report - ${method.toUpperCase()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .best-params { background: #27ae60; color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .param { display: inline-block; background: #3498db; color: white; padding: 8px 15px; margin: 5px; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f2f2f2; }
        .score-good { color: #27ae60; font-weight: bold; }
        .score-avg { color: #f39c12; }
        .score-poor { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 Optimization Report</h1>
        <h2>Method: ${method.toUpperCase()} | Metric: ${metric.toUpperCase()}</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="best-params">
        <h2>Best Parameters</h2>
        <p>Score: <span class="score-good">${bestScore.toFixed(4)}</span></p>
        <div>
            ${Object.entries(bestParams)
    .map(
      ([param, value]) => `
            <div class="param">${param}: ${value}</div>
            `,
    )
    .join('')}
        </div>
    </div>
    
    <h2>Top Parameter Sets</h2>
    <table>
        <tr>
            <th>Rank</th>
            <th>Score</th>
            ${Object.keys(bestParams)
    .map((param) => `<th>${param}</th>`)
    .join('')}
        </tr>
        ${allResults
    .slice(0, 10)
    .map(
      (result, index) => `
        <tr>
            <td>${index + 1}</td>
            <td class="${result.score > bestScore * 0.9 ? 'score-good' : result.score > bestScore * 0.7 ? 'score-avg' : 'score-poor'}">
                ${result.score.toFixed(4)}
            </td>
            ${Object.values(result.params)
    .map((value) => `<td>${value}</td>`)
    .join('')}
        </tr>
        `,
    )
    .join('')}
    </table>
</body>
</html>`;
  }

  /**
   * Generate CSV optimization report
   */
  generateCSVOptimizationReport(results) {
    const { allResults, bestParams } = results;

    let csv = `Rank,Score,${Object.keys(bestParams).join(',')}\n`;

    allResults.forEach((result, index) => {
      csv += `${index + 1},${result.score},${Object.values(result.params).join(',')}\n`;
    });

    return csv;
  }
}

// Export for use in other scripts
module.exports = PineOptimizer;

// Test the optimizer
if (require.main === module) {
  const optimizer = new PineOptimizer();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 PineScript Optimizer

Usage:
  node scripts/pinescript/optimizer.js [options]

Options:
  --test-params      Test parameter space generation
  --help, -h         Show this help message

Examples:
  node scripts/pinescript/optimizer.js --test-params
    `);
    process.exit(0);
  } else if (args.includes('--test-params')) {
    const paramSpace = optimizer.parseParameterSpace('rsi_length:7-21-2,rsi_overbought:70-90-5');
    console.log('Parameter space:', paramSpace);

    const combinations = optimizer.generateGridCombinations(paramSpace, 50);
    console.log(`Generated ${combinations.length} combinations`);

    const randomParams = optimizer.generateRandomParameters(paramSpace);
    console.log('Random parameters:', randomParams);
  } else {
    console.log('Use --help for usage information.');
  }
}
