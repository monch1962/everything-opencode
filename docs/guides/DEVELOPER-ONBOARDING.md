# Developer Onboarding Guide

## Welcome to everything-opencode!

This guide will help you get started with the refactored modular codebase. The project has undergone a comprehensive refactoring where 13 large files have been transformed into 77 modular files while maintaining 100% backward compatibility.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ (recommended: 18+)
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/monch1962/everything-opencode.git
cd everything-opencode

# Install dependencies
npm install

# Run tests to verify installation
npm test
```

### Project Structure

```
everything-opencode/
├── scripts/                    # Main source code
│   ├── pinescript/            # PineScript tools
│   │   ├── optimizer.js       # Main optimizer class (refactored)
│   │   └── optimizer-modules/ # Optimizer modules (4 modules)
│   ├── lib/                   # Shared libraries
│   │   ├── template-utils.js  # Main template class (refactored)
│   │   └── template-modules/  # Template modules (5 modules)
│   └── [other directories]    # Other tools and utilities
├── tests/                     # Test suite
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── examples/              # Usage examples
│   └── guides/                # Guides (this file)
└── package.json              # Project configuration
```

## 📚 Understanding the Architecture

### Modular Design Pattern

The codebase follows a consistent modular pattern:

```javascript
// Main class delegates to modules
class MainClass {
  constructor() {
    this.module1 = new Module1();
    this.module2 = new Module2();
  }

  // Public methods delegate to modules
  publicMethod(...args) {
    return this.module1.someMethod(...args);
  }

  // Module getters for testing/debugging
  getModule1() {
    return this.module1;
  }
}
```

### Key Concepts

1. **Backward Compatibility**: All refactored modules maintain 100% API compatibility
2. **Separation of Concerns**: Each module has a single responsibility
3. **Lazy Initialization**: Modules are initialized only when needed
4. **Consistent Error Handling**: Uniform error patterns across modules

## 🔧 Development Workflow

### Setting Up Your Environment

```bash
# 1. Fork and clone
git clone https://github.com/your-username/everything-opencode.git
cd everything-opencode

# 2. Install dependencies
npm install

# 3. Create feature branch
git checkout -b feature/your-feature-name

# 4. Make changes and test
npm test

# 5. Commit and push
git add .
git commit -m "feat: description of changes"
git push origin feature/your-feature-name

# 6. Create pull request
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node tests/specific-test.js

# Run validation scripts
node validate-optimizer.js
node validate-template-utils.js
```

### Code Style

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes for JS, double for JSX
- **Line length**: 80-100 characters
- **Naming**: camelCase for variables/functions, PascalCase for classes

## 🧩 Working with Modules

### Creating a New Module

1. **Identify Responsibility**: Each module should have a single, clear responsibility
2. **Follow Patterns**: Use existing modules as templates
3. **Add Tests**: Write comprehensive unit tests
4. **Document**: Add JSDoc comments and update documentation

### Module Template

```javascript
#!/usr/bin/env node
/**
 * ModuleName Module for ParentClass
 *
 * Brief description of module responsibility
 */

const dependencies = require('../dependencies');

class ModuleName {
  /**
   * Creates a new ModuleName instance
   *
   * @param {Object} [options={}] - Module options
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Main method description
   *
   * @param {string} param1 - First parameter
   * @param {Object} [options={}] - Method options
   * @returns {Object} Result object
   * @throws {Error} If something goes wrong
   */
  mainMethod(param1, options = {}) {
    // Implementation
    return { success: true, data: result };
  }
}

module.exports = ModuleName;
```

### Module Integration

```javascript
// In main class constructor
this.moduleName = new ModuleName(options);

// In main class method
someMethod(...args) {
  return this.moduleName.mainMethod(...args);
}
```

## 📖 Key Modules to Know

### PineScript Optimizer Modules

1. **OptimizerCore** (`optimizer-core.js`): Core optimization methods
2. **ParameterHandler** (`parameter-handler.js`): Parameter space parsing
3. **OptimizationAlgorithms** (`optimization-algorithms.js`): Optimization algorithms
4. **AnalysisReporter** (`analysis-reporter.js`): Results analysis and reporting

### TemplateUtils Modules

1. **TemplateCore** (`template-core.js`): Basic template rendering
2. **DirectoryProcessor** (`directory-processor.js`): Directory template processing
3. **LanguageTemplates** (`language-templates.js`): Language-specific templates
4. **ProjectGenerator** (`project-generator.js`): Project file generation
5. **TemplateValidator** (`template-validator.js`): Variable validation

## 🧪 Testing Strategy

### Unit Tests

- Test each module independently
- Mock dependencies when needed
- Cover edge cases and error conditions

### Integration Tests

- Test module interactions
- Verify backward compatibility
- Test complete workflows

### Validation Scripts

- Run validation scripts after changes
- Ensure 100% backward compatibility
- Verify module structure

### Test Structure

```javascript
// tests/module-name.test.js
const ModuleName = require('../scripts/path/to/module');

describe('ModuleName', () => {
  let moduleInstance;

  beforeEach(() => {
    moduleInstance = new ModuleName();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(moduleInstance).toBeInstanceOf(ModuleName);
    });
  });

  describe('mainMethod', () => {
    it('should return expected result', async () => {
      const result = await moduleInstance.mainMethod('test');
      expect(result.success).toBe(true);
    });
  });
});
```

## 🔍 Debugging Tips

### Module Inspection

```javascript
// Access internal modules for debugging
const optimizer = new PineOptimizer();
const core = optimizer.getCore();
const paramHandler = optimizer.getParameterHandler();

