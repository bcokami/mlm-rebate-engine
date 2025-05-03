"use client";

import { useState, useEffect } from "react";
import { 
  FaSearch, FaFilter, FaEdit, FaTrash, FaUserPlus, 
  FaSpinner, FaChevronDown, FaChevronUp, FaEye, 
  FaCheck, FaTimes, FaUserCog
} from "react-icons/fa";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  rankId: number;
  uplineId: number | null;
  walletBalance: number;
  createdAt: string;
  rank: {
    name: string;
  };
  upline: {
    id: number;
    name: string;
    email: string;
  } | null;
  _count: {
    downline: number;
  };
}

interface Rank {
  id: number;
  name: string;
  level: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const UserManager: React.FC = () => {
  // State for users and loading
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  // State for filters
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // State for user details and editing
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rankId: "",
    uplineId: "",
  });

  // State for messages
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
    fetchRanks();
  }, [pagination.page, pagination.pageSize, search, rankFilter]);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("pageSize", pagination.pageSize.toString());
      
      if (search) {
        params.append("search", search);
      }
      
      if (rankFilter) {
        params.append("rankId", rankFilter);
      }
      
      const response = await fetch(`/api/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({
        type: "error",
        text: "Failed to fetch users. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch ranks from API
  const fetchRanks = async () => {
    try {
      const response = await fetch("/api/ranks");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ranks: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRanks(data);
    } catch (error) {
      console.error("Error fetching ranks:", error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle rank filter change
  const handleRankFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRankFilter(e.target.value);
    // Reset to first page when filtering
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value);
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newPageSize,
      page: 1 // Reset to first page when changing page size
    }));
  };

  // View user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    setShowEditForm(false);
  };

  // Edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      rankId: user.rankId.toString(),
      uplineId: user.uplineId ? user.uplineId.toString() : "",
    });
    setShowEditForm(true);
    setShowUserDetails(false);
  };

  // Handle edit form input change
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle edit form submit
  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editFormData.name,
          phone: editFormData.phone || null,
          rankId: parseInt(editFormData.rankId),
          uplineId: editFormData.uplineId ? parseInt(editFormData.uplineId) : null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }
      
      setMessage({
        type: "success",
        text: "User updated successfully",
      });
      
      // Refresh users list
      fetchUsers();
      
      // Close edit form
      setShowEditForm(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred while updating the user",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset wallet balance
  const handleResetWalletBalance = async (userId: number) => {
    if (!confirm("Are you sure you want to reset this user's wallet balance to 0?")) {
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch(`/api/users/${userId}/wallet/reset`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reset wallet balance");
      }
      
      setMessage({
        type: "success",
        text: "Wallet balance reset successfully",
      });
      
      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred while resetting wallet balance",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filters */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-700"
              >
                Search
              </button>
            </div>
          </form>
          
          <div className="flex items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <FaFilter className="mr-2" />
              Filters
              {showFilters ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
            </button>
          </div>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rank
                </label>
                <select
                  value={rankFilter}
                  onChange={handleRankFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Ranks</option>
                  {ranks.map(rank => (
                    <option key={rank.id} value={rank.id.toString()}>
                      {rank.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Message Display */}
      {message.text && (
        <div
          className={`mx-6 mt-4 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      
      {/* Users Table */}
      <div className="overflow-x-auto">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span>Loading users...</span>
          </div>
        ) : users.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {user.profileImage ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.profileImage}
                            alt={user.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.phone || "No phone"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.rank.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user._count.downline}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₱{user.walletBalance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit User"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleResetWalletBalance(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Reset Wallet Balance"
                      >
                        <FaUserCog />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {users.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-2">
              Rows per page:
            </span>
            <select
              value={pagination.pageSize}
              onChange={handlePageSizeChange}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">
              {pagination.page} of {pagination.totalPages} pages
              ({pagination.totalItems} total users)
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="h-20 w-20 flex-shrink-0">
                  {selectedUser.profileImage ? (
                    <img
                      className="h-20 w-20 rounded-full"
                      src={selectedUser.profileImage}
                      alt={selectedUser.name}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-2xl font-medium">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-6">
                  <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="mt-1">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {selectedUser.rank.name}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                  <p className="text-gray-900">{selectedUser.phone || "Not provided"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Wallet Balance</h4>
                  <p className="text-gray-900">₱{selectedUser.walletBalance.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Upline</h4>
                  <p className="text-gray-900">
                    {selectedUser.upline
                      ? `${selectedUser.upline.name} (${selectedUser.upline.email})`
                      : "None"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Downline Count</h4>
                  <p className="text-gray-900">{selectedUser._count.downline}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Member Since</h4>
                  <p className="text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    handleEditUser(selectedUser);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit User
                </button>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditForm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleEditFormSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rank
                  </label>
                  <select
                    name="rankId"
                    value={editFormData.rankId}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {ranks.map(rank => (
                      <option key={rank.id} value={rank.id.toString()}>
                        {rank.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upline ID
                  </label>
                  <input
                    type="text"
                    name="uplineId"
                    value={editFormData.uplineId}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave empty for no upline"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin inline mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
