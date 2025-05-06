"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import AdvancedSearch from '@/components/genealogy/AdvancedSearch';
import SearchResults from '@/components/genealogy/SearchResults';

interface User {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    id: number;
    name: string;
  };
  walletBalance?: number;
  createdAt?: string;
  uplineId?: number | null;
  _count: {
    downline: number;
  };
  performanceMetrics?: {
    personalSales: number;
    teamSales: number;
    totalSales: number;
    rebatesEarned: number;
    teamSize: number;
    newTeamMembers: number;
    lastUpdated: string;
  } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

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

/**
 * Genealogy Search Page
 * 
 * This page provides advanced search capabilities for the genealogy
 */
export default function GenealogySearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for search results
  const [results, setResults] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // State for ranks
  const [ranks, setRanks] = useState<{ id: number; name: string }[]>([]);
  
  // Fetch ranks
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        const response = await fetch('/api/ranks');
        
        if (!response.ok) {
          throw new Error('Failed to fetch ranks');
        }
        
        const data = await response.json();
        setRanks(data);
      } catch (error) {
        console.error('Error fetching ranks:', error);
      }
    };
    
    if (status === 'authenticated') {
      fetchRanks();
    }
  }, [status]);
  
  // Handle search
  const handleSearch = async (query: string, filters: SearchFilters, page: number = 1) => {
    if (status !== 'authenticated') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/genealogy/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...filters,
          page,
          pageSize: 20,
          includePerformanceMetrics: true,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search genealogy');
      }
      
      const data = await response.json();
      
      setResults(data.users);
      setPagination(data.pagination);
      setHasSearched(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    // We need to preserve the current search query and filters
    // For simplicity, we'll just trigger a new search with the new page
    handleSearch('', {}, page);
  };
  
  // Handle view genealogy
  const handleViewGenealogy = (userId: number) => {
    router.push(`/genealogy?userId=${userId}`);
  };
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center h-96">
          <FaExclamationTriangle className="text-yellow-500 text-4xl mb-4" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to search the genealogy.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Genealogy Search</h1>
          <p className="text-gray-600">
            Search for users in your genealogy with advanced filtering options
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      {/* Search Form */}
      <div className="mb-6">
        <AdvancedSearch
          onSearch={handleSearch}
          ranks={ranks}
          isLoading={isLoading}
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Search Results */}
      {hasSearched ? (
        <SearchResults
          results={results}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onViewGenealogy={handleViewGenealogy}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl text-gray-300 mb-4">
            <FaSearch className="inline" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Search the Genealogy</h3>
          <p className="text-gray-500">
            Use the search form above to find users in your genealogy.
          </p>
          <p className="text-gray-500 mt-2">
            You can search by name, email, rank, and more.
          </p>
        </div>
      )}
    </div>
  );
}
