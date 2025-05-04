"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProductSalesHistory {
  id: number;
  productId: number;
  year: number;
  month: number;
  quantity: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductSalesChartProps {
  salesHistory: ProductSalesHistory[];
}

export default function ProductSalesChart({ salesHistory }: ProductSalesChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [chartData, setChartData] = useState<any>(null);
  
  useEffect(() => {
    if (salesHistory.length === 0) return;
    
    // Sort sales history by date
    const sortedHistory = [...salesHistory].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Extract labels (months)
    const labels = sortedHistory.map(history => {
      const date = new Date(history.year, history.month - 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    });
    
    // Extract data
    const quantityData = sortedHistory.map(history => history.quantity);
    const revenueData = sortedHistory.map(history => history.revenue);
    
    // Calculate total revenue and quantity
    const totalRevenue = revenueData.reduce((sum, value) => sum + value, 0);
    const totalQuantity = quantityData.reduce((sum, value) => sum + value, 0);
    
    // Create chart data
    const data = {
      labels,
      datasets: [
        {
          label: 'Quantity',
          data: quantityData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Revenue (₱)',
          data: revenueData,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
    };
    
    setChartData({
      data,
      totalRevenue,
      totalQuantity,
    });
  }, [salesHistory]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  if (!chartData) {
    return null;
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Total Units Sold</h3>
          <p className="text-2xl font-bold text-blue-900">{chartData.totalQuantity}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(chartData.totalRevenue)}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Sales Performance</h3>
        <div className="h-80">
          <Bar
            data={chartData.data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Quantity',
                  },
                  beginAtZero: true,
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Revenue (₱)',
                  },
                  beginAtZero: true,
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'top',
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.dataset.yAxisID === 'y1') {
                        label += formatCurrency(context.parsed.y);
                      } else {
                        label += context.parsed.y;
                      }
                      return label;
                    }
                  }
                }
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
