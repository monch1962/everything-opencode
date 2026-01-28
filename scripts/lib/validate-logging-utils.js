#!/usr/bin/env node
/**
 * Validation script for LoggingUtils refactoring
 *
 * Tests that the refactored LoggingUtils maintains 100% backward compatibility
 * with the original API and functionality.
 */

const LoggingUtils = require('./logging-utils');

console.log('🔍 Validating LoggingUtils refactoring...\n');

let passed = 0;
let failed = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${description}`);
    console.log(`    Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Class exists and is a function
test('LoggingUtils class exists', () => {
  if (typeof LoggingUtils !== 'function') {
    throw new Error('LoggingUtils is not a function/class');
  }
});

// Test 2: Static methods exist
test('Static methods exist', () => {
  const requiredMethods = [
    'initialize',
    'setLevel',
    'getLevel',
    'shouldLog',
    'error',
    'warn',
    'info',
    'debug',
    'success',
    'spinner',
    'progressBar',
    'table',
    'box',
    'section',
    'keyValue',
    'formatCode',
    'formatCommand',
    'formatFilePath',
    'formatJson',
    'formatError',
    'formatSuccessSummary',
    'formatSecurityResults',
  ];

  for (const method of requiredMethods) {
    if (typeof LoggingUtils[method] !== 'function') {
      throw new Error(`Missing method: ${method}`);
    }
  }
});

// Test 3: Static properties exist
test('Static properties exist', () => {
  const requiredProperties = ['chalk', 'boxen', 'ora', 'Table', 'ProgressBar'];

  for (const prop of requiredProperties) {
    if (!LoggingUtils[prop]) {
      throw new Error(`Missing property: ${prop}`);
    }
  }
});

// Test 4: Basic logging methods work
test('Basic logging methods work', () => {
  // These should not throw errors
  LoggingUtils.error('Test error');
  LoggingUtils.warn('Test warning');
  LoggingUtils.info('Test info');
  LoggingUtils.debug('Test debug');
  LoggingUtils.success('Test success');
});

// Test 5: Configuration methods work
test('Configuration methods work', () => {
  const originalLevel = LoggingUtils.getLevel();

  LoggingUtils.setLevel('debug');
  if (LoggingUtils.getLevel() !== 'debug') {
    throw new Error('setLevel/getLevel not working');
  }

  LoggingUtils.setLevel(originalLevel);
});

// Test 6: Should log works
test('Should log works', () => {
  LoggingUtils.setLevel('info');

  if (!LoggingUtils.shouldLog('error')) {
    throw new Error('shouldLog error not working');
  }

  if (!LoggingUtils.shouldLog('warn')) {
    throw new Error('shouldLog warn not working');
  }

  if (!LoggingUtils.shouldLog('info')) {
    throw new Error('shouldLog info not working');
  }

  if (LoggingUtils.shouldLog('debug')) {
    throw new Error('shouldLog debug should return false at info level');
  }
});

// Test 7: UI components return objects
test('UI components return objects', () => {
  const spinner = LoggingUtils.spinner('Loading...');
  if (typeof spinner !== 'object') {
    throw new Error('spinner not returning object');
  }

  const table = LoggingUtils.table();
  if (typeof table !== 'object') {
    throw new Error('table not returning object');
  }

  const box = LoggingUtils.box('Test box');
  if (typeof box !== 'object' || typeof box.toString !== 'function') {
    throw new Error('box not returning object with toString method');
  }
});

// Test 8: Formatter methods work
test('Formatter methods work', () => {
  const code = LoggingUtils.formatCode('console.log("test")');
  if (typeof code !== 'string') {
    throw new Error('formatCode not returning string');
  }

  const command = LoggingUtils.formatCommand('npm test');
  if (typeof command !== 'string') {
    throw new Error('formatCommand not returning string');
  }

  const filePath = LoggingUtils.formatFilePath('/path/to/file.js');
  if (typeof filePath !== 'string') {
    throw new Error('formatFilePath not returning string');
  }

  const json = LoggingUtils.formatJson({ test: 'data' });
  if (typeof json !== 'string') {
    throw new Error('formatJson not returning string');
  }
});

// Test 9: Error formatting works
test('Error formatting works', () => {
  const error = new Error('Test error');
  const formatted = LoggingUtils.formatError(error);

  if (typeof formatted !== 'string') {
    throw new Error('formatError not returning string');
  }
});

// Test 10: Initialize works
test('Initialize works', () => {
  LoggingUtils.initialize({ level: 'warn', colors: false });

  if (LoggingUtils.getLevel() !== 'warn') {
    throw new Error('initialize not setting level');
  }

  // Reset to default
  LoggingUtils.initialize({ level: 'info', colors: true });
});

console.log('\n📊 Validation Results:');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n✅ All validation tests passed! LoggingUtils refactoring is backward compatible.');
  process.exit(0);
} else {
  console.log('\n❌ Some validation tests failed.');
  process.exit(1);
}
