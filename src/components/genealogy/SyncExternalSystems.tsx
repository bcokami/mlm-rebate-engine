"use client";

import { useState } from 'react';
import { 
  FaSync, 
  FaSpinner, 
  FaCheck, 
  FaTimes, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaDatabase,
  FaCloud,
  FaCloudDownloadAlt,
  FaCloudUploadAlt,
  FaCog,
  FaHistory
} from 'react-icons/fa';

interface ExternalSystem {
  id: string;
  name: string;
  type: 'crm' | 'cloud' | 'api' | 'other';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  icon: React.ReactNode;
}

interface SyncExternalSystemsProps {
  onSyncComplete?: (system: ExternalSystem) => void;
}

/**
 * Sync External Systems Component
 * 
 * Provides options for synchronizing genealogy data with external systems
 */
export default function SyncExternalSystems({ onSyncComplete }: SyncExternalSystemsProps) {
  // Sample external systems
  const [externalSystems, setExternalSystems] = useState<ExternalSystem[]>([
    {
      id: 'crm1',
      name: 'Sales CRM',
      type: 'crm',
      status: 'connected',
      lastSync: '2023-10-15T14:30:00Z',
      icon: <FaDatabase className="text-purple-500" />,
    },
    {
      id: 'cloud1',
      name: 'Cloud Storage',
      type: 'cloud',
      status: 'connected',
      lastSync: '2023-10-14T09:15:00Z',
      icon: <FaCloud className="text-blue-500" />,
    },
    {
      id: 'api1',
      name: 'External API',
      type: 'api',
      status: 'disconnected',
      icon: <FaCog className="text-gray-500" />,
    },
  ]);
  
  // State for sync
  const [syncingSystem, setSyncingSystem] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<Array<{
    systemId: string;
    timestamp: string;
    success: boolean;
    message: string;
  }>>([
    {
      systemId: 'crm1',
      timestamp: '2023-10-15T14:30:00Z',
      success: true,
      message: 'Successfully synchronized 156 records',
    },
    {
      systemId: 'cloud1',
      timestamp: '2023-10-14T09:15:00Z',
      success: true,
      message: 'Successfully synchronized 142 records',
    },
    {
      systemId: 'api1',
      timestamp: '2023-10-10T11:45:00Z',
      success: false,
      message: 'Connection timeout',
    },
  ]);
  
  // State for showing sync history
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  
  // Handle sync
  const handleSync = async (system: ExternalSystem) => {
    setSyncingSystem(system.id);
    setSyncSuccess(null);
    setSyncError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success or failure
      const success = Math.random() > 0.2; // 80% success rate
      
      if (!success) {
        throw new Error('Failed to synchronize with external system.');
      }
      
      // Update system last sync time
      const updatedSystems = externalSystems.map(s => 
        s.id === system.id 
          ? { ...s, lastSync: new Date().toISOString() } 
          : s
      );
      
      setExternalSystems(updatedSystems);
      
      // Add to sync history
      setSyncHistory(prev => [
        {
          systemId: system.id,
          timestamp: new Date().toISOString(),
          success: true,
          message: `Successfully synchronized records`,
        },
        ...prev,
      ]);
      
      setSyncSuccess(true);
      
      // Call onSyncComplete callback
      if (onSyncComplete) {
        onSyncComplete(system);
      }
    } catch (error) {
      console.error('Sync error:', error);
      
      // Add to sync history
      setSyncHistory(prev => [
        {
          systemId: system.id,
          timestamp: new Date().toISOString(),
          success: false,
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        },
        ...prev,
      ]);
      
      setSyncError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSyncSuccess(false);
    } finally {
      setSyncingSystem(null);
    }
  };
  
  // Handle connect
  const handleConnect = async (system: ExternalSystem) => {
    setSyncingSystem(system.id);
    setSyncSuccess(null);
    setSyncError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update system status
      const updatedSystems = externalSystems.map(s => 
        s.id === system.id 
          ? { ...s, status: 'connected' as const } 
          : s
      );
      
      setExternalSystems(updatedSystems);
      
      // Add to sync history
      setSyncHistory(prev => [
        {
          systemId: system.id,
          timestamp: new Date().toISOString(),
          success: true,
          message: `Successfully connected to ${system.name}`,
        },
        ...prev,
      ]);
      
      setSyncSuccess(true);
    } catch (error) {
      console.error('Connect error:', error);
      
      // Add to sync history
      setSyncHistory(prev => [
        {
          systemId: system.id,
          timestamp: new Date().toISOString(),
          success: false,
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        },
        ...prev,
      ]);
      
      setSyncError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSyncSuccess(false);
    } finally {
      setSyncingSystem(null);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get time ago
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    }
    
    if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    }
    
    if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    }
    
    return 'Just now';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <FaSync className="mr-2 text-blue-500" />
          Sync with External Systems
        </div>
        <button
          onClick={() => setShowSyncHistory(!showSyncHistory)}
          className="text-sm text-blue-600 flex items-center"
        >
          <FaHistory className="mr-1" />
          {showSyncHistory ? 'Hide History' : 'Show History'}
        </button>
      </h3>
      
      {!showSyncHistory ? (
        <>
          {/* External Systems */}
          <div className="space-y-4 mb-4">
            {externalSystems.map(system => (
              <div key={system.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 text-xl">
                      {system.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{system.name}</h4>
                      <div className="text-sm text-gray-500">
                        Last sync: {system.lastSync ? getTimeAgo(system.lastSync) : 'Never'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3">
                      {system.status === 'connected' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Connected
                        </span>
                      ) : system.status === 'error' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Error
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Disconnected
                        </span>
                      )}
                    </div>
                    {system.status === 'connected' ? (
                      <button
                        onClick={() => handleSync(system)}
                        disabled={syncingSystem === system.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-sm flex items-center"
                      >
                        {syncingSystem === system.id ? (
                          <>
                            <FaSpinner className="animate-spin mr-1" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <FaSync className="mr-1" />
                            Sync Now
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(system)}
                        disabled={syncingSystem === system.id}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-sm flex items-center"
                      >
                        {syncingSystem === system.id ? (
                          <>
                            <FaSpinner className="animate-spin mr-1" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <FaCheck className="mr-1" />
                            Connect
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Sync Options */}
                {system.status === 'connected' && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2">
                    <button
                      onClick={() => alert(`Import from ${system.name} would be implemented here`)}
                      className="p-2 border rounded-md flex items-center justify-center hover:bg-gray-50 text-sm"
                    >
                      <FaCloudDownloadAlt className="mr-2 text-blue-500" />
                      <span>Import from {system.name}</span>
                    </button>
                    <button
                      onClick={() => alert(`Export to ${system.name} would be implemented here`)}
                      className="p-2 border rounded-md flex items-center justify-center hover:bg-gray-50 text-sm"
                    >
                      <FaCloudUploadAlt className="mr-2 text-green-500" />
                      <span>Export to {system.name}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Add New System */}
          <div className="border rounded-md p-4 border-dashed flex items-center justify-center">
            <button
              onClick={() => alert('Add new external system would be implemented here')}
              className="p-2 text-blue-600 flex items-center"
            >
              <FaPlus className="mr-2" />
              Add New External System
            </button>
          </div>
          
          {/* Sync Information */}
          <div className="mt-4 bg-blue-50 p-3 rounded-md">
            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
              <FaInfoCircle className="mr-1" />
              About Synchronization
            </h4>
            <p className="text-sm text-blue-700 mb-2">
              Synchronizing with external systems allows you to keep your genealogy data up-to-date across multiple platforms.
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
              <li>Connect to your CRM, cloud storage, or other systems</li>
              <li>Import new members and updates from external systems</li>
              <li>Export your genealogy data to external systems</li>
              <li>Schedule automatic synchronization</li>
            </ul>
          </div>
          
          {/* Sync Status */}
          {syncSuccess !== null && (
            <div className={`mt-4 p-3 rounded-md ${
              syncSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center">
                {syncSuccess ? (
                  <>
                    <FaCheck className="mr-2" />
                    <span>Synchronization completed successfully!</span>
                  </>
                ) : (
                  <>
                    <FaTimes className="mr-2" />
                    <span>Synchronization failed: {syncError}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Sync History */}
          <div className="mb-4">
            <h4 className="font-medium mb-2 flex items-center">
              <FaHistory className="mr-2 text-blue-500" />
              Synchronization History
            </h4>
            
            {syncHistory.length === 0 ? (
              <div className="text-center text-gray-500 p-4 border rounded-md">
                No synchronization history available.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        System
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {syncHistory.map((history, index) => {
                      const system = externalSystems.find(s => s.id === history.systemId);
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="mr-2">
                                {system?.icon}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {system?.name || history.systemId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(history.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {history.success ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Success
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {history.message}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowSyncHistory(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Back to Systems
          </button>
        </>
      )}
    </div>
  );
}
