import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchClientById } from "../../store/slices/clientSlice";
import { getCurrentUser } from "../../store/slices/authSlice";
import creditCaseApi from "../../store/api/creditCaseApi";
import legalCaseApi from "../../store/api/legalCaseApi";
import { 
  FaArrowLeft, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaBuilding,
  FaSpinner,
  FaFileAlt,
  FaGavel,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaArrowRight,
  FaSearch
} from "react-icons/fa";

const ClientDetails = () => {
  console.log("🎯 ClientDetails component rendering");
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentClient, loading } = useSelector((state) => state.clients);
  const { user } = useSelector((state) => state.auth);
  
  console.log("🎯 ClientDetails initial state:", {
    id,
    hasCurrentClient: !!currentClient,
    loading,
    hasUser: !!user,
    userRole: user?.role,
    userId: user?._id
  });

  const [creditCases, setCreditCases] = useState([]);
  const [legalCases, setLegalCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  console.log("=== CLIENT DETAILS - USER INFO ===");
  console.log("User object from Redux:", user);
  console.log("User role:", user?.role);
  console.log("User ID:", user?._id);
  console.log("User email:", user?.email);

  useEffect(() => {
    if (id) {
      console.log("📥 Fetching client by ID:", id);
      dispatch(fetchClientById(id));
    }
  }, [id, dispatch]);

  // Refresh user data if missing
  useEffect(() => {
    if (!user && !loading) {
      console.log("🔄 User data missing, refreshing...");
      dispatch(getCurrentUser());
    }
  }, [user, loading, dispatch]);

  // Fetch cases when we have client and user info
  useEffect(() => {
    console.log("🔍 ClientDetails useEffect triggered:", { 
      id, 
      hasCurrentClient: !!currentClient, 
      userRole: user?.role,
      userId: user?._id,
      userKeys: user ? Object.keys(user) : 'no user'
    });
    
    // Try to fetch cases if we have the minimum required info
    if (id && currentClient) {
      if (user?.role) {
        console.log("✅ Conditions met, calling fetchClientCases");
        fetchClientCases();
      } else {
        console.log("⚠️ User role missing, will fetch after user data loads");
      }
    } else {
      console.log("❌ Conditions not met:", {
        hasId: !!id,
        hasCurrentClient: !!currentClient,
        hasUserRole: !!user?.role,
        currentClientId: currentClient?._id,
        userType: typeof user
      });
    }
  }, [id, currentClient, user?.role]);

  const fetchClientCases = async () => {
    console.log("🚀 fetchClientCases called");
    try {
      setLoadingCases(true);
      
      if (!currentClient) {
        console.error("❌ No currentClient, aborting");
        setLoadingCases(false);
        return;
      }
      
      if (!user) {
        console.error("❌ No user found in store");
        setLoadingCases(false);
        return;
      }
      
      console.log("📋 Fetching cases for client:", id);
      console.log("👤 Client details:", {
        id: currentClient._id,
        name: `${currentClient.firstName} ${currentClient.lastName}`,
        email: currentClient.email,
        phone: currentClient.phoneNumber
      });
      console.log("👤 User details:", {
        role: user?.role,
        email: user?.email,
        userId: user?._id
      });
      
      // For debt collectors, fetch all assigned cases and match by client or debtor info
      if (user?.role === "debt_collector") {
        // Backend automatically uses req.user._id from JWT token for debt collectors
        // No need to extract userId from frontend - backend handles it!
        console.log("✅ Fetching cases for debt collector (backend uses authenticated user ID automatically)");
        
        // First, try to fetch cases with client field set
        // Backend will automatically filter by req.user._id for debt collectors
        const creditResponseWithClient = await creditCaseApi.getCreditCases({ 
          client: id,
          limit: 1000 
        });
        let creditCasesWithClient = creditResponseWithClient?.data?.data || [];
        console.log("✅ Cases with client field:", creditCasesWithClient.length);
        
        // Also fetch all assigned cases to match by debtor info
        // Backend will automatically filter by req.user._id for debt collectors
        const assignedCreditResponse = await creditCaseApi.getCreditCases({ 
          limit: 1000 
        });
        const allAssignedCases = assignedCreditResponse?.data?.data || [];
        console.log("All assigned cases:", allAssignedCases.length);
        
        // Get case IDs we already have
        const existingCaseIds = new Set(creditCasesWithClient.map(c => c._id.toString()));
        
        // Match cases by debtor information - use same logic as backend
        const clientEmail = currentClient.email?.toLowerCase()?.trim();
        const clientFirstName = currentClient.firstName?.trim();
        const clientLastName = currentClient.lastName?.trim();
        const clientName = `${clientFirstName || ''} ${clientLastName || ''}`.trim();
        const clientPhone = currentClient.phoneNumber?.trim();
        const clientCompanyName = currentClient.companyName?.toLowerCase()?.trim();
        
        console.log("=== CLIENT MATCHING INFO ===");
        console.log("Client ID:", id);
        console.log("Client Email:", clientEmail);
        console.log("Client Name:", clientName);
        console.log("Client First Name:", clientFirstName);
        console.log("Client Last Name:", clientLastName);
        console.log("Client Phone:", clientPhone);
        console.log("Client Company:", clientCompanyName);
        console.log("Total assigned cases to check:", allAssignedCases.length);
        
        const matchedByDebtor = allAssignedCases.filter((case_) => {
          // Skip if already included
          if (existingCaseIds.has(case_._id.toString())) {
            return false;
          }
          
          // Skip if case has a different client (and it's set)
          if (case_.client) {
            const caseClientId = typeof case_.client === 'string' ? case_.client : (case_.client._id || case_.client);
            if (caseClientId.toString() !== id) {
              return false;
            }
          }
          
          const caseDebtorEmail = case_.debtorEmail?.toLowerCase()?.trim();
          const caseDebtorName = case_.debtorName?.trim();
          const caseDebtorContact = case_.debtorContact?.trim();
          
          console.log(`Checking case ${case_._id}:`, {
            debtorEmail: caseDebtorEmail,
            debtorName: caseDebtorName,
            debtorContact: caseDebtorContact
          });
          
          // Match by email (exact match)
          if (caseDebtorEmail && clientEmail && caseDebtorEmail === clientEmail) {
            console.log("✓✓✓ MATCHED by email:", case_._id);
            return true;
          }
          
          // Match by phone (most reliable) - normalize phone numbers
          if (caseDebtorContact && clientPhone) {
            // Remove spaces, dashes, and other formatting - be very lenient
            const normalizePhone = (phone) => {
              if (!phone) return '';
              return phone.toString().replace(/[\s\-\(\)\+]/g, '').replace(/^0/, '').replace(/^254/, '');
            };
            const casePhoneNormalized = normalizePhone(caseDebtorContact);
            const clientPhoneNormalized = normalizePhone(clientPhone);
            
            // Also try direct comparison
            const directMatch = caseDebtorContact.trim() === clientPhone.trim();
            const normalizedMatch = casePhoneNormalized && clientPhoneNormalized && 
                                   casePhoneNormalized === clientPhoneNormalized;
            
            if (directMatch || normalizedMatch) {
              // If phone matches, be VERY lenient with name matching
              let nameMatches = false;
              
              if (caseDebtorName && (clientName || clientCompanyName)) {
                const caseNameLower = caseDebtorName.toLowerCase().trim();
                const clientNameLower = (clientName || '').toLowerCase().trim();
                const clientCompanyLower = (clientCompanyName || '').toLowerCase().trim();
                
                // Exact match
                if (caseNameLower === clientNameLower || caseNameLower === clientCompanyLower) {
                  nameMatches = true;
                }
                // Partial match (one contains the other) - be more lenient
                else if (caseNameLower.includes(clientNameLower) || clientNameLower.includes(caseNameLower) ||
                         caseNameLower.includes(clientCompanyLower) || clientCompanyLower.includes(caseNameLower) ||
                         // Also check if any significant word matches
                         caseNameLower.split(/\s+/).some(word => 
                           word.length > 3 && (clientNameLower.includes(word) || clientCompanyLower.includes(word))
                         ) ||
                         (clientNameLower.split(/\s+/).some(word => 
                           word.length > 3 && caseNameLower.includes(word)
                         ))) {
                  nameMatches = true;
                }
                // Match by name parts (like backend does)
                else if (clientFirstName && clientLastName) {
                  const nameParts = caseNameLower.split(/\s+/).filter(p => p.length > 0);
                  const firstName = nameParts[0] || "";
                  const lastName = nameParts.slice(1).join(" ") || "Client";
                  
                  if (firstName === clientFirstName.toLowerCase() && 
                      lastName === clientLastName.toLowerCase()) {
                    nameMatches = true;
                  }
                  // Also try reverse (last name first)
                  else if (nameParts.length >= 2) {
                    const lastPart = nameParts[nameParts.length - 1];
                    const firstParts = nameParts.slice(0, -1).join(" ");
                    if (lastPart === clientLastName.toLowerCase() && 
                        firstParts === clientFirstName.toLowerCase()) {
                      nameMatches = true;
                    }
                  }
                }
              }
              
              // If phone matches, ALWAYS include it (phone is the most reliable identifier)
              // Name matching is optional - if phone matches, it's the same person/company
              console.log("✓✓✓ MATCHED by phone:", case_._id, {
                casePhone: caseDebtorContact,
                clientPhone: clientPhone,
                caseName: caseDebtorName,
                clientName: clientName,
                nameMatch: nameMatches
              });
              return true;
            }
          }
          
          // Match by company name if available
          if (clientCompanyName && caseDebtorName) {
            const caseNameLower = caseDebtorName.toLowerCase().trim();
            if (caseNameLower.includes(clientCompanyName) || clientCompanyName.includes(caseNameLower)) {
              console.log("✓✓✓ MATCHED by company name:", case_._id);
              return true;
            }
          }
          
          return false;
        });
        
        // Combine both sets (remove duplicates)
        const allCaseIds = new Set();
        const allCreditCases = [];
        
        [...creditCasesWithClient, ...matchedByDebtor].forEach(c => {
          const caseId = c._id.toString();
          if (!allCaseIds.has(caseId)) {
            allCaseIds.add(caseId);
            allCreditCases.push(c);
          }
        });
        
        console.log("=== FINAL RESULTS ===");
        console.log("Cases with client field:", creditCasesWithClient.length);
        console.log("Cases matched by debtor info:", matchedByDebtor.length);
        console.log("Total unique credit cases:", allCreditCases.length);
        if (allCreditCases.length > 0) {
          console.log("✅ Sample matched case:", {
            _id: allCreditCases[0]._id,
            title: allCreditCases[0].title,
            debtorName: allCreditCases[0].debtorName,
            debtorContact: allCreditCases[0].debtorContact
          });
        } else {
          console.error("❌ NO CASES FOUND! Check the matching logic above.");
          console.log("Client info used for matching:", {
            id,
            email: clientEmail,
            name: clientName,
            phone: clientPhone,
            company: clientCompanyName
          });
        }
        
        setCreditCases(allCreditCases);
        console.log("✅ Credit cases set to state:", allCreditCases.length);

        // Fetch legal cases assigned to this debt collector for this client
        // Backend will automatically filter by req.user._id AND client ID for debt collectors
        console.log("📋 Fetching legal cases for client:", id);
        try {
          const assignedLegalResponse = await legalCaseApi.getLegalCases({ 
            client: id, // Backend will filter by both client AND assignedTo automatically
            limit: 1000 
          });
          console.log("📦 Legal cases API response:", assignedLegalResponse);
          console.log("📦 Legal cases response.data:", assignedLegalResponse?.data);
          console.log("📦 Legal cases response.data.data:", assignedLegalResponse?.data?.data);
          
          // Handle different response structures
          let matchedLegalCases = [];
          if (Array.isArray(assignedLegalResponse?.data?.data)) {
            matchedLegalCases = assignedLegalResponse.data.data;
          } else if (Array.isArray(assignedLegalResponse?.data)) {
            matchedLegalCases = assignedLegalResponse.data;
          }
          
          console.log("✅ Matched legal cases:", matchedLegalCases.length);
          if (matchedLegalCases.length > 0) {
            console.log("✅ Sample legal case:", {
              _id: matchedLegalCases[0]._id,
              title: matchedLegalCases[0].title,
              client: matchedLegalCases[0].client
            });
          } else {
            console.warn("⚠️ No legal cases found. Response structure:", {
              hasData: !!assignedLegalResponse?.data,
              hasDataData: !!assignedLegalResponse?.data?.data,
              dataType: typeof assignedLegalResponse?.data,
              dataDataType: typeof assignedLegalResponse?.data?.data
            });
          }
          setLegalCases(matchedLegalCases);
        } catch (legalError) {
          console.error("❌ Error fetching legal cases:", legalError);
          console.error("Legal error details:", {
            message: legalError.message,
            response: legalError.response?.data,
            status: legalError.response?.status
          });
          setLegalCases([]);
        }
      } else {
        // For other roles, fetch cases with client field AND match by debtor info
        const creditResponseWithClient = await creditCaseApi.getCreditCases({ client: id, limit: 1000 });
        let creditCasesWithClient = creditResponseWithClient.data?.data || [];
        
        // Also fetch all credit cases and match by debtor information
        const allCreditResponse = await creditCaseApi.getCreditCases({ limit: 1000 });
        const allCreditCases = allCreditResponse.data?.data || [];
        
        // Match cases by debtor information
        const matchedByDebtor = allCreditCases.filter((case_) => {
          // Skip if already in creditCasesWithClient
          if (case_.client) {
            const clientId = typeof case_.client === 'string' ? case_.client : case_.client._id;
            if (clientId.toString() === id) {
              return false; // Already included
            }
          }
          
          // Match by debtor information
          const caseDebtorEmail = case_.debtorEmail?.toLowerCase();
          const caseDebtorName = case_.debtorName?.trim();
          const caseDebtorContact = case_.debtorContact;
          
          const clientEmail = currentClient.email?.toLowerCase();
          const clientName = `${currentClient.firstName} ${currentClient.lastName}`.trim();
          const clientPhone = currentClient.phoneNumber;
          
          // Match by email
          if (caseDebtorEmail && clientEmail && caseDebtorEmail === clientEmail) {
            return true;
          }
          
          // Match by name and phone
          if (caseDebtorName && caseDebtorContact && clientName && clientPhone) {
            const nameMatch = caseDebtorName.toLowerCase() === clientName.toLowerCase();
            const phoneMatch = caseDebtorContact === clientPhone;
            if (nameMatch && phoneMatch) {
              return true;
            }
          }
          
          return false;
        });
        
        // Combine cases with client field and matched cases
        const caseIds = new Set(creditCasesWithClient.map(c => c._id.toString()));
        matchedByDebtor.forEach(c => {
          if (!caseIds.has(c._id.toString())) {
            creditCasesWithClient.push(c);
          }
        });
        
        setCreditCases(creditCasesWithClient);

        const legalResponse = await legalCaseApi.getLegalCases({ client: id, limit: 1000 });
        if (legalResponse.data?.success) {
          setLegalCases(legalResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching client cases:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      console.log("🏁 fetchClientCases completed, setting loading to false");
      setLoadingCases(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "new":
      case "pending_assignment":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "assigned":
      case "in_progress":
      case "under_review":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "follow_up_required":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      case "escalated_to_legal":
      case "court_proceedings":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "resolved":
      case "closed":
      case "settlement":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  if (loading || loadingCases) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-white">Loading Client Details...</p>
          <p className="text-xs text-slate-400 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
            <FaUser className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xs font-medium text-slate-300 mb-2">Client not found</h3>
          <Link
            to="/credit-collection/clients"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 mt-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  const allCases = [
    ...creditCases.map(c => ({ ...c, type: 'credit' })),
    ...legalCases.map(c => ({ ...c, type: 'legal' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Filter cases based on search term
  const filteredCases = allCases.filter((case_) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      case_.title?.toLowerCase().includes(searchLower) ||
      case_.caseReference?.toLowerCase().includes(searchLower) ||
      case_.debtorName?.toLowerCase().includes(searchLower) ||
      (case_.type === "credit" && case_.debtorEmail?.toLowerCase().includes(searchLower)) ||
      (case_.type === "credit" && case_.debtorContact?.toLowerCase().includes(searchLower))
    );
  });

  console.log("📊 ClientDetails Render:", {
    creditCasesCount: creditCases.length,
    legalCasesCount: legalCases.length,
    allCasesCount: allCases.length,
    loadingCases,
    currentClientId: currentClient?._id,
    hasUser: !!user,
    userRole: user?.role
  });
  
  // Debug info - remove this after fixing
  const debugInfo = {
    hasId: !!id,
    hasCurrentClient: !!currentClient,
    hasUser: !!user,
    userRole: user?.role,
    creditCasesCount: creditCases.length,
    legalCasesCount: legalCases.length,
    allCasesCount: allCases.length,
    loadingCases,
    currentClientName: currentClient ? `${currentClient.firstName} ${currentClient.lastName}` : 'N/A'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Back Button */}
      <Link
        to="/credit-collection/clients"
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-slate-700/80 hover:to-slate-600/80 text-white rounded-xl font-semibold transition-all duration-200 border border-slate-600/50"
      >
        <FaArrowLeft className="w-4 h-4 mr-2" />
        Back to Clients
      </Link>

      {/* Client Info Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
              {currentClient.clientType === "corporate" ? (
                <FaBuilding className="w-8 h-8 text-blue-400" />
              ) : (
                <FaUser className="w-8 h-8 text-blue-400" />
              )}
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">
                {currentClient.clientType === "corporate" && currentClient.companyName
                  ? currentClient.companyName
                  : `${currentClient.firstName} ${currentClient.lastName}`}
              </h1>
              {currentClient.clientType === "corporate" && (
                <p className="text-xs text-slate-300 mt-1">
                  {currentClient.firstName} {currentClient.lastName}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {currentClient.phoneNumber && (
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <FaPhone className="w-3 h-3 text-slate-400" />
                    <span>{currentClient.phoneNumber}</span>
                  </div>
                )}
                {currentClient.email && (
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <FaEnvelope className="w-3 h-3 text-slate-400" />
                    <span>{currentClient.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                currentClient.status === "active"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : currentClient.status === "inactive"
                  ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {currentClient.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Additional Client Info */}
        {currentClient.address && (
          <div className="mt-4 pt-4 border-t border-slate-600/50">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <FaBuilding className="w-3 h-3 text-slate-400" />
              <span>
                {[
                  currentClient.address.street,
                  currentClient.address.city,
                  currentClient.address.state,
                  currentClient.address.zipCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "No address provided"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info - Remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 text-xs">
          <div className="text-yellow-400 font-semibold mb-2">🔍 Debug Info:</div>
          <div className="text-yellow-300 space-y-1">
            <div>Has ID: {debugInfo.hasId ? '✅' : '❌'} {id}</div>
            <div>Has Client: {debugInfo.hasCurrentClient ? '✅' : '❌'} {debugInfo.currentClientName}</div>
            <div>Has User: {debugInfo.hasUser ? '✅' : '❌'}</div>
            <div>User Role: {debugInfo.userRole || 'N/A'}</div>
            <div>Credit Cases: {debugInfo.creditCasesCount}</div>
            <div>Legal Cases: {debugInfo.legalCasesCount}</div>
            <div>All Cases: {debugInfo.allCasesCount}</div>
            <div>Loading: {debugInfo.loadingCases ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Cases Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg">
                <FaFileAlt className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xs font-semibold text-white">
                All Matters ({filteredCases.length})
              </h3>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="p-6">
          {filteredCases.length > 0 ? (
            <div className="space-y-4">
              {filteredCases.map((case_) => (
                <div
                  key={`${case_.type}-${case_._id}`}
                  className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {case_.type === "credit" ? (
                          <FaMoneyBillWave className="w-4 h-4 text-blue-400" />
                        ) : (
                          <FaGavel className="w-4 h-4 text-purple-400" />
                        )}
                        <h4 className="font-semibold text-white text-xs">
                          {case_.title}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            case_.type === "credit"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {case_.type === "credit" ? "Credit Case" : "Legal Case"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
                        {case_.caseReference && (
                          <span className="flex items-center space-x-1">
                            <FaFileAlt className="w-3 h-3 text-slate-400" />
                            <span>{case_.caseReference}</span>
                          </span>
                        )}
                        {case_.type === "credit" && case_.debtorName && (
                          <span className="flex items-center space-x-1">
                            <FaUser className="w-3 h-3 text-slate-400" />
                            <span>{case_.debtorName}</span>
                          </span>
                        )}
                        {case_.type === "credit" && case_.debtAmount && (
                          <span className="flex items-center space-x-1">
                            <FaMoneyBillWave className="w-3 h-3 text-slate-400" />
                            <span>KES {case_.debtAmount?.toLocaleString()}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <FaCalendarAlt className="w-3 h-3 text-slate-400" />
                          <span>{new Date(case_.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>

                      {/* Remaining Balance for Credit Cases */}
                      {case_.type === "credit" && case_.promisedPayments && (
                        (() => {
                          const totalPaid = case_.promisedPayments
                            .filter((p) => p.status === "paid")
                            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                          const remaining = (parseFloat(case_.debtAmount) || 0) - totalPaid;
                          return remaining > 0 ? (
                            <div className="mt-2 flex items-center space-x-1">
                              <span className="text-xs text-orange-400 font-medium">
                                Remaining: KES {remaining.toLocaleString()}
                              </span>
                            </div>
                          ) : totalPaid > 0 ? (
                            <div className="mt-2 flex items-center space-x-1">
                              <FaCheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400 font-medium">
                                Fully Paid
                              </span>
                            </div>
                          ) : null;
                        })()
                      )}
                    </div>
                    <div className="text-right ml-4 space-y-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          case_.status
                        )}`}
                      >
                        {case_.status?.replace("_", " ").toUpperCase()}
                      </span>
                      {case_.priority && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                            case_.priority
                          )}`}
                        >
                          {case_.priority.toUpperCase()}
                        </span>
                      )}
                      <Link
                        to={
                          case_.type === "credit"
                            ? `/credit-collection/cases/${case_._id}`
                            : `/admin/legal-case/${case_._id}`
                        }
                        className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-400 rounded-lg transition-all duration-200 border border-blue-500/30 hover:border-blue-500/50 mt-2"
                      >
                        <FaEye className="w-3 h-3 mr-1" />
                        <span className="text-xs">View Details</span>
                        <FaArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xs font-medium text-slate-300 mb-2">
                No cases found
              </h3>
              <p className="text-xs text-slate-400">
                No cases match your search term "{searchTerm}".
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <FaFileAlt className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xs font-medium text-slate-300 mb-2">
                No matters found
              </h3>
              <p className="text-xs text-slate-400">
                This client doesn't have any cases yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
