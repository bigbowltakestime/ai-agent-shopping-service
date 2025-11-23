import React from 'react';
import Header from './components/Header.jsx';
import ChatArea from './components/ChatArea.jsx';
import ChatInput from './components/ChatInput.jsx';
import { useChat } from './hooks/useChat';

const App = () => {
  const { messages, handleChatSubmit, handleHeaderSubmit, isLoading, processMessage } = useChat();

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="max-w-screen-sm mx-auto p-4">
        <Header onSubmit={handleHeaderSubmit} />
        <ChatArea messages={messages} onSubmit={handleChatSubmit} isLoading={isLoading} processMessage={processMessage} />
        <ChatInput onSubmit={handleChatSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;
