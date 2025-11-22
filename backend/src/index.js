require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Request logging
const { requestLoggerMiddleware } = require('./utils/logger');
app.use(requestLoggerMiddleware);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',  // Local development
      'http://127.0.0.1:3000', // Alternative localhost
      'http://localhost:3001' // Alternative localhost
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve React static files
app.use(express.static('public'));

// Error handling
const { errorHandler } = require('./utils/errorHandler');

///Enhan cd d err handling middlrwahemiddleware
app.use(errorHandler);

// Routes
app.use('/health', require('./routes/health'));
// app.use('/chat', require('./routes/chat')); // Disabled until agents are ready

// SPA catch-all handler
app.use((req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
// API 404 handler (only for /api routes)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
