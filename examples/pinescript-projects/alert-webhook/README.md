# PineScript Alert Webhook Example

Complete example of setting up PineScript alerts with webhook integration for automated trading notifications.

## Overview

This example demonstrates how to:

1. Create a PineScript strategy with multiple alert types
2. Set up a webhook server to receive alerts
3. Configure the `/pine-alert` command to manage alerts
4. Process and act on trading signals automatically

## Project Structure

```
alert-webhook/
├── rsi-alert-strategy.pine      # PineScript strategy with alerts
├── webhook-server.js           # Node.js webhook server
├── package.json                # Dependencies and scripts
├── README.md                   # This file
└── logs/                       # Alert logs (auto-created)
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Webhook Server

```bash
npm start
```

Server runs on http://localhost:3000

### 3. Configure PineScript Alerts

```bash
# From the everything-opencode project root
/pine-alert --action setup \
  --file examples/pinescript-projects/alert-webhook/rsi-alert-strategy.pine \
  --channel webhook \
  --webhookUrl http://localhost:3000/webhook
```

### 4. Test the System

```bash
# Test alert delivery
/pine-alert --action test

# View configured alerts
/pine-alert --action list
```

## PineScript Strategy

### Strategy Features

- **RSI-based trading signals** with overbought/oversold levels
- **EMA filter** to confirm trend direction
- **Multiple alert types** with different priorities
- **Stop loss and take profit** management
- **Daily performance summaries**

### Alert Types

1. **Strong Buy/Sell** - Most significant signals
2. **Moderate Buy/Sell** - Regular trading signals
3. **Exit Signals** - Stop loss and take profit triggers
4. **Daily Summary** - End-of-day performance report

### Alert Configuration in PineScript

```pinescript
// Strong buy alert
alert("STRONG BUY: RSI = " + str.tostring(rsi, "#.##") +
      ", Price = $" + str.tostring(price, "#.##"),
      alert.freq_once_per_bar) when strong_buy

// Daily summary alert
alert("DAILY SUMMARY: P&L = " + str.tostring(strategy.netprofit, "#.##") +
      ", Win Rate = " + str.tostring(strategy.wintrade/strategy.closedtrades * 100, "#.##") + "%",
      alert.freq_once_per_day)
```

## Webhook Server

### Features

- **REST API** for receiving alerts
- **Alert processing** with type-specific handlers
- **Logging** to files and memory
- **Statistics** and monitoring endpoints
- **Health checks** and test utilities

### API Endpoints

| Endpoint   | Method | Description                            |
| ---------- | ------ | -------------------------------------- |
| `/webhook` | POST   | Receive PineScript alerts              |
| `/alerts`  | GET    | View recent alerts (limit query param) |
| `/stats`   | GET    | Alert statistics and metrics           |
| `/test`    | POST   | Create test alert                      |
| `/health`  | GET    | Server health check                    |

### Alert Processing

The server processes alerts based on type:

- **Buy signals**: Logged to `buy-signals.log`, could trigger trading
- **Sell signals**: Logged to `sell-signals.log`
- **Exit signals**: Logged to `exit-signals.log`
- **Daily summaries**: Logged to `daily-summaries.log`

### Extending the Server

Add your own processing logic in `webhook-server.js`:

```javascript
async processAlert(alert) {
  switch (alert.type) {
    case 'buy_signal':
      // Execute buy order via trading API
      await this.executeTrade('buy', alert);
      break;

    case 'sell_signal':
      // Execute sell order
      await this.executeTrade('sell', alert);
      break;

    // Add more cases as needed
  }
}
```

## Alert Management Commands

### Setup Alerts

```bash
# Basic setup with webhook
/pine-alert --action setup --channel webhook --webhookUrl YOUR_URL

# Setup with specific file
/pine-alert --action setup --file strategy.pine --channel webhook

# Setup multiple channels
/pine-alert --action setup --channel webhook --webhookUrl WEBHOOK_URL
/pine-alert --action setup --channel telegram
/pine-alert --action setup --channel discord
```

### Manage Alerts

```bash
# List all alerts
/pine-alert --action list

# Test alert delivery
/pine-alert --action test --testMessage "System test"

# Enable/disable specific alerts
/pine-alert --action disable --alertName strong_buy
/pine-alert --action enable --alertName moderate_sell

# Update webhook URL
/pine-alert --action webhook --webhookUrl NEW_URL
```

### Integration with Other Commands

```bash
# Backtest strategy first
/pine-backtest --file rsi-alert-strategy.pine

# Optimize parameters
/pine-optimize --file rsi-alert-strategy.pine --metric sharpe

