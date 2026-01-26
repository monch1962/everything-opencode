#!/usr/bin/env node
/**
 * JavaScript/TypeScript Lint Command
 *
 * Run linter for JavaScript/TypeScript projects
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

      if (arg === '--fix' || arg === '-f') {
        options.fix = true;
        parsedArgs.push('--fix');
      } else if (arg === '--quiet' || arg === '-q') {
        options.quiet = true;
        parsedArgs.push('--quiet');
      } else if (arg === '--format' || arg === '-F') {
        options.format = 'stylish';
        parsedArgs.push('--format', 'stylish');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run linter
    await runner.initialize();
    await runner.lint(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Linting failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /js-setup first to configure your project.');
      console.log('💡 Or install ESLint: npm install --save-dev eslint');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔍 JavaScript/TypeScript Lint Command

Usage: /js-lint [options] [files...]

Options:
  --fix, -f       Automatically fix problems
  --quiet, -q     Report errors only
  --format, -F    Use specific output format (default: stylish)
  --help, -h      Show this help message

Examples:
  /js-lint                    # Lint all files
  /js-lint --fix             # Lint and fix automatically
  /js-lint src/             # Lint specific directory
  /js-lint file1.js file2.js # Lint specific files
  /js-lint -f -q            # Fix quietly

Supported Linters:
  • ESLint (default)
  • Other linters via npm scripts

Configuration:
  Run /js-setup first to configure your project.
  Create .eslintrc.js for custom ESLint configuration.
  Add lint script to package.json for custom setup.
  
Common ESLint Extensions:
  • @typescript-eslint/eslint-plugin - TypeScript support
  • eslint-plugin-react - React support
  • eslint-plugin-vue - Vue.js support
  • eslint-config-prettier - Prettier integration
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
