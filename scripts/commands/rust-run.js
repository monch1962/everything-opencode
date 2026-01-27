#!/usr/bin/env node
/**
 * Rust Run Command
 *
 * Run Rust project
 */

const RustCommandRunner = require('../rust/rust-command-runner-refactored');

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};

    // Parse options
    if (args.includes('--release')) {
      options.release = true;
      args.splice(args.indexOf('--release'), 1);
    }

    const runner = new RustCommandRunner();
    await runner.run(args, options);
  } catch (error) {
    console.error('❌ Rust run failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
