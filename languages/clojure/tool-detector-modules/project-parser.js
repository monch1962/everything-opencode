#!/usr/bin/env node
/**
 * Project Parser Module for Clojure Tool Detector
 *
 * Parses project configuration files (deps.edn, project.clj)
 */

const fs = require('fs');
const path = require('path');

class ProjectParser {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Parse deps.edn file
   */
  async parseDepsEdn(depsEdnPath, projectInfo) {
    try {
      const content = fs.readFileSync(depsEdnPath, 'utf8');

      // Simple parsing for key information
      const lines = content.split('\n');

      // Look for :deps section
      let inDeps = false;
      let deps = [];

      // Look for project metadata
      let version = null;
      let description = null;
      let mainNamespace = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip comments and empty lines
        if (line.startsWith(';') || line === '') continue;

        // Check for :deps
        if (line.includes(':deps')) {
          inDeps = true;
          continue;
        }

        // Check for end of :deps (next top-level key)
        if (inDeps && line.startsWith(':')) {
          inDeps = false;
        }

        // Parse dependencies while in :deps section
        if (inDeps) {
          const depMatch = line.match(/\{([^}]+)\}/);
          if (depMatch) {
            deps.push(depMatch[1].trim());
          } else {
            const simpleDep = line.match(/([\w\.\-]+)\/[\w\.\-]+/);
            if (simpleDep) {
              deps.push(simpleDep[0]);
            }
          }
        }

        // Look for version
        if (line.includes(':version')) {
          const versionMatch = line.match(/:version\s+"([^"]+)"/);
          if (versionMatch) {
            version = versionMatch[1];
          }
        }

        // Look for description
        if (line.includes(':description')) {
          const descMatch = line.match(/:description\s+"([^"]+)"/);
          if (descMatch) {
            description = descMatch[1];
          }
        }

        // Look for main namespace
        if (line.includes(':main') || line.includes(':main-ns')) {
          const mainMatch = line.match(/:main(?:\-ns)?\s+([\w\.\-]+)/);
          if (mainMatch) {
            mainNamespace = mainMatch[1];
          }
        }
      }

      // Update project info
      projectInfo.version = version || projectInfo.version;
      projectInfo.description = description || projectInfo.description;
      projectInfo.mainNamespace = mainNamespace || projectInfo.mainNamespace;
      projectInfo.dependencies = deps;

      // Check if it's a library or application
      projectInfo.isLibrary = this.isLibraryProject(projectInfo);
      projectInfo.isApplication = this.isApplicationProject(projectInfo);
    } catch (error) {
      console.error(`Error parsing deps.edn: ${error.message}`);
    }

    return projectInfo;
  }

  /**
   * Parse project.clj file
   */
  async parseProjectClj(projectCljPath, projectInfo) {
    try {
      const content = fs.readFileSync(projectCljPath, 'utf8');

      // Simple parsing for key information
      const lines = content.split('\n');

      // Look for defproject
      let inDefproject = false;
      let defprojectContent = [];

      // Project metadata
      let version = null;
      let description = null;
      let mainNamespace = null;
      let dependencies = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip comments and empty lines
        if (line.startsWith(';') || line === '') continue;

        // Look for defproject
        if (line.startsWith('(defproject')) {
          inDefproject = true;

          // Extract project name and version from defproject line
          const defprojectMatch = line.match(/\(defproject\s+([^\s]+)\s+"([^"]+)"/);
          if (defprojectMatch) {
            version = defprojectMatch[2];
          }
          continue;
        }

        // Check for end of defproject
        if (inDefproject && line === ')') {
          inDefproject = false;
          break;
        }

        // Collect defproject content
        if (inDefproject) {
          defprojectContent.push(line);
        }
      }

      // Parse defproject content
      const defprojectText = defprojectContent.join(' ');

      // Look for description
      const descMatch = defprojectText.match(/:description\s+"([^"]+)"/);
      if (descMatch) {
        description = descMatch[1];
      }

      // Look for main namespace
      const mainMatch = defprojectText.match(/:main\s+([\w\.\-]+)/);
      if (mainMatch) {
        mainNamespace = mainMatch[1];
      }

      // Look for dependencies
      const depsMatch = defprojectText.match(/:dependencies\s+\[([^\]]+)\]/);
      if (depsMatch) {
        const depsText = depsMatch[1];
        // Simple dependency extraction
        const depRegex = /\[([^\]]+)\]/g;
        let match;
        while ((match = depRegex.exec(depsText)) !== null) {
          dependencies.push(match[1].trim());
        }

        // Also look for simple dependencies
        const simpleDeps = depsText.match(/([\w\.\-]+\/[\w\.\-]+)/g);
        if (simpleDeps) {
          dependencies.push(...simpleDeps);
        }
      }

      // Update project info
      projectInfo.version = version || projectInfo.version;
      projectInfo.description = description || projectInfo.description;
      projectInfo.mainNamespace = mainNamespace || projectInfo.mainNamespace;
      projectInfo.dependencies = dependencies;

      // Check if it's a library or application
      projectInfo.isLibrary = this.isLibraryProject(projectInfo);
      projectInfo.isApplication = this.isApplicationProject(projectInfo);
    } catch (error) {
      console.error(`Error parsing project.clj: ${error.message}`);
    }

    return projectInfo;
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
}

module.exports = ProjectParser;
