#!/usr/bin/env node
/**
 * Refactored Command Runners Validation Script
 *
 * Validates that all refactored command runners work correctly
 * and maintain backward compatibility
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runCommand(command, description) {
  log(`Running: ${description}`);
  try {
    const result = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    log(`Success: ${description}`);
    return { success: true, output: result };
  } catch (error) {
    log(`Failed: ${description} - ${error.message}`, 'error');
    return { success: false, error: error.message, output: error.stdout };
  }
}

function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`File exists: ${filePath}`);
  } else {
    log(`File missing: ${filePath}`, 'error');
  }
  return exists;
}

function checkModuleStructure(modulePath) {
  log(`Checking module structure: ${modulePath}`);

  if (!fs.existsSync(modulePath)) {
    log(`Module directory missing: ${modulePath}`, 'error');
    return false;
  }

  const files = fs.readdirSync(modulePath);
  const jsFiles = files.filter((file) => file.endsWith('.js'));

  if (jsFiles.length === 0) {
    log(`No JavaScript files in module directory: ${modulePath}`, 'error');
    return false;
  }

  log(`Found ${jsFiles.length} module files in ${modulePath}`);
  return true;
}

function checkRefactoredFile(filePath) {
  log(`Checking refactored file: ${filePath}`);

  if (!checkFileExists(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Check for module imports
    const hasModuleImports = content.includes('require(') && content.includes('modules/');
    const hasClassDefinition = content.includes('class ');
    const hasExports = content.includes('module.exports');

    if (!hasModuleImports) {
      log(`Refactored file doesn't import modules: ${filePath}`, 'warning');
    }

    if (!hasClassDefinition) {
      log(`Refactored file doesn't have class definition: ${filePath}`, 'error');
      return false;
    }

    if (!hasExports) {
      log(`Refactored file doesn't export anything: ${filePath}`, 'error');
      return false;
    }

    log(`Refactored file structure looks good: ${filePath}`);
    return true;
  } catch (error) {
    log(`Error reading file ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

function checkCommandFiles(language) {
  log(`Checking ${language} command files`);

  const commandDir = path.join(__dirname, 'commands');

  // Handle special case for JavaScript (uses js- prefix)
  const prefix = language === 'javascript' ? 'js-' : `${language}-`;
  const commandFiles = fs
    .readdirSync(commandDir)
    .filter((file) => file.startsWith(prefix) && file.endsWith('.js'));

  if (commandFiles.length === 0) {
    log(`No ${language} command files found`, 'error');
    return false;
  }

  let allGood = true;
  for (const file of commandFiles) {
    const filePath = path.join(commandDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check if it uses refactored version
      const usesRefactored = content.includes(`${language}-command-runner-refactored`);
      const usesOriginal = content.includes(`../${language}/command-runner`);
      const isSetupFile = file.includes('-setup.js');
      const usesConfigWizard = content.includes('config-wizard');

      if (usesRefactored) {
        log(`Command file uses refactored runner: ${file}`);
      } else if (usesOriginal) {
        log(`Command file uses original runner: ${file}`, 'warning');
      } else if (isSetupFile && usesConfigWizard) {
        log(`Setup file uses config wizard (expected): ${file}`);
      } else {
        log(`Command file doesn't import any runner: ${file}`, 'error');
        allGood = false;
      }
    } catch (error) {
      log(`Error reading command file ${file}: ${error.message}`, 'error');
      allGood = false;
    }
  }

  return allGood;
}

function validateCommandRunner(language) {
  console.log(`\n=== Validating ${language.toUpperCase()} Command Runner ===`);

  const refactoredFile = path.join(__dirname, language, `${language}-command-runner-refactored.js`);
  const modulesDir = path.join(__dirname, language, `${language}-command-runner-modules`);
  const originalFile = path.join(__dirname, language, 'command-runner.js');

  let checks = 0;
  let passed = 0;

  // Check refactored file exists
  checks++;
  if (checkRefactoredFile(refactoredFile)) {
    passed++;
  }

  // Check modules directory exists
  checks++;
  if (checkModuleStructure(modulesDir)) {
    passed++;
  }

  // Check original file exists (for comparison)
  checks++;
  if (checkFileExists(originalFile)) {
    passed++;

    // Compare file sizes
    try {
      const originalStats = fs.statSync(originalFile);
      const refactoredStats = fs.statSync(refactoredFile);
      const reduction = (
        ((originalStats.size - refactoredStats.size) / originalStats.size) *
        100
      ).toFixed(1);
      log(`Size reduction: ${reduction}% (${originalStats.size} → ${refactoredStats.size} bytes)`);
    } catch (error) {
      log(`Could not compare file sizes: ${error.message}`, 'warning');
    }
  }

  // Check command files
  checks++;
  if (checkCommandFiles(language)) {
    passed++;
  }

  log(`${language.toUpperCase()}: ${passed}/${checks} checks passed`);
  return passed === checks;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Refactored Command Runners Validation                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const languages = ['go', 'elixir', 'javascript', 'rust'];

  let totalChecks = 0;
  let totalPassed = 0;
  const results = {};

  for (const language of languages) {
    const isValid = validateCommandRunner(language);
    results[language] = isValid;

    if (isValid) {
      totalPassed++;
    }
    totalChecks++;
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                     Validation Results                   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');

  for (const [language, isValid] of Object.entries(results)) {
    const status = isValid ? '✓ PASS' : '✗ FAIL';
    console.log(`║  ${language.padEnd(12)} ${status.padEnd(10)}                         ║`);
  }

  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total: ${totalPassed}/${totalChecks} languages validated          ║`);

  if (totalPassed === totalChecks) {
    console.log('║  ✅ All refactored command runners are valid!           ║');
  } else {
    console.log('║  ❌ Some refactored command runners need attention      ║');
  }

  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Run tests to ensure everything still works
  console.log('Running comprehensive tests...');
  const testResult = runCommand('npm test', 'Run all tests');

  if (testResult.success) {
    log('All tests passed!');
  } else {
    log('Tests failed!', 'error');
    console.log(testResult.output);
  }

  process.exit(totalPassed === totalChecks && testResult.success ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = {
  validateCommandRunner,
  checkRefactoredFile,
  checkModuleStructure,
  checkCommandFiles,
};
