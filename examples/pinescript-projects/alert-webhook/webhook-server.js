#!/usr/bin/env node

/**
 * Example webhook server for PineScript alerts
 *
 * This server receives alerts from PineScript strategies and processes them.
 * You can extend this to save to database, trigger trading actions, send notifications, etc.
 */

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

class AlertWebhookServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.alertsLog = [];
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(bodyParser.json());
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Main webhook endpoint
    this.app.post("/webhook", async (req, res) => {
      try {
        const alert = req.body;

        // Validate alert format
        if (!alert.message || !alert.alertName) {
          return res.status(400).json({ error: "Invalid alert format" });
        }

        console.log(`📢 Alert received: ${alert.alertName}`);
        console.log(`   Message: ${alert.message}`);
        console.log(`   File: ${alert.fileName}`);
        console.log(`   Type: ${alert.type}`);
        console.log(`   Time: ${alert.timestamp}`);

        // Process alert based on type
        await this.processAlert(alert);

        // Store alert
        this.alertsLog.push({
          ...alert,
          receivedAt: new Date().toISOString(),
          processed: true,
        });

        // Keep only last 1000 alerts
        if (this.alertsLog.length > 1000) {
          this.alertsLog = this.alertsLog.slice(-1000);
        }

        // Save to file
        await this.saveAlertToFile(alert);

        res.status(200).json({
          status: "success",
          message: "Alert processed",
          alertId: this.alertsLog.length,
        });
      } catch (error) {
        console.error("Error processing alert:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Alert history endpoint
    this.app.get("/alerts", (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const filtered = this.alertsLog.slice(-limit).reverse();

      res.json({
        count: filtered.length,
        total: this.alertsLog.length,
        alerts: filtered,
      });
    });

    // Alert statistics
    this.app.get("/stats", (req, res) => {
      const stats = {
        totalAlerts: this.alertsLog.length,
        byType: {},
        byAlertName: {},
        recentActivity: this.alertsLog.slice(-10).map((a) => ({
          alertName: a.alertName,
          time: a.receivedAt,
          message: a.message.substring(0, 50) + "...",
        })),
      };

      // Calculate statistics
      this.alertsLog.forEach((alert) => {
        stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
        stats.byAlertName[alert.alertName] =
          (stats.byAlertName[alert.alertName] || 0) + 1;
      });

      res.json(stats);
    });

    // Test endpoint
    this.app.post("/test", (req, res) => {
      const testAlert = {
        message: "Test alert from webhook server",
        alertName: "test_alert",
        fileName: "test.pine",
        timestamp: new Date().toISOString(),
        type: "test",
        source: "pinescript",
        version: "1.0",
      };

      this.alertsLog.push({
        ...testAlert,
        receivedAt: new Date().toISOString(),
        processed: true,
      });

      res.json({
        status: "success",
        message: "Test alert created",
        alert: testAlert,
      });
    });

    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        serverTime: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        alertsInMemory: this.alertsLog.length,
      });
    });

    // Static files for web interface
    this.app.use(express.static(path.join(__dirname, "public")));
  }

  async processAlert(alert) {
    console.log(`Processing alert: ${alert.alertName}`);

    // Example processing logic
    switch (alert.type) {
      case "test":
        console.log("Test alert - no action required");
        break;

      case "buy_signal":
      case "strong_buy":
      case "moderate_buy":
        await this.handleBuySignal(alert);
        break;

      case "sell_signal":
      case "strong_sell":
      case "moderate_sell":
        await this.handleSellSignal(alert);
        break;

      case "exit_signal":
        await this.handleExitSignal(alert);
        break;

      case "daily_summary":
        await this.handleDailySummary(alert);
        break;

      default:
        console.log(`Unknown alert type: ${alert.type}`);
    }

    // You could add more processing here:
    // - Save to database
    // - Send to message queue
    // - Trigger external API calls
    // - Send notifications (email, SMS, etc.)
    // - Execute trading orders
  }

  async handleBuySignal(alert) {
    console.log(`🚀 BUY SIGNAL: ${alert.message}`);

    // Example: Log to buy signals file
    const logEntry = {
      type: "buy",
      alert: alert.alertName,
      message: alert.message,
      timestamp: alert.timestamp,
      price: this.extractPrice(alert.message),
      conditions: this.extractConditions(alert.message),
    };

    await this.appendToFile("buy-signals.log", JSON.stringify(logEntry) + "\n");

    // Example: Could trigger trading API call here
    // await this.executeBuyOrder(logEntry);
  }

  async handleSellSignal(alert) {
    console.log(`📉 SELL SIGNAL: ${alert.message}`);

    const logEntry = {
      type: "sell",
      alert: alert.alertName,
      message: alert.message,
      timestamp: alert.timestamp,
      price: this.extractPrice(alert.message),
      conditions: this.extractConditions(alert.message),
    };

    await this.appendToFile(
      "sell-signals.log",
      JSON.stringify(logEntry) + "\n",
    );
  }

  async handleExitSignal(alert) {
    console.log(`🚪 EXIT SIGNAL: ${alert.message}`);

    const logEntry = {
      type: "exit",
      alert: alert.alertName,
      message: alert.message,
      timestamp: alert.timestamp,
      reason: this.extractExitReason(alert.message),
    };

    await this.appendToFile(
      "exit-signals.log",
      JSON.stringify(logEntry) + "\n",
    );
  }

  async handleDailySummary(alert) {
    console.log(`📊 DAILY SUMMARY: ${alert.message}`);

    const summary = {
      type: "daily_summary",
      timestamp: alert.timestamp,
      message: alert.message,
      metrics: this.extractMetrics(alert.message),
    };

    await this.appendToFile(
      "daily-summaries.log",
      JSON.stringify(summary) + "\n",
    );

    // Example: Send email report
    // await this.sendDailyReport(summary);
  }

  extractPrice(message) {
    const priceMatch = message.match(/\$(\d+\.?\d*)/);
    return priceMatch ? parseFloat(priceMatch[1]) : null;
  }

  extractConditions(message) {
    const conditions = {};

    // Extract RSI value
    const rsiMatch = message.match(/RSI\s*=\s*(\d+\.?\d*)/i);
    if (rsiMatch) conditions.rsi = parseFloat(rsiMatch[1]);

    // Extract EMA filter
    const emaMatch = message.match(/EMA Filter\s*=\s*(true|false)/i);
    if (emaMatch) conditions.emaFilter = emaMatch[1].toLowerCase() === "true";

    return conditions;
  }

  extractExitReason(message) {
    if (message.includes("Stop loss")) return "stop_loss";
    if (message.includes("Take profit")) return "take_profit";
    return "unknown";
  }

  extractMetrics(message) {
    const metrics = {};

    // Extract P&L
    const pnlMatch = message.match(/P&L\s*=\s*([-\d\.]+)/i);
    if (pnlMatch) metrics.pnl = parseFloat(pnlMatch[1]);

    // Extract Win Rate
    const winRateMatch = message.match(/Win Rate\s*=\s*(\d+\.?\d*)%/i);
    if (winRateMatch) metrics.winRate = parseFloat(winRateMatch[1]);

    // Extract Open Trades
    const tradesMatch = message.match(/Open Trades\s*=\s*(\d+)/i);
    if (tradesMatch) metrics.openTrades = parseInt(tradesMatch[1]);

    return metrics;
  }

  async saveAlertToFile(alert) {
    const logDir = path.join(__dirname, "logs");
    await fs.mkdir(logDir, { recursive: true });

    const date = new Date().toISOString().split("T")[0];
    const logFile = path.join(logDir, `alerts-${date}.log`);

    const logEntry = {
      timestamp: new Date().toISOString(),
      ...alert,
    };

    await this.appendToFile(logFile, JSON.stringify(logEntry) + "\n");
  }

  async appendToFile(filePath, content) {
    try {
      await fs.appendFile(filePath, content, "utf8");
    } catch (error) {
      console.error(`Error writing to file ${filePath}:`, error);
    }
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 Alert webhook server running on port ${this.port}`);
      console.log(`📝 Endpoints:`);
      console.log(`   POST /webhook     - Receive PineScript alerts`);
      console.log(`   GET  /alerts      - View recent alerts`);
      console.log(`   GET  /stats       - Alert statistics`);
      console.log(`   POST /test        - Create test alert`);
      console.log(`   GET  /health      - Server health check`);
      console.log(`\n💡 Configure PineScript alerts with:`);
      console.log(
        `   /pine-alert --action setup --channel webhook --webhookUrl http://localhost:${this.port}/webhook`,
      );
    });

    // Handle graceful shutdown
    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }

  shutdown() {
    console.log("\n🛑 Shutting down webhook server...");

    if (this.server) {
      this.server.close(() => {
        console.log("✅ Server stopped");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const port = process.env.PORT || 3000;
  const server = new AlertWebhookServer(port);
  server.start();
}

module.exports = AlertWebhookServer;
