import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import reportsApi from "../../store/api/reportsApi";
import {
  FaMoneyBillWave,
  FaSpinner,
  FaFileInvoiceDollar,
  FaChartLine,
  FaGavel,
  FaCreditCard,
  FaCalendarAlt,
  FaFilter,
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaSearch,
} from "react-icons/fa";
import toast from "react-hot-toast";

const FinancialTracking = () => {
  const { user } = useSelector((state) => state.auth);
  const [financialData, setFinancialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (user?.lawFirm?._id) {
      loadFinancialData();
    }
  }, [user, period]);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      const response = await reportsApi.getAccountantDashboard(
        user.lawFirm._id,
        { period }
      );
      if (response.data.success) {
        setFinancialData(response.data.data);
      }
    } catch (error) {
      console.error("Error loading financial data:", error);
      toast.error("Failed to load financial data");
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <FaCheckCircle className="w-3 h-3 text-green-400" />;
      case "pending":
        return <FaClock className="w-3 h-3 text-yellow-400" />;
      case "failed":
        return <FaTimesCircle className="w-3 h-3 text-red-400" />;
      default:
        return <FaClock className="w-3 h-3 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    
    switch (statusLower) {
      case "completed":
        return `${baseClasses} bg-green-500/20 text-green-400`;
      case "pending":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
      case "failed":
        return `${baseClasses} bg-red-500/20 text-red-400`;
      default:
        return `${baseClasses} bg-slate-500/20 text-slate-400`;
    }
  };

  // Filter payments
  const filteredPayments = financialData?.financialTracking?.recentPayments
    ? financialData.financialTracking.recentPayments.filter((payment) => {
        // Search filter
        const matchesSearch =
          !searchTerm ||
          payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.amount?.toString().includes(searchTerm);

        // Status filter
        const matchesStatus =
          filterStatus === "all" || payment.status?.toLowerCase() === filterStatus.toLowerCase();

        // Type filter
        const matchesType =
          filterType === "all" ||
          payment.purpose?.toLowerCase().includes(filterType.toLowerCase()) ||
          payment.paymentMethod?.toLowerCase().includes(filterType.toLowerCase());

        return matchesSearch && matchesStatus && matchesType;
      })
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-white">Loading Financial Data...</p>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 flex justify-center items-center">
        <p className="text-white">No financial data available</p>
      </div>
    );
  }

  const { financialTracking } = financialData;
  const totalRevenue =
    (financialTracking?.totalMoneyCollected || 0) +
    (financialTracking?.paidFilingFees || 0) +
    (financialTracking?.legalCasePayments || 0) +
    (financialTracking?.creditCasePayments || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <FaChartLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Financial Tracking</h1>
              <p className="text-xs text-slate-300 mt-1">
                Detailed tracking of all money coming into the company
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

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-2">Total Revenue</p>
              <p className="text-xs font-bold text-white break-words leading-tight pr-1">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Last {period} days</p>
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
                {formatCurrency(financialTracking?.paidFilingFees || 0)}
              </p>
              <div className="flex items-center mt-1">
                <FaFileInvoiceDollar className="w-3 h-3 text-blue-400 mr-1" />
                <p className="text-[10px] text-slate-500">Legal cases</p>
              </div>
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
                {formatCurrency(financialTracking?.legalCasePayments || 0)}
              </p>
              <div className="flex items-center mt-1">
                <FaGavel className="w-3 h-3 text-purple-400 mr-1" />
                <p className="text-[10px] text-slate-500">Case payments</p>
              </div>
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
                {formatCurrency(financialTracking?.creditCasePayments || 0)}
              </p>
              <div className="flex items-center mt-1">
                <FaChartLine className="w-3 h-3 text-orange-400 mr-1" />
                <p className="text-[10px] text-slate-500">Debt recovery</p>
              </div>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FaChartLine className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <FaCreditCard className="w-5 h-5 text-green-400" />
            <h2 className="text-xs font-bold text-white">Payment History</h2>
            <span className="text-xs text-slate-400">
              ({filteredPayments.length} payments)
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
          >
            <option value="all">All Types</option>
            <option value="filing">Filing Fee</option>
            <option value="payment">Case Payment</option>
            <option value="credit">Credit Collection</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-600/50">
                <th className="text-left py-3 px-3 text-slate-400 font-semibold">Payment ID</th>
                <th className="text-left py-3 px-3 text-slate-400 font-semibold">Client</th>
                <th className="text-left py-3 px-3 text-slate-400 font-semibold">Amount</th>
                <th className="text-left py-3 px-3 text-slate-400 font-semibold">Method</th>
                <th className="text-left py-3 px-3 text-slate-400 font-semibold">Purpose</th>
                <th className="text-left py-3 px-3 text-slate-400 font-semibold">Date</th>
                <th className="text-left py-3 px-3 text-slate-400 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment._id || payment.id}
                    className="border-b border-slate-600/30 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span className="text-white font-mono text-[10px]">
                        {payment.paymentId || payment._id?.toString().slice(-8) || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-white">
                        {payment.client?.firstName && payment.client?.lastName
                          ? `${payment.client.firstName} ${payment.client.lastName}`
                          : payment.client?.email || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-white font-semibold">
                        {formatCurrency(payment.amount || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-300 capitalize">
                        {payment.paymentMethod?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-300 capitalize">
                        {payment.purpose?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1">
                        <FaCalendarAlt className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-300">
                          {payment.createdAt
                            ? formatDate(payment.createdAt)
                            : payment.paymentDate
                            ? formatDate(payment.paymentDate)
                            : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <span className={getStatusBadge(payment.status)}>
                          {payment.status || "Unknown"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No payments found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {filteredPayments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Total filtered payments: {filteredPayments.length}
              </span>
              <span className="text-white font-semibold">
                Total Amount:{" "}
                {formatCurrency(
                  filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialTracking;
