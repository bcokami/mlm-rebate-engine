"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaUser, FaUsers, FaChevronDown, FaChevronRight, FaUserPlus } from 'react-icons/fa';

interface Member {
  id: string;
  name: string;
  rank: string;
  image?: string;
  position?: 'left' | 'right';
  children?: Member[];
}

interface GenealogyPreviewProps {
  currentUser: Member;
  downlineMembers: Member[];
}

const GenealogyPreview: React.FC<GenealogyPreviewProps> = ({
  currentUser,
  downlineMembers = []
}) => {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([currentUser.id]);
  
  // Organize members into a tree structure
  const buildTree = (members: Member[]): Member => {
    // Create a copy of the current user as the root
    const root = { ...currentUser, children: [] };
    
    // Create a map for quick lookup
    const memberMap = new Map<string, Member>();
    memberMap.set(root.id, root);
    
    // First pass: create all nodes
    for (const member of members) {
      memberMap.set(member.id, { ...member, children: [] });
    }
    
    // Second pass: build the tree
    for (const member of members) {
      // For this simplified preview, we'll just add all members as direct children
      // In a real implementation, you would use the actual parent-child relationships
      const parent = memberMap.get(currentUser.id);
      const node = memberMap.get(member.id);
      
      if (parent && node) {
        // Assign position (left or right) if not already set
        if (!node.position) {
          node.position = parent.children && parent.children.length > 0 ? 'right' : 'left';
        }
        
        parent.children?.push(node);
      }
    }
    
    return root;
  };
  
  const tree = buildTree(downlineMembers);
  
  // Toggle node expansion
  const toggleNode = (id: string) => {
    setExpandedNodes(prev => 
      prev.includes(id)
        ? prev.filter(nodeId => nodeId !== id)
        : [...prev, id]
    );
  };
  
  // Render a tree node
  const renderNode = (node: Member, level: number = 0) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    // Determine rank color
    const getRankColor = (rank: string) => {
      switch (rank.toLowerCase()) {
        case 'distributor': return 'bg-gray-100 text-gray-800';
        case 'silver': return 'bg-gray-200 text-gray-800';
        case 'gold': return 'bg-yellow-100 text-yellow-800';
        case 'platinum': return 'bg-gray-100 text-gray-800';
        case 'diamond': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    return (
      <div key={node.id} className={`ml-${level * 6}`}>
        <div className={`flex items-center p-2 rounded-md ${level === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.id)}
              className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
            </button>
          )}
          
          <div className="flex items-center flex-1">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2">
              {node.image ? (
                <Image
                  src={node.image}
                  alt={node.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaUser className="text-gray-500" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{node.name}</span>
                {node.position && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    node.position === 'left' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {node.position === 'left' ? 'Left' : 'Right'}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span className={`text-xs px-1.5 py-0.5 rounded ${getRankColor(node.rank)}`}>
                  {node.rank}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="ml-6 mt-1 border-l-2 border-gray-200 pl-2">
            {node.children?.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-700 flex items-center">
          <FaUsers className="mr-2 text-blue-500" /> My Genealogy
        </h3>
        <Link 
          href="/genealogy" 
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          View Full Tree
        </Link>
      </div>
      
      <div className="p-4">
        {renderNode(tree)}
        
        {downlineMembers.length === 0 && (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
              <FaUserPlus size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Downline Members Yet</h3>
            <p className="text-gray-500 mb-4">Start building your network by inviting new members</p>
            <Link
              href="/referrals"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Invite Members
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenealogyPreview;
