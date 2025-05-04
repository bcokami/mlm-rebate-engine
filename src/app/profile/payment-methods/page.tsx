"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
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
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userPaymentMethods, setUserPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethodId, setNewMethodId] = useState<number | null>(null);
  const [newMethodDetails, setNewMethodDetails] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch payment methods
  useEffect(() => {
    if (status === "authenticated") {
      fetchPaymentMethods();
    }
  }, [status]);
  
  const fetchPaymentMethods = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch("/api/payment-methods?includeUserMethods=true");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
      setUserPaymentMethods(data.userPaymentMethods || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setMessage({
        type: "error",
        text: "Failed to load payment methods. Please try again.",
      });
    } finally {
      setLoading(false);
    }
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
      setMessage({
        type: "error",
        text: "Please select a payment method",
      });
      return;
    }
    
    setSaving(true);
    setMessage({ type: "", text: "" });
    
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
      
      // Refresh payment methods
      await fetchPaymentMethods();
      
      // Close the form
      setShowAddForm(false);
      
      setMessage({
        type: "success",
        text: "Payment method added successfully",
      });
    } catch (error) {
      console.error("Error adding payment method:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add payment method",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteMethod = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch(`/api/payment-methods/user?id=${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete payment method: ${response.statusText}`);
      }
      
      // Refresh payment methods
      await fetchPaymentMethods();
      
      setMessage({
        type: "success",
        text: "Payment method deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      setMessage({
        type: "error",
        text: "Failed to delete payment method",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSetDefault = async (id: number) => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
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
      
      setMessage({
        type: "success",
        text: "Default payment method updated successfully",
      });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      setMessage({
        type: "error",
        text: "Failed to set default payment method",
      });
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <button
            type="button"
            onClick={handleAddNewMethod}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FaPlus className="inline mr-2" />
            Add Payment Method
          </button>
        </div>
        
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
        
        {/* Add new payment method form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add Payment Method</h2>
            
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
              
              <div className="flex justify-end space-x-3 mt-6">
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
        
        {/* User's payment methods */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            {userPaymentMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>You don't have any payment methods yet.</p>
                <button
                  type="button"
                  onClick={handleAddNewMethod}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  <FaPlus className="inline mr-2" />
                  Add your first payment method
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPaymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-4 ${
                      method.isDefault ? "border-green-500 bg-green-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {method.paymentMethod.code === 'gcash' && (
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">G</div>
                          )}
                          {method.paymentMethod.code === 'maya' && (
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">M</div>
                          )}
                          {method.paymentMethod.code === 'cash' && (
                            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">₱</div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{method.paymentMethod.name}</h3>
                          {method.isDefault && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheck className="mr-1" />
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!method.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(method.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Set as default"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMethod(method.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    {method.paymentMethod.requiresDetails && (
                      <div className="mt-3 text-sm text-gray-600">
                        {(() => {
                          try {
                            const details = JSON.parse(method.details);
                            return (
                              <div className="space-y-1">
                                {Object.entries(details).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {value as string}
                                  </div>
                                ))}
                              </div>
                            );
                          } catch {
                            return 'Invalid details';
                          }
                        })()}
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Added on {new Date(method.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
