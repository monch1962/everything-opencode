#!/usr/bin/env node
/**
 * Rust Clean Command
 *
 * Clean Rust build artifacts
 */

const RustCommandRunner = require('../rust/command-runner');

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};

    // Parse options
    if (args.includes('--all')) {
      options.all = true;
      args.splice(args.indexOf('--all'), 1);
    }

    if (args.includes('--release')) {
      options.release = true;
      args.splice(args.indexOf('--release'), 1);
    }

    const runner = new RustCommandRunner();
    await runner.clean(options);
  } catch (error) {
    console.error('❌ Rust clean failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
