"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaLink, 
  FaSpinner, 
  FaCopy, 
  FaCheck, 
  FaWhatsapp, 
  FaFacebook, 
  FaEnvelope,
  FaShoppingCart
} from 'react-icons/fa';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  srp: number;
  pv: number;
  image: string | null;
}

interface ShareableLink {
  id: number;
  code: string;
  clickCount: number;
  conversionCount: number;
}

const QuickShareWidget = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generatedLink, setGeneratedLink] = useState<ShareableLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      // Fetch top 5 products (could be based on popularity, commission rate, etc.)
      const response = await fetch('/api/products?limit=5&sort=popular');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      const productList = data.products || [];
      
      setProducts(productList);
      if (productList.length > 0) {
        setSelectedProduct(productList[0]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateShareableLink = async () => {
    if (!selectedProduct) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch('/api/shareable-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          title: selectedProduct.name,
          description: selectedProduct.description,
          customImage: selectedProduct.image,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate link');
      }
      
      const data = await response.json();
      setGeneratedLink(data.link);
    } catch (error) {
      console.error('Error generating link:', error);
      setError('Failed to generate link. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    
    try {
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/s/${generatedLink.code}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setError('Failed to copy link to clipboard');
    }
  };

  const shareViaWhatsApp = () => {
    if (!generatedLink) return;
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/s/${generatedLink.code}`;
    const text = `Check out ${selectedProduct?.name}! ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaFacebook = () => {
    if (!generatedLink) return;
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/s/${generatedLink.code}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!generatedLink) return;
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/s/${generatedLink.code}`;
    const subject = `Check out ${selectedProduct?.name}!`;
    const body = `I thought you might be interested in this product:\n\n${selectedProduct?.name}\n\n${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
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
        <FaSpinner className="animate-spin text-green-500 mr-2" />
        <span>Loading products...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-green-50 border-b border-green-100">
        <h2 className="text-lg font-semibold flex items-center">
          <FaLink className="mr-2 text-green-600" />
          Quick Share
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Generate shareable links for products and earn commissions
        </p>
      </div>
      
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a product to share
          </label>
          <select
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={selectedProduct?.id || ''}
            onChange={(e) => {
              const productId = parseInt(e.target.value);
              const product = products.find(p => p.id === productId) || null;
              setSelectedProduct(product);
              setGeneratedLink(null);
            }}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {formatCurrency(product.price)} ({product.pv} PV)
              </option>
            ))}
          </select>
        </div>
        
        {selectedProduct && (
          <div className="mb-4 flex items-start">
            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden mr-3">
              {selectedProduct.image ? (
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
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
            <div>
              <h3 className="font-medium">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{selectedProduct.description}</p>
              <div className="mt-1 flex items-center">
                <span className="text-green-600 font-medium mr-3">{formatCurrency(selectedProduct.price)}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {selectedProduct.pv} PV
                </span>
              </div>
            </div>
          </div>
        )}
        
        {!generatedLink ? (
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={generateShareableLink}
            disabled={!selectedProduct || generating}
          >
            {generating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FaLink className="mr-2" />
                Generate Shareable Link
              </>
            )}
          </button>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
              <span className="text-sm text-gray-700 truncate mr-2">
                {window.location.origin}/s/{generatedLink.code}
              </span>
              <button
                type="button"
                className="flex-shrink-0 text-blue-600 hover:text-blue-800"
                onClick={copyToClipboard}
                title="Copy link"
              >
                {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={shareViaWhatsApp}
              >
                <FaWhatsapp className="mr-1" />
                WhatsApp
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={shareViaFacebook}
              >
                <FaFacebook className="mr-1" />
                Facebook
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                onClick={shareViaEmail}
              >
                <FaEnvelope className="mr-1" />
                Email
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link href="/referrals" className="text-sm text-blue-600 hover:underline">
            View all my shareable links
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuickShareWidget;
