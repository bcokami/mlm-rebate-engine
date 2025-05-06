"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import GenealogyTree from "@/components/genealogy/GenealogyTree";
import EnhancedGenealogyTree from "@/components/genealogy/EnhancedGenealogyTree";
import {
  FaUserPlus,
  FaUsers,
  FaSearch,
  FaChartBar,
  FaSpinner,
  FaChevronDown,
  FaDownload,
  FaPrint,
  FaShare,
  FaLayerGroup,
  FaWallet,
  FaExchangeAlt,
  FaFileExport,
  FaEdit,
  FaMobile,
  FaPlug,
  FaChartLine,
  FaBell
} from "react-icons/fa";
// import { motion } from "framer-motion";

interface GenealogyUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    id?: number;
    name: string;
  };
  level: number;
  walletBalance?: number;
  createdAt?: Date;
  _count: {
    downline: number;
  };
  children?: GenealogyUser[];
  performanceMetrics?: {
    personalSales: number;
    teamSales: number;
    totalSales: number;
    rebatesEarned: number;
    teamSize: number;
    newTeamMembers: number;
    rankHistory: {
      rankId: number;
      rankName: string;
      achievedAt: Date;
    }[];
    activityScore: number;
    lastUpdated: Date;
  } | null;
  hasMoreChildren?: boolean;
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
    rankDistribution?: {
      rankId: number;
      rankName: string;
      count: number;
    }[];
    lastUpdated?: Date;
  } | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [useEnhancedView, setUseEnhancedView] = useState(true);

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

      // Add performance metrics parameter
      params.append("includePerformanceMetrics", "true");

      // Add lazy loading parameter
      params.append("lazyLoad", "true");

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

  // Function to export genealogy data
  const exportGenealogy = async (format: 'csv' | 'json') => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("maxLevel", maxLevel.toString());
      params.append("format", format);

      if (targetUserId) {
        params.append("userId", targetUserId.toString());
      }

      // For CSV format, directly open the download
      if (format === 'csv') {
        window.open(`/api/genealogy/export?${params.toString()}`, '_blank');
        return;
      }

      // For JSON format, fetch the data first
      const response = await fetch(`/api/genealogy/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to export genealogy: ${response.statusText}`);
      }

      const data = await response.json();

      // Create a download link for the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genealogy_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting genealogy:", error);
      alert("Failed to export genealogy data. Please try again.");
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold flex items-center">
            <FaUsers className="mr-2 text-green-500" /> Network Genealogy
          </h1>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setUseEnhancedView(true)}
              className={`px-4 py-2 rounded-md ${
                useEnhancedView
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Enhanced View
            </button>
            <button
              onClick={() => setUseEnhancedView(false)}
              className={`px-4 py-2 rounded-md ${
                !useEnhancedView
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Standard View
            </button>
            <Link
              href="/genealogy/optimized"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center"
            >
              <FaLayerGroup className="mr-2" /> Try New Optimized View
            </Link>
            <Link
              href="/genealogy/basic-flow"
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 flex items-center"
            >
              <FaLayerGroup className="mr-2" /> Basic Flow View
            </Link>
            <Link
              href="/genealogy/enhanced-flow"
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center"
            >
              <FaLayerGroup className="mr-2" /> Enhanced Flow View
            </Link>
            <Link
              href="/genealogy/compare"
              className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 flex items-center"
            >
              <FaExchangeAlt className="mr-2" /> Compare Views
            </Link>
            <Link
              href="/genealogy/search"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center"
            >
              <FaSearch className="mr-2" /> Advanced Search
            </Link>
            <Link
              href="/genealogy/export"
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center"
            >
              <FaFileExport className="mr-2" /> Export Data
            </Link>
            <Link
              href="/genealogy/interactive"
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 flex items-center"
            >
              <FaEdit className="mr-2" /> Interactive Tree
            </Link>
            <Link
              href="/genealogy/virtualized"
              className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 flex items-center"
            >
              <FaLayerGroup className="mr-2" /> Virtualized Tree
            </Link>
            <Link
              href="/genealogy/mobile"
              className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 flex items-center"
            >
              <FaMobile className="mr-2" /> Mobile View
            </Link>
            <Link
              href="/genealogy/integration"
              className="px-4 py-2 rounded-md bg-pink-600 text-white hover:bg-pink-700 flex items-center"
            >
              <FaPlug className="mr-2" /> Integration
            </Link>
            <Link
              href="/genealogy/metrics"
              className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 flex items-center"
            >
              <FaChartLine className="mr-2" /> Metrics
            </Link>
            <Link
              href="/genealogy/notifications"
              className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 flex items-center"
            >
              <FaBell className="mr-2" /> Notifications
            </Link>
            <Link
              href="/genealogy/compare-users"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center"
            >
              <FaExchangeAlt className="mr-2" /> Compare Users
            </Link>
          </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Members by Level</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(statistics.levelCounts).map(([level, count]) => (
                    <div key={level} className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-500">Level {level}</div>
                      <div className="font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {statistics.rankDistribution && statistics.rankDistribution.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Members by Rank</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {statistics.rankDistribution.map((rank) => (
                      <div key={rank.rankId} className="bg-gray-50 p-2 rounded-md text-center">
                        <div className="text-xs text-gray-500">{rank.rankName}</div>
                        <div className="font-medium">{rank.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {statistics.lastUpdated && (
              <div className="mt-3 text-xs text-gray-500 text-right">
                Last updated: {new Date(statistics.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {!showStats && statistics && (
          <div className="bg-white rounded-lg shadow p-3 mb-6">
            <button
              onClick={() => setShowStats(true)}
              className="text-green-600 hover:text-green-700 flex items-center"
            >
              <FaChartBar className="mr-2" />
              <span>Show Network Statistics</span>
              <FaChevronDown className="ml-2" />
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="relative group">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <FaDownload className="mr-2" /> Export Genealogy
            </button>
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => exportGenealogy('csv')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportGenealogy('json')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <FaPrint className="mr-2" /> Print View
          </button>
          <button
            onClick={() => {
              if (genealogy) {
                const text = `Check out my Extreme Life Herbal Products network with ${statistics?.totalUsers || 0} members!`;
                if (navigator.share) {
                  navigator.share({
                    title: 'My Extreme Life Network',
                    text: text,
                    url: window.location.href,
                  }).catch(err => console.error('Error sharing:', err));
                } else {
                  navigator.clipboard.writeText(`${text} ${window.location.href}`);
                  alert('Network link copied to clipboard!');
                }
              }
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <FaShare className="mr-2" /> Share Network
          </button>
        </div>

        {/* Genealogy Tree */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {targetUserId ? `User #${targetUserId}'s Downline` : 'Your Downline'}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FaSpinner className="animate-spin text-green-500 mr-2" />
              <span>Loading genealogy data...</span>
            </div>
          ) : genealogy ? (
            useEnhancedView ? (
              <EnhancedGenealogyTree
                data={genealogy}
                maxDepth={maxLevel}
                initialExpandedLevels={2}
                onUserSelect={(user) => console.log("Selected user:", user)}
              />
            ) : (
              <GenealogyTree
                data={genealogy}
                maxDepth={maxLevel}
                initialExpandedLevels={2}
              />
            )
          ) : (
            <p className="text-gray-500">No genealogy data available.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
