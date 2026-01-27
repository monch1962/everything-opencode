#!/usr/bin/env node
/**
 * Code Analyzer for PineScript Debug Server
 *
 * Analyzes PineScript code for complexity, patterns, and debugging suggestions
 */

class CodeAnalyzer {
  constructor() {
    this.patterns = this.loadDefaultPatterns();
  }

  /**
   * Load default analysis patterns
   */
  loadDefaultPatterns() {
    return {
      complexity: {
        highLoopCount: { threshold: 3, weight: 0.3 },
        deepNesting: { threshold: 4, weight: 0.25 },
        longFunction: { threshold: 50, weight: 0.2 },
        manyVariables: { threshold: 20, weight: 0.15 },
        magicNumbers: { threshold: 5, weight: 0.1 },
      },
      patterns: {
        // Performance patterns
        inefficientLoop: /for\s*\([^)]*\)\s*{[^}]*\b(ta\.|security|request\.security)/,
        repeatedCalculation: /(\b\w+\b)\s*=\s*.+?;\s*(?:\n|.)*?\1\s*=\s*.+?;/,

        // Error-prone patterns
        missingSafetyCheck: /(close|open|high|low)\s*\[[^\]]*\]\s*(?![^{]*\bna\b)/,
        divisionByZero: /\b\/\s*(0|zero|na\b)/,

        // Style patterns
        longLine: /^.{120,}$/,
        missingComments: /(?:^|\n)(?!\s*\/\/|\s*\/\*)[^\n]{50,}(?=\n|$)/,
      },
      suggestions: {
        performance: [
          'Consider using ta. functions for built-in calculations',
          'Cache repeated calculations in variables',
          'Use security() function for multi-timeframe data',
          'Avoid calculations inside tight loops',
        ],
        safety: [
          'Add na() checks for indicator values',
          'Validate array indices before access',
          'Handle division by zero cases',
          'Check for valid data before calculations',
        ],
        readability: [
          'Break long functions into smaller ones',
          'Add comments for complex logic',
          'Use descriptive variable names',
          'Extract magic numbers into named constants',
        ],
        debugging: [
          'Add plot() calls to visualize intermediate values',
          'Use table.new() to display variable values',
          'Implement debug logging with label.new()',
          'Create test cases with known inputs/outputs',
        ],
      },
    };
  }

  /**
   * Analyze PineScript code
   */
  async analyzePineScript(content) {
    const analysis = {
      lines: content.split('\n').length,
      characters: content.length,
      functions: [],
      variables: [],
      complexity: this.calculateComplexity(content),
      suggestions: this.generateDebugSuggestions(content),
      patterns: this.detectPatterns(content),
      metrics: this.calculateMetrics(content),
    };

    // Extract functions
    const functionRegex = /(\w+)\s*=\s*\([^)]*\)\s*=>/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.functions.push({
        name: match[1],
        start: match.index,
        end: content.indexOf('}', match.index) + 1,
        type: 'function',
      });
    }

    // Extract variables
    const variableRegex = /(\w+)\s*=\s*(?!\([^)]*\)\s*=>)/g;
    while ((match = variableRegex.exec(content)) !== null) {
      analysis.variables.push({
        name: match[1],
        position: match.index,
        type: 'variable',
      });
    }

    return analysis;
  }

  /**
   * Calculate code complexity
   */
  calculateComplexity(content) {
    // Count lines
    const lines = content.split('\n').length;

    // Count variables (simplified)
    const variables = (content.match(/\b(var|let|const)\s+\w+/g) || []).length;

    // Count conditions
    const conditions = (content.match(/\b(if|else if|switch|case)\b/g) || []).length;

    // Count loops (unused in calculation but kept for completeness)
    // eslint-disable-next-line no-unused-vars
    const _loops = (content.match(/\b(for|while|do)\b/g) || []).length;

    // Count functions (arrow functions and regular)
    const functions =
      (content.match(/=>/g) || []).length + (content.match(/function\s+\w+/g) || []).length;

    // Weighted complexity score
    return Math.round(lines * 0.3 + variables * 0.2 + conditions * 0.3 + functions * 0.2);
  }

  /**
   * Generate debugging suggestions
   */
  generateDebugSuggestions(content) {
    const suggestions = [];
    const lines = content.split('\n');

    // Check for long lines
    lines.forEach((line, index) => {
      if (line.length > 120) {
        suggestions.push({
          type: 'readability',
          line: index + 1,
          message: 'Line is too long (>120 characters)',
          suggestion: 'Break into multiple lines or extract logic',
        });
      }
    });

    // Check for magic numbers
    const magicNumberRegex = /\b(\d+\.?\d*)\b(?!\s*(?:px|%|s|ms|min|hour|day))\b/g;
    let magicNumberMatch;
    const magicNumbers = new Set();

    while ((magicNumberMatch = magicNumberRegex.exec(content)) !== null) {
      const number = magicNumberMatch[1];
      if (!['0', '1', '100', '1000'].includes(number)) {
        magicNumbers.add(number);
      }
    }

    if (magicNumbers.size > 5) {
      suggestions.push({
        type: 'readability',
        line: this.getLineNumber(content, magicNumberRegex.lastIndex),
        message: `Found ${magicNumbers.size} magic numbers`,
        suggestion: 'Extract magic numbers into named constants',
      });
    }

    // Check for missing safety checks
    const safetyRegex = /(close|open|high|low)\s*\[[^\]]*\]/g;
    if (safetyRegex.test(content) && !content.includes('na(')) {
      suggestions.push({
        type: 'safety',
        line: 1,
        message: 'Missing na() checks for price data access',
        suggestion: 'Add na() validation for array accesses',
      });
    }

    // Check for division operations
    if (content.includes('/')) {
      suggestions.push({
        type: 'safety',
        line: this.getLineNumber(content, content.indexOf('/')),
        message: 'Division operation detected',
        suggestion: 'Add zero-check before division',
      });
    }

    // Add performance suggestions for loops
    if (content.includes('for') || content.includes('while')) {
      suggestions.push({
        type: 'performance',
        line: this.getLineNumber(
          content,
          Math.max(content.indexOf('for'), content.indexOf('while')),
        ),
        message: 'Loop detected',
        suggestion: 'Consider optimizing loop calculations',
      });
    }

    return suggestions;
  }

  /**
   * Detect patterns in code
   */
  detectPatterns(content) {
    const detected = [];

    for (const [patternName, pattern] of Object.entries(this.patterns.patterns)) {
      if (pattern.test(content)) {
        detected.push({
          pattern: patternName,
          description: this.getPatternDescription(patternName),
          severity: this.getPatternSeverity(patternName),
        });
      }
    }

    return detected;
  }

  /**
   * Calculate code metrics
   */
  calculateMetrics(content) {
    const lines = content.split('\n');

    return {
      lineCount: lines.length,
      nonEmptyLines: lines.filter((line) => line.trim().length > 0).length,
      commentLines: lines.filter((line) => line.trim().startsWith('//') || line.includes('/*'))
        .length,
      functionCount:
        (content.match(/=>/g) || []).length + (content.match(/function\s+\w+/g) || []).length,
      variableCount: (content.match(/\b(var|let|const)\s+\w+/g) || []).length,
      conditionCount: (content.match(/\b(if|else if|switch|case)\b/g) || []).length,
      loopCount: (content.match(/\b(for|while|do)\b/g) || []).length,
      averageLineLength: Math.round(
        lines.reduce((sum, line) => sum + line.length, 0) / lines.length,
      ),
      commentRatio: Math.round(
        (lines.filter((line) => line.trim().startsWith('//') || line.includes('/*')).length /
          lines.length) *
          100,
      ),
    };
  }

  /**
   * Get line number from character index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Get pattern description
   */
  getPatternDescription(patternName) {
    const descriptions = {
      inefficientLoop: 'Loop contains potentially expensive operations',
      repeatedCalculation: 'Same calculation appears multiple times',
      missingSafetyCheck: 'Missing validation for data access',
      divisionByZero: 'Potential division by zero',
      longLine: 'Line exceeds recommended length',
      missingComments: 'Complex code without explanatory comments',
    };

    return descriptions[patternName] || 'Unknown pattern';
  }

  /**
   * Get pattern severity
   */
  getPatternSeverity(patternName) {
    const severities = {
      inefficientLoop: 'medium',
      repeatedCalculation: 'low',
      missingSafetyCheck: 'high',
      divisionByZero: 'high',
      longLine: 'low',
      missingComments: 'low',
    };

    return severities[patternName] || 'low';
  }

  /**
   * Get AI-based suggestions
   */
  generateAISuggestions(code, patterns, includePatterns = 'all', threshold = 0.7) {
    const suggestions = [];
    const lines = code.split('\n');

    patterns.forEach((pattern) => {
      if (includePatterns === 'all' || pattern.type === includePatterns) {
        lines.forEach((line, index) => {
          if (this.matchesAIPattern(line, pattern)) {
            const confidence = this.calculateAIConfidence(line, pattern);
            if (confidence >= threshold) {
              suggestions.push({
                line: index + 1,
                pattern: pattern.name,
                confidence,
                suggestion: pattern.suggestion,
                code: line.trim(),
              });
            }
          }
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
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
      return false;
    }
  }

  /**
   * Calculate AI confidence score
   */
  calculateAIConfidence(line, pattern) {
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

      // Cap at 1.0
      return Math.min(confidence, 1.0);
    } catch (error) {
      return 0;
    }
  }
}

module.exports = CodeAnalyzer;
