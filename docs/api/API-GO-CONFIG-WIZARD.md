# Go Config Wizard API Documentation

*Generated: 2026-01-28T01:29:17.977Z*

### Main Class

*File: languages/go/config-wizard.js*

#### Methods

##### `runWizard()`

Go Configuration Wizard - Refactored Version
 Interactive configuration for Go projects with Go-specific improvements
 This is a refactored version that delegates to modular components while
 maintaining 100% backward compatibility with the original API.

##### `showEnvironmentReport()`

Show Go-specific environment report

##### `detectOrCreateProject()`

Detect existing Go project or create new with Go-specific logic

##### `hasGoFiles()`

Check if directory has Go files

##### `createDefaultProject()`

Create default project configuration

##### `interactiveProjectCreation()`

Interactive project creation with Go-specific options

##### `createModuleProject()`

Create a simple Go module

##### `createCLIProject()`

Create a CLI application project

##### `createWebProject()`

Create a web service/API project

##### `createLibraryProject()`

Create a library/package project

##### `createWorkspaceProject()`

Create a Go workspace (multiple modules)

##### `readGoMod()`

Read go.mod file

##### `suggestModuleName()`

Suggest module name based on directory

##### `configureProject()`

Configure project with Go-specific settings

##### `generateConfiguration()`

Generate complete configuration with Go-specific improvements

##### `saveConfiguration()`

Save configuration to file

##### `showInstallationGuide()`

Show installation guide for Go tools

##### `showCompletionMessage()`

Show completion message with Go-specific resources

#### Exports

`GoConfigWizard`


## Modules

### Go Config Generator

*File: languages/go/config-wizard-modules/go-config-generator.js*

#### Methods

##### `configureProject()`

Go Config Generator Module for GoConfigWizard
 Configuration methods: configureProject, generateConfiguration, saveConfiguration

##### `generateConfiguration()`

Generate complete configuration with Go-specific improvements

##### `saveConfiguration()`

Save configuration to file

##### `createGolangCIConfig()`

Create .golangci.yml configuration

##### `createMakefile()`

Create Makefile for Go project

##### `createReadme()`

Create README.md for Go project

#### Exports

`GoConfigGenerator`

### Go Project Creator

*File: languages/go/config-wizard-modules/go-project-creator.js*

#### Methods

##### `interactiveProjectCreation()`

Go Project Creator Module for GoConfigWizard
 Project creation methods: interactiveProjectCreation, createModuleProject, createCLIProject,
 createWebProject, createLibraryProject, createWorkspaceProject

##### `createModuleProject()`

Create a simple Go module

##### `createCLIProject()`

Create a CLI application project

##### `createWebProject()`

Create a web service/API project

##### `createLibraryProject()`

Create a library/package project

##### `createWorkspaceProject()`

Create a Go workspace (multiple modules)

##### `createProject()`

Create project based on type

#### Exports

`GoProjectCreator`

### Go Project Detector

*File: languages/go/config-wizard-modules/go-project-detector.js*

#### Methods

##### `detectOrCreateProject()`

Go Project Detector Module for GoConfigWizard
 Project detection methods: detectOrCreateProject, hasGoFiles, suggestModuleName, readGoMod

##### `hasGoFiles()`

Check if directory has Go files

##### `readGoMod()`

Read go.mod file

##### `readGoWork()`

Read go.work file

##### `suggestModuleName()`

Suggest module name based on directory

##### `createDefaultProject()`

Create default project configuration

##### `getProjectInfo()`

Get project information

##### `isWorkspace()`

Check if project is a workspace

##### `hasModules()`

Check if project has modules

##### `getProjectGoVersion()`

Get Go version from project

#### Exports

`GoProjectDetector`

### Go Wizard Core

*File: languages/go/config-wizard-modules/go-wizard-core.js*

#### Methods

##### `runWizard()`

Go Wizard Core Module for GoConfigWizard
 Core wizard methods: constructor, runWizard, showEnvironmentReport, showInstallationGuide, showCompletionMessage

##### `showEnvironmentReport()`

Show Go-specific environment report

##### `showInstallationGuide()`

Show installation guide for Go tools

##### `showCompletionMessage()`

Show completion message with Go-specific resources

##### `getDetectedTools()`

Get detected tools

##### `getToolDetector()`

Get tool detector

##### `getProjectPath()`

Get project path

#### Exports

`GoWizardCore`


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

