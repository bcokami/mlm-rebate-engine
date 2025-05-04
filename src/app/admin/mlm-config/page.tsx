"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { 
  FaSpinner, 
  FaExchangeAlt, 
  FaPercentage, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaTrophy, 
  FaSave, 
  FaPlus, 
  FaEdit, 
  FaTrash 
} from "react-icons/fa";

interface MlmConfiguration {
  mlmStructure: 'binary' | 'unilevel';
  pvCalculation: 'percentage' | 'fixed';
  performanceBonusEnabled: boolean;
  monthlyCutoffDay: number;
  binaryMaxDepth: number;
  unilevelMaxDepth: number;
}

interface PerformanceBonusTier {
  id: number;
  name: string;
  minSales: number;
  maxSales: number | null;
  bonusType: 'percentage' | 'fixed';
  percentage: number;
  fixedAmount: number;
  active: boolean;
}

export default function MlmConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<MlmConfiguration | null>(null);
  const [performanceTiers, setPerformanceTiers] = useState<PerformanceBonusTier[]>([]);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  
  // Form state for new/edit tier
  const [editingTier, setEditingTier] = useState<PerformanceBonusTier | null>(null);
  const [showTierForm, setShowTierForm] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch MLM configuration
  useEffect(() => {
    if (status === "authenticated") {
      fetchMlmConfig();
    }
  }, [status]);
  
  const fetchMlmConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mlm-config?includePerformanceTiers=true");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch MLM configuration: ${response.statusText}`);
      }
      
      const data = await response.json();
      setConfig(data.config);
      setPerformanceTiers(data.performanceTiers || []);
    } catch (error) {
      console.error("Error fetching MLM configuration:", error);
      setMessage({
        type: "error",
        text: "Failed to load MLM configuration. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch("/api/mlm-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "updateConfig",
          config,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update MLM configuration: ${response.statusText}`);
      }
      
      const data = await response.json();
      setConfig(data.config);
      
      setMessage({
        type: "success",
        text: "MLM configuration updated successfully.",
      });
    } catch (error) {
      console.error("Error updating MLM configuration:", error);
      setMessage({
        type: "error",
        text: "Failed to update MLM configuration. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveTier = async () => {
    if (!editingTier) return;
    
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const isNew = !editingTier.id;
      const action = isNew ? "createPerformanceTier" : "updatePerformanceTier";
      
      const response = await fetch("/api/mlm-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          tier: editingTier,
          tierId: isNew ? undefined : editingTier.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isNew ? "create" : "update"} performance tier: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Refresh performance tiers
      fetchMlmConfig();
      
      setMessage({
        type: "success",
        text: `Performance tier ${isNew ? "created" : "updated"} successfully.`,
      });
      
      // Reset form
      setEditingTier(null);
      setShowTierForm(false);
    } catch (error) {
      console.error("Error saving performance tier:", error);
      setMessage({
        type: "error",
        text: "Failed to save performance tier. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleConfigChange = (key: keyof MlmConfiguration, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [key]: value,
    });
  };
  
  const handleTierChange = (key: keyof PerformanceBonusTier, value: any) => {
    if (!editingTier) return;
    
    setEditingTier({
      ...editingTier,
      [key]: value,
    });
  };
  
  const addNewTier = () => {
    setEditingTier({
      id: 0, // Will be ignored for creation
      name: "",
      minSales: 0,
      maxSales: null,
      bonusType: "percentage",
      percentage: 0,
      fixedAmount: 0,
      active: true,
    });
    setShowTierForm(true);
  };
  
  const editTier = (tier: PerformanceBonusTier) => {
    setEditingTier({ ...tier });
    setShowTierForm(true);
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
        <h1 className="text-2xl font-bold mb-6">MLM Configuration</h1>
        
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
        
        {config && (
          <div className="grid grid-cols-1 gap-6">
            {/* Main Configuration */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">System Configuration</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MLM Structure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MLM Structure
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => handleConfigChange("mlmStructure", "binary")}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          config.mlmStructure === "binary"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        <FaExchangeAlt className="mr-2" />
                        Binary
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfigChange("mlmStructure", "unilevel")}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          config.mlmStructure === "unilevel"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        <FaExchangeAlt className="mr-2" />
                        Unilevel
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {config.mlmStructure === "binary"
                        ? "Binary structure: Each member can have at most 2 direct downlines (left and right legs)"
                        : "Unilevel structure: Each member can have unlimited direct downlines"}
                    </p>
                  </div>
                  
                  {/* PV Calculation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PV Calculation Method
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => handleConfigChange("pvCalculation", "percentage")}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          config.pvCalculation === "percentage"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        <FaPercentage className="mr-2" />
                        Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfigChange("pvCalculation", "fixed")}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          config.pvCalculation === "fixed"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        <FaDollarSign className="mr-2" />
                        Fixed
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {config.pvCalculation === "percentage"
                        ? "Percentage: PV is calculated as a percentage of the product price"
                        : "Fixed: PV is a fixed value set for each product"}
                    </p>
                  </div>
                  
                  {/* Performance Bonus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Performance Bonus
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => handleConfigChange("performanceBonusEnabled", true)}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          config.performanceBonusEnabled
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        <FaTrophy className="mr-2" />
                        Enabled
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfigChange("performanceBonusEnabled", false)}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          !config.performanceBonusEnabled
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        <FaTrophy className="mr-2" />
                        Disabled
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {config.performanceBonusEnabled
                        ? "Performance bonus is enabled based on personal sales volume"
                        : "Performance bonus is disabled"}
                    </p>
                  </div>
                  
                  {/* Monthly Cutoff Day */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Cutoff Day
                    </label>
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-gray-400 mr-2" />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={config.monthlyCutoffDay}
                        onChange={(e) => handleConfigChange("monthlyCutoffDay", parseInt(e.target.value))}
                        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Day of the month when commissions are calculated and paid
                    </p>
                  </div>
                  
                  {/* Max Depth Settings */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Binary Max Depth
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.binaryMaxDepth}
                        onChange={(e) => handleConfigChange("binaryMaxDepth", parseInt(e.target.value))}
                        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Maximum depth for binary structure (1-10)
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unilevel Max Depth
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.unilevelMaxDepth}
                        onChange={(e) => handleConfigChange("unilevelMaxDepth", parseInt(e.target.value))}
                        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Maximum depth for unilevel structure (1-10)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveConfig}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <FaSpinner className="animate-spin inline mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="inline mr-2" />
                        Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Performance Bonus Tiers */}
            {config.performanceBonusEnabled && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Performance Bonus Tiers</h2>
                  <button
                    type="button"
                    onClick={addNewTier}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <FaPlus className="inline mr-1" />
                    Add Tier
                  </button>
                </div>
                
                <div className="p-6">
                  {performanceTiers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No performance bonus tiers defined. Click "Add Tier" to create one.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sales Range
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bonus Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bonus Value
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {performanceTiers.map((tier) => (
                            <tr key={tier.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{tier.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  ₱{tier.minSales.toFixed(2)} - {tier.maxSales ? `₱${tier.maxSales.toFixed(2)}` : 'Unlimited'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {tier.bonusType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {tier.bonusType === 'percentage' 
                                    ? `${tier.percentage.toFixed(2)}%` 
                                    : `₱${tier.fixedAmount.toFixed(2)}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  tier.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {tier.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => editTier(tier)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  <FaEdit />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Tier Form */}
                  {showTierForm && editingTier && (
                    <div className="mt-6 border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">
                        {editingTier.id ? 'Edit Tier' : 'Add New Tier'}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tier Name
                          </label>
                          <input
                            type="text"
                            value={editingTier.name}
                            onChange={(e) => handleTierChange("name", e.target.value)}
                            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={editingTier.active ? "active" : "inactive"}
                            onChange={(e) => handleTierChange("active", e.target.value === "active")}
                            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Minimum Sales
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingTier.minSales}
                            onChange={(e) => handleTierChange("minSales", parseFloat(e.target.value))}
                            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum Sales (leave empty for unlimited)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingTier.maxSales || ""}
                            onChange={(e) => handleTierChange("maxSales", e.target.value ? parseFloat(e.target.value) : null)}
                            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bonus Type
                          </label>
                          <select
                            value={editingTier.bonusType}
                            onChange={(e) => handleTierChange("bonusType", e.target.value as 'percentage' | 'fixed')}
                            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        
                        {editingTier.bonusType === 'percentage' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Percentage (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={editingTier.percentage}
                              onChange={(e) => handleTierChange("percentage", parseFloat(e.target.value))}
                              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fixed Amount
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingTier.fixedAmount}
                              onChange={(e) => handleTierChange("fixedAmount", parseFloat(e.target.value))}
                              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTier(null);
                            setShowTierForm(false);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveTier}
                          disabled={saving}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <>
                              <FaSpinner className="animate-spin inline mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <FaSave className="inline mr-2" />
                              Save Tier
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
