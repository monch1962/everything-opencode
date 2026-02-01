/**
 * Python Tool Detector
 *
 * Detect Python development tools with cross-platform support
 * Following JavaScript/TypeScript pattern exactly
 */

const { commandExists, runCommand } = require('../../scripts/lib/utils');
const PlatformDetector = require('../../scripts/lib/platform-detector');

class PythonToolDetector {
  constructor() {
    this.platformDetector = new PlatformDetector();
    this.tools = [
      'python', // Python interpreter (required)
      'python3', // Python 3 interpreter
      'pip', // Python package installer
      'pip3', // Python 3 package installer
      'pipx', // Install and run Python applications in isolated environments
      'virtualenv', // Virtual environment tool
      'venv', // Built-in virtual environment module
      'conda', // Anaconda/Miniconda
      'poetry', // Python dependency management and packaging
      'pytest', // Testing framework
      'unittest', // Built-in testing framework
      'nose', // Nose testing framework
      'mypy', // Static type checker
      'black', // Code formatter
      'flake8', // Linter
      'pylint', // Python linter
      'isort', // Import sorter
      'bandit', // Security linter
      'safety', // Security vulnerability checker
      'coverage', // Test coverage
      'pydocstyle', // Docstring style checker
      'pyright', // Type checker (Microsoft)
      'pyre', // Type checker (Facebook)
      'jupyter', // Jupyter notebook
      'ipython', // Interactive Python
      'django-admin', // Django CLI
      'flask', // Flask CLI
      'fastapi', // FastAPI (if installed)
      'uv', // Fast Python package installer and resolver
    ];
  }

  /**
   * Detect all Python tools
   */
  async detectTools() {
    const detectedTools = {};

    // Detect each tool
    for (const tool of this.tools) {
      detectedTools[tool] = await this.detectTool(tool);
    }

    // Detect Python version and implementation
    const pythonInfo = await this.detectPythonInfo();
    if (pythonInfo) {
      detectedTools.pythonInfo = pythonInfo;
    }

    // Detect virtual environment
    const venvInfo = await this.detectVirtualEnvironment();
    if (venvInfo) {
      detectedTools.venvInfo = venvInfo;
    }

    // Detect package manager preference
    const packageManager = await this.detectPackageManager();
    if (packageManager) {
      detectedTools.packageManager = packageManager;
    }

    // Detect framework
    const framework = await this.detectFramework();
    if (framework) {
      detectedTools.framework = framework;
    }

    return detectedTools;
  }

  /**
   * Detect a specific tool
   */
  async detectTool(toolName) {
    const toolInfo = {
      installed: false,
      version: null,
      path: null,
    };

    try {
      // Special handling for python/python3
      if (toolName === 'python' || toolName === 'python3') {
        const versionCommand = `${toolName} --version`;
        const result = await runCommand(versionCommand);

        if (result.success) {
          toolInfo.installed = true;
          // Extract version from output like "Python 3.9.0"
          const versionMatch = result.output.match(/Python (\d+\.\d+\.\d+)/);
          toolInfo.version = versionMatch ? versionMatch[1] : result.output.trim();
          toolInfo.path = this.platformDetector.getToolPath(toolName);
        }
      }
      // Special handling for pip/pip3
      else if (toolName === 'pip' || toolName === 'pip3') {
        const versionCommand = `${toolName} --version`;
        const result = await runCommand(versionCommand);

        if (result.success) {
          toolInfo.installed = true;
          // Extract version from output like "pip 21.0.1 from ..."
          const versionMatch = result.output.match(/(\d+\.\d+\.\d+)/);
          toolInfo.version = versionMatch ? versionMatch[1] : result.output.trim();
          toolInfo.path = this.platformDetector.getToolPath(toolName);
        }
      }
      // Standard tool detection
      else {
        const exists = await commandExists(toolName);

        if (exists) {
          toolInfo.installed = true;
          toolInfo.path = this.platformDetector.getToolPath(toolName);

          // Try to get version
          try {
            const versionCommand = `${toolName} --version`;
            const result = await runCommand(versionCommand);

            if (result.success) {
              // Extract version number
              const versionMatch = result.output.match(/(\d+\.\d+\.\d+)/);
              if (versionMatch) {
                toolInfo.version = versionMatch[1];
              } else {
                // Try alternative version flags
                const altResult = await runCommand(`${toolName} -V`);
                if (altResult.success) {
                  const altMatch = altResult.output.match(/(\d+\.\d+\.\d+)/);
                  toolInfo.version = altMatch ? altMatch[1] : altResult.output.trim();
                }
              }
            }
          } catch (error) {
            // Could not get version, but tool is installed
          }
        }
      }
    } catch (error) {
      // Tool not found or error detecting
    }

    return toolInfo;
  }

