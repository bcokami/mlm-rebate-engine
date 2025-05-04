"use client";

import { useState } from "react";
import { FaClone, FaTimes, FaSpinner } from "react-icons/fa";

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

interface ProductCloneModalProps {
  product: Product;
  onClose: () => void;
  onClone: (productId: number, newSku: string) => Promise<{ error?: string; success?: boolean }>;
}

export default function ProductCloneModal({
  product,
  onClose,
  onClone,
}: ProductCloneModalProps) {
  const [newSku, setNewSku] = useState(`${product.sku}-COPY`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newSku) {
      setError("SKU is required");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await onClone(product.id, newSku);
      
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } catch (err) {
      setError("An error occurred while cloning the product");
      console.error("Clone error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Clone Product</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                You are about to clone <strong>{product.name}</strong>. The cloned product will have the same properties but will be inactive by default.
              </p>
              
              <div className="mb-4">
                <label htmlFor="newSku" className="block text-sm font-medium text-gray-700 mb-1">
                  New SKU *
                </label>
                <input
                  type="text"
                  id="newSku"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  SKU must be unique across all products
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                  {error}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !newSku}
                className={`px-4 py-2 rounded-md flex items-center ${
                  loading || !newSku
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <FaClone className="mr-2" />
                    Clone Product
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
