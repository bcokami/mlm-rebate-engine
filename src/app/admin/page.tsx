"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import Image from "next/image";
import StatsCard from "@/components/admin/StatsCard";
import TopEarnersTable from "@/components/admin/TopEarnersTable";
import ActivityFeed from "@/components/admin/ActivityFeed";
import DashboardFilters from "@/components/admin/DashboardFilters";
import GroupVolumeTracker from "@/components/admin/GroupVolumeTracker";
import MonthlySalesChart from "@/components/admin/charts/MonthlySalesChart";
import MemberDistributionChart from "@/components/admin/charts/MemberDistributionChart";
import RebatesByRankChart from "@/components/admin/charts/RebatesByRankChart";
import QuickAccessCard from "@/components/admin/QuickAccessCard";
import {
  FaUsers, FaShoppingCart, FaWallet, FaChartLine, FaCog,
  FaUsersCog, FaPercentage, FaDollarSign, FaSpinner,
  FaArrowUp, FaArrowDown, FaExclamationTriangle, FaCalendarAlt,
  FaUserPlus, FaMoneyBillWave, FaClipboardList, FaTrophy,
  FaSearch, FaFilter, FaEllipsisH, FaEye, FaEdit, FaTrash,
  FaSync, FaChartPie, FaChevronDown
} from "react-icons/fa";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalPurchases: 0,
    totalRebates: 0,
    pendingRebates: 0,
    processedRebates: 0,
    totalRebateAmount: 0
  });
  const [recentActivity, setRecentActivity] = useState({
    users: [],
    purchases: []
  });
  const [topPerformers, setTopPerformers] = useState({
    products: [],
    distributors: []
  });
  const [error, setError] = useState("");

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
          const hasAdminAccess = data.rankId === 6;
          setIsAdmin(hasAdminAccess);

          if (hasAdminAccess) {
            fetchAdminStats();
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setError("Failed to verify admin access. Please try again.");
          setLoading(false);
        }
      };

      checkAdminStatus();
    }
  }, [status]);

  // Fetch admin dashboard stats
  const fetchAdminStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/stats");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch admin statistics");
      }

      const data = await response.json();

      // Update state with fetched data
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
      setTopPerformers(data.topPerformers);

      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      setError(error.message || "Failed to load admin dashboard data");
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <FaSpinner className="animate-spin text-blue-500 text-4xl mb-4" />
          <div className="text-xl">Loading Admin Dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You do not have permission to access the admin panel.
              Admin access is restricted to Diamond rank members only.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchAdminStats}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-semibold">Extreme Life Herbal Product Rewards - Admin</h1>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={fetchAdminStats}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              disabled={loading}
            >
              <FaSpinner className={`mr-2 ${loading ? 'animate-spin' : 'hidden'}`} />
              <FaSync className={`mr-2 ${!loading ? '' : 'hidden'}`} />
              Refresh Data
            </button>

            <div className="relative">
              <button
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                onClick={() => {
                  // Toggle test mode in a real implementation
                  alert('Test mode toggle would be implemented here');
                }}
              >
                <FaUsersCog className="mr-2" />
                Live Data
                <FaChevronDown className="ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Filters */}
        <DashboardFilters
          onFilterChange={(filters) => {
            console.log('Filters changed:', filters);
            // In a real implementation, we would fetch filtered data here
          }}
        />

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Members"
            value={stats.totalUsers}
            icon={<FaUsers className="h-6 w-6" />}
            borderColor="border-blue-500"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-500"
            percentageChange={12}
            footer="From previous period"
          />

          <StatsCard
            title="Active Products"
            value={stats.totalProducts}
            icon={<FaShoppingCart className="h-6 w-6" />}
            borderColor="border-green-500"
            iconBgColor="bg-green-100"
            iconColor="text-green-500"
            percentageChange={5}
            footer="From previous period"
          />

          <StatsCard
            title="Monthly Sales"
            value={`₱${(stats.totalPurchases * 1200).toLocaleString()}`}
            icon={<FaMoneyBillWave className="h-6 w-6" />}
            borderColor="border-purple-500"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-500"
            percentageChange={-3}
            footer="Compared to last month"
          />

          <StatsCard
            title="Total Rebates"
            value={`₱${stats.totalRebateAmount.toLocaleString()}`}
            icon={<FaChartLine className="h-6 w-6" />}
            borderColor="border-orange-500"
            iconBgColor="bg-orange-100"
            iconColor="text-orange-500"
            percentageChange={8}
            footer={`${stats.pendingRebates} pending / ${stats.processedRebates} processed`}
          />
        </div>

        {/* Charts and Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          <div className="lg:col-span-2">
            <MonthlySalesChart />
          </div>

          {/* Member Distribution Chart */}
          <MemberDistributionChart />
        </div>

        {/* Additional Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rebates by Rank Chart */}
          <RebatesByRankChart />

          {/* Group Volume Tracker */}
          <GroupVolumeTracker />
        </div>

        {/* Recent Activity and Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Earners */}
          <TopEarnersTable
            distributors={topPerformers.distributors || []}
            title="Top Distributors"
            viewAllLink="/admin/reports"
          />

          {/* Recent Activity */}
          <ActivityFeed
            users={recentActivity.users || []}
            purchases={recentActivity.purchases || []}
            title="Recent Activity"
          />
        </div>

        {/* Quick Access Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAccessCard
            title="User Management"
            description="Manage users, ranks, and genealogy structure."
            icon={<FaUsers className="h-6 w-6" />}
            href="/admin/users"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-500"
          />

          <QuickAccessCard
            title="Product Management"
            description="Add, edit, and manage products in the system."
            icon={<FaShoppingCart className="h-6 w-6" />}
            href="/admin/products"
            iconBgColor="bg-green-100"
            iconColor="text-green-500"
          />

          <QuickAccessCard
            title="Rebate Management"
            description="Process rebates and manage wallet transactions."
            icon={<FaWallet className="h-6 w-6" />}
            href="/admin/rebates"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-500"
          />

          <QuickAccessCard
            title="Reports"
            description="View sales reports, rebate reports, and user statistics."
            icon={<FaChartLine className="h-6 w-6" />}
            href="/admin/reports"
            iconBgColor="bg-orange-100"
            iconColor="text-orange-500"
          />
        </div>
      </div>
    </MainLayout>
  );
}
