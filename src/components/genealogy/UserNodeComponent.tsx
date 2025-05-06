"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FaUser, FaUsers, FaChevronDown, FaChevronRight, FaStar, FaInfoCircle } from 'react-icons/fa';
import { GenealogyUser } from '@/lib/optimizedGenealogyService';

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

interface UserNodeProps {
  data: {
    user: GenealogyUser;
    onExpand: () => void;
    onSelect: () => void;
    isExpanded: boolean;
    hasChildren: boolean;
    hasMoreChildren: boolean;
  };
  isConnectable: boolean;
}

/**
 * User Node Component for React Flow
 * 
 * Displays a user node in the genealogy tree with rank styling and expand/collapse functionality
 */
function UserNodeComponent({ data, isConnectable }: UserNodeProps) {
  const { user, onExpand, onSelect, isExpanded, hasChildren, hasMoreChildren } = data;
  const rankInfo = getRankConfig(user.rank.name);
  
  // Determine if this is the root node
  const isRoot = user.level === 0;
  
  // Format wallet balance
  const formattedBalance = user.walletBalance !== undefined 
    ? `₱${user.walletBalance.toFixed(2)}` 
    : '';
  
  return (
    <div className={`
      p-3 rounded-md shadow-md w-[180px]
      ${isRoot ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}
      ${rankInfo.borderColor}
    `}>
      {/* Source handle (top) */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400"
      />
      
      {/* Target handle (bottom) */}
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
            isRoot ? 'bg-blue-100' : 'bg-gray-100'
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
          <span className="ml-1">{user.rank.name}</span>
        </div>
        
        {/* User stats */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>ID:</span>
            <span className="font-medium">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Downline:</span>
            <span className="font-medium">{user._count.downline}</span>
          </div>
          {user.walletBalance !== undefined && (
            <div className="flex justify-between">
              <span>Balance:</span>
              <span className="font-medium">{formattedBalance}</span>
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
          {(hasChildren || hasMoreChildren) ? (
            <button
              onClick={onExpand}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded flex items-center hover:bg-gray-200"
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

export default memo(UserNodeComponent);
