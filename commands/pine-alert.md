# `/pine-alert` Command

Configure and manage PineScript alert systems with multiple notification channels.

## Overview

The `/pine-alert` command sets up and manages alert systems for PineScript strategies. It supports multiple notification channels including webhooks, email, Discord, Telegram, and Slack, allowing you to receive real-time notifications when your trading conditions are met.

## Usage

```bash
/pine-alert [options]
```

## Options

| Option                | Alias | Description                                                                 | Default        |
| --------------------- | ----- | --------------------------------------------------------------------------- | -------------- |
| `--action`, `-a`      |       | Action to perform (`setup`, `test`, `list`, `enable`, `disable`, `webhook`) | `setup`        |
| `--file`, `-f`        |       | PineScript file to configure alerts for                                     | Auto-detected  |
| `--channel`, `-c`     |       | Alert channel (`webhook`, `email`, `discord`, `telegram`, `slack`)          |                |
| `--webhookUrl`, `-w`  |       | Webhook URL for alert delivery                                              |                |
| `--email`, `-e`       |       | Email address for alerts                                                    |                |
| `--testMessage`, `-m` |       | Test message to send                                                        | Auto-generated |
| `--alertName`, `-n`   |       | Specific alert name to manage                                               |                |
| `--frequency`         |       | Alert frequency (`once_per_bar`, `once_per_bar_close`, `once_per_minute`)   | `once_per_bar` |
| `--verbose`, `-v`     |       | Verbose output                                                              | `false`        |
| `--force`             |       | Force overwrite existing configuration                                      | `false`        |

## Actions

### `setup` - Configure Alert System

Set up alerts for a PineScript file.

```bash
/pine-alert --action setup --file strategy.pine --channel webhook
```

### `test` - Test Alert Configuration

Send test alerts to all configured channels.

```bash
/pine-alert --action test --testMessage "Test alert message"
```

### `list` - List Configured Alerts

Display all configured alerts and channels.

```bash
/pine-alert --action list
```

### `enable` - Enable Specific Alert

Enable a previously disabled alert.

```bash
/pine-alert --action enable --alertName buy_signal
```

### `disable` - Disable Specific Alert

Disable an alert without removing configuration.

```bash
/pine-alert --action disable --alertName sell_signal
```

### `webhook` - Configure Webhook Channel

Set up or update webhook configuration.

```bash
/pine-alert --action webhook --webhookUrl https://api.example.com/webhook
```

## Examples

### Basic Setup with Webhook

```bash
/pine-alert --action setup --channel webhook --webhookUrl https://api.example.com/alerts
```

### Setup with Multiple Channels

```bash
/pine-alert --action setup --channel webhook --webhookUrl WEBHOOK_URL
/pine-alert --action setup --channel telegram
/pine-alert --action setup --channel discord
```

### Test All Alerts

```bash
/pine-alert --action test --verbose
```

### List and Manage Alerts

```bash
# List all alerts
/pine-alert --action list

# Disable specific alert
/pine-alert --action disable --alertName rsi_overbought

# Enable specific alert
/pine-alert --action enable --alertName macd_crossover
```

### Interactive Setup

```bash
/pine-alert --action setup
# Follow interactive prompts for channel configuration
```

## Alert Channels

### Webhook

Send alerts to any HTTP endpoint.

**Configuration:**

```bash
/pine-alert --action setup --channel webhook --webhookUrl https://api.example.com/webhook
```

**Payload Format:**

```json
{
  "message": "Alert message",
  "alertName": "buy_signal",
  "fileName": "strategy.pine",
  "timestamp": "2024-01-25T10:30:00.000Z",
  "type": "alert",
  "source": "pinescript",
  "version": "1.0"
}
```

### Email

Send alerts via email (requires local mail server).

**Configuration:**

```bash
/pine-alert --action setup --channel email --email user@example.com
```

**Requirements:**

- `mail` command available
- Local mail server configured

### Discord

Send alerts to Discord channel via webhook.

**Configuration:**

```bash
/pine-alert --action setup --channel discord
# Enter Discord webhook URL when prompted
```

**Getting Discord Webhook URL:**

