"use client";

import { useState } from 'react';
import Image from 'next/image';
import { FaCreditCard, FaMoneyBillWave, FaWallet, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { SiGcash, SiPaymaya } from 'react-icons/si';

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onMethodSelect: (method: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isGuestCheckout?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodSelect,
  onSubmit,
  onBack,
  isGuestCheckout = false,
}) => {
  const [creditCardDetails, setCreditCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });

  const handleCreditCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreditCardDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      icon: <FaCreditCard className="h-6 w-6" />,
      description: 'Pay securely with your credit or debit card',
    },
    {
      id: 'gcash',
      name: 'GCash',
      icon: <SiGcash className="h-6 w-6 text-blue-600" />,
      description: 'Pay using your GCash wallet',
    },
    {
      id: 'maya',
      name: 'Maya',
      icon: <SiPaymaya className="h-6 w-6 text-green-600" />,
      description: 'Pay using your Maya wallet',
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: <FaMoneyBillWave className="h-6 w-6 text-green-700" />,
      description: 'Pay via bank transfer',
    },
    {
      id: 'wallet',
      name: 'Wallet Balance',
      icon: <FaWallet className="h-6 w-6 text-purple-600" />,
      description: 'Pay using your wallet balance',
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: <FaMoneyBillWave className="h-6 w-6 text-yellow-600" />,
      description: 'Pay when you receive your order',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>

      {isGuestCheckout && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            <strong>Guest Checkout:</strong> You are checking out as a guest. Some payment methods like Wallet Balance are only available to registered members.
          </p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {paymentMethods
          .filter(method => !isGuestCheckout || method.id !== 'wallet')
          .map((method) => (
          <div
            key={method.id}
            className={`border rounded-md p-4 cursor-pointer ${
              selectedMethod === method.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onMethodSelect(method.id)}
          >
            <div className="flex justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">{method.icon}</div>
                <div>
                  <p className="font-medium text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              </div>
              {selectedMethod === method.id && (
                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                  <FaCheck className="text-white h-3 w-3" />
                </div>
              )}
            </div>

            {/* Credit card form */}
            {selectedMethod === 'credit_card' && method.id === 'credit_card' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 gap-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={creditCardDetails.cardNumber}
                      onChange={handleCreditCardChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      id="cardholderName"
                      name="cardholderName"
                      placeholder="John Doe"
                      value={creditCardDetails.cardholderName}
                      onChange={handleCreditCardChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={creditCardDetails.expiryDate}
                        onChange={handleCreditCardChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        placeholder="123"
                        value={creditCardDetails.cvv}
                        onChange={handleCreditCardChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GCash instructions */}
            {selectedMethod === 'gcash' && method.id === 'gcash' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  You will be redirected to GCash to complete your payment after placing your order.
                </p>
              </div>
            )}

            {/* Maya instructions */}
            {selectedMethod === 'maya' && method.id === 'maya' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  You will be redirected to Maya to complete your payment after placing your order.
                </p>
              </div>
            )}

            {/* Bank transfer instructions */}
            {selectedMethod === 'bank_transfer' && method.id === 'bank_transfer' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Please transfer the total amount to one of the following bank accounts:
                </p>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <p className="font-medium">BDO</p>
                  <p>Account Name: Extreme Life Herbal Products</p>
                  <p>Account Number: 1234 5678 9012</p>
                </div>
                <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
                  <p className="font-medium">BPI</p>
                  <p>Account Name: Extreme Life Herbal Products</p>
                  <p>Account Number: 9876 5432 1098</p>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  After making the transfer, please send a copy of the deposit slip or transfer confirmation to our email: payments@extremelifeherbal.ph
                </p>
              </div>
            )}

            {/* Wallet balance info */}
            {selectedMethod === 'wallet' && method.id === 'wallet' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Your current wallet balance: <span className="font-medium">₱1,250.00</span>
                </p>
              </div>
            )}

            {/* COD instructions */}
            {selectedMethod === 'cod' && method.id === 'cod' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Pay with cash when your order is delivered. Please prepare the exact amount.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

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
          disabled={!selectedMethod}
        >
          Review Order
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
