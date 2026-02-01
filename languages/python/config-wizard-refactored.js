#!/usr/bin/env node
/**
 * Python Configuration Wizard - Refactored to match JavaScript pattern
 *
 * Interactive configuration for Python projects
 * Following JavaScript/TypeScript pattern exactly
 */

const fs = require('fs');
const path = require('path');
const PythonToolDetector = require('./tool-detector');

class PythonConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.toolDetector = new PythonToolDetector();
    this.detectedTools = null;
  }

  /**
   * Run interactive configuration wizard for Python projects
   */
  async runWizard(options = {}) {
    console.log('🐍 Python Project Configuration Wizard\n');

    // Detect tools first
    this.detectedTools = await this.toolDetector.detectTools();
    const report = this.toolDetector.generateEnvironmentReport(this.detectedTools);

    // Show environment report
    this.showEnvironmentReport(report);

    // Check if Python is installed
    if (!report.summary.pythonInstalled) {
      console.log('❌ Python is not installed. Please install Python first.');
      this.showInstallationGuide('python');
      return null;
    }

    // Detect project type (Django, Flask, FastAPI, standard Python, etc.)
    const projectType = await this.detectProjectType(options);

    // Configure project based on type
    const config = await this.configureProject(projectType, options);

    // Generate configuration
    const fullConfig = this.generateConfiguration(config, report);

    // Save configuration
    const saved = await this.saveConfiguration(fullConfig);

    if (saved) {
      console.log('\n✅ Configuration saved successfully!');
      this.showNextSteps(fullConfig);
      return fullConfig;
    } else {
      console.log('\n❌ Failed to save configuration.');
      return null;
    }
  }

  /**
   * Show environment report
   */
  showEnvironmentReport(report) {
    console.log('📊 Environment Report:');
    console.log('='.repeat(50));

    // Python installation
    if (report.summary.pythonInstalled) {
      console.log(`✓ Python ${report.summary.pythonVersion} installed`);
    } else {
      console.log('✗ Python not installed');
    }

    // Package managers
    console.log('\n📦 Package Managers:');
    report.packageManagers.forEach((pm) => {
      console.log(`  ${pm.installed ? '✓' : '✗'} ${pm.name} ${pm.version || ''}`);
    });

    // Frameworks
    console.log('\n🚀 Frameworks:');
    report.frameworks.forEach((fw) => {
      console.log(`  ${fw.installed ? '✓' : '✗'} ${fw.name} ${fw.version || ''}`);
    });

    // Development tools
    console.log('\n🔧 Development Tools:');
    report.tools.forEach((tool) => {
      if (tool.installed) {
        console.log(`  ✓ ${tool.name} ${tool.version || ''}`);
      }
    });

    console.log('='.repeat(50));
  }

  /**
   * Show installation guide for missing tools
   */
  showInstallationGuide(tool) {
    console.log('\n📚 Installation Guide:');

    switch (tool) {
      case 'python':
        console.log(`
For macOS (using Homebrew):
  brew install python

For Ubuntu/Debian:
  sudo apt update
  sudo apt install python3 python3-pip python3-venv

For Windows:
  Download from https://www.python.org/downloads/
  Make sure to check "Add Python to PATH"

For all platforms (recommended):
  Consider using pyenv for Python version management:
  https://github.com/pyenv/pyenv
        `);
        break;

      case 'pip':
        console.log(`
Pip is usually installed with Python. If missing:

For Python 3:
  python3 -m ensurepip --upgrade

Or download get-pip.py:
  curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
  python3 get-pip.py
        `);
        break;

      default:
        console.log(`Please install ${tool} to continue.`);
    }
  }

  /**
   * Detect Python project type
   */
  async detectProjectType(options = {}) {
    console.log('\n🔍 Detecting project type...');

    const projectTypes = [
      { name: 'Django', files: ['manage.py', 'requirements.txt'], indicators: ['django'] },
      { name: 'Flask', files: ['app.py', 'requirements.txt'], indicators: ['flask'] },
      { name: 'FastAPI', files: ['main.py', 'requirements.txt'], indicators: ['fastapi'] },
      { name: 'Standard Python', files: ['setup.py', 'pyproject.toml'], indicators: [] },
      {
        name: 'Data Science',
        files: ['requirements.txt', 'environment.yml'],
        indicators: ['jupyter', 'numpy', 'pandas'],
      },
      { name: 'Package/Library', files: ['setup.py', 'pyproject.toml'], indicators: [] },
    ];

    const detectedTypes = [];

    for (const type of projectTypes) {
      let score = 0;

      // Check for files
      for (const file of type.files) {
        if (fs.existsSync(path.join(this.projectPath, file))) {
          score += 2;
        }
      }

      // Check for indicators in requirements/pyproject.toml
      for (const indicator of type.indicators) {
        if (await this.checkForIndicator(indicator)) {
          score += 1;
        }
      }

      if (score > 0) {
        detectedTypes.push({ name: type.name, score });
      }
    }

    if (detectedTypes.length === 0) {
      console.log('No specific project type detected. Using standard Python.');
      return 'standard';
    }

    // Sort by score
    detectedTypes.sort((a, b) => b.score - a.score);

    console.log(`Detected: ${detectedTypes[0].name} (score: ${detectedTypes[0].score})`);

    // If quick mode or only one type detected, return it
    if (options.quick || detectedTypes.length === 1) {
      return detectedTypes[0].name.toLowerCase();
    }

    // Otherwise, ask user
    console.log('\n📋 Multiple project types detected:');
    detectedTypes.forEach((type, index) => {
      console.log(`  ${index + 1}. ${type.name} (score: ${type.score})`);
    });

    const answer = await this.promptUser(
      `Select project type (1-${detectedTypes.length}): `,
      (input) => {
        const num = parseInt(input);
        return num >= 1 && num <= detectedTypes.length;
      }
    );

    return detectedTypes[parseInt(answer) - 1].name.toLowerCase();
  }

  /**
   * Check for indicator in project files
   */
  async checkForIndicator(indicator) {
    const files = ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'];

    for (const file of files) {
      const filePath = path.join(this.projectPath, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.toLowerCase().includes(indicator.toLowerCase())) {
            return true;
          }
        } catch (error) {
          // Skip file if can't read
        }
      }
    }

    return false;
  }

  /**
   * Configure project based on type
   */
  async configureProject(projectType, options = {}) {
    console.log(`\n⚙️  Configuring ${projectType} project...`);

    const config = {
      projectType,
      python: {
        version: this.detectedTools.pythonInfo?.version || '3.x',
        interpreter: this.detectedTools.pythonInfo?.interpreter || 'python3',
      },
    };

    // Configure based on project type
    switch (projectType) {
      case 'django':
        config.python.framework = 'django';
        config.python.testRunner = options.testRunner || 'pytest';
        config.python.linter = options.linter || 'ruff';
        config.python.formatter = options.formatter || 'ruff';
        config.python.typeChecker = options.typeChecker || 'pyright';
        config.python.packageManager = options.packageManager || 'pip';
        config.python.securityTools = ['bandit', 'safety'];
        break;

      case 'flask':
        config.python.framework = 'flask';
        config.python.testRunner = options.testRunner || 'pytest';
        config.python.linter = options.linter || 'ruff';
        config.python.formatter = options.formatter || 'ruff';
        config.python.typeChecker = options.typeChecker || 'pyright';
        config.python.packageManager = options.packageManager || 'pip';
        config.python.securityTools = ['bandit', 'safety'];
        break;

      case 'fastapi':
        config.python.framework = 'fastapi';
        config.python.testRunner = options.testRunner || 'pytest';
        config.python.linter = options.linter || 'ruff';
        config.python.formatter = options.formatter || 'ruff';
        config.python.typeChecker = options.typeChecker || 'pyright';
        config.python.packageManager = options.packageManager || 'pip';
        config.python.securityTools = ['bandit', 'safety'];
        break;

      case 'data science':
        config.python.framework = 'data-science';
        config.python.testRunner = options.testRunner || 'pytest';
        config.python.linter = options.linter || 'ruff';
        config.python.formatter = options.formatter || 'black';
        config.python.typeChecker = options.typeChecker || 'pyright';
        config.python.packageManager = options.packageManager || 'pip';
        config.python.securityTools = ['bandit'];
        break;

      default: // standard or package/library
        config.python.framework = 'standard';
        config.python.testRunner = options.testRunner || 'pytest';
        config.python.linter = options.linter || 'ruff';
        config.python.formatter = options.formatter || 'ruff';
        config.python.typeChecker = options.typeChecker || 'pyright';
        config.python.packageManager = options.packageManager || 'pip';
        config.python.securityTools = ['bandit', 'safety'];
    }

    // If not in quick mode, ask for preferences
    if (!options.quick) {
      console.log('\n🎯 Configuration options:');

      // Test runner
      const testRunners = ['pytest', 'unittest', 'nose'];
      const availableTestRunners = testRunners.filter(
        (runner) => this.detectedTools[runner]?.installed
      );

      if (availableTestRunners.length > 0) {
        console.log(`Test runners: ${availableTestRunners.join(', ')}`);
        const testRunnerAnswer = await this.promptUser(
          `Select test runner (${availableTestRunners.join('/')}) [${config.python.testRunner}]: `,
          (input) => !input || availableTestRunners.includes(input)
        );
        if (testRunnerAnswer) {
          config.python.testRunner = testRunnerAnswer;
        }
      }

      // Linter
      const linters = ['ruff', 'flake8', 'pylint'];
      const availableLinters = linters.filter((linter) => this.detectedTools[linter]?.installed);

      if (availableLinters.length > 0) {
        console.log(`Linters: ${availableLinters.join(', ')}`);
        const linterAnswer = await this.promptUser(
          `Select linter (${availableLinters.join('/')}) [${config.python.linter}]: `,
          (input) => !input || availableLinters.includes(input)
        );
        if (linterAnswer) {
          config.python.linter = linterAnswer;
        }
      }

      // Formatter
      const formatters = ['ruff', 'black', 'autopep8'];
      const availableFormatters = formatters.filter(
        (formatter) => this.detectedTools[formatter]?.installed
      );

      if (availableFormatters.length > 0) {
        console.log(`Formatters: ${availableFormatters.join(', ')}`);
        const formatterAnswer = await this.promptUser(
          `Select formatter (${availableFormatters.join('/')}) [${config.python.formatter}]: `,
          (input) => !input || availableFormatters.includes(input)
        );
        if (formatterAnswer) {
          config.python.formatter = formatterAnswer;
        }
      }

      // Package manager
      const packageManagers = ['pip', 'poetry', 'uv'];
      const availablePackageManagers = packageManagers.filter(
        (pm) => this.detectedTools[pm]?.installed
      );

      if (availablePackageManagers.length > 0) {
        console.log(`Package managers: ${availablePackageManagers.join(', ')}`);
        const pmAnswer = await this.promptUser(
          `Select package manager (${availablePackageManagers.join('/')}) [${config.python.packageManager}]: `,
          (input) => !input || availablePackageManagers.includes(input)
        );
        if (pmAnswer) {
          config.python.packageManager = pmAnswer;
        }
      }
    }

    return config;
  }

  /**
   * Generate full configuration
   */
  generateConfiguration(config, report) {
    return {
      project: {
        type: config.projectType,
        path: this.projectPath,
        language: 'python',
      },
      python: config.python,
      tools: {
        detected: this.detectedTools,
        report: report,
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config) {
    const configDir = path.join(this.projectPath, '.opencode');
    const configFile = path.join(configDir, 'project-config.json');

    try {
      // Create .opencode directory if it doesn't exist
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Save configuration
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      console.log(`\n📁 Configuration saved to: ${configFile}`);
      return true;
    } catch (error) {
      console.error(`Failed to save configuration: ${error.message}`);
      return false;
    }
  }

  /**
   * Show next steps after configuration
   */
  showNextSteps(config) {
    console.log('\n🚀 Next Steps:');
    console.log('='.repeat(50));

    console.log('\n📋 Available Python commands:');
    console.log('  /python-setup    - Configure Python project (run this again)');
    console.log('  /python-test     - Run tests with configured test runner');
    console.log('  /python-lint     - Run linter (ruff/flake8/pylint)');
    console.log('  /python-format   - Format code (ruff/black/autopep8)');
    console.log('  /python-typecheck - Type checking (pyright/mypy)');
    console.log('  /python-deps     - Install dependencies');
    console.log('  /python-security - Security scanning (bandit/safety)');
    console.log('  /python-run      - Run Python script/application');
    console.log('  /python-clean    - Clean build artifacts');

    console.log('\n🔧 Configured tools:');
    console.log(`  • Test runner: ${config.python.testRunner}`);
    console.log(`  • Linter: ${config.python.linter}`);
    console.log(`  • Formatter: ${config.python.formatter}`);
    console.log(`  • Type checker: ${config.python.typeChecker}`);
    console.log(`  • Package manager: ${config.python.packageManager}`);

    if (config.python.framework !== 'standard') {
      console.log(`\n🏗️  Framework: ${config.python.framework}`);

      switch (config.python.framework) {
        case 'django':
          console.log('  Run development server: /python-run --script manage.py runserver');
          console.log('  Create migrations: /python-run --script manage.py makemigrations');
          console.log('  Apply migrations: /python-run --script manage.py migrate');
          break;
        case 'flask':
          console.log('  Run development server: /python-run --script app.py');
          console.log('  Set FLASK_APP: export FLASK_APP=app.py');
          break;
        case 'fastapi':
          console.log('  Run development server: /python-run --script main.py');
          console.log('  Or use: uvicorn main:app --reload');
          break;
      }
    }

    console.log('\n💡 Tips:');
    console.log('  • Run /python-deps to install dependencies');
    console.log('  • Run /python-test --coverage for test coverage');
    console.log('  • Run /python-security regularly for security checks');
    console.log('  • Use virtual environments for dependency isolation');

    console.log('='.repeat(50));
  }

  /**
   * Quick setup with automatic detection
   */
  async quickSetup() {
    console.log('⚡ Running quick setup...\n');
    return this.runWizard({ quick: true });
  }

  /**
   * Prompt user for input
   */
  async promptUser(question, validator = null) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      const ask = () => {
        readline.question(question, (answer) => {
          if (validator && !validator(answer.trim())) {
            console.log('Invalid input. Please try again.');
            ask();
          } else {
            readline.close();
            resolve(answer.trim());
          }
        });
      };
      ask();
    });
  }
}

// Export for use in command files
module.exports = PythonConfigWizard;

// If run directly, run the wizard
if (require.main === module) {
  const wizard = new PythonConfigWizard();

  // Check for command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--quick') || args.includes('-q')) {
    wizard.quickSetup().catch((error) => {
      console.error(`Quick setup failed: ${error.message}`);
      process.exit(1);
    });
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🐍 Python Configuration Wizard

Usage:
  node languages/python/config-wizard-refactored.js [options]

Options:
  --quick, -q    Quick setup with automatic detection
  --help, -h     Show this help message

Examples:
  node languages/python/config-wizard-refactored.js          # Run interactive wizard
  node languages/python/config-wizard-refactored.js --quick  # Quick automatic setup

Setup Process:
  1. Python environment detection and validation
  2. Project type detection (Django, Flask, FastAPI, etc.)
  3. Tool detection (Python, pip, poetry, pytest, ruff, etc.)
  4. Interactive configuration (test runner, linter, formatter, type checker)
  5. Configuration saving (.opencode/project-config.json)
  6. Next steps and recommendations
    `);
    process.exit(0);
  } else {
    wizard.runWizard().catch((error) => {
      console.error(`Wizard failed: ${error.message}`);
      process.exit(1);
    });
  }
}
