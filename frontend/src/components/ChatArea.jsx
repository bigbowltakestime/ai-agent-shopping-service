import React from 'react';
import Messages from './Messages.jsx';

const ChatArea = ({ messages, isLoading, processMessage, onSubmit }) => {
  return (
    <div className="flex-1 overflow-hidden pt-4" style={{maxWidth: '480px'}}>
      <Messages messages={messages} isLoading={isLoading} processMessage={processMessage} onSubmit={onSubmit} />
    </div>
  );
};

export default ChatArea;
