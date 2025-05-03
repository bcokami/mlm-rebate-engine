"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import {
  FaCog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaPercentage,
  FaDollarSign,
  FaSave,
  FaTimes,
} from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

interface RebateConfig {
  id: number;
  productId: number;
  level: number;
  rewardType: "percentage" | "fixed";
  percentage: number;
  fixedAmount: number;
  product: Product;
}

export default function RebateConfigsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rebateConfigs, setRebateConfigs] = useState<RebateConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RebateConfig | null>(null);
  const [newConfig, setNewConfig] = useState<Partial<RebateConfig> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      checkAdminStatus();
    }
  }, [status]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/users/me");
      const data = await response.json();

      // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
      const isAdmin = data.rankId === 6;
      setIsAdmin(isAdmin);

      if (isAdmin) {
        fetchRebateConfigs();
        fetchProducts();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setLoading(false);
    }
  };

  const fetchRebateConfigs = async () => {
    try {
      const response = await fetch("/api/admin/rebate-configs");
      if (!response.ok) {
        throw new Error("Failed to fetch rebate configurations");
      }
      const data = await response.json();
      setRebateConfigs(data.rebateConfigs);
    } catch (error) {
      console.error("Error fetching rebate configurations:", error);
      setError("Failed to load rebate configurations");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleEditConfig = (config: RebateConfig) => {
    setEditingConfig({ ...config });
    setNewConfig(null);
  };

  const handleNewConfig = () => {
    setNewConfig({
      productId: products[0]?.id || 0,
      level: 1,
      rewardType: "percentage",
      percentage: 5,
      fixedAmount: 0,
    });
    setEditingConfig(null);
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setNewConfig(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    target: "editing" | "new"
  ) => {
    const { name, value, type } = e.target;
    const numericValue = type === "number" ? parseFloat(value) : value;

    if (target === "editing" && editingConfig) {
      setEditingConfig({
        ...editingConfig,
        [name]: numericValue,
      });
    } else if (target === "new" && newConfig) {
      setNewConfig({
        ...newConfig,
        [name]: numericValue,
      });
    }
  };

  const handleRewardTypeChange = (
    rewardType: "percentage" | "fixed",
    target: "editing" | "new"
  ) => {
    if (target === "editing" && editingConfig) {
      setEditingConfig({
        ...editingConfig,
        rewardType,
      });
    } else if (target === "new" && newConfig) {
      setNewConfig({
        ...newConfig,
        rewardType,
      });
    }
  };

  const handleSaveConfig = async (target: "editing" | "new") => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const configData = target === "editing" ? editingConfig : newConfig;

      if (!configData) {
        throw new Error("No configuration data to save");
      }

      const url = target === "editing"
        ? `/api/admin/rebate-configs/${configData.id}`
        : "/api/admin/rebate-configs";

      const method = target === "editing" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }

      // Refresh the list
      await fetchRebateConfigs();

      // Reset form state
      setEditingConfig(null);
      setNewConfig(null);
      setSuccess(
        target === "editing"
          ? "Configuration updated successfully"
          : "Configuration created successfully"
      );
    } catch (error) {
      console.error("Error saving configuration:", error);
      setError(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/rebate-configs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete configuration");
      }

      // Refresh the list
      await fetchRebateConfigs();
      setSuccess("Configuration deleted successfully");
    } catch (error) {
      console.error("Error deleting configuration:", error);
      setError(error instanceof Error ? error.message : "Failed to delete configuration");
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : `Product ${productId}`;
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

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">
              You do not have permission to access this page. Please contact an administrator.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
            <FaCog className="mr-2 text-blue-500" /> Rebate Configurations
          </h1>
          <button
            onClick={handleNewConfig}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
            disabled={!!newConfig || !!editingConfig}
          >
            <FaPlus className="mr-2" /> Add Configuration
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <FaTimes className="mr-2" /> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <FaCheck className="mr-2" /> {success}
          </div>
        )}

        {/* New Configuration Form */}
        {newConfig && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  name="productId"
                  value={newConfig.productId}
                  onChange={(e) => handleInputChange(e, "new")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <input
                  type="number"
                  name="level"
                  value={newConfig.level}
                  onChange={(e) => handleInputChange(e, "new")}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reward Type
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleRewardTypeChange("percentage", "new")}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    newConfig.rewardType === "percentage"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  <FaPercentage className="mr-2" /> Percentage
                </button>
                <button
                  type="button"
                  onClick={() => handleRewardTypeChange("fixed", "new")}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    newConfig.rewardType === "fixed"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  <FaDollarSign className="mr-2" /> Fixed Amount
                </button>
              </div>
            </div>

            {newConfig.rewardType === "percentage" ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="percentage"
                    value={newConfig.percentage}
                    onChange={(e) => handleInputChange(e, "new")}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FaPercentage className="text-gray-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fixed Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₱</span>
                  </div>
                  <input
                    type="number"
                    name="fixedAmount"
                    value={newConfig.fixedAmount}
                    onChange={(e) => handleInputChange(e, "new")}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveConfig("new")}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Edit Configuration Form */}
        {editingConfig && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Edit Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  name="productId"
                  value={editingConfig.productId}
                  onChange={(e) => handleInputChange(e, "editing")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <input
                  type="number"
                  name="level"
                  value={editingConfig.level}
                  onChange={(e) => handleInputChange(e, "editing")}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reward Type
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleRewardTypeChange("percentage", "editing")}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    editingConfig.rewardType === "percentage"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  <FaPercentage className="mr-2" /> Percentage
                </button>
                <button
                  type="button"
                  onClick={() => handleRewardTypeChange("fixed", "editing")}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    editingConfig.rewardType === "fixed"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  <FaDollarSign className="mr-2" /> Fixed Amount
                </button>
              </div>
            </div>

            {editingConfig.rewardType === "percentage" ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="percentage"
                    value={editingConfig.percentage}
                    onChange={(e) => handleInputChange(e, "editing")}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FaPercentage className="text-gray-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fixed Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₱</span>
                  </div>
                  <input
                    type="number"
                    name="fixedAmount"
                    value={editingConfig.fixedAmount}
                    onChange={(e) => handleInputChange(e, "editing")}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveConfig("editing")}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Rebate Configurations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">All Configurations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rebateConfigs.length > 0 ? (
                  rebateConfigs.map((config) => (
                    <tr key={config.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {config.product?.name || getProductName(config.productId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">Level {config.level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            config.rewardType === "percentage"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {config.rewardType === "percentage" ? (
                            <FaPercentage className="mr-1" />
                          ) : (
                            <FaDollarSign className="mr-1" />
                          )}
                          {config.rewardType.charAt(0).toUpperCase() + config.rewardType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {config.rewardType === "percentage"
                            ? `${config.percentage}%`
                            : `₱${config.fixedAmount.toFixed(2)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditConfig(config)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          disabled={!!editingConfig || !!newConfig}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={!!editingConfig || !!newConfig}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No rebate configurations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
