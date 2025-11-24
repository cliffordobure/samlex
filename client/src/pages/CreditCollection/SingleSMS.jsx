import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import {
  FaSms,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaPhone,
  FaPaperPlane,
  FaInfoCircle,
} from "react-icons/fa";

const SingleSMS = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Determine base path based on current location
  const isAdminRoute = location.pathname.startsWith("/admin");
  const basePath = isAdminRoute ? "/admin" : "/credit-collection";

  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [smsResult, setSmsResult] = useState(null);

  const handleSendSMS = async (e) => {
    e?.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);
    setSmsResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/credit-cases/send-sms`,
        {
          phoneNumber: phoneNumber.trim(),
          message: message.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSmsResult({
          success: true,
          phone: phoneNumber.trim(),
          message: response.data.message,
        });
        toast.success("SMS sent successfully!");
        // Clear form after successful send
        setPhoneNumber("");
        setMessage("");
      } else {
        setSmsResult({
          success: false,
          phone: phoneNumber.trim(),
          error: response.data.message || "Failed to send SMS",
        });
        toast.error(response.data.message || "Failed to send SMS");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to send SMS";
      setSmsResult({
        success: false,
        phone: phoneNumber.trim(),
        error: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const characterCount = message.length;
  const maxCharacters = 160;
  const isUnicode = /[^\x00-\x7F]/.test(message);
  const effectiveMax = isUnicode ? 70 : 160;
  const isOverLimit = characterCount > effectiveMax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(basePath)}
            className="inline-flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all duration-200 mb-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <FaSms className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Send Single SMS
                </h1>
                <p className="text-slate-300 mt-1">
                  Send an SMS to any phone number
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Form */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
          <form onSubmit={handleSendSMS} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254712345678 or 0712345678"
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSending}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter phone number in international format (+254...) or local format (07...)
              </p>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  isOverLimit ? "border-red-500" : "border-slate-600"
                }`}
                required
                disabled={isSending}
                maxLength={effectiveMax}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <FaInfoCircle className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-400">
                    {isUnicode ? "Unicode detected (70 char limit)" : "Plain text (160 char limit)"}
                  </p>
                </div>
                <p
                  className={`text-sm font-medium ${
                    isOverLimit
                      ? "text-red-400"
                      : characterCount > effectiveMax * 0.9
                      ? "text-yellow-400"
                      : "text-slate-400"
                  }`}
                >
                  {characterCount} / {effectiveMax}
                </p>
              </div>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || isOverLimit || !phoneNumber.trim() || !message.trim()}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <FaSpinner className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane className="w-5 h-5 mr-2" />
                  Send SMS
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Display */}
        {smsResult && (
          <div className="mt-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
            <div className="flex items-center space-x-4 mb-4">
              {smsResult.success ? (
                <>
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <FaCheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">SMS Sent Successfully!</h3>
                    <p className="text-slate-300 text-sm">{smsResult.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <FaExclamationCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Failed to Send SMS</h3>
                    <p className="text-red-300 text-sm">{smsResult.error}</p>
                  </div>
                </>
              )}
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-300">
                <strong>Phone Number:</strong> {smsResult.phone}
              </p>
            </div>
            <button
              onClick={() => setSmsResult(null)}
              className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200"
            >
              Send Another SMS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleSMS;

