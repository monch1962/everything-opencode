# Phase 4 Migration - Rollback Plan

## Overview

This directory contains backups of the original files before Phase 4 production migration. Use these files to rollback if any issues are encountered with the refactored modular architecture.

## Files Backed Up

### Main Files

1. `debug-server.js` - Original PineScript debug server (52,936 bytes)
2. `pine-debug.js` - Original Pine debug command (42,491 bytes)
3. `command-runner.js` - Original Clojure command runner (32,018 bytes)

### Module Directories

1. `debug-server-modules/` - 4 modular components
2. `pine-debug-modules/` - 4 modular components
3. `command-runner-modules/` - 5 modular components

## Rollback Procedures

### Option 1: Complete Rollback (Recommended)

```bash
# Restore original main files
cp backup/phase4-migration/debug-server.js scripts/pinescript/
cp backup/phase4-migration/pine-debug.js scripts/commands/
cp backup/phase4-migration/command-runner.js scripts/clojure/

# Restore module directories (if needed)
cp -r backup/phase4-migration/debug-server-modules/ scripts/pinescript/
cp -r backup/phase4-migration/pine-debug-modules/ scripts/commands/
cp -r backup/phase4-migration/command-runner-modules/ scripts/clojure/
```

### Option 2: Partial Rollback

If only specific files need to be rolled back, restore them individually:

```bash
# Example: Rollback only debug-server.js
cp backup/phase4-migration/debug-server.js scripts/pinescript/
```

### Option 3: Git Rollback

If using git, you can revert the Phase 4 commit:

```bash
# Find the Phase 4 commit hash
git log --oneline | grep "Phase 4"

# Revert the commit
git revert <commit-hash>
```

## Verification Steps

After rollback, verify the system works correctly:

1. **Run tests**:

   ```bash
   npm test
   ```

2. **Run validation**:

   ```bash
   node scripts/validate-phase2.js
   ```

3. **Check linting**:
   ```bash
   npm run lint
   ```

## Success Criteria

- All 97 unit tests pass
- All 18 integration tests pass
- Validation script shows 100% pass rate
- No linting errors

## Troubleshooting

### Issue: Module not found errors

If you see "Cannot find module" errors after rollback:

```bash
# Check if module directories exist
ls -la scripts/pinescript/debug-server-modules/
ls -la scripts/commands/pine-debug-modules/
ls -la scripts/clojure/command-runner-modules/

# If missing, restore from backup
cp -r backup/phase4-migration/debug-server-modules/ scripts/pinescript/
```

### Issue: Test failures

If tests fail after rollback:

1. Check if the original files were properly restored
2. Verify file permissions
3. Run `npm install` to ensure dependencies are up to date

## Contact

If issues persist after rollback, check the project documentation or create an issue in the repository.

## Backup Integrity

- **Backup date**: 2026-01-27
- **Backup location**: `backup/phase4-migration/`
- **Checksums**:
  - `debug-server.js`: 52,936 bytes
  - `pine-debug.js`: 42,491 bytes
  - `command-runner.js`: 32,018 bytes
- **Validation**: All files are exact copies of originals
