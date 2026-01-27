#!/usr/bin/env node
/**
 * Error Handler for Clojure Command Runner
 *
 * Provides Clojure-specific error handling and suggestions
 */

const { defaultErrorHandler } = require('../../lib/error-handler');
const { LoggingUtils } = require('../../lib');

class ClojureErrorHandler {
  constructor(buildTool = null) {
    this.buildTool = buildTool;
  }

  /**
   * Handle Clojure errors with Clojure-specific suggestions
   */
  handleClojureError(error, context = {}) {
    const errorInfo = defaultErrorHandler.handleError(error, context);

    // Log user-friendly error message using LoggingUtils
    LoggingUtils.error(errorInfo.userMessage);

    // Log recovery steps using LoggingUtils
    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      LoggingUtils.info('💡 Recovery steps:');
      errorInfo.recoverySteps.forEach((step, i) => {
        LoggingUtils.info(`  ${i + 1}. ${step}`);
      });
    }

    // Clojure-specific error suggestions
    this.suggestClojureFix(error.message, context.command);

    // Re-throw enhanced error
    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.recoverySteps = errorInfo.recoverySteps;
    enhancedError.originalError = error;
    throw enhancedError;
  }

  /**
   * Suggest Clojure fixes based on error message
   */
  suggestClojureFix(errorMessage, command) {
    LoggingUtils.info('\n💡 Clojure Error Suggestions:');

    if (errorMessage.includes('could not find') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Check namespace declarations');
      LoggingUtils.info('   • Verify file paths and require statements');
      LoggingUtils.info('   • Run: clojure -M:test or lein test');
    }

    if (errorMessage.includes('java.lang.ClassNotFoundException')) {
      LoggingUtils.info('   • Check classpath configuration');
      LoggingUtils.info('   • Add missing dependencies to deps.edn or project.clj');
      LoggingUtils.info('   • Run: clojure -Spath or lein deps');
    }

    if (
      errorMessage.includes('IllegalArgumentException') ||
      errorMessage.includes('AssertionError')
    ) {
      LoggingUtils.info('   • Check function arguments and types');
      LoggingUtils.info('   • Use clojure.spec for validation');
      LoggingUtils.info('   • Add debug prints with println or tap>');
    }

    if (errorMessage.includes('NullPointerException')) {
      LoggingUtils.info('   • Check for nil values in function calls');
      LoggingUtils.info('   • Use some-> or some->> for safe navigation');
      LoggingUtils.info('   • Add nil checks with when-let or if-let');
    }

    if (errorMessage.includes('OutOfMemoryError') || errorMessage.includes('GC overhead')) {
      LoggingUtils.info('   • Increase JVM heap size: -Xmx2g');
      LoggingUtils.info('   • Use lazy sequences for large data');
      LoggingUtils.info('   • Consider using transducers or reducers');
    }

    // Build tool specific suggestions
    if (command) {
      this.suggestBuildToolFix(errorMessage, command);
    }
  }

  /**
   * Suggest build tool specific fixes
   */
  suggestBuildToolFix(errorMessage, _command) {
    if (this.buildTool === 'clojure-cli') {
      if (errorMessage.includes('deps.edn')) {
        LoggingUtils.info('   • Check deps.edn syntax and structure');
        LoggingUtils.info('   • Run: clojure -M:test:runner/refresh');
        LoggingUtils.info('   • Use clj-kondo to lint deps.edn');
      }
    } else if (this.buildTool === 'leiningen') {
      if (errorMessage.includes('project.clj')) {
        LoggingUtils.info('   • Check project.clj syntax and dependencies');
        LoggingUtils.info('   • Run: lein deps :tree');
        LoggingUtils.info('   • Clear cache: rm -rf ~/.m2/repository');
      }
    }
  }

  /**
   * Suggest test fixes
   */
  suggestTestFix(errorMessage) {
    LoggingUtils.info('\n💡 Test Error Suggestions:');

    if (errorMessage.includes('namespace') || errorMessage.includes('require')) {
      LoggingUtils.info('   • Check test namespace declarations');
      LoggingUtils.info('   • Verify :require statements in test files');
      LoggingUtils.info('   • Run tests in specific namespace: clojure -M:test -n my.namespace');
    }

    if (errorMessage.includes('assert') || errorMessage.includes('is')) {
      LoggingUtils.info('   • Check test assertions with is or are');
      LoggingUtils.info('   • Use testing macro to group related tests');
      LoggingUtils.info('   • Add descriptive messages to assertions');
    }
  }

  /**
   * Suggest build fixes
   */
  suggestBuildFix(errorMessage) {
    LoggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('compile') || errorMessage.includes('AOT')) {
      LoggingUtils.info('   • Check :aot compilation settings');
      LoggingUtils.info('   • Verify main namespace declaration');
      LoggingUtils.info('   • Clear compilation cache and rebuild');
    }

    if (errorMessage.includes('uberjar') || errorMessage.includes('jar')) {
      LoggingUtils.info('   • Check :main class configuration');
      LoggingUtils.info('   • Ensure all dependencies are included');
      LoggingUtils.info('   • Use :uberjar-exclusions for unwanted files');
    }
  }

  /**
   * Suggest REPL fixes
   */
  suggestReplFix(errorMessage) {
    LoggingUtils.info('\n💡 REPL Error Suggestions:');

    if (errorMessage.includes('nREPL') || errorMessage.includes('port')) {
      LoggingUtils.info('   • Check nREPL port configuration');
      LoggingUtils.info('   • Kill existing nREPL process on same port');
      LoggingUtils.info('   • Use different port: lein repl :port 7888');
    }

    if (errorMessage.includes('classpath') || errorMessage.includes('dependencies')) {
      LoggingUtils.info('   • Run lein deps or clojure -Sdeps first');
      LoggingUtils.info('   • Check dependency conflicts');
      LoggingUtils.info('   • Clear local Maven repository cache');
    }
  }

  /**
   * Suggest lint fixes
   */
  suggestLintFix(errorMessage) {
    LoggingUtils.info('\n💡 Linting Error Suggestions:');

    if (errorMessage.includes('clj-kondo') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Install clj-kondo: https://github.com/clj-kondo/clj-kondo');
      LoggingUtils.info('   • Use clojure -M:clj-kondo/install for CLI');
      LoggingUtils.info('   • Add clj-kondo to project dependencies');
    }

    if (errorMessage.includes('unused') || errorMessage.includes('warning')) {
      LoggingUtils.info('   • Remove unused vars or add ^:private metadata');
      LoggingUtils.info('   • Use #_:clj-kondo/ignore to suppress warnings');
      LoggingUtils.info('   • Create .clj-kondo/config.edn for project rules');
    }
  }

  /**
   * Suggest format fixes
   */
  suggestFormatFix(errorMessage) {
    LoggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('zprint') || errorMessage.includes('not found')) {
      LoggingUtils.info('   • Install zprint: https://github.com/kkinnear/zprint');
      LoggingUtils.info('   • Use clojure -M:zprint/install for CLI');
      LoggingUtils.info('   • Add zprint to project dependencies');
    }

    if (errorMessage.includes('parse') || errorMessage.includes('syntax')) {
      LoggingUtils.info('   • Check Clojure syntax in problematic files');
      LoggingUtils.info('   • Fix unbalanced parentheses or brackets');
      LoggingUtils.info('   • Use paredit mode in your editor');
    }
  }

  /**
   * Suggest run fixes
   */
  suggestRunFix(errorMessage) {
    LoggingUtils.info('\n💡 Run Error Suggestions:');

    if (errorMessage.includes('main') || errorMessage.includes('-main')) {
      LoggingUtils.info('   • Check -main function signature and arity');
      LoggingUtils.info('   • Verify :main namespace in project config');
      LoggingUtils.info('   • Build project first: lein uberjar or clojure -M:uberjar');
    }

    if (errorMessage.includes('class') || errorMessage.includes('method')) {
      LoggingUtils.info('   • Check Java interop calls');
      LoggingUtils.info('   • Verify imported Java classes');
      LoggingUtils.info('   • Use type hints for performance');
    }
  }

  /**
   * Suggest clean fixes
   */
  suggestCleanFix(errorMessage) {
    LoggingUtils.info('\n💡 Clean Error Suggestions:');

    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      LoggingUtils.info('   • Check file permissions on target directories');
      LoggingUtils.info('   • Run with appropriate user permissions');
      LoggingUtils.info('   • Manually remove locked files');
    }
  }

  /**
   * Suggest deps fixes
   */
  suggestDepsFix(errorMessage) {
    LoggingUtils.info('\n💡 Dependency Error Suggestions:');

    if (errorMessage.includes('network') || errorMessage.includes('download')) {
      LoggingUtils.info('   • Check internet connection');
      LoggingUtils.info('   • Configure Maven repository mirrors');
      LoggingUtils.info('   • Clear local cache and retry');
    }

    if (errorMessage.includes('version') || errorMessage.includes('conflict')) {
      LoggingUtils.info('   • Check dependency version conflicts');
      LoggingUtils.info('   • Use :exclusions in project config');
      LoggingUtils.info('   • Run dependency tree: lein deps :tree');
    }
  }

  /**
   * Get error type from error message
   */
  getErrorType(errorMessage) {
    if (errorMessage.includes('ClassNotFoundException')) {
      return 'classpath';
    } else if (errorMessage.includes('NullPointerException')) {
      return 'null-pointer';
    } else if (errorMessage.includes('IllegalArgumentException')) {
      return 'argument';
    } else if (errorMessage.includes('AssertionError')) {
      return 'assertion';
    } else if (errorMessage.includes('OutOfMemoryError')) {
      return 'memory';
    } else if (errorMessage.includes('could not find')) {
      return 'not-found';
    } else if (errorMessage.includes('syntax')) {
      return 'syntax';
    } else if (errorMessage.includes('network')) {
      return 'network';
    } else if (errorMessage.includes('permission')) {
      return 'permission';
    } else {
      return 'unknown';
    }
  }

  /**
   * Get detailed error analysis
   */
  analyzeError(error, context = {}) {
    const errorMessage = error.message || error.toString();
    const errorType = this.getErrorType(errorMessage);

    const analysis = {
      type: errorType,
      message: errorMessage,
      context,
      timestamp: new Date().toISOString(),
      suggestions: this.getErrorSuggestions(errorType, context),
      severity: this.getErrorSeverity(errorType),
    };

    return analysis;
  }

  /**
   * Get error suggestions based on type
   */
  getErrorSuggestions(errorType, _context) {
    const suggestions = [];

    switch (errorType) {
      case 'classpath':
        suggestions.push('Check classpath configuration');
        suggestions.push('Verify dependency declarations');
        suggestions.push('Run dependency resolution command');
        break;
      case 'null-pointer':
        suggestions.push('Add nil checks with when-let or if-let');
        suggestions.push('Use some-> or some->> for safe navigation');
        suggestions.push('Add debug prints to trace nil values');
        break;
      case 'argument':
        suggestions.push('Check function arguments and types');
        suggestions.push('Use clojure.spec for validation');
        suggestions.push('Add type hints for performance');
        break;
      case 'memory':
        suggestions.push('Increase JVM heap size with -Xmx flag');
        suggestions.push('Use lazy sequences for large data');
        suggestions.push('Consider using transducers or reducers');
        break;
      case 'not-found':
        suggestions.push('Check namespace declarations');
        suggestions.push('Verify file paths and require statements');
        suggestions.push('Run project validation');
        break;
      case 'syntax':
        suggestions.push('Check Clojure syntax in problematic files');
        suggestions.push('Fix unbalanced parentheses or brackets');
        suggestions.push('Use paredit mode in your editor');
        break;
      case 'network':
        suggestions.push('Check internet connection');
        suggestions.push('Configure Maven repository mirrors');
        suggestions.push('Clear local cache and retry');
        break;
      case 'permission':
        suggestions.push('Check file permissions');
        suggestions.push('Run with appropriate user permissions');
        suggestions.push('Manually remove locked files');
        break;
      default:
        suggestions.push('Review error message for clues');
        suggestions.push('Check project configuration');
        suggestions.push('Consult Clojure documentation');
    }

    return suggestions;
  }

  /**
   * Get error severity
   */
  getErrorSeverity(errorType) {
    const severityMap = {
      memory: 'high',
      classpath: 'medium',
      'not-found': 'medium',
      permission: 'medium',
      network: 'low',
      'null-pointer': 'low',
      argument: 'low',
      assertion: 'low',
      syntax: 'low',
      unknown: 'medium',
    };

    return severityMap[errorType] || 'medium';
  }

  /**
   * Generate error report
   */
  generateErrorReport(error, context = {}) {
    const analysis = this.analyzeError(error, context);

    const lines = [];
    lines.push('Clojure Error Report');
    lines.push('====================');
    lines.push('');
    lines.push(`Error Type: ${analysis.type}`);
    lines.push(`Severity: ${analysis.severity}`);
    lines.push(`Timestamp: ${analysis.timestamp}`);
    lines.push('');
    lines.push('Error Message:');
    lines.push(`  ${analysis.message}`);
    lines.push('');
    lines.push('Context:');
    Object.entries(analysis.context).forEach(([key, value]) => {
      lines.push(`  ${key}: ${value}`);
    });
    lines.push('');
    lines.push('Suggestions:');
    analysis.suggestions.forEach((suggestion, i) => {
      lines.push(`  ${i + 1}. ${suggestion}`);
    });

    return lines.join('\n');
  }
}

module.exports = ClojureErrorHandler;
