class ChatService {
  constructor() {
    this.eventSource = null;
    this.messageCallback = null;
    this.errorCallback = null;
    this.processCallback = null;
  }

  connect(onMessage, onError, onProcess) {
    const url = 'http://localhost:3001/chat'; // Backend SSE endpoint

    this.messageCallback = onMessage;
    this.errorCallback = onError;
    this.processCallback = onProcess;

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(url);

    // Handle chat messages
    this.eventSource.addEventListener('chatmessage', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageCallback) {
          this.messageCallback(data);
        }
      } catch (error) {
        console.error('Failed to parse chat message:', error);
      }
    });

    // Handle process messages
    this.eventSource.addEventListener('process', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.processCallback) {
          this.processCallback(data.content);
        }
      } catch (error) {
        console.error('Failed to parse process message:', error);
      }
    });

    // Handle errors
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      if (this.errorCallback) {
        this.errorCallback(error);
      }
    };

    // Handle connection open
    this.eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  sendMessage(message) {
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      // Since SSE is one-way, we'll need to make a POST request to send the message
      fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }).catch(error => console.error('Failed to send message:', error));
    } else {
      console.warn('EventSource not connected, cannot send message');
    }
  }
}

export default new ChatService();
