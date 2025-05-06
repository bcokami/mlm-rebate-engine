"use client";

import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FaUser, FaChevronDown, FaChevronRight, FaInfoCircle, FaStar, FaWallet, FaShoppingCart, FaUsers } from 'react-icons/fa';

// Rank configuration with colors
const rankConfig = {
  'Starter': {
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    icon: <FaStar className="text-gray-400" />,
  },
  'Bronze': {
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-300',
    icon: <FaStar className="text-yellow-600" />,
  },
  'Silver': {
    color: 'bg-gray-200 text-gray-800',
    borderColor: 'border-gray-400',
    icon: <><FaStar className="text-gray-500" /><FaStar className="text-gray-500 ml-0.5" /></>,
  },
  'Gold': {
    color: 'bg-yellow-200 text-yellow-800',
    borderColor: 'border-yellow-400',
    icon: <><FaStar className="text-yellow-600" /><FaStar className="text-yellow-600 ml-0.5" /><FaStar className="text-yellow-600 ml-0.5" /></>,
  },
  'Platinum': {
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    icon: <><FaStar className="text-blue-500" /><FaStar className="text-blue-500 ml-0.5" /><FaStar className="text-blue-500 ml-0.5" /><FaStar className="text-blue-500 ml-0.5" /></>,
  },
  'Diamond': {
    color: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-300',
    icon: <><FaStar className="text-purple-500" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /></>,
  }
};

// Get rank configuration
const getRankConfig = (rankName: string) => {
  return rankConfig[rankName as keyof typeof rankConfig] || rankConfig['Starter'];
};

// Interface for user data
interface User {
  id: number;
  name: string;
  email: string;
  rankName: string;
  level: number;
  downlineCount: number;
  walletBalance?: number;
  performanceMetrics?: {
    personalSales: number;
    teamSales: number;
  } | null;
}

interface EnhancedUserNodeProps {
  data: {
    user: User;
    onExpand: () => void;
    onSelect: () => void;
    isExpanded: boolean;
    hasChildren: boolean;
  };
  isConnectable: boolean;
}

/**
 * Enhanced User Node Component for React Flow
 * 
 * A more visually appealing and informative node component
 */
function EnhancedUserNode({ data, isConnectable }: EnhancedUserNodeProps) {
  const { user, onExpand, onSelect, isExpanded, hasChildren } = data;
  const rankInfo = getRankConfig(user.rankName);
  
  // State for hover
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if this is the root node
  const isRoot = user.level === 0;
  
  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div 
      className={`
        p-3 rounded-md shadow-md w-[200px] transition-all duration-200
        ${isHovered ? 'shadow-lg transform scale-105' : ''}
        ${isRoot ? 'bg-blue-50 border-2 border-blue-300' : `bg-white border ${rankInfo.borderColor}`}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400"
      />
      
      {/* Target handle (top) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-gray-400"
        />
      )}
      
      <div className="flex flex-col">
        {/* User avatar and name */}
        <div className="flex items-center mb-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 ${
            isRoot ? 'bg-blue-100' : rankInfo.color
          }`}>
            {isRoot ? (
              <FaUser className="text-blue-500" />
            ) : (
              <span className="text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 truncate">
            <div className="font-medium text-sm truncate" title={user.name}>
              {user.name}
            </div>
            <div className="text-xs text-gray-500 truncate" title={user.email}>
              {user.email}
            </div>
          </div>
        </div>
        
        {/* Rank badge */}
        <div className={`text-xs px-2 py-1 rounded-full flex items-center justify-center mb-2 ${rankInfo.color}`}>
          {rankInfo.icon}
          <span className="ml-1">{user.rankName}</span>
        </div>
        
        {/* Performance metrics */}
        {user.performanceMetrics && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-green-50 p-1 rounded text-xs flex flex-col items-center">
              <div className="flex items-center text-green-600 mb-0.5">
                <FaShoppingCart className="mr-1" size={10} />
                <span>Personal</span>
              </div>
              <span className="font-medium">
                {formatCurrency(user.performanceMetrics.personalSales)}
              </span>
            </div>
            <div className="bg-blue-50 p-1 rounded text-xs flex flex-col items-center">
              <div className="flex items-center text-blue-600 mb-0.5">
                <FaUsers className="mr-1" size={10} />
                <span>Team</span>
              </div>
              <span className="font-medium">
                {formatCurrency(user.performanceMetrics.teamSales)}
              </span>
            </div>
          </div>
        )}
        
        {/* User stats */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>ID:</span>
            <span className="font-medium">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Downline:</span>
            <span className="font-medium">{user.downlineCount}</span>
          </div>
          {user.walletBalance !== undefined && (
            <div className="flex justify-between">
              <span className="flex items-center">
                <FaWallet className="mr-1" size={10} />
                Balance:
              </span>
              <span className="font-medium">{formatCurrency(user.walletBalance)}</span>
            </div>
          )}
          {user.level > 0 && (
            <div className="flex justify-between">
              <span>Level:</span>
              <span className="font-medium">{user.level}</span>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between mt-3 pt-2 border-t border-gray-200">
          {hasChildren ? (
            <button
              onClick={onExpand}
              className={`text-xs px-2 py-1 rounded flex items-center ${
                isExpanded 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isExpanded ? (
                <>
                  <FaChevronDown className="mr-1" /> Collapse
                </>
              ) : (
                <>
                  <FaChevronRight className="mr-1" /> Expand
                </>
              )}
            </button>
          ) : (
            <div className="text-xs px-2 py-1 text-gray-400">
              No children
            </div>
          )}
          
          <button
            onClick={onSelect}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center hover:bg-blue-200"
          >
            <FaInfoCircle className="mr-1" /> Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(EnhancedUserNode);
