"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { 
  FaUserPlus, 
  FaUsers, 
  FaUserTie, 
  FaUserSecret, 
  FaTrash, 
  FaSpinner, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaClipboard,
  FaClipboardCheck,
  FaInfoCircle,
  FaArrowRight
} from "react-icons/fa";
import { TestScenario } from "@/lib/testDataGenerator";

interface TestUser {
  id: number;
  email: string;
  name: string;
  password: string;
  scenario: TestScenario;
}

interface TestStats {
  usersCreated: number;
  downlinesCreated: number;
  purchasesCreated: number;
  rebatesGenerated: number;
  referralLinksCreated: number;
}

export default function TestDataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [scenario, setScenario] = useState<TestScenario>(TestScenario.NEW_MEMBER);
  const [count, setCount] = useState<number>(1);
  const [prefix, setPrefix] = useState<string>("test");
  const [cleanupToken, setCleanupToken] = useState<string>(`cleanup_${Date.now()}`);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedUsers, setGeneratedUsers] = useState<TestUser[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState<boolean>(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [cleanupSuccess, setCleanupSuccess] = useState<string | null>(null);
  const [cleanupCount, setCleanupCount] = useState<number>(0);
  const [cleanupTokenInput, setCleanupTokenInput] = useState<string>("");
  const [confirmCleanup, setConfirmCleanup] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Check if user is authenticated and is an admin
  if (status === "unauthenticated") {
    router.push("/login?returnUrl=/admin/test-data");
    return null;
  }
  
  if (status === "loading") {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span>Loading...</span>
        </div>
      </AdminLayout>
    );
  }
  
  // Check if user is an admin
  const isAdmin = session?.user?.role === "admin";
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="bg-red-50 p-4 rounded-md">
          <h1 className="text-red-700 text-lg font-semibold flex items-center">
            <FaExclamationTriangle className="mr-2" />
            Access Denied
          </h1>
          <p className="mt-2">
            You do not have permission to access this page. This page is restricted to administrators only.
          </p>
        </div>
      </AdminLayout>
    );
  }
  
  const handleGenerateTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setGeneratedUsers([]);
      setStats(null);
      
      const response = await fetch("/api/admin/test-data/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario,
          count,
          prefix,
          cleanupToken,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate test data");
      }
      
      setSuccess(data.message);
      setGeneratedUsers(data.users || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error generating test data:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };
  
  const handleCleanupTestData = async () => {
    try {
      setCleanupLoading(true);
      setCleanupError(null);
      setCleanupSuccess(null);
      setCleanupCount(0);
      
      const tokenToUse = cleanupTokenInput || cleanupToken;
      
      const response = await fetch("/api/admin/test-data/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cleanupToken: tokenToUse,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to clean up test data");
      }
      
      setCleanupSuccess(data.message);
      setCleanupCount(data.count || 0);
      setConfirmCleanup(false);
      
      // If we cleaned up the current token, reset the generated users
      if (tokenToUse === cleanupToken) {
        setGeneratedUsers([]);
        setStats(null);
      }
    } catch (error) {
      console.error("Error cleaning up test data:", error);
      setCleanupError(error instanceof Error ? error.message : String(error));
    } finally {
      setCleanupLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const getScenarioIcon = (scenarioType: TestScenario) => {
    switch (scenarioType) {
      case TestScenario.NEW_MEMBER:
        return <FaUserPlus className="text-green-500" />;
      case TestScenario.ESTABLISHED_MEMBER:
        return <FaUsers className="text-blue-500" />;
      case TestScenario.HIGH_PERFORMER:
        return <FaUserTie className="text-purple-500" />;
      case TestScenario.EDGE_CASES:
        return <FaUserSecret className="text-red-500" />;
      default:
        return <FaUsers className="text-gray-500" />;
    }
  };
  
  const getScenarioDescription = (scenarioType: TestScenario) => {
    switch (scenarioType) {
      case TestScenario.NEW_MEMBER:
        return "New member with no downline, no purchases, and no rebates";
      case TestScenario.ESTABLISHED_MEMBER:
        return "Established member with moderate downline (3-5), purchases (5-10), and rebates";
      case TestScenario.HIGH_PERFORMER:
        return "High-performing member with large downline (20-30), many purchases (20-30), and high earnings";
      case TestScenario.EDGE_CASES:
        return "Edge cases with unusual data patterns (very long names, extreme values, etc.)";
      default:
        return "";
    }
  };
  
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Data Generator</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> This tool is for testing purposes only. Generated data will be marked as test data and can be cleaned up using the cleanup token.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Generate Test Data */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-medium text-gray-700">Generate Test Data</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Scenario
                </label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as TestScenario)}
                >
                  <option value={TestScenario.NEW_MEMBER}>New Member</option>
                  <option value={TestScenario.ESTABLISHED_MEMBER}>Established Member</option>
                  <option value={TestScenario.HIGH_PERFORMER}>High Performer</option>
                  <option value={TestScenario.EDGE_CASES}>Edge Cases</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {getScenarioDescription(scenario)}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Users
                </label>
                <input
                  type="number"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum 10 users per generation
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Prefix
                </label>
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Emails will be generated as {prefix}_{scenario}_1@test.com, etc.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cleanup Token
                </label>
                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={cleanupToken}
                    onChange={(e) => setCleanupToken(e.target.value)}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                    onClick={() => setCleanupToken(`cleanup_${Date.now()}`)}
                    title="Generate new token"
                  >
                    <FaKey />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Save this token to clean up the generated test data later
                </p>
              </div>
              
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleGenerateTestData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Test Data
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                  {success}
                </div>
              )}
            </div>
          </div>
          
          {/* Clean Up Test Data */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-medium text-gray-700">Clean Up Test Data</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cleanup Token
                </label>
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={cleanupTokenInput}
                  onChange={(e) => setCleanupTokenInput(e.target.value)}
                  placeholder="Enter cleanup token"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the cleanup token used when generating the test data
                </p>
              </div>
              
              {!confirmCleanup ? (
                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => setConfirmCleanup(true)}
                  disabled={cleanupLoading || (!cleanupTokenInput && !cleanupToken)}
                >
                  <FaTrash className="mr-2" />
                  Clean Up Test Data
                </button>
              ) : (
                <div>
                  <p className="mb-2 text-sm text-red-600 font-medium">
                    Are you sure you want to clean up all test data with this token?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={handleCleanupTestData}
                      disabled={cleanupLoading}
                    >
                      {cleanupLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Cleaning...
                        </>
                      ) : (
                        <>
                          Yes, Clean Up
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setConfirmCleanup(false)}
                      disabled={cleanupLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {cleanupError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {cleanupError}
                </div>
              )}
              
              {cleanupSuccess && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                  {cleanupSuccess}
                  {cleanupCount > 0 && (
                    <p className="mt-1 font-medium">
                      {cleanupCount} items deleted
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Generated Test Users */}
        {generatedUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-medium text-gray-700">Generated Test Users</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Password
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scenario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generatedUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {getScenarioIcon(user.scenario)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <button
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                          onClick={() => copyToClipboard(user.email, index * 3)}
                        >
                          {copiedIndex === index * 3 ? (
                            <>
                              <FaClipboardCheck className="mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <FaClipboard className="mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.password}</div>
                        <button
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                          onClick={() => copyToClipboard(user.password, index * 3 + 1)}
                        >
                          {copiedIndex === index * 3 + 1 ? (
                            <>
                              <FaClipboardCheck className="mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <FaClipboard className="mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.scenario === TestScenario.NEW_MEMBER ? 'bg-green-100 text-green-800' : 
                            user.scenario === TestScenario.ESTABLISHED_MEMBER ? 'bg-blue-100 text-blue-800' : 
                            user.scenario === TestScenario.HIGH_PERFORMER ? 'bg-purple-100 text-purple-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {user.scenario.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                          onClick={() => {
                            const loginUrl = `/login?email=${encodeURIComponent(user.email)}&password=${encodeURIComponent(user.password)}`;
                            window.open(loginUrl, '_blank');
                          }}
                        >
                          Login as User
                          <FaArrowRight className="ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Test Data Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-medium text-gray-700">Test Data Statistics</h2>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-500 text-xl font-semibold">{stats.usersCreated}</div>
                  <div className="text-sm text-gray-600">Users Created</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-500 text-xl font-semibold">{stats.downlinesCreated}</div>
                  <div className="text-sm text-gray-600">Downlines Created</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-500 text-xl font-semibold">{stats.purchasesCreated}</div>
                  <div className="text-sm text-gray-600">Purchases Created</div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-yellow-600 text-xl font-semibold">{stats.rebatesGenerated}</div>
                  <div className="text-sm text-gray-600">Rebates Generated</div>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-indigo-500 text-xl font-semibold">{stats.referralLinksCreated}</div>
                  <div className="text-sm text-gray-600">Referral Links Created</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="font-medium text-gray-700 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-500" />
              Test Scenarios
            </h2>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium flex items-center">
                  <FaUserPlus className="mr-2 text-green-500" />
                  New Member
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Creates a new member with no downline, no purchases, and no rebates. This is useful for testing the onboarding experience and empty states in the dashboard.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <FaUsers className="mr-2 text-blue-500" />
                  Established Member
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Creates a member with a moderate downline (3-5 members), purchases (5-10), and rebates. This is useful for testing the typical user experience with some activity.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <FaUserTie className="mr-2 text-purple-500" />
                  High Performer
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Creates a high-performing member with a large downline (20-30 members), many purchases (20-30), and high earnings. This is useful for testing performance with large data sets and formatting of large numbers.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <FaUserSecret className="mr-2 text-red-500" />
                  Edge Cases
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Creates users with unusual data patterns, such as very long names, extreme values, etc. This is useful for testing edge cases and error handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
