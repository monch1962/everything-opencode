#!/usr/bin/env node
/**
 * C#/.NET Setup Command
 *
 * Interactive setup for C#/.NET projects
 */

const CSharpConfigWizard = require('../../languages/csharp/config-wizard');

async function main() {
  try {
    const projectPath = process.cwd();
    const wizard = new CSharpConfigWizard(projectPath);

    console.log('🚀 C#/.NET Project Setup\n');

    // Run the configuration wizard
    const config = await wizard.runWizard();

    if (config) {
      console.log('\n✅ Setup completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('  1. Run /csharp-build to build your project');
      console.log('  2. Run /csharp-test to test your project');
      console.log('  3. Run /csharp-dev to start development server');
      console.log('  4. Run /csharp-lint to check code quality');
      console.log('  5. Run /csharp-format to format your code');

      if (config.csharp.framework === 'aspnetcore') {
        console.log('  6. Run /csharp-dev --watch for hot reload');
      }

      if (config.csharp.testFramework === 'xunit') {
        console.log('  7. Run /csharp-test --coverage for test coverage');
      }
    } else {
      console.log('\n❌ Setup failed. Please check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
