"use client";

import { FaTimes, FaStar, FaEnvelope, FaIdCard, FaUserFriends, FaWallet, FaCalendarAlt, FaChartLine, FaShoppingCart, FaUsers, FaMedal } from 'react-icons/fa';
import { GenealogyUser, UserPerformanceMetrics } from '@/lib/optimizedGenealogyService';

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

interface GenealogyUserDetailsProps {
  user: GenealogyUser;
  onClose: () => void;
}

/**
 * Genealogy User Details Component
 * 
 * Displays detailed information about a selected user in the genealogy tree
 */
export default function GenealogyUserDetails({ user, onClose }: GenealogyUserDetailsProps) {
  const rankInfo = getRankConfig(user.rank.name);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 ${rankInfo.color} ${rankInfo.borderColor} border-b`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold">{user.name}</h2>
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
            <FaTimes />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Information */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-3 text-gray-700">User Information</h3>
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
                  <div>{formatCurrency(user.walletBalance)}</div>
                </div>
              </div>
            )}
            {user.createdAt && (
              <div className="flex items-start">
                <FaCalendarAlt className="mt-1 mr-3 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Member Since</div>
                  <div>{formatDate(user.createdAt)}</div>
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
        
        {/* Performance Metrics */}
        {user.performanceMetrics && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 text-gray-700">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-center mb-1">
                  <FaShoppingCart className="text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Personal Sales</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(user.performanceMetrics.personalSales)}
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-md">
                <div className="flex items-center mb-1">
                  <FaUsers className="text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Team Sales</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(user.performanceMetrics.teamSales)}
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md">
                <div className="flex items-center mb-1">
                  <FaWallet className="text-yellow-500 mr-2" />
                  <span className="text-sm text-gray-600">Rebates Earned</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(user.performanceMetrics.rebatesEarned)}
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="flex items-center mb-1">
                  <FaChartLine className="text-purple-500 mr-2" />
                  <span className="text-sm text-gray-600">Activity Score</span>
                </div>
                <div className="text-lg font-semibold">
                  {user.performanceMetrics.activityScore}/100
                </div>
              </div>
            </div>
            
            {/* Team Metrics */}
            <div className="mt-4 bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Team Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-500">Team Size</div>
                  <div className="font-medium">{user.performanceMetrics.teamSize} members</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">New Members (30d)</div>
                  <div className="font-medium">{user.performanceMetrics.newTeamMembers} members</div>
                </div>
              </div>
            </div>
            
            {/* Rank History */}
            {user.performanceMetrics.rankHistory && user.performanceMetrics.rankHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Rank Advancement History</h4>
                <div className="space-y-2">
                  {user.performanceMetrics.rankHistory.map((history, index) => (
                    <div key={index} className="flex items-center">
                      <FaMedal className="text-yellow-500 mr-2" />
                      <div>
                        <div className="font-medium">{history.rankName}</div>
                        <div className="text-xs text-gray-500">
                          Achieved on {formatDate(history.achievedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Rank Benefits */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-3 text-gray-700">Rank Benefits</h3>
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
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            View Full Profile
          </button>
          <button className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
            Send Message
          </button>
          {user.level === 0 && (
            <button className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
              Generate Referral Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
