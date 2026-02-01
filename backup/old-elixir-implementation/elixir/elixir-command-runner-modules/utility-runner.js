class UtilityRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async clean(options = {}) {
    const args = [];

    if (options.all) {
      args.push('--all');
    }

    if (options.deps) {
      args.push('--deps');
    }

    if (options.build) {
      args.push('--build');
    }

    if (options.release) {
      args.push('--release');
    }

    if (options.logs) {
      args.push('--logs');
    }

    return await this.commandExecutor.executeMixCommand('clean', args, options);
  }

  async run(task, args = [], options = {}) {
    const allArgs = [task, ...args];
    return await this.commandExecutor.executeMixCommand('run', allArgs, options);
  }

  async getProjectInfo() {
    try {
      const version = await this.commandExecutor.executeMixCommand('--version', [], {
        stdio: 'pipe',
      });
      const deps = await this.commandExecutor.executeMixCommand('deps', [], { stdio: 'pipe' });
      const compile = await this.commandExecutor.executeMixCommand('compile', [], {
        stdio: 'pipe',
      });

      return {
        version: version.stdout.trim(),
        dependencies: deps.stdout,
        compileStatus: compile.stdout,
      };
    } catch (error) {
      this.loggingUtils.warn(`Failed to get project info: ${error.message}`);
      return {
        version: 'Unknown',
        dependencies: 'Failed to retrieve',
        compileStatus: 'Failed to retrieve',
      };
    }
  }

  async showCompilationInfo(options) {
    try {
      const versionResult = await this.commandExecutor.executeMixCommand('--version', [], {
        stdio: 'pipe',
      });

      const projectResult = await this.commandExecutor.executeMixCommand(
        'run',
        ['-e', 'IO.puts("Project: #{Mix.Project.config()[:app]}")'],
        {
          stdio: 'pipe',
        }
      );

      const envResult = await this.commandExecutor.executeMixCommand(
        'run',
        ['-e', 'IO.puts("Environment: #{Mix.env()}")'],
        {
          stdio: 'pipe',
        }
      );

      this.loggingUtils.info('\n📋 Compilation Information:');
      this.loggingUtils.info(`   • ${versionResult.stdout.trim()}`);
      this.loggingUtils.info(`   • ${projectResult.stdout.trim()}`);
      this.loggingUtils.info(`   • ${envResult.stdout.trim()}`);

      if (options.verbose) {
        const depsResult = await this.commandExecutor.executeMixCommand('deps', [], {
          stdio: 'pipe',
        });
        this.loggingUtils.info(
          `   • Dependencies: ${depsResult.stdout.split('\n').length} packages`
        );
      }
    } catch (error) {
      this.loggingUtils.warn(`Failed to show compilation info: ${error.message}`);
    }
  }
}

module.exports = UtilityRunner;
