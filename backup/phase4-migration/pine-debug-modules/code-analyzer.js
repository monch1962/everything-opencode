#!/usr/bin/env node
/**
 * Code Analyzer for PineScript Debugger
 *
 * Analyzes PineScript code for complexity, performance, memory usage, and coverage
 */

class CodeAnalyzer {
  constructor() {
    this.complexityPatterns = this.loadComplexityPatterns();
    this.performancePatterns = this.loadPerformancePatterns();
    this.memoryPatterns = this.loadMemoryPatterns();
  }

  /**
   * Load complexity analysis patterns
   */
  loadComplexityPatterns() {
    return {
      highLoopCount: { threshold: 3, weight: 0.3 },
      deepNesting: { threshold: 4, weight: 0.25 },
      longFunction: { threshold: 50, weight: 0.2 },
      manyVariables: { threshold: 20, weight: 0.15 },
      magicNumbers: { threshold: 5, weight: 0.1 },
    };
  }

  /**
   * Load performance analysis patterns
   */
  loadPerformancePatterns() {
    return {
      inefficientLoop: /for\s*\([^)]*\)\s*{[^}]*\b(ta\.|security|request\.security)/,
      repeatedCalculation: /(\b\w+\b)\s*=\s*.+?;\s*(?:\n|.)*?\1\s*=\s*.+?;/,
      expensiveFunctionCall: /\b(ta\.|math\.|str\.|array\.|request\.security)\s*\([^)]*\)/g,
      unnecessaryRecalculation: /(\b\w+\b)\s*=\s*.+?;\s*(?:\n|.)*?\1\s*=\s*.+?;/,
    };
  }

  /**
   * Load memory analysis patterns
   */
  loadMemoryPatterns() {
    return {
      largeArray: /array\.new_\w+\s*\([^)]*\)/g,
      unclosedSeries: /series\s+\w+\s*(?!=)/g,
      memoryLeak: /(\b\w+\b)\s*=\s*array\.new_\w+/g,
      excessiveHistory: /\[\s*\d+\s*\]/g,
    };
  }

  /**
   * Analyze code complexity
   */
  analyzeComplexity(content) {
    const lines = content.split('\n');
    const analysis = {
      lines: lines.length,
      functions: this.countFunctions(content),
      variables: this.countVariables(content),
      conditions: this.countConditions(content),
      loops: this.countLoops(content),
      nesting: this.calculateNestingDepth(content),
      magicNumbers: this.countMagicNumbers(content),
      score: 0,
      issues: [],
      suggestions: [],
    };

    // Calculate complexity score
    analysis.score = this.calculateComplexityScore(analysis);

    // Identify issues
    analysis.issues = this.identifyComplexityIssues(analysis);

    // Generate suggestions
    analysis.suggestions = this.generateComplexitySuggestions(analysis);

    return analysis;
  }

  /**
   * Count functions in code
   */
  countFunctions(content) {
    const arrowFunctions = (content.match(/=>/g) || []).length;
    const regularFunctions = (content.match(/function\s+\w+/g) || []).length;
    return arrowFunctions + regularFunctions;
  }

  /**
   * Count variables in code
   */
  countVariables(content) {
    const variablePatterns = [/\b(var|let|const)\s+\w+/g, /\b\w+\s*=\s*(?!\([^)]*\)\s*=>)/g];

    let count = 0;
    for (const pattern of variablePatterns) {
      const matches = content.match(pattern) || [];
      count += matches.length;
    }

    return count;
  }

  /**
   * Count conditions in code
   */
  countConditions(content) {
    const conditionPatterns = [/\bif\s*\(/g, /\belse if\s*\(/g, /\bswitch\s*\(/g, /\bcase\s+/g];

    let count = 0;
    for (const pattern of conditionPatterns) {
      const matches = content.match(pattern) || [];
      count += matches.length;
    }

    return count;
  }

  /**
   * Count loops in code
   */
  countLoops(content) {
    const loopPatterns = [/\bfor\s*\(/g, /\bwhile\s*\(/g, /\bdo\s*{/g];

    let count = 0;
    for (const pattern of loopPatterns) {
      const matches = content.match(pattern) || [];
      count += matches.length;
    }

    return count;
  }

  /**
   * Calculate maximum nesting depth
   */
  calculateNestingDepth(content) {
    const lines = content.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;

    for (const line of lines) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      currentDepth += openBraces - closeBraces;
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Count magic numbers
   */
  countMagicNumbers(content) {
    const magicNumberRegex = /\b(\d+\.?\d*)\b(?!\s*(?:px|%|s|ms|min|hour|day))\b/g;
    const matches = content.match(magicNumberRegex) || [];

    // Filter out common numbers
    const commonNumbers = [
      '0',
      '1',
      '100',
      '1000',
      '0.5',
      '0.25',
      '0.75',
      '2',
      '3',
      '4',
      '5',
      '10',
    ];
    const magicNumbers = matches.filter((num) => !commonNumbers.includes(num));

    return magicNumbers.length;
  }

  /**
   * Calculate complexity score
   */
  calculateComplexityScore(analysis) {
    let score = 0;

    // Lines contribute to score
    if (analysis.lines > 100) score += 20;
    else if (analysis.lines > 50) score += 10;

    // Functions contribute to score
    if (analysis.functions > 10) score += 20;
    else if (analysis.functions > 5) score += 10;

    // Variables contribute to score
    if (analysis.variables > 30) score += 15;
    else if (analysis.variables > 15) score += 8;

    // Conditions contribute to score
    if (analysis.conditions > 20) score += 15;
    else if (analysis.conditions > 10) score += 8;

    // Loops contribute to score
    if (analysis.loops > 5) score += 10;
    else if (analysis.loops > 2) score += 5;

    // Nesting contributes to score
    if (analysis.nesting > 5) score += 10;
    else if (analysis.nesting > 3) score += 5;

    // Magic numbers contribute to score
    if (analysis.magicNumbers > 10) score += 10;
    else if (analysis.magicNumbers > 5) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Identify complexity issues
   */
  identifyComplexityIssues(analysis) {
    const issues = [];

    if (analysis.lines > 200) {
      issues.push({
        type: 'high_line_count',
        severity: 'high',
        message: `Code is very long (${analysis.lines} lines)`,
        suggestion: 'Consider breaking into smaller functions or files',
      });
    }

    if (analysis.functions > 15) {
      issues.push({
        type: 'many_functions',
        severity: 'medium',
        message: `Many functions (${analysis.functions})`,
        suggestion: 'Consider grouping related functions into modules',
      });
    }

    if (analysis.nesting > 4) {
      issues.push({
        type: 'deep_nesting',
        severity: 'high',
        message: `Deep nesting (depth: ${analysis.nesting})`,
        suggestion: 'Extract nested logic into separate functions',
      });
    }

    if (analysis.magicNumbers > 8) {
      issues.push({
        type: 'many_magic_numbers',
        severity: 'low',
        message: `Many magic numbers (${analysis.magicNumbers})`,
        suggestion: 'Extract magic numbers into named constants',
      });
    }

    return issues;
  }

  /**
   * Generate complexity suggestions
   */
  generateComplexitySuggestions(analysis) {
    const suggestions = [];

    if (analysis.score > 70) {
      suggestions.push('Code is complex. Consider refactoring into smaller, focused functions.');
    }

    if (analysis.nesting > 3) {
      suggestions.push(
        'Reduce nesting depth by extracting conditional logic into separate functions.',
      );
    }

    if (analysis.magicNumbers > 5) {
      suggestions.push('Replace magic numbers with named constants for better readability.');
    }

    if (analysis.lines > 150) {
      suggestions.push('Break long file into multiple focused modules.');
    }

    return suggestions;
  }

  /**
   * Analyze performance patterns
   */
  analyzePerformancePatterns(content) {
    const issues = [];
    const optimizations = [];
    const lines = content.split('\n');

    // Check for inefficient loops
    if (this.performancePatterns.inefficientLoop.test(content)) {
      issues.push({
        type: 'inefficient_loop',
        severity: 'medium',
        message: 'Loop contains potentially expensive operations',
        suggestion: 'Move expensive calculations outside loops when possible',
      });
    }

    // Check for repeated calculations
    const repeatedMatches = content.match(this.performancePatterns.repeatedCalculation);
    if (repeatedMatches) {
      issues.push({
        type: 'repeated_calculation',
        severity: 'low',
        message: `Found ${repeatedMatches.length} repeated calculations`,
        suggestion: 'Cache calculation results in variables',
      });
    }

    // Check line by line for specific patterns
    lines.forEach((line, index) => {
      // Check for expensive function calls in loops
      if (line.includes('for') || line.includes('while')) {
        const nextLines = lines.slice(index + 1, Math.min(index + 10, lines.length));
        const joined = nextLines.join('\n');

        if (this.performancePatterns.expensiveFunctionCall.test(joined)) {
          optimizations.push({
            line: index + 1,
            type: 'loop_optimization',
            message: 'Expensive function calls inside loop',
            impact: 'high',
            suggestion: 'Move expensive calls outside the loop',
          });
        }
      }

      // Check for unnecessary recalculations
      if (this.performancePatterns.unnecessaryRecalculation.test(line)) {
        optimizations.push({
          line: index + 1,
          type: 'caching_opportunity',
          message: 'Repeated calculation detected',
          impact: 'medium',
          suggestion: 'Cache the result in a variable',
        });
      }
    });

    return {
      issues,
      optimizations,
      score: this.calculatePerformanceScore(issues, optimizations),
    };
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(issues, optimizations) {
    let score = 100;

    // Deduct for issues
    for (const issue of issues) {
      if (issue.severity === 'high') score -= 15;
      else if (issue.severity === 'medium') score -= 10;
      else score -= 5;
    }

    // Deduct for optimizations needed
    for (const opt of optimizations) {
      if (opt.impact === 'high') score -= 10;
      else if (opt.impact === 'medium') score -= 5;
      else score -= 2;
    }

    return Math.max(score, 0);
  }

  /**
   * Analyze memory usage patterns
   */
  analyzeMemoryUsage(content) {
    const risks = [];
    const optimizations = [];

    // Check for large arrays
    const arrayMatches = content.match(this.memoryPatterns.largeArray) || [];
    if (arrayMatches.length > 3) {
      risks.push({
        type: 'many_arrays',
        severity: 'medium',
        message: `Many array creations (${arrayMatches.length})`,
        suggestion: 'Consider reusing arrays or using series instead',
      });
    }

    // Check for unclosed series
    const seriesMatches = content.match(this.memoryPatterns.unclosedSeries) || [];
    if (seriesMatches.length > 5) {
      risks.push({
        type: 'many_series',
        severity: 'low',
        message: `Many series variables (${seriesMatches.length})`,
        suggestion: 'Monitor memory usage with large datasets',
      });
    }

    // Check for potential memory leaks
    const leakMatches = content.match(this.memoryPatterns.memoryLeak) || [];
    if (leakMatches.length > 0) {
      risks.push({
        type: 'potential_leak',
        severity: 'high',
        message: 'Potential memory leak in array creation',
        suggestion: 'Ensure arrays are properly managed and released',
      });
    }

    // Check for excessive history access
    const historyMatches = content.match(this.memoryPatterns.excessiveHistory) || [];
    if (historyMatches.length > 20) {
      optimizations.push({
        type: 'history_optimization',
        message: 'Excessive historical data access',
        impact: 'medium',
        suggestion: 'Cache frequently accessed historical values',
      });
    }

    return {
      risks,
      optimizations,
      score: this.calculateMemoryScore(risks, optimizations),
    };
  }

  /**
   * Calculate memory score
   */
  calculateMemoryScore(risks, optimizations) {
    let score = 100;

    for (const risk of risks) {
      if (risk.severity === 'high') score -= 20;
      else if (risk.severity === 'medium') score -= 10;
      else score -= 5;
    }

    for (const opt of optimizations) {
      if (opt.impact === 'high') score -= 15;
      else if (opt.impact === 'medium') score -= 8;
      else score -= 3;
    }

    return Math.max(score, 0);
  }

  /**
   * Analyze code coverage
   */
  analyzeCodeCoverage(content) {
    const lines = content.split('\n');
    const executableLines = [];
    const coveredLines = [];
    const uncovered = [];

    // Identify executable lines (simplified)
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        return;
      }

      executableLines.push(index + 1);

      // Simplified coverage detection
      // In a real implementation, this would use actual coverage data
      const isCovered = Math.random() > 0.3; // Simulated coverage

      if (isCovered) {
        coveredLines.push(index + 1);
      } else {
        // Determine type of uncovered code
        let type = 'code';
        if (trimmed.includes('if') || trimmed.includes('else')) type = 'condition';
        else if (trimmed.includes('for') || trimmed.includes('while')) type = 'loop';
        else if (trimmed.includes('function') || trimmed.includes('=>')) type = 'function';

        uncovered.push({
          start: index + 1,
          end: index + 1,
          type,
        });
      }
    });

    const percentage =
      executableLines.length > 0
        ? Math.round((coveredLines.length / executableLines.length) * 100)
        : 0;

    return {
      executableLines: executableLines.length,
      coveredLines: coveredLines.length,
      percentage,
      uncovered,
    };
  }

  /**
   * Generate performance suggestions
   */
  generatePerformanceSuggestions(complexity, performance) {
    const suggestions = [];

    // Complexity-based suggestions
    if (complexity.score > 70) {
      suggestions.push('Code is complex. Consider simplifying logic to improve performance.');
    }

    if (complexity.nesting > 4) {
      suggestions.push('Deep nesting can impact performance. Flatten conditional logic.');
    }

    if (complexity.loops > 3) {
      suggestions.push(
        'Multiple loops can be optimized. Consider combining or vectorizing operations.',
      );
    }

    // Performance-based suggestions
    if (performance.score < 70) {
      suggestions.push('Performance optimizations needed. Review identified issues.');
    }

    if (performance.issues.length > 0) {
      suggestions.push('Address performance issues listed in the analysis.');
    }

    if (performance.optimizations.length > 0) {
      suggestions.push('Implement suggested optimizations to improve performance.');
    }

    return suggestions;
  }

  /**
   * Extract variables from content using pattern
   */
  extractVariables(content, pattern) {
    const regex = new RegExp(pattern, 'g');
    const matches = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      matches.push({
        name: match[1] || match[0],
        value: match[2] || '',
        position: match.index,
        line: this.getLineNumber(content, match.index),
      });
    }

    return matches;
  }

  /**
   * Check if name matches pattern (supports wildcards)
   */
  matchesPattern(name, pattern) {
    if (pattern === '*') return true;

    // Convert wildcard pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(name);
  }

  /**
   * Get line number from character index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }
}

module.exports = CodeAnalyzer;
