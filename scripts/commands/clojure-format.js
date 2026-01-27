#!/usr/bin/env node
/**
 * Clojure Format Command
 *
 * Format Clojure code with zprint
 */

const ClojureCommandRunner = require('../clojure/command-runner-refactored');

async function main() {
  try {
    const runner = new ClojureCommandRunner();
    await runner.format(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Clojure formatting failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
