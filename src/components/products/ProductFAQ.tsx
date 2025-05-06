import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface FAQ {
  question: string;
  answer: string;
}

interface ProductFAQProps {
  faqs: FAQ[];
  title?: string;
}

const ProductFAQ: React.FC<ProductFAQProps> = ({ 
  faqs, 
  title = "Frequently Asked Questions" 
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none"
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-medium text-gray-800">{faq.question}</span>
              {openIndex === index ? (
                <FaChevronUp className="text-gray-500" />
              ) : (
                <FaChevronDown className="text-gray-500" />
              )}
            </button>
            
            {openIndex === index && (
              <div className="p-4 bg-white">
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductFAQ;
