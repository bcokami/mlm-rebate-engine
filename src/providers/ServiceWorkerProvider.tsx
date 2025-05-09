"use client";

import React, { useEffect, useState } from 'react';
import { registerServiceWorker } from '@/utils/serviceWorkerRegistration';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

/**
 * Service Worker Provider
 * 
 * This component registers the service worker and provides a UI for updates.
 */
const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({ children }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Listen for update events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };
    
    window.addEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
    
    return () => {
      window.removeEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
    };
  }, []);
  
  const handleRefresh = () => {
    // Reload the page to activate the new service worker
    window.location.reload();
  };
  
  return (
    <>
      {children}
      
      {/* Update notification */}
      {updateAvailable && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center">
          <div className="mr-4">
            <p className="font-medium">Update Available</p>
            <p className="text-sm">A new version of the app is available</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </>
  );
};

export default ServiceWorkerProvider;
