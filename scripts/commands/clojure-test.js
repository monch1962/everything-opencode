#!/usr/bin/env node
/**
 * Clojure Test Command
 *
 * Run Clojure tests with intelligent defaults
 */

const ClojureCommandRunner = require('../clojure/command-runner');

async function main() {
  try {
    const runner = new ClojureCommandRunner();
    await runner.test(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Clojure tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
