import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

interface Product {
  id: string | number;
  name: string;
  image: string;
  price: number;
  salePrice: number | null;
  pointValue: number;
  features: Record<string, boolean>;
}

interface ProductComparisonProps {
  currentProduct: Product;
  similarProducts: Product[];
  featureLabels: Record<string, string>;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({
  currentProduct,
  similarProducts,
  featureLabels,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([currentProduct]);
  const maxComparisons = 3;

  // Handle adding a product to comparison
  const handleAddProduct = (product: Product) => {
    if (selectedProducts.length < maxComparisons && !selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  // Handle removing a product from comparison
  const handleRemoveProduct = (productId: string | number) => {
    // Don't allow removing the current product
    if (productId === currentProduct.id) return;
    
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Get all features from all products for comparison
  const allFeatures = Object.keys(featureLabels);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Comparison</h2>
      
      {/* Product Selection */}
      {selectedProducts.length < maxComparisons && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Add products to compare</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts
              .filter(product => !selectedProducts.some(p => p.id === product.id))
              .map(product => (
                <div 
                  key={product.id} 
                  className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-pointer"
                  onClick={() => handleAddProduct(product)}
                >
                  <div className="relative h-24 mb-2">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <p className="text-sm font-medium text-center truncate">{product.name}</p>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Feature</th>
              {selectedProducts.map(product => (
                <th key={product.id} className="px-6 py-3">
                  <div className="flex flex-col items-center">
                    <div className="relative h-16 w-16 mb-2">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                    <span className="font-medium text-center">{product.name}</span>
                    <div className="flex items-center mt-1">
                      {product.salePrice ? (
                        <>
                          <span className="font-bold text-blue-600">₱{(product.salePrice / 100).toFixed(2)}</span>
                          <span className="text-xs text-gray-500 line-through ml-1">₱{(product.price / 100).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-blue-600">₱{(product.price / 100).toFixed(2)}</span>
                      )}
                    </div>
                    <span className="text-xs text-green-600 mt-1">{product.pointValue} PV</span>
                    {product.id !== currentProduct.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProduct(product.id);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map(feature => (
              <tr key={feature} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">
                  <div className="flex items-center">
                    <span>{featureLabels[feature]}</span>
                    <FaInfoCircle className="ml-1 text-gray-400 cursor-help" title={`Information about ${featureLabels[feature]}`} />
                  </div>
                </td>
                {selectedProducts.map(product => (
                  <td key={`${product.id}-${feature}`} className="px-6 py-4 text-center">
                    {product.features[feature] ? (
                      <FaCheck className="mx-auto text-green-500" />
                    ) : (
                      <FaTimes className="mx-auto text-red-500" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* View Product Links */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {selectedProducts.map(product => (
          <Link 
            key={product.id}
            href={product.id === currentProduct.id ? '#' : `/products/${product.id}`}
            className={`text-center py-2 px-4 rounded-md ${
              product.id === currentProduct.id 
                ? 'bg-gray-100 text-gray-500 cursor-default' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={(e) => product.id === currentProduct.id && e.preventDefault()}
          >
            {product.id === currentProduct.id ? 'Current Product' : `View ${product.name}`}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProductComparison;
