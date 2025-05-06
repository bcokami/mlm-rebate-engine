"use client";

import { FaSpinner, FaUsers, FaWallet, FaChartBar, FaUserFriends, FaCalendarAlt } from 'react-icons/fa';

interface RankDistribution {
  rankId: number;
  rankName: string;
  count: number;
}

interface GenealogyStatistics {
  totalUsers: number;
  levelCounts: Record<number, number>;
  totalDownlineBalance: number;
  directDownlineCount: number;
  rankDistribution: RankDistribution[];
  activity: {
    activeUsersLast30Days: number;
    activeUserPercentage: number;
  };
  lastUpdated: Date;
}

interface GenealogyStatisticsProps {
  statistics: GenealogyStatistics | undefined;
  isLoading: boolean;
}

/**
 * Genealogy Statistics Component
 * 
 * Displays statistics about the genealogy tree
 */
export default function GenealogyStatistics({ statistics, isLoading }: GenealogyStatisticsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading statistics...</span>
      </div>
    );
  }
  
  if (!statistics) {
    return (
      <div className="text-gray-500 p-4">
        No statistics available
      </div>
    );
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate total users by level
  const totalUsersByLevel = Object.values(statistics.levelCounts).reduce((sum, count) => sum + count, 0);
  
  // Get rank colors
  const getRankColor = (rankName: string) => {
    const rankColors: Record<string, string> = {
      'Starter': 'bg-gray-100',
      'Bronze': 'bg-yellow-100',
      'Silver': 'bg-gray-200',
      'Gold': 'bg-yellow-200',
      'Platinum': 'bg-blue-100',
      'Diamond': 'bg-purple-100',
    };
    
    return rankColors[rankName] || 'bg-gray-100';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Network Statistics</h3>
        <div className="text-sm text-gray-500 flex items-center">
          <FaCalendarAlt className="mr-1" />
          Last updated: {formatDate(statistics.lastUpdated.toString())}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FaWallet />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Downline Balance</div>
              <div className="text-2xl font-bold">{formatCurrency(statistics.totalDownlineBalance)}</div>
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
              <div className="text-2xl font-bold">{statistics.activity.activeUsersLast30Days}</div>
              <div className="text-xs text-gray-500">{statistics.activity.activeUserPercentage.toFixed(1)}% of network</div>
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
                  style={{ width: `${(count / totalUsersByLevel) * 100}%` }}
                ></div>
              </div>
              <div className="w-16 text-right text-sm">{count}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Rank Distribution */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h4 className="text-md font-medium mb-3">Rank Distribution</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {statistics.rankDistribution.map((rank) => (
              <div key={rank.rankId} className="flex items-center">
                <div className="w-24 text-sm truncate">{rank.rankName}:</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getRankColor(rank.rankName)} rounded-full`}
                    style={{ width: `${(rank.count / statistics.totalUsers) * 100}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm">{rank.count}</div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {statistics.rankDistribution.map((rank) => (
              <div key={rank.rankId} className="flex flex-col items-center p-3 border rounded-md">
                <div className={`w-full py-1 text-center rounded-t-md ${getRankColor(rank.rankName)}`}>
                  {rank.rankName}
                </div>
                <div className="text-2xl font-bold mt-1">{rank.count}</div>
                <div className="text-xs text-gray-500">
                  {((rank.count / statistics.totalUsers) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
