#!/usr/bin/env node
/**
 * Shared File Operation Utilities
 *
 * Common file operations for language tools
 */

const path = require("path");
const fs = require("fs");
const { ensureDir, readFile, writeFile } = require("./utils");

class FileUtils {
  /**
   * Find files by pattern in directory
   */
  static findFilesByPattern(dir, patterns, options = {}) {
    const {
      recursive = true,
      ignore = [],
      maxDepth = 10,
      caseSensitive = false,
    } = options;

    const results = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    // Convert patterns to regexes
    const regexPatterns = patterns.map((pattern) => {
      let regexStr = pattern
        .replace(/\./g, "\\.")
        .replace(/\*\*/g, "___DOUBLE_STAR___")
        .replace(/\*/g, "[^/\\\\]*")
        .replace(/___DOUBLE_STAR___/g, ".*")
        .replace(/\?/g, ".");

      // Handle directory separators
      regexStr = regexStr.replace(/\//g, "[\\\\/]");

      return new RegExp(`^${regexStr}$`, caseSensitive ? "" : "i");
    });

    // Convert ignore patterns to regexes
    const ignoreRegexes = ignore.map((pattern) => {
      let regexStr = pattern
        .replace(/\./g, "\\.")
        .replace(/\*\*/g, "___DOUBLE_STAR___")
        .replace(/\*/g, "[^/\\\\]*")
        .replace(/___DOUBLE_STAR___/g, ".*")
        .replace(/\?/g, ".");

      regexStr = regexStr.replace(/\//g, "[\\\\/]");

      return new RegExp(`^${regexStr}$`, caseSensitive ? "" : "i");
    });

    function shouldIgnore(filePath, relativePath) {
      return ignoreRegexes.some((regex) => regex.test(relativePath));
    }

    function searchDir(currentDir, currentDepth = 0, relativePath = "") {
      if (currentDepth > maxDepth) {
        return;
      }

      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          const relPath = relativePath
            ? path.join(relativePath, entry.name)
            : entry.name;

          // Check if path should be ignored
          if (shouldIgnore(fullPath, relPath)) {
            continue;
          }

          if (entry.isFile()) {
            // Check if file matches any pattern
            const matches = regexPatterns.some((regex) => regex.test(relPath));
            if (matches) {
              const stats = fs.statSync(fullPath);
              results.push({
                path: fullPath,
                relativePath: relPath,
                size: stats.size,
                mtime: stats.mtime,
                ctime: stats.ctime,
              });
            }
          } else if (entry.isDirectory() && recursive) {
            searchDir(fullPath, currentDepth + 1, relPath);
          }
        }
      } catch (err) {
        // Ignore permission errors
        if (err.code !== "EACCES" && err.code !== "EPERM") {
          throw err;
        }
      }
    }

    searchDir(dir);

    // Sort by modification time (newest first)
    results.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return results;
  }

  /**
   * Find language-specific files in project
   */
  static findLanguageFiles(projectPath, language) {
    const patterns = {
      go: ["**/*.go", "go.mod", "go.sum", "**/go.mod", "**/go.sum"],
      python: [
        "**/*.py",
        "requirements.txt",
        "pyproject.toml",
        "setup.py",
        "Pipfile",
        "**/requirements.txt",
      ],
      elixir: ["**/*.ex", "**/*.exs", "mix.exs", "**/mix.exs"],
      javascript: [
        "**/*.js",
        "**/*.jsx",
        "**/*.ts",
        "**/*.tsx",
        "package.json",
        "**/package.json",
      ],
      ruby: ["**/*.rb", "Gemfile", "**/Gemfile"],
      java: [
        "**/*.java",
        "pom.xml",
        "build.gradle",
        "**/pom.xml",
        "**/build.gradle",
      ],
      rust: ["**/*.rs", "Cargo.toml", "**/Cargo.toml"],
      php: ["**/*.php", "composer.json", "**/composer.json"],
    };

    const languagePatterns = patterns[language] || [`**/*.${language}`];
    const ignorePatterns = [
      "**/node_modules/**",
      "**/.git/**",
      "**/vendor/**",
      "**/dist/**",
      "**/build/**",
      "**/target/**",
      "**/*.min.*",
      "**/*.bundle.*",
    ];

    return this.findFilesByPattern(projectPath, languagePatterns, {
      recursive: true,
      ignore: ignorePatterns,
      maxDepth: 10,
    });
  }

  /**
   * Read and parse JSON file safely
   */
  static readJsonFile(filePath, defaultValue = null) {
    try {
      if (fs.existsSync(filePath)) {
        const content = readFile(filePath);
        return JSON.parse(content);
      }
    } catch (error) {
      console.error(`Error reading JSON file ${filePath}:`, error.message);
    }

    return defaultValue;
  }

  /**
   * Write JSON file with formatting
   */
  static writeJsonFile(filePath, data, options = {}) {
    const { indent = 2, backup = true, createDir = true } = options;

    if (createDir) {
      ensureDir(path.dirname(filePath));
    }

    // Create backup if requested and file exists
    if (backup && fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
    }

    writeFile(filePath, JSON.stringify(data, null, indent));

    return true;
  }

