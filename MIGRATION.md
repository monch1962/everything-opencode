# Migration Guide: Claude Code to Opencode

This guide helps you migrate from **everything-claude-code** to **everything-opencode**.

## Overview

**everything-opencode** is a complete conversion of the original **everything-claude-code** repository, optimized for the opencode AI coding agent. All functionality has been preserved and enhanced with opencode-specific features.

## What's Changed

### 1. Directory Structure
- All `~/.claude/` paths → `~/.opencode/`
- Plugin root: `${CLAUDE_PLUGIN_ROOT}` → `${OPENCODE_PLUGIN_ROOT}`
- Sessions directory: `~/.claude/sessions` → `~/.opencode/sessions`

### 2. Environment Variables
- `CLAUDE_*` variables → `OPENCODE_*` variables
- `CLAUDE_PLUGIN_ROOT` → `OPENCODE_PLUGIN_ROOT`
- `CLAUDE_SESSION_ID` → `OPENCODE_SESSION_ID`

### 3. Configuration Files
- `.claude-plugin/` → `.opencode-plugin/`
- `claude-settings.json` → `opencode-settings.json`
- All schema references updated

### 4. New Features Added
- **4 new optimization skills** specifically for opencode
- Enhanced cross-platform compatibility
- Improved test suite
- Comprehensive installation verification
- Release automation scripts
- GitHub Actions CI/CD workflow

## Migration Steps

### Step 1: Backup Your Data
```bash
# Backup your Claude Code sessions
cp -r ~/.claude/sessions ~/claude-sessions-backup

# Backup your Claude Code plugin
cp -r ~/.claude/plugins/everything-claude-code ~/everything-claude-code-backup
```

### Step 2: Install Everything Opencode

#### Option A: From GitHub
```bash
# Clone the repository
git clone https://github.com/yourusername/everything-opencode.git

# Add to opencode
opencode plugin add /path/to/everything-opencode
```

#### Option B: From npm
```bash
# Install globally
npm install -g everything-opencode

# Verify installation
everything-opencode verify
```

#### Option C: Manual Installation
1. Download the latest release from GitHub
2. Extract to your desired location
3. Add to opencode: `opencode plugin add /path/to/everything-opencode`

### Step 3: Migrate Your Sessions (Optional)

If you want to migrate your existing Claude Code sessions:

```bash
# Create opencode directory if it doesn't exist
mkdir -p ~/.opencode/sessions

# Copy sessions (adjust paths as needed)
cp ~/.claude/sessions/*.json ~/.opencode/sessions/ 2>/dev/null || true
cp ~/.claude/sessions/*.tmp ~/.opencode/sessions/ 2>/dev/null || true
```

### Step 4: Update Environment Variables

Update your shell configuration (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# Replace
export CLAUDE_PLUGIN_ROOT="/path/to/plugin"

# With
export OPENCODE_PLUGIN_ROOT="/path/to/everything-opencode"
```

### Step 5: Verify Migration

```bash
# Run verification script
cd /path/to/everything-opencode
node scripts/verify-installation.js

# Test the plugin
opencode /help
opencode /agents
```

## Feature Comparison

| Feature | Claude Code | Opencode | Notes |
|---------|-------------|----------|-------|
| Agents | ✅ 9 agents | ✅ 9 agents | Fully converted |
| Skills | ✅ 11 skills | ✅ 15 skills | +4 new optimization skills |
| Commands | ✅ 14 commands | ✅ 14 commands | Fully converted |
| Rules | ✅ 8 rules | ✅ 8 rules | Fully converted |
| Hooks | ✅ Complete system | ✅ Complete system | Enhanced for opencode |
| Cross-platform | ✅ Yes | ✅ Yes | Improved compatibility |
| Test suite | ✅ Basic | ✅ Comprehensive | 62 tests total |
| Installation verification | ❌ No | ✅ Yes | New feature |
| Release automation | ❌ No | ✅ Yes | New feature |
| CI/CD workflow | ❌ No | ✅ Yes | New feature |

## Breaking Changes

### 1. Path References
All path references in configuration files have been updated. If you have custom configurations that reference Claude Code paths, you'll need to update them.

### 2. Environment Variables
Scripts and hooks now expect `OPENCODE_*` variables instead of `CLAUDE_*` variables.

### 3. Plugin Configuration
The plugin configuration format has been updated for opencode compatibility.

## Troubleshooting

### Common Issues

#### Issue: "Plugin not found" error
**Solution:** Ensure you've added the plugin correctly:
```bash
opencode plugin add /path/to/everything-opencode
opencode plugin list  # Should show everything-opencode
```

#### Issue: Environment variables not set
**Solution:** Set the required environment variable:
```bash
export OPENCODE_PLUGIN_ROOT="/path/to/everything-opencode"
# Add to your shell configuration file
```

#### Issue: Test failures
**Solution:** Run the verification script to identify issues:
```bash
node scripts/verify-installation.js
```

#### Issue: Hook scripts not running
**Solution:** Check hook configuration:
```bash
# Verify hooks.json exists
ls -la hooks/hooks.json

# Check opencode hook configuration
opencode config get hooks
```

### Getting Help

1. **Check the documentation**: Review `README.md` and `CONTRIBUTING.md`
2. **Run verification**: `node scripts/verify-installation.js`
3. **Run tests**: `npm test`
4. **Check GitHub Issues**: [https://github.com/yourusername/everything-opencode/issues](https://github.com/yourusername/everything-opencode/issues)
5. **Review migration guide**: This document

## Rollback Procedure

If you need to roll back to Claude Code:

1. Remove the opencode plugin:
   ```bash
   opencode plugin remove everything-opencode
   ```

2. Restore your backup:
   ```bash
   cp -r ~/claude-sessions-backup ~/.claude/sessions
   cp -r ~/everything-claude-code-backup ~/.claude/plugins/everything-claude-code
   ```

3. Update environment variables back to `CLAUDE_*`

## Support

For additional support:
- Create an issue on GitHub
- Check the documentation in the `documentation/` directory
- Review the test suite for examples of proper usage

## Contributing

See `CONTRIBUTING.md` for guidelines on contributing to the project.

---

**Migration complete!** You're now using everything-opencode with all the original functionality plus new enhancements for opencode.