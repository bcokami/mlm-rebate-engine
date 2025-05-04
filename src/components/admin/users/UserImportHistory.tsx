"use client";

import { useState, useEffect } from "react";
import { FaHistory, FaSpinner, FaUser, FaCalendarAlt, FaFileImport, FaFileExport } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface UserAudit {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
  };
}

interface UserImportHistoryProps {
  limit?: number;
}

export default function UserImportHistory({ limit = 10 }: UserImportHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<UserAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch audit logs on component mount
  useEffect(() => {
    fetchAuditLogs();
  }, []);
  
  // Fetch audit logs from API
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/users/audit?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }
      
      const data = await response.json();
      setAuditLogs(data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setError("Failed to fetch audit logs");
      toast.error("Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Parse audit details
  const parseDetails = (detailsJson: string) => {
    try {
      return JSON.parse(detailsJson);
    } catch (error) {
      return null;
    }
  };
  
  // Render action icon
  const renderActionIcon = (action: string) => {
    switch (action) {
      case "import":
        return <FaFileImport className="text-blue-500" />;
      case "bulk_import":
        return <FaFileImport className="text-green-500" />;
      case "export":
        return <FaFileExport className="text-purple-500" />;
      default:
        return <FaHistory className="text-gray-500" />;
    }
  };
  
  // Render action description
  const renderActionDescription = (audit: UserAudit) => {
    const details = parseDetails(audit.details);
    
    switch (audit.action) {
      case "import":
        return "Imported a single user";
      case "bulk_import":
        if (details) {
          return `Imported ${details.successful} users (${details.totalProcessed} processed, ${details.failed} failed, ${details.duplicates} duplicates)`;
        }
        return "Bulk imported users";
      case "export":
        return "Exported user data";
      default:
        return audit.action;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span>Loading audit logs...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }
  
  if (auditLogs.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-gray-700">No import/export history found.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Import/Export History</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Recent user import and export activities.
        </p>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {auditLogs.map((audit) => (
          <li key={audit.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4">
                  {renderActionIcon(audit.action)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {renderActionDescription(audit)}
                  </p>
                  <div className="flex mt-1">
                    <div className="flex items-center text-xs text-gray-500 mr-4">
                      <FaUser className="mr-1" />
                      {audit.user.name}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <FaCalendarAlt className="mr-1" />
                      {formatDate(audit.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
