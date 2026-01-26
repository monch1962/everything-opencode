#!/usr/bin/env node
/**
 * Project Language Detector
 *
 * Detects programming languages in a project with confidence scoring
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('../lib/utils');

class ProjectDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect all languages in project with confidence scores
   */
  async detectLanguages() {
    const detectors = [
      this.detectPython.bind(this),
      this.detectTypeScript.bind(this),
      this.detectGo.bind(this),
      this.detectRust.bind(this),
      this.detectPineScript.bind(this),
    ];

    const results = [];
    for (const detector of detectors) {
      const result = await detector();
      if (result.confidence > 0.3) {
        // Only include if reasonable confidence
        results.push(result);
      }
    }

    // Sort by confidence (highest first)
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect Python project
   */
  async detectPython() {
    const indicators = [];
    let confidence = 0;

    // Strong indicators
    if (fs.existsSync(path.join(this.projectPath, 'pyproject.toml'))) {
      indicators.push('pyproject.toml');
      confidence += 0.4;

      // Check for specific project types in pyproject.toml
      try {
        const content = fs.readFileSync(
          path.join(this.projectPath, 'pyproject.toml'),
          'utf8',
        );
        if (content.includes('fastapi') || content.includes('FastAPI')) {
          indicators.push('FastAPI project');
          confidence += 0.1;
        }
        if (content.includes('django')) {
          indicators.push('Django project');
          confidence += 0.1;
        }
        if (content.includes('flask')) {
          indicators.push('Flask project');
          confidence += 0.1;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    if (fs.existsSync(path.join(this.projectPath, 'requirements.txt'))) {
      indicators.push('requirements.txt');
      confidence += 0.3;
    }

    if (fs.existsSync(path.join(this.projectPath, 'setup.py'))) {
      indicators.push('setup.py');
      confidence += 0.2;
    }

    if (fs.existsSync(path.join(this.projectPath, 'Pipfile'))) {
      indicators.push('Pipfile');
      confidence += 0.2;
    }

    // Python files
    const pythonFiles = await glob('**/*.py', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });
    if (pythonFiles.length > 0) {
      indicators.push(`${pythonFiles.length} Python files`);
      confidence += Math.min(0.3, pythonFiles.length * 0.01);
    }

    // Directory structure hints
    if (fs.existsSync(path.join(this.projectPath, 'src'))) {
      const srcPythonFiles = await glob('src/**/*.py', {
        cwd: this.projectPath,
      });
      if (srcPythonFiles.length > 0) {
        indicators.push('src/ directory with Python files');
        confidence += 0.1;
      }
    }

    // Test files
    const testFiles = await glob('**/test_*.py', { cwd: this.projectPath });
    if (testFiles.length > 0) {
      indicators.push(`${testFiles.length} test files`);
      confidence += 0.1;
    }

    // Data science indicators
    const notebookFiles = await glob('**/*.ipynb', { cwd: this.projectPath });
    if (notebookFiles.length > 0) {
      indicators.push(`${notebookFiles.length} Jupyter notebooks`);
      confidence += 0.2;
    }

    // ML indicators
    const hasMLFiles = pythonFiles.some(
      (file) =>
        file.includes('model') ||
        file.includes('train') ||
        file.includes('predict'),
    );
    if (hasMLFiles) {
      indicators.push('ML-related files');
      confidence += 0.1;
    }

    // Cap confidence at 0.95
    confidence = Math.min(0.95, confidence);

    return {
      language: 'python',
      confidence,
      indicators,
      files: {
        python: pythonFiles.length,
        tests: testFiles.length,
        notebooks: notebookFiles.length,
      },
    };
  }

  /**
   * Detect TypeScript/JavaScript project
   */
  async detectTypeScript() {
    const indicators = [];
    let confidence = 0;

    // Strong indicators
    if (fs.existsSync(path.join(this.projectPath, 'package.json'))) {
      indicators.push('package.json');
      confidence += 0.4;

      try {
        const content = JSON.parse(
          fs.readFileSync(path.join(this.projectPath, 'package.json'), 'utf8'),
        );
        if (
          content.dependencies?.typescript ||
          content.devDependencies?.typescript
        ) {
          indicators.push('TypeScript dependency');
          confidence += 0.2;
        }
        if (content.scripts?.build?.includes('tsc')) {
          indicators.push('TypeScript build script');
          confidence += 0.1;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    if (fs.existsSync(path.join(this.projectPath, 'tsconfig.json'))) {
      indicators.push('tsconfig.json');
      confidence += 0.3;
    }

    if (fs.existsSync(path.join(this.projectPath, 'jsconfig.json'))) {
      indicators.push('jsconfig.json');
      confidence += 0.2;
    }

    // TypeScript files
    const tsFiles = await glob('**/*.ts', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });
    if (tsFiles.length > 0) {
      indicators.push(`${tsFiles.length} TypeScript files`);
      confidence += Math.min(0.3, tsFiles.length * 0.01);
    }

    // TypeScript React files
    const tsxFiles = await glob('**/*.tsx', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });
    if (tsxFiles.length > 0) {
      indicators.push(`${tsxFiles.length} TypeScript React files`);
      confidence += Math.min(0.2, tsxFiles.length * 0.01);
    }

    // JavaScript files (weaker indicator)
    const jsFiles = await glob('**/*.js', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });
    if (jsFiles.length > 0 && tsFiles.length === 0) {
      indicators.push(`${jsFiles.length} JavaScript files`);
      confidence += Math.min(0.2, jsFiles.length * 0.005);
    }

    // Next.js indicators
    if (
      fs.existsSync(path.join(this.projectPath, 'next.config.js')) ||
      fs.existsSync(path.join(this.projectPath, 'next.config.ts'))
    ) {
      indicators.push('Next.js project');
      confidence += 0.1;
    }

    // React indicators
    const hasReact =
      tsxFiles.length > 0 ||
      jsFiles.some((file) => file.includes('react') || file.includes('React'));
    if (hasReact) {
      indicators.push('React project');
      confidence += 0.1;
    }

    confidence = Math.min(0.95, confidence);

    return {
      language: 'typescript',
      confidence,
      indicators,
      files: {
        typescript: tsFiles.length,
        typescriptReact: tsxFiles.length,
        javascript: jsFiles.length,
      },
    };
  }

  /**
   * Detect Go project
   */
  async detectGo() {
    const indicators = [];
    let confidence = 0;

    if (fs.existsSync(path.join(this.projectPath, 'go.mod'))) {
      indicators.push('go.mod');
      confidence += 0.6;
    }

    if (fs.existsSync(path.join(this.projectPath, 'go.sum'))) {
      indicators.push('go.sum');
      confidence += 0.2;
    }

    const goFiles = await glob('**/*.go', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });
    if (goFiles.length > 0) {
      indicators.push(`${goFiles.length} Go files`);
      confidence += Math.min(0.3, goFiles.length * 0.01);
    }

    confidence = Math.min(0.95, confidence);

    return {
      language: 'go',
      confidence,
      indicators,
      files: {
        go: goFiles.length,
      },
    };
  }

  /**
   * Detect Rust project
   */
  async detectRust() {
    const indicators = [];
    let confidence = 0;

    if (fs.existsSync(path.join(this.projectPath, 'Cargo.toml'))) {
      indicators.push('Cargo.toml');
      confidence += 0.7;
    }

    if (fs.existsSync(path.join(this.projectPath, 'Cargo.lock'))) {
      indicators.push('Cargo.lock');
      confidence += 0.2;
    }

    const rustFiles = await glob('**/*.rs', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });
    if (rustFiles.length > 0) {
      indicators.push(`${rustFiles.length} Rust files`);
      confidence += Math.min(0.3, rustFiles.length * 0.01);
    }

    confidence = Math.min(0.95, confidence);

    return {
      language: 'rust',
      confidence,
      indicators,
      files: {
        rust: rustFiles.length,
      },
    };
  }

  /**
   * Detect PineScript project
   */
  async detectPineScript() {
    const indicators = [];
    let confidence = 0;
    let detectedVersion = null;
    let projectType = 'unknown';

    const pineFiles = await glob('**/*.pine', {
      cwd: this.projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });
    if (pineFiles.length > 0) {
      indicators.push(`${pineFiles.length} PineScript files`);
      confidence += Math.min(0.8, pineFiles.length * 0.1);
    }

    // Check for TradingView indicators in file content
    if (pineFiles.length > 0) {
      try {
        const sampleFile = pineFiles[0];
        const content = fs.readFileSync(
          path.join(this.projectPath, sampleFile),
          'utf8',
        );

        // Detect PineScript version
        const versionMatch = content.match(/\/\/@version=(\d+)/);
        if (versionMatch) {
          detectedVersion = versionMatch[1];
          indicators.push(`PineScript v${detectedVersion}`);
          confidence += 0.1;
        }

        // Detect project type
        if (content.includes('indicator(')) {
          projectType = 'indicator';
          indicators.push('TradingView indicator');
          confidence += 0.1;
        } else if (content.includes('strategy(')) {
          projectType = 'strategy';
          indicators.push('TradingView strategy');
          confidence += 0.1;
        }

        // Detect PineScript v5+ syntax
        if (content.includes('ta.') || content.includes('math.')) {
          indicators.push('PineScript v5+ syntax');
          confidence += 0.1;
        }

        // Detect alert configurations
        if (content.includes('alertcondition') || content.includes('alert.')) {
          indicators.push('Alert configurations');
          confidence += 0.05;
        }

        // Detect backtesting configurations
        if (
          content.includes('backtest') ||
          content.includes('strategy.entry') ||
          content.includes('strategy.exit')
        ) {
          indicators.push('Backtesting configurations');
          confidence += 0.05;
        }
      } catch (error) {
        // Ignore reading errors
      }
    }

    // Trading-related directories
    const tradingDirs = [
      'indicators',
      'strategies',
      'backtests',
      'trading',
      'alerts',
      'webhooks',
    ];
    for (const dir of tradingDirs) {
      if (fs.existsSync(path.join(this.projectPath, dir))) {
        indicators.push(`${dir}/ directory`);
        confidence += 0.05;
      }
    }

    // Check for configuration files
    const configFiles = [
      'pine-config.json',
      'tradingview-config.json',
      'backtest-config.json',
    ];
    for (const file of configFiles) {
      if (fs.existsSync(path.join(this.projectPath, file))) {
        indicators.push(`${file} configuration`);
        confidence += 0.05;
      }
    }

    confidence = Math.min(0.95, confidence);

    return {
      language: 'pinescript',
      confidence,
      indicators,
      detectedVersion,
      projectType,
      files: {
        pinescript: pineFiles.length,
      },
    };
  }

  /**
   * Detect PineScript project type in detail
   */
  async detectPineScriptProjectType() {
    const pineResult = await this.detectPineScript();
    if (pineResult.confidence < 0.3) {
      return 'unknown';
    }

    // If we already detected project type from file content, use it
    if (pineResult.projectType !== 'unknown') {
      return pineResult.projectType;
    }

    // Check directory structure for hints
    const projectPath = this.projectPath;

    if (fs.existsSync(path.join(projectPath, 'indicators'))) {
      const indicatorFiles = await glob('indicators/**/*.pine', {
        cwd: projectPath,
      });
      if (indicatorFiles.length > 0) {
        return 'indicator';
      }
    }

    if (fs.existsSync(path.join(projectPath, 'strategies'))) {
      const strategyFiles = await glob('strategies/**/*.pine', {
        cwd: projectPath,
      });
      if (strategyFiles.length > 0) {
        return 'strategy';
      }
    }

    if (fs.existsSync(path.join(projectPath, 'library'))) {
      const libraryFiles = await glob('library/**/*.pine', {
        cwd: projectPath,
      });
      if (libraryFiles.length > 0) {
        return 'library';
      }
    }

    // Check file content patterns for multiple files
    const pineFiles = await glob('**/*.pine', {
      cwd: projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });

    for (const file of pineFiles.slice(0, 3)) {
      // Check first 3 files
      try {
        const content = fs.readFileSync(path.join(projectPath, file), 'utf8');

        if (content.includes('indicator(')) {
          return 'indicator';
        }

        if (content.includes('strategy(')) {
          return 'strategy';
        }

        if (content.includes('library(') || content.includes('// Library:')) {
          return 'library';
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    return 'unknown';
  }

  /**
   * Get primary language (highest confidence)
   */
  async getPrimaryLanguage() {
    const languages = await this.detectLanguages();
    if (languages.length === 0) {
      return null;
    }
    return languages[0];
  }

  /**
   * Check if project has multiple languages
   */
  async hasMultipleLanguages(threshold = 0.4) {
    const languages = await this.detectLanguages();
    const significantLanguages = languages.filter(
      (lang) => lang.confidence >= threshold,
    );
    return significantLanguages.length > 1;
  }

  /**
   * Get project type for Python projects
   */
  async detectPythonProjectType() {
    const pythonResult = await this.detectPython();
    if (pythonResult.confidence < 0.3) {
      return 'unknown';
    }

    // Check for specific project types
    const projectPath = this.projectPath;

    // FastAPI - check for FastAPI imports or structure
    const hasFastAPI = await this.checkPythonProjectType(
      projectPath,
      'fastapi',
      ['from fastapi import', 'import fastapi', 'FastAPI(', 'APIRouter'],
    );

    if (hasFastAPI) return 'fastapi';

    // Django - check for manage.py and django imports
    if (fs.existsSync(path.join(projectPath, 'manage.py'))) {
      return 'django';
    }

    // Flask - check for Flask imports
    const hasFlask = await this.checkPythonProjectType(projectPath, 'flask', [
      'from flask import',
      'import flask',
      'Flask(',
    ]);

    if (hasFlask) return 'flask';

    // Data Science - check for notebooks and data science libraries
    const notebookFiles = await glob('**/*.ipynb', { cwd: projectPath });
    const hasDataScienceLibs = await this.checkPythonProjectType(
      projectPath,
      'data-science',
      [
        'import pandas',
        'import numpy',
        'import matplotlib',
        'import seaborn',
        'from sklearn',
      ],
    );

    if (notebookFiles.length > 0 || hasDataScienceLibs) {
      return 'data-science';
    }

    // Machine Learning - check for ML libraries
    const hasMLLibs = await this.checkPythonProjectType(
      projectPath,
      'machine-learning',
      [
        'import torch',
        'import tensorflow',
        'import keras',
        'from transformers',
        'import xgboost',
        'import lightgbm',
      ],
    );

    if (hasMLLibs) return 'machine-learning';

    // CLI tool - check for click, typer, argparse
    const hasCLILibs = await this.checkPythonProjectType(projectPath, 'cli', [
      'import click',
      'import typer',
      'import argparse',
    ]);

    if (hasCLILibs) return 'cli';

    // Library - check for setup.py/pyproject.toml with library metadata
    try {
      if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
        const content = fs.readFileSync(
          path.join(projectPath, 'pyproject.toml'),
          'utf8',
        );
        if (
          content.includes('[project]') ||
          content.includes('[tool.poetry]')
        ) {
          return 'library';
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return 'unknown';
  }

  /**
   * Helper to check Python project type by scanning files
   */
  async checkPythonProjectType(projectPath, type, patterns) {
    const pythonFiles = await glob('**/*.py', {
      cwd: projectPath,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });

    for (const file of pythonFiles.slice(0, 10)) {
      // Check first 10 files
      try {
        const content = fs.readFileSync(path.join(projectPath, file), 'utf8');
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            return true;
          }
        }
      } catch (error) {
        // Ignore reading errors
      }
    }

    return false;
  }

  /**
   * Get summary of project detection
   */
  async getProjectSummary() {
    const languages = await this.detectLanguages();
    const primary = languages.length > 0 ? languages[0] : null;
    const hasMultiple = await this.hasMultipleLanguages();

    let pythonProjectType = 'unknown';
    if (primary?.language === 'python') {
      pythonProjectType = await this.detectPythonProjectType();
    }

    return {
      languages,
      primaryLanguage: primary?.language || null,
      primaryConfidence: primary?.confidence || 0,
      hasMultipleLanguages: hasMultiple,
      pythonProjectType,
      projectPath: this.projectPath,
    };
  }
}

module.exports = ProjectDetector;
