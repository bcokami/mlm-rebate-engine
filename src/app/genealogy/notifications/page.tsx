"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft, FaBell, FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';
import GenealogyNotifications from '@/components/genealogy/GenealogyNotifications';

/**
 * Genealogy Notifications Page
 * 
 * This page displays notifications related to the genealogy
 */
export default function GenealogyNotificationsPage() {
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
  
  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    console.log('Notification clicked:', notification);
    
    // Handle different notification types
    switch (notification.type) {
      case 'new_member':
        if (notification.data?.userId) {
          window.location.href = `/users/${notification.data.userId}`;
        }
        break;
      case 'purchase':
        if (notification.data?.purchaseId) {
          window.location.href = `/purchases/${notification.data.purchaseId}`;
        }
        break;
      case 'rank_advancement':
        if (notification.data?.userId) {
          window.location.href = `/users/${notification.data.userId}`;
        }
        break;
      case 'rebate':
        if (notification.data?.rebateId) {
          window.location.href = `/rebates/${notification.data.rebateId}`;
        }
        break;
      default:
        // Do nothing for other notification types
        break;
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
          <p className="text-gray-600 mb-4">Please sign in to view genealogy notifications.</p>
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
          <h1 className="text-2xl font-bold">Genealogy Notifications</h1>
          <p className="text-gray-600">
            Stay updated on your network's activities and achievements
          </p>
        </div>
        
        <Link href="/genealogy" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-1" />
          Back to Genealogy
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Notifications */}
          {userId ? (
            <GenealogyNotifications
              userId={userId}
              limit={20}
              showControls={true}
              onNotificationClick={handleNotificationClick}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-96">
              <FaSpinner className="animate-spin text-blue-500 mr-2" />
              <span>Loading notifications...</span>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          {/* About Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold flex items-center mb-4">
              <FaInfoCircle className="mr-2 text-blue-500" />
              About Notifications
            </h2>
            
            <div className="space-y-4">
              <p>
                The Genealogy Notifications system keeps you informed about important events and activities in your network. Stay updated on new members, purchases, rank advancements, and more.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Notification Types</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li><strong>New Members</strong> - When someone joins your network</li>
                  <li><strong>Purchases</strong> - When members in your network make purchases</li>
                  <li><strong>Rank Advancements</strong> - When members achieve new ranks</li>
                  <li><strong>Rebates</strong> - When you earn rebates from your network's activities</li>
                  <li><strong>System</strong> - Important system announcements and updates</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Notification Settings</h3>
                <p className="text-green-700 mb-2">
                  You can customize your notification preferences to receive only the types of notifications that matter to you.
                </p>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>Choose which notification types to receive</li>
                  <li>Enable or disable email notifications</li>
                  <li>Enable or disable push notifications</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">Tips for Managing Notifications</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Use filters to focus on specific notification types</li>
                  <li>Mark notifications as read to keep your inbox organized</li>
                  <li>Click on notifications to view more details or take action</li>
                  <li>Check notifications regularly to stay informed about your network</li>
                </ul>
              </div>
              
              <p>
                Notifications are an essential tool for managing your network effectively. They help you identify opportunities, recognize achievements, and stay connected with your team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
