"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { 
  FaSpinner, 
  FaCalendarAlt, 
  FaPlus, 
  FaPlay, 
  FaCheck, 
  FaTimes, 
  FaClock,
  FaSave
} from "react-icons/fa";

interface MonthlyCutoff {
  id: number;
  year: number;
  month: number;
  cutoffDay: number;
  processedAt: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MonthlyCutoffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cutoffs, setCutoffs] = useState<MonthlyCutoff[]>([]);
  const [currentCutoff, setCurrentCutoff] = useState<MonthlyCutoff | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  
  // Form state for new cutoff
  const [showForm, setShowForm] = useState(false);
  const [newCutoff, setNewCutoff] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    cutoffDay: 25,
    notes: "",
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch cutoff data
  useEffect(() => {
    if (status === "authenticated") {
      fetchCutoffs();
      fetchCurrentCutoff();
    }
  }, [status]);
  
  const fetchCutoffs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mlm-config/cutoff?action=list");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cutoffs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCutoffs(data.cutoffs || []);
    } catch (error) {
      console.error("Error fetching cutoffs:", error);
      setMessage({
        type: "error",
        text: "Failed to load cutoff data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCurrentCutoff = async () => {
    try {
      const response = await fetch("/api/mlm-config/cutoff?action=current");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch current cutoff: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCurrentCutoff(data.cutoff);
    } catch (error) {
      console.error("Error fetching current cutoff:", error);
    }
  };
  
  const createCutoff = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch("/api/mlm-config/cutoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...newCutoff,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create cutoff: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setMessage({
        type: "success",
        text: "Monthly cutoff created successfully.",
      });
      
      // Reset form and refresh data
      setShowForm(false);
      setNewCutoff({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        cutoffDay: 25,
        notes: "",
      });
      
      fetchCutoffs();
      fetchCurrentCutoff();
    } catch (error) {
      console.error("Error creating cutoff:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create cutoff. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const processCutoff = async (year: number, month: number) => {
    setProcessing(true);
    setMessage({ type: "", text: "" });
    
    try {
      const response = await fetch("/api/mlm-config/cutoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "process",
          year,
          month,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process cutoff: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setMessage({
        type: "success",
        text: `Monthly commissions processed successfully. ${data.result.summary.succeeded} users processed, ${data.result.summary.failed} failed.`,
      });
      
      // Refresh data
      fetchCutoffs();
    } catch (error) {
      console.error("Error processing cutoff:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to process cutoff. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleInputChange = (key: string, value: any) => {
    setNewCutoff({
      ...newCutoff,
      [key]: value,
    });
  };
  
  const getMonthName = (month: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock />;
      case 'processing':
        return <FaSpinner className="animate-spin" />;
      case 'completed':
        return <FaCheck />;
      case 'failed':
        return <FaTimes />;
      default:
        return null;
    }
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
        <h1 className="text-2xl font-bold mb-6">Monthly Cutoff Management</h1>
        
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
        
        {/* Current Cutoff */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Current/Upcoming Cutoff</h2>
          </div>
          
          <div className="p-6">
            {currentCutoff ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium">
                    {getMonthName(currentCutoff.month)} {currentCutoff.year}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Cutoff Day: {currentCutoff.cutoffDay}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(currentCutoff.status)}`}>
                      {getStatusIcon(currentCutoff.status)}
                      <span className="ml-1">{currentCutoff.status.charAt(0).toUpperCase() + currentCutoff.status.slice(1)}</span>
                    </span>
                  </div>
                </div>
                
                {currentCutoff.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => processCutoff(currentCutoff.year, currentCutoff.month)}
                    disabled={processing}
                    className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="animate-spin inline mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaPlay className="inline mr-2" />
                        Process Now
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No current or upcoming cutoff scheduled. Click "Add Cutoff" to create one.
              </div>
            )}
          </div>
        </div>
        
        {/* Cutoff List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Cutoff History</h2>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <FaPlus className="inline mr-1" />
              Add Cutoff
            </button>
          </div>
          
          <div className="p-6">
            {/* New Cutoff Form */}
            {showForm && (
              <div className="mb-6 border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Add New Cutoff</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <select
                      value={newCutoff.year}
                      onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <select
                      value={newCutoff.month}
                      onChange={(e) => handleInputChange("month", parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>{getMonthName(month)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cutoff Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={newCutoff.cutoffDay}
                      onChange={(e) => handleInputChange("cutoffDay", parseInt(e.target.value))}
                      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newCutoff.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      rows={2}
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createCutoff}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin inline mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="inline mr-2" />
                        Save Cutoff
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Cutoff Table */}
            {cutoffs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No cutoff history found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cutoff Day
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed At
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cutoffs.map((cutoff) => (
                      <tr key={cutoff.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {getMonthName(cutoff.month)} {cutoff.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cutoff.cutoffDay}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(cutoff.status)}`}>
                            {getStatusIcon(cutoff.status)}
                            <span className="ml-1">{cutoff.status.charAt(0).toUpperCase() + cutoff.status.slice(1)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cutoff.processedAt 
                              ? new Date(cutoff.processedAt).toLocaleString() 
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {cutoff.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => processCutoff(cutoff.year, cutoff.month)}
                              disabled={processing}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaPlay className="inline" />
                              <span className="ml-1">Process</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
