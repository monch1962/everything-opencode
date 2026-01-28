#!/usr/bin/env node
/**
 * Go Project Creator Module for GoConfigWizard
 *
 * Project creation methods: interactiveProjectCreation, createModuleProject, createCLIProject,
 * createWebProject, createLibraryProject, createWorkspaceProject
 */

const fs = require('fs');
const path = require('path');
const { runCommand } = require('../../scripts/lib/utils');

class GoProjectCreator {
  constructor(projectPath, projectDetector) {
    this.projectPath = projectPath;
    this.projectDetector = projectDetector;
  }

  /**
   * Interactive project creation with Go-specific options
   */
  async interactiveProjectCreation(options) {
    console.log('\n📋 Create new Go project:');
    console.log('1. Simple Go module');
    console.log('2. CLI application');
    console.log('3. Web service/API');
    console.log('4. Library/package');
    console.log('5. Go workspace (multiple modules)');
    console.log('6. Cancel');

    // In a real implementation, this would use interactive prompts
    // For now, default to simple module
    const choice = options.projectType || '1';

    let projectConfig;

    switch (choice) {
      case '1':
      case 'module':
        projectConfig = await this.createModuleProject();
        break;
      case '2':
      case 'cli':
        projectConfig = await this.createCLIProject();
        break;
      case '3':
      case 'web':
        projectConfig = await this.createWebProject();
        break;
      case '4':
      case 'library':
        projectConfig = await this.createLibraryProject();
        break;
      case '5':
      case 'workspace':
        projectConfig = await this.createWorkspaceProject();
        break;
      default:
        console.log('Project creation cancelled');
        process.exit(0);
    }

    return projectConfig;
  }

  /**
   * Create a simple Go module
   */
  async createModuleProject() {
    const moduleName = this.projectDetector.suggestModuleName();

    console.log(`\n📦 Creating Go module: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');
    } catch (error) {
      console.log(`⚠️ Could not create go.mod: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'module',
      goVersion: this.projectDetector.getProjectGoVersion(),
    };
  }

