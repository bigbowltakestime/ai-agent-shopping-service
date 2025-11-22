import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const ChatInput = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3" style={{left: '50%', transform: 'translateX(-50%)', maxWidth: '480px'}}>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 mr-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 flex items-center justify-center"
          disabled={isLoading || !input.trim()}
        >
          <FaPaperPlane size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
