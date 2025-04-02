import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SymbolSearchProps {
  onSymbolSelect: (symbol: string) => void;
  currentSymbol?: string;
}

export const SymbolSearch: React.FC<SymbolSearchProps> = ({ onSymbolSelect, currentSymbol }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // Common stock symbols for quick selection
  const popularSymbols = [
    'SPY', 'QQQ', 'IWM', 'DIA',
    'AAPL', 'MSFT', 'GOOGL', 'AMZN',
    'META', 'TSLA', 'NVDA', 'AMD'
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSymbolSelect(searchQuery.toUpperCase().trim());
      setSearchQuery('');
      setIsVisible(false);
    }
  };
  
  const handleSymbolClick = (symbol: string) => {
    onSymbolSelect(symbol);
    setSearchQuery('');
    setIsVisible(false);
  };
  
  return (
    <div className="relative">
      <div className="flex items-center">
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
        >
          <Search size={16} className="mr-1" />
          {currentSymbol ? "Change Symbol" : "Search Symbol"}
        </button>
      </div>
      
      {isVisible && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-10">
          <form onSubmit={handleSubmit} className="p-3 border-b border-gray-700">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter symbol..."
                className="flex-grow px-3 py-2 bg-gray-900 text-white rounded-l-md focus:outline-none"
                autoFocus
              />
              <button 
                type="submit" 
                className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
              >
                Go
              </button>
            </div>
          </form>
          
          <div className="p-3">
            <div className="text-xs text-gray-400 mb-2">Popular Symbols</div>
            <div className="grid grid-cols-4 gap-2">
              {popularSymbols.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => handleSymbolClick(symbol)}
                  className={`p-1 text-xs rounded ${symbol === currentSymbol ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolSearch;
