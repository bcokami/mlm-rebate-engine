import React from 'react';
import { FaImage } from 'react-icons/fa';

interface ProductPlaceholderProps {
  className?: string;
}

const ProductPlaceholder: React.FC<ProductPlaceholderProps> = ({ className = '' }) => {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
      <div className="text-center">
        <FaImage className="mx-auto text-gray-400 text-4xl mb-2" />
        <p className="text-gray-500 text-sm">No image available</p>
      </div>
    </div>
  );
};

export default ProductPlaceholder;
