import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import revenueTargetApi from "../../store/api/revenueTargetApi";
import { getDepartments } from "../../store/slices/departmentSlice";
import { useDispatch } from "react-redux";
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
} from "react-icons/fa";

const RevenueTargets = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { departments } = useSelector((state) => state.departments);

  const [targets, setTargets] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [yearlyTarget, setYearlyTarget] = useState("");
  const [viewMode, setViewMode] = useState("yearly"); // yearly, monthly, weekly, daily
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    if (user?.lawFirm?._id) {
      dispatch(getDepartments({ lawFirm: user.lawFirm._id }));
      loadTargets();
      loadPerformance();
    }
  }, [dispatch, user, selectedYear, selectedMonth, selectedWeek, selectedDay, viewMode]);

  // Auto-select department for department heads when departments are loaded
  useEffect(() => {
    if ((user?.role === "credit_head" || user?.role === "legal_head") && departments.length > 0 && !selectedDepartment) {
      // Try to find user's department from the departments list
      const userDept = departments.find(
        (dept) =>
          dept._id === user.department ||
          dept._id === user.department?._id ||
          (user.department && dept._id.toString() === user.department.toString())
      );
      
      // If not found, try to find by department type
      if (!userDept) {
        const deptByType = departments.find(
          (dept) =>
            (user.role === "credit_head" && dept.departmentType === "credit_collection") ||
            (user.role === "legal_head" && dept.departmentType === "legal")
        );
        if (deptByType) {
          setSelectedDepartment(deptByType._id);
        }
      } else {
        setSelectedDepartment(userDept._id);
      }
    }
  }, [departments, user, selectedDepartment]);

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

  const loadPerformance = async () => {
    try {
      const params = {
        year: selectedYear,
      };

      if (viewMode === "monthly" && selectedMonth) {
        params.month = selectedMonth;
      }
      if (viewMode === "weekly" && selectedMonth && selectedWeek) {
        params.month = selectedMonth;
        params.week = selectedWeek;
      }
      if (viewMode === "daily" && selectedMonth && selectedDay) {
        params.month = selectedMonth;
        params.day = selectedDay;
      }

      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }

      const response = await revenueTargetApi.getPerformance(params);
      if (response.data.success) {
        setPerformance(response.data.data);
      }
    } catch (error) {
      console.error("Error loading performance:", error);
      toast.error("Failed to load performance data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yearlyTarget || parseFloat(yearlyTarget) <= 0) {
      toast.error("Please enter a valid yearly target");
      return;
    }

    // For department heads, ensure department is selected
    if ((user?.role === "credit_head" || user?.role === "legal_head") && !selectedDepartment) {
      toast.error("Please select a department");
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
        setYearlyTarget("");
        setSelectedDepartment("");
        loadTargets();
        loadPerformance();
      }
    } catch (error) {
      console.error("Error creating target:", error);
      toast.error(
        error.response?.data?.message || "Failed to create revenue target"
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
      loadPerformance();
    } catch (error) {
      console.error("Error deleting target:", error);
      toast.error("Failed to delete revenue target");
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 100) return "text-green-500";
    if (percentage >= 80) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 100) return <FaCheckCircle className="text-green-500" />;
    if (percentage >= 80) return <FaExclamationTriangle className="text-yellow-500" />;
    return <FaTimesCircle className="text-red-500" />;
  };

  const getStatusText = (status) => {
    switch (status) {
      case "on_track":
        return "On Track";
      case "at_risk":
        return "At Risk";
      case "behind":
        return "Behind";
      case "no_target":
        return "No Target Set";
      default:
        return "Unknown";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Filter departments based on user role
  const availableDepartments = departments.filter((dept) => {
    if (user?.role === "law_firm_admin") return true;
    if (user?.role === "credit_head") {
      return dept.departmentType === "credit_collection";
    }
    if (user?.role === "legal_head") {
      return dept.departmentType === "legal";
    }
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FaBullseye className="text-blue-400" />
                Revenue Targets
              </h1>
              <p className="text-slate-300">
                Set and track revenue targets for your departments
              </p>
            </div>
            {(user?.role === "law_firm_admin" ||
              user?.role === "credit_head" ||
              user?.role === "legal_head") && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg"
              >
                <FaPlus /> {showForm ? "Cancel" : "Set Target"}
              </button>
            )}
          </div>
        </div>

        {/* Target Setting Form */}
        {showForm && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-600">
            <h2 className="text-2xl font-bold text-white mb-4">
              {targets.find(
                (t) =>
                  t.year === selectedYear &&
                  (!selectedDepartment || t.department?._id === selectedDepartment)
              )
                ? "Update"
                : "Set"}{" "}
              Revenue Target
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {(user?.role === "law_firm_admin" ||
                  (user?.role === "credit_head" && availableDepartments.length > 0) ||
                  (user?.role === "legal_head" && availableDepartments.length > 0)) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {user?.role === "law_firm_admin" 
                        ? "Department (Optional - leave blank for firm-wide)"
                        : "Department"}
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={user?.role === "credit_head" || user?.role === "legal_head"}
                      required={user?.role === "credit_head" || user?.role === "legal_head"}
                    >
                      {user?.role === "law_firm_admin" && (
                        <option value="">All Departments</option>
                      )}
                      {availableDepartments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {(user?.role === "credit_head" || user?.role === "legal_head") && (
                      <p className="text-xs text-slate-400 mt-1">
                        Target will be set for your department
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Yearly Target (KES)
                  </label>
                  <input
                    type="number"
                    value={yearlyTarget}
                    onChange={(e) => setYearlyTarget(e.target.value)}
                    placeholder="Enter yearly target"
                    min="0"
                    step="0.01"
                    className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheckCircle />
                  )}{" "}
                  Save Target
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setYearlyTarget("");
                    setSelectedDepartment("");
                  }}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View Mode Selector */}
        <div className="bg-slate-800 rounded-2xl p-4 shadow-2xl border border-slate-600">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-slate-300 font-medium">View:</span>
            {["yearly", "monthly", "weekly", "daily"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === mode
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}

            {viewMode === "monthly" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            {viewMode === "weekly" && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monthNames.map((name, index) => (
                    <option key={index + 1} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                  className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Week {i + 1}
                    </option>
                  ))}
                </select>
              </>
            )}

            {viewMode === "daily" && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monthNames.map((name, index) => (
                    <option key={index + 1} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  min="1"
                  max="31"
                  className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Day"
                />
              </>
            )}
          </div>
        </div>

        {/* Performance Dashboard */}
        {performance && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FaChartLine className="text-blue-400" />
                Performance Summary
              </h3>
              {performance.summary && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Target:</span>
                    <span className="text-white font-semibold text-lg">
                      {formatCurrency(performance.summary.totalTarget)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Actual:</span>
                    <span className="text-white font-semibold text-lg">
                      {formatCurrency(performance.summary.totalActual)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Performance:</span>
                    <span
                      className={`font-bold text-xl ${getStatusColor(
                        performance.summary.overallPercentage
                      )}`}
                    >
                      {performance.summary.overallPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(performance.summary.overallPercentage)}
                      <span className="text-white font-semibold">
                        {getStatusText(performance.summary.overallStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Difference:</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          performance.summary.totalActual >=
                          performance.summary.totalTarget
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {performance.summary.totalActual >=
                        performance.summary.totalTarget ? (
                          <FaArrowUp />
                        ) : (
                          <FaArrowDown />
                        )}
                        {formatCurrency(
                          Math.abs(
                            performance.summary.totalActual -
                              performance.summary.totalTarget
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {performance.summary && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Progress Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-300">Target Achievement</span>
                      <span className="text-white font-semibold">
                        {performance.summary.overallPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          performance.summary.overallPercentage >= 100
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : performance.summary.overallPercentage >= 80
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            performance.summary.overallPercentage,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Department Performance Cards */}
        {performance?.performance && performance.performance.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performance.performance.map((perf, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaBuilding className="text-blue-400" />
                    {perf.target?.department?.name || "All Departments"}
                  </h4>
                  {getStatusIcon(perf.performance.percentage)}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Target:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(perf.target?.periodTarget || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Actual:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(perf.actual.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Performance:</span>
                    <span
                      className={`font-bold ${getStatusColor(
                        perf.performance.percentage
                      )}`}
                    >
                      {perf.performance.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-600">
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          perf.performance.percentage >= 100
                            ? "bg-green-500"
                            : perf.performance.percentage >= 80
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(perf.performance.percentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Existing Targets List */}
        {targets.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-600">
            <h3 className="text-2xl font-bold text-white mb-4">
              Existing Targets ({selectedYear})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300">Department</th>
                    <th className="text-right py-3 px-4 text-slate-300">
                      Yearly Target
                    </th>
                    <th className="text-right py-3 px-4 text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((target) => (
                    <tr
                      key={target._id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-white">
                        {target.department?.name || "All Departments"}
                      </td>
                      <td className="py-3 px-4 text-right text-white font-semibold">
                        {formatCurrency(target.yearlyTarget)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {(user?.role === "law_firm_admin" ||
                            user?.role === "system_owner") && (
                            <button
                              onClick={() => handleDelete(target._id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {targets.length === 0 && !loading && (
          <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-600">
            <FaBullseye className="text-6xl text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              No Revenue Targets Set
            </h3>
            <p className="text-slate-400 mb-6">
              Set your first revenue target to start tracking performance
            </p>
            {(user?.role === "law_firm_admin" ||
              user?.role === "credit_head" ||
              user?.role === "legal_head") && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <FaPlus /> Set Target
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTargets;

