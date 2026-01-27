#!/usr/bin/env node
/**
 * Python Project Analyzer Module for PythonCommandRunner
 *
 * Project analysis methods: getPythonExecutable, findPythonFiles, getPythonProjectInfo
 */

const path = require('path');
const fs = require('fs');
const { commandExists } = require('../../lib/utils');
const { FileUtils, LoggingUtils } = require('../../lib');

class PythonProjectAnalyzer {
  constructor(projectPath, pythonConfig) {
    this.projectPath = projectPath;
    this.pythonConfig = pythonConfig;
  }

  /**
   * Get Python executable name
   */
  getPythonExecutable() {
    // Check for python3 first, then python
    if (this.pythonConfig.tools?.python3?.installed) {
      return 'python3';
    } else if (this.pythonConfig.tools?.python?.installed) {
      return 'python';
    } else if (commandExists('python3')) {
      return 'python3';
    } else if (commandExists('python')) {
      return 'python';
    }

    throw new Error('Python not found. Install Python 3.8+ and run /python-setup.');
  }

  /**
   * Find Python files in the project
   */
  findPythonFiles(pattern = '**/*.py', excludePatterns = []) {
    try {
      return FileUtils.findFilesByPattern(this.projectPath, [pattern], {
        exclude: excludePatterns,
        language: 'python',
      });
    } catch (error) {
      LoggingUtils.warn('Failed to find Python files:', error.message);
      return [];
    }
  }

  /**
   * Get Python project metadata
   */
  getPythonProjectInfo() {
    try {
      const info = {
        hasRequirements: fs.existsSync(path.join(this.projectPath, 'requirements.txt')),
        hasPipfile: fs.existsSync(path.join(this.projectPath, 'Pipfile')),
        hasPyproject: fs.existsSync(path.join(this.projectPath, 'pyproject.toml')),
        hasSetupPy: fs.existsSync(path.join(this.projectPath, 'setup.py')),
        pythonFiles: this.findPythonFiles().length,
      };

      return info;
    } catch (error) {
      LoggingUtils.debug('Failed to get Python project info:', error.message);
      return null;
    }
  }

  /**
   * Check if project has specific Python file
   */
  hasFile(filename) {
    return fs.existsSync(path.join(this.projectPath, filename));
  }

  /**
   * Get Python version from configuration
   */
  getPythonVersion() {
    return this.pythonConfig.version || '3.8+';
  }

  /**
   * Get project dependencies
   */
  getDependencies() {
    const deps = [];

    // Check requirements.txt
    if (this.hasFile('requirements.txt')) {
      try {
        const content = fs.readFileSync(path.join(this.projectPath, 'requirements.txt'), 'utf8');
        const lines = content
          .split('\n')
          .filter((line) => line.trim() && !line.trim().startsWith('#'));
        deps.push(...lines.map((line) => line.trim().split('==')[0].split('>=')[0]));
      } catch (error) {
        LoggingUtils.debug('Failed to read requirements.txt:', error.message);
      }
    }

    // Check pyproject.toml
    if (this.hasFile('pyproject.toml')) {
      try {
        const content = fs.readFileSync(path.join(this.projectPath, 'pyproject.toml'), 'utf8');
        if (
          content.includes('[tool.poetry.dependencies]') ||
          content.includes('[project.dependencies]')
        ) {
          deps.push('pyproject.toml dependencies');
        }
      } catch (error) {
        LoggingUtils.debug('Failed to read pyproject.toml:', error.message);
      }
    }

    return deps;
  }

  /**
   * Get project structure summary
   */
  getProjectStructure() {
    const structure = {
      pythonFiles: this.findPythonFiles(),
      configFiles: [],
      testFiles: this.findPythonFiles('**/test_*.py'),
      hasTests: false,
      hasDocs: this.hasFile('docs/') || this.hasFile('README.md') || this.hasFile('README.rst'),
    };

    // Check for common config files
    const configFiles = [
      'setup.py',
      'setup.cfg',
      'pyproject.toml',
      'requirements.txt',
      'Pipfile',
      'Pipfile.lock',
      'tox.ini',
      '.python-version',
      '.pylintrc',
      '.flake8',
      'mypy.ini',
      'pyrightconfig.json',
    ];

    structure.configFiles = configFiles.filter((file) => this.hasFile(file));
    structure.hasTests = structure.testFiles.length > 0;

    return structure;
  }
}

module.exports = PythonProjectAnalyzer;
