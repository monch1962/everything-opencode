#!/usr/bin/env node
/**
 * Rust Fmt Command
 *
 * Format Rust code with rustfmt
 */

const RustCommandRunner = require('../rust/rust-command-runner-refactored');

async function main() {
  try {
    const runner = new RustCommandRunner();
    await runner.fmt(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Rust formatting failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
