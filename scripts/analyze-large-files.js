#!/usr/bin/env node

/**
 * Analyze Large Files
 *
 * Identifies large files (>1000 lines) and suggests refactoring opportunities.
 * Helps with Phase 1 improvements for codebase maintainability.
 */

const fs = require('fs');
const path = require('path');

class FileAnalyzer {
  constructor() {
    this.results = [];
  }

  /**
   * Analyze a file for refactoring opportunities
   */
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const lineCount = lines.length;

    if (lineCount < 1000) {
      return null;
    }

    const analysis = {
      filePath,
      lineCount,
      issues: [],
      suggestions: [],
      metrics: this.calculateMetrics(content, lines),
    };

    this.detectIssues(analysis, content, lines);
    this.generateSuggestions(analysis);

    return analysis;
  }

  /**
   * Calculate file metrics
   */
  calculateMetrics(content, lines) {
    // Count imports/requires
    const imports = lines.filter(
      (line) => line.includes('require(') || line.includes('import ') || line.includes('from '),
    ).length;

    // Count functions/methods
    const functions = lines.filter(
      (line) =>
        line.match(/^\s*(async\s+)?function\s+\w+/) ||
        line.match(/^\s*\w+\s*\([^)]*\)\s*\{/) ||
        line.match(/^\s*(public|private|protected)?\s*\w+\s+\w+\([^)]*\)/),
    ).length;

    // Count classes
    const classes = lines.filter((line) => line.includes('class ') && line.includes('{')).length;

    // Average line length
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;

    // Comment ratio
    const commentLines = lines.filter(
      (line) => line.trim().startsWith('//') || line.includes('/*') || line.includes('* '),
    ).length;
    const commentRatio = commentLines / lines.length;

    return {
      imports,
      functions,
      classes,
      avgLineLength: Math.round(avgLineLength),
      commentRatio: Math.round(commentRatio * 100),
    };
  }

  /**
   * Detect common issues in large files
   */
  detectIssues(analysis, content, _lines) {
    const { lineCount, metrics } = analysis;

    // Issue: Too many lines
    if (lineCount > 1500) {
      analysis.issues.push({
        type: 'SIZE',
        severity: 'HIGH',
        description: `File is very large (${lineCount} lines)`,
        recommendation: 'Consider splitting into multiple modules',
      });
    } else if (lineCount > 1000) {
      analysis.issues.push({
        type: 'SIZE',
        severity: 'MEDIUM',
        description: `File is large (${lineCount} lines)`,
        recommendation: 'Review for refactoring opportunities',
      });
    }

    // Issue: Too many functions
    if (metrics.functions > 50) {
      analysis.issues.push({
        type: 'FUNCTION_COUNT',
        severity: 'HIGH',
        description: `High function count (${metrics.functions} functions)`,
        recommendation: 'Extract related functions into separate modules',
      });
    } else if (metrics.functions > 30) {
      analysis.issues.push({
        type: 'FUNCTION_COUNT',
        severity: 'MEDIUM',
        description: `Moderate function count (${metrics.functions} functions)`,
        recommendation: 'Consider grouping related functions',
      });
    }

    // Issue: Low comment ratio
    if (metrics.commentRatio < 10) {
      analysis.issues.push({
        type: 'DOCUMENTATION',
        severity: 'MEDIUM',
        description: `Low comment ratio (${metrics.commentRatio}%)`,
        recommendation: 'Add more comments for complex logic',
      });
    }

    // Issue: Long average line length
    if (metrics.avgLineLength > 120) {
      analysis.issues.push({
        type: 'READABILITY',
        severity: 'MEDIUM',
        description: `Long average line length (${metrics.avgLineLength} chars)`,
        recommendation: 'Break long lines for better readability',
      });
    }

    // Detect God Class (too many responsibilities)
    if (metrics.classes === 1 && metrics.functions > 20) {
      analysis.issues.push({
        type: 'GOD_CLASS',
        severity: 'HIGH',
        description: 'Single class with many methods (potential God Class)',
        recommendation: 'Split class responsibilities into multiple classes',
      });
    }

    // Detect complex conditional logic
    const complexConditionals = this.detectComplexConditionals(content);
    if (complexConditionals > 5) {
      analysis.issues.push({
        type: 'COMPLEXITY',
        severity: 'MEDIUM',
        description: `Multiple complex conditionals (${complexConditionals} found)`,
        recommendation: 'Extract complex conditions into helper functions',
      });
    }

    // Detect long functions
    const longFunctions = this.detectLongFunctions(content);
    if (longFunctions.length > 0) {
      analysis.issues.push({
        type: 'LONG_FUNCTION',
        severity: 'HIGH',
        description: `${longFunctions.length} functions exceed 50 lines`,
        recommendation: 'Extract logic from long functions',
        details: longFunctions.map((f) => `${f.name}: ${f.lines} lines`),
      });
    }

    // Detect duplicate code patterns
    const duplicates = this.detectDuplicatePatterns(content);
    if (duplicates.length > 0) {
      analysis.issues.push({
        type: 'DUPLICATION',
        severity: 'MEDIUM',
        description: `${duplicates.length} duplicate code patterns detected`,
        recommendation: 'Extract duplicates into reusable functions',
      });
    }
  }

  /**
   * Detect complex conditional statements
   */
  detectComplexConditionals(content) {
    // Look for nested conditionals or long conditional expressions
    const conditionalPatterns = [
      /if\s*\([^)]{100,}\)/g, // Long condition
      /else\s+if/g, // Multiple else if
      /&&.{3,}&&/g, // Multiple AND conditions
      /\|\|.{3,}\|\|/g, // Multiple OR conditions
    ];

    let count = 0;
    conditionalPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  /**
   * Detect functions longer than 50 lines
   */
  detectLongFunctions(content) {
    const longFunctions = [];
    const lines = content.split('\n');

    let inFunction = false;
    let functionStart = 0;
    let functionName = '';
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect function start
      if (
        !inFunction &&
        line.match(
          /^\s*(async\s+)?(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>|class\s+\w+)/,
        )
      ) {
        inFunction = true;
        functionStart = i;
        functionName = this.extractFunctionName(line);
        braceCount = 0;
      }

      // Count braces
      if (inFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // Function ended
        if (braceCount === 0 && line.includes('}')) {
          const functionLength = i - functionStart + 1;
          if (functionLength > 50) {
            longFunctions.push({
              name: functionName,
              lines: functionLength,
              startLine: functionStart + 1,
              endLine: i + 1,
            });
          }
          inFunction = false;
        }
      }
    }

    return longFunctions;
  }

  /**
   * Extract function name from line
   */
  extractFunctionName(line) {
    // Match function declarations
    const functionMatch = line.match(/function\s+(\w+)/);
    if (functionMatch) return functionMatch[1];

    // Match arrow functions
    const arrowMatch = line.match(/const\s+(\w+)\s*=/);
    if (arrowMatch) return arrowMatch[1];

    // Match class declarations
    const classMatch = line.match(/class\s+(\w+)/);
    if (classMatch) return classMatch[1];

    return 'anonymous';
  }

  /**
   * Detect duplicate code patterns
   */
  detectDuplicatePatterns(content) {
    // Simple pattern detection for common duplicates
    const patterns = [
      // Repeated console.log patterns
      /console\.(log|error|warn|info)\([^)]+\)/g,
      // Repeated error handling patterns
      /catch\s*\([^)]+\)\s*{[^}]+}/g,
      // Repeated validation patterns
      /if\s*\(![^)]+\)\s*{[^}]+}/g,
    ];

    const duplicates = [];
    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 3) {
        duplicates.push({
          pattern: pattern.toString(),
          count: matches.length,
          example: `${matches[0].substring(0, 50)}...`,
        });
      }
    });

    return duplicates;
  }

  /**
   * Generate refactoring suggestions
   */
  generateSuggestions(analysis) {
    const { issues, metrics } = analysis;

    // General suggestions based on metrics
    if (metrics.functions > 20) {
      analysis.suggestions.push({
        type: 'MODULARIZATION',
        description: 'Extract related functions into separate modules',
        priority: 'HIGH',
        effort: 'MEDIUM',
      });
    }

    if (metrics.imports > 20) {
      analysis.suggestions.push({
        type: 'DEPENDENCY_MANAGEMENT',
        description: 'Review and organize imports',
        priority: 'MEDIUM',
        effort: 'LOW',
      });
    }

    if (metrics.commentRatio < 15) {
      analysis.suggestions.push({
        type: 'DOCUMENTATION',
        description: 'Add JSDoc comments to public functions',
        priority: 'MEDIUM',
        effort: 'LOW',
      });
    }

    // Specific suggestions based on issues
    issues.forEach((issue) => {
      switch (issue.type) {
        case 'LONG_FUNCTION':
          analysis.suggestions.push({
            type: 'FUNCTION_EXTRACTION',
            description: 'Extract logic from long functions into helper functions',
            priority: 'HIGH',
            effort: 'MEDIUM',
          });
          break;

        case 'GOD_CLASS':
          analysis.suggestions.push({
            type: 'CLASS_DECOMPOSITION',
            description: 'Split class into focused, single-responsibility classes',
            priority: 'HIGH',
            effort: 'HIGH',
          });
          break;

        case 'DUPLICATION':
          analysis.suggestions.push({
            type: 'CODE_REUSE',
            description: 'Create utility functions for duplicated patterns',
            priority: 'MEDIUM',
            effort: 'MEDIUM',
          });
          break;

        case 'COMPLEXITY':
          analysis.suggestions.push({
            type: 'SIMPLIFICATION',
            description: 'Simplify complex conditional logic',
            priority: 'MEDIUM',
            effort: 'MEDIUM',
          });
          break;
      }
    });

    // Always suggest testing for large files
    analysis.suggestions.push({
      type: 'TESTING',
      description: 'Ensure adequate test coverage for refactored code',
      priority: 'HIGH',
      effort: 'HIGH',
    });
  }

  /**
   * Generate report
   */
  generateReport(analyses) {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: analyses.length,
      summary: {
        highPriority: analyses.filter((a) => a.issues.some((i) => i.severity === 'HIGH')).length,
        mediumPriority: analyses.filter((a) => a.issues.some((i) => i.severity === 'MEDIUM'))
          .length,
        totalIssues: analyses.reduce((sum, a) => sum + a.issues.length, 0),
        totalSuggestions: analyses.reduce((sum, a) => sum + a.suggestions.length, 0),
      },
      files: analyses.map((analysis) => ({
        file: path.relative(process.cwd(), analysis.filePath),
        lines: analysis.lineCount,
        issues: analysis.issues.length,
        suggestions: analysis.suggestions.length,
        metrics: analysis.metrics,
        priority: analysis.issues.some((i) => i.severity === 'HIGH')
          ? 'HIGH'
          : analysis.issues.some((i) => i.severity === 'MEDIUM')
            ? 'MEDIUM'
            : 'LOW',
      })),
      recommendations: this.generateOverallRecommendations(analyses),
    };

    return report;
  }

  /**
   * Generate overall recommendations
   */
  generateOverallRecommendations(analyses) {
    const recommendations = [];

    // Count issue types
    const issueCounts = {};
    analyses.forEach((analysis) => {
      analysis.issues.forEach((issue) => {
        issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
      });
    });

    // Generate recommendations based on common issues
    if (issueCounts['SIZE'] > 0) {
      recommendations.push({
        type: 'ARCHITECTURE',
        description: 'Consider architectural changes to reduce file sizes',
        files: analyses.filter((a) => a.issues.some((i) => i.type === 'SIZE')).length,
        priority: 'HIGH',
      });
    }

    if (issueCounts['LONG_FUNCTION'] > 0) {
      recommendations.push({
        type: 'REFACTORING',
        description: 'Focus on extracting logic from long functions',
        files: analyses.filter((a) => a.issues.some((i) => i.type === 'LONG_FUNCTION')).length,
        priority: 'HIGH',
      });
    }

    if (issueCounts['DUPLICATION'] > 0) {
      recommendations.push({
        type: 'CODE_QUALITY',
        description: 'Address code duplication to improve maintainability',
        files: analyses.filter((a) => a.issues.some((i) => i.type === 'DUPLICATION')).length,
        priority: 'MEDIUM',
      });
    }

    return recommendations;
  }

  /**
   * Print report to console
   */
  printReport(report) {
    console.log('='.repeat(80));
    console.log('LARGE FILE ANALYSIS REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${report.timestamp}`);
    console.log(`Files analyzed: ${report.totalFiles}`);
    console.log(`Total issues: ${report.summary.totalIssues}`);
    console.log(`High priority files: ${report.summary.highPriority}`);
    console.log();

    console.log('FILE ANALYSIS:');
    console.log('-'.repeat(80));
    report.files.forEach((file) => {
      console.log(`📁 ${file.file}`);
      console.log(`   Lines: ${file.lines}, Issues: ${file.issues}, Priority: ${file.priority}`);
      console.log(
        `   Metrics: ${file.metrics.functions} functions, ${file.metrics.imports} imports, ${file.metrics.commentRatio}% comments`,
      );
      console.log();
    });

    console.log('OVERALL RECOMMENDATIONS:');
    console.log('-'.repeat(80));
    report.recommendations.forEach((rec) => {
      console.log(`🔸 ${rec.type}: ${rec.description}`);
      console.log(`   Priority: ${rec.priority}, Affected files: ${rec.files}`);
      console.log();
    });

    console.log('NEXT STEPS:');
    console.log('-'.repeat(80));
    console.log('1. Review high priority files first');
    console.log('2. Create refactoring plan for each file');
    console.log('3. Ensure tests pass after refactoring');
    console.log('4. Update documentation as needed');
    console.log('='.repeat(80));
  }
}

/**
 * Main function
 */
async function main() {
  const analyzer = new FileAnalyzer();
  const analyses = [];

  // Find JavaScript files in scripts directory
  const scriptsDir = path.join(__dirname, '..', 'scripts');
  const files = await findJsFiles(scriptsDir);

  console.log(`Analyzing ${files.length} JavaScript files...`);

  // Analyze each file
  for (const file of files) {
    const analysis = analyzer.analyzeFile(file);
    if (analysis) {
      analyses.push(analysis);
    }
  }

  // Generate and print report
  if (analyses.length > 0) {
    const report = analyzer.generateReport(analyses);
    analyzer.printReport(report);

    // Save report to file
    const reportFile = path.join(__dirname, '..', 'large-file-analysis.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📊 Detailed report saved to: ${reportFile}`);
  } else {
    console.log('✅ No files over 1000 lines found.');
  }
}

/**
 * Find JavaScript files recursively
 */
async function findJsFiles(dir) {
  const files = [];

  function walk(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!item.name.startsWith('.') && item.name !== 'node_modules') {
          walk(fullPath);
        }
      } else if (item.isFile() && item.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Run analysis
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FileAnalyzer };
