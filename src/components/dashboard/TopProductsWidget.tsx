"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaShoppingCart, FaSpinner, FaLink, FaChartLine, FaArrowRight } from 'react-icons/fa';

interface Product {
  id: number;
  name: string;
  price: number;
  pv: number;
  image: string | null;
  conversionRate?: number;
  totalSales?: number;
  totalCommissions?: number;
}

const TopProductsWidget = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      // Fetch top products by conversion rate or commission potential
      const response = await fetch('/api/products/top-performers');
      if (!response.ok) throw new Error('Failed to fetch top products');
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching top products:', error);
      setError('Failed to load top products. Please try again.');
      
      // Fallback to regular products if top performers endpoint fails
      try {
        const fallbackResponse = await fetch('/api/products?limit=5');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setProducts(fallbackData.products || []);
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback products:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading top products...</span>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <h2 className="text-lg font-semibold flex items-center">
          <FaChartLine className="mr-2 text-blue-600" />
          Top Performing Products
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Products with the highest conversion rates and commission potential
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {products.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No products available at the moment.
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden mr-3">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaShoppingCart className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-green-600 font-medium">{formatCurrency(product.price)}</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {product.pv} PV
                    </span>
                    
                    {product.conversionRate !== undefined && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {product.conversionRate}% Conversion
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex space-x-2">
                    <Link
                      href={`/shop/product/${product.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FaShoppingCart className="mr-1" />
                      View Product
                    </Link>
                    
                    <Link
                      href={`/referrals/generate?productId=${product.id}`}
                      className="text-xs text-green-600 hover:text-green-800 flex items-center"
                    >
                      <FaLink className="mr-1" />
                      Generate Link
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <Link
          href="/shop"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center"
        >
          Browse all products
          <FaArrowRight className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default TopProductsWidget;
