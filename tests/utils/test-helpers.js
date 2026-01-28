#!/usr/bin/env node
/**
 * Enhanced Test Helpers
 *
 * Shared utilities for integration, E2E, performance, and deployment testing
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

class TestHelpers {
  constructor() {
    this.testDataDir = path.join(__dirname, '..', 'data');
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.ensureDirectories();
  }

  /**
   * Ensure test directories exist
   */
  async ensureDirectories() {
    const dirs = [this.testDataDir, this.tempDir];
    for (const dir of dirs) {
      if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Create mock objects for testing
   */
  createMock(interfaceDefinition) {
    const mock = {};

    for (const [methodName, methodDef] of Object.entries(interfaceDefinition)) {
      if (typeof methodDef === 'function') {
        // Function with implementation
        mock[methodName] = methodDef;
      } else if (methodDef === 'function') {
        // Generic function mock
        mock[methodName] = jest.fn();
      } else if (methodDef === 'promise') {
        // Promise-returning function mock
        mock[methodName] = jest.fn().mockResolvedValue(undefined);
      } else {
        // Property
        mock[methodName] = methodDef;
      }
    }

    return mock;
  }

  /**
   * Create test PineScript code
   */
  generatePineScript(complexity = 'simple') {
    const templates = {
      simple: `// Simple PineScript strategy
study("Simple RSI Strategy", overlay=true)

rsi_length = input(14, "RSI Length")
rsi_overbought = input(70, "RSI Overbought")
rsi_oversold = input(30, "RSI Oversold")

rsi_value = rsi(close, rsi_length)

buy_signal = rsi_value < rsi_oversold
sell_signal = rsi_value > rsi_overbought

plotshape(buy_signal, style=shape.triangleup, location=location.belowbar, color=color.green, size=size.small)
plotshape(sell_signal, style=shape.triangledown, location=location.abovebar, color=color.red, size=size.small)`,

      medium: `// Medium complexity PineScript strategy
study("MACD + RSI Strategy", overlay=false)

// MACD parameters
fast_length = input(12, "Fast Length")
slow_length = input(26, "Slow Length")
signal_length = input(9, "Signal Length")

// RSI parameters
rsi_length = input(14, "RSI Length")
rsi_overbought = input(70, "RSI Overbought")
rsi_oversold = input(30, "RSI Oversold")

// Calculate indicators
[macd_line, signal_line, hist_line] = macd(close, fast_length, slow_length, signal_length)
rsi_value = rsi(close, rsi_length)

// Generate signals
macd_bullish = macd_line > signal_line
rsi_bullish = rsi_value > 50
buy_signal = macd_bullish and rsi_bullish

macd_bearish = macd_line < signal_line
rsi_bearish = rsi_value < 50
sell_signal = macd_bearish and rsi_bearish

// Plot indicators
plot(macd_line, color=color.blue, title="MACD")
plot(signal_line, color=color.orange, title="Signal")
plot(hist_line, color=color.gray, title="Histogram", style=plot.style_columns)
plot(rsi_value, color=color.purple, title="RSI")`,

      complex: `// Complex multi-timeframe strategy
study("Advanced Multi-Timeframe Strategy", overlay=true)

// Timeframe selection
tf1 = input.timeframe("60", "Primary Timeframe")
tf2 = input.timeframe("240", "Secondary Timeframe")

// Primary timeframe indicators
rsi_tf1 = security(syminfo.tickerid, tf1, rsi(close, 14))
sma_tf1 = security(syminfo.tickerid, tf1, sma(close, 20))
ema_tf1 = security(syminfo.tickerid, tf1, ema(close, 50))

// Secondary timeframe indicators
rsi_tf2 = security(syminfo.tickerid, tf2, rsi(close, 14))
sma_tf2 = security(syminfo.tickerid, tf2, sma(close, 50))
ema_tf2 = security(syminfo.tickerid, tf2, ema(close, 200))

// Volume analysis
volume_sma = sma(volume, 20)
volume_spike = volume > volume_sma * 1.5

// Complex signal logic
trend_aligned = ema_tf1 > sma_tf1 and ema_tf2 > sma_tf2
momentum_bullish = rsi_tf1 > 50 and rsi_tf2 > 50
volume_confirmation = volume_spike

buy_signal = trend_aligned and momentum_bullish and volume_confirmation

// Risk management
atr_value = atr(14)
stop_loss = close - atr_value * 2
take_profit = close + atr_value * 3

// Position sizing
risk_per_trade = input(1.0, "Risk % per trade", minval=0.1, maxval=5.0)
position_size = (strategy.equity * risk_per_trade / 100) / atr_value

// Strategy execution
if buy_signal
    strategy.entry("Long", strategy.long, qty=position_size)
    strategy.exit("Exit", "Long", stop=stop_loss, limit=take_profit)

// Visualization
plot(sma_tf1, color=color.blue, title="SMA 20")
plot(ema_tf1, color=color.orange, title="EMA 50")
bgcolor(buy_signal ? color.green : na, transp=85)`,
    };

    return templates[complexity] || templates.simple;
  }

  /**
   * Generate test project structure
   */
  async generateProjectStructure(type = 'web', projectName = 'test-project') {
    const projectPath = path.join(this.tempDir, projectName);

    if (await exists(projectPath)) {
      await this.cleanupDirectory(projectPath);
    }

    await mkdir(projectPath, { recursive: true });

    const structures = {
      web: {
        'package.json': JSON.stringify(
          {
            name: projectName,
            version: '1.0.0',
            scripts: {
              start: 'node server.js',
              test: 'jest',
              build: 'webpack',
            },
            dependencies: {
              express: '^4.18.0',
              react: '^18.0.0',
            },
          },
          null,
          2
        ),
        'server.js': `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from test web project' });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
        'README.md': `# ${projectName}\n\nTest web project for integration testing.`,
      },

      cli: {
        'package.json': JSON.stringify(
          {
            name: projectName,
            version: '1.0.0',
            bin: {
              [projectName]: './cli.js',
            },
            scripts: {
              test: 'jest',
            },
            dependencies: {
              commander: '^9.0.0',
              chalk: '^5.0.0',
            },
          },
          null,
          2
        ),
        'cli.js': `#!/usr/bin/env node
const { program } = require('commander');
const chalk = require('chalk');

program
  .name('${projectName}')
  .description('Test CLI project for integration testing')
  .version('1.0.0');

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log(chalk.green('Hello from test CLI!'));
  });

program.parse();`,
        'README.md': `# ${projectName}\n\nTest CLI project for integration testing.`,
      },

      library: {
        'package.json': JSON.stringify(
          {
            name: projectName,
            version: '1.0.0',
            main: 'index.js',
            scripts: {
              test: 'jest',
              build: 'tsc',
            },
            dependencies: {},
            devDependencies: {
              typescript: '^4.0.0',
              '@types/node': '^18.0.0',
            },
          },
          null,
          2
        ),
        'index.js': `module.exports = {
  greet: function(name) {
    return \`Hello, \${name}!\`;
  },
  add: function(a, b) {
    return a + b;
  }
};`,
        'index.d.ts': `export declare function greet(name: string): string;
export declare function add(a: number, b: number): number;`,
        'README.md': `# ${projectName}\n\nTest library project for integration testing.`,
      },
    };

    const structure = structures[type] || structures.web;

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(projectPath, filePath);
      const dir = path.dirname(fullPath);

      if (dir !== projectPath) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(fullPath, content);
    }

    return projectPath;
  }

  /**
   * Generate test data sets
   */
  async generateTestData(size = 'small', dataType = 'financial') {
    const dataPath = path.join(this.testDataDir, `test-data-${size}-${dataType}.json`);

    if (await exists(dataPath)) {
      return JSON.parse(await readFile(dataPath, 'utf8'));
    }

    let data;
    const baseDate = new Date('2024-01-01');

    if (dataType === 'financial') {
      const sizes = {
        small: 100,
        medium: 1000,
        large: 10000,
      };

      const count = sizes[size] || 100;
      data = [];

      let price = 100;
      for (let i = 0; i < count; i++) {
        const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.5) * 5;
        price += change;

        data.push({
          date: date.toISOString().split('T')[0],
          open: price - Math.random() * 2,
          high: price + Math.random() * 3,
          low: price - Math.random() * 3,
          close: price,
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });
      }
    } else if (dataType === 'log') {
      const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
      const messages = [
        'Application started',
        'User logged in',
        'Database query executed',
        'Cache miss occurred',
        'API request processed',
        'File uploaded successfully',
        'Error processing request',
        'Configuration loaded',
        'Background job completed',
        'Memory usage normal',
      ];

      const sizes = {
        small: 50,
        medium: 500,
        large: 5000,
      };

      const count = sizes[size] || 50;
      data = [];

      for (let i = 0; i < count; i++) {
        const timestamp = new Date(baseDate.getTime() + i * 1000);
        data.push({
          timestamp: timestamp.toISOString(),
          level: levels[Math.floor(Math.random() * levels.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          source: `app-${Math.floor(Math.random() * 5)}`,
          userId: `user-${Math.floor(Math.random() * 100)}`,
        });
      }
    }

    await writeFile(dataPath, JSON.stringify(data, null, 2));
    return data;
  }

  /**
   * Clean up test directory
   */
  async cleanupDirectory(dirPath) {
    if (await exists(dirPath)) {
      const files = await fs.promises.readdir(dirPath);

      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = await fs.promises.stat(fullPath);

        if (stat.isDirectory()) {
          await this.cleanupDirectory(fullPath);
        } else {
          await fs.promises.unlink(fullPath);
        }
      }

      await fs.promises.rmdir(dirPath);
    }
  }

  /**
   * Reset test state
   */
  async resetTestState() {
    await this.cleanupDirectory(this.tempDir);
    await mkdir(this.tempDir, { recursive: true });
  }

  /**
   * Execute command and capture output
   */
  async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        stdio: options.stdio || 'pipe',
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0,
        });
      });

      child.on('error', (error) => {
        reject(error);
      });

      if (options.timeout) {
        setTimeout(() => {
          child.kill();
          reject(new Error(`Command timeout after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  /**
   * Wait for condition with timeout
   */
  async waitFor(condition, timeout = 30000, interval = 100) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition();
        if (result) return result;
      } catch (error) {
        // Continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Measure execution time
   */
  async measureExecution(fn, ...args) {
    const startTime = process.hrtime.bigint();
    const result = await fn(...args);
    const endTime = process.hrtime.bigint();

    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

    return {
      result,
      executionTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Assert performance meets requirements
   */
  assertPerformance(measurement, requirements) {
    const failures = [];

    if (requirements.maxTime && measurement.executionTime > requirements.maxTime) {
      failures.push(
        `Execution time ${measurement.executionTime}ms exceeds maximum ${requirements.maxTime}ms`
      );
    }

    if (requirements.minThroughput && measurement.throughput < requirements.minThroughput) {
      failures.push(
        `Throughput ${measurement.throughput} ops/s below minimum ${requirements.minThroughput} ops/s`
      );
    }

    if (requirements.maxMemory && measurement.memoryUsage > requirements.maxMemory) {
      failures.push(
        `Memory usage ${measurement.memoryUsage}MB exceeds maximum ${requirements.maxMemory}MB`
      );
    }

    if (failures.length > 0) {
      throw new Error(`Performance requirements not met:\n${failures.join('\n')}`);
    }

    return true;
  }

  /**
   * Setup integration test environment
   */
  async setupIntegrationTest(services = []) {
    const testEnv = {
      services: {},
      cleanup: async () => {
        // Clean up all services
        for (const service of Object.values(testEnv.services)) {
          if (service.cleanup) {
            await service.cleanup();
          }
        }
      },
    };

    // Setup requested services
    for (const service of services) {
      if (service === 'debug-server') {
        testEnv.services['debug-server'] = await this.setupDebugServer();
      } else if (service === 'command-runner') {
        testEnv.services['command-runner'] = await this.setupCommandRunner();
      }
      // Add more services as needed
    }

    return testEnv;
  }

  /**
   * Setup debug server for testing
   */
  async setupDebugServer() {
    const DebugServer = require('../../scripts/pinescript/debug-server');
    const server = new DebugServer({
      port: 0, // Let OS choose port
      security: false, // Disable security for testing
    });

    await server.start();

    return {
      instance: server,
      port: server.port,
      cleanup: async () => {
        await server.stop();
      },
    };
  }

  /**
   * Setup command runner for testing
   */
  async setupCommandRunner() {
    const ClojureCommandRunner = require('../../scripts/clojure/command-runner');
    const runner = new ClojureCommandRunner();
    await runner.initialize();

    return {
      instance: runner,
      cleanup: async () => {
        // Cleanup if needed
      },
    };
  }

  /**
   * Generate test report
   */
  generateTestReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        duration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      },
      details: results.map((result) => ({
        name: result.name,
        passed: result.passed,
        duration: result.duration,
        error: result.error,
        metadata: result.metadata,
      })),
      performance: results.filter((r) => r.performance).map((r) => r.performance),
    };

    return report;
  }

  /**
   * Save test report to file
   */
  async saveTestReport(report, filename = 'test-report.json') {
    const reportPath = path.join(this.tempDir, filename);
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }
}

module.exports = new TestHelpers();
