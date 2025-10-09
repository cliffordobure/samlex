import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaSms,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaUsers,
  FaFileAlt,
  FaInfoCircle,
  FaFileExcel,
} from "react-icons/fa";

const BulkSMS = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId");

  const { user } = useSelector((state) => state.auth);
  const [batchInfo, setBatchInfo] = useState(null);
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [useTemplate, setUseTemplate] = useState(true);
  const [customMessage, setCustomMessage] = useState(
    "Dear {name}, this is a reminder that you have an outstanding debt of {currency} {amount} with {bank}. Please contact us to arrange payment. Thank you."
  );
  const [smsResult, setSmsResult] = useState(null);

  useEffect(() => {
    if (batchId) {
      fetchBatchCases();
    } else {
      fetchImportBatches();
    }
  }, [batchId]);

  const fetchBatchCases = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/credit-cases/import-batch/${batchId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCases(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching batch cases:", error);
      toast.error("Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImportBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/credit-cases/import-batches`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success && response.data.data.length > 0) {
        // Redirect to the most recent batch
        const latestBatch = response.data.data[0];
        navigate(`/admin/bulk-sms?batchId=${latestBatch._id}`);
      } else {
        // No batches found - stay on page and show message
        console.log("No import batches found");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load import batches");
      setIsLoading(false);
    }
  };

  const handleSendBulkSMS = async () => {
    if (!useTemplate && !customMessage.trim()) {
      toast.error("Please enter a custom message");
      return;
    }

    setIsSending(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/credit-cases/bulk-sms`,
        {
          importBatchId: batchId,
          customMessage,
          useTemplate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSmsResult(response.data.data);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("SMS error:", error);
      toast.error(
        error.response?.data?.message || "Failed to send SMS. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const validCases = cases.filter((c) => c.debtorContact);
  const totalDebt = cases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xl font-semibold text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show message if no batches found and no batchId in URL
  if (!batchId && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all duration-200 mb-4"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <FaSms className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Bulk SMS
                  </h1>
                  <p className="text-slate-300 mt-1">
                    Send SMS reminders to multiple debtors
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* No Batches Message */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-6">
              <FaFileExcel className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No Import Batches Found
            </h2>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              You need to import cases from an Excel file before you can send bulk SMS messages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/admin/bulk-import")}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaFileExcel className="w-5 h-5 mr-2" />
                Import Cases from Excel
              </button>
              <button
                onClick={() => navigate("/admin/cases")}
                className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-200"
              >
                <FaUsers className="w-5 h-5 mr-2" />
                View Existing Cases
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all duration-200 mb-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <FaSms className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Bulk SMS
                </h1>
                <p className="text-slate-300 mt-1">
                  Send SMS reminders to multiple debtors
                </p>
              </div>
            </div>
          </div>
        </div>

        {!smsResult ? (
          <>
            {/* Batch Summary */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Batch Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaFileAlt className="w-5 h-5 text-blue-400" />
                    <p className="text-sm text-slate-400">Total Cases</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{cases.length}</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaUsers className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-slate-400">Valid Phone Numbers</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {validCases.length}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaExclamationCircle className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm text-slate-400">Total Debt</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    KES {totalDebt.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Configuration */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                SMS Configuration
              </h2>

              {/* Template Toggle */}
              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                    className="w-5 h-5 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-slate-300">Use Default Template</span>
                </label>
              </div>

              {/* Message Preview */}
              {!useTemplate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your custom message. Use {name}, {amount}, {bank}, {currency} as placeholders."
                  />
                  <div className="mt-2 text-xs text-slate-400">
                    Available placeholders: <strong>{"{name}"}</strong>,{" "}
                    <strong>{"{amount}"}</strong>, <strong>{"{bank}"}</strong>,{" "}
                    <strong>{"{currency}"}</strong>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <div className="flex items-start space-x-2 mb-2">
                  <FaInfoCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Preview
                    </h3>
                    <p className="text-sm text-slate-300">
                      {useTemplate
                        ? `Dear [Name], this is a reminder that you have an outstanding debt of KES [Amount] with [Bank]. Please contact us to arrange payment. Thank you.`
                        : customMessage
                            .replace("{name}", "[Name]")
                            .replace("{amount}", "[Amount]")
                            .replace("{bank}", "[Bank]")
                            .replace("{currency}", "[Currency]")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cases Preview */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Recipients ({validCases.length})
              </h2>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-700">
                    <tr className="text-left text-sm text-slate-400 border-b border-slate-600">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validCases.map((case_) => (
                      <tr
                        key={case_._id}
                        className="text-slate-300 border-b border-slate-700 hover:bg-slate-700/30"
                      >
                        <td className="py-3 px-4">{case_.debtorName}</td>
                        <td className="py-3 px-4">{case_.debtorContact}</td>
                        <td className="py-3 px-4">
                          KES {case_.debtAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendBulkSMS}
              disabled={isSending || validCases.length === 0}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending SMS...
                </>
              ) : (
                <>
                  <FaSms className="w-5 h-5 mr-2" />
                  Send Bulk SMS to {validCases.length} Recipients
                </>
              )}
            </button>
          </>
        ) : (
          /* SMS Results */
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FaCheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  SMS Sending Complete!
                </h2>
                <p className="text-slate-300">
                  {smsResult.sent} messages sent successfully
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-400">Total</p>
                <p className="text-2xl font-bold text-white">
                  {smsResult.total}
                </p>
              </div>
              <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                <p className="text-sm text-green-400">Sent</p>
                <p className="text-2xl font-bold text-green-400">
                  {smsResult.sent}
                </p>
              </div>
              <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                <p className="text-sm text-red-400">Failed</p>
                <p className="text-2xl font-bold text-red-400">
                  {smsResult.failed}
                </p>
              </div>
            </div>

            {/* Failed SMS Details */}
            {smsResult.details &&
              smsResult.details.filter((d) => d.status === "failed").length >
                0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Failed Messages
                  </h3>
                  <div className="bg-slate-700/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    {smsResult.details
                      .filter((d) => d.status === "failed")
                      .map((detail, index) => (
                        <div
                          key={index}
                          className="text-sm text-slate-300 py-2 border-b border-slate-600 last:border-b-0"
                        >
                          <strong>{detail.phone}:</strong> {detail.error}
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setSmsResult(null)}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-200"
              >
                Send Another Batch
              </button>
              <button
                onClick={() => navigate("/admin/cases")}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200"
              >
                View All Cases
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkSMS;

