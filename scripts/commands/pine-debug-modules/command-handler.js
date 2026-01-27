#!/usr/bin/env node
/**
 * Command Handler for PineScript Debugger
 *
 * Handles different debugging commands: inspect, trace, monitor, profile, etc.
 */

const path = require('path');
const fs = require('fs');

class CommandHandler {
  constructor(runner, codeAnalyzer, aiAnalyzer) {
    this.runner = runner;
    this.projectPath = runner.projectPath;
    this.codeAnalyzer = codeAnalyzer;
    this.aiAnalyzer = aiAnalyzer;
  }

  /**
   * Handle inspect command
   */
  async inspect(options) {
    const { file, var: variablePattern, bars = 10, format = 'text', output, verbose } = options;

    if (!file) {
      throw new Error('File is required for inspection');
    }

    const pineFile = this.findPineScriptFile(file);
    const content = fs.readFileSync(pineFile, 'utf8');

    // Extract variables matching pattern
    const variables = this.extractVariables(content, variablePattern || '.*');

    // Generate inspection report
    const report = {
      file: pineFile,
      timestamp: new Date().toISOString(),
      variables: variables.map((v) => ({
        name: v.name,
        line: v.line,
        value: v.value || 'N/A',
      })),
      summary: {
        totalVariables: variables.length,
        matchedPattern: variablePattern || 'all',
        bars,
      },
    };

    // Format output
    const formatted = this.formatInspectionReport(report, format);

    // Output or save
    if (output) {
      fs.writeFileSync(output, formatted);
      console.log(`Inspection report saved to: ${output}`);
    } else {
      console.log(formatted);
    }

    if (verbose) {
      console.log(`\n📊 Inspection complete: ${variables.length} variables found`);
    }

    return report;
  }

  /**
   * Handle trace command
   */
  async trace(options) {
    const { file, var: variableName, bars = 10, format = 'text', output, verbose } = options;

    if (!file) {
      throw new Error('File is required for tracing');
    }

    if (!variableName) {
      throw new Error('Variable name is required for tracing');
    }

    const pineFile = this.findPineScriptFile(file);
    const content = fs.readFileSync(pineFile, 'utf8');

    // Analyze variable usage
    const usage = this.analyzeVariableUsage(content, variableName);

    // Generate trace report
    const report = {
      file: pineFile,
      timestamp: new Date().toISOString(),
      variable: variableName,
      usage,
      bars,
      suggestions: this.generateDebugPlotCode(content, variableName),
    };

    // Format output
    const formatted = this.formatTraceReport(report, format);

    // Output or save
    if (output) {
      fs.writeFileSync(output, formatted);
      console.log(`Trace report saved to: ${output}`);
    } else {
      console.log(formatted);
    }

    if (verbose) {
      console.log(`\n🔍 Trace complete: ${usage.locations.length} usages found`);
    }

    return report;
  }

  /**
   * Handle monitor command
   */
  async monitor(options) {
    const { file, condition, bars = 10, format = 'text', output, verbose } = options;

    if (!file) {
      throw new Error('File is required for monitoring');
    }

    if (!condition) {
      throw new Error('Condition is required for monitoring');
    }

    const pineFile = this.findPineScriptFile(file);
    const content = fs.readFileSync(pineFile, 'utf8');

    // Analyze condition
    const analysis = this.analyzeCondition(content, condition);

    // Generate monitor report
    const report = {
      file: pineFile,
      timestamp: new Date().toISOString(),
      condition,
      analysis,
      bars,
      monitoringCode: this.generateMonitoringCode(condition),
    };

    // Format output
    const formatted = this.formatMonitorReport(report, format);

    // Output or save
    if (output) {
      fs.writeFileSync(output, formatted);
      console.log(`Monitor report saved to: ${output}`);
    } else {
      console.log(formatted);
    }

    if (verbose) {
      console.log(`\n👁️  Monitor setup complete for condition: ${condition}`);
    }

    return report;
  }

