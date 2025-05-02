"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { FaChartLine } from "react-icons/fa";

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

export default function RebatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rebates, setRebates] = useState<Rebate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, processed, failed

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch rebates
      const fetchRebates = async () => {
        try {
          const url = filter === "all" 
            ? "/api/rebates" 
            : `/api/rebates?status=${filter}`;
            
          const response = await fetch(url);
          const data = await response.json();
          setRebates(data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching rebates:", error);
          setLoading(false);
        }
      };

      fetchRebates();
    }
  }, [status, filter]);

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
        <h1 className="text-2xl font-semibold mb-6">Rebate Earnings</h1>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <FaChartLine className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Rebate Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Rebates</p>
              <p className="text-2xl font-semibold">${totalRebates.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
              <p className="text-2xl font-semibold">{rebates.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Levels Earning From</p>
              <p className="text-2xl font-semibold">{Object.keys(rebatesByLevel).length}</p>
            </div>
          </div>
        </div>

        {/* Level Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Earnings by Level</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(rebatesByLevel)
              .sort(([levelA], [levelB]) => parseInt(levelA) - parseInt(levelB))
              .map(([level, amount]) => (
                <div key={level} className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500 font-medium">Level {level}</p>
                  <p className="text-xl font-semibold">${amount.toFixed(2)}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Rebate Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Rebate Transactions</h2>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            {rebates.length > 0 ? (
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
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rebates.map((rebate) => (
                      <tr key={rebate.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rebate.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rebate.generator.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rebate.purchase.product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Level {rebate.level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rebate.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ${rebate.amount.toFixed(2)}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No rebates found.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
