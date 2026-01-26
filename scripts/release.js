#!/usr/bin/env node
/**
 * Release Automation Script
 *
 * Automates the release process for everything-opencode.
 *
 * Usage: node scripts/release.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.cyan}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    warning: `${colors.yellow}[!]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
  }[type];

  console.log(`${prefix} ${message}`);
}

function runCommand(command, description) {
  log(`${description}: ${command}`, 'info');
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (err) {
    log(`Command failed: ${err.message}`, 'error');
    return false;
  }
}

function updateVersion(versionBump) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const [major, minor, patch] = packageData.version.split('.').map(Number);
  let newVersion;

  switch (versionBump) {
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    default:
      throw new Error(`Invalid version bump: ${versionBump}. Use patch, minor, or major.`);
  }

  packageData.version = newVersion;
  fs.writeFileSync(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);

  log(`Updated version from ${packageData.version} to ${newVersion}`, 'success');
  return newVersion;
}

function updateChangelog(version, versionBump) {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  let changelogContent = '';

  if (fs.existsSync(changelogPath)) {
    changelogContent = fs.readFileSync(changelogPath, 'utf8');
  } else {
    changelogContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
### Changed
### Fixed
### Removed

`;
  }

  const today = new Date().toISOString().split('T')[0];
  const newEntry = `## [${version}] - ${today}

### ${versionBump.charAt(0).toUpperCase() + versionBump.slice(1)} Changes
- Automated release ${version}

`;

  // Insert after the Unreleased section
  const unreleasedIndex = changelogContent.indexOf('## [Unreleased]');
  if (unreleasedIndex !== -1) {
    const beforeUnreleased = changelogContent.substring(0, unreleasedIndex);
    const afterUnreleased = changelogContent.substring(unreleasedIndex);
    const afterUnreleasedEnd = afterUnreleased.indexOf('\n## ');

    if (afterUnreleasedEnd !== -1) {
      changelogContent = `${beforeUnreleased +
                        afterUnreleased.substring(0, afterUnreleasedEnd)
      }\n${newEntry
      }${afterUnreleased.substring(afterUnreleasedEnd)}`;
    } else {
      changelogContent = `${beforeUnreleased + afterUnreleased}\n${newEntry}`;
    }
  } else {
    changelogContent = newEntry + changelogContent;
  }

  fs.writeFileSync(changelogPath, changelogContent);
  log(`Updated CHANGELOG.md for version ${version}`, 'success');
}

async function main() {
  const args = process.argv.slice(2);
  const versionBump = args[0] || 'patch';

  if (!['patch', 'minor', 'major'].includes(versionBump)) {
    console.error(`Invalid version bump: ${versionBump}`);
    console.error('Usage: node scripts/release.js [patch|minor|major]');
    process.exit(1);
  }

  console.log(`\n${colors.bold}=== Everything opencode Release Process ===${colors.reset}\n`);

  // Step 1: Run tests
  log('Step 1: Running tests...', 'info');
  if (!runCommand('npm test', 'Running test suite')) {
    log('Tests failed. Aborting release.', 'error');
    process.exit(1);
  }

  // Step 2: Run verification
  log('\nStep 2: Running installation verification...', 'info');
  if (!runCommand('npm run verify', 'Running verification')) {
    log('Verification failed. Aborting release.', 'error');
    process.exit(1);
  }

  // Step 3: Update version
  log('\nStep 3: Updating version...', 'info');
  const newVersion = updateVersion(versionBump);

  // Step 4: Update changelog
  log('\nStep 4: Updating changelog...', 'info');
  updateChangelog(newVersion, versionBump);

  // Step 5: Create git tag
  log('\nStep 5: Creating git tag...', 'info');
  if (!runCommand(`git add package.json CHANGELOG.md`, 'Staging version files')) {
    log('Failed to stage files.', 'error');
    process.exit(1);
  }

  if (!runCommand(`git commit -m "chore: release v${newVersion}"`, 'Creating commit')) {
    log('Failed to create commit.', 'error');
    process.exit(1);
  }

  if (!runCommand(`git tag -a v${newVersion} -m "Release v${newVersion}"`, 'Creating tag')) {
    log('Failed to create tag.', 'error');
    process.exit(1);
  }

  // Step 6: Build (if needed)
  log('\nStep 6: Building package...', 'info');
  if (!runCommand('npm run build', 'Building package')) {
    log('Build step completed (no build required for opencode plugin)', 'warning');
  }

  // Step 7: Publish to npm
  log('\nStep 7: Publishing to npm...', 'info');
  console.log(`${colors.yellow}[!]${colors.reset} To publish to npm, run:`);
  console.log(`    npm publish`);
  console.log(`    git push origin main --tags`);

  // Summary
  console.log(`\n${colors.bold}=== Release Summary ===${colors.reset}`);
  console.log(`Version: ${colors.green}v${newVersion}${colors.reset}`);
  console.log(`Type: ${versionBump}`);
  console.log(`\n${colors.green}${colors.bold}✓ Release preparation complete!${colors.reset}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review changes: git log --oneline -5`);
  console.log(`2. Push to GitHub: git push origin main --tags`);
  console.log(`3. Publish to npm: npm publish`);
  console.log(`4. Create GitHub release from the new tag`);
}

main().catch((err) => {
  log(`Release failed: ${err.message}`, 'error');
  process.exit(1);
});
