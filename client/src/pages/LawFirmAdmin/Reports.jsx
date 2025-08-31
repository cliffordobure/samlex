import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCaseStatistics,
  fetchRevenueAnalytics,
} from "../../store/slices/reportsSlice";
import Loading from "../../components/common/Loading";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import reportsApi from "../../store/api/reportsApi";
import {
  FaChartBar,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaCalendarAlt,
  FaUsers,
  FaFileContract,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUserTie,
  FaBuilding,
  FaGavel,
  FaChartLine,
  FaChartPie,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaSyncAlt,
  FaFilter,
  FaSearch,
  FaTimes,
  FaFileAlt,
  FaCalculator,
  FaPercentage,
  FaDollarSign,
  FaCalendarCheck,
  FaUserCheck,
  FaUserTimes,
  FaFileInvoiceDollar,
  FaHandshake,
  FaBalanceScale,
  FaShieldAlt,
  FaRocket,
  FaLightbulb,
  FaCog,
  FaInfoCircle,
  FaMinus,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Reports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { caseStatistics, revenueAnalytics, isLoading, error } = useSelector(
    (state) => state.reports
  );

  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Enhanced state for reports
  const [adminOwnCases, setAdminOwnCases] = useState(null);
  const [legalPerformance, setLegalPerformance] = useState(null);
  const [debtCollectionPerformance, setDebtCollectionPerformance] = useState(null);
  const [enhancedRevenue, setEnhancedRevenue] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    department: "",
    caseType: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Enhanced periods with better labels
  const periods = [
    { value: "7", label: "Last 7 days", icon: FaCalendarAlt },
    { value: "30", label: "Last 30 days", icon: FaCalendarAlt },
    { value: "90", label: "Last 90 days", icon: FaCalendarAlt },
    { value: "365", label: "Last year", icon: FaCalendarAlt },
  ];

  useEffect(() => {
    if (user?.lawFirm?._id) {
      loadDashboardData();
      const params = { period: selectedPeriod };
      dispatch(fetchCaseStatistics({ lawFirmId: user.lawFirm._id, params }));
      dispatch(fetchRevenueAnalytics({ lawFirmId: user.lawFirm._id, params }));
    }
  }, [user?.lawFirm?._id, selectedPeriod, dispatch, refreshKey]);

  // Load enhanced reports when tab changes
  useEffect(() => {
    if (user?.lawFirm?._id && activeTab !== "overview") {
      loadEnhancedReports();
    }
  }, [activeTab, selectedPeriod, user?.lawFirm?._id, refreshKey]);

  const loadDashboardData = async () => {
    try {
      const res = await reportsApi.getLawFirmAdminDashboard(user.lawFirm._id);
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const loadEnhancedReports = async () => {
    setLoadingReports(true);
    try {
      const params = { period: selectedPeriod, ...filters };

      switch (activeTab) {
        case "admin-cases": {
          const adminCasesRes = await reportsApi.getAdminOwnCases();
          if (adminCasesRes.data.success) {
            setAdminOwnCases(adminCasesRes.data.data);
          }
          break;
        }
        case "legal-performance": {
          const legalPerfRes = await reportsApi.getLegalPerformance(
            user.lawFirm._id,
            params
          );
          if (legalPerfRes.data.success) {
            setLegalPerformance(legalPerfRes.data.data);
          }
          break;
        }
        case "debt-collection": {
          const debtPerfRes = await reportsApi.getDebtCollectionPerformance(
            user.lawFirm._id,
            params
          );
          if (debtPerfRes.data.success) {
            setDebtCollectionPerformance(debtPerfRes.data.data);
          }
          break;
        }
        case "enhanced-revenue": {
          const revenueRes = await reportsApi.getEnhancedRevenue(
            user.lawFirm._id,
            params
          );
          if (revenueRes.data.success) {
            setEnhancedRevenue(revenueRes.data.data);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error loading enhanced reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      department: "",
      caseType: "",
      status: "",
    });
    setSearchQuery("");
  };

  const handleDownload = async (format, reportType = activeTab) => {
    setDownloading(true);
    try {
      let response;
      let filename;

      if (format === "pdf") {
        response = await reportsApi.downloadPDF(user.lawFirm._id, reportType);
        filename = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_${reportType}_report.pdf`;
      } else {
        response = await reportsApi.downloadExcel(user.lawFirm._id, reportType);
        filename = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_${reportType}_report.xlsx`;
      }

      // Create download link
      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading Reports & Analytics...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return "0%";
    return `${Math.round(value * 100) / 100}%`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    return new Intl.NumberFormat("en-KE").format(value);
  };

  const getTrendIcon = (value, previousValue) => {
    if (!previousValue || previousValue === 0) return <FaMinus className="w-4 h-4 text-slate-400" />;
    const change = ((value - previousValue) / previousValue) * 100;
    if (change > 0) return <FaArrowUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <FaArrowDown className="w-4 h-4 text-red-400" />;
    return <FaMinus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (value, previousValue) => {
    if (!previousValue || previousValue === 0) return "text-slate-400";
    const change = ((value - previousValue) / previousValue) * 100;
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-slate-400";
  };

  const tabs = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: FaChartBar,
      description: "Key performance indicators and summary statistics",
      color: "from-blue-500 to-blue-600"
    },
    { 
      id: "admin-cases", 
      label: "My Cases", 
      icon: FaFileContract,
      description: "Personal case management and performance metrics",
      color: "from-green-500 to-green-600"
    },
    { 
      id: "legal-performance", 
      label: "Legal Performance", 
      icon: FaGavel,
      description: "Legal case analysis and resolution metrics",
      color: "from-purple-500 to-purple-600"
    },
    { 
      id: "debt-collection", 
      label: "Debt Collection", 
      icon: FaMoneyBillWave,
      description: "Credit collection performance and trends",
      color: "from-orange-500 to-orange-600"
    },
    { 
      id: "enhanced-revenue", 
      label: "Revenue Analytics", 
      icon: FaChartLine,
      description: "Financial performance and revenue insights",
      color: "from-indigo-500 to-indigo-600"
    },
  ];

  const renderOverviewTab = () => (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
              <FaFileContract className="text-xl text-white" />
            </div>
            <div className="text-right">
              {getTrendIcon(dashboardData?.totalCreditCases, dashboardData?.previousTotalCreditCases)}
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Credit Cases</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {formatNumber(dashboardData?.totalCreditCases ?? 0)}
            </p>
            <p className="text-slate-400 text-sm">
              Legal: {formatNumber(dashboardData?.totalLegalCases ?? 0)}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
              <FaUsers className="text-xl text-white" />
            </div>
            <div className="text-right">
              {getTrendIcon(dashboardData?.activeUsers, dashboardData?.previousActiveUsers)}
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Active Users</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {formatNumber(dashboardData?.activeUsers ?? 0)}
            </p>
            <p className="text-slate-400 text-sm">
              Total: {formatNumber(dashboardData?.totalUsers ?? 0)}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
              <FaMoneyBillWave className="text-xl text-white" />
            </div>
            <div className="text-right">
              {getTrendIcon(dashboardData?.totalRevenue, dashboardData?.previousTotalRevenue)}
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {formatCurrency(dashboardData?.totalRevenue ?? 0)}
            </p>
            <p className="text-slate-400 text-sm">
              This period
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
              <FaExclamationTriangle className="text-xl text-white" />
            </div>
            <div className="text-right">
              {getTrendIcon(dashboardData?.escalationRevenue, dashboardData?.previousEscalationRevenue)}
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Escalation Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {formatCurrency(dashboardData?.escalationRevenue ?? 0)}
            </p>
            <p className="text-slate-400 text-sm">
              Additional fees
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl">
                             <FaArrowUp className="text-xl text-white" />
            </div>
            <div className="text-right">
              {getTrendIcon(dashboardData?.escalationRate, dashboardData?.previousEscalationRate)}
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Escalation Rate</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {formatPercentage(dashboardData?.escalationRate ?? 0)}
            </p>
            <p className="text-slate-400 text-sm">
              Case escalation
            </p>
          </div>
        </div>
      </div>

      {/* Data Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Case Statistics */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaChartPie className="text-blue-400" />
                Case Statistics
              </h3>
              <div className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                <span className="text-blue-400 text-sm font-medium">Status Distribution</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {caseStatistics?.creditCases?.byStatus?.length > 0 ? (
              <div className="h-80">
                <Pie
                  data={{
                    labels: caseStatistics.creditCases.byStatus.map((s) => s._id) || [],
                    datasets: [
                      {
                        data: caseStatistics.creditCases.byStatus.map((s) => s.count) || [],
                        backgroundColor: [
                          "#3b82f6", // blue
                          "#10b981", // green
                          "#f59e0b", // yellow
                          "#ef4444", // red
                          "#8b5cf6", // purple
                          "#06b6d4", // cyan
                        ],
                        borderColor: "#1e293b",
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { 
                          color: "#cbd5e1", 
                          font: { size: 12 },
                          padding: 20,
                          usePointStyle: true,
                        },
                      },
                      tooltip: {
                        backgroundColor: "#1e293b",
                        titleColor: "#f1f5f9",
                        bodyColor: "#cbd5e1",
                        borderColor: "#475569",
                        borderWidth: 1,
                        cornerRadius: 8,
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <FaChartPie className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No case data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaChartLine className="text-green-400" />
                Monthly Revenue
              </h3>
              <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                <span className="text-green-400 text-sm font-medium">Revenue Trends</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {revenueAnalytics?.monthlyRevenue?.filingFees?.length > 0 ? (
              <div className="h-80">
                <Bar
                  data={{
                    labels: revenueAnalytics.monthlyRevenue.filingFees.map(
                      (item) => `${item._id.month}/${item._id.year}`
                    ) || [],
                    datasets: [
                      {
                        label: "Filing Fees",
                        data: revenueAnalytics.monthlyRevenue.filingFees.map(
                          (item) => item.totalFilingFees
                        ) || [],
                        backgroundColor: "#3b82f6",
                        borderRadius: 6,
                        borderColor: "#1d4ed8",
                        borderWidth: 1,
                      },
                      {
                        label: "Escalation Fees",
                        data: revenueAnalytics.monthlyRevenue.escalationFees.map(
                          (item) => item.totalEscalationFees
                        ) || [],
                        backgroundColor: "#f59e0b",
                        borderRadius: 6,
                        borderColor: "#d97706",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { 
                          color: "#cbd5e1", 
                          font: { size: 12 },
                          padding: 20,
                          usePointStyle: true,
                        },
                      },
                      tooltip: {
                        backgroundColor: "#1e293b",
                        titleColor: "#f1f5f9",
                        bodyColor: "#cbd5e1",
                        borderColor: "#475569",
                        borderWidth: 1,
                        cornerRadius: 8,
                      },
                    },
                    scales: {
                      x: {
                        grid: { color: "#334155" },
                        ticks: { color: "#cbd5e1" },
                      },
                      y: {
                        grid: { color: "#334155" },
                        ticks: { 
                          color: "#cbd5e1",
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <FaChartLine className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FaLightbulb className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Quick Insights</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Avg Case Resolution</span>
              <span className="text-white font-medium">15 days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Success Rate</span>
              <span className="text-green-400 font-medium">87%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Client Satisfaction</span>
              <span className="text-yellow-400 font-medium">4.2/5</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500/20 p-2 rounded-lg">
                             <FaArrowUp className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Performance</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">This Month</span>
              <span className="text-white font-medium">+12%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Month</span>
              <span className="text-white font-medium">+8%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Quarter</span>
              <span className="text-white font-medium">+23%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <FaRocket className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Goals</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Monthly Target</span>
              <span className="text-white font-medium">85%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Current Progress</span>
              <span className="text-green-400 font-medium">92%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Status</span>
              <span className="text-green-400 font-medium">On Track</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderAdminCasesTab = () => (
    <div className="space-y-6">
      {loadingReports ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading admin cases data...</p>
        </div>
      ) : adminOwnCases ? (
        <>
          {/* Admin's Own Cases Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                  <FaFileContract className="text-xl text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">My Credit Cases</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {formatNumber(adminOwnCases.overview?.totalCreditCases || 0)}
                </p>
                <p className="text-slate-400 text-sm">
                  This Month: {formatNumber(adminOwnCases.overview?.monthlyCreditCases || 0)}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                  <FaGavel className="text-xl text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">My Legal Cases</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {formatNumber(adminOwnCases.overview?.totalLegalCases || 0)}
                </p>
                <p className="text-slate-400 text-sm">
                  This Month: {formatNumber(adminOwnCases.overview?.monthlyLegalCases || 0)}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
                  <FaChartBar className="text-xl text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Credit Resolution</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {formatPercentage(adminOwnCases.overview?.creditResolutionRate || 0)}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
                  <FaArrowUp className="text-xl text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Legal Resolution</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {formatPercentage(adminOwnCases.overview?.legalResolutionRate || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Cases Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaChartPie className="text-blue-400" />
                  My Credit Cases by Status
                </h3>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: adminOwnCases.creditCases?.map((c) => c._id) || [],
                      datasets: [
                        {
                          data: adminOwnCases.creditCases?.map((c) => c.count) || [],
                          backgroundColor: [
                            "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"
                          ],
                          borderColor: "#1e293b",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: "bottom",
                          labels: { color: "#cbd5e1", font: { size: 12 } }
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaChartPie className="text-green-400" />
                  My Legal Cases by Status
                </h3>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: adminOwnCases.legalCases?.map((c) => c._id) || [],
                      datasets: [
                        {
                          data: adminOwnCases.legalCases?.map((c) => c.count) || [],
                          backgroundColor: [
                            "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"
                          ],
                          borderColor: "#1e293b",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: "bottom",
                          labels: { color: "#cbd5e1", font: { size: 12 } }
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <FaFileContract className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No admin cases data available</p>
        </div>
      )}
    </div>
  );

  const renderLegalPerformanceTab = () => (
    <div className="space-y-6">
      {loadingReports ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading legal performance data...</p>
        </div>
      ) : legalPerformance ? (
        <div className="text-center py-12">
          <FaGavel className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Legal performance data will be displayed here</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <FaGavel className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No legal performance data available</p>
        </div>
      )}
    </div>
  );

  const renderDebtCollectionTab = () => (
    <div className="space-y-6">
      {loadingReports ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading debt collection data...</p>
        </div>
      ) : debtCollectionPerformance ? (
        <div className="text-center py-12">
          <FaMoneyBillWave className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Debt collection data will be displayed here</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <FaMoneyBillWave className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No debt collection data available</p>
        </div>
      )}
    </div>
  );

  const renderEnhancedRevenueTab = () => (
    <div className="space-y-6">
      {loadingReports ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading revenue analytics data...</p>
        </div>
      ) : enhancedRevenue ? (
        <div className="text-center py-12">
          <FaChartLine className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Revenue analytics data will be displayed here</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <FaChartLine className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No revenue analytics data available</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "admin-cases":
        return renderAdminCasesTab();
      case "legal-performance":
        return renderLegalPerformanceTab();
      case "debt-collection":
        return renderDebtCollectionTab();
      case "enhanced-revenue":
        return renderEnhancedRevenueTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                <FaChartBar className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                  📊 Reports & Analytics
                </h1>
                <p className="text-slate-300 text-lg">
                  View detailed reports and analytics for your law firm
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <FaFileContract className="text-blue-400" />
                {dashboardData?.totalCreditCases || 0} Total Cases
              </span>
              <span className="flex items-center gap-2">
                <FaUsers className="text-green-400" />
                {dashboardData?.activeUsers || 0} Active Users
              </span>
              <span className="flex items-center gap-2">
                <FaMoneyBillWave className="text-yellow-400" />
                {formatCurrency(dashboardData?.totalRevenue || 0)} Revenue
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
            >
                              <FaSyncAlt className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Export Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleDownload("pdf")}
                disabled={downloading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
              >
                <FaFilePdf className="w-5 h-5" />
                {downloading ? "Downloading..." : "PDF"}
              </button>
              <button
                onClick={() => handleDownload("excel")}
                disabled={downloading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-800 disabled:to-green-900 disabled:cursor-notowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
              >
                <FaFileExcel className="w-5 h-5" />
                {downloading ? "Downloading..." : "Excel"}
              </button>
            </div>

            {/* Period Selection */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4" />
                Period:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-700/80 text-white border border-slate-600/50 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="mt-6 pt-6 border-t border-slate-600/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-slate-700/80 hover:bg-slate-600/80 text-white px-4 py-2 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50 flex items-center gap-2"
                >
                  <FaFilter className="w-4 h-4" />
                  {showFilters ? "Hide" : "Show"} Filters
                </button>
                {showFilters && (
                  <button
                    onClick={clearFilters}
                    className="bg-slate-600/80 hover:bg-slate-500/80 text-white px-4 py-2 rounded-xl transition-all duration-200 border border-slate-500/50 hover:border-slate-400/50 flex items-center gap-2"
                  >
                    <FaTimes className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative w-full lg:w-80">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={filters.department}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  >
                    <option value="">All Departments</option>
                    <option value="credit">Credit Collection</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Case Type
                  </label>
                  <select
                    name="caseType"
                    value={filters.caseType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  >
                    <option value="">All Types</option>
                    <option value="credit">Credit</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 text-red-300 p-4 rounded-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-red-400" />
            <span>Error: {error}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center gap-3 px-4 sm:px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <div className="text-center sm:text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-80 hidden sm:block">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
