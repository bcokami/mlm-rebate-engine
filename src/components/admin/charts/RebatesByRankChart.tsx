import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RebatesByRankChartProps {
  title?: string;
  data?: {
    rank: string;
    amount: number;
    color: string;
  }[];
}

const RebatesByRankChart: React.FC<RebatesByRankChartProps> = ({
  title = "Rebates by Rank",
  data = []
}) => {
  // Default data if none provided
  const defaultData = [
    { rank: 'Starter', amount: 25000, color: 'rgba(148, 163, 184, 0.8)' },
    { rank: 'Bronze', amount: 45000, color: 'rgba(202, 138, 4, 0.8)' },
    { rank: 'Silver', amount: 75000, color: 'rgba(148, 163, 184, 0.8)' },
    { rank: 'Gold', amount: 120000, color: 'rgba(234, 179, 8, 0.8)' },
    { rank: 'Platinum', amount: 180000, color: 'rgba(14, 165, 233, 0.8)' },
    { rank: 'Diamond', amount: 250000, color: 'rgba(99, 102, 241, 0.8)' }
  ];
  
  // Use provided data or defaults
  const chartData = data.length > 0 ? data : defaultData;
  
  const barData = {
    labels: chartData.map(item => item.rank),
    datasets: [
      {
        label: 'Rebate Amount',
        data: chartData.map(item => item.amount),
        backgroundColor: chartData.map(item => item.color),
        borderColor: chartData.map(item => item.color.replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 30,
      },
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
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="h-80">
        <Bar data={barData} options={options as any} />
      </div>
    </div>
  );
};

export default RebatesByRankChart;
