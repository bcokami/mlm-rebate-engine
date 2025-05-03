"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import {
  FaWallet,
  FaFilter,
  FaSearch,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaSync,
  FaDownload,
  FaChartLine,
  FaCalendarAlt,
  FaUser,
  FaExclamationTriangle
} from "react-icons/fa";

interface Rebate {
  id: number;
  amount: number;
  percentage: number;
  level: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
  generator: {
    id: number;
    name: string;
    email: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
  };
  purchase: {
    id: number;
    totalAmount: number;
    product: {
      id: number;
      name: string;
    };
  };
}

interface RebateStats {
  totalRebates: number;
  totalAmount: number;
  pendingAmount: number;
  processedAmount: number;
  failedAmount: number;
  pendingCount: number;
  processedCount: number;
  failedCount: number;
}

export default function AdminRebatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rebates, setRebates] = useState<Rebate[]>([]);
  const [stats, setStats] = useState<RebateStats>({
    totalRebates: 0,
    totalAmount: 0,
    pendingAmount: 0,
    processedAmount: 0,
    failedAmount: 0,
    pendingCount: 0,
    processedCount: 0,
    failedCount: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingError, setProcessingError] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is admin
      const checkAdminStatus = async () => {
        try {
          const response = await fetch("/api/users/me");
          const data = await response.json();

          // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
          setIsAdmin(data.rankId === 6);
          
          if (data.rankId === 6) {
            fetchRebates();
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

  const fetchRebates = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      
      if (search) {
        params.append("search", search);
      }
      
      if (dateRange.startDate) {
        params.append("startDate", dateRange.startDate);
      }
      
      if (dateRange.endDate) {
        params.append("endDate", dateRange.endDate);
      }
      
      // Fetch rebates
      const response = await fetch(`/api/admin/rebates?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rebates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setRebates(data.rebates);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
      
      // Fetch stats
      const statsResponse = await fetch("/api/admin/rebates/stats");
      
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch rebate stats: ${statsResponse.statusText}`);
      }
      
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching rebates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRebates();
    }
  }, [isAdmin, page, pageSize, statusFilter, search, dateRange]);

  const handleProcessRebates = async () => {
    setProcessing(true);
    setProcessingMessage("Processing pending rebates...");
    setProcessingError("");
    
    try {
      const response = await fetch("/api/admin/rebates/process", {
        method: "POST"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process rebates");
      }
      
      const data = await response.json();
      setProcessingMessage(`Successfully processed ${data.processed} rebates`);
      
      // Refresh rebates list
      fetchRebates();
    } catch (error: any) {
      setProcessingError(error.message || "An error occurred while processing rebates");
    } finally {
      setTimeout(() => {
        setProcessing(false);
        setProcessingMessage("");
      }, 3000);
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(parseInt(e.target.value));
    setPage(1); // Reset to first page when changing page size
  };

  const exportRebates = async () => {
    try {
      // Build query parameters for export (same as current filters but without pagination)
      const params = new URLSearchParams();
      
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      
      if (search) {
        params.append("search", search);
      }
      
      if (dateRange.startDate) {
        params.append("startDate", dateRange.startDate);
      }
      
      if (dateRange.endDate) {
        params.append("endDate", dateRange.endDate);
      }
      
      params.append("export", "true");
      
      // Fetch CSV data
      const response = await fetch(`/api/admin/rebates/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to export rebates: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rebates-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      // Append to body, click and remove
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting rebates:", error);
      alert("Failed to export rebates. Please try again.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
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
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
            <FaWallet className="mr-2 text-blue-500" /> Rebate Management
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={exportRebates}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <FaDownload className="mr-2" /> Export
            </button>
            <button
              onClick={handleProcessRebates}
              disabled={processing || stats.pendingCount === 0}
              className={`px-4 py-2 text-white rounded-md flex items-center ${
                processing || stats.pendingCount === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {processing ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSync className="mr-2" />
              )}
              Process Rebates
            </button>
          </div>
        </div>

        {processingMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
            {processingMessage}
          </div>
        )}

        {processingError && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {processingError}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaWallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Rebates</p>
                <p className="text-xl font-semibold">₱{stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">{stats.totalRebates} transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <FaCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Processed</p>
                <p className="text-xl font-semibold">₱{stats.processedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">{stats.processedCount} transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                <FaSync className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-xl font-semibold">₱{stats.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">{stats.pendingCount} transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                <FaExclamationTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Failed</p>
                <p className="text-xl font-semibold">₱{stats.failedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">{stats.failedCount} transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by user name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="failed">Failed</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <FaFilter className="mr-2" />
                {showFilters ? "Hide Filters" : "More Filters"}
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <div className="flex items-center">
                    <div className="absolute pl-3 pointer-events-none">
                      <FaCalendarAlt className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateRangeChange}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <div className="flex items-center">
                    <div className="absolute pl-3 pointer-events-none">
                      <FaCalendarAlt className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateRangeChange}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setDateRange({ startDate: "", endDate: "" });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rebates Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Rebate Transactions</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin text-blue-500 mr-2" />
                <span>Loading rebates...</span>
              </div>
            ) : rebates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receiver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rebates.map((rebate) => (
                      <tr key={rebate.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rebate.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <FaUser className="text-gray-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {rebate.generator.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {rebate.generator.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <FaUser className="text-gray-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {rebate.receiver.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {rebate.receiver.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rebate.purchase.product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Level {rebate.level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ₱{rebate.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rebate.status === "processed"
                                ? "bg-green-100 text-green-800"
                                : rebate.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {rebate.status.charAt(0).toUpperCase() +
                              rebate.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rebate.processedAt
                            ? new Date(rebate.processedAt).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No rebates found matching your criteria.</p>
            )}
          </div>
          
          {/* Pagination */}
          {rebates.length > 0 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">
                  Rows per page:
                </span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  {page} of {totalPages} pages
                  ({totalItems} total rebates)
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
