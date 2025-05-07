"use client";

import { useState, useEffect } from 'react';
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
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaChartLine, FaChartBar, FaChartPie, FaCalendarAlt } from 'react-icons/fa';

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
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

interface DashboardChartsProps {
  rebateData?: number[];
  salesData?: number[];
  rankDistribution?: { [key: string]: number };
  timeframe?: 'week' | 'month' | 'year';
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  rebateData = [],
  salesData = [],
  rankDistribution = {},
  timeframe = 'month'
}) => {
  const [activeTab, setActiveTab] = useState<'rebates' | 'sales' | 'ranks'>('rebates');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>(timeframe);
  
  // Generate labels based on timeframe
  const generateLabels = () => {
    const today = new Date();
    const labels: string[] = [];
    
    if (selectedTimeframe === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = today.getDay();
      
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (currentDay - i + 7) % 7;
        labels.push(days[dayIndex]);
      }
    } else if (selectedTimeframe === 'month') {
      const currentDate = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      // Show last 30 days or days in current month
      const numDays = Math.min(30, daysInMonth);
      
      for (let i = numDays - 1; i >= 0; i--) {
        const day = ((currentDate - i + daysInMonth) % daysInMonth) || daysInMonth;
        labels.push(`${day}`);
      }
    } else if (selectedTimeframe === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = today.getMonth();
      
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        labels.push(months[monthIndex]);
      }
    }
    
    return labels;
  };
  
  // Generate sample data if real data is not provided
  const generateSampleData = (length: number, min: number, max: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  };
  
  // Prepare chart data
  const prepareChartData = (): ChartData => {
    const labels = generateLabels();
    const dataLength = labels.length;
    
    // Use provided data or generate sample data
    const rebates = rebateData.length === dataLength 
      ? rebateData 
      : generateSampleData(dataLength, 100, 1000);
    
    const sales = salesData.length === dataLength 
      ? salesData 
      : generateSampleData(dataLength, 500, 2000);
    
    // Prepare data based on active tab
    if (activeTab === 'rebates') {
      return {
        labels,
        datasets: [
          {
            label: 'Rebates (₱)',
            data: rebates,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ]
      };
    } else if (activeTab === 'sales') {
      return {
        labels,
        datasets: [
          {
            label: 'Sales (₱)',
            data: sales,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
          }
        ]
      };
    } else {
      // Rank distribution
      const ranks = Object.keys(rankDistribution).length > 0 
        ? rankDistribution 
        : {
            'Distributor': 45,
            'Silver': 25,
            'Gold': 15,
            'Platinum': 10,
            'Diamond': 5
          };
      
      return {
        labels: Object.keys(ranks),
        datasets: [
          {
            label: 'Members by Rank',
            data: Object.values(ranks),
            backgroundColor: [
              'rgba(107, 114, 128, 0.7)',
              'rgba(192, 192, 192, 0.7)',
              'rgba(255, 215, 0, 0.7)',
              'rgba(229, 231, 235, 0.7)',
              'rgba(96, 165, 250, 0.7)'
            ],
            borderWidth: 1
          }
        ]
      };
    }
  };
  
  // Chart options
  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== undefined) {
                label += '₱' + context.parsed.y.toLocaleString();
              } else if (context.parsed !== undefined) {
                label += context.parsed.toLocaleString();
              }
              return label;
            }
          }
        }
      },
    };
    
    if (activeTab === 'ranks') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            callbacks: {
              label: function(context: any) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== undefined) {
                  label += context.parsed + ' members';
                }
                return label;
              }
            }
          }
        }
      };
    }
    
    return baseOptions;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="flex space-x-2 mb-4 sm:mb-0">
          <button
            onClick={() => setActiveTab('rebates')}
            className={`px-4 py-2 rounded-md flex items-center ${
              activeTab === 'rebates'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaChartLine className="mr-2" /> Rebates
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-md flex items-center ${
              activeTab === 'sales'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaChartBar className="mr-2" /> Sales
          </button>
          <button
            onClick={() => setActiveTab('ranks')}
            className={`px-4 py-2 rounded-md flex items-center ${
              activeTab === 'ranks'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaChartPie className="mr-2" /> Ranks
          </button>
        </div>
        
        <div className="flex items-center bg-gray-100 rounded-md">
          <FaCalendarAlt className="ml-3 text-gray-500" />
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as 'week' | 'month' | 'year')}
            className="bg-transparent border-none py-2 px-3 focus:ring-0 text-sm"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      
      <div className="h-80">
        {activeTab === 'rebates' && (
          <Line data={prepareChartData()} options={getChartOptions()} />
        )}
        {activeTab === 'sales' && (
          <Bar data={prepareChartData()} options={getChartOptions()} />
        )}
        {activeTab === 'ranks' && (
          <Doughnut data={prepareChartData()} options={getChartOptions()} />
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
