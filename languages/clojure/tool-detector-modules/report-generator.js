#!/usr/bin/env node
/**
 * Report Generator Module for Clojure Tool Detector
 *
 * Generates environment reports and installation commands
 */

class ReportGenerator {
  constructor() {}

  /**
   * Generate environment report
   */
  generateEnvironmentReport(tools) {
    let report = 'Clojure Development Environment Report\n';
    report += '='.repeat(50) + '\n\n';

    // Java
    report += 'Java Runtime:\n';
    report += `  Installed: ${tools.java.installed ? '✅ Yes' : '❌ No'}\n`;
    if (tools.java.installed) {
      report += `  Version: ${tools.java.version}\n`;
      if (tools.java.path) {
        report += `  Path: ${tools.java.path}\n`;
      }
    }
    report += '\n';

    // Clojure
    report += 'Clojure:\n';
    report += `  Installed: ${tools.clojure.installed ? '✅ Yes' : '❌ No'}\n`;
    if (tools.clojure.installed) {
      report += `  Version: ${tools.clojure.version}\n`;
      report += `  Type: ${tools.clojure.type}\n`;
      if (tools.clojure.path) {
        report += `  Path: ${tools.clojure.path}\n`;
      }
    }
    report += '\n';

    // Leiningen
    report += 'Leiningen:\n';
    report += `  Installed: ${tools.leiningen.installed ? '✅ Yes' : '❌ No'}\n`;
    if (tools.leiningen.installed) {
      report += `  Version: ${tools.leiningen.version}\n`;
      if (tools.leiningen.path) {
        report += `  Path: ${tools.leiningen.path}\n`;
      }
    }
    report += '\n';

    // Boot
    report += 'Boot:\n';
    report += `  Installed: ${tools.boot.installed ? '✅ Yes' : '❌ No'}\n`;
    if (tools.boot.installed) {
      report += `  Version: ${tools.boot.version}\n`;
      if (tools.boot.path) {
        report += `  Path: ${tools.boot.path}\n`;
      }
    }
    report += '\n';

    // Build System
    report += 'Build System:\n';
    if (tools.buildSystem.length > 0) {
      tools.buildSystem.forEach((system, index) => {
        report += `  ${index + 1}. ${system.description} (${system.configFile})\n`;
        report += `     Confidence: ${Math.round(system.confidence * 100)}%\n`;
      });
    } else {
      report += '  No build system detected\n';
    }
    report += '\n';

    // Project
    report += 'Project:\n';
    report += `  Type: ${this.getProjectTypeDescription(tools.project)}\n`;
    report += `  Version: ${tools.project.version || 'Not specified'}\n`;
    if (tools.project.description) {
      report += `  Description: ${tools.project.description}\n`;
    }
    if (tools.project.mainNamespace) {
      report += `  Main Namespace: ${tools.project.mainNamespace}\n`;
    }
    report += `  Dependencies: ${tools.project.dependencies.length}\n`;
    report += '\n';

    // Linters
    report += 'Linters:\n';
    if (tools.linters.length > 0) {
      tools.linters.forEach((linter, index) => {
        report += `  ${index + 1}. ${linter.description} (${linter.name})\n`;
        report += `     Installed: ${linter.installed ? '✅ Yes' : '❌ No'}\n`;
        if (linter.installed && linter.version) {
          report += `     Version: ${linter.version}\n`;
        }
        if (linter.configFiles.length > 0) {
          report += `     Config: ${linter.configFiles.join(', ')}\n`;
        }
      });
    } else {
      report += '  No linters detected\n';
    }
    report += '\n';

    // Formatters
    report += 'Formatters:\n';
    if (tools.formatters.length > 0) {
      tools.formatters.forEach((formatter, index) => {
        report += `  ${index + 1}. ${formatter.description} (${formatter.name})\n`;
        report += `     Installed: ${formatter.installed ? '✅ Yes' : '❌ No'}\n`;
        if (formatter.installed && formatter.version) {
          report += `     Version: ${formatter.version}\n`;
        }
        if (formatter.configFiles.length > 0) {
          report += `     Config: ${formatter.configFiles.join(', ')}\n`;
        }
      });
    } else {
      report += '  No formatters detected\n';
    }
    report += '\n';

    // Test Frameworks
    report += 'Test Frameworks:\n';
    if (tools.testFrameworks.length > 0) {
      tools.testFrameworks.forEach((framework, index) => {
        report += `  ${index + 1}. ${framework.description} (${framework.name})\n`;
        report += `     Installed: ${framework.installed ? '✅ Yes' : '❌ No'}\n`;
        if (framework.installed && framework.version) {
          report += `     Version: ${framework.version}\n`;
        }
        if (framework.configFiles.length > 0) {
          report += `     Config: ${framework.configFiles.join(', ')}\n`;
        }
      });
    } else {
      report += '  No test frameworks detected\n';
    }
    report += '\n';

    // Frameworks
    report += 'Frameworks:\n';
    if (tools.frameworks.length > 0) {
      tools.frameworks.forEach((framework, index) => {
        report += `  ${index + 1}. ${framework.description} (${framework.name})\n`;
        report += `     Type: ${framework.type}\n`;
      });
    } else {
      report += '  No frameworks detected\n';
    }
    report += '\n';

    // REPL
    report += 'REPL:\n';
    report += `  Type: ${tools.repl.type}\n`;
    if (tools.repl.tools.length > 0) {
      report += '  Tools:\n';
      tools.repl.tools.forEach((tool, index) => {
        report += `    ${index + 1}. ${tool.description} (${tool.name})\n`;
      });
    }
    if (tools.repl.configurations.length > 0) {
      report += `  Configurations: ${tools.repl.configurations.join(', ')}\n`;
    }
    report += '\n';

    // ClojureScript
    report += 'ClojureScript:\n';
    report += `  Installed: ${tools.clojurescript.installed ? '✅ Yes' : '❌ No'}\n`;
    if (tools.clojurescript.installed) {
      report += '  Build Tools:\n';
      tools.clojurescript.buildTools.forEach((tool, index) => {
        report += `    ${index + 1}. ${tool.description} (${tool.name})\n`;
        if (tool.configFile) {
          report += `       Config: ${tool.configFile}\n`;
        }
      });
      if (tools.clojurescript.configurations.length > 0) {
        report += `  Configurations: ${tools.clojurescript.configurations.join(', ')}\n`;
      }
    }

    return report;
  }

