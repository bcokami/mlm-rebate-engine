"use client";

import { useState } from "react";
import { FaFilter, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface ProductFiltersProps {
  filters: {
    search: string;
    tags: string[];
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    minPv?: number;
    maxPv?: number;
    minInventory?: number;
    maxInventory?: number;
    sortBy?: string;
    sortOrder?: string;
  };
  onFilterChange: (filters: any) => void;
  availableTags: string[];
}

export default function ProductFilters({
  filters,
  onFilterChange,
  availableTags,
}: ProductFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ search: e.target.value });
  };
  
  const handleTagChange = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    
    onFilterChange({ tags: newTags });
  };
  
  const handleStatusChange = (isActive: boolean | undefined) => {
    onFilterChange({ isActive });
  };
  
  const handleNumberFilterChange = (field: string, value: string) => {
    const numValue = value === "" ? undefined : Number(value);
    onFilterChange({ [field]: numValue });
  };
  
  const handleResetFilters = () => {
    onFilterChange({
      search: "",
      tags: [],
      isActive: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minPv: undefined,
      maxPv: undefined,
      minInventory: undefined,
      maxInventory: undefined,
    });
  };
  
  return (
    <div>
      <div className="mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Products
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            placeholder="Search by name, SKU, or description"
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleStatusChange(filters.isActive === true ? undefined : true)}
            className={`px-3 py-2 rounded-md text-sm ${
              filters.isActive === true
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange(filters.isActive === false ? undefined : false)}
            className={`px-3 py-2 rounded-md text-sm ${
              filters.isActive === false
                ? "bg-red-100 text-red-800 border border-red-300"
                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            Inactive
          </button>
          {filters.isActive !== undefined && (
            <button
              type="button"
              onClick={() => handleStatusChange(undefined)}
              className="px-3 py-2 rounded-md text-sm bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            >
              All
            </button>
          )}
        </div>
      </div>
      
      {availableTags.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.tags.includes(tag)
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <FaFilter className="mr-1" />
          {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
          {showAdvanced ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
        </button>
      </div>
      
      {showAdvanced && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleNumberFilterChange("minPrice", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleNumberFilterChange("maxPrice", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PV Range
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPv || ""}
                  onChange={(e) => handleNumberFilterChange("minPv", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPv || ""}
                  onChange={(e) => handleNumberFilterChange("maxPv", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Range
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minInventory || ""}
                  onChange={(e) => handleNumberFilterChange("minInventory", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxInventory || ""}
                  onChange={(e) => handleNumberFilterChange("maxInventory", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {(filters.search || 
        filters.tags.length > 0 || 
        filters.isActive !== undefined || 
        filters.minPrice !== undefined || 
        filters.maxPrice !== undefined || 
        filters.minPv !== undefined || 
        filters.maxPv !== undefined || 
        filters.minInventory !== undefined || 
        filters.maxInventory !== undefined) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 flex items-center"
          >
            <FaTimes className="mr-1" />
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
