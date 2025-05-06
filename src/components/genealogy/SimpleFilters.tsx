"use client";

import { useState, useEffect } from 'react';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

interface FilterOptions {
  rankId?: number;
  sortBy?: 'name' | 'createdAt' | 'rank' | 'downlineCount';
  sortDirection?: 'asc' | 'desc';
}

interface SimpleFiltersProps {
  onApplyFilters: (filters: FilterOptions) => void;
  className?: string;
}

/**
 * Simple Filters Component
 * 
 * Provides basic filtering options for the genealogy visualization
 */
export default function SimpleFilters({ onApplyFilters, className = '' }: SimpleFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  
  const [ranks, setRanks] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);
  
  // Fetch ranks
  useEffect(() => {
    const fetchRanks = async () => {
      setIsLoadingRanks(true);
      
      try {
        const response = await fetch('/api/ranks');
        
        if (!response.ok) {
          throw new Error('Failed to fetch ranks');
        }
        
        const data = await response.json();
        setRanks(data);
      } catch (error) {
        console.error('Error fetching ranks:', error);
      } finally {
        setIsLoadingRanks(false);
      }
    };
    
    fetchRanks();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle sort direction toggle
  const handleToggleSortDirection = () => {
    const newDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc';
    handleFilterChange('sortDirection', newDirection);
  };
  
  // Handle apply filters
  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
    onApplyFilters({
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
  };
  
  return (
    <div className={`bg-gray-50 p-4 border-b ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Filter & Sort Options</h3>
        <button
          onClick={handleResetFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Reset Filters
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Rank Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Rank
          </label>
          <select
            value={filters.rankId || ''}
            onChange={(e) => handleFilterChange('rankId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Ranks</option>
            {isLoadingRanks ? (
              <option disabled>Loading ranks...</option>
            ) : (
              ranks.map((rank) => (
                <option key={rank.id} value={rank.id}>
                  {rank.name}
                </option>
              ))
            )}
          </select>
        </div>
        
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="createdAt">Join Date</option>
            <option value="rank">Rank</option>
            <option value="downlineCount">Downline Count</option>
          </select>
        </div>
        
        {/* Sort Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort Direction
          </label>
          <button
            onClick={handleToggleSortDirection}
            className="w-full flex items-center justify-center border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
          >
            {filters.sortDirection === 'asc' ? (
              <>
                <FaSortAmountUp className="mr-2" /> Ascending
              </>
            ) : (
              <>
                <FaSortAmountDown className="mr-2" /> Descending
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
