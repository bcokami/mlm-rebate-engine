"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight, FaStar, FaShoppingCart } from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  image: string;
  category: string;
  pointValue: number;
  rating?: number;
}

const ProductCarousel = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Fetch featured products
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/products/featured");
        
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError("Failed to load products. Please try again later.");
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === products.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? products.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Calculate visible products based on screen size
  const getVisibleProducts = () => {
    if (products.length === 0) return [];
    
    // For simplicity, we'll show 3 products at a time
    const visibleCount = 3;
    const result = [];
    
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % products.length;
      result.push(products[index]);
    }
    
    return result;
  };

  // Render stars based on rating
  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  const visibleProducts = getVisibleProducts();

  return (
    <div 
      ref={carouselRef}
      className="relative opacity-0 translate-y-[20px] transition-all duration-1000"
      style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
    >
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={prevSlide}
          className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 focus:outline-none transition-all duration-300 hover:shadow-xl"
          aria-label="Previous product"
        >
          <FaChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="flex justify-center space-x-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-green-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
        
        <button
          onClick={nextSlide}
          className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 focus:outline-none transition-all duration-300 hover:shadow-xl"
          aria-label="Next product"
        >
          <FaChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {visibleProducts.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative h-48">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.salePrice && product.salePrice < product.price && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                  SALE
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {product.name}
                </h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  {product.pointValue} PV
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>
              
              <div className="mb-3">
                {renderStars(product.rating)}
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex justify-between items-center">
                <div>
                  {product.salePrice && product.salePrice < product.price ? (
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-blue-600 mr-2">
                        ₱{(product.salePrice / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ₱{(product.price / 100).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-blue-600">
                      ₱{(product.price / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                
                <Link
                  href={`/products/${product.id}`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-300"
                >
                  <FaShoppingCart className="mr-2" />
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
