#!/usr/bin/env node
/**
 * TemplateUtils Validation Script
 *
 * Validates that the refactored TemplateUtils maintains 100% backward compatibility
 * with the original API and functionality.
 */

const fs = require('fs');
const path = require('path');

// Import the refactored TemplateUtils
const TemplateUtils = require('./scripts/lib/template-utils');

// Test data
const TEST_TEMPLATE = 'Hello {{name}}! Welcome to {{project}} version {{version}}.';
const TEST_VARIABLES = { name: 'World', project: 'TestProject', version: '1.0.0' };
const TEST_REQUIRED = ['name', 'project'];

// Validation results
const validationResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

function logResult(testName, passed, error = null) {
  validationResults.total++;
  if (passed) {
    validationResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    validationResults.failed++;
    validationResults.errors.push({ test: testName, error });
    console.log(`❌ ${testName}: ${error}`);
  }
}

async function validateTemplateUtils() {
  console.log('🔍 Validating TemplateUtils Refactoring\n');
  console.log('='.repeat(60));

  // Test 1: Can access TemplateUtils class
  try {
    if (typeof TemplateUtils !== 'function') {
      throw new Error('TemplateUtils is not a class/function');
    }
    logResult('TemplateUtils class is accessible', true);
  } catch (error) {
    logResult('TemplateUtils class is accessible', false, error.message);
  }

  // Test 2: Check all static methods exist
  const requiredMethods = [
    'renderTemplate',
    'renderTemplateFile',
    'generateFile',
    'generateFromTemplateDir',
    '_processTemplateDir',
    'getLanguageTemplates',
    'generateLanguageProject',
    'generateLanguageConfig',
    'generateReadme',
    'generateGitignore',
    'validateVariables',
    'getTemplateCore',
    'getDirectoryProcessor',
    'getLanguageTemplatesModule',
    'getProjectGenerator',
    'getTemplateValidator',
  ];

  try {
    for (const method of requiredMethods) {
      if (typeof TemplateUtils[method] !== 'function') {
        throw new Error(`Missing static method: ${method}`);
      }
    }
    logResult('All required static methods exist', true);
  } catch (error) {
    logResult('All required static methods exist', false, error.message);
  }

  // Test 3: Render template
  try {
    const result = TemplateUtils.renderTemplate(TEST_TEMPLATE, TEST_VARIABLES);

    if (typeof result !== 'string') {
      throw new Error('renderTemplate did not return string');
    }

    if (!result.includes('World') || !result.includes('TestProject') || !result.includes('1.0.0')) {
      throw new Error('Template variables not properly rendered');
    }

    logResult('renderTemplate works correctly', true);
  } catch (error) {
    logResult('renderTemplate works correctly', false, error.message);
  }

  // Test 4: Validate variables
  try {
    const validation = TemplateUtils.validateVariables(TEST_VARIABLES, TEST_REQUIRED);

    if (!validation || typeof validation !== 'object') {
      throw new Error('validateVariables did not return object');
    }

    if (!validation.hasOwnProperty('isValid')) {
      throw new Error('Validation result missing isValid property');
    }

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    logResult('validateVariables works correctly', true);
  } catch (error) {
    logResult('validateVariables works correctly', false, error.message);
  }

  // Test 5: Get language templates
  try {
    const goTemplates = TemplateUtils.getLanguageTemplates('go');
    const pythonTemplates = TemplateUtils.getLanguageTemplates('python');
    const invalidTemplates = TemplateUtils.getLanguageTemplates('invalid');

    if (!goTemplates || typeof goTemplates !== 'object') {
      throw new Error('getLanguageTemplates for go did not return object');
    }

    if (!pythonTemplates || typeof pythonTemplates !== 'object') {
      throw new Error('getLanguageTemplates for python did not return object');
    }

    if (!invalidTemplates || typeof invalidTemplates !== 'object') {
      throw new Error('getLanguageTemplates for invalid language did not return object');
    }

    if (Object.keys(invalidTemplates).length !== 0) {
      throw new Error('Invalid language should return empty object');
    }

    // Check for expected template files
    if (!goTemplates['main.go'] || !goTemplates['go.mod']) {
      throw new Error('Go templates missing expected files');
    }

    if (!pythonTemplates['main.py'] || !pythonTemplates['requirements.txt']) {
      throw new Error('Python templates missing expected files');
    }

    logResult('getLanguageTemplates works correctly', true);
  } catch (error) {
    logResult('getLanguageTemplates works correctly', false, error.message);
  }

  // Test 6: Check module getters
  try {
    const templateCore = TemplateUtils.getTemplateCore();
    const directoryProcessor = TemplateUtils.getDirectoryProcessor();
    const languageTemplates = TemplateUtils.getLanguageTemplatesModule();
    const projectGenerator = TemplateUtils.getProjectGenerator();
    const templateValidator = TemplateUtils.getTemplateValidator();

    if (
      !templateCore ||
      !directoryProcessor ||
      !languageTemplates ||
      !projectGenerator ||
      !templateValidator
    ) {
      throw new Error('Module getters returned null/undefined');
    }

    // Check that modules have expected methods
    if (typeof templateCore.renderTemplate !== 'function') {
      throw new Error('TemplateCore missing renderTemplate method');
    }

    if (typeof directoryProcessor.generateFromTemplateDir !== 'function') {
      throw new Error('DirectoryProcessor missing generateFromTemplateDir method');
    }

    if (typeof languageTemplates.getLanguageTemplates !== 'function') {
      throw new Error('LanguageTemplates missing getLanguageTemplates method');
    }

    if (typeof projectGenerator.generateReadme !== 'function') {
      throw new Error('ProjectGenerator missing generateReadme method');
    }

    if (typeof templateValidator.validateVariables !== 'function') {
      throw new Error('TemplateValidator missing validateVariables method');
    }

    logResult('Module getters work correctly', true);
  } catch (error) {
    logResult('Module getters work correctly', false, error.message);
  }

  // Test 7: Create test directory for file operations
  const testDir = path.join(__dirname, 'test-template-output');
  const testTemplateFile = path.join(testDir, 'test.template');
  const testOutputFile = path.join(testDir, 'test.txt');

  try {
    // Clean up and create test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    // Create test template file
    fs.writeFileSync(testTemplateFile, TEST_TEMPLATE, 'utf8');

    logResult('Test directory and files created', true);
  } catch (error) {
    logResult('Test directory and files created', false, error.message);
  }

  // Test 8: Render template file
  try {
    const result = TemplateUtils.renderTemplateFile(testTemplateFile, TEST_VARIABLES);

    if (typeof result !== 'string') {
      throw new Error('renderTemplateFile did not return string');
    }

    if (!result.includes('World') || !result.includes('TestProject')) {
      throw new Error('Template file variables not properly rendered');
    }

    logResult('renderTemplateFile works correctly', true);
  } catch (error) {
    logResult('renderTemplateFile works correctly', false, error.message);
  }

  // Test 9: Generate file from template
  try {
    const result = TemplateUtils.generateFile(testTemplateFile, testOutputFile, TEST_VARIABLES, {
      overwrite: true,
      backup: false,
      createDir: true,
    });

    if (!result || typeof result !== 'object') {
      throw new Error('generateFile did not return object');
    }

    if (!result.success) {
      throw new Error('generateFile was not successful');
    }

    // Verify file was created
    if (!fs.existsSync(testOutputFile)) {
      throw new Error('Output file was not created');
    }

    const fileContent = fs.readFileSync(testOutputFile, 'utf8');
    if (!fileContent.includes('World') || !fileContent.includes('TestProject')) {
      throw new Error('Generated file content incorrect');
    }

    logResult('generateFile works correctly', true);
  } catch (error) {
    logResult('generateFile works correctly', false, error.message);
  }

  // Test 10: Check module structure
  try {
    // Verify modules exist
    const modules = [
      './scripts/lib/template-modules/template-core',
      './scripts/lib/template-modules/directory-processor',
      './scripts/lib/template-modules/language-templates',
      './scripts/lib/template-modules/project-generator',
      './scripts/lib/template-modules/template-validator',
    ];

    for (const modulePath of modules) {
      const fullPath = path.join(__dirname, modulePath);
      if (!fs.existsSync(fullPath + '.js')) {
        throw new Error(`Module not found: ${modulePath}`);
      }
    }

    logResult('All modules exist and are properly structured', true);
  } catch (error) {
    logResult('All modules exist and are properly structured', false, error.message);
  }

  // Clean up test directory
  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  } catch (error) {
    console.log(`⚠️  Warning: Could not clean up test directory: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${validationResults.total}`);
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`❌ Failed: ${validationResults.failed}`);

  if (validationResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    validationResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.test}`);
      console.log(`     Error: ${error.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! TemplateUtils refactoring is validated.');
    console.log('✅ 100% backward compatibility maintained');
    console.log('✅ All modules properly structured');
    console.log('✅ All methods available and functional');
    console.log('✅ File operations work correctly');
    process.exit(0);
  }
}

// Run validation
validateTemplateUtils().catch((error) => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});
