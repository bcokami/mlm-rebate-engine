"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaFileImport, FaSync, FaPlug } from 'react-icons/fa';
import Link from 'next/link';
import ImportGenealogyData from '@/components/genealogy/ImportGenealogyData';
import SyncExternalSystems from '@/components/genealogy/SyncExternalSystems';

/**
 * Genealogy Integration Page
 * 
 * This page provides options for integrating the genealogy with external systems
 */
export default function GenealogyIntegrationPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'import' | 'sync'>('import');
  
  // Handle import complete
  const handleImportComplete = (data: any) => {
    console.log('Import complete:', data);
    alert(`Import completed successfully! ${data.length} records imported.`);
  };
  
  // Handle sync complete
  const handleSyncComplete = (system: any) => {
    console.log('Sync complete:', system);
    alert(`Synchronization with ${system.name} completed successfully!`);
  };
  
  // Loading state
  if (status === 'loading') {
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
          <p className="text-gray-600 mb-4">Please sign in to access genealogy integration features.</p>
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
          <h1 className="text-2xl font-bold">Genealogy Integration</h1>
          <p className="text-gray-600">
            Import, export, and synchronize your genealogy data with external systems
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaFileImport className="inline mr-2" />
              Import Data
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sync'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaSync className="inline mr-2" />
              Sync External Systems
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'import' ? (
            <ImportGenealogyData onImportComplete={handleImportComplete} />
          ) : (
            <SyncExternalSystems onSyncComplete={handleSyncComplete} />
          )}
        </div>
        
        <div className="lg:col-span-1">
          {/* Integration Information */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FaPlug className="mr-2 text-blue-500" />
              Integration Information
            </h3>
            
            <div className="space-y-4">
              {activeTab === 'import' ? (
                <>
                  <p>
                    Import your genealogy data from external sources to keep your network up-to-date.
                  </p>
                  
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h4 className="font-medium text-blue-700 mb-2">Supported Import Formats</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Excel (.xlsx, .xls) - Spreadsheet format</li>
                      <li>CSV (.csv) - Comma-separated values</li>
                      <li>JSON (.json) - JavaScript Object Notation</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <h4 className="font-medium text-yellow-700 mb-2">Required Fields</h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>ID - Unique identifier for each member</li>
                      <li>Name - Member's full name</li>
                      <li>Email - Member's email address</li>
                      <li>Upline ID - ID of the member's upline</li>
                      <li>Rank Name - Member's rank in the organization</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-md">
                    <h4 className="font-medium text-green-700 mb-2">Optional Fields</h4>
                    <ul className="list-disc list-inside space-y-1 text-green-700">
                      <li>Wallet Balance - Member's current wallet balance</li>
                      <li>Join Date - Date when the member joined</li>
                      <li>Phone - Member's phone number</li>
                      <li>Address - Member's address</li>
                      <li>Performance Metrics - Sales, rebates, etc.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Synchronize your genealogy data with external systems to maintain consistency across platforms.
                  </p>
                  
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h4 className="font-medium text-blue-700 mb-2">Supported Systems</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>CRM Systems - Salesforce, HubSpot, etc.</li>
                      <li>Cloud Storage - Google Drive, Dropbox, etc.</li>
                      <li>External APIs - Custom integrations</li>
                      <li>Other MLM Platforms - Data migration</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <h4 className="font-medium text-yellow-700 mb-2">Sync Options</h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>One-way Import - Import data from external system</li>
                      <li>One-way Export - Export data to external system</li>
                      <li>Two-way Sync - Keep both systems in sync</li>
                      <li>Scheduled Sync - Automate synchronization</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-md">
                    <h4 className="font-medium text-green-700 mb-2">Benefits</h4>
                    <ul className="list-disc list-inside space-y-1 text-green-700">
                      <li>Data Consistency - Same data across all systems</li>
                      <li>Time Saving - Avoid manual data entry</li>
                      <li>Error Reduction - Minimize human errors</li>
                      <li>Real-time Updates - Keep data current</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
