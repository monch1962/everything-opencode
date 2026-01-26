#!/usr/bin/env node
/**
 * TypeScript Build Command
 *
 * Compile TypeScript projects
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

      if (arg === '--watch' || arg === '-w') {
        options.watch = true;
        parsedArgs.push('--watch');
      } else if (arg === '--incremental' || arg === '-i') {
        options.incremental = true;
        parsedArgs.push('--incremental');
      } else if (arg === '--sourceMap' || arg === '-s') {
        options.sourceMap = true;
        parsedArgs.push('--sourceMap');
      } else if (arg === '--declaration' || arg === '-d') {
        options.declaration = true;
        parsedArgs.push('--declaration');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run TypeScript compilation
    await runner.initialize();

    // For TypeScript build, we need to ensure we're using tsc
    const projectInfo = runner.getJSProjectInfo();
    if (!projectInfo.hasTsConfig) {
      throw new Error('TypeScript configuration (tsconfig.json) not found.');
    }

    // Build with TypeScript-specific arguments
    const buildArgs = ['tsc', ...parsedArgs];
    await runner.build(buildArgs, options);
  } catch (error) {
    console.error('\n❌ TypeScript build failed:', error.message);

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
🔨 TypeScript Build Command

Usage: /ts-build [options]

Options:
  --watch, -w         Watch mode for incremental compilation
  --incremental, -i   Enable incremental compilation
  --sourceMap, -s     Generate source maps
  --declaration, -d   Generate .d.ts declaration files
  --help, -h          Show this help message

Examples:
  /ts-build                    # Compile TypeScript
  /ts-build --watch           # Watch for changes
  /ts-build --sourceMap       # Generate with source maps
  /ts-build --declaration     # Generate declaration files

TypeScript Compilation:
  • Transpiles TypeScript to JavaScript
  • Performs type checking during compilation
  • Can generate declaration files for library distribution
  • Supports incremental compilation for faster builds

Common tsconfig.json Options:
  • compilerOptions.target: JavaScript version to target (es2020, esnext, etc.)
  • compilerOptions.module: Module system (commonjs, esnext, etc.)
  • compilerOptions.outDir: Output directory for compiled files
  • compilerOptions.rootDir: Root directory of input files
  • compilerOptions.strict: Enable all strict type checking
  • include: Files to include in compilation
  • exclude: Files to exclude from compilation

Configuration:
  Run /js-setup first to configure your TypeScript project.
  Create tsconfig.json: npx tsc --init
  Add build script to package.json: "build": "tsc"
  
Build Output:
  • JavaScript files (.js) in outDir (default: dist/)
  • Source maps (.js.map) if sourceMap enabled
  • Declaration files (.d.ts) if declaration enabled
  • TypeScript build info (.tsbuildinfo) if incremental enabled

For Library Development:
  • Enable declaration: true for .d.ts files
  • Set declarationMap: true for declaration source maps
  • Use outDir to separate source and distribution files
  • Consider using tsup or rollup for bundling
  
For Application Development:
  • Use with bundler (webpack, vite, rollup) for optimal bundles
  • Enable source maps for debugging
  • Consider incremental builds for development speed
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
