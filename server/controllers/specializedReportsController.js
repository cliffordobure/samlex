import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import LawFirm from "../models/LawFirm.js";
import { validateObjectId } from "../middleware/validation.js";
import { specializedReportGenerator } from "../utils/specializedReportGenerator.js";

/**
 * @desc    Generate specialized professional HTML report based on report type
 * @route   GET /api/reports/specialized/:lawFirmId/:reportType
 * @access  Private (law_firm_admin, system_owner, legal_head, credit_head, advocate, debt_collector)
 */
export const generateSpecializedReport = async (req, res) => {
  try {
    const { lawFirmId, reportType } = req.params;

    console.log("Generating specialized report:", reportType, "for law firm:", lawFirmId);

    // Validate law firm ID
    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format"
      });
    }

    // Check authorization based on report type
    const allowedRoles = getAllowedRoles(reportType);
    if (!allowedRoles.includes(req.user.role) && req.user.role !== "system_owner") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this report type"
      });
    }

    // Check law firm access
    if (req.user.role !== "system_owner" && 
        (!req.user.lawFirm || lawFirmId !== req.user.lawFirm._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm"
      });
    }

    // Get law firm details
    const lawFirm = await LawFirm.findById(lawFirmId);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found"
      });
    }

    console.log("Law firm found:", lawFirm.firmName);

    // Get specialized data based on report type
    const reportData = await getSpecializedReportData(lawFirmId, reportType, req.user);
    console.log("Specialized report data compiled for type:", reportType);

    // Generate specialized professional HTML report
    const htmlContent = await specializedReportGenerator.generateSpecializedReport(
      lawFirm, 
      reportData, 
      reportType
    );

    console.log("Specialized HTML report generated successfully, length:", htmlContent.length, "characters");

    // Set response headers for HTML
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${lawFirm.firmName.replace(/\s+/g, '_')}_${reportType}_Report.html"`);

    // Send HTML content
    res.send(htmlContent);

  } catch (error) {
    console.error("Error generating specialized report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate specialized report",
      error: error.message
    });
  }
};

/**
 * Get allowed roles for each report type
 */
const getAllowedRoles = (reportType) => {
  const roleMap = {
    'overview': ['law_firm_admin', 'system_owner'],
    'mycases': ['advocate', 'debt_collector', 'legal_head', 'credit_head', 'law_firm_admin', 'system_owner'],
    'legal-performance': ['legal_head', 'law_firm_admin', 'system_owner'],
    'debt-collection': ['credit_head', 'debt_collector', 'law_firm_admin', 'system_owner'],
    'revenue-analytics': ['law_firm_admin', 'system_owner'],
    'case-analysis': ['legal_head', 'credit_head', 'law_firm_admin', 'system_owner'],
    'financial': ['law_firm_admin', 'system_owner']
  };

  return roleMap[reportType] || ['law_firm_admin', 'system_owner'];
};

/**
 * Get specialized data based on report type
 */
const getSpecializedReportData = async (lawFirmId, reportType, user) => {
  try {
    console.log("Fetching specialized data for report type:", reportType);

    switch (reportType) {
      case 'overview':
        return await getOverviewData(lawFirmId);
      case 'mycases':
        return await getMyCasesData(lawFirmId, user);
      case 'legal-performance':
        return await getLegalPerformanceData(lawFirmId);
      case 'debt-collection':
        return await getDebtCollectionData(lawFirmId);
      case 'revenue-analytics':
        return await getRevenueAnalyticsData(lawFirmId);
      case 'case-analysis':
        return await getCaseAnalysisData(lawFirmId);
      case 'financial':
        return await getFinancialData(lawFirmId);
      default:
        return await getOverviewData(lawFirmId);
    }
  } catch (error) {
    console.error("Error getting specialized report data:", error);
    return getDefaultReportData();
  }
};

/**
 * Get overview data (existing comprehensive data)
 */
