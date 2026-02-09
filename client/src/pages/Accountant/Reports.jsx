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
      } else {
        toast.error(response.data.message || "Failed to load report data");
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
              {reportData.totalRevenue !== undefined && (
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Total Revenue</p>
                  <p className="text-xs font-bold text-white">
                    {formatCurrency(reportData.totalRevenue || 0)}
                  </p>
                </div>
              )}
              {/* Add more revenue analytics details here */}
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
              {reportData.departments && Array.isArray(reportData.departments) && (
                <div className="space-y-4">
                  {reportData.departments.map((dept) => (
                    <div key={dept._id || dept.id} className="bg-slate-700/50 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-white mb-3">{dept.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">Revenue: </span>
                          <span className="text-white font-semibold">
                            {formatCurrency(dept.revenue || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Cases: </span>
                          <span className="text-white font-semibold">{dept.totalCases || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
              {Array.isArray(reportData) && reportData.length > 0 ? (
                <div className="space-y-4">
                  {reportData.map((item) => (
                    <div key={item._id || item.id} className="bg-slate-700/50 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-white mb-3">
                        {item.department?.name || "Company Wide"}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">Target: </span>
                          <span className="text-white font-semibold">
                            {formatCurrency(item.yearlyTarget || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Actual: </span>
                          <span className="text-white font-semibold">
                            {formatCurrency(item.actualRevenue || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Progress: </span>
                          <span className="text-white font-semibold">
                            {item.progress?.toFixed(1) || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  No target performance data available
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
