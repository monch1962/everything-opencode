#!/usr/bin/env node
/**
 * Clojure REPL Command
 *
 * Start Clojure REPL with project context
 */

const ClojureCommandRunner = require('../clojure/command-runner');

async function main() {
  try {
    const runner = new ClojureCommandRunner();
    await runner.repl(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Clojure REPL failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
