#!/usr/bin/env node
/**
 * Rust Doc Command
 *
 * Generate Rust documentation
 */

const RustCommandRunner = require('../rust/rust-command-runner-refactored');

async function main() {
  try {
    const runner = new RustCommandRunner();
    await runner.doc(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Rust documentation generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
