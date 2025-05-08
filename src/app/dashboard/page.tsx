"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { FaUsers, FaShoppingCart, FaWallet, FaChartLine, FaLeaf, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaBell } from "react-icons/fa";

// Import dashboard components with lazy loading
const DashboardCharts = lazy(() => import("@/components/dashboard/DashboardCharts"));
const GenealogyPreview = lazy(() => import("@/components/dashboard/GenealogyPreview"));
const PerformanceSummary = lazy(() => import("@/components/dashboard/PerformanceSummary"));
const UpcomingEvents = lazy(() => import("@/components/dashboard/UpcomingEvents"));

// Import new link and product generation widgets with lazy loading
const QuickShareWidget = lazy(() => import("@/components/dashboard/QuickShareWidget"));
const TopProductsWidget = lazy(() => import("@/components/dashboard/TopProductsWidget"));
const RecentReferralsWidget = lazy(() => import("@/components/dashboard/RecentReferralsWidget"));

interface DashboardUser {
  id: number;
  name: string;
  email: string;
  rank: string;
  rankLevel: number;
  profileImage?: string;
}

interface DashboardStats {
  walletBalance: number;
  totalRebates: number;
  downlineCount: number;
  purchaseCount: number;
}

interface ChartData {
  rebates: Record<string, number>;
  sales: Record<string, number>;
  rankDistribution: Record<string, number>;
}

interface RecentRebate {
  id: number;
  amount: number;
  createdAt: string;
  generator: {
    name: string;
  };
}

interface RecentPurchase {
  id: number;
  totalAmount: number;
  createdAt: string;
  product: {
    name: string;
  };
}

interface DashboardData {
  user: DashboardUser;
  stats: DashboardStats;
  charts: ChartData;
  recentData: {
    rebates: RecentRebate[];
    purchases: RecentPurchase[];
  };
}

// Function to fetch dashboard data
const fetchDashboardData = async (timeframe: string = 'month'): Promise<DashboardData> => {
  const response = await fetch(`/api/dashboard?timeframe=${timeframe}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Use React Query to fetch dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboardData', timeframe],
    queryFn: () => fetchDashboardData(timeframe),
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-red-500">Error loading dashboard data</div>
        </div>
      </MainLayout>
    );
  }

  // Prepare data for genealogy preview
  const currentUser = {
    id: data?.user?.id.toString() || "current-user",
    name: data?.user?.name || session?.user?.name || "Current User",
    rank: data?.user?.rank || "Distributor",
    image: data?.user?.profileImage || session?.user?.image || undefined
  };

  // Convert downline data to the format expected by GenealogyPreview
  const downlineMembers = data?.recentData?.rebates.slice(0, 3).map((rebate, index) => ({
    id: `user${index + 1}`,
    name: rebate.generator.name,
    rank: "Distributor",
    position: index % 2 === 0 ? "left" : "right" as "left" | "right"
  })) || [];

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: 'week' | 'month' | 'year') => {
    setTimeframe(newTimeframe);
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          <div className="flex items-center space-x-4">
            {/* Timeframe selector */}
            <div className="flex items-center bg-gray-100 rounded-md">
              <select
                value={timeframe}
                onChange={(e) => handleTimeframeChange(e.target.value as 'week' | 'month' | 'year')}
                className="bg-transparent border-none py-2 px-3 focus:ring-0 text-sm"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <button className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
              <FaBell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                3
              </span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaWallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Wallet Balance
                </p>
                <p className="text-2xl font-semibold">₱{data?.stats.walletBalance.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <FaChartLine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Rebates
                </p>
                <p className="text-2xl font-semibold">₱{data?.stats.totalRebates.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <FaUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Downline Members
                </p>
                <p className="text-2xl font-semibold">{data?.stats.downlineCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                <FaShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Purchases
                </p>
                <p className="text-2xl font-semibold">{data?.stats.purchaseCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading performance summary...</div>}>
          <div className="mb-8">
            <PerformanceSummary metrics={[]} />
          </div>
        </Suspense>

        {/* Charts */}
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading charts...</div>}>
          <div className="mb-8">
            <DashboardCharts
              rebateData={data?.charts.rebates ? Object.values(data.charts.rebates) : []}
              salesData={data?.charts.sales ? Object.values(data.charts.sales) : []}
              rankDistribution={data?.charts.rankDistribution || {}}
              timeframe={timeframe}
            />
          </div>
        </Suspense>

        {/* Link Generation and Referrals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Share Widget - 1/3 width */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading widget...</div>}>
            <div>
              <QuickShareWidget />
            </div>
          </Suspense>

          {/* Top Products Widget - 1/3 width */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading widget...</div>}>
            <div>
              <TopProductsWidget />
            </div>
          </Suspense>

          {/* Recent Referrals Widget - 1/3 width */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading widget...</div>}>
            <div>
              <RecentReferralsWidget />
            </div>
          </Suspense>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Genealogy Preview - 2/3 width */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading genealogy...</div>}>
            <div className="lg:col-span-2">
              <GenealogyPreview
                currentUser={currentUser}
                downlineMembers={downlineMembers}
              />
            </div>
          </Suspense>

          {/* Recent Rebates - 1/3 width */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-700">Recent Rebates</h3>
            </div>
            <div className="p-4">
              {data?.recentData.rebates && data.recentData.rebates.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {data.recentData.rebates.map((rebate) => (
                    <div key={rebate.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{rebate.generator.name}</p>
                        <p className="text-xs text-gray-500">{new Date(rebate.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        +₱{rebate.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No rebates received yet.</p>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push("/rebates")}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View All Rebates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-8">
          <UpcomingEvents />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-medium text-gray-700">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/shop")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <FaShoppingCart className="mr-2" /> Shop Products
            </button>
            <button
              onClick={() => router.push("/genealogy")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <FaUsers className="mr-2" /> View Genealogy
            </button>
            <button
              onClick={() => router.push("/wallet")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <FaWallet className="mr-2" /> Manage Wallet
            </button>
            <button
              onClick={() => router.push("/referrals")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              <FaUsers className="mr-2" /> Invite Members
            </button>
          </div>
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* About Extreme Life */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-700 flex items-center">
                <FaLeaf className="text-green-500 mr-2" /> About Extreme Life Herbal
              </h3>
            </div>
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24">
                  <Image
                    src="/images/20250503.svg"
                    alt="Extreme Life Herbal Products Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Extreme Life Herbal Products Trading is a leading provider of high-quality herbal supplements and wellness products in the Philippines.
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Our mission is to promote health and wellness through natural products while providing business opportunities for our distributors.
              </p>
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push("/about")}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Featured Products */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-700 flex items-center">
                <FaShoppingCart className="text-green-500 mr-2" /> Featured Products
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <FaLeaf />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Biogen Extreme Concentrate</p>
                    <p className="text-xs text-gray-500">Concentrated organic enzyme formula</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <FaLeaf />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Veggie Coffee 124 in 1</p>
                    <p className="text-xs text-gray-500">Caffeine-free coffee alternative</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <FaLeaf />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Shield Herbal Care Soap</p>
                    <p className="text-xs text-gray-500">Premium herbal soap for skin care</p>
                  </div>
                </li>
              </ul>
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push("/shop")}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View All Products
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-700 flex items-center">
                <FaPhoneAlt className="text-green-500 mr-2" /> Contact Us
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <FaPhoneAlt />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-500">+63 (2) 8123 4567</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <FaEnvelope />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">info@extremelifeherbal.ph</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-500">123 Herbal Street, Makati City, Metro Manila, Philippines</p>
                  </div>
                </li>
              </ul>
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push("/contact")}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
