#!/usr/bin/env node
/**
 * Template Generation Utilities
 *
 * Generate files and code from templates for language tools
 */

const path = require('path');
const fs = require('fs');
const { ensureDir, writeFile } = require('./utils');
const FileUtils = require('./file-utils');

class TemplateUtils {
  /**
   * Render template with variables
   */
  static renderTemplate(template, variables = {}) {
    if (typeof template !== 'string') {
      return template;
    }

    // Simple template rendering with {{variable}} syntax
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] !== undefined ? String(variables[variable]) : match;
    });
  }

  /**
   * Render template file
   */
  static renderTemplateFile(templatePath, variables = {}) {
    try {
      const template = fs.readFileSync(templatePath, 'utf8');
      return this.renderTemplate(template, variables);
    } catch (error) {
      throw new Error(`Failed to read template file ${templatePath}: ${error.message}`);
    }
  }

  /**
   * Generate file from template
   */
  static generateFile(templatePath, outputPath, variables = {}, options = {}) {
    const { overwrite = false, backup = true, createDir = true } = options;

    // Check if output file exists
    if (fs.existsSync(outputPath) && !overwrite) {
      throw new Error(`File already exists: ${outputPath}. Use overwrite option to replace.`);
    }

    // Create backup if needed
    if (backup && fs.existsSync(outputPath)) {
      const backupPath = `${outputPath}.backup.${Date.now()}`;
      fs.copyFileSync(outputPath, backupPath);
    }

    // Create directory if needed
    if (createDir) {
      ensureDir(path.dirname(outputPath));
    }

    // Render template
    const content = this.renderTemplateFile(templatePath, variables);

    // Write file
    writeFile(outputPath, content);

    return {
      path: outputPath,
      size: content.length,
      variables: Object.keys(variables),
    };
  }

  /**
   * Generate multiple files from template directory
   */
  static generateFromTemplateDir(templateDir, outputDir, variables = {}, options = {}) {
    const { _overwrite = false, _backup = true, _ignore = [], _transform = null } = options; // eslint-disable-line no-unused-vars

    const results = {
      generated: [],
      skipped: [],
      errors: [],
    };

    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    // Ensure output directory exists
    ensureDir(outputDir);

    // Process template directory
    this._processTemplateDir(templateDir, outputDir, variables, options, results, '');

    return results;
  }

  /**
   * Process template directory recursively
   */
  static _processTemplateDir(templateDir, outputDir, variables, options, results, relativePath) {
    try {
      const entries = fs.readdirSync(templateDir, { withFileTypes: true });

      for (const entry of entries) {
        const templatePath = path.join(templateDir, entry.name);
        const outputPath = path.join(outputDir, entry.name);
        const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

        // Check if path should be ignored
        const shouldIgnore = options.ignore.some((pattern) => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
          return regex.test(relPath);
        });

        if (shouldIgnore) {
          continue;
        }

        if (entry.isDirectory()) {
          // Process subdirectory
          ensureDir(outputPath);
          this._processTemplateDir(templatePath, outputPath, variables, options, results, relPath);
        } else {
          // Process file
          try {
            // Check if file should be processed as template
            const shouldProcess =
              entry.name.endsWith('.template') ||
              entry.name.includes('.tmpl.') ||
              options.processAll;

            let finalOutputPath = outputPath;
            let finalContent;

            if (shouldProcess) {
              // Remove template extension if present
              finalOutputPath = outputPath.replace(/\.template$/, '').replace(/\.tmpl\./, '.');

              // Render template
              const templateContent = fs.readFileSync(templatePath, 'utf8');
              finalContent = this.renderTemplate(templateContent, variables);

              // Apply transform if provided
              if (options.transform) {
                finalContent = options.transform(
                  finalContent,
                  templatePath,
                  finalOutputPath,
                  variables,
                );
              }
            } else {
              // Copy file as-is
              finalContent = fs.readFileSync(templatePath, 'utf8');
            }

            // Check if file exists and handle overwrite
            if (fs.existsSync(finalOutputPath) && !options.overwrite) {
              results.skipped.push({
                path: finalOutputPath,
                reason: 'File exists (overwrite disabled)',
              });
              continue;
            }

            // Create backup if needed
            if (options.backup && fs.existsSync(finalOutputPath)) {
              const backupPath = `${finalOutputPath}.backup.${Date.now()}`;
              fs.copyFileSync(finalOutputPath, backupPath);
            }

            // Write file
            ensureDir(path.dirname(finalOutputPath));
            writeFile(finalOutputPath, finalContent);

            results.generated.push({
              path: finalOutputPath,
              template: templatePath,
              size: finalContent.length,
              processed: shouldProcess,
            });
          } catch (error) {
            results.errors.push({
              path: templatePath,
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      results.errors.push({
        path: templateDir,
        error: error.message,
      });
    }
  }

  /**
   * Get language-specific templates
   */
  static getLanguageTemplates(language) {
    const templates = {
      go: {
        'main.go': `package main

import "fmt"

func main() {
    fmt.Println("Hello, {{name}}!")
}`,
        'go.mod': `module {{module}}

go {{goVersion}}`,
        '.gitignore': `# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary, built with 'go test -c'
*.test

# Output of the go coverage tool, specifically when used with LiteIDE
*.out

# Dependency directories
vendor/
`,
      },
      python: {
        'main.py': `#!/usr/bin/env python3
"""{{name}} - {{description}}"""

def main():
    print("Hello, {{name}}!")

if __name__ == "__main__":
    main()`,
        'requirements.txt': `# Project dependencies
`,
        '.gitignore': `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# PyInstaller
*.manifest
*.spec

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/
`,
      },
      elixir: {
        'mix.exs': `defmodule {{module}}.MixProject do
  use Mix.Project

  def project do
    [
      app: :{{app}},
      version: "{{version}}",
      elixir: "{{elixirVersion}}",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    []
  end
end`,
        '.gitignore': `# The directory Mix will write compiled artifacts to.
/_build/

# If you run "mix test --cover", coverage assets end up here.
/cover/

# The directory Mix downloads your dependencies sources to.
/deps/

# Where 3rd-party dependencies like ExDoc output generated docs.
/doc/

# Ignore .fetch files in case you like to edit your project deps locally.
/.fetch

# If the VM crashes, it generates a dump, let's ignore it too.
erl_crash.dump

# Also ignore archive artifacts (built via "mix archive.build").
*.ez

# Ignore package tarball (built via "mix hex.build").
{{app}}-*.tar
`,
      },
      node: {
        'package.json': `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "{{author}}",
  "license": "{{license}}"
}`,
        'index.js': `console.log('Hello, {{name}}!');`,
        '.gitignore': `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript v1 declaration files
typings/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
`,
      },
    };

    return templates[language] || {};
  }

  /**
   * Generate project structure for language
   */
  static generateLanguageProject(language, projectPath, variables = {}, options = {}) {
    const templates = this.getLanguageTemplates(language);

    if (Object.keys(templates).length === 0) {
      throw new Error(`No templates available for language: ${language}`);
    }

    const results = {
      language,
      projectPath,
      generated: [],
      errors: [],
    };

    // Ensure project directory exists
    ensureDir(projectPath);

    // Generate files
    for (const [filename, template] of Object.entries(templates)) {
      const filePath = path.join(projectPath, filename);

      try {
        // Check if file exists
        if (fs.existsSync(filePath) && !options.overwrite) {
          results.errors.push({
            file: filename,
            error: 'File exists (overwrite disabled)',
          });
          continue;
        }

        // Create backup if needed
        if (options.backup && fs.existsSync(filePath)) {
          const backupPath = `${filePath}.backup.${Date.now()}`;
          fs.copyFileSync(filePath, backupPath);
        }

        // Render template
        const content = this.renderTemplate(template, variables);

        // Ensure directory exists
        ensureDir(path.dirname(filePath));

        // Write file
        writeFile(filePath, content);

        results.generated.push({
          file: filename,
          path: filePath,
          size: content.length,
        });
      } catch (error) {
        results.errors.push({
          file: filename,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Generate configuration file for language
   */
  static generateLanguageConfig(language, configPath, variables = {}, options = {}) {
    const configTemplates = {
      go: {
        tools: {
          go: { installed: true, version: variables.goVersion || '1.21' },
          gopls: { installed: false },
          'golangci-lint': { installed: false },
          gosec: { installed: false },
        },
        build: {
          flags: [],
          ldflags: [],
        },
        test: {
          flags: ['-v'],
          coverage: true,
        },
      },
      python: {
        tools: {
          python: {
            installed: true,
            version: variables.pythonVersion || '3.11',
          },
          pip: { installed: true },
          pytest: { installed: false },
          ruff: { installed: false },
          black: { installed: false },
          mypy: { installed: false },
        },
        testRunner: 'pytest',
        linter: 'ruff',
        formatter: 'black',
        typeChecker: 'mypy',
        dependencyManager: 'pip',
      },
      elixir: {
        tools: {
          elixir: {
            installed: true,
            version: variables.elixirVersion || '1.15',
          },
          mix: { installed: true },
          hex: { installed: false },
          credo: { installed: false },
          dialyzer: { installed: false },
        },
        compile: {
          warningsAsErrors: false,
        },
        test: {
          coverage: true,
        },
      },
    };

    const config = configTemplates[language];

    if (!config) {
      throw new Error(`No configuration template available for language: ${language}`);
    }

    // Merge with variables
    const fullConfig = {
      ...config,
      ...variables,
      configuredAt: new Date().toISOString(),
    };

    // Write configuration
    FileUtils.writeJsonFile(configPath, fullConfig, options);

    return {
      language,
      configPath,
      config: fullConfig,
    };
  }

  /**
   * Generate README file for project
   */
  static generateReadme(projectPath, variables = {}, options = {}) {
    const readmeTemplate = `# {{name}}

{{description}}

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
{{installation}}
\`\`\`

## Usage

\`\`\`bash
{{usage}}
\`\`\`

## Development

\`\`\`bash
{{development}}
\`\`\`

## License

{{license}}

## Author

{{author}}
`;

    const readmePath = path.join(projectPath, 'README.md');
    const content = this.renderTemplate(readmeTemplate, variables);

    FileUtils.writeJsonFile(readmePath, { content }, { ...options, stringify: false });

    return {
      path: readmePath,
      size: content.length,
    };
  }

  /**
   * Generate .gitignore file for language
   */
  static generateGitignore(projectPath, language, _options = {}) {
    const gitignoreTemplates = this.getLanguageTemplates(language);
    const gitignore = gitignoreTemplates['.gitignore'];

    if (!gitignore) {
      // Default .gitignore
      const defaultGitignore = `# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Editor files
*.swp
*~
*.sublime-*
*.code-workspace
.vscode/
.idea/
*.iml

# Logs
*.log
`;

      const gitignorePath = path.join(projectPath, '.gitignore');
      writeFile(gitignorePath, defaultGitignore);

      return {
        path: gitignorePath,
        size: defaultGitignore.length,
        language: 'default',
      };
    }

    const gitignorePath = path.join(projectPath, '.gitignore');
    writeFile(gitignorePath, gitignore);

    return {
      path: gitignorePath,
      size: gitignore.length,
      language,
    };
  }

  /**
   * Validate template variables
   */
  static validateVariables(variables, required = []) {
    const missing = [];
    const invalid = [];

    for (const field of required) {
      if (variables[field] === undefined || variables[field] === '') {
        missing.push(field);
      }
    }

    // Validate specific field types
    if (variables.version && !/^\d+\.\d+\.\d+$/.test(variables.version)) {
      invalid.push('version (should be semver: x.y.z)');
    }

    if (variables.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(variables.email)) {
      invalid.push('email (invalid format)');
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      message:
        missing.length > 0
          ? `Missing required fields: ${missing.join(', ')}`
          : invalid.length > 0
            ? `Invalid fields: ${invalid.join(', ')}`
            : 'All variables are valid',
    };
  }
}

module.exports = TemplateUtils;
