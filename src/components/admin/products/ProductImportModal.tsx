"use client";

import { useState, useRef } from "react";
import { 
  FaUpload, 
  FaFileExcel, 
  FaDownload, 
  FaSpinner, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle 
} from "react-icons/fa";

interface ProductImportModalProps {
  onClose: () => void;
  onDownloadTemplate: () => void;
  onRefresh: () => void;
}

export default function ProductImportModal({
  onClose,
  onDownloadTemplate,
  onRefresh,
}: ProductImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };
  
  const validateAndSetFile = (selectedFile: File) => {
    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      alert("Please upload a valid Excel or CSV file");
      return;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      alert("File size exceeds the 5MB limit");
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload");
      return;
    }
    
    setUploading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      
      // Refresh product list if there were successful imports
      if (data.successful > 0) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setResult({
        error: error instanceof Error ? error.message : "An error occurred during upload",
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Import Products</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Upload an Excel or CSV file with product data. Make sure your file follows the required format.
            </p>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              <FaDownload className="mr-1" />
              Download Template
            </button>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
              dragging
                ? "border-blue-500 bg-blue-50"
                : file
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div>
                <FaFileExcel className="mx-auto h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm font-medium">
                  Drag and drop your file here, or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Supports Excel (.xlsx, .xls) and CSV files up to 5MB
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
          </div>
          
          {result && (
            <div className={`mb-6 p-4 rounded-md ${
              result.error
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}>
              {result.error ? (
                <div className="flex items-start">
                  <FaExclamationTriangle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Upload failed</p>
                    <p>{result.error}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <FaCheck className="h-5 w-5 mr-2" />
                    <p className="font-medium">Upload successful</p>
                  </div>
                  <ul className="list-disc list-inside text-sm ml-7">
                    <li>Total processed: {result.totalProcessed}</li>
                    <li>Successfully imported: {result.successful}</li>
                    <li>Failed: {result.failed}</li>
                  </ul>
                  
                  {result.failed > 0 && result.errors && (
                    <div className="mt-2">
                      <p className="font-medium">Errors:</p>
                      <div className="max-h-40 overflow-y-auto mt-1 bg-white bg-opacity-50 rounded p-2">
                        {result.errors.map((error: any, index: number) => (
                          <div key={index} className="text-sm mb-1">
                            <span className="font-medium">Row {error.row}:</span> {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`px-4 py-2 rounded-md flex items-center ${
                !file || uploading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
