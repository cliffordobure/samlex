import express from "express";
import {
  getCaseStatistics,
  getUserActivity,
  getDepartmentPerformance,
  getRevenueAnalytics,
  getDashboardAnalytics,
  getCreditCollectionSummary,
  downloadCreditCasesCSV,
  getDebtCollectorStats,
  getDebtCollectorStatsById,
  getLawFirmAdminDashboard,
  downloadCreditCasesPDF,
  getAdminOwnCases,
  getLegalPerformance,
  getDebtCollectionPerformance,
  getEnhancedRevenueAnalytics,
  downloadComprehensivePDF,
  downloadComprehensiveExcel,
  getCreditCollectionPerformance,
  getCreditCollectionRevenue,
  getPromisedPaymentsAnalytics,
  getComprehensiveCreditCollectionSummary,
  getEnhancedCreditCollectionPerformance,
  getEnhancedCreditCollectionRevenue,
  getEnhancedPromisedPaymentsAnalytics,
  downloadCreditCollectionCSV,
  downloadCreditCollectionPDF,
  getAccountantDashboard,
} from "../controllers/reportsController.js";
import LegalCase from "../models/LegalCase.js";
import {
  generateProfessionalOverviewPDF,
  generateProfessionalDepartmentPDF,
} from "../controllers/professionalReportsController.js";
import {
  generateModernProfessionalPDF,
  generateModernDepartmentPDF,
  generateExecutiveSummaryPDF,
} from "../controllers/modernReportsController.js";
import {
  generateCleanProfessionalPDF,
} from "../controllers/cleanReportsController.js";
import {
  generateSimpleProfessionalPDF,
} from "../controllers/simpleReportsController.js";
import {
  generateSpecializedReport,
  debugDatabaseData,
} from "../controllers/specializedReportsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Per-route authorization
router.get(
  "/case-statistics/:lawFirmId",
  authorize("law_firm_admin", "debt_collector", "system_owner"),
  getCaseStatistics
);
router.get(
  "/user-activity/:lawFirmId",
  authorize("law_firm_admin"),
  getUserActivity
);
router.get(
  "/department-performance/:lawFirmId",
  authorize("law_firm_admin", "accountant"),
  getDepartmentPerformance
);
router.get(
  "/revenue-analytics/:lawFirmId",
  authorize("law_firm_admin", "accountant"),
  getRevenueAnalytics
);
router.get(
  "/dashboard/:lawFirmId",
  authorize("law_firm_admin"),
  getDashboardAnalytics
);
router.get(
  "/law-firm-admin-dashboard/:lawFirmId",
  authorize("law_firm_admin"),
  getLawFirmAdminDashboard
);

// New admin-specific reports
router.get(
  "/admin-own-cases",
  authorize("admin", "law_firm_admin"),
  getAdminOwnCases
);
router.get(
  "/legal-performance/:lawFirmId",
  authorize("admin", "law_firm_admin", "legal_head", "advocate"),
  getLegalPerformance
);
router.get(
  "/debt-collection-performance/:lawFirmId",
  authorize("admin", "law_firm_admin", "credit_head"),
  getDebtCollectionPerformance
);
router.get(
  "/enhanced-revenue/:lawFirmId",
  authorize("admin", "law_firm_admin"),
  getEnhancedRevenueAnalytics
);

// Download reports with law firm branding
router.get(
  "/download-pdf/:lawFirmId",
  authorize("admin", "law_firm_admin", "legal_head", "advocate"),
  downloadComprehensivePDF
);
router.get(
  "/download-excel/:lawFirmId",
  authorize("admin", "law_firm_admin", "legal_head", "advocate"),
  downloadComprehensiveExcel
);

// Professional PDF reports - NEW HIGH-QUALITY REPORTS
router.get(
  "/professional-pdf/:lawFirmId",
  authorize("law_firm_admin", "system_owner"),
  generateProfessionalOverviewPDF
);
router.get(
  "/professional-pdf/:lawFirmId/department/:departmentId",
  authorize("law_firm_admin", "credit_head", "legal_head", "system_owner"),
  generateProfessionalDepartmentPDF
);

// MODERN PROFESSIONAL PDF REPORTS - ULTIMATE QUALITY
router.get(
  "/modern-pdf/:lawFirmId",
  authorize("law_firm_admin", "system_owner"),
  generateModernProfessionalPDF
);
router.get(
  "/modern-pdf/:lawFirmId/department/:departmentId",
  authorize("law_firm_admin", "credit_head", "legal_head", "system_owner"),
  generateModernDepartmentPDF
);
router.get(
  "/modern-pdf/:lawFirmId/executive",
  authorize("law_firm_admin", "system_owner"),
  generateExecutiveSummaryPDF
);

// CLEAN PROFESSIONAL PDF REPORTS - NO ENCODING ISSUES
router.get(
  "/clean-pdf/:lawFirmId",
  authorize("law_firm_admin", "system_owner"),
  generateCleanProfessionalPDF
);

