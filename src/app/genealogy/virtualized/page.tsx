"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaChartBar, FaLayerGroup } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import the virtualized genealogy flow component with dynamic loading to avoid SSR issues
const VirtualizedGenealogyFlow = dynamic(
  () => import('@/components/genealogy/VirtualizedGenealogyFlow'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading virtualized visualization...</span>
      </div>
    )
  }
);

/**
 * Virtualized Genealogy Page
 * 
 * This page displays a virtualized genealogy tree for better performance with large datasets
 */
export default function VirtualizedGenealogyPage() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [layout, setLayout] = useState<'vertical' | 'horizontal' | 'radial'>('vertical');
  
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
          <h1 className="text-2xl font-bold">Virtualized Genealogy Tree</h1>
          <p className="text-gray-600">
            Optimized for large networks with thousands of members
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-white rounded-md shadow-md overflow-hidden">
            <button
              onClick={() => setLayout('vertical')}
              className={`px-3 py-2 flex items-center ${
                layout === 'vertical' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaLayerGroup className="mr-2" /> Vertical
            </button>
            <button
              onClick={() => setLayout('horizontal')}
              className={`px-3 py-2 flex items-center ${
                layout === 'horizontal' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaLayerGroup className="mr-2 rotate-90" /> Horizontal
            </button>
            <button
              onClick={() => setLayout('radial')}
              className={`px-3 py-2 flex items-center ${
                layout === 'radial' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaLayerGroup className="mr-2 rotate-45" /> Radial
            </button>
          </div>
          
          <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-1" />
            Back to Genealogy
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {userId ? (
              <VirtualizedGenealogyFlow
                userId={userId}
                maxLevel={6}
                initialLayout={layout}
                initialPageSize={20}
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <FaSpinner className="animate-spin text-blue-500 mr-2" />
                <span>Loading genealogy data...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About Virtualized Genealogy</h2>
        <p className="text-blue-700 mb-2">
          This virtualized genealogy tree is optimized for large networks with thousands of members:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Lazy loading of nodes - only loads data when needed</li>
          <li>Virtualization - only renders nodes that are visible on screen</li>
          <li>Efficient memory usage - reduces RAM consumption for large trees</li>
          <li>Smooth performance even with thousands of members</li>
          <li>Multiple layout options for different visualization needs</li>
        </ul>
        <p className="text-blue-700 mt-2">
          <strong>How to use:</strong> Click on a node to expand it and load its children. The tree will automatically optimize which nodes are rendered based on your view.
        </p>
      </div>
      
      <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h2 className="text-lg font-medium text-yellow-800 mb-2">Performance Tips</h2>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>Only expand nodes you need to see to maintain optimal performance</li>
          <li>Use the minimap for navigation in large networks</li>
          <li>Adjust your zoom level to see more or fewer nodes at once</li>
          <li>Switch layouts to find the best visualization for your network structure</li>
        </ul>
      </div>
    </div>
  );
}
