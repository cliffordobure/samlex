import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import LawFirm from "../models/LawFirm.js";
import { validateObjectId } from "../middleware/validation.js";
import { ProfessionalPDFGenerator, createOverviewData, createStatsCards } from "../utils/professionalPDFGenerator.js";

/**
 * @desc    Generate professional overview PDF report
 * @route   GET /api/reports/professional-pdf/:lawFirmId
 * @access  Private (law_firm_admin, system_owner)
 */
export const generateProfessionalOverviewPDF = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { reportType = "overview" } = req.query;

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

    // Get comprehensive data
    const reportData = await getComprehensiveLawFirmData(lawFirmId);

    // Create PDF generator
    const pdfGenerator = new ProfessionalPDFGenerator();
    const doc = pdfGenerator.createDocument();

    // Add professional header
    await pdfGenerator.addProfessionalHeader(
      lawFirm, 
      "Comprehensive Law Firm Report", 
      reportType
    );

    // Add overview section
    pdfGenerator.addSectionHeader(
      "Executive Summary", 
      "Key performance indicators and business metrics"
    );

    // Create and add stats cards
    const overviewData = createOverviewData(reportData);
    const statsCards = createStatsCards(overviewData);
    pdfGenerator.addStatsCards(statsCards);

    // Add department performance section
    if (reportData.departments && reportData.departments.length > 0) {
      pdfGenerator.addSectionHeader(
        "Department Performance",
        "Performance metrics by department"
      );

      const departmentData = reportData.departments.map(dept => [
        dept.name,
        dept.departmentType.replace('_', ' ').toUpperCase(),
        dept.memberCount || 0,
        dept.caseCount || 0,
        dept.resolvedCases || 0,
        dept.completionRate || 0 + '%'
      ]);

      pdfGenerator.addTable(
        ["Department", "Type", "Members", "Total Cases", "Resolved", "Completion Rate"],
        departmentData
      );
    }

    // Add recent activity section
    if (reportData.recentActivity && reportData.recentActivity.length > 0) {
      pdfGenerator.addSectionHeader(
        "Recent Activity",
        "Latest case updates and system activities"
      );

      const activityData = reportData.recentActivity.slice(0, 10).map(activity => [
        activity.date,
        activity.type,
        activity.description,
        activity.status || 'N/A'
      ]);

      pdfGenerator.addTable(
        ["Date", "Type", "Description", "Status"],
        activityData
      );
    }

    // Add top performers section
    if (reportData.topPerformers && reportData.topPerformers.length > 0) {
      pdfGenerator.addSectionHeader(
        "Top Performers",
        "Team members with highest case resolution rates"
      );

      const performersData = reportData.topPerformers.map(performer => [
        performer.name,
        performer.role,
        performer.resolvedCases || 0,
        performer.totalCases || 0,
        (performer.resolutionRate || 0) + '%'
      ]);

      pdfGenerator.addTable(
        ["Name", "Role", "Resolved Cases", "Total Cases", "Success Rate"],
        performersData
      );
    }

    // Add footer
    pdfGenerator.addFooter();

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${lawFirm.firmName.replace(/\s+/g, '_')}_Report_${timestamp}.pdf`;

    // Generate and send PDF
    pdfGenerator.generatePDF(res, filename);

  } catch (error) {
    console.error("❌ Error generating professional PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate professional PDF report",
      error: error.message
    });
  }
};

/**
 * @desc    Generate professional department-specific PDF report
 * @route   GET /api/reports/professional-pdf/:lawFirmId/department/:departmentId
 * @access  Private (law_firm_admin, department_head)
 */
export const generateProfessionalDepartmentPDF = async (req, res) => {
  try {
    const { lawFirmId, departmentId } = req.params;

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

    // Get department-specific data
    const departmentData = await getDepartmentSpecificData(lawFirmId, departmentId);

    // Create PDF generator
    const pdfGenerator = new ProfessionalPDFGenerator();
    const doc = pdfGenerator.createDocument();

    // Add professional header
    await pdfGenerator.addProfessionalHeader(
      lawFirm,
      `${department.name} Department Report`,
      "department"
    );

    // Add department overview
    pdfGenerator.addSectionHeader(
      "Department Overview",
      `Performance metrics for ${department.name} department`
    );

    const departmentStats = [
      {
        label: "Department Members",
        value: departmentData.memberCount || 0,
        color: "#3b82f6",
        bgColor: "#dbeafe",
        borderColor: "#3b82f6",
        icon: "👥"
      },
      {
        label: "Total Cases",
        value: departmentData.totalCases || 0,
        color: "#8b5cf6",
        bgColor: "#e9d5ff",
        borderColor: "#8b5cf6",
        icon: "📋"
      },
      {
        label: "Resolved Cases",
        value: departmentData.resolvedCases || 0,
        color: "#10b981",
        bgColor: "#d1fae5",
        borderColor: "#10b981",
        icon: "✅"
      },
      {
        label: "Pending Cases",
        value: departmentData.pendingCases || 0,
        color: "#f59e0b",
        bgColor: "#fef3c7",
        borderColor: "#f59e0b",
        icon: "⏳"
      }
    ];

    pdfGenerator.addStatsCards(departmentStats);

    // Add case details if available
    if (departmentData.cases && departmentData.cases.length > 0) {
      pdfGenerator.addSectionHeader(
        "Case Details",
        "Detailed breakdown of department cases"
      );

      const casesData = departmentData.cases.slice(0, 20).map(caseItem => [
        caseItem.caseNumber || 'N/A',
        caseItem.title || 'N/A',
        caseItem.status || 'N/A',
        caseItem.priority || 'N/A',
        caseItem.assignedTo || 'Unassigned',
        new Date(caseItem.createdAt).toLocaleDateString()
      ]);

      pdfGenerator.addTable(
        ["Case #", "Title", "Status", "Priority", "Assigned To", "Created"],
        casesData
      );
    }

    // Add member performance if available
    if (departmentData.members && departmentData.members.length > 0) {
      pdfGenerator.addSectionHeader(
        "Team Performance",
        "Individual performance metrics for department members"
      );

      const membersData = departmentData.members.map(member => [
        `${member.firstName} ${member.lastName}`,
        member.role || 'N/A',
        member.assignedCases || 0,
        member.resolvedCases || 0,
        (member.resolutionRate || 0) + '%'
      ]);

      pdfGenerator.addTable(
        ["Name", "Role", "Assigned Cases", "Resolved Cases", "Success Rate"],
        membersData
      );
    }

    // Add footer
    pdfGenerator.addFooter();

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${lawFirm.firmName.replace(/\s+/g, '_')}_${department.name.replace(/\s+/g, '_')}_Report_${timestamp}.pdf`;

    // Generate and send PDF
    pdfGenerator.generatePDF(res, filename);

  } catch (error) {
    console.error("❌ Error generating department PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate department PDF report",
      error: error.message
    });
  }
};

/**
 * Helper function to get comprehensive law firm data
 */
const getComprehensiveLawFirmData = async (lawFirmId) => {
  try {
    // Get basic counts
    const [users, departments, creditCases, legalCases] = await Promise.all([
      User.find({ lawFirm: lawFirmId }),
      Department.find({ lawFirm: lawFirmId }),
      CreditCase.find({ lawFirm: lawFirmId }),
      LegalCase.find({ lawFirm: lawFirmId })
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
        ...dept.toObject(),
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

    return {
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

/**
 * Helper function to get department-specific data
 */
const getDepartmentSpecificData = async (lawFirmId, departmentId) => {
  try {
    // Get department details
    const department = await Department.findById(departmentId);
    if (!department) return {};

    // Get department users
    const members = await User.find({ 
      lawFirm: lawFirmId, 
      department: departmentId 
    });

    // Get department cases
    const [creditCases, legalCases] = await Promise.all([
      CreditCase.find({ lawFirm: lawFirmId, department: departmentId }),
      LegalCase.find({ lawFirm: lawFirmId, department: departmentId })
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
        ...member.toObject(),
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
    console.error("Error getting department data:", error);
    return {};
  }
};
