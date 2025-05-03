"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import { FaShoppingCart } from "react-icons/fa";
import ProductPlaceholder from "@/components/ProductPlaceholder";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  rebateConfigs: {
    level: number;
    percentage: number;
  }[];
}

export default function ShopPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch products
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
    }
  }, [status]);

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
        <h1 className="text-2xl font-semibold mb-6">Shop Products</h1>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="h-48 relative bg-gray-50">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <ProductPlaceholder />
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold">₱{product.price.toFixed(2)}</span>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">
                    Rebate Structure:
                  </h3>
                  <div className="text-xs text-gray-500">
                    {product.rebateConfigs
                      .sort((a, b) => a.level - b.level)
                      .map((config) => (
                        <div key={config.level} className="flex justify-between">
                          <span>Level {config.level}:</span>
                          <span>{config.percentage}%</span>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(product.id)}
                  disabled={purchaseLoading === product.id}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {purchaseLoading === product.id ? (
                    "Processing..."
                  ) : (
                    <>
                      <FaShoppingCart className="mr-2" /> Purchase Now
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
