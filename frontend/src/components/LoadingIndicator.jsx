import React from 'react';

const LoadingIndicator = ({ message }) => {
  return (
    <div className="flex flex-col items-center space-y-2 p-4">
      <div className="text-gray-600 text-sm">{message}</div>
      <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
