#!/usr/bin/env node
/**
 * Clojure Clean Command
 *
 * Clean Clojure build artifacts
 */

const ClojureCommandRunner = require('../clojure/command-runner');

async function main() {
  try {
    const runner = new ClojureCommandRunner();

    // Parse arguments for clean options
    const args = process.argv.slice(2);
    const options = {};

    // Check for all flag
    if (args.includes('--all') || args.includes('-a')) {
      options.all = true;
      // Remove the flag from args
      args = args.filter((arg) => !['--all', '-a'].includes(arg));
    }

    await runner.clean(options);
  } catch (error) {
    console.error('❌ Clojure clean failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
