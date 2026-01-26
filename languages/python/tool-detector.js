#!/usr/bin/env node
/**
 * Python Tool Detector
 *
 * Detects Python tools, versions, and provides installation guides
 */

const { runCommand, commandExists } = require('../../scripts/lib/utils');

class PythonToolDetector {
  constructor() {
    this.tools = this.initializeTools();
  }

  /**
   * Initialize tool definitions
   */
  initializeTools() {
    return {
      // Python interpreters
      python: {
        command: 'python --version',
        description: 'Python interpreter',
        installGuide: {
          macos: 'brew install python',
          linux: 'sudo apt-get install python3',
          windows: 'Download from python.org',
        },
        priority: 10,
        recommended: true,
      },
      python3: {
        command: 'python3 --version',
        description: 'Python 3 interpreter',
        installGuide: {
          macos: 'brew install python',
          linux: 'sudo apt-get install python3',
          windows: 'Download from python.org',
        },
        priority: 9,
        recommended: true,
      },

      // Dependency managers
      uv: {
        command: 'uv --version',
        description: 'Modern, fast Python package manager',
        installGuide: {
          macos: 'brew install uv',
          linux: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
          windows: 'powershell -c "irm https://astral.sh/uv/install.ps1 | iex"',
        },
        priority: 8,
      },
      poetry: {
        command: 'poetry --version',
        description: 'Dependency management and packaging tool',
        installGuide: {
          macos: 'brew install poetry',
          linux: 'curl -sSL https://install.python-poetry.org | python3 -',
          windows:
            'powershell -c "(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -"',
        },
        priority: 7,
      },
      pip: {
        command: 'pip --version',
        description: 'Python package installer',
        installGuide: {
          macos: 'python -m ensurepip --upgrade',
          linux: 'sudo apt-get install python3-pip',
          windows: 'python -m ensurepip --upgrade',
        },
        priority: 8,
        recommended: true,
      },
      conda: {
        command: 'conda --version',
        description: 'Package and environment manager',
        installGuide: {
          macos: 'Download Miniconda from conda.io',
          linux: 'Download Miniconda from conda.io',
          windows: 'Download Miniconda from conda.io',
        },
        priority: 5,
      },

      // Testing frameworks
      pytest: {
        command: 'pytest --version',
        description: 'Feature-rich testing framework',
        installGuide: {
          macos: 'pip install pytest',
          linux: 'pip install pytest',
          windows: 'pip install pytest',
        },
        priority: 8,
      },
      unittest: {
        command: 'python -m unittest --version',
        description: 'Python built-in testing framework',
        installGuide: {
          macos: 'Part of Python standard library',
          linux: 'Part of Python standard library',
          windows: 'Part of Python standard library',
        },
        priority: 4,
      },

      // Linting/formatting
      ruff: {
        command: 'ruff --version',
        description: 'Extremely fast Python linter and formatter',
        installGuide: {
          macos: 'brew install ruff',
          linux: 'pip install ruff',
          windows: 'pip install ruff',
        },
        priority: 9,
      },
      black: {
        command: 'black --version',
        description: 'Uncompromising code formatter',
        installGuide: {
          macos: 'pip install black',
          linux: 'pip install black',
          windows: 'pip install black',
        },
        priority: 7,
      },
      flake8: {
        command: 'flake8 --version',
        description: 'Popular Python style guide enforcement',
        installGuide: {
          macos: 'pip install flake8',
          linux: 'pip install flake8',
          windows: 'pip install flake8',
        },
        priority: 6,
      },
      pylint: {
        command: 'pylint --version',
        description: 'Comprehensive Python code analysis',
        installGuide: {
          macos: 'pip install pylint',
          linux: 'pip install pylint',
          windows: 'pip install pylint',
        },
        priority: 5,
      },
      autopep8: {
        command: 'autopep8 --version',
        description: 'Automatically formats Python code to conform to PEP 8',
        installGuide: {
          macos: 'pip install autopep8',
          linux: 'pip install autopep8',
          windows: 'pip install autopep8',
        },
        priority: 4,
      },
      isort: {
        command: 'isort --version',
        description: 'Python utility to sort imports',
        installGuide: {
          macos: 'pip install isort',
          linux: 'pip install isort',
          windows: 'pip install isort',
        },
        priority: 4,
      },

      // Type checking
      pyright: {
        command: 'pyright --version',
        description: 'Fast type checker with good editor integration',
        installGuide: {
          macos: 'npm install -g pyright',
          linux: 'npm install -g pyright',
          windows: 'npm install -g pyright',
        },
        priority: 8,
      },
      mypy: {
        command: 'mypy --version',
        description: 'Optional static typing for Python',
        installGuide: {
          macos: 'pip install mypy',
          linux: 'pip install mypy',
          windows: 'pip install mypy',
        },
        priority: 7,
      },

      // Build tools
      setuptools: {
        command: 'python -c "import setuptools; print(setuptools.__version__)"',
        description: 'Package building and distribution',
        installGuide: {
          macos: 'pip install setuptools',
          linux: 'pip install setuptools',
          windows: 'pip install setuptools',
        },
        priority: 3,
      },
      wheel: {
        command: 'python -c "import wheel; print(wheel.__version__)"',
        description: 'Built-package format for Python',
        installGuide: {
          macos: 'pip install wheel',
          linux: 'pip install wheel',
          windows: 'pip install wheel',
        },
        priority: 3,
      },
      build: {
        command: 'python -m build --version',
        description: 'Simple, correct Python package builder',
        installGuide: {
          macos: 'pip install build',
          linux: 'pip install build',
          windows: 'pip install build',
        },
        priority: 3,
      },

      // Virtual environment
      venv: {
        command: 'python -m venv --help',
        description: 'Python virtual environment module',
        installGuide: {
          macos: 'Part of Python standard library',
          linux: 'Part of Python standard library',
          windows: 'Part of Python standard library',
        },
        priority: 2,
      },
      virtualenv: {
        command: 'virtualenv --version',
        description: 'Virtual environment creator',
        installGuide: {
          macos: 'pip install virtualenv',
          linux: 'pip install virtualenv',
          windows: 'pip install virtualenv',
        },
        priority: 2,
      },

      // Project type specific
      fastapi: {
        command: 'python -c "import fastapi; print(fastapi.__version__)"',
        description: 'FastAPI web framework',
        installGuide: {
          macos: 'pip install "fastapi[all]"',
          linux: 'pip install "fastapi[all]"',
          windows: 'pip install "fastapi[all]"',
        },
        priority: 5,
      },
      django: {
        command: 'python -c "import django; print(django.__version__)"',
        description: 'Django web framework',
        installGuide: {
          macos: 'pip install django',
          linux: 'pip install django',
          windows: 'pip install django',
        },
        priority: 5,
      },
      flask: {
        command: 'python -c "import flask; print(flask.__version__)"',
        description: 'Flask microframework',
        installGuide: {
          macos: 'pip install flask',
          linux: 'pip install flask',
          windows: 'pip install flask',
        },
        priority: 5,
      },
      pandas: {
        command: 'python -c "import pandas; print(pandas.__version__)"',
        description: 'Data analysis library',
        installGuide: {
          macos: 'pip install pandas',
          linux: 'pip install pandas',
          windows: 'pip install pandas',
        },
        priority: 5,
      },
      numpy: {
        command: 'python -c "import numpy; print(numpy.__version__)"',
        description: 'Numerical computing library',
        installGuide: {
          macos: 'pip install numpy',
          linux: 'pip install numpy',
          windows: 'pip install numpy',
        },
        priority: 5,
      },
      torch: {
        command: 'python -c "import torch; print(torch.__version__)"',
        description: 'PyTorch deep learning framework',
        installGuide: {
          macos: 'pip install torch',
          linux: 'pip install torch',
          windows: 'pip install torch',
        },
        priority: 5,
      },
      tensorflow: {
        command: 'python -c "import tensorflow; print(tensorflow.__version__)"',
        description: 'TensorFlow machine learning platform',
        installGuide: {
          macos: 'pip install tensorflow',
          linux: 'pip install tensorflow',
          windows: 'pip install tensorflow',
        },
        priority: 5,
      },
      click: {
        command: 'python -c "import click; print(click.__version__)"',
        description: 'CLI framework',
        installGuide: {
          macos: 'pip install click',
          linux: 'pip install click',
          windows: 'pip install click',
        },
        priority: 5,
      },
      typer: {
        command: 'python -c "import typer; print(typer.__version__)"',
        description: 'CLI framework based on type hints',
        installGuide: {
          macos: 'pip install typer',
          linux: 'pip install typer',
          windows: 'pip install typer',
        },
        priority: 5,
      },
    };
  }

