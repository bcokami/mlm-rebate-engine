import React, { useState } from 'react';
import { FaUserPlus, FaShoppingCart } from 'react-icons/fa';

interface User {
  id: number;
  name: string;
  email: string;
  rank: string;
  createdAt: string;
}

interface Purchase {
  id: number;
  productName: string;
  userName: string;
  amount: number;
  date: string;
}

interface ActivityFeedProps {
  users: User[];
  purchases: Purchase[];
  title?: string;
}

type ActivityType = 'users' | 'purchases';

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  users,
  purchases,
  title = "Recent Activity"
}) => {
  const [activeTab, setActiveTab] = useState<ActivityType>('users');

  const hasData = (activeTab === 'users' && users && users.length > 0) || 
                  (activeTab === 'purchases' && purchases && purchases.length > 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-2 py-1 text-xs rounded-md ${
              activeTab === 'users' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded-md ${
              activeTab === 'purchases' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveTab('purchases')}
          >
            Purchases
          </button>
        </div>
      </div>
      <div className="p-6">
        {hasData ? (
          <div className="space-y-4">
            {activeTab === 'users' && users.map((user) => (
              <div key={user.id} className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                  <FaUserPlus />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    New {user.rank} member joined
                  </p>
                </div>
              </div>
            ))}
            
            {activeTab === 'purchases' && purchases.map((purchase) => (
              <div key={purchase.id} className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                  <FaShoppingCart />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {purchase.userName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(purchase.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Purchased {purchase.productName} for ₱{purchase.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No {activeTab} activity available
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
