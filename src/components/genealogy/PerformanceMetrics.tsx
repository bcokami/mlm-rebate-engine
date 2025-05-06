"use client";

import { FaChartLine, FaShoppingCart, FaUsers, FaWallet, FaChartBar } from 'react-icons/fa';

// Interface for performance metrics
interface PerformanceMetricsData {
  personalSales: number;
  teamSales: number;
  totalSales: number;
  rebatesEarned: number;
  teamSize: number;
  newTeamMembers: number;
  activityScore: number;
}

interface PerformanceMetricsProps {
  data: PerformanceMetricsData;
  className?: string;
}

/**
 * Performance Metrics Component
 * 
 * Displays performance metrics for a user in the genealogy tree
 */
export default function PerformanceMetrics({ data, className = '' }: PerformanceMetricsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-md font-semibold flex items-center">
        <FaChartLine className="mr-2 text-blue-500" /> Performance Metrics
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="flex items-center mb-1">
            <FaShoppingCart className="text-blue-500 mr-2" />
            <span className="text-sm text-gray-600">Personal Sales</span>
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(data.personalSales)}
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-md">
          <div className="flex items-center mb-1">
            <FaUsers className="text-green-500 mr-2" />
            <span className="text-sm text-gray-600">Team Sales</span>
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(data.teamSales)}
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-md">
          <div className="flex items-center mb-1">
            <FaWallet className="text-yellow-500 mr-2" />
            <span className="text-sm text-gray-600">Rebates Earned</span>
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(data.rebatesEarned)}
          </div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-md">
          <div className="flex items-center mb-1">
            <FaChartBar className="text-purple-500 mr-2" />
            <span className="text-sm text-gray-600">Activity Score</span>
          </div>
          <div className="text-lg font-semibold">
            {data.activityScore}/100
          </div>
        </div>
      </div>
      
      {/* Team Metrics */}
      <div className="bg-gray-50 p-3 rounded-md">
        <h4 className="text-sm font-medium mb-2">Team Metrics</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-500">Team Size</div>
            <div className="font-medium">{data.teamSize} members</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">New Members (30d)</div>
            <div className="font-medium">{data.newTeamMembers} members</div>
          </div>
        </div>
      </div>
      
      {/* Activity Score Visualization */}
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-500">Activity Score</span>
          <span className="text-sm font-medium">{data.activityScore}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              data.activityScore > 75 ? 'bg-green-500' : 
              data.activityScore > 50 ? 'bg-blue-500' : 
              data.activityScore > 25 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${data.activityScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
