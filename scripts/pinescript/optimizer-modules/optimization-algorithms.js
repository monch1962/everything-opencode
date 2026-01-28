#!/usr/bin/env node
/**
 * Optimization Algorithms Module for PineOptimizer
 *
 * Optimization algorithms: gridSearch, randomSearch, bayesianOptimization, geneticAlgorithm
 */

const fs = require('fs');
const path = require('path');

class OptimizationAlgorithms {
  constructor(backtester, parameterHandler) {
    this.backtester = backtester;
    this.parameterHandler = parameterHandler;
  }

  /**
   * Grid search optimization
   */
  async gridSearch(strategyFile, paramSpace, options) {
    const { metric, iterations, dataSource, dataFile, commission, initialCapital } = options;

    console.log('\n🔍 Running grid search optimization...');

    // Generate all parameter combinations
    const combinations = this.parameterHandler.generateGridCombinations(paramSpace, iterations);
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
        tempStrategy = this.parameterHandler.createParameterizedStrategy(strategyFile, params);

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
      const params = this.parameterHandler.generateRandomParameters(paramSpace);
      let tempStrategy = null;

      try {
        // Create temporary strategy with these parameters
        tempStrategy = this.parameterHandler.createParameterizedStrategy(strategyFile, params);

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
      totalCombinations: iterations,
      testedCombinations: results.length,
    };
  }

  /**
   * Bayesian optimization
   */
  async bayesianOptimization(strategyFile, paramSpace, options) {
    const { metric, iterations, dataSource, dataFile, commission, initialCapital } = options;

    console.log('\n📊 Running Bayesian optimization...');
    console.log(`   Testing ${iterations} parameter combinations`);

    // Simple implementation: random search with adaptive sampling
    const results = [];
    let bestScore = -Infinity;
    let bestParams = null;
    let bestResult = null;

    // Initial random samples
    const initialSamples = Math.min(10, Math.floor(iterations / 3));
    for (let i = 0; i < initialSamples; i++) {
      const params = this.parameterHandler.generateRandomParameters(paramSpace);
      const result = await this.evaluateParameters(strategyFile, params, options);
      if (result) {
        results.push(result);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestParams = params;
          bestResult = result.performance;
        }
      }
    }

