#!/usr/bin/env node
/**
 * Rust Build Command
 *
 * Build Rust projects with intelligent defaults
 */

const RustCommandRunner = require('../rust/command-runner');

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
    await runner.build(args, options);
  } catch (error) {
    console.error('❌ Rust build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
