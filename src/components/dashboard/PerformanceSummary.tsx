"use client";

import { useState } from 'react';
import { FaChartLine, FaArrowUp, FaArrowDown, FaEquals, FaInfoCircle } from 'react-icons/fa';

interface PerformanceMetric {
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percentage';
  info?: string;
}

interface PerformanceSummaryProps {
  metrics: PerformanceMetric[];
  period?: 'week' | 'month' | 'year';
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  metrics = [],
  period = 'month'
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>(period);
  
  // Format value based on type
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };
  
  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Get change indicator component
  const getChangeIndicator = (current: number, previous: number) => {
    const change = calculateChange(current, previous);
    const absChange = Math.abs(change).toFixed(1);
    
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <FaArrowUp className="mr-1" />
          <span>{absChange}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <FaArrowDown className="mr-1" />
          <span>{absChange}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <FaEquals className="mr-1" />
          <span>0%</span>
        </div>
      );
    }
  };
  
  // Generate sample metrics if none provided
  const getSampleMetrics = (): PerformanceMetric[] => {
    return [
      {
        label: 'Total Earnings',
        value: 12500,
        previousValue: 10800,
        format: 'currency',
        info: 'Sum of all rebates and bonuses earned'
      },
      {
        label: 'Group Volume',
        value: 45000,
        previousValue: 38000,
        format: 'number',
        info: 'Total Point Value (PV) from your entire downline'
      },
      {
        label: 'Personal Volume',
        value: 5200,
        previousValue: 4800,
        format: 'number',
        info: 'Point Value (PV) from your personal purchases'
      },
      {
        label: 'Conversion Rate',
        value: 68,
        previousValue: 62,
        format: 'percentage',
        info: 'Percentage of referrals who became distributors'
      }
    ];
  };
  
  // Use provided metrics or sample data
  const displayMetrics = metrics.length > 0 ? metrics : getSampleMetrics();
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-700 flex items-center">
          <FaChartLine className="mr-2 text-green-500" /> Performance Summary
        </h3>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
          className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-500 font-medium">{metric.label}</p>
                {metric.info && (
                  <div className="group relative">
                    <FaInfoCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute right-0 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                      {metric.info}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {formatValue(metric.value, metric.format)}
              </p>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 mr-2">vs previous {selectedPeriod}:</span>
                {getChangeIndicator(metric.value, metric.previousValue)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceSummary;
