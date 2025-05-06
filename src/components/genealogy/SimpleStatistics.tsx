"use client";

import { useState, useEffect } from 'react';
import { FaUsers, FaUserFriends, FaChartBar, FaSpinner } from 'react-icons/fa';

interface SimpleStatisticsProps {
  userId: number;
  className?: string;
}

interface StatisticsData {
  totalUsers: number;
  directDownlineCount: number;
  levelCounts: Record<number, number>;
  activeUsersLast30Days: number;
  activeUserPercentage: number;
}

/**
 * Simple Statistics Component
 * 
 * Displays basic statistics about the genealogy tree
 */
export default function SimpleStatistics({ userId, className = '' }: SimpleStatisticsProps) {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/genealogy/statistics?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, [userId]);
  
  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading statistics...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`text-red-500 p-4 ${className}`}>
        Error: {error}
      </div>
    );
  }
  
  // No data state
  if (!statistics) {
    return (
      <div className={`text-gray-500 p-4 ${className}`}>
        No statistics available
      </div>
    );
  }
  
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="font-medium mb-4">Network Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FaUsers />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Network Size</div>
              <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FaUserFriends />
            </div>
            <div>
              <div className="text-sm text-gray-500">Direct Downline</div>
              <div className="text-2xl font-bold">{statistics.directDownlineCount}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FaChartBar />
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Members (30d)</div>
              <div className="text-2xl font-bold">{statistics.activeUsersLast30Days}</div>
              <div className="text-xs text-gray-500">{statistics.activeUserPercentage.toFixed(1)}% of network</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Level Distribution */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h4 className="text-md font-medium mb-3">Level Distribution</h4>
        <div className="space-y-2">
          {Object.entries(statistics.levelCounts).map(([level, count]) => (
            <div key={level} className="flex items-center">
              <div className="w-24 text-sm">Level {level}:</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(count / statistics.totalUsers) * 100}%` }}
                ></div>
              </div>
              <div className="w-16 text-right text-sm">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
