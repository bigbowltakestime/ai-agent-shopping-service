const MainAgent = require('../agents/mainAgent');
const { validateMessage } = require('../utils/validation');
const DBInterface = require('../services/dbInterface');
const { v4: uuidv4 } = require('uuid');

function makeLoadingMessage(msg) {
  return {
    id: uuidv4().toString(),
    type: 'loading',
    content: msg
  };
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to chat:', socket.id);
    // sendFirstMessage(socket);

    socket.on('chatMessage', async (data) => {
      try {
        const { message } = data;

        console.log('Received chat message:', message);

        // Validate message (you might want to adapt validateMessage for socket)
        if (!message || typeof message !== 'string' || message.length > 1000) {
          socket.emit('error', { message: 'Invalid message' });
          return;
        }

        // Create writer function that tools can use to send progress messages
        const writer = (message) => {
          console.log('Sending loading message:', message);
          socket.emit('response', {
            type: 'response',
            data: message
          });
        };

        writer(makeLoadingMessage('쇼핑 에이전트 생각중...'));
        await new Promise(resolve => setTimeout(resolve, 200));

        writer(makeLoadingMessage('쇼핑 에이전트 분석중...'));
        await new Promise(resolve => setTimeout(resolve, 300));

        const mainAgent = new MainAgent();
        await mainAgent.initialize();

        // Execute agent with writer config
        const userQuery = {
          query: message
        };

        const agentResponse = await mainAgent.execute(userQuery, { writer });

        // Send final response
        socket.emit('response', agentResponse);

      } catch (error) {
        console.error('[Chat] Error processing message:', error);
        socket.emit('error', {
          message: 'An error occurred while processing your request. Please try again.',
          details: error.message
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from chat:', socket.id);
    });
  });
};
