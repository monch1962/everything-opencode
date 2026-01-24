#!/usr/bin/env node
/**
 * Everything opencode - Main Entry Point
 * 
 * This file serves as the main entry point for the npm package.
 * It provides a CLI interface for installation verification and
 * integration with opencode.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function showHelp() {
  console.log(`
Everything opencode - Comprehensive plugin for opencode AI coding agent

Usage:
  everything-opencode <command>

Commands:
  verify     Verify installation and configuration
  test       Run the test suite
  help       Show this help message

Examples:
  npx everything-opencode verify
  npx everything-opencode test

For more information, see:
  https://github.com/yourusername/everything-opencode
  `);
}

function runVerification() {
  console.log('Running installation verification...\n');
  try {
    require('./scripts/verify-installation.js');
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
}

function runTests() {
  console.log('Running test suite...\n');
  try {
    require('./tests/run-all.js');
  } catch (err) {
    console.error('Tests failed:', err.message);
    process.exit(1);
  }
}

// Main CLI logic
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'verify':
    runVerification();
    break;
  case 'test':
    runTests();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  case '--version':
  case '-v':
    const pkg = require('./package.json');
    console.log(`everything-opencode v${pkg.version}`);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Use "everything-opencode help" for available commands.');
    process.exit(1);
}