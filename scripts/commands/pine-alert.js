#!/usr/bin/env node

const { PineCommandRunner } = require('../pinescript/command-runner');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PineAlertCommand extends PineCommandRunner {
  constructor() {
    super('pine-alert', 'Configure and manage PineScript alert systems');
  }

  async run(args) {
    try {
      const config = await this.loadConfig();
      const pineConfig = config.pinescript;

      if (!pineConfig) {
        this.error(
          'PineScript configuration not found. Run /pine-setup first.',
        );
        return 1;
      }

      const options = this.parseArgs(args, {
        action: {
          type: 'string',
          alias: 'a',
          description:
            'Action to perform (setup, test, list, enable, disable, webhook)',
          default: 'setup',
        },
        file: {
          type: 'string',
          alias: 'f',
          description: 'PineScript file to configure alerts for',
        },
        channel: {
          type: 'string',
          alias: 'c',
          description:
            'Alert channel (webhook, email, discord, telegram, slack)',
        },
        webhookUrl: {
          type: 'string',
          alias: 'w',
          description: 'Webhook URL for alert delivery',
        },
        email: {
          type: 'string',
          alias: 'e',
          description: 'Email address for alerts',
        },
        testMessage: {
          type: 'string',
          alias: 'm',
          description: 'Test message to send',
        },
        alertName: {
          type: 'string',
          alias: 'n',
          description: 'Specific alert name to manage',
        },
        frequency: {
          type: 'string',
          description:
            'Alert frequency (once_per_bar, once_per_bar_close, once_per_minute)',
        },
        verbose: { type: 'boolean', alias: 'v', description: 'Verbose output' },
        force: {
          type: 'boolean',
          description: 'Force overwrite existing configuration',
        },
      });

      switch (options.action) {
        case 'setup':
          return await this.setupAlerts(options);
        case 'test':
          return await this.testAlerts(options);
        case 'list':
          return await this.listAlerts(options);
        case 'enable':
          return await this.enableAlert(options);
        case 'disable':
          return await this.disableAlert(options);
        case 'webhook':
          return await this.setupWebhook(options);
        default:
          this.error(`Unknown action: ${options.action}`);
          return 1;
      }
    } catch (error) {
      this.error(`Alert operation failed: ${error.message}`);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      return 1;
    }
  }

  async setupAlerts(options) {
    this.log('Setting up PineScript alert system...');

    const pineFile = options.file || this.findPineScriptFile();
    if (!pineFile) {
      this.error(
        'No PineScript file specified and none found in current directory.',
      );
      return 1;
    }

    if (!(await this.fileExists(pineFile))) {
      this.error(`File not found: ${pineFile}`);
      return 1;
    }

    const content = await fs.readFile(pineFile, 'utf8');
    const alerts = this.extractAlerts(content);

    if (alerts.length === 0) {
      this.warn('No alert() calls found in the PineScript file.');
      this.log('To add alerts, use alert() function in your PineScript code:');
      this.log('  alert("Buy signal", alert.freq_once_per_bar)');
      this.log('  alert("Sell signal", alert.freq_once_per_bar_close)');
      return 0;
    }

    this.log(`Found ${alerts.length} alert(s) in ${pineFile}:`);
    alerts.forEach((alert, index) => {
      this.log(`  ${index + 1}. ${alert.name} - ${alert.message}`);
    });

    const config = await this.loadConfig();
    if (!config.pinescript.alerts) {
      config.pinescript.alerts = {};
    }

    const alertConfig = {
      file: pineFile,
      alerts: alerts.reduce((acc, alert) => {
        acc[alert.name] = {
          message: alert.message,
          frequency: options.frequency || alert.frequency || 'once_per_bar',
          enabled: true,
          channels: [],
        };
        return acc;
      }, {}),
      channels: {},
    };

    if (options.channel) {
      this.log(`Configuring alert channel: ${options.channel}`);

      switch (options.channel) {
        case 'webhook':
          if (!options.webhookUrl) {
            const webhookUrl = await this.prompt('Enter webhook URL: ');
            alertConfig.channels.webhook = { url: webhookUrl };
          } else {
            alertConfig.channels.webhook = { url: options.webhookUrl };
          }
          break;

        case 'email':
          if (!options.email) {
            const email = await this.prompt('Enter email address: ');
            alertConfig.channels.email = { address: email };
          } else {
            alertConfig.channels.email = { address: options.email };
          }
          break;

        case 'discord':
          alertConfig.channels.discord = await this.configureDiscord();
          break;

        case 'telegram':
          alertConfig.channels.telegram = await this.configureTelegram();
          break;

        case 'slack':
          alertConfig.channels.slack = await this.configureSlack();
          break;

        default:
          this.error(`Unsupported channel: ${options.channel}`);
          return 1;
      }
    } else {
      this.log('No channel specified. You can add channels later with:');
      this.log('  /pine-alert --action webhook --webhookUrl YOUR_URL');
    }

    config.pinescript.alerts[path.basename(pineFile)] = alertConfig;
    await this.saveConfig(config);

    this.log('\n=== ALERT CONFIGURATION COMPLETE ===');
    this.log(`File: ${pineFile}`);
    this.log(`Alerts configured: ${alerts.length}`);

    if (Object.keys(alertConfig.channels).length > 0) {
      this.log('Channels:');
      Object.keys(alertConfig.channels).forEach((channel) => {
        this.log(`  - ${channel}`);
      });
    }

    this.log('\nNext steps:');
    this.log('1. Test alerts: /pine-alert --action test');
    this.log('2. List configured alerts: /pine-alert --action list');
    this.log(
      '3. Enable/disable specific alerts: /pine-alert --action enable --alertName ALERT_NAME',
    );

    return 0;
  }

  async testAlerts(options) {
    this.log('Testing alert system...');

    const config = await this.loadConfig();
    const pineConfig = config.pinescript;

    if (!pineConfig.alerts || Object.keys(pineConfig.alerts).length === 0) {
      this.error('No alerts configured. Run /pine-alert --action setup first.');
      return 1;
    }

    const testMessage =
      options.testMessage || 'Test alert from PineScript integration';

    for (const [fileName, alertConfig] of Object.entries(pineConfig.alerts)) {
      this.log(`\nTesting alerts for: ${fileName}`);

      for (const [alertName, alert] of Object.entries(alertConfig.alerts)) {
        if (!alert.enabled) {
          this.log(`  ${alertName}: DISABLED (skipping)`);
          continue;
        }

        this.log(`  ${alertName}: Sending test...`);

        for (const [channelName, channelConfig] of Object.entries(
          alertConfig.channels,
        )) {
          try {
            await this.sendAlert(channelName, channelConfig, {
              message: testMessage,
              alertName,
              fileName,
              timestamp: new Date().toISOString(),
              type: 'test',
            });
            this.log(`    ✓ ${channelName}: Sent successfully`);
          } catch (error) {
            this.error(`    ✗ ${channelName}: ${error.message}`);
          }
        }
      }
    }

    this.log('\n=== ALERT TEST COMPLETE ===');
    this.log('Check your configured channels for test messages.');

    return 0;
  }

  async listAlerts(options) {
    const config = await this.loadConfig();
    const pineConfig = config.pinescript;

    if (!pineConfig.alerts || Object.keys(pineConfig.alerts).length === 0) {
      this.log('No alerts configured.');
      return 0;
    }

    this.log('=== CONFIGURED ALERTS ===');

    for (const [fileName, alertConfig] of Object.entries(pineConfig.alerts)) {
      this.log(`\nFile: ${fileName}`);
      this.log(`Source: ${alertConfig.file}`);

      if (Object.keys(alertConfig.alerts).length === 0) {
        this.log('  No alerts defined');
        continue;
      }

      this.log('Alerts:');
      for (const [alertName, alert] of Object.entries(alertConfig.alerts)) {
        const status = alert.enabled ? 'ENABLED' : 'DISABLED';
        this.log(`  ${alertName}:`);
        this.log(`    Message: ${alert.message}`);
        this.log(`    Frequency: ${alert.frequency}`);
        this.log(`    Status: ${status}`);

        if (alert.channels && alert.channels.length > 0) {
          this.log(`    Channels: ${alert.channels.join(', ')}`);
        }
      }

      if (Object.keys(alertConfig.channels).length > 0) {
        this.log('\nChannels:');
        for (const [channelName, channelConfig] of Object.entries(
          alertConfig.channels,
        )) {
          this.log(`  ${channelName}:`);
          Object.entries(channelConfig).forEach(([key, value]) => {
            if (
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret')
            ) {
              this.log(`    ${key}: ********`);
            } else {
              this.log(`    ${key}: ${value}`);
            }
          });
        }
      }
    }

    return 0;
  }

  async enableAlert(options) {
    if (!options.alertName) {
      this.error('Alert name required. Use --alertName ALERT_NAME');
      return 1;
    }

    const config = await this.loadConfig();
    const pineConfig = config.pinescript;

    if (!pineConfig.alerts) {
      this.error('No alerts configured.');
      return 1;
    }

    let found = false;
    for (const [fileName, alertConfig] of Object.entries(pineConfig.alerts)) {
      if (alertConfig.alerts[options.alertName]) {
        alertConfig.alerts[options.alertName].enabled = true;
        found = true;
        this.log(`Enabled alert: ${options.alertName} in ${fileName}`);
      }
    }

    if (!found) {
      this.error(`Alert not found: ${options.alertName}`);
      return 1;
    }

    await this.saveConfig(config);
    this.log('Configuration updated.');

    return 0;
  }

  async disableAlert(options) {
    if (!options.alertName) {
      this.error('Alert name required. Use --alertName ALERT_NAME');
      return 1;
    }

    const config = await this.loadConfig();
    const pineConfig = config.pinescript;

    if (!pineConfig.alerts) {
      this.error('No alerts configured.');
      return 1;
    }

    let found = false;
    for (const [fileName, alertConfig] of Object.entries(pineConfig.alerts)) {
      if (alertConfig.alerts[options.alertName]) {
        alertConfig.alerts[options.alertName].enabled = false;
        found = true;
        this.log(`Disabled alert: ${options.alertName} in ${fileName}`);
      }
    }

    if (!found) {
      this.error(`Alert not found: ${options.alertName}`);
      return 1;
    }

    await this.saveConfig(config);
    this.log('Configuration updated.');

    return 0;
  }

  async setupWebhook(options) {
    this.log('Setting up webhook alert channel...');

    const config = await this.loadConfig();
    const pineConfig = config.pinescript;

    if (!pineConfig.alerts) {
      this.error('No alerts configured. Run /pine-alert --action setup first.');
      return 1;
    }

    const webhookUrl =
      options.webhookUrl || (await this.prompt('Enter webhook URL: '));

    if (!webhookUrl.startsWith('http')) {
      this.error('Invalid webhook URL. Must start with http:// or https://');
      return 1;
    }

    for (const [fileName, alertConfig] of Object.entries(pineConfig.alerts)) {
      if (!alertConfig.channels) {
        alertConfig.channels = {};
      }
      alertConfig.channels.webhook = { url: webhookUrl };

      for (const alert of Object.values(alertConfig.alerts)) {
        if (!alert.channels) {
          alert.channels = [];
        }
        if (!alert.channels.includes('webhook')) {
          alert.channels.push('webhook');
        }
      }

      this.log(`Configured webhook for: ${fileName}`);
    }

    await this.saveConfig(config);

    this.log('\n=== WEBHOOK CONFIGURATION COMPLETE ===');
    this.log(`URL: ${webhookUrl}`);
    this.log('Test with: /pine-alert --action test');

    return 0;
  }

  extractAlerts(content) {
    const alerts = [];
    const alertRegex = /alert\s*\(\s*["']([^"']+)["']\s*(?:,\s*([^)]+))?\)/gi;

    let match;
    while ((match = alertRegex.exec(content)) !== null) {
      const message = match[1];
      const frequency = match[2] ? match[2].trim() : 'alert.freq_once_per_bar';

      const name = this.generateAlertName(message);

      alerts.push({
        name,
        message,
        frequency: this.normalizeFrequency(frequency),
      });
    }

    return alerts;
  }

  generateAlertName(message) {
    return message
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50);
  }

  normalizeFrequency(frequency) {
    const freqMap = {
      'alert.freq_once_per_bar': 'once_per_bar',
      'alert.freq_once_per_bar_close': 'once_per_bar_close',
      'alert.freq_once_per_minute': 'once_per_minute',
      'alert.freq_once_per_day': 'once_per_day',
      'alert.freq_once_per_week': 'once_per_week',
    };

    return freqMap[frequency] || frequency;
  }

  async sendAlert(channel, config, data) {
    switch (channel) {
      case 'webhook':
        return await this.sendWebhookAlert(config, data);
      case 'email':
        return await this.sendEmailAlert(config, data);
      case 'discord':
        return await this.sendDiscordAlert(config, data);
      case 'telegram':
        return await this.sendTelegramAlert(config, data);
      case 'slack':
        return await this.sendSlackAlert(config, data);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  async sendWebhookAlert(config, data) {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        source: 'pinescript',
        version: '1.0',
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  }

  async sendEmailAlert(config, data) {
    const { address } = config;

    const subject = `PineScript Alert: ${data.alertName}`;
    const body = `
Alert: ${data.alertName}
Message: ${data.message}
File: ${data.fileName}
Time: ${data.timestamp}
Type: ${data.type}
    `.trim();

    try {
      await execPromise(`echo "${body}" | mail -s "${subject}" ${address}`);
    } catch (error) {
      throw new Error(`Email failed: ${error.message}`);
    }
  }

  async sendDiscordAlert(config, data) {
    const { webhookUrl } = config;

    const embed = {
      title: `PineScript Alert: ${data.alertName}`,
      description: data.message,
      color: data.type === 'test' ? 0x00ff00 : 0xff0000,
      fields: [
        {
          name: 'File',
          value: data.fileName,
          inline: true,
        },
        {
          name: 'Time',
          value: new Date(data.timestamp).toLocaleString(),
          inline: true,
        },
        {
          name: 'Type',
          value: data.type,
          inline: true,
        },
      ],
      timestamp: data.timestamp,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }
  }

  async sendTelegramAlert(config, data) {
    const { botToken, chatId } = config;

    const message = `
*PineScript Alert*
*Alert:* ${data.alertName}
*Message:* ${data.message}
*File:* ${data.fileName}
*Time:* ${new Date(data.timestamp).toLocaleString()}
*Type:* ${data.type}
    `.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API failed: ${response.status}`);
    }
  }

  async sendSlackAlert(config, data) {
    const { webhookUrl } = config;

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `PineScript Alert: ${data.alertName}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:* ${data.message}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*File:*\n${data.fileName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${new Date(data.timestamp).toLocaleString()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${data.type}`,
          },
        ],
      },
    ];

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }
  }

  async configureDiscord() {
    const webhookUrl = await this.prompt('Enter Discord webhook URL: ');
    return { webhookUrl };
  }

  async configureTelegram() {
    const botToken = await this.prompt('Enter Telegram bot token: ');
    const chatId = await this.prompt('Enter chat ID: ');
    return { botToken, chatId };
  }

  async configureSlack() {
    const webhookUrl = await this.prompt('Enter Slack webhook URL: ');
    return { webhookUrl };
  }

  async prompt(question) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question(question, (answer) => {
        readline.close();
        resolve(answer);
      });
    });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

if (require.main === module) {
  const command = new PineAlertCommand();
  command.execute(process.argv.slice(2));
}

module.exports = PineAlertCommand;
