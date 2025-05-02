"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { FaWallet, FaArrowUp, FaArrowDown } from "react-icons/fa";

interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch wallet data
      const fetchWalletData = async () => {
        try {
          const response = await fetch("/api/wallet");
          const data = await response.json();
          setWalletData(data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching wallet data:", error);
          setLoading(false);
        }
      };

      fetchWalletData();
    }
  }, [status]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid amount",
      });
      return;
    }

    if (amount > walletData.balance) {
      setMessage({
        type: "error",
        text: "Insufficient balance",
      });
      return;
    }

    setWithdrawLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          type: "withdrawal",
          description: withdrawDescription || "Withdrawal request",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal");
      }

      // Refresh wallet data
      const walletResponse = await fetch("/api/wallet");
      const walletData = await walletResponse.json();
      setWalletData(walletData);

      setMessage({
        type: "success",
        text: "Withdrawal request processed successfully",
      });

      // Reset form
      setWithdrawAmount("");
      setWithdrawDescription("");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred during withdrawal",
      });
    } finally {
      setWithdrawLoading(false);
    }
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
        <h1 className="text-2xl font-semibold mb-6">Wallet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <FaWallet className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">Wallet Balance</h2>
              </div>
              <div className="text-3xl font-bold mb-4">
                ${walletData.balance.toFixed(2)}
              </div>

              {/* Withdrawal Form */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>

                {message.text && (
                  <div
                    className={`mb-4 p-3 rounded-md text-sm ${
                      message.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleWithdraw}>
                  <div className="mb-4">
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      max={walletData.balance}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      id="description"
                      value={withdrawDescription}
                      onChange={(e) => setWithdrawDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {withdrawLoading ? "Processing..." : "Withdraw"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Transaction History</h2>
              </div>
              <div className="p-6">
                {walletData.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {walletData.transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.type === "rebate"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.type === "withdrawal"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {transaction.type === "rebate" ? (
                                  <FaArrowDown className="mr-1" />
                                ) : (
                                  <FaArrowUp className="mr-1" />
                                )}
                                {transaction.type.charAt(0).toUpperCase() +
                                  transaction.type.slice(1)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span
                                className={
                                  transaction.type === "withdrawal"
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {transaction.type === "withdrawal" ? "-" : "+"}$
                                {transaction.amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {transaction.status.charAt(0).toUpperCase() +
                                  transaction.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No transactions yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
