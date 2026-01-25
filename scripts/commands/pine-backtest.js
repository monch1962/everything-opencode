#!/usr/bin/env node
/**
 * /pine-backtest command wrapper
 *
 * Run backtesting on PineScript strategies
 */

const PineCommandRunner = require("../pinescript/command-runner");
const PineBacktester = require("../pinescript/backtester");

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const files = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--data" || arg === "-d") {
      options.dataFile = args[++i];
    } else if (arg === "--data-source" || arg === "-s") {
      options.dataSource = args[++i];
    } else if (arg === "--from" || arg === "-f") {
      options.fromDate = args[++i];
    } else if (arg === "--to" || arg === "-t") {
      options.toDate = args[++i];
    } else if (arg === "--commission" || arg === "-c") {
      options.commission = parseFloat(args[++i]);
    } else if (arg === "--slippage" || arg === "-S") {
      options.slippage = parseFloat(args[++i]);
    } else if (arg === "--capital" || arg === "-C") {
      options.initialCapital = parseFloat(args[++i]);
    } else if (arg === "--report" || arg === "-r") {
      options.report = args[++i];
    } else if (arg === "--output" || arg === "-o") {
      options.outputFile = args[++i];
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--quiet" || arg === "-q") {
      options.quiet = true;
    } else if (arg === "--json") {
      options.report = "json";
    } else if (arg === "--html") {
      options.report = "html";
    } else if (arg === "--csv") {
      options.report = "csv";
    } else if (arg === "--check-tools") {
      options.checkTools = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      files.push(arg);
    }
  }

  // Check tools if requested
  if (options.checkTools) {
    const backtester = new PineBacktester();
    const tools = await backtester.checkBacktestingTools();

    console.log("\n🔧 Backtesting Tools Status:");
    if (tools.available.length > 0) {
      console.log(`✅ Available: ${tools.available.join(", ")}`);
    }
    if (tools.missing.length > 0) {
      console.log(`❌ Missing: ${tools.missing.join(", ")}`);
      console.log(
        "\n💡 Install missing tools for full backtesting capabilities.",
      );
    }
    process.exit(0);
  }

  // Validate we have files to backtest
  if (files.length === 0) {
    console.error("Error: No PineScript files specified");
    console.error("Usage: /pine-backtest <strategy.pine> [options]");
    console.error("Use /pine-backtest --help for more information");
    process.exit(1);
  }

  try {
    const runner = new PineCommandRunner();
    await runner.initialize();

    const backtester = new PineBacktester();

    // Check if this is a strategy (not an indicator)
    for (const file of files) {
      const content = runner.readPineFile(file);
      if (!content.includes("strategy(")) {
        console.error(
          `❌ ${file} is not a strategy (missing strategy() function)`,
        );
        console.error(
          "   Backtesting requires a trading strategy, not an indicator.",
        );
        process.exit(1);
      }
    }

    const allResults = [];

    for (const file of files) {
      if (!options.quiet) {
        console.log(`\n📊 Backtesting: ${file}`);
      }

      try {
        const result = await backtester.runBacktest(file, options);

        if (result.success) {
          allResults.push(result);

          // Save report to file if output specified
          if (options.outputFile) {
            const fs = require("fs");
            const path = require("path");

            let outputPath = options.outputFile;
            if (files.length > 1) {
              // Add filename to output for multiple files
              const ext = path.extname(outputPath);
              const base = path.basename(outputPath, ext);
              outputPath = path.join(
                path.dirname(outputPath),
                `${base}-${path.basename(file, ".pine")}${ext}`,
              );
            }

            fs.writeFileSync(outputPath, result.report);
            console.log(`✅ Report saved to: ${outputPath}`);
          }
        } else {
          console.error(`❌ Backtest failed for ${file}: ${result.error}`);
          allResults.push(result);
        }
      } catch (error) {
        console.error(`❌ Error backtesting ${file}: ${error.message}`);
        allResults.push({
          file,
          success: false,
          error: error.message,
        });
      }
    }

    // Generate summary if multiple files
    if (files.length > 1) {
      generateSummary(allResults, options);
    }

    // Check if any backtests failed
    const failed = allResults.filter((r) => !r.success);
    if (failed.length > 0) {
      console.error(`\n❌ ${failed.length} backtest(s) failed`);
      process.exit(1);
    }

    console.log("\n✅ All backtests completed successfully");
  } catch (error) {
    console.error(`\n❌ Backtesting failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate summary for multiple backtests
 */
function generateSummary(results, options) {
  const successful = results.filter((r) => r.success);

  if (successful.length === 0) {
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("📈 BACKTEST SUMMARY");
  console.log("=".repeat(60));

  console.log("\nStrategy Performance Comparison:");
  console.log("─".repeat(40));

  successful.forEach((result, index) => {
    const { strategy, performance } = result.results;
    console.log(`\n${index + 1}. ${strategy}`);
    console.log(
      `   Net Profit: $${performance.netProfit.toFixed(2)} (${((performance.netProfit / result.results.parameters.initialCapital) * 100).toFixed(2)}%)`,
    );
    console.log(`   Win Rate: ${performance.winRate.toFixed(1)}%`);
    console.log(`   Profit Factor: ${performance.profitFactor.toFixed(2)}`);
    console.log(`   Max Drawdown: ${performance.maxDrawdownPct.toFixed(2)}%`);
    console.log(`   Sharpe Ratio: ${performance.sharpeRatio.toFixed(2)}`);
  });

  // Find best strategy by net profit
  const bestByProfit = successful.reduce((best, current) => {
    return current.results.performance.netProfit >
      best.results.performance.netProfit
      ? current
      : best;
  });

  // Find best strategy by Sharpe ratio
  const bestBySharpe = successful.reduce((best, current) => {
    return current.results.performance.sharpeRatio >
      best.results.performance.sharpeRatio
      ? current
      : best;
  });

  // Find best strategy by win rate
  const bestByWinRate = successful.reduce((best, current) => {
    return current.results.performance.winRate >
      best.results.performance.winRate
      ? current
      : best;
  });

  console.log("\n🏆 BEST PERFORMERS:");
  console.log("─".repeat(40));
  console.log(
    `Highest Profit: ${bestByProfit.results.strategy} ($${bestByProfit.results.performance.netProfit.toFixed(2)})`,
  );
  console.log(
    `Best Risk-Adjusted: ${bestBySharpe.results.strategy} (Sharpe: ${bestBySharpe.results.performance.sharpeRatio.toFixed(2)})`,
  );
  console.log(
    `Highest Win Rate: ${bestByWinRate.results.strategy} (${bestByWinRate.results.performance.winRate.toFixed(1)}%)`,
  );

  console.log("\n" + "=".repeat(60));
}

function showHelp() {
  console.log(`
/pine-backtest - Run backtesting on PineScript strategies

Usage:
  /pine-backtest [options] <strategy.pine> [more-strategies.pine...]

Options:
  --data, -d <file>         Data file for backtesting (CSV format)
  --data-source, -s <src>   Data source: csv, tradingview, api, database (default: csv)
  --from, -f <date>         Start date for backtesting (YYYY-MM-DD)
  --to, -t <date>           End date for backtesting (YYYY-MM-DD)
  --commission, -c <pct>    Commission percentage (default: 0.1)
  --slippage, -S <pct>      Slippage percentage (default: 0.0)
  --capital, -C <amount>    Initial capital (default: 10000)
  --report, -r <format>     Report format: console, json, html, csv (default: console)
  --output, -o <file>       Save report to file
  --verbose, -v             Verbose output with detailed information
  --quiet, -q               Minimal output (errors only)
  --json                    Output results in JSON format (alias for --report json)
  --html                    Generate HTML report (alias for --report html)
  --csv                     Generate CSV report (alias for --report csv)
  --check-tools             Check if backtesting tools are available
  --help, -h                Show this help message

Examples:
  # Basic backtest with CSV data
  /pine-backtest my-strategy.pine --data historical.csv
  
  # Backtest with custom parameters
  /pine-backtest --data-source tradingview --commission 0.2 --capital 50000 strategy.pine
  
  # Generate HTML report
  /pine-backtest --html --output report.html strategy.pine
  
  # Backtest multiple strategies
  /pine-backtest strategy1.pine strategy2.pine --data data.csv
  
  # Check backtesting tools
  /pine-backtest --check-tools
  
  # JSON output for programmatic use
  /pine-backtest --json --quiet strategy.pine

Data Requirements:
  • CSV files should have columns: date, open, high, low, close, volume
  • Date format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
  • Strategies must use strategy() function (not indicator())

Performance Metrics:
  • Net profit/loss and total return
  • Win rate and profit factor
  • Average win/loss and largest win/loss
  • Maximum drawdown and recovery factor
  • Sharpe ratio, Sortino ratio, Calmar ratio
  • Trade statistics and equity curve

Exit Codes:
  0 - All backtests completed successfully
  1 - Backtest failed (errors found)
  2 - Configuration error
  3 - File not found or invalid

See Also:
  /pine-validate  - Validate PineScript syntax before backtesting
  /pine-optimize  - Optimize strategy parameters
  /pine-setup     - Configure PineScript project
  `);
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;
