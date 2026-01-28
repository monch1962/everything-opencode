# Command Runners API Documentation

*Generated: 2026-01-28T01:29:17.974Z*

### Main Class

*File: scripts/clojure/command-runner.js*

#### Methods

##### `initialize()`

Clojure Command Runner (Refactored)
 Execute Clojure commands with Clojure-specific improvements and error handling
 Modular version of the original command-runner.js

##### `_setupTaskRunner()`

Setup task runner with command executor methods

##### `getClojureProjectInfo()`

Get Clojure project information

##### `executeClojureCliCommand()`

Execute Clojure CLI command

##### `executeLeiningenCommand()`

Execute Leiningen command

##### `executeBootCommand()`

Execute Boot command

##### `executeBuildToolCommand()`

Execute build tool command based on detected tool

##### `test()`

Run tests

##### `build()`

Build project

##### `repl()`

Start REPL

##### `lint()`

Run linter

##### `format()`

Format code

##### `run()`

Run project

##### `clean()`

Clean build artifacts

##### `deps()`

Update dependencies

##### `getProjectInfo()`

Get project information

##### `generateProjectReport()`

Generate comprehensive project report

##### `getInstallationInstructions()`

Get installation instructions for missing tools

##### `getRecommendedBuildTool()`

Get recommended build tool

##### `validate()`

Validate project and tools

##### `_generateRecommendations()`

Generate recommendations based on validation results

##### `executeCommand()`

Execute custom command with error handling

##### `commandExists()`

Check if command exists

##### `getCommandVersion()`

Get command version

#### Exports

`ClojureCommandRunner`


## Modules

### Build Tool Detector

*File: scripts/clojure/command-runner-modules/build-tool-detector.js*

#### Methods

##### `detectTools()`

Build Tool Detector for Clojure Command Runner
 Detects and manages Clojure build tools (Clojure CLI, Leiningen, Boot)

##### `detectClojureCli()`

Detect Clojure CLI (deps.edn)

##### `detectLeiningen()`

Detect Leiningen (project.clj)

##### `detectBoot()`

Detect Boot (build.boot)

##### `detectProjectFiles()`

Detect project files

##### `determineBuildTool()`

Determine which build tool to use

##### `getBuildToolInfo()`

Get build tool information

##### `getProjectFilePath()`

Get project file path for current build tool

##### `validateEssentialTools()`

Validate that essential tools are available

##### `getRecommendedBuildTool()`

Get recommended build tool based on project structure

##### `getInstallationInstructions()`

Get installation instructions for missing tools

##### `generateEnvironmentReport()`

Generate environment report

#### Exports

`BuildToolDetector`

### Command Executor

*File: scripts/clojure/command-runner-modules/command-executor.js*

#### Methods

##### `executeClojureCliCommand()`

Command Executor for Clojure Command Runner
 Executes commands for different Clojure build tools

##### `executeLeiningenCommand()`

Execute Leiningen command

##### `executeBootCommand()`

Execute Boot command

##### `executeBuildToolCommand()`

Execute build tool command based on detected tool

##### `executeCommand()`

Execute generic command with spawn

##### `commandExists()`

Check if command exists

##### `getCommandVersion()`

Get command version

#### Exports

`CommandExecutor`

### Error Handler

*File: scripts/clojure/command-runner-modules/error-handler.js*

#### Methods

##### `handleClojureError()`

Error Handler for Clojure Command Runner
 Provides Clojure-specific error handling and suggestions

##### `suggestClojureFix()`

Suggest Clojure fixes based on error message

##### `suggestBuildToolFix()`

Suggest build tool specific fixes

##### `suggestTestFix()`

Suggest test fixes

##### `suggestBuildFix()`

Suggest build fixes

##### `suggestReplFix()`

Suggest REPL fixes

##### `suggestLintFix()`

Suggest lint fixes

##### `suggestFormatFix()`

Suggest format fixes

##### `suggestRunFix()`

Suggest run fixes

##### `suggestCleanFix()`

Suggest clean fixes

##### `suggestDepsFix()`

Suggest deps fixes

##### `getErrorType()`

Get error type from error message

##### `analyzeError()`

Get detailed error analysis

##### `getErrorSuggestions()`

Get error suggestions based on type

##### `getErrorSeverity()`

Get error severity

##### `generateErrorReport()`

Generate error report

#### Exports

`ClojureErrorHandler`

### Project Manager

*File: scripts/clojure/command-runner-modules/project-manager.js*

#### Methods

##### `initialize()`

Project Manager for Clojure Command Runner
 Manages Clojure project information and configuration

##### `getClojureProjectInfo()`

Get Clojure project information

##### `getConfig()`

Get project configuration

##### `updateConfig()`

Update project configuration

##### `getProjectMetadata()`

Get project metadata

##### `validateProjectStructure()`

Validate project structure

##### `findClojureFiles()`

Find Clojure files in directory

##### `getProjectStatistics()`

Get project statistics

##### `generateProjectReport()`

Generate project report

#### Exports

`ProjectManager`

### Task Runner

*File: scripts/clojure/command-runner-modules/task-runner.js*

#### Methods

##### `test()`

Task Runner for Clojure Command Runner
 Implements specific Clojure tasks (test, build, repl, etc.)

##### `build()`

Build project

##### `repl()`

Start REPL

##### `lint()`

Run linter

##### `format()`

Format code

##### `run()`

Run project

##### `clean()`

Clean build artifacts

##### `deps()`

Update dependencies

##### `showTestSummary()`

Show test summary

##### `showBuildInfo()`

Show build information

##### `suggestTestFix()`

Suggest test fixes

##### `suggestBuildFix()`

Suggest build fixes

##### `suggestReplFix()`

Suggest REPL fixes

##### `suggestLintFix()`

Suggest lint fixes

##### `suggestFormatFix()`

Suggest format fixes

##### `suggestRunFix()`

Suggest run fixes

##### `suggestCleanFix()`

Suggest clean fixes

##### `suggestDepsFix()`

Suggest deps fixes

##### `executeClojureCliCommand()`

Execute Clojure CLI command (delegated to CommandExecutor)

##### `executeLeiningenCommand()`

Execute Leiningen command (delegated to CommandExecutor)

##### `executeBootCommand()`

Execute Boot command (delegated to CommandExecutor)

#### Exports

`TaskRunner`


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

