#!/usr/bin/env node
/**
 * PineScript Interactive Debugging Server
 *
 * Web-based debugging interface with real-time variable inspection,
 * breakpoints, step-through debugging, and live charts.
 */

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs").promises;
const { spawn } = require("child_process");
const fileUpload = require("express-fileupload");
const PineCommandRunner = require("./command-runner");

class PineScriptDebugServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.projectPath = options.projectPath || process.cwd();
    this.debugFile = options.file;
    this.runner = null;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Security configuration
    this.security = {
      enabled: options.security !== false,
      allowedOrigins: options.allowedOrigins || [
        "http://localhost:" + (options.port || 3000),
      ],
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      requireAuth: options.requireAuth || false,
      sessionTimeout: options.sessionTimeout || 30 * 60 * 1000, // 30 minutes
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
      },
    };

    // Session validation tokens
    this.sessionTokens = new Map();

    // Rate limiting store
    this.rateLimitStore = new Map();

    // Debug state
    this.debugState = {
      isRunning: false,
      currentBar: 0,
      totalBars: 0,
      breakpoints: new Set(),
      watches: new Map(),
      variables: new Map(),
      callStack: [],
      paused: false,
      executionSpeed: 1,
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(this.securityMiddleware.bind(this));

    // Rate limiting
    this.app.use(this.rateLimitMiddleware.bind(this));

    // Body parsing
    this.app.use(express.json({ limit: this.security.maxFileSize }));

    // Static files
    this.app.use(express.static(path.join(__dirname, "../../public")));

    // File upload with security
    this.app.use(
      fileUpload({
        limits: {
          fileSize: this.security.maxFileSize,
          files: 1,
        },
        abortOnLimit: true,
        responseOnLimit: "File size limit exceeded",
        safeFileNames: true,
        preserveExtension: true,
      }),
    );

    // CORS with security
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (this.security.enabled && this.security.allowedOrigins.length > 0) {
        if (this.security.allowedOrigins.includes(origin)) {
          res.header("Access-Control-Allow-Origin", origin);
        } else if (this.security.allowedOrigins.includes("*")) {
          res.header("Access-Control-Allow-Origin", "*");
        }
      } else {
        res.header("Access-Control-Allow-Origin", "*");
      }

      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      );
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      next();
    });
  }

  securityMiddleware(req, res, next) {
    // Skip security for static files and status endpoint
    if (req.path.startsWith("/public/") || req.path === "/api/status") {
      return next();
    }

    // Check authentication if required
    if (this.security.requireAuth) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !this.validateToken(authHeader)) {
        return res.status(401).json({ error: "Authentication required" });
      }
    }

    // Validate session for export/import endpoints
    if (
      req.path.startsWith("/api/export") ||
      req.path.startsWith("/api/import")
    ) {
      const sessionId = req.headers["x-session-id"] || req.query.sessionId;
      if (!this.validateSession(sessionId)) {
        return res.status(403).json({ error: "Invalid or expired session" });
      }
    }

    next();
  }

  rateLimitMiddleware(req, res, next) {
    if (!this.security.enabled) {
      return next();
    }

    const ip = req.ip;
    const now = Date.now();
    const windowMs = this.security.rateLimit.windowMs;
    const maxRequests = this.security.rateLimit.max;

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(ip);
    if (!entry) {
      entry = { count: 1, resetTime: now + windowMs };
      this.rateLimitStore.set(ip, entry);
    } else {
      // Reset if window has passed
      if (now > entry.resetTime) {
        entry.count = 1;
        entry.resetTime = now + windowMs;
      } else {
        entry.count++;
      }
    }

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: `${retryAfter} seconds`,
      });
    }

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - entry.count);
    res.setHeader("X-RateLimit-Reset", entry.resetTime);

    next();
  }

  validateToken(token) {
    // Simple token validation - in production, use proper JWT or similar
    if (!token.startsWith("Bearer ")) {
      return false;
    }

    const tokenValue = token.substring(7);
    // Check if token is valid (simplified)
    return (
      this.sessionTokens.has(tokenValue) &&
      this.sessionTokens.get(tokenValue).expires > Date.now()
    );
  }

  validateSession(sessionId) {
    if (!sessionId) {
      return false;
    }

    // Check if session exists and is not expired
    const session = this.sessionTokens.get(sessionId);
    if (!session || session.expires < Date.now()) {
      return false;
    }

    // Update session expiration
    session.expires = Date.now() + this.security.sessionTimeout;
    return true;
  }

  generateSessionToken() {
    const token = require("crypto").randomBytes(32).toString("hex");
    const expires = Date.now() + this.security.sessionTimeout;

    this.sessionTokens.set(token, {
      expires,
      created: Date.now(),
      lastUsed: Date.now(),
    });

    // Clean up expired tokens periodically
    this.cleanupExpiredTokens();

    return token;
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.sessionTokens.entries()) {
      if (data.expires < now) {
        this.sessionTokens.delete(token);
      }
    }
  }

  setupRoutes() {
    // API endpoints
    this.app.get("/api/status", (req, res) => {
      res.json({
        status: "running",
        version: "1.0.0",
        debugFile: this.debugFile,
        projectPath: this.projectPath,
        debugState: this.debugState,
      });
    });

    this.app.post("/api/load", async (req, res) => {
      try {
        const { file } = req.body;
        this.debugFile = file || this.debugFile;

        if (!this.debugFile) {
          return res.status(400).json({ error: "No file specified" });
        }

        const content = await fs.readFile(this.debugFile, "utf8");
        const analysis = await this.analyzePineScript(content);

        // Create new session
        this.currentSessionId = Date.now().toString();
        this.sessions.set(this.currentSessionId, {
          file: this.debugFile,
          content,
          analysis,
          startTime: new Date(),
          variables: new Map(),
          breakpoints: new Set(),
          watches: new Map(),
        });

        res.json({
          sessionId: this.currentSessionId,
          file: this.debugFile,
          analysis,
          message: "File loaded successfully",
        });

        // Notify all clients
        this.io.emit("fileLoaded", {
          sessionId: this.currentSessionId,
          file: this.debugFile,
          analysis,
        });
      } catch (error) {
        console.error("Error loading file:", error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/breakpoints", (req, res) => {
      const { line, enabled = true } = req.body;

      if (enabled) {
        this.debugState.breakpoints.add(line);
      } else {
        this.debugState.breakpoints.delete(line);
      }

      this.io.emit(
        "breakpointsUpdated",
        Array.from(this.debugState.breakpoints),
      );
      res.json({ breakpoints: Array.from(this.debugState.breakpoints) });
    });

    this.app.post("/api/watches", (req, res) => {
      const { variable, expression } = req.body;

      if (expression) {
        this.debugState.watches.set(variable, expression);
      } else {
        this.debugState.watches.delete(variable);
      }

      this.io.emit(
        "watchesUpdated",
        Array.from(this.debugState.watches.entries()),
      );
      res.json({ watches: Array.from(this.debugState.watches.entries()) });
    });

    this.app.post("/api/control", (req, res) => {
      const { action, data } = req.body;

      switch (action) {
        case "start":
          this.startDebugging();
          break;
        case "pause":
          this.pauseDebugging();
          break;
        case "resume":
          this.resumeDebugging();
          break;
        case "stop":
          this.stopDebugging();
          break;
        case "step":
          this.stepDebugging(data?.steps || 1);
          break;
        case "setSpeed":
          this.setExecutionSpeed(data?.speed || 1);
          break;
        case "gotoBar":
          this.gotoBar(data?.bar || 0);
          break;
      }

      res.json({ success: true, action });
    });

    this.app.get("/api/variables", (req, res) => {
      res.json({
        variables: Array.from(this.debugState.variables.entries()),
        currentBar: this.debugState.currentBar,
      });
    });

    this.app.get("/api/callstack", (req, res) => {
      res.json({
        callStack: this.debugState.callStack,
        currentBar: this.debugState.currentBar,
      });
    });

    this.app.post("/api/evaluate", async (req, res) => {
      try {
        const { expression, barIndex } = req.body;
        const result = await this.evaluateExpression(expression, barIndex);
        res.json({ result });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get session token (for secure export/import)
    this.app.post("/api/session/token", (req, res) => {
      try {
        if (this.security.requireAuth) {
          const authHeader = req.headers.authorization;
          if (!authHeader || !this.validateToken(authHeader)) {
            return res.status(401).json({ error: "Authentication required" });
          }
        }

        const token = this.generateSessionToken();
        res.json({
          token,
          expiresIn: this.security.sessionTimeout,
          note: "Use this token in X-Session-ID header for export/import operations",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============================================================================
    // AI-ASSISTED DEBUGGING ENDPOINTS (PHASE 4)
    // ============================================================================

    // Get AI suggestions for code
    this.app.post("/api/ai/suggest", async (req, res) => {
      try {
        const {
          code,
          sessionId,
          includePatterns = "all",
          threshold = 0.7,
        } = req.body;

        if (!code) {
          return res.status(400).json({ error: "Code content is required" });
        }

        // Load AI patterns
        const patterns = this.loadAIPatterns();

        // Generate suggestions
        const suggestions = this.generateAISuggestions(
          code,
          patterns,
          includePatterns,
          threshold,
        );

        // Store suggestions in session if sessionId provided
        if (sessionId && this.sessions.has(sessionId)) {
          const session = this.sessions.get(sessionId);
          session.aiSuggestions = suggestions;
          session.lastAIAnalysis = new Date();
        }

        res.json({
          suggestions,
          count: suggestions.length,
          timestamp: new Date().toISOString(),
          patternsUsed: includePatterns,
          threshold,
        });

        // Notify clients about new AI suggestions
        this.io.emit("aiSuggestions", {
          sessionId,
          count: suggestions.length,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("AI suggestion error:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get AI patterns database
    this.app.get("/api/ai/patterns", (req, res) => {
      try {
        const patterns = this.loadAIPatterns();
        res.json({
          patterns: patterns.patterns,
          version: patterns.version,
          description: patterns.description,
          suggestionCategories: patterns.suggestion_categories,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Submit feedback on AI suggestions
    this.app.post("/api/ai/feedback", (req, res) => {
      try {
        const { suggestionId, accepted, comment = "", sessionId } = req.body;

        if (!suggestionId) {
          return res.status(400).json({ error: "Suggestion ID is required" });
        }

        // Record feedback
        const feedback = {
          suggestionId,
          accepted: accepted === true,
          comment,
          sessionId,
          timestamp: new Date().toISOString(),
          userAgent: req.headers["user-agent"],
        };

        // Store feedback (in real implementation would save to database)
        this.aiFeedback = this.aiFeedback || [];
        this.aiFeedback.push(feedback);

        // Update learning if session exists
        if (sessionId && this.sessions.has(sessionId)) {
          const session = this.sessions.get(sessionId);
          session.aiFeedback = session.aiFeedback || [];
          session.aiFeedback.push(feedback);
        }

        res.json({
          success: true,
          feedbackId: feedback.timestamp + "-" + suggestionId,
          message: "Feedback recorded successfully",
        });

        // Notify about feedback
        this.io.emit("aiFeedback", {
          suggestionId,
          accepted,
          sessionId,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get AI analysis for current session
    this.app.get("/api/ai/analysis/:sessionId", (req, res) => {
      try {
        const { sessionId } = req.params;

        if (!this.sessions.has(sessionId)) {
          return res.status(404).json({ error: "Session not found" });
        }

        const session = this.sessions.get(sessionId);

        res.json({
          sessionId,
          aiSuggestions: session.aiSuggestions || [],
          aiFeedback: session.aiFeedback || [],
          lastAIAnalysis: session.lastAIAnalysis,
          codeLength: session.content ? session.content.length : 0,
          suggestionStats: this.calculateAISuggestionStats(session),
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Compare code with AI suggestions
    this.app.post("/api/ai/compare", async (req, res) => {
      try {
        const { originalCode, modifiedCode, sessionId } = req.body;

        if (!originalCode || !modifiedCode) {
          return res
            .status(400)
            .json({ error: "Both original and modified code are required" });
        }

        // Analyze differences
        const analysis = this.analyzeCodeDifferences(
          originalCode,
          modifiedCode,
        );

        // Generate new suggestions for modified code
        const patterns = this.loadAIPatterns();
        const newSuggestions = this.generateAISuggestions(
          modifiedCode,
          patterns,
        );

        // Compare with previous suggestions if session exists
        let previousSuggestions = [];
        if (sessionId && this.sessions.has(sessionId)) {
          const session = this.sessions.get(sessionId);
          previousSuggestions = session.aiSuggestions || [];
        }

        res.json({
          analysis,
          newSuggestions,
          previousSuggestions,
          improvements: this.calculateImprovements(
            previousSuggestions,
            newSuggestions,
          ),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============================================================================
    // END AI ENDPOINTS
    // ============================================================================

    // Export debugging session (secure)
    this.app.get("/api/export", (req, res) => {
      try {
        // Validate session
        const sessionId = req.headers["x-session-id"] || req.query.sessionId;
        if (!this.validateSession(sessionId)) {
          return res.status(403).json({ error: "Invalid or expired session" });
        }

        const sessionData = this.exportDebugSession();

        // Add security metadata
        sessionData.security = {
          exportedAt: new Date().toISOString(),
          exportedBy: req.ip,
          sessionId: sessionId.substring(0, 8) + "...", // Partial for logging
        };

        res.json(sessionData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Import debugging session (secure)
    this.app.post("/api/import", (req, res) => {
      try {
        // Validate session
        const sessionId = req.headers["x-session-id"] || req.query.sessionId;
        if (!this.validateSession(sessionId)) {
          return res.status(403).json({ error: "Invalid or expired session" });
        }

        const sessionData = req.body;

        // Validate session data structure
        if (!this.validateSessionData(sessionData)) {
          return res.status(400).json({ error: "Invalid session data format" });
        }

        // Check for malicious data
        if (this.containsMaliciousData(sessionData)) {
          return res.status(400).json({
            error: "Session data contains potentially malicious content",
          });
        }

        const result = this.importDebugSession(sessionData);

        // Add security log
        result.security = {
          importedAt: new Date().toISOString(),
          importedBy: req.ip,
          sessionId: sessionId.substring(0, 8) + "...",
        };

        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Export session to file (secure)
    this.app.get("/api/export/file", (req, res) => {
      try {
        // Validate session
        const sessionId = req.headers["x-session-id"] || req.query.sessionId;
        if (!this.validateSession(sessionId)) {
          return res.status(403).json({ error: "Invalid or expired session" });
        }

        const format = req.query.format || "json";
        const sessionData = this.exportDebugSession();

        // Add security metadata
        sessionData.security = {
          exportedAt: new Date().toISOString(),
          exportedBy: req.ip,
          sessionId: sessionId.substring(0, 8) + "...",
        };

        if (format === "json") {
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="debug-session-' + Date.now() + '.json"',
          );
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.send(JSON.stringify(sessionData, null, 2));
        } else if (format === "csv") {
          const csvData = this.convertSessionToCSV(sessionData);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="debug-session-' + Date.now() + '.csv"',
          );
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.send(csvData);
        } else {
          res.status(400).json({ error: "Unsupported format" });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Import session from file (secure)
    this.app.post("/api/import/file", async (req, res) => {
      try {
        // Validate session
        const sessionId = req.headers["x-session-id"] || req.query.sessionId;
        if (!this.validateSession(sessionId)) {
          return res.status(403).json({ error: "Invalid or expired session" });
        }

        if (!req.files || !req.files.sessionFile) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.files.sessionFile;

        // Validate file type
        if (!this.isValidFileType(file)) {
          return res
            .status(400)
            .json({ error: "Invalid file type. Only JSON files are allowed." });
        }

        // Validate file size
        if (file.size > this.security.maxFileSize) {
          return res.status(400).json({
            error:
              "File too large. Maximum size is " +
              this.security.maxFileSize / 1024 / 1024 +
              "MB",
          });
        }

        const fileContent = file.data.toString("utf8");

        // Validate JSON
        let sessionData;
        try {
          sessionData = JSON.parse(fileContent);
        } catch (e) {
          return res.status(400).json({ error: "Invalid JSON file" });
        }

        // Validate session data structure
        if (!this.validateSessionData(sessionData)) {
          return res.status(400).json({ error: "Invalid session data format" });
        }

        // Check for malicious data
        if (this.containsMaliciousData(sessionData)) {
          return res.status(400).json({
            error: "Session data contains potentially malicious content",
          });
        }

        const result = this.importDebugSession(sessionData);

        // Add security log
        result.security = {
          importedAt: new Date().toISOString(),
          importedBy: req.ip,
          sessionId: sessionId.substring(0, 8) + "...",
          fileName: file.name,
          fileSize: file.size,
        };

        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Import debugging session
    this.app.post("/api/import", (req, res) => {
      try {
        const sessionData = req.body;
        const result = this.importDebugSession(sessionData);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Export session to file
    this.app.get("/api/export/file", (req, res) => {
      try {
        const format = req.query.format || "json";
        const sessionData = this.exportDebugSession();

        if (format === "json") {
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="debug-session.json"',
          );
          res.send(JSON.stringify(sessionData, null, 2));
        } else if (format === "csv") {
          const csvData = this.convertSessionToCSV(sessionData);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="debug-session.csv"',
          );
          res.send(csvData);
        } else {
          res.status(400).json({ error: "Unsupported format" });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Import session from file
    this.app.post("/api/import/file", async (req, res) => {
      try {
        if (!req.files || !req.files.sessionFile) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.files.sessionFile;
        const fileContent = file.data.toString("utf8");
        const sessionData = JSON.parse(fileContent);

        const result = this.importDebugSession(sessionData);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Serve debug interface
    this.app.get("/debug", (req, res) => {
      res.sendFile(path.join(__dirname, "../../public/debug.html"));
    });

    // Serve main interface
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../../public/index.html"));
    });
  }

  setupSocketIO() {
    this.io.on("connection", (socket) => {
      console.log("🔌 Client connected:", socket.id);

      // Send current state to new client
      socket.emit("initialState", {
        debugState: this.debugState,
        sessionId: this.currentSessionId,
        file: this.debugFile,
      });

      // Handle client events
      socket.on("setBreakpoint", (data) => {
        const { line, enabled } = data;
        if (enabled) {
          this.debugState.breakpoints.add(line);
        } else {
          this.debugState.breakpoints.delete(line);
        }
        this.io.emit(
          "breakpointsUpdated",
          Array.from(this.debugState.breakpoints),
        );
      });

      socket.on("addWatch", (data) => {
        const { variable, expression } = data;
        this.debugState.watches.set(variable, expression);
        this.io.emit(
          "watchesUpdated",
          Array.from(this.debugState.watches.entries()),
        );
      });

      socket.on("removeWatch", (variable) => {
        this.debugState.watches.delete(variable);
        this.io.emit(
          "watchesUpdated",
          Array.from(this.debugState.watches.entries()),
        );
      });

      socket.on("control", (data) => {
        const { action, ...rest } = data;
        this.handleControlAction(action, rest);
      });

      socket.on("evaluate", async (data, callback) => {
        try {
          const result = await this.evaluateExpression(
            data.expression,
            data.barIndex,
          );
          callback({ result });
        } catch (error) {
          callback({ error: error.message });
        }
      });

      socket.on("disconnect", () => {
        console.log("🔌 Client disconnected:", socket.id);
      });
    });
  }

  async analyzePineScript(content) {
    const analysis = {
      lines: content.split("\n"),
      variables: [],
      functions: [],
      conditions: [],
      plots: [],
      complexity: 0,
      suggestions: [],
    };

    // Extract variables
    const varRegex = /(\w+)\s*=\s*(?!ta\.|math\.|str\.|input\.|request\.)/g;
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      analysis.variables.push({
        name: match[1],
        line: this.getLineNumber(content, match.index),
        type: "variable",
      });
    }

    // Extract input variables
    const inputRegex = /input\.(\w+)\s*\(/g;
    while ((match = inputRegex.exec(content)) !== null) {
      analysis.variables.push({
        name: match[1],
        line: this.getLineNumber(content, match.index),
        type: "input",
      });
    }

    // Extract functions
    const funcRegex = /(\w+)\s*\([^)]*\)\s*=>/g;
    while ((match = funcRegex.exec(content)) !== null) {
      analysis.functions.push({
        name: match[1],
        line: this.getLineNumber(content, match.index),
        type: "function",
      });
    }

    // Extract conditions
    const condRegex = /if\s+|when\s+/gi;
    analysis.conditions = [...content.matchAll(condRegex)].map((match) => ({
      line: this.getLineNumber(content, match.index),
      expression: match[0],
    }));

    // Extract plots
    const plotRegex = /plot(?:shape|char)?\s*\(/gi;
    analysis.plots = [...content.matchAll(plotRegex)].map((match) => ({
      line: this.getLineNumber(content, match.index),
      type: match[0].includes("shape")
        ? "shape"
        : match[0].includes("char")
          ? "char"
          : "plot",
    }));

    // Calculate complexity
    analysis.complexity = this.calculateComplexity(content);

    // Generate suggestions
    analysis.suggestions = this.generateDebugSuggestions(content);

    return analysis;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split("\n").length;
  }

  calculateComplexity(content) {
    const lines = content.split("\n").length;
    const variables = (content.match(/\w+\s*=/g) || []).length;
    const conditions = (content.match(/if\s+|when\s+|and\s+|or\s+/gi) || [])
      .length;
    const functions = (content.match(/=>/g) || []).length;

    return Math.round(
      lines * 0.3 + variables * 0.2 + conditions * 0.3 + functions * 0.2,
    );
  }

  generateDebugSuggestions(content) {
    const suggestions = [];
    const lines = content.split("\n").length;
    const variableCount = (content.match(/\w+\s*=/g) || []).length;

    if (lines > 100) {
      suggestions.push({
        type: "performance",
        message: `Large indicator (${lines} lines). Consider adding breakpoints for step debugging.`,
        priority: "medium",
      });
    }

    if (variableCount > 20) {
      suggestions.push({
        type: "organization",
        message: `Many variables (${variableCount}). Use watch expressions to track key variables.`,
        priority: "high",
      });
    }

    if (!content.includes("plotchar(") && !content.includes("plotshape(")) {
      suggestions.push({
        type: "visualization",
        message:
          "No debug visualization found. Add plotchar() for variable inspection.",
        priority: "low",
      });
    }

    return suggestions;
  }

  async startDebugging() {
    if (this.debugState.isRunning) {
      return;
    }

    this.debugState.isRunning = true;
    this.debugState.paused = false;
    this.debugState.currentBar = 0;
    this.debugState.variables.clear();
    this.debugState.callStack = [];

    this.io.emit("debuggingStarted", {
      currentBar: this.debugState.currentBar,
      isRunning: true,
      paused: false,
    });

    // Start execution loop
    this.executionLoop();
  }

  pauseDebugging() {
    if (!this.debugState.isRunning || this.debugState.paused) {
      return;
    }

    this.debugState.paused = true;
    this.io.emit("debuggingPaused", {
      currentBar: this.debugState.currentBar,
      paused: true,
    });
  }

  resumeDebugging() {
    if (!this.debugState.isRunning || !this.debugState.paused) {
      return;
    }

    this.debugState.paused = false;
    this.io.emit("debuggingResumed", {
      currentBar: this.debugState.currentBar,
      paused: false,
    });

    // Continue execution
    this.executionLoop();
  }

  stopDebugging() {
    this.debugState.isRunning = false;
    this.debugState.paused = false;

    this.io.emit("debuggingStopped", {
      isRunning: false,
      paused: false,
      currentBar: this.debugState.currentBar,
    });
  }

  async stepDebugging(steps = 1) {
    if (!this.debugState.isRunning) {
      return;
    }

    this.debugState.paused = true;

    for (let i = 0; i < steps; i++) {
      if (!this.debugState.isRunning) break;

      await this.executeBar(this.debugState.currentBar);
      this.debugState.currentBar++;

      // Check for breakpoints
      if (this.debugState.breakpoints.has(this.debugState.currentBar)) {
        this.io.emit("breakpointHit", {
          bar: this.debugState.currentBar,
          variables: Array.from(this.debugState.variables.entries()),
        });
        break;
      }
    }

    this.io.emit("stepComplete", {
      currentBar: this.debugState.currentBar,
      variables: Array.from(this.debugState.variables.entries()),
      callStack: this.debugState.callStack,
    });
  }

  setExecutionSpeed(speed) {
    this.debugState.executionSpeed = Math.max(0.1, Math.min(speed, 10));
    this.io.emit("speedChanged", { speed: this.debugState.executionSpeed });
  }

  gotoBar(barIndex) {
    if (!this.debugState.isRunning) {
      return;
    }

    this.debugState.currentBar = Math.max(0, barIndex);
    this.io.emit("barChanged", {
      currentBar: this.debugState.currentBar,
      variables: Array.from(this.debugState.variables.entries()),
    });
  }

  async executionLoop() {
    while (this.debugState.isRunning && !this.debugState.paused) {
      await this.executeBar(this.debugState.currentBar);

      // Update clients
      this.io.emit("barExecuted", {
        bar: this.debugState.currentBar,
        variables: Array.from(this.debugState.variables.entries()),
        watches: this.evaluateWatches(),
      });

      this.debugState.currentBar++;

      // Check for breakpoints
      if (this.debugState.breakpoints.has(this.debugState.currentBar)) {
        this.debugState.paused = true;
        this.io.emit("breakpointHit", {
          bar: this.debugState.currentBar,
          variables: Array.from(this.debugState.variables.entries()),
        });
        break;
      }

      // Rate limiting based on execution speed
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 / this.debugState.executionSpeed),
      );
    }
  }

  async executeBar(barIndex) {
    // Simulate PineScript execution for a bar
    // In a real implementation, this would execute the actual PineScript code

    // Update some example variables
    const time = Date.now();
    this.debugState.variables.set("bar_index", barIndex);
    this.debugState.variables.set("close", 100 + Math.sin(barIndex * 0.1) * 10);
    this.debugState.variables.set("high", 105 + Math.sin(barIndex * 0.1) * 12);
    this.debugState.variables.set("low", 95 + Math.sin(barIndex * 0.1) * 8);
    this.debugState.variables.set("volume", 1000 + Math.random() * 500);

    // Update call stack
    this.debugState.callStack = [
      { function: "main", bar: barIndex, time },
      { function: "calculateIndicators", bar: barIndex, time: time + 1 },
    ];
  }

  evaluateWatches() {
    const results = new Map();

    for (const [variable, expression] of this.debugState.watches.entries()) {
      try {
        // Simple expression evaluation
        // In a real implementation, this would use a proper expression evaluator
        const value = this.evaluateWatchExpression(expression);
        results.set(variable, {
          value,
          expression,
          timestamp: Date.now(),
        });
      } catch (error) {
        results.set(variable, {
          error: error.message,
          expression,
          timestamp: Date.now(),
        });
      }
    }

    return Array.from(results.entries());
  }

  evaluateWatchExpression(expression) {
    // Simple expression evaluator for demo purposes
    // In production, use a proper expression parser

    if (expression.includes("+")) {
      const parts = expression.split("+");
      return parts.reduce(
        (sum, part) => sum + (parseFloat(part.trim()) || 0),
        0,
      );
    }

    if (expression.includes("-")) {
      const parts = expression.split("-");
      return parts.reduce(
        (diff, part, i) =>
          i === 0
            ? parseFloat(part.trim()) || 0
            : diff - (parseFloat(part.trim()) || 0),
        0,
      );
    }

    // Try to get variable value
    const varName = expression.trim();
    if (this.debugState.variables.has(varName)) {
      return this.debugState.variables.get(varName);
    }

    // Try to parse as number
    const num = parseFloat(varName);
    if (!isNaN(num)) {
      return num;
    }

    throw new Error(`Cannot evaluate expression: ${expression}`);
  }

  async evaluateExpression(expression, barIndex) {
    // For now, return a simulated result
    // In a real implementation, this would evaluate the expression in PineScript context

    return {
      value: Math.random() * 100,
      type: "number",
      barIndex: barIndex || this.debugState.currentBar,
      timestamp: Date.now(),
    };
  }

  handleControlAction(action, data) {
    switch (action) {
      case "start":
        this.startDebugging();
        break;
      case "pause":
        this.pauseDebugging();
        break;
      case "resume":
        this.resumeDebugging();
        break;
      case "stop":
        this.stopDebugging();
        break;
      case "step":
        this.stepDebugging(data?.steps || 1);
        break;
      case "setSpeed":
        this.setExecutionSpeed(data?.speed || 1);
        break;
      case "gotoBar":
        this.gotoBar(data?.bar || 0);
        break;
      default:
        console.warn("Unknown control action:", action);
    }
  }

  // ========== SESSION EXPORT/IMPORT ==========

  exportDebugSession() {
    const sessionData = {
      metadata: {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        projectPath: this.projectPath,
        debugFile: this.debugFile,
        totalBars: this.debugState.totalBars,
      },
      debugState: {
        currentBar: this.debugState.currentBar,
        breakpoints: Array.from(this.debugState.breakpoints),
        watches: Array.from(this.debugState.watches.entries()),
        variables: Array.from(this.debugState.variables.entries()),
        callStack: this.debugState.callStack,
        executionSpeed: this.debugState.executionSpeed,
        isRunning: this.debugState.isRunning,
        paused: this.debugState.paused,
      },
      configuration: {
        port: this.port,
        projectPath: this.projectPath,
      },
      statistics: {
        barsExecuted: this.debugState.currentBar,
        breakpointsHit: Object.keys(this.debugState.breakpoints).length,
        variablesTracked: this.debugState.variables.size,
        watchesActive: this.debugState.watches.size,
      },
    };

    return sessionData;
  }

  importDebugSession(sessionData) {
    // Validate session data
    if (!sessionData || !sessionData.debugState) {
      throw new Error("Invalid session data format");
    }

    // Import debug state
    const { debugState } = sessionData;

    this.debugState.currentBar = debugState.currentBar || 0;
    this.debugState.breakpoints = new Set(debugState.breakpoints || []);
    this.debugState.watches = new Map(debugState.watches || []);
    this.debugState.variables = new Map(debugState.variables || []);
    this.debugState.callStack = debugState.callStack || [];
    this.debugState.executionSpeed = debugState.executionSpeed || 1;
    this.debugState.isRunning = debugState.isRunning || false;
    this.debugState.paused = debugState.paused || false;

    // Update configuration if provided
    if (sessionData.configuration) {
      this.projectPath =
        sessionData.configuration.projectPath || this.projectPath;
    }

    // Notify clients
    this.io.emit("sessionImported", {
      success: true,
      bars: this.debugState.currentBar,
      breakpoints: Array.from(this.debugState.breakpoints).length,
      variables: this.debugState.variables.size,
    });

    return {
      success: true,
      message: "Session imported successfully",
      bars: this.debugState.currentBar,
      breakpoints: Array.from(this.debugState.breakpoints).length,
      variables: this.debugState.variables.size,
    };
  }

  convertSessionToCSV(sessionData) {
    let csv = "Type,Name,Value,Timestamp\n";

    // Add variables
    if (sessionData.debugState.variables) {
      sessionData.debugState.variables.forEach(([name, value]) => {
        csv += `Variable,${name},${value},${new Date().toISOString()}\n`;
      });
    }

    // Add breakpoints
    if (sessionData.debugState.breakpoints) {
      sessionData.debugState.breakpoints.forEach((bp) => {
        csv += `Breakpoint,Line ${bp},active,${new Date().toISOString()}\n`;
      });
    }

    // Add watches
    if (sessionData.debugState.watches) {
      sessionData.debugState.watches.forEach(([name, expression]) => {
        csv += `Watch,${name},${expression},${new Date().toISOString()}\n`;
      });
    }

    return csv;
  }

  // ========== SECURITY VALIDATION METHODS ==========

  validateSessionData(sessionData) {
    if (!sessionData || typeof sessionData !== "object") {
      return false;
    }

    // Check required structure
    if (!sessionData.metadata || !sessionData.debugState) {
      return false;
    }

    // Validate metadata
    if (typeof sessionData.metadata !== "object") {
      return false;
    }

    // Validate debug state
    const debugState = sessionData.debugState;
    if (typeof debugState !== "object") {
      return false;
    }

    // Check for required fields with proper types
    const requiredFields = {
      currentBar: "number",
      breakpoints: "object",
      watches: "object",
      variables: "object",
      callStack: "object",
      executionSpeed: "number",
      isRunning: "boolean",
      paused: "boolean",
    };

    for (const [field, type] of Object.entries(requiredFields)) {
      if (!(field in debugState) || typeof debugState[field] !== type) {
        return false;
      }
    }

    // Validate arrays are actually arrays
    if (
      !Array.isArray(debugState.breakpoints) ||
      !Array.isArray(debugState.watches) ||
      !Array.isArray(debugState.variables) ||
      !Array.isArray(debugState.callStack)
    ) {
      return false;
    }

    return true;
  }

  containsMaliciousData(sessionData) {
    // Check for potentially malicious content in strings
    const checkString = (str) => {
      if (typeof str !== "string") return false;

      // Check for script tags
      if (str.includes("<script>") || str.includes("</script>")) {
        return true;
      }

      // Check for dangerous JavaScript
      const dangerousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /onclick=/i,
        /eval\(/i,
        /document\./i,
        /window\./i,
        /localStorage/i,
        /sessionStorage/i,
        /cookie/i,
      ];

      return dangerousPatterns.some((pattern) => pattern.test(str));
    };

    // Recursively check object
    const checkObject = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        // Check keys
        if (checkString(key)) {
          return true;
        }

        // Check values
        if (typeof value === "string") {
          if (checkString(value)) {
            return true;
          }
        } else if (typeof value === "object" && value !== null) {
          if (checkObject(value)) {
            return true;
          }
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string") {
              if (checkString(item)) {
                return true;
              }
            } else if (typeof item === "object" && item !== null) {
              if (checkObject(item)) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    return checkObject(sessionData);
  }

  isValidFileType(file) {
    const allowedExtensions = [".json", ".csv"];
    const allowedMimeTypes = ["application/json", "text/csv", "text/plain"];

    // Check extension
    const extension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return false;
    }

    // Check MIME type if available
    if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
      return false;
    }

    return true;
  }

  async start() {
    try {
      // Try to initialize PineScript runner, but continue even if it fails
      try {
        this.runner = new PineCommandRunner(this.projectPath);
        await this.runner.initialize();
        console.log("✅ PineScript project configured");
      } catch (error) {
        console.log(
          "⚠️  PineScript project not configured - running in basic mode",
        );
        console.log("💡 Run /pine-setup to enable full debugging features");
        this.runner = null;
      }

      // Start server
      this.server.listen(this.port, () => {
        console.log(`🚀 PineScript Debug Server running on port ${this.port}`);
        console.log(`📁 Project path: ${this.projectPath}`);
        console.log(`🔗 Debug interface: http://localhost:${this.port}/debug`);
        console.log(`📊 Main interface: http://localhost:${this.port}/`);

        if (this.debugFile) {
          console.log(`📄 Debug file: ${this.debugFile}`);
        } else {
          console.log("💡 Use /api/load endpoint to load a PineScript file");
        }

        console.log(
          "💾 Session export/import available at /api/export and /api/import",
        );
      });
    } catch (error) {
      console.error("Failed to start debug server:", error);
      process.exit(1);
    }
  }

  stop() {
    this.server.close(() => {
      console.log("🛑 Debug server stopped");
    });
  }

  // ============================================================================
  // AI HELPER METHODS
  // ============================================================================

  loadAIPatterns() {
    const fs = require("fs");
    const path = require("path");

    const patternsPath = path.join(__dirname, "../../data/ai-patterns.json");

    try {
      if (fs.existsSync(patternsPath)) {
        const data = fs.readFileSync(patternsPath, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(`Warning: Could not load AI patterns: ${error.message}`);
    }

    // Return default patterns if file not found
    return {
      patterns: {
        common_errors: [],
        performance_issues: [],
        best_practices: [],
        tradingview_specific: [],
      },
      version: "1.0.0",
      description: "Default AI patterns",
      suggestion_categories: {},
    };
  }

  generateAISuggestions(
    code,
    patterns,
    includePatterns = "all",
    threshold = 0.7,
  ) {
    const suggestions = [];
    const lines = code.split("\n");

    // Parse include patterns
    const categories =
      includePatterns === "all"
        ? [
            "common_errors",
            "performance_issues",
            "best_practices",
            "tradingview_specific",
          ]
        : includePatterns.split(",");

    // Analyze each line for patterns
    lines.forEach((line, lineNum) => {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (trimmed === "" || trimmed.startsWith("//")) {
        return;
      }

      // Check each category
      categories.forEach((category) => {
        if (patterns.patterns[category]) {
          patterns.patterns[category].forEach((pattern) => {
            if (this.matchesAIPattern(trimmed, pattern)) {
              suggestions.push({
                line: lineNum + 1,
                category: category.replace("_", " "),
                patternId: pattern.id,
                patternName: pattern.name,
                description: pattern.description,
                severity: pattern.severity,
                fix: pattern.fix,
                example: pattern.example_fixed,
                confidence: this.calculateAIConfidence(trimmed, pattern),
                codeSnippet: trimmed.substring(0, 100), // First 100 chars
              });
            }
          });
        }
      });
    });

    // Filter by threshold and sort
    return suggestions
      .filter((s) => s.confidence >= threshold)
      .sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return (
          severityOrder[b.severity] - severityOrder[a.severity] ||
          b.confidence - a.confidence
        );
      });
  }

  matchesAIPattern(line, pattern) {
    const lineLower = line.toLowerCase();

    // Simple pattern matching
    if (
      pattern.id === "CE001" &&
      (lineLower.includes("[bar_index") || lineLower.includes("close["))
    ) {
      return true;
    }

    if (
      pattern.id === "CE002" &&
      (lineLower.includes("/ 0") || lineLower.includes("/ close[1]"))
    ) {
      return true;
    }

    if (
      pattern.id === "CE003" &&
      (lineLower.includes("na +") || lineLower.includes("+ na"))
    ) {
      return true;
    }

    if (
      pattern.id === "PI001" &&
      lineLower.includes("ta.sma") &&
      lineLower.includes("ta.sma")
    ) {
      return true;
    }

    if (
      pattern.id === "BP001" &&
      lineLower.includes("input(") &&
      !lineLower.includes("input.int(")
    ) {
      return true;
    }

    if (pattern.id === "TV001" && lineLower.includes("security(")) {
      return true;
    }

    return false;
  }

  calculateAIConfidence(line, pattern) {
    let confidence = 0.5;

    if (pattern.id === "CE002" && line.includes("/ 0")) {
      confidence = 0.9;
    }

    if (pattern.id === "CE001" && line.includes("[bar_index -")) {
      confidence = 0.8;
    }

    if (pattern.id === "PI001" && (line.match(/ta\.sma/g) || []).length > 1) {
      confidence = 0.7;
    }

    return Math.min(confidence, 0.95);
  }

  calculateAISuggestionStats(session) {
    const suggestions = session.aiSuggestions || [];
    const feedback = session.aiFeedback || [];

    const stats = {
      totalSuggestions: suggestions.length,
      highPriority: suggestions.filter((s) => s.severity === "high").length,
      mediumPriority: suggestions.filter((s) => s.severity === "medium").length,
      lowPriority: suggestions.filter((s) => s.severity === "low").length,
      totalFeedback: feedback.length,
      acceptedFeedback: feedback.filter((f) => f.accepted).length,
      rejectedFeedback: feedback.filter((f) => !f.accepted).length,
      acceptanceRate:
        feedback.length > 0
          ? Math.round(
              (feedback.filter((f) => f.accepted).length / feedback.length) *
                100,
            )
          : 0,
    };

    return stats;
  }

  analyzeCodeDifferences(originalCode, modifiedCode) {
    const originalLines = originalCode.split("\n");
    const modifiedLines = modifiedCode.split("\n");

    const addedLines = [];
    const removedLines = [];
    const modifiedCount = 0;

    // Simple line-by-line comparison
    const maxLength = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLength; i++) {
      const original = originalLines[i] || "";
      const modified = modifiedLines[i] || "";

      if (i >= originalLines.length) {
        addedLines.push({ line: i + 1, content: modified });
      } else if (i >= modifiedLines.length) {
        removedLines.push({ line: i + 1, content: original });
      } else if (original.trim() !== modified.trim()) {
        // Count as modified
      }
    }

    return {
      addedLines: addedLines.length,
      removedLines: removedLines.length,
      modifiedCount,
      totalChanges: addedLines.length + removedLines.length + modifiedCount,
      summary: `${addedLines.length} lines added, ${removedLines.length} lines removed`,
    };
  }

  calculateImprovements(previousSuggestions, newSuggestions) {
    const previousIds = new Set(previousSuggestions.map((s) => s.patternId));
    const newIds = new Set(newSuggestions.map((s) => s.patternId));

    const fixedIssues = Array.from(previousIds).filter((id) => !newIds.has(id));
    const newIssues = Array.from(newIds).filter((id) => !previousIds.has(id));
    const remainingIssues = Array.from(newIds).filter((id) =>
      previousIds.has(id),
    );

    return {
      fixedIssues: fixedIssues.length,
      newIssues: newIssues.length,
      remainingIssues: remainingIssues.length,
      improvementRate:
        previousIds.size > 0
          ? Math.round((fixedIssues.length / previousIds.size) * 100)
          : 0,
      details: {
        fixed: fixedIssues,
        new: newIssues,
        remaining: remainingIssues,
      },
    };
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--port" || args[i] === "-p") {
      options.port = parseInt(args[++i]);
    } else if (args[i] === "--file" || args[i] === "-f") {
      options.file = args[++i];
    } else if (args[i] === "--project" || args[i] === "-d") {
      options.projectPath = args[++i];
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
PineScript Interactive Debug Server

Usage: node debug-server.js [options]

Options:
  --port, -p      Port to run server on (default: 3000)
  --file, -f      PineScript file to debug
  --project, -d   Project directory (default: current directory)
  --help, -h      Show this help message

Examples:
  node debug-server.js --port 3000 --file my-indicator.pine
  node debug-server.js --project /path/to/project
      `);
      process.exit(0);
    }
  }

  const server = new PineScriptDebugServer(options);
  server.start();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, shutting down...");
    server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, shutting down...");
    server.stop();
    process.exit(0);
  });
}

module.exports = PineScriptDebugServer;
