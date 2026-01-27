#!/usr/bin/env node
/**
 * Clojure Lint Command
 *
 * Run clj-kondo linter on Clojure code
 */

const ClojureCommandRunner = require('../clojure/command-runner-refactored');

async function main() {
  try {
    const runner = new ClojureCommandRunner();
    await runner.lint(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Clojure linting failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
