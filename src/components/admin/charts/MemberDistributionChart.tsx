import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface MemberDistributionChartProps {
  title?: string;
  data?: {
    label: string;
    value: number;
    color: string;
  }[];
}

const MemberDistributionChart: React.FC<MemberDistributionChartProps> = ({
  title = "Member Distribution",
  data = []
}) => {
  // Default data if none provided
  const defaultData = [
    { label: 'Starter', value: 120, color: '#94a3b8' },
    { label: 'Bronze', value: 85, color: '#ca8a04' },
    { label: 'Silver', value: 65, color: '#94a3b8' },
    { label: 'Gold', value: 40, color: '#eab308' },
    { label: 'Platinum', value: 25, color: '#0ea5e9' },
    { label: 'Diamond', value: 10, color: '#6366f1' }
  ];
  
  // Use provided data or defaults
  const chartData = data.length > 0 ? data : defaultData;
  
  const pieData = {
    labels: chartData.map(item => item.label),
    datasets: [
      {
        data: chartData.map(item => item.value),
        backgroundColor: chartData.map(item => item.color),
        borderColor: chartData.map(() => '#ffffff'),
        borderWidth: 2,
        hoverOffset: 15,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12,
          },
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((acc: number, val: number) => acc + val, 0);
                const percentage = Math.round((value / total) * 100);
                
                return {
                  text: `${label}: ${percentage}% (${value})`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
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
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}% (${value} members)`;
          }
        }
      },
    },
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="h-80 relative">
        <Pie data={pieData} options={options as any} />
      </div>
    </div>
  );
};

export default MemberDistributionChart;
