#!/usr/bin/env node
/**
 * PineScript Tool Detector
 *
 * Detects PineScript-related tools and utilities
 */

const { runCommand, commandExists } = require('../../scripts/lib/utils');

class PineScriptToolDetector {
  constructor() {
    this.tools = {
      // PineScript parsers and validators
      pineParser: {
        command:
          "node -e \"try { require('pine-script-parser'); console.log('installed') } catch(e) { console.log('not installed') }\"",
        installed: false,
        version: null,
      },

      // Backtesting tools
      backtestingPy: {
        command:
          'python -c "import backtesting; print(backtesting.__version__)"',
        installed: false,
        version: null,
      },
      vectorbt: {
        command: 'python -c "import vectorbt; print(vectorbt.__version__)"',
        installed: false,
        version: null,
      },

      // Data tools
      pandas: {
        command: 'python -c "import pandas; print(pandas.__version__)"',
        installed: false,
        version: null,
      },
      numpy: {
        command: 'python -c "import numpy; print(numpy.__version__)"',
        installed: false,
        version: null,
      },

      // Webhook testing tools
      curl: { command: 'curl --version', installed: false, version: null },
      httpie: { command: 'http --version', installed: false, version: null },

      // TradingView tools
      tradingviewApi: {
        command:
          "node -e \"try { require('tradingview-api'); console.log('installed') } catch(e) { console.log('not installed') }\"",
        installed: false,
        version: null,
      },

      // Alert system tools
      nodeFetch: {
        command:
          "node -e \"try { require('node-fetch'); console.log('installed') } catch(e) { console.log('not installed') }\"",
        installed: false,
        version: null,
      },
      axios: {
        command:
          "node -e \"try { require('axios'); console.log('installed') } catch(e) { console.log('not installed') }\"",
        installed: false,
        version: null,
      },

      // Version conversion tools
      pineConverter: {
        command:
          "node -e \"try { require('pine-converter'); console.log('installed') } catch(e) { console.log('not installed') }\"",
        installed: false,
        version: null,
      },
    };
  }

  /**
   * Detect all PineScript-related tools
   */
  async detectTools() {
    console.log('🔍 Detecting PineScript tools...');

    const detectedTools = {};

    for (const [tool, info] of Object.entries(this.tools)) {
      try {
        const result = runCommand(info.command, { stdio: 'pipe' });
        if (result.success) {
          info.installed = true;

          // Extract version from output
          const output = result.output.trim();
          if (output && output !== 'installed' && output !== 'not installed') {
            const versionMatch = output.match(/(\d+\.\d+\.\d+|\d+\.\d+)/);
            info.version = versionMatch ? versionMatch[0] : output;
          } else if (output === 'installed') {
            info.version = 'unknown';
          }

          detectedTools[tool] = { ...info };
        }
      } catch (error) {
        // Tool not installed or command failed
        info.installed = false;
        info.version = null;
      }
    }

    // Check for Python availability (for backtesting)
    const pythonResult = runCommand('python --version', { stdio: 'pipe' });
    if (pythonResult.success) {
      const versionMatch = pythonResult.output.match(/Python (\d+\.\d+\.\d+)/);
      detectedTools.python = {
        installed: true,
        version: versionMatch ? versionMatch[1] : 'unknown',
        command: 'python --version',
      };
    }

    // Check for Node.js availability
    const nodeResult = runCommand('node --version', { stdio: 'pipe' });
    if (nodeResult.success) {
      const versionMatch = nodeResult.output.match(/v(\d+\.\d+\.\d+)/);
      detectedTools.node = {
        installed: true,
        version: versionMatch ? versionMatch[1] : 'unknown',
        command: 'node --version',
      };
    }

    // Display results
    const installedTools = Object.entries(detectedTools)
      .filter(([_, info]) => info.installed)
      .map(
        ([tool, info]) => `${tool}${info.version ? ` v${info.version}` : ''}`,
      );

    if (installedTools.length > 0) {
      console.log(`✅ Found ${installedTools.length} tools:`);
      installedTools.forEach((tool) => console.log(`  • ${tool}`));
    } else {
      console.log('⚠️  No PineScript tools detected');
    }

    // Check for critical missing tools
    const missingCritical = [];
    if (!detectedTools.pineParser?.installed) {
      missingCritical.push('pine-script-parser (for PineScript validation)');
    }

    if (!detectedTools.python?.installed) {
      missingCritical.push('Python (for backtesting and optimization)');
    }

    if (missingCritical.length > 0) {
      console.log('\n⚠️  Missing critical tools:');
      missingCritical.forEach((tool) => console.log(`  • ${tool}`));
      console.log('\nInstall missing tools for full PineScript support.');
    }

    return detectedTools;
  }

