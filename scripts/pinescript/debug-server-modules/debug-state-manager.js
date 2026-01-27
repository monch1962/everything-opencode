#!/usr/bin/env node
/**
 * Debug State Manager for PineScript Debug Server
 *
 * Manages debug state, breakpoints, watches, variables, and execution control
 */

class DebugStateManager {
  constructor() {
    this.resetState();
  }

  /**
   * Reset debug state to initial values
   */
  resetState() {
    this.state = {
      isRunning: false,
      currentBar: 0,
      totalBars: 0,
      breakpoints: new Set(),
      watches: new Map(),
      variables: new Map(),
      callStack: [],
      paused: false,
      executionSpeed: 1,
      sessionStartTime: null,
      sessionEndTime: null,
      executionHistory: [],
    };
  }

  /**
   * Start debugging session
   */
  startDebugging(totalBars = 100) {
    this.state.isRunning = true;
    this.state.totalBars = totalBars;
    this.state.currentBar = 0;
    this.state.sessionStartTime = Date.now();
    this.state.executionHistory = [];
    this.state.paused = false;
  }

  /**
   * Pause debugging
   */
  pauseDebugging() {
    this.state.paused = true;
  }

  /**
   * Resume debugging
   */
  resumeDebugging() {
    this.state.paused = false;
  }

  /**
   * Stop debugging
   */
  stopDebugging() {
    this.state.isRunning = false;
    this.state.sessionEndTime = Date.now();
    this.state.paused = false;
  }

  /**
   * Step through debugging
   */
  stepDebugging(steps = 1) {
    if (!this.state.isRunning || this.state.paused) {
      return false;
    }

    const newBar = this.state.currentBar + steps;
    if (newBar >= this.state.totalBars) {
      this.stopDebugging();
      return false;
    }

    this.state.currentBar = newBar;
    this.recordExecutionStep();
    return true;
  }

  /**
   * Go to specific bar
   */
  gotoBar(barIndex) {
    if (barIndex >= 0 && barIndex < this.state.totalBars) {
      this.state.currentBar = barIndex;
      this.recordExecutionStep();
      return true;
    }
    return false;
  }

  /**
   * Set execution speed
   */
  setExecutionSpeed(speed) {
    if (speed >= 0.1 && speed <= 10) {
      this.state.executionSpeed = speed;
      return true;
    }
    return false;
  }