// SIMPLE PROFESSIONAL HTML REPORTS - ABSOLUTELY NO ENCODING ISSUES
router.get(
  "/simple-pdf/:lawFirmId",
  authorize("law_firm_admin", "system_owner"),
  generateSimpleProfessionalPDF
);

// SPECIALIZED PROFESSIONAL HTML REPORTS - DIFFERENT REPORTS FOR DIFFERENT SECTIONS
router.get(
  "/specialized/:lawFirmId/:reportType",
  protect,
  generateSpecializedReport
);

// DEBUG ENDPOINT - Show raw database data
router.get(
  "/debug/:lawFirmId",
  protect,
  debugDatabaseData
);

// DEBUG: Manual revenue check endpoint
router.get(
  "/debug-revenue/:lawFirmId",
  protect,
  async (req, res) => {
    try {
      const { lawFirmId } = req.params;
      
      // Get all legal cases
      const legalCases = await LegalCase.find({ lawFirm: lawFirmId }).lean();
      console.log("=== DEBUG REVENUE CHECK ===");
      console.log("Law Firm ID:", lawFirmId);
      console.log("Total Legal Cases:", legalCases.length);
      
      const casesWithFilingFees = legalCases.filter(c => c.filingFee);
      console.log("Cases with Filing Fees:", casesWithFilingFees.length);
      
      const paidFilingFeeCases = casesWithFilingFees.filter(c => c.filingFee.paid === true);
      console.log("Cases with Paid Filing Fees:", paidFilingFeeCases.length);
      
      paidFilingFeeCases.forEach((caseItem, index) => {
        console.log(`Case ${index + 1}:`, {
          title: caseItem.title,
          caseNumber: caseItem.caseNumber,
          filingFeeAmount: caseItem.filingFee.amount,
          filingFeePaid: caseItem.filingFee.paid,
          filingFeePaidAt: caseItem.filingFee.paidAt
        });
      });
      
      const totalFilingFees = paidFilingFeeCases.reduce((sum, c) => sum + (c.filingFee.amount || 0), 0);
      console.log("Total Filing Fees:", totalFilingFees);
      console.log("=========================");
      
      res.json({
        success: true,
        data: {
          lawFirmId,
          totalLegalCases: legalCases.length,
          casesWithFilingFees: casesWithFilingFees.length,
          paidFilingFeeCases: paidFilingFeeCases.length,
          totalFilingFees,
          paidCases: paidFilingFeeCases.map(c => ({
            title: c.title,
            caseNumber: c.caseNumber,
            filingFeeAmount: c.filingFee.amount,
            filingFeePaid: c.filingFee.paid
          }))
        }
      });
    } catch (error) {
      console.error("Error in debug revenue check:", error);
      res.status(500).json({
        success: false,
        message: "Error checking revenue",
        error: error.message
      });
    }
  }
);

// Allow credit_head, law_firm_admin, and system_owner for these:
router.get(
  "/credit-collection/summary",
  authorize("law_firm_admin", "credit_head", "system_owner", "debt_collector"),
  getCreditCollectionSummary
);

router.get(
  "/credit-collection/cases-csv",
  authorize("law_firm_admin", "credit_head", "system_owner", "debt_collector"),
  downloadCreditCasesCSV
);

router.get(
  "/credit-collection/cases-pdf",
  authorize("law_firm_admin", "credit_head", "system_owner", "debt_collector"),
  downloadCreditCasesPDF
);

// Enhanced credit collection reports
router.get(
  "/credit-collection/debt-collector-stats",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getDebtCollectorStats
);

router.get(
  "/credit-collection/performance/:lawFirmId",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getCreditCollectionPerformance
);

router.get(
  "/credit-collection/revenue/:lawFirmId",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getCreditCollectionRevenue
);

router.get(
  "/credit-collection/promised-payments/:lawFirmId",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getPromisedPaymentsAnalytics
);

// Enhanced credit collection reports with real statistics
router.get(
  "/credit-collection/comprehensive-summary",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getComprehensiveCreditCollectionSummary
);

router.get(
  "/credit-collection/enhanced-performance/:lawFirmId",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getEnhancedCreditCollectionPerformance
);

router.get(
  "/credit-collection/enhanced-revenue/:lawFirmId",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getEnhancedCreditCollectionRevenue
);

router.get(
  "/credit-collection/enhanced-promised-payments/:lawFirmId",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getEnhancedPromisedPaymentsAnalytics
);

router.get(
  "/credit-collection/download-csv",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  downloadCreditCollectionCSV
);

router.get(
  "/credit-collection/download-pdf",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  downloadCreditCollectionPDF
);

// Debt collector stats endpoint
router.get(
  "/debt-collector/stats",
  authorize("debt_collector", "law_firm_admin", "credit_head"),
  getDebtCollectorStats
);

// Debt collector stats by ID endpoint
router.get(
  "/debt-collector/:debtCollectorId/stats",
  authorize("debt_collector", "law_firm_admin", "credit_head"),
  getDebtCollectorStatsById
);

// Accountant dashboard endpoint
router.get(
  "/accountant-dashboard/:lawFirmId",
  authorize("accountant", "law_firm_admin"),
  getAccountantDashboard
);

export default router;
