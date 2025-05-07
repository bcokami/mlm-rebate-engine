"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaShoppingCart, FaTimes, FaTrash, FaPlus, FaMinus, FaArrowRight } from 'react-icons/fa';
import { useCart, CartItem } from '@/contexts/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, subtotal, totalPV } = useCart();
  
  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };
  
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center">
                          <FaShoppingCart className="mr-2" /> Shopping Cart
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <FaTimes className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        {items.length > 0 ? (
                          <div className="flow-root">
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {items.map((item) => (
                                <li key={item.id} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative">
                                    {item.image ? (
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover object-center"
                                      />
                                    ) : (
                                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                        <FaShoppingCart className="text-gray-400 h-8 w-8" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>{item.name}</h3>
                                        <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">PV: {item.pv * item.quantity}</p>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center border rounded-md">
                                        <button
                                          type="button"
                                          className="p-2 text-gray-600 hover:text-gray-800"
                                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                          <FaMinus size={12} />
                                        </button>
                                        <span className="px-2 py-1 text-gray-900 min-w-[40px] text-center">
                                          {item.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          className="p-2 text-gray-600 hover:text-gray-800"
                                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                          <FaPlus size={12} />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        className="font-medium text-red-600 hover:text-red-500 flex items-center"
                                        onClick={() => removeItem(item.id)}
                                      >
                                        <FaTrash className="mr-1" size={14} />
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            
                            <div className="mt-4 text-right">
                              <button
                                type="button"
                                className="text-sm font-medium text-red-600 hover:text-red-500"
                                onClick={clearCart}
                              >
                                Clear Cart
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="mx-auto h-24 w-24 text-gray-400">
                              <FaShoppingCart className="h-full w-full" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Start adding products to your cart to see them here.
                            </p>
                            <div className="mt-6">
                              <button
                                type="button"
                                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                                onClick={onClose}
                              >
                                Continue Shopping
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="flex justify-between text-base font-medium text-gray-900 mb-1">
                          <p>Subtotal</p>
                          <p>{formatCurrency(subtotal)}</p>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <p>Total PV</p>
                          <p>{totalPV} PV</p>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          Shipping and taxes calculated at checkout.
                        </p>
                        <div className="mt-6">
                          <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700"
                            onClick={handleCheckout}
                          >
                            Checkout <FaArrowRight className="ml-2" />
                          </button>
                        </div>
                        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                          <p>
                            or{' '}
                            <button
                              type="button"
                              className="font-medium text-green-600 hover:text-green-500"
                              onClick={onClose}
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CartDrawer;
