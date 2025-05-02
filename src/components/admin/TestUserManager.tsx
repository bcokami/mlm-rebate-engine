"use client";

import { useState, useEffect } from "react";
import { FaUsers, FaUserPlus, FaUserMinus, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";

interface TestUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  uplineId: number | null;
  walletBalance: number;
  metadata: {
    role: string;
    isTest: boolean;
    environment: string;
    keepForDev: boolean;
  };
  createdAt: string;
}

interface TestUsersByRole {
  admin: TestUser[];
  ranked_distributor: TestUser[];
  distributor: TestUser[];
  viewer: TestUser[];
}

interface TestUserStats {
  environment: string;
  totalCount: number;
  usersByRole: TestUsersByRole;
  users: TestUser[];
}

const TestUserManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TestUserStats | null>(null);
  const [environment, setEnvironment] = useState<"development" | "staging">("development");
  const [retainKeyTesters, setRetainKeyTesters] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Generator settings
  const [userCount, setUserCount] = useState(30);
  const [adminCount, setAdminCount] = useState(1);
  const [distributorCount, setDistributorCount] = useState(20);
  const [rankedDistributorCount, setRankedDistributorCount] = useState(5);
  const [viewerCount, setViewerCount] = useState(4);
  const [maxLevels, setMaxLevels] = useState(10);
  const [generatePurchases, setGeneratePurchases] = useState(true);
  const [generateRebates, setGenerateRebates] = useState(true);
  const [showGeneratorSettings, setShowGeneratorSettings] = useState(false);
  
  // Fetch test user stats
  const fetchTestUsers = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/admin/test-users?environment=${environment}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch test users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch test users");
    } finally {
      setLoading(false);
    }
  };
  
  // Generate test users
  const handleGenerateUsers = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const response = await fetch("/api/admin/test-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          environment,
          userCount,
          adminCount,
          distributorCount,
          rankedDistributorCount,
          viewerCount,
          maxLevels,
          generatePurchases,
          generateRebates,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate test users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMessage(data.message);
      
      // Refresh test user stats
      await fetchTestUsers();
    } catch (err: any) {
      setError(err.message || "Failed to generate test users");
    } finally {
      setLoading(false);
    }
  };
  
  // Delete test users
  const handleDeleteUsers = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const response = await fetch("/api/admin/test-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          environment,
          retainKeyTesters,
          dryRun,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete test users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMessage(
        `${dryRun ? "[DRY RUN] " : ""}${data.message}: ${data.deleted} deleted, ${data.retained} retained`
      );
      
      // Refresh test user stats
      await fetchTestUsers();
      
      // Hide confirmation dialog
      setShowConfirmDelete(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete test users");
    } finally {
      setLoading(false);
    }
  };
  
  // Load test users on mount and when environment changes
  useEffect(() => {
    fetchTestUsers();
  }, [environment]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FaUsers className="mr-2 text-blue-500" /> Test User Manager
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as "development" | "staging")}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
          </select>
          <button
            onClick={() => fetchTestUsers()}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Message and Error Display */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Test User Stats */}
      {stats && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-2xl font-semibold">{stats.totalCount}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Admins</div>
              <div className="text-2xl font-semibold">{stats.usersByRole.admin.length}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Ranked Distributors</div>
              <div className="text-2xl font-semibold">{stats.usersByRole.ranked_distributor.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Distributors</div>
              <div className="text-2xl font-semibold">{stats.usersByRole.distributor.length}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Viewers</div>
              <div className="text-2xl font-semibold">{stats.usersByRole.viewer.length}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Generate Test Users</h3>
            <div className="flex items-center mb-3">
              <button
                onClick={() => setShowGeneratorSettings(!showGeneratorSettings)}
                className="text-blue-500 text-sm underline mr-2"
              >
                {showGeneratorSettings ? "Hide Settings" : "Show Settings"}
              </button>
              <span className="text-sm text-gray-500">
                {userCount} users, {maxLevels} levels deep
              </span>
            </div>
            
            {showGeneratorSettings && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Users
                  </label>
                  <input
                    type="number"
                    value={userCount}
                    onChange={(e) => setUserCount(parseInt(e.target.value))}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Levels
                  </label>
                  <input
                    type="number"
                    value={maxLevels}
                    onChange={(e) => setMaxLevels(parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admins
                  </label>
                  <input
                    type="number"
                    value={adminCount}
                    onChange={(e) => setAdminCount(parseInt(e.target.value))}
                    min="0"
                    max="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ranked Distributors
                  </label>
                  <input
                    type="number"
                    value={rankedDistributorCount}
                    onChange={(e) => setRankedDistributorCount(parseInt(e.target.value))}
                    min="0"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distributors
                  </label>
                  <input
                    type="number"
                    value={distributorCount}
                    onChange={(e) => setDistributorCount(parseInt(e.target.value))}
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Viewers
                  </label>
                  <input
                    type="number"
                    value={viewerCount}
                    onChange={(e) => setViewerCount(parseInt(e.target.value))}
                    min="0"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="generatePurchases"
                    checked={generatePurchases}
                    onChange={(e) => setGeneratePurchases(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generatePurchases" className="ml-2 block text-sm text-gray-700">
                    Generate Purchases
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="generateRebates"
                    checked={generateRebates}
                    onChange={(e) => setGenerateRebates(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generateRebates" className="ml-2 block text-sm text-gray-700">
                    Generate Rebates
                  </label>
                </div>
              </div>
            )}
            
            <button
              onClick={handleGenerateUsers}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Generating...
                </>
              ) : (
                <>
                  <FaUserPlus className="mr-2" /> Generate Test Users
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Clean Up Test Users</h3>
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="retainKeyTesters"
                  checked={retainKeyTesters}
                  onChange={(e) => setRetainKeyTesters(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="retainKeyTesters" className="ml-2 block text-sm text-gray-700">
                  Retain Key Testers (keep_for_dev = true)
                </label>
              </div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="dryRun"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="dryRun" className="ml-2 block text-sm text-gray-700">
                  Dry Run (preview only, no deletion)
                </label>
              </div>
            </div>
            
            {!showConfirmDelete ? (
              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={loading || !stats || stats.totalCount === 0}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaUserMinus className="mr-2" /> Delete Test Users
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-600 font-medium">
                  Are you sure you want to delete {stats?.totalCount || 0} test users?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDeleteUsers}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Deleting...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" /> Confirm
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <FaTimes className="mr-2" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Test User List */}
      {stats && stats.users.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-3">Test Users</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keep
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.metadata.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.metadata.role === "ranked_distributor"
                          ? "bg-yellow-100 text-yellow-800"
                          : user.metadata.role === "distributor"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.metadata.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.uplineId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.walletBalance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.metadata.keepForDev ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaTimes className="text-red-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TestUserManager;
