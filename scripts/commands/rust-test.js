#!/usr/bin/env node
/**
 * Rust Test Command
 *
 * Run Rust tests with intelligent defaults
 */

const RustCommandRunner = require('../rust/rust-command-runner-refactored');

async function main() {
  try {
    const runner = new RustCommandRunner();
    await runner.test(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Rust tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
