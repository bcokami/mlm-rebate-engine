"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import MainLayout from '@/components/layout/MainLayout';
import { FaArrowLeft, FaShoppingCart, FaMapMarkerAlt, FaTruck, FaCreditCard, FaCheck, FaSpinner, FaUser, FaUserPlus } from 'react-icons/fa';
import ShippingAddressForm from '@/components/checkout/ShippingAddressForm';
import ShippingMethodSelector from '@/components/checkout/ShippingMethodSelector';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import OrderSummary from '@/components/checkout/OrderSummary';
import GuestCheckoutForm, { GuestData } from '@/components/checkout/GuestCheckoutForm';

// Checkout steps
enum CheckoutStep {
  SHIPPING_ADDRESS = 0,
  SHIPPING_METHOD = 1,
  PAYMENT = 2,
  REVIEW = 3,
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState(CheckoutStep.SHIPPING_ADDRESS);
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [guestShippingAddress, setGuestShippingAddress] = useState<any | null>(null);

  // Redirect to shop if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      router.push('/shop');
    }
  }, [items, router, orderComplete]);

  // Fetch shipping methods for both members and guests
  useEffect(() => {
    fetchShippingMethods();
  }, []);

  // Fetch shipping addresses for members
  useEffect(() => {
    if (status === 'authenticated') {
      fetchShippingAddresses();
    } else if (status === 'unauthenticated') {
      // Show guest checkout options when not authenticated
      setIsGuestCheckout(true);
    }
  }, [status]);

  const fetchShippingAddresses = async () => {
    try {
      const response = await fetch('/api/shipping/addresses');
      if (!response.ok) throw new Error('Failed to fetch shipping addresses');

      const data = await response.json();
      setShippingAddresses(data);

      // Select default address if available
      const defaultAddress = data.find((address: any) => address.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
      setError('Failed to load shipping addresses. Please try again.');
    }
  };

  const handleGuestCheckout = () => {
    setShowGuestForm(true);
  };

  const handleGuestFormSubmit = (data: GuestData) => {
    setGuestData(data);

    // Create a temporary shipping address object from guest data
    const guestAddress = {
      id: 'guest-address',
      name: data.name,
      phone: data.phone,
      email: data.email,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || '',
      city: data.city,
      region: data.region,
      postalCode: data.postalCode,
      isGuestAddress: true
    };

    setGuestShippingAddress(guestAddress);
    setCurrentStep(CheckoutStep.SHIPPING_METHOD);
  };

  const handleGuestFormCancel = () => {
    setShowGuestForm(false);
  };

  const handleLoginInstead = () => {
    router.push('/login?returnUrl=/checkout');
  };

  const fetchShippingMethods = async () => {
    try {
      const response = await fetch('/api/shipping/methods');
      if (!response.ok) throw new Error('Failed to fetch shipping methods');

      const data = await response.json();
      setShippingMethods(data);

      // Select first shipping method by default
      if (data.length > 0) {
        setSelectedShippingMethodId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      setError('Failed to load shipping methods. Please try again.');
    }
  };

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
  };

  const handleAddressSubmit = (addressData: any) => {
    // Add new address or update existing one
    // This would typically make an API call
    console.log('Address submitted:', addressData);

    // Move to next step
    setCurrentStep(CheckoutStep.SHIPPING_METHOD);
  };

  const handleShippingMethodSelect = (methodId: number) => {
    setSelectedShippingMethodId(methodId);
  };

  const handleShippingMethodSubmit = () => {
    if (!selectedShippingMethodId) {
      setError('Please select a shipping method');
      return;
    }

    setCurrentStep(CheckoutStep.PAYMENT);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  const handlePaymentSubmit = () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setCurrentStep(CheckoutStep.REVIEW);
  };

  const handlePlaceOrder = async () => {
    // For member checkout
    if (!isGuestCheckout && !selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    // For guest checkout
    if (isGuestCheckout && !guestData) {
      setError('Please provide your shipping information');
      return;
    }

    if (!selectedShippingMethodId || !paymentMethod) {
      setError('Please complete all required information');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get selected shipping method for price calculation
      const shippingMethod = shippingMethods.find(method => method.id === selectedShippingMethodId);
      const shippingFee = shippingMethod ? shippingMethod.price : 0;

      // Prepare order data
      const orderData: any = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          // Use SRP for guest checkout, member price for members
          price: isGuestCheckout ? item.srp : item.price,
          priceType: isGuestCheckout ? 'srp' : 'member',
        })),
        shippingMethodId: selectedShippingMethodId,
        paymentMethod,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
      };

      // Add guest data for guest checkout
      if (isGuestCheckout && guestData) {
        orderData.isGuestOrder = true;
        orderData.customerName = guestData.name;
        orderData.customerEmail = guestData.email;
        orderData.customerPhone = guestData.phone;
        orderData.guestShippingAddress = {
          name: guestData.name,
          phone: guestData.phone,
          email: guestData.email,
          addressLine1: guestData.addressLine1,
          addressLine2: guestData.addressLine2 || '',
          city: guestData.city,
          region: guestData.region,
          postalCode: guestData.postalCode,
          isGuestAddress: true
        };
      } else {
        // For member checkout
        orderData.shippingAddressId = selectedAddressId;
      }

      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const responseData = await response.json();
      setOrderId(responseData.orderNumber);
      setOrderComplete(true);
      clearCart();
    } catch (error: any) {
      console.error('Error placing order:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (status === 'loading' || (items.length === 0 && !orderComplete)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin h-8 w-8 text-green-500 mr-2" />
          <span className="text-xl">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  // Order complete page
  if (orderComplete) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <FaCheck className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your order. Your order number is <span className="font-semibold">{orderId}</span>.
            </p>
            <p className="text-gray-600 mb-8">
              We've sent a confirmation email with all the details of your purchase.
              You can also track your order status in your account dashboard.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/orders"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                View My Orders
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/shop" className="flex items-center text-blue-600 hover:underline">
            <FaArrowLeft className="mr-2" />
            Back to Shop
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main checkout form */}
          <div className="lg:w-2/3">
            {/* Checkout steps */}
            <div className="mb-8">
              <div className="flex items-center">
                {[
                  { label: 'Shipping Address', icon: <FaMapMarkerAlt /> },
                  { label: 'Shipping Method', icon: <FaTruck /> },
                  { label: 'Payment', icon: <FaCreditCard /> },
                  { label: 'Review', icon: <FaCheck /> },
                ].map((step, index) => (
                  <div key={index} className="flex-1">
                    <div className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}>
                      <div
                        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          index <= currentStep
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {step.icon}
                      </div>
                      <div
                        className={`ml-2 text-sm font-medium ${
                          index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                        } hidden sm:block`}
                      >
                        {step.label}
                      </div>
                      {index < 3 && (
                        <div
                          className={`flex-1 ml-2 h-0.5 ${
                            index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        ></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {currentStep === CheckoutStep.SHIPPING_ADDRESS && (
                <>
                  {isGuestCheckout ? (
                    showGuestForm ? (
                      <GuestCheckoutForm
                        onSubmit={handleGuestFormSubmit}
                        onCancel={handleGuestFormCancel}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                          <FaUser className="h-full w-full" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Guest Checkout</h3>
                        <p className="text-gray-600 mb-6">
                          Continue as a guest to purchase products at retail price.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                          <button
                            type="button"
                            onClick={handleGuestCheckout}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
                          >
                            <FaUserPlus className="mr-2" />
                            Continue as Guest
                          </button>
                          <button
                            type="button"
                            onClick={handleLoginInstead}
                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <FaUser className="mr-2" />
                            Sign In for Member Prices
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <ShippingAddressForm
                      addresses={shippingAddresses}
                      selectedAddressId={selectedAddressId}
                      onAddressSelect={handleAddressSelect}
                      onSubmit={handleAddressSubmit}
                    />
                  )}
                </>
              )}

              {currentStep === CheckoutStep.SHIPPING_METHOD && (
                <ShippingMethodSelector
                  methods={shippingMethods}
                  selectedMethodId={selectedShippingMethodId}
                  onMethodSelect={handleShippingMethodSelect}
                  onSubmit={handleShippingMethodSubmit}
                  onBack={() => setCurrentStep(CheckoutStep.SHIPPING_ADDRESS)}
                />
              )}

              {currentStep === CheckoutStep.PAYMENT && (
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onMethodSelect={handlePaymentMethodSelect}
                  onSubmit={handlePaymentSubmit}
                  onBack={() => setCurrentStep(CheckoutStep.SHIPPING_METHOD)}
                />
              )}

              {currentStep === CheckoutStep.REVIEW && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Review Your Order</h2>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Shipping Address</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {isGuestCheckout && guestShippingAddress ? (
                        <>
                          {guestShippingAddress.name}
                          <br />
                          {guestShippingAddress.addressLine1}
                          {guestShippingAddress.addressLine2 && (
                            <>
                              <br />
                              {guestShippingAddress.addressLine2}
                            </>
                          )}
                          <br />
                          {guestShippingAddress.city}, {guestShippingAddress.region} {guestShippingAddress.postalCode}
                          <br />
                          Phone: {guestShippingAddress.phone}
                          <br />
                          Email: {guestShippingAddress.email}
                        </>
                      ) : (
                        <>
                          {shippingAddresses.find(addr => addr.id === selectedAddressId)?.name}
                          <br />
                          {shippingAddresses.find(addr => addr.id === selectedAddressId)?.addressLine1}
                          <br />
                          {shippingAddresses.find(addr => addr.id === selectedAddressId)?.city},{' '}
                          {shippingAddresses.find(addr => addr.id === selectedAddressId)?.region}{' '}
                          {shippingAddresses.find(addr => addr.id === selectedAddressId)?.postalCode}
                          <br />
                          Phone: {shippingAddresses.find(addr => addr.id === selectedAddressId)?.phone}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                      onClick={() => setCurrentStep(CheckoutStep.SHIPPING_ADDRESS)}
                    >
                      Change
                    </button>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Shipping Method</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {shippingMethods.find(method => method.id === selectedShippingMethodId)?.name} - ₱
                      {shippingMethods.find(method => method.id === selectedShippingMethodId)?.price.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                      onClick={() => setCurrentStep(CheckoutStep.SHIPPING_METHOD)}
                    >
                      Change
                    </button>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {paymentMethod === 'credit_card' && 'Credit Card'}
                      {paymentMethod === 'gcash' && 'GCash'}
                      {paymentMethod === 'maya' && 'Maya'}
                      {paymentMethod === 'bank_transfer' && 'Bank Transfer'}
                      {paymentMethod === 'wallet' && 'Wallet Balance'}
                      {paymentMethod === 'cod' && 'Cash on Delivery'}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                      onClick={() => setCurrentStep(CheckoutStep.PAYMENT)}
                    >
                      Change
                    </button>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      onClick={handlePlaceOrder}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:w-1/3">
            <OrderSummary
              items={items}
              shippingFee={
                selectedShippingMethodId
                  ? shippingMethods.find(method => method.id === selectedShippingMethodId)?.price || 0
                  : 0
              }
              isGuestCheckout={isGuestCheckout}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
