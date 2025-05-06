"use client";

import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  FaUser, 
  FaChevronDown, 
  FaChevronRight, 
  FaInfoCircle, 
  FaStar, 
  FaWallet, 
  FaShoppingCart, 
  FaUsers,
  FaEdit,
  FaTrash,
  FaPlus
} from 'react-icons/fa';
import { VisualizationOptions } from './VisualizationSettings';

// Rank configuration with colors
const rankConfig = {
  'Starter': {
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    icon: <FaStar className="text-gray-400" />,
    darkColor: 'bg-gray-700 text-gray-200',
    darkBorderColor: 'border-gray-600',
    colorfulColor: 'bg-blue-100 text-blue-800',
    colorfulBorderColor: 'border-blue-300',
  },
  'Bronze': {
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-300',
    icon: <FaStar className="text-yellow-600" />,
    darkColor: 'bg-yellow-900 text-yellow-200',
    darkBorderColor: 'border-yellow-800',
    colorfulColor: 'bg-amber-100 text-amber-800',
    colorfulBorderColor: 'border-amber-300',
  },
  'Silver': {
    color: 'bg-gray-200 text-gray-800',
    borderColor: 'border-gray-400',
    icon: <><FaStar className="text-gray-500" /><FaStar className="text-gray-500 ml-0.5" /></>,
    darkColor: 'bg-gray-600 text-gray-200',
    darkBorderColor: 'border-gray-500',
    colorfulColor: 'bg-slate-200 text-slate-800',
    colorfulBorderColor: 'border-slate-400',
  },
  'Gold': {
    color: 'bg-yellow-200 text-yellow-800',
    borderColor: 'border-yellow-400',
    icon: <><FaStar className="text-yellow-600" /><FaStar className="text-yellow-600 ml-0.5" /><FaStar className="text-yellow-600 ml-0.5" /></>,
    darkColor: 'bg-yellow-800 text-yellow-200',
    darkBorderColor: 'border-yellow-700',
    colorfulColor: 'bg-amber-200 text-amber-800',
    colorfulBorderColor: 'border-amber-400',
  },
  'Platinum': {
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    icon: <><FaStar className="text-blue-500" /><FaStar className="text-blue-500 ml-0.5" /><FaStar className="text-blue-500 ml-0.5" /><FaStar className="text-blue-500 ml-0.5" /></>,
    darkColor: 'bg-blue-900 text-blue-200',
    darkBorderColor: 'border-blue-800',
    colorfulColor: 'bg-cyan-100 text-cyan-800',
    colorfulBorderColor: 'border-cyan-300',
  },
  'Diamond': {
    color: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-300',
    icon: <><FaStar className="text-purple-500" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /><FaStar className="text-purple-500 ml-0.5" /></>,
    darkColor: 'bg-purple-900 text-purple-200',
    darkBorderColor: 'border-purple-800',
    colorfulColor: 'bg-fuchsia-100 text-fuchsia-800',
    colorfulBorderColor: 'border-fuchsia-300',
  }
};

