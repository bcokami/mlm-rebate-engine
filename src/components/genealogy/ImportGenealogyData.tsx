"use client";

import { useState, useRef } from 'react';
import { 
  FaFileImport, 
  FaFileExcel, 
  FaFileCsv, 
  FaFileCode, 
  FaSpinner, 
  FaCheck, 
  FaTimes,
  FaInfoCircle,
  FaExclamationTriangle,
  FaDatabase,
  FaCloudUploadAlt
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface ImportGenealogyDataProps {
  onImportComplete?: (data: any) => void;
}

/**
 * Import Genealogy Data Component
 * 
 * Provides options for importing genealogy data from external systems
 */
export default function ImportGenealogyData({ onImportComplete }: ImportGenealogyDataProps) {
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'csv' | 'json'>('excel');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<any[] | null>(null);
  const [mappingFields, setMappingFields] = useState<boolean>(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [requiredFields] = useState<string[]>([
    'id',
    'name',
    'email',
    'uplineId',
    'rankName',
  ]);
  
  // Reference to file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setUploadSuccess(null);
    setUploadError(null);
    setImportedData(null);
    
    // Determine file type from extension
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'xlsx' || extension === 'xls') {
      setFileType('excel');
    } else if (extension === 'csv') {
      setFileType('csv');
    } else if (extension === 'json') {
      setFileType('json');
    } else {
      setUploadError('Unsupported file type. Please upload an Excel, CSV, or JSON file.');
      setFile(null);
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadSuccess(null);
    setUploadError(null);
    
    try {
      let data: any[] = [];
      
      // Parse file based on type
      if (fileType === 'excel' || fileType === 'csv') {
        data = await parseExcelOrCsv(file);
      } else if (fileType === 'json') {
        data = await parseJson(file);
      }
      
      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data found in the file.');
      }
      
      // Set imported data
      setImportedData(data);
      
      // Get available fields from the first row
      if (data.length > 0) {
        setAvailableFields(Object.keys(data[0]));
      }
      
      // Show field mapping UI
      setMappingFields(true);
      
      setUploadSuccess(true);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Parse Excel or CSV file
  const parseExcelOrCsv = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          
          if (!data) {
            reject(new Error('Failed to read file.'));
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      
      reader.readAsBinaryString(file);
    });
  };
  
  // Parse JSON file
  const parseJson = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          
          if (!data) {
            reject(new Error('Failed to read file.'));
            return;
          }
          
          const jsonData = JSON.parse(data as string);
          
          // Check if it's an array
          if (!Array.isArray(jsonData)) {
            reject(new Error('JSON file must contain an array of objects.'));
            return;
          }
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Handle field mapping change
  const handleFieldMappingChange = (requiredField: string, mappedField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [requiredField]: mappedField,
    }));
  };
  
  // Handle import
  const handleImport = async () => {
    if (!importedData) return;
    
    setIsUploading(true);
    
    try {
      // Map fields
      const mappedData = importedData.map(item => {
        const mappedItem: Record<string, any> = {};
        
        // Map each required field
        Object.entries(fieldMapping).forEach(([requiredField, mappedField]) => {
          if (mappedField && item[mappedField] !== undefined) {
            mappedItem[requiredField] = item[mappedField];
          }
        });
        
        return mappedItem;
      });
      
      // Validate mapped data
      const missingFields: string[] = [];
      
      requiredFields.forEach(field => {
        if (!fieldMapping[field]) {
          missingFields.push(field);
        }
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // In a real application, you would send this data to the server
      // For now, we'll just call the onImportComplete callback
      if (onImportComplete) {
        onImportComplete(mappedData);
      }
      
      // Reset state
      setFile(null);
      setImportedData(null);
      setMappingFields(false);
      setFieldMapping({});
      setUploadSuccess(true);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    setFile(null);
    setImportedData(null);
    setMappingFields(false);
    setFieldMapping({});
    setUploadSuccess(null);
    setUploadError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <FaFileImport className="mr-2 text-blue-500" />
        Import Genealogy Data
      </h3>
      
      {!mappingFields ? (
        <>
          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select File to Import
            </label>
            <div className="flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv,.json"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer truncate"
              >
                {file ? file.name : 'Choose file...'}
              </label>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  'Upload'
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Supported file types: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
            </p>
          </div>
          
          {/* Supported File Types */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 border rounded-md flex flex-col items-center">
              <FaFileExcel className="text-green-500 text-2xl mb-2" />
              <div className="text-sm font-medium">Excel</div>
              <div className="text-xs text-gray-500">.xlsx, .xls</div>
            </div>
            <div className="p-3 border rounded-md flex flex-col items-center">
              <FaFileCsv className="text-blue-500 text-2xl mb-2" />
              <div className="text-sm font-medium">CSV</div>
              <div className="text-xs text-gray-500">.csv</div>
            </div>
            <div className="p-3 border rounded-md flex flex-col items-center">
              <FaFileCode className="text-yellow-500 text-2xl mb-2" />
              <div className="text-sm font-medium">JSON</div>
              <div className="text-xs text-gray-500">.json</div>
            </div>
          </div>
          
          {/* Import Instructions */}
          <div className="bg-blue-50 p-3 rounded-md mb-4">
            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
              <FaInfoCircle className="mr-1" />
              Import Instructions
            </h4>
            <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
              <li>Prepare your data in Excel, CSV, or JSON format</li>
              <li>Ensure your file includes required fields: ID, Name, Email, Upline ID, and Rank</li>
              <li>Upload the file and map the fields to the required fields</li>
              <li>Review the data before importing</li>
              <li>Click Import to add the data to your genealogy</li>
            </ul>
          </div>
          
          {/* External System Integration */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-medium mb-2">Import from External Systems</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="p-3 border rounded-md flex items-center justify-center hover:bg-gray-50"
                onClick={() => alert('CRM integration would be implemented here')}
              >
                <FaDatabase className="mr-2 text-purple-500" />
                <span>Import from CRM</span>
              </button>
              <button
                type="button"
                className="p-3 border rounded-md flex items-center justify-center hover:bg-gray-50"
                onClick={() => alert('Cloud integration would be implemented here')}
              >
                <FaCloudUploadAlt className="mr-2 text-blue-500" />
                <span>Import from Cloud</span>
              </button>
            </div>
          </div>
          
          {/* Upload Status */}
          {uploadSuccess !== null && (
            <div className={`mt-4 p-3 rounded-md ${
              uploadSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center">
                {uploadSuccess ? (
                  <>
                    <FaCheck className="mr-2" />
                    <span>File uploaded successfully! Please map the fields.</span>
                  </>
                ) : (
                  <>
                    <FaTimes className="mr-2" />
                    <span>Upload failed: {uploadError}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Field Mapping */}
          <div className="mb-4">
            <h4 className="font-medium mb-2 flex items-center">
              <FaExclamationTriangle className="mr-2 text-yellow-500" />
              Map Fields
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Please map the fields from your file to the required fields in our system.
            </p>
            
            <div className="space-y-3">
              {requiredFields.map(requiredField => (
                <div key={requiredField} className="flex items-center">
                  <div className="w-1/3 font-medium text-sm">
                    {requiredField.charAt(0).toUpperCase() + requiredField.slice(1)}:
                  </div>
                  <div className="w-2/3">
                    <select
                      value={fieldMapping[requiredField] || ''}
                      onChange={(e) => handleFieldMappingChange(requiredField, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select Field --</option>
                      {availableFields.map(field => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Data Preview */}
          {importedData && importedData.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Data Preview</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(importedData[0]).slice(0, 5).map(key => (
                        <th
                          key={key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importedData.slice(0, 3).map((row, index) => (
                      <tr key={index}>
                        {Object.keys(row).slice(0, 5).map(key => (
                          <td
                            key={key}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {String(row[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importedData.length > 3 && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    Showing 3 of {importedData.length} rows
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Import Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                'Import Data'
              )}
            </button>
          </div>
          
          {/* Upload Status */}
          {uploadSuccess === false && (
            <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700">
              <div className="flex items-center">
                <FaTimes className="mr-2" />
                <span>Import failed: {uploadError}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
