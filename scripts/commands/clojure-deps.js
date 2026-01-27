#!/usr/bin/env node
/**
 * Clojure Dependencies Command
 *
 * Update Clojure dependencies
 */

const ClojureCommandRunner = require('../clojure/command-runner');

async function main() {
  try {
    const runner = new ClojureCommandRunner();
    await runner.deps(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Clojure dependency update failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
