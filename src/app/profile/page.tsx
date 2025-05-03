"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { FaUser, FaEdit, FaCheck, FaTimes, FaSpinner, FaKey } from "react-icons/fa";
import Image from "next/image";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  rankId: number;
  walletBalance: number;
  createdAt: string;
  rank: {
    id: number;
    name: string;
    level: number;
  };
  upline: {
    id: number;
    name: string;
    email: string;
  } | null;
  _count: {
    downline: number;
    purchases: number;
    rebatesReceived: number;
  };
  stats: {
    totalPurchases: number;
    totalRebatesReceived: number;
    totalRebatesGenerated: number;
    directDownlineCount: number;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    profileImage: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      // Get the user ID from the session
      const userEmail = session?.user?.email;
      
      if (!userEmail) {
        throw new Error("User email not found in session");
      }
      
      // First, get the user ID
      const usersResponse = await fetch(`/api/users?search=${encodeURIComponent(userEmail)}`);
      const usersData = await usersResponse.json();
      
      if (!usersData.users || usersData.users.length === 0) {
        throw new Error("User not found");
      }
      
      const userId = usersData.users[0].id;
      
      // Then, get the detailed profile
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      
      const data = await response.json();
      setProfile(data);
      
      // Initialize form data
      setFormData({
        name: data.name,
        phone: data.phone || "",
        profileImage: data.profileImage || "",
      });
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setError(error.message || "An error occurred while fetching profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!profile) {
        throw new Error("Profile not loaded");
      }

      const updateData = {
        name: formData.name,
        phone: formData.phone || null,
        profileImage: formData.profileImage || null,
      };

      // Add password data if changing password
      if (changePassword) {
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
          throw new Error("New passwords don't match");
        }

        Object.assign(updateData, {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmNewPassword: passwordData.confirmNewPassword,
        });
      }

      const response = await fetch(`/api/users/${profile.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Refresh profile data
      await fetchProfile();
      
      setSuccessMessage("Profile updated successfully");
      setEditMode(false);
      setChangePassword(false);
      
      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone || "",
        profileImage: profile.profileImage || "",
      });
    }
    
    // Reset password fields
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    
    setEditMode(false);
    setChangePassword(false);
    setError("");
  };

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-semibold mb-6 flex items-center">
          <FaUser className="mr-2 text-blue-500" /> User Profile
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
            {successMessage}
          </div>
        )}

        {profile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {editMode ? (
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center relative">
                      {formData.profileImage ? (
                        <img
                          src={formData.profileImage}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-gray-400 text-5xl" />
                      )}
                      <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer">
                        <span className="text-white text-sm">Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-gray-400 text-5xl" />
                      )}
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-semibold">{profile.name}</h2>
                <p className="text-gray-500 mb-2">{profile.email}</p>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  {profile.rank.name}
                </div>

                <div className="w-full mt-4">
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <FaEdit className="mr-2" /> Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        <FaTimes className="mr-2" /> Cancel
                      </button>
                      <button
                        type="submit"
                        form="profile-form"
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={saving}
                      >
                        {saving ? (
                          <FaSpinner className="animate-spin mr-2" />
                        ) : (
                          <FaCheck className="mr-2" />
                        )}
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

              <form id="profile-form" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    ) : (
                      <p className="text-gray-900">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900">{profile.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Email address cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.phone || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upline
                    </label>
                    <p className="text-gray-900">
                      {profile.upline
                        ? `${profile.upline.name} (${profile.upline.email})`
                        : "None"}
                    </p>
                  </div>

                  {editMode && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-medium">Change Password</h3>
                        <button
                          type="button"
                          onClick={() => setChangePassword(!changePassword)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <FaKey className="mr-1" />
                          {changePassword ? "Cancel" : "Change"}
                        </button>
                      </div>

                      {changePassword && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                              minLength={8}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              name="confirmNewPassword"
                              value={passwordData.confirmNewPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6 md:col-span-3">
              <h2 className="text-lg font-semibold mb-4">Account Statistics</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Wallet Balance</p>
                  <p className="text-xl font-semibold">₱{profile.walletBalance.toFixed(2)}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <p className="text-xl font-semibold">₱{profile.stats.totalPurchases.toFixed(2)}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Total Rebates Received</p>
                  <p className="text-xl font-semibold">₱{profile.stats.totalRebatesReceived.toFixed(2)}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Total Rebates Generated</p>
                  <p className="text-xl font-semibold">₱{profile.stats.totalRebatesGenerated.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Direct Downline</p>
                  <p className="text-xl font-semibold">{profile.stats.directDownlineCount}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Total Downline</p>
                  <p className="text-xl font-semibold">{profile._count.downline}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <p className="text-xl font-semibold">{profile._count.purchases}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Rebate Transactions</p>
                  <p className="text-xl font-semibold">{profile._count.rebatesReceived}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Profile not found.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
