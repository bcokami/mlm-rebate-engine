"use client";

import { useState } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';
import CartDrawer from './CartDrawer';

const CartButton: React.FC = () => {
  const { itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  return (
    <>
      <button
        type="button"
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={() => setIsCartOpen(true)}
        aria-label="Open shopping cart"
      >
        <FaShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-600 flex items-center justify-center text-xs text-white">
            {itemCount}
          </span>
        )}
      </button>
      
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default CartButton;
