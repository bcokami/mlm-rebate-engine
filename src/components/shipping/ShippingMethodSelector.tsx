"use client";

import { useState, useEffect } from "react";
import { FaSpinner, FaStore, FaMotorcycle, FaTruck, FaInfoCircle } from "react-icons/fa";

interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  requiresDetails: boolean;
  detailsSchema: string | null;
  baseFee: number;
}

interface ShippingMethodSelectorProps {
  onSelect: (method: ShippingMethod | null, details: Record<string, any>, address: string) => void;
  selectedMethodId?: number;
  initialAddress?: string;
}

export default function ShippingMethodSelector({
  onSelect,
  selectedMethodId,
  initialAddress = "",
}: ShippingMethodSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [shippingDetails, setShippingDetails] = useState<Record<string, any>>({});
  const [shippingAddress, setShippingAddress] = useState(initialAddress);
  const [error, setError] = useState<string | null>(null);

  // Fetch shipping methods on component mount
  useEffect(() => {
    fetchShippingMethods();
  }, []);

  // Set selected method if selectedMethodId is provided
  useEffect(() => {
    if (selectedMethodId && shippingMethods.length > 0) {
      const method = shippingMethods.find(m => m.id === selectedMethodId);
      if (method) {
        handleSelectMethod(method);
      }
    }
  }, [selectedMethodId, shippingMethods]);

  const fetchShippingMethods = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shipping-methods");

      if (!response.ok) {
        throw new Error(`Failed to fetch shipping methods: ${response.statusText}`);
      }

      const data = await response.json();
      setShippingMethods(data);

      // If there's only one method, select it by default
      if (data.length === 1) {
        handleSelectMethod(data[0]);
      }
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      setError("Failed to load shipping methods");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = (method: ShippingMethod) => {
    setSelectedMethod(method);
    setShippingDetails({});
    onSelect(method, {}, shippingAddress);
  };

  const handleDetailsChange = (field: string, value: string) => {
    const newDetails = { ...shippingDetails, [field]: value };
    setShippingDetails(newDetails);
    
    if (selectedMethod) {
      onSelect(selectedMethod, newDetails, shippingAddress);
    }
  };

  const handleAddressChange = (address: string) => {
    setShippingAddress(address);
    
    if (selectedMethod) {
      onSelect(selectedMethod, shippingDetails, address);
    }
  };

  const renderShippingMethodIcon = (code: string) => {
    switch (code) {
      case 'pickup':
        return <FaStore className="text-blue-500" />;
      case 'lalamove':
        return <FaMotorcycle className="text-orange-500" />;
      case 'jnt':
        return <FaTruck className="text-red-500" />;
      default:
        return <FaTruck className="text-gray-500" />;
    }
  };

  const renderDetailsFields = (method: ShippingMethod) => {
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
                type={prop.format === 'date' ? 'date' : 'text'}
                value={shippingDetails[key] || ""}
                onChange={(e) => handleDetailsChange(key, e.target.value)}
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
      <div className="flex items-center justify-center p-4">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading shipping methods...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (shippingMethods.length === 0) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
        No shipping methods available.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        {shippingMethods.map((method) => (
          <div
            key={method.id}
            className={`border rounded-md p-3 cursor-pointer ${
              selectedMethod?.id === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => handleSelectMethod(method)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 w-8 h-8 flex items-center justify-center">
                  {renderShippingMethodIcon(method.code)}
                </div>
                <div>
                  <div className="font-medium">{method.name}</div>
                  {method.description && (
                    <div className="text-sm text-gray-500">{method.description}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {method.baseFee > 0 ? (
                  <div className="font-medium">
                    ₱{method.baseFee.toFixed(2)}
                  </div>
                ) : (
                  <div className="text-green-600 font-medium">Free</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMethod && (
        <div className="mt-4">
          {selectedMethod.code !== 'pickup' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Address
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                rows={3}
                className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your complete shipping address"
                required
              />
            </div>
          )}

          {renderDetailsFields(selectedMethod)}

          {selectedMethod.code === 'pickup' && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-start">
              <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Store Pickup Information</p>
                <p className="text-sm">
                  You can pick up your order at our store located at: 
                  <strong> 123 Main Street, Makati City, Metro Manila</strong>
                </p>
                <p className="text-sm mt-1">
                  Store Hours: Monday to Saturday, 9:00 AM to 6:00 PM
                </p>
              </div>
            </div>
          )}

          {selectedMethod.code === 'lalamove' && (
            <div className="mt-4 p-3 bg-orange-50 text-orange-700 rounded-md flex items-start">
              <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Lalamove Delivery Information</p>
                <p className="text-sm">
                  Lalamove provides same-day delivery within Metro Manila. Delivery time is typically 1-3 hours after order confirmation.
                </p>
              </div>
            </div>
          )}

          {selectedMethod.code === 'jnt' && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
              <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">J&T Express Delivery Information</p>
                <p className="text-sm">
                  J&T Express delivers nationwide. Delivery time is typically 2-3 business days for Metro Manila and 3-7 business days for provincial areas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