    // Adaptive sampling based on results
    for (let i = initialSamples; i < iterations; i++) {
      const progress = (((i + 1) / iterations) * 100).toFixed(1);
      process.stdout.write(`   Progress: ${progress}% (${i + 1}/${iterations})\r`);

      // Simple heuristic: sample near good parameters
      let params;
      if (Math.random() < 0.7 && results.length > 0) {
        // Sample near best parameters
        const best = results[0];
        params = this.sampleNearParameters(best.params, paramSpace);
      } else {
        // Random sample
        params = this.parameterHandler.generateRandomParameters(paramSpace);
      }

      const result = await this.evaluateParameters(strategyFile, params, options);
      if (result) {
        results.push(result);
        results.sort((a, b) => b.score - a.score);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestParams = params;
          bestResult = result.performance;
        }
      }
    }

    console.log('\n'); // New line after progress

    return {
      method: 'bayesian',
      bestParams,
      bestScore,
      bestResult,
      allResults: results,
      totalCombinations: iterations,
      testedCombinations: results.length,
    };
  }

  /**
   * Genetic algorithm optimization
   */
  async geneticAlgorithm(strategyFile, paramSpace, options) {
    const { metric, iterations, dataSource, dataFile, commission, initialCapital } = options;

    console.log('\n🧬 Running genetic algorithm optimization...');
    console.log(`   Testing ${iterations} parameter combinations`);

    // Population size
    const populationSize = 20;
    const generations = Math.floor(iterations / populationSize);

    // Initialize population
    let population = [];
    for (let i = 0; i < populationSize; i++) {
      const params = this.parameterHandler.generateRandomParameters(paramSpace);
      const result = await this.evaluateParameters(strategyFile, params, options);
      if (result) {
        population.push({
          params,
          score: result.score,
          performance: result.performance,
        });
      }
    }

    population.sort((a, b) => b.score - a.score);

    // Evolve population
    for (let gen = 0; gen < generations; gen++) {
      const progress = (((gen + 1) / generations) * 100).toFixed(1);
      process.stdout.write(`   Generation ${gen + 1}/${generations} (${progress}%)\r`);

      // Select parents (top 50%)
      const parents = population.slice(0, Math.floor(populationSize / 2));

      // Create new generation
      const newGeneration = [...parents]; // Keep elite

      while (newGeneration.length < populationSize) {
        // Select two parents
        const parent1 = parents[Math.floor(Math.random() * parents.length)];
        const parent2 = parents[Math.floor(Math.random() * parents.length)];

        // Crossover
        const childParams = this.crossover(parent1.params, parent2.params, paramSpace);

        // Mutation
        const mutatedParams = this.mutate(childParams, paramSpace);

        // Evaluate child
        const result = await this.evaluateParameters(strategyFile, mutatedParams, options);
        if (result) {
          newGeneration.push({
            params: mutatedParams,
            score: result.score,
            performance: result.performance,
          });
        }
      }

      population = newGeneration.sort((a, b) => b.score - a.score);
    }

    console.log('\n'); // New line after progress

    const best = population[0];

    return {
      method: 'genetic',
      bestParams: best.params,
      bestScore: best.score,
      bestResult: best.performance,
      allResults: population,
      totalCombinations: iterations,
      testedCombinations: population.length,
    };
  }

  /**
   * Evaluate parameters by running backtest
   */
  async evaluateParameters(strategyFile, params, options) {
    const { metric, dataSource, dataFile, commission, initialCapital } = options;
    let tempStrategy = null;

    try {
      tempStrategy = this.parameterHandler.createParameterizedStrategy(strategyFile, params);

      const backtestResult = await this.backtester.runBacktest(tempStrategy, {
        dataSource,
        dataFile,
        commission,
        initialCapital,
        quiet: true,
      });

      if (backtestResult.success) {
        const score = this.calculateMetricScore(backtestResult.results.performance, metric);

        return {
          params,
          score,
          performance: backtestResult.results.performance,
        };
      }
    } catch (error) {
      // Skip failed backtests
    } finally {
      // Clean up temp file
      if (tempStrategy && fs.existsSync(tempStrategy) && tempStrategy.includes('.temp.')) {
        fs.unlinkSync(tempStrategy);
      }
    }

    return null;
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
   * Sample parameters near existing parameters
   */
  sampleNearParameters(baseParams, paramSpace) {
    const newParams = { ...baseParams };

    for (const [param, { min, max, step }] of Object.entries(paramSpace)) {
      if (Math.random() < 0.3) {
        // 30% chance to mutate each parameter
        const current = newParams[param];
        const mutationRange = Math.max(step, (max - min) * 0.1);
        const mutation = (Math.random() - 0.5) * 2 * mutationRange;
        let newValue = current + mutation;

        // Clamp to bounds and snap to step
        newValue = Math.max(min, Math.min(max, newValue));
        const steps = Math.round((newValue - min) / step);
        newParams[param] = Number((min + steps * step).toFixed(6));
      }
    }

    return newParams;
  }

  /**
   * Crossover two parameter sets
   */
  crossover(params1, params2, paramSpace) {
    const child = {};

    for (const param of Object.keys(paramSpace)) {
      // Randomly choose from parent1 or parent2
      child[param] = Math.random() < 0.5 ? params1[param] : params2[param];
    }

    return child;
  }

  /**
   * Mutate parameters
   */
  mutate(params, paramSpace) {
    const mutated = { ...params };

    for (const [param, { min, max, step }] of Object.entries(paramSpace)) {
      if (Math.random() < 0.1) {
        // 10% mutation rate
        const steps = Math.floor((max - min) / step) + 1;
        const randomStep = Math.floor(Math.random() * steps);
        mutated[param] = Number((min + randomStep * step).toFixed(6));
      }
    }

    return mutated;
  }

  /**
   * Get algorithm descriptions
   */
  getAlgorithmDescriptions() {
    return {
      grid: 'Exhaustive search over parameter grid. Best for small parameter spaces.',
      random: 'Random sampling of parameter space. Good for large spaces.',
      bayesian: 'Smart sampling using probability models. Efficient for expensive evaluations.',
      genetic: 'Evolutionary optimization using selection, crossover, and mutation.',
    };
  }
}

module.exports = OptimizationAlgorithms;
