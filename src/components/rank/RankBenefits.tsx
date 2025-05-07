"use client";

import { useState } from 'react';
import { 
  FaTrophy, 
  FaPercentage, 
  FaGift, 
  FaUsers, 
  FaMoneyBillWave, 
  FaAward,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

interface RankBenefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Rank {
  id: number;
  name: string;
  level: number;
  commissionRate: number;
  overrideBonus: number;
  leadershipBonus: number;
  benefits: RankBenefit[];
}

interface RankBenefitsProps {
  ranks: Rank[];
  currentRankId?: number;
}

const RankBenefits: React.FC<RankBenefitsProps> = ({
  ranks = [],
  currentRankId
}) => {
  const [expandedRank, setExpandedRank] = useState<number | null>(currentRankId || null);
  
  // Toggle rank expansion
  const toggleRank = (rankId: number) => {
    setExpandedRank(expandedRank === rankId ? null : rankId);
  };
  
  // Get rank color based on name
  const getRankColor = (rankName: string) => {
    switch (rankName?.toLowerCase()) {
      case "starter":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "bronze":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "silver":
        return "bg-gray-200 text-gray-800 border-gray-400";
      case "gold":
        return "bg-yellow-200 text-yellow-800 border-yellow-400";
      case "platinum":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "diamond":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  // Sample ranks if none provided
  const sampleRanks: Rank[] = [
    {
      id: 1,
      name: "Starter",
      level: 1,
      commissionRate: 5,
      overrideBonus: 0,
      leadershipBonus: 0,
      benefits: [
        {
          icon: <FaPercentage />,
          title: "5% Commission",
          description: "Earn 5% commission on personal sales"
        },
        {
          icon: <FaUsers />,
          title: "Binary Structure",
          description: "Start building your downline with a binary structure"
        }
      ]
    },
    {
      id: 2,
      name: "Bronze",
      level: 2,
      commissionRate: 8,
      overrideBonus: 1,
      leadershipBonus: 0,
      benefits: [
        {
          icon: <FaPercentage />,
          title: "8% Commission",
          description: "Earn 8% commission on personal sales"
        },
        {
          icon: <FaMoneyBillWave />,
          title: "1% Override Bonus",
          description: "Earn 1% override bonus on your direct downline's sales"
        },
        {
          icon: <FaUsers />,
          title: "Team Building Tools",
          description: "Access to basic team building tools and resources"
        }
      ]
    },
    {
      id: 3,
      name: "Silver",
      level: 3,
      commissionRate: 10,
      overrideBonus: 2,
      leadershipBonus: 0.5,
      benefits: [
        {
          icon: <FaPercentage />,
          title: "10% Commission",
          description: "Earn 10% commission on personal sales"
        },
        {
          icon: <FaMoneyBillWave />,
          title: "2% Override Bonus",
          description: "Earn 2% override bonus on your direct downline's sales"
        },
        {
          icon: <FaAward />,
          title: "0.5% Leadership Bonus",
          description: "Earn 0.5% leadership bonus on your entire organization's sales"
        },
        {
          icon: <FaGift />,
          title: "Silver Welcome Kit",
          description: "Receive a Silver rank welcome kit with exclusive products"
        }
      ]
    },
    {
      id: 4,
      name: "Gold",
      level: 4,
      commissionRate: 12,
      overrideBonus: 3,
      leadershipBonus: 1,
      benefits: [
        {
          icon: <FaPercentage />,
          title: "12% Commission",
          description: "Earn 12% commission on personal sales"
        },
        {
          icon: <FaMoneyBillWave />,
          title: "3% Override Bonus",
          description: "Earn 3% override bonus on your direct downline's sales"
        },
        {
          icon: <FaAward />,
          title: "1% Leadership Bonus",
          description: "Earn 1% leadership bonus on your entire organization's sales"
        },
        {
          icon: <FaGift />,
          title: "Gold Welcome Kit",
          description: "Receive a Gold rank welcome kit with exclusive products"
        },
        {
          icon: <FaTrophy />,
          title: "Recognition",
          description: "Recognition at regional events and online platforms"
        }
      ]
    },
    {
      id: 5,
      name: "Platinum",
      level: 5,
      commissionRate: 15,
      overrideBonus: 4,
      leadershipBonus: 1.5,
      benefits: [
        {
          icon: <FaPercentage />,
          title: "15% Commission",
          description: "Earn 15% commission on personal sales"
        },
        {
          icon: <FaMoneyBillWave />,
          title: "4% Override Bonus",
          description: "Earn 4% override bonus on your direct downline's sales"
        },
        {
          icon: <FaAward />,
          title: "1.5% Leadership Bonus",
          description: "Earn 1.5% leadership bonus on your entire organization's sales"
        },
        {
          icon: <FaGift />,
          title: "Platinum Welcome Kit",
          description: "Receive a Platinum rank welcome kit with exclusive products"
        },
        {
          icon: <FaTrophy />,
          title: "VIP Recognition",
          description: "VIP recognition at national events and online platforms"
        },
        {
          icon: <FaUsers />,
          title: "Leadership Training",
          description: "Access to exclusive leadership training and development programs"
        }
      ]
    },
    {
      id: 6,
      name: "Diamond",
      level: 6,
      commissionRate: 20,
      overrideBonus: 5,
      leadershipBonus: 2,
      benefits: [
        {
          icon: <FaPercentage />,
          title: "20% Commission",
          description: "Earn 20% commission on personal sales"
        },
        {
          icon: <FaMoneyBillWave />,
          title: "5% Override Bonus",
          description: "Earn 5% override bonus on your direct downline's sales"
        },
        {
          icon: <FaAward />,
          title: "2% Leadership Bonus",
          description: "Earn 2% leadership bonus on your entire organization's sales"
        },
        {
          icon: <FaGift />,
          title: "Diamond Welcome Kit",
          description: "Receive a Diamond rank welcome kit with exclusive products and luxury items"
        },
        {
          icon: <FaTrophy />,
          title: "Elite Recognition",
          description: "Elite recognition at international events and online platforms"
        },
        {
          icon: <FaUsers />,
          title: "Executive Training",
          description: "Access to exclusive executive training and development programs"
        },
        {
          icon: <FaMoneyBillWave />,
          title: "Annual Bonus Pool",
          description: "Participate in the annual Diamond bonus pool"
        }
      ]
    }
  ];
  
  // Use provided ranks or sample data
  const displayRanks = ranks.length > 0 ? ranks : sampleRanks;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-700 flex items-center">
          <FaTrophy className="mr-2 text-yellow-500" /> Rank Benefits
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {displayRanks.map((rank) => (
          <div key={rank.id} className="overflow-hidden">
            <button
              onClick={() => toggleRank(rank.id)}
              className={`w-full px-4 py-3 flex justify-between items-center text-left transition-colors ${
                rank.id === currentRankId ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getRankColor(rank.name)}`}>
                  {rank.level}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{rank.name}</h4>
                  <p className="text-sm text-gray-500">Level {rank.level}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                {rank.id === currentRankId && (
                  <span className="mr-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Current
                  </span>
                )}
                {expandedRank === rank.id ? (
                  <FaChevronUp className="text-gray-400" />
                ) : (
                  <FaChevronDown className="text-gray-400" />
                )}
              </div>
            </button>
            
            {expandedRank === rank.id && (
              <div className="px-4 py-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center text-blue-600 mb-1">
                      <FaPercentage className="mr-1" />
                      <span className="font-medium">Commission Rate</span>
                    </div>
                    <p className="text-2xl font-bold">{rank.commissionRate}%</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center text-green-600 mb-1">
                      <FaMoneyBillWave className="mr-1" />
                      <span className="font-medium">Override Bonus</span>
                    </div>
                    <p className="text-2xl font-bold">{rank.overrideBonus}%</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center text-purple-600 mb-1">
                      <FaAward className="mr-1" />
                      <span className="font-medium">Leadership Bonus</span>
                    </div>
                    <p className="text-2xl font-bold">{rank.leadershipBonus}%</p>
                  </div>
                </div>
                
                <h5 className="font-medium text-gray-700 mb-2">Additional Benefits</h5>
                <ul className="space-y-2">
                  {rank.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mt-1 mr-2 text-blue-500">
                        {benefit.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{benefit.title}</p>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankBenefits;
