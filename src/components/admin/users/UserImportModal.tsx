"use client";

import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FaUpload, FaSpinner, FaCheck, FaTimes, FaFileExcel, FaDownload, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportOptions {
  defaultPassword: string;
  skipDuplicates: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: {
    memberId: string;
    name: string;
    email: string;
    uplineId?: string | null;
    registrationDate?: string | null;
    rank?: string | null;
    phone?: string | null;
  };
  row: number;
}

interface ImportSummary {
  totalProcessed: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; errors: string[] }>;
  importedUsers: Array<{
    id: number;
    name: string;
    email: string;
    memberId: string;
    uplineId: number | null;
    rankId: number;
  }>;
}

export default function UserImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: UserImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [currentStep, setCurrentStep] = useState<"upload" | "validate" | "import" | "summary">("upload");
  const [options, setOptions] = useState<ImportOptions>({
    defaultPassword: "Password123!",
    skipDuplicates: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });
  
  // Handle file upload and validation
  const handleValidateFile = async () => {
    if (!file) return;
    
    setIsValidating(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(options));
      
      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to validate file");
      }
      
      const data = await response.json();
      setValidationResults(data.validationResults);
      setCurrentStep("validate");
    } catch (error) {
      console.error("Error validating file:", error);
      toast.error("Failed to validate file: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsValidating(false);
    }
  };
  
  // Handle import confirmation
  const handleConfirmImport = async () => {
    setIsImporting(true);
    
    try {
      // Filter only valid results
      const validData = validationResults.filter(result => result.isValid);
      
      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          validatedData: validData,
          options,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import users");
      }
      
      const summary = await response.json();
      setImportSummary(summary);
      setCurrentStep("summary");
      
      // Notify parent component
      onImportComplete();
      
      // Show success toast
      toast.success(`Successfully imported ${summary.successful} users`);
    } catch (error) {
      console.error("Error importing users:", error);
      toast.error("Failed to import users: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsImporting(false);
    }
  };
  
  // Handle download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/users/import", {
        method: "GET",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download template");
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "user_import_template.xlsx";
      
      // Append to the document and trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };
  
  // Reset the modal state
  const handleReset = () => {
    setFile(null);
    setValidationResults([]);
    setImportSummary(null);
    setCurrentStep("upload");
  };
  
  // Close the modal
  const handleClose = () => {
    handleReset();
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Import Users</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center ${currentStep === "upload" ? "text-blue-600" : "text-gray-500"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "upload" ? "bg-blue-100" : "bg-gray-100"}`}>
                1
              </div>
              <span className="ml-2">Upload</span>
            </div>
            <div className="w-12 h-1 mx-2 bg-gray-200"></div>
            <div className={`flex items-center ${currentStep === "validate" ? "text-blue-600" : "text-gray-500"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "validate" ? "bg-blue-100" : "bg-gray-100"}`}>
                2
              </div>
              <span className="ml-2">Validate</span>
            </div>
            <div className="w-12 h-1 mx-2 bg-gray-200"></div>
            <div className={`flex items-center ${currentStep === "summary" ? "text-blue-600" : "text-gray-500"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "summary" ? "bg-blue-100" : "bg-gray-100"}`}>
                3
              </div>
              <span className="ml-2">Complete</span>
            </div>
          </div>
          
          {currentStep === "upload" && (
            <>
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <FaInfoCircle className="text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Upload an Excel file (.xlsx) containing user data. You can download a template to get started.
                  </span>
                </div>
                
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <FaDownload className="mr-1" />
                    Download Template
                  </button>
                </div>
                
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <input {...getInputProps()} ref={fileInputRef} />
                  
                  <FaFileExcel className="mx-auto text-4xl text-green-500 mb-3" />
                  
                  {file ? (
                    <div>
                      <p className="text-lg font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-800">
                        Drag & drop an Excel file here
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        or click to select a file
                      </p>
                      <p className="text-xs text-gray-400">
                        Supported formats: .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">Import Options</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Password
                    </label>
                    <input
                      type="text"
                      value={options.defaultPassword}
                      onChange={(e) => setOptions({ ...options, defaultPassword: e.target.value })}
                      className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter default password for new users"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This password will be assigned to all imported users.
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="skipDuplicates"
                      checked={options.skipDuplicates}
                      onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="skipDuplicates" className="ml-2 block text-sm text-gray-700">
                      Skip duplicate users (based on email)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidateFile}
                  disabled={!file || isValidating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isValidating ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      Validate File
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          
          {currentStep === "validate" && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-800">Validation Results</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                      <span className="text-sm text-gray-600">
                        Valid: {validationResults.filter(r => r.isValid).length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                      <span className="text-sm text-gray-600">
                        Invalid: {validationResults.filter(r => !r.isValid).length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
                      <span className="text-sm text-gray-600">
                        Total: {validationResults.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                {validationResults.length === 0 ? (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex">
                      <FaExclamationTriangle className="text-yellow-400 mt-0.5 mr-2" />
                      <p className="text-sm text-yellow-700">
                        No data found in the uploaded file. Please check the file format and try again.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Row
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Member ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Upline
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Errors
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {validationResults.map((result, index) => (
                            <tr key={index} className={result.isValid ? "" : "bg-red-50"}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.row}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {result.isValid ? (
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    <FaCheck className="mr-1" /> Valid
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    <FaTimes className="mr-1" /> Invalid
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.data?.memberId || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.data?.name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.data?.email || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.data?.uplineId || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                                {result.errors.join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={validationResults.filter(r => r.isValid).length === 0 || isImporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isImporting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Confirm Import
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          
          {currentStep === "summary" && importSummary && (
            <>
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Import Completed Successfully
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          {importSummary.successful} users were successfully imported.
                          {importSummary.failed > 0 && ` ${importSummary.failed} users failed to import.`}
                          {importSummary.duplicates > 0 && ` ${importSummary.duplicates} duplicates were skipped.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border rounded-md p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {importSummary.successful}
                    </div>
                    <div className="text-sm text-gray-500">Successfully Imported</div>
                  </div>
                  
                  <div className="bg-white border rounded-md p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {importSummary.failed}
                    </div>
                    <div className="text-sm text-gray-500">Failed to Import</div>
                  </div>
                  
                  <div className="bg-white border rounded-md p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {importSummary.duplicates}
                    </div>
                    <div className="text-sm text-gray-500">Duplicates Skipped</div>
                  </div>
                </div>
                
                {importSummary.importedUsers.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Imported Users</h4>
                    
                    <div className="border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Member ID
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Upline ID
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {importSummary.importedUsers.map((user) => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.memberId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {user.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.uplineId || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                {importSummary.errors.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Errors</h4>
                    
                    <div className="border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Row
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Errors
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {importSummary.errors.map((error, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {error.row}
                                </td>
                                <td className="px-6 py-4 text-sm text-red-500">
                                  {error.errors.join(", ")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Import More Users
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
