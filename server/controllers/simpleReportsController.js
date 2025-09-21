import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import LawFirm from "../models/LawFirm.js";
import { validateObjectId } from "../middleware/validation.js";
import { simplePDFGenerator } from "../utils/simplePDFGenerator.js";

/**
 * @desc    Generate simple professional HTML report - NO ENCODING ISSUES
 * @route   GET /api/reports/simple-pdf/:lawFirmId
 * @access  Private (law_firm_admin, system_owner)
 */
export const generateSimpleProfessionalPDF = async (req, res) => {
  try {
    const { lawFirmId } = req.params;

    console.log("Generating SIMPLE professional report for law firm:", lawFirmId);

    // Validate law firm ID
    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format"
      });
    }

    // Check authorization
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

    // Get comprehensive data
    const reportData = await getComprehensiveLawFirmData(lawFirmId);
    console.log("Report data compiled:", {
      totalUsers: reportData.totalUsers,
      totalCreditCases: reportData.totalCreditCases,
      totalLegalCases: reportData.totalLegalCases,
      departments: reportData.departments.length
    });

    // Generate simple professional HTML report
    const htmlContent = await simplePDFGenerator.generateLawFirmReport(lawFirm, reportData);

    console.log("SIMPLE HTML report generated successfully, length:", htmlContent.length, "characters");

    // Set response headers for HTML
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${lawFirm.firmName.replace(/\s+/g, '_')}_Simple_Report.html"`);

    // Send HTML content
    res.send(htmlContent);

  } catch (error) {
    console.error("Error generating simple professional report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate simple professional report",
      error: error.message
    });
  }
};

/**
 * Helper function to get comprehensive law firm data
 */
const getComprehensiveLawFirmData = async (lawFirmId) => {
  try {
    console.log("Fetching comprehensive law firm data...");

    // Get basic counts with proper error handling
    const [users, departments, creditCases, legalCases] = await Promise.all([
      User.find({ lawFirm: lawFirmId }).lean(),
      Department.find({ lawFirm: lawFirmId }).lean(),
      CreditCase.find({ lawFirm: lawFirmId }).lean(),
      LegalCase.find({ lawFirm: lawFirmId }).lean()
    ]);

    console.log("Data fetched:", {
      users: users.length,
      departments: departments.length,
      creditCases: creditCases.length,
      legalCases: legalCases.length
    });

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

    const result = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalDepartments: departments.length,
      totalCreditCases: creditCases.length,
      totalLegalCases: legalCases.length,
      escalatedCases: creditCases.filter(c => c.status === 'escalated_to_legal').length,
      pendingCases: allCases.filter(c => ['new', 'pending_assignment'].includes(c.status)).length,
      resolvedCases: allCases.filter(c => ['resolved', 'closed'].includes(c.status)).length,
      departments: departmentPerformance,
      recentActivity,
      topPerformers
    };

    console.log("Comprehensive data compiled successfully");
    return result;

  } catch (error) {
    console.error("Error getting comprehensive law firm data:", error);
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
  }
};