  /**
   * Detect Python version and implementation details
   */
  async detectPythonInfo() {
    try {
      const pythonCommand =
        "python -c \"import sys; print(sys.version); print(sys.implementation.name if hasattr(sys, 'implementation') else 'CPython')\"";
      const result = await runCommand(pythonCommand);

      if (result.success) {
        const lines = result.output.trim().split('\n');
        const version = lines[0].trim();
        const implementation = lines.length > 1 ? lines[1].trim() : 'CPython';

        return {
          version,
          implementation,
          executable: this.platformDetector.getToolPath('python'),
        };
      }
    } catch (error) {
      // Could not get Python info
    }

    return null;
  }

  /**
   * Detect virtual environment
   */
  async detectVirtualEnvironment() {
    try {
      const venvCommand =
        "python -c \"import sys; print('VIRTUAL_ENV' in sys.modules or hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix))\"";
      const result = await runCommand(venvCommand);

      if (result.success && result.output.trim() === 'True') {
        // Get virtual environment path
        const venvPathCommand = "python -c \"import os; print(os.environ.get('VIRTUAL_ENV', ''))\"";
        const pathResult = await runCommand(venvPathCommand);

        return {
          active: true,
          path: pathResult.success ? pathResult.output.trim() : null,
          type: await this.detectVenvType(),
        };
      }
    } catch (error) {
      // Could not detect virtual environment
    }

    return { active: false };
  }

  /**
   * Detect virtual environment type
   */
  async detectVenvType() {
    try {
      // Check for venv
      const venvCheck = await runCommand('python -c "import venv; print(\'venv\')"');
      if (venvCheck.success) return 'venv';

      // Check for virtualenv
      const virtualenvCheck = await runCommand(
        'python -c "import virtualenv; print(\'virtualenv\')"'
      );
      if (virtualenvCheck.success) return 'virtualenv';

      // Check for conda
      const condaCheck = await runCommand('which conda');
      if (condaCheck.success) return 'conda';

      // Check for pipenv
      const pipenvCheck = await runCommand('which pipenv');
      if (pipenvCheck.success) return 'pipenv';

      // Check for poetry
      const poetryCheck = await runCommand('which poetry');
      if (poetryCheck.success) return 'poetry';
    } catch (error) {
      // Could not determine type
    }

    return 'unknown';
  }

  /**
   * Detect preferred package manager
   */
  async detectPackageManager() {
    const managers = ['poetry', 'pipenv', 'conda', 'pip', 'pip3'];

    for (const manager of managers) {
      try {
        const exists = await commandExists(manager);
        if (exists) {
          return {
            name: manager,
            path: this.platformDetector.getToolPath(manager),
          };
        }
      } catch (error) {
        // Manager not found
      }
    }

    return null;
  }

  /**
   * Detect Python framework
   */
  async detectFramework() {
    try {
      // Check for Django
      const djangoCheck = await runCommand(
        'python -c "try: import django; print(\'django\'); except: pass"'
      );
      if (djangoCheck.success && djangoCheck.output.trim() === 'django') {
        return { name: 'django', version: await this.getPackageVersion('django') };
      }

      // Check for Flask
      const flaskCheck = await runCommand(
        'python -c "try: import flask; print(\'flask\'); except: pass"'
      );
      if (flaskCheck.success && flaskCheck.output.trim() === 'flask') {
        return { name: 'flask', version: await this.getPackageVersion('flask') };
      }

      // Check for FastAPI
      const fastapiCheck = await runCommand(
        'python -c "try: import fastapi; print(\'fastapi\'); except: pass"'
      );
      if (fastapiCheck.success && fastapiCheck.output.trim() === 'fastapi') {
        return { name: 'fastapi', version: await this.getPackageVersion('fastapi') };
      }
    } catch (error) {
      // Could not detect framework
    }

    return null;
  }

