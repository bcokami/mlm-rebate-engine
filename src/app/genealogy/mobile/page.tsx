"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaMobile, FaTabletAlt } from 'react-icons/fa';
import Link from 'next/link';
import MobileGenealogyView from '@/components/genealogy/MobileGenealogyView';

/**
 * Mobile Genealogy Page
 * 
 * This page displays a mobile-friendly genealogy view
 */
export default function MobileGenealogyPage() {
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
          <h1 className="text-2xl font-bold">Mobile Genealogy View</h1>
          <p className="text-gray-600">
            Optimized for mobile devices and touch screens
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          {/* Mobile View */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <FaMobile className="text-blue-500 mr-2" />
              <h2 className="font-medium">Mobile Genealogy View</h2>
            </div>
            
            <div className="max-w-sm mx-auto my-4">
              {userId ? (
                <MobileGenealogyView
                  userId={userId}
                  maxLevel={3}
                  initialPageSize={10}
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
        
        <div className="md:col-span-1">
          {/* Information */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <FaTabletAlt className="text-blue-500 mr-2" />
              <h2 className="font-medium">About Mobile View</h2>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                <p>
                  The mobile genealogy view is designed specifically for mobile devices and touch screens. It provides a simplified, list-based view of your genealogy that's easy to navigate on smaller screens.
                </p>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Key Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Touch-friendly navigation</li>
                    <li>Simplified list view of your downline</li>
                    <li>Expandable details for each member</li>
                    <li>Quick access to performance metrics</li>
                    <li>Search functionality to find specific members</li>
                    <li>Optimized for small screens and mobile data connections</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-3 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2">How to Use</h3>
                  <ul className="list-disc list-inside space-y-1 text-green-700">
                    <li>Tap on a member's name to see their details</li>
                    <li>Use the "Show Details" button to expand information</li>
                    <li>Tap "View Downline" to navigate to a member's downline</li>
                    <li>Use the back button to return to previous views</li>
                    <li>Use the search icon to find specific members</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-md">
                  <h3 className="font-medium text-yellow-800 mb-2">When to Use Mobile View</h3>
                  <p className="text-yellow-700">
                    The mobile view is ideal for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 mt-2">
                    <li>Checking your genealogy on the go</li>
                    <li>Devices with smaller screens</li>
                    <li>Touch-based navigation</li>
                    <li>Limited bandwidth connections</li>
                    <li>Quick lookups of specific members</li>
                  </ul>
                </div>
                
                <p>
                  For a more comprehensive visualization with advanced features, switch to the desktop view when you're on a larger screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
