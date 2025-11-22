import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { menuItems } from '../constants/menuData';

const Header = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div>
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-[#EA3F49] text-lg mr-2 shrink-0 font-['Black_Han_Sans']">랭킹쇼핑</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-gray-500 rounded px-2 py-1 text-sm text-gray-400"
            placeholder="랭킹쇼핑에서 검색하기"
          />
          <button type="submit" className="ml-2 bg-[#EA3F49] text-white px-3 py-1 rounded flex items-center">
            <FaSearch size={16} />
          </button>
        </form>
      </div>
      <div className="flex justify-around items-center w-full min-h-32 bg-white shadow rounded-lg p-4">
        {menuItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-1">
            <div
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => alert('Not implemented')}
            >
              {item.icon}
            </div>
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Header;
