"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { 
  FaSpinner, 
  FaMoneyBillWave, 
  FaShoppingCart, 
  FaUser, 
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaTimes
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

interface ReferralCommission {
  id: number;
  purchaseId: number;
  linkId: number;
  referrerId: number;
  buyerId: number;
  productId: number;
  amount: number;
  percentage: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  purchase: {
    id: number;
    quantity: number;
    totalAmount: number;
    createdAt: string;
  };
  buyer: {
    id: number;
    name: string;
    email: string;
  };
  product: {
    id: number;
    name: string;
    price: number;
    image: string | null;
  };
  link: {
    id: number;
    code: string;
    type: string;
  };
}

export default function ReferralCommissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  const [filter, setFilter] = useState<string>("all");
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch referral commissions
  useEffect(() => {
    if (status === "authenticated") {
      fetchReferralCommissions();
    }
  }, [status, filter]);
  
  const fetchReferralCommissions = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      let url = "/api/referrals/commissions";
      
      if (filter !== "all") {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch referral commissions: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCommissions(data.commissions || []);
    } catch (error) {
      console.error("Error fetching referral commissions:", error);
      setMessage({
        type: "error",
        text: "Failed to load referral commissions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1" /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaCheck className="mr-1" /> Approved
          </span>
        );
      case "paid":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FaMoneyBillWave className="mr-1" /> Paid
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <FaTimes className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  const calculateTotalCommissions = () => {
    return commissions.reduce((total, commission) => total + commission.amount, 0);
  };
  
  const calculatePendingCommissions = () => {
    return commissions
      .filter(commission => commission.status === "pending" || commission.status === "approved")
      .reduce((total, commission) => total + commission.amount, 0);
  };
  
  const calculatePaidCommissions = () => {
    return commissions
      .filter(commission => commission.status === "paid")
      .reduce((total, commission) => total + commission.amount, 0);
  };
  
  if (status === "loading" || loading) {
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
        <h1 className="text-2xl font-bold mb-6">Referral Commissions</h1>
        
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
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaMoneyBillWave className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Commissions</div>
                <div className="text-xl font-bold">{formatCurrency(calculateTotalCommissions())}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <FaClock className="text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Pending Commissions</div>
                <div className="text-xl font-bold">{formatCurrency(calculatePendingCommissions())}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FaCheck className="text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Paid Commissions</div>
                <div className="text-xl font-bold">{formatCurrency(calculatePaidCommissions())}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center">
            <div className="mr-4 mb-2">
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("pending")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setFilter("approved")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "approved"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setFilter("paid")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "paid"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setFilter("rejected")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "rejected"
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>
        
        {/* Commissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Commission History</h2>
          </div>
          
          <div className="p-4">
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No referral commissions found.</p>
                <p className="mt-2">
                  Start sharing products to earn commissions! Visit the <Link href="/referrals" className="text-blue-600 hover:underline">Referrals</Link> page.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.map((commission) => (
                      <tr key={commission.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {commission.product.image ? (
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                <Image
                                  src={commission.product.image}
                                  alt={commission.product.name}
                                  width={40}
                                  height={40}
                                  className="rounded-md object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                                <FaShoppingCart className="text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {commission.product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(commission.product.price)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <FaUser className="text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {commission.buyer.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {commission.buyer.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <FaShoppingCart className="text-gray-500 mr-1" />
                              <span>Quantity: {commission.purchase.quantity}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <FaMoneyBillWave className="text-gray-500 mr-1" />
                              <span>Total: {formatCurrency(commission.purchase.totalAmount)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium text-green-600">
                              {formatCurrency(commission.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commission.percentage.toFixed(2)}% commission
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(commission.status)}
                          {commission.status === "paid" && commission.paidAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Paid on {formatDate(commission.paidAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-gray-400 mr-1" />
                            {formatDate(commission.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Earn More Commissions!</h3>
          <p className="text-gray-700 mb-4">
            Share more products with your network to increase your earnings.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/shop"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Browse Products
            </Link>
            <Link
              href="/referrals"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Manage Referral Links
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
