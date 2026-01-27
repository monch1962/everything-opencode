#!/bin/bash
# Phase 4 Migration Rollback Script
# Restores original files from backup

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          Phase 4 Migration - Rollback                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from project root directory"
  exit 1
fi

BACKUP_DIR="backup/phase4-migration"

# Check if backup exists
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo "📦 Backup directory: $BACKUP_DIR"
echo ""

# Confirm rollback
read -p "⚠️  This will restore original files from backup. Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Rollback cancelled"
  exit 0
fi

echo "🔄 Starting rollback..."
echo ""

# Restore main files
echo "📄 Restoring main files..."
cp "$BACKUP_DIR/debug-server.js" "scripts/pinescript/" && echo "  ✅ debug-server.js"
cp "$BACKUP_DIR/pine-debug.js" "scripts/commands/" && echo "  ✅ pine-debug.js"
cp "$BACKUP_DIR/command-runner.js" "scripts/clojure/" && echo "  ✅ command-runner.js"

# Restore module directories
echo ""
echo "📁 Restoring module directories..."
if [ -d "$BACKUP_DIR/debug-server-modules" ]; then
  cp -r "$BACKUP_DIR/debug-server-modules/" "scripts/pinescript/" 2>/dev/null && echo "  ✅ debug-server-modules/"
fi

if [ -d "$BACKUP_DIR/pine-debug-modules" ]; then
  cp -r "$BACKUP_DIR/pine-debug-modules/" "scripts/commands/" 2>/dev/null && echo "  ✅ pine-debug-modules/"
fi

if [ -d "$BACKUP_DIR/command-runner-modules" ]; then
  cp -r "$BACKUP_DIR/command-runner-modules/" "scripts/clojure/" 2>/dev/null && echo "  ✅ command-runner-modules/"
fi

echo ""
echo "✅ Rollback complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run tests: npm test"
echo "2. Run validation: node scripts/validate-phase2.js"
echo "3. Check linting: npm run lint"
echo ""
echo "📚 See $BACKUP_DIR/ROLLBACK.md for detailed instructions."