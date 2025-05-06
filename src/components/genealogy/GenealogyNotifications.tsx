"use client";

import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaUserPlus, 
  FaShoppingCart, 
  FaTrophy, 
  FaSpinner,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaEllipsisH,
  FaFilter,
  FaCog
} from 'react-icons/fa';
import Link from 'next/link';

interface Notification {
  id: number;
  type: 'new_member' | 'purchase' | 'rank_advancement' | 'rebate' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: {
    userId?: number;
    userName?: string;
    purchaseId?: number;
    amount?: number;
    rankName?: string;
    rebateId?: number;
  };
}

interface GenealogyNotificationsProps {
  userId: number;
  limit?: number;
  showControls?: boolean;
  onNotificationClick?: (notification: Notification) => void;
}

/**
 * Genealogy Notifications Component
 * 
 * Displays notifications related to the genealogy
 */
export default function GenealogyNotifications({
  userId,
  limit = 5,
  showControls = true,
  onNotificationClick,
}: GenealogyNotificationsProps) {
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    newMembers: true,
    purchases: true,
    rankAdvancements: true,
    rebates: true,
    system: true,
    emailNotifications: false,
    pushNotifications: false,
  });
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams({
          userId: userId.toString(),
          limit: showAll ? '50' : limit.toString(),
        });
        
        if (filter) {
          params.append('type', filter);
        }
        
        const response = await fetch(`/api/genealogy/notifications?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [userId, limit, showAll, filter]);
  
  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/genealogy/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/genealogy/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Call the callback if provided
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    try {
      const response = await fetch(`/api/genealogy/notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings: notificationSettings,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notification settings');
      }
      
      setShowSettings(false);
    } catch (err) {
      console.error('Error saving notification settings:', err);
    }
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_member':
        return <FaUserPlus className="text-green-500" />;
      case 'purchase':
        return <FaShoppingCart className="text-blue-500" />;
      case 'rank_advancement':
        return <FaTrophy className="text-yellow-500" />;
      case 'rebate':
        return <FaWallet className="text-purple-500" />;
      case 'system':
        return <FaCog className="text-gray-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
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
  
  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center h-32">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading notifications...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="bg-red-50 p-3 rounded-md">
          <h3 className="text-red-800 font-medium flex items-center">
            <FaExclamationTriangle className="mr-2" />
            Error loading notifications
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  
  // Notification settings panel
  if (showSettings) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center">
            <FaCog className="mr-2 text-blue-500" />
            Notification Settings
          </h3>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="font-medium mb-2">Notification Types</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="newMembers"
                  checked={notificationSettings.newMembers}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, newMembers: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="newMembers" className="ml-2 block text-sm text-gray-700">
                  New Members
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="purchases"
                  checked={notificationSettings.purchases}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, purchases: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="purchases" className="ml-2 block text-sm text-gray-700">
                  Purchases
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rankAdvancements"
                  checked={notificationSettings.rankAdvancements}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, rankAdvancements: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rankAdvancements" className="ml-2 block text-sm text-gray-700">
                  Rank Advancements
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rebates"
                  checked={notificationSettings.rebates}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, rebates: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rebates" className="ml-2 block text-sm text-gray-700">
                  Rebates
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="system"
                  checked={notificationSettings.system}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, system: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="system" className="ml-2 block text-sm text-gray-700">
                  System Notifications
                </label>
              </div>
            </div>
          </div>
          
          <div className="border-b pb-3">
            <h4 className="font-medium mb-2">Delivery Methods</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-700">
                  Push Notifications
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveNotificationSettings}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <FaBell className="mr-2 text-blue-500" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
              {unreadCount} new
            </span>
          )}
        </h3>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter(filter ? null : 'new_member')}
              className={`p-1 rounded-md ${
                filter === 'new_member' ? 'bg-green-100 text-green-800' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Filter by New Members"
            >
              <FaUserPlus />
            </button>
            <button
              onClick={() => setFilter(filter ? null : 'purchase')}
              className={`p-1 rounded-md ${
                filter === 'purchase' ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Filter by Purchases"
            >
              <FaShoppingCart />
            </button>
            <button
              onClick={() => setFilter(filter ? null : 'rank_advancement')}
              className={`p-1 rounded-md ${
                filter === 'rank_advancement' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Filter by Rank Advancements"
            >
              <FaTrophy />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Notification Settings"
            >
              <FaCog />
            </button>
          </div>
        )}
      </div>
      
      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No notifications found.</p>
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="mt-2 text-blue-600 text-sm"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
            >
              <div className="flex">
                <div className="mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div
                    className="cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-2 flex justify-end">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                    
                    {/* Additional actions based on notification type */}
                    {notification.type === 'new_member' && notification.data?.userId && (
                      <Link
                        href={`/users/${notification.data.userId}`}
                        className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Profile
                      </Link>
                    )}
                    
                    {notification.type === 'purchase' && notification.data?.purchaseId && (
                      <Link
                        href={`/purchases/${notification.data.purchaseId}`}
                        className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Purchase
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      {showControls && (
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
          
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAll ? 'Show less' : 'View all'}
          </button>
        </div>
      )}
    </div>
  );
}
