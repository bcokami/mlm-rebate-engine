"use client";

import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface GenealogySearchProps {
  onSearch: (query: string) => void;
}

/**
 * Genealogy Search Component
 * 
 * Provides a search input for finding users in the genealogy tree
 */
export default function GenealogySearch({ onSearch }: GenealogySearchProps) {
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        onSearch(query);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, onSearch]);
  
  // Handle clear search
  const handleClearSearch = () => {
    setQuery('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle focus
  const handleFocus = () => {
    setIsActive(true);
  };
  
  // Handle blur
  const handleBlur = () => {
    setIsActive(false);
  };
  
  return (
    <div className={`relative transition-all duration-200 ${
      isActive ? 'w-64 md:w-80' : 'w-48 md:w-64'
    }`}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full pl-9 pr-8 py-1.5 border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${
          isActive 
            ? 'border-blue-300 focus:ring-blue-500 focus:border-blue-500' 
            : 'border-gray-300 focus:ring-gray-400 focus:border-gray-400'
        }`}
      />
      <div className="absolute left-3 top-2 text-gray-400">
        <FaSearch />
      </div>
      {query && (
        <button
          onClick={handleClearSearch}
          className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
}
