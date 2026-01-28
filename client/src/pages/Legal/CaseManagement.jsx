import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getLegalCases,
  updateLegalCaseStatus,
  assignLegalCase,
  getPendingAssignmentCases,
  getLegalCaseStatistics,
  deleteLegalCase,
} from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import LegalKanbanBoard from "./LegalKanbanBoard";
import toast from "react-hot-toast";
import socket from "../../utils/socket";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaUserPlus,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaBriefcase,
  FaUsers,
  FaFileAlt,
  FaDownload,
  FaSyncAlt,
  FaCog,
  FaShieldAlt,
  FaFileContract,
  FaUserTie,
  FaArrowUp,
  FaBell,
  FaTimes,
  FaBars,
  FaFilePdf,
  FaFileCsv,
  FaChartLine,
  FaChartPie,
  FaRocket,
  FaLightbulb,
  FaHandshake,
  FaAward,
  FaCalendarCheck,
  FaUserCheck,
  FaUserTimes,
  FaFileInvoiceDollar,
  FaBalanceScale as FaScale,
  FaShieldAlt as FaShield,
  FaRocket as FaRocketIcon,
  FaLightbulb as FaBulb,
  FaCog as FaSettings,
  FaInfoCircle,
  FaMinus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaBookmark,
  FaShare,
  FaPrint,
  FaEllipsisH,
  FaThumbsUp,
  FaThumbsDown,
  FaComments,
  FaPaperclip,
  FaLink,
  FaExternalLinkAlt,
  FaList,
  FaColumns,
  FaTrash,
} from "react-icons/fa";

const LegalCaseManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cases, isLoading } = useSelector((state) => state.legalCases);
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  const [filteredCases, setFilteredCases] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    caseType: "",
    priority: "",
    assignedTo: "",
    search: "",
    escalatedFrom: "",
  });
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'list', or 'kanban'
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCases, setSelectedCases] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    caseId: "",
    assignedTo: "",
    notes: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    caseId: null,
    caseNumber: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Statistics for the dashboard
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    resolvedCases: 0,
    pendingCases: 0,
    urgentCases: 0,
    thisMonthCases: 0,
    lastMonthCases: 0,
    caseGrowth: 0,
  });

  // Fetch cases and users
  useEffect(() => {
    if (!user) return;

    // Load cases based on user role
    if (user.role === "legal_head") {
      dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
      dispatch(getPendingAssignmentCases());
    } else if (user.role === "advocate") {
      dispatch(getLegalCases({ assignedTo: user._id }));
    }

    // Load advocates for assignment
    if (user.role === "legal_head") {
      dispatch(getUsers({ role: "advocate", lawFirm: user.lawFirm._id }));
    }

    // Load statistics
    dispatch(getLegalCaseStatistics({ period: "30" }));
  }, [dispatch, user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!user) return;

    const refetchCases = () => {
      if (user.role === "legal_head") {
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
        dispatch(getPendingAssignmentCases());
      } else if (user.role === "advocate") {
        dispatch(getLegalCases({ assignedTo: user._id }));
      }
    };

    socket.on("legalCaseAssigned", refetchCases);
    socket.on("legalCaseStatusUpdated", refetchCases);
    socket.on("legalCaseCreated", refetchCases);

    return () => {
      socket.off("legalCaseAssigned", refetchCases);
      socket.off("legalCaseStatusUpdated", refetchCases);
      socket.off("legalCaseCreated", refetchCases);
    };
  }, [dispatch, user]);

  useEffect(() => {
    if (!cases || !Array.isArray(cases)) return;

    // Calculate statistics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const activeCases = cases.filter((c) =>
      ["assigned", "under_review", "court_proceedings"].includes(c.status || "pending")
    );
    const resolvedCases = cases.filter((c) =>
      ["resolved", "closed"].includes(c.status || "pending")
    );
    const pendingCases = cases.filter((c) => (c.status || "pending") === "pending_assignment");
    const urgentCases = cases.filter((c) => (c.priority || "medium") === "urgent" || (c.priority || "medium") === "high");
    
    const thisMonthCases = cases.filter((c) =>
      new Date(c.createdAt) >= thisMonth
    );
    const lastMonthCases = cases.filter((c) =>
      new Date(c.createdAt) >= lastMonth && new Date(c.createdAt) < thisMonth
    );

    const caseGrowth = lastMonthCases.length > 0 ? ((thisMonthCases.length - lastMonthCases.length) / lastMonthCases.length) * 100 : 0;

    setStats({
      totalCases: cases.length,
      activeCases: activeCases.length,
      resolvedCases: resolvedCases.length,
      pendingCases: pendingCases.length,
      urgentCases: urgentCases.length,
      thisMonthCases: thisMonthCases.length,
      lastMonthCases: lastMonthCases.length,
      caseGrowth: Math.round(caseGrowth * 100) / 100,
    });

    let filtered = cases;

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((case_) => (case_.status || "pending") === filters.status);
    }
    if (filters.caseType) {
      filtered = filtered.filter(
        (case_) => (case_.caseType || "other") === filters.caseType
      );
    }
    if (filters.priority) {
      filtered = filtered.filter(
        (case_) => (case_.priority || "medium") === filters.priority
      );
    }
    if (filters.assignedTo) {
      filtered = filtered.filter(
        (case_) => case_.assignedTo?._id === filters.assignedTo
      );
    }
    if (filters.escalatedFrom === "true") {
      filtered = filtered.filter((case_) => case_.escalatedFrom?.creditCaseId);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (case_) =>
          case_.title.toLowerCase().includes(searchTerm) ||
          case_.caseNumber.toLowerCase().includes(searchTerm) ||
          case_.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    const sortedFiltered = [...filtered].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCases(sortedFiltered);
  }, [cases, filters, sortBy, sortOrder]);

  const handleStatusUpdate = async (caseId, newStatus) => {
    try {
      await dispatch(
        updateLegalCaseStatus({ id: caseId, status: newStatus })
      ).unwrap();
      toast.success("Case status updated successfully");
    } catch (error) {
      toast.error(error || "Failed to update case status");
    }
  };

  const handleAssignCase = async () => {
    try {
      await dispatch(
        assignLegalCase({
          id: assignmentData.caseId,
          userId: assignmentData.assignedTo,
        })
      ).unwrap();
      toast.success("Case assigned successfully");
      setShowAssignmentModal(false);
      setAssignmentData({ caseId: "", assignedTo: "", notes: "" });
      
      // Immediately refetch cases to show updated assignment
      if (user.role === "legal_head") {
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
        dispatch(getPendingAssignmentCases());
      } else if (user.role === "advocate") {
        dispatch(getLegalCases({ assignedTo: user._id }));
      }
    } catch (error) {
      toast.error(error || "Failed to assign case");
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      const promises = selectedCases.map(caseId =>
        dispatch(updateLegalCaseStatus({ id: caseId, status: newStatus }))
      );
      await Promise.all(promises);
      toast.success(`${selectedCases.length} cases updated successfully`);
      setSelectedCases([]);
      setShowBulkActions(false);
    } catch (error) {
      toast.error("Failed to update some cases");
    }
  };

  const handleCaseSelection = (caseId) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCases.length === filteredCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(filteredCases.map(c => c._id));
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="w-3 h-3" />;
    return sortOrder === "asc" ? <FaSortUp className="w-3 h-3" /> : <FaSortDown className="w-3 h-3" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_assignment: "text-yellow-500",
      filed: "text-blue-500",
      assigned: "text-purple-500",
      under_review: "text-orange-500",
      court_proceedings: "text-red-500",
      settlement: "text-green-500",
      resolved: "text-emerald-500",
      closed: "text-gray-500",
    };
    return colors[status] || "text-gray-500";
  };

  const getStatusBgColor = (status) => {
    const colors = {
      pending_assignment: "bg-yellow-500/10 border-yellow-500/20",
      filed: "bg-blue-500/10 border-blue-500/20",
      assigned: "bg-purple-500/10 border-purple-500/20",
      under_review: "bg-orange-500/10 border-orange-500/20",
      court_proceedings: "bg-red-500/10 border-red-500/20",
      settlement: "bg-green-500/10 border-green-500/20",
      resolved: "bg-emerald-500/10 border-emerald-500/20",
      closed: "bg-gray-500/10 border-gray-500/20",
    };
    return colors[status] || "bg-gray-500/10 border-gray-500/20";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-green-500",
      medium: "text-yellow-500",
      high: "text-orange-500",
      urgent: "text-red-500",
    };
    return colors[priority] || "text-gray-500";
  };

  const getPriorityBgColor = (priority) => {
    const colors = {
      low: "bg-green-500/10 border-green-500/20",
      medium: "bg-yellow-500/10 border-yellow-500/20",
      high: "bg-orange-500/10 border-orange-500/20",
      urgent: "bg-red-500/10 border-red-500/20",
    };
    return colors[priority] || "bg-gray-500/10 border-gray-500/20";
  };

  const getCaseTypeIcon = (caseType) => {
    const icons = {
      civil: FaBalanceScale,
      criminal: FaGavel,
      corporate: FaBuilding,
      family: FaUsers,
      property: FaHome,
      labor: FaBriefcase,
      debt_collection: FaFileAlt,
      other: FaFileAlt,
    };
    return icons[caseType] || FaFileAlt;
  };

  const getCaseTypeColor = (caseType) => {
    const colors = {
      civil: "text-blue-500",
      criminal: "text-red-500",
      corporate: "text-green-500",
      family: "text-purple-500",
      property: "text-yellow-500",
      labor: "text-orange-500",
      debt_collection: "text-indigo-500",
      other: "text-gray-500",
    };
    return colors[caseType] || "text-gray-500";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysSince = (date) => {
    const now = new Date();
    const caseDate = new Date(date);
    const diffTime = Math.abs(now - caseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const advocates = users ? users.filter((u) => u.role === "advocate") : [];

  // Add error boundary for undefined data
  if (!cases && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex items-center justify-center p-4">
        <div className="text-center">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Failed to load cases</h3>
          <p className="text-slate-300">Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Legal Case Management
          </h1>
          <p className="text-slate-300 text-lg">
            Manage and track all legal cases and proceedings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/legal/cases/create')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Create Case
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Cases */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Total Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stats.totalCases}</p>
              <div className="flex items-center mt-2">
                <FaArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-xs sm:text-sm font-medium">
                  +{stats.caseGrowth}% from last month
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <FaGavel className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Active Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stats.activeCases}</p>
              <div className="flex items-center mt-2">
                <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mr-1" />
                <span className="text-yellow-500 text-xs sm:text-sm font-medium">
                  {stats.pendingCases} pending
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <FaClock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Resolved Cases */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Resolved Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stats.resolvedCases}</p>
              <div className="flex items-center mt-2">
                <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-xs sm:text-sm font-medium">
                  {stats.totalCases > 0 ? Math.round((stats.resolvedCases / stats.totalCases) * 100) : 0}% success rate
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Urgent Cases */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Urgent Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stats.urgentCases}</p>
              <div className="flex items-center mt-2">
                <FaExclamationTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                <span className="text-red-500 text-xs sm:text-sm font-medium">
                  Requires attention
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <FaExclamationTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl mb-6 md:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search cases by title, case number, or description..."
                className="w-full bg-slate-700/50 text-white placeholder-slate-400 rounded-xl px-12 py-3 border border-slate-600/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2"
            >
              <FaFilter className="w-4 h-4" />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  viewMode === "grid" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                }`}
                title="Grid View"
              >
                <FaThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  viewMode === "list" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                }`}
                title="List View"
              >
                <FaList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  viewMode === "kanban" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                }`}
                title="Kanban Board"
              >
                <FaColumns className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              className="w-full bg-slate-700/50 text-white border border-slate-600/50 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Statuses</option>
              <option value="pending_assignment">Pending Assignment</option>
              <option value="filed">Filed</option>
              <option value="assigned">Assigned</option>
              <option value="under_review">Under Review</option>
              <option value="court_proceedings">Court Proceedings</option>
              <option value="settlement">Settlement</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              className="w-full bg-slate-700/50 text-white border border-slate-600/50 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={filters.caseType}
              onChange={(e) =>
                setFilters({ ...filters, caseType: e.target.value })
              }
            >
              <option value="">All Case Types</option>
              <option value="civil">Civil</option>
              <option value="criminal">Criminal</option>
              <option value="corporate">Corporate</option>
              <option value="family">Family</option>
              <option value="property">Property</option>
              <option value="labor">Labor</option>
              <option value="debt_collection">Debt Collection</option>
              <option value="other">Other</option>
            </select>

            <select
              className="w-full bg-slate-700/50 text-white border border-slate-600/50 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

            {user.role === "legal_head" && (
              <select
                className="w-full bg-slate-700/50 text-white border border-slate-600/50 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filters.assignedTo}
                onChange={(e) =>
                  setFilters({ ...filters, assignedTo: e.target.value })
                }
              >
                <option value="">All Advocates</option>
                {advocates.map((advocate) => (
                  <option key={advocate._id} value={advocate._id}>
                    {advocate.firstName} {advocate.lastName}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Cases Display */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <span className="ml-4 text-slate-300 text-lg">Loading cases...</span>
          </div>
        ) : !cases || cases.length === 0 ? (
          <div className="text-center py-12">
            <FaFileAlt className="mx-auto text-6xl text-slate-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No cases found</h3>
            <p className="text-slate-300 mb-6">
              {filters.status || filters.caseType || filters.search
                ? "No cases match your current filters."
                : "Get started by creating your first legal case."}
            </p>
            <button
              onClick={() => navigate('/legal/cases/create')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <FaPlus className="w-4 h-4" />
              Create First Case
            </button>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <FaSearch className="mx-auto text-6xl text-slate-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No cases found</h3>
            <p className="text-slate-300 mb-6">
              {filters.search || Object.values(filters).some((f) => f)
                ? "Try adjusting your filters"
                : "Get started by creating your first legal case"}
            </p>
            <button
              onClick={() => setFilters({ status: "", caseType: "", priority: "", assignedTo: "", search: "", escalatedFrom: "" })}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <FaTimes className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            {selectedCases.length > 0 && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">
                      {selectedCases.length} case{selectedCases.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="px-3 py-2 bg-slate-700/50 text-white border border-slate-600/50 rounded-lg focus:border-blue-500 focus:outline-none"
                      onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Update Status</option>
                      <option value="assigned">Assigned</option>
                      <option value="under_review">Under Review</option>
                      <option value="court_proceedings">Court Proceedings</option>
                      <option value="settlement">Settlement</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => setSelectedCases([])}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredCases.map((legalCase) => {
                  const CaseTypeIcon = getCaseTypeIcon(legalCase.caseType);
                  const daysSince = getDaysSince(legalCase.createdAt);
                  
                  return (
                    <div
                      key={legalCase._id}
                      className="bg-slate-700/30 rounded-xl sm:rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer"
                      onClick={() => navigate(`/legal/cases/${legalCase._id}`)}
                    >
                      {/* Case Header */}
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CaseTypeIcon className={`w-5 h-5 ${getCaseTypeColor(legalCase.caseType)}`} />
                            <span className={`text-xs font-medium ${getCaseTypeColor(legalCase.caseType)}`}>
                              {(legalCase.caseType || "other").replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedCases.includes(legalCase._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleCaseSelection(legalCase._id);
                            }}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </div>

                        {/* Case Number */}
                        <div className="mb-3">
                          <p className="text-xs text-slate-400 font-mono">{legalCase.caseNumber}</p>
                        </div>

                        {/* Case Title */}
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                          {legalCase.title}
                        </h3>

                        {/* Case Description */}
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                          {legalCase.description}
                        </p>

                        {/* Status and Priority */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBgColor(legalCase.status)} ${getStatusColor(legalCase.status)}`}>
                            {(legalCase.status || "pending").replace("_", " ")}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBgColor(legalCase.priority)} ${getPriorityColor(legalCase.priority)}`}>
                            {legalCase.priority || "medium"}
                          </span>
                        </div>

                        {/* Case Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Assigned to:</span>
                            <span className="text-white">
                              {legalCase.assignedTo ? (
                                `${legalCase.assignedTo.firstName} ${legalCase.assignedTo.lastName}`
                              ) : (
                                <span className="text-slate-400">Unassigned</span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Client:</span>
                            <span className="text-white">
                              {legalCase.client ? (
                                `${legalCase.client.firstName} ${legalCase.client.lastName}`
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Created:</span>
                            <span className="text-white">{formatDate(legalCase.createdAt)}</span>
                          </div>

                          {legalCase.filingFee?.amount && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Filing Fee:</span>
                              <span className="text-green-400 font-medium">{formatCurrency(legalCase.filingFee.amount)}</span>
                            </div>
                          )}
                        </div>

                        {/* Days Since */}
                        <div className="mt-4 pt-4 border-t border-slate-600/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Days since creation:</span>
                            <span className="text-xs text-slate-300 font-medium">{daysSince} days</span>
                          </div>
                        </div>
                      </div>

                                             {/* Case Actions */}
                       <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                         <div className="flex items-center gap-2">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate(`/legal/cases/${legalCase._id}`);
                             }}
                             className="flex-1 px-3 py-2 bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                           >
                             <FaEye className="w-3 h-3" />
                             View
                           </button>

                           {user.role === "legal_head" && (legalCase.status || "pending") === "pending_assignment" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setAssignmentData({
                                   caseId: legalCase._id,
                                   assignedTo: "",
                                   notes: "",
                                 });
                                 setShowAssignmentModal(true);
                               }}
                               className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                             >
                               <FaUserPlus className="w-3 h-3" />
                               Assign
                             </button>
                           )}
                           {user?.role === "law_firm_admin" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteCase(legalCase._id, legalCase.caseNumber);
                               }}
                               className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                               title="Delete case"
                             >
                               <FaTrash className="w-3 h-3" />
                               Delete
                             </button>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })}
              </div>
                        )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600/50">
                      <th className="text-left p-4 text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCases.length === filteredCases.length && filteredCases.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          Case Number
                        </div>
                      </th>
                      <th className="text-left p-4 text-slate-300 font-medium">Title</th>
                      <th className="text-left p-4 text-slate-300 font-medium">Type</th>
                      <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                      <th className="text-left p-4 text-slate-300 font-medium">Priority</th>
                      <th className="text-left p-4 text-slate-300 font-medium">Assigned To</th>
                      <th className="text-left p-4 text-slate-300 font-medium">Client</th>
                      <th className="text-left p-4 text-slate-300 font-medium">Created</th>
                      <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((legalCase) => {
                      const CaseTypeIcon = getCaseTypeIcon(legalCase.caseType);
                      return (
                        <tr key={legalCase._id} className="border-b border-slate-600/30 hover:bg-slate-700/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedCases.includes(legalCase._id)}
                                onChange={() => handleCaseSelection(legalCase._id)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <div className="font-mono text-sm text-slate-300">{legalCase.caseNumber}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="max-w-xs">
                              <div className="font-medium text-white">{legalCase.title}</div>
                              <div className="text-sm text-slate-400 truncate">{legalCase.description}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <CaseTypeIcon className={`w-4 h-4 ${getCaseTypeColor(legalCase.caseType)}`} />
                              <span className={`text-sm font-medium ${getCaseTypeColor(legalCase.caseType)}`}>
                                {(legalCase.caseType || "other").replace("_", " ")}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBgColor(legalCase.status)} ${getStatusColor(legalCase.status)}`}>
                              {(legalCase.status || "pending").replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBgColor(legalCase.priority)} ${getPriorityColor(legalCase.priority)}`}>
                              {legalCase.priority || "medium"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-white">
                              {legalCase.assignedTo ? (
                                `${legalCase.assignedTo.firstName} ${legalCase.assignedTo.lastName}`
                              ) : (
                                <span className="text-slate-400">Unassigned</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-white">
                              {legalCase.client ? (
                                `${legalCase.client.firstName} ${legalCase.client.lastName}`
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-300">{formatDate(legalCase.createdAt)}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/legal/cases/${legalCase._id}`)}
                                className="px-3 py-2 bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 rounded-lg transition-colors text-sm flex items-center gap-1"
                              >
                                <FaEye className="w-3 h-3" />
                                View
                              </button>

                              {user.role === "legal_head" && (legalCase.status || "pending") === "pending_assignment" && (
                                <button
                                  onClick={() => {
                                    setAssignmentData({
                                      caseId: legalCase._id,
                                      assignedTo: "",
                                      notes: "",
                                    });
                                    setShowAssignmentModal(true);
                                  }}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                                >
                                  <FaUserPlus className="w-3 h-3" />
                                  Assign
                                </button>
                              )}

                              {legalCase.assignedTo?._id === user._id && (
                                <select
                                  className="px-3 py-2 bg-slate-600/50 text-slate-300 border border-slate-600/50 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                                  value={legalCase.status}
                                  onChange={(e) => handleStatusUpdate(legalCase._id, e.target.value)}
                                >
                                  <option value="assigned">Assigned</option>
                                  <option value="under_review">Under Review</option>
                                  <option value="court_proceedings">Court Proceedings</option>
                                  <option value="settlement">Settlement</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              )}
                              {user?.role === "law_firm_admin" && (
                                <button
                                  onClick={() => handleDeleteCase(legalCase._id, legalCase.caseNumber)}
                                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                                  title="Delete case"
                                >
                                  <FaTrash className="w-3 h-3" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Kanban View */}
            {viewMode === "kanban" && (
              <LegalKanbanBoard
                cases={filteredCases}
                isLoading={isLoading}
                isAdminView={false}
              />
            )}
          </>
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
                Are you sure you want to permanently delete this legal case?
              </p>
              <p className="text-slate-300 text-sm">
                <strong>Case Number:</strong> {deleteModal.caseNumber}
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
      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-slate-600/50 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Assign Case to Advocate</h3>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Advocate
                  </label>
                  <select
                    className="w-full bg-slate-700/50 text-white border border-slate-600/50 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Assignment Notes (Optional)
                  </label>
                  <textarea
                    className="w-full bg-slate-700/50 text-white border border-slate-600/50 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    rows="3"
                    placeholder="Add any notes about this assignment..."
                    value={assignmentData.notes}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors font-medium"
                  onClick={() => setShowAssignmentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAssignCase}
                  disabled={!assignmentData.assignedTo}
                >
                  Assign Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalCaseManagement;
