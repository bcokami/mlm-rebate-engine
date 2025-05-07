"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FaShoppingCart, FaCheck } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    srp: number;
    pv: number;
    image: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };
  
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      srp: product.srp,
      image: product.image,
      quantity: 1,
      pv: product.pv
    });
    
    setAddedToCart(true);
    
    // Reset added to cart status after 3 seconds
    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };
  
  const isMember = !!session?.user;
  const displayPrice = isMember ? product.price : product.srp;
  const discount = product.srp - product.price;
  const discountPercentage = Math.round((discount / product.srp) * 100);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/shop/product/${product.id}`}>
        <div className="relative h-48 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <FaShoppingCart className="text-gray-400 h-8 w-8" />
            </div>
          )}
          
          {isMember && discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {discountPercentage}% OFF
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/shop/product/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 mb-1 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(displayPrice)}
            </div>
            
            {isMember && discount > 0 && (
              <div className="text-sm text-gray-500 line-through">
                {formatCurrency(product.srp)}
              </div>
            )}
          </div>
          
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
            {product.pv} PV
          </div>
        </div>
        
        {!isMember && (
          <div className="text-xs text-blue-600 mb-3">
            <Link href="/login" className="hover:underline">
              Sign in as a member
            </Link>
            {" "}for discounted prices!
          </div>
        )}
        
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addedToCart}
          className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            addedToCart ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
        >
          {addedToCart ? (
            <>
              <FaCheck className="mr-2" />
              Added to Cart
            </>
          ) : (
            <>
              <FaShoppingCart className="mr-2" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