// Get rank configuration based on theme
const getRankConfig = (rankName: string, theme: 'light' | 'dark' | 'colorful') => {
  const config = rankConfig[rankName as keyof typeof rankConfig] || rankConfig['Starter'];
  
  if (theme === 'dark') {
    return {
      color: config.darkColor,
      borderColor: config.darkBorderColor,
      icon: config.icon,
    };
  } else if (theme === 'colorful') {
    return {
      color: config.colorfulColor,
      borderColor: config.colorfulBorderColor,
      icon: config.icon,
    };
  }
  
  return {
    color: config.color,
    borderColor: config.borderColor,
    icon: config.icon,
  };
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

interface CustomizableNodeProps {
  data: {
    user: User;
    onExpand: () => void;
    onSelect: () => void;
    onEdit?: (userId: number) => void;
    onDelete?: (userId: number) => void;
    onAdd?: (parentId: number) => void;
    isExpanded: boolean;
    hasChildren: boolean;
    visualOptions: VisualizationOptions;
    isDragging?: boolean;
  };
  isConnectable: boolean;
}

/**
 * Customizable Node Component for React Flow
 * 
 * A node component that can be customized with various options
 */
function CustomizableNode({ data, isConnectable }: CustomizableNodeProps) {
  const { 
    user, 
    onExpand, 
    onSelect, 
    onEdit, 
    onDelete, 
    onAdd,
    isExpanded, 
    hasChildren, 
    visualOptions,
    isDragging
  } = data;
  
  const rankInfo = getRankConfig(user.rankName, visualOptions.theme);
  
  // State for hover
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Animation class for new nodes
  const [isNew, setIsNew] = useState(true);
  
  useEffect(() => {
    // Remove new status after animation completes
    const timer = setTimeout(() => setIsNew(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  
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
  
  // Get background and text colors based on theme
  const getThemeClasses = () => {
    if (visualOptions.theme === 'dark') {
      return {
        bg: isRoot ? 'bg-blue-900' : 'bg-gray-800',
        text: 'text-gray-200',
        border: isRoot ? 'border-blue-700' : 'border-gray-700',
        highlight: 'bg-gray-700',
      };
    } else if (visualOptions.theme === 'colorful') {
      return {
        bg: isRoot ? 'bg-gradient-to-br from-blue-100 to-purple-100' : 'bg-gradient-to-br from-gray-50 to-blue-50',
        text: 'text-gray-800',
        border: isRoot ? 'border-blue-300' : 'border-gray-300',
        highlight: 'bg-white bg-opacity-50',
      };
    }
    
    // Light theme (default)
    return {
      bg: isRoot ? 'bg-blue-50' : 'bg-white',
      text: 'text-gray-800',
      border: isRoot ? 'border-blue-300' : 'border-gray-200',
      highlight: 'bg-gray-50',
    };
  };
  
  const themeClasses = getThemeClasses();
  
  // Get animation classes
  const getAnimationClasses = () => {
    if (!visualOptions.animateChanges) return '';
    
    if (isNew) {
      return 'animate-fade-in';
    }
    
    if (isDragging) {
      return 'opacity-50';
    }
    
    return '';
  };
  
  return (
    <div 
      className={`
        p-3 rounded-md shadow-md transition-all duration-200
        ${getAnimationClasses()}
        ${isHovered ? 'shadow-lg transform scale-105' : ''}
        ${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border}
      `}
      style={{ 
        width: `${visualOptions.nodeWidth}px`,
        height: `${visualOptions.nodeHeight}px`,
        borderRadius: `${visualOptions.nodeBorderRadius}px`,
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
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
      
      <div className="flex flex-col h-full">
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
        {visualOptions.showPerformanceMetrics && user.performanceMetrics && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className={`${themeClasses.highlight} p-1 rounded text-xs flex flex-col items-center`}>
              <div className="flex items-center text-green-600 mb-0.5">
                <FaShoppingCart className="mr-1" size={10} />
                <span>Personal</span>
              </div>
              <span className="font-medium">
                {formatCurrency(user.performanceMetrics.personalSales)}
              </span>
            </div>
            <div className={`${themeClasses.highlight} p-1 rounded text-xs flex flex-col items-center`}>
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
        <div className="text-xs text-gray-600 space-y-1 flex-grow">
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
                  : `${themeClasses.highlight} hover:bg-gray-200`
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
        
        {/* Floating action buttons (visible on hover) */}
        {showActions && (onEdit || onDelete || onAdd) && (
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
            {onEdit && (
              <button
                onClick={() => onEdit(user.id)}
                className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 shadow-md"
                title="Edit User"
              >
                <FaEdit />
              </button>
            )}
            {onAdd && (
              <button
                onClick={() => onAdd(user.id)}
                className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 shadow-md"
                title="Add Child"
              >
                <FaPlus />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(user.id)}
                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-md"
                title="Delete User"
              >
                <FaTrash />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CustomizableNode);
