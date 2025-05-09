"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import VirtualizedList from "@/components/common/VirtualizedList";
import {
  FaChartLine, FaWallet, FaFilter, FaCalendarAlt,
  FaChevronDown, FaChevronUp, FaSpinner, FaCheck,
  FaTimes, FaSync, FaUser
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

export default function RebatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rebates, setRebates] = useState<Rebate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, processed, failed

  // Additional state
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

  // Date filter
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

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

  // Function to fetch rebates data
  const fetchRebates = useCallback(async () => {
    // Build query parameters
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    if (filter !== "all") {
      params.append("status", filter);
    }

    if (dateRange.startDate) {
      params.append("startDate", dateRange.startDate);
    }

    if (dateRange.endDate) {
      params.append("endDate", dateRange.endDate);
    }

    const response = await fetch(`/api/rebates?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch rebates: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.rebates && Array.isArray(data.rebates)) {
      return {
        rebates: data.rebates,
        pagination: {
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems
        }
      };
    } else {
      // Handle legacy API response format
      return {
        rebates: Array.isArray(data) ? data : [],
        pagination: {
          totalPages: 1,
          totalItems: Array.isArray(data) ? data.length : 0
        }
      };
    }
  }, [filter, page, pageSize, dateRange]);

  // Function to fetch rebate stats
  const fetchRebateStats = useCallback(async () => {
    const response = await fetch("/api/rebates/stats");

    if (!response.ok) {
      throw new Error(`Failed to fetch rebate stats: ${response.statusText}`);
    }

    return await response.json();
  }, []);

  // Use React Query for data fetching
  const {
    data: rebatesData,
    isLoading: isRebatesLoading,
    error: rebatesError
  } = useQuery({
    queryKey: ['rebates', filter, page, pageSize, dateRange],
    queryFn: fetchRebates,
    enabled: status === 'authenticated',
    staleTime: 60 * 1000, // 1 minute
    keepPreviousData: true
  });

  const {
    data: statsData,
    isLoading: isStatsLoading
  } = useQuery({
    queryKey: ['rebateStats'],
    queryFn: fetchRebateStats,
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update state from query results
  useEffect(() => {
    if (rebatesData) {
      setRebates(rebatesData.rebates);
      setTotalPages(rebatesData.pagination.totalPages);
      setTotalItems(rebatesData.pagination.totalItems);
    }
  }, [rebatesData]);

  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
  }, [statsData]);

  // Update loading state
  useEffect(() => {
    setLoading(isRebatesLoading || isStatsLoading);
  }, [isRebatesLoading, isStatsLoading]);

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

  // Calculate total rebates
  const totalRebates = rebates.reduce((sum, rebate) => sum + rebate.amount, 0);

  // Group rebates by level
  const rebatesByLevel = rebates.reduce((acc, rebate) => {
    acc[rebate.level] = (acc[rebate.level] || 0) + rebate.amount;
    return acc;
  }, {} as Record<number, number>);

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-semibold mb-6 flex items-center">
          <FaWallet className="mr-2 text-blue-500" /> Rebate Earnings
        </h1>

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
                <FaTimes className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Failed</p>
                <p className="text-xl font-semibold">₱{stats.failedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">{stats.failedCount} transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Level Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2 text-blue-500" /> Earnings by Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(rebatesByLevel)
              .sort(([levelA], [levelB]) => parseInt(levelA) - parseInt(levelB))
              .map(([level, amount]) => (
                <div key={level} className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500 font-medium">Level {level}</p>
                  <p className="text-xl font-semibold">₱{amount.toFixed(2)}</p>
                </div>
              ))}
            {Object.keys(rebatesByLevel).length === 0 && (
              <div className="col-span-5 text-center py-4 text-gray-500">
                No rebate data available for level breakdown
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="failed">Failed</option>
              </select>

              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <FaFilter className="mr-2" />
                {showDateFilter ? "Hide Date Filter" : "Date Filter"}
                {showDateFilter ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
              </button>
            </div>
          </div>

          {showDateFilter && (
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
                    setFilter("all");
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

        {/* Rebate Transactions */}
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
              <div>
                {/* Table header */}
                <div className="min-w-full border-b border-gray-200 mb-2">
                  <div className="grid grid-cols-8 gap-2">
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </div>
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </div>
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </div>
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </div>
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </div>
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </div>
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </div>
                    <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed At
                    </div>
                  </div>
                </div>

                {/* Virtualized list of rebates */}
                <VirtualizedList
                  items={rebates}
                  height={500}
                  itemHeight={70}
                  overscan={5}
                  keyExtractor={(rebate) => rebate.id}
                  renderItem={(rebate) => (
                    <div className="grid grid-cols-8 gap-2 border-b border-gray-200 hover:bg-gray-50">
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rebate.createdAt).toLocaleDateString()}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <FaUser className="text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {rebate.generator.name}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rebate.purchase.product.name}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Level {rebate.level}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rebate.percentage}%
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₱{rebate.amount.toFixed(2)}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap">
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
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rebate.processedAt
                          ? new Date(rebate.processedAt).toLocaleString()
                          : "-"}
                      </div>
                    </div>
                  )}
                  emptyComponent={
                    <p className="text-gray-500 text-center py-8">
                      No rebates found matching your criteria.
                    </p>
                  }
                  loadingComponent={
                    <div className="flex items-center justify-center h-64">
                      <FaSpinner className="animate-spin text-blue-500 mr-2" />
                      <span>Loading rebates...</span>
                    </div>
                  }
                  onEndReached={() => {
                    if (page < totalPages) {
                      handlePageChange(page + 1);
                    }
                  }}
                  onEndReachedThreshold={0.8}
                />
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No rebates found matching your criteria.
              </p>
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
