/* eslint-disable no-unused-vars */
// client/src/pages/CreditCollection/CaseManagement.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Routes, Route } from "react-router-dom";
import {
  getCreditCases,
  updateCreditCase,
  assignCase,
} from "../../store/slices/creditCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import toast from "react-hot-toast";
import React from "react";
import KanbanBoard from "./KanbanBoard";
import CreateCase from "./CreateCase";
import axios from "axios";
import socket from "../../utils/socket";
import { 
  FaFolderOpen, 
  FaSearch, 
  FaFilter, 
  FaList, 
  FaColumns, 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaUser, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock, 
  FaSpinner,
  FaTimes,
  FaArrowRight
} from "react-icons/fa";

const CaseManagement = () => {
  const dispatch = useDispatch();
  const { cases, isLoading } = useSelector((state) => state.creditCases);
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  const [filteredCases, setFilteredCases] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    search: "",
  });
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'kanban'
  const [error, setError] = useState("");

  // Fetch cases and users
  useEffect(() => {
    if (!user) return;
    if (user.role === "credit_head" && user.lawFirm?._id) {
      dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
    } else if (user.role === "debt_collector") {
      dispatch(getCreditCases({ assignedTo: user._id }));
    } else {
      dispatch(getCreditCases());
    }
    dispatch(getUsers({ role: "debt_collector" }));
  }, [dispatch, user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const refetchCases = () => {
      if (!user) return;
      if (user.role === "credit_head" && user.lawFirm?._id) {
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
      } else if (user.role === "debt_collector") {
        dispatch(getCreditCases({ assignedTo: user._id }));
      } else {
        dispatch(getCreditCases());
      }
    };

    socket.on("caseAssigned", refetchCases);
    socket.on("caseMoved", refetchCases);
    socket.on("caseCreated", refetchCases);

    return () => {
      socket.off("caseAssigned", refetchCases);
      socket.off("caseMoved", refetchCases);
      socket.off("caseCreated", refetchCases);
    };
  }, [dispatch, user]);

  useEffect(() => {
    // Only run filter if user and cases are loaded
    if (!user || !cases) return;

    let filtered = cases;

    // Role-based filtering
    if (user?.role === "debt_collector") {
      filtered = filtered.filter(
        (case_) =>
          case_.assignedTo === user._id || case_.assignedTo?._id === user._id
      );
    }

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (case_) =>
          case_.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          case_.caseNumber
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          case_.debtorName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((case_) => case_.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(
        (case_) => case_.priority === filters.priority
      );
    }

    // Assigned to filter
    if (filters.assignedTo) {
      filtered = filtered.filter(
        (case_) => case_.assignedTo?._id === filters.assignedTo
      );
    }

    setFilteredCases(filtered);
  }, [cases, filters, user]);

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      const result = await dispatch(
        updateCreditCase({
          id: caseId,
          data: { status: newStatus },
        })
      );
      if (updateCreditCase.fulfilled.match(result)) {
        toast.success("Case status updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update case status");
    }
  };

  const handleAssignCase = async (caseId, userId) => {
    try {
      const result = await dispatch(
        assignCase({ id: caseId, userId })
      ).unwrap();
      toast.success("Case assigned successfully!");
      // Immediately refetch cases to show updated assignment
      if (user.role === "credit_head" && user.lawFirm?._id) {
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
      } else if (user.role === "debt_collector") {
        dispatch(getCreditCases({ assignedTo: user._id }));
      } else {
        dispatch(getCreditCases());
      }
    } catch (error) {
      toast.error(error || "Failed to assign case");
    }
  };

  const statusOptions = [
    { value: "new", label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { value: "assigned", label: "Assigned", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { value: "in_progress", label: "In Progress", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    {
      value: "follow_up_required",
      label: "Follow-up Required",
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    {
      value: "escalated_to_legal",
      label: "Escalated to Legal",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    { value: "resolved", label: "Resolved", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    { value: "closed", label: "Closed", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  ];

  const getStatusBadgeClass = (status) => {
    const statusConfig = statusOptions.find((s) => s.value === status);
    return statusConfig ? statusConfig.color : "bg-slate-500/20 text-slate-400 border-slate-500/30";
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
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      <Routes>
        <Route
          path="/"
          element={
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                      <FaFolderOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                        Credit Collection Cases
                      </h1>
                      <p className="text-slate-300 mt-2 text-sm sm:text-base">
                        Manage and track all credit collection cases efficiently.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Link
                      to="/credit-collection/cases/create"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <FaPlus className="w-5 h-5 mr-2" />
                      Create New Case
                    </Link>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
                <div className="p-6 border-b border-slate-600/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg">
                      <FaFilter className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Filters & Search</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search cases..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                        value={filters.search}
                        onChange={(e) =>
                          setFilters({ ...filters, search: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <select
                        className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                        value={filters.status}
                        onChange={(e) =>
                          setFilters({ ...filters, status: e.target.value })
                        }
                      >
                        <option value="">All Status</option>
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                        value={filters.priority}
                        onChange={(e) =>
                          setFilters({ ...filters, priority: e.target.value })
                        }
                      >
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    {user?.role === "credit_head" && (
                      <div>
                        <select
                          className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          value={filters.assignedTo}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              assignedTo: e.target.value,
                            })
                          }
                        >
                          <option value="">All Assigned</option>
                          <option value="unassigned">Unassigned</option>
                          {users
                            .filter((u) => u.role === "debt_collector")
                            .map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.firstName} {user.lastName}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          setViewMode(viewMode === "list" ? "kanban" : "list")
                        }
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 rounded-xl font-medium transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50 flex items-center justify-center space-x-2"
                      >
                        {viewMode === "list" ? (
                          <>
                            <FaColumns className="w-4 h-4" />
                            <span>Kanban View</span>
                          </>
                        ) : (
                          <>
                            <FaList className="w-4 h-4" />
                            <span>List View</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setFilters({
                            status: "",
                            priority: "",
                            assignedTo: "",
                            search: "",
                          })
                        }
                        className="px-4 py-3 bg-gradient-to-r from-slate-500/20 to-slate-600/20 hover:from-slate-500/30 hover:to-slate-600/30 text-slate-400 rounded-xl font-medium transition-all duration-200 border border-slate-500/30 hover:border-slate-500/50"
                        title="Clear all filters"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cases Display */}
              {isLoading ? (
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                      <FaSpinner className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-xl font-semibold text-white">Loading cases...</p>
                    <p className="text-slate-400 mt-2">Please wait while we fetch your data</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl p-6">
                  <div className="flex items-center space-x-3">
                    <FaExclamationTriangle className="w-6 h-6 text-red-400" />
                    <span className="text-red-400 font-medium">{error}</span>
                  </div>
                </div>
              ) : viewMode === "list" ? (
                <CaseListView
                  cases={filteredCases}
                  isLoading={isLoading}
                  user={user}
                  users={users}
                  onStatusChange={handleStatusChange}
                  onAssignCase={handleAssignCase}
                  getStatusBadgeClass={getStatusBadgeClass}
                  getPriorityBadgeClass={getPriorityBadgeClass}
                />
              ) : (
                <KanbanBoard cases={filteredCases} isLoading={isLoading} />
              )}
            </div>
          }
        />
        <Route path="create" element={<CreateCase />} />
      </Routes>
    </div>
  );
};

const CaseListView = ({
  cases,
  isLoading,
  user,
  users,
  onStatusChange,
  onAssignCase,
  getStatusBadgeClass,
  getPriorityBadgeClass,
}) => (
  <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
    <div className="p-6">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xl font-semibold text-white">Loading cases...</p>
          <p className="text-slate-400 mt-2">Please wait while we fetch your data</p>
        </div>
      ) : cases.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Case Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Debtor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Case Reference</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-slate-700/80">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((case_, index) => (
                <tr 
                  key={case_._id} 
                  className={`border-b border-slate-600/50 transition-all duration-200 hover:bg-slate-700/30 ${
                    index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-700/30'
                  }`}
                >
                  <td className="px-4 py-4">
                    <Link
                      to={`/credit-collection/cases/${case_._id}`}
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                    >
                      <span>{case_.caseNumber}</span>
                      <FaArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-300 font-medium">{case_.title}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                        <FaUser className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-slate-300">{case_.debtorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <FaMoneyBillWave className="w-4 h-4 text-green-400" />
                      <span className="text-white font-semibold">
                        KES {case_.debtAmount?.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeClass(
                        case_.priority
                      )}`}
                    >
                      {case_.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {user?.role === "debt_collector" &&
                    case_.assignedTo?._id === user._id ? (
                      <select
                        className="px-3 py-2 bg-slate-700/80 text-white border border-slate-600/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                        value={case_.status}
                        onChange={(e) =>
                          onStatusChange(case_._id, e.target.value)
                        }
                      >
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="follow_up_required">
                          Follow-up Required
                        </option>
                        <option value="resolved">Resolved</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                          case_.status
                        )}`}
                      >
                        {case_.status.replace("_", " ").toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">
                        {case_.caseReference || "Not set"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/credit-collection/cases/${case_._id}`}
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-400 rounded-lg transition-all duration-200 border border-blue-500/30 hover:border-blue-500/50"
                      >
                        <FaEye className="w-4 h-4" />
                        <span className="text-sm font-medium">View</span>
                      </Link>
                      {(user?.role === "credit_head" ||
                        (user?.role === "debt_collector" &&
                          case_.assignedTo?._id === user._id)) && (
                        <Link
                          to={`/credit-collection/cases/${case_._id}/edit`}
                          className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-yellow-400 rounded-lg transition-all duration-200 border border-yellow-500/30 hover:border-yellow-500/50"
                        >
                          <FaEdit className="w-4 h-4" />
                          <span className="text-sm font-medium">Edit</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
            <FaFolderOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            No cases found
          </h3>
          <p className="text-slate-400 mb-6">
            No cases match your current filters.
          </p>
          <Link
            to="/credit-collection/cases/create"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200"
          >
            <FaPlus className="w-5 h-5 mr-2" />
            Create Your First Case
          </Link>
        </div>
      )}
    </div>
  </div>
);

export default CaseManagement;
