import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem.jsx';
import ProductDisplay from './ProductDisplay.jsx';
import SuggestedMessage from './SuggestedMessage.jsx';
import LoadingIndicator from './LoadingIndicator.jsx';

const Messages = ({ messages, isLoading, processMessage, onSubmit }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, processMessage]);

  // Filter to show only the last loading message
  const visibleMessages = messages.filter(msg => {
    if (msg.type !== 'loading') return true;
    const loadingMessages = messages.filter(m => m.type === 'loading');
    return msg === loadingMessages[loadingMessages.length - 1];
  });

  // Find last suggested message
  const suggestedMessages = messages.filter(m => m.type === 'suggested');
  let lastSuggested = suggestedMessages[suggestedMessages.length - 1];

  // Hide suggested if user has sent message after the last suggested
  if (lastSuggested) {
    const lastSuggestedIndex = messages.findIndex(m => m === lastSuggested);
    const lastUserIndex = messages.findLastIndex(m => m.type === 'chatMessage' && m.role === 'user');
    if (lastUserIndex > lastSuggestedIndex) {
      lastSuggested = null;
    }
  }

  return (
    <div className="space-y-3">
      {visibleMessages.map(msg => {
        if (msg.type === 'chatMessage') {
          return <MessageItem key={msg.id} message={msg} />;
        } else if (msg.type === 'product') {
          return <ProductDisplay key={msg.id} products={msg.products} type={msg.displayType} />;
        } else if (msg.type === 'loading') {
          return <div key={msg.id} className="text-center animate-pulse text-gray-500 text-sm">{msg.content}</div>;
        }
        return null;
      })}
      {isLoading && processMessage && <LoadingIndicator message={processMessage} />}
      {lastSuggested && (
        <SuggestedMessage
          suggestions={lastSuggested.suggestions}
          onSubmit={onSubmit}
        />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Messages;
