"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { 
  FaStar, 
  FaStarHalfAlt, 
  FaRegStar, 
  FaShoppingCart, 
  FaShare, 
  FaHeart, 
  FaRegHeart,
  FaCheckCircle,
  FaInfoCircle,
  FaLeaf,
  FaVial,
  FaFlask,
  FaTint
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import ProductReviews from "@/components/products/ProductReviews";
import RelatedProducts from "@/components/products/RelatedProducts";
import ProductImageGallery from "@/components/products/ProductImageGallery";

export default function BiogenExtremePage() {
  const { data: session } = useSession();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Fetch product data
  const { data, isLoading, error } = useQuery({
    queryKey: ["biogen-extreme"],
    queryFn: async () => {
      const response = await fetch("/api/products/biogen-extreme");
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      return response.json();
    },
  });
  
  // Set default variant when data is loaded
  useEffect(() => {
    if (data?.product?.productVariants) {
      const defaultVariant = data.product.productVariants.find(
        (variant: any) => variant.isDefault
      ) || data.product.productVariants[0];
      
      setSelectedVariant(defaultVariant);
    }
  }, [data]);
  
  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 10) {
      setQuantity(value);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (!data?.product || !selectedVariant) return;
    
    addToCart({
      id: data.product.id,
      name: data.product.name,
      price: selectedVariant.salePrice || selectedVariant.price,
      image: data.product.productImages[0]?.url || "/images/placeholder.png",
      quantity,
      variant: selectedVariant.name,
      variantId: selectedVariant.id,
      pointValue: data.product.pointValue,
    });
    
    toast.success("Added to cart!");
  };
  
  // Handle toggle favorite
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    
    if (!isFavorite) {
      toast.success("Added to favorites!");
    } else {
      toast.success("Removed from favorites!");
    }
  };
  
  // Render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    
    return stars;
  };
  
  // Calculate average rating
  const calculateAverageRating = () => {
    if (!data?.reviews || data.reviews.length === 0) return 0;
    
    const sum = data.reviews.reduce(
      (acc: number, review: any) => acc + review.rating,
      0
    );
    
    return sum / data.reviews.length;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="h-32 bg-gray-200 rounded mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Failed to load product. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const { product, reviews, relatedProducts } = data;
  const averageRating = calculateAverageRating();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="text-sm text-gray-500">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <Link href="/products" className="hover:text-blue-600">
                Products
              </Link>
              <span className="mx-2">/</span>
            </li>
            <li className="flex items-center">
              <Link href="/products/category/health-supplements" className="hover:text-blue-600">
                Health Supplements
              </Link>
              <span className="mx-2">/</span>
            </li>
            <li className="flex items-center text-gray-700">
              Biogen Extreme
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          {product.productImages && product.productImages.length > 0 ? (
            <ProductImageGallery images={product.productImages} />
          ) : (
            <div className="bg-gray-100 rounded-lg flex items-center justify-center h-96">
              <FaInfoCircle className="text-gray-400 text-4xl" />
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex mr-2">
              {renderStars(averageRating)}
            </div>
            <span className="text-gray-600">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
          
          <div className="mb-6">
            {product.salePrice && product.salePrice < product.price ? (
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600 mr-2">
                  ₱{(product.salePrice / 100).toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  ₱{(product.price / 100).toFixed(2)}
                </span>
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Save {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-blue-600">
                ₱{(product.price / 100).toFixed(2)}
              </span>
            )}
            
            <div className="mt-1 text-sm text-gray-500">
              Point Value: <span className="font-medium text-green-600">{product.pointValue} PV</span>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700">{product.shortDescription}</p>
          </div>
          
          {/* Key Benefits */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Key Benefits</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <FaTint className="text-blue-500 mt-1 mr-2" />
                <span>Helps maintain acid-alkaline balance</span>
              </li>
              <li className="flex items-start">
                <FaFlask className="text-blue-500 mt-1 mr-2" />
                <span>Oxygenates the cells</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-blue-500 mt-1 mr-2" />
                <span>Tasteless and odorless in water</span>
              </li>
              <li className="flex items-start">
                <FaLeaf className="text-blue-500 mt-1 mr-2" />
                <span>Gluten-free and vegan</span>
              </li>
              <li className="flex items-start">
                <FaVial className="text-blue-500 mt-1 mr-2" />
                <span>Contains essential minerals and trace minerals</span>
              </li>
            </ul>
          </div>
          
          {/* Variant Selection */}
          {product.productVariants && product.productVariants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="flex space-x-2">
                {product.productVariants.map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 border rounded-md ${
                      selectedVariant?.id === variant.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center">
              <button
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 text-center border-t border-b border-gray-300 py-1"
              />
              <button
                onClick={() => quantity < 10 && setQuantity(quantity + 1)}
                className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
              
              <span className="ml-3 text-sm text-gray-500">
                {selectedVariant?.stock || product.stock} available
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-medium flex items-center justify-center"
            >
              <FaShoppingCart className="mr-2" />
              Add to Cart
            </button>
            
            <button
              onClick={handleToggleFavorite}
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              aria-label="Add to favorites"
            >
              {isFavorite ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart className="text-gray-600" />
              )}
            </button>
            
            <button
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              aria-label="Share product"
            >
              <FaShare className="text-gray-600" />
            </button>
          </div>
          
          {/* Stock and Shipping */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <FaCheckCircle className="text-green-500 mr-2" />
              <span>
                {selectedVariant?.stock || product.stock > 0
                  ? "In Stock"
                  : "Out of Stock"}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Free shipping on orders over ₱1,500
            </p>
          </div>
        </div>
      </div>
      
      {/* Product Description */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Description</h2>
        <div className="prose max-w-none">
          {product.description.split('\n\n').map((paragraph: string, index: number) => (
            <p key={index} className="mb-4">{paragraph}</p>
          ))}
        </div>
      </div>
      
      {/* Reviews */}
      <ProductReviews 
        productId={product.id} 
        reviews={reviews} 
        averageRating={averageRating} 
      />
      
      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </div>
  );
}
