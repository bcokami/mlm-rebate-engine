"use client";

import Image from 'next/image';
import { FaShoppingCart } from 'react-icons/fa';
import { CartItem } from '@/contexts/CartContext';

interface OrderSummaryProps {
  items: CartItem[];
  shippingFee: number;
  discount?: number;
  isGuestCheckout?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  shippingFee,
  discount = 0,
  isGuestCheckout = false,
}) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  // Calculate subtotal based on price type (member price or SRP)
  const subtotal = items.reduce((total, item) => {
    // Use SRP for guests if available, otherwise use regular price
    const price = isGuestCheckout && item.srp ? item.srp : item.price;
    return total + (price * item.quantity);
  }, 0);

  const totalPV = items.reduce((total, item) => total + (item.pv * item.quantity), 0);
  const total = subtotal + shippingFee - discount;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-700">Order Summary</h3>
      </div>

      <div className="p-4">
        {/* Items */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Items ({items.length})</h4>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <FaShoppingCart className="text-gray-400 h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{item.pv} PV × {item.quantity}</p>
                    {isGuestCheckout && item.srp ? (
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.srp * item.quantity)}
                        {item.price < item.srp && (
                          <span className="text-xs text-gray-500 line-through ml-1">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between mb-2">
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</p>
          </div>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-gray-600">Shipping</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(shippingFee)}</p>
          </div>
          {discount > 0 && (
            <div className="flex justify-between mb-2">
              <p className="text-sm text-gray-600">Discount</p>
              <p className="text-sm font-medium text-green-600">-{formatCurrency(discount)}</p>
            </div>
          )}
          <div className="flex justify-between mb-2">
            <p className="text-sm text-gray-600">Total PV</p>
            <p className="text-sm font-medium text-blue-600">{totalPV} PV</p>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
            <p className="text-base font-medium text-gray-900">Total</p>
            <p className="text-base font-medium text-gray-900">{formatCurrency(total)}</p>
          </div>
        </div>

        {/* Potential earnings - only show for members */}
        {!isGuestCheckout && (
          <div className="mt-6 bg-blue-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Potential Earnings</h4>
            <p className="text-xs text-blue-700">
              This purchase will earn you approximately {Math.round(totalPV * 0.05)} PV in rebates based on your current rank.
            </p>
          </div>
        )}

        {/* Guest checkout message */}
        {isGuestCheckout && (
          <div className="mt-6 bg-yellow-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">Retail Price</h4>
            <p className="text-xs text-yellow-700">
              You are purchasing at retail price as a guest. Sign up as a member to get discounted prices and earn rebates on your purchases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
