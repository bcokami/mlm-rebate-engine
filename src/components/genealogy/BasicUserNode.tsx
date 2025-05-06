"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FaUser, FaChevronDown, FaChevronRight, FaInfoCircle } from 'react-icons/fa';

// Simple interface for user data
interface User {
  id: number;
  name: string;
  email: string;
  rankName: string;
  level: number;
  downlineCount: number;
}

interface BasicUserNodeProps {
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
 * Basic User Node Component for React Flow
 * 
 * A simplified version of the user node for initial implementation
 */
function BasicUserNode({ data, isConnectable }: BasicUserNodeProps) {
  const { user, onExpand, onSelect, isExpanded, hasChildren } = data;
  
  // Determine if this is the root node
  const isRoot = user.level === 0;
  
  return (
    <div className={`
      p-3 rounded-md shadow-md w-[180px]
      ${isRoot ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}
    `}>
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
        <div className="text-xs px-2 py-1 rounded-full flex items-center justify-center mb-2 bg-gray-100 text-gray-800">
          <span>{user.rankName}</span>
        </div>
        
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

export default memo(BasicUserNode);
