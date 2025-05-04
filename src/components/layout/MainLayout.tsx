import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaHome,
  FaUsers,
  FaShoppingCart,
  FaWallet,
  FaChartLine,
  FaCog,
  FaUser,
  FaTrophy,
  FaInfoCircle,
  FaSitemap,
  FaExchangeAlt,
  FaCalendarAlt,
  FaLink
} from 'react-icons/fa';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { data: session } = useSession();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {session && (
        <div className="w-64 bg-white shadow-md">
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="relative w-10 h-10 mr-2">
                <Image
                  src="/images/20250503.svg"
                  alt="Extreme Life Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="text-xl font-semibold">Extreme Life Rewards</h2>
            </div>
          </div>
          <nav className="mt-4">
            <ul>
              <li>
                <Link href="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaHome className="mr-3" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/genealogy" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaUsers className="mr-3" />
                  <span>Genealogy</span>
                </Link>
              </li>
              <li>
                <Link href="/shop" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaShoppingCart className="mr-3" />
                  <span>Shop</span>
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaWallet className="mr-3" />
                  <span>Wallet</span>
                </Link>
              </li>
              <li>
                <Link href="/rebates" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaChartLine className="mr-3" />
                  <span>Rebates</span>
                </Link>
              </li>
              <li>
                <Link href="/binary-mlm" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaSitemap className="mr-3" />
                  <span>Binary MLM</span>
                </Link>
              </li>
              <li>
                <Link href="/referrals" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaLink className="mr-3" />
                  <span>My Referrals</span>
                </Link>
              </li>
              <li>
                <Link href="/rank-advancement" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaTrophy className="mr-3" />
                  <span>Rank Advancement</span>
                </Link>
              </li>
              <li>
                <Link href="/profile" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaUser className="mr-3" />
                  <span>My Profile</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaInfoCircle className="mr-3" />
                  <span>About Us</span>
                </Link>
              </li>
              {/* Admin section */}
              <li className="mt-8 border-t pt-2">
                <Link href="/admin" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  <FaCog className="mr-3" />
                  <span>Admin Panel</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/mlm-config" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 pl-10">
                  <FaExchangeAlt className="mr-3" />
                  <span>MLM Configuration</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/mlm-config/cutoff" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 pl-10">
                  <FaCalendarAlt className="mr-3" />
                  <span>Monthly Cutoff</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <div className="relative w-10 h-10 mr-2">
                    <Image
                      src="/images/20250503.svg"
                      alt="Extreme Life Herbal Products Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-xl font-semibold text-green-700">Extreme Life Herbal Product Rewards</h1>
                </Link>
              </div>
              <div className="flex items-center">
                {session ? (
                  <div className="flex items-center">
                    <Link href="/profile" className="flex items-center mr-4 hover:text-blue-600">
                      <FaUser className="mr-2" />
                      <span>{session.user?.name || session.user?.email}</span>
                    </Link>
                    <Link href="/api/auth/signout" className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                      Sign Out
                    </Link>
                  </div>
                ) : (
                  <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
