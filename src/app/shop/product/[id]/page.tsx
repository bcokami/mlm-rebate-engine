"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PurchaseForm from "@/components/shop/PurchaseForm";
import ProductShareButton from "@/components/sharing/ProductShareButton";
import { FaSpinner, FaArrowLeft, FaShoppingCart, FaPlus, FaMinus } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;  // Member price
  srp: number;    // Suggested Retail Price for non-members
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
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

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

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      srp: product.srp,
      image: product.image,
      quantity: quantity,
      pv: product.pv
    });

    setAddedToCart(true);

    // Reset added to cart status after 3 seconds
    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
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

              <div className="flex flex-col mb-4">
                <div className="flex items-center mb-2">
                  {status === "authenticated" ? (
                    <>
                      <div className="text-2xl font-bold text-green-600 mr-4">
                        {formatCurrency(product.price)}
                      </div>
                      {product.srp > product.price && (
                        <div className="text-lg text-gray-500 line-through">
                          {formatCurrency(product.srp)}
                        </div>
                      )}
                      <div className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                        {product.pv} PV
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-800 mr-4">
                        {formatCurrency(product.srp)}
                      </div>
                      <div className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                        {product.pv} PV
                      </div>
                    </>
                  )}
                </div>

                {status !== "authenticated" && (
                  <div className="text-sm text-blue-600">
                    <Link href="/login" className="hover:underline">
                      Sign in as a member
                    </Link>
                    {" "}to get discounted prices and earn rebates!
                  </div>
                )}
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

              {/* Quantity selector */}
              <div className="mb-6">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={decrementQuantity}
                    className="p-2 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100"
                  >
                    <FaMinus className="h-4 w-4 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="p-2 w-16 text-center border-t border-b border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={incrementQuantity}
                    className="p-2 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                  >
                    <FaPlus className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    addedToCart ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  disabled={addedToCart}
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

                {!showPurchaseForm ? (
                  <button
                    type="button"
                    onClick={handlePurchaseClick}
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FaShoppingCart className="mr-2" />
                    Buy Now
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
      </div>
    </MainLayout>
  );
}