  /**
   * Get project type description
   */
  getProjectTypeDescription(project) {
    if (project.type === 'unknown') {
      return 'Unknown project type';
    }

    let description = '';

    switch (project.type) {
      case 'clojure-cli':
        description = 'Clojure CLI (deps.edn) project';
        break;
      case 'leiningen':
        description = 'Leiningen project';
        break;
      case 'boot':
        description = 'Boot project';
        break;
      case 'shadow-cljs':
        description = 'Shadow CLJS project';
        break;
      case 'babashka':
        description = 'Babashka script/project';
        break;
      default:
        description = project.type;
    }

    if (project.isLibrary) {
      description += ' (Library)';
    } else if (project.isApplication) {
      description += ' (Application)';
    }

    return description;
  }

  /**
   * Get installation commands for missing tools
   */
  getInstallationCommands(tools) {
    const commands = [];

    // Java installation
    if (!tools.java.installed) {
      commands.push({
        tool: 'Java',
        description: 'Java Runtime Environment',
        command: 'Install from https://adoptium.net/ or use package manager',
        priority: 10,
      });
    }

    // Clojure CLI installation
    if (!tools.clojure.installed) {
      commands.push({
        tool: 'Clojure CLI',
        description: 'Clojure command line tools',
        command: 'Install from https://clojure.org/guides/getting_started',
        priority: 9,
      });
    }

    // Leiningen installation (if project uses it)
    const usesLeiningen = tools.buildSystem.some((sys) => sys.name === 'leiningen');
    if (usesLeiningen && !tools.leiningen.installed) {
      commands.push({
        tool: 'Leiningen',
        description: 'Build automation tool',
        command: 'Install from https://leiningen.org/',
        priority: 8,
      });
    }

    // clj-kondo installation
    const hasCljKondo = tools.linters.some((l) => l.name === 'clj-kondo');
    if (!hasCljKondo) {
      commands.push({
        tool: 'clj-kondo',
        description: 'Clojure linter and static analyzer',
        command:
          'Install: bash <(curl -s https://raw.githubusercontent.com/clj-kondo/clj-kondo/master/script/install-clj-kondo)',
        priority: 7,
      });
    }

    // zprint installation
    const hasZprint = tools.formatters.some((f) => f.name === 'zprint');
    if (!hasZprint) {
      commands.push({
        tool: 'zprint',
        description: 'Code formatter',
        command:
          'Install: curl -s https://raw.githubusercontent.com/kkinnear/zprint/main/install | bash',
        priority: 6,
      });
    }

    return commands.sort((a, b) => b.priority - a.priority);
  }
}

module.exports = ReportGenerator;