# Setup alerts for live trading
/pine-alert --action setup --file rsi-alert-strategy.pine --channel webhook
```

## Deployment

### Local Development

```bash
# Start server
npm start

# Development with auto-restart
npm run dev

# Test webhook
curl -X POST http://localhost:3000/test
```

### Production Deployment

#### 1. Environment Variables

```bash
export PORT=8080
export NODE_ENV=production
export WEBHOOK_SECRET=your_secret_key
```

#### 2. PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start webhook-server.js --name "pinescript-alerts"
pm2 save
pm2 startup
```

#### 3. Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "webhook-server.js"]
```

#### 4. Cloud Platforms

- **AWS**: EC2, ECS, or Lambda with API Gateway
- **Google Cloud**: Cloud Run or Compute Engine
- **Azure**: App Service or Container Instances
- **Heroku**: Simple deployment with git push

## Security Considerations

### 1. Authentication

Add authentication to webhook endpoints:

```javascript
// Basic auth middleware
app.use("/webhook", (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});
```

### 2. Rate Limiting

Prevent abuse with rate limiting:

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/webhook", limiter);
```

### 3. Input Validation

Validate alert payloads:

```javascript
function validateAlert(alert) {
  const schema = Joi.object({
    message: Joi.string().required(),
    alertName: Joi.string().required(),
    timestamp: Joi.date().iso().required(),
    type: Joi.string().valid("buy", "sell", "exit", "summary", "test"),
  });

  return schema.validate(alert);
}
```

### 4. HTTPS

Always use HTTPS in production:

```bash
# With Let's Encrypt
certbot --nginx -d yourdomain.com

# Or use a reverse proxy (nginx)
server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl;
  server_name yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  location / {
    proxy_pass http://localhost:3000;
  }
}
```

## Monitoring and Maintenance

### Logging

Alerts are logged to:

- Console output
- `logs/alerts-YYYY-MM-DD.log` files
- Channel-specific log files

### Health Checks

```bash
# Check server health
curl http://localhost:3000/health

# View statistics
curl http://localhost:3000/stats

# Recent alerts
curl http://localhost:3000/alerts?limit=10
```

### Alert Volume Management

```bash
# Disable noisy alerts
/pine-alert --action disable --alertName minor_signal

# Adjust alert frequencies in PineScript
alert("Signal", alert.freq_once_per_bar_close)  # Less frequent

# Use conditions to filter
alert("Signal", alert.freq_once_per_bar) when condition and barstate.isconfirmed
```

## Troubleshooting

### Common Issues

#### Alerts not being received

1. Check server is running: `curl http://localhost:3000/health`
2. Verify webhook URL in configuration
3. Check PineScript alert conditions are met
4. Test with: `/pine-alert --action test`

#### Too many alerts

1. Adjust alert frequencies
2. Add stricter conditions
3. Disable less important alerts
4. Implement rate limiting

#### Webhook server errors

1. Check logs: `tail -f logs/*.log`
2. Verify dependencies: `npm list`
3. Check port availability: `netstat -tulpn | grep :3000`

#### PineScript validation errors

```bash
# Validate PineScript syntax
/pine-validate --file rsi-alert-strategy.pine

# Check for missing dependencies
/pine-setup --check
```

## Extending the Example

### Adding Database Storage

```javascript
const { MongoClient } = require("mongodb");

class DatabaseAlertHandler {
  async saveAlert(alert) {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("trading");
    await db.collection("alerts").insertOne(alert);
    await client.close();
  }
}
```

### Integrating with Trading APIs

```javascript
class TradingAPIIntegration {
  async executeOrder(signal) {
    const order = {
      symbol: "BTCUSD",
      side: signal.type === "buy" ? "BUY" : "SELL",
      quantity: this.calculatePositionSize(signal),
      type: "MARKET",
    };

    const response = await fetch("https://api.exchange.com/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.API_KEY}` },
      body: JSON.stringify(order),
    });

    return response.json();
  }
}
```

### Adding Notification Channels

```javascript
class NotificationManager {
  async sendNotification(alert, channels) {
    for (const channel of channels) {
      switch (channel) {
        case "sms":
          await this.sendSMS(alert);
          break;
        case "push":
          await this.sendPushNotification(alert);
          break;
        case "slack":
          await this.sendSlackMessage(alert);
          break;
      }
    }
  }
}
```

## Related Resources

- [PineScript Documentation](https://www.tradingview.com/pine-script-docs/)
- [TradingView Alerts Guide](https://www.tradingview.com/support/solutions/43000529348)
- [Everything OpenCode PineScript Integration](../../PINESCRIPT-INTEGRATION.md)
- [`/pine-alert` Command Documentation](../../commands/pine-alert.md)

## License

MIT License - see LICENSE file for details.