1. Open Discord server settings
2. Go to Integrations → Webhooks
3. Create new webhook or copy existing URL
4. Paste URL when prompted

### Telegram

Send alerts to Telegram via bot.

**Configuration:**

```bash
/pine-alert --action setup --channel telegram
# Enter bot token and chat ID when prompted
```

**Setting up Telegram Bot:**

1. Message @BotFather on Telegram
2. Create new bot with `/newbot`
3. Copy bot token
4. Get chat ID from @userinfobot
5. Start conversation with your bot

### Slack

Send alerts to Slack channel via webhook.

**Configuration:**

```bash
/pine-alert --action setup --channel slack
# Enter Slack webhook URL when prompted
```

**Getting Slack Webhook URL:**

1. Go to Slack App Directory
2. Search for "Incoming Webhooks"
3. Add to workspace
4. Configure channel and copy webhook URL

## PineScript Alert Syntax

### Basic Alert

```pinescript
// @version=5
strategy("My Strategy", overlay=true)

rsi = ta.rsi(close, 14)
buyCondition = rsi < 30
sellCondition = rsi > 70

// Create alerts
alert("Buy signal: RSI oversold", alert.freq_once_per_bar) when buyCondition
alert("Sell signal: RSI overbought", alert.freq_once_per_bar_close) when sellCondition
```

### Alert with Custom Message

```pinescript
// Include dynamic data in alert message
price = close
alert("Buy at $" + str.tostring(price), alert.freq_once_per_bar) when buyCondition
```

### Multiple Alerts

```pinescript
// Different alerts for different conditions
alert("Strong buy: RSI < 25", alert.freq_once_per_bar) when rsi < 25
alert("Moderate buy: RSI < 30", alert.freq_once_per_bar) when rsi < 30 and rsi >= 25
alert("Sell: RSI > 70", alert.freq_once_per_bar_close) when rsi > 70
```

### Alert Frequencies

| Frequency                       | Description                      | Use Case              |
| ------------------------------- | -------------------------------- | --------------------- |
| `alert.freq_once_per_bar`       | Once per bar when condition true | Intraday strategies   |
| `alert.freq_once_per_bar_close` | Once per bar at close            | End-of-day signals    |
| `alert.freq_once_per_minute`    | Once per minute                  | High-frequency alerts |
| `alert.freq_once_per_day`       | Once per day                     | Daily strategies      |
| `alert.freq_once_per_week`      | Once per week                    | Weekly analysis       |

## Configuration Workflow

### Step 1: Add Alerts to PineScript

```pinescript
// Add alert() calls to your strategy
alert("Buy signal generated", alert.freq_once_per_bar) when buyCondition
alert("Sell signal generated", alert.freq_once_per_bar_close) when sellCondition
```

### Step 2: Configure Alert System

```bash
/pine-alert --action setup --file strategy.pine --channel webhook --webhookUrl YOUR_WEBHOOK
```

### Step 3: Test Configuration

```bash
/pine-alert --action test
```

### Step 4: Monitor and Manage

```bash
# List all alerts
/pine-alert --action list

# Disable noisy alerts
/pine-alert --action disable --alertName minor_signal

# Update configuration
/pine-alert --action webhook --webhookUrl NEW_WEBHOOK
```

## Alert Management

### Viewing Alert Configuration

```bash
/pine-alert --action list --verbose
```

Output includes:

- Alert names and messages
- Enabled/disabled status
- Configured channels
- Channel configuration details

### Enabling/Disabling Alerts

```bash
# Disable specific alert
/pine-alert --action disable --alertName buy_signal

# Enable specific alert
/pine-alert --action enable --alertName sell_signal

# Verify status
/pine-alert --action list
```

### Testing Specific Channels

```bash
# Test webhook only
/pine-alert --action test --channel webhook

# Test with custom message
/pine-alert --action test --testMessage "System test - please ignore"
```

## Integration Examples

### Webhook Server (Node.js)

```javascript
const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  const alert = req.body;
  console.log("Received alert:", alert);

  // Process alert (save to database, trigger action, etc.)
  if (alert.type === "buy_signal") {
    // Execute buy order
  }

  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Webhook server listening on port 3000");
});
```

