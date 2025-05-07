"use client";

import { FaTruck, FaCheck, FaArrowLeft } from 'react-icons/fa';

interface ShippingMethod {
  id: number;
  name: string;
  description?: string;
  price: number;
  estimatedDeliveryDays: number;
}

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[];
  selectedMethodId: number | null;
  onMethodSelect: (methodId: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  methods,
  selectedMethodId,
  onMethodSelect,
  onSubmit,
  onBack,
}) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };
  
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Method</h2>
      
      {methods.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <FaTruck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No shipping methods available</h3>
          <p className="mt-1 text-sm text-gray-500">Please try again later or contact support.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-md p-4 cursor-pointer ${
                selectedMethodId === method.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onMethodSelect(method.id)}
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <FaTruck className="h-5 w-5 text-gray-400 mr-2" />
                    <p className="font-medium text-gray-900">{method.name}</p>
                  </div>
                  {method.description && (
                    <p className="mt-1 text-sm text-gray-500">{method.description}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    Estimated delivery: {method.estimatedDeliveryDays} day
                    {method.estimatedDeliveryDays !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className="font-medium text-gray-900 mr-3">{formatCurrency(method.price)}</p>
                  {selectedMethodId === method.id && (
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                      <FaCheck className="text-white h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          className="inline-flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onBack}
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={onSubmit}
          disabled={!selectedMethodId || methods.length === 0}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default ShippingMethodSelector;
