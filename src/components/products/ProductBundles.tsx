import React from 'react';
import Image from 'next/image';
import { FaShoppingCart, FaCheck, FaTag } from 'react-icons/fa';

interface BundleProduct {
  id: string | number;
  name: string;
  image: string;
  price: number;
  salePrice: number | null;
  quantity: number;
}

interface Bundle {
  id: string | number;
  name: string;
  description: string;
  products: BundleProduct[];
  price: number;
  salePrice: number | null;
  pointValue: number;
  savings: number;
  popular?: boolean;
}

interface ProductBundlesProps {
  bundles: Bundle[];
  onAddToCart: (bundleId: string | number) => void;
  title?: string;
}

const ProductBundles: React.FC<ProductBundlesProps> = ({
  bundles,
  onAddToCart,
  title = "Product Bundles"
}) => {
  // Calculate total original price of products in a bundle
  const calculateTotalPrice = (products: BundleProduct[]) => {
    return products.reduce((total, product) => {
      const productPrice = product.salePrice || product.price;
      return total + (productPrice * product.quantity);
    }, 0);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">Save more when you buy our specially curated product bundles</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle) => {
          const totalOriginalPrice = calculateTotalPrice(bundle.products);
          const bundlePrice = bundle.salePrice || bundle.price;
          const savingsPercentage = Math.round(((totalOriginalPrice - bundlePrice) / totalOriginalPrice) * 100);
          
          return (
            <div 
              key={bundle.id}
              className={`border rounded-lg overflow-hidden ${
                bundle.popular 
                  ? 'border-blue-500 relative' 
                  : 'border-gray-200'
              }`}
            >
              {bundle.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{bundle.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{bundle.description}</p>
                
                <div className="space-y-4 mb-4">
                  {bundle.products.map((product, index) => (
                    <div key={index} className="flex items-center">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-700">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.quantity > 1 ? `${product.quantity}x ` : ''}
                          ₱{((product.salePrice || product.price) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Total Value:</span>
                    <span className="text-sm text-gray-500 line-through">
                      ₱{(totalOriginalPrice / 100).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Bundle Price:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₱{(bundlePrice / 100).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Point Value:</span>
                    <span className="text-sm font-medium text-green-600">
                      {bundle.pointValue} PV
                    </span>
                  </div>
                  
                  <div className="flex items-center text-green-600 mb-2">
                    <FaTag className="mr-1" />
                    <span className="text-sm font-medium">
                      Save {savingsPercentage}% (₱{((totalOriginalPrice - bundlePrice) / 100).toFixed(2)})
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => onAddToCart(bundle.id)}
                  className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
                    bundle.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <FaShoppingCart className="mr-2" />
                  Add Bundle to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <FaCheck className="text-blue-600 mr-2" />
          Bundle Benefits
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li className="flex items-start">
            <FaCheck className="text-blue-500 mt-1 mr-2" />
            <span>Save money with special bundle pricing</span>
          </li>
          <li className="flex items-start">
            <FaCheck className="text-blue-500 mt-1 mr-2" />
            <span>Earn more PV points with bundled products</span>
          </li>
          <li className="flex items-start">
            <FaCheck className="text-blue-500 mt-1 mr-2" />
            <span>Try complementary products that work well together</span>
          </li>
          <li className="flex items-start">
            <FaCheck className="text-blue-500 mt-1 mr-2" />
            <span>Perfect for gifts or starting your product collection</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProductBundles;
