#!/usr/bin/env node
/**
 * Analysis Reporter Module for PineOptimizer
 *
 * Analysis and reporting methods: analyzeParameterSensitivity, generateOptimizationReport,
 * generateConsoleOptimizationReport, generateHTMLOptimizationReport
 */

class AnalysisReporter {
  constructor() {
    // No initialization needed
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
   * Generate optimization report
   */
  generateOptimizationReport(results, options) {
    const { outputFormat = 'console' } = options;

    switch (outputFormat) {
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'html':
        return this.generateHTMLOptimizationReport(results, options);
      case 'console':
      default:
        return this.generateConsoleOptimizationReport(results, options);
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
        `  Net Profit: $${perf.netProfit.toFixed(2)} (${((perf.netProfit / bestResult.parameters.initialCapital) * 100).toFixed(2)}%)`
      );
      console.log(`  Total Trades: ${perf.totalTrades}`);
      console.log(`  Win Rate: ${(perf.winRate * 100).toFixed(2)}%`);
      console.log(`  Profit Factor: ${perf.profitFactor.toFixed(2)}`);
      console.log(`  Sharpe Ratio: ${perf.sharpeRatio.toFixed(2)}`);
      console.log(`  Max Drawdown: ${perf.maxDrawdownPct.toFixed(2)}%`);
      console.log(`  Recovery Factor: ${perf.recoveryFactor.toFixed(2)}`);
    }

    // Show top 5 results
    if (allResults.length > 1) {
      console.log('\n🏅 TOP 5 PARAMETER COMBINATIONS:');
      console.log('─'.repeat(40));
      const topResults = allResults.slice(0, 5);
      topResults.forEach((result, i) => {
        console.log(`\n${i + 1}. Score: ${result.score.toFixed(4)}`);
        Object.entries(result.params).forEach(([param, value]) => {
          console.log(`   ${param}: ${value}`);
        });
      });
    }

    // Parameter sensitivity analysis
    if (allResults.length >= 5) {
      const sensitivities = this.analyzeParameterSensitivity(allResults);
      console.log('\n📈 PARAMETER SENSITIVITY ANALYSIS:');
      console.log('─'.repeat(40));
      Object.entries(sensitivities)
        .sort(([, a], [, b]) => b - a)
        .forEach(([param, sensitivity]) => {
          const sensitivityLevel =
            sensitivity > 0.3 ? 'High' : sensitivity > 0.1 ? 'Medium' : 'Low';
          console.log(`  ${param}: ${sensitivity.toFixed(4)} (${sensitivityLevel})`);
        });
    }

    console.log(`\n${'='.repeat(60)}`);

    return results;
  }

  /**
   * Generate HTML optimization report
   */
  generateHTMLOptimizationReport(results, options) {
    const { method, bestParams, bestScore, allResults } = results;
    const { metric } = options;

    // Get top 10 results for the table
    const topResults = allResults.slice(0, 10);

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
        .sensitivity-high { color: #e74c3c; font-weight: bold; }
        .sensitivity-medium { color: #f39c12; }
        .sensitivity-low { color: #27ae60; }
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
        <p>Best ${metric} score: <strong>${bestScore.toFixed(4)}</strong></p>
        <div>
            ${Object.entries(bestParams)
              .map(([param, value]) => `<span class="param">${param}: ${value}</span>`)
              .join('')}
        </div>
    </div>

    <h2>Top Parameter Combinations</h2>
    <table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Score</th>
                ${Object.keys(bestParams)
                  .map((param) => `<th>${param}</th>`)
                  .join('')}
            </tr>
        </thead>
        <tbody>
            ${topResults
              .map(
                (result, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td class="score-${result.score > bestScore * 0.9 ? 'good' : result.score > bestScore * 0.7 ? 'avg' : 'poor'}">
                        ${result.score.toFixed(4)}
                    </td>
                    ${Object.values(result.params)
                      .map((value) => `<td>${value}</td>`)
                      .join('')}
                </tr>
            `
              )
              .join('')}
        </tbody>
    </table>

    ${
      allResults.length >= 5
        ? `
    <h2>Parameter Sensitivity Analysis</h2>
    <table>
        <thead>
            <tr>
                <th>Parameter</th>
                <th>Sensitivity</th>
                <th>Impact</th>
            </tr>
        </thead>
        <tbody>
            ${(() => {
              const sensitivities = this.analyzeParameterSensitivity(allResults);
              return Object.entries(sensitivities)
                .sort(([, a], [, b]) => b - a)
                .map(
                  ([param, sensitivity]) => `
                    <tr>
                        <td>${param}</td>
                        <td>${sensitivity.toFixed(4)}</td>
                        <td class="sensitivity-${sensitivity > 0.3 ? 'high' : sensitivity > 0.1 ? 'medium' : 'low'}">
                            ${sensitivity > 0.3 ? 'High' : sensitivity > 0.1 ? 'Medium' : 'Low'}
                        </td>
                    </tr>
                `
                )
                .join('');
            })()}
        </tbody>
    </table>
    `
        : ''
    }

    <h2>Optimization Details</h2>
    <ul>
        <li>Method: ${method.toUpperCase()}</li>
        <li>Metric: ${metric.toUpperCase()}</li>
        <li>Total combinations tested: ${allResults.length}</li>
        <li>Best score: ${bestScore.toFixed(4)}</li>
        <li>Generated: ${new Date().toLocaleString()}</li>
    </ul>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d;">
        <p>Generated by PineScript Optimizer</p>
    </footer>
</body>
</html>`;
  }

  /**
   * Generate JSON report
   */
  generateJSONReport(results, options) {
    const report = {
      metadata: {
        generated: new Date().toISOString(),
        method: results.method,
        metric: options.metric,
        totalCombinations: results.totalCombinations,
        testedCombinations: results.testedCombinations,
      },
      bestParameters: results.bestParams,
      bestScore: results.bestScore,
      topResults: results.allResults.slice(0, 10),
      parameterSensitivity: this.analyzeParameterSensitivity(results.allResults),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate summary statistics
   */
  generateSummaryStatistics(results) {
    const scores = results.allResults.map((r) => r.score);

    if (scores.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
      };
    }

    // Calculate statistics
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: scores.length,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      min: Number(Math.min(...scores).toFixed(4)),
      max: Number(Math.max(...scores).toFixed(4)),
      range: Number((Math.max(...scores) - Math.min(...scores)).toFixed(4)),
    };
  }

  /**
   * Export results to CSV
   */
  exportResultsToCSV(results, filename) {
    const { allResults } = results;

    if (allResults.length === 0) {
      return '';
    }

    const paramNames = Object.keys(allResults[0].params);
    const headers = ['score', ...paramNames].join(',');

    const rows = allResults.map((result) => {
      const score = result.score.toFixed(6);
      const paramValues = paramNames.map((param) => result.params[param]);
      return [score, ...paramValues].join(',');
    });

    return `${headers}\n${rows.join('\n')}`;
  }

  /**
   * Export results to JSON
   */
  exportResultsToJSON(results, filename) {
    return JSON.stringify(results, null, 2);
  }
}

module.exports = AnalysisReporter;
