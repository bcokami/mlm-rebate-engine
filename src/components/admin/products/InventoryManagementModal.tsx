"use client";

import { useState, useEffect } from "react";
import { 
  FaBoxOpen, 
  FaTimes, 
  FaSpinner, 
  FaPlus, 
  FaMinus, 
  FaHistory,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheck
} from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  sku: string;
  inventory: number;
  lowStockThreshold?: number | null;
}

interface InventoryTransaction {
  id: number;
  quantity: number;
  type: string;
  reference: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

interface InventoryManagementModalProps {
  product: Product;
  onClose: () => void;
  onUpdate: (productId: number, data: any) => Promise<{ error?: string }>;
}

export default function InventoryManagementModal({
  product,
  onClose,
  onUpdate,
}: InventoryManagementModalProps) {
  const [currentInventory, setCurrentInventory] = useState<number>(product.inventory);
  const [lowStockThreshold, setLowStockThreshold] = useState<string>(
    product.lowStockThreshold?.toString() || ""
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>("0");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch inventory transactions
  useEffect(() => {
    fetchInventoryTransactions();
  }, []);
  
  const fetchInventoryTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const response = await fetch(`/api/admin/products/${product.id}/inventory-transactions`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory transactions");
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Error fetching inventory transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };
  
  const handleAdjustInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const quantity = parseInt(adjustmentQuantity);
      
      if (isNaN(quantity) || quantity <= 0) {
        setError("Please enter a valid quantity");
        setLoading(false);
        return;
      }
      
      // Calculate the actual adjustment value based on type
      const adjustmentValue = adjustmentType === "add" ? quantity : -quantity;
      
      // Validate that we don't go below zero
      if (currentInventory + adjustmentValue < 0) {
        setError("Adjustment would result in negative inventory");
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/admin/products/${product.id}/adjust-inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: adjustmentValue,
          notes: adjustmentNotes,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to adjust inventory");
      }
      
      const data = await response.json();
      
      // Update local state
      setCurrentInventory(data.newInventory);
      setAdjustmentQuantity("0");
      setAdjustmentNotes("");
      setSuccess(`Inventory ${adjustmentType === "add" ? "increased" : "decreased"} by ${quantity}`);
      
      // Refresh transactions
      fetchInventoryTransactions();
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateThreshold = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const threshold = lowStockThreshold === "" ? null : parseInt(lowStockThreshold);
      
      if (lowStockThreshold !== "" && (isNaN(threshold!) || threshold! < 0)) {
        setError("Please enter a valid threshold value");
        setLoading(false);
        return;
      }
      
      const result = await onUpdate(product.id, {
        lowStockThreshold: threshold,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccess("Low stock threshold updated successfully");
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "purchase":
        return "Purchase";
      case "adjustment":
        return "Manual Adjustment";
      case "return":
        return "Return";
      case "restock":
        return "Restock";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <FaBoxOpen className="mr-2 text-blue-500" />
            Inventory Management: {product.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md flex items-start">
              <FaExclamationTriangle className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md flex items-start">
              <FaCheck className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Inventory */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Current Inventory</h4>
              <div className="text-3xl font-bold text-blue-600">{currentInventory}</div>
              <div className="text-sm text-gray-500 mt-1">
                SKU: {product.sku}
              </div>
              
              {product.lowStockThreshold !== null && product.lowStockThreshold !== undefined && (
                <div className={`mt-2 text-sm ${
                  currentInventory <= product.lowStockThreshold 
                    ? "text-red-600 font-medium" 
                    : "text-gray-600"
                }`}>
                  {currentInventory <= product.lowStockThreshold ? (
                    <div className="flex items-center">
                      <FaExclamationTriangle className="mr-1" />
                      Low Stock Alert! Below threshold of {product.lowStockThreshold}
                    </div>
                  ) : (
                    <div>
                      Low stock threshold: {product.lowStockThreshold}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Low Stock Threshold */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Low Stock Threshold</h4>
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    min="0"
                    placeholder="No threshold set"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleUpdateThreshold}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : "Update"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set a threshold to receive notifications when inventory falls below this level. Leave empty for no alerts.
              </p>
            </div>
          </div>
          
          {/* Inventory Adjustment */}
          <div className="bg-white border rounded-md p-4 mb-6">
            <h4 className="font-medium mb-3">Adjust Inventory</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as "add" | "subtract")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="add">Add Stock</option>
                  <option value="subtract">Remove Stock</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleAdjustInventory}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : adjustmentType === "add" ? (
                    <FaPlus className="mr-2" />
                  ) : (
                    <FaMinus className="mr-2" />
                  )}
                  {adjustmentType === "add" ? "Add Stock" : "Remove Stock"}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                rows={2}
                placeholder="Enter reason for adjustment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          
          {/* Inventory History */}
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <FaHistory className="mr-2 text-gray-600" />
              Inventory History
            </h4>
            
            {transactionsLoading ? (
              <div className="text-center py-8">
                <FaSpinner className="animate-spin mx-auto text-blue-500 text-2xl mb-2" />
                <p>Loading inventory history...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-500">No inventory transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTransactionTypeLabel(transaction.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            transaction.quantity > 0 
                              ? "text-green-600" 
                              : "text-red-600"
                          }`}>
                            {transaction.quantity > 0 ? "+" : ""}{transaction.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.reference || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {transaction.notes || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.createdByName || "System"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
