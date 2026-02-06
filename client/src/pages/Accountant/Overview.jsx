import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import reportsApi from "../../store/api/reportsApi";
import {
  FaMoneyBillWave,
  FaBuilding,
  FaBullseye,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaEye,
  FaDollarSign,
  FaPercent,
  FaCalendarAlt,
  FaGavel,
} from "react-icons/fa";
import toast from "react-hot-toast";

const AccountantOverview = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);

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
      console.error("Error loading accountant dashboard:", error);
      toast.error("Failed to load dashboard data");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-white">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 flex justify-center items-center">
        <p className="text-white">No data available</p>
      </div>
    );
  }

  const { financialTracking, departmentReviews, targetMonitoring, summary } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <FaFileInvoiceDollar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Accountant Dashboard</h1>
              <p className="text-xs text-slate-300 mt-2">
                Financial tracking and department monitoring
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

      {/* Financial Tracking Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Total Money Collected</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {formatCurrency(financialTracking.totalMoneyCollected)}
              </p>
            </div>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FaMoneyBillWave className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Filing Fees</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {formatCurrency(financialTracking.paidFilingFees)}
              </p>
            </div>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FaFileInvoiceDollar className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Legal Payments</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {formatCurrency(financialTracking.legalCasePayments)}
              </p>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FaGavel className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Credit Collections</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {formatCurrency(financialTracking.creditCasePayments)}
              </p>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FaChartLine className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Department Reviews */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaBuilding className="w-5 h-5 text-green-400" />
            <h2 className="text-xs font-bold text-white">Department Reviews</h2>
          </div>
          <Link
            to="/accountant/departments"
            className="text-xs text-green-400 hover:text-green-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentReviews.map((dept) => (
            <div
              key={dept.id}
              className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white">{dept.name}</h3>
                <span className="text-xs text-slate-400">{dept.code}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Revenue</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(dept.revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(dept.yearlyTarget)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white font-semibold">
                    {dept.targetProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-600/50 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(dept.targetProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Monitoring */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaBullseye className="w-5 h-5 text-green-400" />
            <h2 className="text-xs font-bold text-white">Target Monitoring</h2>
          </div>
          <Link
            to="/accountant/targets"
            className="text-xs text-green-400 hover:text-green-300 flex items-center space-x-1"
          >
            <span>View Details</span>
            <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-4">
          {targetMonitoring.map((target) => (
            <div
              key={target.id}
              className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {target.department?.name || "Company Wide"}
                  </h3>
                  <p className="text-xs text-slate-400">{target.year}</p>
                </div>
                {target.isOnTrack ? (
                  <FaCheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <FaExclamationTriangle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Actual</p>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(target.actualRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Target</p>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(target.yearlyTarget)}
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-600/50 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(target.progress, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-semibold">
                  {target.progress.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaMoneyBillWave className="w-5 h-5 text-green-400" />
            <h2 className="text-xs font-bold text-white">Recent Payments</h2>
          </div>
          <Link
            to="/accountant/financial-tracking"
            className="text-xs text-green-400 hover:text-green-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-600/50">
                <th className="text-left py-2 px-3 text-slate-400">Amount</th>
                <th className="text-left py-2 px-3 text-slate-400">Method</th>
                <th className="text-left py-2 px-3 text-slate-400">Purpose</th>
                <th className="text-left py-2 px-3 text-slate-400">Date</th>
                <th className="text-left py-2 px-3 text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {financialTracking.recentPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-600/30 hover:bg-slate-700/30"
                >
                  <td className="py-2 px-3 text-white font-semibold">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-2 px-3 text-slate-300 capitalize">
                    {payment.paymentMethod?.replace("_", " ")}
                  </td>
                  <td className="py-2 px-3 text-slate-300 capitalize">
                    {payment.purpose?.replace("_", " ")}
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        payment.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountantOverview;