  /**
   * Detect all Python tools
   */
  async detectAll() {
    const results = {};

    for (const [toolName, toolInfo] of Object.entries(this.tools)) {
      const detection = await this.detectTool(toolName);
      results[toolName] = detection;
    }

    return results;
  }

  /**
   * Detect specific tool
   */
  async detectTool(toolName) {
    const toolInfo = this.tools[toolName];
    if (!toolInfo) {
      return {
        installed: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    try {
      const result = runCommand(toolInfo.command, { stdio: 'pipe' });

      if (result.success) {
        const version = this.extractVersion(result.output, toolName);
        return {
          installed: true,
          version,
          command: toolInfo.command,
          description: toolInfo.description,
          priority: toolInfo.priority,
        };
      } else {
        return {
          installed: false,
          error: result.output,
          description: toolInfo.description,
          priority: toolInfo.priority,
        };
      }
    } catch (error) {
      return {
        installed: false,
        error: error.message,
        description: toolInfo.description,
        priority: toolInfo.priority,
      };
    }
  }

  /**
   * Extract version from command output
   */
  extractVersion(output, toolName) {
    const lines = output.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return 'unknown';
    }

    const firstLine = lines[0];

    // Common version patterns
    const patterns = [
      /(\d+\.\d+\.\d+)/, // 1.2.3
      /(\d+\.\d+)/, // 1.2
      /version\s+(\d+\.\d+\.\d+)/i, // version 1.2.3
      /v(\d+\.\d+\.\d+)/, // v1.2.3
      /(\d+\.\d+\.\d+[a-zA-Z0-9]*)/, // 1.2.3rc1, 1.2.3.dev0
    ];

    for (const pattern of patterns) {
      const match = firstLine.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Tool-specific extraction
    if (toolName === 'python' || toolName === 'python3') {
      const pythonMatch = firstLine.match(/Python\s+(\d+\.\d+\.\d+)/);
      if (pythonMatch) return pythonMatch[1];
    }

    if (toolName === 'pip') {
      const pipMatch = firstLine.match(/pip\s+(\d+\.\d+\.\d+)/);
      if (pipMatch) return pipMatch[1];
    }

    return 'unknown';
  }

  /**
   * Get installation guide for tool
   */
  getInstallGuide(toolName, platform = null) {
    const toolInfo = this.tools[toolName];
    if (!toolInfo || !toolInfo.installGuide) {
      return null;
    }

    if (!platform) {
      // Auto-detect platform
      if (process.platform === 'darwin') platform = 'macos';
      else if (process.platform === 'win32') platform = 'windows';
      else platform = 'linux';
    }

    return toolInfo.installGuide[platform] || toolInfo.installGuide.linux;
  }

  /**
   * Check tool compatibility
   */
  checkCompatibility(toolName, requiredVersion = null) {
    return this.detectTool(toolName).then((result) => {
      if (!result.installed) {
        return {
          compatible: false,
          reason: 'Tool not installed',
          installGuide: this.getInstallGuide(toolName),
        };
      }

      if (requiredVersion && result.version !== 'unknown') {
        // Simple version comparison (basic semantic versioning)
        const currentParts = result.version.split('.').map(Number);
        const requiredParts = requiredVersion.split('.').map(Number);

        for (
          let i = 0;
          i < Math.min(currentParts.length, requiredParts.length);
          i++
        ) {
          if (currentParts[i] > requiredParts[i]) {
            break; // Current is newer
          }
          if (currentParts[i] < requiredParts[i]) {
            return {
              compatible: false,
              reason: `Version ${result.version} is older than required ${requiredVersion}`,
              currentVersion: result.version,
              requiredVersion,
            };
          }
        }
      }

      return {
        compatible: true,
        version: result.version,
      };
    });
  }

  /**
   * Get recommended tools for project type
   */
  getRecommendedTools(projectType) {
    const recommendations = {
      // Core tools (always recommended)
      core: ['python', 'pip', 'venv'],

      // Project type specific
      fastapi: ['fastapi', 'uvicorn', 'pydantic'],
      django: ['django'],
      flask: ['flask'],
      'data-science': [
        'pandas',
        'numpy',
        'matplotlib',
        'jupyter',
        'scikit-learn',
      ],
      'machine-learning': [
        'torch',
        'tensorflow',
        'scikit-learn',
        'pandas',
        'numpy',
      ],
      cli: ['click', 'typer'],
      library: ['setuptools', 'wheel', 'build', 'twine'],
    };

    const recommended = [...recommendations.core];

    if (recommendations[projectType]) {
      recommended.push(...recommendations[projectType]);
    }

    // Add development tools
    recommended.push('pytest', 'ruff', 'black', 'pyright');

    return [...new Set(recommended)]; // Remove duplicates
  }

  /**
   * Generate installation script
   */
  generateInstallScript(tools, packageManager = 'pip') {
    const script = [];

    // Header
    script.push('#!/bin/bash');
    script.push('# Python tools installation script');
    script.push('# Generated by opencode Python Tool Detector');
    script.push('');

    // Check Python
    script.push('echo "Checking Python installation..."');
    script.push('python --version || { echo "Python not found"; exit 1; }');
    script.push('');

    // Install tools
    for (const tool of tools) {
      const toolInfo = this.tools[tool];
      if (!toolInfo) continue;

      const installCmd = this.getInstallGuide(tool);
      if (installCmd) {
        script.push(`echo "Installing ${tool}..."`);
        script.push(installCmd);
        script.push('');
      }
    }

    // Verify installations
    script.push('echo "Verifying installations..."');
    for (const tool of tools) {
      script.push(`echo -n "${tool}: "`);
      script.push(
        `${this.tools[tool]?.command} 2>/dev/null && echo "OK" || echo "FAILED"`,
      );
    }

    return script.join('\n');
  }

  /**
   * Generate environment report with Python-specific insights
   */
  generateEnvironmentReport(detectedTools) {
    const report = {
      summary: {
        pythonInstalled: detectedTools.python?.installed || false,
        python3Installed: detectedTools.python3?.installed || false,
        toolsDetected: Object.values(detectedTools).filter((t) => t.installed)
          .length,
        recommendedTools: Object.values(detectedTools).filter(
          (t) => t.recommended && t.installed,
        ).length,
        totalTools: Object.keys(detectedTools).length,
      },
      tools: detectedTools,
      recommendations: [],
    };

    // Generate recommendations
    if (!detectedTools.python?.installed && !detectedTools.python3?.installed) {
      report.recommendations.push({
        type: 'critical',
        message: 'Python is not installed',
        tool: 'python',
        installGuide: this.tools.python.installGuide,
      });
    }

    if (detectedTools.python?.installed && !detectedTools.pip?.installed) {
      report.recommendations.push({
        type: 'high',
        message: 'pip package manager is recommended for Python development',
        tool: 'pip',
        installGuide: this.tools.pip.installGuide,
      });
    }

    if (detectedTools.python?.installed && !detectedTools.venv?.installed) {
      report.recommendations.push({
        type: 'medium',
        message: 'venv is recommended for virtual environment management',
        tool: 'venv',
        installGuide: this.tools.venv.installGuide,
      });
    }

    // Check Python version compatibility
    if (detectedTools.python?.installed && detectedTools.python.version) {
      const currentVersion = detectedTools.python.version;
      const minVersion = '3.8';

      if (this.compareVersions(currentVersion, minVersion) < 0) {
        report.recommendations.push({
          type: 'high',
          message: `Python version ${currentVersion} is below minimum recommended ${minVersion}`,
          tool: 'python',
          action: 'Upgrade Python',
        });
      }
    }

    return report;
  }

  /**
   * Compare version strings for Python-specific version checking
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      if (part1 !== part2) {
        return part1 - part2;
      }
    }
    return 0;
  }

  /**
   * Print detection results
   */
  printResults(results, verbose = false) {
    console.log('\n📦 Python Tool Detection Results\n');

    const installed = Object.entries(results)
      .filter(([_, info]) => info.installed)
      .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0));

    const missing = Object.entries(results)
      .filter(([_, info]) => !info.installed)
      .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0));

    if (installed.length > 0) {
      console.log('✅ Installed tools:');
      installed.forEach(([tool, info]) => {
        console.log(`  • ${tool} v${info.version} - ${info.description}`);
      });
      console.log('');
    }

    if (missing.length > 0) {
      console.log('❌ Missing tools:');
      missing.forEach(([tool, info]) => {
        console.log(`  • ${tool} - ${info.description}`);
        if (verbose && info.error) {
          console.log(`    Error: ${info.error}`);
        }
      });
      console.log('');
    }

    console.log(
      `📊 Summary: ${installed.length} installed, ${missing.length} missing`,
    );

    return {
      installed: installed.length,
      missing: missing.length,
      tools: results,
    };
  }
}

// Export for use in other scripts
module.exports = PythonToolDetector;

// CLI entry point
if (require.main === module) {
  const detector = new PythonToolDetector();
  const args = process.argv.slice(2);

  const verbose = args.includes('--verbose') || args.includes('-v');
  const specificTool = args.find((arg) => !arg.startsWith('-'));

  if (specificTool) {
    detector.detectTool(specificTool).then((result) => {
      if (result.installed) {
        console.log(
          `✅ ${specificTool} v${result.version} - ${result.description}`,
        );
      } else {
        console.log(`❌ ${specificTool} - ${result.description}`);
        console.log(
          `   Install: ${detector.getInstallGuide(specificTool) || 'No install guide available'}`,
        );
      }
    });
  } else {
    detector.detectAll().then((results) => {
      detector.printResults(results, verbose);
    });
  }
}
