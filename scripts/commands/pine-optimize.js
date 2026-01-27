#!/usr/bin/env node

const fs = require('fs');
const { PineCommandRunner } = require('../pinescript/command-runner');
const { PineScriptOptimizer } = require('../pinescript/optimizer');
const path = require('path');

class PineOptimizeCommand extends PineCommandRunner {
  constructor() {
    super('pine-optimize', 'Optimize PineScript strategy parameters');
  }

  async run(args) {
    try {
      const config = await this.loadConfig();
      const pineConfig = config.pinescript;

      if (!pineConfig) {
        this.error('PineScript configuration not found. Run /pine-setup first.');
        return 1;
      }

      const options = this.parseArgs(args, {
        file: {
          type: 'string',
          alias: 'f',
          description: 'PineScript file to optimize',
        },
        method: {
          type: 'string',
          alias: 'm',
          description: 'Optimization method (grid, random, bayesian, genetic)',
          default: 'grid',
        },
        iterations: {
          type: 'number',
          alias: 'i',
          description: 'Number of optimization iterations',
          default: 100,
        },
        metric: {
          type: 'string',
          alias: 'M',
          description: 'Optimization metric (net_profit, sharpe, win_rate, profit_factor)',
          default: 'net_profit',
        },
        output: {
          type: 'string',
          alias: 'o',
          description: 'Output format (console, json, html, csv)',
          default: 'console',
        },
        outputFile: {
          type: 'string',
          alias: 'O',
          description: 'Output file path',
        },
        paramSpace: {
          type: 'string',
          alias: 'p',
          description: 'Parameter space definition file (JSON)',
        },
        verbose: { type: 'boolean', alias: 'v', description: 'Verbose output' },
      });

      const pineFile = options.file || this.findPineScriptFile();
      if (!pineFile) {
        this.error('No PineScript file specified and none found in current directory.');
        return 1;
      }

      if (!this.validatePineScriptFile(pineFile)) {
        this.error(`Invalid PineScript file: ${pineFile}`);
        return 1;
      }

      this.log(`Optimizing PineScript strategy: ${pineFile}`);
      this.log(
        `Method: ${options.method}, Iterations: ${options.iterations}, Metric: ${options.metric}`,
      );

      const optimizer = new PineScriptOptimizer({
        pineFile,
        method: options.method,
        iterations: options.iterations,
        metric: options.metric,
        verbose: options.verbose,
      });

      let paramSpace;
      if (options.paramSpace) {
        try {
          const paramSpacePath = path.resolve(options.paramSpace);
          paramSpace = require(paramSpacePath);
          this.log(`Loaded parameter space from: ${options.paramSpace}`);
        } catch (err) {
          this.error(`Failed to load parameter space file: ${err.message}`);
          return 1;
        }
      } else {
        paramSpace = this.generateDefaultParamSpace(pineFile);
        this.log('Using default parameter space');
      }

      this.log('Starting optimization...');
      const startTime = Date.now();

      const results = await optimizer.optimize(paramSpace);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      this.log(`Optimization completed in ${duration.toFixed(2)} seconds`);

      const bestParams = results.bestParameters;
      const bestScore = results.bestScore;

      this.log('\n=== OPTIMIZATION RESULTS ===');
      this.log(`Best ${options.metric}: ${bestScore.toFixed(4)}`);
      this.log('Best parameters:');
      for (const [param, value] of Object.entries(bestParams)) {
        this.log(`  ${param}: ${value}`);
      }

      if (results.allResults && results.allResults.length > 0) {
        this.log(`\nEvaluated ${results.allResults.length} parameter combinations`);

        if (options.verbose) {
          this.log('\nTop 10 parameter combinations:');
          const topResults = results.allResults.sort((a, b) => b.score - a.score).slice(0, 10);

          topResults.forEach((result, index) => {
            this.log(`${index + 1}. Score: ${result.score.toFixed(4)}`);
            this.log(`   Parameters: ${JSON.stringify(result.parameters)}`);
          });
        }
      }

      if (results.sensitivity && Object.keys(results.sensitivity).length > 0) {
        this.log('\nParameter sensitivity analysis:');
        for (const [param, sensitivity] of Object.entries(results.sensitivity)) {
          this.log(`  ${param}: ${sensitivity.toFixed(4)}`);
        }
      }

      if (options.outputFile) {
        await optimizer.generateReport(results, options.output, options.outputFile);
        this.log(`\nReport saved to: ${options.outputFile}`);
      } else if (options.output !== 'console') {
        const report = await optimizer.generateReport(results, options.output);
        this.log(`\n${report}`);
      }

      return 0;
    } catch (error) {
      this.error(`Optimization failed: ${error.message}`);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      return 1;
    }
  }

  generateDefaultParamSpace(pineFile) {
    const fileName = path.basename(pineFile).toLowerCase();

    const defaultSpaces = {
      rsi: {
        rsi_length: { min: 5, max: 30, step: 1, type: 'integer' },
        rsi_overbought: { min: 60, max: 90, step: 5, type: 'integer' },
        rsi_oversold: { min: 10, max: 40, step: 5, type: 'integer' },
      },
      macd: {
        fast_length: { min: 8, max: 20, step: 1, type: 'integer' },
        slow_length: { min: 21, max: 35, step: 1, type: 'integer' },
        signal_length: { min: 5, max: 15, step: 1, type: 'integer' },
      },
      sma: {
        fast_length: { min: 5, max: 20, step: 1, type: 'integer' },
        slow_length: { min: 21, max: 50, step: 1, type: 'integer' },
      },
      ema: {
        fast_length: { min: 5, max: 20, step: 1, type: 'integer' },
        slow_length: { min: 21, max: 50, step: 1, type: 'integer' },
      },
      bollinger: {
        length: { min: 10, max: 30, step: 1, type: 'integer' },
        stddev: { min: 1.5, max: 3.0, step: 0.1, type: 'float' },
      },
    };

    for (const [indicator, paramSpace] of Object.entries(defaultSpaces)) {
      if (fileName.includes(indicator)) {
        return paramSpace;
      }
    }

    return {
      param1: { min: 5, max: 50, step: 5, type: 'integer' },
      param2: { min: 10, max: 100, step: 10, type: 'integer' },
      param3: { min: 0.1, max: 1.0, step: 0.1, type: 'float' },
    };
  }

  async validatePineScriptFile(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');

      const isStrategy =
        content.includes('strategy(') ||
        content.includes('strategy.entry') ||
        content.includes('strategy.exit');

      if (!isStrategy) {
        this.warn(
          'File does not appear to be a strategy (no strategy() calls found). Optimization may not be meaningful.',
        );
      }

      const hasInputs =
        content.includes('input.') ||
        content.includes('input(') ||
        content.match(/input\s+\w+\s*=/);

      if (!hasInputs) {
        this.warn('No input parameters found. Optimization requires input parameters to vary.');
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }
}

if (require.main === module) {
  const command = new PineOptimizeCommand();
  command.execute(process.argv.slice(2));
}

module.exports = PineOptimizeCommand;
