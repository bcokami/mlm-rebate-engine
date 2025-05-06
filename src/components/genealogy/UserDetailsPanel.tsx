"use client";

import { FaTimes, FaUser, FaEnvelope, FaIdCard, FaUserFriends, FaCalendarAlt } from 'react-icons/fa';
import PerformanceMetrics from './PerformanceMetrics';

// Interface for user data
interface User {
  id: number;
  name: string;
  email: string;
  rankName: string;
  level: number;
  downlineCount: number;
  createdAt?: string;
  walletBalance?: number;
  performanceMetrics?: {
    personalSales: number;
    teamSales: number;
    totalSales: number;
    rebatesEarned: number;
    teamSize: number;
    newTeamMembers: number;
    activityScore: number;
  } | null;
}

interface UserDetailsPanelProps {
  user: User;
  onClose: () => void;
  className?: string;
}

/**
 * User Details Panel Component
 * 
 * Displays detailed information about a user in the genealogy tree
 */
export default function UserDetailsPanel({ user, onClose, className = '' }: UserDetailsPanelProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold">User Details</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* User avatar and name */}
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="mt-1 text-xs px-2 py-0.5 inline-block rounded-full bg-blue-100 text-blue-800">
              {user.rankName}
            </div>
          </div>
        </div>
        
        {/* User information */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start">
            <FaIdCard className="mt-1 mr-3 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">User ID</div>
              <div>{user.id}</div>
            </div>
          </div>
          <div className="flex items-start">
            <FaUserFriends className="mt-1 mr-3 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Downline Members</div>
              <div>{user.downlineCount}</div>
            </div>
          </div>
          {user.walletBalance !== undefined && (
            <div className="flex items-start">
              <FaIdCard className="mt-1 mr-3 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Wallet Balance</div>
                <div>{formatCurrency(user.walletBalance)}</div>
              </div>
            </div>
          )}
          {user.createdAt && (
            <div className="flex items-start">
              <FaCalendarAlt className="mt-1 mr-3 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Member Since</div>
                <div>{formatDate(user.createdAt)}</div>
              </div>
            </div>
          )}
          {user.level > 0 && (
            <div className="flex items-start">
              <FaUserFriends className="mt-1 mr-3 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Network Level</div>
                <div>Level {user.level}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Performance metrics */}
        {user.performanceMetrics && (
          <PerformanceMetrics data={user.performanceMetrics} />
        )}
        
        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              View Full Profile
            </button>
            <button className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
