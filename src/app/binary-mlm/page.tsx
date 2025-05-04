"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import BinaryTreeView from "@/components/binary-mlm/BinaryTreeView";
import EarningsReport from "@/components/binary-mlm/EarningsReport";
import { FaSpinner, FaCalendarAlt, FaChartLine, FaUsers, FaUserPlus } from "react-icons/fa";

interface BinaryMlmUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    id: number;
    name: string;
    level: number;
  };
  walletBalance: number;
  leftLegId: number | null;
  rightLegId: number | null;
  placementPosition: string | null;
}

interface BinaryTreeNode {
  user: BinaryMlmUser;
  level: number;
  position: string | null;
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
}

interface MonthlyPerformance {
  id: number;
  userId: number;
  year: number;
  month: number;
  personalPV: number;
  leftLegPV: number;
  rightLegPV: number;
  totalGroupPV: number;
  directReferralBonus: number;
  levelCommissions: number;
  groupVolumeBonus: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export default function BinaryMlmPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<BinaryTreeNode | null>(null);
  const [performance, setPerformance] = useState<MonthlyPerformance | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch binary MLM data
  useEffect(() => {
    if (status === "authenticated") {
      fetchBinaryMlmData();
    }
  }, [status]);
  
  // Fetch performance data when year/month changes
  useEffect(() => {
    if (status === "authenticated") {
      fetchPerformanceData();
    }
  }, [selectedYear, selectedMonth, status]);
  
  const fetchBinaryMlmData = async () => {
    setLoading(true);
    try {
      // Fetch binary tree structure
      const response = await fetch(`/api/binary-mlm?action=tree&maxDepth=6`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch binary MLM data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTreeData(data.tree);
    } catch (error) {
      console.error("Error fetching binary MLM data:", error);
      setMessage({
        type: "error",
        text: "Failed to load binary MLM structure. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPerformanceData = async () => {
    try {
      // Fetch performance data for selected month
      const response = await fetch(
        `/api/binary-mlm?action=performance&year=${selectedYear}&month=${selectedMonth}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.performance && data.performance.length > 0) {
        setPerformance(data.performance[0]);
      } else {
        setPerformance(null);
        setMessage({
          type: "info",
          text: `No performance data available for ${getMonthName(selectedMonth)} ${selectedYear}.`,
        });
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setMessage({
        type: "error",
        text: "Failed to load performance data. Please try again.",
      });
    }
  };
  
  const simulateEarnings = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch("/api/binary-mlm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "simulate",
          year: selectedYear,
          month: selectedMonth,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to simulate earnings: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setMessage({
        type: "success",
        text: `Successfully simulated earnings for ${getMonthName(selectedMonth)} ${selectedYear}.`,
      });
      
      // Refresh performance data
      fetchPerformanceData();
    } catch (error) {
      console.error("Error simulating earnings:", error);
      setMessage({
        type: "error",
        text: "Failed to simulate earnings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const exportReport = async (format: 'csv' | 'json') => {
    try {
      // For CSV format, directly open the download
      if (format === 'csv') {
        window.open(
          `/api/binary-mlm/export?type=personal&year=${selectedYear}&month=${selectedMonth}&format=${format}`,
          '_blank'
        );
        return;
      }
      
      // For JSON format, fetch the data
      const response = await fetch(
        `/api/binary-mlm/export?type=personal&year=${selectedYear}&month=${selectedMonth}&format=${format}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Create a download link for the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings_report_${selectedYear}_${selectedMonth}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      setMessage({
        type: "error",
        text: "Failed to export report. Please try again.",
      });
    }
  };
  
  const getMonthName = (month: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  };
  
  if (status === "loading") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <FaSpinner className="animate-spin text-green-500 mr-2" />
          <span>Loading...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Binary MLM Dashboard</h1>
        
        {/* Message display */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {message.text}
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaChartLine className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Monthly Earnings</div>
                <div className="text-xl font-bold">
                  ₱{performance ? performance.totalEarnings.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FaUsers className="text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Group Volume</div>
                <div className="text-xl font-bold">
                  {performance ? performance.totalGroupPV.toFixed(0) : '0'} PV
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <FaUserPlus className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Referral Bonus</div>
                <div className="text-xl font-bold">
                  ₱{performance ? performance.directReferralBonus.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <FaCalendarAlt className="text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Period</div>
                <div className="text-xl font-bold">
                  {getMonthName(selectedMonth)} {selectedYear}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Period Selection and Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div>
                <label htmlFor="year" className="block text-sm text-gray-600 mb-1">Year</label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="month" className="block text-sm text-gray-600 mb-1">Month</label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>{getMonthName(month)}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <button
                onClick={simulateEarnings}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-2" />
                    Simulating...
                  </>
                ) : (
                  "Simulate Earnings"
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Earnings Report */}
          {performance ? (
            <EarningsReport
              performance={performance}
              onExport={exportReport}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">
                No performance data available for {getMonthName(selectedMonth)} {selectedYear}.
                Click "Simulate Earnings" to generate data.
              </p>
            </div>
          )}
          
          {/* Binary Tree View */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64">
              <FaSpinner className="animate-spin text-green-500 mr-2" />
              <span>Loading binary structure...</span>
            </div>
          ) : treeData ? (
            <BinaryTreeView
              data={treeData}
              maxDepth={6}
              initialExpandedLevels={2}
              onUserSelect={(user) => console.log("Selected user:", user)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">
                No binary structure data available.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
