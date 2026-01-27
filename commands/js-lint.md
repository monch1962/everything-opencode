# `/js-lint` - JavaScript/TypeScript Linting Command

Run ESLint on JavaScript and TypeScript code with intelligent configuration detection and fix capabilities.

## Overview

The `/js-lint` command runs ESLint on your JavaScript or TypeScript project to identify and fix code quality issues, enforce coding standards, and catch potential bugs. It automatically detects your ESLint configuration and applies appropriate rules for your project type.

## Features

- **Automatic Configuration Detection**: Detects ESLint configuration files and extends
- **Framework-Aware Linting**: Applies framework-specific rules (React, Vue, Angular, etc.)
- **TypeScript Support**: Full TypeScript linting with type-aware rules
- **Auto-fix Capability**: Automatically fixes fixable issues
- **Multiple Output Formats**: Console, JSON, stylish, and custom formatters
- **Performance Optimized**: Caching and parallel processing for large codebases
- **Integration Ready**: Works with pre-commit hooks and CI/CD pipelines

## Usage

```bash
/js-lint [options] [files...]
```

### Options

| Option           | Short | Description                         |
| ---------------- | ----- | ----------------------------------- |
| `--fix`          | `-f`  | Automatically fix problems          |
| `--format`       | `-F`  | Output format (stylish, json, etc.) |
| `--quiet`        | `-q`  | Report errors only                  |
| `--max-warnings` | `-m`  | Maximum warnings before failing     |
| `--cache`        | `-c`  | Only check changed files            |
| `--help`         | `-h`  | Show help message                   |

### File Patterns

You can specify files or directories to lint:

```bash
/js-lint src/                    # Lint entire src directory
/js-lint src/components/        # Lint specific directory
/js-lint src/file1.js src/file2.js  # Lint specific files
/js-lint "**/*.ts"              # Lint all TypeScript files
```

## What It Does

### 1. Configuration Detection

- Checks for ESLint configuration files (`.eslintrc.*`, `eslint.config.js`)
- Detects framework-specific configurations
- Identifies TypeScript ESLint configuration
- Loads project-specific rule sets

### 2. Linting Execution

- Runs ESLint with appropriate configuration
- Applies auto-fixes when requested
- Formats output for readability
- Handles TypeScript and JavaScript files

### 3. Results Reporting

- Shows error and warning counts
- Provides file-specific issue details
- Suggests fixes for common problems
- Exits with appropriate status codes

## Supported ESLint Configurations

### Configuration File Detection

- `.eslintrc.js` - JavaScript configuration
- `.eslintrc.json` - JSON configuration
- `.eslintrc.yml` / `.eslintrc.yaml` - YAML configuration
- `eslint.config.js` - New flat config format
- `package.json` (eslintConfig property)

### Popular Configurations

- **Airbnb JavaScript Style Guide**
- **Standard JavaScript Style Guide**
- **Google JavaScript Style Guide**
- **ESLint Recommended**
- **TypeScript ESLint Recommended**
- **React ESLint Configuration**
- **Vue ESLint Configuration**

### Framework Extends

```javascript
// Common extends configurations
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:vue/recommended"
  ]
}
```

## Examples

### Basic Linting

```bash
# Lint all files in project
/js-lint

# Output:
# 🔍 Running ESLint...
# 📊 Found 12 problems (8 errors, 4 warnings)
#
# src/components/Button.js
#   15:5  error  'propTypes' is defined but never used  no-unused-vars
#   22:10 error  Missing semicolon                      semi
#
# 💡 2 fixable problems (run with --fix to fix)
# ✅ Linting completed
```

### Auto-fix Issues

```bash
# Automatically fix fixable problems
/js-lint --fix

# Output:
# 🔍 Running ESLint with auto-fix...
# 🔧 Fixing 8 problems...
# ✅ Fixed 8 problems automatically
# 📊 Remaining: 4 problems (0 errors, 4 warnings)
```

### TypeScript Linting

```bash
# Lint TypeScript files
/js-lint "**/*.ts" "**/*.tsx"

# Output:
# 🔍 Running TypeScript ESLint...
# 📊 Found 6 TypeScript-specific issues
#
# src/types/index.ts
#   10:3  error  Interface name must start with 'I'  @typescript-eslint/naming-convention
#   15:20 error  Type must be explicitly specified    @typescript-eslint/explicit-function-return-type
```

### Quiet Mode (Errors Only)

```bash
# Show only errors, suppress warnings
/js-lint --quiet

# Output:
# 🔍 Running ESLint (errors only)...
# 📊 Found 3 errors
#
# src/utils/helpers.js
#   42:1  error  'console.log' should not be used in production code  no-console
```

## Configuration

### ESLint Configuration File

Create `.eslintrc.js` in your project root:

```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Custom rules
    'no-console': 'warn',
    semi: ['error', 'always'],
  },
};
```

### TypeScript ESLint Configuration

For TypeScript projects, install and configure:

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

```javascript
// .eslintrc.js for TypeScript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
};
```