const getOverviewData = async (lawFirmId) => {
  const [users, departments, creditCases, legalCases] = await Promise.all([
    User.find({ lawFirm: lawFirmId }).lean(),
    Department.find({ lawFirm: lawFirmId }).lean(),
    CreditCase.find({ lawFirm: lawFirmId }).lean(),
    LegalCase.find({ lawFirm: lawFirmId }).lean()
  ]);

  // Calculate department performance
  const departmentPerformance = departments.map(dept => {
    const deptUsers = users.filter(u => 
      u.department && u.department.toString() === dept._id.toString()
    );
    
    const deptCreditCases = creditCases.filter(c => 
      c.department && c.department.toString() === dept._id.toString()
    );
    
    const deptLegalCases = legalCases.filter(c => 
      c.department && c.department.toString() === dept._id.toString()
    );

    const allDeptCases = [...deptCreditCases, ...deptLegalCases];
    const resolvedCases = allDeptCases.filter(c => 
      ['resolved', 'closed'].includes(c.status)
    );

    return {
      ...dept,
      memberCount: deptUsers.length,
      caseCount: allDeptCases.length,
      resolvedCases: resolvedCases.length,
      completionRate: allDeptCases.length > 0 ? 
        Math.round((resolvedCases.length / allDeptCases.length) * 100) : 0
    };
  });

  // Get recent activity
  const allCases = [...creditCases, ...legalCases];
  const recentActivity = allCases
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 20)
    .map(caseItem => ({
      date: new Date(caseItem.updatedAt || caseItem.createdAt).toLocaleDateString(),
      type: caseItem.caseType || 'Case',
      description: caseItem.title || 'No title',
      status: caseItem.status || 'Unknown'
    }));

  // Get top performers
  const userStats = {};
  allCases.forEach(caseItem => {
    if (caseItem.assignedTo) {
      const userId = caseItem.assignedTo.toString();
      if (!userStats[userId]) {
        userStats[userId] = { resolved: 0, total: 0 };
      }
      userStats[userId].total++;
      if (['resolved', 'closed'].includes(caseItem.status)) {
        userStats[userId].resolved++;
      }
    }
  });

  const topPerformers = Object.entries(userStats)
    .map(([userId, stats]) => {
      const user = users.find(u => u._id.toString() === userId);
      if (!user) return null;
      
      const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;
      return {
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        resolvedCases: stats.resolved,
        totalCases: stats.total,
        resolutionRate: Math.round(resolutionRate * 100) / 100
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.resolutionRate - a.resolutionRate)
    .slice(0, 10);

  // Calculate comprehensive revenue from all sources
  const paidLegalCases = legalCases.filter(c => c.filingFee && c.filingFee.paid === true);
  const filingFees = paidLegalCases.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0);
  
  const resolvedCreditCases = creditCases.filter(c => c.status === 'resolved');
  const moneyRecovered = resolvedCreditCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
  
  const totalRevenue = filingFees + moneyRecovered;

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    totalDepartments: departments.length,
    totalCreditCases: creditCases.length,
    totalLegalCases: legalCases.length,
    escalatedCases: creditCases.filter(c => c.status === 'escalated_to_legal').length,
    pendingCases: allCases.filter(c => ['new', 'pending_assignment'].includes(c.status)).length,
    resolvedCases: allCases.filter(c => ['resolved', 'closed'].includes(c.status)).length,
    totalRevenue: totalRevenue,
    departments: departmentPerformance,
    recentActivity,
    topPerformers
  };
};

/**
 * Get my cases data
 */
const getMyCasesData = async (lawFirmId, user) => {
  const [creditCases, legalCases] = await Promise.all([
    CreditCase.find({ lawFirm: lawFirmId, assignedTo: user._id }).lean(),
    LegalCase.find({ lawFirm: lawFirmId, assignedTo: user._id }).lean()
  ]);

  const allMyCases = [...creditCases, ...legalCases];
  const activeCases = allMyCases.filter(c => !['resolved', 'closed'].includes(c.status));
  const completedCases = allMyCases.filter(c => ['resolved', 'closed'].includes(c.status));
  
  // Calculate overdue cases (cases past due date)
  const now = new Date();
  const overdueCases = allMyCases.filter(c => {
    if (!c.dueDate) return false;
    return new Date(c.dueDate) < now && !['resolved', 'closed'].includes(c.status);
  });

  // Calculate cases due this week
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const dueThisWeek = allMyCases.filter(c => {
    if (!c.dueDate) return false;
    const dueDate = new Date(c.dueDate);
    return dueDate >= now && dueDate <= nextWeek && !['resolved', 'closed'].includes(c.status);
  });

  const successRate = allMyCases.length > 0 ? 
    Math.round((completedCases.length / allMyCases.length) * 100) : 0;

  return {
    totalAssignedCases: allMyCases.length,
    activeCases: activeCases.length,
    completedCases: completedCases.length,
    overdueCases: overdueCases.length,
    dueThisWeek: dueThisWeek.length,
    successRate,
    myCases: allMyCases.slice(0, 20), // Recent cases
    caseStatusBreakdown: {
      new: allMyCases.filter(c => c.status === 'new').length,
      inProgress: allMyCases.filter(c => ['assigned', 'under_review'].includes(c.status)).length,
      resolved: completedCases.length,
      overdue: overdueCases.length
    }
  };
};

