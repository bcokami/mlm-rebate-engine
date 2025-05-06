"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useCart } from '@/hooks/useCart';
import { featuredProducts } from '@/app/api/products/route';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  image: string;
  category: string;
  pointValue: number;
  stock: number;
  featured: boolean;
}

export default function FeaturedProducts() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real implementation, we would fetch from the API
    // For now, we'll use the static data
    setProducts(featuredProducts);
    setLoading(false);
  }, []);
  
  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.image,
      quantity: 1,
      pointValue: product.pointValue,
    });
    
    toast.success(`${product.name} added to cart!`);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
        <Link href="/products" className="text-blue-600 hover:text-blue-800 flex items-center">
          View All Products <FaArrowRight className="ml-1" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Link href={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
                {product.salePrice && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                  </div>
                )}
              </div>
            </Link>
            
            <div className="p-4">
              <div className="mb-2">
                <span className="text-xs text-gray-500">{product.category}</span>
              </div>
              
              <Link href={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-1 hover:text-blue-600">{product.name}</h3>
              </Link>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  {product.salePrice ? (
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-blue-600">₱{(product.salePrice / 100).toFixed(2)}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">₱{(product.price / 100).toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-blue-600">₱{(product.price / 100).toFixed(2)}</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <FaStar className="text-yellow-400" />
                  <span className="text-sm text-gray-600 ml-1">4.8</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">{product.pointValue} PV</span>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                >
                  <FaShoppingCart className="mr-1" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
