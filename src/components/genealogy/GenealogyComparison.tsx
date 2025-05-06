"use client";

import { useState, useEffect } from 'react';
import { 
  FaExchangeAlt, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaUserPlus,
  FaUserMinus,
  FaShoppingCart,
  FaWallet,
  FaChartLine,
  FaCalendarAlt,
  FaFilter
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  rankName: string;
  downlineCount: number;
  walletBalance?: number;
  createdAt?: string;
  performanceMetrics?: {
    personalSales: number;
    teamSales: number;
    totalSales: number;
    rebatesEarned: number;
    teamSize: number;
    newTeamMembers: number;
  } | null;
}

interface ComparisonData {
  user1: User;
  user2: User;
  differences: {
    downlineCount: number;
    downlineCountPercentage: number;
    personalSales: number;
    personalSalesPercentage: number;
    teamSales: number;
    teamSalesPercentage: number;
    rebatesEarned: number;
    rebatesEarnedPercentage: number;
    newMembers: number;
    newMembersPercentage: number;
    uniqueMembers1: number;
    uniqueMembers2: number;
    commonMembers: number;
  };
  timeRange: string;
}

interface GenealogyComparisonProps {
  userId1: number;
  userId2: number;
  timeRange?: 'last30days' | 'last90days' | 'last6months' | 'last12months';
}

/**
 * Genealogy Comparison Component
 * 
 * Compares two genealogy trees and shows the differences
 */
