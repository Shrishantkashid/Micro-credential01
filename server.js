const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load configuration based on environment
let config;
try {
  if (process.env.NODE_ENV === 'production') {
    // In production, use environment variables
    config = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      PORT: process.env.PORT || 3000,
      NODE_ENV: process.env.NODE_ENV || 'production'
    };
  } else {
    // In development, use config file if it exists
    try {
      config = require('./config/env.json');
    } catch (err) {
      console.log('No local config file found, using environment variables');
      config = {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
        PORT: process.env.PORT || 3000,
        NODE_ENV: process.env.NODE_ENV || 'development'
      };
    }
  }
} catch (error) {
  console.error('Configuration loading error:', error.message);
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const gmailRoutes = require('./routes/gmail');

const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);

// Temporary backward compatibility route for OAuth callback
app.use('/auth', authRoutes);

// Favicon handler to prevent 404 spam in development
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve static files from React build
if (config.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'micro-credential-aggregator'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  if (config.NODE_ENV === 'production') {
    // Serve React app in production
    res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
  } else {
    // API info in development
    res.json({
      message: 'Micro-Credential Aggregator API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth/login',
        callback: '/api/auth/callback',
        sync: '/api/gmail/sync',
        health: '/health'
      },
      frontend: 'http://localhost:3001'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  if (config.NODE_ENV === 'production' && !req.originalUrl.startsWith('/api')) {
    // Serve React app for all non-API routes in production
    res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
  } else {
    res.status(404).json({
      error: {
        message: 'Route not found',
        status: 404,
        path: req.originalUrl
      }
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Micro-Credential Aggregator running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`📧 Gmail sync: http://localhost:${PORT}/api/gmail/sync`);
});

module.exports = app;