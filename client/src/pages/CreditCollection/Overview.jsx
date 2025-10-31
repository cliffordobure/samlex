import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getCreditCases } from "../../store/slices/creditCaseSlice";
import { 
  FaFolderOpen, 
  FaUser, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaPlus, 
  FaEye, 
  FaChartBar, 
  FaSpinner,
  FaFileAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaArrowRight,
  FaUsers,
  FaSearch,
  FaSms
} from "react-icons/fa";

const CreditOverview = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases, isLoading } = useSelector((state) => state.creditCases);

  const [stats, setStats] = useState({
    totalCases: 0,
    assignedToMe: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0,
  });

  // Filter cases assigned to the current user
  const assignedCases = cases.filter(
    (c) => c.assignedTo === user?._id || c.assignedTo?._id === user?._id
  );

  useEffect(() => {
    if (!user) return;
    if (user.role === "debt_collector") {
      dispatch(getCreditCases({ assignedTo: user._id }));
    } else if (user.role === "credit_head") {
      dispatch(getCreditCases({ lawFirm: user.lawFirm?._id }));
    } else {
      dispatch(getCreditCases());
    }
  }, [dispatch, user]);

  useEffect(() => {
    let relevantCases = assignedCases;
    if (user?.role === "credit_head") {
      // For credit_head, use all cases in the law firm
      relevantCases = cases;
    }
    const inProgress = relevantCases.filter((c) =>
      ["assigned", "in_progress"].includes(c.status)
    );
    const resolved = relevantCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    );
    const overdue = relevantCases.filter(
      (c) =>
        c.caseReference &&
        c.caseReference.includes("2025") &&
        !["resolved", "closed"].includes(c.status)
    );

    setStats({
      totalCases: relevantCases.length,
      assignedToMe: assignedCases.length, // Only cases assigned to current user
      inProgress: inProgress.length,
      resolved: resolved.length,
      overdue: overdue.length,
    });
  }, [assignedCases, cases, user]);

  // For recent cases and priority cases, use all law firm cases for credit_head
  const recentCases = user?.role === "credit_head" ? cases : assignedCases;
  const priorityCases =
    user?.role === "credit_head"
      ? cases.filter((c) => c.priority === "urgent" || c.priority === "high")
      : assignedCases.filter(
          (c) => c.priority === "urgent" || c.priority === "high"
        );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xl font-semibold text-white">Loading Dashboard...</p>
          <p className="text-slate-400 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <FaFolderOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Credit Collection Dashboard
              </h1>
              <p className="text-slate-300 mt-2 text-sm sm:text-base">
                Welcome back, <span className="font-semibold text-blue-400">{user?.firstName}</span>! Here's your credit collection overview.
              </p>
            </div>
          </div>
          <Link 
            to="/credit-collection/cases/create" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaPlus className="w-5 h-5 mr-2" />
            Create New Case
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer group">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FaFolderOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Total Cases</p>
              <p className="text-2xl font-bold text-white">{stats.totalCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl hover:shadow-green-500/25 transition-all duration-200 cursor-pointer group">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FaUser className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Assigned to Me</p>
              <p className="text-2xl font-bold text-white">{stats.assignedToMe}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl hover:shadow-yellow-500/25 transition-all duration-200 cursor-pointer group">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FaClock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">In Progress</p>
              <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer group">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FaCheckCircle className="w-6 h-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Resolved</p>
              <p className="text-2xl font-bold text-white">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl hover:shadow-red-500/25 transition-all duration-200 cursor-pointer group">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FaExclamationTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Overdue</p>
              <p className="text-2xl font-bold text-white">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cases and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
            <div className="p-6 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg">
                    <FaFileAlt className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Recent Cases</h3>
                </div>
                <Link
                  to="/credit-collection/cases"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-400 rounded-lg transition-all duration-200 border border-blue-500/30 hover:border-blue-500/50"
                >
                  <span>View All</span>
                  <FaArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentCases.length > 0 ? (
                <div className="space-y-4">
                  {[...recentCases]
                    .sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .slice(0, 5)
                    .map((case_) => (
                      <div
                        key={case_._id}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg">
                            {case_.title}
                          </h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-300">
                            <span className="flex items-center space-x-1">
                              <FaUser className="w-4 h-4 text-slate-400" />
                              <span>{case_.debtorName}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FaMoneyBillWave className="w-4 h-4 text-slate-400" />
                              <span>KES {case_.debtAmount?.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                              case_.status
                            )}`}
                          >
                            {case_.status.replace("_", " ").toUpperCase()}
                          </span>
                          <p className="text-xs text-slate-400 mt-2 flex items-center justify-end space-x-1">
                            <FaCalendarAlt className="w-3 h-3" />
                            <span>{new Date(case_.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                    <FaFileAlt className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">
                    No cases yet
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Get started by creating your first case.
                  </p>
                  <Link
                    to="/credit-collection/cases/create"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200"
                  >
                    <FaPlus className="w-5 h-5 mr-2" />
                    Create Case
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
            <div className="p-6 border-b border-slate-600/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                  <FaPlus className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <Link
                to="/credit-collection/cases/create"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaPlus className="w-4 h-4 inline mr-2" />
                Create New Case
              </Link>
              <Link
                to="/credit-collection/cases"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-400 rounded-xl font-medium transition-all duration-200 border border-blue-500/30 hover:border-blue-500/50"
              >
                <FaEye className="w-4 h-4 inline mr-2" />
                View All Cases
              </Link>
              <Link
                to="/credit-collection/reports"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 rounded-xl font-medium transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50"
              >
                <FaChartBar className="w-4 h-4 inline mr-2" />
                Generate Report
              </Link>
              <Link
                to="/credit-collection/bulk-import"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-orange-400 rounded-xl font-medium transition-all duration-200 border border-orange-500/30 hover:border-orange-500/50"
              >
                <FaFileAlt className="w-4 h-4 inline mr-2" />
                Bulk Import
              </Link>
              <Link
                to="/credit-collection/bulk-sms"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-400 rounded-xl font-medium transition-all duration-200 border border-green-500/30 hover:border-green-500/50"
              >
                <FaSms className="w-4 h-4 inline mr-2" />
                Bulk SMS
              </Link>
            </div>
          </div>

          {/* Priority Cases */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
            <div className="p-6 border-b border-slate-600/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg">
                  <FaExclamationTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Priority Cases</h3>
              </div>
            </div>
            <div className="p-6">
              {priorityCases.length > 0 ? (
                <div className="space-y-4">
                  {[...priorityCases]
                    .sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .slice(0, 3)
                    .map((case_) => (
                      <div
                        key={case_._id}
                        className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white text-sm">
                            {case_.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              case_.priority === "urgent"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}
                          >
                            {case_.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center space-x-1">
                          <FaUser className="w-3 h-3" />
                          <span>{case_.debtorName}</span>
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                    <FaCheckCircle className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    No priority cases at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "new":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "assigned":
    case "in_progress":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "follow_up_required":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "escalated_to_legal":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "resolved":
    case "closed":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
  }
};

export default CreditOverview;
