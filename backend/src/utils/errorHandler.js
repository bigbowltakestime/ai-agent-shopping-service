// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Enhanced error handler
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.error(`Error: ${err.message}`);
  if (req.body) console.error(`Body: ${JSON.stringify(req.body)}`);

  // Set status code
  let statusCode = 500;
  if (err.message.includes('Rate limit exceeded')) statusCode = 429;
  if (err.message.includes('Message') && err.message.includes('required')) statusCode = 400;
  if (err.message.includes('message must be a string') || err.message.includes('Message too long')) statusCode = 400;
  if (err.message.includes('CORS')) statusCode = 403;
  if (err.message.includes('Route not found')) statusCode = 404;

  res.status(statusCode).json({
    error: err.message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  asyncHandler,
  errorHandler
};
