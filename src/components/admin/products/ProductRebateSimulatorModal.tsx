"use client";

import { useState, useEffect } from "react";
import { 
  FaTimes, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaCalculator,
  FaChartLine
} from "react-icons/fa";

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

interface RebateSimulation {
  level: number;
  rebate: number;
}

interface ProductRebateSimulatorModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductRebateSimulatorModal({
  product,
  onClose,
}: ProductRebateSimulatorModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [maxLevel, setMaxLevel] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<RebateSimulation[]>([]);
  
  useEffect(() => {
    simulateRebates();
  }, [quantity, maxLevel]);
  
  const simulateRebates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/admin/products/${product.id}?action=simulate&quantity=${quantity}&maxLevel=${maxLevel}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to simulate rebates: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSimulation(data.simulation || []);
    } catch (error) {
      console.error("Error simulating rebates:", error);
      setError("Failed to simulate rebates");
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
  
  const totalRebate = simulation.reduce((sum, item) => sum + item.rebate, 0);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Rebate Simulator</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Simulate rebate amounts for <strong>{product.name}</strong> at different levels in the MLM structure.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="maxLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Level
                </label>
                <input
                  type="number"
                  id="maxLevel"
                  value={maxLevel}
                  onChange={(e) => setMaxLevel(Math.max(1, Math.min(10, parseInt(e.target.value) || 6)))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Product Price</h3>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(product.price)}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-1">Product PV</h3>
                <p className="text-xl font-bold text-green-900">{product.pv}</p>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md flex items-center">
                <FaExclamationTriangle className="mr-2" />
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <FaSpinner className="animate-spin text-blue-500 mr-2" />
                <span>Calculating rebates...</span>
              </div>
            ) : (
              <div>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rebate Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % of Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {simulation.map((item) => (
                        <tr key={item.level}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Level {item.level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.rebate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {((item.rebate / (product.price * quantity)) * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Total
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(totalRebate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {((totalRebate / (product.price * quantity)) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <FaCalculator className="text-yellow-600 mt-1 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800 mb-1">Rebate Summary</h3>
                      <p className="text-sm text-yellow-700">
                        For {quantity} unit(s) of {product.name} at {formatCurrency(product.price * quantity)}, 
                        the total rebate payout across {maxLevel} levels would be {formatCurrency(totalRebate)}, 
                        which is {((totalRebate / (product.price * quantity)) * 100).toFixed(2)}% of the purchase price.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
