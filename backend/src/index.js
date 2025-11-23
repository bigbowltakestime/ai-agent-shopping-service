require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Request logging
const { requestLoggerMiddleware } = require('./utils/logger');
app.use(requestLoggerMiddleware);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://market.zynkimland.com',
  ],
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve React static files
app.use(express.static(path.join(__dirname, '../public')));

// Error handling
const { errorHandler } = require('./utils/errorHandler');

///Enhan cd d err handling middlrwahemiddleware
app.use(errorHandler);

// Socket.IO and chat handling
const io = new Server(server, { cors: corsOptions });
require('./routes/chat')(io);

// Routes
app.use('/health', require('./routes/health'));

// SPA catch-all handler
app.use((req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, '../public/index.html'));
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');
  // Handle socket events here or pass to routes
})

module.exports = app;
