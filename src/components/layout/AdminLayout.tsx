import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  FaHome, FaUsers, FaShoppingCart, FaWallet, FaChartLine,
  FaCog, FaUsersCog, FaPercentage, FaClipboardList, FaChevronLeft,
  FaChevronRight, FaSignOutAlt, FaUserCircle, FaBars, FaTimes
} from 'react-icons/fa';
import NotificationDropdown from '@/components/admin/notifications/NotificationDropdown';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: <FaHome /> },
    { name: 'User Management', href: '/admin/users', icon: <FaUsers /> },
    { name: 'Product Management', href: '/admin/products', icon: <FaShoppingCart /> },
    { name: 'Rebate Management', href: '/admin/rebates', icon: <FaWallet /> },
    { name: 'Rebate Configurations', href: '/admin/rebate-configs', icon: <FaPercentage /> },
    { name: 'Reports', href: '/admin/reports', icon: <FaChartLine /> },
    { name: 'Test Users', href: '/admin/test-users', icon: <FaUsersCog /> },
    { name: 'Test Data', href: '/admin/test-data', icon: <FaClipboardList /> },
    { name: 'Settings', href: '/admin/settings', icon: <FaCog /> },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Desktop */}
      <div
        className={`bg-white shadow-md hidden md:block transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`p-4 border-b flex ${sidebarCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <div className="relative w-10 h-10 mr-2">
                <Image
                  src="/images/20250503.svg"
                  alt="Extreme Life Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="text-xl font-semibold">Extreme Life Admin</h2>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="relative w-10 h-10">
              <Image
                src="/images/20250503.svg"
                alt="Extreme Life Logo"
                fill
                className="object-contain"
              />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <nav className="mt-4">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <span className={`${sidebarCollapsed ? 'text-xl' : 'mr-3'}`}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <Link
            href="/dashboard"
            className={`flex items-center text-gray-700 hover:text-blue-600 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <FaHome className={`${sidebarCollapsed ? 'text-xl' : 'mr-3'}`} />
            {!sidebarCollapsed && <span>Back to Main App</span>}
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Sidebar - Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <div className="relative w-10 h-10 mr-2">
              <Image
                src="/images/20250503.svg"
                alt="Extreme Life Logo"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold">Extreme Life Admin</h2>
          </div>
          <button
            onClick={toggleMobileSidebar}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="mt-4">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={toggleMobileSidebar}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-700 hover:text-blue-600"
            onClick={toggleMobileSidebar}
          >
            <FaHome className="mr-3" />
            <span>Back to Main App</span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  className="p-2 rounded-md text-gray-500 md:hidden"
                  onClick={toggleMobileSidebar}
                >
                  <FaBars />
                </button>
                <Link href="/admin" className="flex items-center ml-2 md:ml-0">
                  <div className="relative w-8 h-8 mr-2">
                    <Image
                      src="/images/20250503.svg"
                      alt="Extreme Life Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-xl font-semibold text-blue-700">Extreme Life Admin</h1>
                </Link>
              </div>
              <div className="flex items-center">
                {session ? (
                  <div className="flex items-center">
                    <div className="mr-4">
                      <NotificationDropdown />
                    </div>
                    <div className="hidden md:flex items-center mr-4 text-sm text-gray-700">
                      <FaUserCircle className="mr-2" />
                      <span>{session.user?.name || session.user?.email}</span>
                    </div>
                    <Link href="/api/auth/signout" className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center">
                      <FaSignOutAlt className="mr-2" />
                      <span className="hidden md:inline">Sign Out</span>
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
        <main className="flex-1 overflow-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