/**
 * Get legal performance data
 */
const getLegalPerformanceData = async (lawFirmId) => {
  const [legalCases, users] = await Promise.all([
    LegalCase.find({ lawFirm: lawFirmId }).lean(),
    User.find({ lawFirm: lawFirmId, role: { $in: ['legal_head', 'advocate'] } }).lean()
  ]);

  const resolvedCases = legalCases.filter(c => ['resolved', 'closed'].includes(c.status));
  const resolutionRate = legalCases.length > 0 ? 
    Math.round((resolvedCases.length / legalCases.length) * 100) : 0;

  // Calculate average resolution time
  const avgResolutionTime = resolvedCases.length > 0 ? 
    Math.round(resolvedCases.reduce((sum, c) => {
      const created = new Date(c.createdAt);
      const resolved = new Date(c.updatedAt);
      return sum + (resolved - created) / (1000 * 60 * 60 * 24);
    }, 0) / resolvedCases.length) : 0;

  return {
    totalLegalCases: legalCases.length,
    resolvedCases: resolvedCases.length,
    resolutionRate,
    avgResolutionTime,
    clientSatisfaction: 85, // Placeholder
    revenueGenerated: resolvedCases.length * 1500, // Placeholder calculation
    legalTeamPerformance: users.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      casesAssigned: legalCases.filter(c => c.assignedTo && c.assignedTo.toString() === user._id.toString()).length,
      casesResolved: legalCases.filter(c => c.assignedTo && c.assignedTo.toString() === user._id.toString() && ['resolved', 'closed'].includes(c.status)).length
    })),
    caseTypeAnalysis: {
      civil: legalCases.filter(c => c.caseType === 'civil').length,
      criminal: legalCases.filter(c => c.caseType === 'criminal').length,
      corporate: legalCases.filter(c => c.caseType === 'corporate').length,
      family: legalCases.filter(c => c.caseType === 'family').length
    },
    legalTrends: {
      monthlyCases: [5, 8, 6, 10, 7, 9], // Placeholder
      resolutionTrend: [70, 75, 80, 78, 82, 85] // Placeholder
    }
  };
};

/**
 * Get debt collection data
 */
const getDebtCollectionData = async (lawFirmId) => {
  const [creditCases, users] = await Promise.all([
    CreditCase.find({ lawFirm: lawFirmId }).lean(),
    User.find({ lawFirm: lawFirmId, role: { $in: ['credit_head', 'debt_collector'] } }).lean()
  ]);

  const collectedCases = creditCases.filter(c => c.status === 'resolved');
  const collectionRate = creditCases.length > 0 ? 
    Math.round((collectedCases.length / creditCases.length) * 100) : 0;

  const totalAmountCollected = collectedCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
  const outstandingAmount = creditCases
    .filter(c => !['resolved', 'closed'].includes(c.status))
    .reduce((sum, c) => sum + (c.debtAmount || 0), 0);

  const escalatedToLegal = creditCases.filter(c => c.status === 'escalated_to_legal').length;

  return {
    totalCreditCases: creditCases.length,
    collectedCases: collectedCases.length,
    collectionRate,
    totalAmountCollected,
    outstandingAmount,
    escalatedToLegal,
    debtCollectorPerformance: users.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      casesAssigned: creditCases.filter(c => c.assignedTo && c.assignedTo.toString() === user._id.toString()).length,
      casesCollected: creditCases.filter(c => c.assignedTo && c.assignedTo.toString() === user._id.toString() && c.status === 'resolved').length
    })),
    collectionTrends: {
      monthlyCollections: [10, 12, 8, 15, 11, 13], // Placeholder
      collectionRate: [60, 65, 70, 68, 72, 75] // Placeholder
    },
    paymentAnalysis: {
      onTime: creditCases.filter(c => c.paymentStatus === 'on_time').length,
      overdue: creditCases.filter(c => c.paymentStatus === 'overdue').length,
      partial: creditCases.filter(c => c.paymentStatus === 'partial').length
    }
  };
};

