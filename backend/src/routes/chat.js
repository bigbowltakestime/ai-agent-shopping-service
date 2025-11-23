const express = require('express');
const mainAgent = require('../agents/mainAgent');
const { asyncHandler } = require('../utils/errorHandler');
const { validateMessage } = require('../utils/validation');

const router = express.Router();

// Store active streams for message handling
const activeStreams = new Map();

// GET /chat/stream - Establish SSE connection
router.get('/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Generate a unique stream ID
  const streamId = Date.now() + Math.random();
  res.streamId = streamId;

  // Add this stream to active streams
  activeStreams.set(streamId, res);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (res.destroyed) {
      clearInterval(heartbeat);
      return;
    }
    res.write(': heartbeat\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    activeStreams.delete(streamId);
  });

  // Keep connection alive
  res.write(': Connected\n\n');
});

// POST /chat - Handle chat messages with agent workflow
router.post('/', validateMessage, asyncHandler(async (req, res) => {
  const { message } = req.body;

  try {
    // Find an active stream to send responses to
    // In a real app, you'd associate streams with user sessions
    // For now, send to the most recently opened stream
    const lastStreamId = Array.from(activeStreams.keys()).pop();
    if (!lastStreamId || !activeStreams.has(lastStreamId)) {
      return res.status(400).json({ error: 'No active SSE stream found' });
    }

    const streamRes = activeStreams.get(lastStreamId);

    // Send initial process messages for workflow stages
    const sendProcessMessage = (message) => {
      if (streamRes.destroyed) return;
      streamRes.write(`data: ${JSON.stringify({
        event: 'process',
        data: {
          type: 'process',
          message,
          timestamp: new Date().toISOString()
        }
      })}\n\n`);
    };

    const sendMessage = (message) => {
      if (streamRes.destroyed) return;
      streamRes.write(message);
    };

    // Emit thinking message
    sendProcessMessage('Thinking...');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Emit query analysis
    sendProcessMessage('Analyzing query...');
    await new Promise(resolve => setTimeout(resolve, 300));

    // const agentResponse = await mainAgent.invoke({ userQuery: message });

    // Close the stream after sending all data
    setTimeout(() => {
      if (!streamRes.destroyed) {
        streamRes.write('event: end\ndata: Stream ended\n\n');
        streamRes.end();
        activeStreams.delete(lastStreamId);
      }
    }, 100);

    res.json({ success: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error('[Chat] Error processing message:', error);

    // Try to send error through SSE if possible
    const lastStreamId = Array.from(activeStreams.keys()).pop();
    const streamRes = lastStreamId ? activeStreams.get(lastStreamId) : null;

    if (streamRes && !streamRes.destroyed) {
      streamRes.write(`data: ${JSON.stringify({
        event: 'error',
        data: {
          type: 'error',
          message: 'An error occurred while processing your request. Please try again.',
          timestamp: new Date().toISOString()
        }
      })}\n\n`);
      streamRes.end();
      activeStreams.delete(lastStreamId);
    }

    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
}));

module.exports = router;
