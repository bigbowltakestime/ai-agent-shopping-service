// Simple Request Logger Middleware
const fs = require('fs');
const path = require('path');

// Create directory for logs if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Simple logger class
class Logger {
  constructor(context = '') {
    this.context = context;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    const contextStr = this.context ? ` [${this.context}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}${metaStr}`;
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output for development
    if (process.env.NODE_ENV !== 'production') {
      console.log(formattedMessage);
    }

  }

  info(message, meta = {}) { this.log('info', message, meta); }
  warn(message, meta = {}) { this.log('warn', message, meta); }
  error(message, meta = {}) { this.log('error', message, meta); }
  debug(message, meta = {}) { this.log('debug', message, meta); }
}

// Express middleware for request logging
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const logger = new Logger('HTTP');

  // Log request
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' && req.body ? req.body : undefined
  });

  // Intercept response to log completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logger.info(`Response: ${res.statusCode}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: data ? data.length : 0
    });
    originalSend.call(this, data);
  };

  next();
};

// Create logger instance
const createLogger = (context = '') => new Logger(context);

// Default logger instance
const logger = createLogger();

module.exports = {
  logger,
  requestLoggerMiddleware,
  createLogger
};
