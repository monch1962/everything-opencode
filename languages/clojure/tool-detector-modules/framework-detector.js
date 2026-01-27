#!/usr/bin/env node
/**
 * Framework Detector Module for Clojure Tool Detector
 *
 * Detects frameworks and REPL configurations
 */

const fs = require('fs');
const path = require('path');

class FrameworkDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect frameworks
   */
  async detectFrameworks() {
    const frameworks = [];

    // Check for web frameworks
    const webFrameworks = this.detectWebFrameworks();
    frameworks.push(...webFrameworks);

    // Check for database frameworks
    const dbFrameworks = this.detectDatabaseFrameworks();
    frameworks.push(...dbFrameworks);

    // Check for other frameworks
    const otherFrameworks = this.detectOtherFrameworks();
    frameworks.push(...otherFrameworks);

    return frameworks;
  }

  /**
   * Detect web frameworks
   */
  detectWebFrameworks() {
    const frameworks = [];
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    // Common web frameworks and their indicators
    const webFrameworkIndicators = [
      {
        name: 'ring',
        description: 'HTTP server abstraction',
        indicators: ['ring/ring-core', 'ring/ring-jetty', 'ring/ring-defaults'],
      },
      {
        name: 'compojure',
        description: 'Routing library for Ring',
        indicators: ['compojure/compojure'],
      },
      {
        name: 'reitit',
        description: 'Fast data-driven routing',
        indicators: ['metosin/reitit'],
      },
      {
        name: 'luminus',
        description: 'Web framework template',
        indicators: ['luminus', 'luminus-template'],
      },
      {
        name: 'pedestal',
        description: 'Web application framework',
        indicators: ['io.pedestal/pedestal.service', 'io.pedestal/pedestal.jetty'],
      },
      {
        name: 'fulcro',
        description: 'Full-stack web framework',
        indicators: ['fulcrologic/fulcro'],
      },
      {
        name: 're-frame',
        description: 'Frontend framework',
        indicators: ['re-frame/re-frame'],
      },
      {
        name: 'shadow-cljs',
        description: 'ClojureScript build tool',
        indicators: ['shadow-cljs'],
      },
    ];

    // Check project files for framework indicators
    for (const framework of webFrameworkIndicators) {
      const hasFramework = this.checkFrameworkInFiles(framework.indicators);
      if (hasFramework) {
        frameworks.push({
          name: framework.name,
          description: framework.description,
          detected: true,
          type: 'web',
        });
      }
    }

    return frameworks;
  }

  /**
   * Detect database frameworks
   */
  detectDatabaseFrameworks() {
    const frameworks = [];

    // Common database frameworks and their indicators
    const dbFrameworkIndicators = [
      {
        name: 'next.jdbc',
        description: 'JDBC-based database access',
        indicators: ['seancorfield/next.jdbc'],
      },
      {
        name: 'hugsql',
        description: 'SQL library',
        indicators: ['com.layerware/hugsql'],
      },
      {
        name: 'korma',
        description: 'SQL DSL',
        indicators: ['korma/korma'],
      },
      {
        name: 'monger',
        description: 'MongoDB client',
        indicators: ['com.novemberain/monger'],
      },
      {
        name: 'cassandra',
        description: 'Cassandra client',
        indicators: ['cc.qbits/alia'],
      },
      {
        name: 'datomic',
        description: 'Datomic database',
        indicators: ['com.datomic/datomic-free', 'com.datomic/datomic-pro'],
      },
      {
        name: 'xtdb',
        description: 'XTDB database',
        indicators: ['com.xtdb/xtdb-core'],
      },
      {
        name: 'crux',
        description: 'Crux database',
        indicators: ['juxt/crux-core'],
      },
    ];

    // Check project files for framework indicators
    for (const framework of dbFrameworkIndicators) {
      const hasFramework = this.checkFrameworkInFiles(framework.indicators);
      if (hasFramework) {
        frameworks.push({
          name: framework.name,
          description: framework.description,
          detected: true,
          type: 'database',
        });
      }
    }

    return frameworks;
  }

  /**
   * Detect other frameworks
   */
  detectOtherFrameworks() {
    const frameworks = [];

    // Other framework indicators
    const otherFrameworkIndicators = [
      {
        name: 'core.async',
        description: 'Asynchronous programming',
        indicators: ['org.clojure/core.async'],
      },
      {
        name: 'manifold',
        description: 'Async programming abstraction',
        indicators: ['manifold/manifold'],
      },
      {
        name: 'component',
        description: 'Dependency injection',
        indicators: ['com.stuartsierra/component'],
      },
      {
        name: 'mount',
        description: 'State management',
        indicators: ['mount/mount'],
      },
      {
        name: 'integrant',
        description: 'Micro-framework for data-driven architecture',
        indicators: ['integrant/integrant'],
      },
      {
        name: 'aero',
        description: 'Configuration library',
        indicators: ['aero/aero'],
      },
    ];

    // Check project files for framework indicators
    for (const framework of otherFrameworkIndicators) {
      const hasFramework = this.checkFrameworkInFiles(framework.indicators);
      if (hasFramework) {
        frameworks.push({
          name: framework.name,
          description: framework.description,
          detected: true,
          type: 'library',
        });
      }
    }

    return frameworks;
  }

  /**
   * Detect REPL configuration
   */
  async detectRepl() {
    const replInfo = {
      type: 'standard',
      tools: [],
      configurations: [],
    };

    // Check for nREPL
    const hasNrepl = this.checkFrameworkInFiles(['nrepl/nrepl', 'cider/cider-nrepl']);
    if (hasNrepl) {
      replInfo.tools.push({
        name: 'nrepl',
        description: 'Network REPL',
        installed: true,
      });
      replInfo.type = 'nrepl';
    }

    // Check for Socket REPL
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    if (fs.existsSync(depsEdnPath) || fs.existsSync(projectCljPath)) {
      replInfo.tools.push({
        name: 'socket-repl',
        description: 'Socket REPL (built-in)',
        installed: true,
      });
    }

    // Check for prepl
    const hasPrepl = this.checkFrameworkInFiles(['clojure.tools.deps.alpha.repl']);
    if (hasPrepl) {
      replInfo.tools.push({
        name: 'prepl',
        description: 'Programmable REPL',
        installed: true,
      });
    }

    // Check for REPL configuration files
    const replConfigFiles = [
      '.nrepl-port',
      '.repl-port',
      'repl.edn',
      '.shadow-cljs',
      'shadow-cljs.edn',
    ];

    for (const configFile of replConfigFiles) {
      const filePath = path.join(this.projectPath, configFile);
      if (fs.existsSync(filePath)) {
        replInfo.configurations.push(configFile);
      }
    }

    return replInfo;
  }

  /**
   * Detect ClojureScript configuration
   */
  async detectClojureScript() {
    const cljsInfo = {
      installed: false,
      buildTools: [],
      configurations: [],
    };

    // Check for shadow-cljs
    const shadowCljsPath = path.join(this.projectPath, 'shadow-cljs.edn');
    if (fs.existsSync(shadowCljsPath)) {
      cljsInfo.installed = true;
      cljsInfo.buildTools.push({
        name: 'shadow-cljs',
        description: 'ClojureScript build tool',
        configFile: 'shadow-cljs.edn',
      });
      cljsInfo.configurations.push('shadow-cljs.edn');
    }

    // Check for figwheel
    const hasFigwheel = this.checkFrameworkInFiles(['figwheel', 'figwheel-main']);
    if (hasFigwheel) {
      cljsInfo.installed = true;
      cljsInfo.buildTools.push({
        name: 'figwheel',
        description: 'ClojureScript development tool',
      });
    }

    // Check for cljs.build
    const hasCljsBuild = this.checkFrameworkInFiles(['org.clojure/clojurescript']);
    if (hasCljsBuild) {
      cljsInfo.installed = true;
      cljsInfo.buildTools.push({
        name: 'cljs.build',
        description: 'Official ClojureScript build API',
      });
    }

    return cljsInfo;
  }

  /**
   * Check if framework indicators exist in project files
   */
  checkFrameworkInFiles(indicators) {
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    // Check deps.edn
    if (fs.existsSync(depsEdnPath)) {
      try {
        const content = fs.readFileSync(depsEdnPath, 'utf8');
        for (const indicator of indicators) {
          if (content.includes(indicator)) {
            return true;
          }
        }
      } catch (error) {
        // Error reading file
      }
    }

    // Check project.clj
    if (fs.existsSync(projectCljPath)) {
      try {
        const content = fs.readFileSync(projectCljPath, 'utf8');
        for (const indicator of indicators) {
          if (content.includes(indicator)) {
            return true;
          }
        }
      } catch (error) {
        // Error reading file
      }
    }

    return false;
  }
}

module.exports = FrameworkDetector;
