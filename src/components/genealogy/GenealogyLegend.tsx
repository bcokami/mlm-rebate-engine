"use client";

import { FaStar, FaUser, FaChevronDown, FaChevronRight, FaInfoCircle } from 'react-icons/fa';

// Rank configuration with colors and benefits
const rankConfig = {
  'Starter': {
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    icon: <FaStar className="text-gray-400" />,
    benefits: ['Basic commission rates', 'Access to product catalog', 'Personal dashboard']
  },
  'Bronze': {
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-300',
    icon: <FaStar className="text-yellow-600" />,
    benefits: ['5% commission on direct referrals', 'Access to training materials', 'Monthly team reports']
  },
  'Silver': {
    color: 'bg-gray-200 text-gray-800',
    borderColor: 'border-gray-400',
    icon: <><FaStar className="text-gray-500" /><FaStar className="text-gray-500 ml-0.5" /></>,
    benefits: ['7% commission on direct referrals', '3% on level 2', 'Quarterly bonus eligibility']
  },
  'Gold': {
    color: 'bg-yellow-200 text-yellow-800',
    borderColor: 'border-yellow-400',
    icon: <><FaStar className="text-yellow-600" /><FaStar className="text-yellow-600 ml-0.5" /><FaStar className="text-yellow-600 ml-0.5" /></>,
    benefits: ['10% commission on direct referrals', '5% on level 2', '3% on level 3', 'Leadership training access']
  },
  'Platinum': {
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    icon: <><FaStar className="text-blue-500" /><FaStar className="text-blue-500 ml-0.5" /><FaStar className="text-blue-500 ml-0.5" /><FaStar className="text-blue-500 ml-0.5" /></>,
    benefits: ['12% commission on direct referrals', '7% on level 2', '5% on level 3', '3% on levels 4-5', 'Annual retreat invitation']
  },
  'Diamond': {
    color: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-300',
    icon: <><FaStar className="text-purple-500" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /></>,
    benefits: ['15% commission on direct referrals', '10% on level 2', '7% on level 3', '5% on levels 4-5', '3% on levels 6-10', 'Car bonus program', 'Executive leadership council']
  }
};

/**
 * Genealogy Legend Component
 * 
 * Displays a legend explaining the colors, icons, and controls in the genealogy tree
 */
export default function GenealogyLegend() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Rank Colors & Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(rankConfig).map(([rank, config]) => (
            <div key={rank} className={`rounded-md p-3 ${config.color} ${config.borderColor}`}>
              <div className="flex items-center mb-2">
                <span className="flex items-center text-sm font-medium">
                  {config.icon}
                  <span className="ml-1">{rank}</span>
                </span>
              </div>
              <ul className="text-xs space-y-1">
                {config.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-3 w-3 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Controls & Icons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <h4 className="font-medium mb-2">Node Controls</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <FaChevronRight className="text-gray-500" />
                </div>
                <span className="ml-2">Expand node to show children</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <FaChevronDown className="text-gray-500" />
                </div>
                <span className="ml-2">Collapse node to hide children</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <FaInfoCircle className="text-blue-500" />
                </div>
                <span className="ml-2">View detailed information about the user</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <h4 className="font-medium mb-2">Node Types</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaUser className="text-blue-500" />
                </div>
                <span className="ml-2">Root user (you or selected user)</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium">A</span>
                </div>
                <span className="ml-2">Downline member (shows first letter of name)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-3 rounded-md border border-gray-200">
        <h4 className="font-medium mb-2">Navigation Tips</h4>
        <ul className="space-y-1 text-sm">
          <li>• Use mouse wheel to zoom in and out</li>
          <li>• Click and drag to pan around the tree</li>
          <li>• Use the minimap in the bottom right for quick navigation</li>
          <li>• Click on a node to select it and view details</li>
          <li>• Use the search function to find specific members</li>
          <li>• Apply filters to focus on specific segments of your network</li>
        </ul>
      </div>
    </div>
  );
}