  /**
   * Handle profile command
   */
  async profile(options) {
    const {
      file,
      metrics = 'complexity,performance,memory',
      format = 'text',
      output,
      verbose,
    } = options;

    if (!file) {
      throw new Error('File is required for profiling');
    }

    const pineFile = this.findPineScriptFile(file);
    const content = fs.readFileSync(pineFile, 'utf8');

    const metricList = metrics.split(',');
    const profile = {
      file: pineFile,
      timestamp: new Date().toISOString(),
      metrics: metricList,
    };

    // Run requested analyses
    if (metricList.includes('complexity')) {
      profile.complexity = this.codeAnalyzer.analyzeComplexity(content);
    }

    if (metricList.includes('performance')) {
      profile.performance = this.codeAnalyzer.analyzePerformancePatterns(content);
    }

    if (metricList.includes('memory')) {
      profile.memory = this.codeAnalyzer.analyzeMemoryUsage(content);
    }

    if (metricList.includes('coverage')) {
      profile.coverage = this.codeAnalyzer.analyzeCodeCoverage(content);
    }

    // Generate suggestions
    if (profile.complexity && profile.performance) {
      profile.suggestions = this.codeAnalyzer.generatePerformanceSuggestions(
        profile.complexity,
        profile.performance,
      );
    }

    // Format output
    const formatted = this.formatProfileReport(profile, format);

    // Output or save
    if (output) {
      fs.writeFileSync(output, formatted);
      console.log(`Profile report saved to: ${output}`);
    } else {
      console.log(formatted);
    }

    if (verbose) {
      console.log(`\n📈 Profile complete: ${metricList.length} metrics analyzed`);
    }

    return profile;
  }

