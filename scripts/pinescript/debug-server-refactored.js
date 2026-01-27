#!/usr/bin/env node
/**
 * PineScript Interactive Debugging Server (Refactored)
 *
 * Web-based debugging interface with real-time variable inspection,
 * breakpoints, step-through debugging, and live charts.
 *
 * Refactored version using modular architecture
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises; // eslint-disable-line no-unused-vars
const fileUpload = require('express-fileupload');

// Import modular components
const SecurityManager = require('./debug-server-modules/security-manager');
const DebugStateManager = require('./debug-server-modules/debug-state-manager');
const CodeAnalyzer = require('./debug-server-modules/code-analyzer');
const WebSocketManager = require('./debug-server-modules/websocket-manager');
const PineCommandRunner = require('./command-runner');

class PineScriptDebugServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.projectPath = options.projectPath || process.cwd();
    this.debugFile = options.file;
    this.runner = null;

    // Initialize modular components
    this.securityManager = new SecurityManager(options);
    this.debugStateManager = new DebugStateManager();
    this.codeAnalyzer = new CodeAnalyzer();

    // Initialize Express and Socket.IO
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // WebSocket manager will be initialized after setup
    this.webSocketManager = null;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocketManager();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(this.securityManager.securityMiddleware.bind(this.securityManager));

    // Rate limiting middleware
    this.app.use(this.securityManager.rateLimitMiddleware.bind(this.securityManager));

    // Body parsing
    this.app.use(express.json({ limit: this.securityManager.maxFileSize }));

    // Static files
    this.app.use(express.static(path.join(__dirname, '../../public')));

    // File upload with security
    this.app.use(
      fileUpload({
        limits: {
          fileSize: this.securityManager.maxFileSize,
          files: 1,
        },
        abortOnLimit: true,
        responseOnLimit: 'File size limit exceeded',
        safeFileNames: true,
        preserveExtension: true,
      }),
    );

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        version: '1.0.0',
      });
    });

    // API routes
    this.app.get('/api/status', (req, res) => {
      res.json(this.debugStateManager.getSessionStats());
    });

    this.app.get('/api/state', (req, res) => {
      res.json(this.debugStateManager.exportState());
    });

    this.app.post('/api/analyze', async (req, res) => {
      try {
        const { code } = req.body;
        if (!code) {
          return res.status(400).json({ error: 'Code is required' });
        }

        const analysis = await this.codeAnalyzer.analyzePineScript(code);
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/debug/start', (req, res) => {
      try {
        const { totalBars = 100 } = req.body;
        this.debugStateManager.startDebugging(totalBars);

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true, totalBars });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/debug/stop', (req, res) => {
      try {
        this.debugStateManager.stopDebugging();

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/debug/pause', (req, res) => {
      try {
        this.debugStateManager.pauseDebugging();

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/debug/resume', (req, res) => {
      try {
        this.debugStateManager.resumeDebugging();

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/debug/step', (req, res) => {
      try {
        const { steps = 1 } = req.body;
        const success = this.debugStateManager.stepDebugging(steps);

        if (success) {
          // Notify WebSocket clients
          if (this.webSocketManager) {
            this.webSocketManager.broadcastStateUpdate();
          }
          res.json({ success: true, steps });
        } else {
          res.json({ success: false, message: 'Debugging complete' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/debug/goto', (req, res) => {
      try {
        const { barIndex } = req.body;
        const success = this.debugStateManager.gotoBar(barIndex);

        if (success) {
          // Notify WebSocket clients
          if (this.webSocketManager) {
            this.webSocketManager.broadcastStateUpdate();
          }
          res.json({ success: true, barIndex });
        } else {
          res.status(400).json({ error: 'Invalid bar index' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Breakpoint routes
    this.app.post('/api/breakpoints', (req, res) => {
      try {
        const { barIndex } = req.body;
        const success = this.debugStateManager.addBreakpoint(barIndex);

        if (success) {
          // Notify WebSocket clients
          if (this.webSocketManager) {
            this.webSocketManager.broadcastStateUpdate();
          }
          res.json({ success: true, barIndex });
        } else {
          res.status(400).json({ error: 'Invalid bar index' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/breakpoints/:barIndex', (req, res) => {
      try {
        const barIndex = parseInt(req.params.barIndex, 10);
        const success = this.debugStateManager.removeBreakpoint(barIndex);

        if (success) {
          // Notify WebSocket clients
          if (this.webSocketManager) {
            this.webSocketManager.broadcastStateUpdate();
          }
        }
        res.json({ success });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/breakpoints', (req, res) => {
      try {
        this.debugStateManager.clearBreakpoints();

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Watch routes
    this.app.post('/api/watches', (req, res) => {
      try {
        const { expression, id } = req.body;
        const watchId = this.debugStateManager.addWatch(expression, id);

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true, watchId, expression });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/watches/:watchId', (req, res) => {
      try {
        const { watchId } = req.params;
        const success = this.debugStateManager.removeWatch(watchId);

        if (success) {
          // Notify WebSocket clients
          if (this.webSocketManager) {
            this.webSocketManager.broadcastStateUpdate();
          }
        }
        res.json({ success });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/watches', (req, res) => {
      try {
        this.debugStateManager.clearWatches();

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Variable routes
    this.app.post('/api/variables', (req, res) => {
      try {
        const { name, value } = req.body;
        this.debugStateManager.setVariable(name, value);

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true, name, value });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/variables/:name', (req, res) => {
      try {
        const { name } = req.params;
        const value = this.debugStateManager.getVariable(name);
        const history = this.debugStateManager.getVariableHistory(name);

        res.json({ name, value, history });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/variables', (req, res) => {
      try {
        this.debugStateManager.clearVariables();

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Session export/import
    this.app.get('/api/session/export', (req, res) => {
      try {
        const sessionData = this.debugStateManager.exportState();
        res.json(sessionData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/session/import', (req, res) => {
      try {
        const sessionData = req.body;
        this.debugStateManager.importState(sessionData);

        // Notify WebSocket clients
        if (this.webSocketManager) {
          this.webSocketManager.broadcastStateUpdate();
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // File upload
    this.app.post('/api/upload', (req, res) => {
      try {
        if (!req.files || !req.files.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.files.file;

        // Validate file type
        if (!this.securityManager.isValidFileType(file)) {
          return res.status(400).json({ error: 'Invalid file type' });
        }

        // Process file (in a real implementation, this would save the file)
        res.json({
          success: true,
          filename: file.name,
          size: file.size,
          mimetype: file.mimetype,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Error handling middleware
    this.app.use((err, req, res, _next) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  /**
   * Setup WebSocket manager
   */
  setupWebSocketManager() {
    this.webSocketManager = new WebSocketManager(
      this.io,
      this.debugStateManager,
      this.codeAnalyzer,
    );
  }

  /**
   * Start the debug server
   */
  async start() {
    try {
      // Initialize PineScript command runner if debug file is provided
      if (this.debugFile) {
        this.runner = new PineCommandRunner({
          projectPath: this.projectPath,
        });
        await this.runner.initialize();
      }

      // Start HTTP server
      await new Promise((resolve, reject) => {
        this.server.listen(this.port, () => {
          console.log(`PineScript Debug Server running on port ${this.port}`);
          console.log(`Web interface: http://localhost:${this.port}`);
          console.log(`WebSocket: ws://localhost:${this.port}`);

          if (this.debugFile) {
            console.log(`Debugging file: ${this.debugFile}`);
          }

          resolve();
        });

        this.server.on('error', reject);
      });

      // Start cleanup intervals
      this.startCleanupIntervals();
    } catch (error) {
      console.error('Failed to start debug server:', error);
      throw error;
    }
  }

  /**
   * Start cleanup intervals
   */
  startCleanupIntervals() {
    // Clean up expired tokens every 5 minutes
    setInterval(
      () => {
        this.securityManager.cleanupExpiredTokens();
      },
      5 * 60 * 1000,
    );

    // Clean up inactive clients every 10 minutes
    setInterval(
      () => {
        if (this.webSocketManager) {
          this.webSocketManager.cleanupInactiveClients();
        }
      },
      10 * 60 * 1000,
    );
  }

  /**
   * Stop the debug server
   */
  async stop() {
    try {
      // Stop HTTP server
      await new Promise((resolve, reject) => {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('Debug server stopped');
    } catch (error) {
      console.error('Error stopping debug server:', error);
      throw error;
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    const clientStats = this.webSocketManager
      ? this.webSocketManager.getClientStats()
      : { totalClients: 0 };
    const sessionStats = this.debugStateManager.getSessionStats();

    return {
      server: {
        port: this.port,
        startedAt: this.serverStartedAt,
        uptime: this.serverStartedAt ? Date.now() - this.serverStartedAt : 0,
      },
      clients: clientStats,
      session: sessionStats,
      security: {
        enabled: this.securityManager.enabled,
        sessionCount: this.securityManager.sessionTokens.size,
        rateLimitCount: this.securityManager.rateLimitStore.size,
      },
    };
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--port' || arg === '-p') {
      options.port = parseInt(args[++i], 10);
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--project' || arg === '-d') {
      options.projectPath = args[++i];
    } else if (arg === '--security') {
      options.security = args[++i] !== 'false';
    } else if (arg === '--auth') {
      options.requireAuth = args[++i] !== 'false';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
PineScript Debug Server

Usage:
  node debug-server.js [options]

Options:
  --port, -p <port>        Port to listen on (default: 3000)
  --file, -f <file>        PineScript file to debug
  --project, -d <path>     Project directory path
  --security <bool>        Enable/disable security (default: true)
  --auth <bool>            Require authentication (default: false)
  --help, -h               Show this help message

Examples:
  node debug-server.js --port 3000 --file my-indicator.pine
  node debug-server.js --project /path/to/project
      `);
      process.exit(0);
    }
  }

  try {
    const server = new PineScriptDebugServer(options);
    await server.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down debug server...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down debug server...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start debug server:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PineScriptDebugServer;
