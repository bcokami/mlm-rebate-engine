import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlySalesChartProps {
  title?: string;
  currentYearData?: number[];
  previousYearData?: number[];
  labels?: string[];
}

const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({
  title = "Monthly Sales",
  currentYearData = [],
  previousYearData = [],
  labels = []
}) => {
  const [timeRange, setTimeRange] = useState<'current' | 'previous'>('current');
  
  // Default data if none provided
  const defaultLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const defaultCurrentYearData = [12500, 15000, 18000, 16500, 21000, 22500, 25000, 23000, 27000, 28500, 30000, 32500];
  const defaultPreviousYearData = [10000, 12000, 14500, 13000, 17500, 19000, 21500, 20000, 23500, 25000, 26500, 28000];
  
  // Use provided data or defaults
  const chartLabels = labels.length > 0 ? labels : defaultLabels;
  const currentData = currentYearData.length > 0 ? currentYearData : defaultCurrentYearData;
  const previousData = previousYearData.length > 0 ? previousYearData : defaultPreviousYearData;
  
  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: timeRange === 'current' ? 'This Year' : 'Last Year',
        data: timeRange === 'current' ? currentData : previousData,
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-PH', { 
                style: 'currency', 
                currency: 'PHP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(243, 244, 246, 1)',
        },
        ticks: {
          color: '#6b7280',
          callback: function(value: any) {
            return '₱' + value.toLocaleString();
          }
        },
        beginAtZero: true,
      },
    },
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'current' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setTimeRange('current')}
          >
            This Year
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'previous' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setTimeRange('previous')}
          >
            Last Year
          </button>
        </div>
      </div>
      <div className="h-80">
        <Line data={data} options={options as any} />
      </div>
    </div>
  );
};

export default MonthlySalesChart;
