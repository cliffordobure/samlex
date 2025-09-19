import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../../store/slices/userSlice";
import { getDepartments } from "../../store/slices/departmentSlice";
import { getCreditCases } from "../../store/slices/creditCaseSlice";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import reportsApi from "../../store/api/reportsApi";
import {
  FaUsers,
  FaBuilding,
  FaFolderOpen,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaPlus,
  FaFilter,
  FaDownload,
  FaSyncAlt,
  FaCog,
  FaShieldAlt,
  FaGavel,
  FaFileContract,
  FaUserPlus,
  FaArrowUp,
  FaBell,
  FaSearch,
  FaTimes,
  FaBars,
  FaFilePdf,
  FaFileCsv,
} from "react-icons/fa";

const AdminOverview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { departments } = useSelector((state) => state.departments);
  const { cases: creditCases } = useSelector((state) => state.creditCases);
  const { cases: legalCases } = useSelector((state) => state.legalCases);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    resolvedCases: 0,
    urgentCases: 0,
    thisMonthCases: 0,
    lastMonthCases: 0,
    caseGrowth: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [caseTrends, setCaseTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  useEffect(() => {
    if (user?.lawFirm?._id) {
      console.log("🔄 Loading data for law firm:", user.lawFirm._id);
      setIsLoading(true);
      Promise.all([
        dispatch(getUsers({ lawFirm: user.lawFirm._id, limit: 50 })),
        dispatch(getDepartments({ lawFirm: user.lawFirm._id })),
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id, limit: 100 })),
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
      ]).then((results) => {
        console.log("📥 API Results:", results);
        results.forEach((result, index) => {
          const apiNames = ['Users', 'Departments', 'CreditCases', 'LegalCases'];
          console.log(`📊 ${apiNames[index]} API Result:`, result);
        });
      }).catch((error) => {
        console.error("❌ API Error:", error);
      }).finally(() => {
        console.log("✅ Data loading completed");
        setIsLoading(false);
      });
    }
  }, [dispatch, user?.lawFirm?._id]);

  useEffect(() => {
    console.log("📊 Data state:", {
      users: users.length,
      departments: departments.length,
      creditCases: creditCases.length,
      legalCases: legalCases.length
    });
    
    // Debug the actual data structure
    console.log("🔍 Raw data structures:");
    console.log("Users:", users);
    console.log("Departments:", departments);
    console.log("Credit Cases:", creditCases);
    console.log("Legal Cases:", legalCases);
    
    if (users.length > 0 || departments.length > 0 || creditCases.length > 0 || legalCases.length > 0) {
      calculateStats();
      generateRecentActivity();
      generateTopPerformers();
      generateCaseTrends();
    }
  }, [users, departments, creditCases, legalCases]);

  const calculateStats = () => {
    const allCases = [...creditCases, ...legalCases];
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const activeCases = allCases.filter((c) =>
      ["assigned", "in_progress", "under_review", "court_proceedings"].includes(c.status)
    );
    const pendingCases = allCases.filter((c) =>
      ["new", "filed"].includes(c.status)
    );
    const resolvedCases = allCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    );
    const urgentCases = allCases.filter((c) =>
      c.priority === "high" || c.priority === "urgent"
    );
    const thisMonthCases = allCases.filter((c) =>
      new Date(c.createdAt) >= thisMonth
    );
    const lastMonthCases = allCases.filter((c) =>
      new Date(c.createdAt) >= lastMonth && new Date(c.createdAt) < thisMonth
    );

    const caseGrowth = lastMonthCases.length > 0 
      ? ((thisMonthCases.length - lastMonthCases.length) / lastMonthCases.length) * 100 
      : 0;

    setStats({
      totalUsers: users.length,
      totalDepartments: departments.length,
      totalCases: allCases.length,
      activeCases: activeCases.length,
      pendingCases: pendingCases.length,
      resolvedCases: resolvedCases.length,
      urgentCases: urgentCases.length,
      thisMonthCases: thisMonthCases.length,
      lastMonthCases: lastMonthCases.length,
      caseGrowth: Math.round(caseGrowth * 100) / 100,
    });
  };

  const generateRecentActivity = () => {
    const allCases = [...creditCases, ...legalCases];
    const activities = allCases
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 10)
      .map(case_ => ({
        id: case_._id,
        type: "case_update",
        title: case_.title || case_.caseNumber,
        description: `Case ${case_.status.replace("_", " ")}`,
        timestamp: new Date(case_.updatedAt || case_.createdAt),
        icon: getCaseIcon(case_.caseType),
        color: getStatusColor(case_.status),
        priority: case_.priority || "medium",
      }));

    setRecentActivity(activities);
  };

  const generateTopPerformers = () => {
    const allCases = [...creditCases, ...legalCases];
    const userStats = {};

    allCases.forEach(case_ => {
      if (case_.assignedTo) {
        const userId = case_.assignedTo;
        if (!userStats[userId]) {
          userStats[userId] = { resolved: 0, total: 0 };
        }
        userStats[userId].total++;
        if (case_.status === "resolved" || case_.status === "closed") {
          userStats[userId].resolved++;
        }
      }
    });

    const performers = Object.entries(userStats)
      .map(([userId, stats]) => {
        const user = users.find(u => u._id === userId);
        if (!user) return null;
        
        const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;
        return {
          id: userId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          resolvedCases: stats.resolved,
          totalCases: stats.total,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          performance: resolutionRate >= 80 ? "excellent" : resolutionRate >= 60 ? "good" : "needs_improvement",
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.resolutionRate - a.resolutionRate)
      .slice(0, 5);

    setTopPerformers(performers);
  };

  const generateCaseTrends = () => {
    const allCases = [...creditCases, ...legalCases];
    const now = new Date();
    const trends = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthCases = allCases.filter(c => {
        const caseDate = new Date(c.createdAt);
        return caseDate >= month && caseDate <= monthEnd;
      });

      trends.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: monthCases.length,
      });
    }

    setCaseTrends(trends);
  };

  // Button Action Handlers
  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await Promise.all([
        dispatch(getUsers({ lawFirm: user.lawFirm._id, limit: 50 })),
        dispatch(getDepartments({ lawFirm: user.lawFirm._id })),
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id, limit: 100 })),
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
      ]);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleQuickAction = () => {
    navigate('/admin/cases');
  };

  const handleNewCase = () => {
    navigate('/admin/cases');
  };

  const handleAddUser = () => {
    navigate('/admin/users');
  };

  const handleNewDepartment = () => {
    navigate('/admin/departments');
  };

  const handleGenerateReport = () => {
    navigate('/admin/reports');
  };

  const handleExportData = () => {
    const data = {
      stats,
      caseTrends,
      topPerformers,
      recentActivity,
      departments
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    try {
      const response = await reportsApi.downloadPDF(user.lawFirm._id, "overview");
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_dashboard_report.pdf`;
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
        ['Dashboard Statistics', ''],
        ['Total Users', stats.totalUsers],
        ['Total Departments', stats.totalDepartments],
        ['Total Cases', stats.totalCases],
        ['Active Cases', stats.activeCases],
        ['Pending Cases', stats.pendingCases],
        ['Resolved Cases', stats.resolvedCases],
        ['Urgent Cases', stats.urgentCases],
        ['This Month Cases', stats.thisMonthCases],
        ['Last Month Cases', stats.lastMonthCases],
        ['Case Growth (%)', stats.caseGrowth],
        [''],
        
        // Case Trends section
        ['Case Trends', ''],
        ['Month', 'Credit Cases', 'Legal Cases'],
        ...caseTrends.map(trend => [
          trend.month,
          trend.creditCases,
          trend.legalCases
        ]),
        [''],
        
        // Top Performers section
        ['Top Performers', ''],
        ['Name', 'Role', 'Performance', 'Cases Handled'],
        ...topPerformers.map(performer => [
          performer.name,
          performer.role,
          performer.performance,
          performer.casesHandled
        ]),
        [''],
        
        // Departments section
        ['Departments', ''],
        ['Name', 'Type', 'Status', 'Members', 'Cases'],
        ...departments.map(dept => [
          dept.name,
          dept.departmentType.replace("_", " ").toUpperCase(),
          dept.isActive ? 'Active' : 'Inactive',
          users.filter(u => u.department === dept._id).length,
          [...creditCases, ...legalCases].filter(c => c.department === dept._id).length
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
      a.download = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_dashboard_report.csv`;
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
      navigate(`/admin/cases?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCaseIcon = (caseType) => {
    switch (caseType) {
      case "credit_collection":
        return FaFileContract;
      case "legal":
        return FaGavel;
      case "corporate":
        return FaBuilding;
      case "criminal":
        return FaShieldAlt;
      case "civil":
        return FaFileContract;
      case "family":
        return FaFileContract;
      default:
        return FaFolderOpen;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
      case "filed":
        return "text-blue-500";
      case "assigned":
      case "in_progress":
      case "under_review":
      case "court_proceedings":
        return "text-yellow-500";
      case "resolved":
      case "closed":
        return "text-green-500";
      case "escalated":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading your dashboard...</p>
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
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search cases, users, documents..."
               className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
             />
                           <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 flex-shrink-0" />
           </form>
         </div>
       </div>

      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Welcome back, {user?.firstName}! 👋
        </h1>
            <p className="text-slate-300 text-lg sm:text-xl mt-2">
              Here's what's happening at {user?.lawFirm?.firmName || "your law firm"} today
            </p>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
        </p>
      </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={handleRefresh}
              disabled={refreshLoading}
              className="p-2 sm:p-3 bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 rounded-xl sm:rounded-2xl border border-slate-600/50 transition-all duration-300 hover:scale-105 group"
            >
              <FaSyncAlt className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-blue-400 transition-colors ${refreshLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => navigate('/admin/settings')}
              className="p-2 sm:p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl sm:rounded-2xl border border-slate-600/50 transition-all duration-300 hover:scale-105 group"
            >
              <FaCog className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-purple-400 transition-colors" />
            </button>
            <button 
              onClick={handleQuickAction}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25 text-sm sm:text-base"
            >
              <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Quick Action
            </button>
            </div>
          </div>
        </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Cases Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/admin/cases')}>
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
              <FaFolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Active Cases Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/admin/cases?status=active')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Active Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2 group-hover:text-yellow-400 transition-colors">{stats.activeCases}</p>
              <div className="flex items-center mt-2">
                <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mr-1" />
                <span className="text-yellow-500 text-xs sm:text-sm font-medium">
                  {stats.pendingCases} pending
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-yellow-500/30 transition-all duration-300">
              <FaClock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Resolved Cases Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/admin/cases?status=resolved')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Resolved Cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2 group-hover:text-green-400 transition-colors">{stats.resolvedCases}</p>
              <div className="flex items-center mt-2">
                <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-xs sm:text-sm font-medium">
                  {stats.totalCases > 0 ? Math.round((stats.resolvedCases / stats.totalCases) * 100) : 0}% success rate
                </span>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-green-500/30 transition-all duration-300">
              <FaCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Team Members</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-2 group-hover:text-purple-400 transition-colors">{stats.totalUsers}</p>
              <div className="flex items-center mt-2">
                <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 mr-1" />
                <span className="text-purple-500 text-xs sm:text-sm font-medium">
                  {stats.totalDepartments} departments
                </span>
              </div>
              </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-purple-500/30 transition-all duration-300">
              <FaUsers className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
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
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-slate-700/50 rounded-t-lg relative group cursor-pointer">
                  <div 
                    className="bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg transition-all duration-300 group-hover:from-blue-400 group-hover:to-indigo-400"
                    style={{ height: `${Math.max((trend.total / Math.max(...caseTrends.map(t => t.total))) * 160, 20)}px` }}
                  ></div>
                  <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {trend.total} cases
              </div>
            </div>
                <span className="text-slate-400 text-xs mt-2 text-center">{trend.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h3>
          <div className="space-y-2 sm:space-y-3">
            <button 
              onClick={handleNewCase}
              className="w-full p-3 sm:p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 rounded-xl sm:rounded-2xl text-left transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base">New Case</p>
                  <p className="text-xs sm:text-sm text-slate-400">Create a new case file</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleAddUser}
              className="w-full p-3 sm:p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 rounded-xl sm:rounded-2xl text-left transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <FaUserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base">Add User</p>
                  <p className="text-xs sm:text-sm text-slate-400">Invite team member</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleNewDepartment}
              className="w-full p-3 sm:p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-xl sm:rounded-2xl text-left transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <FaBuilding className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base">New Department</p>
                  <p className="text-xs sm:text-sm text-slate-400">Create department</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleGenerateReport}
              className="w-full p-3 sm:p-4 bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 border border-orange-500/30 rounded-xl sm:rounded-2xl text-left transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base">Generate Report</p>
                  <p className="text-xs sm:text-sm text-slate-400">View analytics</p>
              </div>
            </div>
            </button>
          </div>
        </div>
      </div>

      {/* Performance & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
        {/* Top Performers */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white">Top Performers</h3>
            <button 
              onClick={() => navigate('/admin/users')}
              className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {topPerformers.map((performer, index) => (
                             <div key={performer.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-700/30 rounded-xl sm:rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate(`/admin/users`)}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform text-sm sm:text-base">
                  {performer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors text-sm sm:text-base">{performer.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-400 truncate">{performer.email}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-1 sm:mt-2 gap-1">
                    <span className="text-xs sm:text-sm text-slate-300">
                      {performer.resolvedCases}/{performer.totalCases} cases
                    </span>
                    <span className={`text-xs sm:text-sm font-medium ${getPerformanceColor(performer.performance)}`}>
                      {performer.resolutionRate}% success
                      </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getPerformanceColor(performer.performance).replace('text-', 'bg-')}`}></div>
                    </div>
                  </div>
                ))}
              </div>
          </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h3>
            <button 
              onClick={() => navigate('/admin/cases')}
              className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
            >
              View All
            </button>
        </div>

          <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
            {recentActivity.map((activity, index) => (
                             <div key={`${activity.id}-${index}`} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-700/30 rounded-xl sm:rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate(`/admin/case/${activity.id}`)}>
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

      {/* Department Overview */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-white">Department Overview</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/admin/departments')}
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

        {/* Debug Information */}
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
          <h4 className="text-yellow-300 font-semibold mb-2">Debug Information</h4>
          <div className="text-sm text-yellow-200 space-y-1">
            <p>Users: {users.length} | Departments: {departments.length} | Credit Cases: {creditCases.length} | Legal Cases: {legalCases.length}</p>
            <p>Law Firm ID: {user?.lawFirm?._id || 'Not found'}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/50 shadow-2xl">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-white mb-2">Loading Department Data</h3>
                <p className="text-slate-400">
                  Please wait while we fetch your department information...
                </p>
              </div>
            </div>
          ) : departments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/50 shadow-2xl">
                <FaBuilding className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Departments Found</h3>
                <p className="text-slate-400 mb-6">
                  Create your first department to start organizing your team and cases.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate('/admin/departments')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Create Department
                  </button>
                  <button
                    onClick={() => {
                      console.log("🧪 Testing data structure...");
                      console.log("Current Redux state:", {
                        users: users,
                        departments: departments,
                        creditCases: creditCases,
                        legalCases: legalCases
                      });
                      
                      // Test individual API calls
                      console.log("🔄 Testing individual API calls...");
                      if (user?.lawFirm?._id) {
                        Promise.all([
                          dispatch(getUsers({ lawFirm: user.lawFirm._id, limit: 50 })),
                          dispatch(getDepartments({ lawFirm: user.lawFirm._id })),
                          dispatch(getCreditCases({ lawFirm: user.lawFirm._id, limit: 100 })),
                          dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
                        ]).then((results) => {
                          console.log("🔄 Manual API test results:", results);
                        }).catch((error) => {
                          console.error("❌ Manual API test error:", error);
                        });
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Debug Data
                  </button>
                </div>
              </div>
            </div>
          ) : (
            departments.map((dept) => {
              console.log("🏢 Processing department:", dept.name, "ID:", dept._id);
              
              // Fix filtering logic - handle both string and ObjectId comparisons
              const deptUsers = users.filter(u => {
                const userDept = u.department;
                const deptId = dept._id;
                
                // Handle both string and ObjectId comparisons
                if (typeof userDept === 'string' && typeof deptId === 'string') {
                  return userDept === deptId;
                } else if (typeof userDept === 'object' && userDept?._id) {
                  return userDept._id === deptId;
                } else if (typeof deptId === 'object' && deptId?._id) {
                  return userDept === deptId._id;
                }
                return false;
              });
              
              const deptCreditCases = creditCases.filter(c => {
                const caseDept = c.department;
                const deptId = dept._id;
                
                if (typeof caseDept === 'string' && typeof deptId === 'string') {
                  return caseDept === deptId;
                } else if (typeof caseDept === 'object' && caseDept?._id) {
                  return caseDept._id === deptId;
                } else if (typeof deptId === 'object' && deptId?._id) {
                  return caseDept === deptId._id;
                }
                return false;
              });
              
              const deptLegalCases = legalCases.filter(c => {
                const caseDept = c.department;
                const deptId = dept._id;
                
                if (typeof caseDept === 'string' && typeof deptId === 'string') {
                  return caseDept === deptId;
                } else if (typeof caseDept === 'object' && caseDept?._id) {
                  return caseDept._id === deptId;
                } else if (typeof deptId === 'object' && deptId?._id) {
                  return caseDept === deptId._id;
                }
                return false;
              });
              
              const allDeptCases = [...deptCreditCases, ...deptLegalCases];
              
              console.log("📊 Department data for", dept.name, ":", {
                users: deptUsers.length,
                creditCases: deptCreditCases.length,
                legalCases: deptLegalCases.length,
                totalCases: allDeptCases.length,
                sampleUser: users[0]?.department,
                sampleCreditCase: creditCases[0]?.department,
                sampleLegalCase: legalCases[0]?.department
              });
              
              // Enhanced debugging - show all data types and values
              console.log("🔍 Enhanced Debug for", dept.name, ":");
              console.log("  Department ID:", dept._id, "Type:", typeof dept._id);
              console.log("  All Users:", users.map(u => ({ id: u._id, dept: u.department, deptType: typeof u.department, hasDept: !!u.department })));
              console.log("  All Credit Cases:", creditCases.map(c => ({ id: c._id, dept: c.department, deptType: typeof c.department, hasDept: !!c.department })));
              console.log("  All Legal Cases:", legalCases.map(c => ({ id: c._id, dept: c.department, deptType: typeof c.department, hasDept: !!c.department })));
              console.log("  Filtered Users:", deptUsers.map(u => ({ id: u._id, dept: u.department })));
              console.log("  Filtered Credit Cases:", deptCreditCases.map(c => ({ id: c._id, dept: c.department })));
              console.log("  Filtered Legal Cases:", deptLegalCases.map(c => ({ id: c._id, dept: c.department })));
              
              // Check if users/cases have departments at all
              const usersWithDept = users.filter(u => u.department);
              const creditCasesWithDept = creditCases.filter(c => c.department);
              const legalCasesWithDept = legalCases.filter(c => c.department);
              
              console.log("📊 Department Assignment Summary:");
              console.log("  Users with departments:", usersWithDept.length, "out of", users.length);
              console.log("  Credit cases with departments:", creditCasesWithDept.length, "out of", creditCases.length);
              console.log("  Legal cases with departments:", legalCasesWithDept.length, "out of", legalCases.length);
            
            // Calculate department statistics
            const activeCases = allDeptCases.filter(c => 
              ["assigned", "in_progress", "under_review", "court_proceedings"].includes(c.status)
            );
            const resolvedCases = allDeptCases.filter(c => 
              ["resolved", "closed"].includes(c.status)
            );
            const pendingCases = allDeptCases.filter(c => 
              ["new", "filed"].includes(c.status)
            );
            const urgentCases = allDeptCases.filter(c => 
              c.priority === "high" || c.priority === "urgent"
            );
            
            // Calculate completion rate
            const completionRate = allDeptCases.length > 0 
              ? Math.round((resolvedCases.length / allDeptCases.length) * 100) 
              : 0;
            
            // Calculate this month's cases
            const thisMonth = new Date();
            thisMonth.setDate(1);
            const thisMonthCases = allDeptCases.filter(c => 
              new Date(c.createdAt) >= thisMonth
            );

            return (
              <div 
                key={dept._id} 
                className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer"
                onClick={() => navigate(`/admin/departments`)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                      {dept.departmentType === 'credit_collection' ? (
                        <FaFileContract className="w-5 h-5 text-blue-400" />
                      ) : (
                        <FaGavel className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors text-base sm:text-lg">
                        {dept.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-400">
                        {dept.departmentType.replace("_", " ").toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    dept.isActive 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <FaUsers className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-slate-400">Members</span>
                    </div>
                    <div className="text-lg font-bold text-white">{deptUsers.length}</div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <FaFolderOpen className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-slate-400">Total Cases</span>
                    </div>
                    <div className="text-lg font-bold text-white">{allDeptCases.length}</div>
                  </div>
                </div>

                {/* Case Status Breakdown */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active Cases</span>
                    <span className="text-blue-400 font-semibold">{activeCases.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Resolved</span>
                    <span className="text-green-400 font-semibold">{resolvedCases.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pending</span>
                    <span className="text-yellow-400 font-semibold">{pendingCases.length}</span>
                  </div>
                  {urgentCases.length > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Urgent</span>
                      <span className="text-red-400 font-semibold">{urgentCases.length}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Completion Rate</span>
                    <span className="text-white font-semibold">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* This Month's Activity */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">This Month</span>
                  <span className="text-purple-400 font-semibold">{thisMonthCases.length} new cases</span>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
