"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaInfoCircle, FaEdit } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import the draggable genealogy flow component with dynamic loading to avoid SSR issues
const DraggableGenealogyFlow = dynamic(
  () => import('@/components/genealogy/DraggableGenealogyFlow'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading interactive visualization...</span>
      </div>
    )
  }
);

/**
 * Interactive Genealogy Page
 * 
 * This page displays an interactive genealogy tree with drag-and-drop functionality
 */
export default function InteractiveGenealogyPage() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  
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
  
  // Handle save changes
  const handleSaveChanges = async (changes: any) => {
    console.log('Saving changes:', changes);
    
    // In a real application, you would send these changes to the server
    // For now, we'll just show an alert
    alert('Changes saved successfully!');
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
          <h1 className="text-2xl font-bold">Interactive Genealogy Tree</h1>
          <p className="text-gray-600">
            Customize and interact with your genealogy tree
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-md flex items-center ${
              isEditMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FaEdit className="mr-2" />
            {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
          </button>
          
          <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-1" />
            Back to Genealogy
          </Link>
        </div>
      </div>
      
      {/* Edit Mode Notice */}
      {isEditMode && (
        <div className="mb-6 bg-yellow-50 border border-yellow-300 p-4 rounded-md">
          <h3 className="text-yellow-800 font-medium flex items-center mb-2">
            <FaInfoCircle className="mr-2" />
            Edit Mode Enabled
          </h3>
          <p className="text-yellow-700 mb-2">
            You can now drag and drop users to reorganize your genealogy tree. Changes will not be permanent until you save them.
          </p>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>Drag a user to a new parent to change their upline</li>
            <li>Click the edit button on a user to modify their details</li>
            <li>Click the add button to add a new user under a parent</li>
            <li>Click the delete button to remove a user (and their downline)</li>
          </ul>
        </div>
      )}
      
      {/* Draggable Genealogy Flow */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {userId ? (
          <DraggableGenealogyFlow
            userId={userId}
            maxLevel={3}
            initialLayout="vertical"
            allowEditing={isEditMode}
            onSaveChanges={handleSaveChanges}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span>Loading genealogy data...</span>
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About Interactive Genealogy</h2>
        <p className="text-blue-700 mb-2">
          This interactive genealogy tree provides advanced customization and interaction features:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Customize the appearance with different themes and layouts</li>
          <li>Adjust node spacing, connection styles, and other visual properties</li>
          <li>Drag and drop users to reorganize your network (in edit mode)</li>
          <li>Add, edit, or remove users directly from the visualization</li>
          <li>Save your changes to update your actual genealogy structure</li>
        </ul>
        <p className="text-blue-700 mt-2">
          Use the settings panel to customize the visualization to your preferences.
        </p>
      </div>
    </div>
  );
}
