#!/usr/bin/env node
/**
 * Rust Setup Command
 *
 * Interactive setup for Rust projects
 */

const RustConfigWizard = require('../../languages/rust/config-wizard');

async function main() {
  try {
    const wizard = new RustConfigWizard();
    await wizard.runWizard();
  } catch (error) {
    console.error('❌ Rust setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
