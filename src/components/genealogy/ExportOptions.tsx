"use client";

import { useState } from 'react';
import { FaFileExport, FaFileCsv, FaFilePdf, FaFileExcel, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface ExportOptionsProps {
  userId: number;
  userName: string;
}

/**
 * Export Options Component
 * 
 * Provides options for exporting genealogy data in different formats
 */
export default function ExportOptions({ userId, userName }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [includePerformanceMetrics, setIncludePerformanceMetrics] = useState(true);
  const [maxLevels, setMaxLevels] = useState(3);
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);
    
    try {
      // Fetch genealogy data
      const response = await fetch(`/api/genealogy?userId=${userId}&maxLevel=${maxLevels}&includePerformanceMetrics=${includePerformanceMetrics}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch genealogy data');
      }
      
      const data = await response.json();
      
      // Process data for export
      const exportData = processDataForExport(data, includePerformanceMetrics);
      
      // Export based on format
      switch (exportFormat) {
        case 'excel':
          exportToExcel(exportData, `${userName}_genealogy`);
          break;
        case 'csv':
          exportToCSV(exportData, `${userName}_genealogy`);
          break;
        case 'pdf':
          await exportToPDF(exportData, `${userName}_genealogy`);
          break;
      }
      
      setExportSuccess(true);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : 'An unknown error occurred');
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Process data for export
  const processDataForExport = (data: any, includeMetrics: boolean) => {
    const flattenedData: any[] = [];
    
    // Function to flatten the tree structure
    const flattenTree = (node: any, level: number, parentName: string = '') => {
      const row: any = {
        ID: node.id,
        Name: node.name,
        Email: node.email,
        Rank: node.rank.name,
        Level: level,
        'Downline Count': node._count.downline,
        'Parent Name': parentName,
        'Joined Date': node.createdAt ? new Date(node.createdAt).toLocaleDateString() : 'N/A',
      };
      
      // Add wallet balance if available
      if (node.walletBalance !== undefined) {
        row['Wallet Balance'] = node.walletBalance;
      }
      
      // Add performance metrics if available and requested
      if (includeMetrics && node.performanceMetrics) {
        row['Personal Sales'] = node.performanceMetrics.personalSales;
        row['Team Sales'] = node.performanceMetrics.teamSales;
        row['Total Sales'] = node.performanceMetrics.totalSales;
        row['Rebates Earned'] = node.performanceMetrics.rebatesEarned;
        row['Team Size'] = node.performanceMetrics.teamSize;
        row['New Team Members (30d)'] = node.performanceMetrics.newTeamMembers;
      }
      
      flattenedData.push(row);
      
      // Process children recursively
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          flattenTree(child, level + 1, node.name);
        });
      }
    };
    
    // Start with the root node
    flattenTree(data, 0);
    
    return flattenedData;
  };
  
  // Export to Excel
  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Genealogy');
    
    // Auto-size columns
    const colWidths = data.reduce((acc, row) => {
      Object.keys(row).forEach(key => {
        const value = String(row[key]);
        acc[key] = Math.max(acc[key] || 0, value.length);
      });
      return acc;
    }, {} as Record<string, number>);
    
    worksheet['!cols'] = Object.keys(colWidths).map(key => ({ wch: colWidths[key] + 2 }));
    
    // Generate file
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };
  
  // Export to CSV
  const exportToCSV = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export to PDF
  const exportToPDF = async (data: any[], fileName: string) => {
    // For PDF export, we'll use a simple approach that works in the browser
    // In a real application, you might want to use a more robust PDF library
    
    // Create a table from the data
    let tableHTML = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">';
    
    // Add header row
    if (data.length > 0) {
      tableHTML += '<thead><tr style="background-color: #f2f2f2;">';
      Object.keys(data[0]).forEach(key => {
        tableHTML += `<th>${key}</th>`;
      });
      tableHTML += '</tr></thead>';
    }
    
    // Add data rows
    tableHTML += '<tbody>';
    data.forEach(row => {
      tableHTML += '<tr>';
      Object.values(row).forEach(value => {
        tableHTML += `<td>${value}</td>`;
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('Failed to open print window. Please check your popup blocker settings.');
    }
    
    // Write the HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #f2f2f2; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Genealogy Export: ${userName}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          ${tableHTML}
        </body>
      </html>
    `);
    
    // Wait for content to load
    printWindow.document.close();
    
    // Print the window (will show print dialog)
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <FaFileExport className="mr-2 text-blue-500" />
        Export Genealogy Data
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Export Format
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setExportFormat('excel')}
              className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md ${
                exportFormat === 'excel'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaFileExcel className="mr-2" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md ${
                exportFormat === 'csv'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaFileCsv className="mr-2" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('pdf')}
              className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md ${
                exportFormat === 'pdf'
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaFilePdf className="mr-2" />
              PDF
            </button>
          </div>
        </div>
        
        {/* Max Levels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Levels to Export
          </label>
          <select
            value={maxLevels}
            onChange={(e) => setMaxLevels(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1 Level (Direct Downline Only)</option>
            <option value={2}>2 Levels</option>
            <option value={3}>3 Levels</option>
            <option value={4}>4 Levels</option>
            <option value={5}>5 Levels</option>
            <option value={6}>6 Levels (Maximum)</option>
          </select>
        </div>
      </div>
      
      {/* Include Performance Metrics */}
      <div className="mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includePerformanceMetrics"
            checked={includePerformanceMetrics}
            onChange={(e) => setIncludePerformanceMetrics(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="includePerformanceMetrics" className="ml-2 block text-sm text-gray-700">
            Include Performance Metrics (sales, rebates, etc.)
          </label>
        </div>
      </div>
      
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
        >
          {isExporting ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <FaFileExport className="mr-2" />
              Export Genealogy
            </>
          )}
        </button>
      </div>
      
      {/* Export Status */}
      {exportSuccess !== null && (
        <div className={`mt-4 p-3 rounded-md ${
          exportSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center">
            {exportSuccess ? (
              <>
                <FaCheck className="mr-2" />
                <span>Export completed successfully!</span>
              </>
            ) : (
              <>
                <FaTimes className="mr-2" />
                <span>Export failed: {exportError}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
