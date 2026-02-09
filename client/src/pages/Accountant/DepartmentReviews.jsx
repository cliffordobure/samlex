import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import reportsApi from "../../store/api/reportsApi";
import {
  FaBuilding,
  FaSpinner,
  FaChartLine,
  FaBullseye,
  FaArrowUp,
  FaArrowDown,
  FaPercent,
  FaDollarSign,
  FaUsers,
  FaFileAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import toast from "react-hot-toast";

const DepartmentReviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue"); // revenue, progress, target
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc

  useEffect(() => {
    if (user?.lawFirm?._id) {
      loadDashboardData();
    }
  }, [user, period]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await reportsApi.getAccountantDashboard(
        user.lawFirm._id,
        { period }
      );
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error("Error loading department reviews:", error);
      toast.error("Failed to load department data");
    } finally {
      setIsLoading(false);
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

  const getProgressStatus = (progress) => {
    if (progress >= 100) {
      return { icon: FaCheckCircle, color: "text-green-400", text: "Target Achieved" };
    }
    if (progress >= 75) {
      return { icon: FaCheckCircle, color: "text-blue-400", text: "On Track" };
    }
    if (progress >= 50) {
      return { icon: FaExclamationTriangle, color: "text-yellow-400", text: "Needs Attention" };
    }
    return { icon: FaTimesCircle, color: "text-red-400", text: "Behind Target" };
  };

  // Filter and sort departments
  const filteredAndSortedDepartments = dashboardData?.departmentReviews
    ? dashboardData.departmentReviews
        .filter((dept) => {
          const matchesSearch =
            !searchTerm ||
            dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dept.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dept.departmentType?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        })
        .sort((a, b) => {
          let aValue, bValue;
          switch (sortBy) {
            case "revenue":
              aValue = a.revenue || 0;
              bValue = b.revenue || 0;
              break;
            case "progress":
              aValue = a.targetProgress || 0;
              bValue = b.targetProgress || 0;
              break;
            case "target":
              aValue = a.yearlyTarget || 0;
              bValue = b.yearlyTarget || 0;
              break;
            default:
              aValue = a.revenue || 0;
              bValue = b.revenue || 0;
          }
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        })
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-white">Loading Department Reviews...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 flex justify-center items-center">
        <p className="text-white">No department data available</p>
      </div>
    );
  }

  const { departmentReviews, summary } = dashboardData;
  const totalDepartments = departmentReviews?.length || 0;
  const averageProgress =
    departmentReviews?.length > 0
      ? departmentReviews.reduce((sum, dept) => sum + (dept.targetProgress || 0), 0) /
        departmentReviews.length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <FaBuilding className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Department Reviews</h1>
              <p className="text-xs text-slate-300 mt-1">
                Performance analysis and target monitoring for all departments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Total Departments</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {totalDepartments}
              </p>
            </div>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FaBuilding className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Average Progress</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {averageProgress.toFixed(1)}%
              </p>
              <div className="flex items-center mt-1">
                {averageProgress >= 75 ? (
                  <FaArrowUp className="w-3 h-3 text-green-400 mr-1" />
                ) : (
                  <FaArrowDown className="w-3 h-3 text-red-400 mr-1" />
                )}
                <p className="text-[10px] text-slate-500">Overall performance</p>
              </div>
            </div>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FaPercent className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Total Revenue</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {formatCurrency(
                  departmentReviews?.reduce((sum, dept) => sum + (dept.revenue || 0), 0) || 0
                )}
              </p>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FaDollarSign className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Total Targets</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {formatCurrency(
                  departmentReviews?.reduce((sum, dept) => sum + (dept.yearlyTarget || 0), 0) || 0
                )}
              </p>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FaBullseye className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="progress">Sort by Progress</option>
            <option value="target">Sort by Target</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredAndSortedDepartments.length > 0 ? (
          filteredAndSortedDepartments.map((dept) => {
            const progress = dept.targetProgress || 0;
            const status = getProgressStatus(progress);
            const StatusIcon = status.icon;

            return (
              <div
                key={dept.id || dept._id}
                className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl hover:shadow-2xl transition-all duration-300"
              >
                {/* Department Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <FaBuilding className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">{dept.name || "Unknown"}</h3>
                      {dept.code && (
                        <p className="text-[10px] text-slate-400">{dept.code}</p>
                      )}
                    </div>
                  </div>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>

                {/* Department Type */}
                {dept.departmentType && (
                  <div className="mb-4">
                    <span className="px-2 py-1 bg-slate-700/50 rounded text-[10px] text-slate-300 capitalize">
                      {dept.departmentType.replace("_", " ")}
                    </span>
                  </div>
                )}

                {/* Case Statistics */}
                {(dept.totalCases !== undefined || dept.activeCases !== undefined) && (
                  <div className="mb-4 flex items-center space-x-4 text-xs">
                    {dept.totalCases !== undefined && (
                      <div className="flex items-center space-x-1">
                        <FaFileAlt className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-300">
                          {dept.totalCases} {dept.totalCases === 1 ? "case" : "cases"}
                        </span>
                      </div>
                    )}
                    {dept.activeCases !== undefined && (
                      <div className="flex items-center space-x-1">
                        <FaCheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">
                          {dept.activeCases} active
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Revenue Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center">
                      <FaDollarSign className="w-3 h-3 mr-1" />
                      Revenue
                    </span>
                    <span className="text-white font-semibold">
                      {formatCurrency(dept.revenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center">
                      <FaBullseye className="w-3 h-3 mr-1" />
                      Target
                    </span>
                    <span className="text-white font-semibold">
                      {formatCurrency(dept.yearlyTarget || 0)}
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
                  <p className={`text-[10px] ${status.color} text-center`}>
                    {status.text}
                  </p>
                </div>

                {/* Additional Stats */}
                <div className="pt-4 border-t border-slate-600/50">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px] mb-1">Remaining</p>
                      <p className="text-white font-semibold">
                        {formatCurrency(Math.max(0, (dept.yearlyTarget || 0) - (dept.revenue || 0)))}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] mb-1">Variance</p>
                      <p className={`font-semibold ${
                        (dept.revenue || 0) >= (dept.yearlyTarget || 0)
                          ? "text-green-400"
                          : "text-red-400"
                      }`}>
                        {formatCurrency((dept.revenue || 0) - (dept.yearlyTarget || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <FaBuilding className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-xs">
              {searchTerm ? "No departments found matching your search" : "No departments available"}
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filteredAndSortedDepartments.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="text-xs text-slate-400">
              Showing {filteredAndSortedDepartments.length} of {totalDepartments} departments
            </div>
            <div className="flex items-center space-x-6 text-xs">
              <div>
                <span className="text-slate-400">Total Revenue: </span>
                <span className="text-white font-semibold">
                  {formatCurrency(
                    filteredAndSortedDepartments.reduce(
                      (sum, dept) => sum + (dept.revenue || 0),
                      0
                    )
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Avg Progress: </span>
                <span className="text-white font-semibold">
                  {(
                    filteredAndSortedDepartments.reduce(
                      (sum, dept) => sum + (dept.targetProgress || 0),
                      0
                    ) / filteredAndSortedDepartments.length
                  ).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentReviews;
