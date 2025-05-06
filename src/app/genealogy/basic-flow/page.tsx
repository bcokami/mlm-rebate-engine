"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaChartBar } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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

// Import the basic genealogy flow component with dynamic loading to avoid SSR issues
const BasicGenealogyFlow = dynamic(
  () => import('@/components/genealogy/BasicGenealogyFlow'),
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
 * Basic Flow Genealogy Page
 *
 * This page displays a basic implementation of the genealogy tree using React Flow
 */
export default function BasicFlowPage() {
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
          <h1 className="text-2xl font-bold">Basic Genealogy Flow</h1>
          <p className="text-gray-600">
            A simple implementation of the genealogy tree using React Flow
          </p>
        </div>

        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {userId ? (
              <BasicGenealogyFlow
                userId={userId}
                maxLevel={3}
              />
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
        <h2 className="text-lg font-medium text-blue-800 mb-2">About Basic Genealogy Flow</h2>
        <p className="text-blue-700 mb-2">
          This is a simple implementation of the genealogy tree using React Flow. It provides:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Interactive node-based visualization</li>
          <li>Expand/collapse functionality for nodes</li>
          <li>Basic user details panel</li>
          <li>Minimap for navigation</li>
          <li>Zoom and pan controls</li>
        </ul>
        <p className="text-blue-700 mt-2">
          This is the first phase of our enhanced genealogy visualization. Future phases will add more features and optimizations.
        </p>
      </div>
    </div>
  );
}