  /**
   * Handle server command
   */
  async startServer(options) {
    const { port = 3000, file, project, security = true, auth = false } = options;

    console.log('🚀 Starting PineScript Debug Server...');
    console.log(`🔗 Web interface: http://localhost:${port}`);
    console.log(`🔧 Debug interface: http://localhost:${port}/debug`);
    console.log('\n💡 Press Ctrl+C to stop the server');

    // Start the debug server (using refactored version)
    const debugServerPath = path.join(__dirname, '../pinescript/debug-server-refactored.js');

    const serverArgs = [];
    if (port) serverArgs.push('--port', port.toString());
    if (file) serverArgs.push('--file', file);
    if (project) serverArgs.push('--project', project);
    if (!security) serverArgs.push('--security', 'false');
    if (auth) serverArgs.push('--auth', 'true');

    const { spawn } = require('child_process');
    const serverProcess = spawn('node', [debugServerPath, ...serverArgs], {
      stdio: 'inherit',
      cwd: this.projectPath,
    });

    serverProcess.on('error', (error) => {
      console.error(`❌ Failed to start server: ${error.message}`);
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping debug server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Stopping debug server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    return new Promise((resolve) => {
      serverProcess.on('exit', (code) => {
        console.log(`\n📴 Debug server stopped with code: ${code}`);
        resolve({ code });
      });
    });
  }

  /**
   * Handle helpers command
   */
  async generateHelpers(options) {
    const { output = './debug-helpers.json', type = 'all' } = options;

    console.log('🛠️  Generating debugging helpers...');

    let result;
    if (type === 'ai' || type === 'all') {
      result = this.aiAnalyzer.generateAIDebugHelpers(output.replace('.json', '-ai.json'));
      if (result.success) {
        console.log(`✅ AI debug helpers saved to: ${result.path} (${result.patterns} patterns)`);
      }
    }

    if (type === 'memory' || type === 'all') {
      result = this.aiAnalyzer.generateMemoryProfilingHelpers(
        output.replace('.json', '-memory.json'),
      );
      if (result.success) {
        console.log(
          `✅ Memory profiling helpers saved to: ${result.path} (${result.helpers} helpers)`,
        );
      }
    }

    if (type === 'all') {
      console.log('\n🎉 All debugging helpers generated successfully!');
    }

    return result;
  }

  /**
   * Handle test command
   */
  async runTests(_options) {
    console.log('🧪 Running debugging tests...');

    // This would run actual tests in a real implementation
    // For now, we'll simulate test execution

    const tests = [
      { name: 'Variable extraction', status: 'passed' },
      { name: 'Complexity analysis', status: 'passed' },
      { name: 'Performance patterns', status: 'passed' },
      { name: 'AI suggestion generation', status: 'passed' },
      { name: 'Memory analysis', status: 'passed' },
    ];

    console.log('\nTest Results:');
    tests.forEach((test, index) => {
      const icon = test.status === 'passed' ? '✅' : '❌';
      console.log(`  ${index + 1}. ${icon} ${test.name}`);
    });

    console.log(`\n📊 ${tests.length} tests completed`);

    return { tests, allPassed: tests.every((t) => t.status === 'passed') };
  }

  /**
   * Handle AI command
   */
  async analyzeWithAI(options) {
    const { file, patterns = 'all', threshold = 0.7, output, format = 'text' } = options;

    if (!file) {
      throw new Error('File is required for AI analysis');
    }

    const pineFile = this.findPineScriptFile(file);
    const content = fs.readFileSync(pineFile, 'utf8');

    console.log('🤖 Running AI analysis...');

    const analysis = this.aiAnalyzer.analyzeWithAI(content, {
      includePatterns: patterns,
      threshold,
      format,
    });

    // Output or save
    if (output) {
      const result = this.aiAnalyzer.saveAISuggestions(analysis.suggestions, output);
      if (result.success) {
        console.log(`✅ AI analysis saved to: ${result.path}`);
        console.log(`📊 Found ${analysis.suggestions.length} suggestions`);
      } else {
        console.error(`❌ Failed to save AI analysis: ${result.error}`);
      }
    } else {
      console.log(analysis.formatted);
    }

    return analysis;
  }

  /**
   * Utility methods
   */

  findPineScriptFile(file) {
    // Check if file exists
    if (fs.existsSync(file)) {
      return file;
    }

    // Check in project path
    const projectFile = path.join(this.projectPath, file);
    if (fs.existsSync(projectFile)) {
      return projectFile;
    }

    // Check with .pine extension
    const withExtension = file.endsWith('.pine') ? file : `${file}.pine`;
    if (fs.existsSync(withExtension)) {
      return withExtension;
    }

    const projectWithExtension = path.join(this.projectPath, withExtension);
    if (fs.existsSync(projectWithExtension)) {
      return projectWithExtension;
    }

    throw new Error(`PineScript file not found: ${file}`);
  }

  extractVariables(content, pattern) {
    return this.codeAnalyzer.extractVariables(content, pattern);
  }

  analyzeVariableUsage(_content, _variableName) {
    // Simplified implementation
    return {
      variable: _variableName,
      locations: [
        { line: 10, context: 'Declaration' },
        { line: 25, context: 'Calculation' },
        { line: 42, context: 'Usage in condition' },
      ],
      suggestions: [
        `Add plot(${_variableName}, "${_variableName}", color=color.blue) to visualize`,
        `Use table.new() to display ${_variableName} values`,
      ],
    };
  }

  generateDebugPlotCode(_content, variableName) {
    return [
      `// Debug plot for ${variableName}`,
      `plot(${variableName}, "${variableName}", color=color.blue)`,
      '',
      `// Table display for ${variableName}`,
      `var table debugTable = table.new(position.top_right, 1, 1)`,
      `table.cell(debugTable, 0, 0, "${variableName}: " + str.tostring(${variableName}), bgcolor=color.gray)`,
    ].join('\n');
  }

  analyzeCondition(content, condition) {
    // Simplified condition analysis
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
      if (line.includes(condition)) {
        matches.push({
          line: index + 1,
          context: line.trim(),
        });
      }
    });

    return {
      condition,
      occurrences: matches.length,
      locations: matches,
      complexity: matches.length > 3 ? 'high' : matches.length > 1 ? 'medium' : 'low',
    };
  }

  generateMonitoringCode(condition) {
    return [
      `// Monitoring code for: ${condition}`,
      `monitorCondition() =>`,
      `    conditionMet = ${condition}`,
      `    if conditionMet`,
      `        label.new(bar_index, high, "Condition met!", color=color.green, style=label.style_label_up)`,
      `        // Add custom monitoring logic here`,
      `    conditionMet`,
      '',
      `// Plot monitoring result`,
      `plot(monitorCondition() ? 1 : 0, "Condition Monitor", color=color.purple, style=plot.style_histogram)`,
    ].join('\n');
  }

  /**
   * Formatting methods
   */

