#!/usr/bin/env node
/**
 * JavaScript/TypeScript Build Command
 *
 * Build JavaScript/TypeScript projects
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

      if (arg === '--production' || arg === '-p') {
        options.production = true;
        parsedArgs.push('--mode', 'production');
      } else if (arg === '--watch' || arg === '-w') {
        options.watch = true;
        parsedArgs.push('--watch');
      } else if (arg === '--analyze' || arg === '-a') {
        options.analyze = true;
        parsedArgs.push('--analyze');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and run build
    await runner.initialize();
    await runner.build(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /js-setup first to configure your project.');
    }

    if (error.message.includes('TypeScript') || error.message.includes('tsc')) {
      console.log('\n💡 TypeScript projects need tsconfig.json');
      console.log('   Create one with: npx tsc --init');
      console.log('   Or install TypeScript: npm install --save-dev typescript');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔨 JavaScript/TypeScript Build Command

Usage: /js-build [options]

Options:
  --production, -p  Build for production (optimized)
  --watch, -w       Watch mode for development
  --analyze, -a     Analyze bundle size
  --help, -h        Show this help message

Examples:
  /js-build                    # Build for development
  /js-build --production      # Build for production
  /js-build --watch           # Build in watch mode
  /js-build --analyze         # Analyze bundle size

Supported Build Tools:
  • TypeScript Compiler (tsc) for TypeScript projects
  • Webpack (via npm scripts)
  • Vite (via npm scripts)
  • Rollup (via npm scripts)
  • Parcel (via npm scripts)
  • Other tools via npm scripts

Configuration:
  Run /js-setup first to configure your project.
  Add build script to package.json for custom build process.
  
For TypeScript Projects:
  • Create tsconfig.json: npx tsc --init
  • Add build script: "build": "tsc"
  • Run /ts-typecheck for type checking only
  
For Web Projects:
  • Common build tools: webpack, vite, rollup, parcel
  • Framework-specific: next build, nuxt build, vue-cli-service build
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
