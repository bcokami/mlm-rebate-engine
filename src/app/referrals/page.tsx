"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { 
  FaSpinner, 
  FaLink, 
  FaChartLine, 
  FaShoppingCart, 
  FaUsers, 
  FaMoneyBillWave,
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
  FaTrash,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

interface ShareableLink {
  id: number;
  userId: number;
  productId: number | null;
  code: string;
  type: string;
  title: string | null;
  description: string | null;
  customImage: string | null;
  isActive: boolean;
  expiresAt: string | null;
  clickCount: number;
  conversionCount: number;
  totalRevenue: number;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: number;
    name: string;
    price: number;
    image: string | null;
    referralCommissionType: string | null;
    referralCommissionValue: number | null;
  };
}

interface ReferralStats {
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
}

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<ShareableLink[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch shareable links
  useEffect(() => {
    if (status === "authenticated") {
      fetchShareableLinks();
    }
  }, [status]);
  
  const fetchShareableLinks = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch("/api/shareable-links?includeStats=true");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shareable links: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLinks(data.links || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching shareable links:", error);
      setMessage({
        type: "error",
        text: "Failed to load shareable links. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleLinkStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch("/api/shareable-links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          isActive,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update link: ${response.statusText}`);
      }
      
      // Update the link in the state
      setLinks(links.map(link => 
        link.id === id ? { ...link, isActive } : link
      ));
      
      setMessage({
        type: "success",
        text: `Link ${isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating link:", error);
      setMessage({
        type: "error",
        text: "Failed to update link. Please try again.",
      });
    }
  };
  
  const deleteLink = async (id: number) => {
    if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/shareable-links?id=${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete link: ${response.statusText}`);
      }
      
      // Remove the link from the state
      setLinks(links.filter(link => link.id !== id));
      
      setMessage({
        type: "success",
        text: "Link deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting link:", error);
      setMessage({
        type: "error",
        text: "Failed to delete link. Please try again.",
      });
    }
  };
  
  const copyToClipboard = async (id: number, code: string) => {
    try {
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/s/${code}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinkId(id);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinkId(null);
      }, 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      setMessage({
        type: "error",
        text: "Failed to copy link to clipboard",
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <FaSpinner className="animate-spin text-green-500 mr-2" />
          <span>Loading...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Referrals</h1>
        
        {/* Message display */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {message.text}
          </div>
        )}
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FaLink className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Links</div>
                  <div className="text-xl font-bold">{stats.totalLinks}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <FaChartLine className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Clicks / Conversions</div>
                  <div className="text-xl font-bold">
                    {stats.totalClicks} / {stats.totalConversions}
                    <span className="text-sm text-gray-500 ml-2">
                      ({stats.conversionRate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <FaShoppingCart className="text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                  <div className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <FaMoneyBillWave className="text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Commissions</div>
                  <div className="text-xl font-bold">{formatCurrency(stats.totalCommission)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Links Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">My Shareable Links</h2>
          </div>
          
          <div className="p-4">
            {links.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>You haven't created any shareable links yet.</p>
                <p className="mt-2">
                  Visit the <Link href="/shop" className="text-blue-600 hover:underline">shop</Link> to share products and earn commissions!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {links.map((link) => (
                      <tr key={link.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {link.product?.image ? (
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                <Image
                                  src={link.product.image}
                                  alt={link.product.name}
                                  width={40}
                                  height={40}
                                  className="rounded-md object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                                <FaShoppingCart className="text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {link.product?.name || link.title || "Product"}
                              </div>
                              {link.product && (
                                <div className="text-sm text-gray-500">
                                  {formatCurrency(link.product.price)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">
                              {`${window.location.origin}/s/${link.code}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(link.id, link.code)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Copy link"
                            >
                              {copiedLinkId === link.id ? (
                                <FaCheck className="text-green-600" />
                              ) : (
                                <FaCopy />
                              )}
                            </button>
                          </div>
                          <div className="mt-1">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              link.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <FaChartLine className="text-blue-500 mr-1" />
                              <span>{link.clickCount} clicks</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <FaShoppingCart className="text-green-500 mr-1" />
                              <span>{link.conversionCount} purchases</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>Revenue: {formatCurrency(link.totalRevenue)}</div>
                            <div className="font-medium text-green-600">
                              Commission: {formatCurrency(link.totalCommission)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(link.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <a
                              href={`/s/${link.code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="Open link"
                            >
                              <FaExternalLinkAlt />
                            </a>
                            <button
                              type="button"
                              onClick={() => toggleLinkStatus(link.id, !link.isActive)}
                              className={`${
                                link.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                              }`}
                              title={link.isActive ? 'Deactivate link' : 'Activate link'}
                            >
                              {link.isActive ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteLink(link.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete link"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Start Earning Today!</h3>
          <p className="text-gray-700 mb-4">
            Share products with your friends and family and earn commissions on every purchase they make.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Browse Products to Share
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