  /**
   * Get package version
   */
  async getPackageVersion(packageName) {
    try {
      const versionCommand = `python -c "import ${packageName}; print(${packageName}.__version__)"`;
      const result = await runCommand(versionCommand);

      if (result.success) {
        return result.output.trim();
      }
    } catch (error) {
      // Could not get version
    }

    return null;
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(detectedTools) {
    const report = {
      summary: {
        pythonInstalled:
          detectedTools.python?.installed || detectedTools.python3?.installed || false,
        pipInstalled: detectedTools.pip?.installed || detectedTools.pip3?.installed || false,
        hasVirtualEnv: detectedTools.venvInfo?.active || false,
        hasTesting: detectedTools.pytest?.installed || detectedTools.unittest?.installed || false,
        hasLinter: detectedTools.flake8?.installed || detectedTools.pylint?.installed || false,
        hasFormatter: detectedTools.black?.installed || false,
        hasTypeChecker: detectedTools.mypy?.installed || detectedTools.pyright?.installed || false,
        hasPackageManager: !!detectedTools.packageManager,
        hasFramework: !!detectedTools.framework,
      },
      python: detectedTools.python || detectedTools.python3,
      pip: detectedTools.pip || detectedTools.pip3,
      pythonInfo: detectedTools.pythonInfo,
      venvInfo: detectedTools.venvInfo,
      packageManager: detectedTools.packageManager,
      framework: detectedTools.framework,
      tools: {
        pytest: detectedTools.pytest,
        unittest: detectedTools.unittest,
        mypy: detectedTools.mypy,
        black: detectedTools.black,
        flake8: detectedTools.flake8,
        pylint: detectedTools.pylint,
        isort: detectedTools.isort,
        coverage: detectedTools.coverage,
        poetry: detectedTools.poetry,
        pipenv: detectedTools.pipenv,
        conda: detectedTools.conda,
        virtualenv: detectedTools.virtualenv,
        venv: detectedTools.venv,
      },
    };

    return report;
  }

  /**
   * Get tool installation command
   */
  getInstallationCommand(toolName, options = {}) {
    const commands = {
      python: {
        macos: 'brew install python',
        linux: 'sudo apt-get install python3',
        windows: 'Download from https://www.python.org/downloads/',
      },
      pip: {
        macos: 'python -m ensurepip --upgrade',
        linux: 'sudo apt-get install python3-pip',
        windows: 'python -m ensurepip --upgrade',
      },
      virtualenv: 'pip install virtualenv',
      poetry: {
        macos: 'curl -sSL https://install.python-poetry.org | python3 -',
        linux: 'curl -sSL https://install.python-poetry.org | python3 -',
        windows:
          '(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -',
      },
      pytest: 'pip install pytest',
      mypy: 'pip install mypy',
      black: 'pip install black',
      flake8: 'pip install flake8',
      pylint: 'pip install pylint',
      isort: 'pip install isort',
      coverage: 'pip install coverage',
      bandit: 'pip install bandit',
      safety: 'pip install safety',
    };

    const command = commands[toolName];

    if (typeof command === 'object' && !Array.isArray(command)) {
      const platform = this.platformDetector.getPlatformName();
      return command[platform] || command[Object.keys(command)[0]];
    }

    return command || `pip install ${toolName}`;
  }

  /**
   * Detect Python project type from directory
   */
  async detectProjectType(projectPath) {
    // This would be implemented to detect project type based on files
    // For now, return a basic detection
    return {
      type: 'python',
      confidence: 0.8,
      framework: await this.detectFramework(),
      hasRequirements: false, // Would check for requirements.txt, pyproject.toml, etc.
      hasSetupPy: false, // Would check for setup.py
      hasPipfile: false, // Would check for Pipfile
      hasPoetryConfig: false, // Would check for pyproject.toml with poetry section
    };
  }
}

module.exports = PythonToolDetector;
