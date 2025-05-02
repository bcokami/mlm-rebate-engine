"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import GenealogyTree from "@/components/genealogy/GenealogyTree";
import { FaUserPlus } from "react-icons/fa";

interface GenealogyUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    name: string;
  };
  level: number;
  _count: {
    downline: number;
  };
  children?: GenealogyUser[];
}

export default function GenealogyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [genealogy, setGenealogy] = useState<GenealogyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch genealogy data
      const fetchGenealogy = async () => {
        try {
          const response = await fetch("/api/genealogy");
          const data = await response.json();
          setGenealogy(data);

          // Generate referral link
          const baseUrl = window.location.origin;
          setReferralLink(`${baseUrl}/register?uplineId=${data.id}`);

          setLoading(false);
        } catch (error) {
          console.error("Error fetching genealogy:", error);
          setLoading(false);
        }
      };

      fetchGenealogy();
    }
  }, [status]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied to clipboard!");
  };

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-semibold mb-6">Genealogy Tree</h1>

        {/* Referral Link */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FaUserPlus className="mr-2 text-green-500" /> Your Referral Link
          </h2>
          <div className="flex">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Share this link with others to invite them to join your downline.
          </p>
        </div>

        {/* Genealogy Tree */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Your Downline</h2>

          {genealogy ? (
            <GenealogyTree
              data={genealogy}
              maxDepth={10}
              initialExpandedLevels={2}
            />
          ) : (
            <p className="text-gray-500">No genealogy data available.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
