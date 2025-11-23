import { useState, useEffect } from 'react';
import chatService from '../services/chatService';

const initialMessages = [
  {
    id: 1,
    type: 'chatMessage',
    role: 'agent',
    content: '안녕하세요 무엇을 도와드릴까요??',
    timestamp: new Date()
  }
];

export const useChat = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load messages from localStorage:', error);
        return initialMessages;
      }
    }
    return initialMessages;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [processMessage, setProcessMessage] = useState('');

  // Connect to chat service on mount
  useEffect(() => {
    const handleMessage = (data) => {
      const newMessage = {
        id: Date.now(),
        ...data,
        timestamp: new Date(data.timestamp || Date.now())
      };
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(false);
      setProcessMessage('');
    };

    const handleProcess = (message) => {
      setProcessMessage(message);
    };

    const handleError = (error) => {
      console.error('Chat error:', error);
      setIsLoading(false);
      setProcessMessage('');
    };

    chatService.connect(handleMessage, handleError, handleProcess);

    return () => {
      chatService.disconnect();
    };
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const handleChatSubmit = (message) => {
    const userMessage = {
      id: Date.now() + 'user',
      type: 'chatMessage',
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setProcessMessage('Thinking...');

    chatService.sendMessage(message);
  };

  const handleHeaderSubmit = (query) => {
    // Treat header search as chat message
    handleChatSubmit(query);
  };

  return {
    messages,
    setMessages,
    isLoading,
    processMessage,
    handleChatSubmit,
    handleHeaderSubmit
  };
};
