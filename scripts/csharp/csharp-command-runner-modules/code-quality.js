const path = require('path');

class CodeQuality {
  constructor(runner, loggingUtils, platformDetector) {
    this.runner = runner;
    this.loggingUtils = loggingUtils;
    this.platformDetector = platformDetector;
  }

  async lint(args = [], options = {}) {
    await this.runner.initialize();

    // Check for linter
    const detectedTools = this.runner.detectedTools;
    let lintCommand = 'format';
    let lintArgs = ['analyzers', ...args];

    // Use Roslyn analyzers if available
    if (detectedTools?.dotnetFormat?.installed) {
      lintCommand = 'format';
      lintArgs = ['--verify-no-changes', ...args];
    }

    this.loggingUtils.info(`🔍 Running code analysis with ${lintCommand}...`);

    try {
      const result = await this.runner.executeDotnetCommand(lintCommand, lintArgs, options);

      // Show analysis summary
      this._showAnalysisSummary();

      return result;
    } catch (error) {
      this._suggestLintFix(error.message);
      throw error;
    }
  }

  async format(args = [], options = {}) {
    await this.runner.initialize();

    // Check for formatter
    const detectedTools = this.runner.detectedTools;
    let formatCommand = 'format';
    let formatArgs = args;

    // Use dotnet-format if available
    if (detectedTools?.dotnetFormat?.installed) {
      formatCommand = 'format';
      formatArgs = ['--include', '**/*.cs', ...formatArgs];
    }

    this.loggingUtils.info(`🎨 Formatting code with ${formatCommand}...`);

    try {
      const result = await this.runner.executeDotnetCommand(formatCommand, formatArgs, options);

      this.loggingUtils.info('✅ Code formatting completed');

      return result;
    } catch (error) {
      this._suggestFormatFix(error.message);
      throw error;
    }
  }

  async analyze(args = [], options = {}) {
    await this.runner.initialize();

    const analyzeCommand = 'format';
    const analyzeArgs = ['analyzers', '--diagnostics', 'all', ...args];

    this.loggingUtils.info(`🔬 Running full code analysis...`);

    try {
      const result = await this.runner.executeDotnetCommand(analyzeCommand, analyzeArgs, options);

      // Show detailed analysis results
      this._showDetailedAnalysis();

      return result;
    } catch (error) {
      this._suggestAnalyzeFix(error.message);
      throw error;
    }
  }

  async fixAll(args = [], options = {}) {
    await this.runner.initialize();

    const fixCommand = 'format';
    const fixArgs = ['--fix-analyzers', '--fix-style', '--fix-whitespace', ...args];

    this.loggingUtils.info(`🔧 Fixing all code issues...`);

    try {
      const result = await this.runner.executeDotnetCommand(fixCommand, fixArgs, options);

      this.loggingUtils.info('✅ All code issues fixed');

      return result;
    } catch (error) {
      this._suggestFixAllFix(error.message);
      throw error;
    }
  }

  async checkStyle(args = [], options = {}) {
    await this.runner.initialize();

    const styleCommand = 'format';
    const styleArgs = ['style', '--verify-no-changes', ...args];

    this.loggingUtils.info(`🎨 Checking code style...`);

    try {
      const result = await this.runner.executeDotnetCommand(styleCommand, styleArgs, options);

      this._showStyleSummary();

      return result;
    } catch (error) {
      this._suggestStyleFix(error.message);
      throw error;
    }
  }

  _showAnalysisSummary() {
    try {
      const fs = require('fs');
      const editorConfigPath = path.join(this.runner.projectPath, '.editorconfig');

      if (fs.existsSync(editorConfigPath)) {
        const content = fs.readFileSync(editorConfigPath, 'utf8');
        const analyzerRules = (content.match(/^dotnet_/gm) || []).length;
        const styleRules = (content.match(/^csharp_/gm) || []).length;

        this.loggingUtils.info('\n📊 Code Analysis Configuration:');
        this.loggingUtils.info('='.repeat(40));
        this.loggingUtils.info(`Analyzer rules: ${analyzerRules}`);
        this.loggingUtils.info(`Style rules: ${styleRules}`);
        this.loggingUtils.info(`EditorConfig: ${editorConfigPath}`);
        this.loggingUtils.info('='.repeat(40));
      }
    } catch (error) {
      // Silently fail - analysis summary is optional
    }
  }

