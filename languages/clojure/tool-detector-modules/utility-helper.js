#!/usr/bin/env node
/**
 * Utility Helper Module for Clojure Tool Detector
 *
 * Helper methods and utilities
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('../../../scripts/lib/utils');

class UtilityHelper {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Get command path using which/where
   */
  async getCommandPath(command) {
    try {
      const isWindows = process.platform === 'win32';
      const whichCommand = isWindows ? 'where' : 'which';
      const result = await runCommand(whichCommand, [command]);

      if (result.success && result.stdout) {
        return result.stdout.trim().split('\n')[0];
      }
    } catch (error) {
      // command not found
    }

    return null;
  }

  /**
   * Count list items in lines starting from index
   */
  countListItems(lines, startIndex) {
    let count = 0;
    let depth = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') continue;

      // Count opening brackets
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;

      depth += openBrackets - closeBrackets;

      // If we're at top level and line contains a vector item
      if (depth === 1 && line.match(/^\s*\[/)) {
        count++;
      }

      // If we've closed all brackets, we're done
      if (depth <= 0 && i > startIndex) {
        break;
      }
    }

    return count;
  }

  /**
   * Extract list values from lines
   */
  extractListValues(lines, startIndex) {
    const values = [];
    let currentValue = '';
    let depth = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') continue;

      // Count brackets
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;

      depth += openBrackets - closeBrackets;

      // If we're at top level and starting a new item
      if (depth === 1 && line.match(/^\s*\[/)) {
        if (currentValue) {
          values.push(currentValue.trim());
          currentValue = '';
        }
        currentValue = line.replace(/^\s*\[\s*/, '');
      } else if (depth > 0) {
        // We're inside a list item
        currentValue += ' ' + line;
      }

      // If we've closed all brackets, we're done
      if (depth <= 0 && i > startIndex) {
        if (currentValue) {
          values.push(currentValue.trim());
        }
        break;
      }
    }

    return values;
  }

  /**
   * Check if project is a library
   */
  isLibraryProject(projectInfo) {
    // Library projects typically have specific characteristics
    if (!projectInfo.description) return false;

    const desc = projectInfo.description.toLowerCase();
    const libIndicators = [
      'library',
      'lib',
      'utility',
      'tool',
      'helper',
      'wrapper',
      'client',
      'sdk',
      'api',
    ];

    return libIndicators.some((indicator) => desc.includes(indicator));
  }

  /**
   * Check if project is an application
   */
  isApplicationProject(projectInfo) {
    // Application projects typically have main namespace
    if (projectInfo.mainNamespace) return true;

    if (!projectInfo.description) return false;

    const desc = projectInfo.description.toLowerCase();
    const appIndicators = [
      'application',
      'app',
      'service',
      'server',
      'web',
      'dashboard',
      'ui',
      'frontend',
      'backend',
    ];

    return appIndicators.some((indicator) => desc.includes(indicator));
  }

  /**
   * Get project type description
   */
  getProjectTypeDescription(project) {
    if (project.type === 'unknown') {
      return 'Unknown project type';
    }

    let description = '';

    switch (project.type) {
      case 'clojure-cli':
        description = 'Clojure CLI (deps.edn) project';
        break;
      case 'leiningen':
        description = 'Leiningen project';
        break;
      case 'boot':
        description = 'Boot project';
        break;
      case 'shadow-cljs':
        description = 'Shadow CLJS project';
        break;
      case 'babashka':
        description = 'Babashka script/project';
        break;
      default:
        description = project.type;
    }

    if (project.isLibrary) {
      description += ' (Library)';
    } else if (project.isApplication) {
      description += ' (Application)';
    }

    return description;
  }

  /**
   * Find configuration files in project
   */
  findConfigFiles(patterns) {
    const configFiles = [];

    for (const pattern of patterns) {
      const filePath = path.join(this.projectPath, pattern);
      if (fs.existsSync(filePath)) {
        configFiles.push(pattern);
      }
    }

    return configFiles;
  }

  /**
   * Check if framework indicators exist in project files
   */
  checkFrameworkInFiles(indicators) {
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    // Check deps.edn
    if (fs.existsSync(depsEdnPath)) {
      try {
        const content = fs.readFileSync(depsEdnPath, 'utf8');
        for (const indicator of indicators) {
          if (content.includes(indicator)) {
            return true;
          }
        }
      } catch (error) {
        // Error reading file
      }
    }

    // Check project.clj
    if (fs.existsSync(projectCljPath)) {
      try {
        const content = fs.readFileSync(projectCljPath, 'utf8');
        for (const indicator of indicators) {
          if (content.includes(indicator)) {
            return true;
          }
        }
      } catch (error) {
        // Error reading file
      }
    }

    return false;
  }
}

module.exports = UtilityHelper;
