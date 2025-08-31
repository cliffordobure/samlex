/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../store/slices/departmentSlice";
import { getCreditCases } from "../../store/slices/creditCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import toast from "react-hot-toast";
import departmentApi from "../../store/api/departmentApi";
import React from "react"; // Added for useMemo
import {
  FaBuilding,
  FaUsers,
  FaChartBar,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaUserTie,
  FaGavel,
  FaFileContract,
  FaTimes,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const DepartmentManagement = () => {
  return (
    <Routes>
      <Route path="/" element={<DepartmentList />} />
      <Route path="/create" element={<CreateDepartment />} />
      <Route path="/:id/edit" element={<EditDepartment />} />
    </Routes>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  department,
  onConfirm,
  isDeleting,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [isConfirmValid, setIsConfirmValid] = useState(false);

  useEffect(() => {
    if (
      department &&
      confirmText.trim().toLowerCase() === department.name.toLowerCase()
    ) {
      setIsConfirmValid(true);
    } else {
      setIsConfirmValid(false);
    }
  }, [confirmText, department]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isConfirmValid) {
      onConfirm();
    }
  };

  const resetAndClose = () => {
    setConfirmText("");
    setIsConfirmValid(false);
    onClose();
  };

  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl w-full max-w-md mx-4 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0">
            <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
              <FaExclamationTriangle className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-white">
              Delete Department
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-4">
            <p className="text-slate-300 mb-3">
              This action cannot be undone. This will permanently delete the
              department{" "}
              <span className="font-semibold text-white">
                "{department.name}"
              </span>{" "}
              and all associated data.
            </p>
            <p className="text-slate-300">
              Please type{" "}
              <span className="font-semibold text-white">{department.name}</span>{" "}
              to confirm.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              className="w-full bg-slate-700/80 border border-slate-600/50 text-white rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
              placeholder="Type department name here"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetAndClose}
              className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl px-6 py-2"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmValid || isDeleting}
              className="btn bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white border-0 rounded-xl px-6 py-2 font-medium transition-all duration-200 shadow-lg"
            >
              {isDeleting ? "Deleting..." : "Delete Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DepartmentList = () => {
  const dispatch = useDispatch();
  const { departments, isLoading } = useSelector((state) => state.departments);
  const { cases: creditCases } = useSelector((state) => state.creditCases);
  const { users } = useSelector((state) => state.users);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    department: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    data: null,
  });
  const [showProgressView, setShowProgressView] = useState(false);

  useEffect(() => {
    dispatch(getDepartments());
    dispatch(getCreditCases());
    dispatch(getUsers({ role: "debt_collector" }));
  }, [dispatch]);

  const handleDeleteClick = (department) => {
    console.log("🗑️ Delete clicked for department:", department);
    setDeleteModal({
      isOpen: true,
      department,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.department) return;

    setIsDeleting(true);
    try {
      const result = await dispatch(
        deleteDepartment(deleteModal.department._id)
      );
      if (deleteDepartment.fulfilled.match(result)) {
        toast.success("Department deleted successfully!");
        setDeleteModal({ isOpen: false, department: null });
      } else {
        toast.error(result.payload || "Failed to delete department");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, department: null });
    }
  };

  const handleViewDetails = async (departmentId) => {
    console.log("🔍 View Details clicked for department:", departmentId);
    try {
      console.log("📡 Making API call to get department details...");
      const res = await departmentApi.getDepartmentDetails(departmentId);
      console.log("✅ API response:", res);
      if (res.data.success) {
        console.log("📊 Setting modal data:", res.data.data);
        setDetailsModal({ isOpen: true, data: res.data.data });
        console.log("🎯 Modal state should now be open");
      } else {
        console.error("❌ API returned error:", res.data.message);
        toast.error(res.data.message || "Failed to fetch department details");
      }
    } catch (error) {
      console.error("❌ API call failed:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication error. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error(
          "Access denied. You don't have permission to view this department."
        );
      } else if (error.response?.status === 404) {
        toast.error("Department not found.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to fetch department details"
        );
      }
    }
  };
  const closeDetailsModal = () =>
    setDetailsModal({ isOpen: false, data: null });

  // Calculate progress metrics for each department
  const departmentProgress = React.useMemo(() => {
    if (!departments.length || !creditCases.length) return [];

    return departments.map((dept) => {
      const deptCases = creditCases.filter(
        (case_) =>
          case_.department === dept._id || case_.departmentId === dept._id
      );

      const total = deptCases.length;
      const resolved = deptCases.filter(
        (c) => c.status === "resolved" || c.status === "closed"
      ).length;
      const inProgress = deptCases.filter(
        (c) => c.status === "in_progress" || c.status === "assigned"
      ).length;
      const escalated = deptCases.filter(
        (c) => c.status === "escalated_to_legal"
      ).length;

      return {
        ...dept,
        total,
        resolved,
        inProgress,
        escalated,
        completionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        progressRate: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      };
    });
  }, [departments, creditCases]);

  // Calculate assignment statistics
  const assignmentStats = React.useMemo(() => {
    if (!users.length || !creditCases.length) return [];

    const stats = {};
    creditCases.forEach((case_) => {
      const assignedTo =
        case_.assignedTo?.firstName + " " + case_.assignedTo?.lastName ||
        "Unassigned";
      if (!stats[assignedTo]) {
        stats[assignedTo] = { total: 0, inProgress: 0, completed: 0 };
      }
      stats[assignedTo].total++;

      if (case_.status === "resolved" || case_.status === "closed") {
        stats[assignedTo].completed++;
      } else if (
        case_.status === "in_progress" ||
        case_.status === "assigned"
      ) {
        stats[assignedTo].inProgress++;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data,
      completionRate:
        data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  }, [users, creditCases]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                <FaBuilding className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                  🏢 Department Management
                </h1>
                <p className="text-slate-300 text-lg">
                  Manage departments, monitor performance, and track case progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <FaBuilding className="text-blue-400" />
                {departments.length} Total Departments
              </span>
              <span className="flex items-center gap-2">
                <FaUsers className="text-green-400" />
                {users.length} Active Users
              </span>
              <span className="flex items-center gap-2">
                <FaFileContract className="text-orange-400" />
                {creditCases.length} Total Cases
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowProgressView(!showProgressView)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                showProgressView
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "bg-slate-700/80 border border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              <FaChartBar className="mr-2 inline" />
              {showProgressView ? "Hide Progress" : "Show Progress"}
            </button>
            <Link 
              to="/admin/departments/create" 
              className="btn bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 rounded-xl px-6 py-3 font-medium shadow-lg flex items-center justify-center"
            >
              <FaPlus className="mr-2" />
              Create Department
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Monitoring Section */}
      {showProgressView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Progress */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaChartBar className="text-blue-400" />
                Overall Progress
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {departmentProgress.reduce(
                      (sum, dept) => sum + dept.resolved,
                      0
                    )}
                  </div>
                  <div className="text-sm text-slate-300">Resolved Cases</div>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {departmentProgress.reduce(
                      (sum, dept) => sum + dept.inProgress,
                      0
                    )}
                  </div>
                  <div className="text-sm text-slate-300">In Progress</div>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {departmentProgress.reduce(
                      (sum, dept) => sum + dept.escalated,
                      0
                    )}
                  </div>
                  <div className="text-sm text-slate-300">Escalated</div>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {departmentProgress.reduce(
                      (sum, dept) => sum + dept.total,
                      0
                    )}
                  </div>
                  <div className="text-sm text-slate-300">Total Cases</div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Overview */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaUsers className="text-blue-400" />
                Assignment Overview
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {assignmentStats.slice(0, 5).map((stat, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                        <FaUserTie className="text-blue-400 text-sm" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{stat.name}</div>
                        <div className="text-sm text-slate-300">
                          {stat.total} cases
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-400 font-semibold">
                        {stat.completionRate}% done
                      </div>
                      <div className="text-xs text-slate-400">
                        {stat.completed}/{stat.total} completed
                      </div>
                    </div>
                  </div>
                ))}
                {assignmentStats.length > 5 && (
                  <div className="text-center text-sm text-slate-400 bg-slate-700/30 p-3 rounded-xl border border-slate-600/50">
                    +{assignmentStats.length - 5} more collectors
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Progress Cards */}
      {showProgressView && (
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
          <div className="p-6 border-b border-slate-600/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaBuilding className="text-indigo-400" />
              Department Progress
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentProgress.map((dept) => (
                <div key={dept._id} className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <FaBuilding className="text-indigo-400 text-sm" />
                      {dept.name}
                    </h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {dept.departmentType.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Total Cases:</span>
                      <span className="text-white font-medium">{dept.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Resolved:</span>
                      <span className="text-green-400 font-medium">{dept.resolved}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">In Progress:</span>
                      <span className="text-blue-400 font-medium">{dept.inProgress}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Escalated:</span>
                      <span className="text-orange-400 font-medium">{dept.escalated}</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-600/50">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Completion Rate:</span>
                        <span className="text-green-400 font-semibold">
                          {dept.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-600/50 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300 shadow-lg"
                          style={{ width: `${dept.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading departments...</p>
            </div>
          ) : departments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/80 border-b border-slate-600/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={dept._id} className={`border-b border-slate-600/50 ${index % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-800/30'} hover:bg-slate-700/50 transition-all duration-200`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                            <FaBuilding className="text-indigo-400 text-sm" />
                          </div>
                          <span className="font-medium text-white">{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full text-xs border border-slate-600/50">
                          {dept.departmentType.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{dept.code}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            dept.isActive 
                              ? "bg-green-500/20 text-green-400 border-green-500/30" 
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {dept.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(dept.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              console.log("🖱️ View Details button clicked!");
                              handleViewDetails(dept._id);
                            }}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/departments/${dept._id}/edit`}
                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(dept)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600/50">
                <FaBuilding className="text-slate-400 text-2xl" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-slate-300">
                No departments
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Get started by creating a new department.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                >
                  <FaPlus className="w-5 h-5" />
                  Create Department
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Department Details Modal */}
      {console.log("🔍 Modal state check:", {
        isOpen: detailsModal.isOpen,
        hasData: !!detailsModal.data,
      })}
      {detailsModal.isOpen && detailsModal.data && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] relative border border-slate-600/50 shadow-2xl">
            <button
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold focus:outline-none hover:bg-slate-600/50 p-2 rounded-lg transition-all duration-200"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-8 p-6 border-b border-slate-600/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <FaBuilding className="text-indigo-400 text-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {detailsModal.data.department.name}
                  </h2>
                  <div className="flex items-center gap-4 text-slate-300">
                    <span className="bg-slate-700/50 px-3 py-1 rounded-full text-sm border border-slate-600/50">
                      {detailsModal.data.department.departmentType
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                    <span className="font-mono bg-slate-700/50 px-3 py-1 rounded-full text-sm border border-slate-600/50">
                      {detailsModal.data.department.code}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="px-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {detailsModal.data.stats.resolvedCreditCases +
                      detailsModal.data.stats.resolvedLegalCases}
                  </div>
                  <div className="text-sm text-green-300">Resolved Cases</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {detailsModal.data.stats.inProgressCreditCases +
                      detailsModal.data.stats.inProgressLegalCases}
                  </div>
                  <div className="text-sm text-blue-300">In Progress</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {detailsModal.data.stats.totalCreditCases +
                      detailsModal.data.stats.totalLegalCases}
                  </div>
                  <div className="text-sm text-purple-300">Total Cases</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-6">
              <div className="border-b border-slate-600/50">
                <nav className="flex space-x-8">
                  <button className="text-indigo-400 border-b-2 border-indigo-400 py-3 px-1 text-sm font-medium transition-all duration-200">
                    Overview
                  </button>
                  <button className="text-slate-400 hover:text-white py-3 px-1 text-sm font-medium transition-all duration-200">
                    Users
                  </button>
                  <button className="text-slate-400 hover:text-white py-3 px-1 text-sm font-medium transition-all duration-200">
                    Cases
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 space-y-8">
              {/* Stats */}
              <div>
                <h3 className="font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                  <FaChartBar className="text-indigo-400" />
                  Department Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/50">
                    <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                      <FaFileContract className="text-blue-400" />
                      Credit Collection
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-slate-600/30 rounded-lg">
                        <span className="text-slate-300">Total Cases:</span>
                        <span className="text-white font-semibold">
                          {detailsModal.data.stats.totalCreditCases}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-600/30 rounded-lg">
                        <span className="text-slate-300">Resolved:</span>
                        <span className="text-green-400 font-semibold">
                          {detailsModal.data.stats.resolvedCreditCases}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-600/30 rounded-lg">
                        <span className="text-slate-300">In Progress:</span>
                        <span className="text-blue-400 font-semibold">
                          {detailsModal.data.stats.inProgressCreditCases}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/50">
                    <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                      <FaGavel className="text-purple-400" />
                      Legal Department
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-slate-600/30 rounded-lg">
                        <span className="text-slate-300">Total Cases:</span>
                        <span className="text-white font-semibold">
                          {detailsModal.data.stats.totalLegalCases}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-600/30 rounded-lg">
                        <span className="text-slate-300">Resolved:</span>
                        <span className="text-green-400 font-semibold">
                          {detailsModal.data.stats.resolvedLegalCases}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-600/30 rounded-lg">
                        <span className="text-slate-300">In Progress:</span>
                        <span className="text-blue-400 font-semibold">
                          {detailsModal.data.stats.inProgressLegalCases}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users */}
              <div>
                <h3 className="font-semibold text-primary-400 mb-3">
                  Department Users ({detailsModal.data.users.length})
                </h3>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detailsModal.data.users.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 bg-dark-600 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-dark-300">
                            {user.email}
                          </div>
                          <div className="text-xs text-primary-400">
                            {user.role?.replace("_", " ").toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-dark-400">Active</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Cases */}
              <div>
                <h3 className="font-semibold text-primary-400 mb-3">
                  Recent Cases
                </h3>
                <div className="space-y-3">
                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">
                      Credit Cases ({detailsModal.data.creditCases.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {detailsModal.data.creditCases
                        .slice(0, 5)
                        .map((case_) => (
                          <div
                            key={case_._id}
                            className="flex justify-between items-center p-2 bg-dark-600 rounded"
                          >
                            <div className="text-sm text-white">
                              {case_.title}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                case_.status === "resolved" ||
                                case_.status === "closed"
                                  ? "bg-green-500/20 text-green-400"
                                  : case_.status === "in_progress" ||
                                    case_.status === "assigned"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-orange-500/20 text-orange-400"
                              }`}
                            >
                              {case_.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                        ))}
                      {detailsModal.data.creditCases.length > 5 && (
                        <div className="text-center text-xs text-dark-400">
                          +{detailsModal.data.creditCases.length - 5} more cases
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">
                      Legal Cases ({detailsModal.data.legalCases.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {detailsModal.data.legalCases.slice(0, 5).map((case_) => (
                        <div
                          key={case_._id}
                          className="flex justify-between items-center p-2 bg-dark-600 rounded"
                        >
                          <div className="text-sm text-white">
                            {case_.title}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              case_.status === "resolved" ||
                              case_.status === "closed"
                                ? "bg-green-500/20 text-green-400"
                                : case_.status === "in_progress" ||
                                  case_.status === "assigned"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {case_.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      ))}
                      {detailsModal.data.legalCases.length > 5 && (
                        <div className="text-center text-xs text-dark-400">
                          +{detailsModal.data.legalCases.length - 5} more cases
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        department={deleteModal.department}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

const CreateDepartment = () => {
  const [formData, setFormData] = useState({
    name: "",
    departmentType: "credit_collection",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await dispatch(createDepartment(formData));
      if (createDepartment.fulfilled.match(result)) {
        toast.success("Department created successfully!");
        navigate("/admin/departments");
      } else {
        toast.error(result.payload || "Failed to create department");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/admin/departments"
          className="text-dark-400 hover:text-white"
        >
          ← Back to Departments
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white">Create Department</h1>
        <p className="text-dark-400 mt-2">
          Add a new department to your law firm.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-dark-200 mb-1"
                >
                  Department Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input-field"
                  placeholder="e.g., Credit Collection"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="departmentType"
                  className="block text-sm font-medium text-dark-200 mb-1"
                >
                  Department Type
                </label>
                <select
                  id="departmentType"
                  name="departmentType"
                  required
                  className="input-field"
                  value={formData.departmentType}
                  onChange={handleChange}
                >
                  <option value="credit_collection">Credit Collection</option>
                  <option value="legal">Legal</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-dark-200 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="input-field"
                  placeholder="Brief description of the department's purpose..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link to="/admin/departments" className="btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditDepartment = () => {
  // Similar to CreateDepartment but for editing
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Department</h1>
        <p className="text-dark-400 mt-2">Update department information.</p>
      </div>
      {/* Edit form would go here */}
    </div>
  );
};

export default DepartmentManagement;
