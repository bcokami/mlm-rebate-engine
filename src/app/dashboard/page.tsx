"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { FaUsers, FaShoppingCart, FaWallet, FaChartLine } from "react-icons/fa";

interface DashboardStats {
  walletBalance: number;
  totalRebates: number;
  downlineCount: number;
  purchaseCount: number;
}

interface RecentRebate {
  id: number;
  amount: number;
  createdAt: string;
  generator: {
    name: string;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    walletBalance: 0,
    totalRebates: 0,
    downlineCount: 0,
    purchaseCount: 0,
  });
  const [recentRebates, setRecentRebates] = useState<RecentRebate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch dashboard data
      const fetchDashboardData = async () => {
        try {
          // Fetch wallet balance
          const walletResponse = await fetch("/api/wallet");
          const walletData = await walletResponse.json();

          // Fetch rebates
          const rebatesResponse = await fetch("/api/rebates");
          const rebatesData = await rebatesResponse.json();

          // Fetch genealogy (for downline count)
          const genealogyResponse = await fetch("/api/genealogy");
          const genealogyData = await genealogyResponse.json();

          // Fetch purchases
          const purchasesResponse = await fetch("/api/purchases");
          const purchasesData = await purchasesResponse.json();

          // Calculate stats
          const totalRebates = rebatesData.reduce(
            (sum: number, rebate: any) => sum + rebate.amount,
            0
          );

          const downlineCount = genealogyData.children
            ? genealogyData.children.length
            : 0;

          setStats({
            walletBalance: walletData.balance || 0,
            totalRebates,
            downlineCount,
            purchaseCount: purchasesData.length || 0,
          });

          // Get recent rebates
          const sortedRebates = [...rebatesData]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5);

          setRecentRebates(sortedRebates);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [status]);

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
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaWallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Wallet Balance
                </p>
                <p className="text-2xl font-semibold">${stats.walletBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <FaChartLine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Rebates
                </p>
                <p className="text-2xl font-semibold">${stats.totalRebates.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <FaUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Downline Members
                </p>
                <p className="text-2xl font-semibold">{stats.downlineCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                <FaShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Purchases
                </p>
                <p className="text-2xl font-semibold">{stats.purchaseCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Rebates */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Recent Rebates</h2>
          </div>
          <div className="p-6">
            {recentRebates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentRebates.map((rebate) => (
                      <tr key={rebate.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rebate.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rebate.generator.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${rebate.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No rebates received yet.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/shop")}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <FaShoppingCart className="mr-2" /> Shop Products
            </button>
            <button
              onClick={() => router.push("/genealogy")}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FaUsers className="mr-2" /> View Genealogy
            </button>
            <button
              onClick={() => router.push("/wallet")}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <FaWallet className="mr-2" /> Manage Wallet
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
