#!/usr/bin/env node
/**
 * Rust Clippy Command
 *
 * Run clippy linter on Rust code
 */

const RustCommandRunner = require('../rust/command-runner');

async function main() {
  try {
    const runner = new RustCommandRunner();
    await runner.clippy(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Rust clippy failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
