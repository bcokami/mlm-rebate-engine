"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLeaf,
  FaUsers,
  FaHandHoldingHeart,
  FaStar,
  FaQuoteLeft,
  FaQuoteRight,
} from "react-icons/fa";

export default function AboutPage() {
  const testimonials = [
    {
      id: 1,
      name: "Maria Santos",
      location: "Quezon City",
      image: "/testimonials/testimonial1.jpg",
      text: "Extreme Life Herbal Products changed my life! After using their Moringa supplements for 3 months, my energy levels improved dramatically and my blood pressure is now under control.",
      rating: 5,
    },
    {
      id: 2,
      name: "Juan Dela Cruz",
      location: "Cebu City",
      image: "/testimonials/testimonial2.jpg",
      text: "I've been a distributor for Extreme Life for 2 years now. Not only have their products helped my family's health, but the business opportunity has provided additional income for my children's education.",
      rating: 5,
    },
    {
      id: 3,
      name: "Angelica Reyes",
      location: "Davao City",
      image: "/testimonials/testimonial3.jpg",
      text: "Their Sambong-Banaba tea is amazing! It helped me manage my blood sugar levels naturally. The customer service is also excellent - they always respond quickly to my questions.",
      rating: 4,
    },
  ];

  const products = [
    {
      id: 1,
      name: "Premium Moringa Capsules",
      image: "/products/moringa.jpg",
      description: "High-potency Moringa Oleifera capsules packed with essential nutrients and antioxidants.",
      price: "₱1,200.00",
    },
    {
      id: 2,
      name: "Sambong-Banaba Tea",
      image: "/products/tea.jpg",
      description: "Traditional herbal tea blend that helps support healthy blood sugar levels and kidney function.",
      price: "₱850.00",
    },
    {
      id: 3,
      name: "Mangosteen Extract",
      image: "/products/mangosteen.jpg",
      description: "Pure mangosteen extract known for its powerful anti-inflammatory and antioxidant properties.",
      price: "₱1,500.00",
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
          <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <div className="flex justify-center mb-6">
                  <Image
                    src="/logo.png"
                    alt="Extreme Life Herbal Products Logo"
                    width={150}
                    height={150}
                    className="rounded-full border-4 border-white shadow-lg"
                  />
                </div>
                <h1 className="text-4xl font-bold mb-2">Extreme Life Herbal Products</h1>
                <p className="text-xl">Nature's Healing Power in Every Product</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                  <FaMapMarkerAlt className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Address</h3>
                  <p className="mt-1 text-gray-500">
                    123 Herbal Street, Barangay Health<br />
                    Quezon City, Metro Manila<br />
                    Philippines 1100
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                  <FaPhone className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Contact</h3>
                  <p className="mt-1 text-gray-500">
                    Phone: +63 (2) 8123 4567<br />
                    Mobile: +63 917 123 4567<br />
                    Fax: +63 (2) 8765 4321
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                  <FaEnvelope className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Online</h3>
                  <p className="mt-1 text-gray-500">
                    Email: info@extremelifeherbal.ph<br />
                    Website: www.extremelifeherbal.ph
                  </p>
                  <div className="mt-2 flex space-x-4">
                    <a href="https://facebook.com/extremelifeherbalproducts" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <FaFacebook className="h-5 w-5" />
                    </a>
                    <a href="https://instagram.com/extremelifeherbal" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
                      <FaInstagram className="h-5 w-5" />
                    </a>
                    <a href="https://twitter.com/extremelifeherb" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                      <FaTwitter className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About Us</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 md:w-1/2">
                <Image
                  src="/about-image.jpg"
                  alt="About Extreme Life Herbal Products"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-8 md:w-1/2">
                <div className="uppercase tracking-wide text-sm text-green-600 font-semibold">Our Story</div>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Founded in 2010, Extreme Life Herbal Products began with a simple mission: to harness the healing power of Philippine herbs and make them accessible to everyone. Our founder, Dr. Maria Gonzales, a respected herbalist and naturopathic doctor, recognized the incredible potential of local medicinal plants that had been used for generations.
                </p>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Starting with just three products made in a small facility in Quezon City, we have grown to offer over 20 different herbal supplements and remedies, all made with locally-sourced, organic ingredients. Our commitment to quality, efficacy, and sustainability has made us one of the leading herbal product companies in the Philippines.
                </p>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Today, Extreme Life Herbal Products continues to innovate while honoring traditional knowledge. We work directly with local farmers to ensure sustainable harvesting practices and fair compensation. Our state-of-the-art manufacturing facility meets international standards for quality and safety.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-4">
                  <FaLeaf className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Natural Healing</h3>
              <p className="text-gray-600">
                We believe in the power of nature to heal and restore. All our products are made from 100% natural ingredients, with no artificial additives or preservatives.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-4">
                  <FaUsers className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Empowerment</h3>
              <p className="text-gray-600">
                We empower local communities through fair trade practices, sustainable farming, and creating economic opportunities through our MLM business model.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-4">
                  <FaHandHoldingHeart className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality & Integrity</h3>
              <p className="text-gray-600">
                We maintain the highest standards of quality in all our products. Every batch is tested for purity and potency, ensuring you receive only the best.
              </p>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-bold">{product.price}</span>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">{testimonial.name}</h3>
                    <p className="text-gray-500">{testimonial.location}</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <FaQuoteLeft className="absolute top-0 left-0 text-green-100 h-8 w-8" />
                  <p className="text-gray-600 pl-8 pr-8 py-2">{testimonial.text}</p>
                  <FaQuoteRight className="absolute bottom-0 right-0 text-green-100 h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Growing Family</h2>
          <p className="text-white text-lg mb-6 max-w-3xl mx-auto">
            Become a distributor today and start your journey towards health, wellness, and financial freedom with Extreme Life Herbal Products.
          </p>
          <button className="px-8 py-3 bg-white text-green-700 font-bold rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700">
            Learn About Our Business Opportunity
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
