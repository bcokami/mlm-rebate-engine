"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaFileExport, FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';
import ExportOptions from '@/components/genealogy/ExportOptions';

/**
 * Genealogy Export Page
 * 
 * This page provides options for exporting genealogy data
 */
export default function GenealogyExportPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  
  // Get user ID from query parameters or session
  const userIdParam = searchParams.get('userId');
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [userName, setUserName] = useState<string>('');
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (status !== 'authenticated') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // If userId is provided in query parameters, use it
        // Otherwise, use the logged-in user's ID
        const id = userIdParam || session?.user?.id;
        
        if (!id) {
          throw new Error('No user ID available');
        }
        
        // Fetch user data
        const response = await fetch(`/api/users/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        
        setUserId(userData.id);
        setUserName(userData.name);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [status, userIdParam, session]);
  
  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span>Loading...</span>
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
          <p className="text-gray-600 mb-4">Please sign in to export genealogy data.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Export Genealogy Data</h1>
          <p className="text-gray-600">
            Export your genealogy data in various formats
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Export Options */}
          {userId && (
            <ExportOptions userId={userId} userName={userName} />
          )}
        </div>
        
        <div className="lg:col-span-1">
          {/* Export Information */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-500" />
              Export Information
            </h3>
            
            <div className="space-y-4 text-sm">
              <p>
                Export your genealogy data to analyze it in external tools or share it with your team.
              </p>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-700 mb-2">Available Export Formats</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>
                    <strong>Excel (.xlsx)</strong> - Best for detailed analysis and formatting
                  </li>
                  <li>
                    <strong>CSV</strong> - Compatible with most spreadsheet and database applications
                  </li>
                  <li>
                    <strong>PDF</strong> - Best for printing and sharing
                  </li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md">
                <h4 className="font-medium text-yellow-700 mb-2">Export Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>
                    Exporting more levels will result in larger files
                  </li>
                  <li>
                    Including performance metrics provides more detailed data
                  </li>
                  <li>
                    PDF export opens a print dialog for saving or printing
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="font-medium text-green-700 mb-2">Data Privacy</h4>
                <p className="text-green-700">
                  Exported data may contain sensitive information. Please handle it securely and in accordance with your organization's data privacy policies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
