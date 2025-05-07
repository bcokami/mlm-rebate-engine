"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import Link from "next/link";
import { FaShoppingCart, FaSearch } from "react-icons/fa";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import ProductCard from "@/components/shop/ProductCard";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;  // Member price
  srp: number;    // Suggested Retail Price for non-members
  pv: number;     // Point Value
  image: string;
  rebateConfigs: {
    level: number;
    percentage: number;
  }[];
}

export default function ShopPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch products for all users (members and guests)
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        // Check if data has a products property (API returns { products, pagination })
        if (data && data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          // Fallback in case API returns array directly
          setProducts(data);
        } else {
          console.error("Unexpected products data format:", data);
          setProducts([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handlePurchase = async (productId: number) => {
    if (!session) return;

    setPurchaseLoading(productId);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to make purchase");
      }

      setMessage({
        type: "success",
        text: "Purchase successful! Rebates have been distributed.",
      });

      // Refresh products after purchase
      const productsResponse = await fetch("/api/products");
      const productsData = await productsResponse.json();

      // Check if data has a products property (API returns { products, pagination })
      if (productsData && productsData.products && Array.isArray(productsData.products)) {
        setProducts(productsData.products);
      } else if (Array.isArray(productsData)) {
        // Fallback in case API returns array directly
        setProducts(productsData);
      } else {
        console.error("Unexpected products data format:", productsData);
        setProducts([]);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred during purchase",
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-semibold mb-4">Shop Products</h1>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Member-only message */}
        {!session && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-medium text-blue-800 mb-1">Member Benefits</h3>
            <p className="text-sm text-blue-700">
              Sign in as a member to enjoy discounted prices and earn rebates on your purchases!
              <span className="ml-2">
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products
            .filter(product =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        )}

        {products.length > 0 &&
          products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products match your search.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
