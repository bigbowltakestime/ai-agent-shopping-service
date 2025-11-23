import { io } from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.messageCallback = null;
    this.errorCallback = null;
    this.processCallback = null;
  }

  connect(onMessage, onError, onProcess) {
    const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'; // Backend Socket.IO server

    this.messageCallback = onMessage;
    this.errorCallback = onError;
    this.processCallback = onProcess;

    // Close existing connection if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling']
    });

    // Handle response messages
    this.socket.on('response', (data) => {
      console.log('Received response:', JSON.stringify(data));
      if (this.messageCallback) {
        this.messageCallback(data.data);
      }
    });

    // // Handle loading messages
    // this.socket.on('loading', (data) => {
    //   if (this.processCallback) {
    //     this.processCallback(data.content);
    //   }
    // });

    // Handle errors
    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      if (this.errorCallback) {
        this.errorCallback(error);
      }
    });

    // Handle connection
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chatMessage', { message });
    } else {
      console.warn('Socket.IO not connected, cannot send message');
      if (this.errorCallback) {
        this.errorCallback(new Error('Socket not connected'));
      }
    }
  }
}

export default new ChatService();
