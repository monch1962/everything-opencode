#!/usr/bin/env node
/**
 * /pine-validate command wrapper
 *
 * Validate PineScript syntax and version compatibility
 */

const PineCommandRunner = require("../pinescript/command-runner");

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const files = [];

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--fix" || arg === "-f") {
      options.fix = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--quiet" || arg === "-q") {
      options.quiet = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--html") {
      options.html = true;
    } else if (arg === "--version" || arg === "-V") {
      options.version = args[++i];
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      files.push(arg);
    }
  }

  // If no files specified, validate all .pine files in current directory
  if (files.length === 0) {
    const fs = require("fs");
    const path = require("path");

    try {
      const allFiles = fs.readdirSync(process.cwd());
      const pineFiles = allFiles.filter((file) => file.endsWith(".pine"));

      if (pineFiles.length === 0) {
        console.error("No .pine files found in current directory");
        process.exit(1);
      }

      files.push(...pineFiles);
    } catch (error) {
      console.error(`Error reading directory: ${error.message}`);
      process.exit(1);
    }
  }

  try {
    const runner = new PineCommandRunner();
    await runner.initialize();

    const allResults = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const file of files) {
      if (!options.quiet) {
        console.log(`\n🔍 Validating: ${file}`);
      }

      try {
        const results = await runner.runValidation(file, options);
        const report = runner.generateValidationReport(results, options);

        allResults.push({
          file,
          results,
          report,
        });

        totalErrors += report.errorCount;
        totalWarnings += report.warningCount;
      } catch (error) {
        console.error(`❌ Failed to validate ${file}: ${error.message}`);
        allResults.push({
          file,
          error: error.message,
        });
        totalErrors++;
      }
    }

    // Summary
    if (!options.quiet) {
      console.log("\n" + "=".repeat(50));
      console.log("📊 Validation Summary:");
      console.log(`  Files validated: ${files.length}`);
      console.log(`  Total errors: ${totalErrors}`);
      console.log(`  Total warnings: ${totalWarnings}`);

      if (totalErrors === 0 && totalWarnings === 0) {
        console.log("\n✅ All files passed validation!");
      } else if (totalErrors === 0) {
        console.log("\n⚠️  Validation completed with warnings");
      } else {
        console.log("\n❌ Validation failed with errors");
      }
    }

    // JSON output if requested
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            summary: {
              files: files.length,
              errors: totalErrors,
              warnings: totalWarnings,
            },
            results: allResults,
          },
          null,
          2,
        ),
      );
    }

    // Exit with appropriate code
    if (totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
/pine-validate - Validate PineScript syntax and version compatibility

Usage:
  /pine-validate [options] [files...]

Options:
  --fix, -f            Attempt to fix common issues
  --verbose, -v        Verbose output with detailed information
  --quiet, -q          Minimal output (errors only)
  --json               Output results in JSON format
  --html               Generate HTML report
  --version, -V <ver>  Validate against specific version (4, 5, 6)
  --strict             Enable strict validation (more checks)
  --help, -h           Show this help

Examples:
  /pine-validate                         # Validate all .pine files in current directory
  /pine-validate my-strategy.pine        # Validate specific file
  /pine-validate strategies/*.pine       # Validate multiple files
  /pine-validate --version=5 --strict    # Strict validation for v5
  /pine-validate --json --quiet          # JSON output with minimal console output

Validation Checks:
  • Syntax and structure validation
  • Version compatibility checking
  • Deprecated function detection
  • Common PineScript pitfalls
  • Best practices recommendations

Exit Codes:
  0 - All files passed validation
  1 - Validation failed (errors found)
  2 - Configuration error
  3 - File not found or unreadable

See Also:
  /pine-setup    - Configure PineScript project
  /pine-convert  - Convert between PineScript versions
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
