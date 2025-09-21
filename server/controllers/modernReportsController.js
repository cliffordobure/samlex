import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import LawFirm from "../models/LawFirm.js";
import { validateObjectId } from "../middleware/validation.js";
import { modernPDFGenerator } from "../utils/modernPDFGenerator.js";

/**
 * @desc    Generate modern professional PDF report using HTML-to-PDF
 * @route   GET /api/reports/modern-pdf/:lawFirmId
 * @access  Private (law_firm_admin, system_owner)
 */
export const generateModernProfessionalPDF = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { reportType = "overview" } = req.query;

    console.log("🚀 Generating modern professional PDF for law firm:", lawFirmId);

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

    console.log("📊 Law firm found:", lawFirm.firmName);

    // Get comprehensive data
    const reportData = await getComprehensiveLawFirmData(lawFirmId);
    console.log("📈 Report data compiled:", {
      totalUsers: reportData.totalUsers,
      totalCreditCases: reportData.totalCreditCases,
      totalLegalCases: reportData.totalLegalCases,
      departments: reportData.departments.length
    });

    // Generate modern professional PDF
    const pdfBuffer = await modernPDFGenerator.generateLawFirmReport(
      lawFirm, 
      reportData, 
      reportType
    );

    console.log("✅ PDF generated successfully, size:", pdfBuffer.length, "bytes");

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${lawFirm.firmName.replace(/\s+/g, '_')}_Professional_Report_${timestamp}.pdf`;
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ Error generating modern professional PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate modern professional PDF report",
      error: error.message
    });
  }
};

/**
 * @desc    Generate modern department-specific PDF report
 * @route   GET /api/reports/modern-pdf/:lawFirmId/department/:departmentId
 * @access  Private (law_firm_admin, department_head, system_owner)
 */
export const generateModernDepartmentPDF = async (req, res) => {
  try {
    const { lawFirmId, departmentId } = req.params;

    console.log("🏢 Generating modern department PDF:", { lawFirmId, departmentId });

    // Validate IDs
    if (!validateObjectId(lawFirmId) || !validateObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
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

    // Get law firm and department details
    const [lawFirm, department] = await Promise.all([
      LawFirm.findById(lawFirmId),
      Department.findById(departmentId)
    ]);

    if (!lawFirm || !department) {
      return res.status(404).json({
        success: false,
        message: "Law firm or department not found"
      });
    }

    console.log("📊 Generating report for:", department.name);

    // Get department-specific data
    const departmentData = await getDepartmentSpecificData(lawFirmId, departmentId);

    // Create department-specific report data
    const reportData = {
      ...departmentData,
      departmentName: department.name,
      departmentType: department.departmentType,
      isDepartmentReport: true
    };

    // Generate modern professional PDF
    const pdfBuffer = await modernPDFGenerator.generateLawFirmReport(
      lawFirm,
      reportData,
      "department"
    );

    console.log("✅ Department PDF generated successfully");

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${lawFirm.firmName.replace(/\s+/g, '_')}_${department.name.replace(/\s+/g, '_')}_Report_${timestamp}.pdf`;
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ Error generating modern department PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate modern department PDF report",
      error: error.message
    });
  }
};

/**
 * @desc    Generate executive summary PDF for stakeholders
 * @route   GET /api/reports/modern-pdf/:lawFirmId/executive
 * @access  Private (law_firm_admin, system_owner)
 */
export const generateExecutiveSummaryPDF = async (req, res) => {
  try {
    const { lawFirmId } = req.params;

    console.log("👔 Generating executive summary PDF for law firm:", lawFirmId);

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

    // Get executive-level data
    const executiveData = await getExecutiveLevelData(lawFirmId);

    // Generate executive summary PDF
    const pdfBuffer = await modernPDFGenerator.generateLawFirmReport(
      lawFirm,
      executiveData,
      "executive"
    );

    console.log("✅ Executive summary PDF generated successfully");

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${lawFirm.firmName.replace(/\s+/g, '_')}_Executive_Summary_${timestamp}.pdf`;
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ Error generating executive summary PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate executive summary PDF",
      error: error.message
    });
  }
};

/**
 * Helper function to get comprehensive law firm data
 */
const getComprehensiveLawFirmData = async (lawFirmId) => {
  try {
    console.log("📊 Fetching comprehensive law firm data...");

    // Get basic counts with proper error handling
    const [users, departments, creditCases, legalCases] = await Promise.all([
      User.find({ lawFirm: lawFirmId }).lean(),
      Department.find({ lawFirm: lawFirmId }).lean(),
      CreditCase.find({ lawFirm: lawFirmId }).lean(),
      LegalCase.find({ lawFirm: lawFirmId }).lean()
    ]);

    console.log("📈 Data fetched:", {
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

    console.log("✅ Comprehensive data compiled successfully");
    return result;

  } catch (error) {
    console.error("❌ Error getting comprehensive law firm data:", error);
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

/**
 * Helper function to get department-specific data
 */
const getDepartmentSpecificData = async (lawFirmId, departmentId) => {
  try {
    console.log("🏢 Fetching department-specific data...");

    // Get department details
    const department = await Department.findById(departmentId).lean();
    if (!department) return {};

    // Get department users
    const members = await User.find({ 
      lawFirm: lawFirmId, 
      department: departmentId 
    }).lean();

    // Get department cases
    const [creditCases, legalCases] = await Promise.all([
      CreditCase.find({ lawFirm: lawFirmId, department: departmentId }).lean(),
      LegalCase.find({ lawFirm: lawFirmId, department: departmentId }).lean()
    ]);

    const allCases = [...creditCases, ...legalCases];

    // Calculate member performance
    const memberPerformance = members.map(member => {
      const assignedCases = allCases.filter(c => 
        c.assignedTo && c.assignedTo.toString() === member._id.toString()
      );
      
      const resolvedCases = assignedCases.filter(c => 
        ['resolved', 'closed'].includes(c.status)
      );

      const resolutionRate = assignedCases.length > 0 ? 
        (resolvedCases.length / assignedCases.length) * 100 : 0;

      return {
        ...member,
        assignedCases: assignedCases.length,
        resolvedCases: resolvedCases.length,
        resolutionRate: Math.round(resolutionRate * 100) / 100
      };
    });

    return {
      memberCount: members.length,
      totalCases: allCases.length,
      resolvedCases: allCases.filter(c => ['resolved', 'closed'].includes(c.status)).length,
      pendingCases: allCases.filter(c => ['new', 'pending_assignment'].includes(c.status)).length,
      cases: allCases.slice(0, 50), // Limit to first 50 cases
      members: memberPerformance
    };

  } catch (error) {
    console.error("❌ Error getting department data:", error);
    return {};
  }
};

/**
 * Helper function to get executive-level data
 */
const getExecutiveLevelData = async (lawFirmId) => {
  try {
    console.log("👔 Fetching executive-level data...");

    const comprehensiveData = await getComprehensiveLawFirmData(lawFirmId);
    
    // Add executive-specific metrics
    return {
      ...comprehensiveData,
      executiveMetrics: {
        totalRevenue: 0, // This would come from payment data
        averageCaseResolutionTime: 0, // This would be calculated
        clientSatisfactionScore: 0, // This would come from feedback
        growthRate: 0 // This would be calculated from historical data
      }
    };

  } catch (error) {
    console.error("❌ Error getting executive data:", error);
    return await getComprehensiveLawFirmData(lawFirmId);
  }
};
