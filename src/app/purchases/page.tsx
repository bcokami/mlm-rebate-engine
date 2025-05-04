"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { 
  FaSpinner, 
  FaShoppingCart, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaShippingFast,
  FaStore,
  FaMotorcycle,
  FaTruck,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaBoxOpen,
  FaCheck,
  FaTimes,
  FaClock
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import PurchaseDetailsModal from "@/components/purchases/PurchaseDetailsModal";

interface Purchase {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  totalAmount: number;
  totalPV: number;
  status: string;
  paymentMethodId: number | null;
  paymentDetails: string | null;
  referenceNumber: string | null;
  shippingMethodId: number | null;
  shippingDetails: string | null;
  shippingAddress: string | null;
  shippingFee: number | null;
  trackingNumber: string | null;
  shippingStatus: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    price: number;
    pv: number;
    image: string | null;
  };
  paymentMethod: {
    id: number;
    name: string;
    code: string;
  } | null;
  shippingMethod: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export default function PurchasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch purchases
  useEffect(() => {
    if (status === "authenticated") {
      fetchPurchases();
    }
  }, [status, pagination.offset, pagination.limit]);
  
  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/purchases?limit=${pagination.limit}&offset=${pagination.offset}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch purchases: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPurchases(data.purchases || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setError("Failed to load purchases. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newOffset: number) => {
    setPagination({ ...pagination, offset: newOffset });
  };
  
  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsModal(true);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const renderShippingMethodIcon = (code: string | undefined) => {
    if (!code) return <FaShippingFast className="text-gray-500" />;
    
    switch (code) {
      case 'pickup':
        return <FaStore className="text-blue-500" />;
      case 'lalamove':
        return <FaMotorcycle className="text-orange-500" />;
      case 'jnt':
        return <FaTruck className="text-red-500" />;
      default:
        return <FaShippingFast className="text-gray-500" />;
    }
  };
  
  const renderShippingStatus = (status: string | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1" /> Pending
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaBoxOpen className="mr-1" /> Processing
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            <FaShippingFast className="mr-1" /> Shipped
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FaCheck className="mr-1" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <FaTimes className="mr-1" /> Cancelled
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
  
  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span>Loading purchases...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Purchases</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {purchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No purchases yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't made any purchases yet. Start shopping to see your purchase history.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipping
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            {purchase.product.image ? (
                              <Image
                                src={purchase.product.image}
                                alt={purchase.product.name}
                                fill
                                className="rounded-md object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                                <FaShoppingCart className="text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {purchase.product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Quantity: {purchase.quantity}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(purchase.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.totalPV} PV
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {purchase.shippingMethod ? (
                          <div>
                            <div className="flex items-center text-sm font-medium text-gray-900">
                              {renderShippingMethodIcon(purchase.shippingMethod.code)}
                              <span className="ml-1">{purchase.shippingMethod.name}</span>
                            </div>
                            <div className="mt-1">
                              {renderShippingStatus(purchase.shippingStatus)}
                            </div>
                            {purchase.trackingNumber && (
                              <div className="text-xs text-gray-500 mt-1">
                                Tracking: {purchase.trackingNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {purchase.paymentMethod ? (
                          <div className="text-sm text-gray-900">
                            {purchase.paymentMethod.name}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not specified</span>
                        )}
                        {purchase.referenceNumber && (
                          <div className="text-xs text-gray-500">
                            Ref: {purchase.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-1" />
                          {formatDate(purchase.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(purchase)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to{" "}
                  {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
                  {pagination.total} purchases
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                    disabled={pagination.offset === 0}
                    className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                    disabled={!pagination.hasMore}
                    className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Purchase Details Modal */}
      {showDetailsModal && selectedPurchase && (
        <PurchaseDetailsModal
          purchase={selectedPurchase}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </MainLayout>
  );
}
