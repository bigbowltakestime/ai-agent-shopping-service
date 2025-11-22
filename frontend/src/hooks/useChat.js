import { useState, useEffect } from 'react';

const mockProducts = [
  { id: 1, name: 'Premium Shampoo for Oily Hair', price: 2999, rating: 4.5, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#' },
  { id: 2, name: 'Gentle Conditioner', price: 1999, rating: 4.2, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#' },
  { id: 3, name: 'Natural Hair Mask', price: 3999, rating: 4.8, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#' },
  { id: 4, name: 'Scalp Treatment Serum', price: 2499, rating: 4.3, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#' },
  { id: 5, name: 'Hair Growth Supplement', price: 3499, rating: 4.6, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#' },
  { id: 6, name: 'Anti-Dandruff Shampoo', price: 2299, rating: 4.4, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#' },
];

const mockReviewProduct = [
  {
    id: 1,
    name: 'Premium Shampoo for Oily Hair',
    price: 2999,
    image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg',
    reviews: [
      { text: 'This shampoo really controls oil without drying my scalp!', sentiment: 'Positive', features: ['oil control', 'not drying'] },
      { text: 'Great scent and lathers well. Highly recommend.', sentiment: 'Positive', features: ['scent', 'lathering'] }
    ]
  }
];

const initialMessages = [
  {
    id: 3,
    type: 'product',
    products: mockProducts,
    displayType: 'Box2',
    timestamp: new Date()
  },
  {
    id: 4,
    type: 'product',
    products: mockReviewProduct,
    displayType: 'review',
    timestamp: new Date()
  },
  {
    id: 1,
    type: 'chatmessage',
    role: 'agent',
    content: '안녕하세요 무엇을 도와드릴까요??',
    timestamp: new Date()
  },
  {
    id: 5,
    type: 'chatmessage',
    role: 'user',
    content: '스킨케어 제품 추천해줘',
    timestamp: new Date()
  },
  {
    id: 2,
    type: 'product',
    products: mockProducts.slice(0, 1),
    displayType: 'Box1',
    timestamp: new Date()
  },
  {
    id: 7,
    type: 'suggested',
    suggestions: [
      { displayMessage: '스킨케어 추천', message: '스킨케어 제품 추천해줘' },
      { displayMessage: '메이크업 정보', message: '메이크업 제품 정보 알려줘' },
      { displayMessage: '헤어 케어 팁', message: '헤어 케어 방법을 알려줘' }
    ],
    timestamp: new Date()
  },
  {
    id: 6,
    type: 'loading',
    content: 'AI 어시스턴트가 시작되고 있어요...'
  },
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

  // Save to localStorage when messages change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const handleChatSubmit = (message) => {
    const userMessage = {
      id: Date.now() + 'user',
      type: 'chatmessage',
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setProcessMessage('Thinking...');

    // Mock agent response - simulate SSE stream
    setTimeout(() => {
      setIsLoading(false);
      setProcessMessage('');

      const agentMessage = {
        id: Date.now() + 'agent',
        type: 'chatmessage',
        role: 'agent',
        content: `I received your message: "${message}". Let me search for products related to that.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);

    }, 2000);
  };

  const handleHeaderSubmit = (query) => {
    const userMessage = {
      id: Date.now() + 'user',
      type: 'chatmessage',
      role: 'user',
      content: `Search for: ${query}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setProcessMessage('Searching...');

    // Mock response
    setTimeout(() => {
      setIsLoading(false);
      setProcessMessage('');

      const agentMessage = {
        id: Date.now() + 'agent',
        type: 'chatmessage',
        role: 'agent',
        content: `Here are search results for "${query}". Product recommendations will appear here.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);

    }, 2000);
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
