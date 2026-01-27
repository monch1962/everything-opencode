#!/usr/bin/env node
/**
 * JavaScript/TypeScript Development Server Command
 *
 * Start development server for JavaScript/TypeScript projects
 */

const JSCommandRunner = require('../javascript/javascript-command-runner-refactored');

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

      if (arg === '--port' || arg === '-p') {
        const port = args[++i];
        if (port && !isNaN(port)) {
          options.port = parseInt(port, 10);
          parsedArgs.push('--port', port);
        }
      } else if (arg === '--host' || arg === '-H') {
        const host = args[++i];
        if (host) {
          options.host = host;
          parsedArgs.push('--host', host);
        }
      } else if (arg === '--open' || arg === '-o') {
        options.open = true;
        parsedArgs.push('--open');
      } else if (arg === '--help' || arg === '-h') {
        showHelp();
        return;
      } else {
        parsedArgs.push(arg);
      }
    }

    // Initialize and start dev server
    await runner.initialize();
    await runner.dev(parsedArgs, options);
  } catch (error) {
    console.error('\n❌ Development server failed:', error.message);

    // Show additional help for common errors
    if (error.message.includes('not configured') || error.message.includes('not found')) {
      console.log('\n💡 Try running /js-setup first to configure your project.');
      console.log('💡 Check if dev script exists in package.json');
    }

    if (error.message.includes('port') || error.message.includes('EADDRINUSE')) {
      console.log('\n💡 Port is already in use. Try:');
      console.log('   /js-dev --port 3001');
      console.log('   Or kill process: lsof -ti:3000 | xargs kill');
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 JavaScript/TypeScript Development Server Command

Usage: /js-dev [options]

Options:
  --port, -p <port>  Specify port (default: 3000)
  --host, -H <host>  Specify host (default: localhost)
  --open, -o         Open browser automatically
  --help, -h         Show this help message

Examples:
  /js-dev                    # Start dev server on default port
  /js-dev --port 3001       # Start on port 3001
  /js-dev --open            # Start and open browser
  /js-dev -p 8080 -H 0.0.0.0 # Start on port 8080, all interfaces

Supported Development Servers:
  • Vite Dev Server (vite)
  • Webpack Dev Server (webpack-dev-server)
  • Next.js Dev Server (next dev)
  • Nuxt.js Dev Server (nuxt dev)
  • Create React App (react-scripts start)
  • Vue CLI Service (vue-cli-service serve)
  • Other tools via npm scripts

Common Dev Scripts in package.json:
  • "dev": "vite"
  • "start": "react-scripts start"
  • "serve": "vue-cli-service serve"
  • "dev": "next dev"

Hot Module Replacement (HMR):
  Most modern dev servers support HMR for instant updates.
  Changes are reflected immediately without full page reload.

Configuration:
  Run /js-setup first to configure your project.
  Add dev script to package.json for custom development setup.
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
