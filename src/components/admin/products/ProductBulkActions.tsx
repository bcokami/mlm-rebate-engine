"use client";

import { useState } from "react";
import { 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff, 
  FaEdit, 
  FaTimes,
  FaTag,
  FaBoxOpen
} from "react-icons/fa";

interface ProductBulkActionsProps {
  selectedCount: number;
  onAction: (action: string, data?: any) => void;
  onClearSelection: () => void;
}

export default function ProductBulkActions({
  selectedCount,
  onAction,
  onClearSelection,
}: ProductBulkActionsProps) {
  const [showBulkEditForm, setShowBulkEditForm] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    price: "",
    pv: "",
    binaryValue: "",
    inventory: "",
    tags: "",
    isActive: undefined as boolean | undefined,
  });
  
  const handleBulkEditChange = (field: string, value: any) => {
    setBulkEditData({
      ...bulkEditData,
      [field]: value,
    });
  };
  
  const handleBulkEditSubmit = () => {
    // Filter out empty fields
    const data: Record<string, any> = {};
    
    if (bulkEditData.price) {
      data.price = parseFloat(bulkEditData.price);
    }
    
    if (bulkEditData.pv) {
      data.pv = parseFloat(bulkEditData.pv);
    }
    
    if (bulkEditData.binaryValue) {
      data.binaryValue = parseFloat(bulkEditData.binaryValue);
    }
    
    if (bulkEditData.inventory) {
      data.inventory = parseInt(bulkEditData.inventory);
    }
    
    if (bulkEditData.tags) {
      data.tags = bulkEditData.tags;
    }
    
    if (bulkEditData.isActive !== undefined) {
      data.isActive = bulkEditData.isActive;
    }
    
    // Check if any data to update
    if (Object.keys(data).length === 0) {
      alert("Please specify at least one field to update");
      return;
    }
    
    // Confirm bulk update
    if (confirm(`Are you sure you want to update ${selectedCount} products with these values?`)) {
      onAction("bulk_update", data);
      setShowBulkEditForm(false);
      setBulkEditData({
        price: "",
        pv: "",
        binaryValue: "",
        inventory: "",
        tags: "",
        isActive: undefined,
      });
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-medium">{selectedCount} products selected</span>
          <button
            type="button"
            onClick={onClearSelection}
            className="ml-2 text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <FaTimes className="mr-1" />
            Clear selection
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowBulkEditForm(!showBulkEditForm)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
            <FaEdit className="mr-1" />
            Bulk Edit
          </button>
          
          <button
            type="button"
            onClick={() => onAction("toggle_status", { isActive: true })}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
          >
            <FaToggleOn className="mr-1" />
            Activate All
          </button>
          
          <button
            type="button"
            onClick={() => onAction("toggle_status", { isActive: false })}
            className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center text-sm"
          >
            <FaToggleOff className="mr-1" />
            Deactivate All
          </button>
          
          <button
            type="button"
            onClick={() => onAction("delete")}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center text-sm"
          >
            <FaTrash className="mr-1" />
            Delete All
          </button>
        </div>
      </div>
      
      {showBulkEditForm && (
        <div className="mt-4 bg-white p-4 rounded-md border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Bulk Edit Products</h3>
          <p className="text-sm text-gray-600 mb-4">
            Only filled fields will be updated. Leave fields blank to keep current values.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                value={bulkEditData.price}
                onChange={(e) => handleBulkEditChange("price", e.target.value)}
                placeholder="New price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PV (Point Value)
              </label>
              <input
                type="number"
                value={bulkEditData.pv}
                onChange={(e) => handleBulkEditChange("pv", e.target.value)}
                placeholder="New PV"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BV (Binary Value)
              </label>
              <input
                type="number"
                value={bulkEditData.binaryValue}
                onChange={(e) => handleBulkEditChange("binaryValue", e.target.value)}
                placeholder="New BV"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory
              </label>
              <input
                type="number"
                value={bulkEditData.inventory}
                onChange={(e) => handleBulkEditChange("inventory", e.target.value)}
                placeholder="New inventory"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center">
                <FaTag className="text-gray-400 absolute ml-3" />
                <input
                  type="text"
                  value={bulkEditData.tags}
                  onChange={(e) => handleBulkEditChange("tags", e.target.value)}
                  placeholder="tag1,tag2,tag3"
                  className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Comma-separated tags</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleBulkEditChange("isActive", true)}
                  className={`px-3 py-2 rounded-md text-sm flex-1 ${
                    bulkEditData.isActive === true
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  <FaToggleOn className="inline mr-1" /> Active
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkEditChange("isActive", false)}
                  className={`px-3 py-2 rounded-md text-sm flex-1 ${
                    bulkEditData.isActive === false
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  <FaToggleOff className="inline mr-1" /> Inactive
                </button>
                {bulkEditData.isActive !== undefined && (
                  <button
                    type="button"
                    onClick={() => handleBulkEditChange("isActive", undefined)}
                    className="px-3 py-2 rounded-md text-sm bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  >
                    <FaTimes className="inline mr-1" /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowBulkEditForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkEditSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Apply to {selectedCount} Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
