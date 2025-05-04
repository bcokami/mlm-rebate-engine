"use client";

import { useState } from "react";
import { 
  FaShare, 
  FaLink, 
  FaFacebook, 
  FaTwitter, 
  FaWhatsapp, 
  FaEnvelope, 
  FaCopy, 
  FaSpinner, 
  FaCheck 
} from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
}

interface ProductShareButtonProps {
  product: Product;
  className?: string;
}

export default function ProductShareButton({ product, className = "" }: ProductShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateShareableLink = async () => {
    if (shareableLink) {
      setIsOpen(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/shareable-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          title: product.name,
          description: product.description,
          customImage: product.image,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate shareable link: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Construct the full URL
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/s/${data.link.code}`;
      
      setShareableLink(shareUrl);
      setIsOpen(true);
    } catch (error) {
      console.error("Error generating shareable link:", error);
      setError("Failed to generate shareable link. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = async () => {
    if (!shareableLink) return;
    
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };
  
  const shareOnFacebook = () => {
    if (!shareableLink) return;
    
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}`;
    window.open(url, "_blank");
  };
  
  const shareOnTwitter = () => {
    if (!shareableLink) return;
    
    const text = `Check out ${product.name}!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableLink)}`;
    window.open(url, "_blank");
  };
  
  const shareOnWhatsApp = () => {
    if (!shareableLink) return;
    
    const text = `Check out ${product.name}! ${shareableLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };
  
  const shareViaEmail = () => {
    if (!shareableLink) return;
    
    const subject = `Check out ${product.name}!`;
    const body = `I thought you might be interested in this product:\n\n${product.name}\n\n${shareableLink}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={generateShareableLink}
        className={`flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${className}`}
        disabled={loading}
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <FaShare className="mr-2" />
            Share
          </>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Share Product</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            
            {error && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {shareableLink && (
              <>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FaLink className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Shareable Link</span>
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={shareableLink}
                      readOnly
                      className="flex-1 border rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="bg-gray-100 border border-l-0 rounded-r-md px-3 py-2 hover:bg-gray-200"
                      title="Copy to clipboard"
                    >
                      {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Share on</div>
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={shareOnFacebook}
                      className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                      title="Share on Facebook"
                    >
                      <FaFacebook size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={shareOnTwitter}
                      className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-blue-400 text-white hover:bg-blue-500"
                      title="Share on Twitter"
                    >
                      <FaTwitter size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={shareOnWhatsApp}
                      className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white hover:bg-green-600"
                      title="Share on WhatsApp"
                    >
                      <FaWhatsapp size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={shareViaEmail}
                      className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gray-600 text-white hover:bg-gray-700"
                      title="Share via Email"
                    >
                      <FaEnvelope size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Earn commissions when someone purchases this product through your link!
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
