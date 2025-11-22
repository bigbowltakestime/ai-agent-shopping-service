const MessageItem = ({ message }) => {
  const isUser = message.role === 'user';

  const contentAlignmentClasses = isUser ? 'items-end' : 'items-start';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative px-3 py-2 rounded-lg w-full ${isUser ? 'bg-blue-500 text-white speech-bubble-user' : 'bg-gray-200 text-gray-800 speech-bubble-agent'}`}>
        <div className={`flex flex-col ${contentAlignmentClasses}`}>
          <p className="text-sm">{message.content}</p>
          <p className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
            {message.timestamp.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
