"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PurchaseForm from "@/components/shop/PurchaseForm";
import ProductShareButton from "@/components/sharing/ProductShareButton";
import { FaSpinner, FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  pv: number;
  image: string;
  isActive: boolean;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  
  // Get referral code from URL if present
  const referralCode = searchParams.get("ref");
  
  // Fetch product data
  useEffect(() => {
    fetchProduct();
  }, [params.id]);
  
  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/${params.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Failed to load product. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePurchaseClick = () => {
    if (status === "unauthenticated") {
      // Redirect to login page with return URL
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    setShowPurchaseForm(true);
  };
  
  const handlePurchaseSuccess = () => {
    setShowPurchaseForm(false);
    
    // Show success message
    alert("Purchase successful!");
    
    // Record referral click if applicable
    if (referralCode) {
      try {
        fetch("/api/shareable-links/click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: referralCode,
          }),
        });
      } catch (error) {
        console.error("Error recording referral click:", error);
      }
    }
    
    // Redirect to purchases page
    router.push("/purchases");
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
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <FaSpinner className="animate-spin text-green-500 mr-2" />
          <span>Loading product...</span>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
            {error || "Product not found"}
          </div>
          <Link href="/shop" className="flex items-center text-blue-600 hover:underline">
            <FaArrowLeft className="mr-2" />
            Back to Shop
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/shop" className="flex items-center text-blue-600 hover:underline mb-6">
          <FaArrowLeft className="mr-2" />
          Back to Shop
        </Link>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              {product.image ? (
                <div className="relative h-80 md:h-full">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 h-80 md:h-full flex items-center justify-center">
                  <FaShoppingCart className="text-gray-400 text-6xl" />
                </div>
              )}
            </div>
            
            <div className="md:w-1/2 p-6">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                
                {/* Share button */}
                {status === "authenticated" && (
                  <ProductShareButton product={product} />
                )}
              </div>
              
              <div className="flex items-center mb-4">
                <div className="text-2xl font-bold text-green-600 mr-4">
                  {formatCurrency(product.price)}
                </div>
                <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                  {product.pv} PV
                </div>
              </div>
              
              {/* Referral badge */}
              {referralCode && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                  You were referred to this product by a member. They will earn a commission if you make a purchase.
                </div>
              )}
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-700">{product.description}</p>
              </div>
              
              {!showPurchaseForm ? (
                <button
                  type="button"
                  onClick={handlePurchaseClick}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <FaShoppingCart className="inline mr-2" />
                  Purchase Now
                </button>
              ) : (
                <PurchaseForm
                  product={product}
                  onSuccess={handlePurchaseSuccess}
                  referralCode={referralCode || undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
