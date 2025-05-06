"use client";

import { useState, useEffect } from 'react';
import { 
  FaChartLine, 
  FaUsers, 
  FaUserPlus, 
  FaShoppingCart, 
  FaWallet, 
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaChartPie,
  FaChartBar,
  FaInfoCircle,
  FaFilter
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface GenealogyMetrics {
  totalMembers: number;
  activeMembers: number;
  newMembersLast30Days: number;
  totalSales: number;
  averageSalesPerMember: number;
  totalRebates: number;
  rankDistribution: {
    rankName: string;
    count: number;
  }[];
  salesByMonth: {
    month: string;
    personalSales: number;
    teamSales: number;
  }[];
  newMembersByMonth: {
    month: string;
    count: number;
  }[];
  topPerformers: {
    id: number;
    name: string;
    personalSales: number;
    teamSales: number;
    downlineCount: number;
  }[];
  networkDepth: {
    level: number;
    count: number;
  }[];
}

interface GenealogyMetricsDashboardProps {
  userId: number;
  timeRange?: 'last30days' | 'last90days' | 'last6months' | 'last12months';
}

/**
 * Genealogy Metrics Dashboard Component
 * 
 * Displays key metrics and analytics for the genealogy
 */
export default function GenealogyMetricsDashboard({
  userId,
  timeRange = 'last30days',
}: GenealogyMetricsDashboardProps) {
  // State for metrics data
  const [metrics, setMetrics] = useState<GenealogyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
  
  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams({
          userId: userId.toString(),
          timeRange: selectedTimeRange,
        });
        
        const response = await fetch(`/api/genealogy/metrics?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch genealogy metrics');
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, [userId, selectedTimeRange]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
  };
  
  // Prepare chart data for sales by month
  const salesByMonthData = {
    labels: metrics?.salesByMonth.map(item => item.month) || [],
    datasets: [
      {
        label: 'Personal Sales',
        data: metrics?.salesByMonth.map(item => item.personalSales) || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Team Sales',
        data: metrics?.salesByMonth.map(item => item.teamSales) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };
  
  // Prepare chart data for new members by month
  const newMembersByMonthData = {
    labels: metrics?.newMembersByMonth.map(item => item.month) || [],
    datasets: [
      {
        label: 'New Members',
        data: metrics?.newMembersByMonth.map(item => item.count) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };
  
  // Prepare chart data for rank distribution
  const rankDistributionData = {
    labels: metrics?.rankDistribution.map(item => item.rankName) || [],
    datasets: [
      {
        label: 'Members',
        data: metrics?.rankDistribution.map(item => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare chart data for network depth
  const networkDepthData = {
    labels: metrics?.networkDepth.map(item => `Level ${item.level}`) || [],
    datasets: [
      {
        label: 'Members',
        data: metrics?.networkDepth.map(item => item.count) || [],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };
  
  // Loading state
  if (loading && !metrics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading metrics data...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-red-800 font-medium flex items-center">
            <FaExclamationTriangle className="mr-2" />
            Error loading metrics data
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FaChartLine className="mr-2 text-blue-500" />
          Genealogy Metrics Dashboard
        </h2>
        
        {/* Time Range Filter */}
        <div className="flex items-center">
          <FaCalendarAlt className="text-gray-500 mr-2" />
          <select
            value={selectedTimeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="last6months">Last 6 Months</option>
            <option value="last12months">Last 12 Months</option>
          </select>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaUsers className="text-blue-500 mr-2" />
            <h3 className="font-medium">Total Members</h3>
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics?.totalMembers || 0)}</div>
          <div className="text-sm text-gray-500">
            {formatNumber(metrics?.activeMembers || 0)} active members
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaUserPlus className="text-green-500 mr-2" />
            <h3 className="font-medium">New Members</h3>
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics?.newMembersLast30Days || 0)}</div>
          <div className="text-sm text-gray-500">
            in the last 30 days
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaShoppingCart className="text-yellow-500 mr-2" />
            <h3 className="font-medium">Total Sales</h3>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.totalSales || 0)}</div>
          <div className="text-sm text-gray-500">
            Avg: {formatCurrency(metrics?.averageSalesPerMember || 0)} per member
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaWallet className="text-purple-500 mr-2" />
            <h3 className="font-medium">Total Rebates</h3>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRebates || 0)}</div>
          <div className="text-sm text-gray-500">
            distributed to members
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales by Month */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-4 flex items-center">
            <FaChartLine className="text-blue-500 mr-2" />
            Sales by Month
          </h3>
          <div className="h-64">
            <Line data={salesByMonthData} options={chartOptions} />
          </div>
        </div>
        
        {/* New Members by Month */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-4 flex items-center">
            <FaChartBar className="text-green-500 mr-2" />
            New Members by Month
          </h3>
          <div className="h-64">
            <Bar data={newMembersByMonthData} options={chartOptions} />
          </div>
        </div>
        
        {/* Rank Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-4 flex items-center">
            <FaChartPie className="text-yellow-500 mr-2" />
            Rank Distribution
          </h3>
          <div className="h-64">
            <Pie data={rankDistributionData} options={chartOptions} />
          </div>
        </div>
        
        {/* Network Depth */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-4 flex items-center">
            <FaChartBar className="text-purple-500 mr-2" />
            Network Depth
          </h3>
          <div className="h-64">
            <Bar data={networkDepthData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Top Performers */}
      <div className="mb-6">
        <h3 className="font-medium mb-4 flex items-center">
          <FaUsers className="text-blue-500 mr-2" />
          Top Performers
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal Sales
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Sales
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downline Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics?.topPerformers.map((performer) => (
                <tr key={performer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                    <div className="text-sm text-gray-500">ID: {performer.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(performer.personalSales)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(performer.teamSales)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatNumber(performer.downlineCount)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Insights */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2 flex items-center">
          <FaInfoCircle className="text-blue-500 mr-2" />
          Insights
        </h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
          <li>Your network has grown by {formatNumber(metrics?.newMembersLast30Days || 0)} members in the last 30 days.</li>
          <li>The most common rank in your network is {metrics?.rankDistribution[0]?.rankName || 'N/A'}.</li>
          <li>Your network extends to {metrics?.networkDepth.length || 0} levels deep.</li>
          <li>Your top performer generated {formatCurrency(metrics?.topPerformers[0]?.teamSales || 0)} in team sales.</li>
        </ul>
      </div>
    </div>
  );
}
