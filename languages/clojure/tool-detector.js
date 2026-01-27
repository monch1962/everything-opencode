/**
 * Clojure Tool Detector
 *
 * Detect Clojure tools, versions, and project configuration
 * Supports Clojure CLI (deps.edn), Leiningen (project.clj), and Boot (build.boot)
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('../../scripts/lib/utils');

class ClojureToolDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Detect all Clojure tools and versions
   */
  async detectTools() {
    const tools = {
      java: await this.detectJava(),
      clojure: await this.detectClojure(),
      leiningen: await this.detectLeiningen(),
      boot: await this.detectBoot(),
      buildSystem: await this.detectBuildSystem(),
      project: await this.detectProject(),
      linters: await this.detectLinters(),
      formatters: await this.detectFormatters(),
      testFrameworks: await this.detectTestFrameworks(),
      frameworks: await this.detectFrameworks(),
      repl: await this.detectRepl(),
      clojurescript: await this.detectClojureScript(),
    };

    return tools;
  }

  /**
   * Detect Java runtime
   */
  async detectJava() {
    try {
      const result = await runCommand('java', ['-version']);
      if (result.success) {
        // Parse Java version from stderr (java -version outputs to stderr)
        const versionOutput = result.stderr || result.stdout || '';
        const versionMatch =
          versionOutput.match(/version\s+"([^"]+)"/) || versionOutput.match(/version\s+([^\s]+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('java'),
        };
      }
    } catch (error) {
      // java not found
    }

    return { installed: false };
  }

  /**
   * Detect Clojure CLI tools
   */
  async detectClojure() {
    try {
      const result = await runCommand('clojure', ['--version']);
      if (result.success) {
        // Parse Clojure version
        const versionMatch =
          result.stdout.match(/Clojure CLI version (\d+\.\d+\.\d+)/) ||
          result.stdout.match(/Clojure version (\d+\.\d+\.\d+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('clojure'),
          type: 'cli',
        };
      }
    } catch (error) {
      // clojure not found
    }

    return { installed: false };
  }

  /**
   * Detect Leiningen build tool
   */
  async detectLeiningen() {
    try {
      const result = await runCommand('lein', ['version']);
      if (result.success) {
        // Parse Leiningen version
        const versionMatch = result.stdout.match(/Leiningen (\d+\.\d+\.\d+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('lein'),
        };
      }
    } catch (error) {
      // lein not found
    }

    return { installed: false };
  }

  /**
   * Detect Boot build tool
   */
  async detectBoot() {
    try {
      const result = await runCommand('boot', ['--version']);
      if (result.success) {
        // Parse Boot version
        const versionMatch = result.stdout.match(/Boot (\d+\.\d+\.\d+)/);

        return {
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('boot'),
        };
      }
    } catch (error) {
      // boot not found
    }

    return { installed: false };
  }

  /**
   * Detect which build system is being used in the project
   */
  async detectBuildSystem() {
    const buildSystems = [];

    // Check for deps.edn (Clojure CLI)
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    if (fs.existsSync(depsEdnPath)) {
      buildSystems.push({
        name: 'clojure-cli',
        configFile: 'deps.edn',
        primary: buildSystems.length === 0,
      });
    }

    // Check for project.clj (Leiningen)
    const projectCljPath = path.join(this.projectPath, 'project.clj');
    if (fs.existsSync(projectCljPath)) {
      buildSystems.push({
        name: 'leiningen',
        configFile: 'project.clj',
        primary: buildSystems.length === 0,
      });
    }

    // Check for build.boot (Boot)
    const buildBootPath = path.join(this.projectPath, 'build.boot');
    if (fs.existsSync(buildBootPath)) {
      buildSystems.push({
        name: 'boot',
        configFile: 'build.boot',
        primary: buildSystems.length === 0,
      });
    }

    return buildSystems;
  }

  /**
   * Detect Clojure project configuration
   */
  async detectProject() {
    const projectInfo = {
      hasDepsEdn: false,
      hasProjectClj: false,
      hasBuildBoot: false,
      isLibrary: false,
      isApplication: false,
      isFullStack: false,
      hasClojureScript: false,
      name: null,
      version: null,
      description: null,
      dependencies: 0,
      devDependencies: 0,
      aliases: [],
      sourceDirs: ['src'],
      testDirs: ['test'],
      resourceDirs: ['resources'],
    };

    // Check for deps.edn
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    if (fs.existsSync(depsEdnPath)) {
      projectInfo.hasDepsEdn = true;
      await this.parseDepsEdn(depsEdnPath, projectInfo);
    }

    // Check for project.clj
    const projectCljPath = path.join(this.projectPath, 'project.clj');
    if (fs.existsSync(projectCljPath)) {
      projectInfo.hasProjectClj = true;
      await this.parseProjectClj(projectCljPath, projectInfo);
    }

    // Check for build.boot
    const buildBootPath = path.join(this.projectPath, 'build.boot');
    if (fs.existsSync(buildBootPath)) {
      projectInfo.hasBuildBoot = true;
      // Boot parsing would go here
    }

    // Check for ClojureScript
    const shadowCljsPath = path.join(this.projectPath, 'shadow-cljs.edn');
    const depsCljsPath = path.join(this.projectPath, 'deps.cljs');
    if (fs.existsSync(shadowCljsPath) || fs.existsSync(depsCljsPath)) {
      projectInfo.hasClojureScript = true;
    }

    // Determine project type
    projectInfo.isLibrary = this.isLibraryProject(projectInfo);
    projectInfo.isApplication = this.isApplicationProject(projectInfo);
    projectInfo.isFullStack = projectInfo.hasClojureScript;

    return projectInfo;
  }

  /**
   * Parse deps.edn file
   */
  async parseDepsEdn(depsEdnPath, projectInfo) {
    try {
      const content = fs.readFileSync(depsEdnPath, 'utf8');

      // Simple parsing for basic info
      const lines = content.split('\n');
      let inDeps = false;
      let inAliases = false;
      let currentAlias = null;

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (trimmed.startsWith(';') || trimmed === '') {
          continue;
        }

        // Look for project name/version (not standard in deps.edn, but some put it in comments)
        if (trimmed.includes(':project/name') || trimmed.includes('"name"')) {
          const match =
            trimmed.match(/:project\/name\s+"([^"]+)"/) || trimmed.match(/"name"\s*:\s*"([^"]+)"/);
          if (match) projectInfo.name = match[1];
        }

        if (trimmed.includes(':project/version') || trimmed.includes('"version"')) {
          const match =
            trimmed.match(/:project\/version\s+"([^"]+)"/) ||
            trimmed.match(/"version"\s*:\s*"([^"]+)"/);
          if (match) projectInfo.version = match[1];
        }

        // Count dependencies
        if (trimmed.includes(':deps') || trimmed.includes(':dependencies')) {
          inDeps = true;
          inAliases = false;
        } else if (trimmed.includes(':aliases')) {
          inDeps = false;
          inAliases = true;
        } else if (trimmed.startsWith('{') && trimmed.includes(':')) {
          // Start of a map
          if (inAliases && !trimmed.includes(':')) {
            // This might be an alias name
            const aliasMatch = trimmed.match(/:([a-zA-Z-]+)/);
            if (aliasMatch) {
              currentAlias = aliasMatch[1];
              projectInfo.aliases.push(currentAlias);
            }
          }
        } else if (trimmed.includes(':') && !trimmed.startsWith(':')) {
          // Likely a dependency entry
          if (inDeps) {
            projectInfo.dependencies++;
          }
        }
      }
    } catch (error) {
      // Failed to parse deps.edn
    }
  }

  /**
   * Parse project.clj file
   */
  async parseProjectClj(projectCljPath, projectInfo) {
    try {
      const content = fs.readFileSync(projectCljPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments
        if (trimmed.startsWith(';')) {
          continue;
        }

        // Project name
        if (trimmed.includes('defproject')) {
          const match = trimmed.match(/defproject\s+([^\s]+)/);
          if (match) {
            const fullName = match[1];
            // Extract name and version
            const parts = fullName.split(/\s+/);
            if (parts.length >= 2) {
              projectInfo.name = parts[0];
              projectInfo.version = parts[1];
            }
          }
        }

        // Description
        if (trimmed.includes(':description')) {
          const match = trimmed.match(/:description\s+"([^"]+)"/);
          if (match) projectInfo.description = match[1];
        }

        // Dependencies
        if (trimmed.includes(':dependencies')) {
          projectInfo.dependencies = this.countListItems(lines, lines.indexOf(line));
        }

        // Dev dependencies
        if (
          trimmed.includes(':dev-dependencies') ||
          trimmed.includes(':profiles :dev :dependencies')
        ) {
          projectInfo.devDependencies = this.countListItems(lines, lines.indexOf(line));
        }

        // Source/test directories
        if (trimmed.includes(':source-paths')) {
          projectInfo.sourceDirs = this.extractListValues(lines, lines.indexOf(line));
        }
        if (trimmed.includes(':test-paths')) {
          projectInfo.testDirs = this.extractListValues(lines, lines.indexOf(line));
        }
      }
    } catch (error) {
      // Failed to parse project.clj
    }
  }

  /**
   * Count items in a list
   */
  countListItems(lines, startIndex) {
    let count = 0;
    let depth = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      // Count opening brackets
      depth += (line.match(/\[/g) || []).length;
      depth -= (line.match(/\]/g) || []).length;

      // If we're inside the list and see a vector start
      if (depth > 0 && line.includes('[')) {
        count++;
      }

      // If we've closed the list, stop counting
      if (depth < 0) {
        break;
      }
    }

    return count;
  }

  /**
   * Extract list values
   */
  extractListValues(lines, startIndex) {
    const values = [];
    let currentValue = '';
    let depth = 0;
    let inString = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const prevChar = j > 0 ? line[j - 1] : '';

        // Handle strings
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }

        if (!inString) {
          // Count brackets
          if (char === '[') depth++;
          if (char === ']') depth--;

          // If we're inside the list and not in a string
          if (depth > 0) {
            if (char === ' ' || char === '\t') {
              if (currentValue.trim()) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
              }
            } else {
              currentValue += char;
            }
          }
        } else {
          currentValue += char;
        }
      }

      // If we've closed the list, stop
      if (depth <= 0) {
        break;
      }
    }

    // Add last value if any
    if (currentValue.trim()) {
      values.push(currentValue.trim().replace(/^"|"$/g, ''));
    }

    return values.length > 0 ? values : ['src']; // Default
  }

  /**
   * Determine if project is a library
   */
  isLibraryProject(projectInfo) {
    // Simple heuristic: if it has a description mentioning library or API
    if (projectInfo.description) {
      const desc = projectInfo.description.toLowerCase();
      return desc.includes('library') || desc.includes('api') || desc.includes('clojure library');
    }

    // Check for common library patterns in name
    if (projectInfo.name) {
      const name = projectInfo.name.toLowerCase();
      return name.includes('clj-') || name.includes('.clj') || name.includes('-lib');
    }

    return false;
  }

  /**
   * Determine if project is an application
   */
  isApplicationProject(projectInfo) {
    // Check for main namespace or entry point indicators
    if (projectInfo.hasDepsEdn) {
      const depsEdnPath = path.join(this.projectPath, 'deps.edn');
      try {
        const content = fs.readFileSync(depsEdnPath, 'utf8');
        return content.includes(':main') || content.includes('main-namespace');
      } catch (error) {
        // Ignore
      }
    }

    if (projectInfo.hasProjectClj) {
      const projectCljPath = path.join(this.projectPath, 'project.clj');
      try {
        const content = fs.readFileSync(projectCljPath, 'utf8');
        return content.includes(':main') || content.includes(':aot');
      } catch (error) {
        // Ignore
      }
    }

    return false;
  }

  /**
   * Detect linters
   */
  async detectLinters() {
    const linters = [];

    // Check for clj-kondo
    try {
      const result = await runCommand('clj-kondo', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/clj-kondo v(\d+\.\d+\.\d+)/);
        linters.push({
          name: 'clj-kondo',
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('clj-kondo'),
        });
      }
    } catch (error) {
      // clj-kondo not found
    }

    // Check for eastwood (if leiningen is available)
    try {
      const leinResult = await runCommand('lein', ['eastwood']);
      if (leinResult.success || leinResult.stderr?.includes('eastwood')) {
        linters.push({
          name: 'eastwood',
          installed: true,
          version: 'unknown', // eastwood doesn't have a clean version flag
        });
      }
    } catch (error) {
      // eastwood not available
    }

    // Check for kibit
    try {
      const leinResult = await runCommand('lein', ['kibit']);
      if (leinResult.success || leinResult.stderr?.includes('kibit')) {
        linters.push({
          name: 'kibit',
          installed: true,
          version: 'unknown',
        });
      }
    } catch (error) {
      // kibit not available
    }

    return linters;
  }

  /**
   * Detect formatters
   */
  async detectFormatters() {
    const formatters = [];

    // Check for zprint
    try {
      const result = await runCommand('zprint', ['--version']);
      if (result.success) {
        const versionMatch = result.stdout.match(/zprint (\d+\.\d+\.\d+)/);
        formatters.push({
          name: 'zprint',
          installed: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: await this.getCommandPath('zprint'),
        });
      }
    } catch (error) {
      // zprint not found
    }

    // Check for cljfmt (usually via lein)
    try {
      const leinResult = await runCommand('lein', ['cljfmt']);
      if (leinResult.success || leinResult.stderr?.includes('cljfmt')) {
        formatters.push({
          name: 'cljfmt',
          installed: true,
          version: 'unknown',
        });
      }
    } catch (error) {
      // cljfmt not available
    }

    return formatters;
  }

  /**
   * Detect test frameworks
   */
  async detectTestFrameworks() {
    const frameworks = ['clojure.test']; // Built-in

    // Check for kaocha
    try {
      const result = await runCommand('clojure', ['-M:test', '--version']);
      if (result.success || result.stdout?.includes('kaocha')) {
        frameworks.push('kaocha');
      }
    } catch (error) {
      // Try with lein
      try {
        const leinResult = await runCommand('lein', ['kaocha', '--version']);
        if (leinResult.success || leinResult.stdout?.includes('kaocha')) {
          frameworks.push('kaocha');
        }
      } catch (error2) {
        // kaocha not available
      }
    }

    // Check for midje
    try {
      const leinResult = await runCommand('lein', ['midje']);
      if (leinResult.success || leinResult.stderr?.includes('midje')) {
        frameworks.push('midje');
      }
    } catch (error) {
      // midje not available
    }

    // Check for expectations
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    try {
      if (fs.existsSync(depsEdnPath)) {
        const content = fs.readFileSync(depsEdnPath, 'utf8');
        if (content.includes('expectations') || content.includes('org.clojure-expectations')) {
          frameworks.push('expectations');
        }
      }

      if (fs.existsSync(projectCljPath)) {
        const content = fs.readFileSync(projectCljPath, 'utf8');
        if (content.includes('expectations') || content.includes('org.clojure-expectations')) {
          frameworks.push('expectations');
        }
      }
    } catch (error) {
      // Failed to read config files
    }

    return frameworks;
  }

  /**
   * Detect frameworks
   */
  async detectFrameworks() {
    const frameworks = [];

    // Check config files for framework indicators
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    try {
      // Check for web frameworks
      if (fs.existsSync(depsEdnPath)) {
        const content = fs.readFileSync(depsEdnPath, 'utf8');

        if (content.includes('luminus') || content.includes('luminus/')) {
          frameworks.push('luminus');
        }
        if (content.includes('pedestal') || content.includes('io.pedestal')) {
          frameworks.push('pedestal');
        }
        if (content.includes('compojure')) {
          frameworks.push('compojure');
        }
        if (content.includes('ring/ring')) {
          frameworks.push('ring');
        }
        if (content.includes('reitit') || content.includes('metosin/reitit')) {
          frameworks.push('reitit');
        }
        if (content.includes('fulcro')) {
          frameworks.push('fulcro');
        }
      }

      if (fs.existsSync(projectCljPath)) {
        const content = fs.readFileSync(projectCljPath, 'utf8');

        if (content.includes('luminus') || content.includes('[luminus')) {
          frameworks.push('luminus');
        }
        if (content.includes('pedestal') || content.includes('[io.pedestal')) {
          frameworks.push('pedestal');
        }
        if (content.includes('compojure')) {
          frameworks.push('compojure');
        }
        if (content.includes('ring') && content.includes('ring/ring')) {
          frameworks.push('ring');
        }
        if (content.includes('reitit') || content.includes('[metosin/reitit')) {
          frameworks.push('reitit');
        }
        if (content.includes('fulcro')) {
          frameworks.push('fulcro');
        }
      }
    } catch (error) {
      // Failed to read config files
    }

    return frameworks;
  }

  /**
   * Detect REPL configuration
   */
  async detectRepl() {
    const replInfo = {
      type: null,
      port: null,
      host: null,
      nrepl: false,
      socketRepl: false,
      prepl: false,
    };

    // Check for .nrepl-port file
    const nreplPortPath = path.join(this.projectPath, '.nrepl-port');
    if (fs.existsSync(nreplPortPath)) {
      try {
        const port = fs.readFileSync(nreplPortPath, 'utf8').trim();
        replInfo.type = 'nrepl';
        replInfo.nrepl = true;
        replInfo.port = parseInt(port, 10);
        replInfo.host = 'localhost';
      } catch (error) {
        // Failed to read .nrepl-port
      }
    }

    // Check for socket REPL in config
    const depsEdnPath = path.join(this.projectPath, 'deps.edn');
    const projectCljPath = path.join(this.projectPath, 'project.clj');

    try {
      if (fs.existsSync(depsEdnPath)) {
        const content = fs.readFileSync(depsEdnPath, 'utf8');
        if (content.includes(':jvm-opts') && content.includes('socket-repl')) {
          replInfo.socketRepl = true;
          if (!replInfo.type) replInfo.type = 'socket';
        }
        if (content.includes(':jvm-opts') && content.includes('prepl')) {
          replInfo.prepl = true;
          if (!replInfo.type) replInfo.type = 'prepl';
        }
      }

      if (fs.existsSync(projectCljPath)) {
        const content = fs.readFileSync(projectCljPath, 'utf8');
        if (content.includes(':jvm-opts') && content.includes('socket-repl')) {
          replInfo.socketRepl = true;
          if (!replInfo.type) replInfo.type = 'socket';
        }
        if (content.includes(':jvm-opts') && content.includes('prepl')) {
          replInfo.prepl = true;
          if (!replInfo.type) replInfo.type = 'prepl';
        }
      }
    } catch (error) {
      // Failed to read config files
    }

    return replInfo;
  }

  /**
   * Detect ClojureScript
   */
  async detectClojureScript() {
    const cljsInfo = {
      present: false,
      buildTool: null,
      configFile: null,
    };

    // Check for shadow-cljs
    const shadowCljsPath = path.join(this.projectPath, 'shadow-cljs.edn');
    if (fs.existsSync(shadowCljsPath)) {
      cljsInfo.present = true;
      cljsInfo.buildTool = 'shadow-cljs';
      cljsInfo.configFile = 'shadow-cljs.edn';
      return cljsInfo;
    }

    // Check for figwheel
    const figwheelPath = path.join(this.projectPath, 'figwheel-main.edn');
    if (fs.existsSync(figwheelPath)) {
      cljsInfo.present = true;
      cljsInfo.buildTool = 'figwheel-main';
      cljsInfo.configFile = 'figwheel-main.edn';
      return cljsInfo;
    }

    // Check for deps.cljs (Clojure CLI)
    const depsCljsPath = path.join(this.projectPath, 'deps.cljs');
    if (fs.existsSync(depsCljsPath)) {
      cljsInfo.present = true;
      cljsInfo.buildTool = 'clojure-cli';
      cljsInfo.configFile = 'deps.cljs';
      return cljsInfo;
    }

    // Check for lein-figwheel in project.clj
    const projectCljPath = path.join(this.projectPath, 'project.clj');
    if (fs.existsSync(projectCljPath)) {
      try {
        const content = fs.readFileSync(projectCljPath, 'utf8');
        if (content.includes('lein-figwheel') || content.includes('figwheel')) {
          cljsInfo.present = true;
          cljsInfo.buildTool = 'lein-figwheel';
          cljsInfo.configFile = 'project.clj';
        }
      } catch (error) {
        // Failed to read project.clj
      }
    }

    return cljsInfo;
  }

  /**
   * Get command path
   */
  async getCommandPath(command) {
    try {
      const result = await runCommand('which', [command]);
      if (result.success) {
        return result.stdout.trim();
      }
    } catch (error) {
      // Command not found
    }

    return null;
  }

  /**
   * Generate environment report
   */
  generateEnvironmentReport(tools) {
    const report = [];

    report.push('Clojure Environment Report');
    report.push('='.repeat(40));

    // Java info
    if (tools.java.installed) {
      report.push(`Java: ${tools.java.version}`);
    } else {
      report.push('Java: Not installed (REQUIRED)');
    }

    // Clojure tools info
    if (tools.clojure.installed) {
      report.push(`Clojure CLI: v${tools.clojure.version}`);
    }

    if (tools.leiningen.installed) {
      report.push(`Leiningen: v${tools.leiningen.version}`);
    }

    if (tools.boot.installed) {
      report.push(`Boot: v${tools.boot.version}`);
    }

    // Build system detection
    if (tools.buildSystem.length > 0) {
      const primarySystem = tools.buildSystem.find((sys) => sys.primary);
      if (primarySystem) {
        report.push(`\nBuild System: ${primarySystem.name} (${primarySystem.configFile})`);
      }
    }

    // Project info
    if (tools.project.name || tools.project.hasDepsEdn || tools.project.hasProjectClj) {
      report.push('\nProject Information:');
      if (tools.project.name) {
        report.push(`Name: ${tools.project.name}`);
      }
      if (tools.project.version) {
        report.push(`Version: ${tools.project.version}`);
      }
      if (tools.project.description) {
        report.push(`Description: ${tools.project.description}`);
      }

      report.push(`Type: ${this.getProjectTypeDescription(tools.project)}`);
      report.push(`Dependencies: ${tools.project.dependencies}`);
      report.push(`Dev Dependencies: ${tools.project.devDependencies}`);

      if (tools.project.aliases.length > 0) {
        report.push(`Aliases: ${tools.project.aliases.join(', ')}`);
      }
    }

    // Frameworks
    if (tools.frameworks.length > 0) {
      report.push(`\nFrameworks: ${tools.frameworks.join(', ')}`);
    }

    // Linters
    if (tools.linters.length > 0) {
      const linterNames = tools.linters.map((l) => l.name).join(', ');
      report.push(`Linters: ${linterNames}`);
    }

    // Formatters
    if (tools.formatters.length > 0) {
      const formatterNames = tools.formatters.map((f) => f.name).join(', ');
      report.push(`Formatters: ${formatterNames}`);
    }

    // Test frameworks
    if (tools.testFrameworks.length > 0) {
      report.push(`Test Frameworks: ${tools.testFrameworks.join(', ')}`);
    }

    // REPL info
    if (tools.repl.type) {
      report.push(`\nREPL: ${tools.repl.type}`);
      if (tools.repl.port) {
        report.push(`Port: ${tools.repl.port}`);
      }
    }

    // ClojureScript
    if (tools.clojurescript.present) {
      report.push(`\nClojureScript: Yes (${tools.clojurescript.buildTool})`);
    }

    return report.join('\n');
  }

  /**
   * Get project type description
   */
  getProjectTypeDescription(project) {
    const types = [];
    if (project.isLibrary) types.push('Library');
    if (project.isApplication) types.push('Application');
    if (project.isFullStack) types.push('Full-stack');
    if (project.hasClojureScript) types.push('ClojureScript');

    return types.length > 0 ? types.join(' + ') : 'Unknown';
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
        description: 'Java Runtime Environment (JRE)',
        command: 'Install Java 8 or higher from https://adoptium.net/',
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

module.exports = ClojureToolDetector;
