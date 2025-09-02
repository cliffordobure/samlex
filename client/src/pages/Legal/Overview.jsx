import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLegalCases, getPendingAssignmentCases, getLegalCaseStatistics } from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import reportsApi from "../../store/api/reportsApi";
import {
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaPlus,
  FaUserPlus,
  FaChartBar,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaDownload,
  FaSyncAlt,
  FaCog,
  FaShieldAlt,
  FaFileContract,
  FaUserTie,
  FaArrowUp,
  FaBell,
  FaSearch,
  FaTimes,
  FaBars,
  FaFilePdf,
  FaFileCsv,
  FaChartLine,
  FaChartPie,
  FaRocket,
  FaLightbulb,
  FaHandshake,
  FaAward,
  FaCalendarCheck,
  FaUserCheck,
  FaUserTimes,
  FaFileInvoiceDollar,
  FaBalanceScale as FaScale,
  FaShieldAlt as FaShield,
  FaRocket as FaRocketIcon,
  FaLightbulb as FaBulb,
  FaCog as FaSettings,
  FaInfoCircle,
  FaMinus,
  FaFilter,
} from "react-icons/fa";

const LegalOverview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { cases } = useSelector((state) => state.legalCases);
  const { users } = useSelector((state) => state.users);

  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    resolvedCases: 0,
    pendingAssignment: 0,
    escalatedCases: 0,
    totalFilingFees: 0,
    thisMonthCases: 0,
    lastMonthCases: 0,
    caseGrowth: 0,
    resolutionRate: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [topAdvocates, setTopAdvocates] = useState([]);
  const [caseTrends, setCaseTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  useEffect(() => {
    if (user?.lawFirm?._id) {
      setIsLoading(true);
      
      // For advocates, only fetch their assigned cases
      if (user.role === 'advocate') {
        Promise.all([
          dispatch(getLegalCases({ 
            lawFirm: user.lawFirm._id, 
            assignedTo: user._id,
            limit: 100 
          })),
        ]).finally(() => setIsLoading(false));
      } else {
        // For legal_head and law_firm_admin, fetch all data
        Promise.all([
          dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
          dispatch(getUsers({ lawFirm: user.lawFirm._id, role: "advocate", limit: 50 })),
          dispatch(getPendingAssignmentCases()),
        ]).finally(() => setIsLoading(false));
      }
    }
  }, [dispatch, user?.lawFirm?._id, user?.role, user?._id]);

  useEffect(() => {
    if (cases.length > 0 || users.length > 0) {
      calculateStats();
      generateRecentActivity();
      generateTopAdvocates();
      generateCaseTrends();
    }
  }, [cases, users]);

  const calculateStats = () => {
    const allCases = cases;
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // For advocates, only show their own cases
    const userCases = user?.role === 'advocate' ? allCases : allCases;

    const activeCases = userCases.filter((c) =>
      ["assigned", "under_review", "court_proceedings"].includes(c.status)
    );
    const resolvedCases = userCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    );
    const pendingAssignment = userCases.filter((c) => c.status === "pending_assignment");
    const escalatedCases = userCases.filter((c) => c.escalatedFrom?.creditCaseId);
    
    const thisMonthCases = userCases.filter((c) =>
      new Date(c.createdAt) >= thisMonth
    );
    const lastMonthCases = userCases.filter((c) =>
      new Date(c.createdAt) >= lastMonth && new Date(c.createdAt) < thisMonth
    );

    const totalFilingFees = userCases.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0);
    const resolutionRate = userCases.length > 0 ? (resolvedCases.length / userCases.length) * 100 : 0;
    const caseGrowth = lastMonthCases.length > 0 ? ((thisMonthCases.length - lastMonthCases.length) / lastMonthCases.length) * 100 : 0;

    setStats({
      totalCases: userCases.length,
      activeCases: activeCases.length,
      resolvedCases: resolvedCases.length,
      pendingAssignment: pendingAssignment.length,
      escalatedCases: escalatedCases.length,
      totalFilingFees,
      thisMonthCases: thisMonthCases.length,
      lastMonthCases: lastMonthCases.length,
      caseGrowth: Math.round(caseGrowth * 100) / 100,
      resolutionRate: Math.round(resolutionRate * 100) / 100,
    });
  };

  const generateRecentActivity = () => {
    const activities = cases.slice(0, 8).map((legalCase, index) => {
      const CaseTypeIcon = getCaseTypeIcon(legalCase.caseType);
      const timestamp = new Date(legalCase.updatedAt || legalCase.createdAt);
      
      return {
        id: legalCase._id,
        title: legalCase.title,
        description: `${legalCase.caseNumber} • ${legalCase.caseType.replace("_", " ")}`,
        timestamp,
        status: legalCase.status,
        priority: legalCase.priority,
        icon: CaseTypeIcon,
        color: getStatusColor(legalCase.status),
        type: "legal_case",
      };
    });

    setRecentActivity(activities);
  };

  const generateTopAdvocates = () => {
    // For advocates, they can't see other advocates' data
    if (user?.role === 'advocate') {
      setTopAdvocates([]);
      return;
    }

    const advocateStats = users
      .filter(u => u.role === "advocate")
      .map(advocate => {
        const advocateCases = cases.filter(c => c.assignedTo?._id === advocate._id || c.assignedTo === advocate._id);
        const resolvedCases = advocateCases.filter(c => ["resolved", "closed"].includes(c.status));
        const resolutionRate = advocateCases.length > 0 ? (resolvedCases.length / advocateCases.length) * 100 : 0;
        
        return {
          id: advocate._id,
          name: `${advocate.firstName} ${advocate.lastName}`,
          email: advocate.email,
          totalCases: advocateCases.length,
          resolvedCases: resolvedCases.length,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          performance: resolutionRate >= 80 ? "excellent" : resolutionRate >= 60 ? "good" : "needs_improvement",
        };
      })
      .sort((a, b) => b.resolutionRate - a.resolutionRate)
      .slice(0, 5);

    setTopAdvocates(advocateStats);
  };

  const generateCaseTrends = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }

    const trends = months.map(month => {
      const monthCases = cases.filter(c => {
        const caseDate = new Date(c.createdAt);
        return caseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) === month;
      });

      const civilCases = monthCases.filter(c => c.caseType === "civil").length;
      const criminalCases = monthCases.filter(c => c.caseType === "criminal").length;
      const corporateCases = monthCases.filter(c => c.caseType === "corporate").length;
      const familyCases = monthCases.filter(c => c.caseType === "family").length;

      return {
        month,
        civilCases,
        criminalCases,
        corporateCases,
        familyCases,
        total: monthCases.length,
      };
    });

    setCaseTrends(trends);
  };

  // Button Action Handlers
  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await Promise.all([
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
        dispatch(getUsers({ lawFirm: user.lawFirm._id, role: "advocate", limit: 50 })),
        dispatch(getPendingAssignmentCases()),
      ]);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleQuickAction = () => {
    navigate('/legal/cases');
  };

  const handleNewCase = () => {
    navigate('/legal/cases/create');
  };

  const handleAssignCases = () => {
    navigate('/legal/cases');
  };

  const handleGenerateReport = () => {
    navigate('/legal/reports');
  };

  const handleExportPDF = async () => {
    try {
      const response = await reportsApi.downloadPDF(user.lawFirm._id, "legal-performance");
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_legal_dashboard_report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleExportCSV = async () => {
    try {
      // Create CSV data from dashboard data
      const csvData = [
        // Stats section
        ['Legal Dashboard Statistics', ''],
        ['Total Cases', stats.totalCases],
        ['Active Cases', stats.activeCases],
        ['Resolved Cases', stats.resolvedCases],
        ['Pending Assignment', stats.pendingAssignment],
        ['Escalated Cases', stats.escalatedCases],
        ['Total Filing Fees', stats.totalFilingFees],
        ['Resolution Rate (%)', stats.resolutionRate],
        ['Case Growth (%)', stats.caseGrowth],
        [''],
        
        // Case Trends section
        ['Case Trends', ''],
        ['Month', 'Civil Cases', 'Criminal Cases', 'Corporate Cases', 'Family Cases'],
        ...caseTrends.map(trend => [
          trend.month,
          trend.civilCases,
          trend.criminalCases,
          trend.corporateCases,
          trend.familyCases
        ]),
        [''],
        
        // Top Advocates section
        ['Top Advocates', ''],
        ['Name', 'Email', 'Total Cases', 'Resolved Cases', 'Resolution Rate (%)'],
        ...topAdvocates.map(advocate => [
          advocate.name,
          advocate.email,
          advocate.totalCases,
          advocate.resolvedCases,
          advocate.resolutionRate
        ])
      ];

      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_legal_dashboard_report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/legal/cases?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCaseTypeIcon = (caseType) => {
    const icons = {
      civil: FaBalanceScale,
      criminal: FaGavel,
      corporate: FaBuilding,
      family: FaUsers,
      property: FaHome,
      labor: FaBriefcase,
      debt_collection: FaFileAlt,
      other: FaFileAlt,
    };
    return icons[caseType] || FaFileAlt;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_assignment: "text-yellow-500",
      filed: "text-blue-500",
      assigned: "text-purple-500",
      under_review: "text-orange-500",
      court_proceedings: "text-red-500",
      settlement: "text-green-500",
      resolved: "text-emerald-500",
      closed: "text-gray-500",
    };
    return colors[status] || "text-gray-500";
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "needs_improvement":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading your legal dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
      {/* Mobile Header with Search */}
      <div className="lg:hidden mb-6">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-600/50">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-700/50 text-white placeholder-slate-400 rounded-xl px-4 py-3 pr-12 border border-slate-600/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <FaSearch className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {user?.role === 'advocate' ? 'My Legal Cases' : 'Legal Department Dashboard'}
          </h1>
          <p className="text-slate-300 text-lg">
            {user?.role === 'advocate' 
              ? `Welcome back, ${user?.firstName}! Here's your case overview.`
              : `Welcome back, ${user?.firstName}! Here's your legal department overview.`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshLoading}
            className="p-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl border border-slate-600/50 transition-all duration-300 hover:scale-105"
            title="Refresh Data"
          >
            <FaSyncAlt className={`w-5 h-5 ${refreshLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {user?.role !== 'advocate' && (
            <button
              onClick={handleNewCase}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              New Case
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Cases Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/cases')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Total Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">{stats.totalCases}</p>
              <div className="flex items-center mt-2">
                <FaArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-xs sm:text-sm font-medium">
                  +{stats.caseGrowth}% from last month
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-blue-500/30 transition-all duration-300">
              <FaGavel className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Active Cases Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/cases?status=active')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Active Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2 group-hover:text-yellow-400 transition-colors">{stats.activeCases}</p>
              <div className="flex items-center mt-2">
                <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mr-1" />
                <span className="text-yellow-500 text-xs sm:text-sm font-medium">
                  {user?.role === 'advocate' ? `${stats.activeCases} in progress` : `${stats.pendingAssignment} pending assignment`}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-yellow-500/30 transition-all duration-300">
              <FaClock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Resolved Cases Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/cases?status=resolved')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Resolved Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2 group-hover:text-green-400 transition-colors">{stats.resolvedCases}</p>
              <div className="flex items-center mt-2">
                <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-xs sm:text-sm font-medium">
                  {stats.resolutionRate}% success rate
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-green-500/30 transition-all duration-300">
              <FaCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/reports')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Total Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-2 group-hover:text-purple-400 transition-colors">{formatCurrency(stats.totalFilingFees)}</p>
              <div className="flex items-center mt-2">
                <FaMoneyBillWave className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 mr-1" />
                <span className="text-purple-500 text-xs sm:text-sm font-medium">
                  Filing fees collected
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-purple-500/30 transition-all duration-300">
              <FaMoneyBillWave className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
        {/* Case Trends Chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-white">Case Trends</h3>
            <div className="flex items-center gap-2">
              <button className="px-2 sm:px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm transition-colors">
                Last 6 Months
              </button>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleExportPDF}
                  className="px-2 sm:px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1"
                  title="Export as PDF"
                >
                  <FaFilePdf className="w-3 h-3" />
                  PDF
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1"
                  title="Export as CSV"
                >
                  <FaFileCsv className="w-3 h-3" />
                  CSV
                </button>
              </div>
            </div>
          </div>
          
          <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
            {caseTrends.map((trend, index) => (
              <div key={trend.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1">
                  <div className="flex-1 flex gap-1">
                    <div 
                      className="flex-1 bg-blue-500/80 rounded-t-sm hover:bg-blue-400 transition-colors cursor-pointer"
                      style={{ height: `${(trend.civilCases / Math.max(...caseTrends.map(t => t.total))) * 100}%` }}
                      title={`Civil: ${trend.civilCases}`}
                    ></div>
                    <div 
                      className="flex-1 bg-red-500/80 rounded-t-sm hover:bg-red-400 transition-colors cursor-pointer"
                      style={{ height: `${(trend.criminalCases / Math.max(...caseTrends.map(t => t.total))) * 100}%` }}
                      title={`Criminal: ${trend.criminalCases}`}
                    ></div>
                    <div 
                      className="flex-1 bg-green-500/80 rounded-t-sm hover:bg-green-400 transition-colors cursor-pointer"
                      style={{ height: `${(trend.corporateCases / Math.max(...caseTrends.map(t => t.total))) * 100}%` }}
                      title={`Corporate: ${trend.corporateCases}`}
                    ></div>
                    <div 
                      className="flex-1 bg-purple-500/80 rounded-t-sm hover:bg-purple-400 transition-colors cursor-pointer"
                      style={{ height: `${(trend.familyCases / Math.max(...caseTrends.map(t => t.total))) * 100}%` }}
                      title={`Family: ${trend.familyCases}`}
                    ></div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 text-center">{trend.month}</p>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500/80 rounded"></div>
              <span className="text-slate-300">Civil</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500/80 rounded"></div>
              <span className="text-slate-300">Criminal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/80 rounded"></div>
              <span className="text-slate-300">Corporate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500/80 rounded"></div>
              <span className="text-slate-300">Family</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h3>
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={handleNewCase}
              className="w-full p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                <FaPlus className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm sm:text-base">Create New Case</div>
                <div className="text-xs sm:text-sm opacity-80">Start a new legal case</div>
              </div>
            </button>

            <button
              onClick={handleQuickAction}
              className="w-full p-3 sm:p-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 flex items-center gap-3 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-600/50 rounded-lg flex items-center justify-center group-hover:bg-slate-500/50 transition-all duration-300">
                <FaChartBar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm sm:text-base">View All Cases</div>
                <div className="text-xs sm:text-sm opacity-80">Manage existing cases</div>
              </div>
            </button>

            {user.role === "legal_head" && (
              <>
                <button
                  onClick={handleAssignCases}
                  className="w-full p-3 sm:p-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-600/50 rounded-lg flex items-center justify-center group-hover:bg-slate-500/50 transition-all duration-300">
                    <FaUserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm sm:text-base">Assign Cases</div>
                    <div className="text-xs sm:text-sm opacity-80">Assign cases to advocates</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/legal/escalated')}
                  className="w-full p-3 sm:p-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <FaExclamationTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm sm:text-base">Escalated Cases</div>
                    <div className="text-xs sm:text-sm opacity-80">Review escalated cases</div>
                  </div>
                </button>
              </>
            )}

            <button
              onClick={handleGenerateReport}
              className="w-full p-3 sm:p-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 flex items-center gap-3 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-600/50 rounded-lg flex items-center justify-center group-hover:bg-slate-500/50 transition-all duration-300">
                <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm sm:text-base">Generate Reports</div>
                <div className="text-xs sm:text-sm opacity-80">View detailed analytics</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Performance & Activity Section */}
      <div className={`grid gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8 ${user?.role === 'advocate' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Top Advocates */}
        {user?.role !== 'advocate' && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Top Advocates</h3>
              <button 
                onClick={() => navigate('/legal/cases')}
                className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {topAdvocates.map((advocate, index) => (
                <div key={advocate.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-700/30 rounded-xl sm:rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate(`/legal/cases?assignedTo=${advocate.id}`)}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform text-sm sm:text-base">
                    {advocate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors text-sm sm:text-base">{advocate.name}</h4>
                    <p className="text-xs sm:text-sm text-slate-400 truncate">{advocate.email}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-1 sm:mt-2 gap-1">
                      <span className="text-xs sm:text-sm text-slate-300">
                        {advocate.resolvedCases}/{advocate.totalCases} cases
                      </span>
                      <span className={`text-xs sm:text-sm font-medium ${getPerformanceColor(advocate.performance)}`}>
                        {advocate.resolutionRate}% success
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getPerformanceColor(advocate.performance).replace('text-', 'bg-')}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className={`bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl ${user?.role === 'advocate' ? 'lg:col-span-1' : ''}`}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h3>
            <button 
              onClick={() => navigate('/legal/cases')}
              className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={`${activity.id}-${index}`} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-700/30 rounded-xl sm:rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate(`/legal/cases/${activity.id}`)}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${activity.color.replace('text-', 'bg-')} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 flex-shrink-0`}>
                  <activity.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate group-hover:text-blue-300 transition-colors text-sm sm:text-base">{activity.title}</p>
                  <p className="text-xs sm:text-sm text-slate-400">{activity.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.timestamp.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} • {activity.timestamp.toLocaleDateString()}
                  </p>
                </div>
                {activity.priority === "high" && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Case Type Distribution */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-white">Case Type Distribution</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/legal/cases')}
              className="px-3 sm:px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm transition-colors"
            >
              <FaFilter className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              View All
            </button>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleExportPDF}
                className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1"
                title="Export as PDF"
              >
                <FaFilePdf className="w-3 h-3 sm:w-4 sm:h-4" />
                PDF
              </button>
              <button 
                onClick={handleExportCSV}
                className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1"
                title="Export as CSV"
              >
                <FaFileCsv className="w-3 h-3 sm:w-4 sm:h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {[
            { type: "civil", icon: FaBalanceScale, color: "bg-blue-500", label: "Civil" },
            { type: "criminal", icon: FaGavel, color: "bg-red-500", label: "Criminal" },
            { type: "corporate", icon: FaBuilding, color: "bg-green-500", label: "Corporate" },
            { type: "family", icon: FaUsers, color: "bg-purple-500", label: "Family" },
            { type: "property", icon: FaHome, color: "bg-yellow-500", label: "Property" },
            { type: "labor", icon: FaBriefcase, color: "bg-orange-500", label: "Labor" },
            { type: "debt_collection", icon: FaFileAlt, color: "bg-indigo-500", label: "Debt Collection" },
            { type: "other", icon: FaFileAlt, color: "bg-gray-500", label: "Other" },
          ].map(({ type, icon, color, label }) => {
            const count = cases?.filter((c) => c.caseType === type).length || 0;
            const IconComponent = icon;
            return (
              <div key={type} className="text-center group cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate(`/legal/cases?caseType=${type}`)}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="text-white text-xl sm:text-2xl" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">{count}</div>
                <div className="text-xs sm:text-sm text-slate-400">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LegalOverview;
