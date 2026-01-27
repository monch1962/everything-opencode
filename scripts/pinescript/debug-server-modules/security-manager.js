#!/usr/bin/env node
/**
 * Security Manager for PineScript Debug Server
 *
 * Handles authentication, session validation, rate limiting, and security middleware
 */

class SecurityManager {
  constructor(options = {}) {
    this.enabled = options.security !== false;
    this.allowedOrigins = options.allowedOrigins || [];
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.requireAuth = options.requireAuth || false;
    this.sessionTimeout = options.sessionTimeout || 30 * 60 * 1000; // 30 minutes
    this.rateLimit = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    };

    // Session validation tokens
    this.sessionTokens = new Map();

    // Rate limiting store
    this.rateLimitStore = new Map();
  }

  /**
   * Security middleware for Express
   */
  securityMiddleware(req, res, next) {
    if (!this.enabled) {
      return next();
    }

    // CORS validation
    const origin = req.headers.origin;
    if (origin && this.allowedOrigins.length > 0) {
      if (this.allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-Session-Token',
        );
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }

    // Session validation for protected routes
    if (this.requireAuth && req.path.startsWith('/api/')) {
      const token = req.headers['x-session-token'];
      if (!token || !this.validateToken(token)) {
        return res.status(401).json({ error: 'Invalid or missing session token' });
      }
    }

    // File upload validation
    if (req.files) {
      for (const file of Object.values(req.files)) {
        if (Array.isArray(file)) {
          for (const f of file) {
            if (!this.isValidFileType(f)) {
              return res.status(400).json({ error: 'Invalid file type' });
            }
          }
        } else if (!this.isValidFileType(file)) {
          return res.status(400).json({ error: 'Invalid file type' });
        }
      }
    }

    next();
  }

  /**
   * Rate limiting middleware
   */
  rateLimitMiddleware(req, res, next) {
    if (!this.enabled) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - this.rateLimit.windowMs;

    // Clean up old entries
    this.cleanupRateLimitStore(windowStart);

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(ip);
    if (!entry) {
      entry = { count: 0, resetTime: now + this.rateLimit.windowMs };
      this.rateLimitStore.set(ip, entry);
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.rateLimit.windowMs;
    }

    // Check rate limit
    if (entry.count >= this.rateLimit.max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.rateLimit.max);
    res.setHeader('X-RateLimit-Remaining', this.rateLimit.max - entry.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    next();
  }

  /**
   * Validate session token
   */
  validateToken(token) {
    const session = this.sessionTokens.get(token);
    if (!session) {
      return false;
    }

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      this.sessionTokens.delete(token);
      return false;
    }

    // Update last activity
    session.lastActivity = Date.now();
    return true;
  }

  /**
   * Validate session by ID
   */
  validateSession(sessionId) {
    for (const [token, session] of this.sessionTokens.entries()) {
      if (session.id === sessionId) {
        return this.validateToken(token);
      }
    }
    return false;
  }

  /**
   * Generate a new session token
   */
  generateSessionToken(sessionData = {}) {
    const token = require('crypto').randomBytes(32).toString('hex');
    const session = {
      id: require('crypto').randomBytes(16).toString('hex'),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      ...sessionData,
    };

    this.sessionTokens.set(token, session);
    return { token, session };
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, session] of this.sessionTokens.entries()) {
      if (now > session.expiresAt) {
        this.sessionTokens.delete(token);
      }
    }
  }

  /**
   * Clean up rate limit store
   */
  cleanupRateLimitStore(windowStart) {
    for (const [ip, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime < windowStart) {
        this.rateLimitStore.delete(ip);
      }
    }
  }

  /**
   * Check if file type is valid
   */
  isValidFileType(file) {
    const allowedTypes = ['.pine', '.txt', '.json', '.csv', '.js', '.ts', '.py', '.lua', '.m'];

    const ext = require('path').extname(file.name).toLowerCase();
    return allowedTypes.includes(ext);
  }

  /**
   * Check if data contains malicious content
   */
  containsMaliciousData(data) {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const jsonString = JSON.stringify(data);

    // Check for potential script injection
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /alert\s*\(/i,
      /prompt\s*\(/i,
      /confirm\s*\(/i,
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(jsonString)) {
        return true;
      }
    }

    // Check for excessive nesting (potential DoS)
    const checkDepth = (obj, depth = 0) => {
      if (depth > 20) return true;
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (checkDepth(obj[key], depth + 1)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkDepth(data);
  }
}

module.exports = SecurityManager;
