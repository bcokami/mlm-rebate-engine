"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import {
  FaLink,
  FaSpinner,
  FaCopy,
  FaCheck,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaEnvelope,
  FaShoppingCart,
  FaArrowLeft,
  FaQrCode,
  FaImage,
  FaDownload,
  FaShareAlt
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
  title: string;
  description: string;
  customImage: string | null;
  clickCount: number;
  conversionCount: number;
  totalRevenue: number;
  totalCommission: number;
  createdAt: string;
}

export default function GenerateLinkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generatedLink, setGeneratedLink] = useState<ShareableLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  
  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?returnUrl=/referrals/generate');
    }
  }, [status, router]);
  
  // Fetch products and handle product ID from URL
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status]);
  
  useEffect(() => {
    // Check if there's a product ID in the URL
    const productId = searchParams.get('productId');
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        setSelectedProduct(product);
        setCustomTitle(product.name);
        setCustomDescription(product.description || '');
      }
    }
  }, [searchParams, products]);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      const productList = data.products || [];
      
      setProducts(productList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      setLoading(false);
    }
  };
  
  const generateShareableLink = async () => {
    if (!selectedProduct) {
      setError('Please select a product to share');
      return;
    }
    
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
          title: customTitle || selectedProduct.name,
          description: customDescription || selectedProduct.description,
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
    const text = `Check out ${customTitle || selectedProduct?.name}! ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  
  const shareViaFacebook = () => {
    if (!generatedLink) return;
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/s/${generatedLink.code}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };
  
  const shareViaTwitter = () => {
    if (!generatedLink) return;
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/s/${generatedLink.code}`;
    const text = `Check out ${customTitle || selectedProduct?.name}! ${shareUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };
  
  const shareViaEmail = () => {
    if (!generatedLink) return;
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/s/${generatedLink.code}`;
    const subject = `Check out ${customTitle || selectedProduct?.name}!`;
    const body = `I thought you might be interested in this product:\n\n${customTitle || selectedProduct?.name}\n\n${customDescription || selectedProduct?.description}\n\n${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-green-500 mr-2" />
          <span>Loading...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/referrals" className="inline-flex items-center text-blue-600 hover:underline">
            <FaArrowLeft className="mr-2" />
            Back to Referrals
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-green-50 border-b border-green-100">
            <h1 className="text-2xl font-semibold flex items-center">
              <FaLink className="mr-2 text-green-600" />
              Generate Shareable Link
            </h1>
            <p className="text-gray-600 mt-1">
              Create a custom link to share products and earn commissions
            </p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {!generatedLink ? (
              <div className="space-y-6">
                <div>
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
                      if (product) {
                        setCustomTitle(product.name);
                        setCustomDescription(product.description || '');
                      }
                    }}
                  >
                    <option value="">-- Select a product --</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price)} ({product.pv} PV)
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedProduct && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-24 w-24 bg-gray-100 rounded-md overflow-hidden mr-4">
                      {selectedProduct.image ? (
                        <Image
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaShoppingCart className="text-gray-400 h-8 w-8" />
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Title (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter a custom title for your link"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This will be displayed when your link is shared on social media
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Description (Optional)
                  </label>
                  <textarea
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Enter a custom description for your link"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                  ></textarea>
                  <p className="mt-1 text-xs text-gray-500">
                    This will be displayed when your link is shared on social media
                  </p>
                </div>
                
                <div>
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
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Shareable Link</h3>
                  
                  <div className="mb-4 p-4 bg-gray-50 rounded-md flex items-center justify-between">
                    <span className="text-gray-700 mr-2 break-all">
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
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Share Your Link</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-green-50"
                      onClick={shareViaWhatsApp}
                    >
                      <FaWhatsapp className="text-green-600 text-2xl mb-2" />
                      <span className="text-sm">WhatsApp</span>
                    </button>
                    
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-blue-50"
                      onClick={shareViaFacebook}
                    >
                      <FaFacebook className="text-blue-600 text-2xl mb-2" />
                      <span className="text-sm">Facebook</span>
                    </button>
                    
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-blue-50"
                      onClick={shareViaTwitter}
                    >
                      <FaTwitter className="text-blue-400 text-2xl mb-2" />
                      <span className="text-sm">Twitter</span>
                    </button>
                    
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-purple-50"
                      onClick={shareViaEmail}
                    >
                      <FaEnvelope className="text-purple-600 text-2xl mb-2" />
                      <span className="text-sm">Email</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setGeneratedLink(null)}
                  >
                    Generate Another Link
                  </button>
                  
                  <Link
                    href="/referrals"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View All My Links
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
