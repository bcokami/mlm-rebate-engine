"use client";

import { useState } from 'react';
import { FaSearch, FaTimes, FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface SearchFilters {
  name?: string;
  email?: string;
  rankId?: number;
  minDownline?: number;
  maxDownline?: number;
  joinedAfter?: string;
  joinedBefore?: string;
  minWalletBalance?: number;
  maxWalletBalance?: number;
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  ranks: { id: number; name: string }[];
  isLoading?: boolean;
}

/**
 * Advanced Search Component
 * 
 * Provides advanced search and filtering capabilities for the genealogy visualization
 */
export default function AdvancedSearch({ onSearch, ranks, isLoading = false }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, filters);
  };
  
  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    if (value === '' || value === undefined) {
      // Remove the filter if empty
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      // Add or update the filter
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };
  
  // Count active filters
  const activeFilterCount = Object.keys(filters).length;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Basic Search */}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <FaSearch />
            </div>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {/* Advanced Filters Toggle */}
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <FaFilter className="mr-1" />
          Advanced Filters
          {showAdvancedFilters ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>
        
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All Filters
          </button>
        )}
      </div>
      
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-md mt-2 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name Contains
              </label>
              <input
                type="text"
                value={filters.name || ''}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter name..."
              />
            </div>
            
            {/* Email Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Contains
              </label>
              <input
                type="text"
                value={filters.email || ''}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email..."
              />
            </div>
            
            {/* Rank Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rank
              </label>
              <select
                value={filters.rankId || ''}
                onChange={(e) => handleFilterChange('rankId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Rank</option>
                {ranks.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Downline Count Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Downline
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minDownline || ''}
                  onChange={(e) => handleFilterChange('minDownline', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Downline
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxDownline || ''}
                  onChange={(e) => handleFilterChange('maxDownline', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Max"
                />
              </div>
            </div>
            
            {/* Wallet Balance Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minWalletBalance || ''}
                  onChange={(e) => handleFilterChange('minWalletBalance', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min ₱"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxWalletBalance || ''}
                  onChange={(e) => handleFilterChange('maxWalletBalance', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Max ₱"
                />
              </div>
            </div>
            
            {/* Date Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined After
                </label>
                <input
                  type="date"
                  value={filters.joinedAfter || ''}
                  onChange={(e) => handleFilterChange('joinedAfter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined Before
                </label>
                <input
                  type="date"
                  value={filters.joinedBefore || ''}
                  onChange={(e) => handleFilterChange('joinedBefore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.name && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    Name: {filters.name}
                    <button
                      onClick={() => handleFilterChange('name', undefined)}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                )}
                
                {filters.email && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    Email: {filters.email}
                    <button
                      onClick={() => handleFilterChange('email', undefined)}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                )}
                
                {filters.rankId !== undefined && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    Rank: {ranks.find(r => r.id === filters.rankId)?.name || filters.rankId}
                    <button
                      onClick={() => handleFilterChange('rankId', undefined)}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                )}
                
                {(filters.minDownline !== undefined || filters.maxDownline !== undefined) && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    Downline: {filters.minDownline || '0'} - {filters.maxDownline || '∞'}
                    <button
                      onClick={() => {
                        handleFilterChange('minDownline', undefined);
                        handleFilterChange('maxDownline', undefined);
                      }}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                )}
                
                {(filters.minWalletBalance !== undefined || filters.maxWalletBalance !== undefined) && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    Balance: ₱{filters.minWalletBalance || '0'} - ₱{filters.maxWalletBalance || '∞'}
                    <button
                      onClick={() => {
                        handleFilterChange('minWalletBalance', undefined);
                        handleFilterChange('maxWalletBalance', undefined);
                      }}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                )}
                
                {(filters.joinedAfter !== undefined || filters.joinedBefore !== undefined) && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    Joined: {filters.joinedAfter || 'Any'} to {filters.joinedBefore || 'Now'}
                    <button
                      onClick={() => {
                        handleFilterChange('joinedAfter', undefined);
                        handleFilterChange('joinedBefore', undefined);
                      }}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Apply Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
