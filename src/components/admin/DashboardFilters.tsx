import React, { useState } from 'react';
import { 
  FaFilter, 
  FaCalendarAlt, 
  FaChevronDown, 
  FaChevronUp,
  FaSearch,
  FaTimes
} from 'react-icons/fa';

interface DashboardFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
  ranks?: { id: number; name: string }[];
}

interface FilterState {
  dateRange: string;
  rankId: string;
  sponsorId: string;
  searchTerm: string;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  onFilterChange,
  ranks = []
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'last30days',
    rankId: '',
    sponsorId: '',
    searchTerm: ''
  });
  
  // Default ranks if none provided
  const defaultRanks = [
    { id: 1, name: 'Starter' },
    { id: 2, name: 'Bronze' },
    { id: 3, name: 'Silver' },
    { id: 4, name: 'Gold' },
    { id: 5, name: 'Platinum' },
    { id: 6, name: 'Diamond' }
  ];
  
  const rankOptions = ranks.length > 0 ? ranks : defaultRanks;
  
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  const clearFilters = () => {
    const resetFilters = {
      dateRange: 'last30days',
      rankId: '',
      sponsorId: '',
      searchTerm: ''
    };
    
    setFilters(resetFilters);
    
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  };
  
  const getDateRangeLabel = () => {
    switch (filters.dateRange) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'last7days':
        return 'Last 7 Days';
      case 'last30days':
        return 'Last 30 Days';
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'thisYear':
        return 'This Year';
      case 'lastYear':
        return 'Last Year';
      case 'custom':
        return 'Custom Range';
      default:
        return 'Last 30 Days';
    }
  };
  
  const hasActiveFilters = filters.rankId || filters.sponsorId || filters.searchTerm || filters.dateRange !== 'last30days';
  
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or ID"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          {filters.searchTerm && (
            <button
              onClick={() => handleFilterChange('searchTerm', '')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <div className="relative">
            <button 
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaCalendarAlt className="mr-2" />
              {getDateRangeLabel()}
              <FaChevronDown className="ml-2" />
            </button>
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md ${
              hasActiveFilters 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaFilter className="mr-2" />
            Filters
            {showFilters ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {(filters.rankId ? 1 : 0) + (filters.sponsorId ? 1 : 0) + (filters.dateRange !== 'last30days' ? 1 : 0)}
              </span>
            )}
          </button>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="lastYear">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            {/* Rank Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rank
              </label>
              <select
                value={filters.rankId}
                onChange={(e) => handleFilterChange('rankId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Ranks</option>
                {rankOptions.map(rank => (
                  <option key={rank.id} value={rank.id.toString()}>
                    {rank.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sponsor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sponsor ID
              </label>
              <input
                type="text"
                placeholder="Enter sponsor ID"
                value={filters.sponsorId}
                onChange={(e) => handleFilterChange('sponsorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Custom Date Range (conditionally shown) */}
          {filters.dateRange === 'custom' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          
          {/* Filter Actions */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 mr-2"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;