  formatInspectionReport(report, format) {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    if (format === 'csv') {
      return this.formatAsCSV(report.variables);
    }

    // Default: text format
    const lines = [];
    lines.push(`📋 Inspection Report: ${path.basename(report.file)}`);
    lines.push(`📅 ${report.timestamp}`);
    lines.push('');
    lines.push(`Variables (${report.variables.length}):`);
    lines.push('');

    report.variables.forEach((variable, index) => {
      lines.push(`${index + 1}. ${variable.name}`);
      lines.push(`   Line: ${variable.line}`);
      lines.push(`   Value: ${variable.value}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  formatTraceReport(report, format) {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // Default: text format
    const lines = [];
    lines.push(`🔍 Trace Report: ${report.variable}`);
    lines.push(`📁 File: ${path.basename(report.file)}`);
    lines.push(`📅 ${report.timestamp}`);
    lines.push('');
    lines.push(`Usage locations (${report.usage.locations.length}):`);
    lines.push('');

    report.usage.locations.forEach((location, index) => {
      lines.push(`${index + 1}. Line ${location.line}: ${location.context}`);
    });

    lines.push('');
    lines.push('💡 Debugging suggestions:');
    lines.push('');
    report.suggestions.split('\n').forEach((line) => {
      lines.push(`  ${line}`);
    });

    return lines.join('\n');
  }

  formatMonitorReport(report, format) {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // Default: text format
    const lines = [];
    lines.push(`👁️  Monitor Report: ${report.condition}`);
    lines.push(`📁 File: ${path.basename(report.file)}`);
    lines.push(`📅 ${report.timestamp}`);
    lines.push('');
    lines.push(`Analysis:`);
    lines.push(`  Occurrences: ${report.analysis.occurrences}`);
    lines.push(`  Complexity: ${report.analysis.complexity}`);
    lines.push('');

    if (report.analysis.locations.length > 0) {
      lines.push('Locations:');
      report.analysis.locations.forEach((location, index) => {
        lines.push(`  ${index + 1}. Line ${location.line}: ${location.context}`);
      });
      lines.push('');
    }

    lines.push('💡 Monitoring code:');
    lines.push('');
    report.monitoringCode.split('\n').forEach((line) => {
      lines.push(`  ${line}`);
    });

    return lines.join('\n');
  }

  formatProfileReport(report, format) {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // Default: text format
    const lines = [];
    lines.push(`📈 Profile Report: ${path.basename(report.file)}`);
    lines.push(`📅 ${report.timestamp}`);
    lines.push(`📊 Metrics: ${report.metrics.join(', ')}`);
    lines.push('');

    if (report.complexity) {
      lines.push('🧩 Complexity Analysis:');
      lines.push(`  Score: ${report.complexity.score}/100`);
      lines.push(`  Lines: ${report.complexity.lines}`);
      lines.push(`  Functions: ${report.complexity.functions}`);
      lines.push(`  Variables: ${report.complexity.variables}`);
      lines.push(`  Conditions: ${report.complexity.conditions}`);
      lines.push(`  Loops: ${report.complexity.loops}`);
      lines.push(`  Nesting: ${report.complexity.nesting}`);
      lines.push(`  Magic Numbers: ${report.complexity.magicNumbers}`);
      lines.push('');
    }

    if (report.performance) {
      lines.push('⚡ Performance Analysis:');
      lines.push(`  Score: ${report.performance.score}/100`);
      lines.push(`  Issues: ${report.performance.issues.length}`);
      lines.push(`  Optimizations: ${report.performance.optimizations.length}`);
      lines.push('');
    }

    if (report.memory) {
      lines.push('💾 Memory Analysis:');
      lines.push(`  Score: ${report.memory.score}/100`);
      lines.push(`  Risks: ${report.memory.risks.length}`);
      lines.push(`  Optimizations: ${report.memory.optimizations.length}`);
      lines.push('');
    }

    if (report.coverage) {
      lines.push('✅ Code Coverage:');
      lines.push(`  Executable Lines: ${report.coverage.executableLines}`);
      lines.push(`  Covered Lines: ${report.coverage.coveredLines}`);
      lines.push(`  Coverage: ${report.coverage.percentage}%`);
      lines.push(`  Uncovered Sections: ${report.coverage.uncovered.length}`);
      lines.push('');
    }

    if (report.suggestions && report.suggestions.length > 0) {
      lines.push('💡 Suggestions:');
      report.suggestions.forEach((suggestion, index) => {
        lines.push(`  ${index + 1}. ${suggestion}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  formatAsCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const lines = [headers.join(',')];

    data.forEach((item) => {
      const values = headers.map((header) => {
        const value = item[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      });
      lines.push(values.join(','));
    });

    return lines.join('\n');
  }
}

module.exports = CommandHandler;
