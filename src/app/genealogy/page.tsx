"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import GenealogyTree from "@/components/genealogy/GenealogyTree";
import { FaUserPlus, FaUsers, FaSearch, FaChartBar, FaSpinner, FaChevronDown } from "react-icons/fa";

interface GenealogyUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    name: string;
  };
  level: number;
  _count: {
    downline: number;
  };
  children?: GenealogyUser[];
}

export default function GenealogyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [genealogy, setGenealogy] = useState<GenealogyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");
  const [maxLevel, setMaxLevel] = useState(10);
  const [searchUserId, setSearchUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<{
    totalUsers: number;
    levelCounts: Record<number, number>;
    totalDownlineBalance: number;
    directDownlineCount: number;
  } | null>(null);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchGenealogy();
    }
  }, [status, maxLevel, targetUserId]);

  // Fetch genealogy data
  const fetchGenealogy = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("maxLevel", maxLevel.toString());

      if (targetUserId) {
        params.append("userId", targetUserId.toString());
      }

      // Add stats parameter
      params.append("includeStats", "true");

      const response = await fetch(`/api/genealogy?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch genealogy: ${response.statusText}`);
      }

      const data = await response.json();

      setGenealogy(data);

      // Extract statistics if available
      if (data.statistics) {
        setStatistics(data.statistics);
      }

      // Generate referral link (only for the current user)
      if (!targetUserId && data.id) {
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/register?uplineId=${data.id}`);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching genealogy:", error);
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied to clipboard!");
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchUserId.trim() === "") {
      // If search is empty, reset to current user's genealogy
      setTargetUserId(null);
    } else {
      // Try to parse the user ID
      const userId = parseInt(searchUserId);
      if (isNaN(userId)) {
        alert("Please enter a valid user ID");
        return;
      }

      setTargetUserId(userId);
    }
  };

  // Reset to current user's genealogy
  const handleViewMyNetwork = () => {
    setSearchUserId("");
    setTargetUserId(null);
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

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
            <FaUsers className="mr-2 text-blue-500" /> Network Genealogy
          </h1>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by User ID"
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <FaSearch className="mr-2 inline-block" /> Search
                </button>
              </form>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleViewMyNetwork}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                View My Network
              </button>
              <select
                value={maxLevel}
                onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">1 Level</option>
                <option value="2">2 Levels</option>
                <option value="3">3 Levels</option>
                <option value="5">5 Levels</option>
                <option value="10">10 Levels</option>
              </select>
            </div>
          </div>
        </div>

        {/* Referral Link (only show for current user) */}
        {!targetUserId && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaUserPlus className="mr-2 text-green-500" /> Your Referral Link
            </h2>
            <div className="flex">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Share this link with others to invite them to join your downline.
            </p>
          </div>
        )}

        {/* Statistics */}
        {statistics && showStats && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center">
                <FaChartBar className="mr-2 text-blue-500" /> Network Statistics
              </h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-sm">Hide</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Total Members</div>
                <div className="text-xl font-semibold">{statistics.totalUsers}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Direct Downline</div>
                <div className="text-xl font-semibold">{statistics.directDownlineCount}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Network Levels</div>
                <div className="text-xl font-semibold">{Object.keys(statistics.levelCounts).length}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Downline Earnings</div>
                <div className="text-xl font-semibold">₱{statistics.totalDownlineBalance.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Members by Level</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(statistics.levelCounts).map(([level, count]) => (
                  <div key={level} className="bg-gray-50 p-2 rounded-md text-center">
                    <div className="text-xs text-gray-500">Level {level}</div>
                    <div className="font-medium">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!showStats && statistics && (
          <div className="bg-white rounded-lg shadow p-3 mb-6">
            <button
              onClick={() => setShowStats(true)}
              className="text-blue-500 hover:text-blue-700 flex items-center"
            >
              <FaChartBar className="mr-2" />
              <span>Show Network Statistics</span>
              <FaChevronDown className="ml-2" />
            </button>
          </div>
        )}

        {/* Genealogy Tree */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {targetUserId ? `User #${targetUserId}'s Downline` : 'Your Downline'}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FaSpinner className="animate-spin text-blue-500 mr-2" />
              <span>Loading genealogy data...</span>
            </div>
          ) : genealogy ? (
            <GenealogyTree
              data={genealogy}
              maxDepth={maxLevel}
              initialExpandedLevels={2}
            />
          ) : (
            <p className="text-gray-500">No genealogy data available.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