/**
 * Get revenue analytics data
 */
const getRevenueAnalyticsData = async (lawFirmId) => {
  const [creditCases, legalCases, payments] = await Promise.all([
    CreditCase.find({ lawFirm: lawFirmId }).lean(),
    LegalCase.find({ lawFirm: lawFirmId }).lean(),
    Payment.find({ lawFirm: lawFirmId, status: "completed" }).lean()
  ]);

        // 1. Filing Fees - from paid legal cases
        const paidLegalCases = legalCases.filter(c => c.filingFee && c.filingFee.paid === true);
        const filingFees = paidLegalCases.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0);
        
        console.log("=== SPECIALIZED REVENUE DEBUG ===");
        console.log("Total Legal Cases:", legalCases.length);
        console.log("Cases with Filing Fees:", legalCases.filter(c => c.filingFee).length);
        console.log("Paid Filing Fee Cases:", paidLegalCases.length);
        paidLegalCases.forEach((caseItem, index) => {
          console.log(`Paid Case ${index + 1}:`, {
            title: caseItem.title,
            caseNumber: caseItem.caseNumber,
            filingFeeAmount: caseItem.filingFee.amount,
            filingFeePaid: caseItem.filingFee.paid
          });
        });
        console.log("Total Filing Fees:", filingFees);
        console.log("==============================");

  // 2. Money Recovered - from resolved credit cases (debt amount recovered)
  const resolvedCreditCases = creditCases.filter(c => c.status === 'resolved');
  const moneyRecovered = resolvedCreditCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);

  // 3. Escalation Fees - from payments with escalation_fee purpose
  const escalationFees = payments
    .filter(p => p.purpose === 'escalation_fee')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // 4. Service Charges - from payments with service_charge purpose
  const serviceCharges = payments
    .filter(p => p.purpose === 'service_charge')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // 5. Consultation Fees - from payments with consultation purpose
  const consultationFees = payments
    .filter(p => p.purpose === 'consultation')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // 6. Subscription Fees - from payments with subscription purpose
  const subscriptionFees = payments
    .filter(p => p.purpose === 'subscription')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Total Revenue - ALL revenue sources
  const totalRevenue = filingFees + moneyRecovered + escalationFees + serviceCharges + consultationFees + subscriptionFees;

  // Calculate monthly revenue (placeholder)
  const monthlyRevenue = Math.round(totalRevenue / 12);
  const revenueGrowth = 15; // Placeholder percentage

  const avgCaseValue = (resolvedCreditCases.length + resolvedLegalCases.length) > 0 ? 
    Math.round(totalRevenue / (resolvedCreditCases.length + resolvedLegalCases.length)) : 0;

  return {
    totalRevenue,
    monthlyRevenue,
    revenueGrowth,
    avgCaseValue,
    filingFees,
    moneyRecovered,
    escalationFees,
    serviceCharges,
    consultationFees,
    subscriptionFees,
    revenueBreakdown: {
      filingFees: filingFees,
      moneyRecovered: moneyRecovered,
      escalationFees: escalationFees,
      serviceCharges: serviceCharges,
      consultationFees: consultationFees,
      subscriptionFees: subscriptionFees
    },
    revenueTrends: {
      monthlyRevenue: [12000, 15000, 13000, 18000, 16000, 17000], // Placeholder
      growthRate: [5, 8, 12, 15, 18, 15] // Placeholder
    },
    revenueSources: {
      filingFees: filingFees,
      moneyRecovered: moneyRecovered,
      escalationFees: escalationFees,
      serviceCharges: serviceCharges,
      consultationFees: consultationFees,
      subscriptionFees: subscriptionFees
    }
  };
};

