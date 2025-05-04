"use client";

import React from 'react';
import { FaDownload, FaChartBar, FaUsers, FaMoneyBillWave, FaGift } from 'react-icons/fa';

interface CommissionBreakdown {
  directReferral: {
    amount: number;
    details: any[];
  };
  levelCommissions: {
    amount: number;
    byLevel: Record<number, number>;
    details: any[];
  };
  groupVolume: {
    amount: number;
    details: any[];
  };
}

interface CommissionResult {
  directReferralBonus: number;
  levelCommissions: number;
  groupVolumeBonus: number;
  totalCommission: number;
  breakdown: CommissionBreakdown;
}

interface MonthlyPerformance {
  id: number;
  userId: number;
  year: number;
  month: number;
  personalPV: number;
  leftLegPV: number;
  rightLegPV: number;
  totalGroupPV: number;
  directReferralBonus: number;
  levelCommissions: number;
  groupVolumeBonus: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

interface EarningsReportProps {
  performance: MonthlyPerformance;
  commissions?: CommissionResult;
  onExport?: (format: 'csv' | 'json') => void;
}

const EarningsReport: React.FC<EarningsReportProps> = ({
  performance,
  commissions,
  onExport
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = monthNames[performance.month - 1];
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Earnings Report: {monthName} {performance.year}
          </h3>
          
          {onExport && (
            <div className="relative group">
              <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center">
                <FaDownload className="mr-1" /> Export
              </button>
              <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => onExport('csv')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => onExport('json')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <FaChartBar className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-blue-600 font-medium">Total Earnings</div>
                <div className="text-xl font-bold">₱{performance.totalEarnings.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <FaUsers className="text-green-600" />
              </div>
              <div>
                <div className="text-sm text-green-600 font-medium">Group Volume</div>
                <div className="text-xl font-bold">{performance.totalGroupPV.toFixed(0)} PV</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <FaMoneyBillWave className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-purple-600 font-medium">Personal Volume</div>
                <div className="text-xl font-bold">{performance.personalPV.toFixed(0)} PV</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <FaGift className="text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-yellow-600 font-medium">Referral Bonus</div>
                <div className="text-xl font-bold">₱{performance.directReferralBonus.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PV Breakdown */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <h4 className="font-medium">PV Breakdown</h4>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Personal PV</span>
                  <span className="font-medium">{performance.personalPV.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (performance.personalPV / (performance.totalGroupPV || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Left Leg PV</span>
                  <span className="font-medium">{performance.leftLegPV.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (performance.leftLegPV / (performance.totalGroupPV || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Right Leg PV</span>
                  <span className="font-medium">{performance.rightLegPV.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (performance.rightLegPV / (performance.totalGroupPV || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Commission Breakdown */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <h4 className="font-medium">Commission Breakdown</h4>
            </div>
            <div className="p-4">
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-sm text-gray-600">Direct Referral Bonus</td>
                    <td className="py-2 text-right font-medium">₱{performance.directReferralBonus.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm text-gray-600">Level Commissions</td>
                    <td className="py-2 text-right font-medium">₱{performance.levelCommissions.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm text-gray-600">Group Volume Bonus</td>
                    <td className="py-2 text-right font-medium">₱{performance.groupVolumeBonus.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Total Earnings</td>
                    <td className="py-2 text-right font-bold">₱{performance.totalEarnings.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Level Commission Details */}
        {commissions && commissions.breakdown.levelCommissions.byLevel && (
          <div className="mt-6 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <h4 className="font-medium">Level Commission Details</h4>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Object.entries(commissions.breakdown.levelCommissions.byLevel).map(([level, amount]) => (
                  <div key={level} className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-sm text-gray-600">Level {level}</div>
                    <div className="font-medium">₱{parseFloat(amount.toString()).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsReport;
