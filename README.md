# Everything opencode

[![Stars](https://img.shields.io/github/stars/davidm/everything-opencode?style=flat)](https://github.com/davidm/everything-opencode/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)

**The complete collection of opencode configs converted from everything-claude-code.**

Production-ready agents, skills, hooks, commands, rules, and MCP configurations optimized for the opencode AI coding agent.

---

## About This Repository

This repository is a **converted version** of [everything-claude-code](https://github.com/affaan-m/everything-claude-code) by [@affaanmustafa](https://x.com/affaanmustafa), adapted for use with the **opencode** AI coding agent. All configurations have been updated with:

- ✅ **Path updates**: `~/.claude/` → `~/.opencode/`
- ✅ **Environment variables**: `CLAUDE_*` → `OPENCODE_*`
- ✅ **Tool references**: Claude Code tools → opencode equivalents
- ✅ **Format compatibility**: Fully compatible with opencode agent format
- ✅ **Cross-platform**: All scripts work on Windows, macOS, and Linux

**Original Guides:** The original guides from everything-claude-code still apply:

- [Shorthand Guide](https://x.com/affaanmustafa/status/2012378465664745795) - Setup, foundations, philosophy
- [Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - Token optimization, memory persistence, evals, parallelization

---

## Cross-Platform Support

This plugin fully supports **Windows, macOS, and Linux**. All hooks and scripts have been rewritten in Node.js for maximum compatibility.

### Package Manager Detection

The plugin automatically detects your preferred package manager (npm, pnpm, yarn, or bun) with the following priority:

1. **Environment variable**: `OPENCODE_PACKAGE_MANAGER`
2. **Project config**: `.opencode/package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: Detection from package-lock.json, yarn.lock, pnpm-lock.yaml, or bun.lockb
5. **Global config**: `~/.opencode/package-manager.json`
6. **Fallback**: First available package manager

To set your preferred package manager:

```bash
# Via environment variable
export OPENCODE_PACKAGE_MANAGER=pnpm

# Via global config
node scripts/setup-package-manager.js --global pnpm

# Via project config
node scripts/setup-package-manager.js --project bun

# Detect current setting
node scripts/setup-package-manager.js --detect
```

Or use the `/setup-pm` command in opencode.

---

## What's Inside

This repo is an **opencode plugin** - install it directly or copy components manually.

```
everything-opencode/
|-- .opencode-plugin/   # Plugin and marketplace manifests
|   |-- plugin.json         # Plugin metadata and component paths
|   |-- marketplace.json    # Marketplace catalog for plugin installation
|
|-- agents/           # Specialized subagents for delegation
|   |-- planner.md           # Feature implementation planning
|   |-- architect.md         # System design decisions
|   |-- tdd-guide.md         # Test-driven development
|   |-- code-reviewer.md     # Quality and security review
|   |-- security-reviewer.md # Vulnerability analysis
|   |-- build-error-resolver.md
|   |-- e2e-runner.md        # Playwright E2E testing
|   |-- refactor-cleaner.md  # Dead code cleanup
|   |-- doc-updater.md       # Documentation sync
|
|-- skills/           # Workflow definitions and domain knowledge
|   |-- coding-standards/           # Language best practices
|   |-- backend-patterns/           # API, database, caching patterns
|   |-- frontend-patterns/          # React, Next.js patterns
|   |-- continuous-learning/        # Auto-extract patterns from sessions
|   |-- strategic-compact/          # Manual compaction suggestions
|   |-- tdd-workflow/               # TDD methodology
|   |-- security-review/            # Security checklist
|   |-- eval-harness/               # Verification loop evaluation
|   |-- verification-loop/          # Continuous verification
|   |-- clickhouse-io/              # ClickHouse database patterns
|   |-- project-guidelines-example/ # Example project template
|
|-- commands/         # Slash commands for quick execution
|   |-- tdd.md              # /tdd - Test-driven development
|   |-- plan.md             # /plan - Implementation planning
|   |-- e2e.md              # /e2e - E2E test generation
|   |-- code-review.md      # /code-review - Quality review
|   |-- build-fix.md        # /build-fix - Fix build errors
|   |-- refactor-clean.md   # /refactor-clean - Dead code removal
|   |-- learn.md            # /learn - Extract patterns mid-session
|   |-- checkpoint.md       # /checkpoint - Save verification state
|   |-- verify.md           # /verify - Run verification loop
|   |-- setup-pm.md         # /setup-pm - Configure package manager
|   |-- test-coverage.md    # /test-coverage - Test coverage analysis
|   |-- update-codemaps.md  # /update-codemaps - Architecture documentation
|   |-- orchestrate.md      # /orchestrate - Sequential agent workflows
|   |-- eval.md             # /eval - Eval-driven development
|   |-- python-test.md      # /python-test - Run Python tests
|   |-- python-lint.md      # /python-lint - Run linter and formatter
|   |-- python-typecheck.md # /python-typecheck - Run type checker
|   |-- python-deps.md      # /python-deps - Manage dependencies
|   |-- python-setup.md     # /python-setup - Configure Python project
|   |-- pine-setup.md       # /pine-setup - Configure PineScript project
|   |-- pine-validate.md    # /pine-validate - Validate PineScript syntax
|   |-- go-setup.md         # /go-setup - Configure Go project with Go-specific improvements
|   |-- go-build.md         # /go-build - Build Go projects with cross-compilation
|   |-- elixir-setup.md     # /elixir-setup - Configure Elixir project with Elixir-specific improvements
|   |-- elixir-compile.md   # /elixir-compile - Compile Elixir project
|   |-- elixir-test.md      # /elixir-test - Run ExUnit tests
|   |-- elixir-lint.md      # /elixir-lint - Lint code with Credo
|   |-- elixir-format.md    # /elixir-format - Format code with built-in formatter
|   |-- elixir-deps.md      # /elixir-deps - Manage dependencies with Mix and Hex
|   |-- elixir-typecheck.md # /elixir-typecheck - Type check with Dialyzer
|
|-- rules/            # Always-follow guidelines (copy to ~/.opencode/rules/)
|   |-- security.md         # Mandatory security checks
|   |-- coding-style.md     # Immutability, file organization
|   |-- testing.md          # TDD, 80% coverage requirement
|   |-- git-workflow.md     # Commit format, PR process
|   |-- agents.md           # When to delegate to subagents
|   |-- performance.md      # Model selection, context management
|   |-- hooks.md            # Hooks system configuration
|   |-- patterns.md         # Common architectural patterns
|
|-- hooks/            # Trigger-based automations
|   |-- hooks.json                # All hooks config (PreToolUse, PostToolUse, Stop, etc.)
|   |-- memory-persistence/       # Session lifecycle hooks
|   |-- strategic-compact/        # Compaction suggestions
|
|-- scripts/          # Cross-platform Node.js scripts
|   |-- lib/                     # Shared utilities
|   |   |-- utils.js             # Cross-platform file/path/system utilities
|   |   |-- package-manager.js   # Package manager detection and selection
|   |-- hooks/                   # Hook implementations
|   |   |-- session-start.js     # Load context on session start
|   |   |-- session-end.js       # Save state on session end
|   |   |-- pre-compact.js       # Pre-compaction state saving
|   |   |-- suggest-compact.js   # Strategic compaction suggestions
|   |   |-- evaluate-session.js  # Extract patterns from sessions
|   |-- setup-package-manager.js # Interactive PM setup
|
|-- tests/            # Test suite
|   |-- lib/                     # Library tests
|   |-- hooks/                   # Hook tests
|   |-- run-all.js               # Run all tests
|
|-- contexts/         # Dynamic system prompt injection contexts
|   |-- dev.md              # Development mode context
|   |-- review.md           # Code review mode context
|   |-- research.md         # Research/exploration mode context
|
|-- languages/         # Language-specific configuration wizards
|   |-- python/              # Python configuration wizard
|   |-- pinescript/          # PineScript configuration wizard
|   |-- shared/              # Shared language utilities
|
|-- examples/         # Example configurations and sessions
|   |-- python-projects/     # Python project examples
|   |-- pinescript-projects/ # PineScript project examples
|   |-- AGENTS.md           # Agent guidelines and examples
|
|-- mcp-configs/      # MCP server configurations
|   |-- mcp-servers.json    # GitHub, Supabase, Vercel, Railway, etc.
|
|-- marketplace.json  # Self-hosted marketplace config
|
|-- .opencode/        # User configuration
|   |-- package-manager.json  # Package manager preference
```

---

## Installation

### Option 1: Install as Plugin (Recommended)

The easiest way to use this repo - install as an opencode plugin:

```bash
# Clone the repository
git clone https://github.com/davidm/everything-opencode.git

# Install as a local plugin
# (Check opencode documentation for plugin installation commands)
```

Or add to your `~/.opencode/settings.json`:

```json
{
  "plugins": {
    "everything-opencode": {
      "enabled": true,
      "path": "/path/to/everything-opencode"
    }
  }
}
```

This gives you instant access to all commands, agents, skills, and hooks.

---

### Option 2: Manual Installation

If you prefer manual control over what's installed:

```bash
# Clone the repo
git clone https://github.com/davidm/everything-opencode.git

# Copy agents to your opencode config
cp everything-opencode/agents/*.md ~/.opencode/agents/

# Copy rules
cp everything-opencode/rules/*.md ~/.opencode/rules/

# Copy commands
cp everything-opencode/commands/*.md ~/.opencode/commands/

# Copy skills
cp -r everything-opencode/skills/* ~/.opencode/skills/
```

#### Add hooks to settings.json

Copy the hooks from `hooks/hooks.json` to your `~/.opencode/settings.json`.

#### Configure MCPs

Copy desired MCP servers from `mcp-configs/mcp-servers.json` to your `~/.opencode.json`.

**Important:** Replace `YOUR_*_HERE` placeholders with your actual API keys.

---

## Key Concepts

### Agents

Subagents handle delegated tasks with limited scope. Example:

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior code reviewer...
```

### Skills

Skills are workflow definitions invoked by commands or agents:

```markdown
# TDD Workflow

1. Define interfaces first
2. Write failing tests (RED)
3. Implement minimal code (GREEN)
4. Refactor (IMPROVE)
5. Verify 80%+ coverage
```

### Hooks

Hooks fire on tool events. Example - warn about console.log:

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"const fs=require('fs');const p=process.argv[2];if(p&&fs.existsSync(p)){const c=fs.readFileSync(p,'utf8');if(/console\\.log/.test(c))console.error('[Hook] WARNING: console.log found')\" \"$file_path\""
    }
  ]
}
```

### Rules

Rules are always-follow guidelines. Keep them modular:

```
~/.opencode/rules/
  security.md      # No hardcoded secrets
  coding-style.md  # Immutability, file limits
  testing.md       # TDD, coverage requirements
```

---

## Running Tests

The plugin includes a comprehensive test suite:

```bash
# Run all tests
node tests/run-all.js

# Run individual test files
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

---

## Migration from Claude Code

If you're migrating from everything-claude-code to everything-opencode:

1. **Backup your existing configs**:

   ```bash
   cp -r ~/.claude ~/.claude-backup
   ```

2. **Install everything-opencode** using one of the methods above

3. **Update paths in your existing projects**:
   - Change `.claude/` references to `.opencode/`
   - Update environment variables from `CLAUDE_*` to `OPENCODE_*`
   - Update tool references to opencode equivalents

4. **Test the migration** with a small project first

---

## Contributing

**Contributions are welcome and encouraged.**

This repo is meant to be a community resource for opencode users. If you have:

- Useful agents or skills optimized for opencode
- Clever hooks that work with opencode tools
- Better MCP configurations
- Improved rules for opencode workflows

Please contribute! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ideas for Contributions

- Language-specific skills (Python, Go, Rust patterns)
- Framework-specific configs (Django, Rails, Laravel)
- DevOps agents (Kubernetes, Terraform, AWS)
- Testing strategies optimized for opencode
- Domain-specific knowledge (ML, data engineering, mobile)

---

## Background

This repository is a conversion of [everything-claude-code](https://github.com/affaan-m/everything-claude-code) by [@affaanmustafa](https://x.com/affaanmustafa), who won the Anthropic x Forum Ventures hackathon in Sep 2025 building [zenith.chat](https://zenith.chat).

These configs are battle-tested across multiple production applications and have been adapted for optimal performance with the opencode AI coding agent.

---

## Important Notes

### Context Window Management

**Critical:** Don't enable all MCPs at once. Your context window can shrink with too many tools enabled.

Rule of thumb:

- Have 20-30 MCPs configured
- Keep under 10 enabled per project
- Monitor context usage

Use `disabledMcpServers` in project config to disable unused ones.

### Customization

These configs work for many workflows. You should:

1. Start with what resonates
2. Modify for your stack
3. Remove what you don't use
4. Add your own patterns

---

## Conversion Status

✅ **Complete Conversion:** All files from everything-claude-code have been converted to opencode format:

- ✅ **Phase 1**: Directory structure
- ✅ **Phase 2**: Plugin configuration
- ✅ **Phase 3**: 9 agent files
- ✅ **Phase 4**: 11 skill directories
- ✅ **Phase 5**: 14 command files
- ✅ **Phase 6**: 8 rule files
- ✅ **Phase 7**: Hooks system conversion
- ✅ **Phase 8**: Scripts and utilities
- ✅ **Phase 9**: Comprehensive README (this file)
- ⏳ **Phase 10**: Opencode-specific optimizations (future)

---

## Links

- **Original Repository:** [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **Original Shorthand Guide:** [The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
- **Original Longform Guide:** [The Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352)
- **Original Author:** [@affaanmustafa](https://x.com/affaanmustafa)
- **zenith.chat:** [zenith.chat](https://zenith.chat)

---

## License

MIT - Use freely, modify as needed, contribute back if you can.

---

**Star this repo if it helps. Read the original guides. Build something great with opencode.**
