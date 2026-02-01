#!/usr/bin/env node
/**
 * /python-clean command wrapper
 *
 * Clean Python build artifacts and cache files
 */

const PythonCommandRunner = require('../python/command-runner');

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const extraArgs = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--cache-only') {
      options.cacheOnly = true;
    } else if (arg === '--build-only') {
      options.buildOnly = true;
    } else if (arg === '--coverage-only') {
      options.coverageOnly = true;
    } else if (arg === '--test-only') {
      options.testOnly = true;
    } else if (arg === '--dist-only') {
      options.distOnly = true;
    } else if (arg === '--egg-only') {
      options.eggOnly = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--confirm' || arg === '-c') {
      options.confirm = true;
    } else if (arg === '--setup') {
      options.setup = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      extraArgs.push(arg);
    }
  }

  try {
    const runner = new PythonCommandRunner();

    if (options.setup) {
      console.log('🔧 Setting up Python clean configuration...');
      console.log('Run /python-setup to configure your Python project.');
      process.exit(0);
    }

    console.log('🧹 Cleaning Python build artifacts...\n');

    // Show what will be cleaned
    if (options.dryRun) {
      console.log('📋 Dry run - showing what would be cleaned:');
      console.log('='.repeat(50));

      const items = [];

      if (
        options.all ||
        options.cacheOnly ||
        (!options.buildOnly &&
          !options.coverageOnly &&
          !options.testOnly &&
          !options.distOnly &&
          !options.eggOnly)
      ) {
        items.push('• __pycache__ directories');
        items.push('• *.pyc files');
        items.push('• *.pyo files');
        items.push('• *.pyd files');
      }

      if (options.all || options.buildOnly) {
        items.push('• build/ directories');
      }

      if (options.all || options.distOnly) {
        items.push('• dist/ directories');
      }

      if (options.all || options.eggOnly) {
        items.push('• *.egg-info directories');
      }

      if (options.all || options.coverageOnly) {
        items.push('• .coverage files');
        items.push('• htmlcov/ directories');
        items.push('• coverage.xml files');
      }

      if (options.all || options.testOnly) {
        items.push('• .pytest_cache/ directories');
        items.push('• test-results.xml files');
        items.push('• .tox/ directories (if exists)');
      }

      items.forEach((item) => console.log(item));

      console.log('='.repeat(50));
      console.log('\n✅ Dry run completed - no files were deleted');
      process.exit(0);
    }

    // Ask for confirmation if requested
    if (options.confirm) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        readline.question(
          'Are you sure you want to clean Python build artifacts? (y/N): ',
          resolve
        );
      });

      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Clean cancelled.');
        process.exit(0);
      }
    }

    // Run the clean
    await runner.cleanBuild(options);

    console.log('\n✅ Clean completed successfully');

    if (!options.quiet) {
      console.log('\n🧹 Cleaned items:');
      console.log('='.repeat(50));

      const cleaned = [];

      if (
        options.all ||
        options.cacheOnly ||
        (!options.buildOnly &&
          !options.coverageOnly &&
          !options.testOnly &&
          !options.distOnly &&
          !options.eggOnly)
      ) {
        cleaned.push('✓ __pycache__ directories');
        cleaned.push('✓ *.pyc, *.pyo, *.pyd files');
      }

      if (options.all || options.buildOnly) {
        cleaned.push('✓ build/ directories');
      }

      if (options.all || options.distOnly) {
        cleaned.push('✓ dist/ directories');
      }

      if (options.all || options.eggOnly) {
        cleaned.push('✓ *.egg-info directories');
      }

      if (options.all || options.coverageOnly) {
        cleaned.push('✓ .coverage files and htmlcov/');
      }

      if (options.all || options.testOnly) {
        cleaned.push('✓ .pytest_cache/ and test artifacts');
      }

      cleaned.forEach((item) => console.log(item));

      console.log('='.repeat(50));
    }

    console.log('\n💡 Tips:');
    console.log('  • Run regularly to free up disk space');
    console.log('  • Use --dry-run to see what will be cleaned');
    console.log('  • Consider adding clean to pre-commit hooks');
    console.log('  • For package development, clean before building distributions');
  } catch (error) {
    console.error(`\n❌ Clean failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/python-clean - Clean Python build artifacts and cache files

Usage:
  /python-clean [options]

Options:
  --all, -a               Clean everything (default)
  --cache-only            Clean only cache files (__pycache__, *.pyc, etc.)
  --build-only            Clean only build/ directories
  --dist-only             Clean only dist/ directories
  --egg-only              Clean only *.egg-info directories
  --coverage-only         Clean only coverage files (.coverage, htmlcov/)
  --test-only             Clean only test artifacts (.pytest_cache/, test-results.xml)
  --dry-run               Show what would be cleaned without actually deleting
  --verbose, -v           Verbose output
  --quiet, -q             Minimal output
  --confirm, -c           Ask for confirmation before cleaning
  --setup                 Show setup instructions
  --help, -h              Show this help

Examples:
  /python-clean
  /python-clean --all
  /python-clean --cache-only
  /python-clean --build-only --dist-only
  /python-clean --dry-run --verbose
  /python-clean --confirm

What gets cleaned:
  • __pycache__ directories
  • *.pyc, *.pyo, *.pyd files
  • build/ directories (build artifacts)
  • dist/ directories (distribution packages)
  • *.egg-info directories (egg metadata)
  • .coverage files (test coverage)
  • htmlcov/ directories (coverage reports)
  • .pytest_cache/ directories (pytest cache)
  • test-results.xml files (test reports)
  • .tox/ directories (tox environments, if exists)

Safety:
  • Only cleans known build/cache artifacts
  • Never deletes source code (*.py files)
  • Never deletes configuration files
  • Use --dry-run to preview changes
  • Use --confirm for safety

Note:
  Clean operations are generally safe but always review with --dry-run first
  Some IDEs/editors may need to restart after cleaning cache files
  `);
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main;
