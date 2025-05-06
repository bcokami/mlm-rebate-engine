"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  FaSpinner, 
  FaExclamationTriangle, 
  FaChevronRight, 
  FaChevronDown, 
  FaUser, 
  FaUsers, 
  FaWallet, 
  FaShoppingCart,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaInfoCircle
} from 'react-icons/fa';

// Interface for user data
interface User {
  id: number;
  name: string;
  email: string;
  rankName: string;
  level: number;
  downlineCount: number;
  walletBalance?: number;
  createdAt?: string;
  children?: User[];
  performanceMetrics?: {
    personalSales: number;
    teamSales: number;
    totalSales: number;
    rebatesEarned: number;
    teamSize: number;
    newTeamMembers: number;
    activityScore: number;
  } | null;
}

interface MobileGenealogyViewProps {
  userId: number;
  maxLevel?: number;
  initialPageSize?: number;
}

/**
 * Mobile Genealogy View Component
 * 
 * A mobile-friendly genealogy visualization
 */
export default function MobileGenealogyView({
  userId,
  maxLevel = 3,
  initialPageSize = 10,
}: MobileGenealogyViewProps) {
  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for genealogy data
  const [rootUser, setRootUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [navigationStack, setNavigationStack] = useState<User[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // State for user details
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Fetch initial user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams({
          userId: userId.toString(),
          maxLevel: '1', // Only fetch the first level initially
          pageSize: initialPageSize.toString(),
          includePerformanceMetrics: 'true',
        });
        
        const response = await fetch(`/api/genealogy?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch genealogy data');
        }
        
        const data = await response.json();
        
        // Create user object
        const user: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          rankName: data.rank.name,
          level: 0,
          downlineCount: data._count.downline,
          createdAt: data.createdAt,
          walletBalance: data.walletBalance,
          performanceMetrics: data.performanceMetrics,
          children: data.children?.map((child: any) => ({
            id: child.id,
            name: child.name,
            email: child.email,
            rankName: child.rank.name,
            level: 1,
            downlineCount: child._count.downline,
            createdAt: child.createdAt,
            walletBalance: child.walletBalance,
            performanceMetrics: child.performanceMetrics,
          })),
        };
        
        setRootUser(user);
        setCurrentUser(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, initialPageSize]);
  
  // Fetch children for a user
  const fetchUserChildren = useCallback(async (user: User) => {
    if (user.children) return user.children;
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        userId: user.id.toString(),
        maxLevel: '1', // Only fetch direct children
        pageSize: initialPageSize.toString(),
        includePerformanceMetrics: 'true',
      });
      
      const response = await fetch(`/api/genealogy?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user children');
      }
      
      const data = await response.json();
      
      // Map children
      const children = data.children?.map((child: any) => ({
        id: child.id,
        name: child.name,
        email: child.email,
        rankName: child.rank.name,
        level: user.level + 1,
        downlineCount: child._count.downline,
        createdAt: child.createdAt,
        walletBalance: child.walletBalance,
        performanceMetrics: child.performanceMetrics,
      }));
      
      return children || [];
    } catch (err) {
      console.error('Error fetching user children:', err);
      return [];
    }
  }, [initialPageSize]);
  
  // Handle node expansion
  const handleExpandNode = useCallback(async (user: User) => {
    // Check if the node is already expanded
    if (expandedNodes.has(user.id)) {
      // Collapse the node
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    } else {
      // Expand the node
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(user.id);
        return newSet;
      });
      
      // Fetch children if not already loaded
      if (!user.children) {
        setLoading(true);
        
        try {
          const children = await fetchUserChildren(user);
          
          // Update the user with children
          if (currentUser && currentUser.id === user.id) {
            setCurrentUser({
              ...currentUser,
              children,
            });
          }
          
          // Update the root user if needed
          if (rootUser && rootUser.id === user.id) {
            setRootUser({
              ...rootUser,
              children,
            });
          }
          
          // Update the navigation stack if needed
          setNavigationStack(prev => 
            prev.map(stackUser => 
              stackUser.id === user.id 
                ? { ...stackUser, children } 
                : stackUser
            )
          );
        } catch (err) {
          console.error('Error expanding node:', err);
        } finally {
          setLoading(false);
        }
      }
    }
  }, [expandedNodes, currentUser, rootUser, fetchUserChildren]);
  
  // Handle navigation to a child
  const handleNavigateToChild = useCallback(async (child: User) => {
    setLoading(true);
    
    try {
      // Fetch children if not already loaded
      let childWithChildren = { ...child };
      
      if (!child.children) {
        const children = await fetchUserChildren(child);
        childWithChildren = { ...child, children };
      }
      
      // Add current user to navigation stack
      if (currentUser) {
        setNavigationStack(prev => [...prev, currentUser]);
      }
      
      // Set the child as the current user
      setCurrentUser(childWithChildren);
    } catch (err) {
      console.error('Error navigating to child:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchUserChildren]);
  
  // Handle navigation back
  const handleNavigateBack = useCallback(() => {
    if (navigationStack.length === 0) return;
    
    // Get the last user from the stack
    const lastUser = navigationStack[navigationStack.length - 1];
    
    // Remove the last user from the stack
    setNavigationStack(prev => prev.slice(0, -1));
    
    // Set the last user as the current user
    setCurrentUser(lastUser);
  }, [navigationStack]);
  
  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/genealogy/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          page: 1,
          pageSize: 10,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search genealogy');
      }
      
      const data = await response.json();
      
      setSearchResults(data.users);
    } catch (err) {
      console.error('Error searching genealogy:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);
  
  // Handle select user from search
  const handleSelectFromSearch = useCallback(async (user: User) => {
    setLoading(true);
    
    try {
      // Fetch the user data
      const params = new URLSearchParams({
        userId: user.id.toString(),
        maxLevel: '1',
        pageSize: initialPageSize.toString(),
        includePerformanceMetrics: 'true',
      });
      
      const response = await fetch(`/api/genealogy?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      
      // Create user object
      const fullUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        rankName: data.rank.name,
        level: 0, // Reset level to 0 as this becomes the current view
        downlineCount: data._count.downline,
        createdAt: data.createdAt,
        walletBalance: data.walletBalance,
        performanceMetrics: data.performanceMetrics,
        children: data.children?.map((child: any) => ({
          id: child.id,
          name: child.name,
          email: child.email,
          rankName: child.rank.name,
          level: 1,
          downlineCount: child._count.downline,
          createdAt: child.createdAt,
          walletBalance: child.walletBalance,
          performanceMetrics: child.performanceMetrics,
        })),
      };
      
      // Reset navigation stack
      setNavigationStack([]);
      
      // Set the user as the current user
      setCurrentUser(fullUser);
      
      // Close search
      setShowSearch(false);
    } catch (err) {
      console.error('Error selecting user from search:', err);
    } finally {
      setLoading(false);
    }
  }, [initialPageSize]);
  
  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Render loading state
  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading genealogy data...</span>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-red-800 font-medium flex items-center">
          <FaExclamationTriangle className="mr-2" />
          Error loading genealogy data
        </h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  // Render user details
  if (selectedUser) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center text-blue-600"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h3 className="font-semibold">User Details</h3>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* User avatar and name */}
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{selectedUser.name}</h2>
              <div className="text-sm text-gray-500">{selectedUser.email}</div>
              <div className="mt-1 text-xs px-2 py-0.5 inline-block rounded-full bg-blue-100 text-blue-800">
                {selectedUser.rankName}
              </div>
            </div>
          </div>
          
          {/* User information */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">User ID</div>
              <div>{selectedUser.id}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">Downline Members</div>
              <div>{selectedUser.downlineCount}</div>
            </div>
            {selectedUser.walletBalance !== undefined && (
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Wallet Balance</div>
                <div>{formatCurrency(selectedUser.walletBalance)}</div>
              </div>
            )}
            {selectedUser.createdAt && (
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Member Since</div>
                <div>{formatDate(selectedUser.createdAt)}</div>
              </div>
            )}
            {selectedUser.level > 0 && (
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Network Level</div>
                <div>Level {selectedUser.level}</div>
              </div>
            )}
          </div>
          
          {/* Performance metrics */}
          {selectedUser.performanceMetrics && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center mb-1">
                    <FaShoppingCart className="text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Personal Sales</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(selectedUser.performanceMetrics.personalSales)}
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex items-center mb-1">
                    <FaUsers className="text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Team Sales</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(selectedUser.performanceMetrics.teamSales)}
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="flex items-center mb-1">
                    <FaWallet className="text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Rebates Earned</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(selectedUser.performanceMetrics.rebatesEarned)}
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-md">
                  <div className="flex items-center mb-1">
                    <FaUsers className="text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">New Members (30d)</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {selectedUser.performanceMetrics.newTeamMembers}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  handleNavigateToChild(selectedUser);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                View Downline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render search results
  if (showSearch) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
          <button
            onClick={() => setShowSearch(false)}
            className="flex items-center text-blue-600"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h3 className="font-semibold">Search Genealogy</h3>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Search form */}
        <div className="p-4 border-b">
          <div className="flex">
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaSearch />
              )}
            </button>
          </div>
        </div>
        
        {/* Search results */}
        <div className="divide-y">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {isSearching ? (
                <div className="flex items-center justify-center">
                  <FaSpinner className="animate-spin text-blue-500 mr-2" />
                  <span>Searching...</span>
                </div>
              ) : searchQuery ? (
                <div>
                  <p>No results found.</p>
                  <p className="text-sm mt-1">Try a different search term.</p>
                </div>
              ) : (
                <div>
                  <FaSearch className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p>Enter a search term to find users.</p>
                </div>
              )}
            </div>
          ) : (
            searchResults.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">ID: {user.id}</div>
                  </div>
                  <button
                    onClick={() => handleSelectFromSearch(user)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  
  // Render main view
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
        {navigationStack.length > 0 ? (
          <button
            onClick={handleNavigateBack}
            className="flex items-center text-blue-600"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        ) : (
          <div></div>
        )}
        <h3 className="font-semibold">Mobile Genealogy</h3>
        <button
          onClick={() => setShowSearch(true)}
          className="text-blue-600"
        >
          <FaSearch />
        </button>
      </div>
      
      {/* Current user */}
      {currentUser && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <FaUser className="text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-sm text-gray-500">{currentUser.email}</div>
              <div className="mt-1 text-xs px-2 py-0.5 inline-block rounded-full bg-blue-100 text-blue-800">
                {currentUser.rankName}
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(currentUser)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Details
            </button>
          </div>
          
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-white p-2 rounded">
              <div className="font-medium">{currentUser.downlineCount}</div>
              <div className="text-xs text-gray-500">Downline</div>
            </div>
            {currentUser.performanceMetrics && (
              <>
                <div className="bg-white p-2 rounded">
                  <div className="font-medium">{formatCurrency(currentUser.performanceMetrics.personalSales)}</div>
                  <div className="text-xs text-gray-500">Personal</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="font-medium">{formatCurrency(currentUser.performanceMetrics.teamSales)}</div>
                  <div className="text-xs text-gray-500">Team</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Children */}
      <div className="divide-y">
        {loading && (
          <div className="p-4 flex items-center justify-center">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span>Loading...</span>
          </div>
        )}
        
        {!loading && currentUser?.children?.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <p>No downline members found.</p>
          </div>
        )}
        
        {!loading && currentUser?.children?.map((child) => (
          <div key={child.id} className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                {child.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium">{child.name}</div>
                <div className="text-sm text-gray-500">{child.email}</div>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <span className="mr-2">ID: {child.id}</span>
                  <span>Downline: {child.downlineCount}</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setSelectedUser(child)}
                  className="p-1 text-blue-600"
                >
                  <FaInfoCircle />
                </button>
                {child.downlineCount > 0 && (
                  <button
                    onClick={() => handleNavigateToChild(child)}
                    className="p-1 text-green-600"
                  >
                    <FaUsers />
                  </button>
                )}
              </div>
            </div>
            
            {/* Expandable section */}
            {child.downlineCount > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => handleExpandNode(child)}
                  className="flex items-center text-sm text-blue-600"
                >
                  {expandedNodes.has(child.id) ? (
                    <>
                      <FaChevronDown className="mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <FaChevronRight className="mr-1" />
                      Show Details
                    </>
                  )}
                </button>
                
                {expandedNodes.has(child.id) && (
                  <div className="mt-2 pl-4 border-l-2 border-gray-200">
                    {child.performanceMetrics && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Personal Sales</div>
                          <div className="font-medium">{formatCurrency(child.performanceMetrics.personalSales)}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Team Sales</div>
                          <div className="font-medium">{formatCurrency(child.performanceMetrics.teamSales)}</div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleNavigateToChild(child)}
                      className="w-full mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm flex items-center justify-center"
                    >
                      <FaUsers className="mr-2" />
                      View Downline ({child.downlineCount})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
