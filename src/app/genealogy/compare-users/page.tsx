"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { 
  FaSpinner, 
  FaExclamationTriangle, 
  FaArrowLeft, 
  FaExchangeAlt, 
  FaInfoCircle,
  FaSearch,
  FaUserPlus
} from 'react-icons/fa';
import Link from 'next/link';
import GenealogyComparison from '@/components/genealogy/GenealogyComparison';

/**
 * Genealogy User Comparison Page
 * 
 * This page allows comparing two genealogy users
 */
export default function GenealogyCompareUsersPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  
  // Get user IDs from query parameters
  const userId1Param = searchParams.get('userId1');
  const userId2Param = searchParams.get('userId2');
  const timeRangeParam = searchParams.get('timeRange') || 'last30days';
  
  // State for user selection
  const [userId1, setUserId1] = useState<number | undefined>(userId1Param ? parseInt(userId1Param) : undefined);
  const [userId2, setUserId2] = useState<number | undefined>(userId2Param ? parseInt(userId2Param) : undefined);
  const [timeRange, setTimeRange] = useState<'last30days' | 'last90days' | 'last6months' | 'last12months'>(
    timeRangeParam as any || 'last30days'
  );
  
  // State for user search
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');
  const [searchResults1, setSearchResults1] = useState<any[]>([]);
  const [searchResults2, setSearchResults2] = useState<any[]>([]);
  const [isSearching1, setIsSearching1] = useState(false);
  const [isSearching2, setIsSearching2] = useState(false);
  
  // Get current user ID from session
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      
      const response = await fetch('/api/users/me');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      return await response.json();
    },
    enabled: status === 'authenticated',
  });
  
  // Set current user as user 1 if not specified
  if (userData && !userId1 && !userId1Param) {
    setUserId1(userData.id);
  }
  
  // Handle search for user 1
  const handleSearch1 = async () => {
    if (!searchQuery1.trim()) return;
    
    setIsSearching1(true);
    
    try {
      const response = await fetch('/api/genealogy/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery1,
          page: 1,
          pageSize: 5,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      
      setSearchResults1(data.users);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching1(false);
    }
  };
  
  // Handle search for user 2
  const handleSearch2 = async () => {
    if (!searchQuery2.trim()) return;
    
    setIsSearching2(true);
    
    try {
      const response = await fetch('/api/genealogy/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery2,
          page: 1,
          pageSize: 5,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      
      setSearchResults2(data.users);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching2(false);
    }
  };
  
  // Handle select user 1
  const handleSelectUser1 = (user: any) => {
    setUserId1(user.id);
    setSearchResults1([]);
    setSearchQuery1('');
  };
  
  // Handle select user 2
  const handleSelectUser2 = (user: any) => {
    setUserId2(user.id);
    setSearchResults2([]);
    setSearchQuery2('');
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as any);
  };
  
  // Loading state
  if (status === 'loading' || isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span>Loading user data...</span>
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
          <p className="text-gray-600 mb-4">Please sign in to compare genealogy users.</p>
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
          <h1 className="text-2xl font-bold">Genealogy User Comparison</h1>
          <p className="text-gray-600">
            Compare two users to analyze differences and similarities
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      {/* User Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaUserPlus className="mr-2 text-blue-500" />
          Select Users to Compare
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User 1 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User 1
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery1}
                onChange={(e) => setSearchQuery1(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch1}
                disabled={isSearching1}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSearching1 ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSearch />
                )}
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults1.length > 0 && (
              <div className="mt-2 border rounded-md divide-y max-h-60 overflow-y-auto">
                {searchResults1.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectUser1(user)}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">ID: {user.id}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected User */}
            {userId1 && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <div className="font-medium">Selected User 1</div>
                <div className="text-sm">ID: {userId1}</div>
              </div>
            )}
          </div>
          
          {/* User 2 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User 2
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery2}
                onChange={(e) => setSearchQuery2(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch2}
                disabled={isSearching2}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSearching2 ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSearch />
                )}
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults2.length > 0 && (
              <div className="mt-2 border rounded-md divide-y max-h-60 overflow-y-auto">
                {searchResults2.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectUser2(user)}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">ID: {user.id}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected User */}
            {userId2 && (
              <div className="mt-2 p-3 bg-purple-50 rounded-md">
                <div className="font-medium">Selected User 2</div>
                <div className="text-sm">ID: {userId2}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Time Range Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="last6months">Last 6 Months</option>
            <option value="last12months">Last 12 Months</option>
          </select>
        </div>
      </div>
      
      {/* Comparison */}
      {userId1 && userId2 ? (
        <GenealogyComparison
          userId1={userId1}
          userId2={userId2}
          timeRange={timeRange}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <FaExchangeAlt className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">Select Users to Compare</h3>
            <p className="text-gray-500">
              Please select two users to compare their genealogy trees.
            </p>
          </div>
        </div>
      )}
      
      {/* About Comparison */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaInfoCircle className="mr-2 text-blue-500" />
          About Genealogy User Comparison
        </h2>
        
        <div className="space-y-4">
          <p>
            The Genealogy User Comparison tool allows you to compare two users to identify differences and similarities in their networks. This can be useful for analyzing performance, identifying growth opportunities, and understanding network structures.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Key Metrics Compared</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Downline Count - Total number of members in each network</li>
                <li>Personal Sales - Direct sales made by each user</li>
                <li>Team Sales - Sales made by the entire downline</li>
                <li>Rebates Earned - Commissions and bonuses earned</li>
                <li>New Members - Recent additions to each network</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">Network Overlap Analysis</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Unique Members - Members exclusive to each network</li>
                <li>Common Members - Members present in both networks</li>
                <li>Percentage Differences - Relative performance metrics</li>
                <li>Growth Patterns - Differences in network expansion</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">How to Use Comparison Data</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li><strong>Identify Strengths and Weaknesses:</strong> Compare performance metrics to identify areas where each user excels or needs improvement.</li>
              <li><strong>Learn from Success:</strong> Analyze the structure and strategies of the more successful user to apply those lessons to the other.</li>
              <li><strong>Find Collaboration Opportunities:</strong> Identify common members who could serve as bridges between networks for collaborative efforts.</li>
              <li><strong>Set Realistic Goals:</strong> Use the comparison data to set achievable growth targets based on proven performance.</li>
            </ul>
          </div>
          
          <p>
            For more detailed analysis, you can adjust the time range to focus on different periods or export the comparison data for further study.
          </p>
        </div>
      </div>
    </div>
  );
}
