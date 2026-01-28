#!/usr/bin/env node
/**
 * Go Project Detector Module for GoConfigWizard
 *
 * Project detection methods: detectOrCreateProject, hasGoFiles, suggestModuleName, readGoMod
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('../../scripts/lib/utils');

class GoProjectDetector {
  constructor(projectPath, toolDetector) {
    this.projectPath = projectPath;
    this.toolDetector = toolDetector;
  }

  /**
   * Detect existing Go project or create new with Go-specific logic
   */
  async detectOrCreateProject(options) {
    console.log('🔍 Detecting Go project...');

    // Check for existing Go project files
    const hasGoMod = fs.existsSync(path.join(this.projectPath, 'go.mod'));
    const hasGoWork = fs.existsSync(path.join(this.projectPath, 'go.work'));
    const hasGoFiles = this.hasGoFiles(this.projectPath);

    if (hasGoMod || hasGoWork || hasGoFiles) {
      console.log('✅ Existing Go project detected');

      if (hasGoMod) {
        const modInfo = this.readGoMod();
        console.log(`   Module: ${modInfo.module || 'unknown'}`);
        if (modInfo.go) console.log(`   Go version: ${modInfo.go}`);
      }

      if (hasGoWork) {
        console.log('   📦 Go workspace detected (go.work)');
      }

      return {
        type: 'existing',
        hasGoMod,
        hasGoWork,
        hasGoFiles,
      };
    }

    // No existing project - create new
    console.log('📝 No existing Go project detected');

    if (options.quick || options.noPrompt) {
      return this.createDefaultProject(options);
    }

    // Interactive project creation
    return {
      type: 'new',
      needsInteractive: true,
    };
  }

  /**
   * Check if directory has Go files
   */
  hasGoFiles(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      return files.some((file) => file.endsWith('.go'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Read go.mod file
   */
  readGoMod() {
    try {
      const goModPath = path.join(this.projectPath, 'go.mod');
      const content = fs.readFileSync(goModPath, 'utf8');

      const moduleMatch = content.match(/module\s+(\S+)/);
      const goMatch = content.match(/go\s+(\d+\.\d+)/);

      return {
        module: moduleMatch ? moduleMatch[1] : null,
        go: goMatch ? goMatch[1] : null,
        content,
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Read go.work file
   */
  readGoWork() {
    try {
      const goWorkPath = path.join(this.projectPath, 'go.work');
      const content = fs.readFileSync(goWorkPath, 'utf8');

      const goMatch = content.match(/go\s+(\d+\.\d+)/);
      const useMatches = content.match(/use\s+(\S+)/g);

      return {
        go: goMatch ? goMatch[1] : null,
        uses: useMatches ? useMatches.map((m) => m.replace('use ', '')) : [],
        content,
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Suggest module name based on directory
   */
  suggestModuleName() {
    const basename = path.basename(this.projectPath);
    const parentDir = path.basename(path.dirname(this.projectPath));

    // Clean up name
    let moduleName = basename
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/^go-/, '')
      .replace(/-go$/, '');

    if (!moduleName) {
      moduleName = 'example';
    }

    // Check if we're in GOPATH-like structure
    const absPath = path.resolve(this.projectPath);
    if (absPath.includes('/go/src/')) {
      const srcIndex = absPath.indexOf('/go/src/');
      const relativePath = absPath.substring(srcIndex + 8); // 8 = length of '/go/src/'
      return relativePath.replace(/\//g, '/');
    }

    // Use github.com/username/repo pattern if possible
    const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    if (absPath.match(githubPattern)) {
      const match = absPath.match(githubPattern);
      return `${match[1]}/${match[2]}`;
    }

    // Default: use parent/name or just name
    if (parentDir && parentDir !== '..' && parentDir !== '.') {
      const cleanParent = parentDir.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanParent && cleanParent !== moduleName) {
        return `${cleanParent}/${moduleName}`;
      }
    }

    return moduleName;
  }

  /**
   * Create default project configuration
   */
  createDefaultProject(_options) {
    console.log('📁 Creating default Go module...');

    const moduleName = this.suggestModuleName();

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log(`✅ Created go.mod for module: ${moduleName}`);
    } catch (error) {
      console.log(`⚠️ Could not create go.mod: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'module',
      goVersion: this.toolDetector.getGoVersion() || '1.21',
    };
  }

  /**
   * Get project information
   */
  getProjectInfo() {
    const hasGoMod = fs.existsSync(path.join(this.projectPath, 'go.mod'));
    const hasGoWork = fs.existsSync(path.join(this.projectPath, 'go.work'));
    const hasGoFiles = this.hasGoFiles(this.projectPath);

    let modInfo = {};
    let workInfo = {};

    if (hasGoMod) {
      modInfo = this.readGoMod();
    }

    if (hasGoWork) {
      workInfo = this.readGoWork();
    }

    return {
      hasGoMod,
      hasGoWork,
      hasGoFiles,
      modInfo,
      workInfo,
      projectPath: this.projectPath,
      suggestedModuleName: this.suggestModuleName(),
    };
  }

  /**
   * Check if project is a workspace
   */
  isWorkspace() {
    return fs.existsSync(path.join(this.projectPath, 'go.work'));
  }

  /**
   * Check if project has modules
   */
  hasModules() {
    const hasGoMod = fs.existsSync(path.join(this.projectPath, 'go.mod'));
    const hasGoWork = fs.existsSync(path.join(this.projectPath, 'go.work'));

    return hasGoMod || hasGoWork;
  }

  /**
   * Get Go version from project
   */
  getProjectGoVersion() {
    const modInfo = this.readGoMod();
    if (modInfo.go) {
      return modInfo.go;
    }

    const workInfo = this.readGoWork();
    if (workInfo.go) {
      return workInfo.go;
    }

    return this.toolDetector.getGoVersion() || '1.21';
  }
}

module.exports = GoProjectDetector;
