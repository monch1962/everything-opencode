#!/usr/bin/env node
/**
 * Command Executor for Clojure Command Runner
 *
 * Executes commands for different Clojure build tools
 */

const { spawn } = require('child_process');
const { LoggingUtils } = require('../../lib');

class CommandExecutor {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Execute Clojure CLI command
   */
  async executeClojureCliCommand(args = [], options = {}) {
    LoggingUtils.debug(`Executing: clojure ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('clojure', args, {
        cwd: this.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`clojure command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute clojure command: ${error.message}`));
      });
    });
  }

  /**
   * Execute Leiningen command
   */
  async executeLeiningenCommand(command, args = [], options = {}) {
    const allArgs = [command, ...args];
    LoggingUtils.debug(`Executing: lein ${allArgs.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('lein', allArgs, {
        cwd: this.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`lein ${command} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute lein ${command}: ${error.message}`));
      });
    });
  }

  /**
   * Execute Boot command
   */
  async executeBootCommand(args = [], options = {}) {
    LoggingUtils.debug(`Executing: boot ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn('boot', args, {
        cwd: this.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`boot command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute boot command: ${error.message}`));
      });
    });
  }

  /**
   * Execute build tool command based on detected tool
   */
  async executeBuildToolCommand(buildTool, command, args = [], options = {}) {
    switch (buildTool) {
      case 'clojure-cli':
        return await this.executeClojureCliCommand([command, ...args], options);
      case 'leiningen':
        return await this.executeLeiningenCommand(command, args, options);
      case 'boot':
        return await this.executeBootCommand([command, ...args], options);
      default:
        throw new Error(`Unsupported build tool: ${buildTool}`);
    }
  }

  /**
   * Execute generic command with spawn
   */
  async executeCommand(command, args = [], options = {}) {
    LoggingUtils.debug(`Executing: ${command} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: this.projectPath,
        stdio: options.stdio || 'inherit',
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      if (options.stdio === 'pipe') {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code: 0, stdout, stderr });
        } else {
          reject(new Error(`${command} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        LoggingUtils.debug(`🔍 Exec error: ${error.message}`);
        reject(new Error(`Failed to execute ${command}: ${error.message}`));
      });
    });
  }

  /**
   * Check if command exists
   */
  async commandExists(command) {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      const check = spawn('which', [command], { stdio: 'pipe' });

      check.on('close', (code) => {
        resolve(code === 0);
      });

      check.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Get command version
   */
  async getCommandVersion(command, versionFlag = '--version') {
    try {
      const result = await this.executeCommand(command, [versionFlag], { stdio: 'pipe' });
      return result.stdout.trim();
    } catch (error) {
      return null;
    }
  }
}

module.exports = CommandExecutor;
