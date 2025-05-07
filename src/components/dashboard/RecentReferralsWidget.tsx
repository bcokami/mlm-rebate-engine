"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaUsers, FaSpinner, FaExternalLinkAlt, FaMoneyBillWave, FaArrowRight } from 'react-icons/fa';

interface ReferralActivity {
  id: number;
  type: 'click' | 'purchase' | 'commission';
  linkId: number;
  linkCode: string;
  productId?: number;
  productName?: string;
  productImage?: string;
  amount?: number;
  createdAt: string;
}

const RecentReferralsWidget = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ReferralActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/referrals/activity?limit=5');
      if (!response.ok) throw new Error('Failed to fetch referral activity');
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching referral activity:', error);
      setError('Failed to load recent activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click':
        return <FaExternalLinkAlt className="text-blue-500" />;
      case 'purchase':
        return <FaUsers className="text-purple-500" />;
      case 'commission':
        return <FaMoneyBillWave className="text-green-500" />;
      default:
        return <FaUsers className="text-gray-500" />;
    }
  };

  const getActivityText = (activity: ReferralActivity) => {
    switch (activity.type) {
      case 'click':
        return 'Someone clicked your referral link';
      case 'purchase':
        return `Someone purchased ${activity.productName || 'a product'} through your link`;
      case 'commission':
        return `You earned ${formatCurrency(activity.amount || 0)} commission`;
      default:
        return 'Referral activity';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-purple-500 mr-2" />
        <span>Loading recent activity...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-purple-50 border-b border-purple-100">
        <h2 className="text-lg font-semibold flex items-center">
          <FaUsers className="mr-2 text-purple-600" />
          Recent Referral Activity
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Track clicks, purchases, and commissions from your referral links
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No recent referral activity.</p>
            <p className="mt-2 text-sm">
              Start sharing your referral links to see activity here!
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {getActivityText(activity)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                  
                  {activity.productName && (
                    <div className="mt-1 flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 bg-gray-100 rounded overflow-hidden mr-2">
                        {activity.productImage ? (
                          <Image
                            src={activity.productImage}
                            alt={activity.productName}
                            width={24}
                            height={24}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full"></div>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 truncate">
                        {activity.productName}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-1 text-xs text-gray-500">
                    Link: {window.location.origin}/s/{activity.linkCode}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <Link
          href="/referrals"
          className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center justify-center"
        >
          View all referral activity
          <FaArrowRight className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default RecentReferralsWidget;
