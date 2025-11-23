import { useState, useEffect } from 'react';
import chatService from '../services/chatService';

//TODO get it from db
const defaultMessages = [
  {
    type: 'product',
    id: 1,
    products: [
      {
      id: 1,
      name: '11월 올영픽] 바이오더마 하이드라비오 토너 500ml 기획(+화장솜 20매 증정)',
      price: 22500,
      rating: 0,
      image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/career/images/A000000184916.jpg',
      detailLink: 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000184916',
      rank: 1,
    },{
      id: 2,
      name: '[NEW/리뷰이벤트] 믹순 히알레배 포어 버블 세럼 70ml',
      price: 9400,
      rating: 0,
      image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/career/images/A000000238406.jpg',
      detailLink: 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000238406',
      rank: 2,
    },
    {
      id: 3,
      name: '[올영어워즈1등 크림] 에스트라 아토베리어365 크림 80ml 기획 (+하이드로 에센스25ml+세라-히알 앰플7ml)',
      price: 26400,
      rating: 0,
      image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/career/images/A000000222833.jpg',
      detailLink: 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000222833',
      rank: 3,
    },
    {
      id: 4,
      name: '[NO.1 미스트세럼] 달바 퍼스트 스프레이 세럼 100ml 2개 기획,달바,32900,0.0,스킨케어',
      price: 32900,
      rating: 0,
      image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/career/images/A000000232724.jpg',
      detailLink: 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000232724',
      rank: 4,
    },{
      id: 5,
      name: '[속보습세럼/단독기획] 토리든 다이브인 저분자 히알루론산 세럼 50ml 리필기획(+리필팩 50ml)',
      price: 25650,
      rating: 0,
      image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/career/images/A000000189261.jpg',
      detailLink: 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000189261',
      rank: 5,
    },
    {
      id: 6,
      name: '[11월 올영픽/단독기획] 아누아 피디알엔 히알루론산 캡슐 100 세럼 30mL 기획 (+30mL 리필팩)',
      price: 27500,
      rating: 0,
      image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/career/images/A000000222698.jpg',
      detailLink: 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000222698',
      rank: 6,
    },
    ],
    displayType: 'Box2',
    timestamp: new Date().toString()
  },
  {
    type: 'suggested',
    id: 2,
    suggestions: [
      { displayMessage: '다음 랭킹 이어서 보기', message: '스킨케어 랭킹 7위부터 13위 보여줘' },
      { displayMessage: '6번 제품 리뷰 보기', message: '6번 제품 리뷰 알려줘' },
    ],
    timestamp: new Date().toString()
  }
];

export const useChat = () => {
  const [messages, setMessages] = useState(defaultMessages);

  const [isLoading, setIsLoading] = useState(false);
  const [processMessage, setProcessMessage] = useState('');

  // Connect to chat service on mount
  useEffect(() => {
    const handleMessage = (data) => {
      const newMessage = {
        id: Date.now(),
        ...data,
        timestamp: new Date(data?.timestamp ?? Date.now())
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

  // // Save to localStorage when messages change
  // useEffect(() => {
  //   localStorage.setItem('chatMessages', JSON.stringify(messages));
  // }, [messages]);

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
