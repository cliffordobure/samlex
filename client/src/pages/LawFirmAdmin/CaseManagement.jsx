import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  getCreditCases,
  assignCase,
  addCaseComment,
  escalateCase,
  deleteCreditCase,
} from "../../store/slices/creditCaseSlice";
import {
  getLegalCases,
  assignLegalCase,
  addLegalCaseComment,
  deleteLegalCase,
} from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import toast from "react-hot-toast";
import KanbanBoard from "../CreditCollection/KanbanBoard";
import LegalKanbanBoard from "../Legal/LegalKanbanBoard";
import creditCaseApi from "../../store/api/creditCaseApi";
import legalCaseApi from "../../store/api/legalCaseApi";
import socket from "../../utils/socket";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaUserPlus,
  FaPlus,
  FaColumns,
  FaList,
  FaTimes,
  FaExclamationTriangle,
  FaUser,
  FaCalendar,
  FaMoneyBillWave,
  FaGavel,
  FaBuilding,
  FaFileContract,
  FaTrash,
} from "react-icons/fa";

const AdminCaseManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  console.log("🔍 AdminCaseManagement rendered:", {
    user: user?.email,
    role: user?.role,
    lawFirm: user?.lawFirm?._id,
  });
  const {
    cases: creditCases,
    isLoading: creditLoading,
    pagination: creditPagination,
  } = useSelector((state) => state.creditCases);
  const {
    cases: legalCases,
    isLoading: legalLoading,
    pagination: legalPagination,
  } = useSelector((state) => state.legalCases);

  const { users } = useSelector((state) => state.users);

  const [activeTab, setActiveTab] = useState("credit");
  const [viewMode, setViewMode] = useState("kanban");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    search: "",
  });

  // Escalated cases state
  const [escalatedCases, setEscalatedCases] = useState([]);
  const [escalatedLoading, setEscalatedLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedEscalatedCase, setSelectedEscalatedCase] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: "",
    notes: "",
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    caseId: null,
    caseType: null, // 'legal' or 'credit'
    caseNumber: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [creditPage, setCreditPage] = useState(1);
  const [legalPage, setLegalPage] = useState(1);
  const pageSize = 10;

  // Fetch escalated cases - moved before useEffect to fix scoping
  const fetchEscalatedCases = useCallback(async () => {
    setEscalatedLoading(true);
    try {
      const response = await creditCaseApi.getEscalatedCases({
        page: 1,
        limit: 50,
      });
      console.log("Escalated cases response:", response.data);
      setEscalatedCases(response.data.data || []);
    } catch (error) {
      console.error("Error fetching escalated cases:", error);
      toast.error("Failed to fetch escalated cases");
    } finally {
      setEscalatedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.lawFirm?._id) {
      console.log("🔄 Loading cases for law firm:", user.lawFirm._id);
      console.log("🔄 User object:", user);
      // Load paginated cases for the law firm
      dispatch(
        getCreditCases({
          lawFirm: user.lawFirm._id,
          page: creditPage,
          limit: pageSize,
        })
      );
      dispatch(
        getLegalCases({
          lawFirm: user.lawFirm._id,
          page: legalPage,
          limit: pageSize,
        })
      );

      // Load users for assignment
      dispatch(getUsers({ lawFirm: user.lawFirm._id }));

      // Load escalated cases
      fetchEscalatedCases();
    }
  }, [dispatch, user?.lawFirm?._id, fetchEscalatedCases, creditPage, legalPage]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!user?.lawFirm?._id) return;

    // Refetch cases when assignments occur
    const refetchCases = () => {
      dispatch(
        getCreditCases({
          lawFirm: user.lawFirm._id,
          page: creditPage,
          limit: pageSize,
        })
      );
      dispatch(
        getLegalCases({
          lawFirm: user.lawFirm._id,
          page: legalPage,
          limit: pageSize,
        })
      );
    };

    // Listen for case escalated events
    const handleCaseEscalated = (data) => {
      console.log("🔄 Case escalated event received:", data);
      toast.success(`Case ${data.caseNumber} has been escalated to legal department`);
      fetchEscalatedCases(); // Refresh the escalated cases list
    };

    // Listen for credit case updates that might affect escalated cases
    const handleCreditCaseUpdated = (data) => {
      console.log("🔄 Credit case updated event received:", data);
      if (data.escalatedToLegal) {
        fetchEscalatedCases(); // Refresh the escalated cases list
      }
    };

    // Join the law firm room for real-time updates
    socket.emit("join-law-firm", user.lawFirm._id);

    // Add event listeners
    socket.on("caseAssigned", refetchCases);
    socket.on("legalCaseAssigned", refetchCases);
    socket.on("caseMoved", refetchCases);
    socket.on("legalCaseStatusUpdated", refetchCases);
    socket.on("caseEscalated", handleCaseEscalated);
    socket.on("creditCaseUpdated", handleCreditCaseUpdated);

    // Cleanup function
    return () => {
      socket.off("caseAssigned", refetchCases);
      socket.off("legalCaseAssigned", refetchCases);
      socket.off("caseMoved", refetchCases);
      socket.off("legalCaseStatusUpdated", refetchCases);
      socket.off("caseEscalated", handleCaseEscalated);
      socket.off("creditCaseUpdated", handleCreditCaseUpdated);
      socket.emit("leave-law-firm", user.lawFirm._id);
    };
  }, [dispatch, user?.lawFirm?._id, fetchEscalatedCases, creditPage, legalPage]);

  const handleAssignCase = async (caseId, userId, caseType = "credit") => {
    try {
      if (caseType === "credit") {
        await dispatch(assignCase({ id: caseId, userId })).unwrap();
        // Refresh credit cases list
        dispatch(getCreditCases({ lawFirm: user?.lawFirm?._id }));
      } else {
        await dispatch(assignLegalCase({ id: caseId, userId })).unwrap();
        // Refresh legal cases list
        dispatch(getLegalCases({ lawFirm: user?.lawFirm?._id }));
      }
      toast.success("Case assigned successfully!");
    } catch (error) {
      toast.error("Failed to assign case");
    }
  };

  const handleAddComment = async (caseId, comment, caseType = "credit") => {
    try {
      if (caseType === "credit") {
        await dispatch(addCaseComment({ id: caseId, comment })).unwrap();
      } else if (caseType === "legal") {
        await dispatch(addLegalCaseComment({ id: caseId, comment })).unwrap();
      }
      toast.success("Comment added successfully!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleEscalateCase = async (caseId) => {
    try {
      await dispatch(escalateCase({ id: caseId, data: {} })).unwrap();
      toast.success("Case escalated successfully!");
    } catch (error) {
      toast.error("Failed to escalate case");
    }
  };

  // Handle escalated case assignment
  const handleAssignEscalatedCase = async () => {
    if (!assignmentData.assignedTo) {
      toast.error("Please select an advocate");
      return;
    }

    if (!selectedEscalatedCase) {
      toast.error("No case selected");
      return;
    }

    console.log("Selected case:", selectedEscalatedCase);
    console.log("Assignment data:", assignmentData);

    setAssignLoading(true);
    try {
      // Create comprehensive legal case from escalated case
      const legalCaseData = {
        title: `Legal Case - ${selectedEscalatedCase.title || selectedEscalatedCase.caseNumber}`,
        caseType: "debt_collection",
        description: `Escalated from credit collection case ${selectedEscalatedCase.caseNumber}: ${selectedEscalatedCase.description || 'Payment default requiring legal action'}`,
        priority: selectedEscalatedCase.priority || "medium",
        status: "assigned",
        lawFirm: user.lawFirm._id,
        client: selectedEscalatedCase.client?._id || null,
        caseReference: selectedEscalatedCase.caseNumber,
        filingFee: {
          amount: selectedEscalatedCase.escalationPayment?.amount || selectedEscalatedCase.debtAmount || 5000,
          currency: selectedEscalatedCase.currency || "KES",
          paid: selectedEscalatedCase.escalationPayment?.status === "confirmed" || false,
          paidAt: selectedEscalatedCase.escalationPayment?.confirmedAt || null,
        },
        // Note: Client will be handled by backend if not provided
        // Transfer creditor information as opposing party
        opposingParty: {
          name: selectedEscalatedCase.creditorName || '',
          contact: {
            email: selectedEscalatedCase.creditorEmail || '',
            phone: selectedEscalatedCase.creditorContact || '',
          },
        },
        escalatedFrom: {
          creditCaseId: selectedEscalatedCase._id,
          escalationDate: selectedEscalatedCase.escalationDate,
          escalationFee: selectedEscalatedCase.escalationPayment?.amount,
          escalationReason: "Payment default - requires legal action",
        },
        escalatedFromCreditCase: selectedEscalatedCase._id, // Add this for backend compatibility
        assignedTo: assignmentData.assignedTo,
        assignedBy: user._id,
        // Transfer all documents from credit case
        documents: selectedEscalatedCase.documents || [],
        assignedAt: new Date(),
        createdBy: user._id,
      };

      console.log("Legal case data:", legalCaseData);

      const legalCaseResponse = await legalCaseApi.createLegalCase(
        legalCaseData
      );

      console.log("Legal case created:", legalCaseResponse.data);

      // Update the escalated case to mark it as processed
      try {
        const updateResponse = await creditCaseApi.updateEscalatedCaseStatus(
          selectedEscalatedCase._id,
          {
            processed: true,
            legalCaseId: legalCaseResponse.data?.data?._id || "created",
          }
        );
        console.log("Escalated case updated:", updateResponse.data);
      } catch (error) {
        console.warn("Could not update escalated case status:", error);
      }

      toast.success("Escalated case assigned to advocate successfully!");
      setShowAssignmentModal(false);
      setSelectedEscalatedCase(null);
      setAssignmentData({ assignedTo: "", notes: "" });

      // Refresh both escalated cases and legal cases
      console.log("Refreshing data...");
      await fetchEscalatedCases();
      await dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));

      // Switch to legal cases tab to show the newly created case
      setActiveTab("legal");
    } catch (error) {
      console.error("Error assigning escalated case:", error);
      toast.error(
        error.response?.data?.message || "Failed to assign escalated case"
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle delete case
  const handleDeleteCase = (caseId, caseType, caseNumber) => {
    setDeleteModal({
      isOpen: true,
      caseId,
      caseType,
      caseNumber,
    });
  };

  const confirmDeleteCase = async () => {
    if (!deleteModal.caseId || !deleteModal.caseType) return;

    setIsDeleting(true);
    try {
      if (deleteModal.caseType === "legal") {
        await dispatch(deleteLegalCase(deleteModal.caseId)).unwrap();
        toast.success("Legal case deleted successfully");
        // Refresh legal cases
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
      } else if (deleteModal.caseType === "credit") {
        await dispatch(deleteCreditCase(deleteModal.caseId)).unwrap();
        toast.success("Credit case deleted successfully");
        // Refresh credit cases
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
        // Refresh escalated cases if needed
        fetchEscalatedCases();
      }
      setDeleteModal({ isOpen: false, caseId: null, caseType: null, caseNumber: null });
    } catch (error) {
      toast.error(error.message || "Failed to delete case");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteCase = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, caseId: null, caseType: null, caseNumber: null });
    }
  };

  // Open assignment modal for escalated case
  const openAssignmentModal = (escalatedCase) => {
    setSelectedEscalatedCase(escalatedCase);
    setAssignmentData({ assignedTo: "", notes: "" });
    setShowAssignmentModal(true);
  };

  const filteredCreditCases = useMemo(() => {
    console.log("🔍 Credit cases loaded:", {
      total: creditCases?.length || 0,
      cases: creditCases?.map((c) => ({
        id: c._id,
        caseNumber: c.caseNumber,
        title: c.title,
        lawFirm: c.lawFirm,
      })),
    });
    console.log("🔍 Raw credit cases:", creditCases);

    if (!creditCases) return [];

    let filtered = creditCases;

    if (filters.search) {
      filtered = filtered.filter(
        (case_) =>
          case_.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
          case_.caseNumber
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          case_.debtorName?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter((case_) => case_.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(
        (case_) => case_.priority === filters.priority
      );
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(
        (case_) => case_.assignedTo?._id === filters.assignedTo
      );
    }

    return filtered;
  }, [creditCases, filters]);

  const filteredLegalCases = useMemo(() => {
    console.log("🔍 Legal cases loaded:", {
      total: legalCases?.length || 0,
      cases: legalCases?.map((c) => ({
        id: c._id,
        caseNumber: c.caseNumber,
        title: c.title,
      })),
    });

    if (!legalCases) return [];

    let filtered = legalCases;

    if (filters.search) {
      filtered = filtered.filter(
        (case_) =>
          case_.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
          case_.caseNumber
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          case_.description
            ?.toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter((case_) => case_.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(
        (case_) => case_.priority === filters.priority
      );
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(
        (case_) => case_.assignedTo?._id === filters.assignedTo
      );
    }

    return filtered;
  }, [legalCases, filters]);

  const debtCollectors =
    users?.filter((u) => u.role === "debt_collector") || [];
  const advocates = users?.filter((u) => u.role === "advocate") || [];
  const creditAssignableUsers =
    users?.filter((u) =>
      ["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
        u.role
      )
    ) || [];
  const legalAssignableUsers =
    users?.filter((u) =>
      ["advocate", "legal_head", "law_firm_admin", "admin"].includes(u.role)
    ) || [];

  const getStatusBadgeClass = (status) => {
    const classes = {
      new: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      filed: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      assigned: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      under_review: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      court_proceedings: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      follow_up_required: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      escalated_to_legal: "bg-red-500/20 text-red-400 border border-red-500/30",
      settlement: "bg-green-500/20 text-green-400 border border-green-500/30",
      resolved: "bg-green-500/20 text-green-400 border border-green-500/30",
      closed: "bg-green-500/20 text-green-400 border border-green-500/30",
    };
    return classes[status] || "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      low: "bg-green-500/20 text-green-400 border border-green-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      high: "bg-red-500/20 text-red-400 border border-red-500/30",
      urgent: "bg-red-500/20 text-red-400 border border-red-500/30",
    };
    return classes[priority] || "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  };

  // Show loading state if user is not loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Case Management
            </h1>
            <p className="text-slate-300 mt-2 text-base sm:text-lg max-w-2xl">
              Monitor and manage all cases across departments. Assign cases, view
              progress, and collaborate efficiently.{" "}
              <span className="font-semibold text-blue-400">
                Status changes
              </span>{" "}
              are restricted to case handlers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl sm:rounded-2xl border border-slate-600/50 transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 justify-center"
            >
              {viewMode === "list" ? <FaColumns className="w-4 h-4" /> : <FaList className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === "list" ? "Kanban View" : "List View"}</span>
            </button>
            <button
              onClick={() => navigate(`/admin/create-${activeTab}-case`)}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 justify-center"
            >
              <FaPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Create {activeTab === "credit" ? "Credit Collection" : "Legal"} Case</span>
              <span className="sm:hidden">New Case</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-slate-800/80 backdrop-blur-xl rounded-2xl p-2 sm:p-3 shadow-lg border border-slate-600/50 w-full sm:w-fit mx-auto">
        <button
          className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
            activeTab === "credit"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
          }`}
          onClick={() => setActiveTab("credit")}
        >
          <div className="flex items-center justify-center gap-2">
            <FaBuilding className="w-4 h-4" />
            <span className="hidden sm:inline">Credit Collection</span>
            <span className="sm:hidden">Credit</span>
            <span className="ml-1 text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
              {filteredCreditCases.length}
            </span>
          </div>
        </button>
        <button
          className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
            activeTab === "legal"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
          }`}
          onClick={() => setActiveTab("legal")}
        >
          <div className="flex items-center justify-center gap-2">
            <FaGavel className="w-4 h-4" />
            <span className="hidden sm:inline">Legal Cases</span>
            <span className="sm:hidden">Legal</span>
            <span className="ml-1 text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
              {filteredLegalCases.length}
            </span>
          </div>
        </button>
        <button
          className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
            activeTab === "escalated"
              ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/25"
              : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
          }`}
          onClick={() => setActiveTab("escalated")}
        >
          <div className="flex items-center justify-center gap-2">
            <FaExclamationTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Escalated</span>
            <span className="sm:hidden">Escalated</span>
            <span className="ml-1 text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
              {escalatedCases.length}
            </span>
          </div>
        </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <FaFilter className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Filters
            </h3>
          </div>
          
          {/* Mobile Search - Full Width */}
          <div className="lg:hidden mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
          </div>
          
          {/* Desktop Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Desktop Search */}
            <div className="hidden lg:block relative">
              <input
                type="text"
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
            
            <select
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="follow_up_required">Follow Up Required</option>
              <option value="escalated_to_legal">Escalated to Legal</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            
            <select
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              value={filters.assignedTo}
              onChange={(e) =>
                setFilters({ ...filters, assignedTo: e.target.value })
              }
            >
              <option value="">All Users</option>
              {creditAssignableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} (
                  {user.role.replace("_", " ")})
                </option>
              ))}
              {legalAssignableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} (
                  {user.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end mt-4 sm:mt-6">
            <button
              onClick={() =>
                setFilters({
                  status: "",
                  priority: "",
                  assignedTo: "",
                  search: "",
                })
              }
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl border border-slate-600/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <FaTimes className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      <div className="mb-6 md:mb-8">
        <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg sm:text-xl text-blue-400 mb-2">
                Admin Permissions
              </h3>
              <div className="text-sm sm:text-base text-slate-300">
                You can view all cases, assign cases to handlers, and monitor
                progress. Status changes are restricted to debt collectors and
                advocates only.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6 md:mb-8">
        {viewMode === "kanban" ? (
          <div>
            {activeTab === "credit" ? (
              <KanbanBoard
                cases={filteredCreditCases}
                isLoading={creditLoading}
                isAdminView={true}
                onAssignCase={handleAssignCase}
                onAddComment={handleAddComment}
                onEscalateCase={handleEscalateCase}
                availableUsers={creditAssignableUsers}
              />
            ) : (
              <LegalKanbanBoard
                cases={filteredLegalCases}
                isLoading={legalLoading}
                isAdminView={true}
                onAssignCase={handleAssignCase}
                onAddComment={handleAddComment}
                availableUsers={legalAssignableUsers}
              />
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-600/50 shadow-2xl">
            <div className="p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                {activeTab === "credit"
                  ? "Credit Collection Cases"
                  : "Legal Cases"}
              </h3>

              {activeTab === "credit" ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-600/50">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Case Number
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden sm:table-cell">
                          Title
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">
                          Debtor
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Amount
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden sm:table-cell">
                          Priority
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Status
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">
                          Assigned To
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">
                          Created
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCreditCases.map((case_, index) => (
                        <tr
                          key={case_._id}
                          className={`border-b border-slate-600/50 ${
                            index % 2 === 0
                              ? "bg-slate-900/30"
                              : "bg-slate-800/30"
                          } hover:bg-slate-700/50 transition-all duration-300`}
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-white">
                            <Link
                              to={`/admin/credit-case/${case_._id}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {case_.caseNumber}
                            </Link>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden sm:table-cell">
                            {case_.title}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden md:table-cell">
                            {case_.debtorName}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white font-medium">
                            <div className="flex items-center gap-1">
                              <FaMoneyBillWave className="w-3 h-3 text-green-400" />
                              <span>KES {case_.debtAmount?.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getPriorityBadgeClass(
                                case_.priority
                              )}`}
                            >
                              {case_.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusBadgeClass(
                                case_.status
                              )}`}
                            >
                              {case_.status?.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden lg:table-cell">
                            {case_.assignedTo?.firstName &&
                            case_.assignedTo?.lastName
                              ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}`
                              : "Unassigned"}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <FaCalendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(case_.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                className="w-full sm:w-auto px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={case_.assignedTo?._id || ""}
                                onChange={(e) =>
                                  handleAssignCase(
                                    case_._id,
                                    e.target.value,
                                    "credit"
                                  )
                                }
                              >
                                <option value="">Assign...</option>
                                {creditAssignableUsers.map((user) => (
                                  <option key={user._id} value={user._id}>
                                    {user.firstName} {user.lastName}
                                  </option>
                                ))}
                              </select>
                              <Link
                                to={`/admin/credit-case/${case_._id}`}
                                className="w-full sm:w-auto px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg text-xs transition-all duration-300 flex items-center justify-center gap-1"
                              >
                                <FaEye className="w-3 h-3" />
                                <span>View</span>
                              </Link>
                              {user?.role === "law_firm_admin" && (
                                <button
                                  className="w-full sm:w-auto px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-xs transition-all duration-300 flex items-center justify-center gap-1"
                                  onClick={() => handleDeleteCase(case_._id, "credit", case_.caseNumber)}
                                  title="Delete case"
                                >
                                  <FaTrash className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(creditPagination || filteredCreditCases.length > 0) && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 mt-4 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-300">
                      {creditPagination ? (
                        <>
                          Page <span className="font-semibold text-white">{creditPagination.currentPage || creditPage}</span> of{" "}
                          <span className="font-semibold text-white">{creditPagination.totalPages || 1}</span>
                          {creditPagination.totalCount !== undefined && (
                            <span className="text-slate-500 ml-2">
                              ({creditPagination.totalCount} total cases)
                            </span>
                          )}
                        </>
                      ) : (
                        <span>Showing {filteredCreditCases.length} cases</span>
                      )}
                    </span>
                    {creditPagination && creditPagination.totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCreditPage(Math.max(1, creditPage - 1))
                          }
                          disabled={creditPage === 1}
                          className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCreditPage(
                              Math.min(
                                creditPagination.totalPages,
                                creditPage + 1
                              )
                            )
                          }
                          disabled={creditPage >= creditPagination.totalPages}
                          className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-600/50">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Case Number
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden sm:table-cell">
                          Title
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">
                          Type
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Status
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden sm:table-cell">
                          Priority
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden lg:table-cell">
                          Assigned To
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">
                          Created
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLegalCases.map((case_, index) => (
                        <tr
                          key={case_._id}
                          className={`border-b border-slate-600/50 ${
                            index % 2 === 0
                              ? "bg-slate-900/30"
                              : "bg-slate-800/30"
                          } hover:bg-slate-700/50 transition-all duration-300`}
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-white">
                            <button
                              onClick={() => {
                                console.log(
                                  "🔗 Navigating to case via case number:",
                                  case_._id
                                );
                                navigate(`/admin/case/${case_._id}`);
                              }}
                              className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                            >
                              {case_.caseNumber}
                            </button>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden sm:table-cell">
                            {case_.title}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <FaGavel className="w-3 h-3 text-purple-400" />
                              <span>{case_.caseType}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusBadgeClass(
                                case_.status
                              )}`}
                            >
                              {case_.status?.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getPriorityBadgeClass(
                                case_.priority
                              )}`}
                            >
                              {case_.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden lg:table-cell">
                            {case_.assignedTo?.firstName &&
                            case_.assignedTo?.lastName
                              ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}`
                              : "Unassigned"}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <FaCalendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(case_.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                className="w-full sm:w-auto px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={case_.assignedTo?._id || ""}
                                onChange={(e) =>
                                  handleAssignCase(
                                    case_._id,
                                    e.target.value,
                                    "legal"
                                  )
                                }
                              >
                                <option value="">Assign...</option>
                                {legalAssignableUsers.map((user) => (
                                  <option key={user._id} value={user._id}>
                                    {user.firstName} {user.lastName}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="w-full sm:w-auto px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg text-xs transition-all duration-300 flex items-center justify-center gap-1"
                                onClick={() => {
                                  console.log(
                                    "🔗 Navigating to case:",
                                    case_._id,
                                    "URL:",
                                    `/admin/case/${case_._id}`
                                  );
                                  // Use unified case details route that will determine the correct type
                                  navigate(`/admin/case/${case_._id}`);
                                }}
                              >
                                <FaEye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                              {user?.role === "law_firm_admin" && (
                                <button
                                  className="w-full sm:w-auto px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-xs transition-all duration-300 flex items-center justify-center gap-1"
                                  onClick={() => handleDeleteCase(case_._id, "legal", case_.caseNumber)}
                                  title="Delete case"
                                >
                                  <FaTrash className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(legalPagination || filteredLegalCases.length > 0) && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 mt-4 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-300">
                      {legalPagination ? (
                        <>
                          Page <span className="font-semibold text-white">{legalPagination.currentPage || legalPage}</span> of{" "}
                          <span className="font-semibold text-white">{legalPagination.totalPages || 1}</span>
                          {legalPagination.totalCount !== undefined && (
                            <span className="text-slate-500 ml-2">
                              ({legalPagination.totalCount} total cases)
                            </span>
                          )}
                        </>
                      ) : (
                        <span>Showing {filteredLegalCases.length} cases</span>
                      )}
                    </span>
                    {legalPagination && legalPagination.totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setLegalPage(Math.max(1, legalPage - 1))
                          }
                          disabled={legalPage === 1}
                          className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setLegalPage(
                              Math.min(
                                legalPagination.totalPages,
                                legalPage + 1
                              )
                            )
                          }
                          disabled={legalPage >= legalPagination.totalPages}
                          className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              )}
            </div>
          </div>
        )}

        {/* Escalated Cases Content */}
        {activeTab === "escalated" && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-600/50 shadow-2xl">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Escalated Cases
                </h3>
                <div className="text-sm text-slate-300">
                  {escalatedLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `${escalatedCases.length} cases escalated to legal`
                  )}
                </div>
              </div>

              {escalatedLoading ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-300 mt-4 text-lg">
                    Loading escalated cases...
                  </p>
                </div>
              ) : escalatedCases.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    No Escalated Cases
                  </h4>
                  <p className="text-slate-300">
                    All cases are being handled properly in the credit
                    collection department.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-600/50">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Case Number
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden sm:table-cell">
                          Title
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">
                          Debtor/Client
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Amount
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden sm:table-cell">
                          Priority
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white hidden md:table-cell">
                          Escalation Date
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Payment Status
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {escalatedCases.map((case_, index) => (
                        <tr
                          key={case_._id}
                          className={`border-b border-slate-600/50 ${
                            index % 2 === 0
                              ? "bg-slate-900/30"
                              : "bg-slate-800/30"
                          } hover:bg-slate-700/50 transition-all duration-300`}
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-white">
                            <Link
                              to={`/admin/credit-case/${case_._id}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {case_.caseNumber}
                            </Link>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden sm:table-cell">
                            {case_.title}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden md:table-cell">
                            {case_.client
                              ? `${case_.client.firstName} ${case_.client.lastName}`
                              : case_.debtorName || "N/A"}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-white font-medium">
                            <div className="flex items-center gap-1">
                              <FaMoneyBillWave className="w-3 h-3 text-green-400" />
                              <span>KES {case_.debtAmount?.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getPriorityBadgeClass(
                                case_.priority
                              )}`}
                            >
                              {case_.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-300 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <FaCalendar className="w-3 h-3 text-slate-400" />
                              <span>
                                {case_.escalationDate
                                  ? new Date(
                                      case_.escalationDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                                case_.escalationPayment?.status === "confirmed"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              }`}
                            >
                              {case_.escalationPayment?.status === "confirmed"
                                ? "PAID"
                                : "PENDING"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                className="w-full sm:w-auto px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1 disabled:opacity-50"
                                onClick={() => openAssignmentModal(case_)}
                                disabled={assignLoading}
                              >
                                {assignLoading ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <FaUserPlus className="w-3 h-3" />
                                    <span className="hidden sm:inline">Assign to Advocate</span>
                                    <span className="sm:hidden">Assign</span>
                                  </>
                                )}
                              </button>
                              <Link
                                to={`/admin/credit-case/${case_._id}`}
                                className="w-full sm:w-auto px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 hover:text-white rounded-lg text-xs transition-all duration-300 flex items-center justify-center gap-1"
                              >
                                <FaEye className="w-3 h-3" />
                                <span className="hidden sm:inline">View Details</span>
                                <span className="sm:hidden">View</span>
                              </Link>
                              {user?.role === "law_firm_admin" && (
                                <button
                                  className="w-full sm:w-auto px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-xs transition-all duration-300 flex items-center justify-center gap-1"
                                  onClick={() => handleDeleteCase(case_._id, "credit", case_.caseNumber)}
                                  title="Delete case"
                                >
                                  <FaTrash className="w-3 h-3" />
                                  <span className="hidden sm:inline">Delete</span>
                                  <span className="sm:hidden">Del</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 w-full max-w-md mx-auto border border-slate-600/50 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white">Delete Case</h3>
                <p className="text-slate-400 text-sm">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-white mb-2">
                Are you sure you want to permanently delete this case?
              </p>
              <p className="text-slate-300 text-sm">
                <strong>Case Number:</strong> {deleteModal.caseNumber}
              </p>
              <p className="text-slate-300 text-sm">
                <strong>Type:</strong> {deleteModal.caseType === "legal" ? "Legal Case" : "Credit Collection Case"}
              </p>
              <p className="text-red-400 text-sm mt-2 font-semibold">
                ⚠️ This will permanently delete the case and all associated data from the database.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={cancelDeleteCase}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={confirmDeleteCase}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FaTrash className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal for Escalated Cases */}
      {showAssignmentModal && selectedEscalatedCase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 w-full max-w-md mx-auto border border-slate-600/50 shadow-2xl">
            <h3 className="font-bold text-xl mb-6 text-white">
              Assign Escalated Case to Advocate
            </h3>

            <div className="mb-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <h4 className="font-semibold text-white mb-3">Case Details</h4>
              <div className="text-sm text-slate-300 space-y-2">
                <div className="flex items-center gap-2">
                  <FaBuilding className="w-4 h-4 text-blue-400" />
                  <span><strong>Case:</strong> {selectedEscalatedCase.caseNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaFileContract className="w-4 h-4 text-purple-400" />
                  <span><strong>Title:</strong> {selectedEscalatedCase.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4 text-green-400" />
                  <span><strong>Debtor:</strong> {selectedEscalatedCase.debtorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="w-4 h-4 text-green-400" />
                  <span><strong>Amount:</strong> KES{" "}
                  {selectedEscalatedCase.debtAmount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />
                  <span><strong>Priority:</strong> {selectedEscalatedCase.priority}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Advocate
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  value={assignmentData.assignedTo}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      assignedTo: e.target.value,
                    })
                  }
                >
                  <option value="">Choose an advocate</option>
                  {advocates.map((advocate) => (
                    <option key={advocate._id} value={advocate._id}>
                      {advocate.firstName} {advocate.lastName}
                      {advocate.email && ` (${advocate.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="Add any notes about this assignment..."
                  value={assignmentData.notes}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300"
                onClick={() => setShowAssignmentModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAssignEscalatedCase}
                disabled={!assignmentData.assignedTo || assignLoading}
              >
                {assignLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Assigning...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaUserPlus className="w-4 h-4" />
                    <span>Assign to Advocate</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCaseManagement;
