#!/usr/bin/env node
/**
 * Elixir Configuration Wizard
 *
 * Interactive wizard for configuring Elixir projects in opencode
 */

const InteractivePrompts = require('../../scripts/interactive/prompts');
const ProjectDetector = require('../../scripts/interactive/project-detector');
const ConfigManager = require('../../scripts/interactive/config-manager');
const ElixirToolDetector = require('./tool-detector-new');

class ElixirConfigWizard {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.prompts = new InteractivePrompts();
    this.detector = new ProjectDetector(projectPath);
    this.configManager = new ConfigManager(projectPath);
    this.toolDetector = new ElixirToolDetector();
    this.config = null;
  }

  /**
   * Run the complete Elixir configuration wizard
   */
  async run() {
    try {
      this.prompts.header('🧪 Elixir Project Configuration');

      // Step 1: Detect Elixir project
      const elixirDetection = await this.detectElixirProject();
      if (!elixirDetection.isElixir) {
        this.prompts.error('This does not appear to be an Elixir project.');
        return false;
      }

      // Step 2: Detect project type
      const projectType = await this.detectProjectType();

      // Step 3: Detect existing tools
      const detectedTools = await this.detectTools();

      // Step 4: Interactive configuration
      const userConfig = await this.interactiveConfiguration(projectType, detectedTools);

      // Step 5: Save configuration
      const saved = await this.saveConfiguration(userConfig);

      // Step 6: Provide next steps
      await this.provideNextSteps(userConfig, detectedTools);

      return saved;
    } catch (error) {
      this.prompts.error(`Configuration failed: ${error.message}`);
      return false;
    } finally {
      this.prompts.close();
    }
  }

  /**
   * Detect if this is an Elixir project
   */
  async detectElixirProject() {
    this.prompts.info('Detecting Elixir project...');

    const summary = await this.detector.getProjectSummary();
    const elixirResult = summary.languages.find((lang) => lang.language === 'elixir');

    if (!elixirResult || elixirResult.confidence < 0.3) {
      return {
        isElixir: false,
        confidence: elixirResult?.confidence || 0,
        indicators: elixirResult?.indicators || [],
      };
    }

    this.prompts.success(
      `Detected Elixir project with ${Math.round(elixirResult.confidence * 100)}% confidence`
    );

    if (elixirResult.indicators.length > 0) {
      this.prompts.info('Indicators found:');
      elixirResult.indicators.slice(0, 5).forEach((indicator) => {
        console.log(`  • ${indicator}`);
      });
    }

    return {
      isElixir: true,
      confidence: elixirResult.confidence,
      indicators: elixirResult.indicators,
      files: elixirResult.files,
    };
  }

  /**
   * Detect Elixir project type
   */
  async detectProjectType() {
    this.prompts.info('Detecting project type...');

    const projectTypes = [
      { id: 'standard', name: 'Standard Elixir Application', description: 'Basic Elixir application' },
      { id: 'phoenix', name: 'Phoenix Web Application', description: 'Full-stack web framework' },
      { id: 'library', name: 'Elixir Library', description: 'Reusable library/package' },
      { id: 'umbrella', name: 'Umbrella Project', description: 'Multi-application project' },
      { id: 'nerves', name: 'Nerves Embedded', description: 'Embedded systems with Elixir' },
      { id: 'liveview', name: 'Phoenix LiveView', description: 'Real-time Phoenix applications' },
    ];

    // Check for specific indicators
    const summary = await this.detector.getProjectSummary();
    const indicators = summary.indicators || [];

    let detectedType = 'standard';
    let detectionReason = 'Standard Elixir application structure';

    // Check for Phoenix
    if (indicators.some(i => i.includes('phoenix') || i.includes('phx'))) {
      detectedType = 'phoenix';
      detectionReason = 'Phoenix framework detected';
    }
    // Check for umbrella project
    else if (indicators.some(i => i.includes('umbrella') || summary.files?.some(f => f.includes('apps/')))) {
      detectedType = 'umbrella';
      detectionReason = 'Umbrella project structure detected';
    }
    // Check for library
    else if (summary.files?.some(f => f.includes('mix.exs')) && 
             !summary.files?.some(f => f.includes('lib/') && f.endsWith('.ex') && f.includes('web/'))) {
      detectedType = 'library';
      detectionReason = 'Library package structure detected';
    }

    this.prompts.success(`Detected project type: ${detectedType}`);
    this.prompts.info(`Reason: ${detectionReason}`);

    // Ask user to confirm or choose different type
    const selectedType = await this.prompts.select(
      'Confirm or select project type:',
      projectTypes.map(t => ({ value: t.id, label: t.name, description: t.description })),
      detectedType
    );

    return selectedType;
  }

  /**
   * Detect existing Elixir tools
   */
  async detectTools() {
    this.prompts.info('Detecting Elixir tools and dependencies...');

    const detectedTools = await this.toolDetector.detectTools();

    // Count installed tools
    const installedTools = Object.values(detectedTools).filter(tool => tool.installed).length;
    const totalTools = Object.keys(detectedTools).length;

    this.prompts.success(`Detected ${installedTools} of ${totalTools} Elixir tools`);

    // Show key tools status
    const keyTools = ['elixir', 'mix', 'hex', 'credo', 'sobelow', 'ex_doc'];
    this.prompts.info('Key tools status:');
    
    for (const toolName of keyTools) {
      const tool = detectedTools[toolName];
      if (tool && tool.installed) {
        const version = tool.version ? `v${tool.version}` : 'installed';
        console.log(`  ✅ ${toolName.padEnd(10)} ${version}`);
      } else {
        console.log(`  ❌ ${toolName.padEnd(10)} not installed`);
      }
    }

    return detectedTools;
  }

  /**
   * Interactive configuration based on project type and detected tools
   */
  async interactiveConfiguration(projectType, detectedTools) {
    this.prompts.header('⚙️ Configuration Options');

    const config = {
      projectType,
      elixir: {},
      tools: {},
      linting: {},
      testing: {},
      formatting: {},
      security: {},
    };

    // Elixir version configuration
    const elixirVersion = detectedTools.elixirInfo?.elixirVersion;
    if (elixirVersion) {
      config.elixir.version = elixirVersion;
      this.prompts.success(`Elixir version: ${elixirVersion}`);
    } else {
      const versionChoice = await this.prompts.select(
        'Select Elixir version:',
        [
          { value: '1.19', label: '1.19 (Latest stable)' },
          { value: '1.18', label: '1.18 (Previous stable)' },
          { value: '1.17', label: '1.17 (Older stable)' },
          { value: 'custom', label: 'Custom version' },
        ],
        '1.19'
      );

      if (versionChoice === 'custom') {
        config.elixir.version = await this.prompts.input('Enter custom Elixir version:');
      } else {
        config.elixir.version = versionChoice;
      }
    }

    // Erlang/OTP version
    const erlangVersion = detectedTools.erlangInfo?.otpVersion;
    if (erlangVersion) {
      config.elixir.erlangVersion = erlangVersion;
      this.prompts.success(`Erlang/OTP version: ${erlangVersion}`);
    }

    // Tool selection
    config.tools = await this.configureTools(detectedTools);

    // Linting configuration
    config.linting = await this.configureLinting(detectedTools);

    // Testing configuration
    config.testing = await this.configureTesting(projectType);

    // Formatting configuration
    config.formatting = await this.configureFormatting();

    // Security configuration
    config.security = await this.configureSecurity(detectedTools);

    // Additional project-specific configuration
    if (projectType === 'phoenix') {
      config.phoenix = await this.configurePhoenix();
    } else if (projectType === 'umbrella') {
      config.umbrella = await this.configureUmbrella();
    } else if (projectType === 'nerves') {
      config.nerves = await this.configureNerves();
    }

    return config;
  }

  /**
   * Configure Elixir tools
   */
  async configureTools(detectedTools) {
    const toolsConfig = {};

    // Package manager (always Hex for Elixir)
    toolsConfig.packageManager = 'hex';

    // Build tool (always Mix for Elixir)
    toolsConfig.buildTool = 'mix';

    // Documentation tool
    const exDocInstalled = detectedTools.ex_doc?.installed;
    if (exDocInstalled) {
      toolsConfig.documentation = 'ex_doc';
    } else {
      const installExDoc = await this.prompts.confirm('Install ex_doc for documentation generation?', true);
      toolsConfig.documentation = installExDoc ? 'ex_doc' : 'none';
    }

    // Coverage tool
    const excoverallsInstalled = detectedTools.excoveralls?.installed;
    if (excoverallsInstalled) {
      toolsConfig.coverage = 'excoveralls';
    } else {
      const installCoverage = await this.prompts.confirm('Install excoveralls for test coverage?', false);
      toolsConfig.coverage = installCoverage ? 'excoveralls' : 'none';
    }

    return toolsConfig;
  }

  /**
   * Configure linting options
   */
  async configureLinting(detectedTools) {
    const lintingConfig = {
      enabled: true,
      tools: [],
    };

    // Credo (highly recommended for Elixir)
    const credoInstalled = detectedTools.credo?.installed;
    if (credoInstalled) {
      lintingConfig.tools.push('credo');
      this.prompts.success('Credo linting enabled (already installed)');
    } else {
      const installCredo = await this.prompts.confirm('Install Credo for static code analysis?', true);
      if (installCredo) {
        lintingConfig.tools.push('credo');
      }
    }

    // Dialyzer for type checking
    const dialyzerInstalled = detectedTools.dialyzer?.installed;
    if (dialyzerInstalled) {
      lintingConfig.tools.push('dialyzer');
      this.prompts.success('Dialyzer type checking enabled (already installed)');
    } else {
      const installDialyzer = await this.prompts.confirm('Enable Dialyzer for success typing analysis?', false);
      if (installDialyzer) {
        lintingConfig.tools.push('dialyzer');
      }
    }

    return lintingConfig;
  }

  /**
   * Configure testing options
   */
  async configureTesting(projectType) {
    const testingConfig = {
      enabled: true,
      framework: 'exunit', // Elixir's built-in testing framework
      async: true,
      coverage: true,
      reporters: ['exunit'],
    };

    // Additional test tools based on project type
    if (projectType === 'phoenix') {
      testingConfig.integration = true;
      testingConfig.browser = await this.prompts.confirm('Enable browser testing with Wallaby/Hound?', false);
      
      if (testingConfig.browser) {
        const browserTool = await this.prompts.select(
          'Select browser testing tool:',
          [
            { value: 'wallaby', label: 'Wallaby (concurrent browser testing)' },
            { value: 'hound', label: 'Hound (browser automation)' },
          ],
          'wallaby'
        );
        testingConfig.browserTool = browserTool;
      }
    }

    // Property-based testing
    const enablePropertyTesting = await this.prompts.confirm('Enable property-based testing with StreamData?', false);
    if (enablePropertyTesting) {
      testingConfig.propertyBased = true;
    }

    return testingConfig;
  }

  /**
   * Configure formatting options
   */
  async configureFormatting() {
    const formattingConfig = {
      enabled: true,
      tool: 'mix_format', // Elixir's built-in formatter
      checkInCI: true,
      autoFormat: await this.prompts.confirm('Enable auto-format on save?', true),
    };

    // Additional formatting rules
    formattingConfig.rules = await this.prompts.multiSelect(
      'Select additional formatting rules:',
      [
        { value: 'imports', label: 'Sort imports alphabetically' },
        { value: 'aliases', label: 'Sort module aliases' },
        { value: 'pipes', label: 'Format multi-line pipes' },
        { value: 'specs', label: 'Format type specifications' },
      ],
      ['imports', 'aliases']
    );

    return formattingConfig;
  }

  /**
   * Configure security options
   */
  async configureSecurity(detectedTools) {
    const securityConfig = {
      enabled: true,
      tools: [],
    };

    // Sobelow for Phoenix security
    const sobelowInstalled = detectedTools.sobelow?.installed;
    if (sobelowInstalled) {
      securityConfig.tools.push('sobelow');
      this.prompts.success('Sobelow security scanning enabled (already installed)');
    } else {
      const installSobelow = await this.prompts.confirm('Install Sobelow for security-focused static analysis?', true);
      if (installSobelow) {
        securityConfig.tools.push('sobelow');
      }
    }

    // Mix audit for dependency security
    const mixAuditInstalled = detectedTools.mix_audit?.installed;
    if (mixAuditInstalled) {
      securityConfig.tools.push('mix_audit');
      this.prompts.success('Mix audit enabled (already installed)');
    } else {
      const installMixAudit = await this.prompts.confirm('Install mix_audit for dependency security auditing?', true);
      if (installMixAudit) {
        securityConfig.tools.push('mix_audit');
      }
    }

    // Additional security checks
    securityConfig.checks = await this.prompts.multiSelect(
      'Select additional security checks:',
      [
        { value: 'hardcoded_secrets', label: 'Check for hardcoded secrets' },
        { value: 'sql_injection', label: 'SQL injection detection' },
        { value: 'xss', label: 'Cross-site scripting detection' },
        { value: 'csrf', label: 'CSRF protection verification' },
      ],
      ['hardcoded_secrets', 'sql_injection']
    );

    return securityConfig;
  }

  /**
   * Configure Phoenix-specific options
   */
  async configurePhoenix() {
    const phoenixConfig = {};

    phoenixConfig.version = await this.prompts.select(
      'Select Phoenix version:',
      [
        { value: '1.7', label: '1.7 (Latest)' },
        { value: '1.6', label: '1.6 (Previous)' },
        { value: '1.5', label: '1.5 (Stable)' },
      ],
      '1.7'
    );

    phoenixConfig.database = await this.prompts.select(
      'Select database adapter:',
      [
        { value: 'postgres', label: 'PostgreSQL (Recommended)' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'sqlite', label: 'SQLite (Development)' },
        { value: 'none', label: 'No database' },
      ],
      'postgres'
    );

    phoenixConfig.liveView = await this.prompts.confirm('Enable Phoenix LiveView?', true);
    
    if (phoenixConfig.liveView) {
      phoenixConfig.liveViewVersion = await this.prompts.select(
        'Select LiveView version:',
        [
          { value: '0.20', label: '0.20 (Latest)' },
          { value: '0.19', label: '0.19 (Previous)' },
        ],
        '0.20'
      );
    }

    phoenixConfig.authentication = await this.prompts.confirm('Add authentication boilerplate?', false);
    
    if (phoenixConfig.authentication) {
      phoenixConfig.authStrategy = await this.prompts.select(
        'Select authentication strategy:',
        [
          { value: 'session', label: 'Session-based' },
          { value: 'jwt', label: 'JWT tokens' },
          { value: 'oauth', label: 'OAuth 2.0' },
        ],
        'session'
      );
    }

    return phoenixConfig;
  }

  /**
   * Configure umbrella project options
   */
  async configureUmbrella() {
    const umbrellaConfig = {};

    const appCount = await this.prompts.number(
      'How many applications in the umbrella?',
      2,
      1,
      20
    );

    umbrellaConfig.applications = [];
    
    for (let i = 1; i <= appCount; i++) {
      const appName = await this.prompts.input(`Name of application ${i}:`, `app_${i}`);
      const appType = await this.prompts.select(
        `Type of application ${i}:`,
        [
          { value: 'standard', label: 'Standard Elixir' },
          { value: 'phoenix', label: 'Phoenix web' },
          { value: 'library', label: 'Library' },
        ],
        'standard'
      );

      umbrellaConfig.applications.push({
        name: appName,
        type: appType,
      });
    }

    umbrellaConfig.sharedDependencies = await this.prompts.confirm('Create shared dependencies?', true);
    umbrellaConfig.sharedConfig = await this.prompts.confirm('Use shared configuration?', true);

    return umbrellaConfig;
  }

  /**
   * Configure Nerves embedded options
   */
  async configureNerves() {
    const nervesConfig = {};

    nervesConfig.target = await this.prompts.select(
      'Select target hardware:',
      [
        { value: 'rpi', label: 'Raspberry Pi' },
        { value: 'rpi0', label: 'Raspberry Pi Zero' },
        { value: 'bbb', label: 'BeagleBone Black' },
        { value: 'custom', label: 'Custom target' },
      ],
      'rpi'
    );

    if (nervesConfig.target === 'custom') {
      nervesConfig.customTarget = await this.prompts.input('Enter custom target name:');
    }

    nervesConfig.firmware = await this.prompts.confirm('Generate firmware configuration?', true);
    
    if (nervesConfig.firmware) {
      nervesConfig.firmwareOptions = await this.prompts.multiSelect(
        'Select firmware features:',
        [
          { value: 'nerves_network', label: 'Network support' },
          { value: 'nerves_time', label: 'Time synchronization' },
          { value: 'nerves_firmware', label: 'Firmware updates' },
          { value: 'nerves_runtime', label: 'Runtime utilities' },
        ],
        ['nerves_network', 'nerves_time']
      );
    }

    return nervesConfig;
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(userConfig) {
    this.prompts.info('Saving configuration...');

    const configPath = await this.configManager.saveConfig('elixir', userConfig);
    
    if (configPath) {
      this.prompts.success(`Configuration saved to: ${configPath}`);
      
      // Also create .formatter.exs for Elixir projects
      await this.createFormatterConfig(userConfig);
      
      // Create .credo.exs if Credo is enabled
      if (userConfig.linting.tools.includes('credo')) {
        await this.createCredoConfig(userConfig);
      }
      
      return true;
    } else {
      this.prompts.error('Failed to save configuration');
      return false;
    }
  }

  /**
   * Create .formatter.exs configuration
   */
  async createFormatterConfig(userConfig) {
    const formatterConfig = {
      import_deps: [:ecto, :phoenix],
      inputs: ["*.{ex,exs}", "priv/*/seeds.exs", "{config,lib,test}/**/*.{ex,exs}"],
      line_length: 80,
    };

    // Add project-specific inputs
    if (userConfig.projectType === 'umbrella') {
      formatterConfig.inputs = ["*/{config,lib,test}/**/*.{ex,exs}", "*.exs"];
      formatterConfig.subdirectories = userConfig.umbrella?.applications?.map(app => app.name) || [];
    }

    const formatterPath = `${this.projectPath}/.formatter.exs`;
    const fs = require('fs');
    
    try {
      fs.writeFileSync(formatterPath, `# .formatter.exs\n${JSON.stringify(formatterConfig, null, 2)}`);
      this.prompts.success(`Created .formatter.exs at: ${formatterPath}`);
    } catch (error) {
      this.prompts.warn(`Could not create .formatter.exs: ${error.message}`);
    }
  }

  /**
   * Create .credo.exs configuration
   */
  async createCredoConfig(userConfig) {
    const credoConfig = {
      %{
        configs: [
          %{
            name: "default",
            files: %{
              included: ["lib/", "src/", "test/", "web/", "apps/"],
              excluded: []
            },
            checks: [
              {Credo.Check.Consistency.TabsOrSpaces},
              {Credo.Check.Design.AliasUsage, priority: :low},
              {Credo.Check.Readability.MaxLineLength, priority: :low, max_length: 80},
              {Credo.Check.Readability.ModuleDoc, false},
              {Credo.Check.Readability.PreferImplicitTry, false},
              {Credo.Check.Refactor.MapInto, false},
              {Credo.Check.Warning.LazyLogging, false},
            ]
          }
        ]
      }
    };

    const credoPath = `${this.projectPath}/.credo.exs`;
    const fs = require('fs');
    
    try {
      // For simplicity, we'll create a basic Credo config
      const basicConfig = `%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "src/", "test/", "web/", "apps/"],
        excluded: []
      },
      checks: [
        {Credo.Check.Consistency.TabsOrSpaces},
        {Credo.Check.Readability.MaxLineLength, priority: :low, max_length: 80}
      ]
    }
  ]
}`;
      
      fs.writeFileSync(credoPath, basicConfig);
      this.prompts.success(`Created .credo.exs at: ${credoPath}`);
    } catch (error) {
      this.prompts.warn(`Could not create .credo.exs: ${error.message}`);
    }
  }

  /**
   * Provide next steps after configuration
   */
  async provideNextSteps(userConfig, detectedTools) {
    this.prompts.header('🎉 Configuration Complete!');
    
    console.log('\nNext steps:');
    console.log('1. Review your configuration:');
    console.log(`   • Project type: ${userConfig.projectType}`);
    console.log(`   • Elixir version: ${userConfig.elixir.version}`);
    
    if (userConfig.linting.tools.length > 0) {
      console.log(`   • Linting: ${userConfig.linting.tools.join(', ')}`);
    }
    
    if (userConfig.security.tools.length > 0) {
      console.log(`   • Security: ${userConfig.security.tools.join(', ')}`);
    }
    
    console.log('\n2. Install missing tools:');
    
    const missingTools = [];
    if (userConfig.linting.tools.includes('credo') && !detectedTools.credo?.installed) {
      missingTools.push('credo');
    }
    if (userConfig.security.tools.includes('sobelow') && !detectedTools.sobelow?.installed) {
      missingTools.push('sobelow');
    }
    if (userConfig.security.tools.includes('mix_audit') && !detectedTools.mix_audit?.installed) {
      missingTools.push('mix_audit');
    }
    
    if (missingTools.length > 0) {
      console.log(`   Run: mix archive.install hex ${missingTools.join(' ')} --force`);
    } else {
      console.log('   All required tools are installed!');
    }
    
    console.log('\n3. Available commands:');
    console.log('   • /elixir-setup    - Configure Elixir project');
    console.log('   • /elixir-compile  - Compile Elixir code');
    console.log('   • /elixir-test     - Run tests');
    console.log('   • /elixir-lint     - Lint code');
    console.log('   • /elixir-format   - Format code');
    console.log('   • /elixir-deps     - Manage dependencies');
    console.log('   • /elixir-typecheck - Type checking');
    console.log('   • /elixir-security - Security scanning');
    console.log('   • /elixir-run      - Run Elixir applications');
    
    console.log('\n4. Get started:');
    console.log('   • Run tests: /elixir-test');
    console.log('   • Format code: /elixir-format --write');
    console.log('   • Lint code: /elixir-lint');
    
    this.prompts.success('\nYour Elixir project is ready! 🚀');
  }
}

module.exports = ElixirConfigWizard;