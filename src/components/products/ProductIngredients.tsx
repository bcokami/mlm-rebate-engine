import React, { useState } from 'react';
import { FaLeaf, FaInfoCircle } from 'react-icons/fa';

interface Ingredient {
  name: string;
  description: string;
  benefits: string[];
  natural: boolean;
}

interface ProductIngredientsProps {
  ingredients: Ingredient[];
  title?: string;
}

const ProductIngredients: React.FC<ProductIngredientsProps> = ({
  ingredients,
  title = "Ingredients"
}) => {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Key Ingredients</h3>
          <ul className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <li key={index}>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                    selectedIngredient?.name === ingredient.name
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => setSelectedIngredient(ingredient)}
                >
                  {ingredient.natural && (
                    <FaLeaf className="text-green-500 mr-2" />
                  )}
                  <span>{ingredient.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
          {selectedIngredient ? (
            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-2 flex items-center">
                {selectedIngredient.natural && (
                  <FaLeaf className="text-green-500 mr-2" />
                )}
                {selectedIngredient.name}
              </h3>
              
              <p className="text-gray-700 mb-4">{selectedIngredient.description}</p>
              
              <h4 className="font-medium text-gray-700 mb-2">Benefits:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {selectedIngredient.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">{benefit}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <FaInfoCircle className="text-gray-400 text-4xl mb-3" />
              <p className="text-gray-500">Select an ingredient to see detailed information</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700 flex items-start">
          <FaInfoCircle className="text-blue-500 mr-2 mt-1" />
          <span>
            Biogen Shield Herbal Care Soap is made with carefully selected natural ingredients 
            that work together to provide multiple benefits for your skin. Our formula is free 
            from harsh chemicals and is suitable for all skin types.
          </span>
        </p>
      </div>
    </div>
  );
};

export default ProductIngredients;
