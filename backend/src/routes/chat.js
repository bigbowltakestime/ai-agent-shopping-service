const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { validateMessage } = require('../utils/validation');

const router = express.Router();

// Mock response structure for testing
const generateMockResponse = () => ({
  type: 'response',
  message: 'This is a mock response for testing purposes. The AI agent integration will come next.',
  timestamp: new Date().toISOString(),
  products: [
    {
      id: 'mock-product-1',
      name: 'Sample Product',
      category: 'cosmetics',
      price: 29.99,
      rating: 4.5,
      review_count: 150,
      brand: 'MockBrand'
    }
  ],
  box1_display: 'single_line',
  box2_display: 'grid'
});

// POST /chat - Handle chat messages
router.post('/', validateMessage, asyncHandler(async (req, res) => {
  const { message } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : 'http://localhost:3000');

  try {
    // Send initial thinking message
    res.write(`data: ${JSON.stringify({
      event: 'process',
      data: {
        type: 'process',
        message: 'Thinking...',
        timestamp: new Date().toISOString()
      }
    })}\n\n`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send searching message
    res.write(`data: ${JSON.stringify({
      event: 'process',
      data: {
        type: 'process',
        message: 'Searching for products...',
        timestamp: new Date().toISOString()
      }
    })}\n\n`);

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send final response
    const response = generateMockResponse();
    res.write(`data: ${JSON.stringify({
      event: 'response',
      data: response
    })}\n\n`);

    // Close the stream
    setTimeout(() => {
      res.end();
    }, 100);

  } catch (error) {
    // Send error through SSE
    res.write(`data: ${JSON.stringify({
      event: 'error',
      data: {
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    })}\n\n`);
    res.end();
  }
}));

module.exports = router;
