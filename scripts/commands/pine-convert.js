#!/usr/bin/env node

const { PineCommandRunner } = require("../pinescript/command-runner");
const fs = require("fs").promises;
const path = require("path");

class PineConvertCommand extends PineCommandRunner {
  constructor() {
    super("pine-convert", "Convert PineScript between versions (v4 ↔ v5 ↔ v6)");
  }

  async run(args) {
    try {
      const config = await this.loadConfig();
      const pineConfig = config.pinescript;

      if (!pineConfig) {
        this.error(
          "PineScript configuration not found. Run /pine-setup first.",
        );
        return 1;
      }

      const options = this.parseArgs(args, {
        file: {
          type: "string",
          alias: "f",
          description: "PineScript file to convert",
        },
        from: {
          type: "string",
          description: "Source version (v4, v5, v6)",
          default: "auto",
        },
        to: {
          type: "string",
          alias: "t",
          description: "Target version (v4, v5, v6)",
          required: true,
        },
        output: {
          type: "string",
          alias: "o",
          description: "Output file (default: overwrite or add suffix)",
        },
        backup: {
          type: "boolean",
          alias: "b",
          description: "Create backup of original file",
          default: true,
        },
        dryRun: {
          type: "boolean",
          alias: "d",
          description: "Show changes without writing",
          default: false,
        },
        verbose: { type: "boolean", alias: "v", description: "Verbose output" },
      });

      const pineFile = options.file || this.findPineScriptFile();
      if (!pineFile) {
        this.error(
          "No PineScript file specified and none found in current directory.",
        );
        return 1;
      }

      if (!(await this.fileExists(pineFile))) {
        this.error(`File not found: ${pineFile}`);
        return 1;
      }

      const content = await fs.readFile(pineFile, "utf8");
      const sourceVersion =
        options.from === "auto" ? this.detectVersion(content) : options.from;

      if (!sourceVersion) {
        this.error(
          "Could not detect PineScript version. Please specify with --from flag.",
        );
        return 1;
      }

      if (sourceVersion === options.to) {
        this.warn(
          `Source and target versions are the same (${sourceVersion}). No conversion needed.`,
        );
        return 0;
      }

      this.log(`Converting ${pineFile} from ${sourceVersion} to ${options.to}`);

      if (options.backup && !options.dryRun) {
        const backupFile = `${pineFile}.backup`;
        await fs.copyFile(pineFile, backupFile);
        this.log(`Backup created: ${backupFile}`);
      }

      const converted = await this.convertVersion(
        content,
        sourceVersion,
        options.to,
        options.verbose,
      );

      if (options.dryRun) {
        this.log("\n=== DRY RUN - Proposed Changes ===");
        this.log(converted);
        this.log("\nOriginal file would be modified.");
        return 0;
      }

      const outputFile =
        options.output || this.getOutputFileName(pineFile, options.to);
      await fs.writeFile(outputFile, converted, "utf8");

      this.log(`Conversion complete: ${outputFile}`);

      const changes = this.getChangeSummary(content, converted);
      this.log(`\n=== CONVERSION SUMMARY ===`);
      this.log(`Changes made: ${changes.total}`);

      if (changes.breaking > 0) {
        this.warn(
          `Breaking changes: ${changes.breaking} - Manual review recommended`,
        );
      }

      if (changes.warnings.length > 0) {
        this.warn("Warnings:");
        changes.warnings.forEach((warning) => this.warn(`  - ${warning}`));
      }

      if (changes.notes.length > 0) {
        this.log("Notes:");
        changes.notes.forEach((note) => this.log(`  - ${note}`));
      }

      return 0;
    } catch (error) {
      this.error(`Conversion failed: ${error.message}`);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      return 1;
    }
  }

  detectVersion(content) {
    const versionMatch = content.match(/\/\/\s*@version\s*=\s*(\d+)/i);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }

