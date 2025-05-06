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
  FaShieldAlt,
  FaSparkles,
  FaBacterium,
  FaFemale
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import ProductReviews from "@/components/products/ProductReviews";
import RelatedProducts from "@/components/products/RelatedProducts";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import ProductIngredients from "@/components/products/ProductIngredients";
import ProductComparison from "@/components/products/ProductComparison";
import ProductFAQ from "@/components/products/ProductFAQ";
import ProductTestimonials from "@/components/products/ProductTestimonials";
import ProductVideo from "@/components/products/ProductVideo";
import ProductBundles from "@/components/products/ProductBundles";

export default function ShieldSoapPage() {
  const { data: session } = useSession();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch product data
  const { data, isLoading, error } = useQuery({
    queryKey: ["shield-soap"],
    queryFn: async () => {
      const response = await fetch("/api/products/shield-soap");
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
              <Link href="/products/category/personal-care" className="hover:text-blue-600">
                Personal Care
              </Link>
              <span className="mx-2">/</span>
            </li>
            <li className="flex items-center text-gray-700">
              Biogen Shield Herbal Care Soap
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-start">
                <FaSparkles className="text-blue-600 mt-1 mr-2" />
                <span>Whitens, renews & nourishes skin</span>
              </div>
              <div className="flex items-start">
                <FaShieldAlt className="text-blue-600 mt-1 mr-2" />
                <span>Body odor remover</span>
              </div>
              <div className="flex items-start">
                <FaCheckCircle className="text-blue-600 mt-1 mr-2" />
                <span>Natural deodorizer</span>
              </div>
              <div className="flex items-start">
                <FaFemale className="text-blue-600 mt-1 mr-2" />
                <span>Suitable for feminine wash</span>
              </div>
              <div className="flex items-start">
                <FaBacterium className="text-blue-600 mt-1 mr-2" />
                <span>Anti-bacterial protection</span>
              </div>
              <div className="flex items-start">
                <FaCheckCircle className="text-blue-600 mt-1 mr-2" />
                <span>Made with natural herbs</span>
              </div>
            </div>
          </div>

          {/* Variant Selection */}
          {product.productVariants && product.productVariants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Size
              </label>
              <div className="flex flex-wrap gap-2">
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

      {/* Product Video */}
      <div className="mb-12">
        <ProductVideo
          videoUrl="/videos/shield-soap-demo.mp4"
          thumbnailUrl="/images/products/shield-soap/shield-soap-video-thumbnail.jpg"
          title="See Biogen Shield Soap in Action"
          description="Watch this short video to learn more about the benefits and proper usage of Biogen Shield Herbal Care Soap."
        />
      </div>

      {/* How to Use */}
      <div className="mb-12 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">How to Use</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-blue-700 mb-2 flex items-center">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
              For Body Wash
            </h3>
            <p className="text-gray-600">Lather on wet skin, massage gently, and rinse thoroughly. Use daily for best results.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-blue-700 mb-2 flex items-center">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">2</span>
              For Feminine Wash
            </h3>
            <p className="text-gray-600">Use as directed by a healthcare professional. The gentle formula is suitable for sensitive areas.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-blue-700 mb-2 flex items-center">
              <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2">3</span>
              For Skin Whitening
            </h3>
            <p className="text-gray-600">For best whitening results, use consistently twice daily and leave lather on skin for 1-2 minutes before rinsing.</p>
          </div>
        </div>
        <div className="mt-4 text-gray-600">
          <p>Store in a cool, dry place. Keep away from direct sunlight. For external use only.</p>
        </div>
      </div>

      {/* Product Bundles */}
      <div className="mb-12">
        <ProductBundles
          bundles={[
            {
              id: "shield-soap-bundle-1",
              name: "Shield Soap Family Pack",
              description: "Perfect for the whole family with a 3-month supply of Shield Soap.",
              products: [
                {
                  id: product.id,
                  name: product.name,
                  image: product.productImages[0]?.url || "/images/placeholder.png",
                  price: product.price,
                  salePrice: product.salePrice,
                  quantity: 6
                }
              ],
              price: 650,
              salePrice: 550,
              pointValue: 60,
              savings: 100,
              popular: true
            },
            {
              id: "shield-soap-bundle-2",
              name: "Shield Soap + Biogen Extreme",
              description: "Complete health and hygiene bundle with our top products.",
              products: [
                {
                  id: product.id,
                  name: product.name,
                  image: product.productImages[0]?.url || "/images/placeholder.png",
                  price: product.price,
                  salePrice: product.salePrice,
                  quantity: 3
                },
                {
                  id: "biogen-extreme",
                  name: "Biogen Extreme Concentrate",
                  image: "/images/products/biogen-extreme/biogen-extreme-main.jpg",
                  price: 1250,
                  salePrice: 1100,
                  quantity: 1
                }
              ],
              price: 1500,
              salePrice: 1299,
              pointValue: 80,
              savings: 201
            },
            {
              id: "shield-soap-bundle-3",
              name: "Complete Personal Care Kit",
              description: "Everything you need for personal care and hygiene.",
              products: [
                {
                  id: product.id,
                  name: product.name,
                  image: product.productImages[0]?.url || "/images/placeholder.png",
                  price: product.price,
                  salePrice: product.salePrice,
                  quantity: 2
                },
                {
                  id: "veggie-coffee",
                  name: "Veggie Coffee 124 in 1",
                  image: "/images/products/veggie-coffee/veggie-coffee-main.jpg",
                  price: 980,
                  salePrice: 850,
                  quantity: 1
                },
                {
                  id: "collagen-drink",
                  name: "Collagen Beauty Drink",
                  image: "/images/products/collagen-drink.jpg",
                  price: 1500,
                  salePrice: 1350,
                  quantity: 1
                }
              ],
              price: 2700,
              salePrice: 2199,
              pointValue: 100,
              savings: 501
            }
          ]}
          onAddToCart={(bundleId) => {
            // Handle adding bundle to cart
            toast.success(`Bundle "${bundleId}" added to cart!`);
          }}
        />
      </div>

      {/* Ingredients */}
      <div className="mb-12">
        <ProductIngredients
          ingredients={[
            {
              name: "Coconut Oil",
              description: "A natural moisturizer that helps hydrate and protect the skin barrier.",
              benefits: [
                "Moisturizes and softens skin",
                "Has antimicrobial properties",
                "Helps reduce inflammation",
                "Supports skin barrier function"
              ],
              natural: true
            },
            {
              name: "Aloe Vera Extract",
              description: "A soothing plant extract with anti-inflammatory and healing properties.",
              benefits: [
                "Soothes irritated skin",
                "Provides natural hydration",
                "Helps heal minor skin issues",
                "Contains antioxidants that benefit skin"
              ],
              natural: true
            },
            {
              name: "Papaya Extract",
              description: "A natural enzyme-rich extract that helps gently exfoliate and brighten skin.",
              benefits: [
                "Natural skin whitening properties",
                "Helps remove dead skin cells",
                "Rich in antioxidants",
                "Promotes skin renewal"
              ],
              natural: true
            },
            {
              name: "Tea Tree Oil",
              description: "A powerful natural antiseptic with antibacterial and antifungal properties.",
              benefits: [
                "Fights acne-causing bacteria",
                "Helps reduce body odor",
                "Natural deodorizer",
                "Soothes skin irritations"
              ],
              natural: true
            },
            {
              name: "Glycerin",
              description: "A humectant that attracts moisture to the skin and helps maintain hydration.",
              benefits: [
                "Draws moisture to the skin",
                "Creates a protective barrier",
                "Helps skin feel soft and smooth",
                "Suitable for sensitive skin"
              ],
              natural: true
            },
            {
              name: "Vitamin E",
              description: "An antioxidant vitamin that helps protect skin from damage and supports healing.",
              benefits: [
                "Protects against environmental damage",
                "Supports skin repair",
                "Helps maintain skin's natural moisture",
                "Reduces appearance of scars"
              ],
              natural: true
            }
          ]}
        />
      </div>

      {/* Product Comparison */}
      <div className="mb-12">
        <ProductComparison
          currentProduct={{
            id: product.id,
            name: product.name,
            image: product.productImages[0]?.url || "/images/placeholder.png",
            price: product.price,
            salePrice: product.salePrice,
            pointValue: product.pointValue,
            features: {
              whitening: true,
              antibacterial: true,
              deodorizing: true,
              feminineWash: true,
              naturalIngredients: true,
              gentleFormula: true,
              exfoliating: false,
              acneTreatment: true
            }
          }}
          similarProducts={[
            {
              id: "regular-soap",
              name: "Regular Soap",
              image: "/images/products/placeholder.png",
              price: 50,
              salePrice: null,
              pointValue: 0,
              features: {
                whitening: false,
                antibacterial: false,
                deodorizing: true,
                feminineWash: false,
                naturalIngredients: false,
                gentleFormula: false,
                exfoliating: false,
                acneTreatment: false
              }
            },
            {
              id: "antibacterial-soap",
              name: "Antibacterial Soap",
              image: "/images/products/placeholder.png",
              price: 80,
              salePrice: null,
              pointValue: 0,
              features: {
                whitening: false,
                antibacterial: true,
                deodorizing: true,
                feminineWash: false,
                naturalIngredients: false,
                gentleFormula: false,
                exfoliating: false,
                acneTreatment: true
              }
            },
            {
              id: "whitening-soap",
              name: "Whitening Soap",
              image: "/images/products/placeholder.png",
              price: 100,
              salePrice: 90,
              pointValue: 5,
              features: {
                whitening: true,
                antibacterial: false,
                deodorizing: false,
                feminineWash: false,
                naturalIngredients: false,
                gentleFormula: true,
                exfoliating: true,
                acneTreatment: false
              }
            }
          ]}
          featureLabels={{
            whitening: "Skin Whitening",
            antibacterial: "Anti-bacterial Protection",
            deodorizing: "Deodorizing Effect",
            feminineWash: "Suitable for Feminine Wash",
            naturalIngredients: "Natural Ingredients",
            gentleFormula: "Gentle Formula",
            exfoliating: "Exfoliating Properties",
            acneTreatment: "Helps with Acne"
          }}
        />
      </div>

      {/* Testimonials */}
      <div className="mb-12">
        <ProductTestimonials
          testimonials={[
            {
              id: 1,
              name: "Maria Santos",
              location: "Manila",
              image: "/images/testimonials/testimonial-1.jpg",
              rating: 5,
              text: "I've been using Biogen Shield Soap for 3 months now and the difference in my skin is amazing! It's noticeably lighter and more even-toned. The soap also keeps me feeling fresh all day, even in our hot and humid weather.",
              date: "June 15, 2023"
            },
            {
              id: 2,
              name: "John Reyes",
              location: "Cebu",
              image: "/images/testimonials/testimonial-2.jpg",
              rating: 4,
              text: "As someone who works outdoors, I needed something that could really clean well and help with body odor. This soap does exactly that! The anti-bacterial properties work great, and I love that it's made with natural ingredients.",
              date: "July 3, 2023"
            },
            {
              id: 3,
              name: "Sophia Cruz",
              location: "Davao",
              image: "/images/testimonials/testimonial-3.jpg",
              rating: 5,
              text: "I've tried many whitening soaps before but most of them dried out my sensitive skin. Biogen Shield is different - it whitens while keeping my skin moisturized and healthy. It's now a permanent part of my skincare routine!",
              date: "August 22, 2023"
            },
            {
              id: 4,
              name: "Miguel Tan",
              location: "Baguio",
              image: "/images/testimonials/testimonial-4.jpg",
              rating: 5,
              text: "My wife and I both use this soap and we love it! It's gentle enough for daily use but effective at keeping skin clean and healthy. The natural ingredients make a big difference compared to commercial soaps.",
              date: "September 10, 2023"
            },
            {
              id: 5,
              name: "Jasmine Lim",
              location: "Iloilo",
              image: "/images/testimonials/testimonial-5.jpg",
              rating: 4,
              text: "I started using Biogen Shield specifically for its feminine wash properties, and I'm very impressed. It's gentle yet effective, and I feel clean and fresh throughout the day. The natural ingredients give me peace of mind.",
              date: "October 5, 2023"
            }
          ]}
        />
      </div>

      {/* FAQs */}
      <div className="mb-12">
        <ProductFAQ
          faqs={[
            {
              question: "Is Biogen Shield Soap suitable for all skin types?",
              answer: "Yes, Biogen Shield Herbal Care Soap is formulated to be gentle and effective for all skin types, including sensitive skin. The natural ingredients help maintain your skin's natural balance while providing multiple benefits."
            },
            {
              question: "How often should I use Biogen Shield Soap?",
              answer: "For best results, we recommend using Biogen Shield Herbal Care Soap daily as part of your regular bathing routine. For skin whitening benefits, use twice daily and leave the lather on your skin for 1-2 minutes before rinsing."
            },
            {
              question: "Can I use Biogen Shield Soap for feminine hygiene?",
              answer: "Yes, Biogen Shield Herbal Care Soap is gentle enough for feminine hygiene. However, we recommend consulting with a healthcare professional for specific feminine hygiene concerns or if you have any sensitivities."
            },
            {
              question: "How long does it take to see whitening results?",
              answer: "Results vary depending on individual skin type and condition. Most users notice a more even skin tone and gradual lightening within 2-4 weeks of consistent use. For best results, use twice daily and avoid excessive sun exposure."
            },
            {
              question: "Does Biogen Shield Soap contain any harsh chemicals?",
              answer: "No, Biogen Shield Herbal Care Soap is formulated with natural herbal ingredients and is free from harsh chemicals like parabens, sulfates, and artificial fragrances that can irritate the skin."
            },
            {
              question: "What gives Biogen Shield Soap its antibacterial properties?",
              answer: "The antibacterial properties come from natural ingredients like tea tree oil and other herbal extracts that have been shown to have antimicrobial effects without the harsh chemicals found in conventional antibacterial soaps."
            },
            {
              question: "Is Biogen Shield Soap environmentally friendly?",
              answer: "Yes, our soap is made with biodegradable ingredients and environmentally friendly manufacturing processes. The packaging is also designed to minimize environmental impact."
            }
          ]}
        />
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
