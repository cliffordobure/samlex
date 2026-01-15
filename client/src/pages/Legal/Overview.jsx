import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getLegalCases, getPendingAssignmentCases, getLegalCaseStatistics } from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import reportsApi from "../../store/api/reportsApi";
import socket from "../../utils/socket";
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
    // Payment statistics
    totalMoneyCollected: 0,
    totalMoneyPending: 0,
    totalFeeAmount: 0,
    paymentCompletionRate: 0,
    averagePaymentAmount: 0,
    totalPaymentsCount: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [topAdvocates, setTopAdvocates] = useState([]);
  const [caseTrends, setCaseTrends] = useState([
    { month: "Apr 2025", civilCases: 2, criminalCases: 1, corporateCases: 3, familyCases: 1, total: 7 },
    { month: "May 2025", civilCases: 3, criminalCases: 2, corporateCases: 2, familyCases: 2, total: 9 },
    { month: "Jun 2025", civilCases: 1, criminalCases: 1, corporateCases: 4, familyCases: 1, total: 7 },
    { month: "Jul 2025", civilCases: 4, criminalCases: 1, corporateCases: 1, familyCases: 3, total: 9 },
    { month: "Aug 2025", civilCases: 2, criminalCases: 3, corporateCases: 2, familyCases: 2, total: 9 },
    { month: "Sep 2025", civilCases: 3, criminalCases: 2, corporateCases: 3, familyCases: 1, total: 9 }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Initialize chart data immediately on component mount
  useEffect(() => {
    console.log("=== DEBUG: Initial chart generation ===");
    generateCaseTrends();
  }, []);

  useEffect(() => {
    console.log("=== DEBUG: Overview useEffect ===");
    console.log("User:", user);
    console.log("User role:", user?.role);
    console.log("User lawFirm:", user?.lawFirm?._id);
    console.log("User ID:", user?._id);
    
    if (user?.lawFirm?._id) {
      setIsLoading(true);
      
      // For advocates, only fetch their assigned cases
      if (user.role === 'advocate') {
        console.log("Loading cases for advocate - assignedTo:", user._id);
        Promise.all([
          dispatch(getLegalCases({ 
            lawFirm: user.lawFirm._id, 
            assignedTo: user._id,
            limit: 100 
          })),
        ]).finally(() => setIsLoading(false));
      } else {
        console.log("Loading cases for legal head/admin - lawFirm:", user.lawFirm._id);
        // For legal_head and law_firm_admin, fetch all data
        Promise.all([
          dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
          dispatch(getUsers({ lawFirm: user.lawFirm._id, role: "advocate", limit: 50 })),
          dispatch(getPendingAssignmentCases()),
        ]).finally(() => setIsLoading(false));
      }
    }
  }, [dispatch, user?.lawFirm?._id, user?.role, user?._id]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!user?.lawFirm?._id) return;

    const refetchCases = () => {
      setIsLoading(true);
      if (user.role === 'advocate') {
        Promise.all([
          dispatch(getLegalCases({ 
            lawFirm: user.lawFirm._id, 
            assignedTo: user._id,
            limit: 100 
          })),
        ]).finally(() => setIsLoading(false));
      } else {
        Promise.all([
          dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
          dispatch(getUsers({ lawFirm: user.lawFirm._id, role: "advocate", limit: 50 })),
          dispatch(getPendingAssignmentCases()),
        ]).finally(() => setIsLoading(false));
      }
    };

    socket.on("legalCaseAssigned", refetchCases);
    socket.on("legalCaseStatusUpdated", refetchCases);
    socket.on("legalCaseCreated", refetchCases);

    return () => {
      socket.off("legalCaseAssigned", refetchCases);
      socket.off("legalCaseStatusUpdated", refetchCases);
      socket.off("legalCaseCreated", refetchCases);
    };
  }, [dispatch, user?.lawFirm?._id, user?.role, user?._id]);

  useEffect(() => {
    console.log("=== DEBUG: Overview cases processing useEffect ===");
    console.log("Cases:", cases);
    console.log("Cases length:", cases?.length);
    console.log("Users:", users);
    console.log("Users length:", users?.length);
    console.log("Current caseTrends before generateCaseTrends:", caseTrends);
    
    // Always generate case trends, even if no cases exist
    generateCaseTrends();
    
    if (cases.length > 0 || users.length > 0) {
      console.log("Processing cases and users data...");
      calculateStats();
      generateRecentActivity();
      generateTopAdvocates();
    } else {
      console.log("No cases or users data available yet - using sample data for trends");
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

    // Calculate payment statistics
    let totalMoneyCollected = 0;
    let totalFeeAmount = 0;
    let totalPaymentsCount = 0;
    
    userCases.forEach((legalCase) => {
      // Sum up all payments from the payments array
      if (legalCase.payments && Array.isArray(legalCase.payments)) {
        legalCase.payments.forEach((payment) => {
          totalMoneyCollected += payment.amount || 0;
          totalPaymentsCount += 1;
        });
      }
      
      // Sum up total fees (if totalFee is set)
      if (legalCase.totalFee && legalCase.totalFee.amount) {
        totalFeeAmount += legalCase.totalFee.amount;
      } else if (legalCase.filingFee && legalCase.filingFee.amount) {
        // Fallback to filing fee if totalFee is not set
        totalFeeAmount += legalCase.filingFee.amount;
      }
    });
    
    const totalMoneyPending = totalFeeAmount - totalMoneyCollected;
    const paymentCompletionRate = totalFeeAmount > 0 ? (totalMoneyCollected / totalFeeAmount) * 100 : 0;
    const averagePaymentAmount = totalPaymentsCount > 0 ? totalMoneyCollected / totalPaymentsCount : 0;

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
      totalMoneyCollected: Math.round(totalMoneyCollected * 100) / 100,
      totalMoneyPending: Math.round(totalMoneyPending * 100) / 100,
      totalFeeAmount: Math.round(totalFeeAmount * 100) / 100,
      paymentCompletionRate: Math.round(paymentCompletionRate * 100) / 100,
      averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
      totalPaymentsCount,
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
    console.log("=== DEBUG: generateCaseTrends START ===");
    console.log("Cases:", cases);
    console.log("Cases length:", cases?.length);
    console.log("Current caseTrends:", caseTrends);
    
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }

    if (!cases || cases.length === 0) {
      console.log("No cases available - generating sample data for demonstration");
      
      const sampleTrends = months.map((month, index) => ({
        month,
        civilCases: Math.floor(Math.random() * 4) + 1,
        criminalCases: Math.floor(Math.random() * 3) + 1,
        corporateCases: Math.floor(Math.random() * 4) + 1,
        familyCases: Math.floor(Math.random() * 3) + 1,
        laborCases: Math.floor(Math.random() * 2) + 1,
        debtCollectionCases: Math.floor(Math.random() * 3) + 1,
        total: Math.floor(Math.random() * 8) + 4,
      }));

      console.log("Generated sample trends:", sampleTrends);
      setCaseTrends(sampleTrends);
      console.log("=== DEBUG: generateCaseTrends END (sample) ===");
      return;
    }

    console.log("Processing real cases data...");
    console.log("Sample case structure:", cases[0]);
    
    const trends = months.map(month => {
      console.log(`\n--- Processing month: ${month} ---`);
      
      const monthCases = cases.filter(c => {
        const caseDate = new Date(c.createdAt);
        const caseMonth = caseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        console.log(`Case ${c.caseNumber || c._id}: createdAt=${c.createdAt}, caseMonth=${caseMonth}, targetMonth=${month}, match=${caseMonth === month}`);
        return caseMonth === month;
      });

      console.log(`Found ${monthCases.length} cases for ${month}:`, monthCases.map(c => ({
        caseNumber: c.caseNumber || c._id,
        caseType: c.caseType,
        createdAt: c.createdAt
      })));

      const civilCases = monthCases.filter(c => c.caseType === "civil").length;
      const criminalCases = monthCases.filter(c => c.caseType === "criminal").length;
      const corporateCases = monthCases.filter(c => c.caseType === "corporate").length;
      const familyCases = monthCases.filter(c => c.caseType === "family").length;
      const laborCases = monthCases.filter(c => c.caseType === "labor").length;
      const debtCollectionCases = monthCases.filter(c => c.caseType === "debt_collection").length;

      console.log(`${month} Results: Civil=${civilCases}, Criminal=${criminalCases}, Corporate=${corporateCases}, Family=${familyCases}, Labor=${laborCases}, DebtCollection=${debtCollectionCases}, Total=${monthCases.length}`);

      return {
        month,
        civilCases,
        criminalCases,
        corporateCases,
        familyCases,
        laborCases,
        debtCollectionCases,
        total: monthCases.length,
      };
    });

    console.log("Generated real trends:", trends);
    setCaseTrends(trends);
    console.log("=== DEBUG: generateCaseTrends END (real) ===");
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
      // Use the specialized my cases report for legal overview
      const response = await reportsApi.downloadSpecializedReport(user.lawFirm._id, "mycases");
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
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
        a.download = `${user.lawFirm.firmName.replace(/\s+/g, "_")}_Simple_Legal_Dashboard_Report.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      // Clean up after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Error downloading simple legal dashboard report:", error);
      alert("Failed to download simple legal dashboard report. Please try again.");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
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

      {/* Payment Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Money Collected Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/reports')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-slate-400 text-xs font-medium mb-1">Money Collected</p>
              <p className="text-base sm:text-lg font-bold text-white group-hover:text-green-400 transition-colors truncate">
                {formatCurrency(stats.totalMoneyCollected)}
              </p>
              <div className="flex items-center mt-1">
                <FaCheckCircle className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                <span className="text-green-500 text-xs font-medium truncate">
                  {stats.totalPaymentsCount} payments
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-all duration-300 flex-shrink-0">
              <FaCheckCircle className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Money Pending Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/reports')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-slate-400 text-xs font-medium mb-1">Money Pending</p>
              <p className="text-base sm:text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                {formatCurrency(stats.totalMoneyPending)}
              </p>
              <div className="flex items-center mt-1">
                <FaClock className="w-3 h-3 text-orange-500 mr-1 flex-shrink-0" />
                <span className="text-orange-500 text-xs font-medium truncate">
                  Awaiting payment
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-all duration-300 flex-shrink-0">
              <FaClock className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Total Fee Amount Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/reports')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-slate-400 text-xs font-medium mb-1">Total Fee Amount</p>
              <p className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                {formatCurrency(stats.totalFeeAmount)}
              </p>
              <div className="flex items-center mt-1">
                <FaFileInvoiceDollar className="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" />
                <span className="text-blue-500 text-xs font-medium truncate">
                  Expected total
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-all duration-300 flex-shrink-0">
              <FaFileInvoiceDollar className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Payment Completion Rate Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-teal-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/reports')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-slate-400 text-xs font-medium mb-1">Payment Progress</p>
              <p className="text-base sm:text-lg font-bold text-white group-hover:text-teal-400 transition-colors truncate">
                {stats.paymentCompletionRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-1">
                <FaChartLine className="w-3 h-3 text-teal-500 mr-1 flex-shrink-0" />
                <span className="text-teal-500 text-xs font-medium truncate">
                  Collection rate
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-teal-500/30 transition-all duration-300 flex-shrink-0">
              <FaChartLine className="w-4 h-4 text-teal-400 group-hover:text-teal-300 transition-colors" />
            </div>
          </div>
        </div>

        {/* Average Payment Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => navigate('/legal/reports')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-slate-400 text-xs font-medium mb-1">Avg Payment</p>
              <p className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                {formatCurrency(stats.averagePaymentAmount)}
              </p>
              <div className="flex items-center mt-1">
                <FaChartPie className="w-3 h-3 text-indigo-500 mr-1 flex-shrink-0" />
                <span className="text-indigo-500 text-xs font-medium truncate">
                  Per payment
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition-all duration-300 flex-shrink-0">
              <FaChartPie className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-white">Recent Cases</h3>
            <Link 
              to="/legal/cases" 
              className="px-3 py-1.5 bg-blue-600/50 hover:bg-blue-500/50 text-blue-200 text-xs rounded-lg transition-colors"
            >
              View All Cases
            </Link>
          </div>
          
          <div className="space-y-3">
            {cases && cases.length > 0 ? (
              cases.slice(0, 6).map((caseItem) => (
                <div key={caseItem._id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      caseItem.status === 'active' ? 'bg-green-500' :
                      caseItem.status === 'pending' ? 'bg-yellow-500' :
                      caseItem.status === 'completed' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">{caseItem.title}</h4>
                      <p className="text-xs text-slate-400">
                        {caseItem.caseType} • {caseItem.caseNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {caseItem.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaFileAlt className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm mb-2">No cases found</p>
                <p className="text-slate-500 text-xs">Create your first case to get started</p>
                <button
                  onClick={handleNewCase}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Create Case
                </button>
              </div>
            )}
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