  /**
   * Add breakpoint
   */
  addBreakpoint(barIndex) {
    if (barIndex >= 0 && barIndex < this.state.totalBars) {
      this.state.breakpoints.add(barIndex);
      return true;
    }
    return false;
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(barIndex) {
    return this.state.breakpoints.delete(barIndex);
  }

  /**
   * Clear all breakpoints
   */
  clearBreakpoints() {
    this.state.breakpoints.clear();
  }

  /**
   * Add watch expression
   */
  addWatch(expression, id = null) {
    const watchId = id || `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state.watches.set(watchId, {
      expression,
      id: watchId,
      createdAt: Date.now(),
      lastValue: null,
      history: [],
    });
    return watchId;
  }

  /**
   * Remove watch expression
   */
  removeWatch(watchId) {
    return this.state.watches.delete(watchId);
  }

  /**
   * Clear all watches
   */
  clearWatches() {
    this.state.watches.clear();
  }

  /**
   * Update watch value
   */
  updateWatchValue(watchId, value) {
    const watch = this.state.watches.get(watchId);
    if (watch) {
      watch.lastValue = value;
      watch.history.push({
        bar: this.state.currentBar,
        value,
        timestamp: Date.now(),
      });

      // Keep only last 100 history entries
      if (watch.history.length > 100) {
        watch.history = watch.history.slice(-100);
      }
      return true;
    }
    return false;
  }

  /**
   * Set variable value
   */
  setVariable(name, value) {
    this.state.variables.set(name, {
      value,
      lastUpdated: Date.now(),
      history: this.state.variables.get(name)?.history || [],
    });

    // Record variable change in history
    const variable = this.state.variables.get(name);
    variable.history.push({
      bar: this.state.currentBar,
      value,
      timestamp: Date.now(),
    });

    // Keep only last 50 history entries per variable
    if (variable.history.length > 50) {
      variable.history = variable.history.slice(-50);
    }
  }

  /**
   * Get variable value
   */
  getVariable(name) {
    const variable = this.state.variables.get(name);
    return variable ? variable.value : undefined;
  }

  /**
   * Get variable history
   */
  getVariableHistory(name) {
    const variable = this.state.variables.get(name);
    return variable ? variable.history : [];
  }

  /**
   * Clear all variables
   */
  clearVariables() {
    this.state.variables.clear();
  }

  /**
   * Push to call stack
   */
  pushCallStack(frame) {
    this.state.callStack.push({
      ...frame,
      timestamp: Date.now(),
      bar: this.state.currentBar,
    });

    // Keep call stack manageable
    if (this.state.callStack.length > 100) {
      this.state.callStack = this.state.callStack.slice(-100);
    }
  }

  /**
   * Pop from call stack
   */
  popCallStack() {
    return this.state.callStack.pop();
  }

  /**
   * Clear call stack
   */
  clearCallStack() {
    this.state.callStack = [];
  }

  /**
   * Record execution step
   */
  recordExecutionStep() {
    this.state.executionHistory.push({
      bar: this.state.currentBar,
      timestamp: Date.now(),
      variables: new Map(this.state.variables),
      callStack: [...this.state.callStack],
    });

    // Keep history manageable
    if (this.state.executionHistory.length > 1000) {
      this.state.executionHistory = this.state.executionHistory.slice(-1000);
    }
  }

  /**
   * Get execution history
   */
  getExecutionHistory() {
    return this.state.executionHistory;
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    if (!this.state.sessionStartTime) {
      return 0;
    }

    const endTime = this.state.sessionEndTime || Date.now();
    return endTime - this.state.sessionStartTime;
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return {
      duration: this.getSessionDuration(),
      barsExecuted: this.state.currentBar,
      totalBars: this.state.totalBars,
      breakpointCount: this.state.breakpoints.size,
      watchCount: this.state.watches.size,
      variableCount: this.state.variables.size,
      callStackDepth: this.state.callStack.length,
      executionHistorySize: this.state.executionHistory.length,
      isRunning: this.state.isRunning,
      isPaused: this.state.paused,
      executionSpeed: this.state.executionSpeed,
    };
  }

  /**
   * Export debug state
   */
  exportState() {
    return {
      state: {
        ...this.state,
        breakpoints: Array.from(this.state.breakpoints),
        watches: Array.from(this.state.watches.entries()),
        variables: Array.from(this.state.variables.entries()),
        callStack: [...this.state.callStack],
        executionHistory: [...this.state.executionHistory],
      },
      metadata: {
        exportedAt: Date.now(),
        version: '1.0',
      },
    };
  }

  /**
   * Import debug state
   */
  importState(stateData) {
    if (!this.validateStateData(stateData)) {
      throw new Error('Invalid state data');
    }

    this.state = {
      ...stateData.state,
      breakpoints: new Set(stateData.state.breakpoints),
      watches: new Map(stateData.state.watches),
      variables: new Map(stateData.state.variables),
      callStack: [...stateData.state.callStack],
      executionHistory: [...stateData.state.executionHistory],
    };
  }

  /**
   * Validate state data
   */
  validateStateData(stateData) {
    if (!stateData || typeof stateData !== 'object') {
      return false;
    }

    if (!stateData.state || !stateData.metadata) {
      return false;
    }

    const requiredStateFields = [
      'isRunning',
      'currentBar',
      'totalBars',
      'paused',
      'executionSpeed',
    ];

    for (const field of requiredStateFields) {
      if (!(field in stateData.state)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = DebugStateManager;
