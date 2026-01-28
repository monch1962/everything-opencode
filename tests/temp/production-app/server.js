const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Production Application',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Production app listening on port ${port}`);
});