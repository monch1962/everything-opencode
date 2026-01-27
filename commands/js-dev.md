# `/js-dev` - JavaScript/TypeScript Development Server

Start a development server for JavaScript and TypeScript projects with hot reload and intelligent defaults.

## Overview

The `/js-dev` command starts a development server for your JavaScript or TypeScript project with hot module replacement (HMR), live reload, and framework-specific optimizations. It automatically detects your project type and starts the appropriate development server.

## Features

- **Automatic Server Detection**: Detects and starts the correct development server for your project
- **Hot Module Replacement**: Live code updates without page refresh
- **Framework Support**: Works with React, Vue, Angular, Next.js, Nuxt, Svelte, and more
- **Port Management**: Automatic port selection and conflict resolution
- **Error Overlays**: In-browser error displays with stack traces
- **TypeScript Support**: Real-time TypeScript compilation and type checking
- **Environment Variables**: Automatic loading of development environment variables

## Usage

```bash
/js-dev [options]
```

### Options

| Option    | Short | Description                                  |
| --------- | ----- | -------------------------------------------- |
| `--port`  | `-p`  | Specify port number (default: auto-detected) |
| `--host`  | `-h`  | Specify host address (default: localhost)    |
| `--open`  | `-o`  | Open browser automatically                   |
| `--https` | `-s`  | Enable HTTPS                                 |
| `--help`  |       | Show help message                            |

## What It Does

### 1. Project Detection

- Checks for `package.json` and development scripts
- Detects framework and development server
- Identifies TypeScript configuration
- Determines appropriate development command

### 2. Server Startup

- Starts the correct development server
- Configures hot module replacement
- Sets up error overlays and logging
- Handles port conflicts automatically

### 3. Development Features

- **Hot Module Replacement**: Instant code updates
- **Live Reload**: Automatic browser refresh on file changes
- **Error Overlays**: In-browser error displays
- **Source Maps**: Debug-friendly compiled code
- **Type Checking**: Real-time TypeScript validation

## Supported Development Servers

### Framework Development Servers

- **React**: `react-scripts start`, `vite dev`
- **Vue**: `vue-cli-service serve`, `vite dev`
- **Angular**: `ng serve`
- **Next.js**: `next dev`
- **Nuxt**: `nuxt dev`
- **Svelte**: `svelte-kit dev`, `vite dev`
- **Astro**: `astro dev`

### Build Tool Development Servers

- **Vite**: `vite dev` (next-generation frontend tooling)
- **Webpack Dev Server**: `webpack serve`
- **Parcel**: `parcel serve`
- **esbuild**: Custom development server setup

### Static Servers

- **serve**: Simple static file server
- **http-server**: Zero-configuration HTTP server
- **live-server**: Live reload capable server

## Examples

### Basic Development Server

```bash
# Start development server
/js-dev

# Output:
# 🚀 Starting development server...
# ✅ Server running at http://localhost:3000
# 🔥 Hot Module Replacement enabled
# 👀 Watching for file changes...
```

### Specific Port

```bash
# Start server on specific port
/js-dev --port 8080

# Output:
# 🚀 Starting development server on port 8080...
# ✅ Server running at http://localhost:8080
```

### Open Browser Automatically

```bash
# Start server and open browser
/js-dev --open

# Output:
# 🚀 Starting development server...
# ✅ Server running at http://localhost:3000
# 🌐 Opening browser to http://localhost:3000
```

### HTTPS Development Server

```bash
# Start HTTPS server
/js-dev --https

# Output:
# 🚀 Starting HTTPS development server...
# 🔒 Generating self-signed certificate...
# ✅ HTTPS server running at https://localhost:3000
# ⚠️  Self-signed certificate - browser may show security warning
```

## Configuration

### Package.json Scripts

The command looks for these development scripts in your `package.json`:

```json
{
  "scripts": {
    "dev": "your-dev-command",
    "start": "alternative-dev-command",
    "serve": "another-dev-command"
  }
}
```

### Development Server Configuration

Framework-specific configuration files:

- `vite.config.js` - Vite development configuration
- `webpack.config.js` - Webpack development configuration
- `next.config.js` - Next.js development configuration
- `nuxt.config.js` - Nuxt development configuration

