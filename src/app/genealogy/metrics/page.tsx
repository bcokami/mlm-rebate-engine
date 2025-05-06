"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaChartLine, FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';
import GenealogyMetricsDashboard from '@/components/genealogy/GenealogyMetricsDashboard';

/**
 * Genealogy Metrics Page
 * 
 * This page displays metrics and analytics for the genealogy
 */
export default function GenealogyMetricsPage() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<'last30days' | 'last90days' | 'last6months' | 'last12months'>('last30days');
  
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
          <p className="text-gray-600 mb-4">Please sign in to view genealogy metrics.</p>
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
          <h1 className="text-2xl font-bold">Genealogy Metrics</h1>
          <p className="text-gray-600">
            View key metrics and analytics for your genealogy network
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Metrics Dashboard */}
        {userId ? (
          <GenealogyMetricsDashboard userId={userId} timeRange={timeRange} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-96">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span>Loading metrics data...</span>
          </div>
        )}
        
        {/* About Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold flex items-center mb-4">
            <FaInfoCircle className="mr-2 text-blue-500" />
            About Genealogy Metrics
          </h2>
          
          <div className="space-y-4">
            <p>
              The Genealogy Metrics Dashboard provides valuable insights into your network's performance and growth. Use these metrics to identify trends, recognize top performers, and make data-driven decisions to grow your business.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Key Metrics</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Total Members - The total number of distributors in your network</li>
                  <li>New Members - Recent additions to your network</li>
                  <li>Total Sales - Combined sales volume across your network</li>
                  <li>Total Rebates - Commissions and bonuses distributed</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Performance Charts</h3>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>Sales by Month - Track sales trends over time</li>
                  <li>New Members by Month - Monitor recruitment performance</li>
                  <li>Rank Distribution - See the composition of your network</li>
                  <li>Network Depth - Analyze your network's structure</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md">
              <h3 className="font-medium text-yellow-800 mb-2">How to Use These Metrics</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li><strong>Identify Growth Opportunities:</strong> Look for trends in sales and recruitment to identify seasonal patterns or growth opportunities.</li>
                <li><strong>Recognize Top Performers:</strong> Identify and reward your top performers to encourage continued success.</li>
                <li><strong>Balance Your Network:</strong> Use the rank distribution and network depth charts to identify areas that need development.</li>
                <li><strong>Set Goals:</strong> Use historical data to set realistic goals for future performance.</li>
                <li><strong>Track Progress:</strong> Monitor your metrics regularly to track progress toward your goals.</li>
              </ul>
            </div>
            
            <p>
              For more detailed analysis, you can export these metrics or view specific reports in the reporting section. The metrics are updated daily to provide you with the most current information about your network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
