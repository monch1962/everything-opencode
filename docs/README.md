# Documentation Index

## 📚 API Documentation

### PineScript Optimizer
- [Complete API Reference](api/API-PINESCRIPT-OPTIMIZER.md) - All methods and modules
- [Refactored Modules API](api/REFACTORED-MODULES-API.md) - Comprehensive module documentation

### TemplateUtils
- [Complete API Reference](api/API-TEMPLATE-UTILS.md) - All methods and modules
- [Refactored Modules API](api/REFACTORED-MODULES-API.md) - Comprehensive module documentation

### PineScript Debug Server
- [Complete API Reference](api/API-DEBUG-SERVER.md) - Web-based debugging interface
- [Security Manager](api/API-DEBUG-SERVER.md#security-manager-module) - Authentication and security
- [Debug State Manager](api/API-DEBUG-SERVER.md#debug-state-manager-module) - Debug state management
- [Code Analyzer](api/API-DEBUG-SERVER.md#code-analyzer-module) - Code analysis utilities
- [WebSocket Manager](api/API-DEBUG-SERVER.md#websocket-manager-module) - Real-time communication

### PineScript Debugger
- [Complete API Reference](api/API-PINE-DEBUG.md) - Command-line debugging utilities
- [Argument Parser](api/API-PINE-DEBUG.md#argument-parser-module) - Command line argument parsing
- [Code Analyzer](api/API-PINE-DEBUG.md#code-analyzer-module) - Code analysis and metrics
- [AI Analyzer](api/API-PINE-DEBUG.md#ai-analyzer-module) - AI-assisted debugging suggestions
- [Command Handler](api/API-PINE-DEBUG.md#command-handler-module) - Command execution and handling

### Command Runners
- [Complete API Reference](api/API-COMMAND-RUNNERS.md) - Language-specific command execution
- [Clojure Command Runner](api/API-COMMAND-RUNNERS.md#clojure-command-runner) - Clojure project management
- [JavaScript/TypeScript Command Runner](api/API-COMMAND-RUNNERS.md#javascripttypescript-command-runner) - JS/TS project management
- [Python Command Runner](api/API-COMMAND-RUNNERS.md#python-command-runner) - Python project management
- [Go Command Runner](api/API-COMMAND-RUNNERS.md#go-command-runner) - Go project management
- [Rust Command Runner](api/API-COMMAND-RUNNERS.md#rust-command-runner) - Rust project management
- [Elixir Command Runner](api/API-COMMAND-RUNNERS.md#elixir-command-runner) - Elixir project management

### Go Config Wizard
- [Complete API Reference](api/API-GO-CONFIG-WIZARD.md) - Go project configuration wizard
- [Go Wizard Core](api/API-GO-CONFIG-WIZARD.md#go-wizard-core-module) - Core wizard functionality
- [Go Project Detector](api/API-GO-CONFIG-WIZARD.md#go-project-detector-module) - Project detection
- [Go Config Generator](api/API-GO-CONFIG-WIZARD.md#go-config-generator-module) - Configuration generation
- [Go Project Creator](api/API-GO-CONFIG-WIZARD.md#go-project-creator-module) - Project creation utilities

## 🚀 Quick Start

### Getting Started
- [Developer Onboarding Guide](guides/DEVELOPER-ONBOARDING.md) - Complete developer guide
- [Quick Start Examples](examples/QUICK-START-EXAMPLES.md) - Practical code examples

### Examples
- [Module Usage Examples](examples/) - Comprehensive examples directory
- [Integration Examples](examples/QUICK-START-EXAMPLES.md#integration-examples) - Real-world integration patterns

## 🏗️ Architecture

### System Design
- [Architecture Diagrams](ARCHITECTURE-DIAGRAMS.md) - System architecture and module diagrams
- [Refactoring Project Summary](../REFACTORING-PROJECT-SUMMARY.md) - Complete refactoring documentation

### Module Design
- [Module Responsibilities](ARCHITECTURE-DIAGRAMS.md#module-responsibilities) - Detailed module responsibilities
- [Data Flow Diagrams](ARCHITECTURE-DIAGRAMS.md#data-flow-diagrams) - System data flow

## 🧪 Testing & Validation

### Testing
- Run all tests: `npm test`
- Test coverage: Check test directory

### Validation
- [PineScript Optimizer Validation](../validate-optimizer.js) - Optimizer validation script
- [TemplateUtils Validation](../validate-template-utils.js) - TemplateUtils validation script

## 🔧 Development

### Code Standards
- Follow existing code patterns
- Add JSDoc comments to all public methods
- Write comprehensive tests
- Update documentation

### Contributing
1. Read the [Developer Onboarding Guide](guides/DEVELOPER-ONBOARDING.md)
2. Follow the code standards
3. Write tests for new functionality
4. Update relevant documentation
5. Submit pull request

## 📊 Project Status

### Refactoring Status
✅ **Completed**: 13 large files refactored into 77 modular files  
✅ **Backward Compatibility**: 100% maintained  
✅ **Tests Passing**: 97/97 (100%)  
✅ **Documentation**: Comprehensive documentation generated

### Module Status
- **PineScript Optimizer**: ✅ Production ready
- **TemplateUtils**: ✅ Production ready
- **PineScript Debug Server**: ✅ Production ready
- **PineScript Debugger**: ✅ Production ready
- **Command Runners**: ✅ Production ready
- **Go Config Wizard**: ✅ Production ready
- **Validation Scripts**: ✅ All passing
- **Documentation**: ✅ Complete

## 🔄 Updates

This documentation is automatically generated. To update:

1. Add JSDoc comments to your code
2. Run: `node scripts/generate-docs.js`
3. Commit updated documentation

---

*Last Generated: 2026-01-28T01:29:17.979Z*  
*Documentation Version: 1.0.0*
