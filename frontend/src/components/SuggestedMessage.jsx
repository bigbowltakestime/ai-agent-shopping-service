import React from 'react';

const SuggestedMessage = ({ suggestions, onSubmit }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="w-full max-w-screen-sm mx-auto rounded px-4 py-4 bg-gray-50 border-t shadow">
      <h2 className="text-md font-semibold mb-2">자동 추천 질문</h2>
      <div className="flex flex-col items-center gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="w-[90%] py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 transition-colors text-md text-sm shadow-sm"
            onClick={() => onSubmit(suggestion.message)}
          >
            {suggestion.displayMessage}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedMessage;
