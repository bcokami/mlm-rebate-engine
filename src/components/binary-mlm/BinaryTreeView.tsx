"use client";

import React, { useState } from 'react';
import { FaUser, FaUsers, FaChevronDown, FaChevronRight, FaStar, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface BinaryMlmUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    id: number;
    name: string;
    level: number;
  };
  walletBalance: number;
  leftLegId: number | null;
  rightLegId: number | null;
  placementPosition: string | null;
}

interface BinaryTreeNode {
  user: BinaryMlmUser;
  level: number;
  position: string | null;
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
}

interface BinaryTreeViewProps {
  data: BinaryTreeNode;
  maxDepth?: number;
  initialExpandedLevels?: number;
  onUserSelect?: (user: BinaryMlmUser) => void;
}

// Helper function to get rank color
const getRankColor = (rankName: string) => {
  switch (rankName.toLowerCase()) {
    case 'diamond':
      return 'text-purple-600 bg-purple-100';
    case 'platinum':
      return 'text-blue-600 bg-blue-100';
    case 'gold':
      return 'text-yellow-600 bg-yellow-100';
    case 'silver':
      return 'text-gray-600 bg-gray-200';
    case 'bronze':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-green-600 bg-green-100';
  }
};

// Binary tree node component
const BinaryTreeNodeComponent: React.FC<{
  node: BinaryTreeNode;
  isRoot?: boolean;
  depth: number;
  maxDepth: number;
  initialExpandedLevels: number;
  onUserSelect?: (user: BinaryMlmUser) => void;
}> = ({ 
  node, 
  isRoot = false, 
  depth, 
  maxDepth, 
  initialExpandedLevels,
  onUserSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < initialExpandedLevels);
  const hasChildren = node.left !== null || node.right !== null;
  const canExpand = hasChildren && depth < maxDepth;
  
  const rankColor = getRankColor(node.user.rank.name);
  
  return (
    <div className={`mb-2 ${isRoot ? '' : 'ml-6'}`}>
      <div 
        className={`flex items-center p-2 rounded-lg border ${
          isRoot ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'
        } hover:bg-gray-50 transition-colors`}
      >
        {canExpand && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        )}
        
        <div className="flex-shrink-0 mr-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rankColor}`}>
            <FaUser className="text-lg" />
          </div>
        </div>
        
        <div className="flex-grow" onClick={() => onUserSelect && onUserSelect(node.user)}>
          <div className="font-medium">{node.user.name}</div>
          <div className="text-xs text-gray-500">{node.user.email}</div>
          <div className="flex items-center mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${rankColor}`}>
              {node.user.rank.name}
            </span>
            {node.position && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {node.position === 'left' ? 'Left Leg' : 'Right Leg'}
              </span>
            )}
          </div>
        </div>
        
        {hasChildren && (
          <div className="flex-shrink-0 ml-2 text-gray-500">
            <FaUsers />
          </div>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div className="border-t-2 border-l-2 border-gray-200 pt-2 pl-2">
            {node.left ? (
              <BinaryTreeNodeComponent
                node={node.left}
                depth={depth + 1}
                maxDepth={maxDepth}
                initialExpandedLevels={initialExpandedLevels}
                onUserSelect={onUserSelect}
              />
            ) : (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                <FaArrowLeft className="mx-auto mb-2" />
                Empty Left Position
              </div>
            )}
          </div>
          
          <div className="border-t-2 border-r-2 border-gray-200 pt-2 pr-2">
            {node.right ? (
              <BinaryTreeNodeComponent
                node={node.right}
                depth={depth + 1}
                maxDepth={maxDepth}
                initialExpandedLevels={initialExpandedLevels}
                onUserSelect={onUserSelect}
              />
            ) : (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                <FaArrowRight className="mx-auto mb-2" />
                Empty Right Position
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
const BinaryTreeView: React.FC<BinaryTreeViewProps> = ({
  data,
  maxDepth = 6,
  initialExpandedLevels = 2,
  onUserSelect
}) => {
  const [expandAll, setExpandAll] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Binary MLM Structure</h3>
          
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          Showing binary placement structure up to {maxDepth} levels deep
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <BinaryTreeNodeComponent
          node={data}
          isRoot={true}
          depth={0}
          maxDepth={maxDepth}
          initialExpandedLevels={expandAll ? maxDepth : initialExpandedLevels}
          onUserSelect={onUserSelect}
        />
      </div>
    </div>
  );
};

export default BinaryTreeView;
