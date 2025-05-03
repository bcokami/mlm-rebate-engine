"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import {
  FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp,
  FaSearch, FaFilter, FaToggleOn, FaToggleOff, FaSpinner,
  FaEye, FaCheck, FaTimes, FaImage, FaUpload, FaCamera
} from "react-icons/fa";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rebateConfigs, setRebateConfigs] = useState<RebateConfig[]>([
    { level: 1, percentage: "10" },
  ]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  // Search and filter state
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Product view state
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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
  }, [status, search, activeFilter, sortBy, sortOrder]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (search) {
        params.append("search", search);
      }

      if (activeFilter !== null) {
        params.append("isActive", activeFilter.toString());
      }

      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();

      // If data is an object with products property, use that
      const productsArray = Array.isArray(data) ? data : (data.products || []);

      setProducts(productsArray);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "File type not allowed. Please upload a JPEG, PNG, WebP, or GIF image."
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "File size exceeds the 5MB limit"
      });
      return;
    }

    setImageFile(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUploadingImage(false);
      return data.url;
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred while uploading the image"
      });
      setUploadingImage(false);
      return null;
    }
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
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image: product.image || "",
    });

    // Set image preview if product has an image
    if (product.image) {
      setImagePreview(product.image);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

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

      // Handle image upload if there's a new image file
      let imageUrl = formData.image;
      if (imageFile) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        image: imageUrl,
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
                    Product Image
                  </label>
                  <div className="flex flex-col space-y-2">
                    {/* Image preview */}
                    {imagePreview && (
                      <div className="relative w-full h-40 mb-2 border rounded-md overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Product preview"
                          fill
                          className="object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setFormData(prev => ({ ...prev, image: "" }));
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          title="Remove image"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    )}

                    {/* File input */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="imageUpload"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <FaSpinner className="mr-2 animate-spin" />
                        ) : (
                          <FaUpload className="mr-2" />
                        )}
                        {imageFile ? "Change Image" : "Upload Image"}
                      </button>

                      {/* Manual URL input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          id="image"
                          name="image"
                          value={formData.image}
                          onChange={handleInputChange}
                          placeholder="Or enter image URL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Upload a JPEG, PNG, WebP, or GIF image (max 5MB)
                    </p>
                  </div>
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products by name or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <FaFilter className="mr-2" />
                Filters
                {showFilters ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveFilter(activeFilter === true ? null : true)}
                      className={`px-3 py-1 rounded-md flex items-center ${
                        activeFilter === true
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {activeFilter === true ? (
                        <FaToggleOn className="mr-2" />
                      ) : (
                        <FaToggleOff className="mr-2" />
                      )}
                      Active
                    </button>
                    <button
                      onClick={() => setActiveFilter(activeFilter === false ? null : false)}
                      className={`px-3 py-1 rounded-md flex items-center ${
                        activeFilter === false
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {activeFilter === false ? (
                        <FaToggleOn className="mr-2" />
                      ) : (
                        <FaToggleOff className="mr-2" />
                      )}
                      Inactive
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "name" | "price" | "createdAt")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="createdAt">Date Created</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveFilter(null);
                    setSortBy("createdAt");
                    setSortOrder("desc");
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

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
                        Product
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
                            <div className="h-10 w-10 flex-shrink-0 mr-3 relative rounded-md overflow-hidden">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <ProductPlaceholder className="rounded-md" />
                              )}
                            </div>
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setViewingProduct(product);
                                setShowProductDetails(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit Product"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/products/${product.id}/toggle-status`, {
                                    method: "PATCH",
                                  });

                                  if (!response.ok) {
                                    throw new Error("Failed to toggle product status");
                                  }

                                  // Refresh products list
                                  fetchProducts();

                                  setMessage({
                                    type: "success",
                                    text: `Product ${product.isActive ? "deactivated" : "activated"} successfully`
                                  });
                                } catch (error) {
                                  console.error("Error toggling product status:", error);
                                  setMessage({
                                    type: "error",
                                    text: "Failed to toggle product status"
                                  });
                                }
                              }}
                              className={`${product.isActive ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}`}
                              title={product.isActive ? "Deactivate Product" : "Activate Product"}
                            >
                              {product.isActive ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                            <button
                              onClick={() => {
                                setProductToDelete(product);
                                setShowDeleteConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Product"
                            >
                              <FaTrash />
                            </button>
                          </div>
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

        {/* Product Details Modal */}
        {showProductDetails && viewingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Product Details</h3>
                <button
                  onClick={() => setShowProductDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="md:w-1/3">
                    <div className="relative w-full h-64 rounded-md overflow-hidden border border-gray-200">
                      {viewingProduct.image ? (
                        <Image
                          src={viewingProduct.image}
                          alt={viewingProduct.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <ProductPlaceholder />
                      )}
                    </div>
                    {viewingProduct.image && (
                      <div className="mt-2 flex justify-center">
                        <a
                          href={viewingProduct.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <FaEye className="mr-1" /> View full image
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="md:w-2/3">
                    <h2 className="text-xl font-semibold mb-2">{viewingProduct.name}</h2>
                    <div className="mb-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          viewingProduct.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {viewingProduct.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Price</h4>
                      <p className="text-lg font-semibold">₱{viewingProduct.price.toFixed(2)}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                      <p className="text-gray-700">{viewingProduct.description || "No description provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold mb-3">Rebate Configuration</h3>

                  {viewingProduct.rebateConfigs.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                              Level
                            </th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                              Percentage
                            </th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                              Rebate Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingProduct.rebateConfigs
                            .sort((a, b) => a.level - b.level)
                            .map((config) => (
                              <tr key={config.id}>
                                <td className="py-2 text-sm">Level {config.level}</td>
                                <td className="py-2 text-sm">{config.percentage}%</td>
                                <td className="py-2 text-sm">
                                  ₱{((viewingProduct.price * config.percentage) / 100).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No rebate configuration</p>
                  )}
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={() => {
                      setShowProductDetails(false);
                      handleEditProduct(viewingProduct);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Product
                  </button>
                  <button
                    onClick={() => setShowProductDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && productToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the product "{productToDelete.name}"? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/products/${productToDelete.id}`, {
                        method: "DELETE",
                      });

                      if (!response.ok) {
                        throw new Error("Failed to delete product");
                      }

                      // Refresh products list
                      fetchProducts();

                      setMessage({
                        type: "success",
                        text: "Product deleted successfully"
                      });

                      // Close the dialog
                      setShowDeleteConfirm(false);
                      setProductToDelete(null);
                    } catch (error) {
                      console.error("Error deleting product:", error);
                      setMessage({
                        type: "error",
                        text: "Failed to delete product"
                      });
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