export default function GenealogyComparison({
  userId1,
  userId2,
  timeRange = 'last30days',
}: GenealogyComparisonProps) {
  // State for comparison data
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
  
  // Router for navigation
  const router = useRouter();
  
  // Fetch comparison data
  useEffect(() => {
    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams({
          userId1: userId1.toString(),
          userId2: userId2.toString(),
          timeRange: selectedTimeRange,
        });
        
        const response = await fetch(`/api/genealogy/compare?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch comparison data');
        }
        
        const data = await response.json();
        setComparisonData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComparisonData();
  }, [userId1, userId2, selectedTimeRange]);
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };
  
  // Get comparison icon
  const getComparisonIcon = (value: number) => {
    if (value > 0) {
      return <FaArrowUp className="text-green-500" />;
    } else if (value < 0) {
      return <FaArrowDown className="text-red-500" />;
    } else {
      return <FaEquals className="text-gray-500" />;
    }
  };
  
  // Handle view user
  const handleViewUser = (userId: number) => {
    router.push(`/users/${userId}`);
  };
  
  // Handle view genealogy
  const handleViewGenealogy = (userId: number) => {
    router.push(`/genealogy?userId=${userId}`);
  };
  
  // Loading state
  if (loading && !comparisonData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading comparison data...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-red-800 font-medium flex items-center">
            <FaExclamationTriangle className="mr-2" />
            Error loading comparison data
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!comparisonData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <FaExchangeAlt className="text-gray-400 text-4xl mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Comparison Data</h3>
          <p className="text-gray-500">
            Unable to load comparison data for the selected users.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FaExchangeAlt className="mr-2 text-blue-500" />
          Genealogy Comparison
        </h2>
        
        {/* Time Range Filter */}
        <div className="flex items-center">
          <FaCalendarAlt className="text-gray-500 mr-2" />
          <select
            value={selectedTimeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="last6months">Last 6 Months</option>
            <option value="last12months">Last 12 Months</option>
          </select>
        </div>
      </div>
      
      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* User 1 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-lg">{comparisonData.user1.name}</h3>
              <div className="text-sm text-gray-500">{comparisonData.user1.email}</div>
              <div className="text-xs text-gray-400">ID: {comparisonData.user1.id}</div>
            </div>
            <div className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {comparisonData.user1.rankName}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white p-2 rounded">
              <div className="text-xs text-gray-500">Downline</div>
              <div className="font-medium">{formatNumber(comparisonData.user1.downlineCount)}</div>
            </div>
            {comparisonData.user1.performanceMetrics && (
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Personal Sales</div>
                <div className="font-medium">{formatCurrency(comparisonData.user1.performanceMetrics.personalSales)}</div>
              </div>
            )}
            {comparisonData.user1.performanceMetrics && (
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Team Sales</div>
                <div className="font-medium">{formatCurrency(comparisonData.user1.performanceMetrics.teamSales)}</div>
              </div>
            )}
            {comparisonData.user1.performanceMetrics && (
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Rebates Earned</div>
                <div className="font-medium">{formatCurrency(comparisonData.user1.performanceMetrics.rebatesEarned)}</div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleViewUser(comparisonData.user1.id)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Profile
            </button>
            <button
              onClick={() => handleViewGenealogy(comparisonData.user1.id)}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Genealogy
            </button>
          </div>
        </div>
        
        {/* User 2 */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-lg">{comparisonData.user2.name}</h3>
              <div className="text-sm text-gray-500">{comparisonData.user2.email}</div>
              <div className="text-xs text-gray-400">ID: {comparisonData.user2.id}</div>
            </div>
            <div className="text-sm px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
              {comparisonData.user2.rankName}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white p-2 rounded">
              <div className="text-xs text-gray-500">Downline</div>
              <div className="font-medium">{formatNumber(comparisonData.user2.downlineCount)}</div>
            </div>
            {comparisonData.user2.performanceMetrics && (
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Personal Sales</div>
                <div className="font-medium">{formatCurrency(comparisonData.user2.performanceMetrics.personalSales)}</div>
              </div>
            )}
            {comparisonData.user2.performanceMetrics && (
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Team Sales</div>
                <div className="font-medium">{formatCurrency(comparisonData.user2.performanceMetrics.teamSales)}</div>
              </div>
            )}
            {comparisonData.user2.performanceMetrics && (
              <div className="bg-white p-2 rounded">
                <div className="text-xs text-gray-500">Rebates Earned</div>
                <div className="font-medium">{formatCurrency(comparisonData.user2.performanceMetrics.rebatesEarned)}</div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleViewUser(comparisonData.user2.id)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Profile
            </button>
            <button
              onClick={() => handleViewGenealogy(comparisonData.user2.id)}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Genealogy
            </button>
          </div>
        </div>
      </div>
      
      {/* Comparison Metrics */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 flex items-center">
          <FaChartLine className="text-blue-500 mr-2" />
          Performance Comparison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {comparisonData.user1.name}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {comparisonData.user2.name}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Downline Count */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaUsers className="text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Downline Count</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(comparisonData.user1.downlineCount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(comparisonData.user2.downlineCount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getComparisonIcon(comparisonData.differences.downlineCount)}
                    <span className={`ml-2 text-sm ${
                      comparisonData.differences.downlineCount > 0 
                        ? 'text-green-600' 
                        : comparisonData.differences.downlineCount < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                    }`}>
                      {formatNumber(Math.abs(comparisonData.differences.downlineCount))} ({formatPercentage(comparisonData.differences.downlineCountPercentage)})
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Personal Sales */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaShoppingCart className="text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Personal Sales</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(comparisonData.user1.performanceMetrics?.personalSales || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(comparisonData.user2.performanceMetrics?.personalSales || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getComparisonIcon(comparisonData.differences.personalSales)}
                    <span className={`ml-2 text-sm ${
                      comparisonData.differences.personalSales > 0 
                        ? 'text-green-600' 
                        : comparisonData.differences.personalSales < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                    }`}>
                      {formatCurrency(Math.abs(comparisonData.differences.personalSales))} ({formatPercentage(comparisonData.differences.personalSalesPercentage)})
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Team Sales */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaShoppingCart className="text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Team Sales</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(comparisonData.user1.performanceMetrics?.teamSales || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(comparisonData.user2.performanceMetrics?.teamSales || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getComparisonIcon(comparisonData.differences.teamSales)}
                    <span className={`ml-2 text-sm ${
                      comparisonData.differences.teamSales > 0 
                        ? 'text-green-600' 
                        : comparisonData.differences.teamSales < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                    }`}>
                      {formatCurrency(Math.abs(comparisonData.differences.teamSales))} ({formatPercentage(comparisonData.differences.teamSalesPercentage)})
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Rebates Earned */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaWallet className="text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Rebates Earned</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(comparisonData.user1.performanceMetrics?.rebatesEarned || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(comparisonData.user2.performanceMetrics?.rebatesEarned || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getComparisonIcon(comparisonData.differences.rebatesEarned)}
                    <span className={`ml-2 text-sm ${
                      comparisonData.differences.rebatesEarned > 0 
                        ? 'text-green-600' 
                        : comparisonData.differences.rebatesEarned < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                    }`}>
                      {formatCurrency(Math.abs(comparisonData.differences.rebatesEarned))} ({formatPercentage(comparisonData.differences.rebatesEarnedPercentage)})
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* New Members */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaUserPlus className="text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">New Members</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(comparisonData.user1.performanceMetrics?.newTeamMembers || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(comparisonData.user2.performanceMetrics?.newTeamMembers || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getComparisonIcon(comparisonData.differences.newMembers)}
                    <span className={`ml-2 text-sm ${
                      comparisonData.differences.newMembers > 0 
                        ? 'text-green-600' 
                        : comparisonData.differences.newMembers < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                    }`}>
                      {formatNumber(Math.abs(comparisonData.differences.newMembers))} ({formatPercentage(comparisonData.differences.newMembersPercentage)})
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Network Overlap */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3 flex items-center">
          <FaUsers className="text-blue-500 mr-2" />
          Network Overlap
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-md text-center">
            <div className="text-sm text-gray-600 mb-1">Unique to {comparisonData.user1.name}</div>
            <div className="text-xl font-semibold text-blue-700">
              {formatNumber(comparisonData.differences.uniqueMembers1)}
            </div>
            <div className="text-xs text-gray-500">members</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-md text-center">
            <div className="text-sm text-gray-600 mb-1">Common Members</div>
            <div className="text-xl font-semibold text-purple-700">
              {formatNumber(comparisonData.differences.commonMembers)}
            </div>
            <div className="text-xs text-gray-500">members</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-md text-center">
            <div className="text-sm text-gray-600 mb-1">Unique to {comparisonData.user2.name}</div>
            <div className="text-xl font-semibold text-green-700">
              {formatNumber(comparisonData.differences.uniqueMembers2)}
            </div>
            <div className="text-xs text-gray-500">members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
