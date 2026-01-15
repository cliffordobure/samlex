import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import { getLegalCaseStatistics } from "../../store/slices/legalCaseSlice";
import reportsApi from "../../store/api/reportsApi";
import aiApi from "../../store/api/aiApi";
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
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaDownload,
  FaCalendar,
  FaUsers,
  FaFileAlt,
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaBriefcase,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaFilter,
  FaBrain,
  FaLightbulb,
  FaRocket,
  FaShieldAlt,
  FaHandshake,
  FaArrowUp,
  FaArrowDown,
  FaSyncAlt,
  FaFilePdf,
  FaFileExcel,
  FaEye,
  FaCog,
  FaMoneyBillWave,
  FaUserTie,
  FaCalendarCheck,
  FaPercent,
  FaCalendarAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

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

// Set default chart colors for dark theme
ChartJS.defaults.color = '#cbd5e1';
ChartJS.defaults.borderColor = '#475569';
ChartJS.defaults.backgroundColor = '#1e293b';

const LegalReports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases, isLoading } = useSelector((state) => {
    console.log("=== DEBUG: useSelector ===");
    console.log("Redux state:", state);
    console.log("Legal cases state:", state.legalCases);
    console.log("Cases from state:", state.legalCases?.cases);
    console.log("Cases length:", state.legalCases?.cases?.length);
    console.log("Is loading:", state.legalCases?.isLoading);
    
    return {
      cases: state.legalCases?.cases || [],
      isLoading: state.legalCases?.isLoading || false
    };
  });

  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedReportType, setSelectedReportType] = useState("debt-collection");
  const [activeTab, setActiveTab] = useState("overview");
  const [legalPerformance, setLegalPerformance] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Debt collector specific state
  const [debtCollectorStats, setDebtCollectorStats] = useState(null);
  const [creditCollectionData, setCreditCollectionData] = useState(null);

  // Enhanced periods with better labels
  const periods = [
    { value: "7", label: "Last 7 days", icon: FaCalendarAlt },
    { value: "30", label: "Last 30 days", icon: FaCalendarAlt },
    { value: "90", label: "Last 90 days", icon: FaCalendarAlt },
    { value: "365", label: "Last year", icon: FaCalendarAlt },
  ];

  const tabs = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: FaChartBar,
      description: "Key performance indicators and summary statistics",
      color: "from-blue-500 to-blue-600"
    },
    { 
      id: "performance", 
      label: "Performance Analytics", 
      icon: FaChartLine,
      description: "Detailed performance metrics and trends",
      color: "from-green-500 to-green-600"
    },
    { 
      id: "cases", 
      label: "Case Analysis", 
      icon: FaFileAlt,
      description: "Case distribution and status analysis",
      color: "from-purple-500 to-purple-600"
    },
    { 
      id: "financial", 
      label: "Financial Reports", 
      icon: FaMoneyBillWave,
      description: "Revenue and filing fee analysis",
      color: "from-yellow-500 to-yellow-600"
    },
    { 
      id: "ai-insights", 
      label: "AI Insights", 
      icon: FaBrain,
      description: "AI-powered analysis and recommendations",
      color: "from-indigo-500 to-indigo-600"
    },
  ];

  useEffect(() => {
    console.log("=== DEBUG: Reports useEffect ===");
    console.log("User:", user);
    console.log("User role:", user?.role);
    console.log("User lawFirm:", user?.lawFirm?._id);
    console.log("User ID:", user?._id);
    
    if (!user) return;

    // Load cases based on user role
    if (user.role === "legal_head") {
      console.log("Loading cases for legal head - lawFirm:", user.lawFirm._id);
      dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
    } else if (user.role === "advocate") {
      console.log("Loading cases for advocate - assignedTo:", user._id);
      dispatch(getLegalCases({ assignedTo: user._id }));
    } else if (user.role === "debt_collector") {
      console.log("Loading debt collector data for user:", user._id);
      // For debt collectors, we'll load credit collection data instead of legal cases
      loadDebtCollectorData();
    }

    // Load statistics for legal users only
    if (user.role !== "debt_collector") {
      dispatch(getLegalCaseStatistics({ period: selectedPeriod }));
    }
  }, [dispatch, user, selectedPeriod]);

  // Load enhanced reports when tab changes
  useEffect(() => {
    if (user?.lawFirm?._id && activeTab !== "overview") {
      if (user.role === "debt_collector") {
        loadDebtCollectorData();
      } else {
        loadEnhancedReports();
      }
    }
  }, [activeTab, selectedPeriod, user?.lawFirm?._id]);

  // Generate AI insights when cases are loaded
  useEffect(() => {
    if (user?.role === "debt_collector") {
      // For debt collectors, use credit collection data for AI insights
      if (debtCollectorStats && activeTab === "ai-insights") {
        generateAiInsights();
      }
    } else {
      // For legal users, use legal cases for AI insights
      if (cases && cases.length > 0 && activeTab === "ai-insights") {
        generateAiInsights();
      }
    }
  }, [cases, debtCollectorStats, selectedPeriod, activeTab, user?.role]);

  const loadDebtCollectorData = async () => {
    setLoadingReports(true);
    try {
      console.log("🔍 Loading debt collector data for user:", user._id);
      
      // Fetch debt collector specific stats
      const collectorRes = await reportsApi.getDebtCollectorStatsById(user._id, { period: selectedPeriod });
      console.log("📊 Debt collector stats response:", collectorRes);
      
      if (collectorRes.data.success) {
        setDebtCollectorStats(collectorRes.data.data);
        console.log("✅ Set debt collector stats:", collectorRes.data.data);
        console.log("🔍 DEBUG: Full API response structure:", JSON.stringify(collectorRes.data.data, null, 2));
      } else {
        console.error("❌ Failed to fetch debt collector stats:", collectorRes.data);
      }

      // Fetch enhanced credit collection performance data
      const performanceRes = await reportsApi.getEnhancedCreditCollectionPerformance(
        user.lawFirm._id,
        { period: selectedPeriod }
      );
      
      if (performanceRes.data.success) {
        setCreditCollectionData(performanceRes.data.data);
        console.log("✅ Set credit collection data:", performanceRes.data.data);
        console.log("🔍 DEBUG: Full performance API response structure:", JSON.stringify(performanceRes.data.data, null, 2));
      } else {
        console.error("❌ Failed to fetch credit collection performance:", performanceRes.data);
      }

    } catch (error) {
      console.error("Error loading debt collector data:", error);
      toast.error("Failed to load debt collector data");
    } finally {
      setLoadingReports(false);
    }
  };

  const loadEnhancedReports = async () => {
    setLoadingReports(true);
    try {
      const params = { period: selectedPeriod };

      switch (activeTab) {
        case "performance": {
          // Only try to load performance data if user has permission
          if (user?.role === "advocate" || user?.role === "legal_head" || user?.role === "law_firm_admin" || user?.role === "admin") {
            const legalPerfRes = await reportsApi.getLegalPerformance(
              user.lawFirm._id,
              params
            );
            if (legalPerfRes.data.success) {
              setLegalPerformance(legalPerfRes.data.data);
            }
          }
          break;
        }
        case "cases": {
          // Case analysis data is already available from Redux
          break;
        }
        case "financial": {
          // Financial data will be calculated from cases
          break;
        }
      }
    } catch (error) {
      console.error("Error loading enhanced reports:", error);
      // Don't show error toast for 403 - it's expected for some users
      if (error.response?.status !== 403) {
        toast.error("Failed to load report data");
      }
    } finally {
      setLoadingReports(false);
    }
  };

  const generateAiInsights = async () => {
    setAiLoading(true);
    try {
      let dataToAnalyze;
      
      if (user?.role === "debt_collector") {
        // Use debt collector data for AI insights - properly access nested structure
        const basicStats = debtCollectorStats?.basicStats;
        const financialStats = debtCollectorStats?.financialStats;
        const overview = creditCollectionData?.overview;
        
        dataToAnalyze = {
          cases: debtCollectorStats?.assignedCases || creditCollectionData?.assignedCases || [],
          userRole: user?.role,
          period: selectedPeriod,
          statistics: {
            totalCases: basicStats?.totalCases || overview?.totalCases || 0,
            resolvedCases: basicStats?.resolvedCases || overview?.resolvedCases || 0,
            activeCases: (basicStats?.totalCases || overview?.totalCases || 0) - (basicStats?.resolvedCases || overview?.resolvedCases || 0),
            collectionRate: basicStats?.successRate || overview?.successRate || 0,
            totalAmountCollected: financialStats?.collectedAmount || overview?.totalDebtAmount || 0,
            outstandingAmount: financialStats?.pendingAmount || (overview?.totalDebtAmount || 0) - (financialStats?.collectedAmount || 0),
          },
        };
      } else {
        // Use legal case data for AI insights
        dataToAnalyze = {
          cases: cases || [],
          userRole: user?.role,
          period: selectedPeriod,
          statistics: {
            totalCases: cases?.length || 0,
            resolvedCases: cases?.filter(c => c.status === "resolved" || c.status === "closed").length || 0,
            activeCases: cases?.filter(c => c.status !== "resolved" && c.status !== "closed").length || 0,
            caseTypes: calculateCaseTypeDistribution(),
            statusDistribution: calculateStatusDistribution(),
          },
        };
      }

      const response = await aiApi.getLegalInsights(dataToAnalyze);
      if (response.data.success) {
        setAiInsights(response.data.data);
      } else {
        setAiInsights(generateFallbackLegalInsights(dataToAnalyze));
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast.error("Failed to generate AI insights");
      
      // Generate fallback insights based on user role
      const fallbackData = user?.role === "debt_collector" 
        ? {
            cases: debtCollectorStats?.assignedCases || creditCollectionData?.assignedCases || [],
            userRole: user?.role,
            statistics: { 
              totalCases: debtCollectorStats?.basicStats?.totalCases || creditCollectionData?.totalCreditCases || 0,
              collectionRate: debtCollectorStats?.basicStats?.successRate || creditCollectionData?.collectionRate || 0,
              totalAmountCollected: debtCollectorStats?.financialStats?.collectedAmount || creditCollectionData?.totalAmountCollected || 0,
              outstandingAmount: debtCollectorStats?.financialStats?.pendingAmount || creditCollectionData?.outstandingAmount || 0
            }
          }
        : {
            cases: cases || [],
            userRole: user?.role,
            statistics: { totalCases: cases?.length || 0 }
          };
      
      setAiInsights(generateFallbackLegalInsights(fallbackData));
    } finally {
      setAiLoading(false);
    }
  };

  const calculateCaseTypeDistribution = () => {
    if (user?.role === "debt_collector") {
      // For debt collectors, use credit case type distribution
      const casesData = debtCollectorStats?.assignedCases || creditCollectionData?.assignedCases || [];
      if (casesData.length === 0) return {};
      const distribution = {};
      casesData.forEach(case_ => {
        distribution[case_.caseType] = (distribution[case_.caseType] || 0) + 1;
      });
      return distribution;
    } else {
      // For legal users, use legal case type distribution
      if (!cases || cases.length === 0) return {};
      const distribution = {};
      cases.forEach(case_ => {
        distribution[case_.caseType] = (distribution[case_.caseType] || 0) + 1;
      });
      return distribution;
    }
  };

  const calculateStatusDistribution = () => {
    if (user?.role === "debt_collector") {
      // For debt collectors, use credit case status distribution
      const casesData = debtCollectorStats?.assignedCases || creditCollectionData?.assignedCases || [];
      if (casesData.length === 0) return {};
      const distribution = {};
      casesData.forEach(case_ => {
        distribution[case_.status] = (distribution[case_.status] || 0) + 1;
      });
      return distribution;
    } else {
      // For legal users, use legal case status distribution
      if (!cases || cases.length === 0) return {};
      const distribution = {};
      cases.forEach(case_ => {
        distribution[case_.status] = (distribution[case_.status] || 0) + 1;
      });
      return distribution;
    }
  };

  const generateFallbackLegalInsights = (data) => {
    const totalCases = data.statistics.totalCases;
    const resolvedCases = data.statistics.resolvedCases;
    const resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

    if (data.userRole === "debt_collector") {
      const collectionRate = data.statistics.collectionRate || resolutionRate;
      const totalAmountCollected = data.statistics.totalAmountCollected || 0;
      const outstandingAmount = data.statistics.outstandingAmount || 0;

      return {
        summary: `You have ${totalCases} total cases with a ${collectionRate.toFixed(1)}% collection rate. You've collected ${formatCurrency(totalAmountCollected)} with ${formatCurrency(outstandingAmount)} outstanding.`,
        recommendations: [
          "Focus on high-value cases to maximize collection impact",
          "Follow up on overdue cases to improve collection rate",
          "Use different collection strategies for different case types"
        ],
        trends: "Collection performance shows steady progress with opportunities for improvement",
        performance: {
          score: Math.min(85, collectionRate + 20),
          level: collectionRate > 70 ? "Excellent" : collectionRate > 50 ? "Good" : "Needs Improvement"
        }
      };
    } else {
      return {
        summary: `You have ${totalCases} total cases with a ${resolutionRate.toFixed(1)}% resolution rate.`,
        recommendations: [
          "Focus on high-priority cases to improve resolution time",
          "Consider case load distribution for better efficiency",
          "Review case documentation for completeness"
        ],
        trends: "Case resolution rate is stable with room for improvement",
        performance: {
          score: Math.min(85, resolutionRate + 20),
          level: resolutionRate > 70 ? "Excellent" : resolutionRate > 50 ? "Good" : "Needs Improvement"
        }
      };
    }
  };

  const formatCurrency = (amount) => {
    return `Ksh ${new Intl.NumberFormat("en-KE").format(amount || 0)}`;
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
    if (!previousValue || previousValue === 0) return <FaSyncAlt className="w-4 h-4 text-slate-400" />;
    const change = ((value - previousValue) / previousValue) * 100;
    if (change > 0) return <FaArrowUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <FaArrowDown className="w-4 h-4 text-red-400" />;
    return <FaSyncAlt className="w-4 h-4 text-slate-400" />;
  };

  const handleDownloadReport = async (format = "pdf") => {
    setDownloading(true);
    try {
      // Only allow download for users with appropriate permissions
      const allowedRoles = ["advocate", "legal_head", "law_firm_admin", "admin", "debt_collector"];
      const hasPermission = allowedRoles.includes(user?.role);
      
      if (hasPermission) {
        let response;
        
        if (format === "pdf") {
          // Use the selected report type
          response = await reportsApi.downloadSpecializedReport(user.lawFirm._id, selectedReportType);
        } else {
          // Use existing Excel download
          response = await reportsApi.downloadExcel(
            user.lawFirm._id,
            selectedReportType
          );
        }
        
        if (format === "pdf") {
          // Handle HTML response for PDF (simple report)
          const blob = new Blob([response.data], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          
          // Open in new tab for printing
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            newWindow.onload = () => {
              newWindow.print();
            };
          } else {
            // Fallback: download as HTML file
            const a = document.createElement('a');
            a.href = url;
            a.download = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_Simple_Legal_Report.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          
          // Clean up after a delay
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        } else {
          // Handle Excel response
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_legal_report.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        
        toast.success(`${format.toUpperCase()} report downloaded successfully!`);
      } else {
        toast.error("You don't have permission to download reports");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      if (error.response?.status === 403) {
        toast.error("You don't have permission to download reports");
      } else {
        toast.error("Failed to download report");
      }
    } finally {
      setDownloading(false);
    }
  };

  const renderOverviewTab = () => {
    let totalCases, resolvedCases, activeCases, resolutionRate, totalFilingFees, avgFilingFee;
    
    if (user?.role === "debt_collector") {
      // Use debt collector data - properly access nested structure
      const basicStats = debtCollectorStats?.basicStats;
      const financialStats = debtCollectorStats?.financialStats;
      const overview = creditCollectionData?.overview;
      
      console.log("🔍 DEBUG: Debt collector data in renderOverviewTab:");
      console.log("debtCollectorStats:", debtCollectorStats);
      console.log("creditCollectionData:", creditCollectionData);
      console.log("basicStats:", basicStats);
      console.log("financialStats:", financialStats);
      console.log("overview:", overview);
      
      totalCases = basicStats?.totalCases || overview?.totalCases || 0;
      resolvedCases = basicStats?.resolvedCases || overview?.resolvedCases || 0;
      activeCases = totalCases - resolvedCases;
      resolutionRate = basicStats?.successRate || overview?.successRate || 0;
      totalFilingFees = financialStats?.collectedAmount || overview?.totalDebtAmount || 0;
      avgFilingFee = totalCases > 0 ? totalFilingFees / totalCases : 0;
      
      console.log("📊 Calculated values:");
      console.log("totalCases:", totalCases);
      console.log("resolvedCases:", resolvedCases);
      console.log("resolutionRate:", resolutionRate);
      console.log("totalFilingFees:", totalFilingFees);
    } else {
      // Use legal case data
      totalCases = cases?.length || 0;
      resolvedCases = cases?.filter(c => c.status === "resolved" || c.status === "closed").length || 0;
      activeCases = totalCases - resolvedCases;
      resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;
      totalFilingFees = cases?.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0) || 0;
      avgFilingFee = totalCases > 0 ? totalFilingFees / totalCases : 0;
    }

    return (
      <>
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                <FaFileAlt className="text-xl text-white" />
      </div>
              <div className="text-right">
                {getTrendIcon(totalCases, 0)}
              </div>
            </div>
        <div>
              <p className="text-slate-400 text-xs font-medium mb-1">
                {user?.role === "debt_collector" ? "Total Cases" : "Total Cases"}
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-white mb-2 break-words leading-tight">
                {formatNumber(totalCases)}
              </p>
              <p className="text-slate-400 text-xs">
                {user?.role === "debt_collector" ? "Active: " : "Active: "}{formatNumber(activeCases)}
          </p>
        </div>
      </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                <FaCheckCircle className="text-xl text-white" />
          </div>
              <div className="text-right">
                {getTrendIcon(resolvedCases, 0)}
        </div>
      </div>
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1">
                {user?.role === "debt_collector" ? "Collected Cases" : "Resolved Cases"}
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-white mb-2 break-words leading-tight">
                {formatNumber(resolvedCases)}
              </p>
              <p className="text-slate-400 text-xs">
                {user?.role === "debt_collector" ? "Collection Rate: " : "Rate: "}{formatPercentage(resolutionRate)}
              </p>
                  </div>
                </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl">
                <FaMoneyBillWave className="text-xl text-white" />
                  </div>
              <div className="text-right">
                {getTrendIcon(totalFilingFees, 0)}
                  </div>
                </div>
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1">
                {user?.role === "debt_collector" ? "Amount Collected" : "Total Revenue"}
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-white mb-2 break-words leading-tight">
                {formatCurrency(totalFilingFees)}
              </p>
              <p className="text-slate-400 text-xs">
                {user?.role === "debt_collector" ? "Avg per case: " : "Avg: "}{formatCurrency(avgFilingFee)}
              </p>
                  </div>
                  </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
                <FaPercent className="text-xl text-white" />
                </div>
              <div className="text-right">
                {getTrendIcon(resolutionRate, 0)}
                  </div>
                  </div>
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1">
                {user?.role === "debt_collector" ? "Collection Rate" : "Resolution Rate"}
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-white mb-2 break-words leading-tight">
                {formatPercentage(resolutionRate)}
              </p>
              <p className="text-slate-400 text-xs">
                {user?.role === "debt_collector" ? "Performance metric" : "Performance metric"}
              </p>
              </div>
            </div>
          </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Case Status Distribution */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaChartPie className="text-blue-400" />
                  Case Status Distribution
                </h3>
                      </div>
                        </div>
            <div className="p-6">
              {((user?.role === "debt_collector" && ((debtCollectorStats?.assignedCases && debtCollectorStats.assignedCases.length > 0) || (creditCollectionData?.assignedCases && creditCollectionData.assignedCases.length > 0))) || 
                (user?.role !== "debt_collector" && cases && cases.length > 0)) ? (
                <div className="h-80">
                  <Pie
                    data={{
                      labels: Object.keys(calculateStatusDistribution()),
                      datasets: [
                        {
                          data: Object.values(calculateStatusDistribution()),
                          backgroundColor: [
                            "#3b82f6", // blue
                            "#10b981", // green
                            "#f59e0b", // yellow
                            "#ef4444", // red
                            "#8b5cf6", // purple
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
                      elements: {
                        arc: {
                          borderColor: "#1e293b",
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

          {/* Case Type Distribution */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaChartBar className="text-green-400" />
                  Case Type Distribution
                </h3>
                    </div>
                      </div>
            <div className="p-6">
              {((user?.role === "debt_collector" && ((debtCollectorStats?.assignedCases && debtCollectorStats.assignedCases.length > 0) || (creditCollectionData?.assignedCases && creditCollectionData.assignedCases.length > 0))) || 
                (user?.role !== "debt_collector" && cases && cases.length > 0)) ? (
                <div className="h-80">
                  <Bar
                    data={{
                      labels: Object.keys(calculateCaseTypeDistribution()),
                      datasets: [
                        {
                          label: "Cases",
                          data: Object.values(calculateCaseTypeDistribution()),
                          backgroundColor: "rgba(59, 130, 246, 0.8)",
                          borderColor: "#3b82f6",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
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
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: "#475569",
                          },
                          ticks: {
                            color: "#cbd5e1",
                          },
                        },
                        x: {
                          grid: {
                            color: "#475569",
                          },
                          ticks: {
                            color: "#cbd5e1",
                          },
                        },
                      },
                      elements: {
                        bar: {
                          borderColor: "#1e293b",
                        },
                      },
                    }}
                  />
                      </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <FaChartBar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No case data available</p>
          </div>
        </div>
      )}
                        </div>
                          </div>
                        </div>
      </>
    );
  };

  const calculateMonthlyTrends = () => {
    console.log("=== DEBUG: calculateMonthlyTrends ===");
    console.log("Cases:", cases);
    console.log("Cases length:", cases?.length);
    console.log("Cases type:", typeof cases);
    
    if (!cases || cases.length === 0) {
      console.log("No cases available for trends calculation - using sample data");
      
      // Generate sample data for demonstration
      const now = new Date();
      const months = [];
      const caseCounts = [];
      const resolvedCounts = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthLabel);
        
        // Generate sample data (random but realistic)
        const created = Math.floor(Math.random() * 8) + 2; // 2-10 cases
        const resolved = Math.floor(created * (0.3 + Math.random() * 0.4)); // 30-70% resolution rate
        
        caseCounts.push(created);
        resolvedCounts.push(resolved);
      }
      
      return {
        labels: months,
        datasets: [
          {
            label: 'Cases Created (Sample)',
            data: caseCounts,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Cases Resolved (Sample)',
            data: resolvedCounts,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }
        ]
      };
    }
    
    const now = new Date();
    const months = [];
    const caseCounts = [];
    const resolvedCounts = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push(monthLabel);
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthCases = cases.filter(c => {
        const caseDate = new Date(c.createdAt);
        return caseDate >= monthStart && caseDate <= monthEnd;
      });
      
      const monthResolved = monthCases.filter(c => 
        c.status === 'resolved' || c.status === 'closed'
      );
      
      caseCounts.push(monthCases.length);
      resolvedCounts.push(monthResolved.length);
      
      console.log(`Month ${monthLabel}: ${monthCases.length} cases created, ${monthResolved.length} resolved`);
    }
    
    const result = {
      labels: months,
      datasets: [
        {
          label: 'Cases Created',
          data: caseCounts,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Cases Resolved',
          data: resolvedCounts,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }
      ]
    };
    
    console.log("Trends result:", result);
    return result;
  };

  const renderPerformanceTab = () => {
    if (loadingReports) {
      return (
        <div className="flex items-center justify-center py-12 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-300 mt-4 text-lg">Loading performance data...</p>
          </div>
        </div>
      );
    }

    const monthlyTrends = calculateMonthlyTrends();

    return (
      <div className="space-y-6">
        {/* Performance Metrics Cards */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaChartLine className="text-green-400" />
              Performance Metrics
            </h3>
          </div>
          <div className="p-6">
            {legalPerformance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                  <FaUserTie className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-medium mb-1">Total Cases</p>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-400 break-words leading-tight">{legalPerformance.totalCases || 0}</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                  <FaCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-medium mb-1">Resolution Rate</p>
                  <p className="text-[10px] sm:text-xs font-bold text-green-400 break-words leading-tight">{formatPercentage(legalPerformance.resolutionRate || 0)}</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                  <FaMoneyBillWave className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-medium mb-1">Total Revenue</p>
                  <p className="text-[10px] sm:text-xs font-bold text-yellow-400 break-words leading-tight">{formatCurrency(legalPerformance.totalFilingFees || 0)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaChartLine className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Performance data not available</p>
                <p className="text-slate-500 text-sm">
                  {user?.role === "advocate" 
                    ? "Your performance metrics will be displayed here once you have assigned cases."
                    : "Performance data will be available once cases are added to the system."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaChartLine className="text-blue-400" />
              Monthly Case Trends
            </h3>
            <p className="text-slate-400 text-sm mt-1">Track your case creation and resolution patterns over time</p>
          </div>
          <div className="p-6">
            <div className="h-80">
              <Line
                data={monthlyTrends}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
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
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: "#475569",
                      },
                      ticks: {
                        color: "#cbd5e1",
                      },
                    },
                    x: {
                      grid: {
                        color: "#475569",
                      },
                      ticks: {
                        color: "#cbd5e1",
                      },
                    },
                  },
                  elements: {
                    point: {
                      radius: 4,
                      hoverRadius: 6,
                    },
                  },
                }}
              />
            </div>
            
            {/* Show message if using sample data */}
            {(!cases || cases.length === 0) && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm text-center">
                  <FaExclamationTriangle className="inline w-4 h-4 mr-2" />
                  Showing sample data. Create cases to see real trends.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Case Resolution Timeline */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaClock className="text-purple-400" />
              Case Resolution Timeline
            </h3>
            <p className="text-slate-400 text-sm mt-1">Average time to resolve cases by status</p>
          </div>
          <div className="p-6">
            {cases && cases.length > 0 ? (
              <div className="space-y-4">
                {['assigned', 'under_review', 'court_proceedings', 'settlement', 'resolved'].map(status => {
                  const statusCases = cases.filter(c => c.status === status);
                  const avgDays = statusCases.length > 0 
                    ? statusCases.reduce((sum, c) => {
                        const created = new Date(c.createdAt);
                        const updated = new Date(c.updatedAt);
                        const daysDiff = Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
                        return sum + daysDiff;
                      }, 0) / statusCases.length
                    : 0;
                  
                  return (
                    <div key={status} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span className="text-white font-medium capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-sm">
                          ({statusCases.length} cases)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-400 font-bold">
                          {Math.round(avgDays)} days
                        </span>
                        <p className="text-slate-500 text-xs">avg. duration</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaClock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No case timeline data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCasesTab = () => {
    const caseTypes = calculateCaseTypeDistribution();
    const statusDistribution = calculateStatusDistribution();

    // Prepare data for charts
    const caseTypeChartData = {
      labels: Object.keys(caseTypes),
      datasets: [
        {
          data: Object.values(caseTypes),
          backgroundColor: [
            "#3b82f6", // blue
            "#10b981", // green
            "#f59e0b", // yellow
            "#ef4444", // red
            "#8b5cf6", // purple
            "#06b6d4", // cyan
            "#84cc16", // lime
            "#f97316", // orange
          ],
          borderColor: "#1e293b",
          borderWidth: 2,
        },
      ],
    };

    const statusChartData = {
      labels: Object.keys(statusDistribution),
      datasets: [
        {
          data: Object.values(statusDistribution),
          backgroundColor: [
            "#3b82f6", // blue - assigned
            "#10b981", // green - resolved
            "#f59e0b", // yellow - under_review
            "#ef4444", // red - court_proceedings
            "#8b5cf6", // purple - settlement
            "#06b6d4", // cyan - pending_assignment
            "#84cc16", // lime - filed
            "#f97316", // orange - closed
          ],
          borderColor: "#1e293b",
          borderWidth: 2,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Case Type Distribution Doughnut Chart */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaChartPie className="text-purple-400" />
                Case Type Distribution
              </h3>
              <p className="text-slate-400 text-sm mt-1">Distribution of cases by type</p>
            </div>
            <div className="p-6">
              {cases && cases.length > 0 ? (
                <div className="h-80">
                  <Doughnut
                    data={caseTypeChartData}
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
                      elements: {
                        arc: {
                          borderColor: "#1e293b",
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <FaChartPie className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No case type data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Case Status Distribution Doughnut Chart */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaChartPie className="text-blue-400" />
                Case Status Distribution
              </h3>
              <p className="text-slate-400 text-sm mt-1">Current status of all cases</p>
            </div>
            <div className="p-6">
              {cases && cases.length > 0 ? (
                <div className="h-80">
                  <Doughnut
                    data={statusChartData}
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
                      elements: {
                        arc: {
                          borderColor: "#1e293b",
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <FaChartPie className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No case status data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaFileAlt className="text-purple-400" />
                Case Types Breakdown
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(caseTypes).map(([type, count]) => {
                  const percentage = cases.length > 0 ? (count / cases.length) * 100 : 0;
                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        <span className="text-white font-medium capitalize">
                          {type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-purple-400 font-bold">{count}</span>
                        <p className="text-slate-500 text-xs">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaClock className="text-blue-400" />
                Case Status Breakdown
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(statusDistribution).map(([status, count]) => {
                  const percentage = cases.length > 0 ? (count / cases.length) * 100 : 0;
                  return (
                    <div key={status} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span className="text-white font-medium capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-400 font-bold">{count}</span>
                        <p className="text-slate-500 text-xs">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialTab = () => {
    // Get all cases with totalFee set (for payment tracking)
    const casesWithTotalFee = cases?.filter(c => c.totalFee && c.totalFee.amount > 0) || [];
    const casesWithPayments = cases?.filter(c => c.payments && c.payments.length > 0) || [];
    const allCasesForTable = cases || [];
    
    // Calculate total amount to be paid (from totalFee field) - only cases with totalFee set
    const totalAmountToBePaid = casesWithTotalFee.reduce((sum, c) => {
      const totalFee = c.totalFee?.amount || 0;
      return sum + totalFee;
    }, 0);
    
    // Calculate total amount collected from installments (all cases)
    const totalAmountCollected = cases?.reduce((sum, c) => {
      if (c.payments && c.payments.length > 0) {
        const casePayments = c.payments.reduce((paymentSum, p) => paymentSum + (p.amount || 0), 0);
        return sum + casePayments;
      }
      return sum;
    }, 0) || 0;
    
    // Calculate total amount pending (only for cases with totalFee)
    const totalAmountPending = totalAmountToBePaid - totalAmountCollected;
    
    // Legacy filing fee calculations (for backward compatibility)
    const totalFilingFees = cases?.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0) || 0;
    const paidFilingFees = cases?.reduce((sum, c) => sum + (c.filingFee?.paid ? (c.filingFee?.amount || 0) : 0), 0) || 0;
    const pendingFilingFees = totalFilingFees - paidFilingFees;
    const avgFilingFee = cases?.length > 0 ? totalFilingFees / cases.length : 0;
    
    // Calculate total number of payments
    const totalPaymentsCount = cases?.reduce((sum, c) => sum + (c.payments?.length || 0), 0) || 0;
    
    // Calculate average payment amount
    const avgPaymentAmount = totalPaymentsCount > 0 ? totalAmountCollected / totalPaymentsCount : 0;
    
    // Calculate payment completion rate (only for cases with totalFee)
    const paymentCompletionRate = totalAmountToBePaid > 0 ? (totalAmountCollected / totalAmountToBePaid) * 100 : 0;

    // Calculate monthly revenue trends from installment payments
    const calculateMonthlyRevenue = () => {
      if (!cases || cases.length === 0) return { labels: [], datasets: [] };
      
      const now = new Date();
      const months = [];
      const revenueData = [];
      
      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthLabel);
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Calculate revenue from payments made in this month
        const monthRevenue = cases.reduce((sum, c) => {
          if (c.payments && c.payments.length > 0) {
            const monthPayments = c.payments
              .filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= monthStart && paymentDate <= monthEnd;
              })
              .reduce((paymentSum, p) => paymentSum + (p.amount || 0), 0);
            return sum + monthPayments;
          }
          return sum;
        }, 0);
        
        revenueData.push(monthRevenue);
      }
      
      return {
        labels: months,
        datasets: [
          {
            label: 'Monthly Revenue (Installments)',
            data: revenueData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }
        ]
      };
    };

    // Prepare payment status chart data (using installment payments)
    const paymentStatusData = {
      labels: ['Collected', 'Pending'],
      datasets: [
        {
          data: [totalAmountCollected, totalAmountPending],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderColor: '#1e293b',
          borderWidth: 2,
        },
      ],
    };

    const monthlyRevenue = calculateMonthlyRevenue();

    return (
      <div className="space-y-6">
        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FaMoneyBillWave className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Total Amount to Pay</p>
            <p className="text-[10px] sm:text-xs font-bold text-yellow-400 break-words leading-tight">{formatCurrency(totalAmountToBePaid)}</p>
            <p className="text-slate-400 text-xs mt-1">From cases with total fee set</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FaCheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Amount Collected</p>
            <p className="text-[10px] sm:text-xs font-bold text-green-400 break-words leading-tight">{formatCurrency(totalAmountCollected)}</p>
            <p className="text-slate-400 text-xs mt-1">From installment payments</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FaClock className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Amount Pending</p>
            <p className="text-[10px] sm:text-xs font-bold text-orange-400 break-words leading-tight">{formatCurrency(totalAmountPending)}</p>
            <p className="text-slate-400 text-xs mt-1">Outstanding balance</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FaPercent className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Avg Payment</p>
            <p className="text-[10px] sm:text-xs font-bold text-purple-400 break-words leading-tight">{formatCurrency(avgPaymentAmount)}</p>
            <p className="text-slate-400 text-xs mt-1">Per installment</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Trends */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaChartLine className="text-yellow-400" />
                Monthly Revenue Trends
              </h3>
              <p className="text-slate-400 text-sm mt-1">Track revenue generation over time</p>
            </div>
            <div className="p-6">
              {cases && cases.length > 0 ? (
                <div className="h-80">
                  <Line
                    data={monthlyRevenue}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
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
                          callbacks: {
                            label: function(context) {
                              return `Revenue: ${formatCurrency(context.parsed.y)}`;
                            }
                          }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: "#475569",
                          },
                          ticks: {
                            color: "#cbd5e1",
                            callback: function(value) {
                              return formatCurrency(value);
                            }
                          },
                        },
                        x: {
                          grid: {
                            color: "#475569",
                          },
                          ticks: {
                            color: "#cbd5e1",
                          },
                        },
                      },
                      elements: {
                        point: {
                          radius: 4,
                          hoverRadius: 6,
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

          {/* Payment Status Distribution */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaChartPie className="text-green-400" />
                Payment Status Distribution
              </h3>
              <p className="text-slate-400 text-sm mt-1">Breakdown of paid vs pending revenue</p>
            </div>
            <div className="p-6">
              {totalAmountToBePaid > 0 || totalAmountCollected > 0 ? (
                <div className="h-80">
                  <Doughnut
                    data={paymentStatusData}
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
                          callbacks: {
                            label: function(context) {
                              const value = context.parsed;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        },
                      },
                      elements: {
                        arc: {
                          borderColor: "#1e293b",
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <FaChartPie className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No payment data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Tracking Section */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaMoneyBillWave className="text-green-400" />
              Payment Tracking & Installments
            </h3>
            <p className="text-slate-400 text-sm mt-1">Detailed breakdown of installment payments per case</p>
          </div>
          <div className="p-6">
            {/* Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium mb-1">Total Amount to Pay</p>
                <p className="text-[10px] sm:text-xs font-bold text-white break-words leading-tight">{formatCurrency(totalAmountToBePaid)}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium mb-1">Amount Collected</p>
                <p className="text-[10px] sm:text-xs font-bold text-green-400 break-words leading-tight">{formatCurrency(totalAmountCollected)}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium mb-1">Amount Pending</p>
                <p className="text-[10px] sm:text-xs font-bold text-orange-400 break-words leading-tight">{formatCurrency(totalAmountPending)}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium mb-1">Payment Progress</p>
                <p className="text-[10px] sm:text-xs font-bold text-blue-400 break-words leading-tight">{formatPercentage(paymentCompletionRate)}</p>
              </div>
            </div>

            {/* Detailed Payment Table - Show all cases */}
            {allCasesForTable.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white">Case Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white">Client</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-white">Total Fee</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-white">Collected</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-white">Pending</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-white">Payments</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-white">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCasesForTable.map((caseItem) => {
                      const totalFee = caseItem.totalFee?.amount || 0;
                      const collected = caseItem.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                      const pending = totalFee > 0 ? totalFee - collected : 0;
                      const progress = totalFee > 0 ? (collected / totalFee) * 100 : (collected > 0 ? 100 : 0);
                      const paymentCount = caseItem.payments?.length || 0;
                      
                      return (
                        <tr key={caseItem._id} className="border-b border-slate-600/30 hover:bg-slate-700/30">
                          <td className="py-3 px-4 text-sm text-white font-medium">
                            {caseItem.caseNumber || "N/A"}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-300">
                            {caseItem.client?.firstName || ''} {caseItem.client?.lastName || ''}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            {totalFee > 0 ? (
                              <span className="text-white">{formatCurrency(totalFee)}</span>
                            ) : (
                              <span className="text-slate-500 italic">Not set</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-green-400 text-right font-medium">
                            {formatCurrency(collected)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            {totalFee > 0 ? (
                              <span className="text-orange-400">{formatCurrency(pending)}</span>
                            ) : (
                              <span className="text-slate-500 italic">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-300 text-center">
                            {paymentCount > 0 ? (
                              <span>{paymentCount} {paymentCount === 1 ? 'payment' : 'payments'}</span>
                            ) : (
                              <span className="text-slate-500">No payments</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {totalFee > 0 ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-slate-300 w-12 text-right">
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaMoneyBillWave className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No cases available</p>
                <p className="text-slate-500 text-sm mt-2">Cases will appear here once created</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History by Case */}
        {casesWithPayments.length > 0 ? (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaCalendarCheck className="text-purple-400" />
                Payment History & Installments
              </h3>
              <p className="text-slate-400 text-sm mt-1">Detailed installment payment history for each case</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {casesWithPayments.map((caseItem) => {
                  const totalFee = caseItem.totalFee?.amount || 0;
                  const collected = caseItem.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                  const pending = totalFee - collected;
                  const sortedPayments = [...(caseItem.payments || [])].sort((a, b) => 
                    new Date(b.paymentDate) - new Date(a.paymentDate)
                  );
                  
                  return (
                    <div key={caseItem._id} className="bg-slate-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xs font-semibold text-white">
                            {caseItem.caseNumber || "N/A"}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {caseItem.client?.firstName} {caseItem.client?.lastName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Total Fee</p>
                          <p className="text-[10px] sm:text-xs font-bold text-white break-words leading-tight">{formatCurrency(totalFee)}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div>
                              <p className="text-xs text-green-400">Collected: {formatCurrency(collected)}</p>
                              <p className="text-xs text-orange-400">Pending: {formatCurrency(pending)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {sortedPayments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-slate-300 mb-2">Installment Payments:</p>
                          <div className="space-y-2">
                            {sortedPayments.map((payment, index) => (
                              <div key={payment._id || index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-green-400 font-bold text-xs">#{sortedPayments.length - index}</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-white break-words leading-tight">
                                      {formatCurrency(payment.amount)} {payment.currency || 'KES'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-400 capitalize">
                                    {payment.paymentMethod?.replace('_', ' ')}
                                  </p>
                                  {payment.recordedBy && (
                                    <p className="text-xs text-slate-500">
                                      by {payment.recordedBy.firstName} {payment.recordedBy.lastName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
            <div className="p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaCalendarCheck className="text-purple-400" />
                Payment History & Installments
              </h3>
              <p className="text-slate-400 text-sm mt-1">Detailed installment payment history for each case</p>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <FaCalendarCheck className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No payment history available</p>
                <p className="text-slate-500 text-sm mt-2">Payment installments will appear here once recorded</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaMoneyBillWave className="text-yellow-400" />
              Financial Summary
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-1">Payment Rate</p>
                <p className="text-[10px] sm:text-xs font-bold text-green-400 break-words leading-tight">
                  {formatPercentage(paymentCompletionRate)}
                </p>
                <p className="text-slate-400 text-xs">of total amount collected</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-1">Total Payments</p>
                <p className="text-[10px] sm:text-xs font-bold text-blue-400 break-words leading-tight">
                  {totalPaymentsCount}
                </p>
                <p className="text-slate-400 text-xs">installment payments</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-1">Avg Payment</p>
                <p className="text-[10px] sm:text-xs font-bold text-purple-400 break-words leading-tight">{formatCurrency(avgPaymentAmount)}</p>
                <p className="text-slate-400 text-xs">per installment</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-1">Outstanding Amount</p>
                <p className="text-[10px] sm:text-xs font-bold text-orange-400 break-words leading-tight">{formatCurrency(totalAmountPending)}</p>
                <p className="text-slate-400 text-xs">awaiting collection</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

    const renderAiInsightsTab = () => {
    if (aiLoading) {
      return (
        <div className="flex items-center justify-center py-12 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-300 mt-4 text-lg">Generating AI insights...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {aiInsights && (
          <>
            {/* AI Summary */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaBrain className="text-indigo-400" />
                  AI Analysis Summary
                    </h3>
                      </div>
              <div className="p-6">
                <p className="text-slate-300 text-lg leading-relaxed">{aiInsights.summary}</p>
                  </div>
                </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <FaLightbulb className="text-yellow-400" />
                      AI Recommendations
                    </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {aiInsights.recommendations?.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-xl">
                      <FaRocket className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                      <p className="text-slate-300">{rec}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

            {/* Performance Score */}
            {aiInsights.performance && (
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
                <div className="p-6 border-b border-slate-600/50">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FaShieldAlt className="text-green-400" />
                    Performance Assessment
                    </h3>
                        </div>
                <div className="p-6">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 relative">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#374151"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray={`${aiInsights.performance.score}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{aiInsights.performance.score}</span>
                    </div>
                  </div>
                    <h4 className="text-xl font-semibold text-white mb-2">{aiInsights.performance.level}</h4>
                    <p className="text-slate-400">Performance Score</p>
                </div>
                      </div>
                  </div>
            )}
            </>
          )}
        </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "performance":
        return renderPerformanceTab();
      case "cases":
        return renderCasesTab();
      case "financial":
        return renderFinancialTab();
      case "ai-insights":
        return renderAiInsightsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading reports...</p>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {user?.role === "debt_collector" ? "Debt Collection Reports & Analytics" : "Legal Reports & Analytics"}
          </h1>
          <p className="text-slate-300 text-lg">
            {user?.role === "debt_collector" 
              ? "Comprehensive insights and performance metrics for debt collection operations"
              : "Comprehensive insights and performance metrics for legal operations"
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value} className="bg-slate-700 text-slate-300">
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type Selector */}
          <div className="relative">
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
            >
              <option value="debt-collection" className="bg-slate-700 text-slate-300">Debt Collection</option>
              <option value="performance-metrics" className="bg-slate-700 text-slate-300">Performance Metrics</option>
              <option value="monthly-trends" className="bg-slate-700 text-slate-300">Monthly Trends</option>
              <option value="promised-payments" className="bg-slate-700 text-slate-300">Promised Payments</option>
              <option value="revenue-analytics" className="bg-slate-700 text-slate-300">Revenue Analytics</option>
            </select>
          </div>

          {/* Download Buttons */}
          <button
            onClick={() => handleDownloadReport("pdf")}
            disabled={downloading}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaFilePdf className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleDownloadReport("excel")}
            disabled={downloading}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaFileExcel className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl mb-6 md:mb-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default LegalReports;
