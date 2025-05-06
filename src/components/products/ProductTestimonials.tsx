import React, { useState } from 'react';
import Image from 'next/image';
import { FaQuoteLeft, FaQuoteRight, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';

interface Testimonial {
  id: string | number;
  name: string;
  location: string;
  image?: string;
  rating: number;
  text: string;
  date: string;
}

interface ProductTestimonialsProps {
  testimonials: Testimonial[];
  title?: string;
}

const ProductTestimonials: React.FC<ProductTestimonialsProps> = ({
  testimonials,
  title = "Customer Testimonials"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  // Render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i <= rating ? "text-yellow-400" : "text-gray-300"} 
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      
      <div className="relative">
        {/* Testimonial Carousel */}
        <div className="overflow-hidden">
          <div className="transition-all duration-300 ease-in-out">
            <div className="bg-blue-50 rounded-lg p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* User Image */}
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                    {testimonials[currentIndex].image ? (
                      <Image
                        src={testimonials[currentIndex].image}
                        alt={testimonials[currentIndex].name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-200 flex items-center justify-center">
                        <span className="text-blue-600 text-2xl font-bold">
                          {testimonials[currentIndex].name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Testimonial Content */}
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {renderStars(testimonials[currentIndex].rating)}
                  </div>
                  
                  <div className="relative">
                    <FaQuoteLeft className="absolute -top-2 -left-2 text-blue-200 text-xl" />
                    <p className="text-gray-700 italic mb-4 px-4">
                      {testimonials[currentIndex].text}
                    </p>
                    <FaQuoteRight className="absolute -bottom-2 -right-2 text-blue-200 text-xl" />
                  </div>
                  
                  <div className="mt-4">
                    <p className="font-medium text-gray-800">{testimonials[currentIndex].name}</p>
                    <p className="text-sm text-gray-500">
                      {testimonials[currentIndex].location} • {testimonials[currentIndex].date}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none"
          aria-label="Previous testimonial"
        >
          <FaChevronLeft className="text-gray-600" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none"
          aria-label="Next testimonial"
        >
          <FaChevronRight className="text-gray-600" />
        </button>
      </div>
      
      {/* Testimonial Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToTestimonial(index)}
            className={`w-3 h-3 rounded-full ${
              index === currentIndex ? "bg-blue-600" : "bg-gray-300"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
      
      {/* View All Testimonials Button */}
      <div className="mt-6 text-center">
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          View All Testimonials
        </button>
      </div>
    </div>
  );
};

export default ProductTestimonials;