### Environment Variables

Create `.env.development` or `.env.local` for development environment variables:

```env
# .env.development
API_URL=http://localhost:3001
DEBUG=true
NODE_ENV=development
```

## Common Issues and Solutions

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:

```bash
# Use a different port
/js-dev --port 3001

# Or find and kill the process using the port
# macOS/Linux: lsof -ti:3000 | xargs kill
# Windows: netstat -ano | findstr :3000
```

### Missing Development Script

**Error**: `No development script found in package.json`

**Solution**:

```bash
# Add dev script to package.json
echo '{"scripts": {"dev": "your-dev-command"}}' > package.json

# Or run setup first
/js-setup
```

### Framework Not Detected

**Error**: `Could not detect development server`

**Solution**:

```bash
# Install framework development dependencies
npm install --save-dev react-scripts  # For React
npm install --save-dev @vue/cli-service  # For Vue
npm install --save-dev @angular/cli  # For Angular

# Or run setup to configure
/js-setup
```

### Hot Reload Not Working

**Symptoms**: Page doesn't update automatically

**Solution**:

1. Check browser console for errors
2. Ensure file watcher is working
3. Check network tab for HMR requests
4. Try disabling browser extensions
5. Restart development server

## Advanced Usage

### Custom Development Configuration

```bash
# Pass custom arguments to development server
/js-dev -- --mode development --host 0.0.0.0
```

### Development with Proxy

Configure proxy for API requests in your development server configuration:

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
};
```

### Development with Mock Data

```bash
# Start server with mock data enabled
MOCK_API=true /js-dev
```

## Performance Tips

### 1. Use Appropriate Development Server

- **Vite**: Fastest for modern projects
- **Webpack**: Most comprehensive, good for complex setups
- **Framework-specific**: Optimized for that framework

### 2. Optimize File Watching

- Exclude unnecessary directories from watching
- Use polling if file system events don't work
- Increase watch options for large projects

### 3. Memory Management

- Restart server if memory usage grows too high
- Use `--max-old-space-size` for Node.js memory limits
- Monitor with process managers

### 4. Caching Strategies

- Enable persistent caching for faster restarts
- Use memory caching for frequently changed files
- Configure cache invalidation appropriately

## Integration with Other Commands

### Development Workflow

```bash
# Complete development workflow
/js-setup           # Configure project
/js-dev            # Start development server
# Edit code - changes appear automatically
/js-test           # Run tests in another terminal
/js-lint           # Check code quality
/js-build          # Build for production
```

### Debugging Workflow

```bash
# Debug development issues
/js-dev --port 3000  # Start server
# Check browser console for errors
# Use browser dev tools for debugging
# Add console.log statements as needed
```

### TypeScript Development

```bash
# TypeScript development workflow
/js-setup           # Configure TypeScript
/js-dev            # Start server with TypeScript
# Type errors appear in browser and terminal
/ts-typecheck      # Additional type checking
```

## Related Commands

- `/js-setup` - Configure JavaScript/TypeScript project
- `/js-build` - Build project for production
- `/js-test` - Run tests
- `/js-lint` - Check code quality
- `/ts-typecheck` - TypeScript type checking

## Security Considerations

### Development vs Production

- Development servers are NOT for production use
- Disable development features in production builds
- Never expose development servers to the internet

### Self-Signed Certificates

- HTTPS in development uses self-signed certificates
- Browser will show security warnings
- Only for local development testing

### Environment Variables

- Never commit `.env.development` with secrets
- Use different secrets for development and production
- Consider using `.env.local` for personal development settings

## Tips

1. **Use setup first**: Run `/js-setup` to configure development server
2. **Check port conflicts**: Use `--port` to avoid conflicts
3. **Monitor console**: Both terminal and browser console show important information
4. **Use hot reload**: Saves time during development
5. **Configure proxies**: For API development against separate servers
6. **Use HTTPS when needed**: For testing HTTPS-specific features
7. **Restart when needed**: If server behaves strangely, restart it
8. **Check dependencies**: Keep development dependencies updated

For framework-specific development issues, check the framework's documentation or run `/js-setup` to reconfigure your development environment.
