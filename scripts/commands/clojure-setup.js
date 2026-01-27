#!/usr/bin/env node
/**
 * Clojure Setup Command
 *
 * Interactive setup for Clojure projects
 */

const ClojureConfigWizard = require('../../languages/clojure/config-wizard');

async function main() {
  try {
    const wizard = new ClojureConfigWizard();
    await wizard.runWizard();
  } catch (error) {
    console.error('❌ Clojure setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