### Framework-Specific Configurations

**React:**

```bash
npm install --save-dev eslint-plugin-react
```

```javascript
{
  "extends": ["plugin:react/recommended"],
  "rules": {
    "react/prop-types": "error"
  }
}
```

**Vue:**

```bash
npm install --save-dev eslint-plugin-vue
```

```javascript
{
  "extends": ["plugin:vue/recommended"]
}
```

## Common Issues and Solutions

### ESLint Not Installed

**Error**: `ESLint not found`

**Solution**:

```bash
# Install ESLint
npm install --save-dev eslint

# Or run setup to configure
/js-setup
```

### Configuration Not Found

**Error**: `No ESLint configuration found`

**Solution**:

```bash
# Create ESLint configuration
npx eslint --init

# Or create basic config
echo '{"extends": "eslint:recommended"}' > .eslintrc.json
```

### TypeScript Parsing Errors

**Error**: `Parsing error: Unexpected token`

**Solution**:

```bash
# Install TypeScript ESLint parser
npm install --save-dev @typescript-eslint/parser

# Update ESLint config to use TypeScript parser
```

### Rule Conflicts

**Error**: `Rule conflict between configurations`

**Solution**:

```bash
# Check extends order in configuration
# Later extends override earlier ones

# Or disable conflicting rule
{
  "rules": {
    "conflicting-rule": "off"
  }
}
```

## Advanced Usage

### Custom Formatters

```bash
# Use different output formats
/js-lint --format json        # JSON output
/js-lint --format stylish     # Stylish output (default)
/js-lint --format compact     # Compact output
/js-lint --format table       # Table output

# Create custom formatter
/js-lint --format ./my-formatter.js
```

### Caching for Performance

```bash
# Enable caching for faster subsequent runs
/js-lint --cache

# Cache location: .eslintcache
# Clear cache if needed: rm .eslintcache
```

### Maximum Warnings

```bash
# Fail if warnings exceed threshold
/js-lint --max-warnings 10

# Exit with error if more than 10 warnings
```

### Ignore Patterns

Create `.eslintignore` file:

```
# .eslintignore
node_modules/
dist/
build/
*.min.js
coverage/
```

## Integration with Development Workflow

### Pre-commit Hooks

Add to `package.json` scripts:

```json
{
  "scripts": {
    "lint": "/js-lint",
    "lint:fix": "/js-lint --fix",
    "precommit": "/js-lint"
  }
}
```

### CI/CD Pipeline

```bash
# Example CI script
/js-setup
/js-lint --max-warnings 0  # Fail on any warnings
/js-test
/js-build --production
```

### Editor Integration

Configure your editor to use the same ESLint configuration:

**VS Code:**

```json
{
  "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Performance Tips

### 1. Use Caching

```bash
# Enable cache for faster runs
/js-lint --cache

# Cache is invalidated when:
# - ESLint version changes
# - Configuration changes
# - Node.js version changes
```

### 2. Limit File Scope

```bash
# Lint only changed files
/js-lint --cache

# Or lint specific directories
/js-lint src/ tests/
```

### 3. Optimize Rule Configuration

- Disable expensive rules in development
- Use rule severity appropriately (error vs warning)
- Consider using `--max-warnings` to control output

### 4. Parallel Processing

Some ESLint configurations support parallel processing:

- Use worker threads if available
- Consider splitting large codebases
- Use incremental linting approaches

## Related Commands

- `/js-setup` - Configure ESLint and project
- `/js-test` - Run tests after linting
- `/js-build` - Build project (linting often part of build)
- `/js-format` - Code formatting (complements linting)
- `/ts-typecheck` - TypeScript type checking

## Best Practices

### 1. Start with Recommended Config

```bash
# Begin with ESLint recommended rules
npx eslint --init
# Choose: "Use a popular style guide"
```

### 2. Gradually Add Rules

- Start with essential rules
- Add rules incrementally
- Customize based on team preferences
- Document rule decisions

### 3. Auto-fix in Development

```bash
# Use auto-fix during development
/js-lint --fix

# Or configure editor to fix on save
```

### 4. CI Enforcement

- Run linting in CI pipeline
- Fail on errors
- Set warning thresholds
- Report results clearly

### 5. Regular Updates

- Keep ESLint and plugins updated
- Review new rules periodically
- Update configuration as needed
- Consider migration to new config formats

## Tips

1. **Run setup first**: Use `/js-setup` to configure ESLint properly
2. **Use auto-fix**: Save time with `--fix` option
3. **Configure editor**: Integrate with your editor for real-time feedback
4. **Start simple**: Begin with recommended rules, then customize
5. **Document decisions**: Keep a record of rule choices and exceptions
6. **Regular reviews**: Periodically review linting results and configuration
7. **Team alignment**: Ensure team agrees on coding standards
8. **Performance**: Use caching for large projects

For complex linting setups or specific framework requirements, check the ESLint documentation or run `/js-setup` to reconfigure your linting setup.
