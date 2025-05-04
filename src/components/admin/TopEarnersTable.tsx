import React from 'react';
import Link from 'next/link';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface Distributor {
  id: number;
  name: string;
  rank: string;
  downlineCount: number;
  earnings?: number;
  directReferrals?: number;
}

interface TopEarnersTableProps {
  distributors: Distributor[];
  showEarnings?: boolean;
  showReferrals?: boolean;
  title?: string;
  viewAllLink?: string;
}

const TopEarnersTable: React.FC<TopEarnersTableProps> = ({
  distributors,
  showEarnings = false,
  showReferrals = false,
  title = "Top Distributors",
  viewAllLink = "/admin/reports"
}) => {
  if (!distributors || distributors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            No distributor data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={viewAllLink} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          View All <FaExternalLinkAlt className="ml-1" size={12} />
        </Link>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distributor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                {showEarnings && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {showReferrals ? "Direct Referrals" : "Downline"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {distributors.map((distributor) => (
                <tr key={distributor.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium">
                        {distributor.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{distributor.name}</div>
                        <div className="text-xs text-gray-500">ID: {distributor.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {distributor.rank}
                    </span>
                  </td>
                  {showEarnings && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      ₱{distributor.earnings?.toLocaleString() || 0}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {showReferrals ? distributor.directReferrals || 0 : distributor.downlineCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopEarnersTable;
