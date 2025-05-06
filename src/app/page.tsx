"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaUsers,
  FaShoppingCart,
  FaWallet,
  FaChartLine,
  FaLeaf,
  FaHandHoldingHeart,
  FaStar,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaArrowRight,
  FaCheck,
  FaQuoteLeft,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaMinus
} from "react-icons/fa";
import ProductCarousel from "@/components/products/ProductCarousel";

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const testimonials = [
    {
      id: 1,
      name: "Maria Santos",
      location: "Quezon City",
      image: "/testimonials/testimonial1.jpg",
      rating: 5,
      text: "Extreme Life Herbal Products changed my life! After using their Moringa supplements for 3 months, my energy levels improved dramatically and my blood pressure is now under control."
    },
    {
      id: 2,
      name: "Juan Dela Cruz",
      location: "Cebu City",
      image: "/testimonials/testimonial2.jpg",
      rating: 5,
      text: "I've been a distributor for Extreme Life for 2 years now. Not only have their products helped my family's health, but the business opportunity has provided additional income for my children's education."
    },
    {
      id: 3,
      name: "Angelica Reyes",
      location: "Davao City",
      image: "/testimonials/testimonial3.jpg",
      rating: 4,
      text: "Their Sambong-Banaba tea is amazing! It helped me manage my blood sugar levels naturally. The customer service is also excellent - they always respond quickly to my questions."
    },
    {
      id: 4,
      name: "Roberto Tan",
      location: "Baguio City",
      image: "/testimonials/testimonial4.jpg",
      rating: 5,
      text: "The Shield Soap has been a game-changer for my skin problems. It's gentle yet effective, and I love that it's made with natural ingredients. My whole family uses it now!"
    },
    {
      id: 5,
      name: "Elena Gomez",
      location: "Iloilo City",
      image: "/testimonials/testimonial5.jpg",
      rating: 5,
      text: "The Veggie Coffee is my morning ritual now. I feel more energized throughout the day without the caffeine crash. Plus, knowing it has 124 natural ingredients makes me feel good about what I'm putting in my body."
    }
  ];

  const faqs = [
    {
      question: "How does the MLM compensation plan work?",
      answer: "Our compensation plan is based on a binary structure with a maximum of 6 levels. You earn rebates based on the Point Value (PV) of products purchased by your downline. This includes direct referral bonuses, level-based commissions (L1: 1%, L2: 0.75%, L3-6: 0.5%), and group volume bonuses."
    },
    {
      question: "What products does Extreme Life Herbal offer?",
      answer: "We offer a range of natural herbal products including Biogen Extreme Concentrate, Veggie Coffee 124 in 1, Shield Herbal Care Soap, and various health supplements. All our products are made with premium natural ingredients and are designed to promote health and wellness."
    },
    {
      question: "How do I become a distributor?",
      answer: "To become a distributor, simply register on our platform. You'll need to provide your personal information and optionally an upline ID if you were referred by an existing distributor. Once registered, you can start building your network and earning rebates."
    },
    {
      question: "Is there a minimum purchase requirement?",
      answer: "There is no minimum purchase requirement to maintain your distributor status. However, to qualify for certain bonuses and rank advancements, you may need to meet specific personal and group volume requirements."
    },
    {
      question: "How and when are rebates paid out?",
      answer: "Rebates are calculated monthly and paid out by the 15th of the following month. You can view your earnings in your dashboard and request withdrawals once you reach the minimum threshold of ₱500."
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Modern Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="relative w-10 h-10 mr-2">
                  <Image
                    src="/images/20250503.svg"
                    alt="Extreme Life Herbal Products Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h1 className="text-xl font-semibold text-green-700">Extreme Life Herbal</h1>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/products" className="text-gray-600 hover:text-green-600">Products</Link>
              <Link href="/about" className="text-gray-600 hover:text-green-600">About Us</Link>
              <Link href="/business" className="text-gray-600 hover:text-green-600">Business Opportunity</Link>
              <Link href="/contact" className="text-gray-600 hover:text-green-600">Contact</Link>
              <Link href="/login" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50">
                Register
              </Link>
            </div>
            <div className="md:hidden flex items-center">
              {/* Mobile menu button would go here */}
              <Link href="/login" className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 mr-2">
                Sign In
              </Link>
              <Link href="/register" className="px-3 py-1 border border-green-600 text-green-600 text-sm rounded-md hover:bg-green-50">
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div
              className="lg:w-1/2 opacity-0 translate-x-[-50px] transition-all duration-1000"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(-50px)' }}
            >
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                <span className="text-green-600">Nature's Healing Power</span> in Every Product
              </h1>
              <p className="mt-5 text-xl text-gray-600">
                Discover the power of Philippine herbal medicine with our premium organic products. Join our community and earn while promoting health and wellness.
              </p>
              <div
                className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 opacity-0 translate-y-[20px] transition-all duration-1000 delay-300"
                style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
              >
                <Link href="/register" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:text-lg transition-all duration-300 hover:shadow-lg">
                  Become a Distributor
                  <FaArrowRight className="ml-2" />
                </Link>
                <Link href="/about" className="inline-flex items-center justify-center px-8 py-3 border border-green-600 text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50 md:text-lg transition-all duration-300">
                  Learn More
                </Link>
              </div>
            </div>
            <div
              className="mt-12 lg:mt-0 lg:w-1/2 relative opacity-0 translate-x-[50px] transition-all duration-1000"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(50px)' }}
            >
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-green-400 rounded-full opacity-20 animate-pulse" style={{ animationDelay: "1s" }}></div>
              <div className="relative z-10 rounded-lg shadow-2xl overflow-hidden">
                <Image
                  src="/about-image.jpg"
                  alt="Extreme Life Herbal Products"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-12 opacity-0 translate-y-[20px] transition-all duration-1000"
            style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Featured Products
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Premium herbal products for your health and wellness
            </p>
          </div>

          <ProductCarousel />
        </div>
      </div>

      {/* How It Works Section with Animation */}
      <div className="bg-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center opacity-0 translate-y-[20px] transition-all duration-1000"
            style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900">
              How Our Business Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Join our community and earn while promoting health and wellness
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <FaUsers className="h-6 w-6 text-white" />,
                  title: "Build Your Team",
                  description: "Invite friends and family to join your downline and earn from their purchases up to 6 levels deep."
                },
                {
                  icon: <FaShoppingCart className="h-6 w-6 text-white" />,
                  title: "Premium Products",
                  description: "Offer high-quality herbal products that deliver real health benefits to your customers."
                },
                {
                  icon: <FaChartLine className="h-6 w-6 text-white" />,
                  title: "Earn Rebates",
                  description: "Earn percentage-based rebates from your downline's purchases at every level."
                },
                {
                  icon: <FaWallet className="h-6 w-6 text-white" />,
                  title: "Rank Advancement",
                  description: "Advance through our rank system to unlock higher rebate percentages and exclusive bonuses."
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="pt-6 opacity-0 translate-y-[20px] transition-all duration-1000"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                          {item.icon}
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{item.title}</h3>
                      <p className="mt-5 text-base text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-12 opacity-0 translate-y-[20px] transition-all duration-1000"
            style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why Choose Extreme Life Herbal?
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              We offer premium quality products and a rewarding business opportunity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              className="bg-green-50 rounded-lg p-8 shadow-lg opacity-0 translate-x-[-20px] transition-all duration-1000"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(-20px)' }}
            >
              <h3 className="text-2xl font-bold text-green-700 mb-6">Product Benefits</h3>
              <ul className="space-y-4">
                {[
                  "100% Natural Ingredients",
                  "Scientifically Tested Formulations",
                  "No Harmful Chemicals",
                  "Sustainably Sourced",
                  "Manufactured in the Philippines",
                  "Affordable Premium Quality"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                      <FaCheck className="h-3 w-3 text-white" />
                    </span>
                    <span className="ml-3 text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="bg-green-50 rounded-lg p-8 shadow-lg opacity-0 translate-x-[20px] transition-all duration-1000"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(20px)' }}
            >
              <h3 className="text-2xl font-bold text-green-700 mb-6">Business Benefits</h3>
              <ul className="space-y-4">
                {[
                  "Low Start-up Cost",
                  "Generous Compensation Plan",
                  "Multiple Income Streams",
                  "Comprehensive Training",
                  "Supportive Community",
                  "Digital Marketing Tools"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                      <FaCheck className="h-3 w-3 text-white" />
                    </span>
                    <span className="ml-3 text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-12 opacity-0 translate-y-[20px] transition-all duration-1000"
            style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900">
              What Our Customers Say
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Real stories from people who have experienced the benefits of our products
            </p>
          </div>

          <div className="relative">
            <div
              className="bg-white rounded-xl shadow-xl overflow-hidden opacity-0 scale-95 transition-all duration-1000"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.95)' }}
            >
              <div className="md:flex">
                <div className="md:flex-shrink-0 relative">
                  <div className="h-56 w-full md:w-56 md:h-full bg-green-100 flex items-center justify-center">
                    {testimonials[currentTestimonial].image ? (
                      <Image
                        src={testimonials[currentTestimonial].image}
                        alt={testimonials[currentTestimonial].name}
                        width={224}
                        height={224}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
                        {testimonials[currentTestimonial].name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-8 md:p-12 relative">
                  <FaQuoteLeft className="absolute top-6 left-6 text-green-100 text-4xl" />
                  <div className="relative z-10">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonials[currentTestimonial].rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xl text-gray-600 italic mb-6">
                      "{testimonials[currentTestimonial].text}"
                    </p>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {testimonials[currentTestimonial].name}
                      </h3>
                      <p className="text-gray-500">
                        {testimonials[currentTestimonial].location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 transform -translate-y-1/2 left-0 -ml-4 md:-ml-6">
              <button
                onClick={prevTestimonial}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 focus:outline-none"
              >
                <FaChevronLeft className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="absolute top-1/2 transform -translate-y-1/2 right-0 -mr-4 md:-mr-6">
              <button
                onClick={nextTestimonial}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 focus:outline-none"
              >
                <FaChevronRight className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentTestimonial
                      ? "bg-green-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-12 opacity-0 translate-y-[20px] transition-all duration-1000"
            style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Find answers to common questions about our products and business opportunity
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden opacity-0 translate-y-[20px] transition-all duration-1000"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <button
                    className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center focus:outline-none"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFaq === index ? (
                      <FaMinus className="h-4 w-4 text-gray-500" />
                    ) : (
                      <FaPlus className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 py-4 bg-gray-50">
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="opacity-0 scale-95 transition-all duration-1000"
            style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.95)' }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">Join Our Growing Family</h2>
            <p className="text-white text-lg mb-8 max-w-3xl mx-auto">
              Become a distributor today and start your journey towards health, wellness, and financial freedom with Extreme Life Herbal Products.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/register" className="px-8 py-3 bg-white text-green-700 font-bold rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700 transition-all duration-300 hover:shadow-lg">
                Become a Distributor
              </Link>
              <Link href="/about" className="px-8 py-3 bg-transparent text-white border-2 border-white font-bold rounded-md hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700 transition-all duration-300">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="relative w-10 h-10 mr-2">
                  <Image
                    src="/images/20250503.svg"
                    alt="Extreme Life Herbal Products Logo"
                    fill
                    className="object-contain invert"
                  />
                </div>
                <h3 className="text-lg font-semibold">Extreme Life Herbal</h3>
              </div>
              <p className="text-gray-400">
                Nature's Healing Power in Every Product
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="https://facebook.com/extremelifeherbalproducts" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <FaFacebook className="h-6 w-6" />
                </a>
                <a href="https://instagram.com/extremelifeherbal" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <FaInstagram className="h-6 w-6" />
                </a>
                <a href="https://twitter.com/extremelifeherb" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <FaTwitter className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors duration-300">Login</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white transition-colors duration-300">Register</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300">About Us</Link></li>
                <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors duration-300">Products</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Business</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors duration-300">Distributor Dashboard</Link></li>
                <li><Link href="/genealogy" className="text-gray-400 hover:text-white transition-colors duration-300">Genealogy</Link></li>
                <li><Link href="/rebates" className="text-gray-400 hover:text-white transition-colors duration-300">Rebates</Link></li>
                <li><Link href="/rank-advancement" className="text-gray-400 hover:text-white transition-colors duration-300">Rank Advancement</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-gray-400">
                123 Herbal Street, Barangay Health<br />
                Quezon City, Metro Manila<br />
                Philippines 1100<br /><br />
                Phone: +63 (2) 8123 4567<br />
                Email: info@extremelifeherbal.ph
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Extreme Life Herbal Products. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
