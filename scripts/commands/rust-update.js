#!/usr/bin/env node
/**
 * Rust Update Command
 *
 * Update Rust dependencies
 */

const RustCommandRunner = require('../rust/rust-command-runner-refactored');

async function main() {
  try {
    const runner = new RustCommandRunner();
    await runner.update(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Rust update failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
