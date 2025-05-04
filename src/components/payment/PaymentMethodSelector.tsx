"use client";

import { useState, useEffect } from "react";
import { FaSpinner, FaPlus, FaEdit, FaTrash, FaCheck } from "react-icons/fa";

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  requiresDetails: boolean;
  detailsSchema: string | null;
}

interface UserPaymentMethod {
  id: number;
  userId: number;
  paymentMethodId: number;
  details: string;
  isDefault: boolean;
  paymentMethod: PaymentMethod;
}

interface PaymentMethodSelectorProps {
  onSelect: (method: UserPaymentMethod | PaymentMethod | null) => void;
  selectedMethodId?: number;
  showAddNew?: boolean;
}

export default function PaymentMethodSelector({
  onSelect,
  selectedMethodId,
  showAddNew = true,
}: PaymentMethodSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userPaymentMethods, setUserPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<UserPaymentMethod | PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethodId, setNewMethodId] = useState<number | null>(null);
  const [newMethodDetails, setNewMethodDetails] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Fetch payment methods
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Set selected method when selectedMethodId changes
  useEffect(() => {
    if (selectedMethodId && userPaymentMethods.length > 0) {
      const method = userPaymentMethods.find(m => m.id === selectedMethodId) ||
                    userPaymentMethods.find(m => m.paymentMethodId === selectedMethodId);
      
      if (method) {
        setSelectedMethod(method);
      }
    }
  }, [selectedMethodId, userPaymentMethods]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/payment-methods?includeUserMethods=true");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
      setUserPaymentMethods(data.userPaymentMethods || []);
      
      // If there's a default payment method, select it
      const defaultMethod = data.userPaymentMethods?.find((m: UserPaymentMethod) => m.isDefault);
      
      if (defaultMethod) {
        setSelectedMethod(defaultMethod);
        onSelect(defaultMethod);
      } else if (data.userPaymentMethods?.length > 0) {
        setSelectedMethod(data.userPaymentMethods[0]);
        onSelect(data.userPaymentMethods[0]);
      } else if (data.paymentMethods?.length > 0) {
        setSelectedMethod(data.paymentMethods[0]);
        onSelect(data.paymentMethods[0]);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setError("Failed to load payment methods. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = (method: UserPaymentMethod | PaymentMethod) => {
    setSelectedMethod(method);
    onSelect(method);
  };

  const handleAddNewMethod = () => {
    setShowAddForm(true);
    setNewMethodId(null);
    setNewMethodDetails({});
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewMethodId(null);
    setNewMethodDetails({});
  };

  const handleSaveNewMethod = async () => {
    if (!newMethodId) {
      setError("Please select a payment method");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch("/api/payment-methods/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: newMethodId,
          details: newMethodDetails,
          isDefault: userPaymentMethods.length === 0, // Make default if it's the first one
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add payment method: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Refresh payment methods
      await fetchPaymentMethods();
      
      // Select the newly added method
      setSelectedMethod(data.userPaymentMethod);
      onSelect(data.userPaymentMethod);
      
      // Close the form
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding payment method:", error);
      setError(error instanceof Error ? error.message : "Failed to add payment method");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/payment-methods/user?id=${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete payment method: ${response.statusText}`);
      }
      
      // Refresh payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      setError("Failed to delete payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/payment-methods/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          isDefault: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to set default payment method: ${response.statusText}`);
      }
      
      // Refresh payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error("Error setting default payment method:", error);
      setError("Failed to set default payment method");
    } finally {
      setLoading(false);
    }
  };

  const renderDetailsFields = (method: PaymentMethod) => {
    if (!method.requiresDetails || !method.detailsSchema) {
      return null;
    }
    
    try {
      const schema = JSON.parse(method.detailsSchema);
      
      if (!schema.properties) {
        return null;
      }
      
      return (
        <div className="mt-4 space-y-4">
          {Object.entries(schema.properties).map(([key, prop]: [string, any]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {prop.description || key}
                {schema.required?.includes(key) && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={newMethodDetails[key] || ""}
                onChange={(e) => setNewMethodDetails({
                  ...newMethodDetails,
                  [key]: e.target.value,
                })}
                className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={schema.required?.includes(key)}
              />
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error parsing schema:", error);
      return (
        <div className="mt-4 text-red-500">
          Error parsing schema
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading payment methods...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* User's saved payment methods */}
      {userPaymentMethods.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Your Payment Methods</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {userPaymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-md p-3 cursor-pointer ${
                  selectedMethod && 'id' in selectedMethod && selectedMethod.id === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
                onClick={() => handleSelectMethod(method)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {method.paymentMethod.code === 'gcash' && (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">G</div>
                      )}
                      {method.paymentMethod.code === 'maya' && (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">M</div>
                      )}
                      {method.paymentMethod.code === 'cash' && (
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">₱</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{method.paymentMethod.name}</div>
                      {method.paymentMethod.requiresDetails && (
                        <div className="text-sm text-gray-600">
                          {(() => {
                            try {
                              const details = JSON.parse(method.details);
                              return details.accountNumber || details.accountName || 'No details';
                            } catch {
                              return 'Invalid details';
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {method.isDefault && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <FaCheck className="mr-1" />
                        Default
                      </span>
                    )}
                    {!method.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(method.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMethod(method.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add new payment method button */}
      {showAddNew && !showAddForm && (
        <button
          type="button"
          onClick={handleAddNewMethod}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaPlus className="mr-1" />
          Add Payment Method
        </button>
      )}
      
      {/* Add new payment method form */}
      {showAddForm && (
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Add Payment Method</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={newMethodId || ""}
                onChange={(e) => setNewMethodId(e.target.value ? parseInt(e.target.value) : null)}
                className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
            
            {newMethodId && (
              renderDetailsFields(paymentMethods.find(m => m.id === newMethodId)!)
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewMethod}
                disabled={saving || !newMethodId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Available payment methods if no user methods */}
      {userPaymentMethods.length === 0 && !showAddForm && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Available Payment Methods</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-md p-3 cursor-pointer ${
                  selectedMethod && 'code' in selectedMethod && selectedMethod.code === method.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
                onClick={() => handleSelectMethod(method)}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {method.code === 'gcash' && (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">G</div>
                    )}
                    {method.code === 'maya' && (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">M</div>
                    )}
                    {method.code === 'cash' && (
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">₱</div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{method.name}</div>
                    {method.description && (
                      <div className="text-sm text-gray-600">{method.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
