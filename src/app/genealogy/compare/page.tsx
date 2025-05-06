"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaChartBar, FaLayerGroup, FaExchangeAlt } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from 'reactflow';

// Import the basic genealogy flow component with dynamic loading
const BasicGenealogyFlow = dynamic(
  () => import('@/components/genealogy/BasicGenealogyFlow'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading visualization...</span>
      </div>
    )
  }
);

// Import the enhanced genealogy flow component with dynamic loading
const EnhancedGenealogyFlow = dynamic(
  () => import('@/components/genealogy/EnhancedGenealogyFlow'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading visualization...</span>
      </div>
    )
  }
);

// Import the original genealogy tree component
const GenealogyTree = dynamic(
  () => import('@/components/genealogy/GenealogyTree'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading visualization...</span>
      </div>
    )
  }
);

type VisualizationType = 'original' | 'basic' | 'enhanced';

/**
 * Genealogy Comparison Page
 * 
 * This page allows users to compare different genealogy visualization methods
 */
export default function GenealogyComparePage() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [leftVisualization, setLeftVisualization] = useState<VisualizationType>('original');
  const [rightVisualization, setRightVisualization] = useState<VisualizationType>('enhanced');
  
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
  
  // Swap visualizations
  const handleSwapVisualizations = () => {
    setLeftVisualization(rightVisualization);
    setRightVisualization(leftVisualization);
  };
  
  // Render visualization based on type
  const renderVisualization = (type: VisualizationType) => {
    if (!userId) {
      return (
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span>Loading user data...</span>
        </div>
      );
    }
    
    switch (type) {
      case 'original':
        return <GenealogyTree userId={userId} maxLevel={3} />;
      case 'basic':
        return <BasicGenealogyFlow userId={userId} maxLevel={3} />;
      case 'enhanced':
        return (
          <ReactFlowProvider>
            <EnhancedGenealogyFlow userId={userId} maxLevel={3} />
          </ReactFlowProvider>
        );
      default:
        return null;
    }
  };
  
  // Get visualization name
  const getVisualizationName = (type: VisualizationType) => {
    switch (type) {
      case 'original':
        return 'Original Tree';
      case 'basic':
        return 'Basic Flow';
      case 'enhanced':
        return 'Enhanced Flow';
      default:
        return '';
    }
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
          <h1 className="text-2xl font-bold">Genealogy Visualization Comparison</h1>
          <p className="text-gray-600">
            Compare different genealogy visualization methods side by side
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      {/* Visualization Controls */}
      <div className="bg-white p-4 rounded-lg shadow-lg mb-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Left Visualization
            </label>
            <select
              value={leftVisualization}
              onChange={(e) => setLeftVisualization(e.target.value as VisualizationType)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="original">Original Tree</option>
              <option value="basic">Basic Flow</option>
              <option value="enhanced">Enhanced Flow</option>
            </select>
          </div>
          
          <button
            onClick={handleSwapVisualizations}
            className="mt-6 p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
            title="Swap visualizations"
          >
            <FaExchangeAlt />
          </button>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Right Visualization
            </label>
            <select
              value={rightVisualization}
              onChange={(e) => setRightVisualization(e.target.value as VisualizationType)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="original">Original Tree</option>
              <option value="basic">Basic Flow</option>
              <option value="enhanced">Enhanced Flow</option>
            </select>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mt-4 md:mt-0">
          <p>Compare different visualization methods to see which one works best for your needs.</p>
          <p>Each method has its own strengths and features.</p>
        </div>
      </div>
      
      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-50 p-3 border-b border-blue-100">
            <h3 className="font-medium">{getVisualizationName(leftVisualization)}</h3>
          </div>
          <div className="h-[600px] overflow-hidden">
            {renderVisualization(leftVisualization)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-50 p-3 border-b border-blue-100">
            <h3 className="font-medium">{getVisualizationName(rightVisualization)}</h3>
          </div>
          <div className="h-[600px] overflow-hidden">
            {renderVisualization(rightVisualization)}
          </div>
        </div>
      </div>
      
      {/* Comparison Table */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-medium mb-4">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Tree
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Flow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enhanced Flow
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Interactive Navigation
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Basic
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Good
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Excellent
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Performance with Large Trees
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Limited
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Good
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Excellent
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Visual Appeal
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Basic
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Good
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Excellent
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Information Density
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Low
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Medium
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  High
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Layout Options
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Fixed
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Fixed
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Multiple
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Animation
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  None
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Basic
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Advanced
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Performance Metrics
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Limited
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Basic
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Comprehensive
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
