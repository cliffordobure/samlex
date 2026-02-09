import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import reportsApi from "../../store/api/reportsApi";
import revenueTargetApi from "../../store/api/revenueTargetApi";
import toast from "react-hot-toast";
import {
  FaChartBar,
  FaSpinner,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaDollarSign,
  FaBuilding,
  FaBullseye,
  FaChartLine,
  FaCalendarAlt,
  FaFilter,
  FaPrint,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaPercent,
} from "react-icons/fa";

const Reports = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState(30);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState("financial-summary");

  useEffect(() => {
    if (user?.lawFirm?._id && selectedReport) {
      loadReport();
    }
  }, [user, selectedReport, period, year]);

  const loadReport = async () => {
    if (!selectedReport) return;

    try {
      setLoading(true);
      let response;

      switch (selectedReport) {
        case "financial-summary":
          response = await reportsApi.getAccountantDashboard(
            user.lawFirm._id,
            { period }
          );
          break;
        case "revenue-analytics":
          response = await reportsApi.getRevenueAnalytics(
            user.lawFirm._id,
            { period }
          );
          break;
        case "department-performance":
          response = await reportsApi.getDepartmentPerformance(
            user.lawFirm._id,
            { period }
          );
          break;
        case "target-performance":
          response = await revenueTargetApi.getPerformance({
            year,
          });
          break;
        default:
          return;
      }

      if (response.data.success) {
        setReportData(response.data.data);
        console.log("Report data loaded:", response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load report data");
        setReportData(null);
      }
    } catch (error) {
      console.error("Error loading report:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to load report data";
      toast.error(errorMessage);
      console.error("Full error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
    setReportData(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleDownload = async (format) => {
    if (!selectedReport) {
      toast.error("Please select a report first");
      return;
    }

    try {
      toast.loading(`Generating ${format.toUpperCase()} report...`);
      // For now, we'll show a message since download endpoints may need to be implemented
      toast.dismiss();
      toast.success(`${format.toUpperCase()} download will be available soon`);
      // TODO: Implement actual download when endpoints are ready
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypes = [
    {
      id: "financial-summary",
      name: "Financial Summary",
      description: "Overview of all financial transactions and revenue",
      icon: FaMoneyBillWave,
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "revenue-analytics",
      name: "Revenue Analytics",
      description: "Detailed revenue analysis and trends",
      icon: FaChartLine,
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "department-performance",
      name: "Department Performance",
      description: "Performance metrics for each department",
      icon: FaBuilding,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "target-performance",
      name: "Target vs Actual",
      description: "Revenue targets vs actual performance",
      icon: FaBullseye,
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <FaChartBar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Financial Reports</h1>
              <p className="text-xs text-slate-300 mt-1">
                Generate and view comprehensive financial reports
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {selectedReport && (
              <>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg transition-all duration-200 text-xs"
                >
                  <FaPrint className="w-3 h-3" />
                  <span>Print</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload("pdf")}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 text-xs"
                  >
                    <FaFilePdf className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload("excel")}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all duration-200 text-xs"
                  >
                    <FaFileExcel className="w-3 h-3" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleDownload("csv")}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 text-xs"
                  >
                    <FaFileCsv className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.id;

          return (
            <button
              key={report.id}
              onClick={() => handleReportSelect(report.id)}
              className={`bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 text-left ${
                isSelected
                  ? "border-green-500/50 shadow-2xl scale-105"
                  : "border-slate-600/50 hover:border-slate-500/50 hover:shadow-xl"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${report.color} rounded-xl`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {isSelected && (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>
              <h3 className="text-xs font-bold text-white mb-2">{report.name}</h3>
              <p className="text-[10px] text-slate-400">{report.description}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {selectedReport && (
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedReport !== "target-performance" ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last year</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Content */}
      {loading ? (
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-12 border border-slate-600/50 shadow-2xl flex justify-center items-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
              <FaSpinner className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-xs font-semibold text-white">Loading Report...</p>
          </div>
        </div>
      ) : selectedReport && reportData ? (
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          {/* Financial Summary Report */}
          {selectedReport === "financial-summary" && (
            <div className="space-y-6">
              <div className="border-b border-slate-600/50 pb-4">
                <h2 className="text-xs font-bold text-white mb-2">Financial Summary Report</h2>
                <p className="text-[10px] text-slate-400">
                  Period: Last {period} days | Generated: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Total Revenue</span>
                    <FaMoneyBillWave className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(
                      (reportData.financialTracking?.totalMoneyCollected || 0) +
                      (reportData.financialTracking?.paidFilingFees || 0) +
                      (reportData.financialTracking?.legalCasePayments || 0) +
                      (reportData.financialTracking?.creditCasePayments || 0)
                    )}
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Filing Fees</span>
                    <FaFileInvoiceDollar className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(reportData.financialTracking?.paidFilingFees || 0)}
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Legal Payments</span>
                    <FaDollarSign className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(reportData.financialTracking?.legalCasePayments || 0)}
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Credit Collections</span>
                    <FaChartLine className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(reportData.financialTracking?.creditCasePayments || 0)}
                  </p>
                </div>
              </div>

              {reportData.summary && (
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-white mb-3">Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Total Departments: </span>
                      <span className="text-white font-semibold">
                        {reportData.summary.totalDepartments || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Revenue: </span>
                      <span className="text-white font-semibold">
                        {formatCurrency(reportData.summary.totalRevenue || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Revenue Analytics Report */}
          {selectedReport === "revenue-analytics" && (
            <div className="space-y-6">
              <div className="border-b border-slate-600/50 pb-4">
                <h2 className="text-xs font-bold text-white mb-2">Revenue Analytics Report</h2>
                <p className="text-[10px] text-slate-400">
                  Period: Last {period} days | Generated: {new Date().toLocaleDateString()}
                </p>
              </div>
              
              {/* Total Revenue Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Total Revenue</p>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(
                      reportData.overview?.totalRevenue ||
                      (reportData.totalRevenue || 0) +
                      (reportData.totalPaidFilingFees || reportData.totalFilingFees || 0) +
                      (reportData.totalPaidEscalationFees || reportData.totalEscalationFees || 0) +
                      (reportData.totalPaidPromisedAmount || reportData.totalPromisedPayments || 0)
                    )}
                  </p>
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Filing Fees</p>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(
                      reportData.overview?.totalPaidFilingFees ||
                      reportData.totalPaidFilingFees ||
                      reportData.totalFilingFees ||
                      0
                    )}
                  </p>
                  {(reportData.overview?.totalFilingFees || reportData.totalFilingFees) && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Total: {formatCurrency(reportData.overview?.totalFilingFees || reportData.totalFilingFees)}
                    </p>
                  )}
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Escalation Fees</p>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(
                      reportData.overview?.totalPaidEscalationFees ||
                      reportData.totalPaidEscalationFees ||
                      reportData.totalEscalationFees ||
                      0
                    )}
                  </p>
                  {(reportData.overview?.totalEscalationFees || reportData.totalEscalationFees) && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Total: {formatCurrency(reportData.overview?.totalEscalationFees || reportData.totalEscalationFees)}
                    </p>
                  )}
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Promised Payments</p>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(
                      reportData.overview?.totalPaidPromisedAmount ||
                      reportData.totalPaidPromisedAmount ||
                      reportData.totalPromisedPayments ||
                      0
                    )}
                  </p>
                  {(reportData.overview?.totalPromisedAmount || reportData.totalPromisedAmount) && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Total: {formatCurrency(reportData.overview?.totalPromisedAmount || reportData.totalPromisedAmount)}
                    </p>
                  )}
                </div>
              </div>

              {/* Monthly Trends */}
              {(reportData.monthlyTrends || reportData.filingFeesStats) && (
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-white mb-3">Monthly Trends</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reportData.filingFeesStats && Array.isArray(reportData.filingFeesStats) && reportData.filingFeesStats.length > 0 ? (
                      reportData.filingFeesStats.slice(-6).map((stat, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            {stat._id?.year}-{String(stat._id?.month || 1).padStart(2, '0')}
                          </span>
                          <div className="flex items-center space-x-4">
                            <span className="text-slate-300">
                              Paid: {formatCurrency(stat.paidFilingFees || 0)}
                            </span>
                            <span className="text-slate-400">
                              Total: {formatCurrency(stat.totalFilingFees || 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : reportData.monthlyTrends && Array.isArray(reportData.monthlyTrends) ? (
                      reportData.monthlyTrends.slice(-6).map((trend, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            {trend.month || `${trend._id?.year || trend.year}-${String(trend._id?.month || trend.month || 1).padStart(2, '0')}`}
                          </span>
                          <span className="text-white font-semibold">
                            {formatCurrency(trend.revenue || trend.total || trend.totalFilingFees || 0)}
                          </span>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              )}

              {/* Recent Revenue */}
              {reportData.recentRevenue && (
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-white mb-3">Recent Revenue (Last {period} days)</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Filing Fees: </span>
                      <span className="text-white font-semibold">
                        {formatCurrency(reportData.recentRevenue.paidFilingFees || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Escalation Fees: </span>
                      <span className="text-white font-semibold">
                        {formatCurrency(reportData.recentRevenue.paidEscalationFees || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Promised Payments: </span>
                      <span className="text-white font-semibold">
                        {formatCurrency(reportData.recentRevenue.paidPromisedPayments || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Total: </span>
                      <span className="text-white font-semibold">
                        {formatCurrency(reportData.recentRevenue.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department Performance Report */}
          {selectedReport === "department-performance" && (
            <div className="space-y-6">
              <div className="border-b border-slate-600/50 pb-4">
                <h2 className="text-xs font-bold text-white mb-2">Department Performance Report</h2>
                <p className="text-[10px] text-slate-400">
                  Period: Last {period} days | Generated: {new Date().toLocaleDateString()}
                </p>
              </div>
              {Array.isArray(reportData) && reportData.length > 0 ? (
                <div className="space-y-4">
                  {reportData.map((dept) => (
                    <div key={dept.department?._id || dept._id || dept.id} className="bg-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-white">
                          {dept.department?.name || dept.name || "Unknown Department"}
                        </h3>
                        {dept.department?.code && (
                          <span className="text-[10px] text-slate-400">{dept.department.code}</span>
                        )}
                      </div>
                      {dept.stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400">Total Cases: </span>
                            <span className="text-white font-semibold">
                              {(dept.stats.totalCreditCases || 0) + (dept.stats.totalLegalCases || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Credit Cases: </span>
                            <span className="text-white font-semibold">
                              {dept.stats.totalCreditCases || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Legal Cases: </span>
                            <span className="text-white font-semibold">
                              {dept.stats.totalLegalCases || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Users: </span>
                            <span className="text-white font-semibold">
                              {dept.stats.totalUsers || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Completion Rate: </span>
                            <span className="text-white font-semibold">
                              {dept.stats.completionRate?.toFixed(1) || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Debt: </span>
                            <span className="text-white font-semibold">
                              {formatCurrency(dept.stats.totalDebtAmount || 0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  No department performance data available
                </p>
              )}
            </div>
          )}

          {/* Target Performance Report */}
          {selectedReport === "target-performance" && (
            <div className="space-y-6">
              <div className="border-b border-slate-600/50 pb-4">
                <h2 className="text-xs font-bold text-white mb-2">Target vs Actual Report</h2>
                <p className="text-[10px] text-slate-400">
                  Year: {year} | Generated: {new Date().toLocaleDateString()}
                </p>
              </div>
              
              {/* Summary */}
              {reportData.summary && (
                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                  <h3 className="text-xs font-bold text-white mb-3">Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Total Target: </span>
                      <span className="text-white font-semibold">
                        {formatCurrency(reportData.summary.totalTarget || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Actual: </span>
                      <span className="text-white font-semibold">
                        {formatCurrency(reportData.summary.totalActual || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Overall Progress: </span>
                      <span className="text-white font-semibold">
                        {reportData.summary.overallPercentage?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status: </span>
                      <span className={`font-semibold ${
                        reportData.summary.overallStatus === "on_track" ? "text-green-400" :
                        reportData.summary.overallStatus === "at_risk" ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {reportData.summary.overallStatus?.replace("_", " ").toUpperCase() || "UNKNOWN"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Details */}
              {reportData.performance && Array.isArray(reportData.performance) && reportData.performance.length > 0 ? (
                <div className="space-y-4">
                  {reportData.performance.map((item, index) => {
                    const target = item.target;
                    const actual = item.actual;
                    const perf = item.performance;
                    const deptName = target?.department?.name || "Company Wide";
                    const targetAmount = target?.periodTarget || target?.yearlyTarget || 0;
                    const actualAmount = actual?.total || 0;
                    const progress = perf?.percentage || (targetAmount > 0 ? (actualAmount / targetAmount) * 100 : 0);

                    return (
                      <div key={target?._id || index} className="bg-slate-700/50 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-white mb-3">{deptName}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-3">
                          <div>
                            <span className="text-slate-400">Target: </span>
                            <span className="text-white font-semibold">
                              {formatCurrency(targetAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Actual: </span>
                            <span className="text-white font-semibold">
                              {formatCurrency(actualAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Progress: </span>
                            <span className="text-white font-semibold">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-600/50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress >= 100 ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                              progress >= 75 ? "bg-gradient-to-r from-blue-500 to-cyan-600" :
                              progress >= 50 ? "bg-gradient-to-r from-yellow-500 to-orange-600" :
                              "bg-gradient-to-r from-red-500 to-pink-600"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        {perf?.difference !== undefined && (
                          <div className="mt-2 text-xs">
                            <span className="text-slate-400">Variance: </span>
                            <span className={`font-semibold ${
                              perf.difference >= 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {formatCurrency(perf.difference)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  No target performance data available for this year
                </p>
              )}
            </div>
          )}
        </div>
      ) : selectedReport ? (
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-12 border border-slate-600/50 shadow-2xl text-center">
          <FaChartBar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-xs text-slate-400">No report data available</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-12 border border-slate-600/50 shadow-2xl text-center">
          <FaChartBar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-xs text-slate-400">Select a report type to view financial reports</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