  _showDetailedAnalysis() {
    this.loggingUtils.info('\n📋 Analysis Categories:');
    this.loggingUtils.info('='.repeat(40));
    this.loggingUtils.info('   • Code Style (IDEXXXX)');
    this.loggingUtils.info('   • Quality (CAXXXX)');
    this.loggingUtils.info('   • Performance (PERFXXXX)');
    this.loggingUtils.info('   • Security (SECXXXX)');
    this.loggingUtils.info('   • Design (DESIGNXXXX)');
    this.loggingUtils.info('='.repeat(40));
    this.loggingUtils.info('💡 Configure rules in .editorconfig or .ruleset');
  }

  _showStyleSummary() {
    this.loggingUtils.info('\n🎨 Code Style Guidelines:');
    this.loggingUtils.info('='.repeat(40));
    this.loggingUtils.info('   • Naming conventions (PascalCase, camelCase)');
    this.loggingUtils.info('   • Using directives placement');
    this.loggingUtils.info('   • Braces placement (K&R, Allman)');
    this.loggingUtils.info('   • Indentation (spaces vs tabs)');
    this.loggingUtils.info('   • Line length (default: 120 chars)');
    this.loggingUtils.info('='.repeat(40));
  }

  _suggestLintFix(errorMessage) {
    this.loggingUtils.info('\n💡 Code Analysis Error Suggestions:');

    if (errorMessage.includes('analyzers') || errorMessage.includes('Roslyn')) {
      this.loggingUtils.info(
        '   • Install Roslyn analyzers: dotnet add package Microsoft.CodeAnalysis.Analyzers'
      );
      this.loggingUtils.info('   • Configure analyzers in .editorconfig');
      this.loggingUtils.info('   • Install StyleCop if using StyleCop analyzers');
    }

    if (errorMessage.includes('format') || errorMessage.includes('dotnet-format')) {
      this.loggingUtils.info('   • Install dotnet-format: dotnet tool install -g dotnet-format');
      this.loggingUtils.info('   • Run dotnet format to fix formatting issues');
      this.loggingUtils.info('   • Configure formatting rules in .editorconfig');
    }

    if (errorMessage.includes('diagnostic') || errorMessage.includes('rule')) {
      this.loggingUtils.info('   • Check .editorconfig for rule configuration');
      this.loggingUtils.info('   • Suppress specific rules: #pragma warning disable');
      this.loggingUtils.info('   • Update analyzer packages');
    }
  }

  _suggestFormatFix(errorMessage) {
    this.loggingUtils.info('\n💡 Formatting Error Suggestions:');

    if (errorMessage.includes('dotnet-format') || errorMessage.includes('not installed')) {
      this.loggingUtils.info('   • Install dotnet-format: dotnet tool install -g dotnet-format');
      this.loggingUtils.info('   • Update dotnet-format: dotnet tool update -g dotnet-format');
      this.loggingUtils.info('   • Run dotnet format --check to see formatting issues');
    }

    if (errorMessage.includes('editorconfig') || errorMessage.includes('.editorconfig')) {
      this.loggingUtils.info('   • Create .editorconfig file in project root');
      this.loggingUtils.info('   • Configure formatting rules in .editorconfig');
      this.loggingUtils.info('   • Use Visual Studio to generate .editorconfig');
    }

    if (errorMessage.includes('whitespace') || errorMessage.includes('indentation')) {
      this.loggingUtils.info('   • Check .editorconfig for indentation settings');
      this.loggingUtils.info('   • Use 4 spaces for C# (default)');
      this.loggingUtils.info('   • Ensure consistent line endings (LF or CRLF)');
    }
  }

  _suggestAnalyzeFix(errorMessage) {
    this.loggingUtils.info('\n💡 Full Analysis Error Suggestions:');

    if (errorMessage.includes('all') || errorMessage.includes('diagnostics')) {
      this.loggingUtils.info('   • Run specific categories: --diagnostics style,quality');
      this.loggingUtils.info('   • Exclude categories: --exclude-diagnostics performance');
      this.loggingUtils.info('   • Check .editorconfig for enabled rules');
    }

    if (errorMessage.includes('severity') || errorMessage.includes('level')) {
      this.loggingUtils.info('   • Set rule severity in .editorconfig');
      this.loggingUtils.info(
        '   • Use: dotnet_diagnostic.<rule>.severity = error|warning|suggestion|silent'
      );
      this.loggingUtils.info(
        '   • Configure default severity: dotnet_analyzer_diagnostic.severity'
      );
    }
  }

