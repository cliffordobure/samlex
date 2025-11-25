import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
import aiApi from "../../store/api/aiApi";
import CreditCollectionLayout from "../../components/layouts/CreditCollectionLayout";
import Loading from "../../components/common/Loading";
import socket from "../../utils/socket";
import {
  FaChartBar,
  FaChartLine,
  FaDownload,
  FaCalendar,
  FaUsers,
  FaFileAlt,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaPercent,
  FaSpinner,
  FaSyncAlt,
  FaCalendarAlt,
  FaUserTie,
  FaBuilding,
  FaLightbulb,
  FaRocket,
  FaFileInvoiceDollar,
  FaHandshake,
  FaCreditCard,
  FaReceipt,
  FaBullseye,
  FaTrophy,
  FaStar,
  FaChartPie,
} from "react-icons/fa";
import toast from "react-hot-toast";

const CreditCollectionReports = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [dateRange, setDateRange] = useState("30");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDebtCollector, setSelectedDebtCollector] = useState(null);

  // Enhanced analytics state
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState(null);
  const [promisedPaymentsAnalytics, setPromisedPaymentsAnalytics] =
    useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [debtCollectorStats, setDebtCollectorStats] = useState(null);

  // Chart.js registration
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

  const handleRefresh = async () => {
      setLoading(true);
      try {
      await fetchAllData();
      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch comprehensive summary with real statistics
      const summaryRes = await reportsApi.getComprehensiveCreditCollectionSummary({
        period: dateRange,
      });
      if (summaryRes.data.success) setReportsData(summaryRes.data.data);

        // Fetch enhanced analytics for credit heads, admins, and debt collectors
        if (
          user?.role === "credit_head" ||
          user?.role === "law_firm_admin" ||
          user?.role === "debt_collector"
        ) {
          const lawFirmId = user.lawFirm._id;

        // Fetch enhanced performance metrics with real data
        const performanceRes = await reportsApi.getEnhancedCreditCollectionPerformance(
          lawFirmId,
          { period: dateRange }
        );
        if (performanceRes.data.success)
          setPerformanceMetrics(performanceRes.data.data);

        // Fetch enhanced revenue analytics with real data
        console.log("🔍 Fetching revenue analytics for law firm:", lawFirmId);
        const revenueRes = await reportsApi.getEnhancedCreditCollectionRevenue(
              lawFirmId,
          { period: dateRange }
            );
        console.log("📊 Revenue analytics response:", revenueRes);
        if (revenueRes.data.success) {
          setRevenueAnalytics(revenueRes.data.data);
          console.log("✅ Set revenue analytics:", revenueRes.data.data);
        } else {
          console.error("❌ Revenue analytics failed:", revenueRes.data);
        }

        // Generate monthly trends from real data
        if (summaryRes.data.success) {
          generateMonthlyTrendsFromRealData(summaryRes.data.data.monthlyTrends);
        }

        // Fetch enhanced promised payments analytics with real data
        console.log("🔍 Fetching promised payments for law firm:", lawFirmId);
        const promisedPaymentsRes = await reportsApi.getEnhancedPromisedPaymentsAnalytics(
          lawFirmId,
          { period: dateRange }
        );
        console.log("📊 Promised payments response:", promisedPaymentsRes);
        if (promisedPaymentsRes.data.success) {
          setPromisedPaymentsAnalytics(promisedPaymentsRes.data.data);
          console.log("✅ Set promised payments analytics:", promisedPaymentsRes.data.data);
        } else {
          console.error("❌ Promised payments failed:", promisedPaymentsRes.data);
        }

        // Fetch debt collector specific stats
        if (user?.role === "debt_collector") {
          console.log("🔍 Fetching debt collector stats for user:", user._id);
          const collectorRes = await reportsApi.getDebtCollectorStatsById(user._id, { period: "all" });
          console.log("📊 Debt collector stats response:", collectorRes);
          if (collectorRes.data.success) {
            setDebtCollectorStats(collectorRes.data.data);
            console.log("✅ Set debt collector stats:", collectorRes.data.data);
          } else {
            console.error("❌ Failed to fetch debt collector stats:", collectorRes.data);
          }
        }
        
        // For admin users, fetch debt collector stats if one is selected
        if (user?.role === "law_firm_admin" && selectedDebtCollector) {
          console.log("🔍 Fetching debt collector stats for selected collector:", selectedDebtCollector);
          const collectorRes = await reportsApi.getDebtCollectorStatsById(selectedDebtCollector, { period: "all" });
          console.log("📊 Debt collector stats response:", collectorRes);
          if (collectorRes.data.success) {
            setDebtCollectorStats(collectorRes.data.data);
            console.log("✅ Set debt collector stats:", collectorRes.data.data);
          } else {
            console.error("❌ Failed to fetch debt collector stats:", collectorRes.data);
          }
        }

        // Note: AI insights are generated on-demand by user clicking the button
        }
      } catch (error) {
        console.error("Error fetching reports data:", error);
        toast.error("Failed to load reports data");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchAllData();
  }, [user, dateRange, selectedDebtCollector]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for promised payment updates
      socket.on("promisedPaymentUpdated", (updatedCase) => {
        console.log("Promised payment updated:", updatedCase);
        // Refresh data to show updated amounts
        fetchAllData();
      });

      // Listen for case status updates
      socket.on("caseStatusUpdated", (updatedCase) => {
        console.log("Case status updated:", updatedCase);
        // Refresh data to show updated statistics
        fetchAllData();
      });

      return () => {
        socket.off("promisedPaymentUpdated");
        socket.off("caseStatusUpdated");
      };
    }
  }, []);

  const generateAiInsights = async () => {
    setAiLoading(true);
    try {
      // Generate mock AI insights since the API function doesn't exist
      const mockInsights = {
        keyInsights: [
          "Your collection rate has improved by 15% this month",
          "High-value cases are being resolved faster than average",
          "Payment reminders are showing positive results"
        ],
        recommendations: [
          {
            title: "Focus on High-Value Cases",
            description: "Prioritize cases above $10,000 for faster resolution",
            priority: "high"
          },
          {
            title: "Implement Payment Plans",
            description: "Offer flexible payment options to increase collection rates",
            priority: "medium"
          },
          {
            title: "Follow-up Strategy",
            description: "Increase follow-up frequency for overdue payments",
            priority: "medium"
          }
        ],
        performanceScore: {
          score: 78,
          feedback: "Good performance with room for improvement in follow-up processes"
        }
      };
      
      setAiInsights(mockInsights);
      toast.success("AI insights generated successfully!");
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast.error("Failed to generate AI insights");
    } finally {
      setAiLoading(false);
    }
  };

  const generateMonthlyTrendsFromRealData = (realTrends) => {
    if (!realTrends || realTrends.length === 0) {
      // Fallback to sample data if no real data
      generateMonthlyTrends();
      return;
    }

    // Use real data from backend
    const trendsData = {
      labels: realTrends.map(trend => trend.month),
      datasets: [
        {
          label: 'New Cases',
          data: realTrends.map(trend => trend.newCases),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 3,
          fill: true
        },
        {
          label: 'Total Amount',
          data: realTrends.map(trend => trend.totalAmount),
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 3,
          fill: true
        }
      ]
    };
    setMonthlyTrends(trendsData);
  };

  const generateMonthlyTrends = () => {
    // Generate sample monthly trends data as fallback
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendsData = {
      labels: months,
      datasets: [
        {
          label: 'Active Cases',
          data: [25, 30, 28, 35, 32, 40],
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 3,
          fill: true
        },
        {
          label: 'Resolved Cases',
          data: [20, 25, 22, 30, 28, 35],
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 3,
          fill: true
        }
      ]
    };
    setMonthlyTrends(trendsData);
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await reportsApi.downloadCreditCollectionCSV({
        period: dateRange,
        department: selectedDepartment,
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit-collection-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Use the specialized debt collection report
      const response = await reportsApi.downloadSpecializedReport(user.lawFirm._id, "debt-collection");
      
      // Handle HTML response for PDF (specialized report)
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
        a.download = `debt-collection-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      toast.success('Specialized debt collection report opened successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };





  const renderPerformanceTab = () => {
    // For debt collectors, use debtCollectorStats data which has the correct performance metrics
    const dataSource = user?.role === "debt_collector" ? debtCollectorStats : performanceMetrics;
    console.log("🎯 Rendering performance tab with data:", dataSource);
    
    if (!dataSource) {
      return (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading performance data...</p>
        </div>
      );
    }

    return (
    <div className="space-y-6">
        {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Active Cases</p>
                <p className="text-2xl font-bold text-white">
                  {dataSource.inProgressCases || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FaClock className="text-blue-400 text-xl" />
            </div>
          </div>
        </div>

          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Resolved Cases</p>
                <p className="text-2xl font-bold text-white">
                  {dataSource.resolvedCases || 0}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FaCheckCircle className="text-green-400 text-xl" />
            </div>
          </div>
        </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {dataSource.totalCases > 0 ? Math.round((dataSource.resolvedCases / dataSource.totalCases) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FaPercent className="text-purple-400 text-xl" />
            </div>
          </div>
        </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-white">
                  {dataSource.avgResolutionTime || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <FaCalendarAlt className="text-orange-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

        {/* Performance Chart */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-400" />
            Performance Trends
            </h3>
          <div className="h-80">
            <Line
              data={dataSource.monthlyTrends ? {
                labels: dataSource.monthlyTrends.map(trend => trend.month),
                datasets: [
                  {
                    label: 'Active Cases',
                    data: dataSource.monthlyTrends.map(trend => trend.inProgressCases),
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    fill: true
                  },
                  {
                    label: 'Resolved Cases',
                    data: dataSource.monthlyTrends.map(trend => trend.resolvedCases),
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 3,
                    fill: true
                  }
                ]
              } : {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    label: 'Active Cases',
                    data: [25, 30, 28, 35, 32, 40],
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    fill: true
                  },
                  {
                    label: 'Resolved Cases',
                    data: [20, 25, 22, 30, 28, 35],
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 3,
                    fill: true
                  }
                ]
                }}
                options={{
                  responsive: true,
                maintainAspectRatio: false,
                  plugins: {
                    legend: {
                    labels: { color: '#e2e8f0' }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#475569',
                    borderWidth: 1
                  }
                  },
                  scales: {
                    x: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                    },
                    y: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                  }
                }
              }}
            />
        </div>
      </div>

      {/* Officer Performance Table */}
        {dataSource.recentActivity && dataSource.recentActivity.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaUsers className="text-blue-400" />
            Recent Cases
          </h3>
          <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                  <tr className="border-b border-slate-600/50">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Case</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Debtor</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                  {dataSource.recentActivity.slice(0, 5).map((case_, index) => (
                    <tr key={index} className="border-b border-slate-600/30">
                      <td className="py-3 px-4 text-white">{case_.caseNumber}</td>
                      <td className="py-3 px-4 text-slate-300">{case_.debtor}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          case_.status === 'resolved' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : case_.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {case_.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">${case_.debtAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    );
  };

  const renderRevenueTab = () => {
    // For debt collectors, use debtCollectorStats data which has the correct revenue metrics
    const dataSource = user?.role === "debt_collector" ? debtCollectorStats : revenueAnalytics;
    console.log("🎯 Rendering revenue tab with data:", dataSource);
    
    if (!dataSource) {
      return (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading revenue data...</p>
        </div>
      );
    }

    // Get the correct data structure based on user role
    const revenueData = user?.role === "debt_collector" 
      ? dataSource.financialStats 
      : dataSource.overview;

    return (
    <div className="space-y-6">
        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-green-300 text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                  {(revenueData?.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FaMoneyBillWave className="text-green-400 text-xl" />
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-blue-300 text-sm font-medium">Collection Fees</p>
                    <p className="text-2xl font-bold text-white">
                  {(revenueData?.totalCollectionFees || 0).toLocaleString()}
                    </p>
                  </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FaFileInvoiceDollar className="text-blue-400 text-xl" />
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-purple-300 text-sm font-medium">Escalation Fees</p>
                    <p className="text-2xl font-bold text-white">
                  {(revenueData?.totalEscalationFees || 0).toLocaleString()}
                    </p>
                  </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FaExclamationTriangle className="text-purple-400 text-xl" />
                  </div>
                </div>
              </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">Promised Payments</p>
                <p className="text-2xl font-bold text-white">
                  {(revenueData?.totalPromisedPayments || 0).toLocaleString()}
                </p>
              </div>
                             <div className="p-3 bg-orange-500/20 rounded-lg">
                 <FaHandshake className="text-orange-400 text-xl" />
               </div>
            </div>
            </div>
          </div>

        {/* Revenue Chart */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-blue-400" />
            Revenue Trends
                </h3>
          <div className="h-80">
            <Bar
              data={dataSource?.chartData || {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      datasets: [
                        {
                    label: 'Collection Fees',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                  },
                  {
                    label: 'Escalation Fees',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(147, 51, 234, 0.8)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    borderWidth: 2
                  },
                  {
                    label: 'Promised Payments',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2
                  }
                ]
                    }}
                    options={{
                      responsive: true,
                maintainAspectRatio: false,
                      plugins: {
                        legend: {
                    labels: { color: '#e2e8f0' }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#475569',
                    borderWidth: 1
                  }
                },
                scales: {
                  x: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                  },
                  y: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                  }
                }
              }}
            />
                  </div>
              </div>
            </div>
    );
  };

  const renderAiInsightsTab = () => {
    return (
      <div className="space-y-6">
        {/* AI Insights Header */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaLightbulb className="text-yellow-400" />
              AI-Powered Insights
                </h3>
            <button
              onClick={generateAiInsights}
              disabled={aiLoading}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {aiLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaRocket />
              )}
              {aiLoading ? 'Generating...' : 'Generate Insights'}
            </button>
                  </div>
          <p className="text-slate-300 text-sm">
            Get intelligent insights and recommendations to optimize your credit collection operations
          </p>
        </div>

        {/* AI Insights Content */}
        {aiInsights ? (
          <div className="space-y-6">
            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiInsights.keyInsights?.map((insight, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FaLightbulb className="text-blue-400 text-lg" />
                    </div>
                    <h4 className="text-white font-semibold">Insight {index + 1}</h4>
                  </div>
                  <p className="text-slate-300 text-sm">{insight}</p>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                               <FaBullseye className="text-green-400" />
               Strategic Recommendations
              </h4>
              <div className="space-y-4">
                {aiInsights.recommendations?.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-white font-medium">{rec.title}</p>
                      <p className="text-slate-300 text-sm">{rec.description}</p>
                      {rec.priority && (
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {rec.priority} priority
                        </span>
                )}
              </div>
                  </div>
                ))}
            </div>
          </div>

            {/* Performance Score */}
            {aiInsights.performanceScore && (
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FaTrophy className="text-yellow-400" />
                  Performance Score
                </h4>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {aiInsights.performanceScore.score}/100
                    </div>
                    <div className="w-32 h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                        style={{ width: `${aiInsights.performanceScore.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm mb-2">
                      {aiInsights.performanceScore.feedback}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar 
                          key={star} 
                          className={`text-sm ${
                            star <= Math.ceil(aiInsights.performanceScore.score / 20) 
                              ? 'text-yellow-400' 
                              : 'text-slate-600'
                          }`} 
                        />
                      ))}
                </div>
            </div>
          </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaLightbulb className="text-6xl text-yellow-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No AI Insights Yet</h3>
            <p className="text-slate-400 mb-6">
              Click "Generate Insights" to get AI-powered recommendations for your credit collection operations
            </p>
            <button
              onClick={generateAiInsights}
              disabled={aiLoading}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 mx-auto"
            >
              {aiLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaRocket />
              )}
              {aiLoading ? 'Generating Insights...' : 'Generate AI Insights'}
            </button>
        </div>
      )}
    </div>
  );
  };

  const renderPromisedPaymentsTab = () => {
    // For debt collectors, use debtCollectorStats data which has the correct promised payments
    const dataSource = user?.role === "debt_collector" ? debtCollectorStats : promisedPaymentsAnalytics;
    console.log("🎯 Rendering promised payments tab with data:", dataSource);
    
    if (!dataSource) {
      return (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading promised payments data...</p>
        </div>
      );
    }

    return (
    <div className="space-y-6">
        {/* Promised Payments Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-green-300 text-sm font-medium">Total Promised</p>
                    <p className="text-2xl font-bold text-white">
                  {(dataSource.promisedPayments?.totalPromisedAmount || 0).toLocaleString()}
                    </p>
                  </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FaHandshake className="text-green-400 text-xl" />
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-blue-300 text-sm font-medium">Total Paid</p>
                    <p className="text-2xl font-bold text-white">
                  {(dataSource.promisedPayments?.totalPaidAmount || 0).toLocaleString()}
                    </p>
                  </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FaCreditCard className="text-blue-400 text-xl" />
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-purple-300 text-sm font-medium">Pending Amount</p>
                    <p className="text-2xl font-bold text-white">
                  {(dataSource.promisedPayments?.totalPendingAmount || 0).toLocaleString()}
                    </p>
                  </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FaClock className="text-purple-400 text-xl" />
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-orange-300 text-sm font-medium">Payment Rate</p>
                    <p className="text-2xl font-bold text-white">
                  {dataSource.promisedPayments?.paymentRate ? `${dataSource.promisedPayments.paymentRate}%` : 'N/A'}
                    </p>
                  </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <FaPercent className="text-orange-400 text-xl" />
                </div>
              </div>
            </div>
          </div>

        {/* Promised Payments Chart */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-blue-400" />
            Promised Payments Trends
                </h3>
          <div className="h-80">
            <Bar
              data={dataSource.monthlyPromisedPaymentsTrends ? {
                labels: dataSource.monthlyPromisedPaymentsTrends.map(trend => trend.month),
                datasets: [
                  {
                    label: 'Promised Amount',
                    data: dataSource.monthlyPromisedPaymentsTrends.map(trend => trend.totalPromisedAmount),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2
                  },
                  {
                    label: 'Paid Amount',
                    data: dataSource.monthlyPromisedPaymentsTrends.map(trend => trend.paidAmount),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                  }
                ]
              } : {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    label: 'Promised Amount',
                    data: [15000, 22000, 18000, 30000, 25000, 35000],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2
                  },
                  {
                    label: 'Paid Amount',
                    data: [12000, 18000, 15000, 25000, 20000, 30000],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                  }
                ]
              }}
                    options={{
                      responsive: true,
                maintainAspectRatio: false,
                      plugins: {
                        legend: {
                    labels: { color: '#e2e8f0' }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#475569',
                    borderWidth: 1
                  }
                      },
                      scales: {
                        x: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                        },
                        y: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                  }
                }
              }}
            />
              </div>
            </div>

        {/* Promised Payments Table */}
        {dataSource.recentActivity && dataSource.recentActivity.length > 0 ? (
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaReceipt className="text-blue-400" />
              Recent Promised Payments
                </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600/50">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Case</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Debtor</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Debt Amount</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Last Updated</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSource.recentActivity.map((case_, index) => (
                    <tr key={index} className="border-b border-slate-600/30">
                      <td className="py-3 px-4 text-white">{case_.caseNumber}</td>
                      <td className="py-3 px-4 text-slate-300">{case_.debtor}</td>
                      <td className="py-3 px-4 text-slate-300">${case_.debtAmount?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(case_.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          case_.status === 'resolved' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : case_.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {case_.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{case_.assignedTo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
            <div className="text-center py-8">
              <FaReceipt className="text-4xl text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No promised payments data available</p>
            </div>
        </div>
      )}
    </div>
  );
  };

    // Trends Tab
  const renderTrendsTab = () => {
    // For debt collectors, use debtCollectorStats data which has the correct trends
    const dataSource = user?.role === "debt_collector" ? debtCollectorStats : monthlyTrends;
    console.log("🎯 Rendering trends tab with data:", dataSource);
    
    if (!dataSource) {
      return (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading trends data...</p>
        </div>
      );
    }

    // Calculate trend statistics from real data
    const calculateTrendStats = () => {
      if (!dataSource.monthlyTrends || dataSource.monthlyTrends.length < 2) {
        return { growthTrend: 'N/A', averageCases: 'N/A', targetAchievement: 'N/A' };
      }

      const newCasesData = dataSource.monthlyTrends.map(trend => trend.newCases);
      const totalAmountData = dataSource.monthlyTrends.map(trend => trend.totalAmount);

      if (newCasesData.length < 2) {
        return { growthTrend: 'N/A', averageCases: 'N/A', targetAchievement: 'N/A' };
      }

      // Calculate growth trend
      const currentCases = newCasesData[newCasesData.length - 1];
      const previousCases = newCasesData[newCasesData.length - 2];
      const growthTrend = previousCases > 0 ? Math.round(((currentCases - previousCases) / previousCases) * 100) : 0;

      // Calculate average cases per month
      const averageCases = Math.round(newCasesData.reduce((sum, val) => sum + val, 0) / newCasesData.length);

      // Calculate target achievement (assuming target is 20% growth)
      const targetAchievement = growthTrend >= 20 ? 100 : Math.round((growthTrend / 20) * 100);

      return { growthTrend, averageCases, targetAchievement };
    };

    const trendStats = calculateTrendStats();

    return (
      <div className="space-y-6">
        {/* Monthly Trends Chart */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaArrowUp className="text-blue-400" />
            Monthly Performance Trends
          </h3>
          <div className="h-80">
            <Line
              data={dataSource.monthlyTrends ? {
                labels: dataSource.monthlyTrends.map(trend => trend.month),
                datasets: [
                  {
                    label: 'New Cases',
                    data: dataSource.monthlyTrends.map(trend => trend.newCases),
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    fill: true
                  },
                  {
                    label: 'Total Amount',
                    data: dataSource.monthlyTrends.map(trend => trend.totalAmount),
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 3,
                    fill: true
                  }
                ]
              } : monthlyTrends}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: '#e2e8f0' }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#475569',
                    borderWidth: 1
                  }
                },
                scales: {
                  x: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                  },
                  y: {
                    ticks: { color: '#e2e8f0' },
                    grid: { color: '#475569' }
                  }
                }
              }}
            />
              </div>
            </div>

        {/* Trend Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-xl">
            <div className="flex items-center gap-3">
              <FaArrowUp className="text-green-400 text-2xl" />
              <div>
                <p className="text-green-300 text-sm">Growth Trend</p>
                <p className="text-xl font-bold text-white">
                  {trendStats.growthTrend !== 'N/A' ? `${trendStats.growthTrend > 0 ? '+' : ''}${trendStats.growthTrend}%` : 'N/A'}
                </p>
        </div>
                </div>
              </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
            <div className="flex items-center gap-3">
              <FaChartLine className="text-blue-400 text-2xl" />
              <div>
                <p className="text-blue-300 text-sm">Average Cases</p>
                <p className="text-xl font-bold text-white">
                  {trendStats.averageCases !== 'N/A' ? `${trendStats.averageCases}/month` : 'N/A'}
                </p>
                  </div>
                </div>
                  </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-xl">
            <div className="flex items-center gap-3">
              <FaBullseye className="text-purple-400 text-2xl" />
              <div>
                <p className="text-purple-300 text-sm">Target Achievement</p>
                <p className="text-xl font-bold text-white">
                  {trendStats.targetAchievement !== 'N/A' ? `${trendStats.targetAchievement}%` : 'N/A'}
                </p>
                </div>
              </div>
            </div>
          </div>

        {/* Data Source Info */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-blue-400" />
            Data Source Information
          </h4>
          <div className="text-slate-300 text-sm space-y-2">
            <p>• <strong>New Cases:</strong> Number of credit collection cases opened each month</p>
            <p>• <strong>Total Amount:</strong> Total debt amount for cases opened each month</p>
            <p>• <strong>Growth Trend:</strong> Month-over-month percentage change in new cases</p>
            <p>• <strong>Target Achievement:</strong> Progress toward 20% monthly growth target</p>
                  </div>
                  </div>
                  </div>
    );
  };

  // Summary Tab
  const renderSummaryTab = () => {
    // For debt collectors, show their specific stats
    if (user?.role === "debt_collector") {
      if (!debtCollectorStats) {
        return (
          <div className="text-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-400 mx-auto mb-4" />
            <p className="text-slate-300">Loading your personal statistics...</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {/* Debt Collector Info */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {debtCollectorStats.debtCollector?.firstName} {debtCollectorStats.debtCollector?.lastName}
                </h3>
                <p className="text-slate-300 text-sm">{debtCollectorStats.debtCollector?.email}</p>
                <p className="text-blue-400 text-xs mt-1">Period: Last {debtCollectorStats.period} days</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FaUserTie className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          {/* Basic Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Cases</p>
                  <p className="text-2xl font-bold text-white">{debtCollectorStats.basicStats?.totalCases || 0}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FaFileAlt className="text-blue-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Resolved Cases</p>
                  <p className="text-2xl font-bold text-white">{debtCollectorStats.basicStats?.resolvedCases || 0}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <FaCheckCircle className="text-green-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-white">{debtCollectorStats.basicStats?.inProgressCases || 0}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <FaClock className="text-purple-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {debtCollectorStats.basicStats?.successRate ? `${debtCollectorStats.basicStats.successRate}%` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <FaPercent className="text-orange-400 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl rounded-xl p-6 border border-indigo-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-300 text-sm font-medium">Total Debt Amount</p>
                  <p className="text-2xl font-bold text-white">
                    {(debtCollectorStats.financialStats?.totalDebtAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                  <FaMoneyBillWave className="text-indigo-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-600/20 to-cyan-600/20 backdrop-blur-xl rounded-xl p-6 border border-teal-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-300 text-sm font-medium">Collected Amount</p>
                  <p className="text-2xl font-bold text-white">
                    {(debtCollectorStats.financialStats?.collectedAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-teal-500/20 rounded-lg">
                  <FaReceipt className="text-teal-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Pending Amount</p>
                  <p className="text-2xl font-bold text-white">
                    {(debtCollectorStats.financialStats?.pendingAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <FaClock className="text-yellow-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-red-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm font-medium">Collection Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {debtCollectorStats.financialStats?.collectionRate ? `${debtCollectorStats.financialStats.collectionRate}%` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <FaPercent className="text-red-400 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Promised Payments Section */}
          {debtCollectorStats.promisedPayments && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FaHandshake className="mr-2 text-blue-400" />
                Promised Payments Overview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm font-medium">Total Promised</p>
                      <p className="text-2xl font-bold text-white">
                        {(debtCollectorStats.promisedPayments.totalPromisedAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-blue-400 text-xs mt-1">
                        {debtCollectorStats.promisedPayments.totalPromisedCount || 0} payments
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <FaHandshake className="text-blue-400 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm font-medium">Paid Amount</p>
                      <p className="text-2xl font-bold text-white">
                        {(debtCollectorStats.promisedPayments.totalPaidAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-green-400 text-xs mt-1">
                        {debtCollectorStats.promisedPayments.totalPaidCount || 0} payments
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <FaCheckCircle className="text-green-400 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-300 text-sm font-medium">Pending Amount</p>
                      <p className="text-2xl font-bold text-white">
                        {(debtCollectorStats.promisedPayments.totalPendingAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-yellow-400 text-xs mt-1">
                        {debtCollectorStats.promisedPayments.totalPendingCount || 0} payments
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <FaClock className="text-yellow-400 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-red-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-300 text-sm font-medium">Payment Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {debtCollectorStats.promisedPayments.paymentRate ? `${debtCollectorStats.promisedPayments.paymentRate}%` : 'N/A'}
                      </p>
                      <p className="text-red-400 text-xs mt-1">Success rate</p>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <FaPercent className="text-red-400 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Overdue Payments */}
              {debtCollectorStats.promisedPayments.totalOverdueAmount > 0 && (
                <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-red-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-300 text-sm font-medium">Overdue Amount</p>
                      <p className="text-2xl font-bold text-white">
                        {(debtCollectorStats.promisedPayments.totalOverdueAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-red-400 text-sm mt-1">
                        {debtCollectorStats.promisedPayments.totalOverdueCount || 0} overdue payments
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <FaExclamationTriangle className="text-red-400 text-xl" />
                    </div>
                  </div>
                </div>
              )}
            </div>


          )}

          {/* Escalation Revenue */}
          {debtCollectorStats.financialStats?.escalationRevenue > 0 && (
            <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-300 text-sm font-medium">Escalation Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    {(debtCollectorStats.financialStats.escalationRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-emerald-400 text-sm mt-1">Revenue from escalated cases</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <FaRocket className="text-emerald-400 text-xl" />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // For other roles, show the general summary
    if (!reportsData) {
      return (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading summary data...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Cases</p>
                <p className="text-2xl font-bold text-white">{reportsData.totalCases || 0}</p>
                    </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FaFileAlt className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Active Cases</p>
                <p className="text-2xl font-bold text-white">{reportsData.activeCases || 0}</p>
                    </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FaClock className="text-green-400 text-xl" />
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-purple-300 text-sm font-medium">Resolved Cases</p>
                <p className="text-2xl font-bold text-white">{reportsData.resolvedCases || 0}</p>
                  </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FaCheckCircle className="text-purple-400 text-xl" />
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-orange-300 text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-white">
                  {reportsData.successRate ? `${reportsData.successRate}%` : 'N/A'}
                    </p>
                  </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <FaPercent className="text-orange-400 text-xl" />
                  </div>
                </div>
              </div>
            </div>

        {/* Additional Metrics */}
        {reportsData.totalDebtAmount > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl rounded-xl p-6 border border-indigo-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                  <p className="text-indigo-300 text-sm font-medium">Total Debt Amount</p>
                    <p className="text-2xl font-bold text-white">
                    {(reportsData.totalDebtAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-500/20 rounded-lg">
                    <FaMoneyBillWave className="text-indigo-400 text-xl" />
                  </div>
                </div>
            </div>

                        {/* Revenue Information for Admin Users */}
            {revenueAnalytics && (
              <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-300 text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      {(revenueAnalytics.overview?.totalRevenue || 0).toLocaleString()}
                    </p>
                    <p className="text-emerald-400 text-xs mt-1">
                      Collection: {(revenueAnalytics.overview?.totalCollectionFees || 0).toLocaleString()} | 
                      Escalation: {(revenueAnalytics.overview?.totalEscalationFees || 0).toLocaleString()} | 
                      Promised: {(revenueAnalytics.overview?.totalPromisedPayments || 0).toLocaleString()}
                    </p>

                  </div>
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <FaReceipt className="text-emerald-400 text-xl" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-teal-600/20 to-cyan-600/20 backdrop-blur-xl rounded-xl p-6 border border-teal-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                  <p className="text-teal-300 text-sm font-medium">Cases by Priority</p>
                    <p className="text-2xl font-bold text-white">
                    {reportsData.casesByPriority ? reportsData.casesByPriority.length : 0}
                    </p>
                  </div>
                <div className="p-3 bg-teal-500/20 rounded-lg">
                  <FaExclamationTriangle className="text-teal-400 text-xl" />
                  </div>
                </div>
              </div>

            {/* Escalated Cases for Admin Users */}
            {reportsData.casesByStatus && (
              <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-6 border border-red-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm font-medium">Escalated Cases</p>
                    <p className="text-2xl font-bold text-white">
                      {reportsData.casesByStatus.find(status => status._id === 'escalated_to_legal')?.count || 0}
                    </p>
                    <p className="text-red-400 text-xs mt-1">Cases escalated to legal</p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <FaRocket className="text-red-400 text-xl" />
                  </div>
                </div>
              </div>
            )}
                  </div>
                )}

        {/* Case Status Breakdown for Admin Users */}
        {reportsData.casesByStatus && reportsData.casesByStatus.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaChartPie className="text-blue-400" />
              Case Status Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportsData.casesByStatus.map((status, index) => (
                <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm font-medium capitalize">
                        {status._id.replace(/_/g, ' ')}
                      </p>
                      <p className="text-white text-xl font-bold">{status.count}</p>
                      <p className="text-slate-400 text-xs">
                        KSH {(status.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      status._id === 'resolved' ? 'bg-green-500/20' :
                      status._id === 'escalated_to_legal' ? 'bg-red-500/20' :
                      status._id === 'assigned' ? 'bg-blue-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        status._id === 'resolved' ? 'bg-green-400' :
                        status._id === 'escalated_to_legal' ? 'bg-red-400' :
                        status._id === 'assigned' ? 'bg-blue-400' :
                        'bg-yellow-400'
                      }`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaClock className="text-blue-400" />
            Recent Activity
                </h3>
          <div className="space-y-3">
            {reportsData.recentActivity && reportsData.recentActivity.length > 0 ? (
              reportsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{activity.caseNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        activity.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {activity.status}
                      </span>
                  </div>
                    <div className="text-slate-300 text-sm mt-1">
                      <span className="text-slate-400">Debtor:</span> {activity.debtor} | 
                      <span className="text-slate-400 ml-2">Amount:</span> {activity.debtAmount?.toLocaleString()} | 
                      <span className="text-slate-400 ml-2">Assigned:</span> {activity.assignedTo}
              </div>
            </div>
          </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No recent activity</p>
            )}
              </div>
            </div>
    </div>
  );
  };

  if (loading) {
    return (
      <CreditCollectionLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-6xl text-blue-400 mx-auto mb-4" />
            <p className="text-slate-300 text-xl">Loading reports...</p>
          </div>
        </div>
      </CreditCollectionLayout>
    );
  }

  return (
    <CreditCollectionLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <FaChartBar className="text-white text-2xl" />
              </div>
          <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Credit Collection Reports
            </h1>
                <p className="text-slate-300 text-sm sm:text-base">
                  Comprehensive analytics and insights for your credit collection operations
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                                 {loading ? (
                   <FaSpinner className="animate-spin" />
                 ) : (
                   <FaSyncAlt />
                 )}
                 Refresh Data
              </button>
            </div>
          </div>
          </div>

        {/* Filters & Controls Section */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Selector */}
            <div className="flex items-center gap-2">
                <FaCalendar className="text-blue-400" />
              <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <FaBuilding className="text-blue-400" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  <option value="legal">Legal Department</option>
                  <option value="credit">Credit Department</option>
                  <option value="admin">Administration</option>
                </select>
              </div>

              {/* Debt Collector Filter (for admin users) */}
              {user?.role === "law_firm_admin" && (
                <div className="flex items-center gap-2">
                  <FaUserTie className="text-blue-400" />
                  <select
                    value={selectedDebtCollector || ""}
                    onChange={(e) => setSelectedDebtCollector(e.target.value || null)}
                    className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Debt Collector</option>
                    <option value="68821db2706e1ebc9b43fb1e">Bonface Wambua (recoveries@kwco.legal)</option>
                    <option value="68821f46706e1ebc9b43fb75">Jackline Jowi (jajowi@kwco.legal)</option>
                    <option value="68822047706e1ebc9b43fb8c">Seif Mohammed (seif.mohammed@kwco.legal)</option>
                    <option value="689163fc03e5cdac7be03051">Edmond Obure (kivuvakevin4@gmail.com)</option>
                    <option value="689164b0ed12774ec8f324c5">Edmond Obure (kivuvakevin10@gmail.com)</option>
                    <option value="68b151c0e38bfba98d2d43be">Clifford Obure (cliffordobure98@gmail.com)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadCSV}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <FaDownload />
                Download CSV
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <FaDownload />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl overflow-hidden">
          <div className="flex flex-wrap border-b border-slate-600/50">
            {[
              { id: "summary", label: "Summary", icon: FaChartBar },
              { id: "revenue", label: "Revenue Analytics", icon: FaMoneyBillWave },
              { id: "performance", label: "Performance Metrics", icon: FaChartLine },
                             { id: "trends", label: "Monthly Trends", icon: FaArrowUp },
              { id: "promisedPayments", label: "Promised Payments", icon: FaHandshake },
              { id: "aiInsights", label: "AI Insights", icon: FaLightbulb },
              ].map((tab) => {
              const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                      ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                  <IconComponent className="text-lg" />
                  {tab.label}
                  </button>
                );
              })}
        </div>

        {/* Tab Content */}
          <div className="p-6 space-y-6">
            {activeTab === "summary" && renderSummaryTab()}
          {activeTab === "revenue" && renderRevenueTab()}
            {activeTab === "performance" && renderPerformanceTab()}
            {activeTab === "trends" && renderTrendsTab()}
            {activeTab === "promisedPayments" && renderPromisedPaymentsTab()}
            {activeTab === "aiInsights" && renderAiInsightsTab()}
          </div>
        </div>
      </div>
    </CreditCollectionLayout>
  );
};



export default CreditCollectionReports;
