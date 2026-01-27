#!/usr/bin/env node
/**
 * Build System Detector Module for Clojure Tool Detector
 *
 * Detects build systems and project configuration
 */

const fs = require('fs');
const path = require('path');

class BuildSystemDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect build system from project files
   */
  async detectBuildSystem() {
    const buildSystems = [];

    // Check for deps.edn (Clojure CLI)
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    if (fs.existsSync(depsEdnPath)) {
      buildSystems.push({
        name: 'clojure-cli',
        description: 'Clojure CLI (deps.edn)',
        configFile: 'deps.edn',
        path: depsEdnPath,
        confidence: 0.9,
      });
    }

    // Check for project.clj (Leiningen)
    const projectCljPath = path.join(this.projectPath, 'project.clj');
    if (fs.existsSync(projectCljPath)) {
      buildSystems.push({
        name: 'leiningen',
        description: 'Leiningen',
        configFile: 'project.clj',
        path: projectCljPath,
        confidence: 0.9,
      });
    }

    // Check for build.boot (Boot)
    const buildBootPath = path.join(this.projectPath, 'build.boot');
    if (fs.existsSync(buildBootPath)) {
      buildSystems.push({
        name: 'boot',
        description: 'Boot',
        configFile: 'build.boot',
        path: buildBootPath,
        confidence: 0.9,
      });
    }

    // Check for shadow-cljs.edn
    const shadowCljsPath = path.join(this.projectPath, 'shadow-cljs.edn');
    if (fs.existsSync(shadowCljsPath)) {
      buildSystems.push({
        name: 'shadow-cljs',
        description: 'Shadow CLJS',
        configFile: 'shadow-cljs.edn',
        path: shadowCljsPath,
        confidence: 0.8,
      });
    }

    // Check for bb.edn (Babashka)
    const bbEdnPath = path.join(this.projectPath, 'bb.edn');
    if (fs.existsSync(bbEdnPath)) {
      buildSystems.push({
        name: 'babashka',
        description: 'Babashka',
        configFile: 'bb.edn',
        path: bbEdnPath,
        confidence: 0.8,
      });
    }

    // Sort by confidence (highest first)
    return buildSystems.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect project type and configuration
   */
  async detectProject() {
    const projectInfo = {
      type: 'unknown',
      buildSystems: await this.detectBuildSystem(),
      hasDepsEdn: false,
      hasProjectClj: false,
      hasBuildBoot: false,
      hasShadowCljs: false,
      hasBbEdn: false,
      isLibrary: false,
      isApplication: false,
      mainNamespace: null,
      version: null,
      description: null,
      dependencies: [],
    };

    // Check for specific build system files
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');
    const buildBootPath = path.join(this.projectPath, 'build.boot');
    const shadowCljsPath = path.join(this.projectPath, 'shadow-cljs.edn');
    const bbEdnPath = path.join(this.projectPath, 'bb.edn');

    projectInfo.hasDepsEdn = fs.existsSync(depsEdnPath);
    projectInfo.hasProjectClj = fs.existsSync(projectCljPath);
    projectInfo.hasBuildBoot = fs.existsSync(buildBootPath);
    projectInfo.hasShadowCljs = fs.existsSync(shadowCljsPath);
    projectInfo.hasBbEdn = fs.existsSync(bbEdnPath);

    // Determine project type based on build systems
    if (projectInfo.buildSystems.length > 0) {
      const primarySystem = projectInfo.buildSystems[0];

      if (primarySystem.name === 'clojure-cli') {
        projectInfo.type = 'clojure-cli';
      } else if (primarySystem.name === 'leiningen') {
        projectInfo.type = 'leiningen';
      } else if (primarySystem.name === 'boot') {
        projectInfo.type = 'boot';
      } else if (primarySystem.name === 'shadow-cljs') {
        projectInfo.type = 'shadow-cljs';
      } else if (primarySystem.name === 'babashka') {
        projectInfo.type = 'babashka';
      }
    }

    return projectInfo;
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

module.exports = BuildSystemDetector;
