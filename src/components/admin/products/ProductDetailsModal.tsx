"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  FaTimes, 
  FaEdit, 
  FaChartLine, 
  FaHistory, 
  FaTag, 
  FaSpinner,
  FaCalendarAlt,
  FaUser,
  FaExclamationTriangle
} from "react-icons/fa";
import ProductSalesChart from "./ProductSalesChart";

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  pv: number;
  binaryValue: number;
  inventory: number;
  tags: string | null;
  image: string | null;
  isActive: boolean;
  referralCommissionType: string | null;
  referralCommissionValue: number | null;
  lastUpdatedBy: number | null;
  lastUpdatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductAudit {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProductSalesHistory {
  id: number;
  productId: number;
  year: number;
  month: number;
  quantity: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onEdit,
}: ProductDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "sales" | "audit">("details");
  const [auditLogs, setAuditLogs] = useState<ProductAudit[]>([]);
  const [salesHistory, setSalesHistory] = useState<ProductSalesHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    } else if (activeTab === "sales") {
      fetchSalesHistory();
    }
  }, [activeTab]);
  
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/products/${product.id}?action=audit`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSalesHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/products/${product.id}?action=sales`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sales history: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSalesHistory(data.salesHistory || []);
    } catch (error) {
      console.error("Error fetching sales history:", error);
      setError("Failed to load sales history");
    } finally {
      setLoading(false);
    }
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
    return date.toLocaleString();
  };
  
  const renderTags = () => {
    if (!product.tags) return null;
    
    const tags = product.tags.split(",").map(tag => tag.trim());
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };
  
  const renderAuditAction = (action: string) => {
    switch (action) {
      case "create":
        return <span className="text-green-600">Created</span>;
      case "update":
        return <span className="text-blue-600">Updated</span>;
      case "delete":
        return <span className="text-red-600">Deleted</span>;
      case "activate":
        return <span className="text-green-600">Activated</span>;
      case "deactivate":
        return <span className="text-orange-600">Deactivated</span>;
      case "clone":
        return <span className="text-purple-600">Cloned</span>;
      case "update_inventory":
        return <span className="text-blue-600">Updated Inventory</span>;
      default:
        return <span>{action}</span>;
    }
  };
  
  const renderAuditDetails = (details: string | null) => {
    if (!details) return null;
    
    try {
      const parsedDetails = JSON.parse(details);
      
      return (
        <div className="mt-1 text-xs">
          {Object.entries(parsedDetails).map(([key, value]: [string, any]) => (
            <div key={key} className="mb-1">
              <span className="font-medium">{key}: </span>
              {value && typeof value === "object" && "from" in value && "to" in value ? (
                <span>
                  <span className="line-through">{value.from}</span> → <span className="font-medium">{value.to}</span>
                </span>
              ) : (
                <span>{JSON.stringify(value)}</span>
              )}
            </div>
          ))}
        </div>
      );
    } catch (error) {
      return <div className="mt-1 text-xs">{details}</div>;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Product Details</h3>
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
              <div className="relative w-full h-64 rounded-md overflow-hidden border border-gray-200">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{product.name}</h2>
                  <p className="text-gray-500">SKU: {product.sku}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Price</h4>
                  <p className="text-lg font-semibold">{formatCurrency(product.price)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Inventory</h4>
                  <p className="text-lg font-semibold">{product.inventory}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">PV (Point Value)</h4>
                  <p className="text-lg font-semibold">{product.pv}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">BV (Binary Value)</h4>
                  <p className="text-lg font-semibold">{product.binaryValue}</p>
                </div>
              </div>
              
              {product.referralCommissionType && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500">Referral Commission</h4>
                  <p className="text-lg font-semibold">
                    {product.referralCommissionType === "percentage"
                      ? `${product.referralCommissionValue}%`
                      : formatCurrency(product.referralCommissionValue || 0)}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      ({product.referralCommissionType === "percentage" ? "percentage" : "fixed"})
                    </span>
                  </p>
                </div>
              )}
              
              {product.tags && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Tags</h4>
                  {renderTags()}
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="text-gray-700 mt-1">{product.description || "No description provided"}</p>
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
                Details
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "sales"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("sales")}
              >
                Sales History
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "audit"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("audit")}
              >
                Audit Log
              </button>
            </div>
            
            <div className="py-4">
              {activeTab === "details" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                    <p className="flex items-center text-gray-700">
                      <FaCalendarAlt className="mr-1 text-gray-400" />
                      {formatDate(product.createdAt)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                    <p className="flex items-center text-gray-700">
                      <FaCalendarAlt className="mr-1 text-gray-400" />
                      {formatDate(product.updatedAt)}
                    </p>
                  </div>
                  
                  {product.lastUpdatedByName && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Last Updated By</h4>
                      <p className="flex items-center text-gray-700">
                        <FaUser className="mr-1 text-gray-400" />
                        {product.lastUpdatedByName}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "sales" && (
                <div>
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <FaSpinner className="animate-spin text-blue-500 mr-2" />
                      <span>Loading sales history...</span>
                    </div>
                  ) : error ? (
                    <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-center">
                      <FaExclamationTriangle className="mr-2" />
                      {error}
                    </div>
                  ) : salesHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaChartLine className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No sales history available for this product.</p>
                    </div>
                  ) : (
                    <div>
                      <ProductSalesChart salesHistory={salesHistory} />
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Sales</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Month
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Revenue
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {salesHistory
                                .sort((a, b) => {
                                  if (a.year !== b.year) return b.year - a.year;
                                  return b.month - a.month;
                                })
                                .map((history) => (
                                  <tr key={`${history.year}-${history.month}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(history.year, history.month - 1).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                      })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {history.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatCurrency(history.revenue)}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "audit" && (
                <div>
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <FaSpinner className="animate-spin text-blue-500 mr-2" />
                      <span>Loading audit logs...</span>
                    </div>
                  ) : error ? (
                    <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-center">
                      <FaExclamationTriangle className="mr-2" />
                      {error}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaHistory className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No audit logs available for this product.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Details
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(log.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.userName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {renderAuditAction(log.action)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {renderAuditDetails(log.details)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaEdit className="mr-2" />
              Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
