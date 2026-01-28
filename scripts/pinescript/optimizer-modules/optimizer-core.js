#!/usr/bin/env node
/**
 * Optimizer Core Module for PineOptimizer
 *
 * Core optimization methods: constructor, optimizeStrategy, detectParameters
 */

const fs = require('fs');
const PineBacktester = require('../backtester');

class OptimizerCore {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.backtester = new PineBacktester(projectPath);
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

    // Return optimization configuration
    return {
      strategyFile,
      method,
      metric,
      iterations,
      walkForward,
      dataSource,
      dataFile,
      commission,
      initialCapital,
      params: params || this.detectParameters(strategyFile),
    };
  }

  /**
   * Detect parameters from strategy file comments
   */
  detectParameters(strategyFile) {
    try {
      const content = fs.readFileSync(strategyFile, 'utf8');
      const lines = content.split('\n');
      const detectedParams = [];

      // Look for parameter comments like: // @param rsi_length: 14
      // or optimization hints: // @optimize rsi_length: 7-21-2
      for (const line of lines) {
        const trimmed = line.trim();

        // Check for parameter comments
        if (trimmed.startsWith('// @param') || trimmed.startsWith('// @optimize')) {
          const paramMatch = trimmed.match(/@(?:param|optimize)\s+(\w+)\s*:\s*(.+)/);
          if (paramMatch) {
            const paramName = paramMatch[1];
            const paramValue = paramMatch[2].trim();

            // Check if it's an optimization range
            if (paramValue.includes('-')) {
              detectedParams.push(`${paramName}:${paramValue}`);
            } else {
              // Single value, create a small range around it
              const numValue = parseFloat(paramValue);
              if (!isNaN(numValue)) {
                const range = Math.max(1, Math.floor(numValue * 0.2));
                detectedParams.push(`${paramName}:${numValue - range}-${numValue + range}-1`);
              }
            }
          }
        }

        // Also check for PineScript parameter declarations
        if (trimmed.includes('input.') && trimmed.includes('=')) {
          const inputMatch = trimmed.match(/(\w+)\s*=\s*input\.\w+\(([^)]+)\)/);
          if (inputMatch) {
            const paramName = inputMatch[1];
            const args = inputMatch[2];

            // Try to extract default value
            const defaultMatch = args.match(/defval\s*=\s*([^,)]+)/);
            if (defaultMatch) {
              const defaultValue = parseFloat(defaultMatch[1].trim());
              if (!isNaN(defaultValue)) {
                const range = Math.max(1, Math.floor(defaultValue * 0.2));
                detectedParams.push(
                  `${paramName}:${defaultValue - range}-${defaultValue + range}-1`
                );
              }
            }
          }
        }
      }

      if (detectedParams.length > 0) {
        console.log(`📋 Detected ${detectedParams.length} parameters for optimization`);
        return detectedParams.join(',');
      }

      return '';
    } catch (error) {
      console.log(`⚠️ Could not detect parameters: ${error.message}`);
      return '';
    }
  }

  /**
   * Get backtester instance
   */
  getBacktester() {
    return this.backtester;
  }

  /**
   * Get project path
   */
  getProjectPath() {
    return this.projectPath;
  }

  /**
   * Validate optimization configuration
   */
  validateOptimizationConfig(config) {
    const errors = [];

    if (!fs.existsSync(config.strategyFile)) {
      errors.push(`Strategy file not found: ${config.strategyFile}`);
    }

    if (!config.params || config.params.trim() === '') {
      errors.push('No parameters specified for optimization');
    }

    if (config.iterations < 1) {
      errors.push('Iterations must be at least 1');
    }

    if (config.commission < 0) {
      errors.push('Commission cannot be negative');
    }

    if (config.initialCapital <= 0) {
      errors.push('Initial capital must be positive');
    }

    const validMethods = ['grid', 'random', 'bayesian', 'genetic'];
    if (!validMethods.includes(config.method)) {
      errors.push(
        `Invalid optimization method: ${config.method}. Valid methods: ${validMethods.join(', ')}`
      );
    }

    const validMetrics = ['sharpe', 'profit', 'winrate', 'maxdd', 'profitfactor'];
    if (!validMetrics.includes(config.metric)) {
      errors.push(`Invalid metric: ${config.metric}. Valid metrics: ${validMetrics.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get optimization methods
   */
  getOptimizationMethods() {
    return {
      grid: 'Grid Search - Exhaustive search over parameter grid',
      random: 'Random Search - Random sampling of parameter space',
      bayesian: 'Bayesian Optimization - Smart sampling using probability',
      genetic: 'Genetic Algorithm - Evolutionary optimization',
    };
  }

  /**
   * Get optimization metrics
   */
  getOptimizationMetrics() {
    return {
      sharpe: 'Sharpe Ratio - Risk-adjusted returns',
      profit: 'Total Profit - Absolute profit',
      winrate: 'Win Rate - Percentage of winning trades',
      maxdd: 'Max Drawdown - Maximum loss from peak',
      profitfactor: 'Profit Factor - Gross profit / gross loss',
    };
  }
}

module.exports = OptimizerCore;
