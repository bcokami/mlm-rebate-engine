"use client";

import { useState, useEffect } from 'react';
import { FaFilter, FaSortAmountDown, FaSortAmountUp, FaCalendarAlt } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';

interface Rank {
  id: number;
  name: string;
  level: number;
}

interface FilterOptions {
  rankId?: number;
  joinedAfter?: string;
  joinedBefore?: string;
  sortBy?: 'name' | 'createdAt' | 'rank' | 'downlineCount' | 'sales';
  sortDirection?: 'asc' | 'desc';
  includePerformanceMetrics?: boolean;
}

interface GenealogyFiltersProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

/**
 * Genealogy Filters Component
 * 
 * Provides filtering and sorting options for the genealogy tree
 */
export default function GenealogyFilters({ filters, onChange }: GenealogyFiltersProps) {
  // Fetch ranks for filter dropdown
  const { data: ranks, isLoading: isLoadingRanks } = useQuery<Rank[]>({
    queryKey: ['ranks'],
    queryFn: async () => {
      const response = await fetch('/api/ranks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch ranks');
      }
      
      return await response.json();
    },
  });
  
  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onChange({ ...filters, [key]: value });
  };
  
  // Handle sort direction toggle
  const handleToggleSortDirection = () => {
    const newDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc';
    onChange({ ...filters, sortDirection: newDirection });
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    onChange({
      includePerformanceMetrics: filters.includePerformanceMetrics,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filter & Sort Options</h3>
        <button
          onClick={handleResetFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Reset Filters
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Rank Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaFilter className="inline mr-1" /> Filter by Rank
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
              ranks?.map((rank) => (
                <option key={rank.id} value={rank.id}>
                  {rank.name}
                </option>
              ))
            )}
          </select>
        </div>
        
        {/* Join Date Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" /> Joined After
          </label>
          <input
            type="date"
            value={filters.joinedAfter || ''}
            onChange={(e) => handleFilterChange('joinedAfter', e.target.value || undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" /> Joined Before
          </label>
          <input
            type="date"
            value={filters.joinedBefore || ''}
            onChange={(e) => handleFilterChange('joinedBefore', e.target.value || undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaSortAmountDown className="inline mr-1" /> Sort By
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
            <option value="sales">Sales Volume</option>
          </select>
        </div>
        
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
        
        {/* Performance Metrics */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includePerformanceMetrics"
            checked={filters.includePerformanceMetrics || false}
            onChange={(e) => handleFilterChange('includePerformanceMetrics', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="includePerformanceMetrics" className="ml-2 block text-sm text-gray-700">
            Include Performance Metrics
          </label>
        </div>
      </div>
      
      {/* Active Filters Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
        <div className="flex flex-wrap gap-2">
          {filters.rankId && ranks ? (
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Rank: {ranks.find(r => r.id === filters.rankId)?.name || 'Unknown'}
            </div>
          ) : null}
          
          {filters.joinedAfter && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Joined After: {new Date(filters.joinedAfter).toLocaleDateString()}
            </div>
          )}
          
          {filters.joinedBefore && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Joined Before: {new Date(filters.joinedBefore).toLocaleDateString()}
            </div>
          )}
          
          <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Sort: {filters.sortBy || 'Join Date'} ({filters.sortDirection || 'desc'})
          </div>
          
          {!filters.rankId && !filters.joinedAfter && !filters.joinedBefore && (
            <div className="text-gray-500 text-xs">No filters applied</div>
          )}
        </div>
      </div>
    </div>
  );
}
