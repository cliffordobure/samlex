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
  const [activeTab, setActiveTab] = useState("overview");
  const [legalPerformance, setLegalPerformance] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

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
    }

    // Load statistics
    dispatch(getLegalCaseStatistics({ period: selectedPeriod }));
  }, [dispatch, user, selectedPeriod]);

  // Load enhanced reports when tab changes
  useEffect(() => {
    if (user?.lawFirm?._id && activeTab !== "overview") {
      loadEnhancedReports();
    }
  }, [activeTab, selectedPeriod, user?.lawFirm?._id]);

  // Generate AI insights when cases are loaded
  useEffect(() => {
    if (cases && cases.length > 0 && activeTab === "ai-insights") {
      generateAiInsights();
    }
  }, [cases, selectedPeriod, activeTab]);

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
      const legalData = {
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

      const response = await aiApi.getLegalInsights(legalData);
      if (response.data.success) {
        setAiInsights(response.data.data);
      } else {
        setAiInsights(generateFallbackLegalInsights(legalData));
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast.error("Failed to generate AI insights");
             setAiInsights(generateFallbackLegalInsights({
         cases: cases || [],
         userRole: user?.role,
         statistics: { totalCases: cases?.length || 0 }
       }));
    } finally {
      setAiLoading(false);
    }
  };

  const calculateCaseTypeDistribution = () => {
    if (!cases || cases.length === 0) return {};
    const distribution = {};
    cases.forEach(case_ => {
      distribution[case_.caseType] = (distribution[case_.caseType] || 0) + 1;
    });
    return distribution;
  };

  const calculateStatusDistribution = () => {
    if (!cases || cases.length === 0) return {};
    const distribution = {};
    cases.forEach(case_ => {
      distribution[case_.status] = (distribution[case_.status] || 0) + 1;
    });
    return distribution;
  };

  const generateFallbackLegalInsights = (data) => {
    const totalCases = data.statistics.totalCases;
    const resolvedCases = data.statistics.resolvedCases;
    const resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

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
  };

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
      if (user?.role === "advocate" || user?.role === "legal_head" || user?.role === "law_firm_admin" || user?.role === "admin") {
        let response;
        
        if (format === "pdf") {
          // Use the specialized legal performance report
          response = await reportsApi.downloadSpecializedReport(user.lawFirm._id, "legal-performance");
        } else {
          // Use existing Excel download
          response = await reportsApi.downloadExcel(
            user.lawFirm._id,
            "legal-performance"
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
    const totalCases = cases?.length || 0;
    const resolvedCases = cases?.filter(c => c.status === "resolved" || c.status === "closed").length || 0;
    const activeCases = totalCases - resolvedCases;
    const resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;
    const totalFilingFees = cases?.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0) || 0;
    const avgFilingFee = totalCases > 0 ? totalFilingFees / totalCases : 0;

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
              <p className="text-slate-400 text-sm font-medium mb-1">Total Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {formatNumber(totalCases)}
              </p>
              <p className="text-slate-400 text-sm">
                Active: {formatNumber(activeCases)}
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
              <p className="text-slate-400 text-sm font-medium mb-1">Resolved Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {formatNumber(resolvedCases)}
              </p>
              <p className="text-slate-400 text-sm">
                Rate: {formatPercentage(resolutionRate)}
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
              <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {formatCurrency(totalFilingFees)}
              </p>
              <p className="text-slate-400 text-sm">
                Avg: {formatCurrency(avgFilingFee)}
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
              <p className="text-slate-400 text-sm font-medium mb-1">Resolution Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {formatPercentage(resolutionRate)}
              </p>
              <p className="text-slate-400 text-sm">
                Performance metric
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
              {cases && cases.length > 0 ? (
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
              {cases && cases.length > 0 ? (
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
                  <h4 className="text-lg font-semibold text-white">Total Cases</h4>
                  <p className="text-2xl font-bold text-blue-400">{legalPerformance.totalCases || 0}</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                  <FaCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="text-lg font-semibold text-white">Resolution Rate</h4>
                  <p className="text-2xl font-bold text-green-400">{formatPercentage(legalPerformance.resolutionRate || 0)}</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                  <FaMoneyBillWave className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <h4 className="text-lg font-semibold text-white">Total Revenue</h4>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(legalPerformance.totalFilingFees || 0)}</p>
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
    const totalFilingFees = cases?.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0) || 0;
    const paidFilingFees = cases?.reduce((sum, c) => sum + (c.filingFee?.paid ? (c.filingFee?.amount || 0) : 0), 0) || 0;
    const pendingFilingFees = totalFilingFees - paidFilingFees;
    const avgFilingFee = cases?.length > 0 ? totalFilingFees / cases.length : 0;

    // Calculate monthly revenue trends
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
        
        const monthRevenue = cases
          .filter(c => {
            const caseDate = new Date(c.createdAt);
            return caseDate >= monthStart && caseDate <= monthEnd;
          })
          .reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0);
        
        revenueData.push(monthRevenue);
      }
      
      return {
        labels: months,
        datasets: [
          {
            label: 'Monthly Revenue',
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

    // Prepare payment status chart data
    const paymentStatusData = {
      labels: ['Paid', 'Pending'],
      datasets: [
        {
          data: [paidFilingFees, pendingFilingFees],
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
            <h3 className="text-lg font-semibold text-white mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-yellow-400">{formatCurrency(totalFilingFees)}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FaCheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Paid Revenue</h3>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(paidFilingFees)}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FaClock className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Pending Revenue</h3>
            <p className="text-3xl font-bold text-orange-400">{formatCurrency(pendingFilingFees)}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FaPercent className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Average Fee</h3>
            <p className="text-3xl font-bold text-purple-400">{formatCurrency(avgFilingFee)}</p>
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
              {totalFilingFees > 0 ? (
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

        {/* Financial Summary */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
          <div className="p-6 border-b border-slate-600/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaMoneyBillWave className="text-yellow-400" />
              Financial Summary
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <h4 className="text-lg font-semibold text-white mb-2">Payment Rate</h4>
                <p className="text-2xl font-bold text-green-400">
                  {totalFilingFees > 0 ? formatPercentage(paidFilingFees / totalFilingFees) : "0%"}
                </p>
                <p className="text-slate-400 text-sm">of total revenue collected</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <h4 className="text-lg font-semibold text-white mb-2">Collection Efficiency</h4>
                <p className="text-2xl font-bold text-blue-400">
                  {cases?.length > 0 ? Math.round((paidFilingFees / totalFilingFees) * 100) : 0}%
                </p>
                <p className="text-slate-400 text-sm">payment collection rate</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <h4 className="text-lg font-semibold text-white mb-2">Outstanding Amount</h4>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(pendingFilingFees)}</p>
                <p className="text-slate-400 text-sm">awaiting collection</p>
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
            Legal Reports & Analytics
          </h1>
          <p className="text-slate-300 text-lg">
            Comprehensive insights and performance metrics for legal operations
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
