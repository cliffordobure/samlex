import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import {
  FaUpload,
  FaFileExcel,
  FaTrash,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaSms,
  FaDownload,
} from "react-icons/fa";

const BulkImport = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [bankName, setBankName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImportResult(null);
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!bankName.trim()) {
      toast.error("Please enter the bank/creditor name");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select an Excel file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("bankName", bankName);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/credit-cases/bulk-import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setImportResult(response.data.data);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error.response?.data?.message || "Failed to import cases. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template with proper phone number formatting
    const csvContent =
      "data:text/csv;charset=utf-8,Name,Phone,Amount,Email\nJohn Doe,+254712345678,50000,john@example.com\nJane Smith,0722345678,75000,jane@example.com\nRobert Johnson,254733456789,120000,robert@example.com";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/credit-collection")}
            className="inline-flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all duration-200 mb-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <FaFileExcel className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Bulk Case Import
                </h1>
                <p className="text-slate-300 mt-1">
                  Import multiple cases from an Excel spreadsheet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 mb-6">
          <div className="flex items-start space-x-3">
            <FaInfoCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div className="text-slate-300">
              <h3 className="font-semibold text-white mb-2">
                Excel File Requirements:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Your Excel file must have headers in the first row
                </li>
                <li>
                  Required columns: <strong>Name</strong> (or Debtor Name),{" "}
                  <strong>Phone</strong> (or Contact), <strong>Amount</strong>{" "}
                  (or Debt Amount)
                </li>
                <li>
                  Optional column: <strong>Email</strong>
                </li>
                <li>Phone numbers should be in format: +254... or 07...</li>
                <li><strong>Important:</strong> Format phone numbers as text in Excel to avoid scientific notation</li>
                <li>Maximum file size: 10MB</li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 border border-blue-500/30 mt-4"
              >
                <FaDownload className="w-4 h-4 mr-2" />
                Download Sample Template
              </button>
            </div>
          </div>
        </div>

        {/* Import Form */}
        {!importResult && (
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
            <div className="p-6">
              <form onSubmit={handleImport} className="space-y-6">
                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bank / Creditor Name *
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., KCB Bank, Equity Bank"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Excel File *
                  </label>
                  {!selectedFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".xlsx,.xls"
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200"
                      >
                        <FaUpload className="w-12 h-12 text-slate-400 mb-4" />
                        <p className="text-slate-300 font-medium mb-1">
                          Click to upload Excel file
                        </p>
                        <p className="text-sm text-slate-400">
                          or drag and drop (.xlsx, .xls)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 border border-slate-600 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <FaFileExcel className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-white font-medium">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-slate-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile || !bankName.trim()}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Importing Cases...
                    </>
                  ) : (
                    <>
                      <FaUpload className="w-5 h-5 mr-2" />
                      Import Cases
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FaCheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Import Complete!
                  </h2>
                  <p className="text-slate-300">
                    {importResult.successCount} cases imported successfully
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Total Processed</p>
                  <p className="text-2xl font-bold text-white">
                    {importResult.totalProcessed}
                  </p>
                </div>
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                  <p className="text-sm text-green-400">Successful</p>
                  <p className="text-2xl font-bold text-green-400">
                    {importResult.successCount}
                  </p>
                </div>
                <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                  <p className="text-sm text-red-400">Failed</p>
                  <p className="text-2xl font-bold text-red-400">
                    {importResult.failureCount}
                  </p>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <FaExclamationTriangle className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Import Errors
                    </h3>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm text-slate-300 py-2 border-b border-slate-600 last:border-b-0"
                      >
                        <strong>Row {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={() => {
                  navigate(
                    `/credit-collection/bulk-sms?batchId=${importResult.importBatchId}`
                  );
                  }}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FaSms className="w-5 h-5 mr-2" />
                  Send Bulk SMS
                </button>
                <button
                  onClick={() => {
                    setImportResult(null);
                    setSelectedFile(null);
                    setBankName("");
                  }}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-200"
                >
                  Import Another File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImport;

