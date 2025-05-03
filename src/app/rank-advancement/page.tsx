"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import {
  FaTrophy,
  FaChartLine,
  FaUsers,
  FaShoppingCart,
  FaArrowUp,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaHistory,
  FaMedal
} from "react-icons/fa";

interface RankRequirement {
  required: number;
  actual: number;
  qualified: boolean;
}

interface RankAdvancementEligibility {
  eligible: boolean;
  currentRank: {
    id: number;
    name: string;
    level: number;
  };
  nextRank: {
    id: number;
    name: string;
    level: number;
  } | null;
  requirements?: {
    personalSales: RankRequirement;
    groupSales: RankRequirement;
    directDownline: RankRequirement;
    qualifiedDownline: RankRequirement & {
      qualifiedRankId: number | null;
    };
  };
  message: string;
}

interface RankAdvancement {
  id: number;
  userId: number;
  previousRankId: number;
  newRankId: number;
  personalSales: number;
  groupSales: number;
  directDownlineCount: number;
  qualifiedDownlineCount: number;
  createdAt: string;
  previousRank: {
    name: string;
    level: number;
  };
  newRank: {
    name: string;
    level: number;
  };
}

export default function RankAdvancementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<RankAdvancementEligibility | null>(null);
  const [history, setHistory] = useState<RankAdvancement[]>([]);
  const [processingAdvancement, setProcessingAdvancement] = useState(false);
  const [advancementResult, setAdvancementResult] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEligibility();
      fetchHistory();
    }
  }, [status]);

  const fetchEligibility = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/rank-advancement");
      if (!response.ok) {
        throw new Error("Failed to fetch rank advancement eligibility");
      }
      const data = await response.json();
      setEligibility(data);
    } catch (error) {
      console.error("Error fetching rank advancement eligibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/users/rank-advancement/history");
      if (!response.ok) {
        throw new Error("Failed to fetch rank advancement history");
      }
      const data = await response.json();
      setHistory(data.rankAdvancements || []);
    } catch (error) {
      console.error("Error fetching rank advancement history:", error);
    }
  };

  const handleAdvancement = async () => {
    if (!eligibility?.eligible) return;

    setProcessingAdvancement(true);
    try {
      const response = await fetch("/api/users/rank-advancement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to process rank advancement");
      }

      const result = await response.json();
      setAdvancementResult(result);

      if (result.success) {
        // Refresh eligibility and history after successful advancement
        await fetchEligibility();
        await fetchHistory();
      }
    } catch (error) {
      console.error("Error processing rank advancement:", error);
      setAdvancementResult({
        success: false,
        message: "An error occurred while processing your rank advancement.",
      });
    } finally {
      setProcessingAdvancement(false);
    }
  };

  const getRankColor = (rankName: string) => {
    switch (rankName?.toLowerCase()) {
      case "starter":
        return "bg-gray-100 text-gray-800";
      case "bronze":
        return "bg-yellow-100 text-yellow-800";
      case "silver":
        return "bg-gray-200 text-gray-800";
      case "gold":
        return "bg-yellow-200 text-yellow-800";
      case "platinum":
        return "bg-blue-100 text-blue-800";
      case "diamond":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-semibold mb-6 flex items-center">
          <FaTrophy className="mr-2 text-yellow-500" /> Rank Advancement
        </h1>

        {/* Current Rank */}
        {eligibility && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaMedal className="mr-2 text-blue-500" /> Your Current Rank
            </h2>
            <div className="flex items-center">
              <div className={`px-4 py-2 rounded-full text-lg font-medium ${getRankColor(eligibility.currentRank.name)}`}>
                {eligibility.currentRank.name}
              </div>
              {eligibility.nextRank && (
                <div className="flex items-center ml-4">
                  <FaArrowUp className="text-gray-400 mx-2" />
                  <div className="text-gray-500">Next: {eligibility.nextRank.name}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advancement Requirements */}
        {eligibility && eligibility.nextRank && eligibility.requirements && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaChartLine className="mr-2 text-green-500" /> Requirements for {eligibility.nextRank.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Sales */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <FaShoppingCart className="text-blue-500 mr-2" />
                    <h3 className="font-medium">Personal Sales</h3>
                  </div>
                  {eligibility.requirements.personalSales.qualified ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      ₱{eligibility.requirements.personalSales.actual.toLocaleString()} / 
                      ₱{eligibility.requirements.personalSales.required.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getProgressColor(
                        (eligibility.requirements.personalSales.actual / eligibility.requirements.personalSales.required) * 100
                      )}`}
                      style={{
                        width: `${Math.min(
                          (eligibility.requirements.personalSales.actual / eligibility.requirements.personalSales.required) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Group Sales */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <FaShoppingCart className="text-purple-500 mr-2" />
                    <h3 className="font-medium">Group Sales</h3>
                  </div>
                  {eligibility.requirements.groupSales.qualified ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      ₱{eligibility.requirements.groupSales.actual.toLocaleString()} / 
                      ₱{eligibility.requirements.groupSales.required.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getProgressColor(
                        (eligibility.requirements.groupSales.actual / eligibility.requirements.groupSales.required) * 100
                      )}`}
                      style={{
                        width: `${Math.min(
                          (eligibility.requirements.groupSales.actual / eligibility.requirements.groupSales.required) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Direct Downline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <FaUsers className="text-green-500 mr-2" />
                    <h3 className="font-medium">Direct Downline</h3>
                  </div>
                  {eligibility.requirements.directDownline.qualified ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      {eligibility.requirements.directDownline.actual} / 
                      {eligibility.requirements.directDownline.required}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getProgressColor(
                        (eligibility.requirements.directDownline.actual / eligibility.requirements.directDownline.required) * 100
                      )}`}
                      style={{
                        width: `${Math.min(
                          (eligibility.requirements.directDownline.actual / eligibility.requirements.directDownline.required) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Qualified Downline */}
              {eligibility.requirements.qualifiedDownline.required > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <FaUsers className="text-yellow-500 mr-2" />
                      <h3 className="font-medium">Qualified Downline</h3>
                    </div>
                    {eligibility.requirements.qualifiedDownline.qualified ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaTimes className="text-red-500" />
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>
                        {eligibility.requirements.qualifiedDownline.actual} / 
                        {eligibility.requirements.qualifiedDownline.required}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getProgressColor(
                          (eligibility.requirements.qualifiedDownline.actual / eligibility.requirements.qualifiedDownline.required) * 100
                        )}`}
                        style={{
                          width: `${Math.min(
                            (eligibility.requirements.qualifiedDownline.actual / eligibility.requirements.qualifiedDownline.required) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advancement Status */}
            <div className="mt-6 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                {eligibility.eligible ? (
                  <>
                    <div className="p-2 rounded-full bg-green-100 text-green-500 mr-3">
                      <FaCheck />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-600">You are eligible for advancement!</h3>
                      <p className="text-sm text-gray-600">
                        You have met all the requirements to advance to {eligibility.nextRank.name}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-full bg-yellow-100 text-yellow-500 mr-3">
                      <FaArrowUp />
                    </div>
                    <div>
                      <h3 className="font-medium text-yellow-600">Keep working towards your next rank!</h3>
                      <p className="text-sm text-gray-600">
                        Continue building your network and increasing your sales to reach {eligibility.nextRank.name}.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {eligibility.eligible && (
                <div className="mt-4">
                  <button
                    onClick={handleAdvancement}
                    disabled={processingAdvancement}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processingAdvancement ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Processing...
                      </>
                    ) : (
                      <>
                        <FaArrowUp className="mr-2" /> Advance to {eligibility.nextRank.name}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Advancement Result */}
            {advancementResult && (
              <div className={`mt-4 p-4 rounded-lg ${advancementResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {advancementResult.success ? (
                    <FaCheck className="text-green-500 mr-2" />
                  ) : (
                    <FaTimes className="text-red-500 mr-2" />
                  )}
                  <p className={advancementResult.success ? 'text-green-700' : 'text-red-700'}>
                    {advancementResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Highest Rank Message */}
        {eligibility && !eligibility.nextRank && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <FaTrophy className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Congratulations!</h2>
                <p className="text-gray-600">
                  You have reached the highest rank in our program: <span className="font-medium">{eligibility.currentRank.name}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rank Advancement History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <FaHistory className="mr-2 text-blue-500" /> Rank Advancement History
            </h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-500 hover:text-blue-700"
            >
              {showHistory ? "Hide" : "Show"}
            </button>
          </div>
          
          {showHistory && (
            <div className="p-6">
              {history.length > 0 ? (
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
                          To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Personal Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Direct Downline
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((advancement) => (
                        <tr key={advancement.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(advancement.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getRankColor(advancement.previousRank.name)}`}>
                              {advancement.previousRank.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getRankColor(advancement.newRank.name)}`}>
                              {advancement.newRank.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₱{advancement.personalSales.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₱{advancement.groupSales.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {advancement.directDownlineCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No rank advancement history found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