### Python Webhook Handler

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    print(f"Alert received: {data}")

    # Process the alert
    if data['type'] == 'sell_signal':
        # Execute sell logic
        pass

    return 'OK', 200

if __name__ == '__main__':
    app.run(port=3000)
```

### Discord Bot Integration

```javascript
// Use with Discord.js
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!alertstatus")) {
    const { exec } = require("child_process");
    exec("/pine-alert --action list", (error, stdout) => {
      message.channel.send(`\`\`\`${stdout}\`\`\``);
    });
  }
});
```

## Best Practices

### 1. Use Descriptive Alert Names

```pinescript
// Good
alert("RSI oversold - buy signal", alert.freq_once_per_bar)

// Avoid
alert("Alert 1", alert.freq_once_per_bar)
```

### 2. Set Appropriate Frequencies

- Use `once_per_bar_close` for end-of-day signals
- Use `once_per_bar` for intraday trading
- Avoid excessive alerts with `once_per_minute`

### 3. Test Before Production

```bash
# Test in development
/pine-alert --action test --testMessage "Development test"

# Verify all channels
/pine-alert --action list
```

### 4. Monitor Alert Volume

- Disable noisy alerts
- Use conditions to filter signals
- Implement rate limiting if needed

### 5. Secure Your Configuration

- Use environment variables for sensitive data
- Restrict webhook access
- Regularly rotate tokens/keys

## Troubleshooting

### No Alerts Found

**Problem**: `No alert() calls found in the PineScript file.`
**Solution**: Add `alert()` calls to your PineScript code.

### Webhook Failed

**Problem**: `Webhook failed: 404 Not Found`
**Solution**: Verify webhook URL is correct and server is running.

### Email Not Sending

**Problem**: `Email failed: command not found`
**Solution**: Install mail utility or use different channel.

### Alert Not Triggering

**Solution**:

1. Verify alert condition is met
2. Check alert is enabled: `/pine-alert --action list`
3. Test manually: `/pine-alert --action test`

### Too Many Alerts

**Solution**:

1. Adjust alert frequency
2. Add stricter conditions
3. Disable less important alerts

## Security Considerations

### Webhook Security

- Use HTTPS for webhook URLs
- Implement authentication
- Validate incoming requests
- Rate limit incoming alerts

### Token Management

- Store tokens in environment variables
- Never commit tokens to version control
- Regularly rotate tokens
- Use minimal permissions

### Data Privacy

- Avoid sending sensitive data in alerts
- Encrypt alert payloads if needed
- Comply with data protection regulations

## Performance Tips

### 1. Batch Processing

Process alerts in batches rather than individually.

### 2. Async Processing

Use async/await for non-blocking alert delivery.

### 3. Connection Pooling

Reuse HTTP connections for webhook calls.

### 4. Error Handling

Implement retry logic for failed alerts.

### 5. Monitoring

Monitor alert delivery rates and failures.

## Integration with Other Commands

### With `/pine-backtest`

```bash
# Backtest strategy
/pine-backtest --file strategy.pine

# Configure alerts for live trading
/pine-alert --action setup --file strategy.pine --channel webhook
```

### With `/pine-optimize`

```bash
# Optimize strategy parameters
/pine-optimize --file strategy.pine

# Set up alerts with optimized parameters
/pine-alert --action setup --file strategy.pine
```

### With `/pine-setup`

```bash
# Initial setup
/pine-setup

# Configure alerts
/pine-alert --action setup
```

## Exit Codes

| Code | Description                 |
| ---- | --------------------------- |
| 0    | Success                     |
| 1    | General error               |
| 2    | Configuration error         |
| 3    | File error                  |
| 4    | Channel configuration error |
| 5    | Alert delivery error        |

## See Also

- [`/pine-setup`](pine-setup.md) - Configure PineScript settings
- [`/pine-backtest`](pine-backtest.md) - Backtest PineScript strategies
- [`/pine-validate`](pine-validate.md) - Validate PineScript syntax
- [PineScript Integration Guide](../../PINESCRIPT-INTEGRATION.md) - Comprehensive PineScript integration documentation
- [TradingView Alert Documentation](https://www.tradingview.com/support/solutions/43000529348) - Official alert documentation
