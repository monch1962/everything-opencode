#!/usr/bin/env node
/**
 * /pine-debug command wrapper (Refactored)
 *
 * Debugging utilities for PineScript indicator development
 *
 * Refactored version using modular architecture
 */

const PineCommandRunner = require('../pinescript/command-runner');
const path = require('path'); // eslint-disable-line no-unused-vars

// Import modular components
const ArgumentParser = require('./pine-debug-modules/argument-parser');
const CodeAnalyzer = require('./pine-debug-modules/code-analyzer');
const AIAnalyzer = require('./pine-debug-modules/ai-analyzer');
const CommandHandler = require('./pine-debug-modules/command-handler');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const action = args[0];
  const remainingArgs = args.slice(1);

  try {
    // Initialize command runner
    const runner = new PineCommandRunner();
    await runner.initialize();

    // Initialize modular components
    const argumentParser = new ArgumentParser();
    const codeAnalyzer = new CodeAnalyzer();
    const aiAnalyzer = new AIAnalyzer();
    const commandHandler = new CommandHandler(runner, codeAnalyzer, aiAnalyzer);

    // Handle different actions
    switch (action) {
      case 'inspect':
        await handleInspect(commandHandler, argumentParser, remainingArgs);
        break;
      case 'trace':
        await handleTrace(commandHandler, argumentParser, remainingArgs);
        break;
      case 'monitor':
        await handleMonitor(commandHandler, argumentParser, remainingArgs);
        break;
      case 'profile':
        await handleProfile(commandHandler, argumentParser, remainingArgs);
        break;
      case 'server':
        await handleServer(commandHandler, argumentParser, remainingArgs);
        break;
      case 'helpers':
        await handleHelpers(commandHandler, argumentParser, remainingArgs);
        break;
      case 'test':
        await handleTest(commandHandler, argumentParser, remainingArgs);
        break;
      case 'ai':
        await handleAI(commandHandler, argumentParser, remainingArgs);
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

/**
 * Handle inspect command
 */
async function handleInspect(commandHandler, argumentParser, args) {
  const schema = argumentParser.getCommonDebugSchema();
  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.inspect(options);
}

/**
 * Handle trace command
 */
async function handleTrace(commandHandler, argumentParser, args) {
  const schema = {
    ...argumentParser.getCommonDebugSchema(),
    var: {
      type: 'string',
      alias: 'v',
      description: 'Variable name to trace (required)',
      required: true,
    },
  };

  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.trace(options);
}

/**
 * Handle monitor command
 */
async function handleMonitor(commandHandler, argumentParser, args) {
  const schema = {
    ...argumentParser.getCommonDebugSchema(),
    condition: {
      type: 'string',
      alias: 'c',
      description: 'Condition expression to monitor (required)',
      required: true,
    },
  };

  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.monitor(options);
}

/**
 * Handle profile command
 */
async function handleProfile(commandHandler, argumentParser, args) {
  const schema = {
    ...argumentParser.getCommonDebugSchema(),
    metrics: {
      type: 'string',
      alias: 'm',
      description: 'Metrics to analyze (complexity,performance,memory,coverage)',
      default: 'complexity,performance,memory',
    },
  };

  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.profile(options);
}

/**
 * Handle server command
 */
async function handleServer(commandHandler, argumentParser, args) {
  const schema = argumentParser.getServerSchema();
  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.startServer(options);
}

/**
 * Handle helpers command
 */
async function handleHelpers(commandHandler, argumentParser, args) {
  const schema = {
    output: {
      type: 'string',
      alias: 'o',
      description: 'Output file path',
      default: './debug-helpers.json',
    },
    type: {
      type: 'string',
      alias: 't',
      description: 'Type of helpers to generate (all, ai, memory)',
      default: 'all',
      enum: ['all', 'ai', 'memory'],
    },
  };

  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.generateHelpers(options);
}

/**
 * Handle test command
 */
async function handleTest(commandHandler, argumentParser, args) {
  const schema = {
    verbose: {
      type: 'boolean',
      description: 'Verbose output',
      default: false,
    },
  };

  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.runTests(options);
}

/**
 * Handle AI command
 */
async function handleAI(commandHandler, argumentParser, args) {
  const schema = argumentParser.getAIAnalysisSchema();
  const { options } = argumentParser.parseArgs(args, schema);

  const validation = argumentParser.validateOptions(options, schema);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  await commandHandler.analyzeWithAI(options);
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
PineScript Debugger

A comprehensive debugging toolkit for PineScript indicator development.

Usage:
  node pine-debug.js <action> [options]

Actions:
  inspect     Inspect variables and their values
  trace       Trace variable changes over time
  monitor     Monitor conditions and expressions
  profile     Profile performance and complexity
  server      Start interactive debugging server
  helpers     Generate debugging helper library
  test        Run debugging tests
  ai          AI-assisted debugging suggestions

Common Options (for inspect/trace/monitor/profile):
  --file, -f <file>        PineScript file to debug (required)
  --var, -v <pattern>      Variable name/pattern to inspect
  --bars, -b <number>      Number of historical bars (default: 10)
  --format <format>        Output format: text, json, csv (default: text)
  --output, -o <path>      Output file path
  --verbose                Verbose output
  --project, -p <path>     Project directory path

Server Options:
  --port, -p <port>        Port to listen on (default: 3000)
  --file, -f <file>        PineScript file to debug
  --project, -d <path>     Project directory path
  --security <bool>        Enable/disable security (default: true)
  --auth <bool>            Require authentication (default: false)

AI Analysis Options:
  --file, -f <file>        PineScript file to analyze (required)
  --patterns <types>       Pattern types: all, performance, safety, readability (default: all)
  --threshold <0.0-1.0>    Confidence threshold (default: 0.7)
  --output, -o <path>      Output file for suggestions
  --format <format>        Output format: text, json, markdown (default: text)

Helpers Options:
  --output, -o <path>      Output file path (default: ./debug-helpers.json)
  --type, -t <type>        Type: all, ai, memory (default: all)

Examples:
  # Inspect all variables in a file
  node pine-debug.js inspect --file my-indicator.pine

  # Trace a specific variable
  node pine-debug.js trace --file my-indicator.pine --var "rsi*"

  # Profile code complexity and performance
  node pine-debug.js profile --file my-indicator.pine --metrics complexity,performance

  # Start debugging server
  node pine-debug.js server --port 3000 --file my-indicator.pine

  # AI analysis with suggestions
  node pine-debug.js ai --file my-indicator.pine --patterns performance --threshold 0.8

  # Generate debugging helpers
  node pine-debug.js helpers --type ai --output ./ai-helpers.json
  `);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    if (process.argv.includes('--verbose')) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = {
  main,
  showHelp,
};
