#!/usr/bin/env node
/**
 * Project Structure Detection Utilities
 *
 * Detect project structure, frameworks, and language-specific patterns
 */

const path = require('path');
const fs = require('fs');
const { readFile } = require('./utils');
const FileUtils = require('./file-utils');

class ProjectUtils {
  /**
   * Detect project type based on files in directory
   */
  static detectProjectType(projectPath) {
    const detectors = [
      this.detectNodeProject,
      this.detectPythonProject,
      this.detectGoProject,
      this.detectElixirProject,
      this.detectRubyProject,
      this.detectJavaProject,
      this.detectRustProject,
      this.detectPhpProject,
      this.detectDotNetProject,
    ];

    const results = [];

    for (const detector of detectors) {
      const result = detector.call(this, projectPath);
      if (result.detected) {
        results.push(result);
      }
    }

    // Sort by confidence (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    if (results.length === 0) {
      return {
        detected: false,
        type: 'unknown',
        confidence: 0,
        message: 'No known project type detected',
      };
    }

    // Return the highest confidence result
    const primaryResult = results[0];

    // Include all detected types for reference
    primaryResult.allDetected = results.map((r) => ({
      type: r.type,
      confidence: r.confidence,
      framework: r.framework,
    }));

    return primaryResult;
  }

  /**
   * Detect Node.js project
   */
  static detectNodeProject(projectPath) {
    const files = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'node_modules',
    ];

    let confidence = 0;
    let framework = 'node';
    let packageJson = null;

    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      confidence += 40;
      try {
        packageJson = JSON.parse(readFile(packageJsonPath));

        // Check for framework indicators
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        if (dependencies.react || dependencies['react-dom']) {
          framework = 'react';
          confidence += 20;
        } else if (dependencies.vue || dependencies['@vue/cli-service']) {
          framework = 'vue';
          confidence += 20;
        } else if (dependencies.angular || dependencies['@angular/core']) {
          framework = 'angular';
          confidence += 20;
        } else if (dependencies.next || dependencies['next']) {
          framework = 'nextjs';
          confidence += 20;
        } else if (dependencies.express || dependencies['express']) {
          framework = 'express';
          confidence += 10;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check for lock files
    for (const lockFile of ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']) {
      if (fs.existsSync(path.join(projectPath, lockFile))) {
        confidence += 10;
        break;
      }
    }

    // Check for node_modules
    if (fs.existsSync(path.join(projectPath, 'node_modules'))) {
      confidence += 20;
    }

    // Check for common Node.js files
    const commonFiles = ['index.js', 'server.js', 'app.js', 'src/index.js'];
    for (const file of commonFiles) {
      if (fs.existsSync(path.join(projectPath, file))) {
        confidence += 5;
        break;
      }
    }

    return {
      detected: confidence >= 30,
      type: 'node',
      framework,
      confidence: Math.min(confidence, 100),
      packageJson,
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
    };
  }

  /**
   * Detect Python project
   */
  static detectPythonProject(projectPath) {
    const files = [
      'requirements.txt',
      'pyproject.toml',
      'setup.py',
      'Pipfile',
      'poetry.lock',
      'venv',
      '.venv',
      'env',
      '__pycache__',
    ];

    let confidence = 0;
    let framework = 'python';

    // Check for Python-specific files
    for (const file of ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile']) {
      if (fs.existsSync(path.join(projectPath, file))) {
        confidence += 25;
        break;
      }
    }

    // Check for virtual environment
    for (const venv of ['venv', '.venv', 'env']) {
      if (fs.existsSync(path.join(projectPath, venv))) {
        confidence += 20;
        break;
      }
    }

    // Check for Python files
    const pythonFiles = FileUtils.findLanguageFiles(projectPath, 'python');
    if (pythonFiles.length > 0) {
      confidence += 30;

      // Check for framework indicators in Python files
      for (const file of pythonFiles.slice(0, 10)) {
        // Check first 10 files
        const content = readFile(file.path);
        if (content.includes('from django')) {
          framework = 'django';
          confidence += 15;
          break;
        } else if (content.includes('from flask')) {
          framework = 'flask';
          confidence += 10;
          break;
        } else if (content.includes('from fastapi')) {
          framework = 'fastapi';
          confidence += 10;
          break;
        }
      }
    }

    // Check for __pycache__ directory
    if (fs.existsSync(path.join(projectPath, '__pycache__'))) {
      confidence += 10;
    }

    return {
      detected: confidence >= 30,
      type: 'python',
      framework,
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      pythonFileCount: pythonFiles.length,
    };
  }

  /**
   * Detect Go project
   */
  static detectGoProject(projectPath) {
    const files = ['go.mod', 'go.sum', 'vendor', 'Gopkg.toml', 'Gopkg.lock'];

    let confidence = 0;

    // Check for go.mod
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
      confidence += 60;
    }

    // Check for go.sum
    if (fs.existsSync(path.join(projectPath, 'go.sum'))) {
      confidence += 20;
    }

    // Check for Go files
    const goFiles = FileUtils.findLanguageFiles(projectPath, 'go');
    if (goFiles.length > 0) {
      confidence += 30;
    }

    // Check for vendor directory
    if (fs.existsSync(path.join(projectPath, 'vendor'))) {
      confidence += 10;
    }

    return {
      detected: confidence >= 30,
      type: 'go',
      framework: 'go',
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      goFileCount: goFiles.length,
    };
  }

  /**
   * Detect Elixir project
   */
  static detectElixirProject(projectPath) {
    const files = ['mix.exs', 'mix.lock', '_build', 'deps'];

    let confidence = 0;
    let framework = 'elixir';

    // Check for mix.exs
    if (fs.existsSync(path.join(projectPath, 'mix.exs'))) {
      confidence += 70;

      // Try to read mix.exs to detect Phoenix
      try {
        const content = readFile(path.join(projectPath, 'mix.exs'));
        if (content.includes('phoenix') || content.includes(':phoenix')) {
          framework = 'phoenix';
          confidence += 20;
        }
      } catch (e) {
        // Ignore read errors
      }
    }

    // Check for Elixir files
    const elixirFiles = FileUtils.findLanguageFiles(projectPath, 'elixir');
    if (elixirFiles.length > 0) {
      confidence += 30;
    }

    // Check for build directory
    if (fs.existsSync(path.join(projectPath, '_build'))) {
      confidence += 15;
    }

    // Check for deps directory
    if (fs.existsSync(path.join(projectPath, 'deps'))) {
      confidence += 10;
    }

    return {
      detected: confidence >= 30,
      type: 'elixir',
      framework,
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      elixirFileCount: elixirFiles.length,
    };
  }

  /**
   * Detect Ruby project
   */
  static detectRubyProject(projectPath) {
    const files = ['Gemfile', 'Gemfile.lock', 'Rakefile', 'config.ru'];

    let confidence = 0;
    let framework = 'ruby';

    // Check for Gemfile
    if (fs.existsSync(path.join(projectPath, 'Gemfile'))) {
      confidence += 50;

      // Try to read Gemfile to detect Rails
      try {
        const content = readFile(path.join(projectPath, 'Gemfile'));
        if (content.includes('rails')) {
          framework = 'rails';
          confidence += 30;
        }
      } catch (e) {
        // Ignore read errors
      }
    }

    // Check for Ruby files
    const rubyFiles = FileUtils.findLanguageFiles(projectPath, 'ruby');
    if (rubyFiles.length > 0) {
      confidence += 40;
    }

    // Check for Rakefile
    if (fs.existsSync(path.join(projectPath, 'Rakefile'))) {
      confidence += 20;
    }

    return {
      detected: confidence >= 30,
      type: 'ruby',
      framework,
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      rubyFileCount: rubyFiles.length,
    };
  }

  /**
   * Detect Java project
   */
  static detectJavaProject(projectPath) {
    const files = [
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'gradlew',
      'gradlew.bat',
      '.gradle',
    ];

    let confidence = 0;
    let framework = 'java';

    // Check for build files
    if (fs.existsSync(path.join(projectPath, 'pom.xml'))) {
      confidence += 60;
      framework = 'maven';
    } else if (
      fs.existsSync(path.join(projectPath, 'build.gradle')) ||
      fs.existsSync(path.join(projectPath, 'build.gradle.kts'))
    ) {
      confidence += 60;
      framework = 'gradle';
    }

    // Check for Java files
    const javaFiles = FileUtils.findLanguageFiles(projectPath, 'java');
    if (javaFiles.length > 0) {
      confidence += 40;
    }

    // Check for gradle wrapper
    if (
      fs.existsSync(path.join(projectPath, 'gradlew')) ||
      fs.existsSync(path.join(projectPath, 'gradlew.bat'))
    ) {
      confidence += 20;
    }

    return {
      detected: confidence >= 30,
      type: 'java',
      framework,
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      javaFileCount: javaFiles.length,
    };
  }

  /**
   * Detect Rust project
   */
  static detectRustProject(projectPath) {
    const files = ['Cargo.toml', 'Cargo.lock', 'target'];

    let confidence = 0;

    // Check for Cargo.toml
    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
      confidence += 80;
    }

    // Check for Rust files
    const rustFiles = FileUtils.findLanguageFiles(projectPath, 'rust');
    if (rustFiles.length > 0) {
      confidence += 30;
    }

    // Check for target directory
    if (fs.existsSync(path.join(projectPath, 'target'))) {
      confidence += 20;
    }

    return {
      detected: confidence >= 30,
      type: 'rust',
      framework: 'rust',
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      rustFileCount: rustFiles.length,
    };
  }

  /**
   * Detect PHP project
   */
  static detectPhpProject(projectPath) {
    const files = ['composer.json', 'composer.lock', 'vendor', 'index.php'];

    let confidence = 0;
    let framework = 'php';

    // Check for composer.json
    if (fs.existsSync(path.join(projectPath, 'composer.json'))) {
      confidence += 60;

      // Try to read composer.json to detect Laravel
      try {
        const content = readFile(path.join(projectPath, 'composer.json'));
        const composerJson = JSON.parse(content);
        if (composerJson.require && composerJson.require['laravel/framework']) {
          framework = 'laravel';
          confidence += 30;
        }
      } catch (e) {
        // Ignore read errors
      }
    }

    // Check for PHP files
    const phpFiles = FileUtils.findLanguageFiles(projectPath, 'php');
    if (phpFiles.length > 0) {
      confidence += 40;
    }

    // Check for vendor directory
    if (fs.existsSync(path.join(projectPath, 'vendor'))) {
      confidence += 20;
    }

    return {
      detected: confidence >= 30,
      type: 'php',
      framework,
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      phpFileCount: phpFiles.length,
    };
  }

  /**
   * Detect .NET project
   */
  static detectDotNetProject(projectPath) {
    let confidence = 0;
    let framework = 'dotnet';

    // Check for project files
    const projectFiles = FileUtils.findFilesByPattern(
      projectPath,
      ['*.csproj', '*.sln', '*.vbproj', '*.fsproj'],
      {
        recursive: false,
      },
    );

    if (projectFiles.length > 0) {
      confidence += 70;

      // Try to detect framework version
      try {
        const content = readFile(projectFiles[0].path);
        if (content.includes('net8.0') || content.includes('net9.0')) {
          framework = 'dotnet-core';
          confidence += 20;
        } else if (content.includes('netcoreapp')) {
          framework = 'dotnet-core';
          confidence += 15;
        } else if (content.includes('netframework')) {
          framework = 'dotnet-framework';
          confidence += 10;
        }
      } catch (e) {
        // Ignore read errors
      }
    }

    // Check for C# files
    const csFiles = FileUtils.findFilesByPattern(projectPath, ['**/*.cs'], {
      recursive: true,
      maxDepth: 3,
    });

    if (csFiles.length > 0) {
      confidence += 30;
    }

    // Check for build directories
    if (
      fs.existsSync(path.join(projectPath, 'bin')) ||
      fs.existsSync(path.join(projectPath, 'obj'))
    ) {
      confidence += 15;
    }

    return {
      detected: confidence >= 30,
      type: 'dotnet',
      framework,
      confidence: Math.min(confidence, 100),
      files: projectFiles.map((f) => f.relativePath),
      csFileCount: csFiles.length,
    };
  }

  /**
   * Get project structure summary
   */
  static getProjectStructure(projectPath, options = {}) {
    const {
      maxDepth = 3,
      _includeFiles = true, // eslint-disable-line no-unused-vars
      includeStats = true,
      ignorePatterns = [
        '**/node_modules/**',
        '**/.git/**',
        '**/vendor/**',
        '**/dist/**',
        '**/build/**',
        '**/target/**',
        '**/bin/**',
        '**/obj/**',
        '**/*.min.*',
        '**/*.bundle.*',
        '**/__pycache__/**',
      ],
    } = options;

    const structure = {
      path: projectPath,
      name: path.basename(projectPath),
      type: 'directory',
      children: [],
    };

    if (includeStats) {
      try {
        const stats = fs.statSync(projectPath);
        structure.stats = {
          size: stats.size,
          mtime: stats.mtime,
          ctime: stats.ctime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
        };
      } catch (e) {
        structure.stats = { error: e.message };
      }
    }

    function scanDir(currentPath, currentDepth, relativePath = '') {
      if (currentDepth > maxDepth) {
        return [];
      }

      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        const children = [];

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

          // Check if path should be ignored
          const shouldIgnore = ignorePatterns.some((pattern) => {
            const regex = new RegExp(
              pattern
                .replace(/\*\*/g, '.*')
                .replace(/\*/g, '[^/\\\\]*')
                .replace(/\?/g, '.')
                .replace(/\//g, '[\\\\/]'),
            );
            return regex.test(relPath);
          });

          if (shouldIgnore) {
            continue;
          }

          const item = {
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            type: entry.isDirectory() ? 'directory' : 'file',
          };

          if (includeStats) {
            try {
              const stats = fs.statSync(fullPath);
              item.stats = {
                size: stats.size,
                mtime: stats.mtime,
                ctime: stats.ctime,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
              };

              if (entry.isFile()) {
                item.extension = path.extname(entry.name).toLowerCase();
              }
            } catch (e) {
              item.stats = { error: e.message };
            }
          }

          if (entry.isDirectory() && currentDepth < maxDepth) {
            item.children = scanDir(fullPath, currentDepth + 1, relPath);
          }

          children.push(item);
        }

        // Sort: directories first, then files, both alphabetically
        children.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });

        return children;
      } catch (err) {
        // Ignore permission errors
        if (err.code !== 'EACCES' && err.code !== 'EPERM') {
          console.error(`Error scanning directory ${currentPath}:`, err.message);
        }
        return [];
      }
    }

    structure.children = scanDir(projectPath, 0);

    // Calculate summary statistics
    if (includeStats) {
      structure.summary = this.calculateStructureSummary(structure);
    }

    return structure;
  }

  /**
   * Calculate summary statistics for project structure
   */
  static calculateStructureSummary(structure) {
    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    const extensions = {};
    const largestFiles = [];

    function traverse(item) {
      if (item.type === 'directory') {
        totalDirectories++;
        if (item.children) {
          for (const child of item.children) {
            traverse(child);
          }
        }
      } else if (item.type === 'file') {
        totalFiles++;

        if (item.stats && item.stats.size) {
          totalSize += item.stats.size;

          // Track file extensions
          const ext = item.extension || path.extname(item.name).toLowerCase();
          if (ext) {
            extensions[ext] = (extensions[ext] || 0) + 1;
          }

          // Track largest files (keep top 10)
          largestFiles.push({
            path: item.relativePath,
            size: item.stats.size,
            mtime: item.stats.mtime,
          });
        }
      }
    }

    traverse(structure);

    // Sort largest files
    largestFiles.sort((a, b) => b.size - a.size);

    // Sort extensions by count
    const sortedExtensions = Object.entries(extensions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      totalFiles,
      totalDirectories,
      totalSize,
      extensions: sortedExtensions,
      largestFiles: largestFiles.slice(0, 10),
    };
  }

  /**
   * Get project metadata
   */
  static getProjectMetadata(projectPath) {
    const projectType = this.detectProjectType(projectPath);
    const structure = this.getProjectStructure(projectPath, {
      maxDepth: 2,
      includeStats: true,
    });

    // Try to read README
    let readme = null;
    const readmeFiles = ['README.md', 'README.txt', 'README', 'README.rst'];
    for (const file of readmeFiles) {
      const readmePath = path.join(projectPath, file);
      if (fs.existsSync(readmePath)) {
        try {
          readme = {
            file,
            content: `${readFile(readmePath).substring(0, 500)}...`,
            size: fs.statSync(readmePath).size,
          };
          break;
        } catch (e) {
          // Ignore read errors
        }
      }
    }

    // Try to get git info
    let gitInfo = null;
    try {
      const { runCommand } = require('./utils');
      const gitResult = runCommand('git rev-parse --git-dir', {
        cwd: projectPath,
      });
      if (gitResult.success) {
        const branchResult = runCommand('git branch --show-current', {
          cwd: projectPath,
        });
        const remoteResult = runCommand('git remote -v', { cwd: projectPath });

        gitInfo = {
          isGitRepo: true,
          branch: branchResult.success ? branchResult.output.trim() : 'unknown',
          remotes: remoteResult.success ? remoteResult.output.trim().split('\n') : [],
        };
      }
    } catch (e) {
      // Not a git repo or git not installed
    }

    return {
      path: projectPath,
      name: path.basename(projectPath),
      projectType,
      structure: structure.summary,
      readme,
      gitInfo,
      detectedAt: new Date().toISOString(),
    };
  }
}

module.exports = ProjectUtils;
