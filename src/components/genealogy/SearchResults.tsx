"use client";

import { useState } from 'react';
import { FaSpinner, FaChevronRight, FaChevronDown, FaWallet, FaUsers, FaShoppingCart, FaUserPlus } from 'react-icons/fa';
import Link from 'next/link';

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

interface SearchResultsProps {
  results: User[];
  pagination: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onViewGenealogy: (userId: number) => void;
}

/**
 * Search Results Component
 * 
 * Displays the results of a genealogy search with pagination
 */
export default function SearchResults({
  results,
  pagination,
  isLoading,
  onPageChange,
  onViewGenealogy,
}: SearchResultsProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  
  // Toggle user expansion
  const toggleUserExpansion = (userId: number) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading search results...</span>
      </div>
    );
  }
  
  // No results state
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-500 mb-4">No users found matching your search criteria.</div>
        <div className="text-sm text-gray-400">Try adjusting your search filters or query.</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
        <h3 className="font-medium">
          Search Results ({pagination.totalItems} users found)
        </h3>
        <div className="text-sm text-gray-500">
          Page {pagination.page} of {pagination.totalPages}
        </div>
      </div>
      
      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Downline
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wallet Balance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((user) => (
              <React.Fragment key={user.id}>
                <tr className={expandedUsers.has(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleUserExpansion(user.id)}
                        className="mr-3 text-gray-400 hover:text-gray-600"
                      >
                        {expandedUsers.has(user.id) ? <FaChevronDown /> : <FaChevronRight />}
                      </button>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {user.rank.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user._count.downline}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.walletBalance !== undefined ? formatCurrency(user.walletBalance) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewGenealogy(user.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Genealogy
                    </button>
                    <Link
                      href={`/users/${user.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Profile
                    </Link>
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {expandedUsers.has(user.id) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-blue-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* User Details */}
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <h4 className="text-sm font-medium mb-2">User Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">ID:</span> {user.id}
                            </div>
                            <div>
                              <span className="text-gray-500">Rank:</span> {user.rank.name}
                            </div>
                            <div>
                              <span className="text-gray-500">Upline ID:</span> {user.uplineId || 'None'}
                            </div>
                            <div>
                              <span className="text-gray-500">Downline Count:</span> {user._count.downline}
                            </div>
                            <div>
                              <span className="text-gray-500">Joined:</span> {formatDate(user.createdAt)}
                            </div>
                            <div>
                              <span className="text-gray-500">Wallet Balance:</span> {user.walletBalance !== undefined ? formatCurrency(user.walletBalance) : 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Performance Metrics */}
                        {user.performanceMetrics ? (
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center">
                                <FaShoppingCart className="text-green-500 mr-2" />
                                <div>
                                  <div className="text-xs text-gray-500">Personal Sales</div>
                                  <div className="font-medium">{formatCurrency(user.performanceMetrics.personalSales)}</div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <FaUsers className="text-blue-500 mr-2" />
                                <div>
                                  <div className="text-xs text-gray-500">Team Sales</div>
                                  <div className="font-medium">{formatCurrency(user.performanceMetrics.teamSales)}</div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <FaWallet className="text-yellow-500 mr-2" />
                                <div>
                                  <div className="text-xs text-gray-500">Rebates Earned</div>
                                  <div className="font-medium">{formatCurrency(user.performanceMetrics.rebatesEarned)}</div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <FaUserPlus className="text-purple-500 mr-2" />
                                <div>
                                  <div className="text-xs text-gray-500">New Members (30d)</div>
                                  <div className="font-medium">{user.performanceMetrics.newTeamMembers}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-3 rounded-md shadow-sm flex items-center justify-center text-gray-500 text-sm">
                            No performance metrics available
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPreviousPage}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNumber;
                
                if (pagination.totalPages <= 5) {
                  // Show all pages if there are 5 or fewer
                  pageNumber = i + 1;
                } else if (pagination.page <= 3) {
                  // Show first 5 pages
                  pageNumber = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  // Show last 5 pages
                  pageNumber = pagination.totalPages - 4 + i;
                } else {
                  // Show current page and 2 pages on each side
                  pageNumber = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagination.page === pageNumber
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
