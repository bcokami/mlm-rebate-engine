"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaChartBar } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from 'reactflow';

// Import the simple statistics component
const SimpleStatistics = dynamic(
  () => import('@/components/genealogy/SimpleStatistics'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-40">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading statistics...</span>
      </div>
    )
  }
);

// Import the enhanced genealogy flow component with dynamic loading to avoid SSR issues
const EnhancedGenealogyFlow = dynamic(
  () => import('@/components/genealogy/EnhancedGenealogyFlow'),
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
 * Enhanced Flow Genealogy Page
 * 
 * This page displays an enhanced implementation of the genealogy tree using React Flow
 */
export default function EnhancedFlowPage() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('vertical');
  
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
          <p className="text-gray-600 mb-4">Please sign in to view your genealogy tree.</p>
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
          <h1 className="text-2xl font-bold">Enhanced Genealogy Flow</h1>
          <p className="text-gray-600">
            An improved implementation of the genealogy tree with animation and better layout
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLayout(layout === 'vertical' ? 'horizontal' : 'vertical')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Switch to {layout === 'vertical' ? 'Horizontal' : 'Vertical'} Layout
          </button>
          
          <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-1" />
            Back to Genealogy
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {userId ? (
              <ReactFlowProvider>
                <EnhancedGenealogyFlow
                  userId={userId}
                  maxLevel={3}
                  initialLayout={layout}
                />
              </ReactFlowProvider>
            ) : (
              <div className="flex items-center justify-center h-96">
                <FaSpinner className="animate-spin text-blue-500 mr-2" />
                <span>Loading genealogy data...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center">
              <FaChartBar className="text-blue-500 mr-2" />
              <h3 className="font-medium">Network Statistics</h3>
            </div>
            {userId ? (
              <SimpleStatistics userId={userId} />
            ) : (
              <div className="flex items-center justify-center h-40">
                <FaSpinner className="animate-spin text-blue-500 mr-2" />
                <span>Loading statistics...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About Enhanced Genealogy Flow</h2>
        <p className="text-blue-700 mb-2">
          This is an enhanced implementation of the genealogy tree using React Flow. It provides:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Interactive node-based visualization with animation</li>
          <li>Multiple layout options (vertical and horizontal)</li>
          <li>Enhanced node design with performance metrics</li>
          <li>Improved user details panel</li>
          <li>Color-coded minimap for better navigation</li>
          <li>Advanced filtering and search capabilities</li>
        </ul>
        <p className="text-blue-700 mt-2">
          This implementation showcases the power of React Flow for creating interactive genealogy visualizations.
        </p>
      </div>
    </div>
  );
}
