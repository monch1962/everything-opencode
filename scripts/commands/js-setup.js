#!/usr/bin/env node
/**
 * JavaScript/TypeScript Setup Command
 *
 * Interactive setup for JavaScript/TypeScript projects
 */

const JSConfigWizard = require('../../languages/javascript/config-wizard');

async function main() {
  try {
    const projectPath = process.cwd();
    const wizard = new JSConfigWizard(projectPath);

    console.log('🚀 JavaScript/TypeScript Project Setup\n');

    // Run the configuration wizard
    const config = await wizard.runWizard();

    if (config) {
      console.log('\n✅ Setup completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('  1. Run /js-test to test your project');
      console.log('  2. Run /js-lint to check code quality');
      console.log('  3. Run /js-dev to start development server');
      console.log('  4. Run /js-build to build your project');

      if (config.javascript.language === 'typescript') {
        console.log('  5. Run /ts-typecheck for TypeScript type checking');
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
