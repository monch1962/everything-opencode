#!/usr/bin/env node
/**
 * Project Structure Analyzer Module
 *
 * Analyze project file structure and generate metadata
 */

const path = require('path');
const fs = require('fs');
const { readFile } = require('../utils');
const FileUtils = require('../file-utils');

class ProjectStructureAnalyzer {
  /**
   * Get project structure analysis
   */
  static getProjectStructure(projectPath, options = {}) {
    const defaultOptions = {
      maxDepth: 3,
      includeStats: false,
      excludePatterns: [
        'node_modules',
        '.git',
        '.DS_Store',
        'dist',
        'build',
        'coverage',
        '.next',
        '.nuxt',
        '.output',
        'target',
        'out',
        '.idea',
        '.vscode',
      ],
    };

    const config = { ...defaultOptions, ...options };
    const structure = {
      path: projectPath,
      name: path.basename(projectPath),
      type: 'directory',
      children: [],
      summary: {
        totalFiles: 0,
        totalDirectories: 0,
        totalSize: 0,
        extensions: {},
        largestFiles: [],
      },
    };

    // Track statistics
    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    const extensions = {};
    const largestFiles = [];

    /**
     * Recursive traversal function
     */
    function traverse(currentPath, depth = 0, parentNode = structure) {
      if (depth > config.maxDepth) {
        return;
      }

      try {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
          // Skip excluded patterns
          if (config.excludePatterns.some((pattern) => item.includes(pattern))) {
            continue;
          }

          const itemPath = path.join(currentPath, item);
          let stats;

          try {
            stats = fs.statSync(itemPath);
          } catch (e) {
            // Skip items we can't stat
            continue;
          }

          const node = {
            name: item,
            path: itemPath,
            relativePath: path.relative(projectPath, itemPath),
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            mtime: stats.mtime,
            ctime: stats.ctime,
          };

          if (config.includeStats) {
            node.stats = stats;
          }

          if (stats.isDirectory()) {
            totalDirectories++;
            node.children = [];
            parentNode.children.push(node);
            traverse(itemPath, depth + 1, node);
          } else {
            totalFiles++;
            totalSize += stats.size;
            parentNode.children.push(node);

            // Track file extensions
            const ext = path.extname(item).toLowerCase();
            if (ext) {
              extensions[ext] = (extensions[ext] || 0) + 1;
            }

            // Track largest files (keep top 10)
            largestFiles.push({
              path: node.relativePath,
              size: stats.size,
              mtime: stats.mtime,
            });
          }
        }
      } catch (e) {
        // Ignore permission errors or other issues
      }
    }

    // Start traversal
    traverse(projectPath);

    // Sort largest files
    largestFiles.sort((a, b) => b.size - a.size);

    // Sort extensions by count
    const sortedExtensions = Object.entries(extensions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Update summary
    structure.summary = {
      totalFiles,
      totalDirectories,
      totalSize,
      extensions: sortedExtensions,
      largestFiles: largestFiles.slice(0, 10),
    };

    return structure;
  }

  /**
   * Get project metadata
   */
  static getProjectMetadata(projectPath) {
    // Import ProjectTypeDetector to avoid circular dependency
    const ProjectTypeDetector = require('./project-type-detector');
    const projectType = ProjectTypeDetector.detectProjectType(projectPath);
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
      const { runCommand } = require('../utils');
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

module.exports = ProjectStructureAnalyzer;
