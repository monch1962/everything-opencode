#!/usr/bin/env node
/**
 * WebSocket Manager for PineScript Debug Server
 *
 * Handles Socket.IO connections, events, and real-time communication
 */

class WebSocketManager {
  constructor(io, debugStateManager, codeAnalyzer) {
    this.io = io;
    this.debugStateManager = debugStateManager;
    this.codeAnalyzer = codeAnalyzer;
    this.clients = new Map();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      this.clients.set(clientId, {
        socket,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        sessionId: null,
      });

      console.log(`Client connected: ${clientId}`);

      // Setup client event handlers
      this.setupClientHandlers(socket, clientId);

      // Send initial state
      this.sendInitialState(socket);

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(clientId);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  /**
   * Setup handlers for a specific client
   */
  setupClientHandlers(socket, clientId) {
    // Debug control events
    socket.on('debug:start', (data) => this.handleDebugStart(socket, clientId, data));
    socket.on('debug:pause', () => this.handleDebugPause(socket, clientId));
    socket.on('debug:resume', () => this.handleDebugResume(socket, clientId));
    socket.on('debug:stop', () => this.handleDebugStop(socket, clientId));
    socket.on('debug:step', (data) => this.handleDebugStep(socket, clientId, data));
    socket.on('debug:goto', (data) => this.handleDebugGoto(socket, clientId, data));
    socket.on('debug:speed', (data) => this.handleDebugSpeed(socket, clientId, data));

    // Breakpoint events
    socket.on('breakpoint:add', (data) => this.handleBreakpointAdd(socket, clientId, data));
    socket.on('breakpoint:remove', (data) => this.handleBreakpointRemove(socket, clientId, data));
    socket.on('breakpoint:clear', () => this.handleBreakpointClear(socket, clientId));

    // Watch events
    socket.on('watch:add', (data) => this.handleWatchAdd(socket, clientId, data));
    socket.on('watch:remove', (data) => this.handleWatchRemove(socket, clientId, data));
    socket.on('watch:clear', () => this.handleWatchClear(socket, clientId));
    socket.on('watch:evaluate', (data) => this.handleWatchEvaluate(socket, clientId, data));

    // Variable events
    socket.on('variable:set', (data) => this.handleVariableSet(socket, clientId, data));
    socket.on('variable:get', (data) => this.handleVariableGet(socket, clientId, data));
    socket.on('variable:clear', () => this.handleVariableClear(socket, clientId));

    // Code analysis events
    socket.on('code:analyze', (data) => this.handleCodeAnalyze(socket, clientId, data));
    socket.on('code:suggestions', (data) => this.handleCodeSuggestions(socket, clientId, data));

    // Session events
    socket.on('session:export', () => this.handleSessionExport(socket, clientId));
    socket.on('session:import', (data) => this.handleSessionImport(socket, clientId, data));
    socket.on('session:save', (data) => this.handleSessionSave(socket, clientId, data));
    socket.on('session:load', (data) => this.handleSessionLoad(socket, clientId, data));

    // File events
    socket.on('file:upload', (data) => this.handleFileUpload(socket, clientId, data));
    socket.on('file:download', (data) => this.handleFileDownload(socket, clientId, data));

    // AI analysis events
    socket.on('ai:analyze', (data) => this.handleAIAnalyze(socket, clientId, data));
    socket.on('ai:suggestions', (data) => this.handleAISuggestions(socket, clientId, data));

    // Custom events
    socket.on('custom:evaluate', (data) => this.handleCustomEvaluate(socket, clientId, data));
    socket.on('custom:command', (data) => this.handleCustomCommand(socket, clientId, data));
  }

  /**
   * Send initial state to client
   */
  sendInitialState(socket) {
    const state = this.debugStateManager.exportState();
    const stats = this.debugStateManager.getSessionStats();

    socket.emit('state:initial', {
      state,
      stats,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast state update to all clients
   */
  broadcastStateUpdate() {
    const state = this.debugStateManager.exportState();
    const stats = this.debugStateManager.getSessionStats();

    this.io.emit('state:update', {
      state,
      stats,
      timestamp: Date.now(),
    });
  }

  /**
   * Send error to client
   */
  sendError(socket, error, event = null) {
    socket.emit('error', {
      message: error.message,
      event,
      timestamp: Date.now(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(
        `Client disconnected: ${clientId} (connected for ${Date.now() - client.connectedAt}ms)`,
      );
      this.clients.delete(clientId);
    }
  }

  /**
   * Debug control handlers
   */
  async handleDebugStart(socket, clientId, data) {
    try {
      const { totalBars = 100, code } = data;

      if (code) {
        const analysis = await this.codeAnalyzer.analyzePineScript(code);
        socket.emit('code:analysis', analysis);
      }

      this.debugStateManager.startDebugging(totalBars);
      this.broadcastStateUpdate();
      socket.emit('debug:started', { totalBars });
    } catch (error) {
      this.sendError(socket, error, 'debug:start');
    }
  }

  handleDebugPause(socket, _clientId) {
    try {
      this.debugStateManager.pauseDebugging();
      this.broadcastStateUpdate();
      socket.emit('debug:paused');
    } catch (error) {
      this.sendError(socket, error, 'debug:pause');
    }
  }

  handleDebugResume(socket, _clientId) {
    try {
      this.debugStateManager.resumeDebugging();
      this.broadcastStateUpdate();
      socket.emit('debug:resumed');
    } catch (error) {
      this.sendError(socket, error, 'debug:resume');
    }
  }

  handleDebugStop(socket, _clientId) {
    try {
      this.debugStateManager.stopDebugging();
      this.broadcastStateUpdate();
      socket.emit('debug:stopped');
    } catch (error) {
      this.sendError(socket, error, 'debug:stop');
    }
  }

  handleDebugStep(socket, clientId, data) {
    try {
      const { steps = 1 } = data;
      const success = this.debugStateManager.stepDebugging(steps);

      if (success) {
        this.broadcastStateUpdate();
        socket.emit('debug:stepped', {
          steps,
          currentBar: this.debugStateManager.state.currentBar,
        });
      } else {
        socket.emit('debug:complete');
      }
    } catch (error) {
      this.sendError(socket, error, 'debug:step');
    }
  }

  handleDebugGoto(socket, clientId, data) {
    try {
      const { barIndex } = data;
      const success = this.debugStateManager.gotoBar(barIndex);

      if (success) {
        this.broadcastStateUpdate();
        socket.emit('debug:goto', { barIndex });
      } else {
        socket.emit('error', { message: 'Invalid bar index' });
      }
    } catch (error) {
      this.sendError(socket, error, 'debug:goto');
    }
  }

  handleDebugSpeed(socket, clientId, data) {
    try {
      const { speed } = data;
      const success = this.debugStateManager.setExecutionSpeed(speed);

      if (success) {
        this.broadcastStateUpdate();
        socket.emit('debug:speed', { speed });
      } else {
        socket.emit('error', { message: 'Invalid speed value (0.1-10)' });
      }
    } catch (error) {
      this.sendError(socket, error, 'debug:speed');
    }
  }

  /**
   * Breakpoint handlers
   */
  handleBreakpointAdd(socket, clientId, data) {
    try {
      const { barIndex } = data;
      const success = this.debugStateManager.addBreakpoint(barIndex);

      if (success) {
        this.broadcastStateUpdate();
        socket.emit('breakpoint:added', { barIndex });
      } else {
        socket.emit('error', { message: 'Invalid bar index' });
      }
    } catch (error) {
      this.sendError(socket, error, 'breakpoint:add');
    }
  }

  handleBreakpointRemove(socket, clientId, data) {
    try {
      const { barIndex } = data;
      const success = this.debugStateManager.removeBreakpoint(barIndex);

      socket.emit('breakpoint:removed', { barIndex, success });
      if (success) {
        this.broadcastStateUpdate();
      }
    } catch (error) {
      this.sendError(socket, error, 'breakpoint:remove');
    }
  }

  handleBreakpointClear(socket, _clientId) {
    try {
      this.debugStateManager.clearBreakpoints();
      this.broadcastStateUpdate();
      socket.emit('breakpoint:cleared');
    } catch (error) {
      this.sendError(socket, error, 'breakpoint:clear');
    }
  }

  /**
   * Watch handlers
   */
  handleWatchAdd(socket, clientId, data) {
    try {
      const { expression, id } = data;
      const watchId = this.debugStateManager.addWatch(expression, id);

      this.broadcastStateUpdate();
      socket.emit('watch:added', { watchId, expression });
    } catch (error) {
      this.sendError(socket, error, 'watch:add');
    }
  }

  handleWatchRemove(socket, clientId, data) {
    try {
      const { watchId } = data;
      const success = this.debugStateManager.removeWatch(watchId);

      socket.emit('watch:removed', { watchId, success });
      if (success) {
        this.broadcastStateUpdate();
      }
    } catch (error) {
      this.sendError(socket, error, 'watch:remove');
    }
  }

  handleWatchClear(socket, _clientId) {
    try {
      this.debugStateManager.clearWatches();
      this.broadcastStateUpdate();
      socket.emit('watch:cleared');
    } catch (error) {
      this.sendError(socket, error, 'watch:clear');
    }
  }

  async handleWatchEvaluate(socket, clientId, data) {
    try {
      const { watchId } = data;
      const watch = this.debugStateManager.state.watches.get(watchId);

      if (!watch) {
        socket.emit('error', { message: 'Watch not found' });
        return;
      }

      // In a real implementation, this would evaluate the expression
      // For now, we'll simulate evaluation
      const value = `Evaluated: ${watch.expression} at bar ${this.debugStateManager.state.currentBar}`;
      this.debugStateManager.updateWatchValue(watchId, value);

      this.broadcastStateUpdate();
      socket.emit('watch:evaluated', { watchId, value });
    } catch (error) {
      this.sendError(socket, error, 'watch:evaluate');
    }
  }

  /**
   * Variable handlers
   */
  handleVariableSet(socket, clientId, data) {
    try {
      const { name, value } = data;
      this.debugStateManager.setVariable(name, value);

      this.broadcastStateUpdate();
      socket.emit('variable:set', { name, value });
    } catch (error) {
      this.sendError(socket, error, 'variable:set');
    }
  }

  handleVariableGet(socket, clientId, data) {
    try {
      const { name } = data;
      const value = this.debugStateManager.getVariable(name);
      const history = this.debugStateManager.getVariableHistory(name);

      socket.emit('variable:get', { name, value, history });
    } catch (error) {
      this.sendError(socket, error, 'variable:get');
    }
  }

  handleVariableClear(socket, _clientId) {
    try {
      this.debugStateManager.clearVariables();
      this.broadcastStateUpdate();
      socket.emit('variable:cleared');
    } catch (error) {
      this.sendError(socket, error, 'variable:clear');
    }
  }

  /**
   * Code analysis handlers
   */
  async handleCodeAnalyze(socket, clientId, data) {
    try {
      const { code } = data;
      const analysis = await this.codeAnalyzer.analyzePineScript(code);

      socket.emit('code:analysis', analysis);
    } catch (error) {
      this.sendError(socket, error, 'code:analyze');
    }
  }

  async handleCodeSuggestions(socket, clientId, data) {
    try {
      const { code } = data;
      const analysis = await this.codeAnalyzer.analyzePineScript(code);

      socket.emit('code:suggestions', analysis.suggestions);
    } catch (error) {
      this.sendError(socket, error, 'code:suggestions');
    }
  }

  /**
   * Session handlers
   */
  handleSessionExport(socket, _clientId) {
    try {
      const sessionData = this.debugStateManager.exportState();
      socket.emit('session:export', sessionData);
    } catch (error) {
      this.sendError(socket, error, 'session:export');
    }
  }

  handleSessionImport(socket, clientId, data) {
    try {
      this.debugStateManager.importState(data);
      this.broadcastStateUpdate();
      socket.emit('session:imported');
    } catch (error) {
      this.sendError(socket, error, 'session:import');
    }
  }

  handleSessionSave(socket, clientId, data) {
    try {
      const { filename } = data;
      // In a real implementation, this would save to a file
      // const sessionData = this.debugStateManager.exportState();
      socket.emit('session:saved', { filename, success: true });
    } catch (error) {
      this.sendError(socket, error, 'session:save');
    }
  }

  handleSessionLoad(socket, clientId, data) {
    try {
      const { filename } = data;

      // In a real implementation, this would load from a file
      // For now, we'll emit a placeholder event
      socket.emit('session:loaded', { filename, success: true });
    } catch (error) {
      this.sendError(socket, error, 'session:load');
    }
  }

  /**
   * File handlers (placeholder implementations)
   */
  handleFileUpload(socket, _clientId, _data) {
    // Placeholder for file upload handling
    socket.emit('file:uploaded', { success: true });
  }

  handleFileDownload(socket, _clientId, _data) {
    // Placeholder for file download handling
    socket.emit('file:download', { data: 'placeholder' });
  }

  /**
   * AI analysis handlers
   */
  async handleAIAnalyze(socket, _clientId, _data) {
    try {
      // Placeholder for AI analysis
      socket.emit('ai:analysis', { suggestions: [] });
    } catch (error) {
      this.sendError(socket, error, 'ai:analyze');
    }
  }

  async handleAISuggestions(socket, _clientId, _data) {
    try {
      // Placeholder for AI suggestions
      socket.emit('ai:suggestions', { suggestions: [] });
    } catch (error) {
      this.sendError(socket, error, 'ai:suggestions');
    }
  }

  /**
   * Custom event handlers
   */
  async handleCustomEvaluate(socket, clientId, data) {
    try {
      const { expression } = data;
      // Placeholder for custom expression evaluation
      const result = `Evaluated: ${expression}`;
      socket.emit('custom:evaluated', { expression, result });
    } catch (error) {
      this.sendError(socket, error, 'custom:evaluate');
    }
  }

  handleCustomCommand(socket, clientId, data) {
    try {
      const { command } = data;
      // Placeholder for custom command execution
      socket.emit('custom:command', { command, result: 'Executed' });
    } catch (error) {
      this.sendError(socket, error, 'custom:command');
    }
  }

  /**
   * Get client statistics
   */
  getClientStats() {
    return {
      totalClients: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
        sessionId: client.sessionId,
        connectionTime: Date.now() - client.connectedAt,
      })),
    };
  }

  /**
   * Clean up inactive clients
   */
  cleanupInactiveClients(timeout = 30 * 60 * 1000) {
    // 30 minutes
    const now = Date.now();
    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastActivity > timeout) {
        client.socket.disconnect();
        this.clients.delete(clientId);
      }
    }
  }
}

module.exports = WebSocketManager;
