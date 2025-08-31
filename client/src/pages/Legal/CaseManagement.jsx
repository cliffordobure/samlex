import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  getLegalCases,
  updateLegalCaseStatus,
  assignLegalCase,
  getPendingAssignmentCases,
  getLegalCaseStatistics,
} from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import toast from "react-hot-toast";
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
} from "react-icons/fa";

const LegalCaseManagement = () => {
  const dispatch = useDispatch();
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
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'kanban'
  const [showFilters, setShowFilters] = useState(false);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    caseId: "",
    assignedTo: "",
    notes: "",
  });

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

  useEffect(() => {
    if (!cases || !Array.isArray(cases)) return;

    let filtered = cases;

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((case_) => case_.status === filters.status);
    }
    if (filters.caseType) {
      filtered = filtered.filter(
        (case_) => case_.caseType === filters.caseType
      );
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

    setFilteredCases(filtered);
  }, [cases, filters]);

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
    } catch (error) {
      toast.error(error || "Failed to assign case");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_assignment: "bg-yellow-100 text-yellow-800",
      filed: "bg-blue-100 text-blue-800",
      assigned: "bg-purple-100 text-purple-800",
      under_review: "bg-orange-100 text-orange-800",
      court_proceedings: "bg-red-100 text-red-800",
      settlement: "bg-green-100 text-green-800",
      resolved: "bg-emerald-100 text-emerald-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
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

  const advocates = users ? users.filter((u) => u.role === "advocate") : [];

  // Add error boundary for undefined data
  if (!cases && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>Failed to load cases. Please refresh the page.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Legal Case Management
          </h1>
          <p className="text-dark-400 mt-2">
            Manage all legal cases and proceedings.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/legal/cases/create"
            className="btn btn-primary flex items-center gap-2"
          >
            <FaPlus />
            Create Case
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="input input-bordered w-full pl-10"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center gap-2"
            >
              <FaFilter />
              Filters
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`btn btn-sm ${
                  viewMode === "list" ? "btn-primary" : "btn-outline"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`btn btn-sm ${
                  viewMode === "kanban" ? "btn-primary" : "btn-outline"
                }`}
              >
                Kanban View
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                className="select select-bordered w-full"
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
                className="select select-bordered w-full"
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
                className="select select-bordered w-full"
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
                  className="select select-bordered w-full"
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
      </div>

      {/* Cases List */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="loading loading-spinner loading-lg"></div>
              <span className="ml-2">Loading cases...</span>
            </div>
          ) : !cases || cases.length === 0 ? (
            <div className="text-center py-8">
              <FaFileAlt className="mx-auto text-4xl text-dark-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No cases found
              </h3>
              <p className="text-dark-400">
                {filters.status || filters.caseType || filters.search
                  ? "No cases match your current filters."
                  : "Get started by creating your first legal case."}
              </p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8">
              <FaFileAlt className="mx-auto text-4xl text-dark-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No cases found
              </h3>
              <p className="text-dark-400">
                {filters.search || Object.values(filters).some((f) => f)
                  ? "Try adjusting your filters"
                  : "Get started by creating your first legal case"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Case Number</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Client</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((legalCase) => {
                    const CaseTypeIcon = getCaseTypeIcon(legalCase.caseType);
                    return (
                      <tr key={legalCase._id}>
                        <td>
                          <div className="font-mono text-sm">
                            {legalCase.caseNumber}
                          </div>
                        </td>
                        <td>
                          <div className="max-w-xs">
                            <div className="font-medium">{legalCase.title}</div>
                            <div className="text-sm text-dark-400 truncate">
                              {legalCase.description}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <CaseTypeIcon className="text-dark-400" />
                            <span className="capitalize">
                              {legalCase.caseType}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${getStatusColor(
                              legalCase.status
                            )}`}
                          >
                            {legalCase.status
                              ? legalCase.status.replace("_", " ")
                              : "Unknown"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${getPriorityColor(
                              legalCase.priority
                            )}`}
                          >
                            {legalCase.priority}
                          </span>
                        </td>
                        <td>
                          {legalCase.assignedTo ? (
                            <div>
                              {legalCase.assignedTo.firstName}{" "}
                              {legalCase.assignedTo.lastName}
                            </div>
                          ) : (
                            <span className="text-dark-400">Unassigned</span>
                          )}
                        </td>
                        <td>
                          {legalCase.client ? (
                            <div>
                              {legalCase.client.firstName}{" "}
                              {legalCase.client.lastName}
                            </div>
                          ) : (
                            <span className="text-dark-400">-</span>
                          )}
                        </td>
                        <td>
                          <div className="text-sm">
                            {new Date(legalCase.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Link
                              to={`/legal/cases/${legalCase._id}`}
                              className="btn btn-sm btn-outline"
                            >
                              <FaEye />
                            </Link>

                            {user.role === "legal_head" &&
                              legalCase.status === "pending_assignment" && (
                                <button
                                  onClick={() => {
                                    setAssignmentData({
                                      caseId: legalCase._id,
                                      assignedTo: "",
                                      notes: "",
                                    });
                                    setShowAssignmentModal(true);
                                  }}
                                  className="btn btn-sm btn-primary"
                                >
                                  <FaUserPlus />
                                </button>
                              )}

                            {legalCase.assignedTo?._id === user._id && (
                              <select
                                className="select select-bordered select-sm"
                                value={legalCase.status}
                                onChange={(e) =>
                                  handleStatusUpdate(
                                    legalCase._id,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="assigned">Assigned</option>
                                <option value="under_review">
                                  Under Review
                                </option>
                                <option value="court_proceedings">
                                  Court Proceedings
                                </option>
                                <option value="settlement">Settlement</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
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
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Assign Case to Advocate</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Select Advocate</span>
                </label>
                <select
                  className="select select-bordered w-full"
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
                <label className="label">
                  <span className="label-text">
                    Assignment Notes (Optional)
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
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

            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setShowAssignmentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignCase}
                disabled={!assignmentData.assignedTo}
              >
                Assign Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalCaseManagement;
