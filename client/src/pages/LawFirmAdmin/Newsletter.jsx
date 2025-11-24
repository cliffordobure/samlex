import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";
import {
  FaEnvelope,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaGoogle,
  FaSearch,
  FaPlus,
  FaTimes,
  FaPaperPlane,
  FaUsers,
  FaEdit,
  FaEye,
  FaTrash,
} from "react-icons/fa";

const Newsletter = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [emails, setEmails] = useState([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Debug: Log selectedClients changes
  useEffect(() => {
    console.log("Selected clients changed:", selectedClients);
  }, [selectedClients]);

  useEffect(() => {
    checkConnectionStatus();
    fetchClients();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/newsletter/auth/callback?code=${code}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Gmail account connected successfully!");
        // Remove code from URL
        window.history.replaceState({}, document.title, "/admin/newsletter");
        checkConnectionStatus();
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to connect Gmail account";
      
      // Check if it's an OAuth access denied error
      if (errorMessage.includes("access_denied") || errorMessage.includes("403") || errorMessage.includes("verification")) {
        toast.error(
          <div>
            <p className="font-semibold">Gmail Access Blocked</p>
            <p className="text-sm mt-1">
              Your email needs to be added as a test user in Google Cloud Console.
              <br />
              See NEWSLETTER_SETUP.md for instructions.
            </p>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(errorMessage);
      }
      
      // Clean URL even on error
      window.history.replaceState({}, document.title, "/admin/newsletter");
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/newsletter/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setConnectionStatus(response.data.data);
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      setConnectionStatus({ connected: false });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/newsletter/auth-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Redirect to Google OAuth
        window.location.href = response.data.data.authUrl;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get authorization URL");
    }
  };

  const fetchEmails = async () => {
    if (!connectionStatus?.connected) {
      toast.error("Please connect your Gmail account first");
      return;
    }

    setIsLoadingEmails(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/newsletter/fetch-emails`,
        {
          query: searchQuery || "",
          maxResults: 100,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setEmails(response.data.data.emails || []);
        toast.success(`Fetched ${response.data.data.emails?.length || 0} emails`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch emails");
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/newsletter/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const fetchedClients = response.data.data.clients || [];
        setClients(fetchedClients);
        
        if (fetchedClients.length === 0) {
          toast.error("No clients with email addresses found. Please add email addresses to client profiles.", {
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error(error.response?.data?.message || "Failed to fetch clients");
    }
  };

  const toggleEmailSelection = (email) => {
    setSelectedEmails((prev) => {
      if (prev.find((e) => e.id === email.id)) {
        return prev.filter((e) => e.id !== email.id);
      } else {
        return [...prev, email];
      }
    });
  };

  const compileNewsletter = () => {
    if (selectedEmails.length === 0) {
      toast.error("Please select at least one email");
      return;
    }

    // Compile selected emails into newsletter content
    let compiledContent = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">`;
    compiledContent += `<h1 style="color: #0ea5e9;">Newsletter</h1>`;
    compiledContent += `<p style="color: #64748b;">Compiled from selected emails</p>`;
    compiledContent += `<hr style="margin: 20px 0;">`;

    selectedEmails.forEach((email, index) => {
      compiledContent += `<div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">`;
      compiledContent += `<h3 style="color: #1e293b; margin-top: 0;">${email.subject || "No Subject"}</h3>`;
      compiledContent += `<p style="color: #64748b; font-size: 14px;">From: ${email.from} | Date: ${new Date(email.date).toLocaleDateString()}</p>`;
      compiledContent += `<div style="color: #334155; line-height: 1.6;">${email.htmlBody || email.body || email.snippet}</div>`;
      compiledContent += `</div>`;
    });

    compiledContent += `</div>`;

    setNewsletterContent(compiledContent);
    setNewsletterSubject(newsletterSubject || "Monthly Newsletter");
    toast.success("Newsletter compiled successfully!");
  };

  const handleSendNewsletter = async () => {
    if (!newsletterSubject || !newsletterContent) {
      toast.error("Please enter subject and content");
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/newsletter/send`,
        {
          subject: newsletterSubject,
          content: newsletterContent,
          selectedEmailIds: selectedEmails.map((e) => e.id),
          clientIds: selectedClients.length > 0 ? selectedClients : undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSendResult(response.data.data);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to send newsletter");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send newsletter");
    } finally {
      setIsSending(false);
    }
  };

  const filteredEmails = emails.filter(
    (email) =>
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
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
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <FaEnvelope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Newsletter Compiler
                </h1>
                <p className="text-slate-300 mt-1">
                  Fetch emails from Gmail and compile into newsletter
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gmail Connection Status */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6 mb-6">
          {isLoadingStatus ? (
            <div className="flex items-center justify-center py-4">
              <FaSpinner className="w-5 h-5 text-blue-400 animate-spin mr-2" />
              <span className="text-slate-300">Checking connection...</span>
            </div>
          ) : connectionStatus?.connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaCheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-white font-semibold">Gmail Connected</h3>
                  <p className="text-slate-400 text-sm">{connectionStatus.email}</p>
                </div>
              </div>
              <button
                onClick={checkConnectionStatus}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaExclamationCircle className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-white font-semibold">Gmail Not Connected</h3>
                  <p className="text-slate-400 text-sm">
                    Connect your Gmail account to fetch emails
                  </p>
                </div>
              </div>
              <button
                onClick={handleConnectGmail}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaGoogle className="w-5 h-5 mr-2" />
                Connect Gmail
              </button>
            </div>
            {/* Setup Warning */}
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <FaExclamationTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-400 font-semibold mb-1">
                    Setup Required Before Connecting
                  </p>
                  <p className="text-yellow-300/90 mb-2">
                    If you see "Access blocked" error, you need to add your email as a test user in Google Cloud Console:
                  </p>
                  <ol className="list-decimal list-inside text-yellow-300/80 space-y-1 ml-2">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-yellow-400 hover:text-yellow-300">Google Cloud Console</a></li>
                    <li>Navigate to <strong>APIs & Services → OAuth consent screen</strong></li>
                    <li>Scroll to <strong>Test users</strong> section</li>
                    <li>Click <strong>+ ADD USERS</strong> and add your email: <code className="bg-yellow-900/30 px-1 rounded">cliffordobure98@gmail.com</code></li>
                    <li>Click <strong>SAVE</strong> and try connecting again</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Email Selection */}
          <div className="space-y-6">
            {/* Fetch Emails Section */}
            {connectionStatus?.connected && (
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Fetch Emails</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search emails (optional Gmail query)"
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={fetchEmails}
                    disabled={isLoadingEmails}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoadingEmails ? (
                      <>
                        <FaSpinner className="w-4 h-4 mr-2 animate-spin inline" />
                        Fetching...
                      </>
                    ) : (
                      "Fetch Emails from Gmail"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Email List */}
            {emails.length > 0 && (
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Emails ({emails.length})
                  </h2>
                  {selectedEmails.length > 0 && (
                    <button
                      onClick={compileNewsletter}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200"
                    >
                      <FaPlus className="w-4 h-4 mr-2 inline" />
                      Compile Newsletter
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEmails.map((email) => {
                    const isSelected = selectedEmails.find((e) => e.id === email.id);
                    return (
                      <div
                        key={email.id}
                        onClick={() => toggleEmailSelection(email)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-500/20 border-blue-500/50"
                            : "bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {isSelected && (
                                <FaCheckCircle className="w-4 h-4 text-blue-400" />
                              )}
                              <h3 className="text-white font-semibold text-sm">
                                {email.subject || "No Subject"}
                              </h3>
                            </div>
                            <p className="text-slate-400 text-xs mb-1">
                              From: {email.from}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {new Date(email.date).toLocaleDateString()}
                            </p>
                            <p className="text-slate-300 text-sm mt-2 line-clamp-2">
                              {email.snippet || email.body?.substring(0, 100)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Newsletter Editor */}
          <div className="space-y-6">
            {/* Newsletter Editor */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Newsletter</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-all duration-200"
                  >
                    <FaEye className="w-4 h-4 inline mr-1" />
                    Preview
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    placeholder="Newsletter Subject"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Content *
                  </label>
                  {showPreview ? (
                    <div
                      className="w-full min-h-[400px] px-4 py-3 bg-white rounded-lg overflow-auto"
                      dangerouslySetInnerHTML={{ __html: newsletterContent }}
                    />
                  ) : (
                    <textarea
                      value={newsletterContent}
                      onChange={(e) => setNewsletterContent(e.target.value)}
                      placeholder="Enter newsletter content (HTML supported). Use {firstName}, {lastName}, {name}, {companyName} for personalization."
                      rows={15}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Client Selection */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Recipients ({clients.length} {clients.length === 1 ? 'client' : 'clients'})
              </h2>
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <FaExclamationCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-slate-400">No clients with email addresses found</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Make sure clients have email addresses in their profiles
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                    {clients.filter(c => c && c.email).map((client) => {
                      const clientId = String(client._id || client.id);
                      const isSelected = selectedClients.some(id => String(id) === clientId);
                      return (
                        <div
                          key={clientId}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedClients((prev) => {
                              const prevStr = prev.map(id => String(id));
                              if (prevStr.includes(clientId)) {
                                return prev.filter((id) => String(id) !== clientId);
                              } else {
                                return [...prev, client._id || client.id];
                              }
                            });
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-green-500/20 border-green-500/50"
                              : "bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm font-medium">
                                {client.firstName} {client.lastName}
                                {client.companyName && ` (${client.companyName})`}
                              </p>
                              <p className="text-slate-400 text-xs">{client.email}</p>
                            </div>
                            {isSelected && (
                              <FaCheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const clientsWithEmail = clients.filter(c => c && c.email && c._id);
                    const allClientIds = clientsWithEmail.map((c) => c._id || c.id).filter(Boolean);
                    
                    if (allClientIds.length > 0) {
                      setSelectedClients(allClientIds);
                      toast.success(`Selected ${allClientIds.length} ${allClientIds.length === 1 ? 'client' : 'clients'}`);
                    } else {
                      toast.error("No clients with email addresses available");
                    }
                  }}
                  disabled={clients.filter(c => c && c.email).length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ pointerEvents: clients.filter(c => c && c.email).length === 0 ? 'none' : 'auto' }}
                >
                  Select All ({clients.filter(c => c && c.email).length})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedClients.length > 0) {
                      setSelectedClients([]);
                      toast.success("Selection cleared");
                    }
                  }}
                  disabled={selectedClients.length === 0}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  style={{ pointerEvents: selectedClients.length === 0 ? 'none' : 'auto' }}
                >
                  Clear Selection ({selectedClients.length})
                </button>
              </div>
            </div>

            {/* Send Newsletter */}
            <button
              onClick={handleSendNewsletter}
              disabled={isSending || !newsletterSubject || !newsletterContent}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <FaSpinner className="w-5 h-5 mr-2 animate-spin inline" />
                  Sending Newsletter...
                </>
              ) : (
                <>
                  <FaPaperPlane className="w-5 h-5 mr-2 inline" />
                  Send Newsletter to {selectedClients.length > 0 ? selectedClients.length : clients.length} Clients
                </>
              )}
            </button>

            {/* Send Result */}
            {sendResult && (
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Send Results</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{sendResult.total}</div>
                    <div className="text-sm text-slate-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {sendResult.sent}
                    </div>
                    <div className="text-sm text-slate-400">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {sendResult.failed}
                    </div>
                    <div className="text-sm text-slate-400">Failed</div>
                  </div>
                </div>
                {sendResult.failed > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-300 mb-2">Failed Emails:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {sendResult.details
                        .filter((d) => d.status === "failed")
                        .map((detail, idx) => (
                          <p key={idx} className="text-xs text-red-400">
                            {detail.email}: {detail.error}
                          </p>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;

