"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  rebateConfigs: {
    id: number;
    level: number;
    percentage: number;
  }[];
}

interface RebateConfig {
  level: number;
  percentage: string;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });
  const [rebateConfigs, setRebateConfigs] = useState<RebateConfig[]>([
    { level: 1, percentage: "10" },
  ]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // TODO: Add admin check
      fetchProducts();
    }
  }, [status]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRebateConfigChange = (index: number, field: string, value: string) => {
    const updatedConfigs = [...rebateConfigs];
    updatedConfigs[index] = {
      ...updatedConfigs[index],
      [field]: field === "level" ? parseInt(value) : value,
    };
    setRebateConfigs(updatedConfigs);
  };

  const addRebateConfig = () => {
    const nextLevel = rebateConfigs.length > 0
      ? Math.max(...rebateConfigs.map(c => c.level)) + 1
      : 1;

    setRebateConfigs([...rebateConfigs, { level: nextLevel, percentage: "5" }]);
  };

  const removeRebateConfig = (index: number) => {
    const updatedConfigs = [...rebateConfigs];
    updatedConfigs.splice(index, 1);
    setRebateConfigs(updatedConfigs);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image: "",
    });
    setRebateConfigs([{ level: 1, percentage: "10" }]);
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image: product.image || "",
    });

    const configs = product.rebateConfigs.map(config => ({
      level: config.level,
      percentage: config.percentage.toString(),
    }));

    setRebateConfigs(configs.length > 0 ? configs : [{ level: 1, percentage: "10" }]);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      // Validate form
      if (!formData.name || !formData.price) {
        setMessage({ type: "error", text: "Name and price are required" });
        return;
      }

      // Validate rebate configs
      for (const config of rebateConfigs) {
        if (config.level <= 0 || parseFloat(config.percentage) <= 0) {
          setMessage({
            type: "error",
            text: "Rebate level and percentage must be greater than 0"
          });
          return;
        }
      }

      // Check for duplicate levels
      const levels = rebateConfigs.map(c => c.level);
      if (new Set(levels).size !== levels.length) {
        setMessage({ type: "error", text: "Duplicate rebate levels are not allowed" });
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        rebateConfigs: rebateConfigs.map(config => ({
          level: config.level,
          percentage: parseFloat(config.percentage),
        })),
      };

      let response;
      if (editingProduct) {
        // Update existing product
        response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });
      } else {
        // Create new product
        response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setMessage({
        type: "success",
        text: editingProduct
          ? "Product updated successfully"
          : "Product created successfully"
      });

      // Refresh products list
      fetchProducts();
      resetForm();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred while saving the product"
      });
    }
  };

  const toggleProductExpand = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Product Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaPlus className="mr-2" /> {showForm ? "Cancel" : "Add Product"}
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Product Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="image"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Image URL
                  </label>
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold">Rebate Configuration</h3>
                  <button
                    type="button"
                    onClick={addRebateConfig}
                    className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center"
                  >
                    <FaPlus className="mr-1" /> Add Level
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  {rebateConfigs.map((config, index) => (
                    <div key={index} className="flex items-center mb-2 last:mb-0">
                      <div className="w-1/3 pr-2">
                        <label
                          htmlFor={`level-${index}`}
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Level
                        </label>
                        <input
                          type="number"
                          id={`level-${index}`}
                          value={config.level}
                          onChange={(e) =>
                            handleRebateConfigChange(index, "level", e.target.value)
                          }
                          min="1"
                          max="10"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="w-1/3 px-2">
                        <label
                          htmlFor={`percentage-${index}`}
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Percentage (%)
                        </label>
                        <input
                          type="number"
                          id={`percentage-${index}`}
                          value={config.percentage}
                          onChange={(e) =>
                            handleRebateConfigChange(
                              index,
                              "percentage",
                              e.target.value
                            )
                          }
                          min="0.1"
                          step="0.1"
                          max="100"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="w-1/3 pl-2 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeRebateConfig(index)}
                          disabled={rebateConfigs.length === 1}
                          className="mt-5 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Products</h2>
          </div>
          <div className="p-6">
            {products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rebate Levels
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleProductExpand(product.id)}
                              className="mr-2 text-gray-500"
                            >
                              {expandedProduct === product.id ? (
                                <FaChevronUp />
                              ) : (
                                <FaChevronDown />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              {expandedProduct === product.id && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {product.description || "No description"}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₱{product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.rebateConfigs.length} levels
                          {expandedProduct === product.id && (
                            <div className="mt-2 text-xs">
                              {product.rebateConfigs
                                .sort((a, b) => a.level - b.level)
                                .map((config) => (
                                  <div key={config.id} className="flex justify-between mb-1">
                                    <span>Level {config.level}:</span>
                                    <span>{config.percentage}%</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implement delete functionality
                              alert("Delete functionality will be implemented later");
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No products found.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