  /**
   * Read and parse YAML file (if yaml module is available)
   */
  static readYamlFile(filePath, defaultValue = null) {
    try {
      if (fs.existsSync(filePath)) {
        const content = readFile(filePath);

        // Try to load yaml module
        try {
          const yaml = require("yaml");
          return yaml.parse(content);
        } catch (e) {
          // Fallback to simple YAML parsing for common cases
          return this._parseSimpleYaml(content);
        }
      }
    } catch (error) {
      console.error(`Error reading YAML file ${filePath}:`, error.message);
    }

    return defaultValue;
  }

  /**
   * Simple YAML parser for common cases
   */
  static _parseSimpleYaml(content) {
    const lines = content.split("\n");
    const result = {};
    let currentKey = null;
    let currentValue = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === "" || trimmed.startsWith("#")) {
        continue;
      }

      if (trimmed.includes(":")) {
        // Save previous key-value pair
        if (currentKey !== null) {
          result[currentKey] = currentValue.join("\n").trim();
        }

        // Start new key-value pair
        const parts = trimmed.split(":");
        currentKey = parts[0].trim();
        currentValue = parts.slice(1).join(":").trim()
          ? [parts.slice(1).join(":").trim()]
          : [];
      } else if (currentKey !== null) {
        // Continue value for current key
        currentValue.push(trimmed);
      }
    }

    // Save last key-value pair
    if (currentKey !== null) {
      result[currentKey] = currentValue.join("\n").trim();
    }

    return result;
  }

  /**
   * Copy directory recursively
   */
  static copyDirectory(src, dest, options = {}) {
    const { overwrite = false, ignore = [], transform = null } = options;

    ensureDir(dest);

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      // Check if path should be ignored
      const relativePath = path.relative(src, srcPath);
      const shouldIgnore = ignore.some((pattern) => {
        const regex = new RegExp(
          pattern.replace(/\*/g, ".*").replace(/\?/g, "."),
        );
        return regex.test(relativePath);
      });

      if (shouldIgnore) {
        continue;
      }

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath, options);
      } else {
        // Check if file exists and we shouldn't overwrite
        if (fs.existsSync(destPath) && !overwrite) {
          continue;
        }

        if (transform) {
          const content = readFile(srcPath);
          const transformed = transform(content, srcPath, destPath);
          writeFile(destPath, transformed);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  /**
   * Create directory structure from template
   */
  static createDirectoryStructure(basePath, structure) {
    ensureDir(basePath);

    for (const [item, content] of Object.entries(structure)) {
      const itemPath = path.join(basePath, item);

      if (typeof content === "object" && content !== null) {
        // It's a directory
        this.createDirectoryStructure(itemPath, content);
      } else {
        // It's a file
        ensureDir(path.dirname(itemPath));
        writeFile(itemPath, content || "");
      }
    }
  }

  /**
   * Get file size in human-readable format
   */
  static getHumanFileSize(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  /**
   * Get file statistics
   */
  static getFileStats(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const content = readFile(filePath);

      return {
        exists: true,
        size: stats.size,
        sizeHuman: this.getHumanFileSize(stats.size),
        mtime: stats.mtime,
        ctime: stats.ctime,
        lines: content ? content.split("\n").length : 0,
        words: content ? content.split(/\s+/).length : 0,
        characters: content ? content.length : 0,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink(),
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  }

  /**
   * Search and replace in multiple files
   */
  static searchAndReplaceFiles(files, search, replace, options = {}) {
    const { backup = true, dryRun = false, verbose = false } = options;

    const results = {
      processed: 0,
      modified: 0,
      errors: 0,
      details: [],
    };

    for (const filePath of files) {
      try {
        if (!fs.existsSync(filePath)) {
          results.details.push({
            file: filePath,
            status: "skipped",
            reason: "File does not exist",
          });
          continue;
        }

        const content = readFile(filePath);
        const newContent = content.replace(search, replace);

        if (content !== newContent) {
          results.modified++;

          if (verbose) {
            console.log(`Would modify: ${filePath}`);
          }

          if (!dryRun) {
            // Create backup if requested
            if (backup) {
              const backupPath = `${filePath}.backup.${Date.now()}`;
              fs.copyFileSync(filePath, backupPath);
            }

            writeFile(filePath, newContent);
          }

          results.details.push({
            file: filePath,
            status: "modified",
            changes: 1,
          });
        } else {
          results.details.push({
            file: filePath,
            status: "unchanged",
            changes: 0,
          });
        }

        results.processed++;
      } catch (error) {
        results.errors++;
        results.details.push({
          file: filePath,
          status: "error",
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Create temporary file
   */
  static createTempFile(content = "", extension = ".tmp") {
    const os = require("os");
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `opencode_${Date.now()}${extension}`);

    writeFile(tempPath, content);

    return {
      path: tempPath,
      cleanup: () => {
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      },
    };
  }
}

module.exports = FileUtils;
