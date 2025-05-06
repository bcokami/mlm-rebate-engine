"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import the enhanced genealogy tree component with dynamic loading to avoid SSR issues
const EnhancedGenealogyTree = dynamic(
  () => import('@/components/genealogy/EnhancedGenealogyTree'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading genealogy visualization...</span>
      </div>
    )
  }
);

/**
 * Optimized Genealogy Page
 * 
 * This page displays the enhanced genealogy tree with improved performance
 */
export default function OptimizedGenealogyPage() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  
  // Get user ID from session
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
  
  // Set user ID when data is loaded
  if (userData && !userId) {
    setUserId(userData.id);
  }
  
  // Loading state
  if (status === 'loading' || isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading user data...</span>
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FaExclamationTriangle className="text-yellow-500 text-4xl mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">Please sign in to view your genealogy tree.</p>
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Sign In
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Genealogy Tree</h1>
          <p className="text-gray-600">
            Visualize your network with improved performance and interactivity
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Standard View
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {userId ? (
          <EnhancedGenealogyTree
            userId={userId}
            maxLevel={6}
            initialPageSize={10}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span>Loading genealogy data...</span>
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About Enhanced Genealogy View</h2>
        <p className="text-blue-700 mb-2">
          This optimized view provides better performance for large networks with:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Faster data loading with efficient caching</li>
          <li>Interactive visualization with zoom and pan</li>
          <li>Lazy loading of deeper levels for better performance</li>
          <li>Detailed statistics and filtering options</li>
          <li>Performance metrics for each member</li>
        </ul>
      </div>
    </div>
  );
}
