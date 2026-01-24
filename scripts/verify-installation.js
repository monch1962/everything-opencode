#!/usr/bin/env node
/**
 * Installation Verification Script
 * 
 * Verifies that everything-opencode is properly installed and configured
 * for use with the opencode AI coding agent.
 * 
 * Usage: node scripts/verify-installation.js
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.cyan}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    warning: `${colors.yellow}[!]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`
  }[type];
  
  console.log(`${prefix} ${message}`);
}

function checkDirectory(dirPath, description) {
  try {
    if (fs.existsSync(dirPath)) {
      log(`${description}: ${dirPath}`, 'success');
      return true;
    } else {
      log(`${description}: ${dirPath} (not found)`, 'warning');
      return false;
    }
  } catch (err) {
    log(`${description}: ${err.message}`, 'error');
    return false;
  }
}

function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      log(`${description}: ${filePath} (${stats.size} bytes)`, 'success');
      return true;
    } else {
      log(`${description}: ${filePath} (not found)`, 'warning');
      return false;
    }
  } catch (err) {
    log(`${description}: ${err.message}`, 'error');
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    log(`${description}: ${command}`, 'success');
    return true;
  } catch (err) {
    log(`${description}: ${command} (failed)`, 'warning');
    return false;
  }
}

function checkEnvironmentVariable(varName) {
  const value = process.env[varName];
  if (value) {
    log(`${varName}: ${value}`, 'success');
    return true;
  } else {
    log(`${varName}: (not set)`, 'warning');
    return false;
  }
}

async function main() {
  console.log(`\n${colors.bold}=== Everything opencode Installation Verification ===${colors.reset}\n`);
  
  let passed = 0;
  let total = 0;
  
  // Check project structure
  console.log(`${colors.bold}1. Project Structure:${colors.reset}`);
  
  total++; if (checkDirectory('.', 'Project root')) passed++;
  total++; if (checkDirectory('.opencode-plugin', 'Plugin config directory')) passed++;
  total++; if (checkDirectory('agents', 'Agents directory')) passed++;
  total++; if (checkDirectory('skills', 'Skills directory')) passed++;
  total++; if (checkDirectory('commands', 'Commands directory')) passed++;
  total++; if (checkDirectory('rules', 'Rules directory')) passed++;
  total++; if (checkDirectory('hooks', 'Hooks directory')) passed++;
  total++; if (checkDirectory('scripts', 'Scripts directory')) passed++;
  total++; if (checkDirectory('tests', 'Tests directory')) passed++;
  
  // Check essential files
  console.log(`\n${colors.bold}2. Essential Files:${colors.reset}`);
  
  total++; if (checkFile('README.md', 'README documentation')) passed++;
  total++; if (checkFile('AGENTS.md', 'Agent guidelines')) passed++;
  total++; if (checkFile('CONTRIBUTING.md', 'Contribution guidelines')) passed++;
  total++; if (checkFile('.opencode-plugin/plugin.json', 'Plugin configuration')) passed++;
  total++; if (checkFile('hooks/hooks.json', 'Hooks configuration')) passed++;
  total++; if (checkFile('scripts/lib/utils.js', 'Utilities library')) passed++;
  
  // Check opencode configuration
  console.log(`\n${colors.bold}3. Opencode Configuration:${colors.reset}`);
  
  const opencodeDir = path.join(process.env.HOME || process.env.USERPROFILE, '.opencode');
  total++; if (checkDirectory(opencodeDir, 'Opencode home directory')) passed++;
  
  const sessionsDir = path.join(opencodeDir, 'sessions');
  total++; if (checkDirectory(sessionsDir, 'Sessions directory')) passed++;
  
  // Check environment variables
  console.log(`\n${colors.bold}4. Environment Variables:${colors.reset}`);
  
  total++; if (checkEnvironmentVariable('OPENCODE_PLUGIN_ROOT')) passed++;
  
  // Check Node.js and npm
  console.log(`\n${colors.bold}5. System Requirements:${colors.reset}`);
  
  total++; if (checkCommand('node --version', 'Node.js version')) passed++;
  total++; if (checkCommand('npm --version', 'npm version')) passed++;
  
  // Check test suite
  console.log(`\n${colors.bold}6. Test Suite:${colors.reset}`);
  
  total++; if (checkFile('tests/run-all.js', 'Test suite runner')) passed++;
  
  try {
    execSync('node tests/run-all.js', { stdio: 'pipe' });
    log('Test suite execution: passed', 'success');
    passed++;
  } catch (err) {
    log('Test suite execution: failed', 'warning');
  }
  total++;
  
  // Summary
  console.log(`\n${colors.bold}=== Verification Summary ===${colors.reset}`);
  console.log(`Total checks: ${total}`);
  console.log(`Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`Failed/Warnings: ${total - passed}`);
  
  const percentage = Math.round((passed / total) * 100);
  console.log(`Success rate: ${percentage}%`);
  
  if (percentage >= 90) {
    console.log(`\n${colors.green}${colors.bold}✓ Installation verification successful!${colors.reset}`);
    console.log('Everything opencode is ready for use with opencode.');
  } else if (percentage >= 70) {
    console.log(`\n${colors.yellow}${colors.bold}! Installation partially successful${colors.reset}`);
    console.log('Some checks failed. Review warnings above.');
  } else {
    console.log(`\n${colors.red}${colors.bold}✗ Installation verification failed${colors.reset}`);
    console.log('Multiple critical checks failed. Review errors above.');
  }
  
  // Provide next steps
  console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
  console.log('1. Add this plugin to opencode using:');
  console.log('   opencode plugin add /path/to/everything-opencode');
  console.log('2. Verify plugin is loaded:');
  console.log('   opencode plugin list');
  console.log('3. Test a command:');
  console.log('   opencode /help');
  
  process.exit(percentage >= 90 ? 0 : 1);
}

main().catch(err => {
  console.error(`${colors.red}[FATAL]${colors.reset} Verification failed:`, err.message);
  process.exit(1);
});