  /**
   * Create a CLI application project
   */
  async createCLIProject() {
    const moduleName = this.projectDetector.suggestModuleName();

    console.log(`\n🖥️ Creating CLI application: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');

      // Create cmd directory structure
      const cmdDir = path.join(this.projectPath, 'cmd', moduleName.split('/').pop() || 'app');
      fs.mkdirSync(cmdDir, { recursive: true });

      // Create main.go template
      const mainGo = `package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: ${moduleName.split('/').pop() || 'app'} <command>")
		fmt.Println("Commands:")
		fmt.Println("  hello - Say hello")
		os.Exit(1)
	}

	command := os.Args[1]
	switch command {
	case "hello":
		fmt.Println("Hello from ${moduleName}!")
	default:
		fmt.Printf("Unknown command: %s\\n", command)
		os.Exit(1)
	}
}`;

      fs.writeFileSync(path.join(cmdDir, 'main.go'), mainGo);
      console.log('✅ Created cmd/ directory with main.go');
    } catch (error) {
      console.log(`⚠️ Could not create CLI project: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'cli',
      goVersion: this.projectDetector.getProjectGoVersion(),
      hasCmdStructure: true,
    };
  }

  /**
   * Create a web service/API project
   */
  async createWebProject() {
    const moduleName = this.projectDetector.suggestModuleName();

    console.log(`\n🌐 Creating web service: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');

      // Install common web dependencies
      runCommand('go get github.com/gorilla/mux', { cwd: this.projectPath });
      runCommand('go get github.com/rs/cors', { cwd: this.projectPath });
      console.log('✅ Installed web dependencies');

      // Create internal directory structure
      const internalDir = path.join(this.projectPath, 'internal');
      fs.mkdirSync(internalDir, { recursive: true });

      // Create cmd directory
      const cmdDir = path.join(this.projectPath, 'cmd', 'server');
      fs.mkdirSync(cmdDir, { recursive: true });

      // Create main.go template
      const mainGo = `package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	r := mux.NewRouter()

	// Health check endpoint
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	// API v1 routes
	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Hello from ${moduleName} API!"))
	}).Methods("GET")

	// CORS middleware
	handler := cors.Default().Handler(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}`;

      fs.writeFileSync(path.join(cmdDir, 'main.go'), mainGo);
      console.log('✅ Created web server structure');
    } catch (error) {
      console.log(`⚠️ Could not create web project: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'web',
      goVersion: this.projectDetector.getProjectGoVersion(),
      hasCmdStructure: true,
      webFramework: 'gorilla/mux',
    };
  }

  /**
   * Create a library/package project
   */
  async createLibraryProject() {
    const moduleName = this.projectDetector.suggestModuleName();

    console.log(`\n📚 Creating library: ${moduleName}`);

    try {
      runCommand(`go mod init ${moduleName}`, { cwd: this.projectPath });
      console.log('✅ Created go.mod');

      // Create pkg directory structure
      const pkgDir = path.join(this.projectPath, 'pkg');
      fs.mkdirSync(pkgDir, { recursive: true });

      // Create example package
      const exampleDir = path.join(pkgDir, 'example');
      fs.mkdirSync(exampleDir, { recursive: true });

      // Create example.go
      const exampleGo = `package example

// Hello returns a greeting message
func Hello(name string) string {
	if name == "" {
		name = "World"
	}
	return "Hello, " + name + "!"
}

// Add adds two integers
func Add(a, b int) int {
	return a + b
}`;

      fs.writeFileSync(path.join(exampleDir, 'example.go'), exampleGo);

      // Create example_test.go
      const exampleTestGo = `package example

import "testing"

func TestHello(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"empty name", "", "Hello, World!"},
		{"with name", "Alice", "Hello, Alice!"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Hello(tt.input)
			if result != tt.expected {
				t.Errorf("Hello(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestAdd(t *testing.T) {
	result := Add(2, 3)
	if result != 5 {
		t.Errorf("Add(2, 3) = %d, want 5", result)
	}
}`;

      fs.writeFileSync(path.join(exampleDir, 'example_test.go'), exampleTestGo);
      console.log('✅ Created library structure with example package');
    } catch (error) {
      console.log(`⚠️ Could not create library project: ${error.message}`);
    }

    return {
      type: 'new',
      moduleName,
      projectType: 'library',
      goVersion: this.projectDetector.getProjectGoVersion(),
      hasPkgStructure: true,
    };
  }

  /**
   * Create a Go workspace (multiple modules)
   */
  async createWorkspaceProject() {
    console.log('\n🏢 Creating Go workspace');

    try {
      runCommand('go work init', { cwd: this.projectPath });
      console.log('✅ Created go.work');

      // Create example modules
      const modules = ['api', 'cli', 'pkg'];
      const moduleConfigs = [];

      for (const module of modules) {
        const moduleDir = path.join(this.projectPath, module);
        fs.mkdirSync(moduleDir, { recursive: true });

        const moduleName = `${this.projectDetector.suggestModuleName()}/${module}`;
        runCommand(`go mod init ${moduleName}`, { cwd: moduleDir });
        runCommand(`go work use ./${module}`, { cwd: this.projectPath });

        moduleConfigs.push({
          name: module,
          path: module,
          moduleName,
        });

        console.log(`✅ Created module: ${module}`);
      }

      return {
        type: 'new',
        projectType: 'workspace',
        goVersion: this.projectDetector.getProjectGoVersion(),
        modules: moduleConfigs,
        isWorkspace: true,
      };
    } catch (error) {
      console.log(`⚠️ Could not create workspace: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create project based on type
   */
  async createProject(projectType, options = {}) {
    switch (projectType) {
      case 'module':
        return this.createModuleProject();
      case 'cli':
        return this.createCLIProject();
      case 'web':
        return this.createWebProject();
      case 'library':
        return this.createLibraryProject();
      case 'workspace':
        return this.createWorkspaceProject();
      default:
        throw new Error(`Unknown project type: ${projectType}`);
    }
  }
}

module.exports = GoProjectCreator;
