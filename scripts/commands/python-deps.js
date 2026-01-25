#!/usr/bin/env node
/**
 * /python-deps command wrapper
 * 
 * Manage Python dependencies based on project configuration
 */

const PythonCommandRunner = require('./python-command-runner');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }
  
  const command = args[0];
  const packages = [];
  const options = {};
  
  // Parse command line arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dev' || arg === '-d') {
      options.dev = true;
    } else if (arg === '--optional' || arg === '-o') {
      options.optional = true;
    } else if (arg === '--extras') {
      options.extras = args[++i];
    } else if (arg === '--group') {
      options.group = args[++i];
    } else if (arg === '--python') {
      options.python = args[++i];
    } else if (arg === '--no-dev') {
      options.noDev = true;
    } else if (arg === '--no-optional') {
      options.noOptional = true;
    } else if (arg === '--only') {
      options.only = args[++i];
    } else if (arg === '--frozen') {
      options.frozen = true;
    } else if (arg === '--upgrade' || arg === '-U') {
      options.upgrade = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--tree' || arg === '-t') {
      options.tree = true;
    } else if (arg === '--outdated') {
      options.outdated = true;
    } else if (arg === '--manager') {
      options.manager = args[++i];
    } else if (arg === '--file') {
      options.file = args[++i];
    } else if (arg === '--no-lock') {
      options.noLock = true;
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      packages.push(arg);
    }
  }
  
  // Validate command
  const validCommands = ['install', 'add', 'remove', 'update', 'list', 'sync', 'lock', 'check', 'audit'];
  if (!validCommands.includes(command)) {
    console.error(`Invalid command: ${command}`);
    showHelp();
    process.exit(1);
  }
  
  try {
    const runner = new PythonCommandRunner();
    await runner.manageDependencies(command, packages, options);
    
    // Success messages
    const successMessages = {
      install: 'Dependencies installed successfully',
      add: 'Dependency added successfully',
      remove: 'Dependency removed successfully',
      update: 'Dependencies updated successfully',
      list: '',
      sync: 'Dependencies synced successfully',
      lock: 'Lock file generated successfully',
      check: 'Dependency check completed',
      audit: 'Security audit completed'
    };
    
    if (successMessages[command]) {
      console.log(`\n✅ ${successMessages[command]}`);
    }
  } catch (error) {
    console.error(`\n❌ Dependency management failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/python-deps - Manage Python dependencies

Usage:
  /python-deps <command> [packages...] [options]

Commands:
  install [packages...]    Install dependencies
  add <package> [--dev]    Add new dependency
  remove <package>         Remove dependency
  update [packages...]     Update dependencies
  list                     List installed dependencies
  sync                     Sync dependencies with lock file
  lock                     Generate/update lock file
  check                    Check for dependency conflicts
  audit                    Audit dependencies for security vulnerabilities

Options:
  --dev, -d                Development dependency
  --optional, -o           Optional dependency
  --extras <extras>        Package extras
  --group <group>          Dependency group (poetry/uv)
  --python <version>       Python version constraint
  --no-dev                 Don't install development dependencies
  --no-optional            Don't install optional dependencies
  --only <group>           Only install specific group
  --frozen                 Install exact versions from lock file
  --upgrade, -U            Upgrade existing packages
  --verbose, -v            Verbose output
  --quiet, -q              Minimal output
  --json                   Output JSON format
  --tree, -t               Show dependency tree
  --outdated               Show outdated packages
  --manager <name>         Use specific dependency manager
  --file <path>            Use alternative dependency file
  --no-lock                Don't update lock file
  --help, -h               Show this help

Examples:
  /python-deps install                    # Install all dependencies
  /python-deps add fastapi                # Add new dependency
  /python-deps add pytest --dev           # Add development dependency
  /python-deps update                     # Update all dependencies
  /python-deps update fastapi             # Update specific package
  /python-deps list --tree                # List dependencies as tree
  /python-deps list --outdated            # Show outdated packages
  /python-deps remove old-package         # Remove dependency
  /python-deps sync                       # Sync with lock file
  /python-deps check                      # Check for conflicts
  /python-deps audit                      # Audit for security issues

Configuration:
  Reads from .opencode/project-config.json
  Uses dependencyManager: uv, poetry, pip, or conda
  `);
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;