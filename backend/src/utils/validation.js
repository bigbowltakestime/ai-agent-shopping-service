// Input validation middleware
const sanitizeMessage = (message) => {
  if (typeof message !== 'string') {
    throw new Error('Message must be a string');
  }

  // Remove script tags and other potentially harmful content
  let sanitized = message
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=['"\s]*[^'"\s>]*/gi, '') // Remove event handlers
    .trim();

  // Validate length (max 2000 characters for chat messages)
  if (sanitized.length > 2000) {
    throw new Error('Message too long (max 2000 characters)');
  }

  if (sanitized.length < 1) {
    throw new Error('Message cannot be empty');
  }

  return sanitized;
};

// Rate limiting (in-memory implementation)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

const checkRateLimit = (ip) => {
  const now = Date.now();
  const userRequests = rateLimitStore.get(ip) || [];

  // Remove old requests outside the window
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);

  // Cleanup old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, requests] of rateLimitStore.entries()) {
      const valid = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
      if (valid.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, valid);
      }
    }
  }
};

const validateMessage = (req, res, next) => {
  try {
    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    checkRateLimit(clientIP);

    // Validation and sanitization
    if (!req.body.message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    req.body.message = sanitizeMessage(req.body.message);
    next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  validateMessage,
  sanitizeMessage
};