  /**
   * Get installation recommendations based on project type
   */
  getRecommendations(projectType, detectedTools) {
    const recommendations = [];

    // General recommendations
    if (!detectedTools.pineParser?.installed) {
      recommendations.push({
        tool: 'pine-script-parser',
        command: 'npm install pine-script-parser',
        description: 'PineScript parser for syntax validation',
        priority: 'high',
      });
    }

    if (!detectedTools.node?.installed) {
      recommendations.push({
        tool: 'Node.js',
        command: 'Visit https://nodejs.org/',
        description: 'JavaScript runtime for PineScript tools',
        priority: 'high',
      });
    }

    // Project type specific recommendations
    if (projectType === 'strategy') {
      if (!detectedTools.python?.installed) {
        recommendations.push({
          tool: 'Python',
          command: 'Visit https://python.org/',
          description: 'Required for backtesting and optimization',
          priority: 'high',
        });
      }

      if (
        !detectedTools.backtestingPy?.installed &&
        detectedTools.python?.installed
      ) {
        recommendations.push({
          tool: 'backtesting.py',
          command: 'pip install backtesting',
          description: 'Backtesting library for strategy testing',
          priority: 'medium',
        });
      }

      if (!detectedTools.pandas?.installed && detectedTools.python?.installed) {
        recommendations.push({
          tool: 'pandas',
          command: 'pip install pandas',
          description: 'Data analysis library for backtesting',
          priority: 'medium',
        });
      }
    }

    if (projectType === 'indicator' || projectType === 'strategy') {
      if (!detectedTools.curl?.installed && !detectedTools.httpie?.installed) {
        recommendations.push({
          tool: 'curl or httpie',
          command: 'brew install curl (macOS) or apt-get install curl (Linux)',
          description: 'HTTP client for webhook testing',
          priority: 'low',
        });
      }
    }

    // Alert system recommendations
    if (
      !detectedTools.axios?.installed &&
      !detectedTools.nodeFetch?.installed
    ) {
      recommendations.push({
        tool: 'axios or node-fetch',
        command: 'npm install axios',
        description: 'HTTP client for alert webhooks',
        priority: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Check if specific tool is installed
   */
  isToolInstalled(toolName) {
    return this.tools[toolName]?.installed || false;
  }

  /**
   * Get tool version
   */
  getToolVersion(toolName) {
    return this.tools[toolName]?.version || null;
  }
}

// Export for use in other scripts
module.exports = PineScriptToolDetector;

// CLI entry point
if (require.main === module) {
  const detector = new PineScriptToolDetector();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 PineScript Tool Detector

Usage:
  node languages/pinescript/tool-detector.js [options]

Options:
  --recommendations  Show installation recommendations
  --list             List all detected tools
  --help, -h         Show this help message

Examples:
  node languages/pinescript/tool-detector.js          # Detect tools
  node languages/pinescript/tool-detector.js --list   # List detected tools
    `);
    process.exit(0);
  } else if (args.includes('--list')) {
    detector.detectTools().then((tools) => {
      console.log('\n📋 Detected Tools:');
      Object.entries(tools).forEach(([name, info]) => {
        console.log(
          `  ${info.installed ? '✅' : '❌'} ${name}: ${info.installed ? `v${info.version}` : 'Not installed'}`,
        );
      });
    });
  } else if (args.includes('--recommendations')) {
    detector.detectTools().then((tools) => {
      const recommendations = detector.getRecommendations('strategy', tools);
      console.log('\n💡 Installation Recommendations:');
      recommendations.forEach((rec) => {
        console.log(
          `\n${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} ${rec.tool}`,
        );
        console.log(`   ${rec.description}`);
        console.log(`   Install: ${rec.command}`);
      });
    });
  } else {
    detector.detectTools();
  }
}
