#!/usr/bin/env node
/**
 * AI Analyzer for PineScript Debugger
 *
 * Provides AI-assisted debugging suggestions and pattern analysis
 */

class AIAnalyzer {
  constructor() {
    this.patterns = this.loadAIPatterns();
  }

  /**
   * Load AI analysis patterns
   */
  loadAIPatterns() {
    return {
      common_errors: [
        {
          name: 'missing_na_check',
          pattern: /(close|open|high|low)\s*\[[^\]]*\]/,
          suggestion: 'Add na() check before accessing price data',
          type: 'safety',
          weight: 0.9,
        },
        {
          name: 'division_by_zero',
          pattern: /\b\/\s*(0|zero|na\b)/,
          suggestion: 'Add zero-check before division operation',
          type: 'safety',
          weight: 0.8,
        },
        {
          name: 'array_out_of_bounds',
          pattern: /\[\s*\d+\s*\]/,
          suggestion: 'Validate array indices before access',
          type: 'safety',
          weight: 0.7,
        },
        {
          name: 'uninitialized_variable',
          pattern: /\b(\w+)\s*(?!=)/,
          suggestion: 'Initialize variable before use',
          type: 'safety',
          weight: 0.6,
        },
      ],
      performance_issues: [
        {
          name: 'expensive_loop',
          pattern: /for\s*\([^)]*\)\s*{[^}]*\b(ta\.|security|request\.security)/,
          suggestion: 'Move expensive calculations outside loop',
          type: 'performance',
          weight: 0.8,
        },
        {
          name: 'repeated_calculation',
          pattern: /(\b\w+\b)\s*=\s*.+?;\s*(?:\n|.)*?\1\s*=\s*.+?;/,
          suggestion: 'Cache repeated calculations in variables',
          type: 'performance',
          weight: 0.7,
        },
        {
          name: 'inefficient_array',
          pattern: /array\.new_\w+\s*\([^)]*\)/,
          suggestion: 'Consider using series instead of arrays for time series data',
          type: 'performance',
          weight: 0.6,
        },
      ],
      best_practices: [
        {
          name: 'magic_number',
          pattern: /\b(\d+\.?\d*)\b(?!\s*(?:px|%|s|ms|min|hour|day))\b/,
          suggestion: 'Extract magic number into named constant',
          type: 'readability',
          weight: 0.5,
        },
        {
          name: 'long_function',
          pattern: /^.{120,}$/,
          suggestion: 'Break long function into smaller ones',
          type: 'readability',
          weight: 0.6,
        },
        {
          name: 'missing_comments',
          pattern: /(?:^|\n)(?!\s*\/\/|\s*\/\*)[^\n]{50,}(?=\n|$)/,
          suggestion: 'Add comments for complex logic',
          type: 'readability',
          weight: 0.4,
        },
        {
          name: 'descriptive_names',
          pattern: /\b(var|let|const)\s+(x|y|z|temp|val|data)\b/,
          suggestion: 'Use more descriptive variable names',
          type: 'readability',
          weight: 0.5,
        },
      ],
      tradingview_specific: [
        {
          name: 'missing_plot',
          pattern: /study|strategy/,
          suggestion: 'Add plot() calls to visualize indicator values',
          type: 'debugging',
          weight: 0.7,
        },
        {
          name: 'missing_table',
          pattern: /complex_calculation/,
          suggestion: 'Use table.new() to display variable values for debugging',
          type: 'debugging',
          weight: 0.6,
        },
        {
          name: 'missing_label',
          pattern: /important_value/,
          suggestion: 'Add label.new() for debug logging',
          type: 'debugging',
          weight: 0.5,
        },
      ],
    };
  }

  /**
   * Generate AI suggestions for code
   */
  generateAISuggestions(content, patterns, includePatterns = 'all', threshold = 0.7) {
    const suggestions = [];
    const lines = content.split('\n');

    // Determine which pattern categories to include
    const categories = this.getCategoriesToInclude(includePatterns);

    // Analyze each line
    lines.forEach((line, lineIndex) => {
      for (const category of categories) {
        for (const pattern of this.patterns[category]) {
          if (this.matchesAIPattern(line, pattern)) {
            const confidence = this.calculateConfidence(line, pattern);
            if (confidence >= threshold) {
              suggestions.push({
                line: lineIndex + 1,
                pattern: pattern.name,
                category,
                confidence,
                suggestion: pattern.suggestion,
                code: line.trim(),
              });
            }
          }
        }
      }
    });

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get categories to include based on filter
   */
  getCategoriesToInclude(includePatterns) {
    if (includePatterns === 'all') {
      return Object.keys(this.patterns);
    }

    // Map filter to categories
    const filterMap = {
      performance: ['performance_issues'],
      safety: ['common_errors'],
      readability: ['best_practices'],
      debugging: ['tradingview_specific'],
    };

    return filterMap[includePatterns] || [includePatterns];
  }

  /**
   * Check if line matches AI pattern
   */
  matchesAIPattern(line, pattern) {
    if (!pattern.pattern) return false;

    try {
      const regex = new RegExp(pattern.pattern, pattern.flags || '');
      return regex.test(line);
    } catch (error) {
      console.error(`Error compiling regex for pattern ${pattern.name}:`, error.message);
      return false;
    }
  }

  /**
   * Calculate confidence score for pattern match
   */
  calculateConfidence(line, pattern) {
    if (!pattern.pattern) return 0;

    try {
      const regex = new RegExp(pattern.pattern, pattern.flags || '');
      const match = regex.exec(line);

      if (!match) return 0;

      // Base confidence on pattern weight
      let confidence = pattern.weight || 0.5;

      // Adjust based on match quality
      if (match[0].length > 10) {
        confidence += 0.1;
      }

      // Adjust based on line complexity
      if (line.length > 50) {
        confidence += 0.05;
      }

      // Adjust based on context (simplified)
      if (line.includes('if') || line.includes('for') || line.includes('while')) {
        confidence += 0.05;
      }

      // Cap at 1.0
      return Math.min(confidence, 1.0);
    } catch (error) {
      console.error(`Error calculating confidence for pattern ${pattern.name}:`, error.message);
      return 0;
    }
  }

  /**
   * Print AI suggestions in readable format
   */
  printAISuggestions(suggestions, format = 'text') {
    switch (format) {
      case 'json':
        return JSON.stringify(suggestions, null, 2);

      case 'markdown':
        return this.formatAsMarkdown(suggestions);

      case 'text':
      default:
        return this.formatAsText(suggestions);
    }
  }

  /**
   * Format suggestions as text
   */
  formatAsText(suggestions) {
    if (suggestions.length === 0) {
      return 'No AI suggestions found.';
    }

    const lines = [];
    lines.push(`Found ${suggestions.length} AI suggestions:`);
    lines.push('');

    suggestions.forEach((suggestion, index) => {
      lines.push(`${index + 1}. Line ${suggestion.line} (${suggestion.pattern}):`);
      lines.push(
        `   Code: ${suggestion.code.substring(0, 60)}${suggestion.code.length > 60 ? '...' : ''}`,
      );
      lines.push(`   Suggestion: ${suggestion.suggestion}`);
      lines.push(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Format suggestions as markdown
   */
  formatAsMarkdown(suggestions) {
    if (suggestions.length === 0) {
      return '# No AI suggestions found';
    }

    const lines = [];
    lines.push(`# AI Debugging Suggestions (${suggestions.length} found)`);
    lines.push('');

    // Group by category
    const byCategory = {};
    suggestions.forEach((suggestion) => {
      if (!byCategory[suggestion.category]) {
        byCategory[suggestion.category] = [];
      }
      byCategory[suggestion.category].push(suggestion);
    });

    // Print by category
    for (const [category, categorySuggestions] of Object.entries(byCategory)) {
      lines.push(`## ${this.formatCategoryName(category)} (${categorySuggestions.length})`);
      lines.push('');

      categorySuggestions.forEach((suggestion, index) => {
        lines.push(`### ${index + 1}. Line ${suggestion.line}: ${suggestion.pattern}`);
        lines.push('');
        lines.push('```pinescript');
        lines.push(suggestion.code);
        lines.push('```');
        lines.push('');
        lines.push(`**Suggestion:** ${suggestion.suggestion}`);
        lines.push('');
        lines.push(`**Confidence:** ${Math.round(suggestion.confidence * 100)}%`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  /**
   * Format category name for display
   */
  formatCategoryName(category) {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Save AI suggestions to file
   */
  saveAISuggestions(suggestions, outputPath) {
    const fs = require('fs');
    const path = require('path');

    // Determine format from file extension
    const ext = path.extname(outputPath).toLowerCase();
    let format = 'text';
    let content = '';

    switch (ext) {
      case '.json':
        format = 'json';
        content = JSON.stringify(suggestions, null, 2);
        break;
      case '.md':
        format = 'markdown';
        content = this.formatAsMarkdown(suggestions);
        break;
      default:
        format = 'text';
        content = this.formatAsText(suggestions);
    }

    try {
      fs.writeFileSync(outputPath, content);
      return {
        success: true,
        path: outputPath,
        format,
        count: suggestions.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate AI debug helpers
   */
  generateAIDebugHelpers(outputPath) {
    const helpers = {
      common_errors: this.patterns.common_errors.map((p) => ({
        pattern: p.pattern.toString(),
        name: p.name,
        suggestion: p.suggestion,
        example: this.generateExample(p.name),
      })),
      performance_issues: this.patterns.performance_issues.map((p) => ({
        pattern: p.pattern.toString(),
        name: p.name,
        suggestion: p.suggestion,
        example: this.generateExample(p.name),
      })),
      best_practices: this.patterns.best_practices.map((p) => ({
        pattern: p.pattern.toString(),
        name: p.name,
        suggestion: p.suggestion,
        example: this.generateExample(p.name),
      })),
      tradingview_specific: this.patterns.tradingview_specific.map((p) => ({
        pattern: p.pattern.toString(),
        name: p.name,
        suggestion: p.suggestion,
        example: this.generateExample(p.name),
      })),
    };

    const fs = require('fs');
    const content = JSON.stringify(helpers, null, 2);

    try {
      fs.writeFileSync(outputPath, content);
      return {
        success: true,
        path: outputPath,
        patterns: Object.keys(helpers).reduce((sum, key) => sum + helpers[key].length, 0),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate example for pattern
   */
  generateExample(patternName) {
    const examples = {
      missing_na_check: '// Before: close[10]\n// After: na(close[10]) ? 0 : close[10]',
      division_by_zero: '// Before: value / divisor\n// After: divisor == 0 ? 0 : value / divisor',
      expensive_loop:
        '// Before: for i = 0 to 100\n//           value = ta.sma(close, i)\n// After: precalculate outside loop',
      magic_number:
        '// Before: if close > 50\n// After: RESISTANCE_LEVEL = 50\n//        if close > RESISTANCE_LEVEL',
      missing_plot: '// Add: plot(myIndicator, "My Indicator", color=color.blue)',
    };

    return examples[patternName] || 'No example available';
  }

  /**
   * Generate memory profiling helpers
   */
  generateMemoryProfilingHelpers(outputPath) {
    const memoryConfig = {
      enabled: true,
      trackVariables: true,
      trackArrays: true,
      trackSeries: true,
      warningThreshold: 50,
      criticalThreshold: 100,
      helpers: [
        {
          name: 'memory_tracker',
          description: 'Tracks memory usage of variables',
          code: `// Memory tracking helper
trackMemory(variableName, value) =>
    var int memoryCount = 0
    memoryCount := memoryCount + 1
    memoryCount`,
        },
        {
          name: 'array_size_check',
          description: 'Checks array size and warns if too large',
          code: `// Array size checker
checkArraySize(arr, maxSize = 100) =>
    size = array.size(arr)
    if size > maxSize
        label.new(bar_index, high, "Array too large: " + str.tostring(size), color=color.red)
    size`,
        },
        {
          name: 'memory_plotter',
          description: 'Plots memory usage over time',
          code: `// Memory usage plotter
plotMemoryUsage(memoryCount, warningThreshold = 50, criticalThreshold = 100) =>
    plot(memoryCount, "Memory Usage", color=color.blue)
    hline(warningThreshold, "Warning", color=color.orange)
    hline(criticalThreshold, "Critical", color=color.red)`,
        },
      ],
    };

    const fs = require('fs');
    const content = JSON.stringify(memoryConfig, null, 2);

    try {
      fs.writeFileSync(outputPath, content);
      return {
        success: true,
        path: outputPath,
        helpers: memoryConfig.helpers.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze code with AI and return comprehensive report
   */
  analyzeWithAI(content, options = {}) {
    const { includePatterns = 'all', threshold = 0.7, format = 'text' } = options;

    const suggestions = this.generateAISuggestions(
      content,
      this.patterns,
      includePatterns,
      threshold,
    );

    return {
      suggestions,
      summary: {
        total: suggestions.length,
        byCategory: this.groupByCategory(suggestions),
        averageConfidence: this.calculateAverageConfidence(suggestions),
      },
      formatted: this.printAISuggestions(suggestions, format),
    };
  }

  /**
   * Group suggestions by category
   */
  groupByCategory(suggestions) {
    const groups = {};

    suggestions.forEach((suggestion) => {
      if (!groups[suggestion.category]) {
        groups[suggestion.category] = 0;
      }
      groups[suggestion.category]++;
    });

    return groups;
  }

  /**
   * Calculate average confidence
   */
  calculateAverageConfidence(suggestions) {
    if (suggestions.length === 0) return 0;

    const total = suggestions.reduce((sum, suggestion) => sum + suggestion.confidence, 0);
    return total / suggestions.length;
  }
}

module.exports = AIAnalyzer;
