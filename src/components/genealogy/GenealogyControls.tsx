"use client";

import { useState } from 'react';
import { FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaRedo } from 'react-icons/fa';

interface GenealogyControlsProps {
  onRefresh: () => void;
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  isLoading: boolean;
}

/**
 * Genealogy Controls Component
 * 
 * Provides controls for the genealogy visualization
 */
export default function GenealogyControls({
  onRefresh,
  onSearch,
  onToggleFilters,
  showFilters,
  isLoading,
}: GenealogyControlsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  return (
    <div className="bg-white p-3 border-b flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleFilters}
          className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          <FaFilter className="mr-1" />
          Filters
          {showFilters ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
        </button>
        
        <button
          onClick={onRefresh}
          className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          disabled={isLoading}
        >
          <FaRedo className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 md:w-64"
          />
          <div className="absolute left-3 top-2 text-gray-400">
            <FaSearch />
          </div>
        </div>
        <button
          type="submit"
          className="ml-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Search
        </button>
      </form>
    </div>
  );
}
