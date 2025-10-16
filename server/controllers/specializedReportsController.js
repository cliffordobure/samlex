import mongoose from "mongoose";
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
    console.log("Report data:", JSON.stringify(reportData, null, 2));

    // Generate specialized professional HTML report
    const htmlContent = await specializedReportGenerator.generateSpecializedReport(
      lawFirm, 
      reportData, 
      reportType,
      req.user
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
    'legal-performance': ['advocate', 'legal_head', 'law_firm_admin', 'system_owner'],
    'debt-collection': ['credit_head', 'debt_collector', 'advocate', 'legal_head', 'law_firm_admin', 'system_owner'], // Added advocate and legal_head
    'revenue-analytics': ['law_firm_admin', 'system_owner'],
    'case-analysis': ['advocate', 'legal_head', 'credit_head', 'law_firm_admin', 'system_owner'],
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
        return await getLegalPerformanceData(lawFirmId, user);
      case 'debt-collection':
        return await getDebtCollectionData(lawFirmId, user);
      case 'revenue-analytics':
        return await getRevenueAnalyticsData(lawFirmId);
      case 'case-analysis':
        return await getCaseAnalysisData(lawFirmId);
      case 'financial':
        return await getFinancialData(lawFirmId);
      case 'performance-metrics':
        return await getPerformanceMetricsData(lawFirmId, user);
      case 'monthly-trends':
        return await getMonthlyTrendsData(lawFirmId, user);
      case 'promised-payments':
        return await getPromisedPaymentsData(lawFirmId, user);
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
  console.log(`🔍 Fetching overview data for law firm: ${lawFirmId}`);
  
  // Validate law firm exists
  const lawFirm = await LawFirm.findById(lawFirmId);
  if (!lawFirm) {
    console.error(`❌ Law firm not found: ${lawFirmId}`);
    throw new Error(`Law firm not found: ${lawFirmId}`);
  }
  
  console.log(`✅ Law firm found: ${lawFirm.firmName}`);
  
  const [users, departments, creditCases, legalCases] = await Promise.all([
    User.find({ lawFirm: lawFirmId }).lean(),
    Department.find({ lawFirm: lawFirmId }).lean(),
    CreditCase.find({ lawFirm: lawFirmId }).lean(),
    LegalCase.find({ lawFirm: lawFirmId }).lean()
  ]);
  
  console.log(`📊 Raw data counts:`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Departments: ${departments.length}`);
  console.log(`- Credit Cases: ${creditCases.length}`);
  console.log(`- Legal Cases: ${legalCases.length}`);

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

  // Get recent activity - show more items and better data
  const allCases = [...creditCases, ...legalCases];
  const recentActivity = allCases
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 50) // Increased from 20 to 50
    .map(caseItem => ({
      date: new Date(caseItem.updatedAt || caseItem.createdAt).toLocaleDateString(),
      type: caseItem.caseType || (creditCases.includes(caseItem) ? 'Credit Collection' : 'Legal'),
      description: caseItem.title || caseItem.caseNumber || 'No title',
      status: caseItem.status || 'Unknown'
    }));
  
  console.log(`📈 Recent activity items: ${recentActivity.length}`);

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

  // Calculate final statistics with detailed logging
  const finalStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive !== false).length, // Changed to include users without isActive field
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
  
  console.log(`📊 Final statistics:`);
  console.log(`- Total Users: ${finalStats.totalUsers}`);
  console.log(`- Active Users: ${finalStats.activeUsers}`);
  console.log(`- Total Credit Cases: ${finalStats.totalCreditCases}`);
  console.log(`- Total Legal Cases: ${finalStats.totalLegalCases}`);
  console.log(`- Escalated Cases: ${finalStats.escalatedCases}`);
  console.log(`- Pending Cases: ${finalStats.pendingCases}`);
  console.log(`- Resolved Cases: ${finalStats.resolvedCases}`);
  console.log(`- Total Revenue: ${finalStats.totalRevenue}`);
  console.log(`- Departments: ${finalStats.departments.length}`);
  console.log(`- Top Performers: ${finalStats.topPerformers.length}`);
  
  return finalStats;
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
 * Get legal performance data with actual filing fees
 * For advocates, only show their assigned cases
 */
const getLegalPerformanceData = async (lawFirmId, user = null) => {
  // Build match condition based on user role
  let matchCondition = { lawFirm: lawFirmId };
  
  // If user is an advocate, only show their assigned cases
  if (user && user.role === "advocate") {
    matchCondition.assignedTo = user._id;
    console.log(`🔍 Filtering cases for advocate: ${user.firstName} ${user.lastName} (${user._id})`);
  }

  const [legalCases, users] = await Promise.all([
    LegalCase.find(matchCondition).lean(),
    User.find({ lawFirm: lawFirmId, role: { $in: ['legal_head', 'advocate'] } }).lean()
  ]);

  console.log(`📋 Found ${legalCases.length} legal cases for ${user?.role === 'advocate' ? 'advocate' : 'law firm'}`);

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

  // Calculate actual revenue from filing fees (only for assigned cases)
  const totalFilingFees = legalCases.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0);
  const paidFilingFees = legalCases.reduce((sum, c) => 
    sum + (c.filingFee?.paid ? (c.filingFee?.amount || 0) : 0), 0
  );

  console.log(`💰 Revenue calculation: Total KES ${totalFilingFees.toLocaleString()}, Paid KES ${paidFilingFees.toLocaleString()}`);

  return {
    totalLegalCases: legalCases.length,
    resolvedCases: resolvedCases.length,
    resolutionRate,
    avgResolutionTime,
    clientSatisfaction: 85, // Placeholder
    revenueGenerated: totalFilingFees, // Use actual filing fees for assigned cases only
    paidRevenue: paidFilingFees,
    pendingRevenue: totalFilingFees - paidFilingFees,
    legalTeamPerformance: users.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      casesAssigned: legalCases.filter(c => c.assignedTo && c.assignedTo.toString() === user._id.toString()).length,
      casesResolved: legalCases.filter(c => c.assignedTo && c.assignedTo.toString() === user._id.toString() && ['resolved', 'closed'].includes(c.status)).length,
      revenueGenerated: legalCases
        .filter(c => c.assignedTo && c.assignedTo.toString() === user._id.toString())
        .reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0)
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
 * Get debt collection data with user-specific filtering and optimized queries
 * For debt collectors, only show their assigned cases
 */
const getDebtCollectionData = async (lawFirmId, user = null) => {
  // Build match condition based on user role
  let matchCondition = { lawFirm: lawFirmId };
  
  // If user is a debt collector, only show their assigned cases
  if (user && user.role === "debt_collector") {
    matchCondition.assignedTo = user._id;
  }
  
  // If user is an advocate, show escalated cases that are now legal cases assigned to them
  let legalCaseMatchCondition = { lawFirm: lawFirmId };
  if (user && user.role === "advocate") {
    legalCaseMatchCondition.assignedTo = user._id;
  }

  // Convert string IDs to ObjectIds for aggregation
  const matchConditionForAggregation = {
    lawFirm: new mongoose.Types.ObjectId(lawFirmId)
  };
  
  if (user && user.role === "debt_collector") {
    matchConditionForAggregation.assignedTo = new mongoose.Types.ObjectId(user._id);
  }
  
  // For advocates, we need to get legal cases that were escalated from credit cases
  const legalCaseMatchConditionForAggregation = {
    lawFirm: new mongoose.Types.ObjectId(lawFirmId)
  };
  
  if (user && user.role === "advocate") {
    legalCaseMatchConditionForAggregation.assignedTo = new mongoose.Types.ObjectId(user._id);
    legalCaseMatchConditionForAggregation["escalatedFrom.creditCaseId"] = { $exists: true };
  }

  // Use aggregation for better performance
  const [creditCasesAggregation, legalCasesAggregation, users] = await Promise.all([
    CreditCase.aggregate([
      { $match: matchConditionForAggregation },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          collectedCases: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          totalAmountCollected: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, "$debtAmount", 0] }
          },
          outstandingAmount: {
            $sum: { 
              $cond: [
                { $not: { $in: ["$status", ["resolved", "closed"]] } }, 
                "$debtAmount", 
                0
              ] 
            }
          },
          escalatedToLegal: {
            $sum: { $cond: [{ $eq: ["$status", "escalated_to_legal"] }, 1, 0] }
          }
        }
      }
    ]),
    // For advocates, get legal cases that were escalated from credit cases
    user && user.role === "advocate" ? LegalCase.aggregate([
      { $match: legalCaseMatchConditionForAggregation },
      {
        $group: {
          _id: null,
          totalLegalCases: { $sum: 1 },
          resolvedLegalCases: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          totalLegalAmount: {
            $sum: "$filingFee.amount"
          }
        }
      }
    ]) : Promise.resolve([]),
    User.find({ lawFirm: lawFirmId, role: { $in: ['credit_head', 'debt_collector', 'advocate', 'legal_head'] } })
      .select('firstName lastName role')
      .lean()
  ]);

  const creditStats = creditCasesAggregation[0] || {
    totalCases: 0,
    collectedCases: 0,
    totalAmountCollected: 0,
    outstandingAmount: 0,
    escalatedToLegal: 0
  };
  
  const legalStats = legalCasesAggregation[0] || {
    totalLegalCases: 0,
    resolvedLegalCases: 0,
    totalLegalAmount: 0
  };
  
  // Combine stats for advocates
  const stats = user && user.role === "advocate" ? {
    ...creditStats,
    totalLegalCases: legalStats.totalLegalCases,
    resolvedLegalCases: legalStats.resolvedLegalCases,
    totalLegalAmount: legalStats.totalLegalAmount,
    totalCases: creditStats.totalCases + legalStats.totalLegalCases,
    collectedCases: creditStats.collectedCases + legalStats.resolvedLegalCases,
    totalAmountCollected: creditStats.totalAmountCollected + legalStats.totalLegalAmount
  } : creditStats;

  const collectionRate = stats.totalCases > 0 ? 
    Math.round((stats.collectedCases / stats.totalCases) * 100) : 0;

  console.log('🔍 Debt collection stats:', JSON.stringify(stats, null, 2));
  console.log('👤 User info:', user ? `${user.firstName} ${user.lastName} (${user.role})` : 'No user');
  console.log('🏢 Law firm ID:', lawFirmId);
  console.log('🔍 Match condition:', JSON.stringify(matchCondition, null, 2));
  console.log('🔍 Match condition for aggregation:', JSON.stringify(matchConditionForAggregation, null, 2));
  console.log('🔍 Credit cases aggregation result:', JSON.stringify(creditCasesAggregation, null, 2));

  // Get individual cases for more detailed analysis
  const individualCases = await CreditCase.find(matchCondition)
    .populate('assignedTo', 'firstName lastName email')
    .lean();

  console.log('🔍 Individual cases found:', individualCases.length);
  console.log('🔍 Individual cases:', JSON.stringify(individualCases.map(c => ({
    title: c.title,
    status: c.status,
    debtAmount: c.debtAmount,
    assignedTo: c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : 'None'
  })), null, 2));

  const result = {
    totalCreditCases: stats.totalCases,
    collectedCases: stats.collectedCases,
    collectionRate,
    totalAmountCollected: stats.totalAmountCollected,
    outstandingAmount: stats.outstandingAmount,
    escalatedToLegal: stats.escalatedToLegal,
    assignedCases: individualCases, // Include individual cases for frontend
    debtCollectorPerformance: users.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      casesAssigned: individualCases.filter(c => c.assignedTo && c.assignedTo._id.toString() === user._id.toString()).length,
      casesCollected: individualCases.filter(c => c.assignedTo && c.assignedTo._id.toString() === user._id.toString() && ['resolved', 'closed'].includes(c.status)).length,
      amountCollected: individualCases
        .filter(c => c.assignedTo && c.assignedTo._id.toString() === user._id.toString() && ['resolved', 'closed'].includes(c.status))
        .reduce((sum, c) => sum + (c.debtAmount || 0), 0)
    })),
    collectionTrends: {
      monthlyCollections: [10, 12, 8, 15, 11, 13], // Placeholder
      collectionRate: [60, 65, 70, 68, 72, 75] // Placeholder
    },
    paymentAnalysis: {
      onTime: 0, // Placeholder - can be calculated separately if needed
      overdue: 0, // Placeholder - can be calculated separately if needed
      partial: 0 // Placeholder - can be calculated separately if needed
    }
  };

  console.log('📊 Final debt collection result:', JSON.stringify(result, null, 2));
  return result;
};

/**
 * Get Performance Metrics Data
 */
const getPerformanceMetricsData = async (lawFirmId, user = null) => {
  // Build match condition based on user role
  let matchCondition = { lawFirm: lawFirmId };
  
  if (user && user.role === "debt_collector") {
    matchCondition.assignedTo = user._id;
  }

  // Get performance metrics
  const [creditCases, legalCases] = await Promise.all([
    CreditCase.find(matchCondition).lean(),
    LegalCase.find(matchCondition).lean()
  ]);

  const totalCases = creditCases.length + legalCases.length;
  const resolvedCases = creditCases.filter(c => c.status === 'resolved').length + 
                       legalCases.filter(c => c.status === 'resolved').length;
  
  const successRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;
  
  // Calculate average resolution time
  const resolvedCreditCases = creditCases.filter(c => c.status === 'resolved');
  const resolvedLegalCases = legalCases.filter(c => c.status === 'resolved');
  
  const avgResolutionTime = [...resolvedCreditCases, ...resolvedLegalCases]
    .reduce((sum, c) => {
      const resolutionTime = (new Date(c.updatedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
      return sum + resolutionTime;
    }, 0) / Math.max(resolvedCases, 1);

  return {
    successRate,
    avgResolutionTime: Math.round(avgResolutionTime),
    casesPerMonth: Math.round(totalCases / 12), // Assuming 12 months of data
    clientSatisfaction: 85, // Placeholder - can be calculated from feedback
    efficiencyScore: Math.min(100, Math.round(successRate * 1.2)), // Placeholder calculation
    productivityIndex: Math.round(totalCases / Math.max(1, avgResolutionTime)),
    performanceBreakdown: {
      creditCollection: {
        cases: creditCases.length,
        resolved: creditCases.filter(c => c.status === 'resolved').length,
        successRate: creditCases.length > 0 ? Math.round((creditCases.filter(c => c.status === 'resolved').length / creditCases.length) * 100) : 0
      },
      legalServices: {
        cases: legalCases.length,
        resolved: legalCases.filter(c => c.status === 'resolved').length,
        successRate: legalCases.length > 0 ? Math.round((legalCases.filter(c => c.status === 'resolved').length / legalCases.length) * 100) : 0
      }
    },
    efficiencyTrends: {
      monthly: [70, 75, 80, 78, 82, 85, 88, 90, 87, 92, 89, 95], // Placeholder data
      quarterly: [75, 82, 90, 95] // Placeholder data
    }
  };
};

/**
 * Get Monthly Trends Data
 */
const getMonthlyTrendsData = async (lawFirmId, user = null) => {
  // Build match condition based on user role
  let matchCondition = { lawFirm: lawFirmId };
  
  if (user && user.role === "debt_collector") {
    matchCondition.assignedTo = user._id;
  }

  // Get monthly trends for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyTrends = await CreditCase.aggregate([
    { 
      $match: { 
        ...matchCondition,
        createdAt: { $gte: twelveMonthsAgo }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        cases: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
        }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const thisMonthData = monthlyTrends.find(t => t._id.month === currentMonth && t._id.year === currentYear);
  const lastMonthData = monthlyTrends.find(t => t._id.month === lastMonth && t._id.year === lastYear);

  const thisMonthCases = thisMonthData?.cases || 0;
  const lastMonthCases = lastMonthData?.cases || 0;
  const growthRate = lastMonthCases > 0 ? Math.round(((thisMonthCases - lastMonthCases) / lastMonthCases) * 100) : 0;

  // Find peak month
  const peakMonthData = monthlyTrends.reduce((peak, current) => 
    current.cases > peak.cases ? current : peak, { cases: 0 }
  );
  const peakMonth = peakMonthData.cases > 0 ? 
    `${peakMonthData._id.year}-${peakMonthData._id.month.toString().padStart(2, '0')}` : 'N/A';

  const avgMonthly = monthlyTrends.length > 0 ? 
    Math.round(monthlyTrends.reduce((sum, t) => sum + t.cases, 0) / monthlyTrends.length) : 0;

  return {
    thisMonthCases,
    lastMonthCases,
    growthRate,
    peakMonth,
    avgMonthly,
    trendDirection: growthRate > 5 ? 'Growing' : growthRate < -5 ? 'Declining' : 'Stable',
    monthlyData: monthlyTrends.map(t => ({
      month: `${t._id.year}-${t._id.month.toString().padStart(2, '0')}`,
      cases: t.cases,
      resolved: t.resolved
    })),
    seasonalAnalysis: {
      q1: monthlyTrends.filter(t => [1, 2, 3].includes(t._id.month)).reduce((sum, t) => sum + t.cases, 0),
      q2: monthlyTrends.filter(t => [4, 5, 6].includes(t._id.month)).reduce((sum, t) => sum + t.cases, 0),
      q3: monthlyTrends.filter(t => [7, 8, 9].includes(t._id.month)).reduce((sum, t) => sum + t.cases, 0),
      q4: monthlyTrends.filter(t => [10, 11, 12].includes(t._id.month)).reduce((sum, t) => sum + t.cases, 0)
    }
  };
};

/**
 * Get Promised Payments Data
 */
const getPromisedPaymentsData = async (lawFirmId, user = null) => {
  // Build match condition based on user role
  let matchCondition = { lawFirm: lawFirmId };
  
  if (user && user.role === "debt_collector") {
    matchCondition.assignedTo = user._id;
  }

  // Get credit cases with promised payments
  const creditCases = await CreditCase.find(matchCondition).lean();

  let totalPromisedAmount = 0;
  let totalPaidAmount = 0;
  let totalPendingAmount = 0;
  let totalOverdueAmount = 0;
  let totalPromisedCount = 0;
  let totalPaidCount = 0;
  let totalPendingCount = 0;
  let totalOverdueCount = 0;

  creditCases.forEach(case_ => {
    if (case_.promisedPayments && case_.promisedPayments.length > 0) {
      case_.promisedPayments.forEach(payment => {
        totalPromisedAmount += payment.amount || 0;
        totalPromisedCount++;

        if (payment.status === 'paid') {
          totalPaidAmount += payment.amount || 0;
          totalPaidCount++;
        } else if (payment.status === 'pending') {
          totalPendingAmount += payment.amount || 0;
          totalPendingCount++;
          
          // Check if overdue
          if (payment.promisedDate && new Date(payment.promisedDate) < new Date()) {
            totalOverdueAmount += payment.amount || 0;
            totalOverdueCount++;
          }
        }
      });
    }
  });

  const paymentRate = totalPromisedCount > 0 ? Math.round((totalPaidCount / totalPromisedCount) * 100) : 0;
  const overdueRate = totalPromisedCount > 0 ? Math.round((totalOverdueCount / totalPromisedCount) * 100) : 0;

  return {
    totalPromisedAmount,
    totalPaidAmount,
    totalPendingAmount,
    totalOverdueAmount,
    paymentRate,
    overdueRate,
    paymentBreakdown: {
      byStatus: {
        paid: { amount: totalPaidAmount, count: totalPaidCount },
        pending: { amount: totalPendingAmount, count: totalPendingCount },
        overdue: { amount: totalOverdueAmount, count: totalOverdueCount }
      }
    },
    paymentTrends: {
      monthly: [10, 12, 8, 15, 11, 13, 9, 14, 12, 16, 10, 18], // Placeholder data
      amounts: [50000, 60000, 40000, 75000, 55000, 65000, 45000, 70000, 60000, 80000, 50000, 90000] // Placeholder data
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
 * Debug endpoint to show raw database data
 */
export const debugDatabaseData = async (req, res) => {
  try {
    const { lawFirmId } = req.params;

    console.log("🔍 Debug: Fetching raw database data for law firm:", lawFirmId);

    // Get all law firms first
    const allLawFirms = await LawFirm.find({}).select('_id firmName').lean();
    console.log("All law firms in database:", allLawFirms);

    // Validate law firm ID
    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
        availableLawFirms: allLawFirms
      });
    }

    // Get law firm details
    const lawFirm = await LawFirm.findById(lawFirmId);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
        availableLawFirms: allLawFirms
      });
    }

    // Get all raw data
    const [users, departments, creditCases, legalCases] = await Promise.all([
      User.find({ lawFirm: lawFirmId }).lean(),
      Department.find({ lawFirm: lawFirmId }).lean(),
      CreditCase.find({ lawFirm: lawFirmId }).lean(),
      LegalCase.find({ lawFirm: lawFirmId }).lean()
    ]);

    // Get case status breakdowns
    const creditStatuses = await CreditCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const legalStatuses = await LegalCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const userRoles = await User.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const debugData = {
      lawFirm: {
        _id: lawFirm._id,
        firmName: lawFirm.firmName
      },
      allLawFirms,
      rawCounts: {
        users: users.length,
        departments: departments.length,
        creditCases: creditCases.length,
        legalCases: legalCases.length
      },
      creditCaseStatuses: creditStatuses,
      legalCaseStatuses: legalStatuses,
      userRoles,
      recentCases: {
        credit: creditCases
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(c => ({
            _id: c._id,
            title: c.title,
            status: c.status,
            createdAt: c.createdAt,
            assignedTo: c.assignedTo
          })),
        legal: legalCases
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(c => ({
            _id: c._id,
            title: c.title,
            status: c.status,
            createdAt: c.createdAt,
            assignedTo: c.assignedTo
          }))
      },
      users: users.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        department: u.department
      })),
      departments: departments.map(d => ({
        _id: d._id,
        name: d.name,
        departmentType: d.departmentType
      }))
    };

    console.log("🔍 Debug data compiled successfully");

    res.json({
      success: true,
      message: "Database debug data retrieved successfully",
      data: debugData
    });

  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve debug data",
      error: error.message
    });
  }
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
