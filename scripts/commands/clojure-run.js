#!/usr/bin/env node
/**
 * Clojure Run Command
 *
 * Run Clojure project main function
 */

const ClojureCommandRunner = require('../clojure/command-runner');

async function main() {
  try {
    const runner = new ClojureCommandRunner();
    await runner.run(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Clojure run failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
