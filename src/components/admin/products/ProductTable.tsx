"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  FaEdit, 
  FaTrash, 
  FaClone, 
  FaToggleOn, 
  FaToggleOff, 
  FaChevronUp, 
  FaChevronDown,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSpinner,
  FaEye,
  FaCheck
} from "react-icons/fa";
import ProductCloneModal from "./ProductCloneModal";
import ProductEditModal from "./ProductEditModal";
import ProductDetailsModal from "./ProductDetailsModal";
import ProductRebateSimulatorModal from "./ProductRebateSimulatorModal";

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

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  pagination: Pagination;
  sortBy: string;
  sortOrder: string;
  selectedProducts: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSort: (field: string) => void;
  onSelectProduct: (productId: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUpdateProduct: (productId: number, data: any) => Promise<{ error?: string }>;
  onDeleteProduct: (productId: number) => void;
  onToggleStatus: (productId: number, isActive: boolean) => void;
  onCloneProduct: (productId: number, newSku: string) => Promise<{ error?: string; success?: boolean }>;
}

export default function ProductTable({
  products,
  loading,
  pagination,
  sortBy,
  sortOrder,
  selectedProducts,
  onPageChange,
  onPageSizeChange,
  onSort,
  onSelectProduct,
  onSelectAll,
  onUpdateProduct,
  onDeleteProduct,
  onToggleStatus,
  onCloneProduct,
}: ProductTableProps) {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRebateSimulator, setShowRebateSimulator] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  const handleSort = (field: string) => {
    onSort(field);
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectAll(e.target.checked);
  };
  
  const handleSelectProduct = (e: React.ChangeEvent<HTMLInputElement>, productId: number) => {
    onSelectProduct(productId, e.target.checked);
  };
  
  const handleCloneClick = (product: Product) => {
    setCurrentProduct(product);
    setShowCloneModal(true);
  };
  
  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    setShowEditModal(true);
  };
  
  const handleDetailsClick = (product: Product) => {
    setCurrentProduct(product);
    setShowDetailsModal(true);
  };
  
  const handleRebateSimulatorClick = (product: Product) => {
    setCurrentProduct(product);
    setShowRebateSimulator(true);
  };
  
  const handleToggleExpand = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };
  
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <FaSort className="ml-1" />;
    }
    
    return sortOrder === "asc" ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const renderPagination = () => {
    const { page, totalPages } = pagination;
    
    // Generate page numbers
    const pageNumbers = [];
    const maxPageButtons = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div>
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-700 mr-4">
            Showing {(page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(page * pagination.pageSize, pagination.totalCount)} of{" "}
            {pagination.totalCount} products
          </span>
          
          <nav className="flex space-x-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  pageNum === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </nav>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading products...</span>
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Product
                  {renderSortIcon("name")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("sku")}
              >
                <div className="flex items-center">
                  SKU
                  {renderSortIcon("sku")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center">
                  Price
                  {renderSortIcon("price")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("pv")}
              >
                <div className="flex items-center">
                  PV
                  {renderSortIcon("pv")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("binaryValue")}
              >
                <div className="flex items-center">
                  BV
                  {renderSortIcon("binaryValue")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("inventory")}
              >
                <div className="flex items-center">
                  Inventory
                  {renderSortIcon("inventory")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("isActive")}
              >
                <div className="flex items-center">
                  Status
                  {renderSortIcon("isActive")}
                </div>
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className={expandedProduct === product.id ? "bg-blue-50" : ""}>
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => handleSelectProduct(e, product.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleToggleExpand(product.id)}
                      className="mr-2 text-gray-500 hover:text-gray-700"
                    >
                      {expandedProduct === product.id ? <FaChevronUp /> : <FaChevronDown />}
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
                        <div className="h-10 w-10 bg-gray-200 flex items-center justify-center rounded-md">
                          <span className="text-gray-500 text-xs">No img</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {expandedProduct === product.id && (
                        <div className="mt-2 text-sm text-gray-500">
                          {product.description || "No description"}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.sku}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.pv}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.binaryValue}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.inventory}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.isActive ? (
                      <>
                        <FaCheck className="mr-1" /> Active
                      </>
                    ) : (
                      <>
                        <FaTimes className="mr-1" /> Inactive
                      </>
                    )}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleDetailsClick(product)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit Product"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleCloneClick(product)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Clone Product"
                    >
                      <FaClone />
                    </button>
                    <button
                      onClick={() => onToggleStatus(product.id, !product.isActive)}
                      className={`${
                        product.isActive
                          ? "text-orange-600 hover:text-orange-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      title={product.isActive ? "Deactivate Product" : "Activate Product"}
                    >
                      {product.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Product"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  {expandedProduct === product.id && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleRebateSimulatorClick(product)}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        Rebate Simulator
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {renderPagination()}
      
      {/* Modals */}
      {showCloneModal && currentProduct && (
        <ProductCloneModal
          product={currentProduct}
          onClose={() => setShowCloneModal(false)}
          onClone={onCloneProduct}
        />
      )}
      
      {showEditModal && currentProduct && (
        <ProductEditModal
          product={currentProduct}
          onClose={() => setShowEditModal(false)}
          onUpdate={onUpdateProduct}
        />
      )}
      
      {showDetailsModal && currentProduct && (
        <ProductDetailsModal
          product={currentProduct}
          onClose={() => setShowDetailsModal(false)}
          onEdit={() => {
            setShowDetailsModal(false);
            handleEditClick(currentProduct);
          }}
        />
      )}
      
      {showRebateSimulator && currentProduct && (
        <ProductRebateSimulatorModal
          product={currentProduct}
          onClose={() => setShowRebateSimulator(false)}
        />
      )}
    </div>
  );
}
