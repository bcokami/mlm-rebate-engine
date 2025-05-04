"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { walletTransactionSchema } from "@/lib/validation";
import { FaSpinner, FaMoneyBillWave } from "react-icons/fa";
import PaymentMethodSelector from "../payment/PaymentMethodSelector";

interface WalletTransactionFormProps {
  onSuccess: () => void;
  transactionType: "withdrawal" | "deposit";
}

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

export default function WalletTransactionForm({
  onSuccess,
  transactionType,
}: WalletTransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<UserPaymentMethod | PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any>>({});
  const [referenceNumber, setReferenceNumber] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(walletTransactionSchema),
    defaultValues: {
      type: transactionType,
      amount: 0,
      description: "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      // Add payment method details to the data
      if (selectedPaymentMethod) {
        if ('paymentMethodId' in selectedPaymentMethod) {
          // User payment method
          data.paymentMethodId = selectedPaymentMethod.paymentMethodId;
          try {
            data.paymentDetails = JSON.parse(selectedPaymentMethod.details);
          } catch (e) {
            data.paymentDetails = {};
          }
        } else {
          // Regular payment method
          data.paymentMethodId = selectedPaymentMethod.id;
          data.paymentDetails = paymentDetails;
        }
      }

      // Add reference number if provided
      if (referenceNumber) {
        data.referenceNumber = referenceNumber;
      }

      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process ${transactionType}`);
      }

      onSuccess();
    } catch (error) {
      console.error(`Error processing ${transactionType}:`, error);
      setError(error instanceof Error ? error.message : `Failed to process ${transactionType}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: UserPaymentMethod | PaymentMethod | null) => {
    setSelectedPaymentMethod(method);
    
    // Reset payment details if method changes
    setPaymentDetails({});
  };

  const renderPaymentDetailsFields = () => {
    if (!selectedPaymentMethod || ('paymentMethodId' in selectedPaymentMethod)) {
      return null;
    }
    
    const method = selectedPaymentMethod;
    
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
                value={paymentDetails[key] || ""}
                onChange={(e) => setPaymentDetails({
                  ...paymentDetails,
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {transactionType === "withdrawal" ? "Withdraw Funds" : "Deposit Funds"}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("type")} />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₱)
          </label>
          <input
            type="number"
            step="0.01"
            {...register("amount")}
            min="1"
            className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message as string}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <PaymentMethodSelector
            onSelect={handlePaymentMethodSelect}
            showAddNew={true}
          />
          
          {renderPaymentDetailsFields()}
          
          {selectedPaymentMethod && selectedPaymentMethod.code !== 'cash' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter payment reference number"
                className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading || !selectedPaymentMethod}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <FaSpinner className="inline animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <FaMoneyBillWave className="inline mr-2" />
              {transactionType === "withdrawal" ? "Withdraw" : "Deposit"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
