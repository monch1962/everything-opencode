#!/usr/bin/env node
/**
 * Clojure Build Command
 *
 * Build Clojure projects with intelligent defaults
 */

const ClojureCommandRunner = require('../clojure/command-runner');

async function main() {
  try {
    const runner = new ClojureCommandRunner();

    // Parse arguments for build options
    let args = process.argv.slice(2);
    const options = {};

    // Check for uberjar flag
    if (args.includes('--uberjar') || args.includes('-u')) {
      options.uberjar = true;
      // Remove the flag from args
      args = args.filter((arg) => !['--uberjar', '-u'].includes(arg));
    }

    await runner.build(args, options);
  } catch (error) {
    console.error('❌ Clojure build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