  _suggestFixAllFix(errorMessage) {
    this.loggingUtils.info('\n💡 Fix All Error Suggestions:');

    if (errorMessage.includes('fix') || errorMessage.includes('apply')) {
      this.loggingUtils.info('   • Run specific fixes: --fix-analyzers or --fix-style');
      this.loggingUtils.info('   • Preview changes first: --dry-run');
      this.loggingUtils.info('   • Check .editorconfig for fixable rules');
    }

    if (errorMessage.includes('whitespace') || errorMessage.includes('trailing')) {
      this.loggingUtils.info('   • Configure whitespace rules in .editorconfig');
      this.loggingUtils.info(
        '   • Use: csharp_space_after_keywords_in_control_flow_statements = true'
      );
      this.loggingUtils.info('   • Check Microsoft style guide for recommendations');
    }
  }

  _suggestStyleFix(errorMessage) {
    this.loggingUtils.info('\n💡 Style Check Error Suggestions:');

    if (errorMessage.includes('style') || errorMessage.includes('convention')) {
      this.loggingUtils.info('   • Configure style rules in .editorconfig');
      this.loggingUtils.info('   • Use Microsoft.CodeAnalysis.CSharp.CodeStyle package');
      this.loggingUtils.info('   • Follow C# coding conventions');
    }

    if (errorMessage.includes('naming') || errorMessage.includes('PascalCase')) {
      this.loggingUtils.info('   • Use PascalCase for: classes, methods, properties');
      this.loggingUtils.info('   • Use camelCase for: parameters, local variables');
      this.loggingUtils.info('   • Use UPPER_CASE for: constants');
    }
  }

  async checkNamingConventions(args = [], options = {}) {
    const namingArgs = ['style', '--diagnostics', 'IDE1006', ...args];
    return this.runner.executeDotnetCommand('format', namingArgs, options);
  }

  async checkUsingDirectives(args = [], options = {}) {
    const usingArgs = ['style', '--diagnostics', 'IDE0005,IDE0007,IDE0008', ...args];
    return this.runner.executeDotnetCommand('format', usingArgs, options);
  }

  async generateEditorConfig() {
    try {
      const fs = require('fs');
      const editorConfigPath = path.join(this.runner.projectPath, '.editorconfig');

      if (!fs.existsSync(editorConfigPath)) {
        const defaultConfig = `# EditorConfig for C# projects
root = true

[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 4

[*.cs]
# C# formatting
csharp_new_line_before_open_brace = all
csharp_new_line_before_else = true
csharp_new_line_before_catch = true
csharp_new_line_before_finally = true
csharp_new_line_before_members_in_object_initializers = true
csharp_new_line_before_members_in_anonymous_types = true
csharp_new_line_between_query_expression_clauses = true

# Naming rules
dotnet_naming_rule.types_should_be_pascal_case.severity = suggestion
dotnet_naming_rule.types_should_be_pascal_case.symbols = types
dotnet_naming_rule.types_should_be_pascal_case.style = pascal_case

dotnet_naming_rule.non_field_members_should_be_pascal_case.severity = suggestion
dotnet_naming_rule.non_field_members_should_be_pascal_case.symbols = non_field_members
dotnet_naming_rule.non_field_members_should_be_pascal_case.style = pascal_case

# Code style
dotnet_style_object_initializer = true:suggestion
dotnet_style_collection_initializer = true:suggestion
dotnet_style_explicit_tuple_names = true:suggestion
dotnet_style_null_propagation = true:suggestion
dotnet_style_coalesce_expression = true:suggestion
dotnet_style_prefer_is_null_check_over_reference_equality_method = true:suggestion`;

        fs.writeFileSync(editorConfigPath, defaultConfig);
        this.loggingUtils.info(`✅ Created .editorconfig at ${editorConfigPath}`);
        return { success: true, path: editorConfigPath };
      } else {
        this.loggingUtils.info(`📄 .editorconfig already exists at ${editorConfigPath}`);
        return { success: false, message: 'File already exists' };
      }
    } catch (error) {
      this.loggingUtils.error('Failed to generate .editorconfig:', error.message);
      throw error;
    }
  }
}

module.exports = CodeQuality;
