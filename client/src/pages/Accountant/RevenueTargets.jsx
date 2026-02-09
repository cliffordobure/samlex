import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import revenueTargetApi from "../../store/api/revenueTargetApi";
import { getDepartments } from "../../store/slices/departmentSlice";
import toast from "react-hot-toast";
import {
  FaBullseye,
  FaChartLine,
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaPercent,
  FaTimes,
  FaSearch,
} from "react-icons/fa";

const RevenueTargets = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { departments } = useSelector((state) => state.departments);

  const [targets, setTargets] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [yearlyTarget, setYearlyTarget] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user?.lawFirm?._id) {
      dispatch(getDepartments({ lawFirm: user.lawFirm._id }));
      loadTargets();
      loadPerformanceData();
    }
  }, [dispatch, user, selectedYear]);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const response = await revenueTargetApi.getTargets({
        year: selectedYear,
      });
      if (response.data.success) {
        setTargets(response.data.data);
      }
    } catch (error) {
      console.error("Error loading targets:", error);
      toast.error("Failed to load revenue targets");
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const response = await revenueTargetApi.getPerformance({
        year: selectedYear,
      });
      if (response.data.success && response.data.data) {
        // Create a map of department ID to performance data
        const perfMap = {};
        if (Array.isArray(response.data.data)) {
          response.data.data.forEach((item) => {
            const deptId = item.department?._id || item.department || "company-wide";
            perfMap[deptId] = item;
          });
        } else if (response.data.data.actualRevenue !== undefined) {
          // Single performance object
          perfMap["company-wide"] = response.data.data;
        }
        setPerformanceData(perfMap);
      }
    } catch (error) {
      console.error("Error loading performance data:", error);
      // Don't show error toast, just continue without performance data
    }
  };

  const handleCreateClick = () => {
    setEditingTarget(null);
    setSelectedDepartment("");
    setYearlyTarget("");
    setShowForm(true);
  };

  const handleEditClick = (target) => {
    setEditingTarget(target);
    setSelectedDepartment(target.department?._id || "");
    setYearlyTarget(target.yearlyTarget?.toString() || "");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yearlyTarget || parseFloat(yearlyTarget) <= 0) {
      toast.error("Please enter a valid yearly target");
      return;
    }

    try {
      setSubmitting(true);
      const response = await revenueTargetApi.createOrUpdateTarget({
        year: selectedYear,
        departmentId: selectedDepartment || null,
        yearlyTarget: parseFloat(yearlyTarget),
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowForm(false);
        setEditingTarget(null);
        setSelectedDepartment("");
        setYearlyTarget("");
        loadTargets();
      }
    } catch (error) {
      console.error("Error saving target:", error);
      toast.error(
        error.response?.data?.message || "Failed to save revenue target"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this revenue target?")) {
      return;
    }

    try {
      await revenueTargetApi.deleteTarget(id);
      toast.success("Revenue target deleted successfully");
      loadTargets();
    } catch (error) {
      console.error("Error deleting target:", error);
      toast.error("Failed to delete revenue target");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return "from-green-500 to-emerald-600";
    if (progress >= 75) return "from-blue-500 to-cyan-600";
    if (progress >= 50) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-pink-600";
  };

  const getStatusIcon = (progress) => {
    if (progress >= 100) {
      return <FaCheckCircle className="w-4 h-4 text-green-400" />;
    }
    if (progress >= 75) {
      return <FaCheckCircle className="w-4 h-4 text-blue-400" />;
    }
    if (progress >= 50) {
      return <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />;
    }
    return <FaTimesCircle className="w-4 h-4 text-red-400" />;
  };

  // Filter targets
  const filteredTargets = targets.filter((target) => {
    const matchesSearch =
      !searchTerm ||
      target.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.department?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.year?.toString().includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-white">Loading Revenue Targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <FaBullseye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Revenue Targets</h1>
              <p className="text-xs text-slate-300 mt-1">
                Set and monitor revenue targets for departments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              )}
            </select>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 text-xs font-medium"
            >
              <FaPlus className="w-3 h-3" />
              <span>Create Target</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search targets by department name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
          />
        </div>
      </div>

      {/* Targets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTargets.length > 0 ? (
          filteredTargets.map((target) => {
            const deptId = target.department?._id || target.department || "company-wide";
            const perf = performanceData[deptId] || {};
            const actualRevenue = perf.actualRevenue || 0;
            const yearlyTargetAmount = target.yearlyTarget || 0;
            const progress = yearlyTargetAmount > 0 ? (actualRevenue / yearlyTargetAmount) * 100 : 0;

            return (
              <div
                key={target._id}
                className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl hover:shadow-2xl transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <FaBuilding className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {target.department?.name || "Company Wide"}
                      </h3>
                      {target.department?.code && (
                        <p className="text-[10px] text-slate-400">{target.department.code}</p>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(progress)}
                </div>

                {/* Year */}
                <div className="mb-4">
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                    <FaCalendarAlt className="w-3 h-3" />
                    <span>Year: {target.year}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center">
                      <FaBullseye className="w-3 h-3 mr-1" />
                      Target
                    </span>
                    <span className="text-white font-semibold">
                      {formatCurrency(yearlyTargetAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center">
                      <FaDollarSign className="w-3 h-3 mr-1" />
                      Actual
                    </span>
                    <span className="text-white font-semibold">
                      {formatCurrency(actualRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center">
                      <FaPercent className="w-3 h-3 mr-1" />
                      Progress
                    </span>
                    <span className="text-white font-semibold">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-slate-600/50 rounded-full h-2 mb-2">
                    <div
                      className={`bg-gradient-to-r ${getProgressColor(progress)} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Variance */}
                <div className="pt-4 border-t border-slate-600/50 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Variance</span>
                    <span
                      className={`font-semibold ${
                        actualRevenue >= yearlyTargetAmount
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatCurrency(actualRevenue - yearlyTargetAmount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditClick(target)}
                    className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 text-xs"
                  >
                    <FaEdit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  {user?.role === "law_firm_admin" && (
                    <button
                      onClick={() => handleDelete(target._id)}
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 text-xs"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <FaBullseye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-xs">
              {searchTerm
                ? "No targets found matching your search"
                : "No revenue targets set for this year"}
            </p>
            <button
              onClick={handleCreateClick}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 text-xs font-medium"
            >
              <FaPlus className="w-3 h-3" />
              <span>Create First Target</span>
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 max-w-md w-full border border-slate-600/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-white">
                {editingTarget ? "Edit Revenue Target" : "Create Revenue Target"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTarget(null);
                  setSelectedDepartment("");
                  setYearlyTarget("");
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Year *
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700/80 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/80 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="">Company Wide (No Department)</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave empty for company-wide target
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Yearly Target (KES) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={yearlyTarget}
                  onChange={(e) => setYearlyTarget(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/80 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="Enter yearly target amount"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTarget(null);
                    setSelectedDepartment("");
                    setYearlyTarget("");
                  }}
                  className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600/70 text-white rounded-lg transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 text-xs"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{editingTarget ? "Update" : "Create"} Target</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueTargets;