console.log('Core state:', core.getProjectPath());
console.log('Parameter handler:', paramHandler);
```

### Error Tracing

```javascript
try {
  await optimizer.optimizeStrategy('strategy.pine', options);
} catch (error) {
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    module: error.module, // Custom property if added
  });
}
```

### Performance Profiling

```javascript
console.time('optimization');
const result = await optimizer.optimizeStrategy(...);
console.timeEnd('optimization');
```

## 📝 Documentation Standards

### JSDoc Comments

```javascript
/**
 * Brief description of method
 *
 * @param {string} param1 - Description of first parameter
 * @param {Object} [options={}] - Optional parameters
 * @param {string} [options.option1='default'] - Option description
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} Description of error conditions
 * @example
 * const result = await methodName('param', { option1: 'value' });
 */
```

### README Files

Each module directory should include:

1. **Purpose**: What the module does
2. **Usage**: How to use the module
3. **API**: Public methods and parameters
4. **Examples**: Code examples
5. **Dependencies**: Required dependencies

### API Documentation

- Keep `docs/api/` updated
- Include examples for all public methods
- Document breaking changes
- Include migration guides

## 🚨 Common Pitfalls

### 1. Breaking Backward Compatibility

**Don't**: Change public method signatures
**Do**: Add new methods with different names
**Do**: Use optional parameters for new features

### 2. Tight Coupling Between Modules

**Don't**: Create circular dependencies
**Do**: Use dependency injection
**Do**: Keep interfaces minimal and focused

### 3. Inconsistent Error Handling

**Don't**: Return different error formats
**Do**: Use consistent error objects
**Do**: Include helpful error messages

### 4. Missing Tests

**Don't**: Skip writing tests for new features
**Do**: Write tests before implementation (TDD)
**Do**: Maintain high test coverage

## 🔄 Release Process

### Versioning

- **Major**: Breaking changes (avoid in refactored modules)
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, documentation

### Release Checklist

1. [ ] All tests passing
2. [ ] Validation scripts passing
3. [ ] Documentation updated
4. [ ] Backward compatibility verified
5. [ ] Performance benchmarks recorded
6. [ ] Changelog updated

### Creating a Release

```bash
# 1. Update version in package.json
npm version patch  # or minor/major

# 2. Run full test suite
npm test

# 3. Run validation
node validate-optimizer.js
node validate-template-utils.js

# 4. Build documentation
# (Add documentation build step when implemented)

# 5. Commit and tag
git commit -am "chore: release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

## 🤝 Contributing

### Getting Help

1. **Documentation**: Check `docs/` directory first
2. **Examples**: Look at `docs/examples/`
3. **Issues**: Search GitHub issues
4. **Code**: Read source code and tests

### Reporting Issues

Include in issue reports:

1. **Version**: Module and project version
2. **Environment**: Node.js version, OS
3. **Steps**: Reproduction steps
4. **Expected**: What should happen
5. **Actual**: What actually happens
6. **Logs**: Error messages and stack traces

### Code Review Process

1. **Self-review**: Test your changes thoroughly
2. **Documentation**: Update relevant documentation
3. **Tests**: Add/update tests
4. **Validation**: Run validation scripts
5. **Submit**: Create pull request with clear description

## 🎯 Next Steps for New Developers

### Week 1: Foundation

1. **Day 1**: Set up environment, run tests
2. **Day 2**: Study project structure and architecture
3. **Day 3**: Explore PineScript Optimizer modules
4. **Day 4**: Explore TemplateUtils modules
5. **Day 5**: Run validation scripts, create simple test

### Week 2: Contribution

1. **Day 6**: Fix a simple bug or add documentation
2. **Day 7**: Add a test case for existing functionality
3. **Day 8**: Create a simple example in `docs/examples/`
4. **Day 9**: Review a pull request
5. **Day 10**: Plan your first feature contribution

### Month 1: Mastery

1. **Week 3**: Contribute a small feature
2. **Week 4**: Improve test coverage
3. **End of Month**: Lead a small refactoring or feature

## 📚 Additional Resources

### Documentation

- `docs/api/REFACTORED-MODULES-API.md` - Complete API documentation
- `REFACTORING-PROJECT-SUMMARY.md` - Refactoring project summary
- `AGENTS.md` - Agent guidelines and conventions

### Examples

Check `docs/examples/` directory for:

- Module usage examples
- Integration examples
- Best practices

### Tools

- **ESLint**: Code linting (`npm run lint`)
- **Prettier**: Code formatting (`npm run format`)
- **Validation Scripts**: Module validation

## 🎉 Welcome Aboard!

You're now ready to contribute to the everything-opencode project. Remember:

1. **Ask questions** - Don't hesitate to ask for help
2. **Start small** - Begin with documentation or tests
3. **Follow patterns** - Use existing code as reference
4. **Test thoroughly** - Always run tests before submitting
5. **Document changes** - Keep documentation up to date

Happy coding! 🚀

---

_Last Updated: January 28, 2026_  
_For questions: Check GitHub issues or create new discussion_
