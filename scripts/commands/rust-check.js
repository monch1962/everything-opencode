#!/usr/bin/env node
/**
 * Rust Check Command
 *
 * Check Rust code without building
 */

const RustCommandRunner = require('../rust/command-runner');

async function main() {
  try {
    const runner = new RustCommandRunner();
    await runner.check(process.argv.slice(2));
  } catch (error) {
    console.error('❌ Rust check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
