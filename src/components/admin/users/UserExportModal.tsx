"use client";

import { useState, useEffect } from "react";
import { FaDownload, FaSpinner, FaTimes, FaFileExcel } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface UserExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Rank {
  id: number;
  name: string;
  level: number;
}

interface ExportOptions {
  includeRank: boolean;
  includeDownlineCount: boolean;
  includeJoinDate: boolean;
  includeEarnings: boolean;
  rankFilter?: number;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  activeOnly: boolean;
}

export default function UserExportModal({
  isOpen,
  onClose,
}: UserExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeRank: true,
    includeDownlineCount: true,
    includeJoinDate: true,
    includeEarnings: false,
    activeOnly: false,
  });
  
  // Fetch ranks on component mount
  useEffect(() => {
    if (isOpen) {
      fetchRanks();
    }
  }, [isOpen]);
  
  // Fetch ranks from API
  const fetchRanks = async () => {
    setIsLoadingRanks(true);
    
    try {
      const response = await fetch("/api/ranks");
      
      if (!response.ok) {
        throw new Error("Failed to fetch ranks");
      }
      
      const data = await response.json();
      setRanks(data);
    } catch (error) {
      console.error("Error fetching ranks:", error);
      toast.error("Failed to fetch ranks");
    } finally {
      setIsLoadingRanks(false);
    }
  };
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Create a form to submit the export request
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/admin/users/export";
      form.target = "_blank";
      
      // Add options as hidden fields
      const optionsField = document.createElement("input");
      optionsField.type = "hidden";
      optionsField.name = "options";
      optionsField.value = JSON.stringify(options);
      form.appendChild(optionsField);
      
      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      // Show success toast
      toast.success("Export started. Your download will begin shortly.");
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error exporting users:", error);
      toast.error("Failed to export users: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Export Users</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Export Options</h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeRank"
                    checked={options.includeRank}
                    onChange={(e) => setOptions({ ...options, includeRank: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeRank" className="ml-2 block text-sm text-gray-700">
                    Include Rank
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeDownlineCount"
                    checked={options.includeDownlineCount}
                    onChange={(e) => setOptions({ ...options, includeDownlineCount: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeDownlineCount" className="ml-2 block text-sm text-gray-700">
                    Include Downline Count
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeJoinDate"
                    checked={options.includeJoinDate}
                    onChange={(e) => setOptions({ ...options, includeJoinDate: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeJoinDate" className="ml-2 block text-sm text-gray-700">
                    Include Join Date
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeEarnings"
                    checked={options.includeEarnings}
                    onChange={(e) => setOptions({ ...options, includeEarnings: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeEarnings" className="ml-2 block text-sm text-gray-700">
                    Include Earnings
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activeOnly"
                    checked={options.activeOnly}
                    onChange={(e) => setOptions({ ...options, activeOnly: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activeOnly" className="ml-2 block text-sm text-gray-700">
                    Active Users Only
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Rank
                </label>
                <select
                  value={options.rankFilter || ""}
                  onChange={(e) => setOptions({
                    ...options,
                    rankFilter: e.target.value ? parseInt(e.target.value) : undefined,
                  })}
                  className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Ranks</option>
                  {isLoadingRanks ? (
                    <option disabled>Loading ranks...</option>
                  ) : (
                    ranks.map((rank) => (
                      <option key={rank.id} value={rank.id}>
                        {rank.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date From
                  </label>
                  <input
                    type="date"
                    value={options.dateRangeStart || ""}
                    onChange={(e) => setOptions({
                      ...options,
                      dateRangeStart: e.target.value || undefined,
                    })}
                    className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date To
                  </label>
                  <input
                    type="date"
                    value={options.dateRangeEnd || ""}
                    onChange={(e) => setOptions({
                      ...options,
                      dateRangeEnd: e.target.value || undefined,
                    })}
                    className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isExporting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <FaFileExcel className="mr-2" />
                  Export to Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
