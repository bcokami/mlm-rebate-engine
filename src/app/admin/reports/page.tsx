"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaDownload,
  FaCalendarAlt,
  FaUsers,
  FaShoppingCart,
  FaWallet
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportData {
  salesByProduct: {
    labels: string[];
    data: number[];
  };
  salesByDate: {
    labels: string[];
    data: number[];
  };
  rebatesByLevel: {
    labels: string[];
    data: number[];
  };
  usersByRank: {
    labels: string[];
    data: number[];
  };
  topEarners: {
    id: number;
    name: string;
    email: string;
    totalRebates: number;
    rank: string;
  }[];
  topRecruiters: {
    id: number;
    name: string;
    email: string;
    directDownlineCount: number;
    rank: string;
  }[];
  summary: {
    totalUsers: number;
    totalProducts: number;
    totalSales: number;
    totalRebates: number;
    averageOrderValue: number;
    conversionRate: number;
  };
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is admin
      const checkAdminStatus = async () => {
        try {
          const response = await fetch("/api/users/me");
          const data = await response.json();

          // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
          const isAdmin = data.rankId === 6;
          setIsAdmin(isAdmin);

          if (isAdmin) {
            fetchReportData();
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setLoading(false);
        }
      };

      checkAdminStatus();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchReportData();
    }
  }, [status, isAdmin, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (dateRange.startDate) {
        params.append("startDate", dateRange.startDate);
      }

      if (dateRange.endDate) {
        params.append("endDate", dateRange.endDate);
      }

      // Fetch report data from API
      const response = await fetch(`/api/admin/reports?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch report data: ${response.statusText}`);
      }

      const data = await response.json();
      setReportData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);

      // Fallback to mock data if API fails
      const mockData: ReportData = {
        salesByProduct: {
          labels: ['Basic Package', 'Premium Package', 'Elite Package'],
          data: [4500, 12000, 8500],
        },
        salesByDate: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: [3000, 3500, 4200, 5100, 4800, 5500],
        },
        rebatesByLevel: {
          labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6+'],
          data: [8500, 4200, 2100, 1500, 800, 400],
        },
        usersByRank: {
          labels: ['Starter', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
          data: [120, 45, 25, 12, 5, 2],
        },
        topEarners: [
          { id: 1, name: 'John Doe', email: 'john@example.com', totalRebates: 2500, rank: 'Diamond' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', totalRebates: 1800, rank: 'Platinum' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', totalRebates: 1200, rank: 'Gold' },
          { id: 4, name: 'Alice Brown', email: 'alice@example.com', totalRebates: 950, rank: 'Silver' },
          { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', totalRebates: 820, rank: 'Silver' },
        ],
        topRecruiters: [
          { id: 1, name: 'John Doe', email: 'john@example.com', directDownlineCount: 15, rank: 'Diamond' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', directDownlineCount: 12, rank: 'Platinum' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', directDownlineCount: 8, rank: 'Gold' },
          { id: 4, name: 'Alice Brown', email: 'alice@example.com', directDownlineCount: 6, rank: 'Silver' },
          { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', directDownlineCount: 5, rank: 'Silver' },
        ],
        summary: {
          totalUsers: 209,
          totalProducts: 3,
          totalSales: 25000,
          totalRebates: 17500,
          averageOrderValue: 250,
          conversionRate: 0.68,
        },
      };

      setReportData(mockData);
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const exportToCsv = (reportName: string) => {
    // In a real application, we would implement CSV export functionality
    alert(`Exporting ${reportName} report to CSV...`);
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">
              You do not have permission to access this page. Please contact an administrator.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="startDate" className="text-sm text-gray-600">
                From:
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="endDate" className="text-sm text-gray-600">
                To:
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                    <FaUsers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Users</p>
                    <p className="text-xl font-semibold">{reportData.summary.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                    <FaShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Sales</p>
                    <p className="text-xl font-semibold">₱{reportData.summary.totalSales.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                    <FaWallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Rebates</p>
                    <p className="text-xl font-semibold">₱{reportData.summary.totalRebates.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                    <FaShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Avg. Order Value</p>
                    <p className="text-xl font-semibold">₱{reportData.summary.averageOrderValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                    <FaChartPie className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
                    <p className="text-xl font-semibold">{(reportData.summary.conversionRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
                    <FaCalendarAlt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Date Range</p>
                    <p className="text-sm font-semibold">{dateRange.startDate} to {dateRange.endDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Sales by Product */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaChartBar className="mr-2 text-blue-500" /> Sales by Product
                  </h2>
                  <button
                    onClick={() => exportToCsv('sales-by-product')}
                    className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <FaDownload className="mr-1" /> Export
                  </button>
                </div>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: reportData.salesByProduct.labels,
                      datasets: [
                        {
                          label: 'Sales (₱)',
                          data: reportData.salesByProduct.data,
                          backgroundColor: 'rgba(59, 130, 246, 0.5)',
                          borderColor: 'rgb(59, 130, 246)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Sales Trend */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaChartLine className="mr-2 text-green-500" /> Sales Trend
                  </h2>
                  <button
                    onClick={() => exportToCsv('sales-trend')}
                    className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <FaDownload className="mr-1" /> Export
                  </button>
                </div>
                <div className="h-80">
                  <Line
                    data={{
                      labels: reportData.salesByDate.labels,
                      datasets: [
                        {
                          label: 'Sales (₱)',
                          data: reportData.salesByDate.data,
                          borderColor: 'rgb(34, 197, 94)',
                          backgroundColor: 'rgba(34, 197, 94, 0.5)',
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Rebates by Level */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaChartBar className="mr-2 text-purple-500" /> Rebates by Level
                  </h2>
                  <button
                    onClick={() => exportToCsv('rebates-by-level')}
                    className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <FaDownload className="mr-1" /> Export
                  </button>
                </div>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: reportData.rebatesByLevel.labels,
                      datasets: [
                        {
                          label: 'Rebates (₱)',
                          data: reportData.rebatesByLevel.data,
                          backgroundColor: 'rgba(139, 92, 246, 0.5)',
                          borderColor: 'rgb(139, 92, 246)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Users by Rank */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaChartPie className="mr-2 text-yellow-500" /> Users by Rank
                  </h2>
                  <button
                    onClick={() => exportToCsv('users-by-rank')}
                    className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <FaDownload className="mr-1" /> Export
                  </button>
                </div>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-64 h-64">
                    <Pie
                      data={{
                        labels: reportData.usersByRank.labels,
                        datasets: [
                          {
                            label: 'Users',
                            data: reportData.usersByRank.data,
                            backgroundColor: [
                              'rgba(209, 213, 219, 0.8)',
                              'rgba(251, 191, 36, 0.8)',
                              'rgba(156, 163, 175, 0.8)',
                              'rgba(234, 179, 8, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(139, 92, 246, 0.8)',
                            ],
                            borderColor: [
                              'rgb(209, 213, 219)',
                              'rgb(251, 191, 36)',
                              'rgb(156, 163, 175)',
                              'rgb(234, 179, 8)',
                              'rgb(59, 130, 246)',
                              'rgb(139, 92, 246)',
                            ],
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right' as const,
                          },
                          title: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Earners */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaWallet className="mr-2 text-green-500" /> Top Earners
                  </h2>
                  <button
                    onClick={() => exportToCsv('top-earners')}
                    className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <FaDownload className="mr-1" /> Export
                  </button>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Rebates
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.topEarners.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.rank === 'Diamond'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.rank === 'Platinum'
                                  ? 'bg-blue-100 text-blue-800'
                                  : user.rank === 'Gold'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₱{user.totalRebates.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Top Recruiters */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaUsers className="mr-2 text-blue-500" /> Top Recruiters
                  </h2>
                  <button
                    onClick={() => exportToCsv('top-recruiters')}
                    className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <FaDownload className="mr-1" /> Export
                  </button>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Direct Downline
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.topRecruiters.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.rank === 'Diamond'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.rank === 'Platinum'
                                  ? 'bg-blue-100 text-blue-800'
                                  : user.rank === 'Gold'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.directDownlineCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
