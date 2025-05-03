"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  FaUser,
  FaUsers,
  FaChevronDown,
  FaChevronRight,
  FaStar,
  FaInfoCircle,
  FaEnvelope,
  FaIdCard,
  FaUserFriends,
  FaWallet,
  FaArrowRight,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
// import { motion, AnimatePresence } from 'framer-motion';

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
  walletBalance?: number;
}

interface GenealogyTreeProps {
  data: GenealogyUser;
  maxDepth?: number;
  initialExpandedLevels?: number;
  onUserSelect?: (user: GenealogyUser) => void;
}

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

// Get rank configuration
const getRankConfig = (rankName: string) => {
  return rankConfig[rankName as keyof typeof rankConfig] || rankConfig['Starter'];
};

// User detail modal component
const UserDetailModal: React.FC<{
  user: GenealogyUser | null;
  onClose: () => void;
}> = ({ user, onClose }) => {
  if (!user) return null;

  const rankInfo = getRankConfig(user.rank.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`p-6 ${rankInfo.color} rounded-t-lg border-b ${rankInfo.borderColor}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex items-center mt-1">
                  <span className="flex items-center text-sm">
                    {rankInfo.icon}
                    <span className="ml-1">{user.rank.name}</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">User Information</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaIdCard className="mt-1 mr-3 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">User ID</div>
                    <div>{user.id}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaEnvelope className="mt-1 mr-3 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div>{user.email}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaUserFriends className="mt-1 mr-3 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Downline Members</div>
                    <div>{user._count.downline}</div>
                  </div>
                </div>
                {user.walletBalance !== undefined && (
                  <div className="flex items-start">
                    <FaWallet className="mt-1 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Wallet Balance</div>
                      <div>₱{user.walletBalance.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                {user.level > 0 && (
                  <div className="flex items-start">
                    <FaUsers className="mt-1 mr-3 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Network Level</div>
                      <div>Level {user.level}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Rank Benefits</h3>
              <ul className="space-y-2">
                {rankInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                View Full Profile
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                Send Message
              </button>
              {user.level === 0 && (
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                  Generate Referral Link
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Genealogy node component with animations
const GenealogyNode: React.FC<{
  user: GenealogyUser;
  isRoot?: boolean;
  depth: number;
  maxDepth: number;
  initialExpandedLevels: number;
  onUserSelect: (user: GenealogyUser) => void;
  viewMode: 'compact' | 'detailed';
  highlightTerm: string;
}> = ({
  user,
  isRoot = false,
  depth,
  maxDepth,
  initialExpandedLevels,
  onUserSelect,
  viewMode,
  highlightTerm
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < initialExpandedLevels);
  const hasChildren = user.children && user.children.length > 0;
  const canExpand = hasChildren && depth < maxDepth;

  const rankConfig = getRankConfig(user.rank.name);

  // Check if user matches search term
  const isHighlighted = highlightTerm && (
    user.name.toLowerCase().includes(highlightTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(highlightTerm.toLowerCase()) ||
    user.id.toString().includes(highlightTerm)
  );

  // Animation variants
  const nodeVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: depth * 0.1 // Stagger effect based on depth
      }
    }
  };

  const childrenVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className={`mb-2 ${isRoot ? '' : 'ml-6'}`}>
      <div
        className={`
          flex items-center p-3 rounded-md
          ${isRoot ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}
          ${isHighlighted ? 'ring-2 ring-yellow-400 shadow-md' : ''}
          hover:shadow-md transition-shadow duration-200
        `}
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
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <FaUser className="text-blue-500" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium">{user.name}</div>
              {viewMode === 'detailed' && (
                <div className="text-xs text-gray-500">{user.email}</div>
              )}
            </div>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex items-center ${rankConfig.color}`}>
              {rankConfig.icon}
              <span className="ml-1">{user.rank.name}</span>
            </span>
          </div>

          {viewMode === 'detailed' && (
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
              <span>ID: {user.id}</span>
              <span>Downline: {user._count.downline}</span>
              {!isRoot && <span>Level {user.level}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isRoot && viewMode === 'compact' && (
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              Lvl {user.level}
            </div>
          )}

          <button
            onClick={() => onUserSelect(user)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full"
            aria-label="View details"
          >
            <FaInfoCircle />
          </button>
        </div>
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
                  onUserSelect={onUserSelect}
                  viewMode={viewMode}
                  highlightTerm={highlightTerm}
                />
              ))}
        </div>
      )}
    </div>
  );
};

// Main component
const EnhancedGenealogyTree: React.FC<GenealogyTreeProps> = ({
  data,
  maxDepth = 10,
  initialExpandedLevels = 2,
  onUserSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');
  const [selectedUser, setSelectedUser] = useState<GenealogyUser | null>(null);
  const [filterRank, setFilterRank] = useState<string | null>(null);
  const [highlightTerm, setHighlightTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setHighlightTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Function to search the genealogy tree
  const searchTree = (node: GenealogyUser, term: string, rank: string | null): GenealogyUser | null => {
    // Check if the current node matches the search term and rank filter
    const matchesTerm = !term ||
      node.name.toLowerCase().includes(term.toLowerCase()) ||
      node.email.toLowerCase().includes(term.toLowerCase()) ||
      node.id.toString().includes(term);

    const matchesRank = !rank || node.rank.name === rank;

    if (matchesTerm && matchesRank) {
      return node;
    }

    // If the node has children, search them
    if (node.children && node.children.length > 0) {
      const matchingChildren = node.children
        .map(child => searchTree(child, term, rank))
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

  // Apply search and rank filters
  const filteredData = searchTerm || filterRank
    ? searchTree(data, searchTerm, filterRank) || data
    : data;

  // Handle user selection
  const handleUserSelect = (user: GenealogyUser) => {
    setSelectedUser(user);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  // Handle search clear
  const handleClearSearch = () => {
    setSearchTerm('');
    setHighlightTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="genealogy-tree">
      {/* Search and Controls */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FaSearch className="h-5 w-5" />
                </div>
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setExpandAll(!expandAll)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {expandAll ? 'Collapse All' : 'Expand All'}
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
              >
                {viewMode === 'compact' ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}
                {viewMode === 'compact' ? 'Detailed' : 'Compact'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-gray-500 flex items-center">
              <FaFilter className="mr-1" /> Filter by rank:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterRank(null)}
                className={`text-xs px-3 py-1 rounded-full ${
                  filterRank === null
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {Object.keys(rankConfig).map(rank => (
                <button
                  key={rank}
                  onClick={() => setFilterRank(rank === filterRank ? null : rank)}
                  className={`text-xs px-3 py-1 rounded-full flex items-center ${
                    filterRank === rank
                      ? 'bg-green-600 text-white'
                      : `${getRankConfig(rank).color} hover:bg-opacity-80`
                  }`}
                >
                  {getRankConfig(rank).icon}
                  <span className="ml-1">{rank}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-500">Rank Legend</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(rankConfig).map(([rank, config]) => (
            <div key={rank} className="flex items-center">
              <span className={`w-3 h-3 inline-block rounded-full ${config.color.split(' ')[0]} mr-1`}></span>
              <span className="text-sm flex items-center">
                {config.icon}
                <span className="ml-1">{rank}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Genealogy Tree */}
      <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
        <GenealogyNode
          user={filteredData}
          isRoot={true}
          depth={0}
          maxDepth={maxDepth}
          initialExpandedLevels={expandAll ? maxDepth : initialExpandedLevels}
          onUserSelect={handleUserSelect}
          viewMode={viewMode}
          highlightTerm={highlightTerm}
        />
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default EnhancedGenealogyTree;
