#!/usr/bin/env node
/**
 * TypeScript Type Checking Command
 *
 * Run TypeScript type checking for TypeScript projects
 */

const JSCommandRunner = require('../javascript/command-runner');

async function main() {
  try {
    const projectPath = process.cwd();
    const runner = new JSCommandRunner(projectPath);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};

    // Parse options
    const parsedArgs = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--strict' || arg === '-s') {
        options.strict = true;
        parsedArgs.push('--strict');
      } else if (arg === '--watch' || arg === '-w') {
        options.watch = true;
        parsedArgs.push('--watch');
      } else if (arg === '--noEmit' || arg === '-n') {
        options.noEmit = true;
        parsedArgs.push('--noEmit');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run type checking
    await runner.initialize();
    await runner.typecheck(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Type checking failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('TypeScript') || error.message.includes('tsconfig')) {
      console.log('\n💡 TypeScript configuration not found.');
      console.log('   Create tsconfig.json: npx tsc --init');
      console.log('   Or install TypeScript: npm install --save-dev typescript');
    }

    if (error.message.includes('not configured')) {
      console.log('\n💡 Try running /js-setup first to configure your project.');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔍 TypeScript Type Checking Command

Usage: /ts-typecheck [options]

Options:
  --strict, -s     Enable strict type checking
  --watch, -w      Watch mode for continuous checking
  --noEmit, -n     Type check only, don't emit files
  --help, -h       Show this help message

Examples:
  /ts-typecheck              # Run type checking
  /ts-typecheck --strict    # Run with strict mode
  /ts-typecheck --watch     # Watch for changes
  /ts-typecheck --noEmit    # Check only, no compilation

Type Checking Benefits:
  • Catch type errors at compile time, not runtime
  • Better IDE support with autocomplete and refactoring
  • Self-documenting code with type annotations
  • Safer refactoring with type safety

Common TypeScript Flags:
  • --strict: Enable all strict type checking options
  • --noImplicitAny: Error on expressions with implied 'any' type
  • --strictNullChecks: Null and undefined are not in the domain of every type
  • --strictFunctionTypes: Check function parameter types contravariantly
  • --strictBindCallApply: Check arguments of bind, call, and apply methods

Configuration:
  Run /js-setup first to configure your TypeScript project.
  Create tsconfig.json: npx tsc --init
  Add typecheck script to package.json: "typecheck": "tsc --noEmit"
  
Common Type Errors and Fixes:
  • "Cannot find module": Install @types/package-name or create declaration file
  • "Type 'X' is not assignable to type 'Y'": Check type compatibility
  • "Property 'X' does not exist on type 'Y'": Check interface/type definitions
  • "Parameter 'X' implicitly has an 'any' type": Add type annotation or enable noImplicitAny
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
