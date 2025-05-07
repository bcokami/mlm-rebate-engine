"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  FaEdit,
  FaTimes,
  FaSpinner,
  FaUpload,
  FaImage,
  FaPlus,
  FaTag,
  FaInfoCircle
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

interface ProductEditModalProps {
  product: Product;
  onClose: () => void;
  onUpdate: (productId: number, data: any) => Promise<{ error?: string }>;
}

export default function ProductEditModal({
  product,
  onClose,
  onUpdate,
}: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku,
    description: product.description || "",
    price: product.price.toString(),
    pv: product.pv.toString(),
    binaryValue: product.binaryValue.toString(),
    inventory: product.inventory.toString(),
    lowStockThreshold: product.lowStockThreshold?.toString() || "",
    tags: product.tags || "",
    image: product.image || "",
    isActive: product.isActive,
    referralCommissionType: product.referralCommissionType || "",
    referralCommissionValue: product.referralCommissionValue?.toString() || "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("File type not allowed. Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File size exceeds the 5MB limit");
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
      setError(error.message || "An error occurred while uploading the image");
      setUploadingImage(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      // Validate form
      if (!formData.name || !formData.sku || !formData.price || !formData.pv) {
        setError("Name, SKU, Price, and PV are required");
        setLoading(false);
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
        name: formData.name,
        sku: formData.sku,
        description: formData.description || null,
        price: parseFloat(formData.price),
        pv: parseFloat(formData.pv),
        binaryValue: formData.binaryValue ? parseFloat(formData.binaryValue) : 0,
        inventory: formData.inventory ? parseInt(formData.inventory) : 0,
        lowStockThreshold: formData.lowStockThreshold
          ? parseInt(formData.lowStockThreshold)
          : null,
        tags: formData.tags || null,
        image: imageUrl,
        isActive: formData.isActive,
        referralCommissionType: formData.referralCommissionType || null,
        referralCommissionValue: formData.referralCommissionValue
          ? parseFloat(formData.referralCommissionValue)
          : null,
      };

      const result = await onUpdate(product.id, productData);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } catch (err) {
      setError("An error occurred while updating the product");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Product</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU / Code *
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₱) *
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
                <div className="flex items-center mb-1">
                  <label htmlFor="pv" className="block text-sm font-medium text-gray-700">
                    PV (Point Value) *
                  </label>
                  <div className="relative ml-1 group">
                    <FaInfoCircle className="text-gray-400 hover:text-gray-600" />
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10">
                      Point Value is used for MLM calculations and determines commission amounts.
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  id="pv"
                  name="pv"
                  value={formData.pv}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="binaryValue" className="block text-sm font-medium text-gray-700">
                    BV (Binary Value)
                  </label>
                  <div className="relative ml-1 group">
                    <FaInfoCircle className="text-gray-400 hover:text-gray-600" />
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10">
                      Binary Value is used for binary MLM structure calculations.
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  id="binaryValue"
                  name="binaryValue"
                  value={formData.binaryValue}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory
                </label>
                <input
                  type="number"
                  id="inventory"
                  name="inventory"
                  value={formData.inventory}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">
                    Low Stock Threshold
                  </label>
                  <div className="relative ml-1 group">
                    <FaInfoCircle className="text-gray-400 hover:text-gray-600" />
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10">
                      You'll receive notifications when inventory falls below this level. Leave empty for no alerts.
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  placeholder="No threshold"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 20 or higher for popular products
                </p>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex items-center">
                  <FaTag className="text-gray-400 absolute ml-3" />
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="tag1,tag2,tag3"
                    className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Comma-separated tags</p>
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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

              <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="referralCommissionType" className="block text-sm font-medium text-gray-700">
                    Referral Commission Type
                  </label>
                  <div className="relative ml-1 group">
                    <FaInfoCircle className="text-gray-400 hover:text-gray-600" />
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10">
                      Commission earned when this product is purchased through a referral link.
                    </div>
                  </div>
                </div>
                <select
                  id="referralCommissionType"
                  name="referralCommissionType"
                  value={formData.referralCommissionType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No commission</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label htmlFor="referralCommissionValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Referral Commission Value
                </label>
                <input
                  type="number"
                  id="referralCommissionValue"
                  name="referralCommissionValue"
                  value={formData.referralCommissionValue}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={!formData.referralCommissionType}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !formData.referralCommissionType ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.referralCommissionType === "percentage"
                    ? "Percentage of product price (e.g., 10 for 10%)"
                    : formData.referralCommissionType === "fixed"
                    ? "Fixed amount in PHP (e.g., 100 for ₱100)"
                    : "Select a commission type first"}
                </p>
              </div>

              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Inactive products won't be visible in the shop
                </p>
              </div>
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
                disabled={loading || uploadingImage}
                className={`px-4 py-2 rounded-md flex items-center ${
                  loading || uploadingImage
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaEdit className="mr-2" />
                    Update Product
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
