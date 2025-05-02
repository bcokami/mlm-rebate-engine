"use client";

import React, { useState } from 'react';
import { FaUser, FaUsers, FaChevronDown, FaChevronRight, FaStar } from 'react-icons/fa';

interface GenealogyUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    name: string;
  };
  level: number;
  _count: {
    downline: number;
  };
  children?: GenealogyUser[];
}

interface GenealogyTreeProps {
  data: GenealogyUser;
  maxDepth?: number;
  initialExpandedLevels?: number;
}

const getRankColor = (rankName: string) => {
  switch (rankName) {
    case 'Starter':
      return 'bg-gray-100 text-gray-800';
    case 'Bronze':
      return 'bg-yellow-100 text-yellow-800';
    case 'Silver':
      return 'bg-gray-200 text-gray-800';
    case 'Gold':
      return 'bg-yellow-200 text-yellow-800';
    case 'Platinum':
      return 'bg-blue-100 text-blue-800';
    case 'Diamond':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const GenealogyNode: React.FC<{
  user: GenealogyUser;
  isRoot?: boolean;
  depth: number;
  maxDepth: number;
  initialExpandedLevels: number;
}> = ({ user, isRoot = false, depth, maxDepth, initialExpandedLevels }) => {
  const [isExpanded, setIsExpanded] = useState(depth < initialExpandedLevels);
  const hasChildren = user.children && user.children.length > 0;
  const canExpand = hasChildren && depth < maxDepth;
  
  const rankColor = getRankColor(user.rank.name);
  
  return (
    <div className={`mb-2 ${isRoot ? '' : 'ml-6'}`}>
      <div
        className={`flex items-center p-3 rounded-md ${
          isRoot ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'
        }`}
      >
        {canExpand && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        )}
        
        <div className="flex-1">
          <div className="flex items-center">
            {isRoot ? (
              <FaUser className="mr-2 text-blue-500" />
            ) : (
              <FaUsers className="mr-2 text-blue-500" />
            )}
            <span className="font-medium">{user.name}</span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${rankColor}`}>
              {user.rank.name}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <span className="mr-3">ID: {user.id}</span>
            <span className="mr-3">Downline: {user._count.downline}</span>
            {!isRoot && <span>Level {user.level}</span>}
          </div>
        </div>
        
        {!isRoot && (
          <div className="flex items-center">
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              Level {user.level}
            </div>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 border-l-2 border-gray-200 pl-2">
          {user.children!.map((child) => (
            <GenealogyNode
              key={child.id}
              user={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              initialExpandedLevels={initialExpandedLevels}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GenealogyTree: React.FC<GenealogyTreeProps> = ({
  data,
  maxDepth = 10,
  initialExpandedLevels = 2,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  
  // Function to search the genealogy tree
  const searchTree = (node: GenealogyUser, term: string): GenealogyUser | null => {
    // Check if the current node matches the search term
    if (
      node.name.toLowerCase().includes(term.toLowerCase()) ||
      node.email.toLowerCase().includes(term.toLowerCase())
    ) {
      return node;
    }
    
    // If the node has children, search them
    if (node.children && node.children.length > 0) {
      const matchingChildren = node.children
        .map(child => searchTree(child, term))
        .filter(Boolean) as GenealogyUser[];
      
      if (matchingChildren.length > 0) {
        return {
          ...node,
          children: matchingChildren,
        };
      }
    }
    
    return null;
  };
  
  // Apply search filter if search term exists
  const filteredData = searchTerm
    ? searchTree(data, searchTerm) || data
    : data;
  
  return (
    <div className="genealogy-tree">
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-4 flex items-center">
          <div className="flex space-x-2 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block rounded-full bg-gray-100 mr-1"></span>
              <span>Starter</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block rounded-full bg-yellow-100 mr-1"></span>
              <span>Bronze</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block rounded-full bg-gray-200 mr-1"></span>
              <span>Silver</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block rounded-full bg-yellow-200 mr-1"></span>
              <span>Gold</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block rounded-full bg-blue-100 mr-1"></span>
              <span>Platinum</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block rounded-full bg-purple-100 mr-1"></span>
              <span>Diamond</span>
            </div>
          </div>
        </div>
        
        <GenealogyNode
          user={filteredData}
          isRoot={true}
          depth={0}
          maxDepth={maxDepth}
          initialExpandedLevels={expandAll ? maxDepth : initialExpandedLevels}
        />
      </div>
    </div>
  );
};

export default GenealogyTree;
