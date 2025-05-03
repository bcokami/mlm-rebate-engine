"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { FaUsers, FaShoppingCart, FaWallet, FaChartLine, FaCog, FaUsersCog, FaPercentage, FaDollarSign } from "react-icons/fa";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalPurchases: 0,
    totalRebates: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // TODO: Add admin check
      // For now, we'll just fetch some basic stats
      const fetchAdminStats = async () => {
        try {
          // Fetch users
          const usersResponse = await fetch("/api/users");
          const usersData = await usersResponse.json();

          // Fetch products
          const productsResponse = await fetch("/api/products");
          const productsData = await productsResponse.json();

          // For now, we'll just use the counts
          setStats({
            totalUsers: usersData.length || 0,
            totalProducts: productsData.length || 0,
            totalPurchases: 0, // We'll implement this later
            totalRebates: 0, // We'll implement this later
          });

          setLoading(false);
        } catch (error) {
          console.error("Error fetching admin stats:", error);
          setLoading(false);
        }
      };

      fetchAdminStats();
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
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-2xl font-semibold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <FaShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Products
                </p>
                <p className="text-2xl font-semibold">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <FaWallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Purchases
                </p>
                <p className="text-2xl font-semibold">{stats.totalPurchases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                <FaChartLine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Rebates
                </p>
                <p className="text-2xl font-semibold">{stats.totalRebates}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaUsers className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">User Management</h2>
            </div>
            <p className="text-gray-500 mb-4">
              Manage users, ranks, and genealogy structure.
            </p>
            <Link
              href="/admin/users"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Manage Users
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <FaShoppingCart className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Product Management</h2>
            </div>
            <p className="text-gray-500 mb-4">
              Add, edit, and manage products in the system.
            </p>
            <Link
              href="/admin/products"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Manage Products
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                <FaPercentage className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Rebate Configurations</h2>
            </div>
            <p className="text-gray-500 mb-4">
              Configure percentage and fixed amount rebates for products.
            </p>
            <Link
              href="/admin/rebate-configs"
              className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Manage Rebate Configs
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <FaWallet className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Rebate Management</h2>
            </div>
            <p className="text-gray-500 mb-4">
              Process rebates and manage wallet transactions.
            </p>
            <Link
              href="/admin/rebates"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Manage Rebates
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                <FaChartLine className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Reports</h2>
            </div>
            <p className="text-gray-500 mb-4">
              View sales reports, rebate reports, and user statistics.
            </p>
            <Link
              href="/admin/reports"
              className="inline-block px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              View Reports
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
                <FaUsersCog className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Test User Management</h2>
            </div>
            <p className="text-gray-500 mb-4">
              Generate and manage test users for development and testing.
            </p>
            <Link
              href="/admin/test-users"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Manage Test Users
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-gray-100 text-gray-500 mr-4">
                <FaCog className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">Settings</h2>
            </div>
            <p className="text-gray-500 mb-4">
              Configure system settings and rebate rules.
            </p>
            <Link
              href="/admin/settings"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Manage Settings
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
