const path = require('path');
const fs = require('fs');

class BuildRunner {
  constructor(commandExecutor, loggingUtils) {
    this.commandExecutor = commandExecutor;
    this.loggingUtils = loggingUtils;
  }

  async build(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    const projectInfo = this.commandExecutor.runner.getJSProjectInfo();
    const buildCommand = 'build';
    let buildArgs = args;

    if (projectInfo.hasTsConfig) {
      buildArgs = ['tsc', ...buildArgs];
    }

    this.loggingUtils.info(`🔨 Building project...`);

    try {
      const result = await this.commandExecutor.executeNpmCommand(
        'run',
        [buildCommand, ...buildArgs],
        options
      );

      this._showBuildInfo(projectInfo);

      return result;
    } catch (error) {
      this._suggestBuildFix(error.message);
      throw error;
    }
  }

  async dev(args = [], options = {}) {
    await this.commandExecutor.runner.initialize();

    let devCommand = 'dev';
    const devArgs = args;

    const scripts = ['dev', 'start', 'develop'];
    const packageJsonPath = path.join(this.commandExecutor.runner.projectPath, 'package.json');

    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        for (const script of scripts) {
          if (packageJson.scripts && packageJson.scripts[script]) {
            devCommand = script;
            break;
          }
        }
      }
    } catch (error) {}

    this.loggingUtils.info(`🚀 Starting development server with ${devCommand}...`);

    try {
      const result = await this.commandExecutor.executeNpmCommand(
        'run',
        [devCommand, ...devArgs],
        options
      );

      this.loggingUtils.info('✅ Development server started');

      return result;
    } catch (error) {
      this._suggestDevFix(error.message);
      throw error;
    }
  }

  _showBuildInfo(projectInfo) {
    try {
      const distPath = path.join(this.commandExecutor.runner.projectPath, 'dist');
      const buildPath = path.join(this.commandExecutor.runner.projectPath, 'build');

      let outputDir = null;
      if (fs.existsSync(distPath) && fs.statSync(distPath).isDirectory()) {
        outputDir = distPath;
      } else if (fs.existsSync(buildPath) && fs.statSync(buildPath).isDirectory()) {
        outputDir = buildPath;
      }

      if (outputDir) {
        const files = fs.readdirSync(outputDir);
        const size = this._getDirectorySize(outputDir);

        this.loggingUtils.info('\n📦 Build Information:');
        this.loggingUtils.info('='.repeat(40));
        this.loggingUtils.info(`Output directory: ${path.basename(outputDir)}`);
        this.loggingUtils.info(`Files generated: ${files.length}`);
        this.loggingUtils.info(`Total size: ${(size / 1024 / 1024).toFixed(2)} MB`);
        this.loggingUtils.info('='.repeat(40));

        if (projectInfo.hasTsConfig) {
          this.loggingUtils.info('✅ TypeScript compilation successful');
        }
      }
    } catch (error) {}
  }

  _getDirectorySize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        size += this._getDirectorySize(filePath);
      } else {
        size += stat.size;
      }
    }

    return size;
  }

  _suggestBuildFix(errorMessage) {
    this.loggingUtils.info('\n💡 Build Error Suggestions:');

    if (errorMessage.includes('TypeScript') || errorMessage.includes('tsc')) {
      this.loggingUtils.info('   • Install TypeScript: npm install --save-dev typescript');
      this.loggingUtils.info('   • Create tsconfig.json configuration');
      this.loggingUtils.info('   • Check TypeScript compiler options');
    }

    if (errorMessage.includes('module') || errorMessage.includes('import')) {
      this.loggingUtils.info('   • Check import/export statements');
      this.loggingUtils.info('   • Configure module resolution in tsconfig.json');
      this.loggingUtils.info('   • Install missing type definitions: @types/package-name');
    }

    if (errorMessage.includes('webpack') || errorMessage.includes('vite')) {
      this.loggingUtils.info('   • Check webpack/vite configuration');
      this.loggingUtils.info('   • Install build tool: npm install --save-dev webpack');
      this.loggingUtils.info('   • Review build configuration files');
    }

    if (errorMessage.includes('babel')) {
      this.loggingUtils.info(
        '   • Install Babel: npm install --save-dev @babel/core @babel/preset-env'
      );
      this.loggingUtils.info('   • Create .babelrc configuration');
      this.loggingUtils.info('   • Check Babel plugin compatibility');
    }
  }

  _suggestDevFix(errorMessage) {
    this.loggingUtils.info('\n💡 Development Server Error Suggestions:');

    if (errorMessage.includes('port') || errorMessage.includes('EADDRINUSE')) {
      this.loggingUtils.info('   • Change port: npm run dev -- --port 3001');
      this.loggingUtils.info('   • Kill process using port: lsof -ti:3000 | xargs kill');
      this.loggingUtils.info('   • Use different port in .env file');
    }

    if (errorMessage.includes('hot reload') || errorMessage.includes('HMR')) {
      this.loggingUtils.info('   • Check webpack/vite configuration for HMR');
      this.loggingUtils.info('   • Ensure dev server supports hot module replacement');
      this.loggingUtils.info('   • Check browser console for HMR errors');
    }

    if (errorMessage.includes('proxy') || errorMessage.includes('CORS')) {
      this.loggingUtils.info('   • Configure proxy in dev server config');
      this.loggingUtils.info('   • Add CORS headers to API responses');
      this.loggingUtils.info('   • Use middleware for development proxies');
    }

    if (errorMessage.includes('certificate') || errorMessage.includes('HTTPS')) {
      this.loggingUtils.info('   • Generate SSL certificates for local development');
      this.loggingUtils.info('   • Configure dev server for HTTPS');
      this.loggingUtils.info('   • Trust self-signed certificates in browser');
    }
  }
}

module.exports = BuildRunner;
