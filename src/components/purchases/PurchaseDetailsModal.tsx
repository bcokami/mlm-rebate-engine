"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  FaTimes, 
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
  FaClock,
  FaExclamationTriangle
} from "react-icons/fa";

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

interface PurchaseDetailsModalProps {
  purchase: Purchase;
  onClose: () => void;
}

export default function PurchaseDetailsModal({
  purchase,
  onClose,
}: PurchaseDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "shipping" | "payment">("details");
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
          <div className="flex items-center text-yellow-600">
            <FaClock className="mr-2" />
            <span>Pending</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center text-blue-600">
            <FaBoxOpen className="mr-2" />
            <span>Processing</span>
          </div>
        );
      case 'shipped':
        return (
          <div className="flex items-center text-purple-600">
            <FaShippingFast className="mr-2" />
            <span>Shipped</span>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center text-green-600">
            <FaCheck className="mr-2" />
            <span>Delivered</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center text-red-600">
            <FaTimes className="mr-2" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600">
            <span>{status}</span>
          </div>
        );
    }
  };
  
  const renderShippingDetails = () => {
    if (!purchase.shippingDetails) return null;
    
    try {
      const details = JSON.parse(purchase.shippingDetails);
      
      return (
        <div className="mt-4 space-y-2">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600">{key}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error parsing shipping details:", error);
      return (
        <div className="mt-4 text-red-500">
          Error parsing shipping details
        </div>
      );
    }
  };
  
  const renderPaymentDetails = () => {
    if (!purchase.paymentDetails) return null;
    
    try {
      const details = JSON.parse(purchase.paymentDetails);
      
      return (
        <div className="mt-4 space-y-2">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600">{key}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error parsing payment details:", error);
      return (
        <div className="mt-4 text-red-500">
          Error parsing payment details
        </div>
      );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Purchase Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="md:w-1/3">
              <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-200">
                {purchase.product.image ? (
                  <Image
                    src={purchase.product.image}
                    alt={purchase.product.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <FaShoppingCart className="text-gray-400 text-4xl" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{purchase.product.name}</h2>
                  <p className="text-gray-500">Order #{purchase.id}</p>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-400 mr-1" />
                  <span className="text-sm text-gray-500">{formatDate(purchase.createdAt)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Price per unit</h4>
                  <p className="text-lg font-semibold">{formatCurrency(purchase.product.price)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                  <p className="text-lg font-semibold">{purchase.quantity}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">PV</h4>
                  <p className="text-lg font-semibold">{purchase.totalPV}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="text-lg font-semibold">{purchase.status}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(purchase.product.price * purchase.quantity)}</span>
                </div>
                
                {purchase.shippingFee !== null && purchase.shippingFee > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-700">Shipping Fee:</span>
                    <span className="font-medium">{formatCurrency(purchase.shippingFee)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(purchase.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("details")}
              >
                Order Details
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "shipping"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("shipping")}
              >
                Shipping
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "payment"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("payment")}
              >
                Payment
              </button>
            </div>
            
            <div className="py-4">
              {activeTab === "details" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Order Summary</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Product:</span>
                        <span className="font-medium">{purchase.product.name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Price per unit:</span>
                        <span className="font-medium">{formatCurrency(purchase.product.price)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{purchase.quantity}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">PV:</span>
                        <span className="font-medium">{purchase.totalPV}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">{formatDate(purchase.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Status:</span>
                        <span className="font-medium">{purchase.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "shipping" && (
                <div className="space-y-4">
                  {purchase.shippingMethod ? (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Method</h4>
                        <div className="bg-gray-50 p-4 rounded-md flex items-start">
                          <div className="mr-3 text-xl">
                            {renderShippingMethodIcon(purchase.shippingMethod.code)}
                          </div>
                          <div>
                            <div className="font-medium">{purchase.shippingMethod.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {purchase.shippingFee !== null && purchase.shippingFee > 0
                                ? `Shipping Fee: ${formatCurrency(purchase.shippingFee)}`
                                : "Free Shipping"}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {purchase.shippingStatus && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Status</h4>
                          <div className="bg-gray-50 p-4 rounded-md">
                            {renderShippingStatus(purchase.shippingStatus)}
                            
                            {purchase.trackingNumber && (
                              <div className="mt-2">
                                <span className="text-gray-600">Tracking Number:</span>
                                <span className="font-medium ml-2">{purchase.trackingNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {purchase.shippingAddress && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Address</h4>
                          <div className="bg-gray-50 p-4 rounded-md flex items-start">
                            <FaMapMarkerAlt className="text-red-500 mt-1 mr-2" />
                            <div className="text-gray-800">{purchase.shippingAddress}</div>
                          </div>
                        </div>
                      )}
                      
                      {purchase.shippingDetails && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Details</h4>
                          <div className="bg-gray-50 p-4 rounded-md">
                            {renderShippingDetails()}
                          </div>
                        </div>
                      )}
                      
                      {purchase.shippingMethod.code === 'pickup' && (
                        <div className="bg-blue-50 p-4 rounded-md flex items-start">
                          <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
                          <div>
                            <div className="font-medium text-blue-700">Store Pickup Information</div>
                            <p className="text-sm text-blue-600 mt-1">
                              You can pick up your order at our store located at: 
                              <strong> 123 Main Street, Makati City, Metro Manila</strong>
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                              Store Hours: Monday to Saturday, 9:00 AM to 6:00 PM
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-md flex items-start">
                      <FaExclamationTriangle className="text-yellow-500 mt-1 mr-2" />
                      <div>
                        <div className="font-medium text-yellow-700">No Shipping Information</div>
                        <p className="text-sm text-yellow-600 mt-1">
                          This order does not have shipping information.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "payment" && (
                <div className="space-y-4">
                  {purchase.paymentMethod ? (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
                        <div className="bg-gray-50 p-4 rounded-md flex items-start">
                          <FaMoneyBillWave className="text-green-500 mt-1 mr-2" />
                          <div>
                            <div className="font-medium">{purchase.paymentMethod.name}</div>
                            {purchase.referenceNumber && (
                              <div className="text-sm text-gray-600 mt-1">
                                Reference Number: {purchase.referenceNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {purchase.paymentDetails && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h4>
                          <div className="bg-gray-50 p-4 rounded-md">
                            {renderPaymentDetails()}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-md flex items-start">
                      <FaExclamationTriangle className="text-yellow-500 mt-1 mr-2" />
                      <div>
                        <div className="font-medium text-yellow-700">No Payment Information</div>
                        <p className="text-sm text-yellow-600 mt-1">
                          This order does not have payment information.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Summary</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(purchase.product.price * purchase.quantity)}</span>
                      </div>
                      
                      {purchase.shippingFee !== null && purchase.shippingFee > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Shipping Fee:</span>
                          <span className="font-medium">{formatCurrency(purchase.shippingFee)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(purchase.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