/**
 * Get case analysis data
 */
const getCaseAnalysisData = async (lawFirmId) => {
  const [creditCases, legalCases] = await Promise.all([
    CreditCase.find({ lawFirm: lawFirmId }).lean(),
    LegalCase.find({ lawFirm: lawFirmId }).lean()
  ]);

  const allCases = [...creditCases, ...legalCases];
  const newCases = allCases.filter(c => c.status === 'new');
  const inProgressCases = allCases.filter(c => ['assigned', 'under_review', 'pending_assignment'].includes(c.status));
  const resolvedCases = allCases.filter(c => c.status === 'resolved');
  const closedCases = allCases.filter(c => c.status === 'closed');

  // Calculate average case duration
  const completedCases = [...resolvedCases, ...closedCases];
  const avgCaseDuration = completedCases.length > 0 ? 
    Math.round(completedCases.reduce((sum, c) => {
      const created = new Date(c.createdAt);
      const completed = new Date(c.updatedAt);
      return sum + (completed - created) / (1000 * 60 * 60 * 24);
    }, 0) / completedCases.length) : 0;

  return {
    totalCases: allCases.length,
    newCases: newCases.length,
    inProgressCases: inProgressCases.length,
    resolvedCases: resolvedCases.length,
    closedCases: closedCases.length,
    avgCaseDuration,
    caseStatusDistribution: {
      new: newCases.length,
      inProgress: inProgressCases.length,
      resolved: resolvedCases.length,
      closed: closedCases.length
    },
    caseTypeBreakdown: {
      credit: creditCases.length,
      legal: legalCases.length
    },
    caseTimeline: {
      created: allCases.filter(c => {
        const created = new Date(c.createdAt);
        const now = new Date();
        return (now - created) <= (30 * 24 * 60 * 60 * 1000); // Last 30 days
      }).length,
      resolved: completedCases.filter(c => {
        const resolved = new Date(c.updatedAt);
        const now = new Date();
        return (now - resolved) <= (30 * 24 * 60 * 60 * 1000); // Last 30 days
      }).length
    }
  };
};

/**
 * Get financial data
 */
const getFinancialData = async (lawFirmId) => {
  const [creditCases, legalCases] = await Promise.all([
    CreditCase.find({ lawFirm: lawFirmId }).lean(),
    LegalCase.find({ lawFirm: lawFirmId }).lean()
  ]);

  const totalRevenue = getRevenueAnalyticsData(lawFirmId).then(data => data.totalRevenue);
  const totalExpenses = 50000; // Placeholder
  const netProfit = (await totalRevenue) - totalExpenses;
  const profitMargin = (await totalRevenue) > 0 ? Math.round((netProfit / (await totalRevenue)) * 100) : 0;
  const cashFlow = netProfit; // Simplified
  const outstandingInvoices = 15000; // Placeholder

  return {
    totalRevenue: await totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    cashFlow,
    outstandingInvoices,
    expenseBreakdown: {
      salaries: Math.round(totalExpenses * 0.4),
      officeRent: Math.round(totalExpenses * 0.15),
      utilities: Math.round(totalExpenses * 0.1),
      supplies: Math.round(totalExpenses * 0.1),
      other: Math.round(totalExpenses * 0.25)
    },
    financialTrends: {
      monthlyRevenue: [15000, 18000, 16000, 20000, 17000, 19000], // Placeholder
      monthlyExpenses: [45000, 48000, 46000, 50000, 47000, 49000] // Placeholder
    },
    profitabilityAnalysis: {
      grossProfit: netProfit,
      operatingProfit: Math.round(netProfit * 0.8),
      netProfitMargin: profitMargin
    }
  };
};

/**
 * Get default report data when there's an error
 */
const getDefaultReportData = () => {
  return {
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    totalCreditCases: 0,
    totalLegalCases: 0,
    escalatedCases: 0,
    pendingCases: 0,
    resolvedCases: 0,
    departments: [],
    recentActivity: [],
    topPerformers: []
  };
};
