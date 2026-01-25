#!/usr/bin/env node
/**
 * Python Configuration Wizard
 * 
 * Interactive wizard for configuring Python projects in opencode
 */

const path = require('path');
const fs = require('fs');
const { commandExists, runCommand } = require('../../scripts/lib/utils');
const InteractivePrompts = require('../../scripts/interactive/prompts');
const ProjectDetector = require('../../scripts/interactive/project-detector');
const ConfigManager = require('../../scripts/interactive/config-manager');

class PythonConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.prompts = new InteractivePrompts();
    this.detector = new ProjectDetector(projectPath);
    this.configManager = new ConfigManager(projectPath);
    this.config = null;
  }

  /**
   * Run the complete Python configuration wizard
   */
  async run() {
    try {
      this.prompts.header('🐍 Python Project Configuration');

      // Step 1: Detect Python project
      const pythonDetection = await this.detectPythonProject();
      if (!pythonDetection.isPython) {
        this.prompts.error('This does not appear to be a Python project.');
        return false;
      }

      // Step 2: Detect project type
      const projectType = await this.detectProjectType();
      
      // Step 3: Detect existing tools
      const detectedTools = await this.detectTools();
      
      // Step 4: Interactive configuration
      const userConfig = await this.interactiveConfiguration(projectType, detectedTools);
      
      // Step 5: Save configuration
      const saved = await this.saveConfiguration(userConfig);
      
      // Step 6: Provide next steps
      await this.provideNextSteps(userConfig, detectedTools);
      
      return saved;
    } catch (error) {
      this.prompts.error(`Configuration failed: ${error.message}`);
      return false;
    } finally {
      this.prompts.close();
    }
  }

  /**
   * Detect if this is a Python project
   */
  async detectPythonProject() {
    this.prompts.info('Detecting Python project...');
    
    const summary = await this.detector.getProjectSummary();
    const pythonResult = summary.languages.find(lang => lang.language === 'python');
    
    if (!pythonResult || pythonResult.confidence < 0.3) {
      return {
        isPython: false,
        confidence: pythonResult?.confidence || 0,
        indicators: pythonResult?.indicators || []
      };
    }
    
    this.prompts.success(`Detected Python project with ${Math.round(pythonResult.confidence * 100)}% confidence`);
    
    if (pythonResult.indicators.length > 0) {
      this.prompts.info('Indicators found:');
      pythonResult.indicators.slice(0, 5).forEach(indicator => {
        console.log(`  • ${indicator}`);
      });
    }
    
    return {
      isPython: true,
      confidence: pythonResult.confidence,
      indicators: pythonResult.indicators,
      files: pythonResult.files
    };
  }

  /**
   * Detect Python project type
   */
  async detectProjectType() {
    this.prompts.info('Detecting project type...');
    
    const projectType = await this.detector.detectPythonProjectType();
    
    const typeDescriptions = {
      'fastapi': 'FastAPI web application',
      'django': 'Django web framework',
      'flask': 'Flask microframework',
      'data-science': 'Data science/analysis project',
      'machine-learning': 'Machine learning project',
      'cli': 'Command-line interface tool',
      'library': 'Python library/package',
      'unknown': 'General Python project'
    };
    
    if (projectType !== 'unknown') {
      this.prompts.success(`Detected: ${typeDescriptions[projectType]}`);
    } else {
      this.prompts.warning('Could not determine specific project type');
    }
    
    return projectType;
  }

  /**
   * Detect installed Python tools
   */
  async detectTools() {
    this.prompts.info('Detecting Python tools...');
    
    const tools = {
      // Dependency managers
      uv: { command: 'uv --version', installed: false, version: null },
      poetry: { command: 'poetry --version', installed: false, version: null },
      pip: { command: 'pip --version', installed: false, version: null },
      conda: { command: 'conda --version', installed: false, version: null },
      
      // Testing frameworks
      pytest: { command: 'pytest --version', installed: false, version: null },
      unittest: { command: 'python -m unittest --version', installed: false, version: null },
      
      // Linting/formatting
      ruff: { command: 'ruff --version', installed: false, version: null },
      black: { command: 'black --version', installed: false, version: null },
      flake8: { command: 'flake8 --version', installed: false, version: null },
      pylint: { command: 'pylint --version', installed: false, version: null },
      autopep8: { command: 'autopep8 --version', installed: false, version: null },
      isort: { command: 'isort --version', installed: false, version: null },
      
      // Type checking
      pyright: { command: 'pyright --version', installed: false, version: null },
      mypy: { command: 'mypy --version', installed: false, version: null },
      
      // Build tools
      setuptools: { command: 'python -c "import setuptools; print(setuptools.__version__)"', installed: false, version: null },
      wheel: { command: 'python -c "import wheel; print(wheel.__version__)"', installed: false, version: null },
      build: { command: 'python -m build --version', installed: false, version: null },
      
      // Virtual environment
      venv: { command: 'python -m venv --help', installed: false, version: null },
      virtualenv: { command: 'virtualenv --version', installed: false, version: null }
    };
    
    const detectedTools = {};
    
    for (const [tool, info] of Object.entries(tools)) {
      try {
        const result = runCommand(info.command, { stdio: 'pipe' });
        if (result.success) {
          info.installed = true;
          // Extract version from output (first line, first version-like string)
          const versionMatch = result.output.match(/(\d+\.\d+\.\d+|\d+\.\d+)/);
          info.version = versionMatch ? versionMatch[0] : 'unknown';
          detectedTools[tool] = { ...info };
        }
      } catch (error) {
        // Tool not installed or command failed
      }
    }
    
    // Check Python version
    const pythonResult = runCommand('python --version', { stdio: 'pipe' });
    if (pythonResult.success) {
      const versionMatch = pythonResult.output.match(/Python (\d+\.\d+\.\d+)/);
      detectedTools.python = {
        installed: true,
        version: versionMatch ? versionMatch[1] : 'unknown',
        command: 'python --version'
      };
    }
    
    // Check Python 3 specifically
    const python3Result = runCommand('python3 --version', { stdio: 'pipe' });
    if (python3Result.success) {
      const versionMatch = python3Result.output.match(/Python (\d+\.\d+\.\d+)/);
      detectedTools.python3 = {
        installed: true,
        version: versionMatch ? versionMatch[1] : 'unknown',
        command: 'python3 --version'
      };
    }
    
    // Display results
    const installedTools = Object.entries(detectedTools)
      .filter(([_, info]) => info.installed)
      .map(([tool, info]) => `${tool} v${info.version}`);
    
    if (installedTools.length > 0) {
      this.prompts.success(`Found ${installedTools.length} tools:`);
      installedTools.forEach(tool => console.log(`  • ${tool}`));
    } else {
      this.prompts.warning('No Python tools detected');
    }
    
    return detectedTools;
  }

  /**
   * Interactive configuration based on project type
   */
  async interactiveConfiguration(projectType, detectedTools) {
    this.prompts.section('Configuration Options');
    
    const config = {
      projectType,
      dependencyManager: 'unknown',
      testRunner: 'none',
      linter: 'none',
      formatter: 'none',
      typeChecker: 'none',
      tools: {},
      userApproved: false
    };
    
    // 1. Dependency manager selection
    const depManagerChoices = [
      {
        title: 'uv',
        description: 'Modern, fast Python package manager (recommended for new projects)',
        value: 'uv',
        recommended: true
      },
      {
        title: 'poetry',
        description: 'Dependency management and packaging tool',
        value: 'poetry',
        recommended: detectedTools.poetry?.installed
      },
      {
        title: 'pip',
        description: 'Standard Python package installer',
        value: 'pip',
        recommended: detectedTools.pip?.installed && !detectedTools.uv?.installed
      },
      {
        title: 'conda',
        description: 'Package and environment manager (for data science/ML)',
        value: 'conda',
        recommended: projectType === 'data-science' || projectType === 'machine-learning'
      },
      {
        title: 'Skip for now',
        description: 'Configure dependency manager later',
        value: 'unknown'
      }
    ];
    
    config.dependencyManager = await this.prompts.selectWithDescriptions(
      'Select dependency manager:',
      depManagerChoices
    );
    
    // 2. Test runner selection
    const testRunnerChoices = [
      {
        title: 'pytest',
        description: 'Feature-rich testing framework (recommended)',
        value: 'pytest',
        recommended: true
      },
      {
        title: 'unittest',
        description: 'Python built-in testing framework',
        value: 'unittest',
        recommended: detectedTools.unittest?.installed && !detectedTools.pytest?.installed
      },
      {
        title: 'Skip testing',
        description: 'No testing framework',
        value: 'none'
      }
    ];
    
    config.testRunner = await this.prompts.selectWithDescriptions(
      'Select testing framework:',
      testRunnerChoices
    );
    
    // 3. Linter selection
    const linterChoices = [
      {
        title: 'ruff',
        description: 'Extremely fast Python linter (recommended)',
        value: 'ruff',
        recommended: true
      },
      {
        title: 'flake8',
        description: 'Popular Python style guide enforcement',
        value: 'flake8',
        recommended: detectedTools.flake8?.installed && !detectedTools.ruff?.installed
      },
      {
        title: 'pylint',
        description: 'Comprehensive Python code analysis',
        value: 'pylint',
        recommended: detectedTools.pylint?.installed
      },
      {
        title: 'Skip linting',
        description: 'No linter',
        value: 'none'
      }
    ];
    
    config.linter = await this.prompts.selectWithDescriptions(
      'Select linter:',
      linterChoices
    );
    
    // 4. Formatter selection
    const formatterChoices = [
      {
        title: 'ruff format',
        description: 'Ruff formatter (if ruff selected as linter)',
        value: 'ruff',
        recommended: config.linter === 'ruff'
      },
      {
        title: 'black',
        description: 'Uncompromising code formatter',
        value: 'black',
        recommended: detectedTools.black?.installed
      },
      {
        title: 'autopep8',
        description: 'Automatically formats Python code to conform to PEP 8',
        value: 'autopep8',
        recommended: detectedTools.autopep8?.installed
      },
      {
        title: 'Skip formatting',
        description: 'No formatter',
        value: 'none'
      }
    ];
    
    config.formatter = await this.prompts.selectWithDescriptions(
      'Select code formatter:',
      formatterChoices
    );
    
    // 5. Type checker selection (for typed projects)
    const typeCheckerChoices = [
      {
        title: 'pyright',
        description: 'Fast type checker with good editor integration',
        value: 'pyright',
        recommended: true
      },
      {
        title: 'mypy',
        description: 'Optional static typing for Python',
        value: 'mypy',
        recommended: detectedTools.mypy?.installed && !detectedTools.pyright?.installed
      },
      {
        title: 'Skip type checking',
        description: 'No type checker',
        value: 'none'
      }
    ];
    
    config.typeChecker = await this.prompts.selectWithDescriptions(
      'Select type checker:',
      typeCheckerChoices
    );
    
    // 6. Project-specific options based on type
    if (projectType === 'fastapi') {
      const includeDocs = await this.prompts.confirm(
        'Include automatic API documentation (Swagger/ReDoc)?',
        true
      );
      config.fastapiOptions = { includeDocs };
    }
    
    if (projectType === 'data-science' || projectType === 'machine-learning') {
      const includeNotebooks = await this.prompts.confirm(
        'Include Jupyter notebook support?',
        true
      );
      config.dataScienceOptions = { includeNotebooks };
    }
    
    if (projectType === 'cli') {
      const cliFramework = await this.prompts.select(
        'Select CLI framework:',
        ['click', 'typer', 'argparse', 'none'],
        0
      );
      config.cliOptions = { framework: ['click', 'typer', 'argparse', 'none'][cliFramework] };
    }
    
    // 7. Store detected tools info
    config.tools = detectedTools;
    
    // 8. Get user approval
    this.prompts.section('Configuration Summary');
    
    console.log('\nConfiguration to be saved:');
    console.log(`  • Project type: ${projectType}`);
    console.log(`  • Dependency manager: ${config.dependencyManager}`);
    console.log(`  • Test runner: ${config.testRunner}`);
    console.log(`  • Linter: ${config.linter}`);
    console.log(`  • Formatter: ${config.formatter}`);
    console.log(`  • Type checker: ${config.typeChecker}`);
    
    config.userApproved = await this.prompts.confirm(
      '\nSave this configuration?',
      true
    );
    
    return config;
  }

  /**
   * Save configuration to project
   */
  async saveConfiguration(config) {
    if (!config.userApproved) {
      this.prompts.warning('Configuration not saved (user declined)');
      return false;
    }
    
    this.prompts.info('Saving configuration...');
    
    // Update config manager with Python configuration
    const saved = this.configManager.updateLanguageConfig('python', config);
    
    if (saved) {
      // Set Python as primary language
      this.configManager.setPrimaryLanguage('python');
      
      this.prompts.success('Configuration saved to .opencode/project-config.json');
      return true;
    } else {
      this.prompts.error('Failed to save configuration');
      return false;
    }
  }

  /**
   * Provide next steps and recommendations
   */
  async provideNextSteps(config, detectedTools) {
    this.prompts.header('🎯 Next Steps');
    
    const recommendations = [];
    
    // Check for missing recommended tools
    if (config.dependencyManager !== 'unknown' && !detectedTools[config.dependencyManager]?.installed) {
      recommendations.push(`Install ${config.dependencyManager}: Recommended for dependency management`);
    }
    
    if (config.testRunner !== 'none' && !detectedTools[config.testRunner]?.installed) {
      recommendations.push(`Install ${config.testRunner}: Required for running tests`);
    }
    
    if (config.linter !== 'none' && !detectedTools[config.linter]?.installed) {
      recommendations.push(`Install ${config.linter}: Required for code linting`);
    }
    
    if (config.formatter !== 'none' && !detectedTools[config.formatter]?.installed) {
      recommendations.push(`Install ${config.formatter}: Required for code formatting`);
    }
    
    if (config.typeChecker !== 'none' && !detectedTools[config.typeChecker]?.installed) {
      recommendations.push(`Install ${config.typeChecker}: Required for type checking`);
    }
    
    // Project type specific recommendations
    if (config.projectType === 'fastapi') {
      recommendations.push('Run: `uv add fastapi[all]` to install FastAPI with all dependencies');
      recommendations.push('Check out: https://fastapi.tiangolo.com for documentation');
    }
    
    if (config.projectType === 'data-science') {
      recommendations.push('Run: `uv add pandas numpy matplotlib seaborn` for data analysis');
      recommendations.push('Run: `uv add jupyter` for notebook support');
    }
    
    if (config.projectType === 'machine-learning') {
      recommendations.push('Run: `uv add scikit-learn` for traditional ML');
      recommendations.push('Run: `uv add torch` or `uv add tensorflow` for deep learning');
    }
    
    if (config.projectType === 'cli' && config.cliOptions?.framework !== 'none') {
      recommendations.push(`Run: \`uv add ${config.cliOptions.framework}\` for CLI framework`);
    }
    
    // General recommendations
    recommendations.push('Create virtual environment: `python -m venv .venv`');
    recommendations.push('Activate virtual environment: `source .venv/bin/activate` (Linux/Mac) or `.venv\\Scripts\\activate` (Windows)');
    recommendations.push('Initialize git: `git init` (if not already a git repository)');
    
    // Display recommendations
    if (recommendations.length > 0) {
      this.prompts.info('Recommended actions:');
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    // Available opencode commands
    this.prompts.info('Available opencode commands:');
    console.log('  • /python-test    - Run tests with configured test runner');
    console.log('  • /python-lint    - Run linter and formatter');
    console.log('  • /python-typecheck - Run type checker');
    console.log('  • /python-deps    - Manage dependencies');
    console.log('  • /python-setup   - Re-run configuration wizard');
    
    this.prompts.success('\nPython configuration complete! 🎉');
  }

  /**
   * Quick setup with minimal prompts
   */
  async quickSetup() {
    this.prompts.header('⚡ Python Quick Setup');
    
    const pythonDetection = await this.detectPythonProject();
    if (!pythonDetection.isPython) {
      this.prompts.error('This does not appear to be a Python project.');
      return false;
    }
    
    const projectType = await this.detectProjectType();
    const detectedTools = await this.detectTools();
    
    // Use sensible defaults
    const config = {
      projectType,
      dependencyManager: detectedTools.uv?.installed ? 'uv' : 
                        detectedTools.poetry?.installed ? 'poetry' : 
                        detectedTools.pip?.installed ? 'pip' : 'unknown',
      testRunner: detectedTools.pytest?.installed ? 'pytest' : 
                  detectedTools.unittest?.installed ? 'unittest' : 'none',
      linter: detectedTools.ruff?.installed ? 'ruff' : 
              detectedTools.flake8?.installed ? 'flake8' : 'none',
      formatter: detectedTools.ruff?.installed ? 'ruff' : 
                 detectedTools.black?.installed ? 'black' : 'none',
      typeChecker: detectedTools.pyright?.installed ? 'pyright' : 
                   detectedTools.mypy?.installed ? 'mypy' : 'none',
      tools: detectedTools,
      userApproved: true
    };
    
    this.prompts.info('Using automatic configuration:');
    console.log(`  • Dependency manager: ${config.dependencyManager}`);
    console.log(`  • Test runner: ${config.testRunner}`);
    console.log(`  • Linter: ${config.linter}`);
    console.log(`  • Formatter: ${config.formatter}`);
    console.log(`  • Type checker: ${config.typeChecker}`);
    
    const approved = await this.prompts.confirm('Apply this configuration?', true);
    
    if (approved) {
      config.userApproved = true;
      const saved = this.configManager.updateLanguageConfig('python', config);
      this.configManager.setPrimaryLanguage('python');
      
      if (saved) {
        this.prompts.success('Quick setup complete!');
        return true;
      }
    }
    
    return false;
  }
}

// Export for use in other scripts
module.exports = PythonConfigWizard;

// CLI entry point
if (require.main === module) {
  const wizard = new PythonConfigWizard();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🐍 Python Configuration Wizard

Usage:
  node languages/python/config-wizard.js [options]

Options:
  --quick, -q    Quick setup with automatic detection
  --help, -h     Show this help message

Examples:
  node languages/python/config-wizard.js          # Run interactive wizard
  node languages/python/config-wizard.js --quick  # Quick automatic setup
    `);
    process.exit(0);
  } else if (args.includes('--quick') || args.includes('-q')) {
    wizard.quickSetup().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    wizard.run().then(success => {
      process.exit(success ? 0 : 1);
    });
  }
}