"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import UserManager from "@/components/admin/UserManager";
import { FaUsers } from "react-icons/fa";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is admin
      const checkAdminStatus = async () => {
        try {
          const response = await fetch("/api/users/me");
          const data = await response.json();

          // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
          setIsAdmin(data.rankId === 6);
          setLoading(false);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setLoading(false);
        }
      };

      checkAdminStatus();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">
              You do not have permission to access this page. Please contact an administrator.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
            <FaUsers className="mr-2 text-blue-500" /> User Management
          </h1>
        </div>

        <UserManager />
      </div>
    </MainLayout>
  );
}
