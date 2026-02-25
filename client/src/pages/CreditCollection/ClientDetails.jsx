import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchClientById } from "../../store/slices/clientSlice";
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
  FaArrowRight
} from "react-icons/fa";

const ClientDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentClient, loading } = useSelector((state) => state.clients);
  const { user } = useSelector((state) => state.auth);

  const [creditCases, setCreditCases] = useState([]);
  const [legalCases, setLegalCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchClientById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (id && currentClient) {
      fetchClientCases();
    }
  }, [id, currentClient, user]);

  const fetchClientCases = async () => {
    try {
      setLoadingCases(true);
      
      if (!currentClient) {
        setLoadingCases(false);
        return;
      }
      
      console.log("Fetching cases for client:", id, currentClient);
      
      // For debt collectors, fetch all assigned cases and match by client or debtor info
      if (user?.role === "debt_collector") {
        // First, try to fetch cases with client field set
        const creditResponseWithClient = await creditCaseApi.getCreditCases({ 
          client: id,
          assignedTo: user._id,
          limit: 1000 
        });
        let creditCasesWithClient = creditResponseWithClient?.data?.data || [];
        console.log("Cases with client field:", creditCasesWithClient.length);
        
        // Also fetch all assigned cases to match by debtor info
        const assignedCreditResponse = await creditCaseApi.getCreditCases({ 
          assignedTo: user._id, 
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
            // Remove spaces, dashes, and other formatting
            const normalizePhone = (phone) => phone.replace(/[\s\-\(\)]/g, '');
            const casePhoneNormalized = normalizePhone(caseDebtorContact);
            const clientPhoneNormalized = normalizePhone(clientPhone);
            
            if (casePhoneNormalized === clientPhoneNormalized || 
                caseDebtorContact.trim() === clientPhone.trim()) {
              
              // If phone matches, be more lenient with name matching
              let nameMatches = false;
              
              if (caseDebtorName && (clientName || clientCompanyName)) {
                const caseNameLower = caseDebtorName.toLowerCase().trim();
                const clientNameLower = (clientName || '').toLowerCase().trim();
                const clientCompanyLower = (clientCompanyName || '').toLowerCase().trim();
                
                // Exact match
                if (caseNameLower === clientNameLower || caseNameLower === clientCompanyLower) {
                  nameMatches = true;
                }
                // Partial match (one contains the other)
                else if (caseNameLower.includes(clientNameLower) || clientNameLower.includes(caseNameLower) ||
                         caseNameLower.includes(clientCompanyLower) || clientCompanyLower.includes(caseNameLower)) {
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
                }
              }
              
              // If phone matches, include it (name matching is optional for phone matches)
              if (nameMatches || !caseDebtorName || !clientName) {
                console.log("✓✓✓ MATCHED by phone:", case_._id, "Name match:", nameMatches);
                return true;
              }
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
        console.log("Sample case:", allCreditCases[0]);
        
        setCreditCases(allCreditCases);

        // Fetch legal cases assigned to this debt collector for this client
        const assignedLegalResponse = await legalCaseApi.getLegalCases({ 
          assignedTo: user._id,
          limit: 1000 
        });
        const allAssignedLegalCases = assignedLegalResponse.data?.data || assignedLegalResponse.data || [];
        const matchedLegalCases = allAssignedLegalCases.filter((case_) => {
          if (!case_.client) return false;
          const clientId = typeof case_.client === 'string' ? case_.client : (case_.client._id || case_.client);
          return clientId.toString() === id;
        });
        console.log("Matched legal cases:", matchedLegalCases.length);
        setLegalCases(matchedLegalCases);
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
      console.error("Error fetching client cases:", error);
    } finally {
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

      {/* Cases Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg">
                <FaFileAlt className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xs font-semibold text-white">
                All Matters ({allCases.length})
              </h3>
            </div>
          </div>
        </div>
        <div className="p-6">
          {allCases.length > 0 ? (
            <div className="space-y-4">
              {allCases.map((case_) => (
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
                        {case_.caseNumber && (
                          <span className="flex items-center space-x-1">
                            <FaFileAlt className="w-3 h-3 text-slate-400" />
                            <span>{case_.caseNumber}</span>
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
