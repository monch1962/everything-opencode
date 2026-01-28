# TemplateUtils API Documentation

*Generated: 2026-01-28T01:29:17.969Z*

### Main Class

*File: scripts/lib/template-utils.js*

* Template Generation Utilities - Refactored Version
 *
 * Generate files and code from templates for language tools
 * This is a refactored version that delegates to modular components while
 * maintaining 100% backward compatibility with the original API.
 

const path = require('path');
const fs = require('fs');
const { ensureDir, writeFile } = require('./utils');
const FileUtils = require('./file-utils');

// Import modules
const TemplateCore = require('./template-modules/template-core');
const DirectoryProcessor = require('./template-modules/directory-processor');
const LanguageTemplates = require('./template-modules/language-templates');
const ProjectGenerator = require('./template-modules/project-generator');
const TemplateValidator = require('./template-modules/template-validator');

/**
 * Template Generation Utilities - Main class for template-based file generation
 *
 * This class provides static methods for rendering templates, generating files,
 * and creating language-specific projects. It delegates to modular components
 * while maintaining 100% backward compatibility with the original API.
 *
 * @class TemplateUtils
 */
class TemplateUtils

#### Methods

##### `renderTemplate()`

Template Generation Utilities - Refactored Version
 Generate files and code from templates for language tools
 This is a refactored version that delegates to modular components while
 maintaining 100% backward compatibility with the original API.

##### `renderTemplateFile()`

Render template file

##### `generateFile()`

Generate file from template

##### `generateFromTemplateDir()`

Generate files from template directory

##### `_processTemplateDir()`

Process template directory recursively

##### `getLanguageTemplates()`

Get language-specific templates

##### `generateLanguageProject()`

Generate language project

##### `generateLanguageConfig()`

Generate language configuration

##### `generateReadme()`

Generate README file

##### `generateGitignore()`

Generate .gitignore file

##### `validateVariables()`

Validate template variables

#### Exports

`TemplateUtils`


## Modules

### Directory Processor

*File: scripts/lib/template-modules/directory-processor.js*

#### Methods

##### `generateFromTemplateDir()`

Directory Processor Module for TemplateUtils
 Directory template processing methods: generateFromTemplateDir, _processTemplateDir

##### `_processTemplateDir()`

Process template directory recursively

#### Exports

`DirectoryProcessor`

### Language Templates

*File: scripts/lib/template-modules/language-templates.js*

#### Methods

##### `getLanguageTemplates()`

Language Templates Module for TemplateUtils
 Language-specific template methods: getLanguageTemplates, generateLanguageProject, generateLanguageConfig

##### `generateLanguageProject()`

Generate language project

##### `generateLanguageConfig()`

Generate language configuration

#### Exports

`LanguageTemplates`

### Project Generator

*File: scripts/lib/template-modules/project-generator.js*

#### Methods

##### `generateReadme()`

Project Generator Module for TemplateUtils
 Project file generation methods: generateReadme, generateGitignore

##### `generateGitignore()`

Generate .gitignore file

#### Exports

`ProjectGenerator`

### Template Core

*File: scripts/lib/template-modules/template-core.js*

#### Methods

##### `renderTemplate()`

Template Core Module for TemplateUtils
 Core template rendering methods: renderTemplate, renderTemplateFile, generateFile

##### `renderTemplateFile()`

Render template file

##### `generateFile()`

Generate file from template

#### Exports

`TemplateCore`

### Template Validator

*File: scripts/lib/template-modules/template-validator.js*

* Template Validator Module for TemplateUtils
 *
 * Validation methods: validateVariables
 

class TemplateValidator

#### Methods

##### `validateVariables()`

Template Validator Module for TemplateUtils
 Validation methods: validateVariables

##### `_extractTemplateVariables()`

Extract template variables from object values

##### `sanitizeVariables()`

Sanitize variable values

##### `generateVariableDocs()`

Generate variable documentation

##### `_getVariableDescription()`

Get variable description

##### `_getVariableExample()`

Get variable example

#### Exports

`TemplateValidator`


## Usage Examples

For detailed usage examples, see:
- `docs/examples/QUICK-START-EXAMPLES.md` - Quick start examples
- `docs/examples/` - Comprehensive examples directory

## Validation

Run validation scripts to ensure module functionality:
```bash
node validate-template-utils.js
```

## Testing

Run the test suite to verify functionality:
```bash
npm test
```

