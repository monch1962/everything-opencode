# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of everything-opencode
- Complete conversion from everything-claude-code
- 4 new optimization skills for opencode
- Comprehensive test suite (62 tests)
- Installation verification script
- Release automation scripts
- GitHub Actions CI/CD workflow
- Migration guide from Claude Code
- npm package configuration

### Changed
- All `~/.claude/` paths → `~/.opencode/`
- All `CLAUDE_*` environment variables → `OPENCODE_*`
- Plugin configuration updated for opencode compatibility
- Enhanced cross-platform compatibility
- Improved documentation and examples

### Fixed
- Fixed date handling in test suite
- Improved error handling in hook scripts
- Enhanced file path handling for Windows compatibility

### Removed
- Claude Code specific configurations
- Deprecated file references

## [1.0.0] - 2026-01-25

### Major Changes
- Initial release of everything-opencode
- Complete conversion from everything-claude-code repository
- Full compatibility with opencode AI coding agent
- Comprehensive feature set including:
  - 9 agent files for delegation
  - 15 skill directories (11 original + 4 new)
  - 14 command files for slash commands
  - 8 rule files for guidelines
  - Complete hook system for automation
  - Cross-platform utilities and scripts
  - Extensive test suite
  - Detailed documentation

### Added
- **New optimization skills**:
  1. LSP integration optimizations
  2. Multi-provider model configurations
  3. TUI (Terminal UI) specific optimizations
  4. Performance tuning guidelines
- **Installation verification**: Comprehensive script to verify setup
- **Release automation**: Scripts for version management and publishing
- **CI/CD pipeline**: GitHub Actions workflow for testing and deployment
- **Migration guide**: Step-by-step guide from Claude Code
- **npm package**: Ready for distribution via npm

### Changed
- **Path updates**: All references updated from Claude Code to opencode
- **Environment variables**: Complete migration to opencode naming convention
- **Configuration files**: Updated for opencode plugin system compatibility
- **Documentation**: Enhanced README, CONTRIBUTING, and AGENTS.md files
- **Test suite**: Expanded and improved for better coverage

### Technical Details
- **Platform support**: Windows, macOS, Linux
- **Node.js version**: >=14.0.0
- **Test coverage**: 62 comprehensive tests
- **Code quality**: Follows opencode best practices
- **Performance**: Optimized for opencode integration

### Migration Notes
- Users migrating from everything-claude-code should follow the MIGRATION.md guide
- All original functionality preserved and enhanced
- New opencode-specific features added
- Backward compatibility maintained where possible

### Known Issues
- None reported in initial release

### Security
- No known security vulnerabilities
- Follows security best practices for AI coding agents
- Environment variable handling improved
- File system operations secured

### Performance
- Optimized for fast execution with opencode
- Efficient memory usage
- Minimal overhead for hook execution
- Fast test execution times

---

**Note**: This is the initial release of everything-opencode. Future releases will include additional features, improvements, and bug fixes based on community feedback and opencode evolution.