    const oldVersionMatch = content.match(/study\s*\(/i);
    if (oldVersionMatch) {
      return "v4";
    }

    const newVersionMatch =
      content.match(/indicator\s*\(/i) || content.match(/strategy\s*\(/i);
    if (newVersionMatch) {
      return "v5";
    }

    return null;
  }

  async convertVersion(content, fromVersion, toVersion, verbose = false) {
    let converted = content;

    const conversionPath = `${fromVersion}_to_${toVersion}`;

    switch (conversionPath) {
      case "v4_to_v5":
        converted = await this.convertV4toV5(converted, verbose);
        break;
      case "v4_to_v6":
        converted = await this.convertV4toV5(converted, verbose);
        converted = await this.convertV5toV6(converted, verbose);
        break;
      case "v5_to_v4":
        converted = await this.convertV5toV4(converted, verbose);
        break;
      case "v5_to_v6":
        converted = await this.convertV5toV6(converted, verbose);
        break;
      case "v6_to_v5":
        converted = await this.convertV6toV5(converted, verbose);
        break;
      case "v6_to_v4":
        converted = await this.convertV6toV5(converted, verbose);
        converted = await this.convertV5toV4(converted, verbose);
        break;
      default:
        throw new Error(
          `Unsupported conversion: ${fromVersion} to ${toVersion}`,
        );
    }

    return converted;
  }

  async convertV4toV5(content, verbose) {
    let converted = content;
    const changes = [];

    this.log("Converting v4 to v5...");

    const conversions = [
      {
        pattern: /\/\/\s*@version\s*=\s*4/i,
        replacement: "//@version=5",
        description: "Update version declaration",
      },
      {
        pattern: /study\s*\(\s*["']([^"']+)["']/gi,
        replacement: (match, title) => {
          const isStrategy =
            content.includes("strategy.") || content.includes("strategy(");
          return isStrategy ? `strategy("${title}"` : `indicator("${title}"`;
        },
        description: "Convert study() to indicator() or strategy()",
      },
      {
        pattern: /plotshape\s*\(\s*([^,]+)\s*,\s*["']([^"']+)["']/gi,
        replacement: 'plotshape($1, title="$2"',
        description: "Update plotshape() arguments",
      },
      {
        pattern: /plotarrow\s*\(\s*([^,]+)\s*,\s*["']([^"']+)["']/gi,
        replacement: 'plotarrow($1, title="$2"',
        description: "Update plotarrow() arguments",
      },
      {
        pattern: /input\s*\(\s*([^,]+)\s*,\s*["']([^"']+)["']/gi,
        replacement: 'input($1, title="$2"',
        description: "Update input() arguments",
      },
      {
        pattern: /security\s*\(/gi,
        replacement: "request.security(",
        description: "Update security() to request.security()",
      },
      {
        pattern: /na\s*\(/gi,
        replacement: "na(",
        description: "Keep na() function (same in v5)",
      },
      {
        pattern: /nz\s*\(/gi,
        replacement: "nz(",
        description: "Keep nz() function (same in v5)",
      },
    ];

    conversions.forEach(({ pattern, replacement, description }) => {
      const before = converted;
      converted = converted.replace(pattern, replacement);
      if (before !== converted && verbose) {
        changes.push(description);
      }
    });

    if (verbose && changes.length > 0) {
      this.log(`Applied ${changes.length} v4→v5 conversions`);
      changes.forEach((change) => this.log(`  - ${change}`));
    }

    return converted;
  }

  async convertV5toV6(content, verbose) {
    let converted = content;
    const changes = [];

    this.log("Converting v5 to v6...");

    const conversions = [
      {
        pattern: /\/\/\s*@version\s*=\s*5/i,
        replacement: "//@version=6",
        description: "Update version declaration",
      },
      {
        pattern: /input\.float\s*\(/gi,
        replacement: "input.float(",
        description: "Keep input.float() (same in v6)",
      },
      {
        pattern: /input\.int\s*\(/gi,
        replacement: "input.int(",
        description: "Keep input.int() (same in v6)",
      },
      {
        pattern: /input\.bool\s*\(/gi,
        replacement: "input.bool(",
        description: "Keep input.bool() (same in v6)",
      },
      {
        pattern: /input\.string\s*\(/gi,
        replacement: "input.string(",
        description: "Keep input.string() (same in v6)",
      },
      {
        pattern: /input\.color\s*\(/gi,
        replacement: "input.color(",
        description: "Keep input.color() (same in v6)",
      },
      {
        pattern: /ta\./gi,
        replacement: "ta.",
        description: "Keep ta. namespace (same in v6)",
      },
      {
        pattern: /math\./gi,
        replacement: "math.",
        description: "Keep math. namespace (same in v6)",
      },
      {
        pattern: /strategy\./gi,
        replacement: "strategy.",
        description: "Keep strategy. namespace (same in v6)",
      },
    ];

    conversions.forEach(({ pattern, replacement, description }) => {
      const before = converted;
      converted = converted.replace(pattern, replacement);
      if (before !== converted && verbose) {
        changes.push(description);
      }
    });

    if (verbose && changes.length > 0) {
      this.log(`Applied ${changes.length} v5→v6 conversions`);
      changes.forEach((change) => this.log(`  - ${change}`));
    }

    return converted;
  }

  async convertV5toV4(content, verbose) {
    let converted = content;
    const changes = [];

    this.log("Converting v5 to v4...");

    const conversions = [
      {
        pattern: /\/\/\s*@version\s*=\s*5/i,
        replacement: "//@version=4",
        description: "Update version declaration",
      },
      {
        pattern: /indicator\s*\(\s*["']([^"']+)["']/gi,
        replacement: 'study("$1"',
        description: "Convert indicator() to study()",
      },
      {
        pattern: /strategy\s*\(\s*["']([^"']+)["']/gi,
        replacement: 'study("$1"',
        description:
          "Convert strategy() to study() (note: strategy features may be lost)",
      },
      {
        pattern:
          /plotshape\s*\(\s*([^,]+)\s*,\s*title\s*=\s*["']([^"']+)["']/gi,
        replacement: 'plotshape($1, "$2"',
        description: "Update plotshape() arguments",
      },
      {
        pattern: /input\s*\(\s*([^,]+)\s*,\s*title\s*=\s*["']([^"']+)["']/gi,
        replacement: 'input($1, "$2"',
        description: "Update input() arguments",
      },
      {
        pattern: /request\.security\s*\(/gi,
        replacement: "security(",
        description: "Update request.security() to security()",
      },
    ];

    conversions.forEach(({ pattern, replacement, description }) => {
      const before = converted;
      converted = converted.replace(pattern, replacement);
      if (before !== converted && verbose) {
        changes.push(description);
      }
    });

    if (verbose && changes.length > 0) {
      this.log(`Applied ${changes.length} v5→v4 conversions`);
      changes.forEach((change) => this.log(`  - ${change}`));
    }

    return converted;
  }

  async convertV6toV5(content, verbose) {
    let converted = content;
    const changes = [];

    this.log("Converting v6 to v5...");

    const conversions = [
      {
        pattern: /\/\/\s*@version\s*=\s*6/i,
        replacement: "//@version=5",
        description: "Update version declaration",
      },
    ];

    conversions.forEach(({ pattern, replacement, description }) => {
      const before = converted;
      converted = converted.replace(pattern, replacement);
      if (before !== converted && verbose) {
        changes.push(description);
      }
    });

    if (verbose && changes.length > 0) {
      this.log(`Applied ${changes.length} v6→v5 conversions`);
      changes.forEach((change) => this.log(`  - ${change}`));
    }

    return converted;
  }

  getOutputFileName(originalFile, targetVersion) {
    const ext = path.extname(originalFile);
    const base = path.basename(originalFile, ext);
    return `${base}.${targetVersion}${ext}`;
  }

  getChangeSummary(original, converted) {
    const originalLines = original.split("\n");
    const convertedLines = converted.split("\n");

    const changes = {
      total: 0,
      breaking: 0,
      warnings: [],
      notes: [],
    };

    const breakingPatterns = [
      /strategy\s*\(/i,
      /request\.security/,
      /ta\./,
      /math\./,
    ];

    breakingPatterns.forEach((pattern) => {
      const originalMatches = (original.match(pattern) || []).length;
      const convertedMatches = (converted.match(pattern) || []).length;

      if (originalMatches !== convertedMatches) {
        changes.breaking++;
      }
    });

    if (converted.includes("study(") && original.includes("strategy(")) {
      changes.warnings.push(
        "Strategy converted to study - trading logic may be lost",
      );
    }

    if (
      converted.includes("security(") &&
      original.includes("request.security(")
    ) {
      changes.notes.push(
        "request.security() converted to security() - check compatibility",
      );
    }

    changes.total = Math.abs(originalLines.length - convertedLines.length);

    return changes;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

if (require.main === module) {
  const command = new PineConvertCommand();
  command.execute(process.argv.slice(2));
}

module.exports = PineConvertCommand;
