#!/usr/bin/env node
/**
 * Project Type Detector Module
 *
 * Detect project types for various programming languages
 */

const path = require('path');
const fs = require('fs');
const { readFile } = require('../utils');

class ProjectTypeDetector {
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
      'Pipfile',
      'pyproject.toml',
      'setup.py',
      'setup.cfg',
      'poetry.lock',
      'environment.yml',
      'conda.yml',
      '.python-version',
      'venv',
      '.venv',
      'env',
      'virtualenv',
    ];

    let confidence = 0;
    let framework = 'python';

    // Check for requirements.txt
    if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
      confidence += 30;
    }

    // Check for pyproject.toml
    if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
      confidence += 25;
    }

    // Check for setup.py
    if (fs.existsSync(path.join(projectPath, 'setup.py'))) {
      confidence += 20;
    }

    // Check for Pipfile
    if (fs.existsSync(path.join(projectPath, 'Pipfile'))) {
      confidence += 20;
    }

    // Check for virtual environment
    for (const venvDir of ['venv', '.venv', 'env', 'virtualenv']) {
      if (fs.existsSync(path.join(projectPath, venvDir))) {
        confidence += 15;
        break;
      }
    }

    // Check for Python files
    const pythonFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.py'));
    if (pythonFiles.length > 0) {
      confidence += pythonFiles.length * 2; // Up to 20 points
    }

    // Check for Django
    if (fs.existsSync(path.join(projectPath, 'manage.py'))) {
      framework = 'django';
      confidence += 20;
    }

    // Check for Flask
    const hasFlask = pythonFiles.some((file) => {
      try {
        const content = readFile(path.join(projectPath, file));
        return content.includes('from flask') || content.includes('import flask');
      } catch (e) {
        return false;
      }
    });
    if (hasFlask) {
      framework = 'flask';
      confidence += 15;
    }

    // Check for FastAPI
    const hasFastAPI = pythonFiles.some((file) => {
      try {
        const content = readFile(path.join(projectPath, file));
        return content.includes('from fastapi') || content.includes('import fastapi');
      } catch (e) {
        return false;
      }
    });
    if (hasFastAPI) {
      framework = 'fastapi';
      confidence += 15;
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
    const files = ['go.mod', 'go.sum', 'main.go', 'Gopkg.toml', 'Gopkg.lock', 'vendor'];

    let confidence = 0;

    // Check for go.mod
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
      confidence += 50;
    }

    // Check for go.sum
    if (fs.existsSync(path.join(projectPath, 'go.sum'))) {
      confidence += 20;
    }

    // Check for main.go
    if (fs.existsSync(path.join(projectPath, 'main.go'))) {
      confidence += 20;
    }

    // Check for Go files
    const goFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.go'));
    if (goFiles.length > 0) {
      confidence += goFiles.length * 3; // Up to 30 points
    }

    // Check for vendor directory
    if (fs.existsSync(path.join(projectPath, 'vendor'))) {
      confidence += 15;
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
    const files = ['mix.exs', 'mix.lock', '.formatter.exs', 'config', 'lib', 'test'];

    let confidence = 0;

    // Check for mix.exs
    if (fs.existsSync(path.join(projectPath, 'mix.exs'))) {
      confidence += 50;
    }

    // Check for mix.lock
    if (fs.existsSync(path.join(projectPath, 'mix.lock'))) {
      confidence += 20;
    }

    // Check for Elixir files
    const elixirFiles = fs
      .readdirSync(projectPath)
      .filter((file) => file.endsWith('.ex') || file.endsWith('.exs'));
    if (elixirFiles.length > 0) {
      confidence += elixirFiles.length * 3; // Up to 30 points
    }

    // Check for Phoenix framework
    if (fs.existsSync(path.join(projectPath, 'assets'))) {
      confidence += 15;
    }

    return {
      detected: confidence >= 30,
      type: 'elixir',
      framework: confidence >= 45 ? 'phoenix' : 'elixir',
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => fs.existsSync(path.join(projectPath, f))),
      elixirFileCount: elixirFiles.length,
    };
  }

  /**
   * Detect Ruby project
   */
  static detectRubyProject(projectPath) {
    const files = [
      'Gemfile',
      'Gemfile.lock',
      'Rakefile',
      'config.ru',
      '.ruby-version',
      'vendor/bundle',
    ];

    let confidence = 0;
    let framework = 'ruby';

    // Check for Gemfile
    if (fs.existsSync(path.join(projectPath, 'Gemfile'))) {
      confidence += 40;
    }

    // Check for Gemfile.lock
    if (fs.existsSync(path.join(projectPath, 'Gemfile.lock'))) {
      confidence += 20;
    }

    // Check for Ruby files
    const rubyFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.rb'));
    if (rubyFiles.length > 0) {
      confidence += rubyFiles.length * 3; // Up to 30 points
    }

    // Check for Rails
    if (fs.existsSync(path.join(projectPath, 'config', 'application.rb'))) {
      framework = 'rails';
      confidence += 25;
    }

    // Check for Rakefile
    if (fs.existsSync(path.join(projectPath, 'Rakefile'))) {
      confidence += 15;
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
      'gradle/wrapper',
      'settings.gradle',
      '.mvn',
      'src/main/java',
      'src/test/java',
    ];

    let confidence = 0;
    let framework = 'java';

    // Check for Maven
    if (fs.existsSync(path.join(projectPath, 'pom.xml'))) {
      confidence += 40;
      framework = 'maven';
    }

    // Check for Gradle
    if (
      fs.existsSync(path.join(projectPath, 'build.gradle')) ||
      fs.existsSync(path.join(projectPath, 'build.gradle.kts'))
    ) {
      confidence += 40;
      framework = 'gradle';
    }

    // Check for Java files
    const javaFiles = [];
    function findJavaFiles(dir) {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            findJavaFiles(itemPath);
          } else if (item.endsWith('.java')) {
            javaFiles.push(itemPath);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    findJavaFiles(projectPath);

    if (javaFiles.length > 0) {
      confidence += Math.min(javaFiles.length, 10) * 3; // Up to 30 points
    }

    // Check for Spring Boot
    const hasSpring = javaFiles.some((file) => {
      try {
        const content = readFile(file);
        return (
          content.includes('@SpringBootApplication') ||
          content.includes('import org.springframework')
        );
      } catch (e) {
        return false;
      }
    });
    if (hasSpring) {
      framework = 'spring-boot';
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
    const files = ['Cargo.toml', 'Cargo.lock', 'src/main.rs', 'src/lib.rs', 'target'];

    let confidence = 0;

    // Check for Cargo.toml
    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
      confidence += 50;
    }

    // Check for Cargo.lock
    if (fs.existsSync(path.join(projectPath, 'Cargo.lock'))) {
      confidence += 20;
    }

    // Check for Rust files
    const rustFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.rs'));
    if (rustFiles.length > 0) {
      confidence += rustFiles.length * 3; // Up to 30 points
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
    const files = ['composer.json', 'composer.lock', 'index.php', 'vendor', '.php-version'];

    let confidence = 0;
    let framework = 'php';

    // Check for composer.json
    if (fs.existsSync(path.join(projectPath, 'composer.json'))) {
      confidence += 40;
    }

    // Check for composer.lock
    if (fs.existsSync(path.join(projectPath, 'composer.lock'))) {
      confidence += 20;
    }

    // Check for PHP files
    const phpFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.php'));
    if (phpFiles.length > 0) {
      confidence += phpFiles.length * 3; // Up to 30 points
    }

    // Check for Laravel
    if (fs.existsSync(path.join(projectPath, 'artisan'))) {
      framework = 'laravel';
      confidence += 25;
    }

    // Check for Symfony
    if (fs.existsSync(path.join(projectPath, 'symfony.lock'))) {
      framework = 'symfony';
      confidence += 25;
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
   * Detect C#/.NET project
   */
  static detectDotNetProject(projectPath) {
    const files = [
      '*.csproj',
      '*.fsproj',
      '*.vbproj',
      '*.sln',
      'packages.config',
      'Properties',
      'wwwroot',
      'Program.cs',
      'Startup.cs',
      'appsettings.json',
    ];

    let confidence = 0;
    let framework = 'csharp';

    // Check for C# project files (prioritize .csproj)
    const csprojFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.csproj'));
    if (csprojFiles.length > 0) {
      confidence += csprojFiles.length * 25; // 25 points per C# project file
      framework = 'csharp';
    }

    // Check for other .NET project files
    const otherProjectFiles = fs
      .readdirSync(projectPath)
      .filter((file) => file.endsWith('.fsproj') || file.endsWith('.vbproj'));
    if (otherProjectFiles.length > 0) {
      confidence += otherProjectFiles.length * 15; // 15 points for other .NET projects
    }

    // Check for solution file
    const solutionFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.sln'));
    if (solutionFiles.length > 0) {
      confidence += 30;
    }

    // Check for C# files
    const csFiles = fs.readdirSync(projectPath).filter((file) => file.endsWith('.cs'));
    if (csFiles.length > 0) {
      confidence += Math.min(csFiles.length, 10) * 3; // Up to 30 points
    }

    // Check for ASP.NET Core specific files
    if (
      fs.existsSync(path.join(projectPath, 'Program.cs')) ||
      fs.existsSync(path.join(projectPath, 'Startup.cs')) ||
      fs.existsSync(path.join(projectPath, 'appsettings.json'))
    ) {
      confidence += 20;
    }

    // Check for ASP.NET Core in code
    const hasAspNetCore = csFiles.some((file) => {
      try {
        const content = readFile(path.join(projectPath, file));
        return (
          content.includes('Microsoft.AspNetCore') ||
          content.includes('WebApplication.CreateBuilder') ||
          content.includes('IApplicationBuilder') ||
          content.includes('IServiceCollection')
        );
      } catch (e) {
        return false;
      }
    });
    if (hasAspNetCore) {
      framework = 'aspnet-core';
      confidence += 25;
    }

    // Check for Blazor
    const hasBlazor = csFiles.some((file) => {
      try {
        const content = readFile(path.join(projectPath, file));
        return (
          content.includes('Microsoft.AspNetCore.Components') ||
          content.includes('Blazor') ||
          content.includes('Router')
        );
      } catch (e) {
        return false;
      }
    });
    if (hasBlazor) {
      framework = 'blazor';
      confidence += 20;
    }

    // Check for WPF/WinForms
    const hasWindowsDesktop = csprojFiles.some((file) => {
      try {
        const content = readFile(path.join(projectPath, file));
        return (
          content.includes('Microsoft.NET.Sdk.WindowsDesktop') ||
          content.includes('UseWPF') ||
          content.includes('UseWindowsForms')
        );
      } catch (e) {
        return false;
      }
    });
    if (hasWindowsDesktop) {
      framework = 'wpf';
      confidence += 20;
    }

    return {
      detected: confidence >= 30,
      type: 'csharp', // Changed from 'dotnet' to 'csharp' for consistency
      framework,
      confidence: Math.min(confidence, 100),
      files: files.filter((f) => {
        if (f.includes('*')) {
          const pattern = f.replace('*', '');
          return fs.readdirSync(projectPath).some((file) => file.endsWith(pattern));
        }
        return fs.existsSync(path.join(projectPath, f));
      }),
      projectFileCount: csprojFiles.length + otherProjectFiles.length,
      csFileCount: csFiles.length,
      hasSolution: solutionFiles.length > 0,
    };
  }
}

module.exports = ProjectTypeDetector;
